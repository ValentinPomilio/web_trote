// --- BASE DE DATOS LOCAL Y CONFIGURACIÓN ---
let db = JSON.parse(localStorage.getItem('running_db')) || {
    vanesa: { km: 0, min: 0, salidas: 0, points: 0, racha: 0, record: 0, lastDate: '-', insignias: [] },
    valentin: { km: 0, min: 0, salidas: 0, points: 0, racha: 0, record: 0, lastDate: '-', insignias: [] },
    historial: [],
    mensajes: [
        { autor: 'Vanesa', fecha: '2026-06-15', texto: '¡Vamos que esta semana llegamos a las 3 horas! 🚀' },
        { autor: 'Valentín', fecha: '2026-06-16', texto: 'Hoy no tenía ganas, pero salí igual y valió la pena. 🦾' }
    ],
    retoSemanal: { desc: 'Hacer una salida de 50 minutos.', tipo: 'min50', completadoV: false, completadoVal: false }
};

const RANGOS = [
    { nom: 'Principiante', min: 0, max: 99 },
    { nom: 'Corredor Constante', min: 100, max: 249 },
    { nom: 'Resistente', min: 250, max: 499 },
    { nom: 'Maratonista Amateur', min: 500, max: 799 },
    { nom: 'Leyenda del Running', min: 800, max: Infinity }
];

const RETOS_POOL = [
    { desc: 'Salir a correr 3 veces en la semana.', tipo: 'salidas3' },
    { desc: 'Superar los 15 km totales semanales.', tipo: 'km15' },
    { desc: 'Hacer una salida de un tirón de 50 minutos.', tipo: 'min50' },
    { desc: 'Completar dos salidas en días consecutivos.', tipo: 'consecutivos' }
];

