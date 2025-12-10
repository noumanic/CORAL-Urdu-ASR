# CORAL-Urdu-ASR

**CORAL-Urdu-ASR** is novel two-stage ASR system that achieves state-of-the-art accuracy for Urdu speech recognition by leveraging confidence-weighted ensemble methods & instruction-guided LLM correction. CORAL combines multiple pre-trained ASR models with black-box language model refinement to significantly reduce Word Error Rate without requiring model fine-tuning.

---

## Project Folder Structure

```
CORAL-Urdu-ASR/
│
├── assets/
│   ├── data/                  # Architecture, process flow diagrams, etc
│   ├── icons/                 # UI and documentation icons
│   ├── iteration1-data/       # Iteration 1 research resources and media
│   ├── pipeline/              # System and pipeline images
│   └── slides/                # Slides and presentations
│
├── coral-venv/                # Python virtual environment (local, not versioned)
│
├── dataset/                   # Speech data for evaluation/experiments
│   ├── cv-corpus-*/ur/        # CommonVoice Urdu subsets (.tsv, .mp3)
│   ├── urdu_dataset_*/        # Collected and exported dataset samples
│   └── *.zip                  # Zipped datasets for import/export
│
├── iteration1/
│   ├── CORAL_Iteration1_ASR_Ensemble.ipynb      # ASR wrapper demo app (Flask, real-time, streaming, dataset collection)
│   └── CORAL_Iteration1_Baseline_Evaluation.ipynb   # Model benchmarking and analysis with Dashboard, evaluation UI, and visualizations
│
├── iteration2/                   # Iteration 2: Stage 2 (LLM-Based Correction)
│   ├── iteration_2_backend.ipynb  # Flask backend for LLM correction (runs on Kaggle)
│   ├── app/                       # Next.js frontend web application
│   │   ├── page.tsx              # Main UI for LLM correction interface
│   │   ├── layout.tsx            # App layout
│   │   └── globals.css           # Styling
│   ├── OPTIMIZED_PROMPT.md       # Optimized prompt templates for ALIF-1
│   ├── results_with_alif.csv     # Evaluation results with ALIF-1 corrections
│   └── package.json              # Next.js dependencies
│
├── Mid_Research_Report_FYP1/   # Project thesis/report (LaTeX), figs, bib, etc
│
├── others/                     # Misc documents (e.g., meeting notes)
│
├── proposal/                   # Initial proposal (docx/pdf)
│
├── results/                    # Experiment outputs and summary
│   ├── aggregate_metrics.csv   # WER/ECE summary by model
│   ├── calibration.jpg         # ECE bar chart (plot)
│   ├── detailed_results.csv    # Complete per-audio/model results
│   ├── ITERATION1_REPORT.txt   # Main textual evaluation report for Iteration 1
│   ├── wer_comparison.jpg      # Bar chart: WER by model
│   └── wer_distribution.jpg    # Boxplot: WER distribution by model
│
├── requirements.txt            # Python dependencies
├── README.md                   # Project overview (THIS FILE)
└── ...
```

---

## Iteration 1 - Baseline Evaluation

**Objective:**
Benchmark leading ASR models for Urdu recognition, establish confidence calibration, provide user-friendly real-time inference, and build tools for Urdu speech dataset collection.

**Evaluated Models:**
- Whisper (large, medium, small - multilingual)
- Wav2Vec2 (Urdu-specialized)
- MMS (Facebook multilingual models)
- SeamlessM4T (Facebook universal translation/ASR)

**What’s Implemented:**
- Fast modular ASR wrapper (Flask backend, notebook inference, Urdu enforcement)
- Web browser demo: audio upload, microphone recording, per-model selection
- Per-word confidence and calibration visualization (ECE)
- Complete user flow to collect and download new Urdu speech datasets
- Dashboard for running and visualizing evaluations with plots (WER/ECE)

**Key Results:**
- Best model (so far): `whisper-large` (WER: 17.76%, ECE: 0.11 for calibration)
- All detailed metrics, tables, and plots are in the `results/` directory

---

## How to Run

1. **Install requirements**  
   Ensure Python 3.8+ is used:
   ```bash
   pip install -r requirements.txt
   ```

2. **Run demo app or evaluation notebooks:**
   - Start in `iteration1/CORAL_Iteration1_ASR_Ensemble.ipynb` for a live inference server (with web UI for upload, recording, dataset export).
   - Use `iteration1/CORAL_Iteration1_Baseline_Evaluation.ipynb` for model benchmarking, result generation, and visual plots with interactive dashboard results and further experiments.

3. **Datasets:**
   - All publicly available and collected speech can be found in `dataset/` (including `.mp3`, `.webm`, `.tsv`, `.json`).
   - Download/export custom datasets from the demo web UI when running the ensemble server.

4. **Results:**
   - Model-wise results, visualizations, and per-audio prediction details are available in the `results/` directory.

---

---

## Iteration 2 - Stage 2: LLM-Based Correction

