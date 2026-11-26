// ============================================================================
// CONFIGURACIÓN DE CONEXIÓN A GOOGLE SHEETS (Planta Depuradora AySA)
// ============================================================================
const SHEET_ID = "17QH5BKXgwZJexRd34iD4tC_nJckI4HVT1TrK3yGiCOA";

// Enlaces principales (Hoja 1 - Datos Generales)
const URLS_PRINCIPAL = [
    `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&gid=0`,
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vSJbo6XXFqrrJtIxNAwdLhKsIengafF5OZYMc4l9aV3wPvp6retFo159pKfh_9o-QRT2ZziK-ltwYtC/pub?gid=0&single=true&output=csv"
];

// Enlaces para pestaña "Equipos Críticos" (si tenés otra pestaña en el mismo Sheets, la busca por nombre)
const URLS_EQUIPOS = [
    `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=Equipos%20Criticos`,
    `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=Equipos%20Cr%C3%ADticos`
];

// Enlaces para pestaña "Control y Gestión"
const URLS_CONTROL = [
    `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=Control%20y%20Gestion`,
    `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=Control%20y%20Gesti%C3%B3n`
];

// ============================================================================
// VARIABLES GLOBALES Y CATÁLOGOS
// ============================================================================
let rawData = [];
let equiposData = [];
let controlData = [];

let cEnergia = null;
let cCaudales = null;
let cLimites = null;
let cSectores = null;
let cMensualEnergia = null;
let cMensualBiosolidos = null;
let cPanol = null;
let cCosteResiduos = null;
let cResiduosModulos = null;

// Catálogo oficial de los 24 sectores de Máximo
const SECTORES_MAXIMO = [
    { code: '0099', name: 'Báscula', label: '0099 (Báscula)' },
    { code: '0100', name: 'Pretratamiento M1', label: '0100 (Pretratamiento M1)' },
    { code: '0101', name: 'Tratamiento Biológico M1', label: '0101 (Tratamiento Biológico M1)' },
    { code: '0102', name: 'Sedimentación Secundaria M1', label: '0102 (Sedimentación Secundaria M1)' },
    { code: '0103', name: 'Salida de Liquido M1', label: '0103 (Salida de Liquido M1)' },
    { code: '0104', name: 'Deshidratación de Lodos M1', label: '0104 (Deshidratación de Lodos M1)' },
    { code: '0105', name: 'Sistema de Provisión de Agua M1', label: '0105 (Sistema de Provisión de Agua M1)' },
    { code: '0106', name: 'Sistema Eléctrico M1', label: '0106 (Sistema Eléctrico M1)' },
    { code: '0107', name: 'Depósito', label: '0107 (Depósito)' },
    { code: '0108', name: 'Laboratorio', label: '0108 (Laboratorio)' },
    { code: '0109', name: 'Administración', label: '0109 (Administración)' },
    { code: '0110', name: 'Taller de Planta', label: '0110 (Taller de Planta)' },
    { code: '0111', name: 'Pañol', label: '0111 (Pañol)' },
    { code: '0200', name: 'Pretratamiento M2', label: '0200 (Pretratamiento M2)' },
    { code: '0201', name: 'Sedimentación Primaria', label: '0201 (Sedimentación Primaria)' },
    { code: '020105', name: 'Agua de Servicio Pretratamiento', label: '020105 (Agua de Servicio Pretratamiento)' },
    { code: '0202', name: 'Tratamiento Biológico', label: '0202 (Tratamiento Biológico)' },
    { code: '0203', name: 'Sedimentación Secundaria', label: '0203 (Sedimentación Secundaria)' },
    { code: '020305', name: 'Agua de Servicio', label: '020305 (Agua de Servicio)' },
    { code: '0204', name: 'Espesamiento de Lodos', label: '0204 (Espesamiento de Lodos)' },
    { code: '0205', name: 'Flotación de Lodos', label: '0205 (Flotación de Lodos)' },
    { code: '0206', name: 'Digestión y Producción de Gas', label: '0206 (Digestión y Producción de Gas)' },
    { code: '0207', name: 'Almacenamiento de Lodos', label: '0207 (Almacenamiento de Lodos)' },
    { code: '0208', name: 'Deshidratación', label: '0208 (Deshidratación)' }
];

// ============================================================================
// INICIALIZACIÓN
// ============================================================================
window.onload = () => {
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
    iniciarCargaDeDatos();
};

