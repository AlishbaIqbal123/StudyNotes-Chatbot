# hf_final_deploy/app/services/ai_service.py
# v3: Notes are PURE notes (no quiz/flashcard contamination), rich diagrams + images
import os
import re
import json
import requests
from typing import Dict, List, Any

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
MAX_RAW_CHARS = 30000

# Model cascade — tried in order until one succeeds
# Free models first, paid as last resort
DOC_MODELS = [
    "meta-llama/llama-3.3-70b-instruct:free",  # Highly accurate 70B model, free
    "openai/gpt-oss-120b:free",          # Free, 200k ctx, excellent quality
    "nvidia/nemotron-3-super-120b-a12b:free",  # Free, 262k ctx
    "openai/gpt-oss-20b:free",           # Free, fast fallback
    "google/gemini-2.5-pro-preview",     # Paid fallback — only if all free fail
]

CHAT_MODELS = [
    "meta-llama/llama-3.3-70b-instruct:free",  # Highly accurate 70B model, free
    "openai/gpt-oss-120b:free",          # Free, great for chat
    "openai/gpt-oss-20b:free",           # Free fallback
    "nvidia/nemotron-3-super-120b-a12b:free",  # Free fallback
    "google/gemini-2.0-flash-001",       # Paid last resort
]

PRIMARY_MODEL = DOC_MODELS[0]  # Used by _call_openrouter default

VALID_MERMAID_KEYWORDS = (
    "flowchart", "graph", "mindmap", "sequenceDiagram",
    "classDiagram", "stateDiagram", "erDiagram", "gantt", "pie"
)


class AIServiceError(Exception):
    pass


def _validate_mermaid(diagram: str) -> str:
    clean = diagram.strip()
    if not clean:
        return ""
    if any(clean.startswith(kw) for kw in VALID_MERMAID_KEYWORDS):
        return clean
    for kw in VALID_MERMAID_KEYWORDS:
        idx = clean.find(kw)
        if idx != -1:
            return clean[idx:]
    print(f"[LUMINA] WARNING: Invalid mermaid discarded: {clean[:60]}")
    return ""


def _call_openrouter(messages: List[Dict], model: str = PRIMARY_MODEL, max_tokens: int = 12000) -> str:
    """Call a single model. Raises AIServiceError on any failure."""
    api_key = os.getenv("OPENROUTER_API_KEY", "")
    if not api_key:
        raise AIServiceError("OPENROUTER_API_KEY is not configured.")
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://lumina-atelier.com",
        "X-Title": "Lumina Atelier"
    }
    payload = {"model": model, "messages": messages, "temperature": 0.3, "max_tokens": max_tokens}
    print(f"[LUMINA] Calling {model} | max_tokens={max_tokens}")
    try:
        r = requests.post(OPENROUTER_URL, headers=headers, json=payload, timeout=180)
        if r.status_code == 429:
            raise AIServiceError(f"RATE_LIMIT_429: {model}")
        if r.status_code == 402:
            raise AIServiceError(f"PAYMENT_REQUIRED_402: {model}")
        if r.status_code == 400:
            raise AIServiceError(f"BAD_REQUEST_400: {r.text[:100]}")
        if r.status_code == 404:
            raise AIServiceError(f"MODEL_NOT_FOUND_404: {model}")
        r.raise_for_status()
        content = r.json().get("choices", [{}])[0].get("message", {}).get("content", "")
        if not content or len(content.strip()) < 10:
            raise AIServiceError(f"EMPTY_RESPONSE: {model}")
        print(f"[LUMINA] {model} → {len(content)} chars")
        return content
    except AIServiceError:
        raise
    except requests.exceptions.Timeout:
        raise AIServiceError(f"TIMEOUT: {model}")
    except Exception as e:
        raise AIServiceError(f"REQUEST_FAILED: {model}: {e}")


