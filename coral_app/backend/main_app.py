import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pipeline.pipeline_api import app as pipeline_app
from model_registery.registery_api import app as registry_app, eviction_sweep, registry_lock as _registry_lock_ref
import model_registery.registery_api as registry_module

@asynccontextmanager
async def lifespan(app: FastAPI):
    task = asyncio.create_task(eviction_sweep())
    yield
    task.cancel()

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(registry_app.router, prefix="/registry")
app.include_router(pipeline_app.router)
