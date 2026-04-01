import sys, os
sys.path.insert(0, os.path.dirname(__file__))
import os
import requests
from pathlib import Path
from huggingface_hub import login
from dotenv import load_dotenv

load_dotenv()
BASE_DIR = os.path.dirname(__file__)
BUCKET_URL = os.environ.get("BUCKET_URL")
HF_TOKEN   = os.environ.get("HF_TOKEN")
REPO_ID    = os.environ.get("REPO_ID")
CACHE_DIR  = Path(f"{BASE_DIR}/coral_data")
CACHE_DIR.mkdir(exist_ok=True)

login(token = HF_TOKEN)

FILES = [
    "bigram_backward.parquet",
    "bigram_forward.parquet",
    "bk_tree.joblib",
    "trigram_left.parquet",
    "trigram_middle.parquet",
    "trigram_right.parquet"
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

def load_ngrams(con,count = 5):
    existing = {row[0] for row in con.execute("SHOW TABLES").fetchall()}
    
    for name, file, key_cols in [
        ("bigram_forward",  "bigram_forward.parquet",  "k0"),
        ("bigram_backward", "bigram_backward.parquet", "k0"),
        ("trigram_left",    "trigram_left.parquet",    "k0, k1"),
        ("trigram_middle",  "trigram_middle.parquet",  "k0, k1"),
        ("trigram_right",   "trigram_right.parquet",   "k0, k1"),
    ]:
        if name in existing:
            print(f"  ⏭ {name} already loaded")
            continue
        path = CACHE_DIR / file
        print(f"  Loading {file}...")
        con.execute(f"""
            CREATE TABLE {name} AS
            SELECT * FROM read_parquet('{path}') WHERE cnt >= {count}
        """)
        con.execute(f"CREATE INDEX idx_{name} ON {name} ({key_cols})")
        rows = con.execute(f"SELECT COUNT(*) FROM {name}").fetchone()[0]
        print(f"    ✅ {rows:,} rows")

    print("All ngrams ready ✅")

