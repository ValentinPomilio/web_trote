const API_URL = "/carreras";

export async function sincronizarConServidor(pendientes) {
  const res = await fetch(`${API_URL}/sincronizar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ carreras: pendientes })
  });

  if (!res.ok) throw new Error('Error en el servidor');
  return await res.json();
}

export async function obtenerEstadisticas() {
  const res = await fetch(`${API_URL}/estadisticas`);
  if (!res.ok) throw new Error('No se pudieron obtener las estadísticas');
  return await res.json();
}

export async function eliminarCarrera(id) {
  const res = await fetch(`${API_URL}/${id}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error('Error al eliminar la carrera');
  return await res.json();
}

export async function actualizarCarrera(id, datosActualizados) {
  const res = await fetch(`${API_URL}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(datosActualizados)
  });
  if (!res.ok) throw new Error('Error al actualizar la carrera');
  return await res.json();
}