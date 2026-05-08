from fastapi import FastAPI, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
import os
import json
import base64
import urllib.request

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/identify")
async def identify(
    file: UploadFile,
    symptoms: str = Form(default=""),
    location: str = Form(default="")
):
    image_data = await file.read()
    base64_image = base64.standard_b64encode(image_data).decode("utf-8")

    prompt = f"""You are a medical assistant helping identify skin conditions from photos.

Analyze this image of a skin condition.
{"User reported symptoms: " + symptoms if symptoms else ""}
{"User location: " + location if location else ""}

Respond in this exact JSON format:
{{
    "is_bug_bite": true or false,
    "confidence": "high", "medium", or "low",
    "most_likely": "your best guess e.g. mosquito bite, tick bite, spider bite, allergic reaction, etc.",
    "urgency": "green", "yellow", or "red",
    "urgency_reason": "one sentence explanation",
    "treatment": "2-3 sentences of home treatment advice",
    "red_flags": "symptoms that would require immediate medical attention",
    "disclaimer": "Always consult a healthcare professional for medical advice."
}}

Urgency guide:
- green: minor, manageable at home
- yellow: monitor closely, see doctor if worsens
- red: seek medical attention soon

Return only the JSON, no other text."""

    payload = json.dumps({
        "model": "meta-llama/llama-3.2-11b-vision-instruct",
        "messages": [{
            "role": "user",
            "content": [
                {"type": "image_url", "image_url": {"url": f"data:{file.content_type};base64,{base64_image}"}},
                {"type": "text", "text": prompt}
            ]
        }]
    }).encode()

    req = urllib.request.Request(
        "https://openrouter.ai/api/v1/chat/completions",
        data=payload,
        headers={
            "Authorization": f"Bearer {os.environ['OPENROUTER_API_KEY']}",
            "Content-Type": "application/json"
        }
    )

    with urllib.request.urlopen(req) as resp:
        raw = resp.read()
    
    print("OpenRouter raw response:", raw.decode())  # debug line
    data = json.loads(raw)
    text = data["choices"][0]["message"]["content"]
    clean = text.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
    return json.loads(clean)

@app.get("/health")
def health():
    return {"status": "ok"}