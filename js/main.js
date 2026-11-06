let rawData = [];
let cEnergia = null;
let cCaudales = null;
let cLimites = null;

const urlGoogleSheet = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSJbo6XXFqrrJtIxNAwdLhKsIengafF5OZYMc4l9aV3wPvp6retFo159pKfh_9o-QRT2ZziK-ltwYtC/pub?gid=0&single=true&output=csv";

window.onload = () => {
    lucide.createIcons();
    cargarDatosDesdeGoogle();
};

function cargarDatosDesdeGoogle() {
    const dsLabel = document.getElementById('dataSourceLabel');
    if (dsLabel) dsLabel.textContent = "Conectando con Google Sheets...";
    
    Papa.parse(urlGoogleSheet, {
        download: true,
        header: true, 
        dynamicTyping: true, 
        skipEmptyLines: true,
        complete: function(results) {
            if (results.data && results.data.length > 0) {
                rawData = results.data;
                if (dsLabel) dsLabel.textContent = "Datos en vivo (Google Sheets)";
                calcularYRenderizarResumen();
            }
        }
    });
}

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

function getSum(arr, col) { 
    return arr.reduce((acc, val) => acc + (Number(val[col]) || 0), 0); 
}

function getAvg(arr, col) { 
    const validRows = arr.filter(row => Number(row[col]) > 0);
    if (validRows.length === 0) return 0;
    const sum = validRows.reduce((acc, val) => acc + Number(val[col]), 0);
    return (sum / validRows.length).toFixed(1); 
}

function calcRemocion(ent, sal) {
    let entrada = parseFloat(ent);
    let salida = parseFloat(sal);
    if (entrada > 0) return (((entrada - salida) / entrada) * 100).toFixed(1);
    return 0;
}

