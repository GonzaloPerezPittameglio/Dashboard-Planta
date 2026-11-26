let rawData = [];
let equiposCriticosData = [];
let panolData = [];
let rrhhSectoresData = [];
let combustibleData = [];

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

// Gráficos Pestaña Control y Gestión
let cPanolItemsMensual = null;
let cPanolPlataMensual = null;
let cRrhhHsNormalesMensual = null;
let cRrhhHsExtraMensual = null;
let cRrhhHsNormalesSector = null;
let cRrhhHsExtraSector = null;
let cCostoEnergiaSectores = null;

const urlPrimary = "https://docs.google.com/spreadsheets/d/17QH5BKXgwZJexRd34iD4tC_nJckI4HVT1TrK3yGiCOA/gviz/tq?tqx=out:csv";
const urlBackup = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSJbo6XXFqrrJtIxNAwdLhKsIengafF5OZYMc4l9aV3wPvp6retFo159pKfh_9o-QRT2ZziK-ltwYtC/pub?gid=0&single=true&output=csv";
const urlEquiposCriticos = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSJbo6XXFqrrJtIxNAwdLhKsIengafF5OZYMc4l9aV3wPvp6retFo159pKfh_9o-QRT2ZziK-ltwYtC/pub?gid=316369111&single=true&output=csv";

// URLs de las nuevas pestañas de Google Sheets para Control y Gestión (pegar enlaces CSV publicados)
const urlPanol = "";
const urlRrhhSectores = "";
const urlCombustible = "";

const UBICACIONES_PLANTA = [
    // ==========================================
    // ZONA IZQUIERDA (M2 y Digestión)
    // ==========================================
    { nombre: 'Silo de Lodos', top: 10.5, left: 4.5 },
    { nombre: 'Deshidratación M2', top: 22.0, left: 4.3 },
    { nombre: 'Sub Estación Transformadora 3', top: 30.5, left: 4.3 },

    // Caldera (diagonal arriba a la izquierda) y Digestor (diagonal abajo a la derecha)
    { nombre: 'Caldera', top: 17.5, left: 11.8 },
    { nombre: 'Digestor', top: 23.5, left: 13.8 },

    { nombre: 'Gasómetro', top: 8.5, left: 16.0 },
    { nombre: 'Flotador', top: 17.5, left: 19.0 },
    { nombre: 'Espesador', top: 23.5, left: 22.8 },
    { nombre: 'Depósito de Hidrocarburo', top: 15.5, left: 26.8 },
    { nombre: 'Sala de Soplantes M2', top: 71.0, left: 9.8 },

    // Reactores Biológicos M2 (4 celdas de arriba hacia abajo)
    { nombre: 'Reactor 1', top: 53.0, left: 15.5 },
    { nombre: 'Reactor 2', top: 59.5, left: 15.5 },
    { nombre: 'Reactor 3', top: 66.0, left: 15.5 },
    { nombre: 'Reactor 4', top: 72.5, left: 15.5 },

    // Clarificadores M2 y Cámara de Distribución
    { nombre: 'Clarificador 1', top: 49.5, left: 23.2 },
    { nombre: 'Clarificador 2', top: 51.5, left: 29.8 },
    { nombre: 'Cámara de Distribución de Clarificadores', top: 60.5, left: 26.5 },
    { nombre: 'Clarificador 3', top: 69.5, left: 23.2 },
    { nombre: 'Clarificador 4', top: 71.0, left: 29.8 },

    // ==========================================
    // ZONA CENTRAL (M1)
    // ==========================================
    { nombre: 'Deshidratación M1', top: 56.5, left: 39.8 },
    { nombre: 'Grupo Electrogeno', top: 66.5, left: 38.8 },
    { nombre: 'Sala Soplantes M1', top: 73.5, left: 41.2 },

    // Clarificadores M1 (C a la izquierda, B al centro, A a la derecha)
    { nombre: 'Clarificador C', top: 51.5, left: 45.8 },
    { nombre: 'Clarificador B', top: 48.0, left: 50.8 },
    { nombre: 'Clarificador A', top: 52.5, left: 55.8 },

    // Reactores M1 (C a la izquierda, B al centro, A a la derecha)
    { nombre: 'Reactor C', top: 73.5, left: 45.2 },
    { nombre: 'Reactor B', top: 73.5, left: 50.2 },
    { nombre: 'Reactor A', top: 73.5, left: 55.2 },

    { nombre: 'Pretratamiento M1', top: 82.0, left: 61.5 },

    // ==========================================
    // ZONA DERECHA (Pretratamiento General)
    // ==========================================
    { nombre: 'Sedimentador 1', top: 76.5, left: 85.0 },
    { nombre: 'Sedimentador 2', top: 76.5, left: 91.2 },
    { nombre: 'Tratamiento de Grasas', top: 67.0, left: 96.2 },
    { nombre: 'Desarenador', top: 76.0, left: 96.5 },
    { nombre: 'Tratamiento de Arenas', top: 84.5, left: 96.2 },
    { nombre: 'Sub Estación Transformadora 1', top: 91.5, left: 92.5 }
];

