"""
conflicts.py — Dedicated conflict detection across the corpus.
Finds contradictions between documents on a given topic.
"""

from fastapi import APIRouter
from pydantic import BaseModel
from app.db import history_col
from app.services.search import semantic_search
import os, datetime
from google import genai

router = APIRouter()

gemini_client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

CONFLICT_PROMPT = """You are a conflict detection engine for institutional documents.

Analyze the provided document excerpts and identify:
1. DIRECT CONTRADICTIONS — two or more sources that say opposite things
2. OUTDATED INFORMATION — content with old dates, deprecated policies, old version numbers
3. AMBIGUITIES — sources that are vague or inconsistent on the same topic

For each conflict found, output:
- **Conflict Type**: (Contradiction / Outdated / Ambiguity)
- **Source A**: [filename, page]
- **Source B**: [filename, page] (if applicable)
- **Issue**: what exactly conflicts
- **Severity**: High / Medium / Low

If no conflicts are found, say "No conflicts detected across the provided sources."

Be precise and cite exact sources. Do not hallucinate conflicts.
"""


class ConflictRequest(BaseModel):
    topic: str
    top_k: int = 10


@router.post("/")
def detect_conflicts(body: ConflictRequest):
    """
    Search the corpus for a topic and detect contradictions,
    outdated info, and ambiguities across matching documents.
    """
    # 1. Retrieve relevant chunks
    chunks = semantic_search(body.topic, top_k=body.top_k)

    if not chunks:
        return {
            "topic": body.topic,
            "conflicts": "No documents found in corpus. Please ingest documents first.",
            "sources_analyzed": 0
        }

    # 2. Build context
    context_parts = []
    for i, c in enumerate(chunks):
        context_parts.append(
            f"[{i+1}] From: {c['filename']}, Page {c['page']}\n{c['text']}"
        )
    context = "\n\n---\n\n".join(context_parts)

    # 3. Call Gemini
    response = gemini_client.models.generate_content(
        model="gemini-1.5-flash",
        contents=f"{CONFLICT_PROMPT}\n\nTopic: {body.topic}\n\nDocument excerpts:\n{context}"
    )

    result = response.text

    # 4. Save to history
    history_col.insert_one({
        "type":             "conflict_detection",
        "topic":            body.topic,
        "result":           result,
        "sources_analyzed": len(chunks),
        "sources": [{"filename": c["filename"], "page": c["page"]} for c in chunks],
        "asked_at":         datetime.datetime.utcnow().isoformat()
    })

    return {
        "topic":            body.topic,
        "conflicts":        result,
        "sources_analyzed": len(chunks),
        "sources":          chunks
    }
