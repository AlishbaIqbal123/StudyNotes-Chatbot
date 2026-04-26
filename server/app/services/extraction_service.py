import re
import io
from typing import Optional
from youtube_transcript_api import YouTubeTranscriptApi
import PyPDF2
from docx import Document

class ExtractionService:
    @staticmethod
    def extract_youtube_id(url: str) -> Optional[str]:
        """Extracts the video ID from a YouTube link."""
        patterns = [
            r'(?:v=|\/)([0-9A-Za-z_-]{11}).*',
            r'(?:be\/)([0-9A-Za-z_-]{11}).*'
        ]
        for pattern in patterns:
            match = re.search(pattern, url)
            if match:
                return match.group(1)
        return None

    @staticmethod
    async def get_youtube_transcript(url: str) -> str:
        """Fetches the transcript of a YouTube video with language fallbacks."""
        video_id = ExtractionService.extract_youtube_id(url)
        if not video_id:
            raise ValueError("Invalid YouTube URL - could not extract video ID")
        
        try:
            # YouTubeTranscriptApi is used via static methods
            try:
                # 1. Try to get English transcript first
                data = YouTubeTranscriptApi.get_transcript(video_id, languages=['en'])
            except:
                try:
                    # 2. Fallback: get any available transcript
                    transcript_list = YouTubeTranscriptApi.list_transcripts(video_id)
                    transcript = next(iter(transcript_list))
                    data = transcript.fetch()
                except:
                    raise ValueError("No transcripts available for this video.")

            if not data:
                raise ValueError("Could not retrieve transcript data.")
                
            # NEW: Robust parsing for both old (dict) and new (object) library versions
            try:
                # Try as objects (new version: item.text)
                return " ".join([item.text for item in data])
            except (AttributeError, TypeError):
                try:
                    # Try as dictionaries (old version: item['text'])
                    return " ".join([item['text'] for item in data])
                except (KeyError, TypeError):
                    raise ValueError("Unexpected transcript data format. Could not extract text content.")
            
        except Exception as e:
            raise ValueError(f"YouTube Transcript Error: {str(e)}")

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