function iniciarCargaDeDatos() {
    const dsLabel = document.getElementById('dataSourceLabel');
    if (dsLabel) {
        dsLabel.textContent = "Conectando con Google Sheets...";
        dsLabel.className = "text-xs font-medium px-3 py-1.5 bg-slate-800 text-slate-300 rounded-full border border-slate-700";
    }

    // 1. Carga Hoja Principal (Hoja 1)
    descargarCsvConRespaldo(
        URLS_PRINCIPAL,
        (data) => {
            rawData = data;
            if (dsLabel) {
                dsLabel.textContent = "Datos en vivo (Google Sheets)";
                dsLabel.className = "text-xs font-medium px-3 py-1.5 bg-green-900/40 text-green-300 rounded-full border border-green-700";
            }
            calcularYRenderizarTodo();

            // Si no se cargaron hojas separadas, intenta leer Equipos y Control desde rawData
            if (equiposData.length === 0) renderizarEquiposCriticos(rawData);
            if (controlData.length === 0) renderizarControlYGestion(rawData);
        },
        (err) => {
            console.error("Error al conectar con Hoja Principal:", err);
            if (dsLabel) {
                dsLabel.textContent = "Error de conexión (Usar CSV Manual)";
                dsLabel.className = "text-xs font-medium px-3 py-1.5 bg-red-900/50 text-red-300 rounded-full border border-red-700";
            }
        }
    );

    // 2. Carga Hoja Equipos Críticos (opcional si existe pestaña aparte)
    descargarCsvConRespaldo(
        URLS_EQUIPOS,
        (data) => {
            equiposData = data;
            renderizarEquiposCriticos(equiposData);
        },
        (err) => {
            console.warn("Aviso Equipos Críticos (usando datos de Hoja 1 si existen):", err);
        }
    );

    // 3. Carga Hoja Control y Gestión (opcional si existe pestaña aparte)
    descargarCsvConRespaldo(
        URLS_CONTROL,
        (data) => {
            controlData = data;
            renderizarControlYGestion(controlData);
        },
        (err) => {
            console.warn("Aviso Control y Gestión (usando datos de Hoja 1 si existen):", err);
        }
    );
}

// Descarga segura que valida URLs válidas (http/https) y evita errores 404 relativos
function descargarCsvConRespaldo(listaUrls, onSuccess, onError, indice = 0) {
    const urlsValidas = (listaUrls || []).filter(u => typeof u === 'string' && u.trim().startsWith('http'));
    if (urlsValidas.length === 0 || indice >= urlsValidas.length) {
        if (onError) onError("No hay URLs válidas disponibles.");
        return;
    }

    const urlBase = urlsValidas[indice].trim();
    const urlConCache = urlBase + (urlBase.includes('?') ? '&' : '?') + '_t=' + Date.now();

    Papa.parse(urlConCache, {
        download: true,
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: function(results) {
            if (results && results.data && results.data.length > 0) {
                onSuccess(results.data);
            } else {
                descargarCsvConRespaldo(urlsValidas, onSuccess, onError, indice + 1);
            }
        },
        error: function(err) {
            descargarCsvConRespaldo(urlsValidas, onSuccess, onError, indice + 1);
        }
    });
}

// Carga manual desde archivo CSV local (respaldo si hay bloqueo de red)
function cargarArchivoLocal(event) {
    const file = event.target.files[0];
    if (!file) return;

    const dsLabel = document.getElementById('dataSourceLabel');
    if (dsLabel) dsLabel.textContent = "Leyendo archivo local...";

    Papa.parse(file, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: function(results) {
            if (results.data && results.data.length > 0) {
                rawData = results.data;
                if (dsLabel) {
                    dsLabel.textContent = "Modo Local (Archivo CSV)";
                    dsLabel.className = "text-xs font-medium px-3 py-1.5 bg-cyan-900/40 text-cyan-300 rounded-full border border-cyan-700";
                }
                calcularYRenderizarTodo();
                renderizarEquiposCriticos(rawData);
                renderizarControlYGestion(rawData);
            } else {
                alert("El archivo CSV está vacío o tiene un formato incorrecto.");
            }
        },
        error: function(err) {
            alert("Error al leer el archivo local: " + err.message);
        }
    });
}

