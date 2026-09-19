import base64
import os
import time

from google import genai
from google.genai import types


VISION_MODEL = os.getenv(
    "EON_VISION_MODEL",
    os.getenv("EON_AI_MODEL", "gemini-2.5-flash-lite"),
)

MAX_RETRIES = 2
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))


async def analyze_image(
    image_base64: str,
    mime_type: str,
    prompt: str,
):
    if not image_base64:
        raise ValueError("No image data received.")

    if mime_type not in {
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/gif",
    }:
        raise ValueError("Unsupported image type.")

    raw = base64.b64decode(image_base64, validate=True)

    if len(raw) > 8 * 1024 * 1024:
        raise ValueError("Image is larger than the 8 MB limit.")

    clean_prompt = prompt.strip() or "Analyze this image and describe the important visual information."

    contents = [
        types.Content(
            role="user",
            parts=[
                types.Part.from_text(text=clean_prompt),
                types.Part.from_bytes(
                    data=raw,
                    mime_type=mime_type,
                ),
            ],
        )
    ]

    last_error = None

    for attempt in range(MAX_RETRIES):
        try:
            response = client.models.generate_content(
                model=VISION_MODEL,
                contents=contents,
                config=types.GenerateContentConfig(
                    system_instruction=(
                        "You are EON Vision. Analyze only what is actually visible "
                        "in the supplied image. Do not identify real people. "
                        "Do not invent details. Be concise but useful."
                    )
                ),
            )

            return {
                "response": response.text or "EON Vision found no readable result.",
                "status": "vision_complete",
                "model": VISION_MODEL,
            }
        except Exception as error:
            last_error = error
            if attempt < MAX_RETRIES - 1:
                time.sleep(2)

    raise RuntimeError(f"EON Vision request failed: {last_error}")
