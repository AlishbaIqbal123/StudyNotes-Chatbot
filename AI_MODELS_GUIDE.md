# AI Models & Integration Guide - LuminaStudy 🧠

LuminaStudy is designed to be a high-fidelity study platform with **$0 operating costs**. This is achieved by leveraging free-tier AI models and browser-native technology.

---

## 1. Text Generation (The "Brain")
**Model:** `google/gemini-flash-1.5` or `mistralai/mixtral-8x7b-instruct`  
**Provider:** [OpenRouter](https://openrouter.ai/)

### How to get your API Key:
1.  Go to [OpenRouter.ai](https://openrouter.ai/).
2.  Sign in (use Google or GitHub for speed).
3.  Go to **Keys** in the sidebar.
4.  Click **Create Key**, name it "LuminaStudy", and copy the key.
5.  **Important:** OpenRouter has several **Free Models** (look for the "Free" badge). Even if you have $0 balance, you can use these models.

### Integration Steps:
In your backend (`server/app/services/ai_service.py`), we use the `/v1/chat/completions` endpoint. This is compatible with the OpenAI SDK.
```python
import requests

response = requests.post(
    url="https://openrouter.ai/api/v1/chat/completions",
    headers={
        "Authorization": f"Bearer {YOUR_API_KEY}",
    },
    json={
        "model": "google/gemini-flash-1.5", # Fastest free model
        "messages": [{"role": "user", "content": "Simplify this text..."}]
    }
)
```

---

## 2. Text-to-Speech (Audio Summaries)
**Technology:** Browser Web Speech API (W3C standard)  
**Cost:** $0 (Infinite usage)

### How it works:
Instead of paying for expensive TTS servers (like ElevenLabs), we utilize the user's local operating system voices. This is privacy-friendly and instant.

### Implementation:
We used `window.speechSynthesis` in `NoteViewPage.tsx`. To get the best quality, always select a "Natural" or "Google" voice from the `getVoices()` list.
```javascript
const synth = window.speechSynthesis;
const voices = synth.getVoices();
const utterance = new SpeechSynthesisUtterance(text);
utterance.voice = voices.find(v => v.name.includes("Google"));
synth.speak(utterance);
```

---

## 3. Visual Explanations (Image AI)
**Model:** SDXL / Flux  
**Provider:** [Pollinations.ai](https://pollinations.ai/)

### Why chosen:
Pollinations offers a completely free, **no-key-required** API. You can generate images simply by making an `<img>` request to a specific URL.

### Integration:
In the `NoteViewPage.tsx`, we dynamically generate URLs based on the concepts extracted by the text AI.
```html
<img src={`https://pollinations.ai/p/${encodeURIComponent(concept)}?width=1024&height=600&model=turbol`} />
```

---

## 4. Database & Auth (The Backbone)
**Platform:** [Firebase](https://firebase.google.com/) or [Supabase](https://supabase.com/)

### Firebase (Recommended for Beginners):
1.  Go to [Firebase Console](https://console.firebase.google.com/).
2.  Click **Add Project** -> "LuminaStudy".
3.  Enable **Authentication** (Email/Password & Google).
4.  Enable **Cloud Firestore** (Database).
5.  Copy your `firebaseConfig` and paste it into `client/src/lib/firebase.ts`.

### Supabase (Recommended for SQL Lovers):
1.  Go to [Supabase.com](https://supabase.com/).
2.  Create a project.
3.  Use the `supabase-js` client for Auth and Data.

---

## 💡 Cost Strategy Summary
- **LLM:** OpenRouter Free Tier (Llama 3 / Gemini Flash).
- **Images:** Pollinations.ai (Unlimited free).
- **Voice:** Browser Native API (Unlimited free).
- **Backend/DB:** Firebase Free (Spark Plan) / Supabase Free.
- **Hosting:** Vercel (Frontend) & Render (Backend) Free Tiers.

**Total Operating Cost: $0/month.**
