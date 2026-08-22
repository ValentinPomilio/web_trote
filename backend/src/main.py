from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Ruta corregida para el entorno Serverless de Vercel
from backend.src.database import engine, Base
from backend.src.routers.corredores_router import router as router_carreras

# Crea las tablas en Neon automáticamente
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="API Web Trote",
    description="API para gestión y estadísticas de entrenamiento de running",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router_carreras)