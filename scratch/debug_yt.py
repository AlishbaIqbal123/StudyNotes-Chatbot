from youtube_transcript_api import YouTubeTranscriptApi
import sys

video_id = "wIyHSOugGGw"

try:
    print(f"Checking transcripts for {video_id}...")
    transcript_list = YouTubeTranscriptApi.list_transcripts(video_id)
    
    print("Available transcripts:")
    for t in transcript_list:
        print(f"- {t.language} ({t.language_code}) [Auto: {t.is_generated}]")
        
    # Try to find english
    try:
        t = transcript_list.find_transcript(['en', 'en-US', 'en-GB'])
        print(f"Found English: {t.language_code}")
        data = t.fetch()
        print(f"Successfully fetched {len(data)} lines.")
    except Exception as e:
        print(f"Could not find English: {e}")
        # Try any
        t = next(iter(transcript_list))
        print(f"Falling back to: {t.language_code}")
        data = t.fetch()
        print(f"Successfully fetched {len(data)} lines.")

except Exception as e:
    print(f"Error: {e}")
