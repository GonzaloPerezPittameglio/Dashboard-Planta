let rawData = [];
let cEnergia = null;
let cCaudales = null;
let cLimites = null;

// LINK DE TU GOOGLE SHEETS EN VIVO
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
    
    // Aquí sacamos el document.getElementById('m1_norma') porque lo borramos del HTML del resumen
    
    document.getElementById('m1_caudal_dis').textContent = lastRow['caudal_dis_m1'] || 0.3; // Fijo si no está
    document.getElementById('m1_caudal_trat').textContent = lastRow['caudal_trat_m1'] || 0;
    
    const energiaTotalM1 = getSum(rawData, 'energia_m1_ts1') + getSum(rawData, 'energia_m1_ts2') + getSum(rawData, 'energia_m1_ts3');
    document.getElementById('m1_energia_val').textContent = energiaTotalM1.toLocaleString('es-AR');

    document.getElementById('m2_dbo_ent').textContent = getAvg(rawData, 'dbo_ent_m2');
    document.getElementById('m2_dbo_sal').textContent = getAvg(rawData, 'dbo_sal_m2');
    document.getElementById('m2_dqo_ent').textContent = getAvg(rawData, 'dqo_ent_m2');
    document.getElementById('m2_dqo_sal').textContent = getAvg(rawData, 'dqo_sal_m2');
    document.getElementById('m2_mes_ent').textContent = getAvg(rawData, 'mes_ent_m2');
    document.getElementById('m2_mes_sal').textContent = getAvg(rawData, 'mes_sal_m2');
    
    // Aquí sacamos el document.getElementById('m2_norma') porque lo borramos del HTML del resumen

    document.getElementById('m2_caudal_dis').textContent = lastRow['caudal_dis_m2'] || 0.9; // Fijo si no está
    document.getElementById('m2_caudal_trat').textContent = lastRow['caudal_trat_m2'] || 0;
    
    const energiaTotalM2 = getSum(rawData, 'energia_m2_ts1') + getSum(rawData, 'energia_m2_ts2') + getSum(rawData, 'energia_m2_ts3');
    document.getElementById('m2_energia_val').textContent = energiaTotalM2.toLocaleString('es-AR');

    // Totales Generales
    document.getElementById('tot_energia').textContent = getSum(rawData, 'energia_total').toLocaleString('es-AR');
    document.getElementById('tot_biosolidos').textContent = getSum(rawData, 'biosolidos_ton').toLocaleString('es-AR');
    document.getElementById('tot_arenas').textContent = getSum(rawData, 'arenas_ton').toLocaleString('es-AR');
    document.getElementById('tot_polimero').textContent = getSum(rawData, 'polimero_kg').toLocaleString('es-AR');

    // RRHH
    document.getElementById('rrhh_total_lbl').textContent = lastRow['rrhh_total'] || 0;
    document.getElementById('rrhh_admin_lbl').textContent = lastRow['rrhh_admin'] || 0;
    document.getElementById('rrhh_operativo_lbl').textContent = lastRow['rrhh_operativo'] || 0;
    document.getElementById('hs_extra_lbl').textContent = getSum(rawData, 'hs_extra').toLocaleString('es-AR');
    document.getElementById('hs_normales_lbl').textContent = getSum(rawData, 'hs_normales').toLocaleString('es-AR');

    // Mantenimiento
    document.getElementById('mant_prev').textContent = getSum(rawData, 'mant_preventivos');
    document.getElementById('mant_corr').textContent = getSum(rawData, 'mant_correctivos');
    document.getElementById('mant_act').textContent = getSum(rawData, 'mant_actividades');

    // Gráfico Energía Total (Desglose M1 y M2 por TS)
    if(cEnergia) cEnergia.destroy();
    
    const e_m1_ts1 = getSum(rawData, 'energia_m1_ts1');
    const e_m1_ts2 = getSum(rawData, 'energia_m1_ts2');
    const e_m1_ts3 = getSum(rawData, 'energia_m1_ts3');
    
    const e_m2_ts1 = getSum(rawData, 'energia_m2_ts1');
    const e_m2_ts2 = getSum(rawData, 'energia_m2_ts2');
    const e_m2_ts3 = getSum(rawData, 'energia_m2_ts3');
    
    cEnergia = new Chart(document.getElementById('chartEnergiaSectores').getContext('2d'), {
        type: 'doughnut',
        data: {
            labels: ['M1 - TS1', 'M1 - TS2', 'M1 - TS3', 'M2 - TS1', 'M2 - TS2', 'M2 - TS3'],
            datasets: [{ 
                data: [e_m1_ts1, e_m1_ts2, e_m1_ts3, e_m2_ts1, e_m2_ts2, e_m2_ts3], 
                backgroundColor: [
                    '#0284c7', '#0ea5e9', '#38bdf8', // 3 tonos de azul para M1
                    '#059669', '#10b981', '#34d399'  // 3 tonos de verde para M2
                ], 
                borderWidth: 2, 
                borderColor: '#1e293b' 
            }]
        },
        options: { 
            responsive: true, maintainAspectRatio: false, 
            plugins: { legend: { position: 'right', labels: { boxWidth: 12, color: '#94a3b8', padding: 15 } } }, 
            cutout: '65%' 
        }
    });

    // === PESTAÑA 2: PROCESO ===
    // Remociones
    document.getElementById('proc_rem_dbo_m1').textContent = calcRemocion(getAvg(rawData, 'dbo_ent_m1'), getAvg(rawData, 'dbo_sal_m1'));
    document.getElementById('proc_rem_dqo_m1').textContent = calcRemocion(getAvg(rawData, 'dqo_ent_m1'), getAvg(rawData, 'dqo_sal_m1'));
    document.getElementById('proc_rem_mes_m1').textContent = calcRemocion(getAvg(rawData, 'mes_ent_m1'), getAvg(rawData, 'mes_sal_m1'));
    
    // Estos "fuera de norma" sí se quedan porque están en la pestaña Proceso
    document.getElementById('proc_norma_m1').textContent = getSum(rawData, 'fuera_norma_m1');
    
    document.getElementById('proc_rem_dbo_m2').textContent = calcRemocion(getAvg(rawData, 'dbo_ent_m2'), getAvg(rawData, 'dbo_sal_m2'));
    document.getElementById('proc_rem_dqo_m2').textContent = calcRemocion(getAvg(rawData, 'dqo_ent_m2'), getAvg(rawData, 'dqo_sal_m2'));
    document.getElementById('proc_rem_mes_m2').textContent = calcRemocion(getAvg(rawData, 'mes_ent_m2'), getAvg(rawData, 'mes_sal_m2'));

    document.getElementById('proc_norma_m2').textContent = getSum(rawData, 'fuera_norma_m2');

    // Biosólidos (Acumulados y promedios)
    document.getElementById('bio_vol_m1').textContent = getSum(rawData, 'biosolidos_m1').toLocaleString('es-AR');
    document.getElementById('bio_ms_m1').textContent = getAvg(rawData, 'porc_ms_m1');
    document.getElementById('bio_ton_m1').textContent = getSum(rawData, 'ton_ms_m1').toLocaleString('es-AR');

    document.getElementById('bio_vol_m2').textContent = getSum(rawData, 'biosolidos_m2').toLocaleString('es-AR');
    document.getElementById('bio_ms_m2').textContent = getAvg(rawData, 'porc_ms_m2');
    document.getElementById('bio_ton_m2').textContent = getSum(rawData, 'ton_ms_m2').toLocaleString('es-AR');

    // Gráfico de Caudales M1 y M2 (con líneas de diseño en m³/s)
    const fechas = rawData.map(r => r.fecha || ''); 
    const caudalesM1 = rawData.map(r => r.caudal_trat_m1 || 0);
    const caudalesM2 = rawData.map(r => r.caudal_trat_m2 || 0);
    
    const disenoM1 = Array(fechas.length).fill(0.3);
    const disenoM2 = Array(fechas.length).fill(0.9);

    if(cCaudales) cCaudales.destroy();
    cCaudales = new Chart(document.getElementById('chartCaudalesLine').getContext('2d'), {
        type: 'line',
        data: {
            labels: fechas,
            datasets: [
                { label: 'Caudal Tratado M1', data: caudalesM1, borderColor: '#22d3ee', backgroundColor: 'rgba(34, 211, 238, 0.1)', fill: true, tension: 0.4 },
                { label: 'Diseño M1 (0.3)', data: disenoM1, borderColor: '#0284c7', borderWidth: 2, borderDash: [5, 5], pointRadius: 0, fill: false },
                { label: 'Caudal Tratado M2', data: caudalesM2, borderColor: '#34d399', backgroundColor: 'rgba(52, 211, 153, 0.1)', fill: true, tension: 0.4 },
                { label: 'Diseño M2 (0.9)', data: disenoM2, borderColor: '#059669', borderWidth: 2, borderDash: [5, 5], pointRadius: 0, fill: false }
            ]
        },
        options: { 
            responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top' } },
            scales: { y: { suggestedMax: 1.2, title: { display: true, text: 'Caudal (m³/s)', color: '#94a3b8' } } }
        }
    });

    // Control de 37 Días (Fuera de Norma con BOTONES interactivos)
    const diasFuera = rawData.filter(r => r.fuera_norma_m1 > 0 || r.fuera_norma_m2 > 0);
    const diasRestantes = 37 - diasFuera.length;
    
    let labelRestantes = document.getElementById('dias_restantes_norma');
    labelRestantes.textContent = diasRestantes;
    
    if(diasRestantes <= 10) labelRestantes.classList.add('text-red-500');
    else labelRestantes.classList.remove('text-red-500');

    let divFechas = document.getElementById('fechas_fuera_norma');
    if (diasFuera.length === 0) {
        divFechas.innerHTML = '<span class="bg-green-900/30 text-green-400 px-3 py-1 rounded border border-green-800 text-sm">Planta 100% en norma.</span>';
    } else {
        // Genera los botones que abren el modal emergente con el motivo
        divFechas.innerHTML = diasFuera.map(d => {
            const fechaTxt = d.fecha || 'Sin fecha';
            const motivoTxt = (d.motivo_desvio || 'Sin motivo registrado').replace(/'/g, "\\'"); 
            return `<button onclick="mostrarMotivo('${fechaTxt}', '${motivoTxt}')" class="bg-red-900/40 hover:bg-red-800/80 text-red-300 px-3 py-1.5 rounded-lg border border-red-800 text-sm font-medium shadow-sm transition cursor-pointer">${fechaTxt}</button>`;
        }).join('');
    }

    // Dibujar el gráfico de límites interactivo
    updateChartLimites('dbo_ent', document.querySelector('.chart-btn.active'));
}

// Función global para abrir la ventana emergente con el motivo del desvío
window.mostrarMotivo = function(fecha, motivo) {
    document.getElementById('modalFecha').textContent = 'Desvío: ' + fecha;
    document.getElementById('modalMotivo').textContent = motivo;
    document.getElementById('modalDesvio').classList.remove('hidden');
};

// Función global para el gráfico de DBO/DQO/MES
window.updateChartLimites = function(param, btnElement) {
    if (!rawData || rawData.length === 0) return;
    
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
            responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top' } },
            scales: { y: { suggestedMax: maxLimit * 1.2 } } 
        }
    });
};
