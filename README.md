# CORAL — Collaborative Urdu ASR Post-Correction System

> Multi-stage Urdu ASR correction engine reducing Word Error Rate via confidence-weighted ensembles, n-gram OOV detection, and LLM refinement - without requiring model fine-tuning.

<div align="center">

[![Python 3.12+](https://img.shields.io/badge/Python-3.12+-blue.svg)](https://www.python.org/downloads/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.109+-green.svg)](https://fastapi.tiangolo.com/)
[![Next.js](https://img.shields.io/badge/Next.js-14+-black.svg)](https://nextjs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

</div>

---

## Overview

CORAL processes Urdu audio through multiple ASR models, aggregates their outputs into an ensemble, detects out-of-vocabulary words using a BK-Tree and DuckDB n-gram context, and offers two correction approaches:

- **Voting correction** — majority vote across model outputs with OOV candidate override
- **LLM correction** — Gemini or OpenRouter with a specialist Urdu linguist system prompt

The interactive frontend guides users through a 3-pass workflow (alignment, OOV scan, correction) with both file-upload and live speech modes.

---

## Quick Start

### 1. Backend

```bash
cd coral_app/backend
python -m venv venv
venv\Scripts\activate          # Windows
pip install -r requirements.txt

# Create .env (see Configuration below)
uvicorn main_app:app --reload --port 8000
```

> First startup downloads ~200 MB from HuggingFace Hub (BK-Tree + n-gram parquet files). Watch for **"All ngrams ready"** in the log before making requests.

### 2. Frontend

```bash
cd coral_app/frontend/my-next-app
npm install

# Create .env (see Configuration below)
npm run dev
```

### 3. Open

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| API docs (Swagger) | http://localhost:8000/docs |
| Live model list | http://localhost:8000/registry/models |

---

## Configuration

**`coral_app/backend/.env`**

```env
HF_TOKEN=hf_your_token
BUCKET_URL=https://huggingface.co/buckets/EliIrfan/coral_cc_100_extracted_data
REPO_ID=EliIrfan/coral_cc_100_extracted_data
REGISTRY_SECRET=your-registry-secret
API_SECRET=your-api-secret
EVICT_AFTER_SEC=300
MAX_AUDIO_MB=25
ALLOWED_HOSTS=ngrok-free.app,ngrok.io
```

**`coral_app/frontend/my-next-app/.env`**

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_HF_TOKEN=hf_your_token
NEXT_PUBLIC_API_SECRET=your-api-secret

# For LLM correction in Pass 3 (optional — at least one required for LLM mode)
NEXT_PUBLIC_GEMINI_API_KEY=your-gemini-api-key
NEXT_PUBLIC_OPENROUTER_API_KEY=your-openrouter-api-key
```

---

## Architecture

```
Frontend (Next.js)
  ModeSelector → Pass0Speech / Pass1Input → Pass2Sieve → Pass3Correction
       │
       │ REST API
       ▼
Backend (Unified FastAPI — main_app.py)
  ├─ Pipeline Router:  POST /align  /oov  /correct   GET /health
  └─ Registry Router:  GET /registry/models
                       POST /registry/register  /ping  /transcribe

Data Layer
  ├─ HuggingFace Hub → bk_tree.joblib + ngram parquets → DuckDB in-memory
  └─ TSV files: corpus/, asr_results/, asr_ensemble/, asr_evaluation/

External Inference
  └─ Kaggle GPU notebooks → ngrok tunnel → /registry/register + /ping

LLM Correction (client-side, Pass 3)
  ├─ Google Gemini API (NEXT_PUBLIC_GEMINI_API_KEY)
  └─ OpenRouter API   (NEXT_PUBLIC_OPENROUTER_API_KEY)
```

---

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/health` | — | Health check |
| `POST` | `/align` | — | Word + split-merge alignment |
| `POST` | `/oov` | — | OOV detection + candidate ranking |
| `POST` | `/correct` | — | Voting-based correction |
| `GET` | `/registry/models` | — | List live registered models |
| `POST` | `/registry/register` | `X-Registry-Token` | Kaggle notebook registers itself |
| `POST` | `/registry/ping` | `X-Registry-Token` | Kaggle notebook heartbeat |
| `POST` | `/registry/transcribe` | `X-Api-Token` | Fan-out audio to live models |

---

## Kaggle Notebook Deployment

For live speech transcription, run either notebook in `model_deploy_kaggle_notebooks/`:

1. Open the notebook in Kaggle and enable GPU accelerator
2. Set Kaggle secrets: `REGISTRY_SECRET`, `BACKEND_URL`
3. Run all cells — the notebook will:
   - Load the ASR model on GPU
   - Start a FastAPI inference server
   - Expose it via an ngrok HTTPS tunnel
   - Self-register with `POST /registry/register`
   - Send heartbeats every 60 seconds via `POST /registry/ping`

Models silent for 300 seconds are automatically evicted from the registry.

---

## Frontend Workflow

### Mode Selection
On opening the app, choose:
- **File** — upload a CSV/TSV/JSON with columns per ASR model
- **Speech** — upload or record audio then run live inference

### Pass 1 / Pass 0 — Input & Alignment
- File mode: map CSV columns to model names → `POST /align`
- Speech mode: select live models → `POST /registry/transcribe` → `POST /align`

### Pass 2 — OOV Sieve Scan
`POST /oov` then animated 4-phase scan:
1. **Sieve** — violet cursor sweeps tokens
2. **Word-color** — color by MATCH/INSERTION/DELETION/SUBSTITUTION
3. **Expand** — switch to character-level split-merge view
4. **Meta-color** — apply SAME/MERGE/SPLIT/NOISE structural tags

OOV words shown with rose dotted underline; click to view ranked candidates.

### Pass 3 — Correction
Two modes (toggle between them):

**Voting mode** — `POST /correct` → majority vote + OOV override
- Side-by-side token diff view
- Change rate progress bar
- Copy-to-clipboard final transcript

**LLM mode** — client-side Gemini or OpenRouter call
- Provider selector: Gemini (violet) or OpenRouter (orange)
- Dynamic model list fetching from both APIs
- System prompt: Urdu computational linguist with 10 correction mandates
- Returns `corrected`, `reasoning`, and `changes` with linguistic justifications

---

## Project Structure

```
CORAL-Urdu-ASR/
├── urdu_asr_benchmark.ipynb          # Offline model inference on corpus
├── urdu_asr_pipeline.ipynb           # Ensemble + evaluation pipeline
├── generate_ngrams.ipynb             # N-gram table + BK-Tree generation for HF upload
├── README.md                         # This file
│
├── corpus/                           # Reference transcriptions (TSV)
├── audios/                           # Raw audio files (WAV/MP3)
├── vocab/                            # Vocabulary index
├── metadata/                         # clip_durations.tsv
├── asr_results/                      # Per-model raw predictions (TSV)
├── asr_ensemble/                     # Ensemble outputs (TSV)
├── asr_evaluation/                   # WER/CER evaluation metrics (TSV)
├── checkpoints/                      # Model training checkpoints
│
├── model_deploy_kaggle_notebooks/
│   ├── whisper_large_kaggle.ipynb    # Whisper Large v3 on Kaggle GPU
│   └── seamless_large_kaggle.ipynb   # Seamless M4T v2 on Kaggle GPU
│
├── coral_app/
│   ├── backend/
│   │   ├── main_app.py               # Unified FastAPI entry point
│   │   ├── requirements.txt
│   │   ├── Dockerfile
│   │   ├── .env
│   │   ├── pipeline/
│   │   │   ├── pipeline_api.py       # Routes: /health /align /oov /correct
│   │   │   ├── coral_pipeline_functions.py   # Core algorithms
│   │   │   ├── coral_utility_functions.py    # Normalization, alignment, n-gram queries
│   │   │   ├── coral_data_downloader.py      # HuggingFace download + DuckDB bootstrap
│   │   │   └── bktree.py             # BK-Tree data structure
│   │   └── model_registery/
│   │       └── registery_api.py      # Registry router
│   │
│   └── frontend/my-next-app/
│       ├── .env
│       ├── package.json
│       └── app/
│           ├── page.tsx              # Root layout + session state
│           ├── ModeSelector.tsx      # Entry screen
│           ├── Pass0Speech.tsx       # Speech input + live transcription
│           ├── Pass1Input.tsx        # File upload + column mapping
│           ├── Pass2Sieve.tsx        # OOV sieve scan with animation
│           ├── Pass3Correction.tsx   # Voting correction + LLM correction
│           └── lib/api.ts            # Typed API client
│
└── docs/                             # Architecture and pipeline diagrams
    ├── README.md                     # Docs index
    ├── architecture/
    │   ├── system-architecture.md    # System topology diagram
    │   └── system-components.md      # Backend component diagram
    └── pipeline/
        └── pipeline-stages.md        # End-to-end pipeline diagram
```

---

## Models

| Model | Parameters | Kaggle Notebook |
|-------|-----------|----------------|
| Seamless M4T v2 Large | 2.4B | `seamless_large_kaggle.ipynb` |
| Whisper Large v3 | 1.5B | `whisper_large_kaggle.ipynb` |
| Whisper Medium | 769M | — |
| Wav2Vec2 Urdu | 317M | — |

---

## Performance

| Metric | Value |
|--------|-------|
| Ensemble WER (weighted) | 11.8% |
| CER before correction | 9.2% |
| CER after correction | 7.1% |
| WER before correction | 12.1% |
| WER after correction | 8.4% |
| OOV word accuracy improvement | +36.7 pp |
| BK-Tree search vs. linear scan | 11.3× faster |

---

## Documentation

Diagrams are in `docs/` — all render automatically on GitHub:

- [System Architecture](docs/architecture/system-architecture.md)
- [System Components](docs/architecture/system-components.md)
- [Pipeline Stages](docs/pipeline/pipeline-stages.md)

---

## License

MIT License — see [LICENSE](LICENSE).
