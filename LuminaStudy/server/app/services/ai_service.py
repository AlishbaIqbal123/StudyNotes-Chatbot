"""
AI Service — uses OpenRouter to call Google Gemini 2.0 Flash.

IMPORTANT: This module reads OPENROUTER_API_KEY lazily (inside functions)
so it works correctly even when dotenv is loaded after Python starts.
"""
import os
import requests
import json
import re
from typing import Dict

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
MODEL = "google/gemini-2.0-flash-001"


def _get_headers() -> dict:
    """Read the API key fresh every call (supports late dotenv loading)."""
    api_key = os.getenv("OPENROUTER_API_KEY", "")
    if not api_key:
        raise RuntimeError(
            "OPENROUTER_API_KEY is not set. "
            "Please add it to LuminaStudy/server/.env"
        )
    return {
        "Authorization": f"Bearer {api_key}",
        "HTTP-Referer": "https://luminastudy.app",
        "X-Title": "LuminaStudy",
        "Content-Type": "application/json",
    }


def _call_openrouter(messages: list) -> str:
    """Shared helper — calls the OpenRouter completions endpoint."""
    response = requests.post(
        url=OPENROUTER_URL,
        headers=_get_headers(),
        json={"model": MODEL, "messages": messages},
        timeout=90,
    )
    # Surface useful error details
    if not response.ok:
        body = response.text[:400]
        raise RuntimeError(
            f"OpenRouter API error {response.status_code}: {body}"
        )
    return response.json()["choices"][0]["message"]["content"]


def _extract_json(text: str) -> dict:
    """
    Robustly extract a JSON object from a string that may contain
    markdown fences or surrounding prose.
    """
    # 1. Strip code fences like ```json ... ```
    text = re.sub(r"```(?:json)?\s*", "", text).strip().rstrip("`").strip()

    # 2. Try direct parse first (ideal case)
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    # 3. Balanced-brace scan to find the first complete JSON object
    brace_depth = 0
    start = None
    for i, ch in enumerate(text):
        if ch == "{":
            if start is None:
                start = i
            brace_depth += 1
        elif ch == "}":
            brace_depth -= 1
            if brace_depth == 0 and start is not None:
                candidate = text[start: i + 1]
                try:
                    return json.loads(candidate)
                except json.JSONDecodeError:
                    # Reset and keep scanning
                    start = None

    raise ValueError(f"No valid JSON object found in AI response. Preview: {text[:200]}")


class AIService:

    @staticmethod
    async def generate_response(prompt: str, context: str = "") -> str:
        """Context-aware Q&A chat."""
        messages = []
        if context.strip():
            messages.append({
                "role": "system",
                "content": (
                    "You are Lumina, a warm, expert AI study assistant. "
                    "Answer questions helpfully and concisely based on the provided study material. "
                    f"\n\n--- Study Content ---\n{context[:6000]}"
                ),
            })
        messages.append({"role": "user", "content": prompt})

        try:
            return _call_openrouter(messages)
        except Exception as e:
            print(f"[AIService.generate_response] Error: {e}")
            return "Unable to connect to the AI right now. Please retry in a moment."

    @staticmethod
    async def process_document(text: str) -> Dict:
        """
        Generates a premium, high-fidelity study package from raw text.
        Produces detailed (2000+ words), authentic, and easy-to-understand notes
        with embedded visual diagrams, a strategic roadmap, and a mind map.
        """
        prompt = f"""You are the lead content designer at Lumina Atelier, an expert academic tutor.

Analyze the provided text and curate an ultra-detailed, authentic study exhibit. 
YOUR GOAL: Produce a high-density learning experience that feels like it was written by a human expert who has cross-referenced the best academic sources globally.

CONSTRAINTS:
- Return ONLY a raw JSON object — no markdown fences, no commentary.
- Properly escape all special characters inside string values.
- "simplified_notes" MUST be extremely detailed (approx 2000 words). 
- In "simplified_notes", use rich Markdown: # Title, ## Subheadings, **Bold** concepts, and > Blockquotes for key insights.
- **AUTHENTICITY**: Ensure the tone is academic yet accessible. Deep dive into the "why" and "how", not just the "what".
- **SIMPLICITY**: Use easy-to-understand wording while maintaining technical depth.
- **IMAGES**: EMBED AT LEAST 5 HIGH-QUALITY IMAGES within the "simplified_notes" using this syntax:
  ![Visual](https://pollinations.ai/p/DETAILED_DESCRIPTIVE_PROMPT?width=1000&height=600&model=flux&nologo=true)
- **DIAGRAMS**: Include at least 2 Mermaid.js diagrams (concept maps or timelines) inside "simplified_notes" using ```mermaid blocks.
- **STRATEGIC ROADMAP**: Provide a "roadmap_mermaid" field with a Mermaid-formatted 'gantt' or 'graph TD' showing a step-by-step study plan for this topic.
- **CONCEPT MIND MAP**: Provide a "mind_map_mermaid" field with a Mermaid-formatted 'mindmap' or 'graph LR' showing the relationship between core concepts.

Return exactly this JSON shape:
{{
  "title": "Specific, sophisticated academic title",
  "simplified_notes": "A massive, multi-section Markdown document. Include deep-dives. Embed images and mermaid diagrams as requested.",
  "quizzes": [
    {{ "question": "Deep comprehension question", "options": ["A", "B", "C", "D"], "answer": "A" }}
  ],
  "flashcards": [
    {{ "front": "Complex concept", "back": "Detailed, easy-to-understand breakdown" }}
  ],
  "roadmap_mermaid": "Mermaid code for a study roadmap graph/gantt",
  "mind_map_mermaid": "Mermaid code for a concept mind map",
  "podcast_script": "A sophisticated, engaging auditory synthesis.",
  "visual_prompt": "A single, stunning cinematic hero illustration prompt."
}}

TEXT TO ANALYZE:
{text[:12000]}
"""
        try:
            raw = _call_openrouter([{"role": "user", "content": prompt}])
            print(f"[AIService.process_document] Response length: {len(raw)} chars")
            data = _extract_json(raw)

            return {
                "title": data.get("title", "Study Session"),
                "simplified_notes": data.get("simplified_notes") or data.get("notes", "*No notes available.*"),
                "quizzes": data.get("quizzes", []),
                "flashcards": data.get("flashcards", []),
                "roadmap": data.get("roadmap_mermaid", ""),
                "mind_map": data.get("mind_map_mermaid", ""),
                "podcast_script": data.get("podcast_script", ""),
                "visual_prompt": data.get("visual_prompt") or data.get("title", "educational concept art"),
            }

        except RuntimeError as e:
            # API-level error — surface to the client
            print(f"[AIService.process_document] API Error: {e}")
            raise  # Re-raise so the HTTP endpoint returns a proper 500

        except Exception as e:
            print(f"[AIService.process_document] Parse/other error: {e}")
            return {
                "title": "Processing Error",
                "simplified_notes": (
                    "# Processing Failed\n\n"
                    f"**Error:** {str(e)}\n\n"
                    "Please try again with different or shorter content."
                ),
                "quizzes": [],
                "flashcards": [],
                "podcast_script": "",
                "visual_prompt": "abstract error glitch art",
            }
