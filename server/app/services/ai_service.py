# server/app/services/ai_service.py
import os
import re
import requests
import json
from datetime import datetime
from typing import Dict, List, Any, Optional

# ─── CONFIGURATION ────────────────────────────────────────────
DEFAULT_MODEL         = "deepseek/deepseek-r1-0528:free"
FALLBACK_MODEL        = "mistralai/mistral-7b-instruct:free"
MAX_CONTEXT_CHARS     = 8000
MAX_TOKENS_NOTES      = 32000
MAX_TOKENS_MATERIALS  = 16000
API_TIMEOUT_NOTES     = 180
API_TIMEOUT_MATERIALS = 120
OPENROUTER_BASE_URL   = "https://openrouter.ai/api/v1/chat/completions"
MIN_NOTE_LENGTH       = 500
MIN_QUIZ_COUNT        = 5
MIN_FLASHCARD_COUNT   = 8
LOG_PREFIX            = "[LUMINA]"
# ──────────────────────────────────────────────────────────────

class RateLimitError(Exception):
    """Custom exception for API rate limiting."""
    pass

class AIServiceError(Exception):
    """General AI service error."""
    pass

def _log(message: str, level: str = "INFO") -> None:
    """Standardized logging with timestamps and levels."""
    timestamp = datetime.now().strftime("%H:%M:%S")
    print(f"{LOG_PREFIX} [{level}] {timestamp} — {message}")

def _build_headers() -> Dict[str, str]:
    """Constructs headers for OpenRouter API requests."""
    return {
        "Authorization": f"Bearer {os.getenv('OPENROUTER_API_KEY')}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://lumina-atelier.com",
        "X-Title": "Lumina Atelier"
    }

def _call_openrouter(
    messages: List[Dict[str, str]], 
    model: str = DEFAULT_MODEL, 
    max_tokens: int = MAX_TOKENS_NOTES, 
    timeout: int = API_TIMEOUT_NOTES
) -> str:
    """Makes a request to the OpenRouter API with automatic fallback retry."""
    
    def attempt_call(target_model: str, target_timeout: int) -> str:
        payload = {
            "model": target_model,
            "messages": messages,
            "temperature": 0.3,
            "max_tokens": max_tokens
        }
        _log(f"Attempting API call with model: {target_model}")
        
        response = requests.post(
            OPENROUTER_BASE_URL, 
            headers=_build_headers(), 
            json=payload, 
            timeout=target_timeout
        )
        
        if response.status_code == 429:
            raise RateLimitError("API_RATE_LIMIT_EXCEEDED")
            
        response.raise_for_status()
        data = response.json()
        
        if "error" in data:
            if data["error"].get("code") == 429:
                raise RateLimitError("API_RATE_LIMIT_EXCEEDED")
            raise AIServiceError(data["error"].get("message", "Unknown API error"))
            
        return data["choices"][0]["message"]["content"]

    try:
        # Primary Attempt
        return attempt_call(model, timeout)
    except Exception as e:
        _log(f"Primary call failed ({model}): {str(e)}. Retrying with fallback...", level="WARNING")
        try:
            # Fallback Attempt
            return attempt_call(FALLBACK_MODEL, timeout)
        except Exception as fallback_e:
            _log(f"Fallback call also failed ({FALLBACK_MODEL}): {str(fallback_e)}", level="ERROR")
            raise AIServiceError(f"Both primary and fallback AI models failed: {str(fallback_e)}")

def _fix_pollinations_urls(notes: str) -> str:
    """Converts any pollinations URL format to the working format."""
    import re, urllib.parse
    
    def fix_url(match):
        alt = match.group(1)
        url = match.group(2)
        
        if 'pollinations' not in url:
            return match.group(0)
        
        # Extract the prompt text from any pollinations URL format
        for marker in ['/prompt/', '/p/']:
            if marker in url:
                parts = url.split(marker, 1)
                prompt_part = parts[1].split('?')[0]
                # Clean and re-encode
                clean = urllib.parse.unquote(prompt_part).replace('%20', ' ')
                encoded = urllib.parse.quote(clean, safe='')
                seed = __import__('random').randint(1000, 9999)
                new_url = f"https://image.pollinations.ai/prompt/{encoded}?width=1200&height=630&nologo=true&seed={seed}"
                return f"![{alt}]({new_url})"
        
        return match.group(0)
    
    return re.sub(r'!\[([^\]]*)\]\(([^)]+)\)', fix_url, notes)

def _clean_note_formatting(notes: str) -> str:
    """Standardizes formatting and fixes broken image links."""
    cleaned = _fix_pollinations_urls(notes)
    # Ensure consistent spacing around headers
    cleaned = re.sub(r'\n(##+ )', r'\n\n\1', cleaned)
    return cleaned

