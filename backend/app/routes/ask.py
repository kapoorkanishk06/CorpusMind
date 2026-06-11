from fastapi import APIRouter
from pydantic import BaseModel
from app.services.reason import ask_question

router = APIRouter()


class AskRequest(BaseModel):
    question: str


@router.post("/")
def ask(body: AskRequest):
    """Ask a question — get a synthesised, cited answer across all documents."""
    result = ask_question(body.question)
    return result
