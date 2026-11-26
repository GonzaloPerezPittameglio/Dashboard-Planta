let rawData = [];
const chartInstances = {};

// Catálogo oficial de los 24 sectores de Máximo
const SECTORES_MAXIMO = [
    { code: '0099', label: '0099 (Báscula)', colNames: ['0099 (Báscula)', '0099', 'sec_0099', 'Báscula'] },
    { code: '0100', label: 'Pretratamiento M1 (0100)', colNames: ['Pretratamiento M1 (0100)', '0100', 'sec_0100', 'Pretratamiento M1'] },
    { code: '0101', label: 'Tratamiento Biológico M1 (0101)', colNames: ['Tratamiento Biológico M1 (0101)', '0101', 'sec_0101', 'Tratamiento Biológico M1'] },
    { code: '0102', label: 'Sedimentación Secundaria M1 (0102)', colNames: ['Sedimentación Secundaria M1 (0102)', '0102', 'sec_0102', 'Sedimentación Secundaria M1'] },
    { code: '0103', label: 'Salida de Liquido M1 (0103)', colNames: ['Salida de Liquido M1 (0103)', '0103', 'sec_0103', 'Salida de Liquido M1'] },
    { code: '0104', label: 'Deshidratación de Lodos M1 (0104)', colNames: ['Deshidratación de Lodos M1 (0104)', '0104', 'sec_0104', 'Deshidratación de Lodos M1'] },
    { code: '0105', label: 'Sistema de Provisión de Agua M1 (0105)', colNames: ['Sistema de Provisión de Agua M1 (0105)', '0105', 'sec_0105'] },
    { code: '0106', label: 'Sistema Eléctrico M1 (0106)', colNames: ['Sistema Eléctrico M1 (0106)', '0106', 'sec_0106'] },
    { code: '0107', label: 'Depósito (0107)', colNames: ['Depósito (0107)', '0107', 'sec_0107', 'Depósito'] },
    { code: '0108', label: 'Laboratorio (0108)', colNames: ['Laboratorio (0108)', '0108', 'sec_0108', 'Laboratorio'] },
    { code: '0109', label: 'Administración (0109)', colNames: ['Administración (0109)', '0109', 'sec_0109', 'Administración'] },
    { code: '0110', label: 'Taller de Planta (0110)', colNames: ['Taller de Planta (0110)', '0110', 'sec_0110', 'Taller de Planta'] },
    { code: '0111', label: 'Pañol (0111)', colNames: ['Pañol (0111)', '0111', 'sec_0111', 'Pañol'] },
    { code: '0200', label: 'Pretratamiento M2 (0200)', colNames: ['Pretratamiento M2 (0200)', '0200', 'sec_0200', 'Pretratamiento M2'] },
    { code: '0201', label: 'Sedimentación Primaria (0201)', colNames: ['Sedimentación Primaria (0201)', '0201', 'sec_0201', 'Sedimentación Primaria'] },
    { code: '020105', label: 'Agua de Servicio Pretratamiento (020105)', colNames: ['Agua de Servicio Pretratamiento (020105)', '020105', 'sec_020105'] },
    { code: '0202', label: 'Tratamiento Biológico (0202)', colNames: ['Tratamiento Biológico (0202)', '0202', 'sec_0202', 'Tratamiento Biológico'] },
    { code: '0203', label: 'Sedimentación Secundaria (0203)', colNames: ['Sedimentación Secundaria (0203)', '0203', 'sec_0203', 'Sedimentación Secundaria'] },
    { code: '020305', label: 'Agua de Servicio (020305)', colNames: ['Agua de Servicio (020305)', '020305', 'sec_020305'] },
    { code: '0204', label: 'Espesamiento de Lodos (0204)', colNames: ['Espesamiento de Lodos (0204)', '0204', 'sec_0204', 'Espesamiento de Lodos'] },
    { code: '0205', label: 'Flotación de Lodos (0205)', colNames: ['Flotación de Lodos (0205)', '0205', 'sec_0205', 'Flotación de Lodos'] },
    { code: '0206', label: 'Digestión y Producción de Gas (0206)', colNames: ['Digestión y Producción de Gas (0206)', '0206', 'sec_0206'] },
    { code: '0207', label: 'Almacenamiento de Lodos (0207)', colNames: ['Almacenamiento de Lodos (0207)', '0207', 'sec_0207', 'Almacenamiento de Lodos'] },
    { code: '0208', label: 'Deshidratación (0208)', colNames: ['Deshidratación (0208)', '0208', 'sec_0208', 'Deshidratación'] }
];

