let rawData = [];
let cEnergia = null, cRrhh = null;

// LINK DE GOOGLE SHEETS EN VIVO
const urlGoogleSheet = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSJbo6XXFqrrJtIxNAwdLhKsIengafF5OZYMc4l9aV3wPvp6retFo159pKfh_9o-QRT2ZziK-ltwYtC/pub?gid=0&single=true&output=csv";

// INICIA LOS ICONOS Y CARGA AUTOMATICAMENTE LOS DATOS DE LA BASE DE GOOGLE SHEET 
window.onload = () => {
    lucide.createIcons();
    cargarDatosDesdeGoogle();
};

// Función para conectar y descargar los datos desde Google Sheets en tiempo real
function cargarDatosDesdeGoogle() {
    document.getElementById('dataSourceLabel').textContent = "Conectando con Google Sheets...";
    
    Papa.parse(urlGoogleSheet, {
        download: true,
        header: true, 
        dynamicTyping: true, 
        skipEmptyLines: true,
        complete: function(results) {
            if (results.data && results.data.length > 0) {
                rawData = results.data;
                document.getElementById('dataSourceLabel').textContent = "Datos en vivo (Google Sheets)";
                calcularYRenderizarResumen();
            } else {
                document.getElementById('dataSourceLabel').textContent = "La planilla está vacía";
            }
        },
        error: function(err) {
            console.error("Error al conectar con la planilla:", err);
            document.getElementById('dataSourceLabel').textContent = "Error de conexión con la planilla";
        }
    });
}

// CAMBIAR LAS PESTAÑAS
function openTab(tabId, event) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.add('hidden'));
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('block'));
    document.querySelectorAll('.tab-btn').forEach(b => {
        b.classList.remove('border-cyan-500', 'text-cyan-400');
        b.classList.add('border-transparent', 'text-slate-400');
    });
    
    document.getElementById(tabId).classList.remove('hidden');
    document.getElementById(tabId).classList.add('block');
    event.currentTarget.classList.remove('border-transparent', 'text-slate-400');
    event.currentTarget.classList.add('border-cyan-500', 'text-cyan-400');
}

// ACA SE MANTIENE EL INPUT POR SI QUEREMOS SUBIR UN CSV MANUAL
function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
        document.getElementById('dataSourceLabel').textContent = file.name;
        Papa.parse(file, {
            header: true, 
            dynamicTyping: true, 
            skipEmptyLines: true,
            complete: function(results) {
                if (results.data && results.data.length > 0) {
                    rawData = results.data;
                    calcularYRenderizarResumen();
                } else {
                    alert('El archivo CSV está vacío.');
                }
            }
        });
    }
}

// FUNCIONES MATEMATICAS AUXILIARES
function getSum(arr, col) { 
    return arr.reduce((acc, val) => acc + (Number(val[col]) || 0), 0); 
}

function getAvg(arr, col) { 
    const sum = getSum(arr, col); 
    return arr.length ? (sum / arr.length).toFixed(1) : 0; 
}