window.onload = () => {
    lucide.createIcons();
    renderizarFuncionamientoEquipos();
    cargarDatosDesdeGoogle(urlPrimary);
    cargarEquiposCriticos();
    cargarHojasGestion();
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
                renderizarControlYGestion();
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

function cargarEquiposCriticos() {
    const conCache = urlEquiposCriticos + '&_t=' + Date.now();
    Papa.parse(conCache, {
        download: true,
        header: true,
        dynamicTyping: false,
        skipEmptyLines: true,
        complete: function(results) {
            if (results.data) {
                equiposCriticosData = results.data;
                renderizarFuncionamientoEquipos();
            }
        },
        error: function(err) {
            console.error("Error cargando Equipos Críticos:", err);
        }
    });
}

function cargarHojasGestion() {
    const parseSheet = (url, assignFn) => {
        if (!url || url.trim() === '') {
            renderizarControlYGestion();
            return;
        }
        const conCache = url + (url.includes('?') ? '&' : '?') + '_t=' + Date.now();
        Papa.parse(conCache, {
            download: true,
            header: true,
            dynamicTyping: false,
            skipEmptyLines: true,
            complete: function(results) {
                if (results.data) {
                    assignFn(results.data);
                    renderizarControlYGestion();
                }
            },
            error: function(err) {
                console.error("Error cargando hoja de Control y Gestión:", err);
            }
        });
    };

    parseSheet(urlPanol, data => { panolData = data; });
    parseSheet(urlRrhhSectores, data => { rrhhSectoresData = data; });
    parseSheet(urlCombustible, data => { combustibleData = data; });
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
    let clean = String(val).replace(/\$/g, '').trim();
    // Si tiene punto de miles y coma decimal (ej: 1.250,50)
    if (clean.includes('.') && clean.includes(',')) {
        clean = clean.replace(/\./g, '').replace(',', '.');
    } else if (clean.includes(',')) {
        clean = clean.replace(',', '.');
    }
    clean = clean.replace(/[^\d.-]/g, '').trim();
    let num = parseFloat(clean);
    return isNaN(num) ? 0 : num;
}

function formatPesos(val) {
    const num = getCleanNumber(val);
    return '$ ' + num.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
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

function normalizarTexto(str) {
    return String(str || '').toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]/g, '');
}