def _call_cascade(messages: List[Dict], models: List[str], max_tokens: int = 12000) -> str:
    """Try each model in order until one succeeds. Only propagates RATE_LIMIT_EXCEEDED."""
    last_error = None
    for model in models:
        try:
            return _call_openrouter(messages, model=model, max_tokens=max_tokens)
        except AIServiceError as e:
            err = str(e)
            # Hard stop on true rate limit (all models exhausted quota)
            if "RATE_LIMIT_EXCEEDED" in err and "RATE_LIMIT_429" not in err:
                raise
            print(f"[LUMINA] Model {model} failed ({err[:60]}), trying next...")
            last_error = e
            continue
    raise AIServiceError(f"All models failed. Last error: {last_error}")


def _stream_openrouter(messages: List[Dict], model: str):
    """Stream response from a single model on OpenRouter."""
    api_key = os.getenv("OPENROUTER_API_KEY", "")
    if not api_key:
        yield f"data: {json.dumps({'error': 'COMMUNICATION_ERROR', 'message': 'API key missing'})}\n\n"
        return
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://lumina-atelier.com",
        "X-Title": "Lumina Atelier"
    }
    payload = {"model": model, "messages": messages, "temperature": 0.3, "max_tokens": 2000, "stream": True}
    print(f"[LUMINA] Stream calling {model}")
    try:
        r = requests.post(OPENROUTER_URL, headers=headers, json=payload, timeout=120, stream=True)
        if r.status_code != 200:
            raise AIServiceError(f"HTTP_ERROR_{r.status_code}")
        for line in r.iter_lines():
            if not line:
                continue
            decoded_line = line.decode('utf-8').strip()
            if decoded_line.startswith("data: "):
                data_str = decoded_line[6:].strip()
                if data_str == "[DONE]":
                    yield f"data: {json.dumps({'done': True})}\n\n"
                    break
                try:
                    chunk_json = json.loads(data_str)
                    choices = chunk_json.get("choices", [])
                    if choices:
                        delta = choices[0].get("delta", {})
                        content = delta.get("content", "")
                        if content:
                            yield f"data: {json.dumps({'token': content})}\n\n"
                except:
                    pass
    except Exception as e:
        raise AIServiceError(f"Stream failed for {model}: {e}")


def _stream_cascade(messages: List[Dict], models: List[str]):
    """Stream from each model in order, cascading to the next if connection fails before yielding tokens."""
    last_error = None
    for model in models:
        try:
            generator = _stream_openrouter(messages, model=model)
            # Peek at the first token to make sure connection is successful
            first_item = next(generator)
            yield first_item
            for item in generator:
                yield item
            return
        except (AIServiceError, StopIteration) as e:
            print(f"[LUMINA] Stream model {model} failed ({str(e)[:60]}), trying next...")
            last_error = e
            continue
    yield f"data: {json.dumps({'error': 'COMMUNICATION_ERROR', 'message': str(last_error)})}\n\n"


def _fetch_educational_images(topic: str) -> List[Dict]:
    images = []
    try:
        r = requests.get(
            f"https://en.wikipedia.org/w/api.php?action=query&titles={topic.replace(' ','_')}"
            f"&prop=pageimages&format=json&pithumbsize=800&pilimit=3",
            timeout=8
        )
        for page in r.json().get("query", {}).get("pages", {}).values():
            src = page.get("thumbnail", {}).get("source", "")
            if src:
                images.append({"url": src, "alt": f"{topic}", "caption": f"{topic} — Wikipedia"})
    except Exception as e:
        print(f"[LUMINA] Wiki image failed: {e}")

    try:
        r = requests.get(
            f"https://commons.wikimedia.org/w/api.php?action=query&list=search"
            f"&srsearch={topic}&srnamespace=6&format=json&srlimit=4",
            timeout=8
        )
        for item in r.json().get("query", {}).get("search", [])[:4]:
            title = item.get("title", "").replace("File:", "").replace(" ", "_")
            if title:
                images.append({
                    "url": f"https://commons.wikimedia.org/wiki/Special:FilePath/{title}?width=800",
                    "alt": item.get("title", topic).replace("File:", "").replace("_", " "),
                    "caption": item.get("title", topic).replace("File:", "").replace("_", " ")
                })
    except Exception as e:
        print(f"[LUMINA] Commons failed: {e}")

    if len(images) < 3:
        images += [
            {"url": "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?q=80&w=800", "alt": "Study", "caption": "Academic Study"},
            {"url": "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?q=80&w=800", "alt": "Books", "caption": "Knowledge"},
            {"url": "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=800", "alt": "Technology", "caption": "Digital Learning"},
        ]
    print(f"[LUMINA] Images ready: {len(images)}")
    return images[:6]


