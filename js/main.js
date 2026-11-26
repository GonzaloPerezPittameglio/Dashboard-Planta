const SHEET_ID = "17QH5BKXgwZJexRd34iD4tC_nJckI4HVT1TrK3yGiCOA";

function getSheetUrl(sheetName) {
    return `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}&_t=${Date.now()}`;
}

const SHEETS = {
    PRINCIPAL: "Hoja 1",
    PANOL: "Pañol",
    RRHH: "RRHH_Sectores",
    COMBUSTIBLE: "Combustible",
    EQUIPOS: "Equipos_Criticos"
};

let rawDataPrincipal = [];
let charts = {};

const COORDS_MAPA_PLANTA = [
    { sector: "DESHIDRATACIÓN (M1)", x: 43, y: 24 },
    { sector: "DESHIDRATACIÓN (M2)", x: 49, y: 24 },
    { sector: "CLARIFICADOR A (M1)", x: 63, y: 38 },
    { sector: "SILO DE LODOS", x: 26, y: 22 },
    { sector: "Pretratamiento M1", x: 18, y: 44 },
    { sector: "Pretratamiento M2", x: 23, y: 56 },
    { sector: "Sedimentador Primario M1", x: 35, y: 39 },
    { sector: "Sedimentador Primario M2", x: 38, y: 58 },
    { sector: "Reactor Biológico M1", x: 48, y: 41 },
    { sector: "Reactor Biológico M2", x: 52, y: 62 },
    { sector: "Sedimentador Secundario M2", x: 68, y: 58 },
    { sector: "Cloración / Desinfección", x: 78, y: 48 },
    { sector: "Espesador M1", x: 29, y: 26 },
    { sector: "Espesador M2", x: 34, y: 26 },
    { sector: "Digestor Anaeróbico", x: 20, y: 19 },
    { sector: "Gasómetro M1", x: 14, y: 23 },
    { sector: "Gasómetro M2", x: 14, y: 31 },
    { sector: "Sopladores M1", x: 45, y: 74 },
    { sector: "Sopladores M2", x: 55, y: 74 },
    { sector: "Flotación M1", x: 59, y: 23 },
    { sector: "Flotación M2", x: 64, y: 23 },
    { sector: "Sala de Tableros", x: 72, y: 74 },
    { sector: "Laboratorio M1", x: 84, y: 33 },
    { sector: "Pañol M1", x: 86, y: 65 }
];

// ============================================================================
// UTILIDADES
// ============================================================================
function setText(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
}

function num(val) {
    if (val === null || val === undefined || val === "") return 0;
    if (typeof val === "number") return isNaN(val) ? 0 : val;
    let s = String(val).replace(/\$/g, "").replace(/%/g, "").replace(/\s+/g, "").trim();
    if (s.includes(",") && s.includes(".")) {
        if (s.lastIndexOf(",") > s.lastIndexOf(".")) {
            s = s.replace(/\./g, "").replace(",", ".");
        } else {
            s = s.replace(/,/g, "");
        }
    } else if (s.includes(",")) {
        s = s.replace(",", ".");
    }
    const n = parseFloat(s);
    return isNaN(n) ? 0 : n;
}

function col(row, name) {
    if (!row) return "";
    if (row[name] !== undefined) return row[name];
    const target = String(name).toLowerCase().trim();
    for (const k of Object.keys(row)) {
        if (String(k).toLowerCase().trim() === target) return row[k];
    }
    return "";
}

function sumCol(rows, colName) {
    return rows.reduce((acc, r) => acc + num(col(r, colName)), 0);
}

function avgCol(rows, colName) {
    const valid = rows.map(r => num(col(r, colName))).filter(v => v > 0);
    if (!valid.length) return 0;
    return valid.reduce((a, b) => a + b, 0) / valid.length;
}

function lastNonZero(rows, colName) {
    for (let i = rows.length - 1; i >= 0; i--) {
        const v = num(col(rows[i], colName));
        if (v > 0) return v;
    }
    return 0;
}

function fmtInt(n) {
    return Math.round(n || 0).toLocaleString("es-AR");
}

function fmtDec(n, dec = 1) {
    return (n || 0).toLocaleString("es-AR", {
        minimumFractionDigits: dec,
        maximumFractionDigits: dec
    });
}

function fmtMoney(n) {
    return "$ " + Math.round(n || 0).toLocaleString("es-AR");
}

function getMonthKey(fechaStr) {
    if (!fechaStr) return "Sin fecha";
    const s = String(fechaStr).trim();
    const meses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    const m1 = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
    if (m1) {
        const idx = parseInt(m1[2], 10) - 1;
        const yr = m1[3].slice(-2);
        if (idx >= 0 && idx < 12) return `${meses[idx]} ${yr}`;
    }
    const m2 = s.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
    if (m2) {
        const idx = parseInt(m2[2], 10) - 1;
        const yr = m2[1].slice(-2);
        if (idx >= 0 && idx < 12) return `${meses[idx]} ${yr}`;
    }
    return s;
}

function destroyChart(id) {
    if (charts[id]) {
        charts[id].destroy();
        delete charts[id];
    }
}

function baseOptions() {
    return {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { labels: { color: "#cbd5e1", font: { size: 11 } } }
        },
        scales: {
            x: { ticks: { color: "#94a3b8", font: { size: 11 } }, grid: { color: "#1e293b" } },
            y: { ticks: { color: "#94a3b8", font: { size: 11 } }, grid: { color: "#1e293b" }, beginAtZero: true }
        }
    };
}

