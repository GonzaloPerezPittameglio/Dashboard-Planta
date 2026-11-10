let rawData = [];
let cEnergia = null;
let cCaudales = null;
let cLimites = null;

// LINK DE GOOGLE SHEETS EN VIVO
const urlGoogleSheet = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSJbo6XXFqrrJtIxNAwdLhKsIengafF5OZYMc4l9aV3wPvp6retFo159pKfh_9o-QRT2ZziK-ltwYtC/pub?gid=0&single=true&output=csv";

window.onload = () => {
    lucide.createIcons();
    cargarDatosDesdeGoogle();
};

function cargarDatosDesdeGoogle() {
    const dsLabel = document.getElementById('dataSourceLabel');
    if (dsLabel) dsLabel.textContent = "Conectando con Google Sheets...";
    
    Papa.parse(urlGoogleSheet, {
        download: true,
        header: true, 
        dynamicTyping: true, 
        skipEmptyLines: true,
        complete: function(results) {
            if (results.data && results.data.length > 0) {
                rawData = results.data;
                if (dsLabel) dsLabel.textContent = "Datos en vivo (Google Sheets)";
                calcularYRenderizarResumen();
            }
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

function getSum(arr, col) { 
    return arr.reduce((acc, val) => acc + (Number(val[col]) || 0), 0); 
}

function getAvg(arr, col) { 
    const validRows = arr.filter(row => Number(row[col]) > 0);
    if (validRows.length === 0) return 0;
    const sum = validRows.reduce((acc, val) => acc + Number(val[col]), 0);
    return (sum / validRows.length).toFixed(1); 
}

function calcRemocion(ent, sal) {
    let entrada = parseFloat(ent);
    let salida = parseFloat(sal);
    if (entrada > 0) return (((entrada - salida) / entrada) * 100).toFixed(1);
    return 0;
}

function calcularYRenderizarResumen() {
    if (!rawData.length) return;
    const lastRow = rawData[rawData.length - 1]; 
    Chart.defaults.color = '#94a3b8';
    Chart.defaults.font.family = 'Inter';

    // === PESTAÑA 1: RESUMEN GENERAL ===
    document.getElementById('m1_dbo_ent').textContent = getAvg(rawData, 'dbo_ent_m1');
    document.getElementById('m1_dbo_sal').textContent = getAvg(rawData, 'dbo_sal_m1');
    document.getElementById('m1_dqo_ent').textContent = getAvg(rawData, 'dqo_ent_m1');
    document.getElementById('m1_dqo_sal').textContent = getAvg(rawData, 'dqo_sal_m1');
    document.getElementById('m1_mes_ent').textContent = getAvg(rawData, 'mes_ent_m1');
    document.getElementById('m1_mes_sal').textContent = getAvg(rawData, 'mes_sal_m1');
    
    document.getElementById('m1_caudal_dis').textContent = lastRow['caudal_dis_m1'] || 0.3;
    document.getElementById('m1_caudal_trat').textContent = lastRow['caudal_trat_m1'] || 0;
    
    const energiaTotalM1 = getSum(rawData, 'energia_m1_ts1') + getSum(rawData, 'energia_m1_ts2') + getSum(rawData, 'energia_m1_ts3');
    document.getElementById('m1_energia_val').textContent = energiaTotalM1.toLocaleString('es-AR');

    document.getElementById('m2_dbo_ent').textContent = getAvg(rawData, 'dbo_ent_m2');
    document.getElementById('m2_dbo_sal').textContent = getAvg(rawData, 'dbo_sal_m2');
    document.getElementById('m2_dqo_ent').textContent = getAvg(rawData, 'dqo_ent_m2');
    document.getElementById('m2_dqo_sal').textContent = getAvg(rawData, 'dqo_sal_m2');
    document.getElementById('m2_mes_ent').textContent = getAvg(rawData, 'mes_ent_m2');
    document.getElementById('m2_mes_sal').textContent = getAvg(rawData, 'mes_sal_m2');

    document.getElementById('m2_caudal_dis').textContent = lastRow['caudal_dis_m2'] || 0.9;
    document.getElementById('m2_caudal_trat').textContent = lastRow['caudal_trat_m2'] || 0;
    
    const energiaTotalM2 = getSum(rawData, 'energia_m2_ts1') + getSum(rawData, 'energia_m2_ts2') + getSum(rawData, 'energia_m2_ts3');
    document.getElementById('m2_energia_val').textContent = energiaTotalM2.toLocaleString('es-AR');

    // TOTALES GENERALES 
    document.getElementById('tot_energia').textContent = getSum(rawData, 'energia_total').toLocaleString('es-AR');
    document.getElementById('tot_biosolidos').textContent = getSum(rawData, 'biosolidos_ton').toLocaleString('es-AR');
    document.getElementById('tot_arenas').textContent = getSum(rawData, 'arenas_ton').toLocaleString('es-AR');
    document.getElementById('tot_polimero').textContent = getSum(rawData, 'polimero_kg').toLocaleString('es-AR');

    // RRHH
    document.getElementById('rrhh_total_lbl').textContent = lastRow['rrhh_total'] || 0;
    document.getElementById('rrhh_admin_lbl').textContent = lastRow['rrhh_admin'] || 0;
    document.getElementById('rrhh_operativo_lbl').textContent = lastRow['rrhh_operativo'] || 0;
    document.getElementById('hs_extra_lbl').textContent = getSum(rawData, 'hs_extra').toLocaleString('es-AR');
    document.getElementById('hs_normales_lbl').textContent = getSum(rawData, 'hs_normales').toLocaleString('es-AR');

    // MANTENIMIENTO
    document.getElementById('mant_prev').textContent = getSum(rawData, 'mant_preventivos');
    document.getElementById('mant_corr').textContent = getSum(rawData, 'mant_correctivos');
    document.getElementById('mant_act').textContent = getSum(rawData, 'mant_actividades');

    //GRAFICO DE ENERGIA TOTAL TS1 TS2 TS3 (M1 y M2) 
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
                backgroundColor: [
                    '#0284c7', '#0ea5e9', '#38bdf8', 
                    '#059669', '#10b981', '#34d399'  
                ], 
                borderWidth: 2, 
                borderColor: '#1e293b' 
            }]
        },
        options: { 
            responsive: true, maintainAspectRatio: false, 
            plugins: { legend: { position: 'right', labels: { boxWidth: 12, color: '#94a3b8', padding: 15
