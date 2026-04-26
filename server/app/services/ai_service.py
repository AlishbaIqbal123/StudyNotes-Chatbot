# server/app/services/ai_service.py
import os
import re
import requests
from typing import Dict, List, Any

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
MAX_RAW_CHARS = 30000

class AIServiceError(Exception):
    pass

# ─────────────────────────────────────────────
# CORE AI CALLER
# ─────────────────────────────────────────────
def _call_openrouter(messages: List[Dict], model: str = "google/gemini-2.0-flash-001", max_tokens: int = 12000) -> str:
    headers = {
        "Authorization": f"Bearer {os.getenv('OPENROUTER_API_KEY')}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://lumina-atelier.com",
        "X-Title": "Lumina Atelier"
    }
    payload = {
        "model": model,
        "messages": messages,
        "temperature": 0.3,
        "max_tokens": max_tokens
    }
    print(f"[LUMINA] Calling model: {model} | max_tokens={max_tokens}")
    try:
        r = requests.post(OPENROUTER_URL, headers=headers, json=payload, timeout=120)
        r.raise_for_status()
        content = r.json()["choices"][0]["message"]["content"]
        if not content or len(content.strip()) < 20:
            raise AIServiceError("AI returned empty response. Check API key.")
        print(f"[LUMINA] Response received: {len(content)} chars")
        return content
    except Exception as e:
        raise AIServiceError(f"OpenRouter call failed: {e}")

# ─────────────────────────────────────────────
# SMART IMAGE FETCHER (Wikipedia / Wikimedia)
# ─────────────────────────────────────────────
def _fetch_educational_images(topic: str) -> List[Dict]:
    """Fetch real educational images from Wikipedia for the topic."""
    images = []
    try:
        clean_topic = topic.replace(" ", "_")
        wiki_url = (
            f"https://en.wikipedia.org/w/api.php"
            f"?action=query&titles={clean_topic}&prop=pageimages|images"
            f"&format=json&pithumbsize=600&pilimit=3"
        )
        r = requests.get(wiki_url, timeout=10)
        pages = r.json().get("query", {}).get("pages", {})
        for page in pages.values():
            thumb = page.get("thumbnail", {})
            if thumb.get("source"):
                images.append({
                    "url": thumb["source"],
                    "alt": f"{topic} - Wikipedia",
                    "caption": f"Educational diagram: {topic}"
                })
    except Exception as e:
        print(f"[LUMINA] Wikipedia image fetch failed: {e}")

    # Supplement with Wikimedia Commons search
    try:
        commons_url = (
            f"https://commons.wikimedia.org/w/api.php"
            f"?action=query&list=search&srsearch={topic}&srnamespace=6"
            f"&format=json&srlimit=3"
        )
        r = requests.get(commons_url, timeout=10)
        results = r.json().get("query", {}).get("search", [])
        for item in results[:3]:
            title = item.get("title", "").replace("File:", "").replace(" ", "_")
            img_url = f"https://commons.wikimedia.org/wiki/Special:FilePath/{title}?width=600"
            images.append({
                "url": img_url,
                "alt": item.get("title", topic),
                "caption": item.get("title", topic).replace("File:", "").replace("_", " ")
            })
    except Exception as e:
        print(f"[LUMINA] Commons fetch failed: {e}")

    print(f"[LUMINA] Educational images found: {len(images)}")
    
    # PREMIUM FALLBACKS for E-Commerce/Business topics
    if not images or len(images) < 2:
        fallbacks = [
            {"url": "https://images.unsplash.com/photo-1556742044-3c52d6e88c62?q=80&w=800", "alt": "Digital Payments", "caption": "Secure E-commerce Transaction Systems"},
            {"url": "https://images.unsplash.com/photo-1563013544-824ae1b704d3?q=80&w=800", "alt": "Online Shopping", "caption": "Mobile Commerce & Digital Consumerism"},
            {"url": "https://images.unsplash.com/photo-1557821552-17105176677c?q=80&w=800", "alt": "E-commerce Logistics", "caption": "Global Supply Chain & Logistics Operations"},
            {"url": "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=800", "alt": "Business Analytics", "caption": "Digital Market Analysis & Data Density"}
        ]
        images.extend(fallbacks)

    return images[:6]