// --- SISTEMA DE NAVEGACIÓN ---
document.querySelectorAll('.nav-item').forEach(button => {
    button.addEventListener('click', () => {
        const targetSection = button.getAttribute('data-section');
        
        document.querySelectorAll('.section-view').forEach(s => s.classList.remove('active'));
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        
        document.getElementById(targetSection).classList.add('active');
        button.classList.add('active');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
});

// --- OPERACIONES DE PERSISTENCIA ---
function saveDB() {
    localStorage.setItem('running_db', JSON.stringify(db));
    updateUI();
}

function obtenerRango(puntos) {
    return RANGOS.find(r => puntos >= r.min && puntos <= r.max);
}

function calcularMetaSemanalMinutos() {
    return 120; // Meta por defecto (Semanas 1 y 2)
}

function procesarSalida(runner, fecha, km, min, comentario) {
    db[runner].km += km;
    db[runner].min += min;
    db[runner].salidas += 1;
    db[runner].lastDate = fecha;

    let ptsGanados = 10;

    // Validación de Reto Semanal
    if (db.retoSemanal.tipo === 'min50' && min >= 50) {
        if ((runner === 'vanesa' && !db.retoSemanal.completadoV) || (runner === 'valentin' && !db.retoSemanal.completadoVal)) {
            ptsGanados += 20;
            db[runner].insignias.push(`⏱️ Tirón 50m (${fecha})`);
            if(runner === 'vanesa') db.retoSemanal.completadoV = true;
            if(runner === 'valentin') db.retoSemanal.completadoVal = true;
        }
    }

    // Evaluación de rachas
    let minutosEstaSemana = db.historial
        .filter(h => h.runner === runner)
        .reduce((acc, h) => acc + h.min, 0) + min;

    if (minutosEstaSemana >= calcularMetaSemanalMinutos() && (minutosEstaSemana - min) < calcularMetaSemanalMinutos()) {
        ptsGanados += 30;
        db[runner].racha += 1;
        ptsGanados += (db[runner].racha * 15);

        if (db[runner].racha > db[runner].record) {
            db[runner].record = db[runner].racha;
            document.getElementById('streak-congrats').innerText = `¡Felicidades ${runner.toUpperCase()}! Superaste tu récord de racha 🏆`;
        }
    }

    db[runner].points += ptsGanados;

    db.historial.unshift({
        runner, fecha, km, min, comentario, puntosObtenidos: ptsGanados
    });

    saveDB();
}

// --- ACTUALIZACIÓN DE INTERFAZ GRÁFICA (UI) ---
function updateUI() {
    // Rendimiento Vanesa
    document.getElementById('v-km').innerText = db.vanesa.km.toFixed(1);
    document.getElementById('v-min').innerText = db.vanesa.min;
    document.getElementById('v-salidas').innerText = db.vanesa.salidas;
    document.getElementById('v-pts').innerText = db.vanesa.points;
    document.getElementById('v-date').innerText = db.vanesa.lastDate;
    document.getElementById('v-racha').innerText = `${db.vanesa.racha} sem`;
    document.getElementById('v-record').innerText = `${db.vanesa.record} sem`;

    // Rendimiento Valentín
    document.getElementById('v2-km').innerText = db.valentin.km.toFixed(1);
    document.getElementById('v2-min').innerText = db.valentin.min;
    document.getElementById('v2-salidas').innerText = db.valentin.salidas;
    document.getElementById('v2-pts').innerText = db.valentin.points;
    document.getElementById('v2-date').innerText = db.valentin.lastDate;
    document.getElementById('v2-racha').innerText = `${db.valentin.racha} sem`;
    document.getElementById('v2-record').innerText = `${db.valentin.record} sem`;

    // Barras de rangos
    [
        { id: 'v', user: db.vanesa },
        { id: 'v2', user: db.valentin }
    ].forEach(p => {
        let rangoActual = obtenerRango(p.user.points);
        document.getElementById(`${p.id}-range`).innerText = `Rango: ${rangoActual.nom}`;
        
        if(rangoActual.max !== Infinity) {
            let totalRango = rangoActual.max - rangoActual.min + 1;
            let progresado = p.user.points - rangoActual.min;
            let pct = Math.min(100, Math.floor((progresado / totalRango) * 100));
            document.getElementById(`${p.id}-bar`).style.width = `${pct}%`;
            document.getElementById(`${p.id}-next-range-txt`).innerText = `Progreso al siguiente rango: ${pct}%`;
        } else {
            document.getElementById(`${p.id}-bar`).style.width = `100%`;
            document.getElementById(`${p.id}-next-range-txt`).innerText = `¡Máximo rango alcanzado!`;
        }
    });

    // Estado del marcador global
    let diff = Math.abs(db.vanesa.points - db.valentin.points);
    let vsElement = document.getElementById('vs-status');
    if (db.vanesa.points > db.valentin.points) {
        vsElement.innerHTML = `🥇 <strong>Vanesa</strong> va liderando por <strong>${diff}</strong> puntos`;
    } else if (db.valentin.points > db.vanesa.points) {
        vsElement.innerHTML = `🥇 <strong>Valentín</strong> va liderando por <strong>${diff}</strong> puntos`;
    } else {
        vsElement.innerHTML = `🤝 ¡Empate perfecto actualmente con <strong>${db.vanesa.points}</strong> puntos!`;
    }

    // Retos e insignias
    document.getElementById('challenge-desc').innerText = db.retoSemanal.desc;
    let insigniasHTML = '';
    db.vanesa.insignias.forEach(ins => insigniasHTML += `<span class="badge-icon" style="border-bottom:2px solid var(--vanesa-color)">♀️ ${ins}</span>`);
    db.valentin.insignias.forEach(ins => insigniasHTML += `<span class="badge-icon" style="border-bottom:2px solid var(--valentin-color)">♂️ ${ins}</span>`);
    document.getElementById('insignias-list').innerHTML = insigniasHTML || '<p style="font-size:0.75rem; color:var(--text-muted)">Ninguna insignia obtenida esta semana.</p>';

    // Monitoreo del plan
    let metaMin = calcularMetaSemanalMinutos();
    let minVanesaSemana = db.historial.filter(h => h.runner === 'vanesa').reduce((acc,h)=> acc + h.min, 0);
    let minValentinSemana = db.historial.filter(h => h.runner === 'valentin').reduce((acc,h)=> acc + h.min, 0);

    document.getElementById('v-week-progress').style.width = `${Math.min(100, (minVanesaSemana/metaMin)*100)}%`;
    document.getElementById('v2-week-progress').style.width = `${Math.min(100, (minValentinSemana/metaMin)*100)}%`;
    document.getElementById('current-week-display').innerText = `Plan de Entrenamiento — Meta Semanal: ${metaMin} minutos sugeridos`;

    renderHistorial(db.historial);
    renderCalendario();
    renderMuro();
}

// --- RENDERIZADORES DE MÓDULOS ---
function renderHistorial(lista) {
    const container = document.getElementById('history-container');
    if(lista.length === 0) {
        container.innerHTML = `<p style="color:var(--text-muted); font-size:0.85rem; text-align:center; padding:20px;">No hay entrenamientos guardados todavía.</p>`;
        return;
    }
    
    // Mapeamos el historial original para conservar los índices correctos al eliminar
    container.innerHTML = lista.map(item => {
        // Encontrar el índice real en el array global db.historial
        const indexReal = db.historial.indexOf(item);
        
        return `
            <div class="history-item ${item.runner}">
                <div class="history-header">
                    <span>${item.runner === 'vanesa' ? '♀ Vanesa' : '♂ Valentín'}</span>
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <span style="color:var(--text-muted); font-size:0.75rem;">${item.fecha}</span>
                        <button class="delete-btn" onclick="eliminarSalida(${indexReal})" title="Eliminar registro">🗑️</button>
                    </div>
                </div>
                <div><strong>${item.km} km</strong> en <strong>${item.min} min</strong> (+${item.puntosObtenidos} Pts)</div>
                ${item.comentario ? `<div class="history-comment">"${item.comentario}"</div>` : ''}
            </div>
        `;
    }).join('');
}

// --- FUNCIÓN PARA ELIMINAR Y CORREGIR ERRORES ---
function eliminarSalida(index) {
    if (confirm('¿Estás seguro de que quieres eliminar esta salida? Se restarán los puntos y kilómetros acumulados.')) {
        const salidaEliminada = db.historial[index];
        const runner = salidaEliminada.runner;

        // Revertir estadísticas base
        db[runner].km = Math.max(0, db[runner].km - salidaEliminada.km);
        db[runner].min = Math.max(0, db[runner].min - salidaEliminada.min);
        db[runner].salidas = Math.max(0, db[runner].salidas - 1);
        db[runner].points = Math.max(0, db[runner].points - salidaEliminada.puntosObtenidos);

        // Remover el elemento del historial
        db.historial.splice(index, 1);

        // Recalcular la última fecha disponible para ese usuario
        const salidasRestantes = db.historial.filter(h => h.runner === runner);
        db[runner].lastDate = salidasRestantes.length > 0 ? salidasRestantes[0].fecha : '-';

        // Nota: Si la salida eliminada completaba un reto o racha, el usuario puede 
        // volver a ganarlo en su próxima salida válida al recalcularse los minutos semanales.

        saveDB();
    }
}

function aplicarFiltro(type, btnId) {
    document.querySelectorAll('.filter-tabs .tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(btnId).classList.add('active');
    if(type === 'all') renderHistorial(db.historial);
    else renderHistorial(db.historial.filter(h => h.runner === type));
}

document.getElementById('filter-all-btn').addEventListener('click', () => aplicarFiltro('all', 'filter-all-btn'));
document.getElementById('filter-vanesa-btn').addEventListener('click', () => aplicarFiltro('vanesa', 'filter-vanesa-btn'));
document.getElementById('filter-valentin-btn').addEventListener('click', () => aplicarFiltro('valentin', 'filter-valentin-btn'));

function renderCalendario() {
    const cal = document.getElementById('calendar-element');
    const diasSemana = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
    let html = diasSemana.map(d => `<div class="calendar-day-head">${d}</div>`).join('');

    for(let i=1; i<=14; i++) {
        let fechaStr = `2026-06-${i < 10 ? '0'+i : i}`;
        let tieneV = db.historial.some(h => h.runner === 'vanesa' && h.fecha === fechaStr);
        let tieneVal = db.historial.some(h => h.runner === 'valentin' && h.fecha === fechaStr);

        let claseClg = '';
        if(tieneV && tieneVal) claseClg = 'cal-shared';
        else if(tieneV) claseClg = 'cal-vanesa';
        else if(tieneVal) claseClg = 'cal-valentin';

        html += `<div class="calendar-day ${claseClg}">${i}</div>`;
    }
    cal.innerHTML = html;
}

function renderMuro() {
    const container = document.getElementById('wall-container');
    container.innerHTML = db.mensajes.map(m => `
        <div class="msg-card">
            <div class="msg-meta">${m.autor} • ${m.fecha}</div>
            <div>${m.texto}</div>
        </div>
    `).join('');
}

function postMessage() {
    const autor = document.getElementById('wall-author').value;
    const texto = document.getElementById('wall-msg').value.trim();
    if(!texto) return;

    const hoy = new Date().toISOString().split('T')[0];
    db.mensajes.unshift({ autor, fecha: hoy, texto });
    document.getElementById('wall-msg').value = '';
    saveDB();
}

document.getElementById('wall-send-btn').addEventListener('click', postMessage);

// --- ESCUCHA DEL FORMULARIO ---
document.getElementById('run-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const runner = document.getElementById('form-runner').value;
    const fecha = document.getElementById('form-date').value;
    const km = parseFloat(document.getElementById('form-km').value);
    const min = parseInt(document.getElementById('form-min').value);
    const comentario = document.getElementById('form-comment').value.trim();

    procesarSalida(runner, fecha, km, min, comentario);

    document.getElementById('run-form').reset();
    alert('¡Salida registrada con éxito!');
    
    document.querySelector('[data-section="sec-dashboard"]').click();
});

// --- INICIALIZADOR DE ENTORNO ---
window.onload = function() {
    document.getElementById('form-date').value = new Date().toISOString().split('T')[0];
    
    if (!db.retoSemanal.desc) {
        let randomReto = RETOS_POOL[Math.floor(Math.random() * RETOS_POOL.length)];
        db.retoSemanal = { ...randomReto, completadoV: false, completadoVal: false };
    }

    updateUI();
};