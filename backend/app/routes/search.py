from fastapi import APIRouter, Query
from app.services.search import semantic_search, proactive_surface

router = APIRouter()


@router.get("/")
def search(q: str = Query(..., description="Search query"), top_k: int = 8):
    """Semantic search across the corpus."""
    results = semantic_search(q, top_k=top_k)
    return {"query": q, "results": results, "count": len(results)}


@router.get("/surface")
def surface(limit: int = 5):
    """Return most frequently queried documents (proactive surfacing)."""
    docs = proactive_surface(limit=limit)
    return {"surfaced": docs}
