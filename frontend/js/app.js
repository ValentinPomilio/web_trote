import { sincronizarConServidor, obtenerEstadisticas, eliminarCarrera, actualizarCarrera } from './api.js';
import { obtenerPendientesLocal, guardarEnLocal, limpiarPendientesLocal } from './storage.js';
import { renderizarGraficos } from './charts.js';

let carrerasCache = [];

document.addEventListener('DOMContentLoaded', () => {
  const inputFecha = document.getElementById('fecha');
  if (inputFecha) inputFecha.value = new Date().toISOString().split('T')[0];

  // Escuchadores del formulario principal y vistas
  document.getElementById('form-carrera').addEventListener('submit', manejarGuardarCarrera);
  document.getElementById('tab-btn-registro').addEventListener('click', () => cambiarPestaña('registro'));
  document.getElementById('tab-btn-stats').addEventListener('click', () => cambiarPestaña('stats'));
  document.getElementById('btn-sync').addEventListener('click', manejarSincronizacion);
  document.getElementById('btn-refresh-stats').addEventListener('click', cargarEstadisticasUI);
  
  // Modal de edición
  document.getElementById('btn-cerrar-modal').addEventListener('click', cerrarModal);
  document.getElementById('btn-cancelar-modal').addEventListener('click', cerrarModal);
  document.getElementById('form-editar-carrera').addEventListener('submit', manejarGuardarEdicion);

  document.getElementById('nivel_esfuerzo').addEventListener('input', (e) => {
    document.getElementById('esfuerzo-val').innerText = `${e.target.value} / 10`;
  });
  document.getElementById('tiene_dolores').addEventListener('change', (e) => {
    document.getElementById('box-zona-dolor').classList.toggle('hidden', !e.target.checked);
  });

  actualizarBadgeUI();
});

function cambiarPestaña(tab) {
  const btnReg = document.getElementById('tab-btn-registro');
  const btnStats = document.getElementById('tab-btn-stats');
  const secReg = document.getElementById('sec-registro');
  const secStats = document.getElementById('sec-stats');

  if (tab === 'registro') {
    secReg.classList.remove('hidden');
    secStats.classList.add('hidden');
    btnReg.className = "flex-1 py-3 text-center border-b-2 border-indigo-500 text-indigo-400 font-semibold transition";
    btnStats.className = "flex-1 py-3 text-center border-b-2 border-transparent text-slate-400 font-semibold transition";
  } else {
    secReg.classList.add('hidden');
    secStats.classList.remove('hidden');
    btnStats.className = "flex-1 py-3 text-center border-b-2 border-indigo-500 text-indigo-400 font-semibold transition";
    btnReg.className = "flex-1 py-3 text-center border-b-2 border-transparent text-slate-400 font-semibold transition";
    cargarEstadisticasUI();
  }
}

function manejarGuardarCarrera(e) {
  e.preventDefault();

  const t1 = document.getElementById('hora_inicio').value.split(':');
  const t2 = document.getElementById('hora_fin').value.split(':');
  let duracion = (parseInt(t2[0]) * 60 + parseInt(t2[1])) - (parseInt(t1[0]) * 60 + parseInt(t1[1]));
  if (duracion <= 0) duracion += 1440;

  const nuevaCarrera = {
    nombre_corredor: "Valentin",
    apellido_corredor: "Pomilio",
    fecha: document.getElementById('fecha').value,
    hora_inicio: document.getElementById('hora_inicio').value + ":00",
    hora_fin: document.getElementById('hora_fin').value + ":00",
    distancia_km: parseFloat(document.getElementById('distancia_km').value),
    duracion_minutos: duracion,
    tipo_entrenamiento: document.getElementById('tipo_entrenamiento').value,
    tipo_terreno: document.getElementById('tipo_terreno').value,
    nivel_esfuerzo: parseInt(document.getElementById('nivel_esfuerzo').value),
    tiene_dolores: document.getElementById('tiene_dolores').checked,
    zona_dolor: document.getElementById('tiene_dolores').checked ? document.getElementById('zona_dolor').value : null
  };

  guardarEnLocal(nuevaCarrera);
  actualizarBadgeUI();
  alert('✅ Carrera guardada localmente.');
  
  e.target.reset();
  document.getElementById('fecha').value = new Date().toISOString().split('T')[0];
  document.getElementById('box-zona-dolor').classList.add('hidden');
}

