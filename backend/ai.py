import os
import time

from google import genai
from google.genai import types

from brain import build_context


MODEL = os.getenv(
    "EON_AI_MODEL",
    "gemini-2.5-flash-lite",
)

MAX_RETRIES = 3
RETRY_DELAY_SECONDS = 3

api_key = os.getenv(
    "GEMINI_API_KEY"
)

if not api_key:
    raise RuntimeError(
        "GEMINI_API_KEY environment variable is not configured."
    )

client = genai.Client(
    api_key=api_key
)


def is_temporary_error(error: Exception) -> bool:
    text = str(error).lower()

    temporary_markers = [
        "503",
        "unavailable",
        "high demand",
        "429",
        "rate limit",
        "temporarily",
        "resource exhausted",
        "overloaded",
    ]

    return any(
        marker in text
        for marker in temporary_markers
    )


def create_generation_config(
    use_web: bool,
) -> types.GenerateContentConfig:
    if use_web:
        grounding_tool = types.Tool(
            google_search=types.GoogleSearch()
        )

        return types.GenerateContentConfig(
            tools=[
                grounding_tool
            ]
        )

    return types.GenerateContentConfig()


async def ask_eon(
    message: str,
    mode: str = "NORMAL",
    memory_context: str = "",
    destination: str = "AI",
):
    cleaned_message = message.strip()

    normalized_mode = (
        mode or "NORMAL"
    ).strip().upper()

    normalized_destination = (
        destination or "AI"
    ).strip().upper()

    if not cleaned_message:
        return {
            "response": "No command received.",
            "status": "empty",
            "model": MODEL,
            "mode": normalized_mode,
        }

    use_web = (
        normalized_destination == "WEB"
    )

    context = build_context(
        message=cleaned_message,
        mode=normalized_mode,
        memory_context=memory_context,
    )

    if use_web:
        context = (
            context
            + "\n\n"
            + "WEB INTELLIGENCE MODE:\n"
            + "Use Google Search when current or "
              "online information is useful.\n"
            + "Prefer recent and authoritative "
              "sources.\n"
            + "Clearly distinguish current web "
              "information from general knowledge.\n"
            + "Do not invent sources or claims.\n"
        )

    config = create_generation_config(
        use_web=use_web
    )

    last_error = None

    for attempt in range(
        MAX_RETRIES
    ):
        try:
            response = (
                client.models.generate_content(
                    model=MODEL,
                    contents=context,
                    config=config,
                )
            )

            answer = (
                response.text
                if response.text
                else "EON could not generate a response."
            )

            return {
                "response": answer,
                "status": (
                    "web_grounded"
                    if use_web
                    else "success"
                ),
                "model": MODEL,
                "mode": normalized_mode,
            }

        except Exception as error:
            last_error = error

            print(
                f"EON AI ERROR "
                f"(attempt {attempt + 1}/"
                f"{MAX_RETRIES}):",
                error,
            )

            if (
                attempt
                < MAX_RETRIES - 1
                and is_temporary_error(error)
            ):
                time.sleep(
                    RETRY_DELAY_SECONDS
                )
                continue

            break

    raise RuntimeError(
        f"EON AI request failed: {last_error}"
    )