// ============================================================================
// PESTAÑAS
// ============================================================================
function openTab(tabId, evt) {
    document.querySelectorAll(".tab-content").forEach(t => {
        t.classList.add("hidden");
        t.classList.remove("block");
    });
    const target = document.getElementById(tabId);
    if (target) {
        target.classList.remove("hidden");
        target.classList.add("block");
    }

    document.querySelectorAll(".tab-btn").forEach(b => {
        b.classList.remove("border-cyan-500", "text-cyan-400");
        b.classList.add("border-transparent", "text-slate-400");
    });
    if (evt && evt.currentTarget) {
        evt.currentTarget.classList.remove("border-transparent", "text-slate-400");
        evt.currentTarget.classList.add("border-cyan-500", "text-cyan-400");
    }

    setTimeout(() => {
        Object.values(charts).forEach(ch => ch && ch.resize());
    }, 50);
}

// ============================================================================
// CARGA DE DATOS
// ============================================================================
function fetchSheet(sheetName) {
    return new Promise((resolve) => {
        Papa.parse(getSheetUrl(sheetName), {
            download: true,
            header: true,
            skipEmptyLines: true,
            complete: (res) => resolve(res.data || []),
            error: () => resolve([])
        });
    });
}

window.onload = async () => {
    if (typeof lucide !== "undefined") lucide.createIcons();
    const label = document.getElementById("dataSourceLabel");

    try {
        const [rowsPrincipal, rowsPanol, rowsRrhh, rowsCombustible, rowsEquipos] = await Promise.all([
            fetchSheet(SHEETS.PRINCIPAL),
            fetchSheet(SHEETS.PANOL),
            fetchSheet(SHEETS.RRHH),
            fetchSheet(SHEETS.COMBUSTIBLE),
            fetchSheet(SHEETS.EQUIPOS)
        ]);

        if (!rowsPrincipal.length) {
            throw new Error("No se pudieron leer registros de Hoja 1");
        }

        rawDataPrincipal = rowsPrincipal;

        renderResumen(rowsPrincipal);
        renderProceso(rowsPrincipal);
        renderFuncionamiento(rowsPrincipal, rowsEquipos);
        renderMantenimiento(rowsPrincipal);
        renderControlYGestion(rowsPrincipal, rowsPanol, rowsRrhh, rowsCombustible);

        if (label) {
            label.textContent = "Datos en vivo (Google Sheets)";
            label.className = "text-xs font-medium px-3 py-1.5 bg-emerald-950/80 text-emerald-400 rounded-full border border-emerald-700/60";
        }
    } catch (e) {
        console.error(e);
        if (label) {
            label.textContent = "Error de conexión con Google Sheets";
            label.className = "text-xs font-medium px-3 py-1.5 bg-red-950/80 text-red-400 rounded-full border border-red-700/60";
        }
    }
};

