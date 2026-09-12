"""
============================================================
EON 2.0 — AI ENGINE
Enhanced Operations Network
============================================================

Connects the EON Intelligence Core to Gemini.

Flow:

User Request
    ↓
EON Brain Context
    ↓
Gemini AI
    ↓
EON Response
============================================================
"""

import os
import time

from google import genai

from brain import (
    build_context,
)


MODEL = os.getenv(
    "EON_AI_MODEL",
    "gemini-3.8-flash",
)


MAX_RETRIES = 3

RETRY_DELAY = 3


def get_client() -> genai.Client:
    """
    Create the Gemini client using the server-side API key.
    """

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
    mode: str = "NORMAL",
) -> str:
    """
    Send a request through the EON Intelligence Core
    and return the Gemini response.
    """

    client = get_client()


    context = build_context(
        message=message,
        mode=mode,
    )


    last_error = None


    for attempt in range(
        1,
        MAX_RETRIES + 1
    ):

        try:

            response = (
                client.models.generate_content(
                    model=MODEL,
                    contents=context,
                )
            )


            output = (
                response.text or ""
            ).strip()


            if not output:

                return (
                    "EON received the request "
                    "but Gemini returned an "
                    "empty response."
                )


            return output


        except Exception as error:

            last_error = error


            print(
                f"EON AI attempt "
                f"{attempt}/{MAX_RETRIES} failed: "
                f"{error}"
            )


            error_text = (
                str(error).lower()
            )


            temporary_error = (
                "503" in error_text
                or "unavailable" in error_text
                or "high demand" in error_text
                or "429" in error_text
                or "rate limit" in error_text
                or "temporarily" in error_text
            )


            if not temporary_error:

                raise


            if (
                attempt <
                MAX_RETRIES
            ):

                wait_time = (
                    RETRY_DELAY *
                    attempt
                )


                print(
                    "EON AI temporarily "
                    "unavailable. "
                    f"Retrying in "
                    f"{wait_time} seconds..."
                )


                time.sleep(
                    wait_time
                )


    raise RuntimeError(
        "Gemini AI is temporarily "
        "unavailable after multiple "
        "retry attempts."
    ) from last_error
