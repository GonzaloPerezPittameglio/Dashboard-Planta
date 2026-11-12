let rawData = [];
let cEnergia = null;
let cCaudales = null;
let cLimites = null;

// Gráficos Mensuales Resumen General
let cMensualEnergia = null;
let cMensualBiosolidos = null;
let cMensualArenas = null;
let cMensualPolimero = null;

// Gráficos Mantenimiento
let cMantMensual = null;
let cMantTortas = null;
let cCriticidad = null;
let cSectores = null;

// Catálogo oficial de los 24 sectores con ubicaciones Maximo
const SECTORES_MAXIMO = [
    { code: '0099', name: 'Báscula', label: 'Báscula (0099)' },
    { code: '0100', name: 'Pretratamiento M1', label: 'Pretratamiento M1 (0100)' },
    { code: '0101', name: 'Tratamiento Biológico M1', label: 'Tratamiento Biológico M1 (0101)' },
    { code: '0102', name: 'Sedimentación Secundaria M1', label: 'Sedimentación Secundaria M1 (0102)' },
    { code: '0103', name: 'Salida de Liquido M1', label: 'Salida de Liquido M1 (0103)' },
    { code: '0104', name: 'Deshidratación de Lodos M1', label: 'Deshidratación de Lodos M1 (0104)' },
    { code: '0105', name: 'Sistema de Provisión de Agua M1', label: 'Sistema de Provisión de Agua M1 (0105)' },
    { code: '0106', name: 'Sistema Eléctrico M1', label: 'Sistema Eléctrico M1 (0106)' },
    { code: '0107', name: 'Depósito', label: 'Depósito (0107)' },
    { code: '0108', name: 'Laboratorio', label: 'Laboratorio (0108)' },
    { code: '0109', name: 'Administración', label: 'Administración (0109)' },
    { code: '0110', name: 'Taller de Planta', label: 'Taller de Planta (0110)' },
    { code: '0111', name: 'Pañol', label: 'Pañol (0111)' },
    { code: '0200', name: 'Pretratamiento M2', label: 'Pretratamiento M2 (0200)' },
    { code: '0201', name: 'Sedimentación Primaria', label: 'Sedimentación Primaria (0201)' },
    { code: '020105', name: 'Agua de Servicio Pretratamiento', label: 'Agua de Servicio Pretratamiento (020105)' },
    { code: '0202', name: 'Tratamiento Biológico', label: 'Tratamiento Biológico (0202)' },
    { code: '0203', name: 'Sedimentación Secundaria', label: 'Sedimentación Secundaria (0203)' },
    { code: '020305', name: 'Agua de Servicio', label: 'Agua de Servicio (020305)' },
    { code: '0204', name: 'Espesamiento de Lodos', label: 'Espesamiento de Lodos (0204)' },
    { code: '0205', name: 'Flotación de Lodos', label: 'Flotación de Lodos (0205)' },
    { code: '0206', name: 'Digestión y Producción de Gas', label: 'Digestión y Producción de Gas (0206)' },
    { code: '0207', name: 'Almacenamiento de Lodos', label: 'Almacenamiento de Lodos (0207)' },
    { code: '0208', name: 'Deshidratación', label: 'Deshidratación (0208)' }
];

const urlPrimary = "https://docs.google.com/spreadsheets/d/17QH5BKXgwZJexRd34iD4tC_nJckI4HVT1TrK3yGiCOA/gviz/tq?tqx=out:csv";
const urlBackup = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSJbo6XXFqrrJtIxNAwdLhKsIengafF5OZYMc4l9aV3wPvp6retFo159pKfh_9o-QRT2ZziK-ltwYtC/pub?gid=0&single=true&output=csv";