// ============================================================================
// 1. RESUMEN GENERAL
// ============================================================================
function renderResumen(rows) {
    const m1DboEnt = avgCol(rows, "dbo_ent_m1"), m1DboSal = avgCol(rows, "dbo_sal_m1");
    const m1DqoEnt = avgCol(rows, "dqo_ent_m1"), m1DqoSal = avgCol(rows, "dqo_sal_m1");
    const m1MesEnt = avgCol(rows, "mes_ent_m1"), m1MesSal = avgCol(rows, "mes_sal_m1");

    const m2DboEnt = avgCol(rows, "dbo_ent_m2"), m2DboSal = avgCol(rows, "dbo_sal_m2");
    const m2DqoEnt = avgCol(rows, "dqo_ent_m2"), m2DqoSal = avgCol(rows, "dqo_sal_m2");
    const m2MesEnt = avgCol(rows, "mes_ent_m2"), m2MesSal = avgCol(rows, "mes_sal_m2");

    const qDisM1 = lastNonZero(rows, "caudal_dis_m1") || 0.3;
    const qTratM1 = avgCol(rows, "caudal_trat_m1");
    const qDisM2 = lastNonZero(rows, "caudal_dis_m2") || 0.9;
    const qTratM2 = avgCol(rows, "caudal_trat_m2");

    const eM1Ts1 = sumCol(rows, "energia_m1_ts1");
    const eM1Ts2 = sumCol(rows, "energia_m1_ts2");
    const eM1Ts3 = sumCol(rows, "energia_m1_ts3");
    const eM1 = eM1Ts1 + eM1Ts2 + eM1Ts3;

    const eM2Ts1 = sumCol(rows, "energia_m2_ts1");
    const eM2Ts2 = sumCol(rows, "energia_m2_ts2");
    const eM2Ts3 = sumCol(rows, "energia_m2_ts3");
    const eM2 = eM2Ts1 + eM2Ts2 + eM2Ts3;

    const eTotal = sumCol(rows, "energia_total") || (eM1 + eM2);

    const volM1 = rows.reduce((a, r) => a + (num(col(r, "caudal_trat_m1")) * 86400), 0);
    const volM2 = rows.reduce((a, r) => a + (num(col(r, "caudal_trat_m2")) * 86400), 0);

    setText("m1_dbo_ent", fmtInt(m1DboEnt));
    setText("m1_dbo_sal", fmtInt(m1DboSal));
    setText("m1_dqo_ent", fmtInt(m1DqoEnt));
    setText("m1_dqo_sal", fmtInt(m1DqoSal));
    setText("m1_mes_ent", fmtInt(m1MesEnt));
    setText("m1_mes_sal", fmtInt(m1MesSal));
    setText("m1_caudal_dis", fmtDec(qDisM1, 1));
    setText("m1_caudal_trat", fmtDec(qTratM1, 2));
    setText("m1_energia_val", fmtInt(eM1));
    setText("m1_kw_m3", fmtDec(volM1 > 0 ? eM1 / volM1 : 0, 3));

    setText("m2_dbo_ent", fmtInt(m2DboEnt));
    setText("m2_dbo_sal", fmtInt(m2DboSal));
    setText("m2_dqo_ent", fmtInt(m2DqoEnt));
    setText("m2_dqo_sal", fmtInt(m2DqoSal));
    setText("m2_mes_ent", fmtInt(m2MesEnt));
    setText("m2_mes_sal", fmtInt(m2MesSal));
    setText("m2_caudal_dis", fmtDec(qDisM2, 1));
    setText("m2_caudal_trat", fmtDec(qTratM2, 2));
    setText("m2_energia_val", fmtInt(eM2));
    setText("m2_kw_m3", fmtDec(volM2 > 0 ? eM2 / volM2 : 0, 3));

    const admin = sumCol(rows, "rrhh_admin");
    const oper = sumCol(rows, "rrhh_operativo");
    setText("rrhh_total_lbl", fmtInt(admin + oper));
    setText("rrhh_admin_lbl", fmtInt(admin));
    setText("rrhh_operativo_lbl", fmtInt(oper));
    setText("hs_extra_lbl", fmtInt(sumCol(rows, "hs_extra")));
    setText("hs_normales_lbl", fmtInt(sumCol(rows, "hs_normales")));

    const hsPrev = sumCol(rows, "horas_prev");
    const hsCorr = sumCol(rows, "horas_corr");
    const hsTareas = sumCol(rows, "horas_tareas");
    setText("mant_prev", fmtInt(sumCol(rows, "mant_preventivos")));
    setText("mant_corr", fmtInt(sumCol(rows, "mant_correctivos")));
    setText("mant_act", fmtInt(sumCol(rows, "mant_actividades") + sumCol(rows, "mant_generales")));
    setText("res_hs_prev", fmtInt(hsPrev));
    setText("res_hs_corr", fmtInt(hsCorr));
    setText("res_hs_tareas", fmtInt(hsTareas));
    setText("res_hs_total", fmtInt(hsPrev + hsCorr + hsTareas));

    setText("tot_energia", fmtInt(eTotal));
    setText("tot_biosolidos", fmtInt(sumCol(rows, "biosolidos_ton")));
    setText("tot_arenas", fmtInt(sumCol(rows, "arenas_ton")));
    setText("tot_polimero", fmtInt(sumCol(rows, "polimero_kg")));

    const mensual = {};
    rows.forEach(r => {
        const f = col(r, "fecha");
        if (!f) return;
        const k = getMonthKey(f);
        if (!mensual[k]) mensual[k] = { energia: 0, biosolidos: 0, arenas: 0, polimero: 0 };
        mensual[k].energia += num(col(r, "energia_total"));
        mensual[k].biosolidos += num(col(r, "biosolidos_ton"));
        mensual[k].arenas += num(col(r, "arenas_ton"));
        mensual[k].polimero += num(col(r, "polimero_kg"));
    });

    const mLabels = Object.keys(mensual);
    renderSimpleBar("chartMensualEnergia", mLabels, mLabels.map(k => mensual[k].energia), "Energía (kWh)", "#facc15");
    renderSimpleBar("chartMensualBiosolidos", mLabels, mLabels.map(k => mensual[k].biosolidos), "Biosólidos (Ton)", "#d97706");
    renderSimpleBar("chartMensualArenas", mLabels, mLabels.map(k => mensual[k].arenas), "Arenas (Ton)", "#fb923c");
    renderSimpleBar("chartMensualPolimero", mLabels, mLabels.map(k => mensual[k].polimero), "Polímero (Kg)", "#818cf8");

    destroyChart("chartEnergiaSectores");
    const ctxES = document.getElementById("chartEnergiaSectores");
    if (ctxES) {
        charts["chartEnergiaSectores"] = new Chart(ctxES, {
            type: "bar",
            data: {
                labels: ["M1 - TS1", "M1 - TS2", "M1 - TS3", "M2 - TS1", "M2 - TS2", "M2 - TS3"],
                datasets: [{
                    label: "Energía (kWh)",
                    data: [eM1Ts1, eM1Ts2, eM1Ts3, eM2Ts1, eM2Ts2, eM2Ts3],
                    backgroundColor: ["#22d3ee", "#06b6d4", "#0891b2", "#34d399", "#10b981", "#059669"],
                    borderRadius: 6
                }]
            },
            options: { ...baseOptions(), plugins: { legend: { display: false } } }
        });
    }
}

