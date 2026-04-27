# server/main.py
import os
import json
from typing import Optional, List
from dotenv import load_dotenv
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from app.services.ai_service import AIService, RateLimitError
from app.services.extraction_service import ExtractionService

load_dotenv()

# ─── RESPONSE MODELS ──────────────────────────────────────────
class QuizItem(BaseModel):
    question: str
    options: List[str]
    answer: str

class FlashcardItem(BaseModel):
    front: str
    back: str

class ProcessResponse(BaseModel):
    status: str
    title: str
    simplified_notes: str
    quizzes: List[QuizItem]
    flashcards: List[FlashcardItem]
    roadmap: str
    mind_map: str
    podcast_script: str
    visual_style_prompt: str

class ChatResponse(BaseModel):
    answer: Optional[str]
    error: Optional[str]
# ──────────────────────────────────────────────────────────────

app = FastAPI(title="Lumina Atelier API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    """Validates configuration on startup."""
    required_env = ["OPENROUTER_API_KEY", "FIREBASE_CONFIG"]
    for env in required_env:
        if not os.getenv(env):
            print(f"[LUMINA] [WARNING] Missing environment variable: {env}")

@app.get("/health")
async def health():
    return {"status": "online", "version": "2.1.0"}

@app.post("/process", response_model=ProcessResponse)
async def process_content(
    type: str = Form(...),
    content: Optional[str] = Form(None),
    url: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
):
    try:
        raw_text = ""
        if type == "text":
            raw_text = content or ""
        elif type == "youtube":
            raw_text = await ExtractionService.get_youtube_transcript(url or content)
        elif type == "file" and file:
            file_bytes = await file.read()
            raw_text = await ExtractionService.extract_text_from_file(file_bytes, file.filename)
        
        if not raw_text or len(raw_text.strip()) < 10:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, 
                detail="Insufficient text extracted from source."
            )

        processed_data = AIService.process_document(raw_text)
        return ProcessResponse(status="completed", **processed_data)

    except RateLimitError:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail={"error_type": "RATE_LIMIT", "retry_after_seconds": 3600}
        )
    except Exception as e:
        print(f"[LUMINA] [ERROR] /process: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@app.post("/chat", response_model=ChatResponse)
async def chat_with_ai(
    prompt: str = Form(...),
    context: str = Form(""),
    history: Optional[str] = Form(None),
):
    try:
        try:
            history_list = json.loads(history) if history else []
        except:
            history_list = []
            
        answer = await AIService.generate_response(prompt, context, history_list)
        return ChatResponse(answer=answer, error=None)
    except RateLimitError:
        return ChatResponse(answer=None, error="RATE_LIMIT_REACHED")
    except Exception as e:
        print(f"[LUMINA] [ERROR] /chat: {str(e)}")
        return ChatResponse(answer=None, error="COMMUNICATION_ERROR")

@app.post("/generate-more-quiz")
async def generate_more_quiz(
    source_text: str = Form(...),
    existing_questions: str = Form("[]"),
):
    try:
        import json
        existing = json.loads(existing_questions)
        new_questions = AIService.generate_more_quiz(source_text, existing)
        return {"status": "success", "questions": new_questions}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/generate-more-flashcards")
async def generate_more_flashcards(
    source_text: str = Form(...),
    existing_cards: str = Form("[]"),
):
    try:
        import json
        existing = json.loads(existing_cards)
        new_cards = AIService.generate_more_flashcards(source_text, existing)
        return {"status": "success", "flashcards": new_cards}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