def _compress_source(text: str) -> str:
    if len(text) <= MAX_RAW_CHARS:
        return text
    print(f"[LUMINA] Compressing {len(text)} chars...")
    chunks = [text[i:i+12000] for i in range(0, len(text), 12000)]
    summaries = []
    for i, chunk in enumerate(chunks[:4]):
        msg = [
            {"role": "system", "content": "Extract ALL key facts, definitions, statistics, names, dates, examples, and technical terms. Preserve headings. Output as structured bullet points."},
            {"role": "user", "content": chunk}
        ]
        summaries.append(_call_cascade(msg, DOC_MODELS, max_tokens=4000))
    return "\n\n---SECTION BREAK---\n\n".join(summaries)


# ─────────────────────────────────────────────────────────────────────────────
# STAGE 1: PURE DETAILED NOTES — NO quiz, NO flashcards, NO podcast
# ─────────────────────────────────────────────────────────────────────────────
def _generate_notes(compressed: str, image_md: str, images: list) -> str:
    # Build numbered image references so AI can use real URLs
    image_refs = ""
    if images:
        image_refs = "\n".join([
            f"IMAGE_{i+1}: ![{img['alt']}]({img['url']})"
            for i, img in enumerate(images[:6]) if img.get("url")
        ])
    else:
        image_refs = "No images available — skip image embedding."

    prompt = """You are a world-class academic educator. Write a COMPLETE, DETAILED, BEAUTIFULLY FORMATTED study guide.
 
SOURCE DOCUMENT (your ONLY source of truth — never invent facts):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{compressed}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 
REAL IMAGE URLS TO EMBED (use these exact markdown lines in the notes):
{image_refs}
 
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CRITICAL RULES — FOLLOW EXACTLY:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. OUTPUT ONLY STUDY NOTES. ABSOLUTELY NO quiz questions, NO flashcards, NO podcast scripts.
2. Cover EVERY concept, example, and case study from the source. Be EXTREMELY thorough and comprehensive: write dense, detailed paragraphs explaining concepts fully. Do not write brief high-level summaries.
3. Use RICH markdown: ## headings, ### sub-headings, **bold** key terms, > blockquotes, tables, bullet lists.
4. Embed at least 4 Mermaid diagrams directly inside the notes at relevant sections.
5. Embed at least 3 of the provided IMAGE URLs inline using the exact markdown lines given above.
6. NEVER use filler phrases: "in conclusion", "it is important to note", "as mentioned above", "herein".
7. MAKE EXPLANATIONS EASY TO UNDERSTAND: Define every technical term step-by-step with a plain-English analogy and real-world example on first use. Explain the 'why' and 'how' behind concepts simply.
8. Mermaid diagrams MUST use this safe syntax:
   - Node IDs: simple alphanumeric only (A, B, Node1)
   - Labels: always in double quotes: A["Label Text"]
   - Connectors: A --> B or A -->|"label"| B  (NEVER use --["label"]-->)
   - No special characters (parentheses, braces, brackets) inside node labels, even if double-quoted. (e.g. use A["Step One"] instead of A["Step (1)"])
   - Use style commands at the end of the diagram to style node classes in Royal Blue and Gold theme colors.
 
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EXACT OUTPUT FORMAT:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 
# [Specific compelling title from the source]
 
> 📖 **Overview:** [2-3 sentences on the core theme and why it matters]
 
---
 
## [Topic 1 Name from Source]
 
> 💡 **In Simple Words:** [One plain-English sentence explaining this topic in the simplest possible terms]
> 🧩 **Everyday Analogy:** [A simple, relatable analogy comparing this concept to something common in daily life]
 
[2-3 detailed paragraphs with examples from the source. **Bold** key terms on first use. Explain nuances thoroughly.]
 
### 🔑 Key Points
- **[Term]**: [Definition + real-world analogy]
- **[Term]**: [Definition + real-world analogy]
- **[Term]**: [Definition + real-world analogy]
 
> 🔍 **Deep Insight:** [Critical distinction or surprising fact from the source]
 
### 📊 Comparison Table
| Aspect | Option A | Option B |
|--------|----------|----------|
| [row] | [val] | [val] |
| [row] | [val] | [val] |
 
### 🗺️ Process Diagram
 
```mermaid
flowchart LR
    A["Step 1"] --> B["Step 2"]
    B --> C["Step 3"]
    C --> D["Outcome"]
    style A fill:#1E3A8A,color:#fff,stroke:#F59E0B,stroke-width:2px
    style B fill:#1F2937,color:#fff,stroke:#1E3A8A,stroke-width:1px
    style C fill:#F59E0B,color:#1E3A8A,stroke:#1E3A8A,stroke-width:2px
    style D fill:#1E3A8A,color:#fff,stroke:#F59E0B,stroke-width:2px
```
 
[EMBED ONE OF THE PROVIDED IMAGE URLS HERE — copy the exact markdown line from the REAL IMAGE URLS section above]
 
> 💡 **Key Takeaway:** [Most important fact from this section in one sentence]
 
---
 
[REPEAT THE ABOVE BLOCK FOR EVERY MAJOR TOPIC IN THE SOURCE — do not skip any topic]
 
---
 
## 📋 Quick Reference Summary
 
| Concept | Plain English | Real Example |
|---------|--------------|--------------|
| [term from source] | [simple definition] | [real example] |
| [term from source] | [simple definition] | [real example] |
| [term from source] | [simple definition] | [real example] |
| [term from source] | [simple definition] | [real example] |
| [term from source] | [simple definition] | [real example] |
 
---
 
## 🎯 Key Takeaways
 
- [Most important point 1 from source]
- [Most important point 2 from source]
- [Most important point 3 from source]
- [Most important point 4 from source]
- [Most important point 5 from source]
"""[5:-1].replace("{compressed}", compressed).replace("{image_refs}", image_refs)
    print("[LUMINA] Generating NOTES (pure notes, real image URLs, safe Mermaid)...")
    return _call_cascade([{"role": "user", "content": prompt}], DOC_MODELS, max_tokens=14000)


