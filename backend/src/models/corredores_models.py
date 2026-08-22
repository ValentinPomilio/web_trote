from sqlalchemy import Column, Integer, String, Date, Time, Float, Boolean, Text
from database import Base

class CarreraModel(Base):
    __tablename__ = "carreras"

    id = Column(Integer, primary_key=True, index=True)
    nombre_corredor = Column(String, default="Valentin")
    apellido_corredor = Column(String, default="Pomilio")
    fecha = Column(Date, index=True)
    hora_inicio = Column(Time)
    hora_fin = Column(Time)
    
    # Rendimiento
    distancia_km = Column(Float)
    duracion_minutos = Column(Float)
    ritmo_medio = Column(Float)  # En min/km (ej: 5.15)
    frecuencia_cardiaca_media = Column(Integer, nullable=True)
    
    # Contexto
    tipo_terreno = Column(String, default="Asfalto") # Asfalto, Pista, Tierra, Cinta
    tipo_entrenamiento = Column(String, default="Trote suave") # Fondo, Pasadas, Trote suave, Competencia
    calzado = Column(String, nullable=True)
    
    # Sensaciones y Salud
    nivel_esfuerzo = Column(Integer)  # 1 a 10
    tiene_dolores = Column(Boolean, default=False)
    zona_dolor = Column(String, nullable=True)  # Rodilla, Tobillo, etc.
    notas = Column(Text, nullable=True)