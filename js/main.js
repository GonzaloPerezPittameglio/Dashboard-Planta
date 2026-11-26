let rawData = [];
let equiposCriticosData = [];
let sectorSeleccionadoMapa = null;

// Instancias de Chart.js
let cMensualEnergia = null;
let cMensualBiosolidos = null;
let cMensualArenas = null;
let cMensualPolimero = null;

let cProcesoDbo = null;
let cProcesoCaudales = null;

let cMantMensual = null;
let cMantTortas = null;
let cCriticidad = null;
let cSectores = null;

let cPanol = null;
let cCosteResiduos = null;
let cBiosolidosRsu = null;

// Catálogo oficial de los 24 sectores de Máximo
const SECTORES_MAXIMO = [
    { code: '0099', label: '0099 (Báscula)' },
    { code: '0100', label: '0100 (Pretratamiento M1)' },
    { code: '0101', label: '0101 (Tratamiento Biológico M1)' },
    { code: '0102', label: '0102 (Sedimentación Secundaria M1)' },
    { code: '0103', label: '0103 (Salida de Liquido M1)' },
    { code: '0104', label: '0104 (Deshidratación de Lodos M1)' },
    { code: '0105', label: '0105 (Sistema de Provisión de Agua M1)' },
    { code: '0106', label: '0106 (Sistema Eléctrico M1)' },
    { code: '0107', label: '0107 (Depósito)' },
    { code: '0108', label: '0108 (Laboratorio)' },
    { code: '0109', label: '0109 (Administración)' },
    { code: '0110', label: '0110 (Taller de Planta)' },
    { code: '0111', label: '0111 (Pañol)' },
    { code: '0200', label: '0200 (Pretratamiento M2)' },
    { code: '0201', label: '0201 (Sedimentación Primaria)' },
    { code: '020105', label: '020105 (Agua de Servicio Pretratamiento)' },
    { code: '0202', label: '0202 (Tratamiento Biológico)' },
    { code: '0203', label: '0203 (Sedimentación Secundaria)' },
    { code: '020305', label: '020305 (Agua de Servicio)' },
    { code: '0204', label: '0204 (Espesamiento de Lodos)' },
    { code: '0205', label: '0205 (Flotación de Lodos)' },
    { code: '0206', label: '0206 (Digestión y Producción de Gas)' },
    { code: '0207', label: '0207 (Almacenamiento de Lodos)' },
    { code: '0208', label: '0208 (Deshidratación)' }
];

// Ubicaciones sobre el mapa aéreo (mapa-planta.jpg)
const UBICACIONES_PLANTA = [
    // Zona Izquierda (M2 y Digestión)
    { nombre: 'Silo de Lodos', top: 10, left: 4.5 },
    { nombre: 'Deshidratación M2', top: 23, left: 4.5 },
    { nombre: 'Sub Estación Transformadora 3', top: 30, left: 4.2 },
    { nombre: 'Caldera y Digestor', top: 22, left: 13.5 },
    { nombre: 'Gasómetro', top: 9, left: 15.8 },
    { nombre: 'Flotador', top: 18, left: 18.8 },
    { nombre: 'Espesador', top: 23, left: 22.8 },
    { nombre: 'Depósito de Hidrocarburo', top: 16, left: 26.5 },
    { nombre: 'Sala de Soplantes M2', top: 71, left: 10.2 },
    { nombre: 'Reactores Biológicos M2', top: 63, left: 15.5 },
    { nombre: 'Camara de Distribución y Clarificadores 1, 2, 3, 4', top: 60, left: 26.5 },

    // Zona Central (M1)
    { nombre: 'Taller de Mantenimiento', top: 48, left: 34.8 },
    { nombre: 'Deshidratación M1 y Taller de Soldadura', top: 53, left: 39.8 },
    { nombre: 'Administración', top: 68, left: 35.5 },
    { nombre: 'Grupo Electrogeno', top: 68, left: 39.5 },
    { nombre: 'Sala Soplantes M1', top: 68, left: 41.8 },
    { nombre: 'Clarificadores A,B,C', top: 51, left: 51.2 },
    { nombre: 'Reactores M1', top: 74, left: 50.5 },
    { nombre: 'Laboratorio, Pañol Funcionamiento y Coordinación', top: 63, left: 60.5 },
    { nombre: 'Pretratamiento M1', top: 82, left: 61.5 },

    // Zona Derecha (Pretratamiento General)
    { nombre: 'Sedimentador 1 y 2', top: 77, left: 88.0 },
    { nombre: 'Tratamiento de Grasas', top: 68, left: 96.5 },
    { nombre: 'Desarenador', top: 77, left: 96.5 },
    { nombre: 'Tratamiento de Arenas', top: 84, left: 96.2 },
    { nombre: 'Sub Estación Transformadora 1', top: 88, left: 93.2 }
];

