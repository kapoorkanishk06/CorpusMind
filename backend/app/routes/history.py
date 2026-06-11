from fastapi import APIRouter, Query
from app.db import history_col

router = APIRouter()


@router.get("/")
def get_history(limit: int = Query(20, le=100)):
    """Return past queries and answers."""
    records = list(
        history_col.find({}, {"_id": 0})
        .sort("asked_at", -1)
        .limit(limit)
    )
    return {"history": records, "count": len(records)}