function calcularYRenderizarResumen() {
    if (!rawData.length) return;
    const lastRow = rawData[rawData.length - 1]; 
    Chart.defaults.color = '#94a3b8';
    Chart.defaults.font.family = 'Inter';

    // === PESTAÑA 1: RESUMEN ===
    document.getElementById('m1_dbo_ent').textContent = getAvg(rawData, 'dbo_ent_m1');
    document.getElementById('m1_dbo_sal').textContent = getAvg(rawData, 'dbo_sal_m1');
    document.getElementById('m1_dqo_ent').textContent = getAvg(rawData, 'dqo_ent_m1');
    document.getElementById('m1_dqo_sal').textContent = getAvg(rawData, 'dqo_sal_m1');
    document.getElementById('m1_mes_ent').textContent = getAvg(rawData, 'mes_ent_m1');
    document.getElementById('m1_mes_sal').textContent = getAvg(rawData, 'mes_sal_m1');
    document.getElementById('m1_norma').textContent = getSum(rawData, 'fuera_norma_m1');
    document.getElementById('m1_caudal_dis').textContent = lastRow['caudal_dis_m1'] || 0;
    document.getElementById('m1_caudal_trat').textContent = lastRow['caudal_trat_m1'] || 0;
    document.getElementById('m1_energia_val').textContent = getSum(rawData, 'energia_m1').toLocaleString('es-AR');

    document.getElementById('m2_dbo_ent').textContent = getAvg(rawData, 'dbo_ent_m2');
    document.getElementById('m2_dbo_sal').textContent = getAvg(rawData, 'dbo_sal_m2');
    document.getElementById('m2_dqo_ent').textContent = getAvg(rawData, 'dqo_ent_m2');
    document.getElementById('m2_dqo_sal').textContent = getAvg(rawData, 'dqo_sal_m2');
    document.getElementById('m2_mes_ent').textContent = getAvg(rawData, 'mes_ent_m2');
    document.getElementById('m2_mes_sal').textContent = getAvg(rawData, 'mes_sal_m2');
    document.getElementById('m2_norma').textContent = getSum(rawData, 'fuera_norma_m2');
    document.getElementById('m2_caudal_dis').textContent = lastRow['caudal_dis_m2'] || 0;
    document.getElementById('m2_caudal_trat').textContent = lastRow['caudal_trat_m2'] || 0;
    document.getElementById('m2_energia_val').textContent = getSum(rawData, 'energia_m2').toLocaleString('es-AR');

    document.getElementById('rrhh_total_lbl').textContent = lastRow['rrhh_total'] || 0;
    document.getElementById('rrhh_admin_lbl').textContent = lastRow['rrhh_admin'] || 0;
    document.getElementById('rrhh_operativo_lbl').textContent = lastRow['rrhh_operativo'] || 0;
    document.getElementById('hs_extra_lbl').textContent = getSum(rawData, 'hs_extra').toLocaleString('es-AR');

    document.getElementById('mant_prev').textContent = getSum(rawData, 'mant_preventivos');
    document.getElementById('mant_corr').textContent = getSum(rawData, 'mant_correctivos');
    document.getElementById('mant_act').textContent = getSum(rawData, 'mant_actividades');

    if(cEnergia) cEnergia.destroy();
    cEnergia = new Chart(document.getElementById('chartEnergiaSectores').getContext('2d'), {
        type: 'doughnut',
        data: {
            labels: ['Módulo 1', 'Módulo 2', 'Auxiliares'],
            datasets: [{ data: [getSum(rawData, 'energia_m1'), getSum(rawData, 'energia_m2'), getSum(rawData, 'energia_auxiliares')], backgroundColor: ['#0099DA', '#3be3b0', '#8b5cf6'], borderWidth: 0 }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { boxWidth: 10 } } }, cutout: '70%' }
    });

    // === PESTAÑA 2: PROCESO ===
    // Remociones
    document.getElementById('proc_rem_dbo_m1').textContent = calcRemocion(getAvg(rawData, 'dbo_ent_m1'), getAvg(rawData, 'dbo_sal_m1'));
    document.getElementById('proc_rem_dqo_m1').textContent = calcRemocion(getAvg(rawData, 'dqo_ent_m1'), getAvg(rawData, 'dqo_sal_m1'));
    document.getElementById('proc_rem_mes_m1').textContent = calcRemocion(getAvg(rawData, 'mes_ent_m1'), getAvg(rawData, 'mes_sal_m1'));
    
    document.getElementById('proc_rem_dbo_m2').textContent = calcRemocion(getAvg(rawData, 'dbo_ent_m2'), getAvg(rawData, 'dbo_sal_m2'));
    document.getElementById('proc_rem_dqo_m2').textContent = calcRemocion(getAvg(rawData, 'dqo_ent_m2'), getAvg(rawData, 'dqo_sal_m2'));
    document.getElementById('proc_rem_mes_m2').textContent = calcRemocion(getAvg(rawData, 'mes_ent_m2'), getAvg(rawData, 'mes_sal_m2'));

    // Biosólidos (Acumulados y promedios)
    document.getElementById('bio_vol_m1').textContent = getSum(rawData, 'biosolidos_m1').toLocaleString('es-AR');
    document.getElementById('bio_ms_m1').textContent = getAvg(rawData, 'porc_ms_m1');
    document.getElementById('bio_ton_m1').textContent = getSum(rawData, 'ton_ms_m1').toLocaleString('es-AR');

    document.getElementById('bio_vol_m2').textContent = getSum(rawData, 'biosolidos_m2').toLocaleString('es-AR');
    document.getElementById('bio_ms_m2').textContent = getAvg(rawData, 'porc_ms_m2');
    document.getElementById('bio_ton_m2').textContent = getSum(rawData, 'ton_ms_m2').toLocaleString('es-AR');

    // Gráfico de Caudales M1 y M2
    const fechas = rawData.map(r => r.fecha || ''); 
    const caudalesM1 = rawData.map(r => r.caudal_trat_m1 || 0);
    const caudalesM2 = rawData.map(r => r.caudal_trat_m2 || 0);

    if(cCaudales) cCaudales.destroy();
    cCaudales = new Chart(document.getElementById('chartCaudalesLine').getContext('2d'), {
        type: 'line',
        data: {
            labels: fechas,
            datasets: [
                { label: 'Caudal M1 (m³/h)', data: caudalesM1, borderColor: '#22d3ee', backgroundColor: 'rgba(34, 211, 238, 0.1)', fill: true, tension: 0.4 },
                { label: 'Caudal M2 (m³/h)', data: caudalesM2, borderColor: '#34d399', backgroundColor: 'rgba(52, 211, 153, 0.1)', fill: true, tension: 0.4 }
            ]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top' } } }
    });

    // Control de 37 Días (Fuera de Norma)
    const diasFuera = rawData.filter(r => r.fuera_norma_m1 > 0 || r.fuera_norma_m2 > 0);
    const diasRestantes = 37 - diasFuera.length;
    
    let labelRestantes = document.getElementById('dias_restantes_norma');
    labelRestantes.textContent = diasRestantes;
    
    // Cambiar a rojo si quedan pocos días
    if(diasRestantes <= 10) labelRestantes.classList.add('text-red-500');
    else labelRestantes.classList.remove('text-red-500');

    let divFechas = document.getElementById('fechas_fuera_norma');
    if (diasFuera.length === 0) {
        divFechas.innerHTML = '<span class="bg-green-900/30 text-green-400 px-3 py-1 rounded border border-green-800 text-sm">Planta 100% en norma este año.</span>';
    } else {
        divFechas.innerHTML = diasFuera.map(d => `<span class="bg-red-900/40 text-red-300 px-3 py-1 rounded border border-red-800 text-sm font-medium shadow-sm">${d.fecha || 'Sin fecha'}</span>`).join('');
    }

    // Dibujar el gráfico de límites (por defecto DBO Ent)
    updateChartLimites('dbo_ent', document.querySelector('.chart-btn.active'));
}

