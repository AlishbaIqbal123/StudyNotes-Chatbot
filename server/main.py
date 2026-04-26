# Load .env FIRST — before any service imports that read os.getenv at module level
#server/main.py
from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from app.services.ai_service import AIService
from app.services.extraction_service import ExtractionService
import os
from typing import Optional

app = FastAPI(title="LuminaStudy Ingestion API")

# CORS — allow all origins for development
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
    return {
        "status": "online",
        "mode": "stateless_processor",
        "version": "1.2.0",
        "api_key_loaded": bool(key) and len(key) > 10,
    }


@app.post("/process")
async def process_content(
    type: str = Form(...),
    generation_type: str = Form("all"),
    content: Optional[str] = Form(None),
    url: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
):
    """
    Accepts PDF, DOCX, YouTube URL, or raw text.
    Returns structured AI-generated study materials.
    """
    try:
        raw_text = ""

        if type == "text":
            if not content or len(content.strip()) < 10:
                raise HTTPException(status_code=400, detail="Text content is too short (minimum 10 characters).")
            raw_text = content.strip()

        elif type == "youtube":
            target_url = url or content
            if not target_url:
                raise HTTPException(status_code=400, detail="YouTube URL is required.")
            try:
                raw_text = await ExtractionService.get_youtube_transcript(target_url)
            except ValueError as ve:
                raise HTTPException(status_code=400, detail=str(ve))

        elif type == "file":
            if not file:
                raise HTTPException(status_code=400, detail="No file was uploaded.")
            file_bytes = await file.read()
            raw_text = await ExtractionService.extract_text_from_file(file_bytes, file.filename or "")

        else:
            raise HTTPException(status_code=400, detail=f"Unknown content type: {type}")

        if not raw_text or len(raw_text.strip()) < 10:
            raise HTTPException(
                status_code=400,
                detail="Could not extract enough text from the source. Please try different content."
            )

        # Extract a meaningful topic from the content for better AI research
        # We take the first non-empty line (usually a title) or first 100 chars
        lines = [l.strip() for l in raw_text.split('\n') if len(l.strip()) > 5]
        inferred_topic = lines[0][:100] if lines else type.capitalize()
        
        # AI Processing
        processed = AIService.process_document(
            text=raw_text, 
            topic=inferred_topic,
            source_type=type,
            source_url=url or content or ""
        )

        return {
            "status": "completed",
            "title": processed.get("title", "Study Session"),
            "simplified_content": processed.get("simplified_notes", ""),
            "quizzes": processed.get("quizzes", []),
            "flashcards": processed.get("flashcards", []),
            "roadmap": processed.get("roadmap", ""),
            "mind_map": processed.get("mind_map", ""),
            "podcast_script": processed.get("podcast_script", ""),
            "visual_prompt": processed.get("visual_prompt", ""),
            "raw_text": raw_text[:2000],
        }

    except HTTPException:
        raise
    except ValueError as ve:
        print(f"[/process] Validation Error: {ve}")
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        import traceback
        print(f"[/process] UNEXPECTED ERROR: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")


@app.post("/chat")
async def chat_with_ai(
    prompt: str = Form(...),
    context: str = Form(""),
    history: Optional[str] = Form(None), # JSON string of previous messages
):
    """Stateless AI chat with note context and history."""
    try:
        import json
        history_list = json.loads(history) if history else []
        answer = await AIService.generate_response(prompt, context, history_list)
        return {"answer": answer}
    except Exception as e:
        print(f"[/chat] Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
