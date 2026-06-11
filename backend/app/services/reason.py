from dotenv import load_dotenv
load_dotenv()

"""
reason.py — Reason across multiple retrieved chunks.
Identifies contradictions, flags outdated info, cites page-level sources.
"""

import datetime
import ollama

from app.db import history_col
from app.services.search import semantic_search


SYSTEM_PROMPT = """
You are Corpus Mind, an institutional knowledge agent.

You receive relevant document excerpts and a user question.

Your job:

1. SYNTHESISE an answer drawing from ALL provided sources.
2. CITE each claim with [Filename, p.N] inline.
3. IDENTIFY contradictions between sources and flag them explicitly.
4. FLAG any information that appears outdated (look for dates, version numbers).
5. If sources are insufficient, say so clearly and do not hallucinate.

Format your response as:

## Answer

<synthesised answer with inline citations>

## Sources Used

<bullet list: filename, page, relevance snippet>

## Contradictions / Conflicts

<any conflicts found, or "None detected">

## Outdated Information

<anything that may be stale, or "None detected">
"""


def ask_question(question: str) -> dict:
    """
    Full pipeline:
    Search -> Retrieve Chunks -> Reason -> Save History
    """

    chunks = semantic_search(question, top_k=8)

    if not chunks:
        return {
            "answer": "No relevant documents found in the corpus. Please ingest documents first.",
            "sources": [],
            "chunks_used": 0
        }

    context_parts = []

    for i, chunk in enumerate(chunks):
        context_parts.append(
            f"[{i + 1}] From: {chunk['filename']}, Page {chunk['page']}\n{chunk['text']}"
        )

    context = "\n\n---\n\n".join(context_parts)

    prompt = f"""
{SYSTEM_PROMPT}

Context:
{context}

Question:
{question}
"""

    response = ollama.chat(
        model="llama3.1:8b",
        messages=[
            {
                "role": "user",
                "content": prompt
            }
        ]
    )

    answer = response["message"]["content"]

    history_col.insert_one({
        "question": question,
        "answer": answer,
        "sources": [
            {
                "filename": c["filename"],
                "page": c["page"],
                "doc_id": c["doc_id"]
            }
            for c in chunks
        ],
        "chunks_used": len(chunks),
        "asked_at": datetime.datetime.utcnow().isoformat()
    })

    return {
        "answer": answer,
        "sources": chunks,
        "chunks_used": len(chunks)
    }