const SHEET_ID = "17QH5BKXgwZJexRd34iD4tC_nJckI4HVT1TrK3yGiCOA";

// Almacenamiento global de datos por pestaña
let rawData = [];
let panolData = [];
let rrhhData = [];
let combustibleData = [];
let equiposCriticosData = [];

// Instancias de gráficos (Chart.js)
let cEnergia = null;
let cCaudales = null;
let cLimites = null;
let cMensualEnergia = null;
let cMensualBiosolidos = null;
let cMensualArenas = null;
let cMensualPolimero = null;
let cSectores = null;
let cGastosRubro = null;
let cCombustible = null;

// Catálogo oficial de los 24 sectores de Maximo
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
// 1. INICIALIZACIÓN Y CONEXIÓN SIN BLOQUEOS CORS (JSONP GViz)
// ============================================================================

window.onload = () => {
    if (typeof lucide !== 'undefined') lucide.createIcons();
    cargarTodasLasHojas();
};

function cargarTodasLasHojas() {
    actualizarEstadoConexion("Conectando con Google Sheets...", "amber");

    // Timeout de seguridad para la hoja principal
    clearTimeout(window.gvizTimeout);
    window.gvizTimeout = setTimeout(() => {
        if (!rawData.length) {
            actualizarEstadoConexion("Error de conexión (verificá permisos de la planilla)", "red");
        }
    }, 12000);

    // Carga de hoja principal (Hoja 1)
    inyectarScriptGViz("Hoja 1", "recibirDatosPrincipal", "gviz-hoja1", () => {
        clearTimeout(window.gvizTimeout);
        actualizarEstadoConexion("Error de conexión con Google Sheets", "red");
    });

    // Carga independiente de pestañas secundarias (si están vacías no rompen el resto)
    inyectarScriptGViz("Pañol", "recibirDatosPanol", "gviz-panol");
    inyectarScriptGViz("RRHH_Sectores", "recibirDatosRRHH", "gviz-rrhh");
    inyectarScriptGViz("Combustible", "recibirDatosCombustible", "gviz-combustible");
    inyectarScriptGViz("Equipos_Criticos", "recibirDatosEquipos", "gviz-equipos");
}