// ============================================================================
// 2. PROCESO
// ============================================================================
function renderProceso(rows) {
    const calcRem = (ent, sal) => (ent > 0 ? Math.max(0, ((ent - sal) / ent) * 100) : 0);

    setText("proc_rem_dbo_m1", fmtDec(calcRem(avgCol(rows, "dbo_ent_m1"), avgCol(rows, "dbo_sal_m1")), 1));
    setText("proc_rem_dqo_m1", fmtDec(calcRem(avgCol(rows, "dqo_ent_m1"), avgCol(rows, "dqo_sal_m1")), 1));
    setText("proc_rem_mes_m1", fmtDec(calcRem(avgCol(rows, "mes_ent_m1"), avgCol(rows, "mes_sal_m1")), 1));
    setText("proc_norma_m1", fmtInt(sumCol(rows, "fuera_norma_m1")));

    setText("proc_rem_dbo_m2", fmtDec(calcRem(avgCol(rows, "dbo_ent_m2"), avgCol(rows, "dbo_sal_m2")), 1));
    setText("proc_rem_dqo_m2", fmtDec(calcRem(avgCol(rows, "dqo_ent_m2"), avgCol(rows, "dqo_sal_m2")), 1));
    setText("proc_rem_mes_m2", fmtDec(calcRem(avgCol(rows, "mes_ent_m2"), avgCol(rows, "mes_sal_m2")), 1));
    setText("proc_norma_m2", fmtInt(sumCol(rows, "fuera_norma_m2")));

    const volM1 = sumCol(rows, "bio_vol_m1");
    const msM1 = avgCol(rows, "bio_ms_m1");
    const tonM1 = sumCol(rows, "bio_ton_m1") || (volM1 * (msM1 / 100));

    const volM2 = sumCol(rows, "bio_vol_m2");
    const msM2 = avgCol(rows, "bio_ms_m2");
    const tonM2 = sumCol(rows, "bio_ton_m2") || (volM2 * (msM2 / 100));

    setText("bio_vol_m1", fmtInt(volM1));
    setText("bio_ms_m1", fmtDec(msM1, 1));
    setText("bio_ton_m1", fmtDec(tonM1, 1));
    setText("bio_vol_m2", fmtInt(volM2));
    setText("bio_ms_m2", fmtDec(msM2, 1));
    setText("bio_ton_m2", fmtDec(tonM2, 1));

    const rowsF = rows.filter(r => col(r, "fecha") !== "");
    const fLabels = rowsF.map(r => col(r, "fecha"));
    destroyChart("chartCaudalesLine");
    const ctxC = document.getElementById("chartCaudalesLine");
    if (ctxC) {
        charts["chartCaudalesLine"] = new Chart(ctxC, {
            type: "line",
            data: {
                labels: fLabels,
                datasets: [
                    { label: "Caudal M1 (m³/s)", data: rowsF.map(r => num(col(r, "caudal_trat_m1"))), borderColor: "#22d3ee", tension: 0.3 },
                    { label: "Caudal M2 (m³/s)", data: rowsF.map(r => num(col(r, "caudal_trat_m2"))), borderColor: "#34d399", tension: 0.3 }
                ]
            },
            options: baseOptions()
        });
    }

    updateChartLimites("dbo_ent", null);

    const desvios = [];
    rows.forEach(r => {
        const f = col(r, "fecha");
        const fn1 = num(col(r, "fuera_norma_m1"));
        const fn2 = num(col(r, "fuera_norma_m2"));
        const mot = col(r, "motivo_norma") || col(r, "observaciones") || "Desvío registrado en parámetro de vuelco";
        if (fn1 > 0 || fn2 > 0) {
            desvios.push({ fecha: f || "Fecha s/d", motivo: mot });
        }
    });

    const restantes = Math.max(0, 37 - desvios.length);
    setText("dias_restantes_norma", restantes);

    const contFechas = document.getElementById("fechas_fuera_norma");
    if (contFechas) {
        if (!desvios.length) {
            contFechas.innerHTML = `<span class="text-emerald-400 text-xs bg-emerald-950/60 border border-emerald-800 px-3 py-1.5 rounded-full">Sin días fuera de norma registrados</span>`;
        } else {
            contFechas.innerHTML = desvios.map(d => `
                <button type="button" onclick="abrirModalDesvio('${String(d.fecha).replace(/'/g, "")}', '${String(d.motivo).replace(/'/g, "")}')"
                    class="text-xs font-semibold bg-red-950/70 hover:bg-red-900 text-red-300 px-3 py-1.5 rounded-full border border-red-700/60 transition">
                    ${d.fecha}
                </button>
            `).join("");
        }
    }
}

