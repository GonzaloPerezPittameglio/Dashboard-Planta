let rawData = [];
let cEnergia = null;

// LINK DE TU GOOGLE SHEETS EN VIVO
const urlGoogleSheet = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSJbo6XXFqrrJtIxNAwdLhKsIengafF5OZYMc4l9aV3wPvp6retFo159pKfh_9o-QRT2ZziK-ltwYtC/pub?gid=0&single=true&output=csv";

// Iniciar los íconos y cargar los datos
window.onload = () => {
    lucide.createIcons();
    cargarDatosDesdeGoogle();
};

function cargarDatosDesdeGoogle() {
    const dataSourceLabel = document.getElementById('dataSourceLabel');
    if (dataSourceLabel) dataSourceLabel.textContent = "Conectando con Google Sheets...";
    
    Papa.parse(urlGoogleSheet, {
        download: true,
        header: true, 
        dynamicTyping: true, 
        skipEmptyLines: true,
        complete: function(results) {
            if (results.data && results.data.length > 0) {
                rawData = results.data;
                if (dataSourceLabel) dataSourceLabel.textContent = "Datos en vivo (Google Sheets)";
                calcularYRenderizarResumen();
            } else {
                if (dataSourceLabel) dataSourceLabel.textContent = "La planilla está vacía";
            }
        },
        error: function(err) {
            console.error("Error al conectar con la planilla:", err);
            if (dataSourceLabel) dataSourceLabel.textContent = "Error de conexión con la planilla";
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

// Nueva función de promedio (Solo cuenta los días que tienen datos cargados)
function getAvg(arr, col) { 
    const validRows = arr.filter(row => Number(row[col]) > 0);
    if (validRows.length === 0) return 0;
    const sum = validRows.reduce((acc, val) => acc + Number(val[col]), 0);
    return (sum / validRows.length).toFixed(1); 
}

// Nueva función para calcular el % de eficiencia de remoción
function calcRemocion(ent, sal) {
    let entrada = parseFloat(ent);
    let salida = parseFloat(sal);
    if (entrada > 0) {
        return (((entrada - salida) / entrada) * 100).toFixed(1);
    }
    return 0;
}

function calcularYRenderizarResumen() {
    if (!rawData.length) return;
    const lastRow = rawData[rawData.length - 1]; 

    // 1. Promedios M1 (Entrada y Salida)
    document.getElementById('m1_dbo_ent').textContent = getAvg(rawData, 'dbo_ent_m1');
    document.getElementById('m1_dbo_sal').textContent = getAvg(rawData, 'dbo_sal_m1');
    document.getElementById('m1_dqo_ent').textContent = getAvg(rawData, 'dqo_ent_m1');
    document.getElementById('m1_dqo_sal').textContent = getAvg(rawData, 'dqo_sal_m1');
    document.getElementById('m1_mes_ent').textContent = getAvg(rawData, 'mes_ent_m1');
    document.getElementById('m1_mes_sal').textContent = getAvg(rawData, 'mes_sal_m1');
    document.getElementById('m1_norma').textContent = getSum(rawData, 'fuera_norma_m1');

    // 1.B Nuevos datos M1 (Caudal y Energía)
    document.getElementById('m1_caudal_dis').textContent = lastRow['caudal_dis_m1'] || 0;
    document.getElementById('m1_caudal_trat').textContent = lastRow['caudal_trat_m1'] || 0;
    document.getElementById('m1_energia_val').textContent = getSum(rawData, 'energia_m1').toLocaleString('es-AR');

    // 2. Promedios M2 (Entrada y Salida)
    document.getElementById('m2_dbo_ent').textContent = getAvg(rawData, 'dbo_ent_m2');
    document.getElementById('m2_dbo_sal').textContent = getAvg(rawData, 'dbo_sal_m2');
    document.getElementById('m2_dqo_ent').textContent = getAvg(rawData, 'dqo_ent_m2');
    document.getElementById('m2_dqo_sal').textContent = getAvg(rawData, 'dqo_sal_m2');
    document.getElementById('m2_mes_ent').textContent = getAvg(rawData, 'mes_ent_m2');
    document.getElementById('m2_mes_sal').textContent = getAvg(rawData, 'mes_sal_m2');
    document.getElementById('m2_norma').textContent = getSum(rawData, 'fuera_norma_m2');
    
    // 2.B Nuevos datos M2 (Caudal y Energía)
    document.getElementById('m2_caudal_dis').textContent = lastRow['caudal_dis_m2'] || 0;
    document.getElementById('m2_caudal_trat').textContent = lastRow['caudal_trat_m2'] || 0;
    document.getElementById('m2_energia_val').textContent = getSum(rawData, 'energia_m2').toLocaleString('es-AR');

    // 3. Acumulados Mensuales
    document.getElementById('tot_energia').textContent = getSum(rawData, 'energia_total').toLocaleString('es-AR');
    document.getElementById('tot_biosolidos').textContent = getSum(rawData, 'biosolidos_ton').toLocaleString('es-AR');
    document.getElementById('tot_arenas').textContent = getSum(rawData, 'arenas_ton').toLocaleString('es-AR');
    document.getElementById('tot_polimero').textContent = getSum(rawData, 'polimero_kg').toLocaleString('es-AR');

    // 4. Nuevo bloque RRHH
    document.getElementById('rrhh_total_lbl').textContent = lastRow['rrhh_total'] || 0;
    document.getElementById('rrhh_admin_lbl').textContent = lastRow['rrhh_admin'] || 0;
    document.getElementById('rrhh_operativo_lbl').textContent = lastRow['rrhh_operativo'] || 0;
    document.getElementById('hs_extra_lbl').textContent = getSum(rawData, 'hs_extra').toLocaleString('es-AR');
    document.getElementById('hs_normales_lbl').textContent = getSum(rawData, 'hs_normales').toLocaleString('es-AR');

    // 5. Nuevo bloque Mantenimiento Reordenado
    document.getElementById('mant_prev').textContent = getSum(rawData, 'mant_preventivos');
    document.getElementById('mant_corr').textContent = getSum(rawData, 'mant_correctivos');
    document.getElementById('mant_act').textContent = getSum(rawData, 'mant_actividades');

    // === NUEVOS DATOS PESTAÑA PROCESO (Remociones) ===
    
    // Proceso Módulo 1
    let dbo_ent_m1_val = getAvg(rawData, 'dbo_ent_m1');
    let dbo_sal_m1_val = getAvg(rawData, 'dbo_sal_m1');
    let elem_proc_rem_dbo_m1 = document.getElementById('proc_rem_dbo_m1');
    if(elem_proc_rem_dbo_m1) elem_proc_rem_dbo_m1.textContent = calcRemocion(dbo_ent_m1_val, dbo_sal_m1_val);
    
    let dqo_ent_m1_val = getAvg(rawData, 'dqo_ent_m1');
    let dqo_sal_m1_val = getAvg(rawData, 'dqo_sal_m1');
    let elem_proc_rem_dqo_m1 = document.getElementById('proc_rem_dqo_m1');
    if(elem_proc_rem_dqo_m1) elem_proc_rem_dqo_m1.textContent = calcRemocion(dqo_ent_m1_val, dqo_sal_m1_val);
    
    let mes_ent_m1_val = getAvg(rawData, 'mes_ent_m1');
    let mes_sal_m1_val = getAvg(rawData, 'mes_sal_m1');
    let elem_proc_rem_mes_m1 = document.getElementById('proc_rem_mes_m1');
    if(elem_proc_rem_mes_m1) elem_proc_rem_mes_m1.textContent = calcRemocion(mes_ent_m1_val, mes_sal_m1_val);
    
    let elem_proc_norma_m1 = document.getElementById('proc_norma_m1');
    if(elem_proc_norma_m1) elem_proc_norma_m1.textContent = getSum(rawData, 'fuera_norma_m1');

    // Proceso Módulo 2
    let dbo_ent_m2_val = getAvg(rawData, 'dbo_ent_m2');
    let dbo_sal_m2_val = getAvg(rawData, 'dbo_sal_m2');
    let elem_proc_rem_dbo_m2 = document.getElementById('proc_rem_dbo_m2');
    if(elem_proc_rem_dbo_m2) elem_proc_rem_dbo_m2.textContent = calcRemocion(dbo_ent_m2_val, dbo_sal_m2_val);
    
    let dqo_ent_m2_val = getAvg(rawData, 'dqo_ent_m2');
    let dqo_sal_m2_val = getAvg(rawData, 'dqo_sal_m2');
    let elem_proc_rem_dqo_m2 = document.getElementById('proc_rem_dqo_m2');
    if(elem_proc_rem_dqo_m2) elem_proc_rem_dqo_m2.textContent = calcRemocion(dqo_ent_m2_val, dqo_sal_m2_val);
    
    let mes_ent_m2_val = getAvg(rawData, 'mes_ent_m2');
    let mes_sal_m2_val = getAvg(rawData, 'mes_sal_m2');
    let elem_proc_rem_mes_m2 = document.getElementById('proc_rem_mes_m2');
    if(elem_proc_rem_mes_m2) elem_proc_rem_mes_m2.textContent = calcRemocion(mes_ent_m2_val, mes_sal_m2_val);
    
    let elem_proc_norma_m2 = document.getElementById('proc_norma_m2');
    if(elem_proc_norma_m2) elem_proc_norma_m2.textContent = getSum(rawData, 'fuera_norma_m2');

    // 6. Gráfico Energía por Sector
    Chart.defaults.color = '#94a3b8';
    Chart.defaults.font.family = 'Inter';

    if(cEnergia) cEnergia.destroy();
    const e_m1 = getSum(rawData, 'energia_m1');
    const e_m2 = getSum(rawData, 'energia_m2');
    const e_aux = getSum(rawData, 'energia_auxiliares');
    
    cEnergia = new Chart(document.getElementById('chartEnergiaSectores').getContext('2d'), {
        type: 'doughnut',
        data: {
            labels: ['Módulo 1', 'Módulo 2', 'Auxiliares'],
            datasets: [{ 
                data: [e_m1, e_m2, e_aux], 
                backgroundColor: ['#0099DA', '#3be3b0', '#8b5cf6'], 
                borderWidth: 0 
            }]
        },
        options: { 
            responsive: true, 
            maintainAspectRatio: false, 
            plugins: { legend: { position: 'right', labels: { boxWidth: 10 } } }, 
            cutout: '70%' 
        }
    });
}
