# app/services/ai_service.py
import os
import re
import requests
import json
import urllib.parse
import random
import asyncio
from datetime import datetime
from typing import Dict, List, Any, Optional

# ─── CONFIGURATION ────────────────────────────────────────────
# Primary: Gemini 2.0 Flash Lite (Stable & Fast)
DEFAULT_MODEL         = "google/gemini-2.0-flash-lite-preview-02-05:free"
# Fallback: A highly stable older free model
FALLBACK_MODEL        = "google/gemini-flash-1.5-8b:free"
MAX_CONTEXT_CHARS     = 15000
MAX_TOKENS_NOTES      = 2000
MAX_TOKENS_MATERIALS  = 2000
API_TIMEOUT_NOTES     = 180
API_TIMEOUT_MATERIALS = 120
OPENROUTER_BASE_URL   = "https://openrouter.ai/api/v1/chat/completions"
LOG_PREFIX            = "[LUMINA]"
# ──────────────────────────────────────────────────────────────

class RateLimitError(Exception): pass
class AIServiceError(Exception): pass

def _log(message: str, level: str = "INFO") -> None:
    timestamp = datetime.now().strftime("%H:%M:%S")
    print(f"{LOG_PREFIX} [{level}] {timestamp} — {message}")

def _build_headers() -> Dict[str, str]:
    return {
        "Authorization": f"Bearer {os.getenv('OPENROUTER_API_KEY')}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://lumina-study.app",
        "X-Title": "Lumina Study"
    }

def _call_openrouter(
    messages: List[Dict[str, str]], 
    model: str = DEFAULT_MODEL, 
    max_tokens: int = MAX_TOKENS_NOTES, 
    timeout: int = API_TIMEOUT_NOTES
) -> str:
    def attempt_call(target_model: str, target_timeout: int) -> str:
        payload = {
            "model": target_model,
            "messages": messages,
            "temperature": 0.3,
            "max_tokens": max_tokens
        }
        _log(f"Attempting API call with model: {target_model}")
        try:
            response = requests.post(OPENROUTER_BASE_URL, headers=_build_headers(), json=payload, timeout=target_timeout)
            if response.status_code == 429:
                raise RateLimitError("API_RATE_LIMIT_EXCEEDED")
            
            if response.status_code != 200:
                error_detail = response.text
                _log(f"API ERROR RESPONSE: {error_detail}", level="ERROR")
                try:
                    error_detail = response.json().get('error', {}).get('message', response.text)
                except: pass
                raise AIServiceError(f"API Error ({response.status_code}): {error_detail}")
            
            data = response.json()
            if "error" in data:
                raise AIServiceError(data["error"].get("message", "Unknown API error"))
                
            if "choices" not in data or not data["choices"]:
                raise AIServiceError(f"No choices returned from AI. Response: {json.dumps(data)}")
                
            return data["choices"][0]["message"]["content"]
        except requests.exceptions.Timeout:
            raise AIServiceError("API_TIMEOUT")
        except Exception as e:
            raise AIServiceError(str(e))

    try:
        return attempt_call(model, timeout)
    except Exception as e:
        _log(f"Primary call failed ({model}): {str(e)}. Retrying with fallback...", level="WARNING")
        try:
            return attempt_call(FALLBACK_MODEL, timeout)
        except Exception as fallback_e:
            _log(f"Fallback call also failed ({FALLBACK_MODEL}): {str(fallback_e)}", level="ERROR")
            raise AIServiceError(f"AI Service Failure: {str(fallback_e)}")

def _fix_pollinations_urls(text: str, topic: str = "Knowledge") -> str:
    # Improved regex to find [IMAGE: description] and convert to pollinations URLs
    def replace_with_url(match):
        desc = match.group(1).strip()
        # Clean description for URL
        clean_desc = re.sub(r'[^a-zA-Z0-9\s]', '', desc).replace(' ', '%20')
        seed = random.randint(1000, 9999)
        url = f"https://image.pollinations.ai/prompt/Professional%20scientific%20illustration%20of%20{clean_desc},%208k,%20clean%20background,%20educational%20style?width=1080&height=1080&nologo=true&seed={seed}&model=flux"
        return f"\n![{desc}]({url})\n"

    return re.sub(r'\[IMAGE:\s*(.*?)\]', replace_with_url, text, flags=re.IGNORECASE)

