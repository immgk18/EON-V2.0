"""
============================================================
EON 2.0 — BACKEND API
Enhanced Operations Network
============================================================

FastAPI entry point for EON.

Frontend
    ↓
FastAPI
    ↓
EON Brain
    ↓
Gemini AI

Memory Integration v1
------------------------------------------------------------
The frontend stores EON memory locally and sends the relevant
memory context with each AI request.

The backend receives that context and passes it to the
EON brain so Gemini can use it while generating a response.
============================================================
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from ai import ask_eon
from brain import get_brain_info


# ============================================================
# EON CONFIGURATION
# ============================================================

EON_NAME = "EON"
EON_SYSTEM = "Enhanced Operations Network"
EON_VERSION = "3.0.0"


# ============================================================
# FASTAPI APPLICATION
# ============================================================

app = FastAPI(
    title="EON — Enhanced Operations Network",
    description="EON 2.0 Intelligence Backend",
    version=EON_VERSION,
)


# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# REQUEST MODEL
# ============================================================

class ChatRequest(BaseModel):
    message: str
    mode: str = "NORMAL"
    memory_context: str = ""


# ============================================================
# RESPONSE MODEL
# ============================================================

class ChatResponse(BaseModel):
    response: str
    status: str
    model: str
    mode: str


# ============================================================
# ROOT
# ============================================================

@app.get("/")
async def root():
    return {
        "service": EON_NAME,
        "system": EON_SYSTEM,
        "version": EON_VERSION,
        "status": "online",
    }


# ============================================================
# HEALTH
# ============================================================

@app.get("/health")
async def health():
    return {
        "service": "EON Intelligence Core",
        "system": EON_SYSTEM,
        "version": EON_VERSION,
        "status": "healthy",
    }


# ============================================================
# BRAIN INFORMATION
# ============================================================

@app.get("/api/brain")
async def brain():
    return get_brain_info()


# ============================================================
# CHAT
# ============================================================

@app.post(
    "/api/chat",
    response_model=ChatResponse,
)
async def chat(
    request: ChatRequest,
):

    message = request.message.strip()

    if not message:
        raise HTTPException(
            status_code=400,
            detail="No message received.",
        )


    mode = (
        request.mode
        or "NORMAL"
    ).strip().upper()


    memory_context = (
        request.memory_context
        or ""
    ).strip()


    try:

        result = await ask_eon(
            message=message,
            mode=mode,
            memory_context=memory_context,
        )

        return ChatResponse(
            response=result["response"],
            status=result.get(
                "status",
                "success",
            ),
            model=result.get(
                "model",
                "eon-ai",
            ),
            mode=result.get(
                "mode",
                mode,
            ),
        )

    except Exception as error:

        print(
            "EON CHAT ERROR:",
            error,
        )

        raise HTTPException(
            status_code=503,
            detail=str(error),
        )


# ============================================================
# SERVER ENTRY POINT
# ============================================================

if __name__ == "__main__":

    import uvicorn

    uvicorn.run(
        app,
        host="0.0.0.0",
        port=10000,
    )