# ─────────────────────────────────────────────
# SMART SOURCE COMPRESSION
# ─────────────────────────────────────────────
def _compress_source(text: str) -> str:
    if len(text) <= MAX_RAW_CHARS:
        return text
    print(f"[LUMINA] Compressing {len(text)} chars into chunks...")
    chunks = [text[i:i+12000] for i in range(0, len(text), 12000)]
    summaries = []
    for i, chunk in enumerate(chunks[:4]):  # max 4 chunks
        print(f"[LUMINA] Summarizing chunk {i+1}/{min(len(chunks),4)}...")
        msg = [
            {"role": "system", "content": "Extract ALL key facts, definitions, statistics, names, dates, examples, and technical terms from this text. Preserve headings. Do not omit anything important. Output as structured bullet points."},
            {"role": "user", "content": chunk}
        ]
        summaries.append(_call_openrouter(msg, max_tokens=4000))
    return "\n\n---SECTION BREAK---\n\n".join(summaries)

# ─────────────────────────────────────────────
# CALL 1: DETAILED NOTES
# ─────────────────────────────────────────────
def _generate_notes(compressed: str, image_md: str) -> str:
    prompt = f"""You are a world-class academic educator writing a complete, detailed study guide.

SOURCE DOCUMENT (your ONLY source of truth):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{compressed}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

AVAILABLE EDUCATIONAL IMAGES (embed naturally in the notes where relevant):
{image_md if image_md else "No images available."}

STRICT RULES:
1. ALL content MUST come from the SOURCE DOCUMENT. Never invent facts.
2. Write for a 16-year-old. Simple sentences. Max 20 words per sentence.
3. Define every technical term with a plain-English analogy on first use.
4. NEVER write filler phrases like "in conclusion", "it is important to note", "herein".
5. Every section must be COMPREHENSIVE — include EVERY concept, example, and case study (like Uber, Puma, etc.) from the source.
6. Use rich markdown: headings, bold terms, blockquotes, tables, bullet lists.
7. Embed educational images inline at relevant sections using: ![alt text](url)
8. **Focus Insight Section**: For each major topic, include a 'Focus Insight' callout box with a deep-dive fact or a critical distinction (e.g., E-commerce vs. E-business).

OUTPUT FORMAT — follow EXACTLY:

# [Create a compelling, specific title from the source content]

> 📖 **Overview:** [2-3 sentences summarizing the entire document's core theme]

---

[For EVERY major topic/section in the source, write the following block:]

## [Exact Topic Name from Source]

> 💡 **In Simple Words:** [One sentence explanation]

[Write 2 detailed paragraphs explaining the core concept.]

### 🚀 Key Components & Features
- [Point 1 with **Bold Term**]
- [Point 2 with **Bold Term**]
- [Point 3 with **Bold Term**]

> [!TIP]
> **Focus Insight:** [A deep-dive technical detail or critical distinction.]

### 📊 Comparative Analysis
| 🔍 Feature | 🛠 Implementation | 📈 Strategic Impact |
|---|---|---|
| [Concept A] | [How it works] | [Why it matters] |
| [Concept B] | [How it works] | [Why it matters] |

### 🛠 Process Flow / Architecture
```mermaid
graph LR
  A[Start] --> B[Process]
  B --> C[Outcome]
```

[Embed image here: ![description](url)]

> 🧠 **Key Takeaway:** [The single most important fact]

---

[If a relevant image is available, embed it here: ![description](url)]

| 📌 Key Concept | 💬 Plain English Meaning | 🌍 Real-World Example |
|---|---|---|
| [term from source] | [simple definition] | [real example] |
| [term from source] | [simple definition] | [real example] |
| [term from source] | [simple definition] | [real example] |
| [term from source] | [simple definition] | [real example] |

> 🧠 **Key Takeaway:** [The single most important fact from this section]

---

[Repeat this block for EVERY section in the source. Do NOT skip any topic.]
"""
    print("[LUMINA] Generating NOTES...")
    return _call_openrouter([{"role": "user", "content": prompt}], max_tokens=12000)