// FUNCION DONDE CARGA LOS DATOS Y REALIZA LOS GRAFICOS CORRESPONDIENTES
function calcularYRenderizarResumen() {
    if (!rawData.length) return;
    const lastRow = rawData[rawData.length - 1]; 

    // 1. PROMEDIOS M1 (ENTRADA Y SALIDA)
    document.getElementById('m1_dbo_ent').textContent = getAvg(rawData, 'dbo_ent_m1');
    document.getElementById('m1_dbo_sal').textContent = getAvg(rawData, 'dbo_sal_m1');
    document.getElementById('m1_dqo_ent').textContent = getAvg(rawData, 'dqo_ent_m1');
    document.getElementById('m1_dqo_sal').textContent = getAvg(rawData, 'dqo_sal_m1');
    document.getElementById('m1_mes_ent').textContent = getAvg(rawData, 'mes_ent_m1');
    document.getElementById('m1_mes_sal').textContent = getAvg(rawData, 'mes_sal_m1');
    document.getElementById('m1_norma').textContent = getSum(rawData, 'fuera_norma_m1');

    // 2. PROMEDIOS M2 (ENTRADA Y SALIDA)
    document.getElementById('m2_dbo_ent').textContent = getAvg(rawData, 'dbo_ent_m2');
    document.getElementById('m2_dbo_sal').textContent = getAvg(rawData, 'dbo_sal_m2');
    document.getElementById('m2_dqo_ent').textContent = getAvg(rawData, 'dqo_ent_m2');
    document.getElementById('m2_dqo_sal').textContent = getAvg(rawData, 'dqo_sal_m2');
    document.getElementById('m2_mes_ent').textContent = getAvg(rawData, 'mes_ent_m2');
    document.getElementById('m2_mes_sal').textContent = getAvg(rawData, 'mes_sal_m2');
    document.getElementById('m2_norma').textContent = getSum(rawData, 'fuera_norma_m2');

    // 3. ACUMULADOS MENSUALES
    document.getElementById('tot_energia').textContent = getSum(rawData, 'energia_total').toLocaleString('es-AR');
    document.getElementById('tot_biosolidos').textContent = getSum(rawData, 'biosolidos_ton').toLocaleString('es-AR');
    document.getElementById('tot_arenas').textContent = getSum(rawData, 'arenas_ton').toLocaleString('es-AR');
    document.getElementById('tot_polimero').textContent = getSum(rawData, 'polimero_kg').toLocaleString('es-AR');

    // 4. MANTENIMIENTO y RRHH ACUMULADOS
    document.getElementById('mant_act').textContent = getSum(rawData, 'mant_actividades');
    document.getElementById('mant_prev').textContent = getSum(rawData, 'mant_preventivos');
    document.getElementById('mant_corr').textContent = getSum(rawData, 'mant_correctivos');
    document.getElementById('hs_extra_lbl').textContent = getSum(rawData, 'hs_extra');
    document.getElementById('rrhh_total_lbl').textContent = lastRow['rrhh_total'] || 0;

    // 5. RENDERIZAR GRAFICOS 
    Chart.defaults.color = '#94a3b8';
    Chart.defaults.font.family = 'Inter';

    // GRAFICO ENERGIA POR SECTOR
    if(cEnergia) cEnergia.destroy();
    const e_m1 = getSum(rawData, 'energia_m1');
    const e_m2 = getSum(rawData, 'energia_m2');
    const e_aux = getSum(rawData, 'energia_auxiliares');
    
    cEnergia = new Chart(document.getElementById('chartEnergiaSectores').getContext('2d'), {
        type: 'doughnut',
        data: {
            labels: ['Módulo 1', 'Módulo 2', 'Auxiliares'],
            datasets: [{ 
                data: [e_m1, e_m2, e_aux], 
                backgroundColor: ['#0099DA', '#3be3b0', '#8b5cf6'], 
                borderWidth: 0 
            }]
        },
        options: { 
            responsive: true, 
            maintainAspectRatio: false, 
            plugins: { 
                legend: { position: 'right', labels: { boxWidth: 10 } } 
            }, 
            cutout: '70%' 
        }
    });

    // GRAFICOS RRHH POR SECTOR (Barras Horizontales)
    if(cRrhh) cRrhh.destroy();
    cRrhh = new Chart(document.getElementById('chartRRHH').getContext('2d'), {
        type: 'bar',
        data: {
            labels: ['Proceso', 'Funcion.', 'Mantenim.', 'Gestión'],
            datasets: [{
                label: 'Personal Asignado',
                data: [
                    lastRow['rrhh_proceso'] || 0, 
                    lastRow['rrhh_funcionamiento'] || 0, 
                    lastRow['rrhh_mantenimiento'] || 0, 
                    lastRow['rrhh_gestion'] || 0
                ],
                backgroundColor: '#0ea5e9',
                borderRadius: 4
            }]
        },
        options: { 
            indexAxis: 'y', 
            responsive: true, 
            maintainAspectRatio: false, 
            plugins: { legend: { display: false } }, 
            scales: { 
                x: { grid: { color: 'rgba(51,65,85,0.3)' } }, 
                y: { grid: { display: false } } 
            } 
        }
    });
}
