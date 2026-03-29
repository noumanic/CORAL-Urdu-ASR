import httpx
import os, sys
from dotenv import load_dotenv
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
load_dotenv()
BASE        = "http://127.0.0.1:8001"
REG_SECRET  = os.environ.get("REGISTRY_SECRET")
API_SECRET  = os.environ.get("API_SECRET")
REG_HEADERS = {"X-Registry-Token": REG_SECRET}

def test(name, resp, expect=200):
    status = "✓" if resp.status_code == expect else "✗"
    print(f"{status} {name} — {resp.status_code} {resp.json()}")

# /models — should be empty
test("GET /models (empty)", httpx.get(f"{BASE}/models"))

# /register — valid
test("POST /register (valid)", httpx.post(f"{BASE}/register", json={
    "name":       "test-model",
    "endpoint":   "https://xxxx.ngrok-free.app/transcribe_audio",
    "session_id": "session-abc-123",
}, headers=REG_HEADERS))

# /models — should now show test-model
test("GET /models (1 model)", httpx.get(f"{BASE}/models"))

# /ping — valid
test("POST /ping (valid)", httpx.post(f"{BASE}/ping", json={
    "name":       "test-model",
    "session_id": "session-abc-123",
}, headers=REG_HEADERS))

# /ping — wrong session_id
test("POST /ping (wrong session)", httpx.post(f"{BASE}/ping", json={
    "name":       "test-model",
    "session_id": "wrong-session",
}, headers=REG_HEADERS), expect=403)

# /register — bad token
test("POST /register (bad token)", httpx.post(f"{BASE}/register", json={
    "name":       "rogue-model",
    "endpoint":   "https://xxxx.ngrok-free.app/transcribe_audio",
    "session_id": "session-xyz",
}, headers={"X-Registry-Token": "wrong-token"}), expect=403)

# /register — non-https endpoint
test("POST /register (non-https)", httpx.post(f"{BASE}/register", json={
    "name":       "bad-model",
    "endpoint":   "http://xxxx.ngrok-free.app/transcribe_audio",
    "session_id": "session-xyz",
}, headers=REG_HEADERS), expect=422)

# /register — domain not in allowlist
test("POST /register (bad domain)", httpx.post(f"{BASE}/register", json={
    "name":       "bad-model",
    "endpoint":   "https://xxxx.random-domain.com/transcribe_audio",
    "session_id": "session-xyz",
}, headers=REG_HEADERS), expect=422)

# /ping — model not registered
test("POST /ping (unknown model)", httpx.post(f"{BASE}/ping", json={
    "name":       "ghost-model",
    "session_id": "session-abc-123",
}, headers=REG_HEADERS), expect=404)

print("\nDone.")