window.onload = () => {
    lucide.createIcons();
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
        complete: function(results) {
            if (results.data && results.data.length > 0) {
                rawData = results.data;
                if (dsLabel) {
                    dsLabel.textContent = "Datos en vivo (Google Sheets)";
                    dsLabel.className = "text-xs font-medium px-3 py-1.5 bg-green-900/40 text-green-300 rounded-full border border-green-700";
                }
                calcularYRenderizarResumen();
            } else if (urlTarget !== urlBackup) {
                cargarDatosDesdeGoogle(urlBackup);
            } else {
                if (dsLabel) {
                    dsLabel.textContent = "Planilla vacía o sin publicar";
                    dsLabel.className = "text-xs font-medium px-3 py-1.5 bg-red-900/40 text-red-300 rounded-full border border-red-700";
                }
            }
        },
        error: function(err) {
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

function normalizarTexto(str) {
    return String(str || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim();
}

function identificarSectorMaximo(texto) {
    if (!texto) return null;
    const norm = normalizarTexto(texto);

    // 1. Buscar primero por código exacto (ordenado por longitud descendente)
    const porCodigo = [...SECTORES_MAXIMO].sort((a, b) => b.code.length - a.code.length);
    for (const sec of porCodigo) {
        const regex = new RegExp(`(^|[^0-9])${sec.code}([^0-9]|$)`);
        if (regex.test(norm)) return sec;
    }

    // 2. Buscar por nombre del sector
    const porNombre = [...SECTORES_MAXIMO].sort((a, b) => b.name.length - a.name.length);
    for (const sec of porNombre) {
        const secNorm = normalizarTexto(sec.name);
        if (norm.includes(secNorm)) return sec;
    }

    return null;
}

function getMonthYear(fechaRaw) {
    if (!fechaRaw) return 'General';
    const str = String(fechaRaw).trim();
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    if (str.includes('/')) {
        const parts = str.split('/');
        if (parts.length >= 2) {
            const mIdx = parseInt(parts[1], 10) - 1;
            const year = parts[2] ? parts[2].slice(-2) : '';
            if (mIdx >= 0 && mIdx < 12) return `${meses[mIdx]} ${year}`.trim();
            return `${parts[1]}/${parts[2] || ''}`;
        }
    } else if (str.includes('-')) {
        const parts = str.split('-');
        if (parts.length >= 2) {
            const mIdx = parseInt(parts[1], 10) - 1;
            const year = parts[0] ? parts[0].slice(-2) : '';
            if (mIdx >= 0 && mIdx < 12) return `${meses[mIdx]} ${year}`.trim();
            return `${parts[1]}/${parts[0]}`;
        }
    }
    return str;
}

function calcularYRenderizarResumen() {
    if (!rawData.length) return;
    const lastRow = rawData[rawData.length - 1]; 
    Chart.defaults.color = '#94a3b8';
    Chart.defaults.font.family = 'Inter';

    try {
        // ==============================
        // 1. PESTAÑA RESUMEN GENERAL
        // ==============================
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

        const volTotalM1 = rawData.reduce((acc, r) => acc + (getCleanNumber(getVal(r, 'caudal_trat_m1')) * 86400), 0);
        const ratioM1 = volTotalM1 > 0 ? (energiaTotalM1 / volTotalM1).toFixed(3) : '0.000';
        setTexto('m1_kw_m3', ratioM1);

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

        const volTotalM2 = rawData.reduce((acc, r) => acc + (getCleanNumber(getVal(r, 'caudal_trat_m2')) * 86400), 0);
        const ratioM2 = volTotalM2 > 0 ? (energiaTotalM2 / volTotalM2).toFixed(3) : '0.000';
        setTexto('m2_kw_m3', ratioM2);

        setTexto('tot_energia', getSum(rawData, 'energia_total').toLocaleString('es-AR'));
        setTexto('tot_biosolidos', getSum(rawData, 'biosolidos_ton').toLocaleString('es-AR'));
        setTexto('tot_arenas', getSum(rawData, 'arenas_ton').toLocaleString('es-AR'));
        setTexto('tot_polimero', getSum(rawData, 'polimero_kg').toLocaleString('es-AR'));

        // Agrupación Mensual para los 4 gráficos
        const resumenMensual = {};
        rawData.forEach(r => {
            const mesKey = getMonthYear(getVal(r, 'fecha'));
            if (!resumenMensual[mesKey]) {
                resumenMensual[mesKey] = { energia: 0, biosolidos: 0, arenas: 0, polimero: 0 };
            }
            resumenMensual[mesKey].energia += getCleanNumber(getVal(r, 'energia_total'));
            resumenMensual[mesKey].biosolidos += getCleanNumber(getVal(r, 'biosolidos_ton'));
            resumenMensual[mesKey].arenas += getCleanNumber(getVal(r, 'arenas_ton'));
            resumenMensual[mesKey].polimero += getCleanNumber(getVal(r, 'polimero_kg'));
        });

        const mesesLabels = Object.keys(resumenMensual);
        const serieEnergia = mesesLabels.map(m => resumenMensual[m].energia);
        const serieBiosolidos = mesesLabels.map(m => resumenMensual[m].biosolidos);
        const serieArenas = mesesLabels.map(m => resumenMensual[m].arenas);
        const seriePolimero = mesesLabels.map(m => resumenMensual[m].polimero);

        const buildMonthlyBar = (canvasId, instanceRef, label, dataArr, colorHex, unit) => {
            if (instanceRef) instanceRef.destroy();
            const ctx = document.getElementById(canvasId);
            if (!ctx) return null;
            return new Chart(ctx.getContext('2d'), {
                type: 'bar',
                data: {
                    labels: mesesLabels,
                    datasets: [{
                        label: label,
                        data: dataArr,
                        backgroundColor: colorHex,
                        borderRadius: 6
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return `${label}: ${(context.parsed.y || 0).toLocaleString('es-AR')} ${unit}`;
                                }
                            }
                        }
                    },
                    scales: { y: { beginAtZero: true } }
                }
            });
        };

        cMensualEnergia = buildMonthlyBar('chartMensualEnergia', cMensualEnergia, 'Energía Total', serieEnergia, '#facc15', 'kWh');
        cMensualBiosolidos = buildMonthlyBar('chartMensualBiosolidos', cMensualBiosolidos, 'Biosólidos', serieBiosolidos, '#d97706', 'Ton');
        cMensualArenas = buildMonthlyBar('chartMensualArenas', cMensualArenas, 'Arenas', serieArenas, '#fb923c', 'Ton');
        cMensualPolimero = buildMonthlyBar('chartMensualPolimero', cMensualPolimero, 'Polímero', seriePolimero, '#818cf8', 'Kg');

        setTexto('rrhh_total_lbl', getCleanNumber(getVal(lastRow, 'rrhh_total')));
        setTexto('rrhh_admin_lbl', getCleanNumber(getVal(lastRow, 'rrhh_admin')));
        setTexto('rrhh_operativo_lbl', getCleanNumber(getVal(lastRow, 'rrhh_operativo')));
        setTexto('hs_extra_lbl', getSum(rawData, 'hs_extra').toLocaleString('es-AR'));
        setTexto('hs_normales_lbl', getSum(rawData, 'hs_normales').toLocaleString('es-AR'));

        setTexto('mant_prev', getSum(rawData, 'mant_preventivos'));
        setTexto('mant_corr', getSum(rawData, 'mant_correctivos'));
        setTexto('mant_act', getSum(rawData, 'mant_actividades'));

        if(cEnergia) cEnergia.destroy();
        const ctxEnergia = document.getElementById('chartEnergiaSectores');
        if (ctxEnergia) {
            cEnergia = new Chart(ctxEnergia.getContext('2d'), {
                type: 'doughnut',
                data: {
                    labels: [
                        'M1 - TS1',
                        'M1 - TS2',
                        'M1 - TS3',
                        'M2 - TS1 - Pretratamiento',
                        'M2 - TS2 - Tratamiento Biológico',
                        'M2 - TS3 - Linea de Lodos'
                    ],
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
                        borderWidth: 2, borderColor: '#1e293b' 
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: '65%',
                    plugins: {
                        legend: { position: 'right' },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const label = context.label || '';
                                    const value = context.parsed || 0;
                                    return `${label}: ${value.toLocaleString('es-AR')} kW/h`;
                                }
                            }
                        }
                    }
                }
            });
        }

        // ==============================
        // 2. PESTAÑA PROCESO
        // ==============================
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

        const fechas = rawData.map(r => getVal(r, 'fecha') || ''); 
        const caudalesM1 = rawData.map(r => getCleanNumber(getVal(r, 'caudal_trat_m1')));
        const caudalesM2 = rawData.map(r => getCleanNumber(getVal(r, 'caudal_trat_m2')));
        const disenoM1 = Array(fechas.length).fill(0.3);
        const disenoM2 = Array(fechas.length).fill(0.9);

        if(cCaudales) cCaudales.destroy();
        const ctxCaudales = document.getElementById('chartCaudalesLine');
        if (ctxCaudales) {
            cCaudales = new Chart(ctxCaudales.getContext('2d'), {
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
        }

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

        const firstActiveBtn = document.querySelector('.chart-btn.active');
        updateChartLimites('dbo_ent', firstActiveBtn);

        // ==============================
        // 3. PESTAÑA MANTENIMIENTO
        // ==============================
        const sumGen = getSum(rawData, 'mant_generales');
        const sumPrev = getSum(rawData, 'mant_preventivos');
        const sumCorr = getSum(rawData, 'mant_correctivos');
        
        setTexto('kpi_mant_gen', sumGen);
        setTexto('kpi_mant_total', sumGen + sumPrev + sumCorr);
        setTexto('kpi_horas_prev', getSum(rawData, 'horas_prev'));
        setTexto('kpi_horas_corr', getSum(rawData, 'horas_corr'));

        const monthlyGroups = {};
        rawData.forEach(r => {
            const monthStr = getMonthYear(getVal(r, 'fecha'));
            if (!monthlyGroups[monthStr]) monthlyGroups[monthStr] = { gen: 0, prev: 0, corr: 0 };
            monthlyGroups[monthStr].gen += getCleanNumber(getVal(r, 'mant_generales'));
            monthlyGroups[monthStr].prev += getCleanNumber(getVal(r, 'mant_preventivos'));
            monthlyGroups[monthStr].corr += getCleanNumber(getVal(r, 'mant_correctivos'));
        });

        const labelsMensual = Object.keys(monthlyGroups);
        const dataGen = labelsMensual.map(m => monthlyGroups[m].gen);
        const dataPrev = labelsMensual.map(m => monthlyGroups[m].prev);
        const dataCorr = labelsMensual.map(m => monthlyGroups[m].corr);

        if(cMantMensual) cMantMensual.destroy();
        const ctxMantMensual = document.getElementById('chartMantMensual');
        if (ctxMantMensual) {
            cMantMensual = new Chart(ctxMantMensual.getContext('2d'), {
                type: 'bar',
                data: {
                    labels: labelsMensual,
                    datasets: [
                        { label: 'Generales', data: dataGen, backgroundColor: '#06b6d4' },
                        { label: 'Preventivos', data: dataPrev, backgroundColor: '#10b981' },
                        { label: 'Correctivos', data: dataCorr, backgroundColor: '#f43f5e' }
                    ]
                },
                options: { responsive: true, maintainAspectRatio: false, scales: { x: { stacked: true }, y: { stacked: true } } }
            });
        }

        if(cMantTortas) cMantTortas.destroy();
        const ctxMantTortas = document.getElementById('chartMantTortas');
        if (ctxMantTortas) {
            cMantTortas = new Chart(ctxMantTortas.getContext('2d'), {
                type: 'doughnut',
                data: {
                    labels: ['Preventivos', 'Correctivos'],
                    datasets: [{ 
                        data: [sumPrev, sumCorr], 
                        backgroundColor: ['#10b981', '#f43f5e'], 
                        borderWidth: 2, borderColor: '#1e293b' 
                    }]
                },
                options: { responsive: true, maintainAspectRatio: false }
            });
        }

        if(cCriticidad) cCriticidad.destroy();
        const ctxCriticidad = document.getElementById('chartCriticidad');
        if (ctxCriticidad) {
            cCriticidad = new Chart(ctxCriticidad.getContext('2d'), {
                type: 'doughnut',
                data: {
                    labels: ['ALTA', 'MEDIA', 'BAJA'],
                    datasets: [{ 
                        data: [getSum(rawData, 'corr_alto'), getSum(rawData, 'corr_medio'), getSum(rawData, 'corr_bajo')], 
                        backgroundColor: ['#ef4444', '#f59e0b', '#3b82f6'], 
                        borderWidth: 2, borderColor: '#1e293b' 
                    }]
                },
                options: { responsive: true, maintainAspectRatio: false }
            });
        }

        // ==========================================
        // LECTURA 100% INDEPENDIENTE DE MANTENIMIENTO
        // ==========================================

        // A. Lectura de Sectores (Nueva Columna: sectores_intervenidos)
        const conteoSectores = {};
        SECTORES_MAXIMO.forEach(s => { conteoSectores[s.code] = 0; });

        // Sumar columnas directas (ej: sec_0100 o 0100) si existieran
        SECTORES_MAXIMO.forEach(s => {
            const valCol = getSum(rawData, `sec_${s.code}`) + getSum(rawData, s.code);
            if (valCol > 0) conteoSectores[s.code] += valCol;
        });

        // Sumar desde la columna nueva de sectores separados por coma
        rawData.forEach(r => {
            let secStr = getVal(r, 'sectores_intervenidos');
            if (secStr && typeof secStr === 'string') {
                let secArr = secStr.split(',').map(s => s.trim()).filter(s => s !== '');
                secArr.forEach(item => {
                    const match = identificarSectorMaximo(item);
                    if (match) {
                        conteoSectores[match.code] = (conteoSectores[match.code] || 0) + 1;
                    }
                });
            }
        });

        if(cSectores) cSectores.destroy();
        const ctxSectores = document.getElementById('chartSectores');
        if (ctxSectores) {
            const sectoresLabels = SECTORES_MAXIMO.map(s => s.label);
            const sectoresData = SECTORES_MAXIMO.map(s => conteoSectores[s.code] || 0);

            cSectores = new Chart(ctxSectores.getContext('2d'), {
                type: 'bar',
                data: {
                    labels: sectoresLabels,
                    datasets: [{
                        label: 'Intervenciones',
                        data: sectoresData,
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
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const v = context.parsed.x || 0;
                                    return ` Intervenciones: ${v}`;
                                }
                            }
                        }
                    },
                    scales: {
                        x: {
                            beginAtZero: true,
                            ticks: { precision: 0 },
                            grid: { color: 'rgba(148, 163, 184, 0.1)' }
                        },
                        y: {
                            ticks: { color: '#cbd5e1', font: { size: 11 } },
                            grid: { display: false }
                        }
                    }
                }
            });
        }

        // B. Lectura Top 10 Equipos (Columna: equipos_intervenidos)
        let equiposMap = {};
        rawData.forEach(r => {
            let eqStr = getVal(r, 'equipos_intervenidos');
            if (eqStr && typeof eqStr === 'string') {
                let eqArr = eqStr.split(',').map(s => s.trim()).filter(s => s !== '');
                eqArr.forEach(rawItem => {
                    // Si el usuario por costumbre pone (Sector), se lo limpiamos para agruparlo bien.
                    let nombre = rawItem;
                    const firstParen = rawItem.indexOf('(');
                    if (firstParen !== -1) {
                        nombre = rawItem.substring(0, firstParen).trim();
                    }

                    if (!equiposMap[nombre]) {
                        equiposMap[nombre] = { count: 0 };
                    }
                    equiposMap[nombre].count += 1;
                });
            }
        });

        let topEquipos = Object.keys(equiposMap)
            .map(k => ({ nombre: k, count: equiposMap[k].count }))
            .sort((a,b) => b.count - a.count)
            .slice(0, 10);

        let tbody = document.getElementById('tabla_equipos_body');
        if (tbody) {
            if (topEquipos.length === 0) {
                tbody.innerHTML = '<tr><td colspan="3" class="text-center py-6 text-slate-500 italic">No hay registros de equipos intervenidos aún</td></tr>';
            } else {
                tbody.innerHTML = topEquipos.map((eq, index) => {
                    return `<tr class="border-b border-slate-700/50 hover:bg-slate-800/50 transition">
                                <td class="py-3 px-4 text-cyan-400 font-medium">#${index + 1}</td>
                                <td class="py-3 px-4 text-white font-medium">${eq.nombre}</td>
                                <td class="py-3 px-4 text-amber-400 font-bold text-right">${eq.count}</td>
                            </tr>`;
                }).join('');
            }
        }

    } catch (e) {
        console.error("Error al renderizar el resumen:", e);
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