// Enlaces a Google Sheets
const urlPrimary = "https://docs.google.com/spreadsheets/d/17QH5BKXgwZJexRd34iD4tC_nJckI4HVT1TrK3yGiCOA/gviz/tq?tqx=out:csv";
const urlBackup = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSJbo6XXFqrrJtIxNAwdLhKsIengafF5OZYMc4l9aV3wPvp6retFo159pKfh_9o-QRT2ZziK-ltwYtC/pub?gid=0&single=true&output=csv";
const urlEquiposCriticos = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSJbo6XXFqrrJtIxNAwdLhKsIengafF5OZYMc4l9aV3wPvp6retFo159pKfh_9o-QRT2ZziK-ltwYtC/pub?gid=316369111&single=true&output=csv";

window.onload = () => {
    lucide.createIcons();
    cargarDatosDesdeGoogle(urlPrimary);
    cargarEquiposCriticos();
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
                calcularYRenderizarTodo();
            } else if (urlTarget !== urlBackup) {
                cargarDatosDesdeGoogle(urlBackup);
            } else if (dsLabel) {
                dsLabel.textContent = "Planilla vacía o sin publicar";
                dsLabel.className = "text-xs font-medium px-3 py-1.5 bg-red-900/40 text-red-300 rounded-full border border-red-700";
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

function cargarEquiposCriticos() {
    const conCache = urlEquiposCriticos + '&_t=' + Date.now();
    Papa.parse(conCache, {
        download: true,
        header: true,
        skipEmptyLines: true,
        complete: function(results) {
            equiposCriticosData = results.data || [];
            renderizarFuncionamientoEquipos();
        },
        error: function(err) {
            console.error("Error cargando Equipos_Criticos:", err);
            renderizarFuncionamientoEquipos();
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

// Utilidades de lectura y cálculo
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

function getSumAliases(arr, aliases) {
    for (let a of aliases) {
        const s = getSum(arr, a);
        if (s !== 0) return s;
    }
    return 0;
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

function normalizar(str) {
    return String(str || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
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

function calcularYRenderizarTodo() {
    if (!rawData.length) return;
    const lastRow = rawData[rawData.length - 1];
    Chart.defaults.color = '#94a3b8';
    Chart.defaults.font.family = 'Inter';

    try {
        // ==============================================
        // 1. PESTAÑA RESUMEN GENERAL
        // ==============================================
        const avgDboEntM1 = getAvg(rawData, 'dbo_ent_m1');
        const avgDboSalM1 = getAvg(rawData, 'dbo_sal_m1');
        const avgDqoEntM1 = getAvg(rawData, 'dqo_ent_m1');
        const avgDqoSalM1 = getAvg(rawData, 'dqo_sal_m1');
        const avgMesEntM1 = getAvg(rawData, 'mes_ent_m1');
        const avgMesSalM1 = getAvg(rawData, 'mes_sal_m1');

        setTexto('m1_dbo_ent', avgDboEntM1);
        setTexto('m1_dbo_sal', avgDboSalM1);
        setTexto('m1_dqo_ent', avgDqoEntM1);
        setTexto('m1_dqo_sal', avgDqoSalM1);
        setTexto('m1_mes_ent', avgMesEntM1);
        setTexto('m1_mes_sal', avgMesSalM1);
        setTexto('m1_caudal_dis', getCleanNumber(getVal(lastRow, 'caudal_dis_m1')) || 0.3);
        setTexto('m1_caudal_trat', getCleanNumber(getVal(lastRow, 'caudal_trat_m1')) || 0);

        const energiaTotalM1 = getSum(rawData, 'energia_m1_ts1') + getSum(rawData, 'energia_m1_ts2') + getSum(rawData, 'energia_m1_ts3') || getSum(rawData, 'energia_m1');
        setTexto('m1_energia_val', energiaTotalM1.toLocaleString('es-AR'));

        const volTotalM1 = rawData.reduce((acc, r) => acc + (getCleanNumber(getVal(r, 'caudal_trat_m1')) * 86400), 0);
        setTexto('m1_kw_m3', volTotalM1 > 0 ? (energiaTotalM1 / volTotalM1).toFixed(3) : '0.000');

        const avgDboEntM2 = getAvg(rawData, 'dbo_ent_m2');
        const avgDboSalM2 = getAvg(rawData, 'dbo_sal_m2');
        const avgDqoEntM2 = getAvg(rawData, 'dqo_ent_m2');
        const avgDqoSalM2 = getAvg(rawData, 'dqo_sal_m2');
        const avgMesEntM2 = getAvg(rawData, 'mes_ent_m2');
        const avgMesSalM2 = getAvg(rawData, 'mes_sal_m2');

        setTexto('m2_dbo_ent', avgDboEntM2);
        setTexto('m2_dbo_sal', avgDboSalM2);
        setTexto('m2_dqo_ent', avgDqoEntM2);
        setTexto('m2_dqo_sal', avgDqoSalM2);
        setTexto('m2_mes_ent', avgMesEntM2);
        setTexto('m2_mes_sal', avgMesSalM2);
        setTexto('m2_caudal_dis', getCleanNumber(getVal(lastRow, 'caudal_dis_m2')) || 0.9);
        setTexto('m2_caudal_trat', getCleanNumber(getVal(lastRow, 'caudal_trat_m2')) || 0);

        const energiaTotalM2 = getSum(rawData, 'energia_m2_ts1') + getSum(rawData, 'energia_m2_ts2') + getSum(rawData, 'energia_m2_ts3') || getSum(rawData, 'energia_m2');
        setTexto('m2_energia_val', energiaTotalM2.toLocaleString('es-AR'));

        const volTotalM2 = rawData.reduce((acc, r) => acc + (getCleanNumber(getVal(r, 'caudal_trat_m2')) * 86400), 0);
        setTexto('m2_kw_m3', volTotalM2 > 0 ? (energiaTotalM2 / volTotalM2).toFixed(3) : '0.000');

        setTexto('tot_energia', getSum(rawData, 'energia_total').toLocaleString('es-AR'));
        setTexto('tot_biosolidos', getSum(rawData, 'biosolidos_ton').toLocaleString('es-AR'));
        setTexto('tot_arenas', getSum(rawData, 'arenas_ton').toLocaleString('es-AR'));
        setTexto('tot_polimero', getSum(rawData, 'polimero_kg').toLocaleString('es-AR'));

        // RRHH y Resumen Mantenimiento en Portada
        setTexto('rrhh_admin_lbl', getCleanNumber(getVal(lastRow, 'rrhh_admin')) || 0);
        setTexto('rrhh_operativo_lbl', getCleanNumber(getVal(lastRow, 'rrhh_operativo')) || 0);
        setTexto('hs_normales_lbl', getSum(rawData, 'hs_normales').toLocaleString('es-AR'));
        setTexto('hs_extra_lbl', getSum(rawData, 'hs_extra').toLocaleString('es-AR'));

        const countPrev = getSum(rawData, 'mant_preventivos');
        const countCorr = getSum(rawData, 'mant_correctivos');
        const countAct = getSum(rawData, 'mant_actividades') || getSum(rawData, 'mant_generales');

        setTexto('mant_prev', countPrev);
        setTexto('mant_corr', countCorr);
        setTexto('mant_act', countAct);

        // Agrupación Mensual General
        const resumenMensual = {};
        rawData.forEach(r => {
            const mesKey = getMonthYear(getVal(r, 'fecha'));
            if (!resumenMensual[mesKey]) {
                resumenMensual[mesKey] = {
                    energia: 0, biosolidos: 0, arenas: 0, polimero: 0,
                    prev: 0, corr: 0, act: 0,
                    panolItems: 0, panolPlata: 0,
                    costeBio: 0, costeRsu: 0
                };
            }
            resumenMensual[mesKey].energia += getCleanNumber(getVal(r, 'energia_total'));
            resumenMensual[mesKey].biosolidos += getCleanNumber(getVal(r, 'biosolidos_ton'));
            resumenMensual[mesKey].arenas += getCleanNumber(getVal(r, 'arenas_ton'));
            resumenMensual[mesKey].polimero += getCleanNumber(getVal(r, 'polimero_kg'));

            resumenMensual[mesKey].prev += getCleanNumber(getVal(r, 'mant_preventivos'));
            resumenMensual[mesKey].corr += getCleanNumber(getVal(r, 'mant_correctivos'));
            resumenMensual[mesKey].act += getCleanNumber(getVal(r, 'mant_actividades')) || getCleanNumber(getVal(r, 'mant_generales'));

            resumenMensual[mesKey].panolItems += getCleanNumber(getVal(r, 'panol_items_consumidos') ?? getVal(r, 'panol_items'));
            resumenMensual[mesKey].panolPlata += getCleanNumber(getVal(r, 'panol_plata_consumida') ?? getVal(r, 'panol_plata'));
            resumenMensual[mesKey].costeBio += getCleanNumber(getVal(r, 'coste_biosolidos') ?? getVal(r, 'costo_biosolidos'));
            resumenMensual[mesKey].costeRsu += getCleanNumber(getVal(r, 'coste_rsu') ?? getVal(r, 'costo_rsu'));
        });

        const mesesLabels = Object.keys(resumenMensual);

        const buildMonthlyBar = (canvasId, instanceRef, label, dataArr, colorHex, unit) => {
            if (instanceRef) instanceRef.destroy();
            const ctx = document.getElementById(canvasId);
            if (!ctx) return null;
            return new Chart(ctx.getContext('2d'), {
                type: 'bar',
                data: {
                    labels: mesesLabels,
                    datasets: [{ label, data: dataArr, backgroundColor: colorHex, borderRadius: 6 }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            callbacks: {
                                label: ctx => `${label}: ${(ctx.parsed.y || 0).toLocaleString('es-AR')} ${unit}`
                            }
                        }
                    },
                    scales: { y: { beginAtZero: true } }
                }
            });
        };

        cMensualEnergia = buildMonthlyBar('chartMensualEnergia', cMensualEnergia, 'Energía Total', mesesLabels.map(m => resumenMensual[m].energia), '#facc15', 'kWh');
        cMensualBiosolidos = buildMonthlyBar('chartMensualBiosolidos', cMensualBiosolidos, 'Biosólidos', mesesLabels.map(m => resumenMensual[m].biosolidos), '#d97706', 'Ton');
        cMensualArenas = buildMonthlyBar('chartMensualArenas', cMensualArenas, 'Arenas', mesesLabels.map(m => resumenMensual[m].arenas), '#fb923c', 'Ton');
        cMensualPolimero = buildMonthlyBar('chartMensualPolimero', cMensualPolimero, 'Polímero', mesesLabels.map(m => resumenMensual[m].polimero), '#818cf8', 'Kg');

        // ==============================================
        // 2. PESTAÑA PROCESO
        // ==============================================
        setTexto('proc_rem_dbo_m1', calcRemocion(avgDboEntM1, avgDboSalM1));
        setTexto('proc_rem_dqo_m1', calcRemocion(avgDqoEntM1, avgDqoSalM1));
        setTexto('proc_rem_mes_m1', calcRemocion(avgMesEntM1, avgMesSalM1));
        setTexto('proc_norma_m1', getSum(rawData, 'fuera_norma_m1'));

        setTexto('proc_rem_dbo_m2', calcRemocion(avgDboEntM2, avgDboSalM2));
        setTexto('proc_rem_dqo_m2', calcRemocion(avgDqoEntM2, avgDqoSalM2));
        setTexto('proc_rem_mes_m2', calcRemocion(avgMesEntM2, avgMesSalM2));
        setTexto('proc_norma_m2', getSum(rawData, 'fuera_norma_m2'));

        const fechasLabels = rawData.map(r => String(getVal(r, 'fecha') || '').slice(0, 10));

        if (cProcesoDbo) cProcesoDbo.destroy();
        const ctxProcDbo = document.getElementById('chartProcesoDbo');
        if (ctxProcDbo) {
            cProcesoDbo = new Chart(ctxProcDbo.getContext('2d'), {
                type: 'line',
                data: {
                    labels: fechasLabels,
                    datasets: [
                        { label: 'DBO Salida M1', data: rawData.map(r => getCleanNumber(getVal(r, 'dbo_sal_m1'))), borderColor: '#22d3ee', backgroundColor: 'rgba(34,211,238,0.1)', tension: 0.3 },
                        { label: 'DBO Salida M2', data: rawData.map(r => getCleanNumber(getVal(r, 'dbo_sal_m2'))), borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,0.1)', tension: 0.3 }
                    ]
                },
                options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true } } }
            });
        }

        if (cProcesoCaudales) cProcesoCaudales.destroy();
        const ctxProcCaud = document.getElementById('chartProcesoCaudales');
        if (ctxProcCaud) {
            cProcesoCaudales = new Chart(ctxProcCaud.getContext('2d'), {
                type: 'line',
                data: {
                    labels: fechasLabels,
                    datasets: [
                        { label: 'Caudal M1 (m³/s)', data: rawData.map(r => getCleanNumber(getVal(r, 'caudal_trat_m1'))), borderColor: '#06b6d4', tension: 0.3 },
                        { label: 'Caudal M2 (m³/s)', data: rawData.map(r => getCleanNumber(getVal(r, 'caudal_trat_m2'))), borderColor: '#34d399', tension: 0.3 }
                    ]
                },
                options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true } } }
            });
        }

        // ==============================================
        // 3. PESTAÑA FUNCIONAMIENTO (KPIs + MAPA)
        // ==============================================
        const totalRsu = getSumAliases(rawData, ['rsu_ton', 'cant_rsu', 'rsu']) || (getSum(rawData, 'rsu_m1') + getSum(rawData, 'rsu_m2'));
        const totalOt = getSumAliases(rawData, ['ot_cantidad', 'cant_ot', 'ordenes_trabajo', 'ot']);
        setTexto('func_cant_rsu', totalRsu.toLocaleString('es-AR'));
        setTexto('func_cant_ot', totalOt.toLocaleString('es-AR'));
        renderizarFuncionamientoEquipos();

        // ==============================================
        // 4. PESTAÑA MANTENIMIENTO
        // ==============================================
        const countTotal = countPrev + countCorr + countAct;
        setTexto('kpi_mant_total', countTotal);
        setTexto('kpi_mant_prev', countPrev);
        setTexto('kpi_mant_corr', countCorr);
        setTexto('kpi_mant_act', countAct);

        const hsPrev = getSum(rawData, 'horas_prev');
        const hsCorr = getSum(rawData, 'horas_corr');
        const hsTareas = getSum(rawData, 'horas_tareas');
        const hsTotal = hsPrev + hsCorr + hsTareas;

        setTexto('kpi_horas_total', hsTotal);
        setTexto('kpi_horas_prev', hsPrev);
        setTexto('kpi_horas_corr', hsCorr);
        setTexto('kpi_horas_tareas', hsTareas);

        // Promedios
        setTexto('kpi_prom_total', countTotal > 0 ? (hsTotal / countTotal).toFixed(1) : 0);
        setTexto('kpi_prom_prev', countPrev > 0 ? (hsPrev / countPrev).toFixed(1) : 0);
        setTexto('kpi_prom_corr', countCorr > 0 ? (hsCorr / countCorr).toFixed(1) : 0);
        setTexto('kpi_prom_act', countAct > 0 ? (hsTareas / countAct).toFixed(1) : 0);

        // Gráfico Barras Mensual Mantenimiento
        if (cMantMensual) cMantMensual.destroy();
        const ctxMantMensual = document.getElementById('chartMantMensual');
        if (ctxMantMensual) {
            cMantMensual = new Chart(ctxMantMensual.getContext('2d'), {
                type: 'bar',
                data: {
                    labels: mesesLabels,
                    datasets: [
                        { label: 'Preventivos', data: mesesLabels.map(m => resumenMensual[m].prev), backgroundColor: '#22c55e', borderRadius: 4 },
                        { label: 'Correctivos', data: mesesLabels.map(m => resumenMensual[m].corr), backgroundColor: '#ef4444', borderRadius: 4 },
                        { label: 'Actividades', data: mesesLabels.map(m => resumenMensual[m].act), backgroundColor: '#38bdf8', borderRadius: 4 }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: { y: { beginAtZero: true, ticks: { precision: 0 } } }
                }
            });
        }

        // Gráfico Torta: Preventivos vs Correctivos vs Actividades
        if (cMantTortas) cMantTortas.destroy();
        const ctxMantTortas = document.getElementById('chartMantTortas');
        if (ctxMantTortas) {
            cMantTortas = new Chart(ctxMantTortas.getContext('2d'), {
                type: 'doughnut',
                data: {
                    labels: ['Preventivos', 'Correctivos', 'Actividades'],
                    datasets: [{
                        data: [countPrev, countCorr, countAct],
                        backgroundColor: ['#22c55e', '#ef4444', '#38bdf8'],
                        borderColor: '#1e293b',
                        borderWidth: 2
                    }]
                },
                options: { responsive: true, maintainAspectRatio: false }
            });
        }

        // Gráfico Criticidad Correctivos
        if (cCriticidad) cCriticidad.destroy();
        const ctxCrit = document.getElementById('chartCriticidad');
        if (ctxCrit) {
            cCriticidad = new Chart(ctxCrit.getContext('2d'), {
                type: 'bar',
                data: {
                    labels: ['Alta', 'Media', 'Baja'],
                    datasets: [{
                        label: 'Correctivos',
                        data: [getSum(rawData, 'corr_alto'), getSum(rawData, 'corr_medio'), getSum(rawData, 'corr_bajo')],
                        backgroundColor: ['#ef4444', '#f59e0b', '#10b981'],
                        borderRadius: 6
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: { y: { beginAtZero: true, ticks: { precision: 0 } } }
                }
            });
        }

        // Gráfico de los 24 Sectores (Escala libre y coincidencia exacta sin solapamientos)
        const availableCols = rawData.length > 0 ? Object.keys(rawData[0]) : [];
        const conteoSectores = {};

        SECTORES_MAXIMO.forEach(sec => {
            let totalSec = 0;
            const codeNorm = normalizar(sec.code);
            const labelNorm = normalizar(sec.label);

            availableCols.forEach(col => {
                const cNorm = normalizar(col);
                const coincide =
                    cNorm === labelNorm ||
                    cNorm === codeNorm ||
                    cNorm === `sec_${codeNorm}` ||
                    cNorm.startsWith(`${codeNorm} (`);

                if (coincide) {
                    totalSec += getSum(rawData, col);
                }
            });
            conteoSectores[sec.code] = totalSec;
        });

        if (cSectores) cSectores.destroy();
        const ctxSectores = document.getElementById('chartSectores');
        if (ctxSectores) {
            cSectores = new Chart(ctxSectores.getContext('2d'), {
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

        // Top 10 Equipos Más Intervenidos
        let equiposMap = {};
        rawData.forEach(r => {
            let eqStr = getVal(r, 'equipos_intervenidos');
            if (eqStr && typeof eqStr === 'string') {
                eqStr.split(',').map(s => s.trim()).filter(s => s !== '').forEach(rawItem => {
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
                });
            }
        });

        const topEquipos = Object.values(equiposMap).sort((a, b) => b.count - a.count).slice(0, 10);
        const tbodyEq = document.getElementById('tabla_equipos_body');
        if (tbodyEq) {
            if (topEquipos.length === 0) {
                tbodyEq.innerHTML = '<tr><td colspan="4" class="text-center py-6 text-slate-500 italic">No hay registros de equipos intervenidos aún</td></tr>';
            } else {
                tbodyEq.innerHTML = topEquipos.map((eq, idx) => `
                    <tr class="border-b border-slate-700/50 hover:bg-slate-800/50 transition">
                        <td class="py-3 px-3 text-cyan-400 font-medium">#${idx + 1}</td>
                        <td class="py-3 px-3 text-white font-medium">${eq.nombre}</td>
                        <td class="py-3 px-3 text-slate-400 text-xs">${eq.sector}</td>
                        <td class="py-3 px-3 text-amber-400 font-bold text-right">${eq.count}</td>
                    </tr>
                `).join('');
            }
        }

        // ==============================================
        // 5. PESTAÑA CONTROL Y GESTIÓN
        // ==============================================
        const totPanolItems = mesesLabels.reduce((acc, m) => acc + resumenMensual[m].panolItems, 0);
        const totPanolPlata = mesesLabels.reduce((acc, m) => acc + resumenMensual[m].panolPlata, 0);

        setTexto('tot_panol_items', totPanolItems.toLocaleString('es-AR'));
        setTexto('tot_panol_plata', '$ ' + totPanolPlata.toLocaleString('es-AR'));

        const tbodyPanol = document.getElementById('tabla_panol_mensual');
        if (tbodyPanol) {
            if (mesesLabels.length === 0) {
                tbodyPanol.innerHTML = '<tr><td colspan="3" class="text-center py-4 text-slate-500 italic">Sin registros</td></tr>';
            } else {
                tbodyPanol.innerHTML = mesesLabels.map(m => `
                    <tr class="border-b border-slate-700/50">
                        <td class="py-2 px-3 text-slate-200 font-medium">${m}</td>
                        <td class="py-2 px-3 text-right text-cyan-400 font-semibold">${resumenMensual[m].panolItems.toLocaleString('es-AR')}</td>
                        <td class="py-2 px-3 text-right text-emerald-400 font-semibold">$ ${resumenMensual[m].panolPlata.toLocaleString('es-AR')}</td>
                    </tr>
                `).join('');
            }
        }

        if (cPanol) cPanol.destroy();
        const ctxPanol = document.getElementById('chartPanol');
        if (ctxPanol) {
            cPanol = new Chart(ctxPanol.getContext('2d'), {
                type: 'bar',
                data: {
                    labels: mesesLabels,
                    datasets: [
                        { label: 'Ítems Consumidos', data: mesesLabels.map(m => resumenMensual[m].panolItems), backgroundColor: '#22d3ee', yAxisID: 'y', borderRadius: 4 },
                        { label: 'Consumo en Plata ($)', data: mesesLabels.map(m => resumenMensual[m].panolPlata), type: 'line', borderColor: '#10b981', backgroundColor: '#10b981', borderWidth: 2, yAxisID: 'y1', tension: 0.3 }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: { type: 'linear', position: 'left', beginAtZero: true, title: { display: true, text: 'Ítems' } },
                        y1: { type: 'linear', position: 'right', beginAtZero: true, grid: { drawOnChartArea: false }, title: { display: true, text: 'Pesos ($)' } }
                    }
                }
            });
        }

        // Coste Biosólidos y RSU ($)
        if (cCosteResiduos) cCosteResiduos.destroy();
        const ctxCosteRes = document.getElementById('chartCosteResiduos');
        if (ctxCosteRes) {
            cCosteResiduos = new Chart(ctxCosteRes.getContext('2d'), {
                type: 'bar',
                data: {
                    labels: mesesLabels,
                    datasets: [
                        { label: 'Coste Biosólidos ($)', data: mesesLabels.map(m => resumenMensual[m].costeBio), backgroundColor: '#d97706', borderRadius: 4 },
                        { label: 'Coste RSU ($)', data: mesesLabels.map(m => resumenMensual[m].costeRsu), backgroundColor: '#f59e0b', borderRadius: 4 }
                    ]
                },
                options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true } } }
            });
        }

        // Totalizado Biosólidos y RSU M1 vs M2
        const bioM1 = getSum(rawData, 'biosolidos_m1');
        const bioM2 = getSum(rawData, 'biosolidos_m2');
        const rsuM1 = getSum(rawData, 'rsu_m1');
        const rsuM2 = getSum(rawData, 'rsu_m2');

        if (cBiosolidosRsu) cBiosolidosRsu.destroy();
        const ctxBioRsu = document.getElementById('chartBiosolidosRsu');
        if (ctxBioRsu) {
            cBiosolidosRsu = new Chart(ctxBioRsu.getContext('2d'), {
                type: 'bar',
                data: {
                    labels: ['Módulo 1 (M1)', 'Módulo 2 (M2)'],
                    datasets: [
                        { label: 'Biosólidos (Ton)', data: [bioM1, bioM2], backgroundColor: '#06b6d4', borderRadius: 6 },
                        { label: 'RSU (Ton)', data: [rsuM1, rsuM2], backgroundColor: '#f59e0b', borderRadius: 6 }
                    ]
                },
                options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true } } }
            });
        }

        // Inversiones y Explotaciones
        const invObras = getSumAliases(rawData, ['inversiones_obras', 'inv_obras', 'obras']);
        const invEquip = getSumAliases(rawData, ['inversiones_equipamiento', 'inv_equipamiento', 'inv_equip', 'equipamiento']);
        const expRep = getSumAliases(rawData, ['explotaciones_reparaciones', 'exp_reparaciones', 'reparaciones']);

        setTexto('gest_inv_obras', '$ ' + invObras.toLocaleString('es-AR'));
        setTexto('gest_inv_equip', '$ ' + invEquip.toLocaleString('es-AR'));
        setTexto('gest_exp_rep', '$ ' + expRep.toLocaleString('es-AR'));

    } catch (e) {
        console.error("Error al renderizar el dashboard:", e);
    }
}

// ==============================================
// FUNCIONES DE MAPA Y EQUIPOS CRÍTICOS (FUNCIONAMIENTO)
// ==============================================
function filtrarEquiposPorSector(nombreSector) {
    sectorSeleccionadoMapa = nombreSector;
    renderizarFuncionamientoEquipos();
}

function renderizarFuncionamientoEquipos() {
    const equiposCriticos = [];
    equiposCriticosData.forEach(r => {
        const nombreEq = getVal(r, 'equipo') ?? getVal(r, 'eq_critico');
        if (nombreEq && String(nombreEq).trim() !== '') {
            const sectorRaw = String(getVal(r, 'sector_mapa') ?? getVal(r, 'eq_sector') ?? '').trim();
            const estadoRaw = String(getVal(r, 'estado') ?? getVal(r, 'eq_estado') ?? 'Operativo').trim();
            const detalleRaw = String(getVal(r, 'detalle') ?? getVal(r, 'eq_detalle') ?? '').trim();

            const estLower = normalizar(estadoRaw);
            let nivel = 1; // Verde (Operativo)
            if (estLower.includes('reparacion')) nivel = 2; // Amarillo
            if (estLower.includes('fuera')) nivel = 3; // Rojo

            equiposCriticos.push({
                nombre: String(nombreEq).trim(),
                sector: sectorRaw,
                estado: estadoRaw,
                detalle: detalleRaw,
                nivel
            });
        }
    });

    // Dibujar los 25 puntos sobre el mapa aéreo con color dinámico según estado
    const capaMapa = document.getElementById('capa_marcadores_planta');
    if (capaMapa) {
        capaMapa.innerHTML = UBICACIONES_PLANTA.map(u => {
            const uNorm = normalizar(u.nombre);
            const eqsEnZona = equiposCriticos.filter(e => normalizar(e.sector) === uNorm);
            let maxNivel = 0;
            eqsEnZona.forEach(e => { if (e.nivel > maxNivel) maxNivel = e.nivel; });

            let dotStyle = 'bg-cyan-400 shadow-[0_0_8px_#22d3ee]';
            if (maxNivel === 1) dotStyle = 'bg-emerald-500 shadow-[0_0_8px_#10b981]';
            if (maxNivel === 2) dotStyle = 'bg-amber-400 shadow-[0_0_8px_#fbbf24] animate-pulse';
            if (maxNivel === 3) dotStyle = 'bg-red-500 shadow-[0_0_10px_#ef4444] animate-ping';

            const activo = sectorSeleccionadoMapa && normalizar(sectorSeleccionadoMapa) === uNorm;
            const badgeBorder = activo ? 'border-cyan-400 ring-2 ring-cyan-400/50 bg-slate-900' : 'border-slate-500/80 bg-slate-950/90';

            return `
                <button type="button" onclick="filtrarEquiposPorSector('${u.nombre.replace(/'/g, "\\'")}')"
                     style="top: ${u.top}%; left: ${u.left}%;"
                     class="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-10 group cursor-pointer focus:outline-none">
                    <span class="w-3 h-3 rounded-full border-2 border-slate-950 mb-1 transition-transform group-hover:scale-125 ${dotStyle}"></span>
                    <span class="${badgeBorder} border text-white text-[10px] font-semibold px-2 py-0.5 rounded shadow-lg whitespace-nowrap group-hover:border-cyan-400 transition">
                        ${u.nombre}
                    </span>
                </button>
            `;
        }).join('');
    }

    // Filtrar lista si se hizo clic en un punto del mapa
    const btnReset = document.getElementById('btn_reset_sector_mapa');
    const tituloLista = document.getElementById('titulo_lista_equipos');
    let listaMostrar = equiposCriticos;

    if (sectorSeleccionadoMapa) {
        listaMostrar = equiposCriticos.filter(e => normalizar(e.sector) === normalizar(sectorSeleccionadoMapa));
        if (btnReset) btnReset.classList.remove('hidden');
        if (tituloLista) tituloLista.textContent = `Equipos Críticos · ${sectorSeleccionadoMapa}`;
    } else {
        if (btnReset) btnReset.classList.add('hidden');
        if (tituloLista) tituloLista.textContent = 'Listado General de Equipos Críticos';
    }

    setTexto('total_eq_criticos', `${listaMostrar.length} equipos`);
    const contEquipos = document.getElementById('lista_equipos_criticos');
    if (contEquipos) {
        if (listaMostrar.length === 0) {
            contEquipos.innerHTML = '<div class="text-center py-8 text-slate-500 text-sm italic col-span-full">No hay equipos críticos registrados para esta selección.</div>';
        } else {
            contEquipos.innerHTML = listaMostrar.map(eq => generarTarjetaEquipoHTML(eq)).join('');
            lucide.createIcons();
        }
    }
}

function generarTarjetaEquipoHTML(eq) {
    let badgeClass = 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
    let dotClass = 'bg-emerald-400';

    if (eq.nivel === 2) {
        badgeClass = 'bg-amber-500/15 text-amber-300 border-amber-500/30';
        dotClass = 'bg-amber-400 animate-pulse';
    } else if (eq.nivel === 3) {
        badgeClass = 'bg-red-500/15 text-red-400 border-red-500/30';
        dotClass = 'bg-red-500';
    }

    const detalleHTML = eq.detalle !== ''
        ? `<div class="mt-2.5 text-xs bg-slate-950/70 text-amber-200/90 px-2.5 py-1.5 rounded-lg border border-amber-500/20 flex items-center gap-1.5">
             <i data-lucide="wrench" class="w-3.5 h-3.5 text-amber-400 shrink-0"></i>
             <span>${eq.detalle}</span>
           </div>`
        : '';

    return `
        <div class="bg-slate-900 rounded-xl p-4 border border-slate-700/80 hover:border-slate-600 transition flex flex-col justify-between">
            <div class="flex justify-between items-start gap-2">
                <div>
                    <div class="font-bold text-white text-sm">${eq.nombre}</div>
                    <div class="text-[11px] text-slate-400 mt-0.5">${eq.sector || 'Sector general'}</div>
                </div>
                <span class="px-2.5 py-1 rounded-full text-[11px] font-semibold border flex items-center gap-1.5 shrink-0 ${badgeClass}">
                    <span class="w-2 h-2 rounded-full ${dotClass}"></span>
                    ${eq.estado}
                </span>
            </div>
            ${detalleHTML}
        </div>
    `;
}
