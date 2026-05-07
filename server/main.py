# main.py
from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from app.services.ai_service import AIService
from app.services.extraction_service import ExtractionService
import os
import json
import requests
from typing import Optional

# CRITICAL: This is the 'app' attribute the server is looking for
app = FastAPI(title="LuminaStudy Ingestion API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def health():
    key = os.getenv("OPENROUTER_API_KEY", "")
    key_status = "HIDDEN"
    if key:
        key_status = f"LOADED (Starts with: {key[:8]}...)"
    
    or_status = "Unknown"
    try:
        # Check if OpenRouter is reachable
        r = requests.get("https://openrouter.ai/api/v1/models", timeout=5)
        or_status = "Reachable" if r.status_code == 200 else f"Error {r.status_code}"
    except:
        or_status = "Unreachable"

    return {
        "status": "online",
        "mode": "stateless_processor",
        "version": "1.3.4",
        "model": AIService.get_model_name(),
        "api_key_loaded": bool(key) and len(key) > 10,
        "api_key_status": key_status,
        "openrouter_connection": or_status
    }

@app.post("/process")
async def process_content(
    type: str = Form(...),
    generation_type: str = Form("all"),
    content: Optional[str] = Form(None),
    url: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
):
    try:
        raw_text = ""
        if type == "text":
            raw_text = content.strip() if content else ""
        elif type == "youtube":
            target_url = url or content
            if target_url:
                raw_text = await ExtractionService.get_youtube_transcript(target_url)
        elif type == "file":
            if file:
                file_bytes = await file.read()
                raw_text = await ExtractionService.extract_text_from_file(file_bytes, file.filename or "")

        if not raw_text or len(raw_text.strip()) < 10:
            if type == "youtube":
                # Fallback for youtube if transcript fails - at least we have the URL
                raw_text = f"YouTube Video: {url or content}"
            else:
                raise HTTPException(status_code=400, detail="Insufficient content extracted from source.")

        # Infer topic from first line
        lines = [l.strip() for l in raw_text.split('\n') if len(l.strip()) > 5]
        inferred_topic = lines[0][:100] if lines else "Study Session"
        
        # Process with AI
        processed = await AIService.process_document(
            text=raw_text, 
            topic=inferred_topic, 
            source_type=type
        )

        return {
            "status": "completed",
            "title": processed.get("title", inferred_topic),
            "simplified_content": processed.get("simplified_notes", ""),
            "simplified_notes": processed.get("simplified_notes", ""), # legacy support
            "raw_text": raw_text[:8000],
            "source_text": raw_text[:8000], # legacy support
            "quizzes": processed.get("quizzes", []),
            "flashcards": processed.get("flashcards", []),
            "roadmap": processed.get("roadmap", ""),
            "mind_map": processed.get("mind_map", ""),
            "podcast_script": processed.get("podcast_script", ""),
            "visual_prompt": processed.get("visual_prompt", ""),
        }
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/chat")
async def chat_with_ai(
    prompt: str = Form(...),
    context: str = Form(""),
    history: Optional[str] = Form(None), 
):
    try:
        # history is sent as JSON string from frontend
        h_list = json.loads(history) if history else []
        answer = await AIService.generate_response(prompt, context, h_list)
        return {"answer": answer}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat Failed: {str(e)}")

@app.post("/generate-more-flashcards")
async def generate_more_flashcards(
    source_text: str = Form(default=""),
    existing_cards: str = Form(default="[]"),
):
    try:
        # Safe parse — never crash on bad JSON
        try:
            existing = json.loads(existing_cards) if existing_cards else []
        except (json.JSONDecodeError, ValueError):
            existing = []

        # Fallback if source text is empty
        if not source_text or len(source_text.strip()) < 10:
            raise HTTPException(
                status_code=400,
                detail="source_text is required and must be at least 10 characters."
            )

        new_cards = AIService.generate_more_flashcards(source_text, existing)
        return {"status": "success", "flashcards": new_cards}

    except HTTPException:
        raise
    except Exception as e:
        print(f"[generate-more-flashcards] Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/generate-more-quiz")
async def generate_more_quiz(
    source_text: str = Form(default=""),
    existing_questions: str = Form(default="[]"),
):
    try:
        try:
            existing = json.loads(existing_questions) if existing_questions else []
        except (json.JSONDecodeError, ValueError):
            existing = []

        if not source_text or len(source_text.strip()) < 10:
            raise HTTPException(
                status_code=400,
                detail="source_text is required and must be at least 10 characters."
            )

        new_questions = AIService.generate_more_quiz(source_text, existing)
        return {"status": "success", "questions": new_questions}

    except HTTPException:
        raise
    except Exception as e:
        print(f"[generate-more-quiz] Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
