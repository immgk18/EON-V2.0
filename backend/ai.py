import os

from openai import OpenAI


MODEL = os.getenv(
    "EON_AI_MODEL",
    "gpt-5.6-luna",
)


def get_client() -> OpenAI:
    api_key = os.getenv(
        "OPENAI_API_KEY"
    )

    if not api_key:
        raise RuntimeError(
            "OPENAI_API_KEY is not configured."
        )

    return OpenAI(
        api_key=api_key
    )


def ask_eon(
    message: str,
) -> str:
    client = get_client()

    response = client.responses.create(
        model=MODEL,
        instructions=(
            "You are EON, the Enhanced Operations Network. "
            "You are a helpful AI operations assistant. "
            "Answer clearly, accurately, and concisely. "
            "For engineering or scientific tasks, state "
            "important assumptions and verification requirements. "
            "Do not claim real-world certainty when verification "
            "is required."
        ),
        input=message,
    )

    output = response.output_text.strip()

    if not output:
        return (
            "EON received the command but "
            "the AI returned an empty response."
        )

    return output
