# System Architecture

> High-level topology of the CORAL Urdu ASR system showing all layers, components, and communication paths.

---

## Diagram

```mermaid
---
title: CORAL Urdu ASR - Complete System Architecture
config:
  theme: dark
  primaryColor: '#161b22'
  primaryBorderColor: '#30363d'
  lineColor: '#58a6ff'
  fontSize: 13
---

flowchart TB
    Browser["Web Browser"]

    subgraph FE["Frontend — Next.js Application"]
        direction TB
        ModeSelector["ModeSelector.tsx<br/>Entry screen: File or Speech mode"]
        Pass0["Pass0Speech.tsx<br/>Audio input and live model transcription"]
        Pass1["Pass1Input.tsx<br/>CSV/TSV/JSON upload and column mapping"]
        Pass2["Pass2Sieve.tsx<br/>4-phase OOV sieve scan"]
        Pass3["Pass3Correction.tsx<br/>Voting correction and LLM correction"]
        ApiClient["lib/api.ts — Typed API client"]
    end

    subgraph BE["Backend — Unified FastAPI Server"]
        direction TB
        subgraph PipelineRouter["Pipeline Router"]
            Align["POST /align<br/>asr_aligner + generate_alignment_data"]
            OOV["POST /oov<br/>build_oov_dict + extract_oov_metadata"]
            Correct["POST /correct<br/>apply_corrections voting"]
            Health["GET /health"]
        end
        subgraph RegistryRouter["Registry Router — prefix: /registry"]
            RegModels["GET /registry/models<br/>List live registered models"]
            RegRegister["POST /registry/register<br/>Kaggle notebook self-registers"]
            RegPing["POST /registry/ping<br/>Kaggle notebook heartbeat"]
            RegTranscribe["POST /registry/transcribe<br/>Fan-out audio to all live models"]
        end
        EvictionBg["Eviction sweep — asyncio background task<br/>Removes models silent for 300+ seconds"]
    end

    subgraph Data["Data Layer"]
        HFHub["HuggingFace Hub<br/>bk_tree.joblib + ngram parquets"]
        BKTree["BK-Tree (in-memory)<br/>loaded via joblib.load"]
        DuckDB["DuckDB (in-memory)<br/>bigram and trigram tables"]
        CorpusTSV["corpus/<br/>Reference transcripts"]
        ASRResults["asr_results/<br/>Per-model TSV outputs"]
        EnsembleFiles["asr_ensemble/<br/>Ensemble TSV outputs"]
    end

    subgraph LLMs["External LLM APIs (client-side)"]
        Gemini["Google Gemini API<br/>Gemini 2.0 Flash and others"]
        OpenRouter["OpenRouter API<br/>Llama, Mistral, and others"]
    end

    subgraph Kaggle["External Inference — Kaggle GPU Notebooks"]
        WhisperKaggle["Whisper Large v3<br/>Kaggle GPU + ngrok tunnel"]
        SeamlessKaggle["Seamless M4T v2 Large<br/>Kaggle GPU + ngrok tunnel"]
    end

    Browser --> ModeSelector
    ModeSelector --> Pass0
    ModeSelector --> Pass1
    Pass0 --> Pass2
    Pass1 --> Pass2
    Pass2 --> Pass3
    Pass0 --> ApiClient
    Pass1 --> ApiClient
    Pass2 --> ApiClient
    Pass3 --> ApiClient

    ApiClient --> Align
    ApiClient --> OOV
    ApiClient --> Correct
    ApiClient --> Health
    ApiClient --> RegModels
    ApiClient --> RegTranscribe

    Align --> BKTree
    OOV --> BKTree
    OOV --> DuckDB
    Correct --> EnsembleFiles

    HFHub --> BKTree
    HFHub --> DuckDB
    CorpusTSV --> Align
    ASRResults --> OOV
    EvictionBg --> RegModels

    RegTranscribe --> WhisperKaggle
    RegTranscribe --> SeamlessKaggle
    WhisperKaggle --> RegRegister
    SeamlessKaggle --> RegRegister
    WhisperKaggle --> RegPing
    SeamlessKaggle --> RegPing

    Pass3 --> Gemini
    Pass3 --> OpenRouter

    classDef fe fill:#0550ae,stroke:#58a6ff,color:#c9d1d9
    classDef be fill:#238636,stroke:#3fb950,color:#c9d1d9
    classDef data fill:#1f2937,stroke:#a371f7,color:#bc8ef7
    classDef ext fill:#1a1205,stroke:#f0883e,color:#f0883e
    classDef llm fill:#1a0a26,stroke:#a371f7,color:#a371f7

    class ModeSelector,Pass0,Pass1,Pass2,Pass3,ApiClient fe
    class Align,OOV,Correct,Health,RegModels,RegRegister,RegPing,RegTranscribe,EvictionBg be
    class HFHub,BKTree,DuckDB,CorpusTSV,ASRResults,EnsembleFiles data
    class WhisperKaggle,SeamlessKaggle ext
    class Gemini,OpenRouter llm
```

---

## Layer Summary

| Layer | Technology | Role |
|---|---|---|
| **Presentation** | Next.js 14, React 18, TypeScript | User interface across all 3 passes |
| **Application** | FastAPI 0.109, Uvicorn, Python 3.12 | REST API, model registry, eviction |
| **Data** | HuggingFace Hub, DuckDB, joblib | BK-Tree + n-gram lookup tables |
| **External Inference** | Kaggle GPU, ngrok | Live ASR model transcription |
| **LLM Correction** | Gemini API, OpenRouter API | Expert post-correction (client-side) |

→ [Back to docs index](../README.md)