const urlPrimary = "https://docs.google.com/spreadsheets/d/17QH5BKXgwZJexRd34iD4tC_nJckI4HVT1TrK3yGiCOA/gviz/tq?tqx=out:csv";
const urlBackup = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSJbo6XXFqrrJtIxNAwdLhKsIengafF5OZYMc4l9aV3wPvp6retFo159pKfh_9o-QRT2ZziK-ltwYtC/pub?gid=0&single=true&output=csv";

window.onload = () => {
    try {
        if (typeof lucide !== 'undefined') lucide.createIcons();
    } catch (e) {
        console.warn("Lucide no cargado:", e);
    }
    cargarDatosDesdeGoogle(urlPrimary);
};

function cargarDatosDesdeGoogle(urlTarget) {
    const dsLabel = document.getElementById('dataSourceLabel');
    if (dsLabel) dsLabel.textContent = "Conectando con Google Sheets...";

    const conCache = urlTarget + (urlTarget.includes('?') ? '&' : '?') + '_t=' + Date.now();

    Papa.parse(conCache, {
        download: true,
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: function (results) {
            if (results.data && results.data.length > 0) {
                rawData = results.data;
                if (dsLabel) {
                    dsLabel.textContent = "Datos en vivo (Google Sheets)";
                    dsLabel.className = "text-xs font-medium px-3 py-1.5 bg-green-900/40 text-green-300 rounded-full border border-green-700";
                }
                calcularYRenderizarTodo();
            } else if (urlTarget !== urlBackup) {
                cargarDatosDesdeGoogle(urlBackup);
            } else if (dsLabel) {
                dsLabel.textContent = "Planilla vacía o sin publicar";
                dsLabel.className = "text-xs font-medium px-3 py-1.5 bg-red-900/40 text-red-300 rounded-full border border-red-700";
            }
        },
        error: function (err) {
            console.error("Error al conectar:", err);
            if (urlTarget !== urlBackup) {
                cargarDatosDesdeGoogle(urlBackup);
            } else if (dsLabel) {
                dsLabel.textContent = "Error de conexión con Google Sheets";
                dsLabel.className = "text-xs font-medium px-3 py-1.5 bg-red-900/40 text-red-300 rounded-full border border-red-700";
            }
        }
    });
}

// ==========================================
// NAVEGACIÓN ENTRE PESTAÑAS + REDIMENSIÓN
// ==========================================
function openTab(tabId, event) {
    document.querySelectorAll('.tab-content').forEach(t => {
        t.classList.add('hidden');
        t.classList.remove('block');
    });
    document.querySelectorAll('.tab-btn').forEach(b => {
        b.classList.remove('border-cyan-500', 'text-cyan-400');
        b.classList.add('border-transparent', 'text-slate-400');
    });

    const target = document.getElementById(tabId);
    if (target) {
        target.classList.remove('hidden');
        target.classList.add('block');
    }
    if (event && event.currentTarget) {
        event.currentTarget.classList.remove('border-transparent', 'text-slate-400');
        event.currentTarget.classList.add('border-cyan-500', 'text-cyan-400');
    }

    // Forzar a Chart.js a recalcular el tamaño de los gráficos de la pestaña recién abierta
    requestAnimationFrame(() => {
        Object.values(chartInstances).forEach(chart => {
            if (chart && typeof chart.resize === 'function') {
                chart.resize();
                chart.update('none');
            }
        });
    });
}