function inyectarScriptGViz(nombreHoja, handlerName, scriptId, onErrorFn) {
    const old = document.getElementById(scriptId);
    if (old) old.remove();

    const script = document.createElement('script');
    script.id = scriptId;
    const sheetParam = encodeURIComponent(nombreHoja);
    script.src = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?sheet=${sheetParam}&headers=1&tqx=out:json;responseHandler:${handlerName}&_t=${Date.now()}`;
    if (onErrorFn) script.onerror = onErrorFn;
    document.body.appendChild(script);
}

function parsearTablaGViz(respuesta) {
    if (!respuesta || respuesta.status !== 'ok' || !respuesta.table || !respuesta.table.rows) {
        return [];
    }
    const headers = respuesta.table.cols.map(col => (col.label || col.id || '').trim());
    return respuesta.table.rows.map(row => {
        const filaObj = {};
        headers.forEach((header, idx) => {
            if (!header) return;
            const cell = row.c && row.c[idx];
            if (!cell) {
                filaObj[header] = '';
            } else if (typeof cell.v === 'number') {
                filaObj[header] = cell.v;
            } else {
                filaObj[header] = (cell.f !== undefined && cell.f !== null) ? cell.f : (cell.v ?? '');
            }
        });
        return filaObj;
    }).filter(obj => Object.values(obj).some(v => v !== '' && v !== null && v !== undefined));
}

window.recibirDatosPrincipal = function(respuesta) {
    clearTimeout(window.gvizTimeout);
    const filas = parsearTablaGViz(respuesta);
    if (!filas.length) {
        actualizarEstadoConexion("Planilla vacía o sin permisos de lectura", "red");
        return;
    }
    rawData = filas;
    actualizarEstadoConexion("Datos en vivo (Google Sheets)", "green");
    calcularYRenderizarResumen();
};

window.recibirDatosPanol = function(respuesta) {
    panolData = parsearTablaGViz(respuesta);
    if (panolData.length) renderizarPanol();
};

window.recibirDatosRRHH = function(respuesta) {
    rrhhData = parsearTablaGViz(respuesta);
    if (rrhhData.length) renderizarRRHHSectores();
};

window.recibirDatosCombustible = function(respuesta) {
    combustibleData = parsearTablaGViz(respuesta);
    if (combustibleData.length) renderizarCombustible();
};

window.recibirDatosEquipos = function(respuesta) {
    equiposCriticosData = parsearTablaGViz(respuesta);
    if (equiposCriticosData.length) renderizarEquiposCriticos();
};

function actualizarEstadoConexion(texto, color) {
    const dsLabel = document.getElementById('dataSourceLabel');
    if (!dsLabel) return;
    dsLabel.textContent = texto;
    const estilos = {
        green: "text-xs font-medium px-3 py-1.5 bg-green-900/40 text-green-300 rounded-full border border-green-700",
        amber: "text-xs font-medium px-3 py-1.5 bg-amber-900/40 text-amber-300 rounded-full border border-amber-700",
        red: "text-xs font-medium px-3 py-1.5 bg-red-900/40 text-red-300 rounded-full border border-red-700"
    };
    dsLabel.className = estilos[color] || estilos.amber;
}

// Soporte por si existe carga manual de CSV en el HTML
window.cargarArchivoLocal = function(event) {
    const file = event && event.target && event.target.files[0];
    if (!file || typeof Papa === 'undefined') return;
    Papa.parse(file, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: function(results) {
            if (results.data && results.data.length) {
                rawData = results.data;
                actualizarEstadoConexion("Datos cargados desde CSV local", "green");
                calcularYRenderizarResumen();
            }
        }
    });
};

// ============================================================================
// 2. NAVEGACIÓN DE PESTAÑAS Y UTILIDADES
// ============================================================================

window.openTab = function(tabId, event) {
    document.querySelectorAll('.tab-content').forEach(t => {
        t.classList.add('hidden');
        t.classList.remove('block');
    });
    document.querySelectorAll('.tab-btn').forEach(b => {
        b.classList.remove('active', 'border-cyan-500', 'text-cyan-400');
        b.classList.add('border-transparent', 'text-slate-400');
    });

    const target = document.getElementById(tabId);
    if (target) {
        target.classList.remove('hidden');
        target.classList.add('block');
    }
    if (event && event.currentTarget) {
        event.currentTarget.classList.remove('border-transparent', 'text-slate-400');
        event.currentTarget.classList.add('active', 'border-cyan-500', 'text-cyan-400');
    }
};

function getCleanNumber(val) {
    if (val === null || val === undefined || val === '') return 0;
    if (typeof val === 'number') return isNaN(val) ? 0 : val;
    let s = String(val).trim();
    if (s.includes('.') && s.includes(',')) {
        s = s.replace(/\./g, '').replace(',', '.');
    } else if (s.includes(',')) {
        s = s.replace(',', '.');
    }
    s = s.replace(/[^\d.-]/g, '');
    const num = parseFloat(s);
    return isNaN(num) ? 0 : num;
}

function normalizarTexto(str) {
    return String(str || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
}

function getVal(row, colName) {
    if (!row) return undefined;
    if (row[colName] !== undefined) return row[colName];

    const target = normalizarTexto(colName);
    for (let k of Object.keys(row)) {
        if (normalizarTexto(k) === target) return row[k];
    }

    const aliasMap = {
        'caudal_trat_m1': ['cuadal_trat_m1', 'caudal_m1', 'trat_m1'],
        'caudal_trat_m2': ['cuadal_trat_m2', 'caudal_m2', 'trat_m2'],
        'biosolidos_ton': ['biosolidos_m1', 'lodo_tonelada_'],
        'arenas_ton': ['arenas_m1', 'cant_rsu_m1']
    };

    if (aliasMap[colName]) {
        for (let alt of aliasMap[colName]) {
            for (let k of Object.keys(row)) {
                if (normalizarTexto(k) === normalizarTexto(alt)) return row[k];
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
    const entrada = getCleanNumber(ent);
    const salida = getCleanNumber(sal);
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
// 3. RENDERIZADO PRINCIPAL (RESUMEN, PROCESO, MANTENIMIENTO Y GESTIÓN)
// ============================================================================

function calcularYRenderizarResumen() {
    if (!rawData.length) return;
    const lastRow = rawData[rawData.length - 1];

    if (typeof Chart !== 'undefined') {
        Chart.defaults.color = '#94a3b8';
        Chart.defaults.font.family = 'Inter';
    }

    // --- BLOQUE A: RESUMEN GENERAL (M1, M2, ENERGÍA, TOTALES) ---
    try {
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
        setTexto('m1_kw_m3', volTotalM1 > 0 ? (energiaTotalM1 / volTotalM1).toFixed(3) : '0.000');

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
        setTexto('m2_kw_m3', volTotalM2 > 0 ? (energiaTotalM2 / volTotalM2).toFixed(3) : '0.000');

        // Totales acumulados (usa columna total si existe, sino suma M1 + M2 automáticamente)
        const energiaGlobal = getSum(rawData, 'energia_total') || (energiaTotalM1 + energiaTotalM2);
        const biosolidosGlobal = getSum(rawData, 'biosolidos_ton') || (getSum(rawData, 'biosolidos_ton_m1') + getSum(rawData, 'biosolidos_ton_m2'));
        const rsuGlobal = getSum(rawData, 'cant_rsu_m1') + getSum(rawData, 'cant_rsu_m2');
        const arenasGlobal = getSum(rawData, 'arenas_ton') || rsuGlobal;
        const polimeroGlobal = getSum(rawData, 'polimero_kg');

        setTexto('tot_energia', energiaGlobal.toLocaleString('es-AR'));
        setTexto('tot_biosolidos', biosolidosGlobal.toLocaleString('es-AR'));
        setTexto('tot_arenas', arenasGlobal.toLocaleString('es-AR'));
        setTexto('tot_rsu', rsuGlobal.toLocaleString('es-AR'));
        setTexto('tot_polimero', polimeroGlobal.toLocaleString('es-AR'));

        // RRHH y Mantenimiento en Resumen General
        setTexto('rrhh_total_lbl', getCleanNumber(getVal(lastRow, 'rrhh_total')));
        setTexto('rrhh_admin_lbl', getCleanNumber(getVal(lastRow, 'rrhh_admin')));
        setTexto('rrhh_operativo_lbl', getCleanNumber(getVal(lastRow, 'rrhh_operativo')));
        setTexto('hs_extra_lbl', getSum(rawData, 'hs_extra').toLocaleString('es-AR'));
        setTexto('hs_normales_lbl', getSum(rawData, 'hs_normales').toLocaleString('es-AR'));

        setTexto('mant_prev', getSum(rawData, 'mant_preventivos'));
        setTexto('mant_corr', getSum(rawData, 'mant_correctivos'));
        setTexto('mant_act', getSum(rawData, 'mant_actividades') || getSum(rawData, 'mant_generales'));

        // Gráfico Doughnut Energía por Sectores
        if (cEnergia) cEnergia.destroy();
        const ctxEnergia = document.getElementById('chartEnergiaSectores');
        if (ctxEnergia && typeof Chart !== 'undefined') {
            cEnergia = new Chart(ctxEnergia.getContext('2d'), {
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
                        borderWidth: 2,
                        borderColor: '#1e293b'
                    }]
                },
                options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right' } }, cutout: '65%' }
            });
        }

        // Gráficos Mensuales Generales (si existen los canvas en index.html)
        const resumenMensual = {};
        rawData.forEach(r => {
            const mesKey = getMonthYear(getVal(r, 'fecha'));
            if (!resumenMensual[mesKey]) {
                resumenMensual[mesKey] = { energia: 0, biosolidos: 0, arenas: 0, polimero: 0 };
            }
            const eRow = getCleanNumber(getVal(r, 'energia_total')) || (
                getCleanNumber(getVal(r, 'energia_m1_ts1')) + getCleanNumber(getVal(r, 'energia_m1_ts2')) + getCleanNumber(getVal(r, 'energia_m1_ts3')) +
                getCleanNumber(getVal(r, 'energia_m2_ts1')) + getCleanNumber(getVal(r, 'energia_m2_ts2')) + getCleanNumber(getVal(r, 'energia_m2_ts3'))
            );
            const bRow = getCleanNumber(getVal(r, 'biosolidos_ton')) || (getCleanNumber(getVal(r, 'biosolidos_ton_m1')) + getCleanNumber(getVal(r, 'biosolidos_ton_m2')));
            const aRow = getCleanNumber(getVal(r, 'arenas_ton')) || (getCleanNumber(getVal(r, 'cant_rsu_m1')) + getCleanNumber(getVal(r, 'cant_rsu_m2')));
            resumenMensual[mesKey].energia += eRow;
            resumenMensual[mesKey].biosolidos += bRow;
            resumenMensual[mesKey].arenas += aRow;
            resumenMensual[mesKey].polimero += getCleanNumber(getVal(r, 'polimero_kg'));
        });

        const mesesLabels = Object.keys(resumenMensual);
        const buildMonthlyBar = (canvasId, instanceRef, label, dataArr, colorHex, unit) => {
            if (instanceRef) instanceRef.destroy();
            const ctx = document.getElementById(canvasId);
            if (!ctx || typeof Chart === 'undefined') return null;
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
                                label: ctxItem => `${label}: ${(ctxItem.parsed.y || 0).toLocaleString('es-AR')} ${unit}`
                            }
                        }
                    },
                    scales: { y: { beginAtZero: true } }
                }
            });
        };

        cMensualEnergia = buildMonthlyBar('chartMensualEnergia', cMensualEnergia, 'Energía Total', mesesLabels.map(m => resumenMensual[m].energia), '#facc15', 'kWh');
        cMensualBiosolidos = buildMonthlyBar('chartMensualBiosolidos', cMensualBiosolidos, 'Biosólidos', mesesLabels.map(m => resumenMensual[m].biosolidos), '#d97706', 'Ton');
        cMensualArenas = buildMonthlyBar('chartMensualArenas', cMensualArenas, 'Arenas / RSU', mesesLabels.map(m => resumenMensual[m].arenas), '#fb923c', 'Ton');
        cMensualPolimero = buildMonthlyBar('chartMensualPolimero', cMensualPolimero, 'Polímero', mesesLabels.map(m => resumenMensual[m].polimero), '#818cf8', 'Kg');
    } catch (e) {
        console.error("Error en bloque Resumen General:", e);
    }

    // --- BLOQUE B: PESTAÑA PROCESO ---
    try {
        setTexto('proc_rem_dbo_m1', calcRemocion(getAvg(rawData, 'dbo_ent_m1'), getAvg(rawData, 'dbo_sal_m1')));
        setTexto('proc_rem_dqo_m1', calcRemocion(getAvg(rawData, 'dqo_ent_m1'), getAvg(rawData, 'dqo_sal_m1')));
        setTexto('proc_rem_mes_m1', calcRemocion(getAvg(rawData, 'mes_ent_m1'), getAvg(rawData, 'mes_sal_m1')));
        setTexto('proc_norma_m1', getSum(rawData, 'fuera_norma_m1'));

        setTexto('proc_rem_dbo_m2', calcRemocion(getAvg(rawData, 'dbo_ent_m2'), getAvg(rawData, 'dbo_sal_m2')));
        setTexto('proc_rem_dqo_m2', calcRemocion(getAvg(rawData, 'dqo_ent_m2'), getAvg(rawData, 'dqo_sal_m2')));
        setTexto('proc_rem_mes_m2', calcRemocion(getAvg(rawData, 'mes_ent_m2'), getAvg(rawData, 'mes_sal_m2')));
        setTexto('proc_norma_m2', getSum(rawData, 'fuera_norma_m2'));

        // Biosólidos acumulados
        const tonMsM1 = getSum(rawData, 'ton_ms_m1') || getSum(rawData, 'biosolidos_ton_m1');
        const tonMsM2 = getSum(rawData, 'ton_ms_m2') || getSum(rawData, 'biosolidos_ton_m2');
        setTexto('bio_vol_m1', getSum(rawData, 'biosolidos_m1').toLocaleString('es-AR'));
        setTexto('bio_ms_m1', getAvg(rawData, 'porc_ms_m1'));
        setTexto('bio_ton_m1', tonMsM1.toLocaleString('es-AR'));

        setTexto('bio_vol_m2', getSum(rawData, 'biosolidos_m2').toLocaleString('es-AR'));
        setTexto('bio_ms_m2', getAvg(rawData, 'porc_ms_m2'));
        setTexto('bio_ton_m2', tonMsM2.toLocaleString('es-AR'));

        // Evolución de Caudales
        const fechas = rawData.map(r => getVal(r, 'fecha') || '');
        const caudalesM1 = rawData.map(r => getCleanNumber(getVal(r, 'caudal_trat_m1')));
        const caudalesM2 = rawData.map(r => getCleanNumber(getVal(r, 'caudal_trat_m2')));

        if (cCaudales) cCaudales.destroy();
        const ctxCaudales = document.getElementById('chartCaudalesLine');
        if (ctxCaudales && typeof Chart !== 'undefined') {
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

        // Semáforo normativo (37 días)
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
                    const fechaTxt = String(getVal(d, 'fecha') || 'Sin fecha').replace(/'/g, "\\'");
                    const motivoTxt = String(getVal(d, 'motivo_desvio') || 'Sin motivo registrado').replace(/'/g, "\\'");
                    return `<button onclick="mostrarMotivo('${fechaTxt}', '${motivoTxt}')" class="bg-red-900/40 hover:bg-red-800/80 text-red-300 px-3 py-1.5 rounded-lg border border-red-800 text-sm font-medium shadow-sm transition cursor-pointer">${fechaTxt}</button>`;
                }).join('');
            }
        }

        const firstActiveBtn = document.querySelector('.chart-btn.active');
        updateChartLimites('dbo_ent', firstActiveBtn);
    } catch (e) {
        console.error("Error en bloque Proceso:", e);
    }

    // --- BLOQUE C: PESTAÑA MANTENIMIENTO (CANTIDADES, HORAS, PROMEDIOS Y 24 SECTORES) ---
    try {
        const cantPrev = getSum(rawData, 'mant_preventivos');
        const cantCorr = getSum(rawData, 'mant_correctivos');
        const cantGen = getSum(rawData, 'mant_generales') || getSum(rawData, 'mant_actividades');
        const cantTotal = cantPrev + cantCorr + cantGen;

        const hsPrev = getSum(rawData, 'horas_prev');
        const hsCorr = getSum(rawData, 'horas_corr');
        const hsTareas = getSum(rawData, 'horas_tareas') || getSum(rawData, 'horas_gen');
        const hsTotal = hsPrev + hsCorr + hsTareas;

        setTexto('kpi_mant_prev', cantPrev);
        setTexto('kpi_mant_corr', cantCorr);
        setTexto('kpi_mant_gen', cantGen);
        setTexto('kpi_mant_total', cantTotal);

        setTexto('kpi_horas_prev', hsPrev.toLocaleString('es-AR'));
        setTexto('kpi_horas_corr', hsCorr.toLocaleString('es-AR'));
        setTexto('kpi_horas_tareas', hsTareas.toLocaleString('es-AR'));
        setTexto('kpi_horas_total', hsTotal.toLocaleString('es-AR'));

        setTexto('kpi_prom_prev', cantPrev > 0 ? (hsPrev / cantPrev).toFixed(1) : '0.0');
        setTexto('kpi_prom_corr', cantCorr > 0 ? (hsCorr / cantCorr).toFixed(1) : '0.0');
        setTexto('kpi_prom_tareas', cantGen > 0 ? (hsTareas / cantGen).toFixed(1) : '0.0');

        // Conteo de los 24 sectores (admite columnas directas o columna sectores_intervenidos)
        const conteoSectores = {};
        SECTORES_MAXIMO.forEach(s => { conteoSectores[s.code] = 0; });

        const availableCols = rawData.length > 0 ? Object.keys(rawData[0]) : [];
        SECTORES_MAXIMO.forEach(sec => {
            availableCols.forEach(col => {
                const colNorm = normalizarTexto(col);
                if (colNorm === normalizarTexto(sec.label) || colNorm.startsWith(sec.code + ' ')) {
                    conteoSectores[sec.code] += getSum(rawData, col);
                }
            });
        });

        rawData.forEach(r => {
            const secStr = getVal(r, 'sectores_intervenidos');
            if (secStr && typeof secStr === 'string') {
                secStr.split(',').map(s => s.trim()).filter(Boolean).forEach(item => {
                    const match = identificarSectorMaximo(item);
                    if (match) conteoSectores[match.code] = (conteoSectores[match.code] || 0) + 1;
                });
            }
        });

        if (cSectores) cSectores.destroy();
        const ctxSectores = document.getElementById('chartSectores');
        if (ctxSectores && typeof Chart !== 'undefined') {
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
                        x: { beginAtZero: true, ticks: { precision: 0 }, grid: { color: 'rgba(148, 163, 184, 0.1)' } },
                        y: { ticks: { color: '#cbd5e1', font: { size: 11 } }, grid: { display: false } }
                    }
                }
            });
        }

        // Top 10 Equipos Intervenidos
        const equiposMap = {};
        rawData.forEach(r => {
            const eqStr = getVal(r, 'equipos_intervenidos');
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

        const topEquipos = Object.values(equiposMap).sort((a, b) => b.count - a.count).slice(0, 10);
        const tbody = document.getElementById('tabla_equipos_body');
        if (tbody) {
            if (topEquipos.length === 0) {
                tbody.innerHTML = '<tr><td colspan="4" class="text-center py-6 text-slate-500 italic">No hay registros de equipos intervenidos aún</td></tr>';
            } else {
                tbody.innerHTML = topEquipos.map((eq, idx) => `
                    <tr class="border-b border-slate-700/50 hover:bg-slate-800/50 transition">
                        <td class="py-3 px-4 text-cyan-400 font-medium">#${idx + 1}</td>
                        <td class="py-3 px-4 text-white font-medium">${eq.nombre}</td>
                        <td class="py-3 px-4 text-slate-400 text-sm">${eq.sector}</td>
                        <td class="py-3 px-4 text-amber-400 font-bold text-right">${eq.count}</td>
                    </tr>
                `).join('');
            }
        }
    } catch (e) {
        console.error("Error en bloque Mantenimiento:", e);
    }

    // --- BLOQUE D: COSTOS Y CONTROL DE GESTIÓN DESDE HOJA 1 ---
    try {
        const costoEnergia = getSum(rawData, 'costo_energia_m1_ts1') + getSum(rawData, 'costo_energia_m1_ts2') + getSum(rawData, 'costo_energia_m1_ts3') +
                             getSum(rawData, 'costo_energia_m2_ts1') + getSum(rawData, 'costo_energia_m2_ts2') + getSum(rawData, 'costo_energia_m2_ts3');
        const costoBiosolidos = getSum(rawData, 'costo_biosolidos');
        const costoRsu = getSum(rawData, 'costo_rsu');
        const invObras = getSum(rawData, 'inv_obras');
        const invEquipamiento = getSum(rawData, 'inv_equipamiento');
        const expReparaciones = getSum(rawData, 'exp_reparaciones');

        setTexto('kpi_costo_energia', '$ ' + costoEnergia.toLocaleString('es-AR'));
        setTexto('kpi_costo_biosolidos', '$ ' + costoBiosolidos.toLocaleString('es-AR'));
        setTexto('kpi_costo_rsu', '$ ' + costoRsu.toLocaleString('es-AR'));
        setTexto('kpi_inv_obras', '$ ' + invObras.toLocaleString('es-AR'));
        setTexto('kpi_inv_equipamiento', '$ ' + invEquipamiento.toLocaleString('es-AR'));
        setTexto('kpi_exp_reparaciones', '$ ' + expReparaciones.toLocaleString('es-AR'));
    } catch (e) {
        console.error("Error en bloque Costos:", e);
    }
}

// ============================================================================
// 4. FUNCIONES PARA PESTAÑAS SECUNDARIAS (PAÑOL, RRHH, COMBUSTIBLE, EQUIPOS)
// ============================================================================

function renderizarPanol() {
    try {
        let valorStockTotal = 0;
        let totalSalidas = 0;
        panolData.forEach(r => {
            const valUnit = getCleanNumber(getVal(r, 'valor_unitario'));
            const stock = getCleanNumber(getVal(r, 'stock'));
            const salidas = getCleanNumber(getVal(r, 'salidas'));
            valorStockTotal += valUnit * stock;
            totalSalidas += salidas;
        });
        setTexto('kpi_panol_valor', '$ ' + valorStockTotal.toLocaleString('es-AR'));
        setTexto('kpi_panol_items', panolData.length);
        setTexto('kpi_panol_salidas', totalSalidas.toLocaleString('es-AR'));

        const tbody = document.getElementById('tabla_panol_body');
        if (tbody) {
            tbody.innerHTML = panolData.map(r => `
                <tr class="border-b border-slate-700/50 hover:bg-slate-800/50">
                    <td class="py-2.5 px-4 text-cyan-400 font-mono text-xs">${getVal(r, 'codigo') || '-'}</td>
                    <td class="py-2.5 px-4 text-white">${getVal(r, 'descripcion') || '-'}</td>
                    <td class="py-2.5 px-4 text-right text-slate-300">$ ${getCleanNumber(getVal(r, 'valor_unitario')).toLocaleString('es-AR')}</td>
                    <td class="py-2.5 px-4 text-right font-bold text-emerald-400">${getCleanNumber(getVal(r, 'stock'))}</td>
                    <td class="py-2.5 px-4 text-right text-amber-400">${getCleanNumber(getVal(r, 'salidas'))}</td>
                </tr>
            `).join('');
        }
    } catch (e) {
        console.error("Error al renderizar Pañol:", e);
    }
}

function renderizarRRHHSectores() {
    try {
        setTexto('kpi_rrhh_hs_norm', getSum(rrhhData, 'hs_normales').toLocaleString('es-AR'));
        setTexto('kpi_rrhh_hs_ext', getSum(rrhhData, 'hs_extra').toLocaleString('es-AR'));
        setTexto('kpi_rrhh_plata_norm', '$ ' + getSum(rrhhData, 'plata_hs_normales').toLocaleString('es-AR'));
        setTexto('kpi_rrhh_plata_ext', '$ ' + getSum(rrhhData, 'plata_hs_extra').toLocaleString('es-AR'));
        setTexto('kpi_rrhh_plata_lic', '$ ' + getSum(rrhhData, 'plata_hs_licencia').toLocaleString('es-AR'));
    } catch (e) {
        console.error("Error al renderizar RRHH_Sectores:", e);
    }
}

function renderizarCombustible() {
    try {
        setTexto('kpi_comb_litros', getSum(combustibleData, 'litros').toLocaleString('es-AR') + ' L');
        setTexto('kpi_comb_plata', '$ ' + getSum(combustibleData, 'plata').toLocaleString('es-AR'));
    } catch (e) {
        console.error("Error al renderizar Combustible:", e);
    }
}

function renderizarEquiposCriticos() {
    try {
        const total = equiposCriticosData.length;
        const operativos = equiposCriticosData.filter(r => {
            const est = normalizarTexto(getVal(r, 'eq_estado') || getVal(r, 'estado'));
            return est.includes('operativo') || est.includes('disponible');
        }).length;
        setTexto('kpi_eq_totales', total);
        setTexto('kpi_eq_operativos', operativos);
        setTexto('kpi_eq_fuera', total - operativos);
    } catch (e) {
        console.error("Error al renderizar Equipos_Criticos:", e);
    }
}

// ============================================================================
// 5. MODAL DE DESVÍOS Y GRÁFICO DE LÍMITES LEGALES
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

    if (cLimites) cLimites.destroy();
    const ctx = document.getElementById('chartLimitesLine');
    if (!ctx || typeof Chart === 'undefined') return;

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
