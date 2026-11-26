// ============================================================================
// CONEXIÓN DIRECTA A TU PLANILLA "Base_Datos_AySA"
// ============================================================================
const SHEET_ID = "17QH5BKXgwZJexRd34iD4tC_nJckI4HVT1TrK3yGiCOA";

function getSheetUrl(sheetName) {
    return `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}&_t=${Date.now()}`;
}

// Nombres exactos de las pestañas de tu Google Sheets
const SHEETS = {
    PRINCIPAL: "Hoja 1",
    EQUIPOS: "Equipos_Criticos",
    PANOL: "Pañol",
    RRHH: "RRHH_Sectores",
    COMBUSTIBLE: "Combustible"
};

// ============================================================================
// VARIABLES GLOBALES Y COORDENADAS DEL MAPA AÉREO
// ============================================================================
let chartsInstances = {};
let globalEquiposCriticos = [];

// Coordenadas porcentuales sobre mapa-planta.jpg para los sectores de Equipos_Criticos y Planta
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
// FUNCIONES AUXILIARES DE LECTURA Y FORMATO
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

function col(row, exactName) {
    if (!row) return "";
    if (row[exactName] !== undefined) return row[exactName];
    const target = exactName.toLowerCase().trim();
    for (const k of Object.keys(row)) {
        if (k.toLowerCase().trim() === target) return row[k];
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
    if (chartsInstances[id]) {
        chartsInstances[id].destroy();
        delete chartsInstances[id];
    }
}

// ============================================================================
// NAVEGACIÓN DE PESTAÑAS
// ============================================================================
function openTab(tabId, evt) {
    document.querySelectorAll(".tab-content").forEach(el => {
        el.classList.add("hidden");
        el.classList.remove("block");
    });
    const target = document.getElementById(tabId);
    if (target) {
        target.classList.remove("hidden");
        target.classList.add("block");
    }

    document.querySelectorAll(".tab-btn").forEach(btn => {
        btn.classList.remove("border-cyan-500", "text-cyan-400");
        btn.classList.add("border-transparent", "text-slate-400");
    });
    if (evt && evt.currentTarget) {
        evt.currentTarget.classList.remove("border-transparent", "text-slate-400");
        evt.currentTarget.classList.add("border-cyan-500", "text-cyan-400");
    }

    setTimeout(() => {
        Object.values(chartsInstances).forEach(ch => ch && ch.resize());
    }, 50);
}

// ============================================================================
// DESCARGA DE CSV DESDE GOOGLE SHEETS
// ============================================================================
function fetchSheetCSV(sheetName) {
    return new Promise((resolve) => {
        Papa.parse(getSheetUrl(sheetName), {
            download: true,
            header: true,
            skipEmptyLines: true,
            complete: (res) => resolve(res.data || []),
            error: (err) => {
                console.warn(`Error leyendo pestaña "${sheetName}":`, err);
                resolve([]);
            }
        });
    });
}

// ============================================================================
// ARRANQUE DEL TABLERO
// ============================================================================
async function initDashboard() {
    if (typeof lucide !== "undefined") {
        lucide.createIcons();
    }

    const label = document.getElementById("dataSourceLabel");

    try {
        const [rowsHoja1, rowsEquipos] = await Promise.all([
            fetchSheetCSV(SHEETS.PRINCIPAL),
            fetchSheetCSV(SHEETS.EQUIPOS)
        ]);

        if (!rowsHoja1.length) {
            throw new Error("Hoja 1 vacía o sin permisos públicos de lectura.");
        }

        renderResumenYProceso(rowsHoja1);
        renderFuncionamiento(rowsHoja1, rowsEquipos);
        renderMantenimiento(rowsHoja1);
        renderControlYGestion(rowsHoja1);

        if (label) {
            label.textContent = "Datos en vivo (Google Sheets)";
            label.className = "text-xs font-medium px-3 py-1.5 bg-emerald-950/80 text-emerald-400 rounded-full border border-emerald-700/60";
        }
    } catch (err) {
        console.error("Error cargando datos:", err);
        if (label) {
            label.textContent = "Error de conexión con Google Sheets";
            label.className = "text-xs font-medium px-3 py-1.5 bg-red-950/80 text-red-400 rounded-full border border-red-700/60";
        }
    }
}

// ============================================================================
// PESTAÑA 1 (RESUMEN GENERAL) Y PESTAÑA 2 (PROCESO)
// ============================================================================
function renderResumenYProceso(rows) {
    // Promedios DBO, DQO, MES
    const m1DboEnt = avgCol(rows, "dbo_ent_m1");
    const m1DboSal = avgCol(rows, "dbo_sal_m1");
    const m1DqoEnt = avgCol(rows, "dqo_ent_m1");
    const m1DqoSal = avgCol(rows, "dqo_sal_m1");
    const m1MesEnt = avgCol(rows, "mes_ent_m1");
    const m1MesSal = avgCol(rows, "mes_sal_m1");

    const m2DboEnt = avgCol(rows, "dbo_ent_m2");
    const m2DboSal = avgCol(rows, "dbo_sal_m2");
    const m2DqoEnt = avgCol(rows, "dqo_ent_m2");
    const m2DqoSal = avgCol(rows, "dqo_sal_m2");
    const m2MesEnt = avgCol(rows, "mes_ent_m2");
    const m2MesSal = avgCol(rows, "mes_sal_m2");

    // Caudales (último valor cargado o promedio)
    const m1CaudalDis = lastNonZero(rows, "caudal_dis_m1") || 0.3;
    const m1CaudalTrat = avgCol(rows, "caudal_trat_m1");
    const m2CaudalDis = lastNonZero(rows, "caudal_dis_m2") || 0.9;
    const m2CaudalTrat = avgCol(rows, "caudal_trat_m2");

    // Energías M1 (TS1+TS2+TS3), M2 (TS1+TS2+TS3) y Total Planta
    const eM1 = sumCol(rows, "energia_m1_ts1") + sumCol(rows, "energia_m1_ts2") + sumCol(rows, "energia_m1_ts3");
    const eM2 = sumCol(rows, "energia_m2_ts1") + sumCol(rows, "energia_m2_ts2") + sumCol(rows, "energia_m2_ts3");
    const eTot = sumCol(rows, "energia_total") || (eM1 + eM2);

    // Ratio energético (kWh / m3)
    const volM1 = rows.reduce((acc, r) => acc + (num(col(r, "caudal_trat_m1")) * 86400), 0);
    const volM2 = rows.reduce((acc, r) => acc + (num(col(r, "caudal_trat_m2")) * 86400), 0);
    const ratioM1 = volM1 > 0 ? eM1 / volM1 : 0;
    const ratioM2 = volM2 > 0 ? eM2 / volM2 : 0;

    // Tarjetas M1 y M2 en Resumen General
    setText("m1_caudal_dis", fmtDec(m1CaudalDis, 1));
    setText("m1_dbo_ent", fmtInt(m1DboEnt));
    setText("m1_dbo_sal", fmtInt(m1DboSal));
    setText("m1_dqo_ent", fmtInt(m1DqoEnt));
    setText("m1_dqo_sal", fmtInt(m1DqoSal));
    setText("m1_mes_ent", fmtInt(m1MesEnt));
    setText("m1_mes_sal", fmtInt(m1MesSal));
    setText("m1_caudal_trat", fmtDec(m1CaudalTrat, 1));
    setText("m1_energia_val", fmtInt(eM1));
    setText("m1_kw_m3", fmtDec(ratioM1, 3));

    setText("m2_caudal_dis", fmtDec(m2CaudalDis, 1));
    setText("m2_dbo_ent", fmtInt(m2DboEnt));
    setText("m2_dbo_sal", fmtInt(m2DboSal));
    setText("m2_dqo_ent", fmtInt(m2DqoEnt));
    setText("m2_dqo_sal", fmtInt(m2DqoSal));
    setText("m2_mes_ent", fmtInt(m2MesEnt));
    setText("m2_mes_sal", fmtInt(m2MesSal));
    setText("m2_caudal_trat", fmtDec(m2CaudalTrat, 1));
    setText("m2_energia_val", fmtInt(eM2));
    setText("m2_kw_m3", fmtDec(ratioM2, 3));

    // Totales Acumulados Planta
    setText("tot_energia", fmtInt(eTot));
    setText("tot_biosolidos", fmtInt(sumCol(rows, "biosolidos_ton")));
    setText("tot_arenas", fmtInt(sumCol(rows, "arenas_ton")));
    setText("tot_polimero", fmtInt(sumCol(rows, "polimero_kg")));

    // Dotación y Horas RRHH en Resumen General
    setText("rrhh_admin_lbl", fmtInt(sumCol(rows, "rrhh_admin")));
    setText("rrhh_operativo_lbl", fmtInt(sumCol(rows, "rrhh_operativo")));
    setText("hs_normales_lbl", fmtInt(sumCol(rows, "hs_normales")));
    setText("hs_extra_lbl", fmtInt(sumCol(rows, "hs_extra")));

    // Resumen Mantenimiento en Resumen General
    setText("mant_prev", fmtInt(sumCol(rows, "mant_preventivos")));
    setText("mant_corr", fmtInt(sumCol(rows, "mant_correctivos")));
    setText("mant_act", fmtInt(sumCol(rows, "mant_actividades") + sumCol(rows, "mant_generales")));

    // Agrupación Mensual para los 4 gráficos de barras de Resumen General
    const mensual = {};
    rows.forEach(r => {
        const f = col(r, "fecha");
        if (!f) return;
        const mKey = getMonthKey(f);
        if (!mensual[mKey]) {
            mensual[mKey] = { energia: 0, biosolidos: 0, arenas: 0, polimero: 0 };
        }
        mensual[mKey].energia += num(col(r, "energia_total"));
        mensual[mKey].biosolidos += num(col(r, "biosolidos_ton"));
        mensual[mKey].arenas += num(col(r, "arenas_ton"));
        mensual[mKey].polimero += num(col(r, "polimero_kg"));
    });

    const mLabels = Object.keys(mensual);
    renderBarChart("chartMensualEnergia", mLabels, mLabels.map(k => mensual[k].energia), "Energía (kWh)", "#facc15");
    renderBarChart("chartMensualBiosolidos", mLabels, mLabels.map(k => mensual[k].biosolidos), "Biosólidos (Ton)", "#f97316");
    renderBarChart("chartMensualArenas", mLabels, mLabels.map(k => mensual[k].arenas), "Arenas (Ton)", "#fb923c");
    renderBarChart("chartMensualPolimero", mLabels, mLabels.map(k => mensual[k].polimero), "Polímero (Kg)", "#818cf8");

    // ------------------------------------------------------------------------
    // PESTAÑA 2: PROCESO (EFICIENCIA DE REMOCIÓN + FUERA DE NORMA + EVOLUCIÓN)
    // ------------------------------------------------------------------------
    const calcRem = (ent, sal) => (ent > 0 ? Math.max(0, ((ent - sal) / ent) * 100) : 0);

    setText("proc_rem_dbo_m1", fmtDec(calcRem(m1DboEnt, m1DboSal), 1));
    setText("proc_rem_dqo_m1", fmtDec(calcRem(m1DqoEnt, m1DqoSal), 1));
    setText("proc_rem_mes_m1", fmtDec(calcRem(m1MesEnt, m1MesSal), 1));
    setText("proc_norma_m1", fmtInt(sumCol(rows, "fuera_norma_m1")));

    setText("proc_rem_dbo_m2", fmtDec(calcRem(m2DboEnt, m2DboSal), 1));
    setText("proc_rem_dqo_m2", fmtDec(calcRem(m2DqoEnt, m2DqoSal), 1));
    setText("proc_rem_mes_m2", fmtDec(calcRem(m2MesEnt, m2MesSal), 1));
    setText("proc_norma_m2", fmtInt(sumCol(rows, "fuera_norma_m2")));

    const rowsConFecha = rows.filter(r => col(r, "fecha") !== "");
    const fLabels = rowsConFecha.map(r => col(r, "fecha"));
    const dboM1Arr = rowsConFecha.map(r => num(col(r, "dbo_sal_m1")));
    const dboM2Arr = rowsConFecha.map(r => num(col(r, "dbo_sal_m2")));
    const qM1Arr = rowsConFecha.map(r => num(col(r, "caudal_trat_m1")));
    const qM2Arr = rowsConFecha.map(r => num(col(r, "caudal_trat_m2")));

    renderDualLineChart("chartProcesoDbo", fLabels, "DBO Salida M1 (mg/L)", dboM1Arr, "#22d3ee", "DBO Salida M2 (mg/L)", dboM2Arr, "#34d399");
    renderDualLineChart("chartProcesoCaudales", fLabels, "Caudal M1 (m³/s)", qM1Arr, "#22d3ee", "Caudal M2 (m³/s)", qM2Arr, "#34d399");
}

// ============================================================================
// PESTAÑA 3: FUNCIONAMIENTO (RSU, OT, MAPA INTERACTIVO Y EQUIPOS CRÍTICOS)
// ============================================================================
function renderFuncionamiento(rowsHoja1, rowsEquipos) {
    setText("func_cant_rsu", fmtInt(sumCol(rowsHoja1, "cant_rsu")));
    setText("func_cant_ot", fmtInt(sumCol(rowsHoja1, "cant_ot")));

    globalEquiposCriticos = rowsEquipos.filter(r => col(r, "equipo") !== "");

    renderMapaInteractivo();
    filtrarEquiposPorSector(null);
}

function renderMapaInteractivo() {
    const capa = document.getElementById("capa_marcadores_planta");
    if (!capa) return;
    capa.innerHTML = "";

    // Unificar sectores predefinidos con cualquier sector nuevo cargado en Equipos_Criticos
    const puntos = [...COORDS_MAPA_PLANTA];
    globalEquiposCriticos.forEach(eq => {
        const sec = String(col(eq, "sector_mapa")).trim();
        if (sec && !puntos.some(p => p.sector.toLowerCase() === sec.toLowerCase())) {
            puntos.push({ sector: sec, x: 50, y: 50 });
        }
    });

    puntos.forEach(pt => {
        const eqSector = globalEquiposCriticos.filter(eq =>
            String(col(eq, "sector_mapa")).toLowerCase().includes(pt.sector.toLowerCase()) ||
            pt.sector.toLowerCase().includes(String(col(eq, "sector_mapa")).toLowerCase())
        );

        let colorClass = "bg-cyan-400 shadow-[0_0_10px_#22d3ee]"; // Sin novedad
        if (eqSector.some(e => /fuera/i.test(String(col(e, "estado"))))) {
            colorClass = "bg-red-500 shadow-[0_0_12px_#ef4444] animate-pulse";
        } else if (eqSector.some(e => /reparaci/i.test(String(col(e, "estado"))))) {
            colorClass = "bg-amber-400 shadow-[0_0_10px_#fbbf24]";
        } else if (eqSector.length > 0) {
            colorClass = "bg-emerald-500 shadow-[0_0_10px_#10b981]";
        }

        const btn = document.createElement("button");
        btn.type = "button";
        btn.style.left = `${pt.x}%`;
        btn.style.top = `${pt.y}%`;
        btn.className = "group absolute -translate-x-1/2 -translate-y-1/2 z-10 focus:outline-none";
        btn.onclick = () => filtrarEquiposPorSector(pt.sector);

        btn.innerHTML = `
            <span class="block w-4 h-4 rounded-full border-2 border-slate-950 ${colorClass} transition-transform group-hover:scale-125"></span>
            <span class="pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap bg-slate-900/95 text-white text-[11px] font-semibold px-2.5 py-1 rounded-lg border border-slate-700 shadow-xl">
                ${pt.sector} (${eqSector.length})
            </span>
        `;
        capa.appendChild(btn);
    });
}

function filtrarEquiposPorSector(sectorFiltro) {
    const contenedor = document.getElementById("lista_equipos_criticos");
    const btnReset = document.getElementById("btn_reset_sector_mapa");
    if (!contenedor) return;

    let filtrados = globalEquiposCriticos;
    if (sectorFiltro) {
        filtrados = globalEquiposCriticos.filter(eq => {
            const s = String(col(eq, "sector_mapa")).toLowerCase();
            const f = sectorFiltro.toLowerCase();
            return s.includes(f) || f.includes(s);
        });
        setText("titulo_lista_equipos", `Equipos Críticos · ${sectorFiltro}`);
        if (btnReset) btnReset.classList.remove("hidden");
    } else {
        setText("titulo_lista_equipos", "Listado General de Equipos Críticos");
        if (btnReset) btnReset.classList.add("hidden");
    }

    setText("total_eq_criticos", `${filtrados.length} equipos`);

    if (!filtrados.length) {
        contenedor.innerHTML = `<div class="text-center py-8 text-slate-500 text-sm italic col-span-full">No hay equipos críticos registrados en este sector.</div>`;
        return;
    }

    contenedor.innerHTML = filtrados.map(eq => {
        const nombre = col(eq, "equipo") || "Equipo";
        const sector = col(eq, "sector_mapa") || "Sin sector";
        const estado = col(eq, "estado") || "OPERATIVO";
        const detalle = col(eq, "detalle") || "Sin novedades reportadas";

        let badgeClass = "bg-emerald-950 text-emerald-400 border-emerald-800";
        if (/fuera/i.test(estado)) badgeClass = "bg-red-950 text-red-400 border-red-800";
        else if (/reparaci/i.test(estado)) badgeClass = "bg-amber-950 text-amber-400 border-amber-800";

        return `
            <div class="bg-slate-900/90 rounded-xl p-4 border border-slate-700/80 flex flex-col justify-between gap-2">
                <div class="flex items-start justify-between gap-2">
                    <div>
                        <div class="text-sm font-bold text-white">${nombre}</div>
                        <div class="text-xs text-cyan-400 mt-0.5">${sector}</div>
                    </div>
                    <span class="text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${badgeClass}">${estado}</span>
                </div>
                <p class="text-xs text-slate-400 border-t border-slate-800 pt-2 mt-1">${detalle}</p>
            </div>
        `;
    }).join("");
}

// ============================================================================
// PESTAÑA 4: MANTENIMIENTO
// ============================================================================
function renderMantenimiento(rows) {
    const cantPrev = sumCol(rows, "mant_preventivos");
    const cantCorr = sumCol(rows, "mant_correctivos");
    const cantAct = sumCol(rows, "mant_actividades") + sumCol(rows, "mant_generales");
    const cantTotal = cantPrev + cantCorr + cantAct;

    const hsPrev = sumCol(rows, "horas_prev");
    const hsCorr = sumCol(rows, "horas_corr");
    const hsTareas = sumCol(rows, "horas_tareas");
    const hsTotal = hsPrev + hsCorr + hsTareas;

    // Fila 1: Cantidades
    setText("kpi_mant_total", fmtInt(cantTotal));
    setText("kpi_mant_prev", fmtInt(cantPrev));
    setText("kpi_mant_corr", fmtInt(cantCorr));
    setText("kpi_mant_act", fmtInt(cantAct));

    // Fila 2: Horas Invertidas
    setText("kpi_horas_total", fmtInt(hsTotal));
    setText("kpi_horas_prev", fmtInt(hsPrev));
    setText("kpi_horas_corr", fmtInt(hsCorr));
    setText("kpi_horas_tareas", fmtInt(hsTareas));

    // Fila 3: Promedios de Horas por Intervención
    setText("kpi_prom_total", fmtDec(cantTotal > 0 ? hsTotal / cantTotal : 0, 2));
    setText("kpi_prom_prev", fmtDec(cantPrev > 0 ? hsPrev / cantPrev : 0, 2));
    setText("kpi_prom_corr", fmtDec(cantCorr > 0 ? hsCorr / cantCorr : 0, 2));
    setText("kpi_prom_act", fmtDec(cantAct > 0 ? hsTareas / cantAct : 0, 2));

    // Evolución Mensual (Prev / Corr / Act)
    const mensual = {};
    rows.forEach(r => {
        const f = col(r, "fecha");
        if (!f) return;
        const mKey = getMonthKey(f);
        if (!mensual[mKey]) mensual[mKey] = { prev: 0, corr: 0, act: 0 };
        mensual[mKey].prev += num(col(r, "mant_preventivos"));
        mensual[mKey].corr += num(col(r, "mant_correctivos"));
        mensual[mKey].act += num(col(r, "mant_actividades")) + num(col(r, "mant_generales"));
    });

    const mLabels = Object.keys(mensual);
    destroyChart("chartMantMensual");
    const ctxM = document.getElementById("chartMantMensual");
    if (ctxM) {
        chartsInstances["chartMantMensual"] = new Chart(ctxM, {
            type: "bar",
            data: {
                labels: mLabels,
                datasets: [
                    { label: "Preventivos", data: mLabels.map(m => mensual[m].prev), backgroundColor: "#10b981", borderRadius: 4 },
                    { label: "Correctivos", data: mLabels.map(m => mensual[m].corr), backgroundColor: "#ef4444", borderRadius: 4 },
                    { label: "Actividades", data: mLabels.map(m => mensual[m].act), backgroundColor: "#06b6d4", borderRadius: 4 }
                ]
            },
            options: baseChartOptions()
        });
    }

    // Gráfico Torta: Preventivos vs Correctivos vs Actividades
    renderDoughnutChart(
        "chartMantTortas",
        ["Preventivos", "Correctivos", "Actividades"],
        [cantPrev, cantCorr, cantAct],
        ["#10b981", "#ef4444", "#06b6d4"]
    );

    // Gráfico Torta: Criticidad de Correctivos (corr_alto, corr_medio, corr_bajo)
    const critAlto = sumCol(rows, "corr_alto");
    const critMedio = sumCol(rows, "corr_medio");
    const critBajo = sumCol(rows, "corr_bajo");
    renderDoughnutChart(
        "chartCriticidad",
        ["Alto", "Medio", "Bajo"],
        [critAlto, critMedio, critBajo],
        ["#ef4444", "#f59e0b", "#38bdf8"]
    );

    // Procesar columna equipos_intervenidos para Ranking Top 10 y Sectores
    const equiposMap = {};
    const sectoresMap = {};

    rows.forEach(r => {
        const rawStr = String(col(r, "equipos_intervenidos") || "").trim();
        if (!rawStr) return;

        rawStr.split(",").map(s => s.trim()).filter(Boolean).forEach(item => {
            let nombre = item;
            let sector = "General";
            const idxParen = item.indexOf("(");
            if (idxParen !== -1) {
                nombre = item.substring(0, idxParen).trim();
                sector = item.substring(idxParen + 1).replace(/\)+$/, "").trim();
            }

            const keyEq = `${nombre}|||${sector}`;
            equiposMap[keyEq] = (equiposMap[keyEq] || 0) + 1;
            sectoresMap[sector] = (sectoresMap[sector] || 0) + 1;
        });
    });

    // Gráfico Horizontal de Sectores Intervenidos
    const sectoresSorted = Object.entries(sectoresMap).sort((a, b) => b[1] - a[1]);
    destroyChart("chartSectores");
    const ctxSec = document.getElementById("chartSectores");
    if (ctxSec) {
        chartsInstances["chartSectores"] = new Chart(ctxSec, {
            type: "bar",
            data: {
                labels: sectoresSorted.map(s => s[0]),
                datasets: [{
                    label: "Intervenciones",
                    data: sectoresSorted.map(s => s[1]),
                    backgroundColor: "#06b6d4",
                    hoverBackgroundColor: "#22d3ee",
                    borderRadius: 4
                }]
            },
            options: {
                ...baseChartOptions(),
                indexAxis: "y",
                plugins: { legend: { display: false } },
                scales: {
                    x: { beginAtZero: true, ticks: { color: "#94a3b8", precision: 0 }, grid: { color: "#1e293b" } },
                    y: { ticks: { color: "#cbd5e1", font: { size: 11 } }, grid: { display: false } }
                }
            }
        });
    }

    // Tabla Top 10 Equipos Más Intervenidos
    const top10 = Object.entries(equiposMap).sort((a, b) => b[1] - a[1]).slice(0, 10);
    const tbody = document.getElementById("tabla_equipos_body");
    if (tbody) {
        if (!top10.length) {
            tbody.innerHTML = `<tr><td colspan="4" class="text-center py-6 text-slate-500 italic">Sin intervenciones registradas</td></tr>`;
        } else {
            tbody.innerHTML = top10.map(([key, cant], idx) => {
                const [eqName, secName] = key.split("|||");
                return `
                    <tr class="border-b border-slate-700/60 hover:bg-slate-700/30">
                        <td class="py-2.5 px-3 font-bold text-cyan-400">#${idx + 1}</td>
                        <td class="py-2.5 px-3 font-semibold text-white">${eqName}</td>
                        <td class="py-2.5 px-3 text-slate-400 text-xs">${secName}</td>
                        <td class="py-2.5 px-3 text-right font-bold text-amber-400">${cant}</td>
                    </tr>
                `;
            }).join("");
        }
    }
}

