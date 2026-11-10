let rawData = [];
let cEnergia = null;
let cCaudales = null;
let cLimites = null;

// Conector oficial de Google Sheets (Infalible contra bloqueos de red)
const sheetId = "17QH5BKXgwZJexRd34iD4tC_nJckI4HVT1TrK3yGiCOA";
const urlGoogleSheet = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&gid=0`;

window.onload = () => {
    lucide.createIcons();
    cargarDatosDesdeGoogle();
};

function cargarDatosDesdeGoogle() {
    const dsLabel = document.getElementById('dataSourceLabel');
    if (dsLabel) dsLabel.textContent = "Conectando con Google Sheets...";
    
    // Evitamos caché del navegador
    const conCache = urlGoogleSheet + "&_t=" + Date.now();

    Papa.parse(conCache, {
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
                if (dsLabel) dsLabel.textContent = "Error: Planilla vacía";
            }
        },
        error: function(err) {
            console.error("Error PapaParse:", err);
            if (dsLabel) dsLabel.textContent = "Error de conexión con la planilla";
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

function getCleanNumber(val) {
    if (val === null || val === undefined || val === '') return 0;
    if (typeof val === 'number') return isNaN(val) ? 0 : val;
    let clean = String(val).replace(',', '.').replace(/[^\d.-]/g, '').trim();
    let num = parseFloat(clean);
    return isNaN(num) ? 0 : num;
}

function getVal(row, colName) {
    if (!row) return undefined;
    if (row[colName] !== undefined) return row[colName];
    
    const target = colName.toLowerCase().trim();
    for (let k of Object.keys(row)) {
        if (k.toLowerCase().trim() === target) return row[k];
    }

    const aliasMap = {
        'caudal_trat_m1': ['cuadal_trat_m1', 'caudal_m1', 'trat_m1'],
        'caudal_trat_m2': ['cuadal_trat_m2', 'caudal_m2', 'trat_m2'],
        'caudal_dis_m1': ['caudal_dis_m1'],
        'caudal_dis_m2': ['caudal_dis_m2']
    };

    if (aliasMap[colName]) {
        for (let alt of aliasMap[colName]) {
            for (let k of Object.keys(row)) {
                if (k.toLowerCase().trim() === alt) return row[k];
            }
        }
    }
    return undefined;
}

function getSum(arr, col) { 
    return arr.reduce((acc, row) => acc + getCleanNumber(getVal(row, col)), 0); 
}

function getAvg(arr, col) { 
    const validRows = arr.filter(row => getCleanNumber(getVal(row, col)) > 0);
    if (validRows.length === 0) return 0;
    const sum = validRows.reduce((acc, row) => acc + getCleanNumber(getVal(row, col)), 0);
    return (sum / validRows.length).toFixed(1); 
}

function calcRemocion(ent, sal) {
    let entrada = getCleanNumber(ent);
    let salida = getCleanNumber(sal);
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
        
        setTexto('m1_caudal_dis', getCleanNumber(getVal(lastRow, 'caudal_dis_m1')) || 0.3);
        setTexto('m1_caudal_trat', getCleanNumber(getVal(lastRow, 'caudal_trat_m1')) || 0);
        
        const energiaTotalM1 = getSum(rawData, 'energia_m1_ts1') + getSum(rawData, 'energia_m1_ts2') + getSum(rawData, 'energia_m1_ts3');
        setTexto('m1_energia_val', energiaTotalM1.toLocaleString('es-AR'));

        setTexto('m2_dbo_ent', getAvg(rawData, 'dbo_ent_m2'));
        setTexto('m2_dbo_sal', getAvg(rawData, 'dbo_sal_m2'));
        setTexto('m2_dqo_ent', getAvg(rawData, 'dqo_ent_m2'));
        setTexto('m2_dqo_sal', getAvg(rawData, 'dqo_sal_m2'));
        setTexto('m2_mes_ent', getAvg(rawData, 'mes_ent_m2'));
        setTexto('m2_mes_sal', getAvg(rawData, 'mes_sal_m2'));

        setTexto('m2_caudal_dis', getCleanNumber(getVal(lastRow, 'caudal_dis_m2')) || 0.9);
        setTexto('m2_caudal_trat', getCleanNumber(getVal(lastRow, 'caudal_trat_m2')) || 0);
        
        const energiaTotalM2 = getSum(rawData, 'energia_m2_ts1') + getSum(rawData, 'energia_m2_ts2') + getSum(rawData, 'energia_m2_ts3');
        setTexto('m2_energia_val', energiaTotalM2.toLocaleString('es-AR'));

        // Totales Generales
        setTexto('tot_energia', getSum(rawData, 'energia_total').toLocaleString('es-AR'));
        setTexto('tot_biosolidos', getSum(rawData, 'biosolidos_ton').toLocaleString('es-AR'));
        setTexto('tot_arenas', getSum(rawData, 'arenas_ton').toLocaleString('es-AR'));
        setTexto('tot_polimero', getSum(rawData, 'polimero_kg').toLocaleString('es-AR'));

        // RRHH
        setTexto('rrhh_total_lbl', getCleanNumber(getVal(lastRow, 'rrhh_total')));
        setTexto('rrhh_admin_lbl', getCleanNumber(getVal(lastRow, 'rrhh_admin')));
        setTexto('rrhh_operativo_lbl', getCleanNumber(getVal(lastRow, 'rrhh_operativo')));
        setTexto('hs_extra_lbl', getSum(rawData, 'hs_extra').toLocaleString('es-AR'));
        setTexto('hs_normales_lbl', getSum(rawData, 'hs_normales').toLocaleString('es-AR'));

        // Mantenimiento
        setTexto('mant_prev', getSum(rawData, 'mant_preventivos'));
        setTexto('mant_corr', getSum(rawData, 'mant_correctivos'));
        setTexto('mant_act', getSum(rawData, 'mant_actividades'));

        // Gráfico de Energía
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
        const fechas = rawData.map(r => getVal(r, 'fecha') || ''); 
        const caudalesM1 = rawData.map(r => getCleanNumber(getVal(r, 'caudal_trat_m1')));
        const caudalesM2 = rawData.map(r => getCleanNumber(getVal(r, 'caudal_trat_m2')));
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

        // Semáforo de Desvíos
        const diasFuera = rawData.filter(r => {
            const fn1 = getCleanNumber(getVal(r, 'fuera_norma_m1'));
            const fn2 = getCleanNumber(getVal(r, 'fuera_norma_m2'));
            const motivo = getVal(r, 'motivo_desvio');
            const tieneMotivo = motivo && String(motivo).trim() !== '';
            return fn1 > 0 || fn2 > 0 || tieneMotivo;
        });
        
        const diasRestantes = 37 - diasFuera.length;
        
        const labelRestantes = document.getElementById('dias_restantes_norma');
        if (labelRestantes) {
            labelRestantes.textContent = diasRestantes;
            if(diasRestantes <= 10) labelRestantes.classList.add('text-red-500');
            else labelRestantes.classList.remove('text-red-500');
        }

        const divFechas = document.getElementById('fechas_fuera_norma');
        if (divFechas) {
            if (diasFuera.length === 0) {
                divFechas.innerHTML = '<span class="bg-green-900/30 text-green-400 px-3 py-1 rounded border border-green-800 text-sm">Planta 100% en norma.</span>';
            } else {
                divFechas.innerHTML = diasFuera.map(d => {
                    const fechaTxt = getVal(d, 'fecha') || 'Sin fecha';
                    const motivoTxt = String(getVal(d, 'motivo_desvio') || 'Sin motivo registrado').replace(/'/g, "\\'"); 
                    return `<button onclick="mostrarMotivo('${fechaTxt}', '${motivoTxt}')" class="bg-red-900/40 hover:bg-red-800/80 text-red-300 px-3 py-1.5 rounded-lg border border-red-800 text-sm font-medium shadow-sm transition cursor-pointer">${fechaTxt}</button>`;
                }).join('');
            }
        }

        updateChartLimites('dbo_ent', document.querySelector('.chart-btn.active'));

    } catch (e) {
        console.error("Error al renderizar los gráficos:", e);
    }
}

window.mostrarMotivo = function(fecha, motivo) {
    const elFecha = document.getElementById('modalFecha');
    const elMotivo = document.getElementById('modalMotivo');
    const elModal = document.getElementById('modalDesvio');
    if (elFecha && elMotivo && elModal) {
        elFecha.textContent = 'Desvío: ' + fecha;
        elMotivo.textContent = motivo;
        elModal.classList.remove('hidden');
    }
};

window.updateChartLimites = function(param, btnElement) {
    if (!rawData || rawData.length === 0) return;
    
    if (btnElement) {
        document.querySelectorAll('.chart-btn').forEach(b => b.classList.remove('active', 'bg-sky-500', 'text-white', 'border-sky-500'));
        btnElement.classList.add('active', 'bg-sky-500', 'text-white', 'border-sky-500');
    }

    const fechas = rawData.map(r => getVal(r, 'fecha') || '');
    let dataM1 = [], dataM2 = [], maxLimit = 0, title = '';

    if (param === 'dbo_ent') {
        dataM1 = rawData.map(r => getCleanNumber(getVal(r, 'dbo_ent_m1')));
        dataM2 = rawData.map(r => getCleanNumber(getVal(r, 'dbo_ent_m2')));
        maxLimit = 200; title = 'DBO Entrada';
    } else if (param === 'dbo_sal') {
        dataM1 = rawData.map(r => getCleanNumber(getVal(r, 'dbo_sal_m1')));
        dataM2 = rawData.map(r => getCleanNumber(getVal(r, 'dbo_sal_m2')));
        maxLimit = 30; title = 'DBO Salida';
    } else if (param === 'dqo_sal') {
        dataM1 = rawData.map(r => getCleanNumber(getVal(r, 'dqo_sal_m1')));
        dataM2 = rawData.map(r => getCleanNumber(getVal(r, 'dqo_sal_m2')));
        maxLimit = 125; title = 'DQO Salida';
    } else if (param === 'mes_sal') {
        dataM1 = rawData.map(r => getCleanNumber(getVal(r, 'mes_sal_m1')));
        dataM2 = rawData.map(r => getCleanNumber(getVal(r, 'mes_sal_m2')));
        maxLimit = 35; title = 'MES Salida';
    }

    const limitLine = Array(fechas.length).fill(maxLimit);

    if (cLimites) cLimites.destroy();
    const ctx = document.getElementById('chartLimitesLine');
    if (!ctx) return;
    
    cLimites = new Chart(ctx.getContext('2d'), {
        type: 'line',
        data: {
            labels: fechas,
            datasets: [
                { label: `${title} M1`, data: dataM1, borderColor: '#22d3ee', borderWidth: 2, tension: 0.2 },
                { label: `${title} M2`, data: dataM2, borderColor: '#34d399', borderWidth: 2, tension: 0.2 },
                { label: `Límite Legal (${maxLimit})`, data: limitLine, borderColor: '#ef4444', borderWidth: 2, borderDash: [5, 5], pointRadius: 0, fill: false }
            ]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top' } }, scales: { y: { suggestedMax: maxLimit * 1.2 } } }
    });
};
