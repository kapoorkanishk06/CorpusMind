from dotenv import load_dotenv
load_dotenv()

"""
search.py — Vector similarity search using MongoDB Atlas Vector Search.
"""

from typing import List
from sentence_transformers import SentenceTransformer

from app.db import chunks_col, documents_col


# Load embedding model once
embedding_model = SentenceTransformer(
    "sentence-transformers/all-MiniLM-L6-v2"
)


def embed_query(query: str) -> List[float]:
    """
    Convert user query into embedding vector.
    """
    return embedding_model.encode(query).tolist()


def semantic_search(query: str, top_k: int = 8) -> List[dict]:
    """
    Perform vector search against MongoDB Atlas.
    """

    vector = embed_query(query)

    results = list(
        chunks_col.aggregate([
            {
                "$vectorSearch": {
                    "index": "chunk_vector_index",
                    "path": "embedding",
                    "queryVector": vector,
                    "numCandidates": top_k * 5,
                    "limit": top_k
                }
            },
            {
                "$project": {
                    "doc_id": 1,
                    "filename": 1,
                    "chunk_idx": 1,
                    "text": 1,
                    "page": 1,
                    "score": {
                        "$meta": "vectorSearchScore"
                    }
                }
            }
        ])
    )

    seen = set()

    for r in results:

        if r["doc_id"] not in seen:
            documents_col.update_one(
                {"_id": r["doc_id"]},
                {"$inc": {"query_count": 1}}
            )

            seen.add(r["doc_id"])

        r["_id"] = str(r.get("_id", ""))

    return results


def proactive_surface(limit: int = 5) -> List[dict]:

    docs = list(
        documents_col
        .find(
            {},
            {
                "_id": 1,
                "filename": 1,
                "query_count": 1,
                "summary": 1,
                "ingested_at": 1
            }
        )
        .sort("query_count", -1)
        .limit(limit)
    )

    for d in docs:
        d["doc_id"] = str(d.pop("_id"))

    return docs