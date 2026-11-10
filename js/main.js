let rawData = [];
let cEnergia = null;

// Enlace oficial de tu Google Sheets en formato CSV
const urlGoogleSheet = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSJbo6XXFqrrJtIxNAwdLhKsIengafF5OZYMc4l9aV3wPvp6retFo159pKfh_9o-QRT2ZziK-ltwYtC/pub?output=csv";

window.onload = () => {
    try {
        if (typeof lucide !== 'undefined') lucide.createIcons();
    } catch(e) { console.error(e); }
    cargarDatosDesdeGoogle();
};

function cargarDatosDesdeGoogle() {
    const dsLabel = document.getElementById('dataSourceLabel');
    if (dsLabel) dsLabel.textContent = "Conectando con Google Sheets...";
    
    const conCache = urlGoogleSheet + (urlGoogleSheet.includes('?') ? '&' : '?') + '_t=' + Date.now();

    Papa.parse(conCache, {
        download: true,
        header: true, 
        dynamicTyping: true, 
        skipEmptyLines: true,
        complete: function(results) {
            if (results.data && results.data.length > 0) {
                rawData = results.data;
                if (dsLabel) {
                    dsLabel.textContent = "¡Conectado! (" + rawData.length + " filas)";
                    dsLabel.className = "text-xs font-medium px-3 py-1.5 bg-green-900/50 text-green-300 rounded-full border border-green-700";
                }
                calcularYRenderizarResumen();
            } else {
                if (dsLabel) dsLabel.textContent = "Error: Planilla vacía o sin filas";
            }
        },
        error: function(err) {
            console.error("Error PapaParse:", err);
            if (dsLabel) {
                dsLabel.textContent = "Error de red/permisos en Google Sheets";
                dsLabel.className = "text-xs font-medium px-3 py-1.5 bg-red-900/50 text-red-300 rounded-full border border-red-700";
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

function setTexto(id, valor) {
    const el = document.getElementById(id);
    if (el) el.textContent = valor;
}

function calcularYRenderizarResumen() {
    if (!rawData.length) return;
    const lastRow = rawData[rawData.length - 1]; 

    try {
        setTexto('m1_dbo_ent', getAvg(rawData, 'dbo_ent_m1'));
        setTexto('m1_dbo_sal', getAvg(rawData, 'dbo_sal_m1'));
        setTexto('m1_dqo_ent', getAvg(rawData, 'dqo_ent_m1'));
        setTexto('m1_dqo_sal', getAvg(rawData, 'dqo_sal_m1'));
        setTexto('m1_mes_ent', getAvg(rawData, 'mes_ent_m1'));
        setTexto('m1_mes_sal', getAvg(rawData, 'mes_sal_m1'));

        setTexto('m2_dbo_ent', getAvg(rawData, 'dbo_ent_m2'));
        setTexto('m2_dbo_sal', getAvg(rawData, 'dbo_sal_m2'));
        setTexto('m2_dqo_ent', getAvg(rawData, 'dqo_ent_m2'));
        setTexto('m2_dqo_sal', getAvg(rawData, 'dqo_sal_m2'));
        setTexto('m2_mes_ent', getAvg(rawData, 'mes_ent_m2'));
        setTexto('m2_mes_sal', getAvg(rawData, 'mes_sal_m2'));

        setTexto('tot_energia', getSum(rawData, 'energia_total').toLocaleString('es-AR'));
        setTexto('tot_biosolidos', getSum(rawData, 'biosolidos_ton').toLocaleString('es-AR'));
        setTexto('tot_arenas', getSum(rawData, 'arenas_ton').toLocaleString('es-AR'));
        setTexto('tot_polimero', getSum(rawData, 'polimero_kg').toLocaleString('es-AR'));

        // Gráfico energía
        const ctx = document.getElementById('chartEnergiaSectores');
        if (ctx) {
            if (cEnergia) cEnergia.destroy();
            cEnergia = new Chart(ctx.getContext('2d'), {
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
                        backgroundColor: ['#0284c7', '#0ea5e9', '#38bdf8', '#059669', '#10b981', '#34d399'] 
                    }]
                },
                options: { responsive: true, maintainAspectRatio: false }
            });
        }

        // Semáforo
        const diasFuera = rawData.filter(r => {
            const fn1 = getCleanNumber(getVal(r, 'fuera_norma_m1'));
            const fn2 = getCleanNumber(getVal(r, 'fuera_norma_m2'));
            const motivo = getVal(r, 'motivo_desvio');
            return fn1 > 0 || fn2 > 0 || (motivo && String(motivo).trim() !== '');
        });
        
        const diasRestantes = 37 - diasFuera.length;
        setTexto('dias_restantes_norma', diasRestantes);

        const divFechas = document.getElementById('fechas_fuera_norma');
        if (divFechas) {
            if (diasFuera.length === 0) {
                divFechas.innerHTML = '<span class="text-green-400 text-sm">Planta 100% en norma.</span>';
            } else {
                divFechas.innerHTML = diasFuera.map(d => {
                    const fechaTxt = getVal(d, 'fecha') || 'Sin fecha';
                    const motivoTxt = String(getVal(d, 'motivo_desvio') || 'Sin motivo').replace(/'/g, "\\'"); 
                    return `<button onclick="mostrarMotivo('${fechaTxt}', '${motivoTxt}')" class="bg-red-900/40 hover:bg-red-800 text-red-300 px-3 py-1 rounded text-sm">${fechaTxt}</button>`;
                }).join('');
            }
        }
    } catch (e) {
        console.error("Error en render:", e);
    }
}

window.mostrarMotivo = function(fecha, motivo) {
    setTexto('modalFecha', 'Desvío: ' + fecha);
    setTexto('modalMotivo', motivo);
    document.getElementById('modalDesvio').classList.remove('hidden');
};
