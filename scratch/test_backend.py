import requests
import json

url = "https://Alishba-1342-lumina-backend.hf.space/process"
data = {
    "type": "text",
    "content": "This is a simple test document about photosynthesis. Photosynthesis is the process used by plants and other organisms to convert light energy into chemical energy that, through cellular respiration, can later be released to fuel the organism's activities.",
    "generation_type": "all"
}

print("Sending request to backend...")
try:
    response = requests.post(url, data=data, timeout=60)
    print("Status code:", response.status_code)
    print("Response JSON:")
    print(json.dumps(response.json(), indent=2))
except Exception as e:
    print("Error:", e)
