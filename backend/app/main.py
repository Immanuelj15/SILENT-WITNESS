import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.core.config import settings
from backend.app.models.database import init_db
from backend.app.api.routes import router as api_router
from backend.app.api.websocket import ws_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize Database & Ensure directories
    os.makedirs(settings.TEMP_STORAGE_DIR, exist_ok=True)
    init_db()
    yield
    # Shutdown cleanup

app = FastAPI(
    title=settings.APP_NAME,
    description="Real-Time AI Safety Layer for Voice Conversations: Voice Deepfake & Social Engineering Fraud Detector",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Permits local development clients
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Attach Routers
app.include_router(api_router)
app.include_router(ws_router)

@app.get("/")
def root():
    return {
        "app": settings.APP_NAME,
        "tagline": "Don't trust the voice. Verify the conversation.",
        "status": "online",
        "docs_url": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host=settings.HOST, port=settings.PORT, reload=settings.DEBUG)
