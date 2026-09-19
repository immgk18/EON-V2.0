from ai import ask_eon


AGENT_ROLES = {
    "CORE": "general reasoning and final synthesis",
    "RESEARCH": "research structure, evidence and information gaps",
    "ENGINEERING": "technical design, debugging and engineering reasoning",
    "HARDWARE": "hardware, sensors, robotics and integration planning",
    "TOOLS": "deterministic tool and workflow planning",
}


async def orchestrate(
    task: str,
    mode: str = "NORMAL",
    memory_context: str = "",
    agents=None,
):
    requested = [a.upper() for a in (agents or [])]
    selected = [a for a in requested if a in AGENT_ROLES]

    if not selected:
        selected = ["CORE", "RESEARCH", "ENGINEERING"]

    selected = selected[:4]

    role_block = "\n".join(
        f"- {agent}: {AGENT_ROLES[agent]}"
        for agent in selected
    )

    prompt = f"""
You are EON's orchestration engine.

Coordinate these specialist roles internally:
{role_block}

USER GOAL:
{task.strip()}

PROCESS:
1. Identify the actual goal and constraints.
2. Apply each selected specialist perspective.
3. Resolve conflicts using evidence and the user's constraints.
4. Produce one final answer or actionable result.
5. Do not claim external actions or tool use that did not occur.
6. If a capability is unavailable, state the limitation briefly.
7. Do not expose hidden chain-of-thought or private reasoning.

Return only the final useful result.
"""

    result = await ask_eon(
        message=prompt,
        mode=mode,
        memory_context=memory_context,
        destination="AI",
    )

    return {
        "response": result["response"],
        "status": "orchestration_complete",
        "model": result.get("model", "eon-ai"),
        "agents": selected,
    }
