import re
import io
from typing import Optional
from youtube_transcript_api import YouTubeTranscriptApi
import PyPDF2
from docx import Document

class ExtractionService:
    @staticmethod
    def extract_youtube_id(url: str) -> Optional[str]:
        """Extracts the video ID from various YouTube link formats."""
        patterns = [
            r'(?:v=|\/|be\/|embed\/|shorts\/)([0-9A-Za-z_-]{11})'
        ]
        for pattern in patterns:
            match = re.search(pattern, url)
            if match:
                return match.group(1)
        return None

    @staticmethod
    async def get_youtube_transcript(url: str) -> str:
        """Fetches the transcript of a YouTube video with a smart fallback strategy."""
        video_id = ExtractionService.extract_youtube_id(url)
        if not video_id:
            raise ValueError("Invalid YouTube URL - could not extract video ID")
        
        try:
            # 1. Try direct English retrieval first (most compatible with older versions)
            try:
                data = YouTubeTranscriptApi.get_transcript(video_id, languages=['en', 'en-US', 'en-GB'])
                transcript_source = "direct_en"
            except:
                # 2. List all available transcripts if direct English fails
                try:
                    transcript_list = YouTubeTranscriptApi.list_transcripts(video_id)
                    try:
                        # Try to find english in the list
                        transcript = transcript_list.find_transcript(['en', 'en-US', 'en-GB'])
                    except:
                        # Last resort: Get the very first transcript available (any language)
                        transcript = next(iter(transcript_list))
                    data = transcript.fetch()
                    transcript_source = "list_fallback"
                except (AttributeError, Exception):
                    # 3. Stealth Scraper Fallback 1: Vercel Proxy (FREE & RELIABLE)
                    try:
                        print(f"[LUMINA] API Blocked. Attempting Vercel Proxy for {video_id}...")
                        import requests
                        proxy_url = f"https://yt-transcript.vercel.app/api/transcript?v={video_id}"
                        r = requests.get(proxy_url, timeout=10)
                        data = r.json()
                        if isinstance(data, list) and len(data) > 0:
                            return " ".join([item.get('text', '') for item in data]).strip()
                    except:
                        pass

                    # 4. Stealth Scraper Fallback 2: youtubetranscript.com
                    try:
                        print(f"[LUMINA] Proxy failed. Attempting youtubetranscript.com...")
                        import requests
                        import html
                        scrape_url = f"https://youtubetranscript.com/?v={video_id}"
                        r = requests.get(scrape_url, timeout=10)
                        text_match = re.findall(r'text="([^"]+)"', r.text)
                        if text_match:
                            return html.unescape(" ".join(text_match).strip())
                    except:
                        pass
                    
                    raise ValueError("YouTube blocked the request. Please use the 'Paste Transcript' button below the link box!")

            if not data:
                raise ValueError("Transcript data was empty.")
                
            # Combine transcript segments into a single string
            # Handles both dictionary format and potential object format
            text_parts = []
            for item in data:
                if isinstance(item, dict):
                    text_parts.append(item.get('text', ''))
                else:
                    text_parts.append(getattr(item, 'text', ''))
            
            return " ".join(text_parts).strip()
            
        except Exception as e:
            error_msg = str(e)
            if "Subtitles are disabled" in error_msg:
                raise ValueError("Captions are disabled for this video on YouTube.")
            raise ValueError(f"YouTube Transcript Error: {error_msg}")

    @staticmethod
    async def extract_text_from_file(file_content: bytes, filename: str) -> str:
        """Extracts text from PDF or DOCX files."""
        if filename.endswith('.pdf'):
            return ExtractionService.extract_pdf(file_content)
        elif filename.endswith('.docx'):
            return ExtractionService.extract_docx(file_content)
        return "Unsupported file format"

    @staticmethod
    def extract_pdf(content: bytes) -> str:
        pdf_reader = PyPDF2.PdfReader(io.BytesIO(content))
        text = ""
        for page in pdf_reader.pages:
            text += page.extract_text() + "\n"
        return text

    @staticmethod
    def extract_docx(content: bytes) -> str:
        doc = Document(io.BytesIO(content))
        return "\n".join([para.text for para in doc.paragraphs])