**Objective:**
Implement Stage 2 of the CORAL system using LLM-based correction to refine ASR transcriptions. This iteration focuses on taking multiple ASR hypotheses (from Iteration 1) and using instruction-guided LLM refinement to produce corrected Urdu text with lower WER than individual models.

**What's Implemented:**

### Stage 2: LLM-Based Correction
- **LLM Integration**: Black-box instruction-tuned models (ALIF-1, Mistral-7B, Gemma-2B)
- **Prompt Engineering**: Three template types (detailed, concise, confidence-focused)
- **Urdu-Specific Optimization**: Linguistic pattern awareness, script conversion
- **Error Handling**: Robust fallback mechanisms when LLM fails

### Evaluation & Analysis
- **Comprehensive Metrics**: WER, CER, error type analysis (substitutions/insertions/deletions)
- **Hypothesis Validation**: Validates that CORAL WER < Best individual model WER
- **Batch Evaluation**: Support for 50-100 sample evaluation
- **Detailed Reporting**: JSON output with per-sample and aggregate statistics

**Key Features:**
- ✅ Web-based interface (Next.js) for LLM correction
- ✅ Flask backend API running on Kaggle with ngrok tunnel
- ✅ Instruction-guided LLM correction with Urdu linguistic awareness
- ✅ CSV file upload and batch processing support
- ✅ Custom prompt editor for fine-tuning LLM behavior
- ✅ Robust error handling for connection issues and empty responses

**Usage:**

### Running the Backend (Kaggle Notebook)
1. Open `iteration2/iteration_2_backend.ipynb` in Kaggle
2. Install dependencies and load the ALIF-1 model
3. Run the Flask server and ngrok tunnel
4. Copy the ngrok URL from the output

### Running the Frontend (Next.js)
```bash
cd iteration2
npm install
npm run dev
```

The frontend will be available at `http://localhost:3000`

### Using the Web Interface
1. Enter the ngrok URL from Kaggle in the Settings section
2. Upload a CSV file with ASR results OR manually enter 4 ASR hypotheses
3. Optionally provide a custom prompt for the LLM
4. Click "Refine Transcript" to get the corrected output

### CSV Format
The CSV should contain columns:
- `path`: Audio file path
- `sentence`: Ground truth sentence
- `whisper-large`, `whisper-medium`, `wav2vec2-urdu`, `whisper-small`: ASR model outputs (with confidence scores)
- `alif_1`: LLM corrected output (optional)
- `WER`: Word Error Rate (optional)

**Expected Results:**
- LLM correction should achieve **WER < 17.76%** (baseline from Iteration 1)
- Improved accuracy by combining consensus from multiple ASR models
- Clean Urdu text output without confidence scores or prefixes

**How It Works:**
1. **Input**: 4 ASR hypotheses with confidence scores (from Iteration 1)
2. **Processing**: ALIF-1 LLM analyzes hypotheses and applies correction rules:
   - Trust words where 2+ models agree (confidence >0.60)
   - Prefer highest confidence when models disagree
   - Fix spelling errors (e.g., معشت→معیشت, زرات→زراعت)
   - Ensure proper Urdu grammar and natural flow
3. **Output**: Single corrected Urdu sentence

**Results:**
- Evaluation results are saved in `iteration2/results_with_alif.csv`
- Each row contains: audio path, ground truth, 4 ASR outputs, ALIF-1 correction, and WER

---

## How to Run

1. **Install requirements**  
   Ensure Python 3.8+ is used:
   ```bash
   pip install -r requirements.txt
   ```

2. **Iteration 1 - Baseline Evaluation:**
   - Start in `iteration1/CORAL_Iteration1_ASR_Ensemble.ipynb` for a live inference server (with web UI for upload, recording, dataset export).
   - Use `iteration1/CORAL_Iteration1_Baseline_Evaluation.ipynb` for model benchmarking, result generation, and visual plots with interactive dashboard results and further experiments.

3. **Iteration 2 - Stage 2 (LLM Correction):**
   - **Backend**: Run `iteration2/iteration_2_backend.ipynb` on Kaggle to start Flask server
   - **Frontend**: Run `npm run dev` in `iteration2/` directory to start Next.js app
   - **Usage**: Upload CSV with ASR results or manually enter hypotheses in the web interface

4. **Datasets:**
   - All publicly available and collected speech can be found in `dataset/` (including `.mp3`, `.webm`, `.tsv`, `.json`).
   - Download/export custom datasets from the demo web UI when running the ensemble server.
   - CommonVoice format is supported via `DatasetLoader`

5. **Results:**
   - Iteration 1: Model-wise results, visualizations, and per-audio prediction details in `results/` directory.
   - Iteration 2: LLM correction results saved in `iteration2/results_with_alif.csv` with ASR outputs and corrected text.

---

## Authors
- Muhammad Nouman Hafeez 21I-0416
- Muhammad Ali Irfan 21I-2572
- Rafay Khattak 21I-0423

---