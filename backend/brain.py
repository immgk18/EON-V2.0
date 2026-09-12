"""
============================================================
EON 2.0 — INTELLIGENCE CORE
Enhanced Operations Network
============================================================

This module defines EON's core intelligence behavior.

Architecture:

User Input
    ↓
EON Brain
    ↓
Context + Mode + Reasoning Rules
    ↓
AI Model
    ↓
Verified Response

This layer is intentionally separate from the API layer
so future capabilities such as tools, agents, vision,
web intelligence, engineering modules and memory can
plug into the same intelligence pipeline.
============================================================
"""

from typing import List, Dict


EON_NAME = "EON"

EON_SYSTEM = "Enhanced Operations Network"

EON_VERSION = "3.0.0"


DEFAULT_MODE = "NORMAL"


MAX_HISTORY_MESSAGES = 12


EON_SYSTEM_PROMPT = """
You are EON — Enhanced Operations Network.

You are an intelligent multimodal operations system designed
to assist with reasoning, analysis, learning, software,
engineering, scientific computing, automation, planning,
research, and complex problem solving.

CORE OPERATING PRINCIPLE:

Perceive → Understand → Reason → Plan → Execute → Verify → Respond

IDENTITY:

- Your name is EON.
- EON means Enhanced Operations Network.
- You are a capable AI system, not a human.
- Be clear, useful, technically grounded, and honest.
- Never pretend that an action was executed when it was not.
- Never claim access to a device, file, website, sensor,
  database, camera, microphone, or external system unless
  that capability has actually been connected.

REASONING:

- Understand the user's objective before answering.
- Break complex problems into logical steps.
- Prefer practical solutions.
- State important assumptions when they affect the result.
- Distinguish known facts from estimates or assumptions.
- When calculations are needed, show the relevant reasoning
  and verify the result.
- For engineering and scientific work, identify constraints,
  safety considerations, assumptions, and verification needs.
- Never claim real-world engineering certainty without
  appropriate simulation, testing, fabrication, measurement,
  or qualified human review.

SOFTWARE:

- Produce maintainable and modular solutions.
- Prefer clear architecture over unnecessary complexity.
- Explain important implementation decisions.
- Keep security and reliability in mind.
- Never expose secrets, API keys, passwords, or private
  credentials.

OPERATIONS:

When tools or agents become available, reason about which
capability is appropriate before using it.

Do not invent tool results.

If a requested capability is not currently connected,
clearly state that limitation and provide the best useful
alternative.

COMMUNICATION:

- Answer directly.
- Avoid unnecessary repetition.
- Adapt the level of explanation to the user's request.
- For simple questions, be concise.
- For difficult technical problems, be structured and
  sufficiently detailed.

EON'S PRIMARY OBJECTIVE:

Help the user understand, create, analyze, solve, verify,
and improve things while remaining accurate about what EON
can and cannot actually do.
"""


def normalize_mode(mode: str) -> str:
    """
    Normalize the operating mode used by EON.
    """

    normalized = (
        mode or DEFAULT_MODE
    ).strip().upper()

    if normalized in {
        "NORMAL",
        "ALERT",
        "NO_LIMITS",
    }:
        return normalized

    return DEFAULT_MODE


def build_context(
    message: str,
    mode: str = DEFAULT_MODE,
    history: List[Dict[str, str]] | None = None,
) -> str:
    """
    Build the complete model input.

    The history is intentionally limited so that the context
    remains lightweight and suitable for a prototype deployment.
    """

    current_mode = normalize_mode(mode)

    safe_history = history or []

    safe_history = safe_history[
        -MAX_HISTORY_MESSAGES:
    ]


    sections = [
        EON_SYSTEM_PROMPT.strip(),
        "",
        f"CURRENT EON MODE: {current_mode}",
        "",
        "CONVERSATION CONTEXT:",
    ]


    if safe_history:

        for item in safe_history:

            role = (
                item.get("role", "user")
                .strip()
                .lower()
            )

            content = (
                item.get("content", "")
                .strip()
            )

            if not content:
                continue

            if role not in {
                "user",
                "assistant",
            }:
                role = "user"

            sections.append(
                f"{role.upper()}: {content}"
            )

    else:

        sections.append(
            "No previous conversation context."
        )


    sections.extend(
        [
            "",
            "CURRENT USER REQUEST:",
            message.strip(),
            "",
            "Respond as EON.",
        ]
    )


    return "\n".join(
        sections
    )


def get_brain_info() -> Dict[str, str]:
    """
    Return basic information about the EON intelligence core.
    """

    return {
        "name": EON_NAME,
        "system": EON_SYSTEM,
        "version": EON_VERSION,
        "mode": DEFAULT_MODE,
        "architecture": (
            "Perceive → Understand → Reason → "
            "Plan → Execute → Verify → Respond"
        ),
    }