async function manejarSincronizacion() {
  const pendientes = obtenerPendientesLocal();
  if (pendientes.length === 0) return alert('No hay entrenamientos pendientes.');

  try {
    await sincronizarConServidor(pendientes);
    limpiarPendientesLocal();
    actualizarBadgeUI();
    alert('🚀 ¡Sincronización exitosa!');
    cargarEstadisticasUI();
  } catch (err) {
    console.error('Error de sincronización:', err);
    alert(`⚠️ No se pudo sincronizar. ${err.message}`);
  }
}

async function cargarEstadisticasUI() {
  try {
    const data = await obtenerEstadisticas();
    carrerasCache = data.historico_graficos || [];

    if (data.resumen_general) {
      document.getElementById('kpi-distancia').innerText = data.resumen_general.distancia_total_km;
      document.getElementById('kpi-pace').innerText = data.resumen_general.ritmo_promedio_general;
      document.getElementById('kpi-sesiones').innerText = data.resumen_general.total_sesiones;
      document.getElementById('kpi-dolores').innerText = data.resumen_general.porcentaje_sesiones_con_dolor + '%';
    }

    if (carrerasCache.length > 0) {
      renderizarGraficos(carrerasCache, data.resumen_general);

      const contenedor = document.getElementById('lista-carreras');
      contenedor.innerHTML = carrerasCache.map(c => `
        <div class="bg-slate-900/60 p-3 rounded-xl border border-slate-700/40 flex justify-between items-center text-xs">
          <div>
            <span class="font-bold text-slate-200 block">${c.distancia_km} km - ${c.tipo_entrenamiento}</span>
            <span class="text-slate-400">${c.fecha} • Pace: ${c.ritmo_medio} m/km</span>
          </div>
          <div class="flex items-center gap-2">
            <button class="btn-edit text-amber-400 hover:text-amber-300 p-1" data-id="${c.id}">✏️</button>
            <button class="btn-delete text-rose-400 hover:text-rose-300 p-1" data-id="${c.id}">🗑️</button>
          </div>
        </div>
      `).join('');

      // Agregar listeners dinámicos
      document.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', (e) => borrarReporte(e.currentTarget.dataset.id));
      });
      document.querySelectorAll('.btn-edit').forEach(btn => {
        btn.addEventListener('click', (e) => abrirModalEdicion(e.currentTarget.dataset.id));
      });
    }
  } catch (err) {
    console.error("Servidor sin conexión.", err);
  }
}

async function borrarReporte(id) {
  if (!confirm('¿Seguro que quieres eliminar esta carrera?')) return;
  try {
    await eliminarCarrera(id);
    alert('🗑️ Carrera eliminada.');
    cargarEstadisticasUI();
  } catch (err) {
    alert('Error al eliminar.');
  }
}

function abrirModalEdicion(id) {
  const carrera = carrerasCache.find(c => c.id == id);
  if (!carrera) return;

  document.getElementById('edit-id').value = carrera.id;
  document.getElementById('edit-fecha').value = carrera.fecha;
  document.getElementById('edit-distancia').value = carrera.distancia_km;
  document.getElementById('edit-duracion').value = carrera.duracion_minutos || 0;
  document.getElementById('edit-tipo-entrenamiento').value = carrera.tipo_entrenamiento;
  document.getElementById('edit-tipo-terreno').value = carrera.tipo_terreno || 'Asfalto';

  document.getElementById('modal-editar').classList.remove('hidden');
}

function cerrarModal() {
  document.getElementById('modal-editar').classList.add('hidden');
}

async function manejarGuardarEdicion(e) {
  e.preventDefault();
  const id = document.getElementById('edit-id').value;

  const datosModificados = {
    fecha: document.getElementById('edit-fecha').value,
    distancia_km: parseFloat(document.getElementById('edit-distancia').value),
    duracion_minutos: parseInt(document.getElementById('edit-duracion').value),
    tipo_entrenamiento: document.getElementById('edit-tipo-entrenamiento').value,
    tipo_terreno: document.getElementById('edit-tipo-terreno').value
  };

  try {
    await actualizarCarrera(id, datosModificados);
    cerrarModal();
    alert('✅ Entrenamiento actualizado correctamente.');
    cargarEstadisticasUI();
  } catch (err) {
    alert('Error al actualizar el entrenamiento.');
  }
}

function actualizarBadgeUI() {
  const pendientes = obtenerPendientesLocal();
  const badge = document.getElementById('badge-pendientes');
  if (pendientes.length > 0) {
    badge.innerText = pendientes.length;
    badge.classList.remove('hidden');
  } else {
    badge.classList.add('hidden');
  }
}