def _parse_robust_markdown(text: str) -> Dict[str, Any]:
    sections = {}
    title_match = re.search(r"^# (.*)", text, re.MULTILINE)
    sections["title"] = title_match.group(1).strip() if title_match else "Study Session"
    
    # Split by ## headers
    parts = re.split(r'\n(?=## )', text)
    for part in parts:
        if not part.strip().startswith('##'): continue
        lines = part.strip().split('\n', 1)
        header_line = lines[0].replace('##', '').strip()
        # Clean header for dict key
        header_key = re.sub(r'[^\w\s]', '', header_line).strip().lower()
        content = lines[1].strip() if len(lines) > 1 else ""
        
        # Preserve mermaid blocks — do NOT strip them
        # Verify mermaid blocks are intact
        mermaid_count = content.count('```mermaid')
        _log(f"Mermaid diagrams found in notes: {mermaid_count}")
        if mermaid_count == 0 and "notes" in header_key:
            _log("WARNING: No mermaid diagrams in notes", level="WARNING")
            
        sections[header_key] = content
        
    sections["full_content"] = text
    return sections

class AIService:
    @staticmethod
    def get_model_name() -> str:
        return DEFAULT_MODEL

    @staticmethod
    def _clean_note_formatting(data: dict) -> dict:
        import re, urllib.parse, random
        notes = data.get("simplified_notes", "")
        
        # Step 1: Remove markdown code fence artifacts 
        # but PRESERVE mermaid and image blocks
        notes = re.sub(r'```markdown\s*', '', notes)
        
        # Step 2: Fix ALL pollinations URLs to working format
        def fix_image_url(match):
            alt = match.group(1)
            url = match.group(2)
            
            if 'pollinations' not in url:
                return match.group(0)  # not pollinations, leave alone
            
            # Extract prompt text from any pollinations format
            prompt_text = ""
            for marker in ['/prompt/', '/p/']:
                if marker in url:
                    after_marker = url.split(marker, 1)[1]
                    prompt_text = after_marker.split('?')[0]
                    break
            
            if not prompt_text:
                return match.group(0)
            
            # Clean the prompt text
            clean = urllib.parse.unquote(prompt_text)
            clean = clean.replace('%20', ' ').replace('+', ' ')
            clean = clean.strip()
            
            # Re-encode with plus signs (most reliable for pollinations)
            encoded = clean.replace(' ', '+')
            seed = random.randint(1000, 9999)
            
            fixed_url = (
                f"https://image.pollinations.ai/prompt/"
                f"{encoded}"
                f"?width=1200&height=630&nologo=true&seed={seed}"
            )
            _log(f"Fixed image URL for: {alt[:30]}")
            return f"![{alt}]({fixed_url})"
        
        notes = re.sub(r'!\[([^\]]*)\]\(([^)]+)\)', fix_image_url, notes)
        
        # Step 3: Count images and log
        image_count = len(re.findall(r'!\[', notes))
        _log(f"Images in notes after fix: {image_count}")
        
        if image_count == 0:
            _log("No images found — injecting fallback images", 
                 level="WARNING")
            # Inject one fallback image at the top of notes
            topic = data.get("title", "educational concept")
            topic_encoded = topic.replace(' ', '+')
            fallback = (
                f"\n\n![{topic}]"
                f"(https://image.pollinations.ai/prompt/"
                f"educational+illustration+{topic_encoded}+detailed+diagram"
                f"?width=1200&height=630&nologo=true&seed=5555)\n\n"
            )
            # Insert after first paragraph
            parts = notes.split('\n\n', 2)
            if len(parts) >= 2:
                notes = parts[0] + '\n\n' + fallback + '\n\n'.join(parts[1:])
            else:
                notes = fallback + notes
        
        data["simplified_notes"] = notes
        return data

    @staticmethod
    async def process_document(text: str, topic: str = "General", source_type: str = "document", source_url: str = "") -> Dict[str, Any]:
        _log(f"Processing document for topic: {topic}")
        
        # Prompt 1: Focus ONLY on notes, takeaways, conclusion, and visuals
        prompt1 = f"""
        You are a world-class academic educator. Analyze the provided text and generate a COMPREHENSIVE study suite.
        
        TOPIC: {topic}
        SOURCE CONTENT: {text[:MAX_CONTEXT_CHARS]}
        
        STRICT OUTPUT FORMAT (Use these EXACT headers):
        
        1. # [Dynamic Title]
        
        2. ## Detailed Study Notes
        (The core content. Use deep hierarchical structure, tables for comparisons, and LaTeX for any formulas.)
        
        DIAGRAM RULE — MANDATORY:
        For every major topic section in the notes, you MUST embed 
        at least ONE Mermaid diagram directly inside the notes text.
        Use this exact format with triple backticks:

        ```mermaid
        flowchart LR
            A["Concept"] --> B["Related Concept"]
            B --> C["Effect or Result"]
            style A fill:#E60023,color:#fff,stroke:none
            style B fill:#1a1a2e,color:#fff,stroke:#E60023
            style C fill:#5E7B5A,color:#fff,stroke:none
        ```

        MERMAID SYNTAX RULES (CRITICAL):
        - Always use double quotes for labels: NodeID["Label Text"].
        - Node IDs must be simple alphanumeric strings (e.g., A, B, Node1).
        - NEVER use @, (, ), {{, }}, [, ], or spaces in a Node ID.
        - For labels with special characters (like {{{{ or @), always wrap them in double quotes: A["{{{{Interpolation}}}}"].
        - For connectors with labels, use: A -->|"label"| B or A -- "label" --> B. NEVER use --["label"] -->.
        - Use flowchart LR for processes and sequences.
        - Use flowchart TD for hierarchies.
        - Use mindmap for concept relationships.

        Place the diagram AFTER the paragraph that explains that concept.
        Every diagram must have colored nodes using the style lines above.
        Generate at least 3 diagrams total inside the notes section.

        IMAGE RULE — MANDATORY:
        Embed exactly 5 images inside the notes. 
        Place each image after the section it illustrates.
        Use ONLY this exact URL format — no variations allowed:

        ![Brief description](https://image.pollinations.ai/prompt/detailed+prompt+words+here?width=1200&height=630&nologo=true&seed=4271)

        RULES:
        - Use plus signs (+) between words in the prompt, NOT spaces or %20
        - Change the seed number to a different random 4-digit number for each image
        - The prompt after /prompt/ must describe the concept in 8-12 words
        - Do NOT use /p/ — only use /prompt/
        - Do NOT add any other query parameters
        - Each image must be on its own line with a blank line before and after

        Example of correct format:
        ![Photosynthesis process](https://image.pollinations.ai/prompt/green+leaf+absorbing+sunlight+converting+to+glucose+diagram?width=1200&height=630&nologo=true&seed=3847)
        
        3. ## Key Takeaways
        (A bulleted list of the most important 5-7 points to remember)
        
        4. ## Conclusion
        (A formal academic summary that ties everything together and provides a final perspective. Minimum 200 words.)
        
        5. ## Audio Lab Script
        (Generate a 2-minute dialogue between 'Host:' and 'Expert:'. 
        Host: Welcome back! Today we're diving into...
        Expert: Exactly, and the most fascinating part is...
        Make it engaging and conversational. DO NOT use markdown like ** within the lines.)
        
        6. ## Visual Style Prompt
        (A one-sentence summary of the overall aesthetic for this topic)
        
        RULES:
        - NEVER include quizzes or flashcards here.
        - Ensure all image placeholders match the format [IMAGE: description].
        """
        
        # Prompt 2: Focus ONLY on interactive materials
        prompt2 = f"""
        Generate interactive study materials for '{topic}'.
        SOURCE: {text[:MAX_CONTEXT_CHARS]}
        
        STRICT FORMAT:
        1. ## Knowledge Quiz
        (15 questions. Use format: Question|OptionA|OptionB|OptionC|OptionD|CorrectAnswer)
        
        2. ## Recall Flashcards
        (20 cards. Use format: Question|Answer)
        
        3. ## Study Roadmap
        (A Mermaid.js graph TD diagram. 
        - Use quotes for ALL labels: A["Step 1"].
        - Use simple alphanumeric IDs for nodes: Node1, Node2, etc.
        - NEVER use special characters in Node IDs.
        - For connectors with labels, use: Node1 -->|"Label"| Node2.)
        
        4. ## Concept Mind Map
        (A Mermaid.js mindmap. 
        - Use quotes for ALL labels.
        - Ensure proper indentation for levels.)
        """
        
        async def _generate_all():
            # Parallel call like hf_deploy
            loop = asyncio.get_event_loop()
            res1_task = loop.run_in_executor(None, _call_openrouter, [{"role": "user", "content": prompt1}], DEFAULT_MODEL, MAX_TOKENS_NOTES, API_TIMEOUT_NOTES)
            res2_task = loop.run_in_executor(None, _call_openrouter, [{"role": "user", "content": prompt2}], DEFAULT_MODEL, MAX_TOKENS_MATERIALS, API_TIMEOUT_MATERIALS)
            
            res1, res2 = await asyncio.gather(res1_task, res2_task)
            
            data1 = _parse_robust_markdown(res1)
            data2 = _parse_robust_markdown(res2)

            combined = {
                "title": data1.get("title", topic),
                "simplified_notes": res1,
                "source_text": text,
                "quizzes": [],
                "flashcards": [],
                "roadmap": data2.get("study roadmap", ""),
                "mind_map": data2.get("concept mind map", ""),
                "podcast_script": data1.get("audio lab script", ""),
                "visual_prompt": data1.get("visual style prompt", "")
            }

            # Apply clean formatting (handles image URL fixes and fallbacks)
            combined = AIService._clean_note_formatting(combined)

            # Parse Quiz
            for line in data2.get("knowledge quiz", "").strip().split('\n'):
                p = [x.strip() for x in line.split('|')]
                if len(p) >= 6:
                    combined["quizzes"].append({"question": p[0], "options": p[1:5], "answer": p[5]})

            # Parse Flashcards
            for line in data2.get("recall flashcards", "").strip().split('\n'):
                p = [x.strip() for x in line.split('|')]
                if len(p) >= 2:
                    combined["flashcards"].append({"front": p[0], "back": p[1]})

            return combined

        return await _generate_all()

    @staticmethod
    async def generate_response(prompt: str, context: str, history: List[Dict[str, str]] = None) -> str:
        _log(f"Generating chat response for: {prompt[:50]}...")
        system_prompt = (
            "You are Lumina, an elite academic study assistant. "
            "Your goal is to help the student understand the material deeply. "
            f"PRIMARY CONTEXT: {context[:MAX_CONTEXT_CHARS]}\n\n"
            "INSTRUCTIONS:\n"
            "- Use the provided context as your main source of truth.\n"
            "- If a question is outside the context, answer it using your general knowledge but add a disclaimer that this wasn't in the original study material.\n"
            "- Be encouraging, clear, and use professional academic language.\n"
            "- Use Markdown for formatting (bolding, lists, etc.) to make answers readable."
        )
        messages = [{"role": "system", "content": system_prompt}]
        if history: 
            # Ensure history matches expected format
            clean_history = []
            for m in history[-6:]:
                if isinstance(m, dict) and "role" in m and "content" in m:
                    clean_history.append({"role": m["role"], "content": str(m["content"])})
            messages.extend(clean_history)
            
        messages.append({"role": "user", "content": prompt})
        _log(f"Chat Messages: {json.dumps(messages, indent=2)}")
        
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, _call_openrouter, messages, DEFAULT_MODEL, 2000, 120)

    @staticmethod
    def generate_more_quiz(source_text: str, existing_questions: list) -> list:
        prompt = (
            f"SOURCE: {source_text[:8000]}\n"
            f"TASK: Generate 10 NEW and different quiz questions based on the source. Use format: Question|OptionA|OptionB|OptionC|OptionD|CorrectAnswer"
        )
        res = _call_openrouter([{"role": "user", "content": prompt}], DEFAULT_MODEL, 2000)
        new_q = []
        for line in res.strip().split('\n'):
            p = [x.strip() for x in line.split('|')]
            if len(p) >= 6:
                new_q.append({"question": p[0], "options": p[1:5], "answer": p[5]})
        return new_q

    @staticmethod
    def generate_more_flashcards(source_text: str, existing_cards: list) -> list:
        prompt = (
            f"SOURCE: {source_text[:8000]}\n"
            f"TASK: Generate 10 NEW and different flashcards based on the source. Use format: Term|Definition"
        )
        res = _call_openrouter([{"role": "user", "content": prompt}], DEFAULT_MODEL, 1500)
        new_c = []
        for line in res.strip().split('\n'):
            p = [x.strip() for x in line.split('|')]
            if len(p) >= 2:
                new_c.append({"front": p[0], "back": p[1]})
        return new_c
