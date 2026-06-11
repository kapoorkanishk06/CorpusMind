import os, shutil
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from app.services.ingest import ingest_document

router = APIRouter()
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/file")
async def ingest_file(file: UploadFile = File(...)):
    """Upload a PDF or DOCX file and index it."""
    ext = file.filename.rsplit(".", 1)[-1].lower()
    if ext not in ("pdf", "docx"):
        raise HTTPException(400, "Only PDF and DOCX files are supported.")

    dest = os.path.join(UPLOAD_DIR, file.filename)
    with open(dest, "wb") as f:
        shutil.copyfileobj(file.file, f)

    try:
        result = ingest_document(dest, file.filename, source_type=ext)
    except Exception as e:
        raise HTTPException(500, str(e))

    return {"status": "indexed", **result}


@router.post("/url")
async def ingest_url(url: str = Form(...), name: str = Form(None)):
    """Fetch a URL and index its text content."""
    display_name = name or url
    try:
        result = ingest_document(url, display_name, source_type="url")
    except Exception as e:
        raise HTTPException(500, str(e))

    return {"status": "indexed", **result}