# ─────────────────────────────────────────────────────────────────────────────
# STAGE 2: QUIZ ONLY — completely separate from notes
# ─────────────────────────────────────────────────────────────────────────────
def _generate_quiz(compressed: str) -> str:
    prompt = f"""Generate 20 multiple-choice quiz questions from this source.

SOURCE:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{compressed}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

RULES:
- Each question tests a SPECIFIC fact from the source.
- One correct answer, three plausible wrong answers.
- Output EXACTLY 20 lines, nothing else.
- Format: Question | OptionA | OptionB | OptionC | OptionD | CorrectLetter

Example:
What is the capital of France? | London | Paris | Berlin | Madrid | B
"""
    print("[LUMINA] Generating QUIZ...")
    return _call_cascade([{"role": "user", "content": prompt}], DOC_MODELS, max_tokens=4000)


# ─────────────────────────────────────────────────────────────────────────────
# STAGE 3: FLASHCARDS ONLY — completely separate from notes
# ─────────────────────────────────────────────────────────────────────────────
def _generate_flashcards(compressed: str) -> str:
    prompt = f"""Generate 25 flashcards from this source.

SOURCE:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{compressed}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

RULES:
- Front = exact term or short phrase from source.
- Back = simple one-sentence explanation (max 20 words).
- Output EXACTLY 25 lines, nothing else.
- Format: Term | Definition

Example:
Photosynthesis | Process where plants convert sunlight into glucose using carbon dioxide and water.
"""
    print("[LUMINA] Generating FLASHCARDS...")
    return _call_cascade([{"role": "user", "content": prompt}], DOC_MODELS, max_tokens=3000)