# ─────────────────────────────────────────────
# CALL 2: QUIZ + FLASHCARDS
# ─────────────────────────────────────────────
def _generate_quiz_and_flashcards(compressed: str) -> str:
    prompt = f"""You are creating assessment materials from this source document.

SOURCE DOCUMENT:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{compressed}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

OUTPUT — follow EXACTLY:

## [Knowledge Quiz]

Write EXACTLY 20 quiz questions. Each must test a SPECIFIC fact from the source.
One correct answer, three plausible wrong answers.
Format each line EXACTLY as: Question text | Option A | Option B | Option C | Option D | Correct Option Letter

(Do NOT include headers, numbering, or extra text — just 20 pipe-separated lines)

## [Recall Flashcards]

Write EXACTLY 25 flashcards. Front = exact term or short phrase from source. Back = simple one-sentence explanation (max 20 words).
Format each line EXACTLY as: Term from source | Simple plain-English explanation

(Do NOT include headers, numbering, or extra text — just 25 pipe-separated lines)
"""
    print("[LUMINA] Generating QUIZ + FLASHCARDS...")
    return _call_openrouter([{"role": "user", "content": prompt}], max_tokens=6000)

# ─────────────────────────────────────────────
# CALL 3: ROADMAP + MIND MAP
# ─────────────────────────────────────────────
def _generate_diagrams(compressed: str) -> str:
    prompt = f"""You are creating Mermaid.js diagrams for a study guide based on this source.

SOURCE DOCUMENT:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{compressed}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

OUTPUT — follow EXACTLY:

## [Study Roadmap]

```mermaid
flowchart TD
    A["Topic 1 from source\\n(short description)"] --> B["Topic 2 from source\\n(short description)"]
    B --> C["Topic 3 from source\\n(short description)"]
    C --> D["Topic 4 from source\\n(short description)"]
    D --> E["Topic 5 from source\\n(short description)"]
    E --> F["Topic 6 from source\\n(short description)"]
    classDef start fill:#10b981,stroke:#059669,color:#fff,stroke-width:2px
    classDef mid fill:#6366f1,stroke:#4f46e5,color:#fff,stroke-width:1px
    classDef endNode fill:#f59e0b,stroke:#d97706,color:#fff,stroke-width:2px
    class A start
    class B,C,D,E mid
    class F endNode
```

## [Concept Mind Map]

```mermaid
mindmap
  root((Main Topic from Source))
    Section 1
      Key detail from source
      Key detail from source
      Key detail from source
    Section 2
      Key detail from source
      Key detail from source
      Key detail from source
    Section 3
      Key detail from source
      Key detail from source
    Section 4
      Key detail from source
      Key detail from source
```

RULES:
- Use ONLY topics and terms from the SOURCE DOCUMENT above.
- No invented concepts.
- Keep node labels short (max 6 words each).
- Ensure valid Mermaid.js syntax — no special characters inside node labels except letters, numbers, spaces, and parentheses.
- Use double quotes around flowchart node labels.
"""
    print("[LUMINA] Generating DIAGRAMS...")
    return _call_openrouter([{"role": "user", "content": prompt}], max_tokens=3000)

# ─────────────────────────────────────────────
# CALL 4: PODCAST SCRIPT
# ─────────────────────────────────────────────
def _generate_podcast(compressed: str) -> str:
    prompt = f"""You are writing an engaging audio podcast script based on this source document.

SOURCE DOCUMENT:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{compressed}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## [Audio Lab Script]

Write a 600-800 word dialogue between:
- **MAYA** (a curious student who just read this document and has genuine questions)
- **ALEX** (a friendly expert who explains things simply and enthusiastically)

STRICT RULES:
- ALEX uses ONLY facts from the SOURCE DOCUMENT — never invents.
- MAYA asks questions a real confused student would ask.
- Every line from ALEX adds NEW information not yet mentioned.
- Use simple, conversational language — no academic jargon without explanation.
- Cover the most important topics from the source.
- Format every line as: **MAYA:** [text] or **ALEX:** [text]
- Write at least 14 exchanges (7 MAYA + 7 ALEX minimum).
"""
    print("[LUMINA] Generating PODCAST SCRIPT...")
    return _call_openrouter([{"role": "user", "content": prompt}], max_tokens=3000)

# ─────────────────────────────────────────────
# PARSERS
# ─────────────────────────────────────────────
def _parse_notes(text: str) -> Dict[str, Any]:
    data = {"title": "Study Session", "simplified_notes": ""}

    title_match = re.search(r"^#(?!#)\s+(.*)", text, re.MULTILINE)
    if title_match:
        data["title"] = title_match.group(1).strip()

    data["simplified_notes"] = text.strip()
    return data

