# Corpus Mind — Backend

AI-powered institutional knowledge engine.  
**Stack**: FastAPI · MongoDB · Elasticsearch · OpenAI

---

## Setup

### 1. Install dependencies
```bash
pip install -r requirements.txt
```

### 2. Configure environment
```bash
cp .env.example .env
# Edit .env and add your OPENAI_API_KEY
```

### 3. Start services (Docker recommended)
```bash
# MongoDB
docker run -d -p 27017:27017 mongo

# Elasticsearch
docker run -d -p 9200:9200 -e "discovery.type=single-node" \
  -e "xpack.security.enabled=false" elasticsearch:8.13.2
```

### 4. Run the server
```bash
uvicorn app.main:app --reload
```

API docs → http://localhost:8000/docs

---

## API Endpoints

| Method | Endpoint         | Description                              |
|--------|------------------|------------------------------------------|
| POST   | /ingest/file     | Upload PDF or DOCX                       |
| POST   | /ingest/url      | Ingest content from a URL                |
| GET    | /search/?q=...   | Semantic search across corpus            |
| GET    | /search/surface  | Most queried docs (proactive surfacing)  |
| POST   | /ask/            | Ask a question, get cited answer         |
| GET    | /history/        | Past queries and answers                 |

---

## Architecture

```
Upload (PDF/DOCX/URL)
        ↓
  Text Extraction
  (PyMuPDF / python-docx / httpx)
        ↓
   Chunking (400 tokens, 80 overlap)
        ↓
  Embeddings (OpenAI text-embedding-3-small)
        ↓
  ┌─────────────────┐
  │  Elasticsearch  │  ← vector chunks (kNN search)
  └─────────────────┘
  ┌─────────────────┐
  │    MongoDB      │  ← metadata, history, relations
  └─────────────────┘
        ↓
   On /ask → retrieve top-8 chunks
           → GPT-4o-mini reasons across docs
           → returns answer + citations + contradictions
```

---

## Connecting a React Frontend

Point your React app at `http://localhost:8000`.  
CORS is open for all origins in development.

Example fetch:
```js
const res = await fetch("http://localhost:8000/ask/", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ question: "What was decided in the March board meeting?" })
});
const data = await res.json();
console.log(data.answer);
```
