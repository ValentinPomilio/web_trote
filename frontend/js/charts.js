let chartEvolucionInstance = null;
let chartTerrenosInstance = null;

// Configuración global de colores para Chart.js en modo oscuro
Chart.defaults.color = '#94a3b8';
Chart.defaults.borderColor = '#334155';

export function renderizarGraficos(historico, resumen) {
  if (!historico || historico.length === 0) return;

  // Ordenar de más antiguo a más reciente para la línea temporal
  const historicoOrdenado = [...historico].reverse();

  renderEvolucion(historicoOrdenado);
  renderTerrenos(historicoOrdenado);
}

function renderEvolucion(datos) {
  const ctx = document.getElementById('chart-evolucion').getContext('2d');

  if (chartEvolucionInstance) {
    chartEvolucionInstance.destroy();
  }

  const etiquetas = datos.map(d => d.fecha);
  const distancias = datos.map(d => d.distancia_km);
  const ritmos = datos.map(d => parseFloat(d.ritmo_medio));

  chartEvolucionInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: etiquetas,
      datasets: [
        {
          label: 'Distancia (km)',
          data: distancias,
          backgroundColor: 'rgba(249, 115, 22, 0.6)',
          borderColor: '#f97316',
          borderWidth: 1,
          yAxisID: 'y1',
          borderRadius: 6
        },
        {
          label: 'Ritmo (min/km)',
          data: ritmos,
          type: 'line',
          borderColor: '#818cf8',
          backgroundColor: '#818cf8',
          borderWidth: 2,
          tension: 0.3,
          pointRadius: 4,
          yAxisID: 'y2'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: { font: { size: 10 } }
        }
      },
      scales: {
        x: {
          ticks: { font: { size: 10 } }
        },
        y1: {
          type: 'linear',
          position: 'left',
          title: { display: true, text: 'Km', font: { size: 10 } },
          ticks: { font: { size: 9 } }
        },
        y2: {
          type: 'linear',
          position: 'right',
          title: { display: true, text: 'Min/km', font: { size: 10 } },
          grid: { drawOnChartArea: false },
          ticks: { font: { size: 9 } }
        }
      }
    }
  });
}

function renderTerrenos(datos) {
  const ctx = document.getElementById('chart-terrenos').getContext('2d');

  if (chartTerrenosInstance) {
    chartTerrenosInstance.destroy();
  }

  // Contar frecuencias por tipo de terreno
  const conteoTerrenos = {};
  datos.forEach(d => {
    const terreno = d.tipo_terreno || 'Asfalto';
    conteoTerrenos[terreno] = (conteoTerrenos[terreno] || 0) + 1;
  });

  chartTerrenosInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: Object.keys(conteoTerrenos),
      datasets: [{
        data: Object.values(conteoTerrenos),
        backgroundColor: [
          '#f97316', // Asfalto (Naranja)
          '#10b981', // Pista (Verde)
          '#3b82f6', // Tierra (Azul)
          '#a855f7'  // Cinta (Púrpura)
        ],
        borderWidth: 2,
        borderColor: '#1e293b'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right',
          labels: { font: { size: 11 }, boxWidth: 12 }
        }
      }
    }
  });
}