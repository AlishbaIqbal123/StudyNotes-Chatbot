# check_api_quota.py
import os
import time
import sys
import json
from datetime import datetime
import requests

# Try to load .env if python-dotenv is installed
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

# ─── CONFIGURATION ────────────────────────────────────────────
OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
TAVILY_URL = "https://api.tavily.com/search"
MODEL = "google/gemini-2.0-flash-001"
TIMEOUT = 15

def mask_key(key: str) -> str:
    """Shows first 8 and last 3 chars of a key."""
    if not key or len(key) < 12: return "INVALID_KEY"
    return f"{key[:8]}...{key[-3:]}"

def format_timestamp(ts: str) -> str:
    """Converts unix timestamp to readable time."""
    try:
        return datetime.fromtimestamp(float(ts)).strftime('%Y-%m-%d %H:%M:%S')
    except:
        return ts

def print_divider(title: str):
    print(f"\n{'━' * 10} {title} {'━' * (40 - len(title))}")

def main():
    print("🚀 LUMINA SYSTEM DIAGNOSTICS")
    print(f"Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    status = {"openrouter": False, "tavily": False, "env": False}

    # ━━━ CHECK 1: ENVIRONMENT VARIABLES ━━━
    print_divider("ENVIRONMENT VARIABLES")
    or_key = os.getenv("OPENROUTER_API_KEY")
    tv_key = os.getenv("TAVILY_API_KEY")

    if or_key:
        print(f"✅ OPENROUTER_API_KEY — Found ({mask_key(or_key)})")
    else:
        print("❌ OPENROUTER_API_KEY — MISSING. Add it to your .env file.")

    if tv_key:
        print(f"✅ TAVILY_API_KEY — Found ({mask_key(tv_key)})")
    else:
        print("❌ TAVILY_API_KEY — MISSING. Add it to your .env file.")
    
    if or_key and tv_key:
        status["env"] = True

    # ━━━ CHECK 2: OPENROUTER API STATUS ━━━
    print_divider("OPENROUTER API STATUS")
    if not or_key:
        print("⚠️  Skipping OpenRouter check (No Key)")
    else:
        headers = {
            "Authorization": f"Bearer {or_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://lumina-atelier.com",
            "X-Title": "Lumina Diagnostic"
        }
        payload = {
            "model": MODEL,
            "messages": [{"role": "user", "content": "Reply with only the word ONLINE"}],
            "max_tokens": 5
        }
        
        try:
            res = requests.post(OPENROUTER_URL, headers=headers, json=payload, timeout=TIMEOUT)
            
            # Print Rate Limit Headers if present
            limit = res.headers.get("X-RateLimit-Limit")
            remaining = res.headers.get("X-RateLimit-Remaining")
            reset = res.headers.get("X-RateLimit-Reset")
            
            if limit or remaining:
                print("📊 Rate Limit Info:")
                print(f"   Limit:     {limit or 'Unknown'}")
                print(f"   Remaining: {remaining or 'Unknown'}")
                print(f"   Resets at: {format_timestamp(reset) if reset else 'Unknown'}")

            if res.status_code == 200:
                data = res.json()
                content = data['choices'][0]['message']['content'].strip()
                print(f"✅ OPENROUTER — QUOTA AVAILABLE")
                print(f"   Model: {MODEL}")
                print(f"   Response received: {content}")
                print("   You can test your app now.")
                status["openrouter"] = True
            elif res.status_code == 429:
                print("❌ OPENROUTER — QUOTA EXHAUSTED")
                print("   Rate limit still active.")
                print("   Check your usage at: https://openrouter.ai/activity")
            elif res.status_code == 401:
                print("❌ OPENROUTER — INVALID API KEY")
            elif res.status_code == 402:
                print("❌ OPENROUTER — NO CREDITS")
                print("   Add credits at: https://openrouter.ai/credits")
            else:
                print(f"⚠️  OPENROUTER — UNKNOWN ERROR")
                print(f"   Status: {res.status_code}")
                print(f"   Body: {res.text[:200]}")
                
        except Exception as e:
            print(f"❌ OPENROUTER — CONNECTION FAILED: {str(e)}")

    # ━━━ CHECK 3: TAVILY SEARCH API STATUS ━━━
    print_divider("TAVILY SEARCH API STATUS")
    if not tv_key:
        print("⚠️  Skipping Tavily check (No Key)")
    else:
        payload = {"api_key": tv_key, "query": "test", "max_results": 1}
        try:
            res = requests.post(TAVILY_URL, json=payload, timeout=TIMEOUT)
            if res.status_code == 200:
                data = res.json()
                results_count = len(data.get("results", []))
                print(f"✅ TAVILY — QUOTA AVAILABLE")
                print(f"   Results received: {results_count}")
                print("   You can test your app now.")
                status["tavily"] = True
            elif res.status_code == 429:
                print("❌ TAVILY — QUOTA EXHAUSTED")
                print("   Check your usage at: https://app.tavily.com")
            elif res.status_code == 401:
                print("❌ TAVILY — INVALID API KEY")
            else:
                print(f"⚠️  TAVILY — UNKNOWN ERROR: {res.status_code}")
                print(f"   Body: {res.text[:200]}")
        except Exception as e:
            print(f"❌ TAVILY — CONNECTION FAILED: {str(e)}")

    # ━━━ CHECK 4: FULL GENERATION TEST ━━━
    if status["openrouter"]:
        print_divider("FULL GENERATION TEST")
        run_full = input("Run full generation test? This will use API quota. (y/n): ").lower().strip()
        if run_full == 'y':
            print("⏳ Generating study notes and quiz...")
            payload = {
                "model": MODEL,
                "messages": [{
                    "role": "user", 
                    "content": "Generate a 3-sentence study note about photosynthesis. Then write 2 quiz questions in this format:\nQuestion | A | B | C | D | Answer"
                }],
                "max_tokens": 500
            }
            try:
                res = requests.post(OPENROUTER_URL, headers=headers, json=payload, timeout=TIMEOUT)
                if res.status_code == 200:
                    content = res.json()['choices'][0]['message']['content']
                    
                    has_length = len(content) >= 100
                    has_pipe = "|" in content
                    has_questions = content.count("?") >= 2
                    
                    if has_length and has_pipe and has_questions:
                        print("✅ FULL GENERATION TEST PASSED")
                        print(f"   Response length: {len(content)} characters")
                        print(f"   Quiz format detected: YES")
                        print(f"   Notes format detected: YES")
                        print("   Your app should work correctly now.")
                    else:
                        print("⚠️  GENERATION TEST PARTIAL")
                        print("   Response received but format may be off.")
                        print(f"   Response preview: {content[:200]}...")
                else:
                    print(f"❌ Generation test failed (Status {res.status_code})")
            except Exception as e:
                print(f"❌ Generation test failed: {str(e)}")

    # ━━━ FINAL SUMMARY ━━━
    print("\n" + "═" * 32)
    print("       LUMINA API STATUS")
    print("═" * 32)
    print(f"OpenRouter:  {'✅ READY' if status['openrouter'] else '❌ NOT READY'}")
    print(f"Tavily:      {'✅ READY' if status['tavily'] else '❌ NOT READY'}")
    print(f"Environment: {'✅ READY' if status['env'] else '❌ NOT READY'}")
    print("═" * 32)
    
    if all(status.values()):
        print("🚀 All systems go! You can test your app now.")
    else:
        print("🔧 Fix the issues above then run this script again.")
    print("═" * 32 + "\n")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\nCheck cancelled.")
        sys.exit(0)
