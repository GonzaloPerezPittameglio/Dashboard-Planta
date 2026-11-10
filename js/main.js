let rawData = [];
let cEnergia = null;
let cCaudales = null;
let cLimites = null;

// LINK DE TU GOOGLE SHEETS EN VIVO - ¡REEMPLAZÁ ESTE LINK POR EL TUYO!
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
            } else {
                if (dsLabel) dsLabel.textContent = "Error: El Google Sheets está vacío o el link es incorrecto";
            }
        },
        error: function() {
            if (dsLabel) dsLabel.textContent = "Error de conexión con Google Sheets";
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

function setTexto(id, valor) {
    const el = document.getElementById(id);
    if (el) el.textContent = valor;
}

function calcularYRenderizarResumen() {
    if (!rawData.length) return;
    const lastRow = rawData[rawData.length - 1]; 
    Chart.defaults.color = '#94a3b8';
    Chart.defaults.font.family = 'Inter';

    try {
        // === PESTAÑA 1: RESUMEN GENERAL ===
        setTexto('m1_dbo_ent', getAvg(rawData, 'dbo_ent_m1'));
        setTexto('m1_dbo_sal', getAvg(rawData, 'dbo_sal_m1'));
        setTexto('m1_dqo_ent', getAvg(rawData, 'dqo_ent_m1'));
        setTexto('m1_dqo_sal', getAvg(rawData, 'dqo_sal_m1'));
        setTexto('m1_mes_ent', getAvg(rawData, 'mes_ent_m1'));
        setTexto('m1_mes_sal', getAvg(rawData, 'mes_sal_m1'));
        
        setTexto('m1_caudal_dis', lastRow['caudal_dis_m1'] || 0.3);
        setTexto('m1_caudal_trat', lastRow['caudal_trat_m1'] || 0);
        
        const energiaTotalM1 = getSum(rawData, 'energia_m1_ts1') + getSum(rawData, 'energia_m1_ts2') + getSum(rawData, 'energia_m1_ts3');
        setTexto('m1_energia_val', energiaTotalM1.toLocaleString('es-AR'));

        setTexto('m2_dbo_ent', getAvg(rawData, 'dbo_ent_m2'));
        setTexto('m2_dbo_sal', getAvg(rawData, 'dbo_sal_m2'));
        setTexto('m2_dqo_ent', getAvg(rawData, 'dqo_ent_m2'));
        setTexto('m2_dqo_sal', getAvg(rawData, 'dqo_sal_m2'));
        setTexto('m2_mes_ent', getAvg(rawData, 'mes_ent_m2'));
        setTexto('m2_mes_sal', getAvg(rawData, 'mes_sal_m2'));

        setTexto('m2_caudal_dis', lastRow['caudal_dis_m2'] || 0.9);
        setTexto('m2_caudal_trat', lastRow['caudal_trat_m2'] || 0);
        
        const energiaTotalM2 = getSum(rawData, 'energia_m2_ts1') + getSum(rawData, 'energia_m2_ts2') + getSum(rawData, 'energia_m2_ts3');
        setTexto('m2_energia_val', energiaTotalM2.toLocaleString('es-AR'));

        // Totales Generales
        setTexto('tot_energia', getSum(rawData, 'energia_total').toLocaleString('es-AR'));
        setTexto('tot_biosolidos', getSum(rawData, 'biosolidos_ton').toLocaleString('es-AR'));
        setTexto('tot_arenas', getSum(rawData, 'arenas_ton').toLocaleString('es-AR'));
        setTexto('tot_polimero', getSum(rawData, 'polimero_kg').toLocaleString('es-AR'));

        // RRHH
        setTexto('rrhh_total_lbl', lastRow['rrhh_total'] || 0);
        setTexto('rrhh_admin_lbl', lastRow['rrhh_admin'] || 0);
        setTexto('rrhh_operativo_lbl', lastRow['rrhh_operativo'] || 0);
        setTexto('hs_extra_lbl', getSum(rawData, 'hs_extra').toLocaleString('es-AR'));
        setTexto('hs_normales_lbl', getSum(rawData, 'hs_normales').toLocaleString('es-AR'));

        // Mantenimiento
        setTexto('mant_prev', getSum(rawData, 'mant_preventivos'));
        setTexto('mant_corr', getSum(rawData, 'mant_correctivos'));
        setTexto('mant_act', getSum(rawData, 'mant_actividades'));

        // Gráfico Energía Total
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
                    backgroundColor: ['#0284c7', '#0ea5e9', '#38bdf8', '#059669', '#10b981', '#34d399'], 
                    borderWidth: 2, borderColor: '#1e293b' 
                }]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right' } }, cutout: '65%' }
        });

        // === PESTAÑA 2: PROCESO ===
        setTexto('proc_rem_dbo_m1', calcRemocion(getAvg(rawData, 'dbo_ent_m1'), getAvg(rawData, 'dbo_sal_m1')));
        setTexto('proc_rem_dqo_m1', calcRemocion(getAvg(rawData, 'dqo_ent_m1'), getAvg(rawData, 'dqo_sal_m1')));
        setTexto('proc_rem_mes_m1', calcRemocion(getAvg(rawData, 'mes_ent_m1'), getAvg(rawData, 'mes_sal_m1')));
        setTexto('proc_norma_m1', getSum(rawData, 'fuera_norma_m1'));
        
        setTexto('proc_rem_dbo_m2', calcRemocion(getAvg(rawData, 'dbo_ent_m2'), getAvg(rawData, 'dbo_sal_m2')));
        setTexto('proc_rem_dqo_m2', calcRemocion(getAvg(rawData, 'dqo_ent_m2'), getAvg(rawData, 'dqo_sal_m2')));
        setTexto('proc_rem_mes_m2', calcRemocion(getAvg(rawData, 'mes_ent_m2'), getAvg(rawData, 'mes_sal_m2')));
        setTexto('proc_norma_m2', getSum(rawData, 'fuera_norma_m2'));

        setTexto('bio_vol_m1', getSum(rawData, 'biosolidos_m1').toLocaleString('es-AR'));
        setTexto('bio_ms_m1', getAvg(rawData, 'porc_ms_m1'));
        setTexto('bio_ton_m1', getSum(rawData, 'ton_ms_m1').toLocaleString('es-AR'));

        setTexto('bio_vol_m2', getSum(rawData, 'biosolidos_m2').toLocaleString('es-AR'));
        setTexto('bio_ms_m2', getAvg(rawData, 'porc_ms_m2'));
        setTexto('bio_ton_m2', getSum(rawData, 'ton_ms_m2').toLocaleString('es-AR'));

        // Gráfico de Caudales
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
            options: { responsive: true, maintainAspectRatio: false, scales: { y: { suggestedMax: 1.2 } } }
        });

        // Semáforo con filtrado estricto
        const diasFuera = rawData.filter(r => Number(
