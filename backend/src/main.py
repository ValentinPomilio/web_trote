import sys
import os

# Agrega la carpeta 'src' al path de Python para evitar ModuleNotFoundError en Vercel
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Imports directos (ya no requieren el prefijo backend.src gracias al sys.path de arriba)
from database import engine, Base
from routers.corredores_router import router as router_carreras

try:
    Base.metadata.create_all(bind=engine)
except Exception as e:
    print(f"Error creando tablas: {e}")

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