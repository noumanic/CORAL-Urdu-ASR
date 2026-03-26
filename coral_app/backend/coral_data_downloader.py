import os
import requests
from pathlib import Path
from huggingface_hub import login
from dotenv import load_dotenv
load_dotenv()

BUCKET_URL = os.environ.get("BUCKET_URL")
HF_TOKEN   = os.environ.get("HF_TOKEN")
REPO_ID    = os.environ.get("REPO_ID")
CACHE_DIR  = Path("coral_data")
CACHE_DIR.mkdir(exist_ok=True)

login(token = HF_TOKEN)

FILES = [
    "bigram_backward.parquet",
    "bigram_forward.parquet",
    "bk_tree.joblib",
    "trigram_left.parquet",
    "trigram_middle.parquet",
    "trigram_right.parquet",
    "unigram_counts.parquet",
]

def download_file(fname):
    url      = f"{BUCKET_URL}/resolve/{fname}"
    out_path = CACHE_DIR / fname
    if out_path.exists():
        print(f"  ⏭ {fname} already cached")
        return out_path
    print(f"  ⬇ {fname}...")
    r = requests.get(url, headers={"Authorization": f"Bearer {HF_TOKEN}"}, stream=True)
    r.raise_for_status()
    with open(out_path, 'wb') as f:
        for chunk in r.iter_content(chunk_size=8192):
            f.write(chunk)
    print(f"  ✅ {fname}")
    return out_path

print("Downloading dataset...")
local_paths = {fname: download_file(fname) for fname in FILES}
print("Downloading complete...")