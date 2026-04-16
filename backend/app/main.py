from fastapi import FastAPI
from contextlib import asynccontextmanager
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import engine, Base
from app.routers import upload, eda, training, prediction

# Todo: create tables on startup__***
Base.metadata.create_all(bind=engine)

app = FastAPI(title="NASA Aircraft RUL prediction API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_methods=['*'],
    allow_headers=["*"],
)

app.include_router(upload.router, prefix="/api", tags=["upload"])
app.include_router(eda.router, prefix="/api", tags=["eda"])
app.include_router(training.router, prefix="/api", tags=["training"])
app.include_router(prediction.router, prefix="/api", tags=["prediction"])

@app.get("/")
def root():
    return {"message": "RUL prediction API running"}
