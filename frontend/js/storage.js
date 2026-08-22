const STORAGE_KEY = 'trote_pendientes';

export function obtenerPendientesLocal() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
}

export function guardarEnLocal(carrera) {
  const pendientes = obtenerPendientesLocal();
  pendientes.push(carrera);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(pendientes));
}

export function limpiarPendientesLocal() {
  localStorage.removeItem(STORAGE_KEY);
}