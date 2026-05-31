# Load .env FIRST — before any service imports that read os.getenv at module level
from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from app.services.ai_service import AIService, AIServiceError
from app.services.extraction_service import ExtractionService
import os
import json
import asyncio
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
    content: Optional[str] = Form(None),
    url: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    generation_type: str = Form("all"),
    video_title: Optional[str] = Form(None),
    channel_name: Optional[str] = Form(None),
):
    """
    Accepts PDF, DOCX, YouTube URL, or raw text.
    Returns structured AI-generated study materials.
    """
    try:
        raw_text = ""
        topic = "Study Session"
        source_figures: list = []

        if type == "youtube":
            target_url = url or content
            if not target_url:
                raise HTTPException(status_code=400, detail="YouTube URL is required.")
            raw_text = await ExtractionService.get_youtube_transcript(target_url)
            if video_title:
                topic = video_title
            elif channel_name:
                topic = f"Lecture by {channel_name}"
            else:
                topic = "YouTube Video"

        elif type == "file":
            if not file:
                raise HTTPException(status_code=400, detail="No file was uploaded.")
            file_bytes = await file.read()
            raw_text = await ExtractionService.extract_text_from_file(file_bytes, file.filename or "")
            source_figures = await asyncio.to_thread(
                ExtractionService.extract_figures_from_file,
                file_bytes,
                file.filename or "",
            )
            if file.filename:
                topic = os.path.splitext(file.filename)[0].replace("_", " ").replace("-", " ")

        elif type == "text":
            if not content or len(content.strip()) < 10:
                raise HTTPException(status_code=400, detail="Text content is too short (minimum 10 characters).")
            raw_text = content.strip()
            first_line = raw_text.split("\n")[0].strip()
            if len(first_line) > 5 and len(first_line) < 60:
                topic = first_line.lstrip("# ").strip()
            else:
                topic = "Text Notes"

        else:
            raise HTTPException(status_code=400, detail=f"Unknown content type: {type}")

        if not raw_text or len(raw_text.strip()) < 10:
            raise HTTPException(
                status_code=400,
                detail="Could not extract enough text from the source. Please try different content."
            )

        if type != "file":
            source_figures = []

        # AI Processing - run blocking CPU/IO-bound sync task in a thread pool to avoid blocking the main event loop
        processed = await asyncio.to_thread(
            AIService.process_document,
            raw_text,
            topic=topic,
            source_type=type,
            source_url=url or "",
            generation_type=generation_type,
            source_images=source_figures,
        )

        return {
            "status": "completed",
            "title": processed.get("title", topic),
            "simplified_content": processed.get("simplified_notes", ""),
            "quizzes": processed.get("quizzes", []),
            "flashcards": processed.get("flashcards", []),
            "roadmap": processed.get("roadmap", ""),
            "mind_map": processed.get("mind_map", ""),
            "podcast_script": processed.get("podcast_script", ""),
            "visual_prompt": processed.get("visual_prompt", ""),
            "exam_cram_notes": processed.get("exam_cram_notes", ""),
            "presentation_notes": processed.get("presentation_notes", ""),
            "raw_text": raw_text[:2000],
        }

    except HTTPException:
        raise
    except AIServiceError as e:
        err = str(e)
        if "RATE_LIMIT" in err or "429" in err or "402" in err:
            raise HTTPException(
                status_code=429,
                detail="Generation quota exceeded. Wait for the timer or upgrade credits.",
            )
        print(f"[/process] AI error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        print(f"[/process] Unexpected error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/generate-more-quiz")
async def generate_more_quiz(
    source_text: str = Form(...),
    existing_questions: str = Form("[]"),
):
    """Generates additional quiz questions without duplicates."""
    try:
        existing_list = json.loads(existing_questions)
        questions = await asyncio.to_thread(
            AIService.generate_more_quiz, source_text, existing_list
        )
        return {"questions": questions}
    except Exception as e:
        print(f"[/generate-more-quiz] Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/generate-more-flashcards")
async def generate_more_flashcards(
    source_text: str = Form(...),
    existing_cards: str = Form("[]"),
):
    """Generates additional flashcards without duplicates."""
    try:
        existing_list = json.loads(existing_cards)
        cards = await asyncio.to_thread(
            AIService.generate_more_flashcards, source_text, existing_list
        )
        return {"flashcards": cards}
    except Exception as e:
        print(f"[/generate-more-flashcards] Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/chat")
async def chat_with_ai(
    prompt: str = Form(...),
    context: str = Form(""),
    excerpt: Optional[str] = Form(None),
    history: Optional[str] = Form(None),
):
    """Stateless AI chat with note context — streams real-time tokens via SSE."""
    try:
        history_list = json.loads(history) if history else []
        full_context = context or ""
        if excerpt and excerpt.strip():
            full_context = (
                f"{full_context}\n\n"
                f"--- STUDENT FOCUSED EXCERPT (prioritize this) ---\n"
                f"{excerpt.strip()[:4000]}"
            )
        return StreamingResponse(
            AIService.generate_response_stream(prompt, full_context, history_list),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "X-Accel-Buffering": "no",
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
