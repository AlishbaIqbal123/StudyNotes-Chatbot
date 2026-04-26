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
        """Fetches the transcript of a YouTube video."""
        video_id = ExtractionService.extract_youtube_id(url)
        if not video_id:
            raise ValueError("Invalid YouTube URL")
        
        try:
            transcript_list = YouTubeTranscriptApi.get_transcript(video_id)
            return " ".join([item['text'] for item in transcript_list])
        except Exception as e:
            # Fallback for languages or disabled transcripts if needed
            return f"Error fetching transcript: {str(e)}"

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