# ─────────────────────────────────────────────────────────────────────────────
# STAGE 4: DIAGRAMS — roadmap + mindmap
# ─────────────────────────────────────────────────────────────────────────────
def _generate_diagrams(compressed: str) -> str:
    prompt = f"""Create two Mermaid.js diagrams for this source.

SOURCE:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{compressed}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

OUTPUT EXACTLY:

## [Study Roadmap]

```mermaid
flowchart TD
    A["Topic 1"] --> B["Topic 2"]
    B --> C["Topic 3"]
    C --> D["Topic 4"]
    D --> E["Topic 5"]
    E --> F["Topic 6"]
    classDef start fill:#10b981,stroke:#059669,color:#fff,stroke-width:2px
    classDef mid fill:#6366f1,stroke:#4f46e5,color:#fff,stroke-width:1px
    classDef end fill:#f59e0b,stroke:#d97706,color:#fff,stroke-width:2px
    class A start
    class B,C,D,E mid
    class F end
```

## [Concept Mind Map]

```mermaid
mindmap
  root((Main Topic))
    Section1
      Detail1
      Detail2
    Section2
      Detail1
      Detail2
    Section3
      Detail1
    Section4
      Detail1
```

RULES: Use only topics from source. Short labels (max 5 words). No special chars in node IDs.
"""
    print("[LUMINA] Generating DIAGRAMS...")
    return _call_cascade([{"role": "user", "content": prompt}], DOC_MODELS, max_tokens=3000)


# ─────────────────────────────────────────────────────────────────────────────
# STAGE 5: PODCAST SCRIPT
# ─────────────────────────────────────────────────────────────────────────────
def _generate_podcast(compressed: str) -> str:
    prompt = f"""Write an engaging podcast script from this source.

SOURCE:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{compressed}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Write a 600-800 word dialogue:
- MAYA: curious student with genuine questions
- ALEX: friendly expert who explains simply

RULES:
- ALEX uses ONLY facts from the source.
- At least 14 exchanges (7 each).
- Format every line: **MAYA:** text  or  **ALEX:** text
- No markdown inside the lines (no bold, no bullets).
"""
    print("[LUMINA] Generating PODCAST...")
    return _call_cascade([{"role": "user", "content": prompt}], DOC_MODELS, max_tokens=3000)


# ─────────────────────────────────────────────────────────────────────────────
# PARSERS
# ─────────────────────────────────────────────────────────────────────────────
def _parse_notes(text: str) -> Dict[str, Any]:
    title_match = re.search(r"^#(?!#)\s+(.*)", text, re.MULTILINE)
    title = title_match.group(1).strip() if title_match else "Study Session"
    return {"title": title, "simplified_notes": text.strip()}


def _parse_quiz(text: str) -> List[Dict]:
    quizzes = []
    for line in text.strip().split('\n'):
        line = line.strip()
        if not line or line.startswith(('|', '-', '#', '`', '=')):
            continue
        parts = [p.strip() for p in line.split('|')]
        if len(parts) >= 6 and parts[0] and len(parts[0]) > 5:
            quizzes.append({
                "question": parts[0],
                "options": parts[1:5],
                "answer": parts[5]
            })
    return quizzes


def _parse_flashcards(text: str) -> List[Dict]:
    cards = []
    for line in text.strip().split('\n'):
        line = line.strip()
        if not line or line.startswith(('|', '-', '#', '`', '=')):
            continue
        parts = [p.strip() for p in line.split('|')]
        if len(parts) >= 2 and parts[0] and parts[1] and len(parts[0]) > 2:
            cards.append({"front": parts[0], "back": parts[1]})
    return cards


def _parse_diagrams(text: str) -> Dict[str, Any]:
    data = {"roadmap": "", "mind_map": ""}
    sections = re.split(r'\n(?=##\s)', text)
    for section in sections:
        section = section.strip()
        lines = section.split('\n', 1)
        header = lines[0].lower() if lines else ""
        content = lines[1].strip() if len(lines) > 1 else ""
        clean = content.replace("```mermaid", "").replace("```", "").strip()
        if any(k in header for k in ['roadmap', 'study path', 'flow']):
            data["roadmap"] = _validate_mermaid(clean)
        elif any(k in header for k in ['mind map', 'mindmap', 'concept map']):
            data["mind_map"] = _validate_mermaid(clean)
    return data