// ============================================================================
// NAVEGACIÓN DE PESTAÑAS
// ============================================================================
function openTab(tabId, event) {
    document.querySelectorAll('.tab-content').forEach(t => {
        t.classList.add('hidden');
        t.classList.remove('block');
    });
    document.querySelectorAll('.tab-btn').forEach(b => {
        b.classList.remove('border-cyan-500', 'text-cyan-400', 'active');
        b.classList.add('border-transparent', 'text-slate-400');
    });

    const target = document.getElementById(tabId);
    if (target) {
        target.classList.remove('hidden');
        target.classList.add('block');
    }
    if (event && event.currentTarget) {
        event.currentTarget.classList.remove('border-transparent', 'text-slate-400');
        event.currentTarget.classList.add('border-cyan-500', 'text-cyan-400', 'active');
    }
}

// ============================================================================
// FUNCIONES AUXILIARES DE LIMPIEZA Y CÁLCULO
// ============================================================================
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

    const aliasMap = {
        'caudal_trat_m1': ['cuadal_trat_m1', 'caudal_m1', 'trat_m1'],
        'caudal_trat_m2': ['cuadal_trat_m2', 'caudal_m2', 'trat_m2'],
        'caudal_dis_m1': ['caudal_dis_m1'],
        'caudal_dis_m2': ['caudal_dis_m2']
    };

    if (aliasMap[colName]) {
        for (let alt of aliasMap[colName]) {
            for (let k of Object.keys(row)) {
                if (String(k).toLowerCase().trim() === alt) return row[k];
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
    return String(str || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
}

function identificarSectorMaximo(texto) {
    if (!texto) return null;
    const norm = normalizarTexto(texto);

    const porCodigo = [...SECTORES_MAXIMO].sort((a, b) => b.code.length - a.code.length);
    for (const sec of porCodigo) {
        const regex = new RegExp(`(^|[^0-9])${sec.code}([^0-9]|$)`);
        if (regex.test(norm)) return sec;
    }

    const porNombre = [...SECTORES_MAXIMO].sort((a, b) => b.name.length - a.name.length);
    for (const sec of porNombre) {
        if (norm.includes(normalizarTexto(sec.name))) return sec;
    }
    return null;
}

// ============================================================================
// RENDERIZADO PRINCIPAL (RESUMEN, PROCESO, FUNCIONAMIENTO Y MANTENIMIENTO)
// ============================================================================
function calcularYRenderizarTodo() {
    if (!rawData || !rawData.length) return;
    const lastRow = rawData[rawData.length - 1];

    if (typeof Chart !== 'undefined') {
        Chart.defaults.color = '#94a3b8';
        Chart.defaults.font.family = 'Inter, sans-serif';
    }

    try {
        // --------------------------------------------------------------------
        // 1. PESTAÑA: RESUMEN GENERAL
        // --------------------------------------------------------------------
        setTexto('m1_dbo_ent', getAvg(rawData, 'dbo_ent_m1'));
        setTexto('m1_dbo_sal', getAvg(rawData, 'dbo_sal_m1'));
        setTexto('m1_dqo_ent', getAvg(rawData, 'dqo_ent_m1'));
        setTexto('m1_dqo_sal', getAvg(rawData, 'dqo_sal_m1'));
        setTexto('m1_mes_ent', getAvg(rawData, 'mes_ent_m1'));
        setTexto('m1_mes_sal', getAvg(rawData, 'mes_sal_m1'));
        setTexto('m1_caudal_dis', getCleanNumber(getVal(lastRow, 'caudal_dis_m1')) || 0.3);
        setTexto('m1_caudal_trat', getCleanNumber(getVal(lastRow, 'caudal_trat_m1')) || 0);

        const energiaM1 = getSum(rawData, 'energia_m1') ||
            (getSum(rawData, 'energia_m1_ts1') + getSum(rawData, 'energia_m1_ts2') + getSum(rawData, 'energia_m1_ts3'));
        setTexto('m1_energia_val', energiaM1.toLocaleString('es-AR'));

        setTexto('m2_dbo_ent', getAvg(rawData, 'dbo_ent_m2'));
        setTexto('m2_dbo_sal', getAvg(rawData, 'dbo_sal_m2'));
        setTexto('m2_dqo_ent', getAvg(rawData, 'dqo_ent_m2'));
        setTexto('m2_dqo_sal', getAvg(rawData, 'dqo_sal_m2'));
        setTexto('m2_mes_ent', getAvg(rawData, 'mes_ent_m2'));
        setTexto('m2_mes_sal', getAvg(rawData, 'mes_sal_m2'));
        setTexto('m2_caudal_dis', getCleanNumber(getVal(lastRow, 'caudal_dis_m2')) || 0.9);
        setTexto('m2_caudal_trat', getCleanNumber(getVal(lastRow, 'caudal_trat_m2')) || 0);

        const energiaM2 = getSum(rawData, 'energia_m2') ||
            (getSum(rawData, 'energia_m2_ts1') + getSum(rawData, 'energia_m2_ts2') + getSum(rawData, 'energia_m2_ts3'));
        setTexto('m2_energia_val', energiaM2.toLocaleString('es-AR'));

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

        // Mantenimiento Resumen
        setTexto('mant_prev', getSum(rawData, 'mant_preventivos'));
        setTexto('mant_corr', getSum(rawData, 'mant_correctivos'));
        setTexto('mant_act', getSum(rawData, 'mant_actividades'));

        // Gráfico Energía por Sectores (Dona)
        const ctxEnergia = document.getElementById('chartEnergiaSectores');
        if (ctxEnergia) {
            if (cEnergia) cEnergia.destroy();
            const e_m1_ts1 = getSum(rawData, 'energia_m1_ts1');
            const e_m1_ts2 = getSum(rawData, 'energia_m1_ts2');
            const e_m1_ts3 = getSum(rawData, 'energia_m1_ts3');
            const e_m2_ts1 = getSum(rawData, 'energia_m2_ts1');
            const e_m2_ts2 = getSum(rawData, 'energia_m2_ts2');
            const e_m2_ts3 = getSum(rawData, 'energia_m2_ts3');

            cEnergia = new Chart(ctxEnergia.getContext('2d'), {
                type: 'doughnut',
                data: {
                    labels: ['M1 - TS1', 'M1 - TS2', 'M1 - TS3', 'M2 - TS1', 'M2 - TS2', 'M2 - TS3'],
                    datasets: [{
                        data: [e_m1_ts1, e_m1_ts2, e_m1_ts3, e_m2_ts1, e_m2_ts2, e_m2_ts3],
                        backgroundColor: ['#0284c7', '#0ea5e9', '#38bdf8', '#059669', '#10b981', '#34d399'],
                        borderWidth: 2,
                        borderColor: '#1e293b'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { position: 'right' } },
                    cutout: '65%'
                }
            });
        }

        // --------------------------------------------------------------------
        // 2. PESTAÑA: PROCESO
        // --------------------------------------------------------------------
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

        const ctxCaudales = document.getElementById('chartCaudalesLine');
        if (ctxCaudales) {
            if (cCaudales) cCaudales.destroy();
            cCaudales = new Chart(ctxCaudales.getContext('2d'), {
                type: 'line',
                data: {
                    labels: fechas,
                    datasets: [
                        { label: 'Caudal Tratado M1', data: caudalesM1, borderColor: '#22d3ee', backgroundColor: 'rgba(34, 211, 238, 0.1)', fill: true, tension: 0.4 },
                        { label: 'Diseño M1 (0.3)', data: Array(fechas.length).fill(0.3), borderColor: '#0284c7', borderWidth: 2, borderDash: [5, 5], pointRadius: 0, fill: false },
                        { label: 'Caudal Tratado M2', data: caudalesM2, borderColor: '#34d399', backgroundColor: 'rgba(52, 211, 153, 0.1)', fill: true, tension: 0.4 },
                        { label: 'Diseño M2 (0.9)', data: Array(fechas.length).fill(0.9), borderColor: '#059669', borderWidth: 2, borderDash: [5, 5], pointRadius: 0, fill: false }
                    ]
                },
                options: { responsive: true, maintainAspectRatio: false, scales: { y: { suggestedMax: 1.2 } } }
            });
        }

        // Semáforo de Desvíos
        const diasFuera = rawData.filter(r => {
            const fn1 = getCleanNumber(getVal(r, 'fuera_norma_m1'));
            const fn2 = getCleanNumber(getVal(r, 'fuera_norma_m2'));
            const motivo = getVal(r, 'motivo_desvio');
            return fn1 > 0 || fn2 > 0 || (motivo && String(motivo).trim() !== '');
        });

        const diasRestantes = 37 - diasFuera.length;
        const labelRestantes = document.getElementById('dias_restantes_norma');
        if (labelRestantes) {
            labelRestantes.textContent = diasRestantes;
            labelRestantes.classList.toggle('text-red-500', diasRestantes <= 10);
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

        // --------------------------------------------------------------------
        // 3. PESTAÑA: FUNCIONAMIENTO (KPIs superiores)
        // --------------------------------------------------------------------
        const totalRsu = getSum(rawData, 'rsu_ton') || (getSum(rawData, 'rsu_m1') + getSum(rawData, 'rsu_m2'));
        const totalOt = getSum(rawData, 'cant_ot') || (getSum(rawData, 'mant_preventivos') + getSum(rawData, 'mant_correctivos') + getSum(rawData, 'mant_generales'));
        setTexto('func_cant_rsu', totalRsu.toLocaleString('es-AR'));
        setTexto('func_cant_ot', totalOt.toLocaleString('es-AR'));

        // --------------------------------------------------------------------
        // 4. PESTAÑA: MANTENIMIENTO (KPIs, 24 Sectores y Top 10 Equipos)
        // --------------------------------------------------------------------
        const mGen = getSum(rawData, 'mant_generales');
        const mPrev = getSum(rawData, 'mant_preventivos');
        const mCorr = getSum(rawData, 'mant_correctivos');
        setTexto('kpi_mant_gen', mGen);
        setTexto('kpi_mant_total', mGen + mPrev + mCorr);
        setTexto('kpi_horas_prev', getSum(rawData, 'horas_prev'));
        setTexto('kpi_horas_corr', getSum(rawData, 'horas_corr'));

        // Conteo de los 24 Sectores
        const conteoSectores = {};
        SECTORES_MAXIMO.forEach(s => { conteoSectores[s.code] = 0; });

        rawData.forEach(r => {
            let secStr = getVal(r, 'sectores_intervenidos');
            if (secStr && typeof secStr === 'string') {
                secStr.split(',').map(s => s.trim()).filter(Boolean).forEach(item => {
                    const match = identificarSectorMaximo(item);
                    if (match) conteoSectores[match.code] = (conteoSectores[match.code] || 0) + 1;
                });
            }
        });

        const ctxSectores = document.getElementById('chartSectores');
        if (ctxSectores) {
            if (cSectores) cSectores.destroy();
            cSectores = new Chart(ctxSectores.getContext('2d'), {
                type: 'bar',
                data: {
                    labels: SECTORES_MAXIMO.map(s => s.label),
                    datasets: [{
                        label: 'Intervenciones',
                        data: SECTORES_MAXIMO.map(s => conteoSectores[s.code] || 0),
                        backgroundColor: '#06b6d4',
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
                        x: { beginAtZero: true, ticks: { precision: 0 } },
                        y: { ticks: { color: '#cbd5e1', font: { size: 11 } }, grid: { display: false } }
                    }
                }
            });
        }

        // Top 10 Equipos Intervenidos
        let equiposMap = {};
        rawData.forEach(r => {
            let eqStr = getVal(r, 'equipos_intervenidos');
            if (eqStr && typeof eqStr === 'string') {
                eqStr.split(',').map(s => s.trim()).filter(Boolean).forEach(rawItem => {
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

        let topEquipos = Object.values(equiposMap).sort((a, b) => b.count - a.count).slice(0, 10);
        let tbody = document.getElementById('tabla_equipos_body');
        if (tbody) {
            if (topEquipos.length === 0) {
                tbody.innerHTML = '<tr><td colspan="4" class="text-center py-6 text-slate-500 italic">Sin registros cargados</td></tr>';
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
        console.error("Error al renderizar tablero:", e);
    }
}

// ============================================================================
// RENDERIZADO EQUIPOS CRÍTICOS Y MAPA DE PLANTA (PESTAÑA FUNCIONAMIENTO)
// ============================================================================
function renderizarEquiposCriticos(datos) {
    const listaEl = document.getElementById('lista_equipos_criticos');
    const totalEl = document.getElementById('total_eq_criticos');
    if (!listaEl) return;

    const filasEquipos = (datos || []).filter(r => {
        const nombre = getVal(r, 'eq_critico') || getVal(r, 'equipo_critico') || getVal(r, 'equipo');
        return nombre && String(nombre).trim() !== '';
    });

    if (totalEl) totalEl.textContent = `${filasEquipos.length} equipos`;

    if (filasEquipos.length === 0) {
        listaEl.innerHTML = '<div class="text-center py-6 text-slate-500 text-sm italic col-span-full">Sin novedades de equipos críticos cargadas.</div>';
        return;
    }

    listaEl.innerHTML = filasEquipos.map(r => {
        const nombre = getVal(r, 'eq_critico') || getVal(r, 'equipo_critico') || getVal(r, 'equipo') || 'Equipo';
        const sector = getVal(r, 'eq_sector') || getVal(r, 'sector') || 'General';
        const estado = String(getVal(r, 'eq_estado') || getVal(r, 'estado') || 'Operativo').trim();
        const detalle = getVal(r, 'eq_detalle') || getVal(r, 'detalle') || '';

        const estNorm = normalizarTexto(estado);
        let badgeClass = "bg-emerald-900/40 text-emerald-300 border-emerald-700";
        let dotClass = "bg-emerald-400";

        if (estNorm.includes('reparacion') || estNorm.includes('taller') || estNorm.includes('atencion')) {
            badgeClass = "bg-amber-900/40 text-amber-300 border-amber-700";
            dotClass = "bg-amber-400";
        } else if (estNorm.includes('fuera') || estNorm.includes('falla') || estNorm.includes('indisponible')) {
            badgeClass = "bg-red-900/40 text-red-300 border-red-700";
            dotClass = "bg-red-500";
        }

        // Actualizar color en el mapa esquemático SVG si coincide el sector
        const sectorSlug = normalizarTexto(sector).replace(/\s+/g, '_');
        const grupoSvg = document.getElementById(`mapa_${sectorSlug}`);
        const textoSvg = document.getElementById(`txt_${sectorSlug}`);
        if (grupoSvg) {
            const rect = grupoSvg.querySelector('rect');
            if (rect) {
                if (estNorm.includes('fuera') || estNorm.includes('falla')) rect.setAttribute('stroke', '#ef4444');
                else if (estNorm.includes('reparacion')) rect.setAttribute('stroke', '#f59e0b');
                else rect.setAttribute('stroke', '#10b981');
            }
        }
        if (textoSvg) {
            textoSvg.textContent = `${nombre}: ${estado}`;
        }

        return `
            <div class="bg-slate-900 rounded-xl p-4 border border-slate-700 flex flex-col justify-between gap-2">
                <div class="flex items-start justify-between gap-2">
                    <div>
                        <div class="font-bold text-white text-sm">${nombre}</div>
                        <div class="text-xs text-slate-400">${sector}</div>
                    </div>
                    <span class="text-[11px] font-medium px-2.5 py-0.5 rounded-full border flex items-center gap-1.5 ${badgeClass}">
                        <span class="w-1.5 h-1.5 rounded-full ${dotClass}"></span>${estado}
                    </span>
                </div>
                ${detalle ? `<div class="text-xs text-slate-300 bg-slate-800/80 px-2.5 py-1.5 rounded border border-slate-700/60">${detalle}</div>` : ''}
            </div>
        `;
    }).join('');
}

// ============================================================================
// RENDERIZADO PESTAÑA CONTROL Y GESTIÓN
// ============================================================================
function renderizarControlYGestion(datos) {
    if (!datos || !datos.length) return;

    try {
        const meses = datos.map(r => getVal(r, 'mes') || getVal(r, 'fecha') || '');

        // 1. Pañol (Items vs Plata)
        const panolItems = datos.map(r => getCleanNumber(getVal(r, 'panol_items')));
        const panolPlata = datos.map(r => getCleanNumber(getVal(r, 'panol_plata') || getVal(r, 'panol_pesos')));

        setTexto('tot_panol_items', getSum(datos, 'panol_items').toLocaleString('es-AR'));
        setTexto('tot_panol_plata', '$ ' + (getSum(datos, 'panol_plata') || getSum(datos, 'panol_pesos')).toLocaleString('es-AR'));

        const ctxPanol = document.getElementById('chartPanol');
        if (ctxPanol) {
            if (cPanol) cPanol.destroy();
            cPanol = new Chart(ctxPanol.getContext('2d'), {
                type: 'bar',
                data: {
                    labels: meses,
                    datasets: [
                        { label: 'Consumo Pañol (Ítems)', data: panolItems, backgroundColor: '#38bdf8', yAxisID: 'y' },
                        { label: 'Consumo Pañol ($)', data: panolPlata, type: 'line', borderColor: '#f59e0b', backgroundColor: 'transparent', borderWidth: 2, yAxisID: 'y1' }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: { type: 'linear', position: 'left', beginAtZero: true },
                        y1: { type: 'linear', position: 'right', beginAtZero: true, grid: { drawOnChartArea: false } }
                    }
                }
            });
        }

        // 2. Coste de Biosólidos y RSU ($)
        const costeBio = datos.map(r => getCleanNumber(getVal(r, 'coste_biosolidos') || getVal(r, 'costo_biosolidos')));
        const costeRsu = datos.map(r => getCleanNumber(getVal(r, 'coste_rsu') || getVal(r, 'costo_rsu')));

        const ctxCosteRes = document.getElementById('chartCosteResiduos');
        if (ctxCosteRes) {
            if (cCosteResiduos) cCosteResiduos.destroy();
            cCosteResiduos = new Chart(ctxCosteRes.getContext('2d'), {
                type: 'bar',
                data: {
                    labels: meses,
                    datasets: [
                        { label: 'Coste Biosólidos ($)', data: costeBio, backgroundColor: '#d97706' },
                        { label: 'Coste RSU ($)', data: costeRsu, backgroundColor: '#64748b' }
                    ]
                },
                options: { responsive: true, maintainAspectRatio: false }
            });
        }

        // 3. Totalizado Biosólidos y RSU: M1 vs M2
        const bioM1 = getSum(datos, 'biosolidos_m1') || getSum(datos, 'ton_ms_m1');
        const rsuM1 = getSum(datos, 'rsu_m1');
        const bioM2 = getSum(datos, 'biosolidos_m2') || getSum(datos, 'ton_ms_m2');
        const rsuM2 = getSum(datos, 'rsu_m2');

        setTexto('tot_bio_m1_cg', bioM1.toLocaleString('es-AR'));
        setTexto('tot_rsu_m1_cg', rsuM1.toLocaleString('es-AR'));
        setTexto('tot_bio_m2_cg', bioM2.toLocaleString('es-AR'));
        setTexto('tot_rsu_m2_cg', rsuM2.toLocaleString('es-AR'));

        const ctxResMod = document.getElementById('chartResiduosModulos');
        if (ctxResMod) {
            if (cResiduosModulos) cResiduosModulos.destroy();
            cResiduosModulos = new Chart(ctxResMod.getContext('2d'), {
                type: 'bar',
                data: {
                    labels: ['Módulo 1 (M1)', 'Módulo 2 (M2)'],
                    datasets: [
                        { label: 'Biosólidos (Ton/m³)', data: [bioM1, bioM2], backgroundColor: '#10b981' },
                        { label: 'RSU (Ton)', data: [rsuM1, rsuM2], backgroundColor: '#f59e0b' }
                    ]
                },
                options: { responsive: true, maintainAspectRatio: false }
            });
        }

        // 4. Inversiones y Explotaciones
        setTexto('inv_obras', '$ ' + getSum(datos, 'inversiones_obras').toLocaleString('es-AR'));
        setTexto('inv_equipamiento', '$ ' + getSum(datos, 'inversiones_equipamiento').toLocaleString('es-AR'));
        setTexto('exp_reparaciones', '$ ' + getSum(datos, 'explotaciones_reparaciones').toLocaleString('es-AR'));

    } catch (e) {
        console.error("Error renderizando Control y Gestión:", e);
    }
}

// ============================================================================
// FUNCIONES INTERACTIVAS DE MODAL Y GRÁFICO DE LÍMITES LEGALES
// ============================================================================
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

    const ctx = document.getElementById('chartLimitesLine');
    if (!ctx) return;

    if (cLimites) cLimites.destroy();
    cLimites = new Chart(ctx.getContext('2d'), {
        type: 'line',
        data: {
            labels: fechas,
            datasets: [
                { label: `${title} M1`, data: dataM1, borderColor: '#22d3ee', borderWidth: 2, tension: 0.2 },
                { label: `${title} M2`, data: dataM2, borderColor: '#34d399', borderWidth: 2, tension: 0.2 },
                { label: `Límite Legal (${maxLimit})`, data: Array(fechas.length).fill(maxLimit), borderColor: '#ef4444', borderWidth: 2, borderDash: [5, 5], pointRadius: 0, fill: false }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'top' } },
            scales: { y: { suggestedMax: maxLimit * 1.2 } }
        }
    });
};
