let rawData = [];
let cEnergia = null;
let cCaudales = null;
let cLimites = null;

let cMensualEnergia = null;
let cMensualBiosolidos = null;
let cMensualArenas = null;
let cMensualPolimero = null;

let cMantMensual = null;
let cMantTortas = null;
let cCriticidad = null;
let cUbicacionesM1 = null;
let cUbicacionesM2 = null;

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
                dsLabel.textContent = "Error de conexión";
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
    
    const target = String(colName).toLowerCase().trim();
    for (let k of Object.keys(row)) {
        if (String(k).toLowerCase().trim() === target) return row[k];
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
        // 1. RESUMEN GENERAL
        // ==============================
        setTexto('m1_dbo_ent', getAvg(rawData, 'dbo_ent_m1'));
        setTexto('m1_dbo_sal', getAvg(rawData, 'dbo_sal_m1'));
        setTexto('m1_dqo_ent', getAvg(rawData, 'dqo_ent_m1') || getAvg(rawData, 'dbo_ent_m1'));
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

        setTexto('rrhh_total_lbl', getCleanNumber(getVal(lastRow, 'rrhh_total')));
        setTexto('rrhh_admin_lbl', getCleanNumber(getVal(lastRow, 'rrhh_admin')));
        setTexto('rrhh_operativo_lbl', getCleanNumber(getVal(lastRow, 'rrhh_operativo')));
        setTexto('hs_extra_lbl', getSum(rawData, 'hs_extra').toLocaleString('es-AR'));
        setTexto('hs_normales_lbl', getSum(rawData, 'hs_normales').toLocaleString('es-AR'));

        // Cantidades de intervenciones
        const countPrev = getSum(rawData, 'mant_preventivos');
        const countCorr = getSum(rawData, 'mant_correctivos');
        const countAct = getSum(rawData, 'mant_actividades');
        setTexto('mant_prev', countPrev);
        setTexto('mant_corr', countCorr);
        setTexto('mant_act', countAct);

        // Horas invertidas y cálculos
        const hsPrev = getSum(rawData, 'horas_prev');
        const hsCorr = getSum(rawData, 'horas_corr');
        const hsTareas = getSum(rawData, 'horas_tareas');
        const hsTotal = hsPrev + hsCorr + hsTareas;

        setTexto('res_hs_prev', hsPrev);
        setTexto('res_hs_corr', hsCorr);
        setTexto('res_hs_tareas', hsTareas);
        setTexto('res_hs_total', hsTotal);

        // Gráficos Mensuales
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
                            callbacks: { label: function(context) { return `${label}: ${(context.parsed.y || 0).toLocaleString('es-AR')} ${unit}`; } }
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

        // Doughnut Energía Sectores
        if(cEnergia) cEnergia.destroy();
        const ctxEnergia = document.getElementById('chartEnergiaSectores');
        if (ctxEnergia) {
            cEnergia = new Chart(ctxEnergia.getContext('2d'), {
                type: 'doughnut',
                data: {
                    labels: ['M1 - TS1', 'M1 - TS2', 'M1 - TS3', 'M2 - TS1 - Pretratamiento', 'M2 - TS2 - Tratamiento Biológico', 'M2 - TS3 - Linea de Lodos'],
                    datasets: [{ 
                        data: [
                            getSum(rawData, 'energia_m1_ts1'), getSum(rawData, 'energia_m1_ts2'), getSum(rawData, 'energia_m1_ts3'),
                            getSum(rawData, 'energia_m2_ts1'), getSum(rawData, 'energia_m2_ts2'), getSum(rawData, 'energia_m2_ts3')
                        ], 
                        backgroundColor: ['#0284c7', '#0ea5e9', '#38bdf8', '#059669', '#10b981', '#34d399'], 
                        borderWidth: 2, borderColor: '#1e293b' 
                    }]
                },
                options: { responsive: true, maintainAspectRatio: false, cutout: '65%', plugins: { legend: { position: 'right' } } }
            });
        }

        // ==============================
        // 2. PROCESO
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

        // Gráfico de Caudales
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

        // Semáforo Norma
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
        
        // Contadores superiores
        setTexto('kpi_mant_total', countPrev + countCorr + countAct);
        setTexto('kpi_mant_prev', countPrev);
        setTexto('kpi_mant_corr', countCorr);
        setTexto('kpi_mant_act', countAct);

        // Agrupación para gráficos mensuales de Mantenimiento
        const monthlyGroups = {};
        rawData.forEach(r => {
            const monthStr = getMonthYear(getVal(r, 'fecha'));
            if (!monthlyGroups[monthStr]) monthlyGroups[monthStr] = { prev: 0, corr: 0, act: 0 };
            monthlyGroups[monthStr].prev += getCleanNumber(getVal(r, 'mant_preventivos'));
            monthlyGroups[monthStr].corr += getCleanNumber(getVal(r, 'mant_correctivos'));
            monthlyGroups[monthStr].act += getCleanNumber(getVal(r, 'mant_actividades'));
        });

        const labelsMensual = Object.keys(monthlyGroups);
        
        // Gráfico de Barras (ahora con Actividades en lugar de Generales)
        if(cMantMensual) cMantMensual.destroy();
        const ctxMantMensual = document.getElementById('chartMantMensual');
        if (ctxMantMensual) {
            cMantMensual = new Chart(ctxMantMensual.getContext('2d'), {
                type: 'bar',
                data: {
                    labels: labelsMensual,
                    datasets: [
                        { label: 'Preventivos', data: labelsMensual.map(m => monthlyGroups[m].prev), backgroundColor: '#10b981' },
                        { label: 'Correctivos', data: labelsMensual.map(m => monthlyGroups[m].corr), backgroundColor: '#f43f5e' },
                        { label: 'Actividades', data: labelsMensual.map(m => monthlyGroups[m].act), backgroundColor: '#38bdf8' }
                    ]
                },
                options: { responsive: true, maintainAspectRatio: false, scales: { x: { stacked: true }, y: { stacked: true } } }
            });
        }

        // Gráfico de Torta (Preventivos vs Correctivos vs Actividades)
        if(cMantTortas) cMantTortas.destroy();
        const ctxMantTortas = document.getElementById('chartMantTortas');
        if (ctxMantTortas) {
            cMantTortas = new Chart(ctxMantTortas.getContext('2d'), {
                type: 'doughnut',
                data: {
                    labels: ['Preventivos', 'Correctivos', 'Actividades'],
                    datasets: [{ 
                        data: [countPrev, countCorr, countAct], 
                        backgroundColor: ['#10b981', '#f43f5e', '#38bdf8'], 
                        borderWidth: 2, 
                        borderColor: '#1e293b' 
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
                        backgroundColor: ['#ef4444', '#f59e0b', '#3b82f6'], borderWidth: 2, borderColor: '#1e293b' 
                    }]
                },
                options: { responsive: true, maintainAspectRatio: false }
            });
        }

        // Top 10 Equipos y conteo de Ubicaciones M1 / M2
        let equiposMap = {};
        let ubicacionesM1Map = {};
        let ubicacionesM2Map = {};

        rawData.forEach(r => {
            let eqStr = getVal(r, 'equipos_intervenidos');
            if (eqStr && typeof eqStr === 'string') {
                let eqArr = eqStr.split(',').map(s => s.trim()).filter(s => s !== '');
                eqArr.forEach(rawItem => {
                    let nombre = rawItem;
                    let sector = 'No especificado';
                    const firstParen = rawItem.indexOf('(');
                    if (firstParen !== -1) {
                        nombre = rawItem.substring(0, firstParen).trim();
                        sector = rawItem.substring(firstParen + 1).replace(/\)+$/, '').trim();
                    }
                    
                    const key = `${nombre}||${sector}`;
                    if (!equiposMap[key]) equiposMap[key] = { nombre, sector, count: 0 };
                    equiposMap[key].count += 1;

                    if (sector !== 'No especificado' && sector !== '') {
                        const secUpper = sector.toUpperCase();
                        const nombreLimpio = sector.replace(/\s*\(?\s*M[12]\s*\)?\s*/gi, '').trim() || sector;
                        
                        if (secUpper.includes('M2') || secUpper.includes('MÓDULO 2') || secUpper.includes('MODULO 2')) {
                            ubicacionesM2Map[nombreLimpio] = (ubicacionesM2Map[nombreLimpio] || 0) + 1;
                        } else {
                            ubicacionesM1Map[nombreLimpio] = (ubicacionesM1Map[nombreLimpio] || 0) + 1;
                        }
                    }
                });
            }
        });

        // Gráfico Ubicaciones M1
        if (cUbicacionesM1) cUbicacionesM1.destroy();
        const ctxUbiM1 = document.getElementById('chartUbicacionesM1');
        if (ctxUbiM1) {
            const labelsM1 = Object.keys(ubicacionesM1Map);
            const dataM1 = Object.values(ubicacionesM1Map);
            cUbicacionesM1 = new Chart(ctxUbiM1.getContext('2d'), {
                type: 'bar',
                data: {
                    labels: labelsM1.length ? labelsM1 : ['Sin registros'],
                    datasets: [{
                        label: 'Intervenciones M1',
                        data: dataM1.length ? dataM1 : [0],
                        backgroundColor: '#22d3ee',
                        borderRadius: 6
                    }]
                },
                options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { beginAtZero: true, ticks: { stepSize: 1 } } } }
            });
        }

        // Gráfico Ubicaciones M2
        if (cUbicacionesM2) cUbicacionesM2.destroy();
        const ctxUbiM2 = document.getElementById('chartUbicacionesM2');
        if (ctxUbiM2) {
            const labelsM2 = Object.keys(ubicacionesM2Map);
            const dataM2 = Object.values(ubicacionesM2Map);
            cUbicacionesM2 = new Chart(ctxUbiM2.getContext('2d'), {
                type: 'bar',
                data: {
                    labels: labelsM2.length ? labelsM2 : ['Sin registros'],
                    datasets: [{
                        label: 'Intervenciones M2',
                        data: dataM2.length ? dataM2 : [0],
                        backgroundColor: '#34d399',
                        borderRadius: 6
                    }]
                },
                options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { beginAtZero: true, ticks: { stepSize: 1 } } } }
            });
        }

        let topEquipos = Object.values(equiposMap).sort((a,b) => b.count - a.count).slice(0, 10);
        let tbody = document.getElementById('tabla_equipos_body');
        if (tbody) {
            if (topEquipos.length === 0) {
                tbody.innerHTML = '<tr><td colspan="4" class="text-center py-6 text-slate-500 italic">No hay registros</td></tr>';
            } else {
                tbody.innerHTML = topEquipos.map((eq, index) => `
                    <tr class="border-b border-slate-700/50 hover:bg-slate-800/50 transition">
                        <td class="py-3 px-4 text-cyan-400 font-medium">#${index + 1}</td>
                        <td class="py-3 px-4 text-white font-medium">${eq.nombre}</td>
                        <td class="py-3 px-4 text-slate-400 text-sm">${eq.sector}</td>
                        <td class="py-3 px-4 text-amber-400 font-bold text-right">${eq.count}</td>
                    </tr>
                `).join('');
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
