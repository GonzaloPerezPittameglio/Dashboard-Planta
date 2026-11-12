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
        // 1. PESTAÑA RESUMEN GENERAL
        // ==============================
        setTexto('m1_dbo_ent', getAvg(rawData, 'dbo_ent_m1'));
        setTexto('m1_dbo_sal', getAvg(rawData, 'dbo_sal_m1'));
        setTexto('m1_dqo_ent', getAvg(rawData, 'dbo_ent_m1')); // fallback
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

        // ==============================
        // 2. PESTAÑA MANTENIMIENTO (SECTORES Y EQUIPOS)
        // ==============================
        const sumGen = getSum(rawData, 'mant_generales');
        const sumPrev = getSum(rawData, 'mant_preventivos');
        const sumCorr = getSum(rawData, 'mant_correctivos');
        
        setTexto('kpi_mant_gen', sumGen);
        setTexto('kpi_mant_total', sumGen + sumPrev + sumCorr);
        setTexto('kpi_horas_prev', getSum(rawData, 'horas_prev'));
        setTexto('kpi_horas_corr', getSum(rawData, 'horas_corr'));

        // A. Lectura de Sectores (Sumando los valores ingresados en cada columna de los 24 sectores)
        const conteoSectores = {};
        SECTORES_MAXIMO.forEach(s => {
            // Busca tanto si la columna se llama "sec_0100", "0100" o con el nombre del sector
            let totalSec = getSum(rawData, `sec_${s.code}`) + 
                           getSum(rawData, s.code) + 
                           getSum(rawData, s.name) + 
                           getSum(rawData, `${s.name} (${s.code})`);
            conteoSectores[s.code] = totalSec;
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

        // B. Lectura Top 10 Equipos
        let equiposMap = {};
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
                    if (!equiposMap[key]) {
                        equiposMap[key] = { nombre, sector, count: 0 };
                    }
                    equiposMap[key].count += 1;
                });
            }
        });

        let topEquipos = Object.values(equiposMap)
            .sort((a,b) => b.count - a.count)
            .slice(0, 10);

        let tbody = document.getElementById('tabla_equipos_body');
        if (tbody) {
            if (topEquipos.length === 0) {
                tbody.innerHTML = '<tr><td colspan="4" class="text-center py-6 text-slate-500 italic">No hay registros de equipos intervenidos aún</td></tr>';
            } else {
                tbody.innerHTML = topEquipos.map((eq, index) => {
                    return `<tr class="border-b border-slate-700/50 hover:bg-slate-800/50 transition">
                                <td class="py-3 px-4 text-cyan-400 font-medium">#${index + 1}</td>
                                <td class="py-3 px-4 text-white font-medium">${eq.nombre}</td>
                                <td class="py-3 px-4 text-slate-400 text-sm">${eq.sector}</td>
                                <td class="py-3 px-4 text-amber-400 font-bold text-right">${eq.count}</td>
                            </tr>`;
                }).join('');
            }
        }

    } catch (e) {
