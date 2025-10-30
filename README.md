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
│   ├── CORAL_Iteration1_Baseline_Evaluation.ipynb   # Model benchmarking and analysis
│   └── CORAL_Iteration1_Evaluation_FrontEnd.ipynb  # Dashboard, evaluation UI, and visualizations
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
   - Use `iteration1/CORAL_Iteration1_Baseline_Evaluation.ipynb` for model benchmarking, result generation, and visual plots.
   - Open `iteration1/CORAL_Iteration1_Evaluation_FrontEnd.ipynb` for interactive dashboard results and further experiments.

3. **Datasets:**
   - All publicly available and collected speech can be found in `dataset/` (including `.mp3`, `.webm`, `.tsv`, `.json`).
   - Download/export custom datasets from the demo web UI when running the ensemble server.

4. **Results:**
   - Model-wise results, visualizations, and per-audio prediction details are available in the `results/` directory.

---

## Next Steps
- Iteration 2: Waiting...

---

## Authors
- Muhammad Nouman Hafeez 21I-0416
- Muhammad Ali Irfan 21I-2572
- Rafay Khattak 21I-0423

---
