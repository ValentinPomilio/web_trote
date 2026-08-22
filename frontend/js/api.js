const API_ORIGIN = window.TROTE_API_URL || "http://127.0.0.1:8000";
const API_URL = `${API_ORIGIN.replace(/\/$/, '')}/carreras`;

async function comprobarRespuesta(res, mensaje) {
  if (res.ok) return;

  let detalle = '';
  try {
    const cuerpo = await res.json();
    detalle = cuerpo.detail || cuerpo.message || '';
  } catch {
    // La respuesta puede no ser JSON cuando Vercel falla antes de ejecutar FastAPI.
  }

  throw new Error(detalle ? `${mensaje}: ${detalle}` : `${mensaje} (${res.status})`);
}

export async function sincronizarConServidor(pendientes) {
  const res = await fetch(`${API_URL}/sincronizar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ carreras: pendientes })
  });

  await comprobarRespuesta(res, 'Error en el servidor');
  return await res.json();
}

export async function obtenerEstadisticas() {
  const res = await fetch(`${API_URL}/estadisticas`);
  await comprobarRespuesta(res, 'No se pudieron obtener las estadísticas');
  return await res.json();
}

export async function eliminarCarrera(id) {
  const res = await fetch(`${API_URL}/${id}`, {
    method: 'DELETE'
  });
  await comprobarRespuesta(res, 'Error al eliminar la carrera');
  return await res.json();
}

export async function actualizarCarrera(id, datosActualizados) {
  const res = await fetch(`${API_URL}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(datosActualizados)
  });
  await comprobarRespuesta(res, 'Error al actualizar la carrera');
  return await res.json();
}