def _parse_quiz_and_flashcards(text: str) -> Dict[str, Any]:
    data = {"quizzes": [], "flashcards": []}

    sections = re.split(r'\n(?=##\s)', text)
    for section in sections:
        section = section.strip()
        lines = section.split('\n', 1)
        header = lines[0].lower() if lines else ""
        content = lines[1].strip() if len(lines) > 1 else ""

        if any(k in header for k in ['quiz', 'knowledge', 'assessment', 'question']):
            for line in content.split('\n'):
                line = line.strip()
                if not line or line.startswith(('|', '-', '#', '`')):
                    continue
                parts = [p.strip() for p in line.split('|')]
                if len(parts) >= 6 and parts[0]:
                    data["quizzes"].append({
                        "question": parts[0],
                        "options": parts[1:5],
                        "answer": parts[5]
                    })

        elif any(k in header for k in ['flashcard', 'recall', 'card']):
            for line in content.split('\n'):
                line = line.strip()
                if not line or line.startswith(('|', '-', '#', '`')):
                    continue
                parts = [p.strip() for p in line.split('|')]
                if len(parts) >= 2 and parts[0] and parts[1]:
                    data["flashcards"].append({"front": parts[0], "back": parts[1]})

    return data

def _parse_diagrams(text: str) -> Dict[str, Any]:
    data = {"roadmap": "", "mind_map": ""}

    sections = re.split(r'\n(?=##\s)', text)
    for section in sections:
        section = section.strip()
        lines = section.split('\n', 1)
        header = lines[0].lower() if lines else ""
        content = lines[1].strip() if len(lines) > 1 else ""

        clean = content.replace("```mermaid", "").replace("```", "").strip()

        if any(k in header for k in ['roadmap', 'study path', 'learning path', 'flow']):
            for kw in ["flowchart", "graph"]:
                if kw in clean:
                    data["roadmap"] = clean[clean.find(kw):]
                    break
            if not data["roadmap"]:
                data["roadmap"] = clean

        elif any(k in header for k in ['mind map', 'concept map', 'mindmap']):
            for kw in ["mindmap", "graph", "flowchart"]:
                if kw in clean:
                    data["mind_map"] = clean[clean.find(kw):]
                    break
            if not data["mind_map"]:
                data["mind_map"] = clean

    return data

def _parse_podcast(text: str) -> str:
    sections = re.split(r'\n(?=##\s)', text)
    for section in sections:
        section = section.strip()
        lines = section.split('\n', 1)
        header = lines[0].lower() if lines else ""
        content = lines[1].strip() if len(lines) > 1 else ""
        if any(k in header for k in ['audio', 'podcast', 'script', 'lab', 'dialogue']):
            return content
    # fallback: return everything if no header found
    return text.strip()

# ─────────────────────────────────────────────
# VALIDATOR
# ─────────────────────────────────────────────
def _validate_output(data: Dict, source_text: str) -> bool:
    source_words = set(re.findall(r'\b\w{6,}\b', source_text.lower()))
    note_words = data.get("simplified_notes", "").lower()
    matches = [w for w in source_words if w in note_words]
    notes_len = len(data.get("simplified_notes", ""))
    quiz_count = len(data.get("quizzes", []))
    card_count = len(data.get("flashcards", []))
    print(f"[LUMINA] Validation — notes:{notes_len}c | terms:{len(matches)} | quiz:{quiz_count} | cards:{card_count}")
    return notes_len > 800 and len(matches) >= 3 and quiz_count >= 5 and card_count >= 5

