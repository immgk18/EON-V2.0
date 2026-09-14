from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from ai import ask_eon
from brain import get_brain_info

EON_NAME = "EON"
EON_SYSTEM = "Enhanced Operations Network"
EON_VERSION = "3.1.0"

app = FastAPI(
    title="EON — Enhanced Operations Network",
    description="EON 2.0 Intelligence Backend",
    version=EON_VERSION,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ChatRequest(BaseModel):
    message: str
    mode: str = "NORMAL"
    memory_context: str = ""
    destination: str = "AI"


class ChatResponse(BaseModel):
    response: str
    status: str
    model: str
    mode: str


@app.get("/")
async def root():
    return {
        "service": EON_NAME,
        "system": EON_SYSTEM,
        "version": EON_VERSION,
        "status": "online",
        "web_intelligence": True,
    }


@app.get("/health")
async def health():
    return {
        "service": "EON Intelligence Core",
        "system": EON_SYSTEM,
        "version": EON_VERSION,
        "status": "healthy",
        "web_intelligence": True,
    }


@app.get("/api/brain")
async def brain():
    return get_brain_info()


@app.post("/api/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    message = request.message.strip()

    if not message:
        raise HTTPException(
            status_code=400,
            detail="No message received.",
        )

    mode = (
        request.mode or "NORMAL"
    ).strip().upper()

    memory_context = (
        request.memory_context or ""
    ).strip()

    destination = (
        request.destination or "AI"
    ).strip().upper()

    try:
        result = await ask_eon(
            message=message,
            mode=mode,
            memory_context=memory_context,
            destination=destination,
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
        print("EON CHAT ERROR:", error)

        raise HTTPException(
            status_code=503,
            detail=str(error),
        )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        app,
        host="0.0.0.0",
        port=10000,
    )
