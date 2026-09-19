"""
EON — deterministic local tool layer.

Tools are intentionally small, explicit and side-effect free:
- calculator
- unit conversion
- current UTC timestamp

No arbitrary shell, filesystem, network, or code execution is exposed.
"""

import ast
import math
import operator
from datetime import datetime, timezone
import re


_ALLOWED_BINOPS = {
    ast.Add: operator.add,
    ast.Sub: operator.sub,
    ast.Mult: operator.mul,
    ast.Div: operator.truediv,
    ast.Pow: operator.pow,
    ast.Mod: operator.mod,
    ast.FloorDiv: operator.floordiv,
}

_ALLOWED_UNARYOPS = {
    ast.UAdd: operator.pos,
    ast.USub: operator.neg,
}

_ALLOWED_NAMES = {
    "pi": math.pi,
    "e": math.e,
    "tau": math.tau,
}


def _eval(node):
    if isinstance(node, ast.Expression):
        return _eval(node.body)

    if isinstance(node, ast.Constant) and isinstance(node.value, (int, float)):
        return node.value

    if isinstance(node, ast.Name) and node.id in _ALLOWED_NAMES:
        return _ALLOWED_NAMES[node.id]

    if isinstance(node, ast.UnaryOp) and type(node.op) in _ALLOWED_UNARYOPS:
        return _ALLOWED_UNARYOPS[type(node.op)](_eval(node.operand))

    if isinstance(node, ast.BinOp) and type(node.op) in _ALLOWED_BINOPS:
        left = _eval(node.left)
        right = _eval(node.right)
        if abs(right) > 1e12 or abs(left) > 1e12:
            raise ValueError("Number outside safe range.")
        return _ALLOWED_BINOPS[type(node.op)](left, right)

    raise ValueError("Only basic arithmetic expressions are supported.")


def calculate(expression: str) -> str:
    expression = expression.strip().replace("^", "**")
    if not expression or len(expression) > 200:
        raise ValueError("Invalid or oversized expression.")

    tree = ast.parse(expression, mode="eval")
    value = _eval(tree)

    if not math.isfinite(float(value)):
        raise ValueError("Result is not finite.")

    return f"{value:g}"


_UNIT_FACTORS = {
    "mm": ("length", 0.001),
    "cm": ("length", 0.01),
    "m": ("length", 1.0),
    "km": ("length", 1000.0),
    "in": ("length", 0.0254),
    "ft": ("length", 0.3048),
    "mi": ("length", 1609.344),
    "g": ("mass", 0.001),
    "kg": ("mass", 1.0),
    "lb": ("mass", 0.45359237),
    "mg": ("mass", 0.000001),
    "ml": ("volume", 0.001),
    "l": ("volume", 1.0),
    "sec": ("time", 1.0),
    "s": ("time", 1.0),
    "min": ("time", 60.0),
    "h": ("time", 3600.0),
}


def convert(value: float, from_unit: str, to_unit: str) -> str:
    source = from_unit.lower().strip()
    target = to_unit.lower().strip()

    if source not in _UNIT_FACTORS or target not in _UNIT_FACTORS:
        raise ValueError("Unsupported unit.")

    source_kind, source_factor = _UNIT_FACTORS[source]
    target_kind, target_factor = _UNIT_FACTORS[target]

    if source_kind != target_kind:
        raise ValueError("Units must belong to the same dimension.")

    result = value * source_factor / target_factor
    return f"{result:g} {target}"


def try_unit_conversion(text: str):
    pattern = re.compile(
        r"^\s*(-?(?:\d+(?:\.\d*)?|\.\d+))\s*([a-zA-Z]+)\s+(?:to|in)\s+([a-zA-Z]+)\s*$",
        re.IGNORECASE,
    )
    match = pattern.match(text)

    if not match:
        return None

    value = float(match.group(1))
    return convert(value, match.group(2), match.group(3))


def execute_tool(name: str, arguments: str) -> dict:
    tool = name.strip().lower()

    if tool == "calculator":
        return {
            "tool": "calculator",
            "result": calculate(arguments),
        }

    if tool == "convert":
        converted = try_unit_conversion(arguments)
        if converted is None:
            raise ValueError(
                "Use conversion format like '10 km to m'."
            )
        return {
            "tool": "convert",
            "result": converted,
        }

    if tool == "time":
        now = datetime.now(timezone.utc)
        return {
            "tool": "time",
            "result": now.isoformat(),
        }

    raise ValueError(f"Unknown tool: {name}")


def run_tool_request(message: str) -> dict:
    text = message.strip()
    lower = text.lower()

    if lower.startswith("calculate "):
        return execute_tool("calculator", text[10:].strip())

    if lower.startswith("what is "):
        expression = text[8:].strip()
        if re.fullmatch(r"[0-9.()+*/%\-\s^eEpi]+", expression):
            return execute_tool("calculator", expression)

    if lower.startswith(("convert ", "conversion ")):
        payload = text.split(" ", 1)[1].strip()
        return execute_tool("convert", payload)

    if lower in {
        "time",
        "current time",
        "what time is it",
        "utc time",
        "current utc time",
    }:
        return execute_tool("time", "")

    raise ValueError(
        "No deterministic tool matched this request. "
        "Supported tools: calculator, unit conversion, UTC time."
    )