# ─────────────────────────────────────────────
# MAIN AI SERVICE
# ─────────────────────────────────────────────
class AIService:

    @staticmethod
    def process_document(text: str, topic: str = "General", source_type: str = "document", source_url: str = "") -> dict:
        print(f"[LUMINA] Processing {source_type} | {len(text)} chars | topic: {topic}")

        compressed = _compress_source(text)
        images = _fetch_educational_images(topic)

        # Build image markdown for injection
        image_md = ""
        if images:
            image_md = "\n".join([
                f'![{img["alt"]}]({img["url"]})\n*{img["caption"]}*'
                for img in images
            ])

        # ── STAGE 1: Detailed Notes ──────────────────────
        try:
            notes_raw = _generate_notes(compressed, image_md)
        except AIServiceError as e:
            print(f"[LUMINA] Notes generation failed: {e}")
            notes_raw = f"# {topic}\n\n> Notes could not be generated. Source text:\n\n{text[:3000]}"

        notes_data = _parse_notes(notes_raw)

        # Inject images into notes if AI didn't embed them
        notes = notes_data.get("simplified_notes", "")
        if images and "![" not in notes:
            img_inserts = [
                f'\n\n![{img["alt"]}]({img["url"]})\n*{img["caption"]}*\n\n'
                for img in images[:3]
            ]
            parts = notes.split('\n\n')
            result_parts = []
            img_idx = 0
            char_count = 0
            for part in parts:
                result_parts.append(part)
                char_count += len(part)
                if img_idx < len(img_inserts) and char_count > 900 * (img_idx + 1):
                    result_parts.append(img_inserts[img_idx])
                    img_idx += 1
            notes_data["simplified_notes"] = '\n\n'.join(result_parts)

        # ── STAGE 2: Quiz + Flashcards ───────────────────
        quiz_data = {"quizzes": [], "flashcards": []}
        try:
            qf_raw = _generate_quiz_and_flashcards(compressed)
            quiz_data = _parse_quiz_and_flashcards(qf_raw)
        except Exception as e:
            print(f"[LUMINA] Quiz/Flashcard generation failed: {e}")

        # ── STAGE 3: Diagrams ────────────────────────────
        diagram_data = {"roadmap": "", "mind_map": ""}
        try:
            diag_raw = _generate_diagrams(compressed)
            diagram_data = _parse_diagrams(diag_raw)
        except Exception as e:
            print(f"[LUMINA] Diagram generation failed: {e}")

        # ── STAGE 4: Podcast Script ──────────────────────
        podcast_script = ""
        try:
            podcast_raw = _generate_podcast(compressed)
            podcast_script = _parse_podcast(podcast_raw)
        except Exception as e:
            print(f"[LUMINA] Podcast generation failed: {e}")

        # ── MERGE ALL ────────────────────────────────────
        merged = {
            "title": notes_data.get("title", topic),
            "simplified_notes": notes_data.get("simplified_notes", ""),
            "quizzes": quiz_data.get("quizzes", []),
            "flashcards": quiz_data.get("flashcards", []),
            "roadmap": diagram_data.get("roadmap", ""),
            "mind_map": diagram_data.get("mind_map", ""),
            "podcast_script": podcast_script,
            "visual_prompt": ""
        }

        print(f"[LUMINA] Final merged — notes:{len(merged['simplified_notes'])}c | quiz:{len(merged['quizzes'])} | cards:{len(merged['flashcards'])}")

        if _validate_output(merged, text):
            print("[LUMINA] SUCCESS: Synthesis validated!")
        else:
            print("[LUMINA] WARNING: Output below ideal quality threshold, but returning best effort.")

        return merged

    @staticmethod
    async def generate_response(prompt: str, context: str, history: List[Dict[str, str]] = None) -> str:
        """Chat endpoint grounded in note context with memory."""
        messages = [
            {
                "role": "system", 
                "content": (
                    "You are 'Atelier', a world-class, empathetic, and brilliant academic mentor. "
                    "You are a master of all subjects and can explain anything with clarity and depth.\n\n"
                    "YOUR MISSION:\n"
                    "1. Help the student master the provided CONTEXT MATERIAL (below).\n"
                    "2. If the student asks about something NOT in the notes, do NOT say 'I cannot answer'. Instead, use your vast general knowledge to teach them, while subtly connecting it back to their study goals.\n"
                    "3. Always address the student as 'Scholar' or 'Brilliant Mind'.\n"
                    "4. Use rich markdown: bold terms, lists, and clear hierarchy.\n"
                    "5. Be encouraging, sophisticated, and deeply helpful.\n\n"
                    "CONTEXT MATERIAL:\n"
                    f"{context[:12000]}\n"
                )
            }
        ]
        
        # Add history if provided
        if history:
            for msg in history[-6:]: # Keep last 6 exchanges for context
                messages.append({"role": msg["role"], "content": msg["content"]})
        
        # Add current prompt
        messages.append({"role": "user", "content": prompt})
        
        return _call_openrouter(messages, max_tokens=1500)
