from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from ai import ask_eon
from brain import get_brain_info
from orchestration import orchestrate
from tools import run_tool_request
from vision import analyze_image
from file_analysis import analyze_uploaded_files

EON_NAME = "EON"
EON_SYSTEM = "Enhanced Operations Network"
EON_VERSION = "4.1.0"

app = FastAPI(
    title="EON — Enhanced Operations Network",
    description="EON Intelligence and Execution Backend",
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


class ToolRequest(BaseModel):
    message: str


class VisionRequest(BaseModel):
    image_base64: str
    mime_type: str
    prompt: str = "Analyze this image and describe the important visual information."


class VisionResponse(BaseModel):
    response: str
    status: str
    model: str


class OrchestrationRequest(BaseModel):
    task: str
    mode: str = "NORMAL"
    memory_context: str = ""
    agents: list[str] = Field(default_factory=list)


class OrchestrationResponse(BaseModel):
    response: str
    status: str
    model: str
    agents: list[str]


@app.get("/")
async def root():
    return {
        "service": EON_NAME,
        "system": EON_SYSTEM,
        "version": EON_VERSION,
        "status": "online",
        "capabilities": {
            "chat": True,
            "web_grounding": True,
            "vision": True,
            "files": True,
            "tools": True,
            "orchestration": True,
        },
    }


@app.get("/health")
async def health():
    return {
        "service": "EON Intelligence Core",
        "system": EON_SYSTEM,
        "version": EON_VERSION,
        "status": "healthy",
        "capabilities": {
            "chat": True,
            "web_grounding": True,
            "vision": True,
            "files": True,
            "tools": True,
            "orchestration": True,
        },
    }


@app.get("/api/brain")
async def brain():
    return get_brain_info()


@app.post("/api/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    message = request.message.strip()
    if not message:
        raise HTTPException(status_code=400, detail="No message received.")

    mode = (request.mode or "NORMAL").strip().upper()
    memory_context = (request.memory_context or "").strip()
    destination = (request.destination or "AI").strip().upper()

    try:
        result = await ask_eon(
            message=message,
            mode=mode,
            memory_context=memory_context,
            destination=destination,
        )
        return ChatResponse(
            response=result["response"],
            status=result.get("status", "success"),
            model=result.get("model", "eon-ai"),
            mode=result.get("mode", mode),
        )
    except Exception as error:
        print("EON CHAT ERROR:", error)
        raise HTTPException(status_code=503, detail=str(error))


@app.post("/api/tool")
async def tool(request: ToolRequest):
    try:
        return run_tool_request(request.message)
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error))
    except Exception as error:
        print("EON TOOL ERROR:", error)
        raise HTTPException(status_code=500, detail="Tool execution failed.")


@app.post("/api/vision", response_model=VisionResponse)
async def vision(request: VisionRequest):
    try:
        result = await analyze_image(
            image_base64=request.image_base64,
            mime_type=request.mime_type,
            prompt=request.prompt,
        )
        return VisionResponse(
            response=result["response"],
            status=result.get("status", "vision_complete"),
            model=result.get("model", "eon-vision"),
        )
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error))
    except Exception as error:
        print("EON VISION ERROR:", error)
        raise HTTPException(status_code=503, detail=str(error))


@app.post("/api/files/analyze")
async def analyze_files(
    files: list[UploadFile] = File(...),
    question: str = Form(""),
):
    if not files:
        raise HTTPException(status_code=400, detail="No files received.")

    try:
        result = await analyze_uploaded_files(files, question)
        return {
            "response": result["response"],
            "status": result.get("status", "file_analysis_complete"),
            "model": result.get("model", "eon-ai"),
            "files": [file.filename for file in files],
        }
    except HTTPException:
        raise
    except Exception as error:
        print("EON FILE ANALYSIS ERROR:", error)
        raise HTTPException(status_code=503, detail=str(error))


@app.post("/api/orchestrate", response_model=OrchestrationResponse)
async def orchestrate_request(request: OrchestrationRequest):
    task = request.task.strip()
    if not task:
        raise HTTPException(status_code=400, detail="No task received.")

    try:
        result = await orchestrate(
            task=task,
            mode=request.mode,
            memory_context=request.memory_context,
            agents=request.agents,
        )
        return OrchestrationResponse(
            response=result["response"],
            status=result.get("status", "orchestration_complete"),
            model=result.get("model", "eon-ai"),
            agents=result.get("agents", []),
        )
    except Exception as error:
        print("EON ORCHESTRATION ERROR:", error)
        raise HTTPException(status_code=503, detail=str(error))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=10000)
