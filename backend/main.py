from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from ai import ask_eon


app = FastAPI(
    title="EON — Enhanced Operations Network",
    version="2.3.0",
    description="EON AI Brain Backend",
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


class ChatResponse(BaseModel):
    response: str
    status: str
    model: str


@app.get("/")
async def root():
    return {
        "name": "EON",
        "system": "Enhanced Operations Network",
        "status": "ONLINE",
        "version": "2.3.0",
    }


@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "service": "EON AI Brain",
        "version": "2.3.0",
    }


@app.post(
    "/api/chat",
    response_model=ChatResponse,
)
async def chat(
    request: ChatRequest,
):
    message = request.message.strip()

    if not message:
        return ChatResponse(
            response="No command received.",
            status="empty",
            model="eon-ai",
        )

    try:
        response = ask_eon(message)

        return ChatResponse(
            response=response,
            status="success",
            model="gemini-ai",
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
