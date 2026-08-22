from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
from routers.corredores_router import router as router_carreras

# Crea las tablas en la base de datos local (trote.db) al iniciar
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="API Web Trote",
    description="API para gestión y estadísticas de entrenamiento de running",
    version="1.0.0"
)

# Habilita CORS para permitir peticiones desde tu celular o interfaz web local
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registra los endpoints de carreras
app.include_router(router_carreras)