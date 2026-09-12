import os

from google import genai


MODEL = os.getenv(
    "EON_AI_MODEL",
    "gemini-3.8-flash",
)


def get_client() -> genai.Client:
    api_key = os.getenv(
        "GEMINI_API_KEY"
    )

    if not api_key:
        raise RuntimeError(
            "GEMINI_API_KEY is not configured."
        )

    return genai.Client(
        api_key=api_key
    )


def ask_eon(
    message: str,
) -> str:
    client = get_client()

    response = client.models.generate_content(
        model=MODEL,
        contents=message,
    )

    output = (response.text or "").strip()

    if not output:
        return (
            "EON received the command but "
            "Gemini returned an empty response."
        )

    return output