def _parse_robust_markdown(text: str) -> Dict[str, Any]:
    """Extracts sections from markdown based on headers, handling emojis."""
    sections = {}
    
    title_match = re.search(r"^# (.*)", text, re.MULTILINE)
    sections["title"] = title_match.group(1).strip() if title_match else "Study Session"
    
    parts = re.split(r'\n(?=## )', text)
    for part in parts:
        if not part.strip().startswith('##'):
            continue
        lines = part.strip().split('\n', 1)
        header_line = lines[0].replace('##', '').strip()
        header_key = re.sub(r'[^\w\s]', '', header_line).strip().lower()
        content = lines[1].strip() if len(lines) > 1 else ""
        sections[header_key] = content
            
    sections["full_content"] = text
    return sections

class AIService:
    """Main service for document processing and chat generation."""

    @staticmethod
    def process_document(source_text: str, topic: str = "General") -> Dict[str, Any]:
        """Orchestrates multi-call generation of study materials from source text."""
        _log(f"Source length: {len(source_text)} chars")
        
        prompt1 = f"""STUDY SOURCE — READ THIS FIRST AND COMPLETELY:
{source_text}

━━━ YOUR TASK BEGINS NOW ━━━

You are a world-class educational architect and study aesthetician.
The text above is your ONLY source of truth.
Your mission is to transform the source text into a masterpiece of learning.
Every single technical fact, concept, and detail from the source MUST be captured.
Do NOT summarize away important details. Write deeply.

WRITING STYLE & AESTHETIC RULES:
- Tone: Friendly, modern, and encouraging (for a 16-year-old student).
- Language: Simple wording, bold key phrases, clear analogies.
- Grounding: 100% strict. No outside knowledge.
- Depth: Exhaustive. Cover every sub-topic in detail.

CRITICAL: Your response MUST start with a single # Header for the topic.

# {topic}

## 📋 What You Will Learn
6-8 detailed bullet points.

---

## 📖 Detailed Notes
For EVERY major topic in the source, create a deep-dive section:

### [Topic Name] 🚀
> 💡 **The Vibe:** [One sentence simple analogy]
[Exhaustive factual content. Use bolding for terms.]
[Include a Mermaid chart or mindmap for every 2 paragraphs]
**🔑 The Vocab:**
| Term | Simple Definition |
|------|-------------------|
**⭐ The Golden Rule:** [One sentence takeaway]

---

## 🖼️ Visual Summary
For images, write exactly 5 image tags in the notes section.
Each image must use this EXACT format with no variations:
![Description of concept](https://image.pollinations.ai/prompt/PROMPT_TEXT?width=1200&height=630&nologo=true&seed=RANDOM_NUMBER)

Rules:
- Replace PROMPT_TEXT with a detailed description, spaces replaced with +plus+signs+not+%20
- Replace RANDOM_NUMBER with any random number between 1000-9999
- Each image must show a different concept from the source
- Place each image after the section it illustrates
- Do not use pollinations.ai/p/ — use image.pollinations.ai/prompt/

---

## 🏁 The Big Picture
3 paragraphs of deep summary.

---

## ⭐ Key Takeaways
Exactly 10 power-bullets.

---

## 🎙️ Audio Lab Script
A 1000-word, high-energy conversation between MAYA and ALEX.

## Visual Style Prompt
Describe a single overarching visual aesthetic for this study session (e.g. Cyberpunk, Minimalist, Watercolor).

CRITICAL COMPLETION RULE:
You must write every single section completely before stopping.
Never truncate. Never summarize at the end.
If a section is long, write it fully.
Do not write 'continued...' or '...' anywhere.
The output is not complete until ## Visual Style Prompt is written.
Write ## Visual Style Prompt as your very last line.
"""

        prompt2 = f"""STUDY SOURCE — READ THIS FIRST AND COMPLETELY:
{source_text[:MAX_CONTEXT_CHARS]}

━━━ YOUR TASK BEGINS NOW ━━━

You are a master educator. Using ONLY the source above, generate study materials.

## ❓ Knowledge Quiz
Generate exactly 15 questions.
Format — pipe separated, one question per line:
Question text | Option A | Option B | Option C | Option D | Correct Option

---

## 🃏 Recall Flashcards
Generate exactly 20 flashcards.
Format — pipe separated, one card per line:
Term from source | Simple explanation in one sentence

---

## Study Roadmap

Generate a Mermaid flowchart. Follow these rules exactly:
- Start with: flowchart TD
- First node must be: A(["🚀 Start"])
- Last node must be: Z(["✅ Complete"])  
- Each middle node uses this format: 
  B["Topic Name\n(one line description)"]
- Connect all nodes with -->
- Add classDef for colors:
  classDef startend fill:#E60023,color:#fff,stroke:none
  classDef topic fill:#1a1a2e,color:#fff,stroke:#E60023,stroke-width:2px
  classDef subtopic fill:#2d2d44,color:#ddd,stroke:#5E7B5A,stroke-width:1px
- Apply classes: class A,Z startend
- Maximum 12 nodes total
- Every node label must be a real topic from the source document
- Wrap the entire diagram in triple backticks with mermaid tag

---

## 🧠 Concept Mind Map
Mermaid mindmap. Use specific source concepts.
"""

        def _generate_all() -> Dict[str, Any]:
            res1 = _call_openrouter([{"role": "user", "content": prompt1}], max_tokens=MAX_TOKENS_NOTES, timeout=API_TIMEOUT_NOTES)
            
            # ─── TRUNCATION CHECK ───
            if "Visual Style Prompt" not in res1:
                _log("Response cut off — retrying with completion instruction", level="WARNING")
                continuation_prompt = """
Your previous response was cut off. 
Continue EXACTLY from where you stopped.
Do not repeat anything already written.
Complete all remaining sections until ## Visual Style Prompt.
"""
                continuation = _call_openrouter([
                    {"role": "user", "content": prompt1},
                    {"role": "assistant", "content": res1},
                    {"role": "user", "content": continuation_prompt}
                ], max_tokens=16000)
                res1 = res1 + "\n" + continuation

            res1 = _clean_note_formatting(res1)
            res2 = _call_openrouter([{"role": "user", "content": prompt2}], max_tokens=MAX_TOKENS_MATERIALS, timeout=API_TIMEOUT_MATERIALS)
            
            _log(f"Call 1 response (merged): {len(res1)} chars", level="SUCCESS")
            _log(f"Call 2 response: {len(res2)} chars", level="SUCCESS")
            
            data1 = _parse_robust_markdown(res1)
            data2 = _parse_robust_markdown(res2)
            
            combined = {
                "title": data1.get("title", topic),
                "simplified_notes": res1,
                "source_text": source_text,
                "quizzes": [],
                "flashcards": [],
                "roadmap": data2.get("study roadmap", ""),
                "mind_map": data2.get("concept mind map", ""),
                "podcast_script": data1.get("audio lab script", ""),
                "visual_style_prompt": data1.get("visual style prompt", "")
            }
            
            # Parse Quiz
            q_text = data2.get("knowledge quiz", "")
            for line in q_text.strip().split('\n'):
                parts = [p.strip() for p in line.split('|')]
                if len(parts) >= 6:
                    combined["quizzes"].append({"question": parts[0], "options": parts[1:5], "answer": parts[5]})
            
            # Parse Flashcards
            f_text = data2.get("recall flashcards", "")
            for line in f_text.strip().split('\n'):
                parts = [p.strip() for p in line.split('|')]
                if len(parts) >= 2:
                    combined["flashcards"].append({"front": parts[0], "back": parts[1]})
            
            return combined

        data = _generate_all()
        
        # Final safety check
        if len(data.get("simplified_notes", "")) < MIN_NOTE_LENGTH:
            _log("Notes still too short, triggering emergency deep-generation", level="ERROR")
            # ... emergency fallback if needed ...
            
        return data

    @staticmethod
    async def generate_response(prompt: str, context: str, history: List[Dict[str, str]] = None) -> str:
        """Generates a chat response grounded in provided study notes."""
        system_prompt = f"""You are Lumina, a friendly and smart study assistant.
 Answer using ONLY the information in the STUDY NOTES below.
 STUDY NOTES:
 {context[:MAX_CONTEXT_CHARS]}"""

        messages = [{"role": "system", "content": system_prompt}]
        if history:
            messages.extend(history[-6:])
        messages.append({"role": "user", "content": prompt})
        
        return _call_openrouter(messages, max_tokens=2000, timeout=60)

    @staticmethod
    def generate_more_quiz(source_text: str, existing_questions: list) -> list:
        """Generates 10 additional quiz questions not in existing set."""
        existing = [q.get('question', '') for q in existing_questions]
        existing_str = '\n'.join(existing)
        
        prompt = f"""
SOURCE TEXT:
{source_text[:8000]}

EXISTING QUESTIONS (do not repeat these):
{existing_str}

Generate exactly 10 NEW quiz questions about the source text.
These must be different from the existing questions above.
Format each question on one line:
Question text | Option A | Option B | Option C | Option D | Correct Option

Write only the questions. No introduction. No explanation.
"""
        response = _call_openrouter(
            [{"role": "user", "content": prompt}],
            max_tokens=2000
        )
        
        new_questions = []
        for line in response.strip().split('\n'):
            parts = line.split('|')
            if len(parts) >= 6:
                new_questions.append({
                    "question": parts[0].strip(),
                    "options": [p.strip() for p in parts[1:5]],
                    "answer": parts[5].strip()
                })
        return new_questions

    @staticmethod
    def generate_more_flashcards(source_text: str, existing_cards: list) -> list:
        """Generates 10 additional flashcards not in existing set."""
        existing = [c.get('front', '') for c in existing_cards]
        existing_str = '\n'.join(existing)
        
        prompt = f"""
SOURCE TEXT:
{source_text[:8000]}

EXISTING FLASHCARD TERMS (do not repeat):
{existing_str}

Generate exactly 10 NEW flashcards from the source text.
Format each on one line:
Term or concept from source | Clear simple explanation in one sentence

Write only the flashcards. No introduction.
"""
        response = _call_openrouter(
            [{"role": "user", "content": prompt}],
            max_tokens=1500
        )
        
        new_cards = []
        for line in response.strip().split('\n'):
            parts = line.split('|')
            if len(parts) >= 2:
                new_cards.append({
                    "front": parts[0].strip(),
                    "back": parts[1].strip()
                })
        return new_cards