// ============================================================================
// PESTAÑA 5: CONTROL Y GESTIÓN
// ============================================================================
function renderControlYGestion(rows) {
    // Pañol Mensual (panol_items_consumidos y panol_plata_consumida)
    const panolMes = {};
    let totItems = 0, totPlata = 0;

    rows.forEach(r => {
        const f = col(r, "fecha");
        const items = num(col(r, "panol_items_consumidos"));
        const plata = num(col(r, "panol_plata_consumida"));
        if (!f && items === 0 && plata === 0) return;

        const mKey = getMonthKey(f);
        if (!panolMes[mKey]) panolMes[mKey] = { items: 0, plata: 0 };
        panolMes[mKey].items += items;
        panolMes[mKey].plata += plata;

        totItems += items;
        totPlata += plata;
    });

    setText("tot_panol_items", fmtInt(totItems));
    setText("tot_panol_plata", fmtMoney(totPlata));

    const mPanolLabels = Object.keys(panolMes);
    const tbodyPanol = document.getElementById("tabla_panol_mensual");
    if (tbodyPanol) {
        if (!mPanolLabels.length) {
            tbodyPanol.innerHTML = `<tr><td colspan="3" class="text-center py-4 text-slate-500 italic">Sin datos</td></tr>`;
        } else {
            tbodyPanol.innerHTML = mPanolLabels.map(m => `
                <tr class="border-b border-slate-700/60">
                    <td class="py-2 px-3 text-slate-200">${m}</td>
                    <td class="py-2 px-3 text-right text-cyan-400 font-semibold">${fmtInt(panolMes[m].items)}</td>
                    <td class="py-2 px-3 text-right text-emerald-400 font-semibold">${fmtMoney(panolMes[m].plata)}</td>
                </tr>
            `).join("");
        }
    }

    // Gráfico Doble Eje Pañol (Ítems vs Plata)
    destroyChart("chartPanol");
    const ctxPanol = document.getElementById("chartPanol");
    if (ctxPanol) {
        chartsInstances["chartPanol"] = new Chart(ctxPanol, {
            type: "bar",
            data: {
                labels: mPanolLabels,
                datasets: [
                    {
                        label: "Importe ($)",
                        data: mPanolLabels.map(m => panolMes[m].plata),
                        backgroundColor: "#10b981",
                        yAxisID: "y",
                        borderRadius: 4
                    },
                    {
                        label: "Ítems Consumidos",
                        data: mPanolLabels.map(m => panolMes[m].items),
                        type: "line",
                        borderColor: "#22d3ee",
                        backgroundColor: "#22d3ee",
                        yAxisID: "y1",
                        tension: 0.3
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: { ticks: { color: "#94a3b8" }, grid: { color: "#1e293b" } },
                    y: { type: "linear", position: "left", ticks: { color: "#10b981" }, grid: { color: "#1e293b" } },
                    y1: { type: "linear", position: "right", ticks: { color: "#22d3ee" }, grid: { drawOnChartArea: false } }
                },
                plugins: { legend: { labels: { color: "#cbd5e1" } } }
            }
        });
    }

    // Coste Mensual de Biosólidos y RSU ($)
    const costeMes = {};
    rows.forEach(r => {
        const f = col(r, "fecha");
        if (!f) return;
        const mKey = getMonthKey(f);
        const cBio = num(col(r, "costo_biosolidos"));
        const cRsu = num(col(r, "costo_rsu"));
        costeMes[mKey] = (costeMes[mKey] || 0) + cBio + cRsu;
    });
    renderBarChart("chartCosteResiduos", Object.keys(costeMes), Object.values(costeMes), "Coste Residuos ($)", "#f59e0b");

    // Totalizado Biosólidos y RSU: Módulo 1 vs Módulo 2 (Ton)
    const bioM1 = sumCol(rows, "biosolidos_ton_m1");
    const bioM2 = sumCol(rows, "biosolidos_ton_m2");
    const rsuM1 = sumCol(rows, "cant_rsu_m1");
    const rsuM2 = sumCol(rows, "cant_rsu_m2");

    destroyChart("chartBiosolidosRsu");
    const ctxBr = document.getElementById("chartBiosolidosRsu");
    if (ctxBr) {
        chartsInstances["chartBiosolidosRsu"] = new Chart(ctxBr, {
            type: "bar",
            data: {
                labels: ["Biosólidos (Ton)", "RSU (Ton)"],
                datasets: [
                    { label: "Módulo 1 (M1)", data: [bioM1, rsuM1], backgroundColor: "#22d3ee", borderRadius: 6 },
                    { label: "Módulo 2 (M2)", data: [bioM2, rsuM2], backgroundColor: "#34d399", borderRadius: 6 }
                ]
            },
            options: baseChartOptions()
        });
    }

    // Inversiones y Explotaciones
    setText("gest_inv_obras", fmtMoney(sumCol(rows, "inv_obras")));
    setText("gest_inv_equip", fmtMoney(sumCol(rows, "inv_equipamiento")));
    setText("gest_exp_rep", fmtMoney(sumCol(rows, "exp_reparaciones")));
}

// ============================================================================
// HELPERS DE CHART.JS
// ============================================================================
function baseChartOptions() {
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

function renderBarChart(canvasId, labels, data, label, color) {
    destroyChart(canvasId);
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;
    chartsInstances[canvasId] = new Chart(ctx, {
        type: "bar",
        data: {
            labels,
            datasets: [{ label, data, backgroundColor: color, borderRadius: 6 }]
        },
        options: {
            ...baseChartOptions(),
            plugins: { legend: { display: false } }
        }
    });
}

function renderDualLineChart(canvasId, labels, label1, data1, color1, label2, data2, color2) {
    destroyChart(canvasId);
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;
    chartsInstances[canvasId] = new Chart(ctx, {
        type: "line",
        data: {
            labels,
            datasets: [
                { label: label1, data: data1, borderColor: color1, backgroundColor: color1 + "33", tension: 0.3, fill: false },
                { label: label2, data: data2, borderColor: color2, backgroundColor: color2 + "33", tension: 0.3, fill: false }
            ]
        },
        options: baseChartOptions()
    });
}

function renderDoughnutChart(canvasId, labels, data, colors) {
    destroyChart(canvasId);
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;
    chartsInstances[canvasId] = new Chart(ctx, {
        type: "doughnut",
        data: {
            labels,
            datasets: [{ data, backgroundColor: colors, borderWidth: 0 }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: "65%",
            plugins: {
                legend: { position: "bottom", labels: { color: "#cbd5e1", padding: 14, font: { size: 11 } } }
            }
        }
    });
}

document.addEventListener("DOMContentLoaded", initDashboard);