function renderizarFuncionamientoEquipos() {
    const equiposCriticos = [];
    const estadoPorSector = {};

    equiposCriticosData.forEach(r => {
        const nombreEq = getVal(r, 'equipo');
        if (nombreEq && String(nombreEq).trim() !== '') {
            const sectorRaw = String(getVal(r, 'sector_mapa') || '').trim();
            const estadoRaw = String(getVal(r, 'estado') || 'Operativo').trim();
            const detalleRaw = String(getVal(r, 'detalle') || '').trim();

            const estLower = estadoRaw.toLowerCase();
            let nivel = 1;
            if (estLower.includes('reparacion') || estLower.includes('reparación')) nivel = 2;
            if (estLower.includes('fuera')) nivel = 3;

            equiposCriticos.push({
                nombre: String(nombreEq).trim(),
                sector: sectorRaw,
                estado: estadoRaw,
                detalle: detalleRaw,
                nivel: nivel
            });

            const secNorm = normalizarTexto(sectorRaw);
            if (secNorm !== '') {
                let ubicacionMatch = UBICACIONES_PLANTA.find(u => normalizarTexto(u.nombre) === secNorm);
                if (!ubicacionMatch) {
                    ubicacionMatch = UBICACIONES_PLANTA.find(u => {
                        const uNorm = normalizarTexto(u.nombre);
                        return uNorm.includes(secNorm) || secNorm.includes(uNorm);
                    });
                }

                if (ubicacionMatch) {
                    const currentMax = estadoPorSector[ubicacionMatch.nombre] || 0;
                    if (nivel > currentMax) {
                        estadoPorSector[ubicacionMatch.nombre] = nivel;
                    }
                }
            }
        }
    });

    const capaMapa = document.getElementById('capa_marcadores_planta');
    if (capaMapa) {
        capaMapa.innerHTML = UBICACIONES_PLANTA.map(u => {
            const nivel = estadoPorSector[u.nombre] || 0;

            let dotClass = 'bg-slate-300 border-slate-950';
            let badgeBorder = 'border-slate-500/90';
            let pingHTML = '';

            if (nivel === 1) {
                dotClass = 'bg-emerald-400 border-slate-950 shadow-[0_0_8px_#10b981]';
                badgeBorder = 'border-emerald-400';
            } else if (nivel === 2) {
                dotClass = 'bg-amber-400 border-slate-950 shadow-[0_0_10px_#fbbf24]';
                badgeBorder = 'border-amber-400';
                pingHTML = `<span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>`;
            } else if (nivel === 3) {
                dotClass = 'bg-red-500 border-slate-950 shadow-[0_0_10px_#ef4444]';
                badgeBorder = 'border-red-500';
                pingHTML = `<span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>`;
            }

            return `
                <div style="top: ${u.top}%; left: ${u.left}%;" 
                     class="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-10">
                    <span class="relative flex h-2.5 w-2.5 mb-0.5">
                        ${pingHTML}
                        <span class="relative inline-flex rounded-full h-2.5 w-2.5 border border-slate-950 ${dotClass}"></span>
                    </span>
                    <span class="bg-slate-950/90 border ${badgeBorder} text-white text-[8px] xl:text-[9px] font-semibold px-1.5 py-0.5 rounded shadow-md whitespace-nowrap leading-none">
                        ${u.nombre}
                    </span>
                </div>
            `;
        }).join('');
    }

    setTexto('total_eq_criticos', `${equiposCriticos.length} equipos`);
    const contEquipos = document.getElementById('lista_equipos_criticos');
    if (contEquipos) {
        if (equiposCriticos.length === 0) {
            contEquipos.innerHTML = '<div class="text-center py-8 text-slate-500 text-sm italic col-span-full">Aún no hay equipos cargados en la hoja Equipos_Criticos.</div>';
        } else {
            contEquipos.innerHTML = equiposCriticos.map(eq => generarTarjetaEquipoHTML(eq)).join('');
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

function renderizarControlYGestion() {
    Chart.defaults.color = '#94a3b8';
    Chart.defaults.font.family = 'Inter';

    try {
        // =========================================================
        // 1. GESTIÓN DE PAÑOL
        // =========================================================
        let valorTotalInventario = 0;
        const itemsPanolLimpios = [];

        panolData.forEach(r => {
            const codigo = String(getVal(r, 'codigo') || '').trim();
            const descripcion = String(getVal(r, 'descripcion') || '').trim();
            if (codigo !== '' || descripcion !== '') {
                const valorUnitario = getCleanNumber(getVal(r, 'valor_unitario'));
                const stock = getCleanNumber(getVal(r, 'stock'));
                const salidas = getCleanNumber(getVal(r, 'salidas') ?? getVal(r, 'consumo_cantidad'));
                const valorFila = getCleanNumber(getVal(r, 'valor_total')) || (valorUnitario * stock);

                valorTotalInventario += valorFila;
                itemsPanolLimpios.push({
                    codigo: codigo || '-',
                    descripcion: descripcion || 'Sin descripción',
                    valorUnitario,
                    stock,
                    salidas
                });
            }
        });

        setTexto('gest_panol_valorizado', formatPesos(valorTotalInventario));

        // Consumos Mensuales de Pañol (leídos desde Hoja 1)
        const panolMensualMap = {};
        let totalItemsConsumidos = 0;
        let totalPlataPanolConsumida = 0;

        rawData.forEach(r => {
            const mes = getMonthYear(getVal(r, 'fecha'));
            const cantItems = getCleanNumber(getVal(r, 'panol_items_consumidos'));
            const plataCons = getCleanNumber(getVal(r, 'panol_plata_consumida'));

            if (!panolMensualMap[mes]) {
                panolMensualMap[mes] = { items: 0, plata: 0 };
            }
            panolMensualMap[mes].items += cantItems;
            panolMensualMap[mes].plata += plataCons;

            totalItemsConsumidos += cantItems;
            totalPlataPanolConsumida += plataCons;
        });

        setTexto('gest_panol_items_tot', totalItemsConsumidos.toLocaleString('es-AR'));
        setTexto('gest_panol_plata_tot', formatPesos(totalPlataPanolConsumida));
        setTexto('gest_plata_panol_consumo', formatPesos(totalPlataPanolConsumida));

        const mesesPanol = Object.keys(panolMensualMap);
        if (cPanolItemsMensual) cPanolItemsMensual.destroy();
        const ctxPanolItems = document.getElementById('chartPanolItemsMensual');
        if (ctxPanolItems) {
            cPanolItemsMensual = new Chart(ctxPanolItems.getContext('2d'), {
                type: 'bar',
                data: {
                    labels: mesesPanol.length ? mesesPanol : ['Sin datos'],
                    datasets: [{
                        label: 'Ítems Consumidos',
                        data: mesesPanol.length ? mesesPanol.map(m => panolMensualMap[m].items) : [0],
                        backgroundColor: '#22d3ee',
                        borderRadius: 6
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: { y: { beginAtZero: true } }
                }
            });
        }

        if (cPanolPlataMensual) cPanolPlataMensual.destroy();
        const ctxPanolPlata = document.getElementById('chartPanolPlataMensual');
        if (ctxPanolPlata) {
            cPanolPlataMensual = new Chart(ctxPanolPlata.getContext('2d'), {
                type: 'bar',
                data: {
                    labels: mesesPanol.length ? mesesPanol : ['Sin datos'],
                    datasets: [{
                        label: 'Plata Consumida ($)',
                        data: mesesPanol.length ? mesesPanol.map(m => panolMensualMap[m].plata) : [0],
                        backgroundColor: '#10b981',
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
                                label: ctx => `Consumo: ${formatPesos(ctx.parsed.y)}`
                            }
                        }
                    },
                    scales: { y: { beginAtZero: true } }
                }
            });
        }

        // Top 10 Ítems con Menos Rotación (orden ascendente por salidas)
        const tbodyMenosRot = document.getElementById('tabla_panol_menos_rotacion');
        if (tbodyMenosRot) {
            if (itemsPanolLimpios.length === 0) {
                tbodyMenosRot.innerHTML = '<tr><td colspan="5" class="text-center py-6 text-slate-500 text-sm italic">Conectá la pestaña Pañol para visualizar los 10 ítems con menor rotación</td></tr>';
            } else {
                const top10Menos = [...itemsPanolLimpios]
                    .sort((a, b) => a.salidas - b.salidas)
                    .slice(0, 10);

                tbodyMenosRot.innerHTML = top10Menos.map((it, idx) => `
                    <tr class="border-b border-slate-700/50 hover:bg-slate-800/60 transition">
                        <td class="py-2.5 px-3 text-sky-400 font-semibold text-xs">#${idx + 1}</td>
                        <td class="py-2.5 px-3 text-slate-300 font-mono text-xs">${it.codigo}</td>
                        <td class="py-2.5 px-3 text-white text-xs font-medium">${it.descripcion}</td>
                        <td class="py-2.5 px-3 text-slate-400 text-xs text-right">${it.stock.toLocaleString('es-AR')}</td>
                        <td class="py-2.5 px-3 text-amber-400 font-bold text-xs text-right">${it.salidas.toLocaleString('es-AR')}</td>
                    </tr>
                `).join('');
            }
        }

        // Top 5 Ítems Más Caros del Pañol (orden descendente por valor unitario)
        const tbodyMasCaros = document.getElementById('tabla_panol_mas_caros');
        if (tbodyMasCaros) {
            if (itemsPanolLimpios.length === 0) {
                tbodyMasCaros.innerHTML = '<tr><td colspan="4" class="text-center py-6 text-slate-500 text-sm italic">Conectá la pestaña Pañol para visualizar los 5 ítems más caros</td></tr>';
            } else {
                const top5Caros = [...itemsPanolLimpios]
                    .sort((a, b) => b.valorUnitario - a.valorUnitario)
                    .slice(0, 5);

                tbodyMasCaros.innerHTML = top5Caros.map((it, idx) => `
                    <tr class="border-b border-slate-700/50 hover:bg-slate-800/60 transition">
                        <td class="py-2.5 px-3 text-amber-400 font-semibold text-xs">#${idx + 1}</td>
                        <td class="py-2.5 px-3 text-slate-300 font-mono text-xs">${it.codigo}</td>
                        <td class="py-2.5 px-3 text-white text-xs font-medium">${it.descripcion}</td>
                        <td class="py-2.5 px-3 text-emerald-400 font-bold text-xs text-right whitespace-nowrap">${formatPesos(it.valorUnitario)}</td>
                    </tr>
                `).join('');
            }
        }

        // =========================================================
        // 2. RECURSOS HUMANOS (HORAS NORMALES Y EXTRA)
        // =========================================================
        const rrhhMensualMap = {};
        const rrhhSectorMap = {};

        // Si existe la pestaña RRHH_Sectores con registros, usamos esa fuente detallada
        const usarFuenteDetalladaRrhh = rrhhSectoresData.length > 0;

        if (usarFuenteDetalladaRrhh) {
            rrhhSectoresData.forEach(r => {
                const mes = getMonthYear(getVal(r, 'fecha'));
                const sector = String(getVal(r, 'sector') || 'General').trim();
                const hsNorm = getCleanNumber(getVal(r, 'hs_normales'));
                const hsExt = getCleanNumber(getVal(r, 'hs_extra'));

                if (!rrhhMensualMap[mes]) rrhhMensualMap[mes] = { normales: 0, extra: 0 };
                rrhhMensualMap[mes].normales += hsNorm;
                rrhhMensualMap[mes].extra += hsExt;

                if (!rrhhSectorMap[sector]) rrhhSectorMap[sector] = { normales: 0, extra: 0 };
                rrhhSectorMap[sector].normales += hsNorm;
                rrhhSectorMap[sector].extra += hsExt;
            });
        } else {
            // Respaldo automático desde Hoja 1 para los totales mensuales de planta
            rawData.forEach(r => {
                const mes = getMonthYear(getVal(r, 'fecha'));
                const hsNorm = getCleanNumber(getVal(r, 'hs_normales'));
                const hsExt = getCleanNumber(getVal(r, 'hs_extra'));

                if (!rrhhMensualMap[mes]) rrhhMensualMap[mes] = { normales: 0, extra: 0 };
                rrhhMensualMap[mes].normales += hsNorm;
                rrhhMensualMap[mes].extra += hsExt;
            });
        }

        const mesesRrhh = Object.keys(rrhhMensualMap);
        const totalHsNormalesPlanta = mesesRrhh.reduce((acc, m) => acc + rrhhMensualMap[m].normales, 0);
        const totalHsExtraPlanta = mesesRrhh.reduce((acc, m) => acc + rrhhMensualMap[m].extra, 0);

        setTexto('gest_rrhh_hs_normales_tot', totalHsNormalesPlanta.toLocaleString('es-AR'));
        setTexto('gest_rrhh_hs_extra_tot', totalHsExtraPlanta.toLocaleString('es-AR'));

        if (cRrhhHsNormalesMensual) cRrhhHsNormalesMensual.destroy();
        const ctxRrhhNormMes = document.getElementById('chartRrhhHsNormalesMensual');
        if (ctxRrhhNormMes) {
            cRrhhHsNormalesMensual = new Chart(ctxRrhhNormMes.getContext('2d'), {
                type: 'bar',
                data: {
                    labels: mesesRrhh.length ? mesesRrhh : ['Sin datos'],
                    datasets: [{
                        label: 'Hs Normales Planta',
                        data: mesesRrhh.length ? mesesRrhh.map(m => rrhhMensualMap[m].normales) : [0],
                        backgroundColor: '#10b981',
                        borderRadius: 6
                    }]
                },
                options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }
            });
        }

        if (cRrhhHsExtraMensual) cRrhhHsExtraMensual.destroy();
        const ctxRrhhExtMes = document.getElementById('chartRrhhHsExtraMensual');
        if (ctxRrhhExtMes) {
            cRrhhHsExtraMensual = new Chart(ctxRrhhExtMes.getContext('2d'), {
                type: 'bar',
                data: {
                    labels: mesesRrhh.length ? mesesRrhh : ['Sin datos'],
                    datasets: [{
                        label: 'Hs Extra Planta',
                        data: mesesRrhh.length ? mesesRrhh.map(m => rrhhMensualMap[m].extra) : [0],
                        backgroundColor: '#f59e0b',
                        borderRadius: 6
                    }]
                },
                options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }
            });
        }

        const sectoresRrhh = Object.keys(rrhhSectorMap);
        if (cRrhhHsNormalesSector) cRrhhHsNormalesSector.destroy();
        const ctxRrhhNormSec = document.getElementById('chartRrhhHsNormalesSector');
        if (ctxRrhhNormSec) {
            cRrhhHsNormalesSector = new Chart(ctxRrhhNormSec.getContext('2d'), {
                type: 'bar',
                data: {
                    labels: sectoresRrhh.length ? sectoresRrhh : ['Cargar pestaña RRHH_Sectores'],
                    datasets: [{
                        label: 'Hs Normales',
                        data: sectoresRrhh.length ? sectoresRrhh.map(s => rrhhSectorMap[s].normales) : [0],
                        backgroundColor: '#34d399',
                        borderRadius: 6
                    }]
                },
                options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { beginAtZero: true } } }
            });
        }

        if (cRrhhHsExtraSector) cRrhhHsExtraSector.destroy();
        const ctxRrhhExtSec = document.getElementById('chartRrhhHsExtraSector');
        if (ctxRrhhExtSec) {
            cRrhhHsExtraSector = new Chart(ctxRrhhExtSec.getContext('2d'), {
                type: 'bar',
                data: {
                    labels: sectoresRrhh.length ? sectoresRrhh : ['Cargar pestaña RRHH_Sectores'],
                    datasets: [{
                        label: 'Hs Extra',
                        data: sectoresRrhh.length ? sectoresRrhh.map(s => rrhhSectorMap[s].extra) : [0],
                        backgroundColor: '#fbbf24',
                        borderRadius: 6
                    }]
                },
                options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { beginAtZero: true } } }
            });
        }

        // =========================================================
        // 3. PLATA CONSUMIDA (RRHH, PAÑOL, ENERGÍA Y COMBUSTIBLE)
        // =========================================================
        // 3.1 Plata RRHH (lee de RRHH_Sectores o de Hoja 1)
        const fuenteRrhhPlata = usarFuenteDetalladaRrhh ? rrhhSectoresData : rawData;
        const plataHsNormales = getSum(fuenteRrhhPlata, 'plata_hs_normales');
        const plataHsExtra = getSum(fuenteRrhhPlata, 'plata_hs_extra');
        const plataHsLicencia = getSum(fuenteRrhhPlata, 'plata_hs_licencia');
        const plataRrhhTotal = plataHsNormales + plataHsExtra + plataHsLicencia;

        setTexto('gest_plata_rrhh_normales', formatPesos(plataHsNormales));
        setTexto('gest_plata_rrhh_extra', formatPesos(plataHsExtra));
        setTexto('gest_plata_rrhh_licencia', formatPesos(plataHsLicencia));
        setTexto('gest_plata_rrhh_total', formatPesos(plataRrhhTotal));

        // 3.2 Coste de Energía Total y por Sector
        const kwhSectores = [
            getSum(rawData, 'energia_m1_ts1'),
            getSum(rawData, 'energia_m1_ts2'),
            getSum(rawData, 'energia_m1_ts3'),
            getSum(rawData, 'energia_m2_ts1'),
            getSum(rawData, 'energia_m2_ts2'),
            getSum(rawData, 'energia_m2_ts3')
        ];
        const sumaKwhSectores = kwhSectores.reduce((a, b) => a + b, 0);

        let costosEnergiaSectores = [
            getSum(rawData, 'costo_energia_m1_ts1'),
            getSum(rawData, 'costo_energia_m1_ts2'),
            getSum(rawData, 'costo_energia_m1_ts3'),
            getSum(rawData, 'costo_energia_m2_ts1'),
            getSum(rawData, 'costo_energia_m2_ts2'),
            getSum(rawData, 'costo_energia_m2_ts3')
        ];

        const sumaCostosDirectos = costosEnergiaSectores.reduce((a, b) => a + b, 0);
        const costoEnergiaTotalHoja = getSum(rawData, 'costo_energia_total');
        let costoEnergiaFinal = sumaCostosDirectos > 0 ? sumaCostosDirectos : costoEnergiaTotalHoja;

        // Si se cargó el coste total de energía pero no por sector, se prorratea automáticamente según los kWh de cada sector
        if (sumaCostosDirectos === 0 && costoEnergiaTotalHoja > 0 && sumaKwhSectores > 0) {
            costosEnergiaSectores = kwhSectores.map(kwh => (kwh / sumaKwhSectores) * costoEnergiaTotalHoja);
        }

        setTexto('gest_plata_energia_total', formatPesos(costoEnergiaFinal));

        if (cCostoEnergiaSectores) cCostoEnergiaSectores.destroy();
        const ctxCostoEn = document.getElementById('chartCostoEnergiaSectores');
        if (ctxCostoEn) {
            cCostoEnergiaSectores = new Chart(ctxCostoEn.getContext('2d'), {
                type: 'doughnut',
                data: {
                    labels: [
                        'M1 - TS1',
                        'M1 - TS2',
                        'M1 - TS3',
                        'M2 - TS1 - Pretratamiento',
                        'M2 - TS2 - Tratamiento Biológico',
                        'M2 - TS3 - Línea de Lodos'
                    ],
                    datasets: [{
                        data: costosEnergiaSectores,
                        backgroundColor: ['#0284c7', '#0ea5e9', '#38bdf8', '#059669', '#10b981', '#34d399'],
                        borderWidth: 2,
                        borderColor: '#1e293b'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: '62%',
                    plugins: {
                        legend: { position: 'right' },
                        tooltip: {
                            callbacks: {
                                label: ctx => ` ${ctx.label}: ${formatPesos(ctx.parsed)}`
                            }
                        }
                    }
                }
            });
        }

        // 3.3 Combustible de Vehículos (Marca, Modelo, Tipo de Vehículo, Litros y Plata)
        const vehiculosAgrupados = {};
        let totalLitrosComb = 0;
        let totalPlataComb = 0;

        combustibleData.forEach(r => {
            const marca = String(getVal(r, 'marca') || '').trim();
            const modelo = String(getVal(r, 'modelo') || '').trim();
            const tipo = String(getVal(r, 'tipo_vehiculo') || getVal(r, 'tipo') || '').trim();
            const litros = getCleanNumber(getVal(r, 'litros'));
            const plata = getCleanNumber(getVal(r, 'plata') ?? getVal(r, 'costo'));

            if (marca !== '' || modelo !== '' || litros > 0 || plata > 0) {
                const key = `${marca}||${modelo}||${tipo}`;
                if (!vehiculosAgrupados[key]) {
                    vehiculosAgrupados[key] = {
                        marca: marca || '-',
                        modelo: modelo || '-',
                        tipo: tipo || '-',
                        litros: 0,
                        plata: 0
                    };
                }
                vehiculosAgrupados[key].litros += litros;
                vehiculosAgrupados[key].plata += plata;

                totalLitrosComb += litros;
                totalPlataComb += plata;
            }
        });

        setTexto('gest_litros_combustible_total', `${totalLitrosComb.toLocaleString('es-AR')} L`);
        setTexto('gest_plata_combustible_total', formatPesos(totalPlataComb));

        const tbodyComb = document.getElementById('tabla_combustible_vehiculos');
        if (tbodyComb) {
            const listaVehiculos = Object.values(vehiculosAgrupados).sort((a, b) => b.plata - a.plata);
            if (listaVehiculos.length === 0) {
                tbodyComb.innerHTML = '<tr><td colspan="5" class="text-center py-6 text-slate-500 text-sm italic">Conectá la pestaña Combustible para visualizar el detalle de flota</td></tr>';
            } else {
                tbodyComb.innerHTML = listaVehiculos.map(v => `
                    <tr class="border-b border-slate-700/50 hover:bg-slate-800/50 transition">
                        <td class="py-3 px-4 text-white font-semibold text-sm">${v.marca}</td>
                        <td class="py-3 px-4 text-slate-200 text-sm">${v.modelo}</td>
                        <td class="py-3 px-4">
                            <span class="px-2.5 py-1 rounded-full text-xs bg-slate-900 text-cyan-300 border border-slate-700">${v.tipo}</span>
                        </td>
                        <td class="py-3 px-4 text-slate-300 text-sm text-right">${v.litros.toLocaleString('es-AR')} L</td>
                        <td class="py-3 px-4 text-rose-400 font-bold text-sm text-right">${formatPesos(v.plata)}</td>
                    </tr>
                `).join('');
            }
        }

    } catch (e) {
        console.error("Error al renderizar Control y Gestión:", e);
    }
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

        // Cantidades y Horas generales
        const countPrev = getSum(rawData, 'mant_preventivos');
        const countCorr = getSum(rawData, 'mant_correctivos');
        const countAct = getSum(rawData, 'mant_actividades');

        const hsPrev = getSum(rawData, 'horas_prev');
        const hsCorr = getSum(rawData, 'horas_corr');
        const hsTareas = getSum(rawData, 'horas_tareas');
        const hsTotal = hsPrev + hsCorr + hsTareas;

        setTexto('mant_prev', countPrev);
        setTexto('mant_corr', countCorr);
        setTexto('mant_act', countAct);
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
        setTexto('kpi_mant_total', countPrev + countCorr + countAct);
        setTexto('kpi_mant_prev', countPrev);
        setTexto('kpi_mant_corr', countCorr);
        setTexto('kpi_mant_act', countAct);

        setTexto('kpi_horas_total', hsTotal);
        setTexto('kpi_horas_prev', hsPrev);
        setTexto('kpi_horas_corr', hsCorr);
        setTexto('kpi_horas_act', hsTareas);

        const countTotal = countPrev + countCorr + countAct;
        const promTotal = countTotal > 0 ? (hsTotal / countTotal).toFixed(1) : 0;
        const promPrev = countPrev > 0 ? (hsPrev / countPrev).toFixed(1) : 0;
        const promCorr = countCorr > 0 ? (hsCorr / countCorr).toFixed(1) : 0;
        const promAct = countAct > 0 ? (hsTareas / countAct).toFixed(1) : 0;

        setTexto('kpi_prom_total', promTotal);
        setTexto('kpi_prom_prev', promPrev);
        setTexto('kpi_prom_corr', promCorr);
        setTexto('kpi_prom_act', promAct);

        const monthlyGroups = {};
        rawData.forEach(r => {
            const monthStr = getMonthYear(getVal(r, 'fecha'));
            if (!monthlyGroups[monthStr]) monthlyGroups[monthStr] = { prev: 0, corr: 0, act: 0 };
            monthlyGroups[monthStr].prev += getCleanNumber(getVal(r, 'mant_preventivos'));
            monthlyGroups[monthStr].corr += getCleanNumber(getVal(r, 'mant_correctivos'));
            monthlyGroups[monthStr].act += getCleanNumber(getVal(r, 'mant_actividades'));
        });

        const labelsMensual = Object.keys(monthlyGroups);
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

        // ==============================
        // 4. PESTAÑA FUNCIONAMIENTO (KPIs Hoja 1)
        // ==============================
        setTexto('func_cant_rsu', getSum(rawData, 'cant_rsu').toLocaleString('es-AR'));
        setTexto('func_cant_ot', getSum(rawData, 'cant_ot').toLocaleString('es-AR'));

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