// ==========================================
// UTILIDADES DE LIMPIEZA Y LECTURA DE DATOS
// ==========================================
function normalizar(str) {
    return String(str || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim();
}

function getCleanNumber(val) {
    if (val === null || val === undefined || val === '') return 0;
    if (typeof val === 'number') return isNaN(val) ? 0 : val;
    let str = String(val).trim();
    // Si tiene formato argentino "1.234,56" -> quitar puntos de miles y cambiar coma por punto
    if (str.includes(',') && str.includes('.')) {
        str = str.replace(/\./g, '').replace(',', '.');
    } else if (str.includes(',')) {
        str = str.replace(',', '.');
    }
    str = str.replace(/[^\d.-]/g, '');
    const num = parseFloat(str);
    return isNaN(num) ? 0 : num;
}

function getVal(row, colNames) {
    if (!row) return undefined;
    const names = Array.isArray(colNames) ? colNames : [colNames];
    for (const name of names) {
        if (row[name] !== undefined && row[name] !== '') return row[name];
        const target = normalizar(name);
        for (const k of Object.keys(row)) {
            if (normalizar(k) === target && row[k] !== undefined && row[k] !== '') {
                return row[k];
            }
        }
    }
    return undefined;
}

function getSum(arr, colNames) {
    return arr.reduce((acc, row) => acc + getCleanNumber(getVal(row, colNames)), 0);
}

function getAvg(arr, colNames) {
    const valid = arr.filter(row => getCleanNumber(getVal(row, colNames)) > 0);
    if (!valid.length) return 0;
    const sum = valid.reduce((acc, row) => acc + getCleanNumber(getVal(row, colNames)), 0);
    return (sum / valid.length).toFixed(1);
}

function setTexto(id, valor) {
    const el = document.getElementById(id);
    if (el) el.textContent = valor;
}

function getMonthYear(fechaRaw) {
    if (!fechaRaw) return 'Sin fecha';
    const str = String(fechaRaw).trim();
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    if (str.includes('/')) {
        const parts = str.split('/');
        if (parts.length >= 2) {
            const mIdx = parseInt(parts[1], 10) - 1;
            const year = parts[2] ? parts[2].slice(-2) : '';
            if (mIdx >= 0 && mIdx < 12) return `${meses[mIdx]} ${year}`.trim();
        }
    } else if (str.includes('-')) {
        const parts = str.split('-');
        if (parts.length >= 2) {
            const mIdx = parseInt(parts[1], 10) - 1;
            const year = parts[0] ? parts[0].slice(-2) : '';
            if (mIdx >= 0 && mIdx < 12) return `${meses[mIdx]} ${year}`.trim();
        }
    }
    return str;
}

function agruparPorMes(colNames) {
    const mapa = new Map();
    rawData.forEach(row => {
        const mes = getMonthYear(getVal(row, ['fecha', 'Fecha']));
        const val = getCleanNumber(getVal(row, colNames));
        mapa.set(mes, (mapa.get(mes) || 0) + val);
    });
    return {
        labels: Array.from(mapa.keys()),
        values: Array.from(mapa.values())
    };
}

// ==========================================
// BUSCADOR INTELIGENTE DE CANVAS Y RENDER
// ==========================================
function findCanvas(key, ids = [], titleKeywords = []) {
    for (const id of ids) {
        const el = document.getElementById(id);
        if (el && el.tagName === 'CANVAS') {
            el.dataset.chartKey = key;
            return el;
        }
    }
    const canvases = Array.from(document.querySelectorAll('canvas'));
    for (const canvas of canvases) {
        if (canvas.dataset.chartKey && canvas.dataset.chartKey !== key) continue;
        let box = canvas.parentElement;
        for (let depth = 0; depth < 3 && box; depth++) {
            const heading = box.querySelector('h2, h3, h4');
            const texto = normalizar(heading ? heading.textContent : box.textContent);
            if (titleKeywords.some(kw => texto.includes(normalizar(kw)))) {
                canvas.dataset.chartKey = key;
                return canvas;
            }
            box = box.parentElement;
        }
    }
    return null;
}

function renderChart(key, ids, titleKeywords, config) {
    const canvas = findCanvas(key, ids, titleKeywords);
    if (!canvas) return null;

    if (chartInstances[key]) {
        chartInstances[key].destroy();
    }
    const existing = typeof Chart.getChart === 'function' ? Chart.getChart(canvas) : null;
    if (existing) existing.destroy();

    chartInstances[key] = new Chart(canvas.getContext('2d'), config);
    return chartInstances[key];
}

// ==========================================
// RENDER PRINCIPAL DE TODAS LAS PESTAÑAS
// ==========================================
function calcularYRenderizarTodo() {
    if (!rawData.length) return;
    const lastRow = rawData[rawData.length - 1];

    if (typeof Chart !== 'undefined') {
        Chart.defaults.color = '#94a3b8';
        Chart.defaults.font.family = 'Inter, sans-serif';
    }

    // ------------------------------------------
    // 1. PESTAÑA RESUMEN GENERAL (KPIs + 5 GRÁFICOS)
    // ------------------------------------------
    const eM1 = getSum(rawData, 'energia_m1_ts1') + getSum(rawData, 'energia_m1_ts2') + getSum(rawData, 'energia_m1_ts3') || getSum(rawData, 'energia_m1');
    const eM2 = getSum(rawData, 'energia_m2_ts1') + getSum(rawData, 'energia_m2_ts2') + getSum(rawData, 'energia_m2_ts3') || getSum(rawData, 'energia_m2');
    const eTotal = getSum(rawData, 'energia_total') || (eM1 + eM2);

    setTexto('tot_energia', eTotal.toLocaleString('es-AR'));
    setTexto('tot_biosolidos', getSum(rawData, 'biosolidos_ton').toLocaleString('es-AR'));
    setTexto('tot_arenas', getSum(rawData, 'arenas_ton').toLocaleString('es-AR'));
    setTexto('tot_polimero', getSum(rawData, 'polimero_kg').toLocaleString('es-AR'));

    // 1A. Energía Mensual (kWh)
    const dEnergia = agruparPorMes(['energia_total']);
    renderChart('mensualEnergia',
        ['chartMensualEnergia', 'chartEnergiaMensual'],
        ['energia mensual'],
        {
            type: 'bar',
            data: {
                labels: dEnergia.labels,
                datasets: [{
                    label: 'Energía (kWh)',
                    data: dEnergia.values,
                    backgroundColor: '#eab308',
                    borderRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true, grid: { color: 'rgba(148, 163, 184, 0.1)' } },
                    x: { grid: { display: false } }
                }
            }
        }
    );

    // 1B. Biosólidos Mensual (Ton)
    const dBiosolidos = agruparPorMes(['biosolidos_ton']);
    renderChart('mensualBiosolidos',
        ['chartMensualBiosolidos', 'chartBiosolidosMensual'],
        ['biosolidos mensual'],
        {
            type: 'bar',
            data: {
                labels: dBiosolidos.labels,
                datasets: [{
                    label: 'Biosólidos (Ton)',
                    data: dBiosolidos.values,
                    backgroundColor: '#f97316',
                    borderRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true, grid: { color: 'rgba(148, 163, 184, 0.1)' } },
                    x: { grid: { display: false } }
                }
            }
        }
    );

    // 1C. Arenas Mensual (Ton)
    const dArenas = agruparPorMes(['arenas_ton']);
    renderChart('mensualArenas',
        ['chartMensualArenas', 'chartArenasMensual'],
        ['arenas mensual'],
        {
            type: 'bar',
            data: {
                labels: dArenas.labels,
                datasets: [{
                    label: 'Arenas (Ton)',
                    data: dArenas.values,
                    backgroundColor: '#f59e0b',
                    borderRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true, grid: { color: 'rgba(148, 163, 184, 0.1)' } },
                    x: { grid: { display: false } }
                }
            }
        }
    );

    // 1D. Polímero Mensual (Kg)
    const dPolimero = agruparPorMes(['polimero_kg']);
    renderChart('mensualPolimero',
        ['chartMensualPolimero', 'chartPolimeroMensual'],
        ['polimero mensual'],
        {
            type: 'bar',
            data: {
                labels: dPolimero.labels,
                datasets: [{
                    label: 'Polímero (Kg)',
                    data: dPolimero.values,
                    backgroundColor: '#8b5cf6',
                    borderRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true, grid: { color: 'rgba(148, 163, 184, 0.1)' } },
                    x: { grid: { display: false } }
                }
            }
        }
    );

    // 1E. Energía Total por Módulo (Doughnut)
    renderChart('energiaSectores',
        ['chartEnergiaSectores', 'chartEnergiaModulo'],
        ['energia total por modulo', 'energia por modulo'],
        {
            type: 'doughnut',
            data: {
                labels: ['M1 - TS1', 'M1 - TS2', 'M1 - TS3', 'M2 - TS1', 'M2 - TS2', 'M2 - TS3'],
                datasets: [{
                    data: [
                        getSum(rawData, 'energia_m1_ts1'),
                        getSum(rawData, 'energia_m1_ts2'),
                        getSum(rawData, 'energia_m1_ts3'),
                        getSum(rawData, 'energia_m2_ts1'),
                        getSum(rawData, 'energia_m2_ts2'),
                        getSum(rawData, 'energia_m2_ts3')
                    ],
                    backgroundColor: ['#0284c7', '#0ea5e9', '#38bdf8', '#059669', '#10b981', '#34d399'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'bottom' } }
            }
        }
    );

    // ------------------------------------------
    // 2. PESTAÑA PROCESO Y CALIDAD
    // ------------------------------------------
    setTexto('m1_dbo_ent', getAvg(rawData, 'dbo_ent_m1'));
    setTexto('m1_dbo_sal', getAvg(rawData, 'dbo_sal_m1'));
    setTexto('m1_dqo_ent', getAvg(rawData, 'dqo_ent_m1'));
    setTexto('m1_dqo_sal', getAvg(rawData, 'dqo_sal_m1'));
    setTexto('m1_mes_ent', getAvg(rawData, 'mes_ent_m1'));
    setTexto('m1_mes_sal', getAvg(rawData, 'mes_sal_m1'));
    setTexto('m1_caudal_dis', getCleanNumber(getVal(lastRow, 'caudal_dis_m1')) || 0.3);
    setTexto('m1_caudal_trat', getCleanNumber(getVal(lastRow, 'caudal_trat_m1')) || 0);
    setTexto('m1_energia_val', eM1.toLocaleString('es-AR'));

    const volTotalM1 = rawData.reduce((acc, r) => acc + (getCleanNumber(getVal(r, 'caudal_trat_m1')) * 86400), 0);
    setTexto('m1_kw_m3', volTotalM1 > 0 ? (eM1 / volTotalM1).toFixed(3) : '0.000');

    setTexto('m2_dbo_ent', getAvg(rawData, 'dbo_ent_m2'));
    setTexto('m2_dbo_sal', getAvg(rawData, 'dbo_sal_m2'));
    setTexto('m2_dqo_ent', getAvg(rawData, 'dqo_ent_m2'));
    setTexto('m2_dqo_sal', getAvg(rawData, 'dqo_sal_m2'));
    setTexto('m2_mes_ent', getAvg(rawData, 'mes_ent_m2'));
    setTexto('m2_mes_sal', getAvg(rawData, 'mes_sal_m2'));
    setTexto('m2_caudal_dis', getCleanNumber(getVal(lastRow, 'caudal_dis_m2')) || 0.9);
    setTexto('m2_caudal_trat', getCleanNumber(getVal(lastRow, 'caudal_trat_m2')) || 0);
    setTexto('m2_energia_val', eM2.toLocaleString('es-AR'));

    const volTotalM2 = rawData.reduce((acc, r) => acc + (getCleanNumber(getVal(r, 'caudal_trat_m2')) * 86400), 0);
    setTexto('m2_kw_m3', volTotalM2 > 0 ? (eM2 / volTotalM2).toFixed(3) : '0.000');

    // Gráfico Evolución de Caudales M1 y M2
    const fechas = rawData.map(r => String(getVal(r, 'fecha') || ''));
    const caudalesM1 = rawData.map(r => getCleanNumber(getVal(r, 'caudal_trat_m1')));
    const caudalesM2 = rawData.map(r => getCleanNumber(getVal(r, 'caudal_trat_m2')));

    renderChart('caudalesLine',
        ['chartCaudalesLine', 'chartCaudales'],
        ['evolucion de caudales', 'caudales m1 y m2'],
        {
            type: 'line',
            data: {
                labels: fechas,
                datasets: [
                    { label: 'Caudal M1', data: caudalesM1, borderColor: '#22d3ee', backgroundColor: 'rgba(34,211,238,0.1)', fill: true, tension: 0.35 },
                    { label: 'Diseño M1 (0.3)', data: Array(fechas.length).fill(0.3), borderColor: '#0284c7', borderDash: [5, 5], pointRadius: 0, fill: false },
                    { label: 'Caudal M2', data: caudalesM2, borderColor: '#34d399', backgroundColor: 'rgba(52,211,153,0.1)', fill: true, tension: 0.35 },
                    { label: 'Diseño M2 (0.9)', data: Array(fechas.length).fill(0.9), borderColor: '#059669', borderDash: [5, 5], pointRadius: 0, fill: false }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { beginAtZero: true, suggestedMax: 1.2, grid: { color: 'rgba(148, 163, 184, 0.1)' } },
                    x: { grid: { display: false } }
                }
            }
        }
    );

    // Gráfico Límites Normativos (por defecto DBO)
    window.updateChartLimites('dbo');

    // Semáforo fuera de norma
    const diasFuera = rawData.filter(r => {
        const fn1 = getCleanNumber(getVal(r, 'fuera_norma_m1'));
        const fn2 = getCleanNumber(getVal(r, 'fuera_norma_m2'));
        const motivo = getVal(r, 'motivo_desvio');
        return fn1 > 0 || fn2 > 0 || (motivo && String(motivo).trim() !== '');
    });
    setTexto('dias_restantes_norma', Math.max(0, 37 - diasFuera.length));
    const divFechas = document.getElementById('fechas_fuera_norma');
    if (divFechas) {
        if (!diasFuera.length) {
            divFechas.innerHTML = '<span class="text-green-400 text-sm">Planta 100% en norma.</span>';
        } else {
            divFechas.innerHTML = diasFuera.map(d => {
                const f = String(getVal(d, 'fecha') || 'Sin fecha');
                const m = String(getVal(d, 'motivo_desvio') || 'Desvío registrado').replace(/'/g, "\\'");
                return `<button onclick="mostrarMotivo('${f}', '${m}')" class="bg-red-900/40 hover:bg-red-800 text-red-300 px-3 py-1 rounded text-sm border border-red-700/50">${f}</button>`;
            }).join('');
        }
    }

    // ------------------------------------------
    // 3. PESTAÑA MANTENIMIENTO (KPIs + GRÁFICOS + 24 SECTORES + TOP 10)
    // ------------------------------------------
    const sumGen = getSum(rawData, 'mant_generales');
    const sumPrev = getSum(rawData, 'mant_preventivos');
    const sumCorr = getSum(rawData, 'mant_correctivos');
    const sumAct = getSum(rawData, 'mant_actividades');
    const sumTotMant = sumGen + sumPrev + sumCorr + sumAct;

    const hsPrev = getSum(rawData, 'horas_prev');
    const hsCorr = getSum(rawData, 'horas_corr');
    const hsTareas = getSum(rawData, 'horas_tareas') + getSum(rawData, 'horas_gen');
    const hsTot = hsPrev + hsCorr + hsTareas;

    setTexto('kpi_mant_total', sumTotMant);
    setTexto('kpi_mant_prev', sumPrev);
    setTexto('kpi_mant_corr', sumCorr);
    setTexto('kpi_mant_gen', sumGen || sumAct);
    setTexto('kpi_mant_act', sumAct || sumGen);

    setTexto('kpi_horas_total', hsTot.toFixed(1));
    setTexto('kpi_horas_prev', hsPrev.toFixed(1));
    setTexto('kpi_horas_corr', hsCorr.toFixed(1));
    setTexto('kpi_horas_tareas', hsTareas.toFixed(1));

    setTexto('kpi_prom_prev', sumPrev > 0 ? (hsPrev / sumPrev).toFixed(1) + ' h' : '0.0 h');
    setTexto('kpi_prom_corr', sumCorr > 0 ? (hsCorr / sumCorr).toFixed(1) + ' h' : '0.0 h');
    const cantTareas = sumAct || sumGen;
    setTexto('kpi_prom_tareas', cantTareas > 0 ? (hsTareas / cantTareas).toFixed(1) + ' h' : '0.0 h');

    // Gráfico Evolución Mensual Mantenimiento
    const mPrev = agruparPorMes(['mant_preventivos']);
    const mCorr = agruparPorMes(['mant_correctivos']);
    const mGen = agruparPorMes(['mant_generales', 'mant_actividades']);
    renderChart('mantMensual',
        ['chartMantMensual', 'chartMantenimientoMensual'],
        ['evolucion mensual de mantenimiento', 'mantenimiento mensual'],
        {
            type: 'bar',
            data: {
                labels: mPrev.labels,
                datasets: [
                    { label: 'Preventivos', data: mPrev.values, backgroundColor: '#10b981', borderRadius: 4 },
                    { label: 'Correctivos', data: mCorr.values, backgroundColor: '#ef4444', borderRadius: 4 },
                    { label: 'Generales / Act.', data: mGen.values, backgroundColor: '#06b6d4', borderRadius: 4 }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { beginAtZero: true, ticks: { precision: 0 }, grid: { color: 'rgba(148, 163, 184, 0.1)' } },
                    x: { grid: { display: false } }
                }
            }
        }
    );

    // Gráfico Distribución por Tipo de Mantenimiento
    renderChart('mantTortas',
        ['chartMantTortas', 'chartTipoMantenimiento'],
        ['distribucion por tipo', 'tipo de mantenimiento'],
        {
            type: 'doughnut',
            data: {
                labels: ['Preventivos', 'Correctivos', 'Generales / Actividades'],
                datasets: [{
                    data: [sumPrev, sumCorr, sumGen + sumAct],
                    backgroundColor: ['#10b981', '#ef4444', '#06b6d4'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'bottom' } }
            }
        }
    );

    // Conteo de los 24 sectores de Máximo (tanto por columna directa como desde equipos_intervenidos)
    const conteoSectores = {};
    SECTORES_MAXIMO.forEach(s => {
        let total = 0;
        for (const alias of s.colNames) {
            total += getSum(rawData, alias);
        }
        conteoSectores[s.code] = total;
    });

    rawData.forEach(r => {
        const eqStr = getVal(r, 'equipos_intervenidos');
        if (eqStr && typeof eqStr === 'string') {
            eqStr.split(',').map(x => x.trim()).filter(Boolean).forEach(item => {
                const normItem = normalizar(item);
                const match = [...SECTORES_MAXIMO]
                    .sort((a, b) => b.code.length - a.code.length)
                    .find(s => new RegExp(`(^|[^0-9])${s.code}([^0-9]|$)`).test(normItem));
                if (match && conteoSectores[match.code] === 0) {
                    conteoSectores[match.code] += 1;
                }
            });
        }
    });

    renderChart('sectoresMaximo',
        ['chartSectores', 'chartIntervencionesSector'],
        ['intervenciones por sector', 'sectores'],
        {
            type: 'bar',
            data: {
                labels: SECTORES_MAXIMO.map(s => s.label),
                datasets: [{
                    label: 'Intervenciones',
                    data: SECTORES_MAXIMO.map(s => conteoSectores[s.code] || 0),
                    backgroundColor: '#06b6d4',
                    hoverBackgroundColor: '#22d3ee',
                    borderRadius: 4,
                    barPercentage: 0.75
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { beginAtZero: true, ticks: { precision: 0 }, grid: { color: 'rgba(148, 163, 184, 0.1)' } },
                    y: { ticks: { color: '#cbd5e1', font: { size: 11 } }, grid: { display: false } }
                }
            }
        }
    );

    // Top 10 Equipos Intervenidos
    const equiposMap = {};
    rawData.forEach(r => {
        const eqStr = getVal(r, 'equipos_intervenidos');
        if (eqStr && typeof eqStr === 'string') {
            eqStr.split(',').map(s => s.trim()).filter(Boolean).forEach(rawItem => {
                let nombre = rawItem;
                let sector = 'No especificado';
                const pIdx = rawItem.indexOf('(');
                if (pIdx !== -1) {
                    nombre = rawItem.substring(0, pIdx).trim();
                    sector = rawItem.substring(pIdx + 1).replace(/\)+$/, '').trim();
                }
                const key = `${nombre}||${sector}`;
                if (!equiposMap[key]) equiposMap[key] = { nombre, sector, count: 0 };
                equiposMap[key].count += 1;
            });
        }
    });

    const topEquipos = Object.values(equiposMap).sort((a, b) => b.count - a.count).slice(0, 10);
    const tbody = document.getElementById('tabla_equipos_body');
    if (tbody) {
        tbody.innerHTML = topEquipos.length === 0
            ? '<tr><td colspan="4" class="text-center py-6 text-slate-500 italic">No hay registros de equipos intervenidos aún</td></tr>'
            : topEquipos.map((eq, idx) => `
                <tr class="border-b border-slate-700/50 hover:bg-slate-800/50 transition">
                    <td class="py-3 px-4 text-cyan-400 font-medium">#${idx + 1}</td>
                    <td class="py-3 px-4 text-white font-medium">${eq.nombre}</td>
                    <td class="py-3 px-4 text-slate-400 text-sm">${eq.sector}</td>
                    <td class="py-3 px-4 text-amber-400 font-bold text-right">${eq.count}</td>
                </tr>`).join('');
    }

    // ------------------------------------------
    // 4. PESTAÑA CONTROL Y GESTIÓN
    // ------------------------------------------
    setTexto('rrhh_admin_lbl', getCleanNumber(getVal(lastRow, 'rrhh_admin')));
    setTexto('rrhh_operativo_lbl', getCleanNumber(getVal(lastRow, 'rrhh_operativo')));
    setTexto('hs_normales_lbl', getSum(rawData, 'hs_normales').toLocaleString('es-AR'));
    setTexto('hs_extra_lbl', getSum(rawData, 'hs_extra').toLocaleString('es-AR'));

    // Pañol Mensual (Ítems vs $)
    const pItems = agruparPorMes(['panol_items', 'consumo_panol_items']);
    const pPlata = agruparPorMes(['panol_plata', 'consumo_panol_plata', 'panol_monto']);
    setTexto('tot_panol_items', getSum(rawData, ['panol_items', 'consumo_panol_items']).toLocaleString('es-AR'));
    setTexto('tot_panol_plata', '$ ' + getSum(rawData, ['panol_plata', 'consumo_panol_plata', 'panol_monto']).toLocaleString('es-AR'));

    renderChart('panolMensual',
        ['chartPanol', 'chartPanolMensual'],
        ['panol'],
        {
            type: 'bar',
            data: {
                labels: pItems.labels,
                datasets: [
                    { label: 'Ítems', data: pItems.values, backgroundColor: '#06b6d4', yAxisID: 'y', borderRadius: 4 },
                    { label: 'Monto ($)', data: pPlata.values, type: 'line', borderColor: '#f59e0b', backgroundColor: '#f59e0b', yAxisID: 'y1', tension: 0.3 }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { beginAtZero: true, position: 'left', grid: { color: 'rgba(148, 163, 184, 0.1)' } },
                    y1: { beginAtZero: true, position: 'right', grid: { drawOnChartArea: false } },
                    x: { grid: { display: false } }
                }
            }
        }
    );

    // Coste Biosólidos y RSU ($)
    const cBio = agruparPorMes(['coste_biosolidos', 'costo_biosolidos']);
    const cRsu = agruparPorMes(['coste_rsu', 'costo_rsu']);
    renderChart('costeResiduos',
        ['chartCosteResiduos', 'chartCosteBiosolidosRsu'],
        ['coste de biosolidos', 'coste biosolidos'],
        {
            type: 'bar',
            data: {
                labels: cBio.labels,
                datasets: [
                    { label: 'Coste Biosólidos ($)', data: cBio.values, backgroundColor: '#f97316', borderRadius: 4 },
                    { label: 'Coste RSU ($)', data: cRsu.values, backgroundColor: '#64748b', borderRadius: 4 }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { beginAtZero: true, grid: { color: 'rgba(148, 163, 184, 0.1)' } },
                    x: { grid: { display: false } }
                }
            }
        }
    );

    // Totalizado Biosólidos y RSU M1 vs M2
    renderChart('biosolidosRsuModulos',
        ['chartBiosolidosRsu', 'chartTotalizadoResiduos'],
        ['totalizado de biosolidos', 'biosolidos y rsu m1'],
        {
            type: 'bar',
            data: {
                labels: ['Módulo 1 (M1)', 'Módulo 2 (M2)'],
                datasets: [
                    {
                        label: 'Biosólidos (Ton)',
                        data: [getSum(rawData, 'biosolidos_m1'), getSum(rawData, 'biosolidos_m2')],
                        backgroundColor: '#f97316',
                        borderRadius: 6
                    },
                    {
                        label: 'RSU (Ton)',
                        data: [getSum(rawData, 'rsu_m1'), getSum(rawData, 'rsu_m2')],
                        backgroundColor: '#38bdf8',
                        borderRadius: 6
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { beginAtZero: true, grid: { color: 'rgba(148, 163, 184, 0.1)' } },
                    x: { grid: { display: false } }
                }
            }
        }
    );

    // Inversiones y Explotaciones
    setTexto('gest_inv_obras', '$ ' + getSum(rawData, ['inv_obras', 'inversion_obras']).toLocaleString('es-AR'));
    setTexto('gest_inv_equipamiento', '$ ' + getSum(rawData, ['inv_equipamiento', 'inversion_equipamiento']).toLocaleString('es-AR'));
    setTexto('gest_exp_reparaciones', '$ ' + getSum(rawData, ['exp_reparaciones', 'explotacion_reparaciones']).toLocaleString('es-AR'));
}

// ==========================================
// CONTROLES INTERACTIVOS (LÍMITES Y MODAL)
// ==========================================
window.updateChartLimites = function (param, btnElement) {
    if (!rawData.length) return;

    if (btnElement && btnElement.parentElement) {
        btnElement.parentElement.querySelectorAll('button').forEach(b => {
            b.classList.remove('bg-cyan-600', 'text-white');
            b.classList.add('bg-slate-800', 'text-slate-400');
        });
        btnElement.classList.remove('bg-slate-800', 'text-slate-400');
        btnElement.classList.add('bg-cyan-600', 'text-white');
    }

    const configMap = {
        dbo: { colM1: 'dbo_sal_m1', colM2: 'dbo_sal_m2', limite: 30, label: 'DBO Salida (mg/L)' },
        dqo: { colM1: 'dqo_sal_m1', colM2: 'dqo_sal_m2', limite: 125, label: 'DQO Salida (mg/L)' },
        mes: { colM1: 'mes_sal_m1', colM2: 'mes_sal_m2', limite: 35, label: 'MES Salida (mg/L)' }
    };
    const cfg = configMap[param] || configMap.dbo;
    const fechas = rawData.map(r => String(getVal(r, 'fecha') || ''));

    renderChart('limitesNormativos',
        ['chartLimites', 'chartLimitesNormativos'],
        ['limites normativos', 'control de limites', 'calidad de vuelco'],
        {
            type: 'line',
            data: {
                labels: fechas,
                datasets: [
                    { label: `M1 - ${cfg.label}`, data: rawData.map(r => getCleanNumber(getVal(r, cfg.colM1))), borderColor: '#22d3ee', tension: 0.3 },
                    { label: `M2 - ${cfg.label}`, data: rawData.map(r => getCleanNumber(getVal(r, cfg.colM2))), borderColor: '#34d399', tension: 0.3 },
                    { label: `Límite (${cfg.limite})`, data: Array(fechas.length).fill(cfg.limite), borderColor: '#ef4444', borderDash: [6, 6], pointRadius: 0 }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { beginAtZero: true, grid: { color: 'rgba(148, 163, 184, 0.1)' } },
                    x: { grid: { display: false } }
                }
            }
        }
    );
};

window.mostrarMotivo = function (fecha, motivo) {
    setTexto('modalFecha', 'Desvío: ' + fecha);
    setTexto('modalMotivo', motivo);
    const modal = document.getElementById('modalDesvio');
    if (modal) modal.classList.remove('hidden');
};