function updateChartLimites(param, btn) {
    if (btn) {
        document.querySelectorAll(".chart-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
    }

    const limites = { dbo_ent: 250, dbo_sal: 50, dqo_sal: 250, mes_sal: 70 };
    const limiteVal = limites[param] || 50;

    const rowsF = rawDataPrincipal.filter(r => col(r, "fecha") !== "");
    const labels = rowsF.map(r => col(r, "fecha"));
    const dataM1 = rowsF.map(r => num(col(r, `${param}_m1`)));
    const dataM2 = rowsF.map(r => num(col(r, `${param}_m2`)));

    destroyChart("chartLimitesLine");
    const ctx = document.getElementById("chartLimitesLine");
    if (!ctx) return;

    charts["chartLimitesLine"] = new Chart(ctx, {
        type: "line",
        data: {
            labels,
            datasets: [
                { label: "Módulo 1", data: dataM1, borderColor: "#22d3ee", tension: 0.3 },
                { label: "Módulo 2", data: dataM2, borderColor: "#34d399", tension: 0.3 },
                {
                    label: `Límite Norma (${limiteVal} mg/L)`,
                    data: labels.map(() => limiteVal),
                    borderColor: "#ef4444",
                    borderDash: [6, 6],
                    pointRadius: 0
                }
            ]
        },
        options: baseOptions()
    });
}

function abrirModalDesvio(fecha, motivo) {
    setText("modalFecha", fecha);
    setText("modalMotivo", motivo);
    const m = document.getElementById("modalDesvio");
    if (m) m.classList.remove("hidden");
}

// ============================================================================
// 3. FUNCIONAMIENTO
// ============================================================================
function renderFuncionamiento(rowsPrincipal, rowsEquipos) {
    setText("func_cant_rsu", fmtInt(sumCol(rowsPrincipal, "cant_rsu")));
    setText("func_cant_ot", fmtInt(sumCol(rowsPrincipal, "cant_ot")));

    const equipos = rowsEquipos.filter(r => col(r, "equipo") !== "");
    setText("total_eq_criticos", `${equipos.length} equipos`);

    const capa = document.getElementById("capa_marcadores_planta");
    if (capa) {
        capa.innerHTML = COORDS_MAPA_PLANTA.map(pt => {
            const match = equipos.find(eq =>
                String(col(eq, "sector_mapa")).toLowerCase().includes(pt.sector.toLowerCase()) ||
                pt.sector.toLowerCase().includes(String(col(eq, "sector_mapa")).toLowerCase())
            );
            let dotColor = "bg-slate-400";
            if (match) {
                const est = String(col(match, "estado"));
                if (/fuera/i.test(est)) dotColor = "bg-red-500 shadow-[0_0_8px_#ef4444]";
                else if (/reparaci/i.test(est)) dotColor = "bg-amber-400 shadow-[0_0_8px_#fbbf24]";
                else dotColor = "bg-emerald-400 shadow-[0_0_8px_#10b981]";
            }
            return `
                <div style="left:${pt.x}%; top:${pt.y}%;" class="absolute -translate-x-1/2 -translate-y-1/2 flex items-center gap-1">
                    <span class="w-2.5 h-2.5 rounded-full ${dotColor} border border-slate-950"></span>
                    <span class="text-[9px] font-semibold text-white bg-slate-900/80 px-1.5 py-0.5 rounded border border-slate-700/80 whitespace-nowrap">${pt.sector}</span>
                </div>
            `;
        }).join("");
    }

    const lista = document.getElementById("lista_equipos_criticos");
    if (lista) {
        if (!equipos.length) {
            lista.innerHTML = `<div class="text-center py-8 text-slate-500 text-sm italic col-span-full">Sin equipos críticos registrados</div>`;
        } else {
            lista.innerHTML = equipos.map(eq => {
                const nombre = col(eq, "equipo");
                const sector = col(eq, "sector_mapa") || "General";
                const estado = col(eq, "estado") || "OPERATIVO";
                const detalle = col(eq, "detalle") || "Sin novedades";
                let badge = "bg-emerald-950 text-emerald-400 border-emerald-800";
                if (/fuera/i.test(estado)) badge = "bg-red-950 text-red-400 border-red-800";
                else if (/reparaci/i.test(estado)) badge = "bg-amber-950 text-amber-400 border-amber-800";

                return `
                    <div class="bg-slate-900 rounded-xl p-4 border border-slate-700 flex flex-col justify-between gap-2">
                        <div class="flex items-start justify-between gap-2">
                            <div>
                                <div class="text-sm font-bold text-white">${nombre}</div>
                                <div class="text-xs text-cyan-400">${sector}</div>
                            </div>
                            <span class="text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${badge}">${estado}</span>
                        </div>
                        <p class="text-xs text-slate-400 border-t border-slate-800 pt-2">${detalle}</p>
                    </div>
                `;
            }).join("");
        }
    }
}

// ============================================================================
// 4. MANTENIMIENTO
// ============================================================================
function renderMantenimiento(rows) {
    const prev = sumCol(rows, "mant_preventivos");
    const corr = sumCol(rows, "mant_correctivos");
    const act = sumCol(rows, "mant_actividades") + sumCol(rows, "mant_generales");
    const tot = prev + corr + act;

    const hsPrev = sumCol(rows, "horas_prev");
    const hsCorr = sumCol(rows, "horas_corr");
    const hsAct = sumCol(rows, "horas_tareas");
    const hsTot = hsPrev + hsCorr + hsAct;

    setText("kpi_mant_total", fmtInt(tot));
    setText("kpi_mant_prev", fmtInt(prev));
    setText("kpi_mant_corr", fmtInt(corr));
    setText("kpi_mant_act", fmtInt(act));

    setText("kpi_horas_total", fmtInt(hsTot));
    setText("kpi_horas_prev", fmtInt(hsPrev));
    setText("kpi_horas_corr", fmtInt(hsCorr));
    setText("kpi_horas_act", fmtInt(hsAct));

    setText("kpi_prom_total", fmtDec(tot > 0 ? hsTot / tot : 0, 2));
    setText("kpi_prom_prev", fmtDec(prev > 0 ? hsPrev / prev : 0, 2));
    setText("kpi_prom_corr", fmtDec(corr > 0 ? hsCorr / corr : 0, 2));
    setText("kpi_prom_act", fmtDec(act > 0 ? hsAct / act : 0, 2));

    const mensual = {};
    rows.forEach(r => {
        const f = col(r, "fecha");
        if (!f) return;
        const k = getMonthKey(f);
        if (!mensual[k]) mensual[k] = { prev: 0, corr: 0, act: 0 };
        mensual[k].prev += num(col(r, "mant_preventivos"));
        mensual[k].corr += num(col(r, "mant_correctivos"));
        mensual[k].act += num(col(r, "mant_actividades")) + num(col(r, "mant_generales"));
    });
    const mLabels = Object.keys(mensual);

    destroyChart("chartMantMensual");
    const ctxMM = document.getElementById("chartMantMensual");
    if (ctxMM) {
        charts["chartMantMensual"] = new Chart(ctxMM, {
            type: "bar",
            data: {
                labels: mLabels,
                datasets: [
                    { label: "Preventivos", data: mLabels.map(k => mensual[k].prev), backgroundColor: "#10b981", borderRadius: 4 },
                    { label: "Correctivos", data: mLabels.map(k => mensual[k].corr), backgroundColor: "#ef4444", borderRadius: 4 },
                    { label: "Actividades", data: mLabels.map(k => mensual[k].act), backgroundColor: "#06b6d4", borderRadius: 4 }
                ]
            },
            options: baseOptions()
        });
    }

    renderDoughnut("chartMantTortas", ["Preventivos", "Correctivos", "Actividades"], [prev, corr, act], ["#10b981", "#ef4444", "#06b6d4"]);
    renderDoughnut(
        "chartCriticidad",
        ["Alto", "Medio", "Bajo"],
        [sumCol(rows, "corr_alto"), sumCol(rows, "corr_medio"), sumCol(rows, "corr_bajo")],
        ["#ef4444", "#f59e0b", "#38bdf8"]
    );

    const ubicM1 = {}, ubicM2 = {}, equiposMap = {};
    rows.forEach(r => {
        const str = String(col(r, "equipos_intervenidos") || "").trim();
        if (!str) return;
        str.split(",").map(s => s.trim()).filter(Boolean).forEach(item => {
            let eq = item, sec = "General";
            const idx = item.indexOf("(");
            if (idx !== -1) {
                eq = item.substring(0, idx).trim();
                sec = item.substring(idx + 1).replace(/\)+$/, "").trim();
            }
            const k = `${eq}|||${sec}`;
            equiposMap[k] = (equiposMap[k] || 0) + 1;

            if (/m2|020/i.test(sec)) ubicM2[sec] = (ubicM2[sec] || 0) + 1;
            else ubicM1[sec] = (ubicM1[sec] || 0) + 1;
        });
    });

    renderHorizontalBar("chartUbicacionesM1", Object.keys(ubicM1), Object.values(ubicM1), "#22d3ee");
    renderHorizontalBar("chartUbicacionesM2", Object.keys(ubicM2), Object.values(ubicM2), "#34d399");

    const top10 = Object.entries(equiposMap).sort((a, b) => b[1] - a[1]).slice(0, 10);
    const tbody = document.getElementById("tabla_equipos_body");
    if (tbody) {
        if (!top10.length) {
            tbody.innerHTML = `<tr><td colspan="4" class="text-center py-6 text-slate-500 italic">Sin intervenciones registradas</td></tr>`;
        } else {
            tbody.innerHTML = top10.map(([k, cant], i) => {
                const [eqName, secName] = k.split("|||");
                return `
                    <tr class="border-b border-slate-700/50 hover:bg-slate-800/60">
                        <td class="py-3 px-4 text-cyan-400 font-bold">#${i + 1}</td>
                        <td class="py-3 px-4 text-white font-medium">${eqName}</td>
                        <td class="py-3 px-4 text-slate-400 text-xs">${secName}</td>
                        <td class="py-3 px-4 text-right text-amber-400 font-bold">${cant}</td>
                    </tr>
                `;
            }).join("");
        }
    }
}