def _parse_podcast(text: str) -> str:
    sections = re.split(r'\n(?=##\s)', text)
    for section in sections:
        lines = section.strip().split('\n', 1)
        header = lines[0].lower() if lines else ""
        content = lines[1].strip() if len(lines) > 1 else ""
        if any(k in header for k in ['audio', 'podcast', 'script', 'lab', 'dialogue']):
            return content
    return text.strip()


# ─────────────────────────────────────────────────────────────────────────────
# MAIN AI SERVICE
# ─────────────────────────────────────────────────────────────────────────────
class AIService:

    @staticmethod
    def process_document(
        text: str,
        topic: str = "General",
        source_type: str = "document",
        source_url: str = "",
        generation_type: str = "all"
    ) -> dict:
        print(f"[LUMINA] Processing | topic={topic} | type={generation_type} | chars={len(text)}")

        valid_types = {"all", "notes", "quiz", "flashcards", "podcast"}
        if generation_type not in valid_types:
            generation_type = "all"

        compressed = _compress_source(text)
        images = _fetch_educational_images(topic)
        image_md = "\n".join([
            f'![{img["alt"]}]({img["url"]})\n*{img["caption"]}*'
            for img in images if img.get("url")
        ])

        result: Dict[str, Any] = {
            "title": topic,
            "simplified_notes": "",
            "quizzes": [],
            "flashcards": [],
            "roadmap": "",
            "mind_map": "",
            "podcast_script": "",
            "visual_prompt": ""
        }

        # ── STAGE 1: Pure Notes ──────────────────────────
        if generation_type in ("all", "notes"):
            try:
                notes_raw = _generate_notes(compressed, image_md, images)
                notes_data = _parse_notes(notes_raw)
                result["title"] = notes_data["title"]
                notes_text = notes_data["simplified_notes"]

                # Inject images if AI didn't embed enough
                if images and notes_text.count("![") < 3:
                    inserts = [
                        f'\n\n![{img["alt"]}]({img["url"]})\n*{img["caption"]}*\n\n'
                        for img in images[:4] if img.get("url")
                    ]
                    parts = notes_text.split('\n\n')
                    out = []
                    img_i = 0
                    chars = 0
                    for part in parts:
                        out.append(part)
                        chars += len(part)
                        if img_i < len(inserts) and chars > 800 * (img_i + 1):
                            out.append(inserts[img_i])
                            img_i += 1
                    notes_text = '\n\n'.join(out)

                result["simplified_notes"] = notes_text
            except AIServiceError as e:
                if "RATE_LIMIT_EXCEEDED" in str(e):
                    raise
                print(f"[LUMINA] Notes failed: {e}")
                result["simplified_notes"] = f"# {topic}\n\n> Notes generation failed. Please try again.\n\n{text[:2000]}"

        # ── STAGE 2: Quiz ────────────────────────────────
        if generation_type in ("all", "quiz"):
            try:
                quiz_raw = _generate_quiz(compressed)
                result["quizzes"] = _parse_quiz(quiz_raw)
                print(f"[LUMINA] Quiz parsed: {len(result['quizzes'])} questions")
            except AIServiceError as e:
                if "RATE_LIMIT_EXCEEDED" in str(e):
                    raise
                print(f"[LUMINA] Quiz failed: {e}")

        # ── STAGE 3: Flashcards ──────────────────────────
        if generation_type in ("all", "flashcards"):
            try:
                fc_raw = _generate_flashcards(compressed)
                result["flashcards"] = _parse_flashcards(fc_raw)
                print(f"[LUMINA] Flashcards parsed: {len(result['flashcards'])} cards")
            except AIServiceError as e:
                if "RATE_LIMIT_EXCEEDED" in str(e):
                    raise
                print(f"[LUMINA] Flashcards failed: {e}")

        # ── STAGE 4: Diagrams ────────────────────────────
        if generation_type == "all":
            try:
                diag_raw = _generate_diagrams(compressed)
                diag_data = _parse_diagrams(diag_raw)
                result["roadmap"] = diag_data["roadmap"]
                result["mind_map"] = diag_data["mind_map"]
            except AIServiceError as e:
                if "RATE_LIMIT_EXCEEDED" in str(e):
                    raise
                print(f"[LUMINA] Diagrams failed: {e}")

        # ── STAGE 5: Podcast ─────────────────────────────
        if generation_type in ("all", "podcast"):
            try:
                pod_raw = _generate_podcast(compressed)
                result["podcast_script"] = _parse_podcast(pod_raw)
            except AIServiceError as e:
                if "RATE_LIMIT_EXCEEDED" in str(e):
                    raise
                print(f"[LUMINA] Podcast failed: {e}")

        print(f"[LUMINA] DONE | notes={len(result['simplified_notes'])}c | quiz={len(result['quizzes'])} | cards={len(result['flashcards'])}")
        return result

    @staticmethod
    def generate_more_quiz(source_text: str, existing_questions: List[Dict]) -> List[Dict]:
        compressed = _compress_source(source_text)
        existing_str = ""
        if existing_questions:
            existing_str = "\n".join([f"- {q.get('question')}" for q in existing_questions if q.get('question')])
        
        prompt = f"""Generate 10 NEW multiple-choice quiz questions from this source.
Do NOT repeat or duplicate any of the following existing questions:
{existing_str}

SOURCE:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{compressed}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

RULES:
- Each question tests a SPECIFIC fact from the source.
- One correct answer, three plausible wrong answers.
- Output EXACTLY 10 lines, nothing else.
- Format: Question | OptionA | OptionB | OptionC | OptionD | CorrectLetter
"""
        print("[LUMINA] Generating MORE QUIZ...")
        raw = _call_cascade([{"role": "user", "content": prompt}], DOC_MODELS, max_tokens=3000)
        return _parse_quiz(raw)

    @staticmethod
    def generate_more_flashcards(source_text: str, existing_cards: List[Dict]) -> List[Dict]:
        compressed = _compress_source(source_text)
        existing_str = ""
        if existing_cards:
            existing_str = "\n".join([f"- {c.get('front')}" for c in existing_cards if c.get('front')])
            
        prompt = f"""Generate 15 NEW flashcards from this source.
Do NOT repeat or duplicate any of the following existing terms/phrases:
{existing_str}

SOURCE:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{compressed}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

RULES:
- Front = exact term or short phrase from source.
- Back = simple one-sentence explanation (max 20 words).
- Output EXACTLY 15 lines, nothing else.
- Format: Term | Definition
"""
        print("[LUMINA] Generating MORE FLASHCARDS...")
        raw = _call_cascade([{"role": "user", "content": prompt}], DOC_MODELS, max_tokens=2500)
        return _parse_flashcards(raw)

    @staticmethod
    async def generate_response(prompt: str, context: str, history: List[Dict[str, str]] = None) -> str:
        messages = [{
            "role": "system",
            "content": (
                "You are Atelier, a world-class academic mentor. "
                "Help the student master the CONTEXT MATERIAL below.\n"
                "Use rich markdown. Be encouraging and precise.\n\n"
                f"CONTEXT:\n{context[:12000]}"
            )
        }]
        if history:
            for msg in history[-6:]:
                if isinstance(msg, dict) and "role" in msg and "content" in msg:
                    messages.append({"role": msg["role"], "content": str(msg["content"])})
        messages.append({"role": "user", "content": prompt})

        # Use chat cascade — free models first, paid as last resort
        return _call_cascade(messages, CHAT_MODELS, max_tokens=1500)

    @staticmethod
    def generate_response_stream(prompt: str, context: str, history: List[Dict[str, str]] = None):
        messages = [{
            "role": "system",
            "content": (
                "You are Lumina, a world-class academic mentor. "
                "Help the student master the CONTEXT MATERIAL below.\n"
                "Use rich markdown. Be encouraging and precise.\n\n"
                f"CONTEXT:\n{context[:12000]}"
            )
        }]
        if history:
            for msg in history[-6:]:
                if isinstance(msg, dict) and "role" in msg and "content" in msg:
                    messages.append({"role": msg["role"], "content": str(msg["content"])})
        messages.append({"role": "user", "content": prompt})

        return _stream_cascade(messages, CHAT_MODELS)
