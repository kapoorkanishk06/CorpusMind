from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

from app.routes import ingest, search, ask, history, conflicts

app = FastAPI(
    title="Corpus Mind API",
    description="AI-powered institutional knowledge engine",
    version="1.0.0"
)

# Allow React/Vite frontend to talk to FastAPI
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(
    ingest.router,
    prefix="/ingest",
    tags=["Ingest"]
)

app.include_router(
    search.router,
    prefix="/search",
    tags=["Search"]
)

app.include_router(
    ask.router,
    prefix="/ask",
    tags=["Ask"]
)

app.include_router(
    history.router,
    prefix="/history",
    tags=["History"]
)

app.include_router(
    conflicts.router,
    prefix="/conflicts",
    tags=["Conflicts"]
)

@app.get("/")
def root():
    return {
        "status": "Corpus Mind is running"
    }