// ============================================================================
// 5. CONTROL Y GESTIÓN
// ============================================================================
function renderControlYGestion(rowsPrincipal, rowsPanol, rowsRrhh, rowsCombustible) {
    const panolValorizado = rowsPanol.reduce((acc, r) => {
        const valTot = num(col(r, "valor_total"));
        if (valTot > 0) return acc + valTot;
        return acc + (num(col(r, "stock")) * num(col(r, "precio_unitario")));
    }, 0);

    const panolMes = {};
    let totItems = 0, totPlata = 0;

    rowsPrincipal.forEach(r => {
        const f = col(r, "fecha");
        const items = num(col(r, "panol_items_consumidos"));
        const plata = num(col(r, "panol_plata_consumida"));
        if (!f && items === 0 && plata === 0) return;
        const k = getMonthKey(f);
        if (!panolMes[k]) panolMes[k] = { items: 0, plata: 0 };
        panolMes[k].items += items;
        panolMes[k].plata += plata;
        totItems += items;
        totPlata += plata;
    });

    setText("gest_panol_valorizado", fmtMoney(panolValorizado));
    setText("gest_panol_items_tot", fmtInt(totItems));
    setText("gest_panol_plata_tot", fmtMoney(totPlata));
    setText("gest_plata_panol_consumo", fmtMoney(totPlata));

    setText("tabla_panol_tot_items", fmtInt(totItems));
    setText("tabla_panol_tot_plata", fmtMoney(totPlata));

    const mPanolLabels = Object.keys(panolMes);

    const tbodyPanolMes = document.getElementById("tabla_panol_mensual");
    if (tbodyPanolMes) {
        if (!mPanolLabels.length) {
            tbodyPanolMes.innerHTML = `<tr><td colspan="3" class="text-center py-6 text-slate-500 italic">Sin consumos registrados</td></tr>`;
        } else {
            tbodyPanolMes.innerHTML = mPanolLabels.map(m => `
                <tr class="border-b border-slate-700/60 hover:bg-slate-900/50">
                    <td class="py-2.5 px-3 text-slate-200 font-medium">${m}</td>
                    <td class="py-2.5 px-3 text-right text-cyan-400 font-semibold">${fmtInt(panolMes[m].items)}</td>
                    <td class="py-2.5 px-3 text-right text-emerald-400 font-semibold">${fmtMoney(panolMes[m].plata)}</td>
                </tr>
            `).join("");
        }
    }

    // Gráfico de Líneas: Consumo Mensual Pañol Ítems vs Consumo Mensual Pañol Plata ($)
    destroyChart("chartPanolItemsVsPlata");
    const ctxPanolLine = document.getElementById("chartPanolItemsVsPlata");
    if (ctxPanolLine) {
        charts["chartPanolItemsVsPlata"] = new Chart(ctxPanolLine, {
            type: "line",
            data: {
                labels: mPanolLabels,
                datasets: [
                    {
                        label: "Consumo Plata ($)",
                        data: mPanolLabels.map(m => panolMes[m].plata),
                        borderColor: "#10b981",
                        backgroundColor: "rgba(16, 185, 129, 0.14)",
                        fill: true,
                        tension: 0.35,
                        borderWidth: 2.5,
                        pointRadius: 4,
                        pointHoverRadius: 6,
                        yAxisID: "y"
                    },
                    {
                        label: "Consumo Ítems (Cant.)",
                        data: mPanolLabels.map(m => panolMes[m].items),
                        borderColor: "#22d3ee",
                        backgroundColor: "rgba(34, 211, 238, 0.10)",
                        fill: false,
                        tension: 0.35,
                        borderWidth: 2.5,
                        pointRadius: 4,
                        pointHoverRadius: 6,
                        yAxisID: "y1"
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: { mode: "index", intersect: false },
                plugins: {
                    legend: { labels: { color: "#cbd5e1", font: { size: 11 } } },
                    tooltip: {
                        callbacks: {
                            label: (ctx) => {
                                const val = ctx.parsed.y || 0;
                                return ctx.dataset.yAxisID === "y"
                                    ? `${ctx.dataset.label}: ${fmtMoney(val)}`
                                    : `${ctx.dataset.label}: ${fmtInt(val)}`;
                            }
                        }
                    }
                },
                scales: {
                    x: { ticks: { color: "#94a3b8", font: { size: 11 } }, grid: { color: "#1e293b" } },
                    y: {
                        type: "linear",
                        position: "left",
                        beginAtZero: true,
                        ticks: { color: "#34d399", font: { size: 11 } },
                        grid: { color: "#1e293b" }
                    },
                    y1: {
                        type: "linear",
                        position: "right",
                        beginAtZero: true,
                        ticks: { color: "#22d3ee", font: { size: 11 } },
                        grid: { drawOnChartArea: false }
                    }
                }
            }
        });
    }

    const itemsPanol = rowsPanol.filter(r => col(r, "codigo") !== "" || col(r, "descripcion") !== "");
    const menosRot = [...itemsPanol].sort((a, b) => num(col(a, "salidas")) - num(col(b, "salidas"))).slice(0, 10);
    const masCaros = [...itemsPanol].sort((a, b) => num(col(b, "precio_unitario")) - num(col(a, "precio_unitario"))).slice(0, 5);

    const tbRot = document.getElementById("tabla_panol_menos_rotacion");
    if (tbRot && menosRot.length) {
        tbRot.innerHTML = menosRot.map((it, i) => `
            <tr class="border-b border-slate-700/60 text-xs">
                <td class="py-2 px-3 text-slate-400">#${i + 1}</td>
                <td class="py-2 px-3 text-cyan-400 font-mono">${col(it, "codigo")}</td>
                <td class="py-2 px-3 text-slate-200">${col(it, "descripcion")}</td>
                <td class="py-2 px-3 text-right text-white font-semibold">${fmtInt(num(col(it, "stock")))}</td>
                <td class="py-2 px-3 text-right text-amber-400 font-semibold">${fmtInt(num(col(it, "salidas")))}</td>
            </tr>
        `).join("");
    }

    const tbCaros = document.getElementById("tabla_panol_mas_caros");
    if (tbCaros && masCaros.length) {
        tbCaros.innerHTML = masCaros.map((it, i) => `
            <tr class="border-b border-slate-700/60 text-xs">
                <td class="py-2 px-3 text-slate-400">#${i + 1}</td>
                <td class="py-2 px-3 text-cyan-400 font-mono">${col(it, "codigo")}</td>
                <td class="py-2 px-3 text-slate-200">${col(it, "descripcion")}</td>
                <td class="py-2 px-3 text-right text-amber-400 font-bold">${fmtMoney(num(col(it, "precio_unitario")))}</td>
            </tr>
        `).join("");
    }

    const hsNormTot = sumCol(rowsPrincipal, "hs_normales");
    const hsExtraTot = sumCol(rowsPrincipal, "hs_extra");
    setText("gest_rrhh_hs_normales_tot", fmtInt(hsNormTot));
    setText("gest_rrhh_hs_extra_tot", fmtInt(hsExtraTot));

    const rrhhMes = {};
    rowsPrincipal.forEach(r => {
        const f = col(r, "fecha");
        if (!f) return;
        const k = getMonthKey(f);
        if (!rrhhMes[k]) rrhhMes[k] = { norm: 0, ext: 0 };
        rrhhMes[k].norm += num(col(r, "hs_normales"));
        rrhhMes[k].ext += num(col(r, "hs_extra"));
    });
    const mRrhhLabels = Object.keys(rrhhMes);
    renderSimpleBar("chartRrhhHsNormalesMensual", mRrhhLabels, mRrhhLabels.map(k => rrhhMes[k].norm), "Hs Normales", "#10b981");
    renderSimpleBar("chartRrhhHsExtraMensual", mRrhhLabels, mRrhhLabels.map(k => rrhhMes[k].ext), "Hs Extra", "#f59e0b");

    const secMap = {};
    rowsRrhh.forEach(r => {
        const s = col(r, "sector");
        if (!s) return;
        if (!secMap[s]) secMap[s] = { norm: 0, ext: 0 };
        secMap[s].norm += num(col(r, "hs_normales"));
        secMap[s].ext += num(col(r, "hs_extra"));
    });
    const secLabels = Object.keys(secMap);
    renderSimpleBar("chartRrhhHsNormalesSector", secLabels, secLabels.map(s => secMap[s].norm), "Hs Normales", "#10b981");
    renderSimpleBar("chartRrhhHsExtraSector", secLabels, secLabels.map(s => secMap[s].ext), "Hs Extra", "#f59e0b");

    const pNorm = sumCol(rowsPrincipal, "plata_hs_normales") || sumCol(rowsRrhh, "plata_hs_normales");
    const pExt = sumCol(rowsPrincipal, "plata_hs_extra") || sumCol(rowsRrhh, "plata_hs_extra");
    const pLic = sumCol(rowsPrincipal, "plata_hs_licencia") || sumCol(rowsRrhh, "plata_hs_licencia");
    setText("gest_plata_rrhh_normales", fmtMoney(pNorm));
    setText("gest_plata_rrhh_extra", fmtMoney(pExt));
    setText("gest_plata_rrhh_licencia", fmtMoney(pLic));
    setText("gest_plata_rrhh_total", fmtMoney(pNorm + pExt + pLic));

    const cM1Ts1 = sumCol(rowsPrincipal, "costo_energia_m1_ts1");
    const cM1Ts2 = sumCol(rowsPrincipal, "costo_energia_m1_ts2");
    const cM1Ts3 = sumCol(rowsPrincipal, "costo_energia_m1_ts3");
    const cM2Ts1 = sumCol(rowsPrincipal, "costo_energia_m2_ts1");
    const cM2Ts2 = sumCol(rowsPrincipal, "costo_energia_m2_ts2");
    const cM2Ts3 = sumCol(rowsPrincipal, "costo_energia_m2_ts3");
    const costoEnergiaTot = sumCol(rowsPrincipal, "costo_energia_total") || (cM1Ts1 + cM1Ts2 + cM1Ts3 + cM2Ts1 + cM2Ts2 + cM2Ts3);
    setText("gest_plata_energia_total", fmtMoney(costoEnergiaTot));

    destroyChart("chartCostoEnergiaSectores");
    const ctxCE = document.getElementById("chartCostoEnergiaSectores");
    if (ctxCE) {
        charts["chartCostoEnergiaSectores"] = new Chart(ctxCE, {
            type: "bar",
            data: {
                labels: ["M1 - TS1", "M1 - TS2", "M1 - TS3", "M2 - TS1", "M2 - TS2", "M2 - TS3"],
                datasets: [{
                    label: "Coste ($)",
                    data: [cM1Ts1, cM1Ts2, cM1Ts3, cM2Ts1, cM2Ts2, cM2Ts3],
                    backgroundColor: "#facc15",
                    borderRadius: 6
                }]
            },
            options: { ...baseOptions(), plugins: { legend: { display: false } } }
        });
    }

    const vehiculos = rowsCombustible.filter(r => col(r, "marca") !== "" || col(r, "modelo") !== "");
    const totLitros = vehiculos.reduce((a, r) => a + num(col(r, "litros")), 0);
    const totPlataComb = vehiculos.reduce((a, r) => a + num(col(r, "plata")), 0);
    setText("gest_litros_combustible_total", `${fmtInt(totLitros)} L`);
    setText("gest_plata_combustible_total", fmtMoney(totPlataComb));

    const tbComb = document.getElementById("tabla_combustible_vehiculos");
    if (tbComb && vehiculos.length) {
        tbComb.innerHTML = vehiculos.map(v => `
            <tr class="border-b border-slate-700/60 text-sm">
                <td class="py-3 px-4 text-white font-semibold">${col(v, "marca")}</td>
                <td class="py-3 px-4 text-slate-300">${col(v, "modelo")}</td>
                <td class="py-3 px-4 text-slate-400">${col(v, "tipo")}</td>
                <td class="py-3 px-4 text-right text-cyan-400 font-semibold">${fmtInt(num(col(v, "litros")))} L</td>
                <td class="py-3 px-4 text-right text-rose-400 font-bold">${fmtMoney(num(col(v, "plata")))}</td>
            </tr>
        `).join("");
    }
}

// ============================================================================
// HELPERS DE GRÁFICOS
// ============================================================================
function renderSimpleBar(id, labels, data, label, color) {
    destroyChart(id);
    const ctx = document.getElementById(id);
    if (!ctx) return;
    charts[id] = new Chart(ctx, {
        type: "bar",
        data: { labels, datasets: [{ label, data, backgroundColor: color, borderRadius: 6 }] },
        options: { ...baseOptions(), plugins: { legend: { display: false } } }
    });
}

function renderHorizontalBar(id, labels, data, color) {
    destroyChart(id);
    const ctx = document.getElementById(id);
    if (!ctx) return;
    charts[id] = new Chart(ctx, {
        type: "bar",
        data: { labels, datasets: [{ label: "Intervenciones", data, backgroundColor: color, borderRadius: 4 }] },
        options: {
            ...baseOptions(),
            indexAxis: "y",
            plugins: { legend: { display: false } },
            scales: {
                x: { beginAtZero: true, ticks: { color: "#94a3b8", precision: 0 }, grid: { color: "#1e293b" } },
                y: { ticks: { color: "#cbd5e1", font: { size: 11 } }, grid: { display: false } }
            }
        }
    });
}

function renderDoughnut(id, labels, data, colors) {
    destroyChart(id);
    const ctx = document.getElementById(id);
    if (!ctx) return;
    charts[id] = new Chart(ctx, {
        type: "doughnut",
        data: { labels, datasets: [{ data, backgroundColor: colors, borderWidth: 0 }] },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: "65%",
            plugins: { legend: { position: "bottom", labels: { color: "#cbd5e1", font: { size: 11 } } } }
        }
    });
}
