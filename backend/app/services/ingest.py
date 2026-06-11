from dotenv import load_dotenv
load_dotenv()

"""
ingest.py — Parse → Chunk → Embed → Store in MongoDB Atlas
Supports: PDF, DOCX, plain URLs
"""

import uuid
import datetime
import re
from typing import List

import httpx
import fitz
from docx import Document as DocxDocument
from sentence_transformers import SentenceTransformer

from app.db import documents_col, chunks_col, relations_col

CHUNK_SIZE = 400
CHUNK_OVERLAP = 80

# Load embedding model once
embedding_model = SentenceTransformer(
    "sentence-transformers/all-MiniLM-L6-v2"
)


# ============================================================
# Text Extraction
# ============================================================

def extract_pdf(path: str) -> List[dict]:
    doc = fitz.open(path)

    return [
        {
            "page": i + 1,
            "text": page.get_text()
        }
        for i, page in enumerate(doc)
    ]


def extract_docx(path: str) -> List[dict]:
    doc = DocxDocument(path)

    full_text = "\n".join(
        p.text
        for p in doc.paragraphs
        if p.text.strip()
    )

    return [
        {
            "page": 1,
            "text": full_text
        }
    ]


def extract_url(url: str) -> List[dict]:
    response = httpx.get(
        url,
        timeout=15,
        follow_redirects=True
    )

    text = re.sub(r"<[^>]+>", " ", response.text)
    text = re.sub(r"\s+", " ", text).strip()

    return [
        {
            "page": 1,
            "text": text
        }
    ]


# ============================================================
# Chunking
# ============================================================

def chunk_pages(pages: List[dict]) -> List[dict]:
    chunks = []

    for page in pages:
        words = page["text"].split()
        i = 0

        while i < len(words):
            chunks.append({
                "page": page["page"],
                "text": " ".join(words[i:i + CHUNK_SIZE]),
                "chunk_idx": len(chunks)
            })

            i += CHUNK_SIZE - CHUNK_OVERLAP

    return chunks


# ============================================================
# Embeddings
# ============================================================

def embed_text(text: str):
    return embedding_model.encode(text).tolist()


def embed_texts(texts: List[str]):
    return embedding_model.encode(texts).tolist()


# ============================================================
# Main Ingestion
# ============================================================

def ingest_document(
    source: str,
    filename: str,
    source_type: str = "pdf"
) -> dict:

    doc_id = str(uuid.uuid4())
    ingested_at = datetime.datetime.utcnow().isoformat()

    if source_type == "pdf":
        pages = extract_pdf(source)

    elif source_type == "docx":
        pages = extract_docx(source)

    else:
        pages = extract_url(source)

    full_text = " ".join(
        page["text"]
        for page in pages
    )

    chunks = chunk_pages(pages)

    if not chunks:
        raise ValueError("No text extracted from document.")

    texts = [
        chunk["text"]
        for chunk in chunks
    ]

    vectors = embed_texts(texts)

    chunk_docs = []

    for chunk, vector in zip(chunks, vectors):
        chunk_docs.append({
            "doc_id": doc_id,
            "filename": filename,
            "chunk_idx": chunk["chunk_idx"],
            "text": chunk["text"],
            "embedding": vector,
            "page": chunk["page"],
            "ingested_at": ingested_at
        })

    chunks_col.insert_many(chunk_docs)

    documents_col.insert_one({
        "_id": doc_id,
        "filename": filename,
        "source_type": source_type,
        "chunk_count": len(chunks),
        "ingested_at": ingested_at,
        "summary": full_text[:500],
        "query_count": 0
    })

    _update_relations(
        doc_id,
        filename,
        full_text
    )

    return {
        "doc_id": doc_id,
        "chunks_indexed": len(chunks),
        "filename": filename
    }


# ============================================================
# Document Relationships
# ============================================================

def _update_relations(
    new_id,
    new_name,
    new_text
):

    keywords = set(
        re.findall(
            r"\b[A-Z][a-z]{3,}\b",
            new_text
        )
    )

    for doc in documents_col.find(
        {"_id": {"$ne": new_id}},
        {
            "_id": 1,
            "filename": 1,
            "summary": 1
        }
    ):

        other_keywords = set(
            re.findall(
                r"\b[A-Z][a-z]{3,}\b",
                doc.get("summary", "")
            )
        )

        overlap = keywords & other_keywords

        if len(overlap) >= 3:

            relations_col.update_one(
                {
                    "$or": [
                        {
                            "doc_a": new_id,
                            "doc_b": doc["_id"]
                        },
                        {
                            "doc_a": doc["_id"],
                            "doc_b": new_id
                        }
                    ]
                },
                {
                    "$set": {
                        "doc_a": new_id,
                        "doc_b": doc["_id"],
                        "name_a": new_name,
                        "name_b": doc["filename"],
                        "keywords": list(overlap)[:10]
                    }
                },
                upsert=True
            )