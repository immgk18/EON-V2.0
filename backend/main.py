"""
============================================================
EON 2.0 — AI BRAIN API
Enhanced Operations Network
============================================================

FastAPI interface for the EON Intelligence Core.

Flow:

Frontend
    ↓
FastAPI
    ↓
EON Intelligence Core
    ↓
Gemini AI
    ↓
Response
============================================================
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from ai import ask_eon
from brain import get_brain_info


app = FastAPI(
    title="EON — Enhanced Operations Network",
    version="3.0.0",
    description="EON Intelligence Core API",
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ChatRequest(BaseModel):
    message: str
    mode: str = "NORMAL"


class ChatResponse(BaseModel):
    response: str
    status: str
    model: str
    mode: str


@app.get("/")
async def root():
    return {
        "name": "EON",
        "system": "Enhanced Operations Network",
        "status": "ONLINE",
        "version": "3.0.0",
    }


@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "service": "EON Intelligence Core",
        "version": "3.0.0",
    }


@app.get("/api/brain")
async def brain():
    return get_brain_info()


@app.post(
    "/api/chat",
    response_model=ChatResponse,
)
async def chat(
    request: ChatRequest,
):
    message = request.message.strip()

    mode = (
        request.mode
        .strip()
        .upper()
        if request.mode
        else "NORMAL"
    )

    if not message:
        return ChatResponse(
            response="No command received.",
            status="empty",
            model="eon-ai",
            mode=mode,
        )

    try:
        response = ask_eon(
            message=message,
            mode=mode,
        )

        return ChatResponse(
            response=response,
            status="success",
            model="gemini-ai",
            mode=mode,
        )

    except Exception as error:

        print(
            f"EON AI ERROR: {error}"
        )

        raise HTTPException(
            status_code=500,
            detail=(
                "EON AI Brain could not "
                "process the request."
            ),
        )
