from pydantic import BaseModel, Field
from datetime import date, time
from typing import Optional, List

class CarreraBase(BaseModel):
    nombre_corredor: str = "Valentin"
    apellido_corredor: str = "Pomilio"
    fecha: date
    hora_inicio: time
    hora_fin: time
    distancia_km: float = Field(..., gt=0)
    duracion_minutos: float = Field(..., gt=0)
    ritmo_medio: Optional[float] = None
    frecuencia_cardiaca_media: Optional[int] = None
    tipo_terreno: str = "Asfalto"
    tipo_entrenamiento: str = "Trote suave"
    calzado: Optional[str] = None
    nivel_esfuerzo: int = Field(..., ge=1, le=10)
    tiene_dolores: bool = False
    zona_dolor: Optional[str] = None
    notas: Optional[str] = None

class CarreraCreate(CarreraBase):
    pass

class CarreraResponse(CarreraBase):
    id: int

    class Config:
        from_attributes = True

class SincronizarBatch(BaseModel):
    carreras: List[CarreraCreate]

class CarreraUpdate(BaseModel):
    fecha: Optional[date] = None
    distancia_km: Optional[float] = None
    duracion_minutos: Optional[int] = None
    tipo_entrenamiento: Optional[str] = None
    tipo_terreno: Optional[str] = None
    nivel_esfuerzo: Optional[int] = None
    tiene_dolores: Optional[bool] = None
    zona_dolor: Optional[str] = None

    class Config:
        from_attributes = True