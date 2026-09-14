"""
============================================================
EON 2.0 — AI ENGINE
Enhanced Operations Network
============================================================

Connects EON Brain to Gemini.

Memory Integration v1
------------------------------------------------------------
The frontend supplies a memory_context string with each
request. This file passes that context into the EON brain.
============================================================
"""

import os
import time

from google import genai

from brain import build_context


# ============================================================
# CONFIGURATION
# ============================================================

MODEL = os.getenv(
    "EON_AI_MODEL",
    "gemini-2.5-flash-lite",
)

MAX_RETRIES = 3
RETRY_DELAY = 3


# ============================================================
# GEMINI CLIENT
# ============================================================

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


# ============================================================
# TEMPORARY ERROR DETECTION
# ============================================================

def is_temporary_error(
    error: Exception,
) -> bool:

    message = str(
        error
    ).lower()

    temporary_patterns = [
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
        pattern in message
        for pattern in temporary_patterns
    )


# ============================================================
# ASK EON
# ============================================================

async def ask_eon(
    message: str,
    mode: str = "NORMAL",
    memory_context: str = "",
):

    cleaned_message = (
        message.strip()
    )


    if not cleaned_message:

        return {
            "response":
                "No command received.",

            "status":
                "empty",

            "model":
                MODEL,

            "mode":
                mode,
        }


    normalized_mode = (
        mode or "NORMAL"
    ).strip().upper()


    cleaned_memory = (
        memory_context or ""
    ).strip()


    # ========================================================
    # BUILD EON CONTEXT
    # ========================================================

    context = build_context(
        message=cleaned_message,
        mode=normalized_mode,
        memory_context=cleaned_memory,
    )


    # ========================================================
    # GEMINI REQUEST
    # ========================================================

    last_error = None


    for attempt in range(
        MAX_RETRIES
    ):

        try:

            response = (
                client.models.generate_content(
                    model=MODEL,
                    contents=context,
                )
            )


            response_text = (
                getattr(
                    response,
                    "text",
                    None,
                )
                or ""
            ).strip()


            if not response_text:

                response_text = (
                    "EON received an empty AI response."
                )


            return {
                "response":
                    response_text,

                "status":
                    "success",

                "model":
                    MODEL,

                "mode":
                    normalized_mode,
            }


        except Exception as error:

            last_error = error


            if (
                is_temporary_error(
                    error
                )
                and attempt <
                MAX_RETRIES - 1
            ):

                print(
                    f"EON AI temporary error "
                    f"(attempt {attempt + 1}/"
                    f"{MAX_RETRIES}): "
                    f"{error}"
                )


                time.sleep(
                    RETRY_DELAY
                )

                continue


            print(
                "EON AI ERROR:",
                error,
            )

            break


    # ========================================================
    # FINAL FAILURE
    # ========================================================

    if last_error:

        raise last_error


    raise RuntimeError(
        "EON AI request failed."
    )
