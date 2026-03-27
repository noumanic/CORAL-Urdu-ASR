# main.py
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional

import duckdb
import joblib
import __main__
from bktree import BKTree, BKNode
from coral_data_downloader import *

__main__.BKTree = BKTree
__main__.BKNode = BKNode

con = duckdb.connect()
tree = joblib.load('coral_data/bk_tree.joblib')

from coral_pipeline_functions import (
    asr_aligner,
    apply_corrections,
    extract_oov_metadata,
    build_oov_dict
)

app = FastAPI(title="CORAL Urdu ASR API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class AlignRequest(BaseModel):
    ensemble:     dict[str, str]
    source_model: str

class OOVRequest(BaseModel):
    align_info:  dict
    freq_cutoff: Optional[int] = 2000
    depth:       Optional[int] = 50
    top_n:       Optional[int] = 10

class CorrectRequest(BaseModel):
    align_info:   dict
    oov_metadata: dict

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/align")
def align(req: AlignRequest):
    try:
        align_info = asr_aligner(
            ensemble=req.ensemble,
            source_model=req.source_model
        )
        return align_info
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/oov")
def oov(req: OOVRequest):
    try:
        model_names = [k for k in req.align_info if k != 'source_model']

        oov_dict = build_oov_dict(tree, req.align_info, req.freq_cutoff)

        metadata = {}
        for model in model_names:
            sentence = ' '.join(req.align_info[model]['normalized_attempt'])
            metadata.update(
                extract_oov_metadata(
                    tree, con, oov_dict, sentence,
                    depth=req.depth, top_n=req.top_n
                )
            )

        return {
            "oov_dict": list(oov_dict),
            "metadata": metadata
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/correct")
def correct(req: CorrectRequest):
    try:
        result = apply_corrections(req.align_info, req.oov_metadata)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))