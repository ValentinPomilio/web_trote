from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List

from database import get_db
from models.corredores_models import CarreraModel
from schemas.corredores_schemas import CarreraCreate, CarreraResponse, SincronizarBatch, CarreraUpdate

router = APIRouter(prefix="/carreras", tags=["Carreras"])

def calcular_metricas_automaticas(carrera_data: dict) -> dict:
    # Si no viene el ritmo medio o la duración, los calcula automáticamente
    distancia = carrera_data.get("distancia_km", 0)
    duracion = carrera_data.get("duracion_minutos", 0)
    
    if distancia > 0 and duracion > 0:
        carrera_data["ritmo_medio"] = round(duracion / distancia, 2)
    return carrera_data

@router.post("/", response_model=CarreraResponse)
def crear_carrera(carrera: CarreraCreate, db: Session = Depends(get_db)):
    data = calcular_metricas_automaticas(carrera.model_dump())
    db_carrera = CarreraModel(**data)
    db.add(db_carrera)
    db.commit()
    db.refresh(db_carrera)
    return db_carrera

@router.post("/sincronizar", response_model=List[CarreraResponse])
def sincronizar_carreras(batch: SincronizarBatch, db: Session = Depends(get_db)):
    carreras_creadas = []
    for carrera_schema in batch.carreras:
        data = calcular_metricas_automaticas(carrera_schema.model_dump())
        db_carrera = CarreraModel(**data)
        db.add(db_carrera)
        carreras_creadas.append(db_carrera)
    
    db.commit()
    for c in carreras_creadas:
        db.refresh(c)
    return carreras_creadas

@router.get("/estadisticas")
def obtener_estadisticas_completas(db: Session = Depends(get_db)):
    total_sesiones = db.query(CarreraModel).count()
    if total_sesiones == 0:
        return {"mensaje": "Aún no hay carreras registradas."}

    distancia_total = db.query(func.sum(CarreraModel.distancia_km)).scalar() or 0.0
    tiempo_total_min = db.query(func.sum(CarreraModel.duracion_minutos)).scalar() or 0.0
    esfuerzo_promedio = db.query(func.avg(CarreraModel.nivel_esfuerzo)).scalar() or 0.0
    
    # Ritmo promedio general
    pace_promedio = round(tiempo_total_min / distancia_total, 2) if distancia_total > 0 else 0.0
    
    # Conteo de lesiones/dolores
    sesiones_con_dolor = db.query(CarreraModel).filter(CarreraModel.tiene_dolores == True).count()
    porcentaje_dolor = round((sesiones_con_dolor / total_sesiones) * 100, 1)

    # Histórico de carreras para armar gráficos en el Frontend
    carreras = db.query(CarreraModel).order_by(CarreraModel.fecha.asc()).all()
    
    historico = [
        {
            "id": c.id,
            "fecha": str(c.fecha),
            "distancia_km": c.distancia_km,
            "duracion_minutos": c.duracion_minutos,
            "ritmo_medio": c.ritmo_medio,
            "nivel_esfuerzo": c.nivel_esfuerzo,
            "tiene_dolores": c.tiene_dolores,
            "zona_dolor": c.zona_dolor,
            "tipo_entrenamiento": c.tipo_entrenamiento
        }
        for c in carreras
    ]

    return {
        "resumen_general": {
            "total_sesiones": total_sesiones,
            "distancia_total_km": round(distancia_total, 2),
            "horas_totales": round(tiempo_total_min / 60, 1),
            "ritmo_promedio_general": pace_promedio,
            "esfuerzo_promedio": round(esfuerzo_promedio, 1),
            "porcentaje_sesiones_con_dolor": porcentaje_dolor
        },
        "historico_graficos": historico
    }

# --- ELIMINAR REGISTRO ---
@router.delete("/{carrera_id}", status_code=status.HTTP_200_OK)
def eliminar_carrera(carrera_id: int, db: Session = Depends(get_db)):
    carrera = db.query(CarreraModel).filter(CarreraModel.id == carrera_id).first()
    
    if not carrera:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail=f"No se encontró el registro con ID {carrera_id}"
        )
        
    db.delete(carrera)
    db.commit()
    return {"mensaje": f"Carrera {carrera_id} eliminada correctamente"}


# --- ACTUALIZAR REGISTRO ---
@router.put("/{carrera_id}", response_model=CarreraResponse, status_code=status.HTTP_200_OK)
def actualizar_carrera(
    carrera_id: int, 
    datos: CarreraUpdate, 
    db: Session = Depends(get_db)
):
    carrera_query = db.query(CarreraModel).filter(CarreraModel.id == carrera_id)
    carrera = carrera_query.first()
    
    if not carrera:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail=f"No se encontró el registro con ID {carrera_id}"
        )

    # Convertir a dict eliminando valores no enviados
    datos_dict = datos.model_dump(exclude_unset=True)
    
    # Recalcular ritmo medio si se modifica distancia o duración
    distancia = datos_dict.get("distancia_km", carrera.distancia_km)
    duracion = datos_dict.get("duracion_minutos", carrera.duracion_minutos)
    if distancia and duracion and distancia > 0:
        datos_dict["ritmo_medio"] = round(duracion / distancia, 2)

    carrera_query.update(datos_dict, synchronize_session=False)
    db.commit()
    db.refresh(carrera)

    return carrera