// Función global para actualizar el gráfico interactivo de Límites
window.updateChartLimites = function(param, btnElement) {
    if (!rawData || rawData.length === 0) return;
    
    // Actualizar botones (colores)
    if (btnElement) {
        document.querySelectorAll('.chart-btn').forEach(b => b.classList.remove('active', 'bg-sky-500', 'text-white', 'border-sky-500'));
        btnElement.classList.add('active', 'bg-sky-500', 'text-white', 'border-sky-500');
    }

    const fechas = rawData.map(r => r.fecha || '');
    let dataM1 = [], dataM2 = [], maxLimit = 0, title = '';

    if (param === 'dbo_ent') {
        dataM1 = rawData.map(r => r.dbo_ent_m1 || 0); dataM2 = rawData.map(r => r.dbo_ent_m2 || 0);
        maxLimit = 200; title = 'DBO Entrada';
    } else if (param === 'dbo_sal') {
        dataM1 = rawData.map(r => r.dbo_sal_m1 || 0); dataM2 = rawData.map(r => r.dbo_sal_m2 || 0);
        maxLimit = 30; title = 'DBO Salida';
    } else if (param === 'dqo_sal') {
        dataM1 = rawData.map(r => r.dqo_sal_m1 || 0); dataM2 = rawData.map(r => r.dqo_sal_m2 || 0);
        maxLimit = 125; title = 'DQO Salida';
    } else if (param === 'mes_sal') {
        dataM1 = rawData.map(r => r.mes_sal_m1 || 0); dataM2 = rawData.map(r => r.mes_sal_m2 || 0);
        maxLimit = 35; title = 'MES Salida';
    }

    // Crear arreglo constante para la línea roja del Límite Máximo
    const limitLine = Array(fechas.length).fill(maxLimit);

    if (cLimites) cLimites.destroy();
    cLimites = new Chart(document.getElementById('chartLimitesLine').getContext('2d'), {
        type: 'line',
        data: {
            labels: fechas,
            datasets: [
                { label: `${title} M1`, data: dataM1, borderColor: '#22d3ee', borderWidth: 2, tension: 0.2 },
                { label: `${title} M2`, data: dataM2, borderColor: '#34d399', borderWidth: 2, tension: 0.2 },
                { label: `Límite Legal (${maxLimit})`, data: limitLine, borderColor: '#ef4444', borderWidth: 2, borderDash: [5, 5], pointRadius: 0, fill: false }
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { position: 'top' } },
            scales: { y: { suggestedMax: maxLimit * 1.2 } } // Para que la línea roja nunca quede tocando el techo visual del gráfico
        }
    });
};
