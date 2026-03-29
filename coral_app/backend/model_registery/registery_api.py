"""
CORAL — Transcription Registry & Fanout
----------------------------------------
Endpoints:
  GET  /models          — list live models
  POST /register        — Kaggle notebook registers itself
  POST /ping            — Kaggle notebook heartbeat
  POST /transcribe      — frontend requests transcription

Auth:
  /register and /ping require header:  X-Registry-Token: <REGISTRY_SECRET>
  /transcribe requires header:         X-API-Token: <API_SECRET>

Env vars (put in .env):
  REGISTRY_SECRET   — shared secret with Kaggle notebooks
  API_SECRET        — shared secret with frontend
  EVICT_AFTER_SEC   — seconds before a silent model is evicted (default 300)
  MAX_AUDIO_MB      — max upload size in MB (default 25)
  ALLOWED_HOSTS     — comma-separated ngrok domain allowlist e.g. "ngrok-free.app,ngrok.io"
"""
import sys, os
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

import asyncio
import logging
import time
from contextlib import asynccontextmanager

import httpx
from dotenv import load_dotenv
from fastapi import (Depends, FastAPI, File, Form, HTTPException, Security, UploadFile)
from fastapi.security.api_key import APIKeyHeader
from pydantic import BaseModel, validator

load_dotenv()
logging.basicConfig(level=logging.INFO)
log = logging.getLogger("coral")

# ── Config ────────────────────────────────────────────────────────────────────

REGISTRY_SECRET = os.getenv("REGISTRY_SECRET", "change-me-registry")
API_SECRET      = os.getenv("API_SECRET",       "change-me-api")
EVICT_AFTER_SEC = int(os.getenv("EVICT_AFTER_SEC", "300"))
MAX_AUDIO_MB    = int(os.getenv("MAX_AUDIO_MB",    "25"))
PING_SWEEP_SEC  = 15
ALLOWED_HOSTS   = [h.strip() for h in os.getenv("ALLOWED_HOSTS", "ngrok-free.app,ngrok.io").split(",")]

# ── Registry ──────────────────────────────────────────────────────────────────

class ModelEntry(BaseModel):
    name:       str
    endpoint:   str
    last_ping:  float
    session_id: str

registry:      dict[str, ModelEntry] = {}
registry_lock: asyncio.Lock          = None  # initialised in lifespan

# ── Auth ──────────────────────────────────────────────────────────────────────

registry_header = APIKeyHeader(name="X-Registry-Token", auto_error=False)
api_header      = APIKeyHeader(name="X-API-Token",      auto_error=False)

def require_registry_token(token: str = Security(registry_header)):
    if token != REGISTRY_SECRET:
        raise HTTPException(status_code=403, detail="Invalid registry token")

def require_api_token(token: str = Security(api_header)):
    if token != API_SECRET:
        raise HTTPException(status_code=403, detail="Invalid API token")

# ── Eviction sweep ────────────────────────────────────────────────────────────

async def eviction_sweep():
    while True:
        await asyncio.sleep(PING_SWEEP_SEC)
        now    = time.time()
        cutoff = now - EVICT_AFTER_SEC
        async with registry_lock:
            evicted = [name for name, e in registry.items() if e.last_ping < cutoff]
            for name in evicted:
                del registry[name]
                log.info(f"Evicted model: {name}")

# ── App ───────────────────────────────────────────────────────────────────────

app = FastAPI(title="CORAL Registry")

# ── Schemas ───────────────────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    name:       str
    endpoint:   str
    session_id: str

    @validator("endpoint")
    @classmethod
    def validate_endpoint(cls, v: str) -> str:
        if not v.startswith("https://"):
            raise ValueError("endpoint must be HTTPS")
        host = v.split("/")[2]
        if not any(host.endswith(h) for h in ALLOWED_HOSTS):
            raise ValueError(f"endpoint host not in allowlist: {host}")
        return v

    @validator("name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        if not v.strip() or len(v) > 64:
            raise ValueError("name must be 1–64 chars")
        return v.strip()

class PingRequest(BaseModel):
    name:       str
    session_id: str

class ModelInfo(BaseModel):
    name:          str
    session_id:    str
    last_ping_ago: float  # seconds since last ping

# ── Endpoints ─────────────────────────────────────────────────────────────────

@app.get("/models", response_model=list[ModelInfo])
async def list_models():
    now = time.time()
    async with registry_lock:
        return [
            ModelInfo(
                name=e.name,
                session_id=e.session_id,
                last_ping_ago=round(now - e.last_ping, 1),
            )
            for e in registry.values()
        ]

@app.post("/register", dependencies=[Depends(require_registry_token)])
async def register_model(req: RegisterRequest):
    async with registry_lock:
        registry[req.name] = ModelEntry(
            name=req.name,
            endpoint=req.endpoint,
            last_ping=time.time(),
            session_id=req.session_id,
        )
    log.info(f"Registered: {req.name} @ {req.endpoint} (session={req.session_id})")
    return {"status": "registered", "name": req.name}

@app.post("/ping", dependencies=[Depends(require_registry_token)])
async def ping(req: PingRequest):
    async with registry_lock:
        entry = registry.get(req.name)
        if not entry:
            raise HTTPException(status_code=404, detail="Model not registered")
        if entry.session_id != req.session_id:
            raise HTTPException(status_code=403, detail="session_id mismatch")
        entry.last_ping = time.time()
    return {"status": "ok"}

@app.post("/transcribe", dependencies=[Depends(require_api_token)])
async def transcribe(
    audio:        UploadFile = File(...),
    source_model: str        = Form(...),
    whitelist:    str        = Form(...),
):
    # ── Validate audio size only — content-type is unreliable ────────────────
    audio_bytes = await audio.read()
    max_bytes   = MAX_AUDIO_MB * 1024 * 1024
    if len(audio_bytes) > max_bytes:
        raise HTTPException(status_code=413, detail=f"Audio exceeds {MAX_AUDIO_MB}MB limit")

    # ── Resolve targets ───────────────────────────────────────────────────────
    requested = [m.strip() for m in whitelist.split(",") if m.strip()]
    if source_model not in requested:
        requested.append(source_model)

    async with registry_lock:
        targets = {
            name: entry
            for name, entry in registry.items()
            if name in requested
        }

    missing = set(requested) - set(targets.keys())
    if missing:
        raise HTTPException(status_code=422, detail=f"Models not available: {sorted(missing)}")

    # ── Fan out in parallel ───────────────────────────────────────────────────
    async def call_model(name: str, entry: ModelEntry) -> tuple[str, str | None, str | None]:
        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                resp = await client.post(
                    entry.endpoint,
                    files={"audio": (audio.filename, audio_bytes, "audio/mpeg")},
                    headers={"X-Registry-Token": REGISTRY_SECRET},
                )
                resp.raise_for_status()
                data = resp.json()
                return name, data.get("transcript"), None
        except httpx.TimeoutException:
            log.warning(f"Model {name} timed out")
            return name, None, "Request timed out after 60s"
        except Exception as e:
            log.warning(f"Model {name} failed: {e}")
            return name, None, str(e)

    results = await asyncio.gather(*[call_model(n, e) for n, e in targets.items()])

    transcripts = {}
    errors      = {}
    for name, transcript, error in results:
        if transcript is not None:
            transcripts[name] = transcript
        else:
            errors[name] = error

    if not transcripts:
        raise HTTPException(status_code=502, detail=f"All models failed: {errors}")

    return {
        "transcripts":  transcripts,
        "source_model": source_model,
        "errors":       errors or None,
    }
