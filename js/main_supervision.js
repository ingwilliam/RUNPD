// =====================================================================
// RUNPD - Consejo Seccional: supervisión y verificación de las medidas
// Reporte por medida (cumplimiento y trazabilidad desde el acto del Consejo
// Superior hasta la finalización de sus procesos) y reporte por proceso.
// Solo consulta. Datos: js/data_supervision.js (dbSupervision).
// =====================================================================

const DIAS_SIN_ACTUACION = 5;   // recibido sin actuación por más de estos días → alerta
const DIAS_CIERRE_MEDIDA = 60;  // medida que vence en estos días o menos → atención

// Estado de un proceso dentro de la medida (según su último evento)
const ESTADOS = {
    registrado: { texto: "Registrado · pendiente de envío", icono: "📝", fondo: "#e0f2fe", color: "#0369a1" },
    recibido:   { texto: "Recibido · sin actuación",        icono: "📥", fondo: "#fef3c7", color: "#92400e" },
    tramite:    { texto: "En trámite",                      icono: "✏️", fondo: "#ffedd5", color: "#9a3412" },
    finalizado: { texto: "Finalizado",                      icono: "🏁", fondo: "#dcfce7", color: "#166534" },
    devuelto:   { texto: "Devuelto al despacho origen",     icono: "↩",  fondo: "#fee2e2", color: "#991b1b" }
};

// Cómo se muestra cada evento en las líneas de tiempo
const EVENTOS = {
    acuerdo:           { icono: "🏛", titulo: "Acuerdo y/o Resolución del Consejo Superior", fondo: "#dbeafe", color: "#1e3a8a" },
    despachos:         { icono: "🏢", titulo: "Despachos garantizados por la UDAE",         fondo: "#dcfce7", color: "#166534" },
    materializacion:   { icono: "📋", titulo: "Medida materializada",                       fondo: "#ede9fe", color: "#6d28d9" },
    notificacion:      { icono: "✉️", titulo: "Medida notificada a los administradores",    fondo: "#ede9fe", color: "#6d28d9" },
    registro:          { icono: "📝", titulo: "Registrado por el despacho origen",          fondo: "#e0f2fe", color: "#0369a1" },
    envio:             { icono: "📤", titulo: "Enviado al despacho destino",                fondo: "#dbeafe", color: "#1d4ed8" },
    actuacion:         { icono: "✏️", titulo: "Actuación registrada",                       fondo: "#ffedd5", color: "#9a3412" },
    finalizacion:      { icono: "🏁", titulo: "Proceso finalizado",                         fondo: "#359946", color: "#ffffff" },
    devolucion_origen: { icono: "↩",  titulo: "Devuelto al despacho origen",                fondo: "#fee2e2", color: "#991b1b" }
};

// Resultado de cada verificación y del cumplimiento de la medida
const NIVELES = {
    ok:       { icono: "✔", texto: "Cumple",            fondo: "#dcfce7", color: "#166534" },
    info:     { icono: "●", texto: "En curso",          fondo: "#e0f2fe", color: "#0369a1" },
    alerta:   { icono: "!", texto: "Con observaciones", fondo: "#fef3c7", color: "#92400e" },
    critico:  { icono: "✕", texto: "Requiere atención", fondo: "#fee2e2", color: "#991b1b" }
};

let reporteActivo = "medidas";

// ---------------------------------------------------------------------
// Utilidades
// ---------------------------------------------------------------------
function esc(v) {
    return String(v ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function hoy() {
    const d = new Date();
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

function diasEntre(desde, hasta) {
    return Math.round((new Date(hasta + "T00:00:00") - new Date(desde + "T00:00:00")) / 86400000);
}

function formatoFecha(iso) {
    if (!iso) return "—";
    const [a, m, d] = iso.split("-");
    return `${d}/${m}/${a}`;
}

function normalizar(t) {
    return String(t || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
}

function pct(n, total) {
    return total ? Math.round((n / total) * 100) : 0;
}

function chip(texto, fondo, color) {
    return `<span style="display: inline-block; font-size: 0.72rem; font-weight: 700; padding: 0.15rem 0.55rem; border-radius: 12px; background: ${fondo}; color: ${color}; white-space: nowrap;">${texto}</span>`;
}

function barra(valor, total, color) {
    const p = Math.min(100, pct(valor, total));
    return `<div style="height: 6px; background: #edf2f7; border-radius: 999px; overflow: hidden; margin-top: 0.3rem;"><div style="width: ${p}%; height: 100%; background: ${color};"></div></div>`;
}

function abrirModal(id) { document.getElementById(id).classList.add("visible"); }
function cerrarModal(id) { document.getElementById(id).classList.remove("visible"); }

function obtenerMedida(id) { return dbSupervision.medidas.find(m => m.id === Number(id)); }
function textoAcuerdo(m) { return `Acuerdo ${m.acuerdo.numero} de ${m.acuerdo.anio}`; }
function autorizados(m) { return m.rutas.reduce((t, r) => t + r.autorizados, 0); }
function procesosDe(m) { return dbSupervision.procesos.filter(p => p.medidaId === m.id); }
function ultimo(p) { return p.eventos[p.eventos.length - 1]; }
function rutaDe(p) { return obtenerMedida(p.medidaId).rutas.find(r => r.origen === p.origen && r.destino === p.destino); }

function claveEstado(p) {
    return { registro: "registrado", envio: "recibido", actuacion: "tramite", finalizacion: "finalizado", devolucion_origen: "devuelto" }[ultimo(p).tipo];
}

// Alerta de un proceso: recibido sin actuación por varios días o próxima actuación vencida
function alertaProceso(p) {
    const u = ultimo(p);
    if (u.tipo === "envio" && diasEntre(u.fecha, hoy()) > DIAS_SIN_ACTUACION)
        return `Sin actuación hace ${diasEntre(u.fecha, hoy())} días`;
    if (u.tipo === "actuacion" && u.proxima && u.proxima < hoy())
        return `Próxima actuación vencida (${formatoFecha(u.proxima)})`;
    return "";
}

function estadoProcesal(p) {
    const u = ultimo(p);
    if (u.tipo === "finalizacion") return `Terminado – ${u.forma}`;
    const ult = [...p.eventos].reverse().find(e => e.estadoProcesal);
    return ult ? ult.estadoProcesal : "—";
}

function infoVigencia(m) {
    const actual = hoy();
    if (actual < m.fechaInicio) return { texto: `Inicia el ${formatoFecha(m.fechaInicio)}`, fondo: "#dbeafe", color: "#1d4ed8", dias: diasEntre(actual, m.fechaFin) };
    const dias = diasEntre(actual, m.fechaFin);
    if (dias < 0)   return { texto: "Medida finalizada", fondo: "#fee2e2", color: "#991b1b", dias };
    if (dias <= DIAS_CIERRE_MEDIDA) return { texto: `Vence en ${dias} día(s)`, fondo: "#fef3c7", color: "#92400e", dias };
    return { texto: `Vigente · ${dias} días`, fondo: "#dcfce7", color: "#166534", dias };
}

function contar(lista) {
    const c = { registrado: 0, recibido: 0, tramite: 0, finalizado: 0, devuelto: 0, alertas: 0 };
    lista.forEach(p => { c[claveEstado(p)]++; if (alertaProceso(p)) c.alertas++; });
    c.enDestino = c.recibido + c.tramite;
    c.enviados = c.recibido + c.tramite + c.finalizado + c.devuelto;
    return c;
}

// ---------------------------------------------------------------------
// Verificación del cumplimiento de la medida
// ---------------------------------------------------------------------
function verificarMedida(m) {
    const lista = procesosDe(m);
    const c = contar(lista);
    const total = autorizados(m);
    const v = infoVigencia(m);
    const registrados = lista.length;
    const cerca = v.dias <= DIAS_CIERRE_MEDIDA;

    const despachos = new Map();
    m.rutas.forEach(r => { despachos.set(r.origen, r.adminOrigen); despachos.set(r.destino, r.adminDestino); });
    const sinAdmin = [...despachos].filter(([, a]) => !a).map(([d]) => d);

    const recibidos = c.enDestino + c.finalizado;
    const checks = [
        {
            titulo: "Administradores registrados",
            nivel: sinAdmin.length ? "critico" : "ok",
            detalle: sinAdmin.length
                ? `Falta registrar el administrador de: ${sinAdmin.join(", ")}.`
                : `Los ${despachos.size} despachos de la medida tienen administrador autorizado.`
        },
        {
            titulo: "Registro de procesos (despachos origen)",
            nivel: registrados >= total ? "ok" : (cerca ? "alerta" : "info"),
            detalle: `${registrados} de ${total} procesos autorizados registrados (${pct(registrados, total)}%).` +
                (registrados < total && cerca ? ` Faltan ${total - registrados} y la medida vence en ${v.dias} día(s).` : "")
        },
        {
            titulo: "Envío al despacho destino",
            nivel: c.registrado ? "info" : "ok",
            detalle: c.registrado
                ? `${c.registrado} proceso(s) registrado(s) aún no se envían al despacho destino.`
                : "Todos los procesos registrados fueron enviados."
        },
        {
            titulo: "Gestión en el despacho destino",
            nivel: c.alertas ? "alerta" : "ok",
            detalle: c.alertas
                ? `${c.alertas} proceso(s) sin actuación o con la próxima actuación vencida.`
                : "Los procesos recibidos tienen sus actuaciones al día."
        },
        {
            titulo: "Finalización de procesos",
            nivel: !recibidos ? "info" : (c.finalizado === recibidos ? "ok" : (cerca ? "alerta" : "info")),
            detalle: `${c.finalizado} de ${recibidos} procesos recibidos finalizados (${pct(c.finalizado, recibidos)}%).` +
                (c.devuelto ? ` ${c.devuelto} devuelto(s) al despacho origen.` : "")
        },
        {
            titulo: "Vigencia de la medida",
            nivel: v.dias < 0 ? (c.enDestino ? "critico" : "ok") : (cerca ? "alerta" : "ok"),
            detalle: v.dias < 0
                ? (c.enDestino ? `La medida finalizó con ${c.enDestino} proceso(s) aún en el despacho destino.` : "La medida finalizó sin procesos pendientes.")
                : `${formatoFecha(m.fechaInicio)} al ${formatoFecha(m.fechaFin)} · quedan ${v.dias} día(s).`
        }
    ];

    const general = checks.some(x => x.nivel === "critico") ? "critico" : checks.some(x => x.nivel === "alerta") ? "alerta" : "ok";
    return { checks, general, c, total, registrados, recibidos, v, sinAdmin };
}

// ---------------------------------------------------------------------
// Indicadores generales
// ---------------------------------------------------------------------
function renderizarIndicadores() {
    const c = contar(dbSupervision.procesos);
    const totalAut = dbSupervision.medidas.reduce((t, m) => t + autorizados(m), 0);
    const atencion = dbSupervision.medidas.filter(m => verificarMedida(m).general !== "ok").length;
    const tarjetas = [
        { icono: "📜", valor: dbSupervision.medidas.length, texto: "Medidas materializadas", color: "#7c3aed", accion: "cambiarReporte('medidas')" },
        { icono: "📝", valor: `${dbSupervision.procesos.length}/${totalAut}`, texto: "Procesos registrados / autorizados", color: "#0369a1", accion: "filtrarEstado('')" },
        { icono: "✏️", valor: c.enDestino, texto: "En el despacho destino", color: "#b45309", accion: "filtrarEstado('destino')" },
        { icono: "🏁", valor: c.finalizado, texto: "Finalizados", color: "#166534", accion: "filtrarEstado('finalizado')" },
        { icono: "↩", valor: c.devuelto, texto: "Devueltos al origen", color: "#991b1b", accion: "filtrarEstado('devuelto')" },
        { icono: "⚠️", valor: c.alertas, texto: "Procesos con alerta", color: "#dc2626", accion: "filtrarEstado('alerta')" },
        { icono: "🔎", valor: atencion, texto: "Medidas con observaciones", color: "#d97706", accion: "cambiarReporte('medidas')" }
    ];
    document.getElementById("indicadores").innerHTML = tarjetas.map(t => `
        <button type="button" onclick="${t.accion}" title="Ver en el reporte"
            style="cursor: pointer; text-align: left; background: #ffffff; border: 1px solid #e2e8f0; border-top: 4px solid ${t.color}; border-radius: 8px; padding: 0.8rem 1rem; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="font-size: 1.5rem; font-weight: 800; color: var(--text-main);">${t.valor}</span>
                <span style="font-size: 1.2rem;">${t.icono}</span>
            </div>
            <div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 0.15rem;">${t.texto}</div>
        </button>`).join("");
}

// ---------------------------------------------------------------------
// Pestañas
// ---------------------------------------------------------------------
function cambiarReporte(cual) {
    reporteActivo = cual;
    document.getElementById("reporte-medidas").style.display = cual === "medidas" ? "" : "none";
    document.getElementById("reporte-procesos").style.display = cual === "procesos" ? "" : "none";
    document.getElementById("tab-medidas").classList.toggle("activa", cual === "medidas");
    document.getElementById("tab-procesos").classList.toggle("activa", cual === "procesos");
}

// ---------------------------------------------------------------------
// REPORTE POR MEDIDA
// ---------------------------------------------------------------------
function renderizarMedidas() {
    document.getElementById("cuerpo-medidas").innerHTML = dbSupervision.medidas.map(m => {
        const r = verificarMedida(m);
        const n = NIVELES[r.general];
        const observaciones = r.checks.filter(x => x.nivel === "critico" || x.nivel === "alerta");
        return `
            <tr>
                <td style="min-width: 190px;">
                    <a href="#" onclick="verMedida(${m.id}); return false;" style="font-weight: 700; color: var(--primary-green);">${esc(textoAcuerdo(m))}</a>
                    <div style="font-size: 0.72rem; color: var(--text-muted);">${esc(m.especialidad)} · ${m.rutas.length} ruta(s)</div>
                </td>
                <td style="font-size: 0.78rem; white-space: nowrap;">${formatoFecha(m.fechaInicio)} – ${formatoFecha(m.fechaFin)}<br>${chip(r.v.texto, r.v.fondo, r.v.color)}</td>
                <td style="font-size: 0.8rem; min-width: 130px;"><strong>${r.registrados}</strong> de ${r.total} <span style="color: var(--text-muted);">(${pct(r.registrados, r.total)}%)</span>${barra(r.registrados, r.total, "#0ea5e9")}</td>
                <td style="font-size: 0.8rem; min-width: 110px;"><strong>${r.c.enDestino}</strong> en el destino<br><span style="color: var(--text-muted); font-size: 0.72rem;">${r.c.registrado} sin enviar · ${r.c.devuelto} devuelto(s)</span></td>
                <td style="font-size: 0.8rem; min-width: 130px;"><strong>${r.c.finalizado}</strong> de ${r.recibidos} <span style="color: var(--text-muted);">(${pct(r.c.finalizado, r.recibidos)}%)</span>${barra(r.c.finalizado, r.recibidos, "#16a34a")}</td>
                <td style="text-align: center;">${r.c.alertas ? chip(`⚠️ ${r.c.alertas}`, "#fee2e2", "#991b1b") : '<span style="color: var(--text-muted);">—</span>'}</td>
                <td style="min-width: 170px;">
                    ${chip(`${n.icono} ${n.texto}`, n.fondo, n.color)}
                    ${observaciones.length ? `<div style="font-size: 0.72rem; color: ${n.color}; margin-top: 0.25rem;">${esc(observaciones.map(x => x.titulo).join(" · "))}</div>` : ""}
                </td>
                <td><button class="btn-action edit" style="white-space: nowrap;" onclick="verMedida(${m.id})">🔎 Ver reporte</button></td>
            </tr>`;
    }).join("");
}

// ---------------------------------------------------------------------
// REPORTE POR PROCESO
// ---------------------------------------------------------------------
function llenarFiltros() {
    document.getElementById("filtro-medida").innerHTML = `<option value="">Todas las medidas</option>` +
        dbSupervision.medidas.map(m => `<option value="${m.id}">${esc(textoAcuerdo(m))}</option>`).join("");
    const despachos = [...new Set(dbSupervision.procesos.flatMap(p => [p.origen, p.destino]))].sort();
    document.getElementById("filtro-despacho").innerHTML = `<option value="">Todos los despachos</option>` +
        despachos.map(d => `<option value="${esc(d)}">${esc(d)}</option>`).join("");
    document.getElementById("filtro-estado").innerHTML = `<option value="">Todos los estados</option>
        <option value="destino">En el despacho destino</option>
        <option value="alerta">⚠️ Con alerta</option>` +
        Object.entries(ESTADOS).map(([k, e]) => `<option value="${k}">${e.icono} ${e.texto}</option>`).join("");
}

function filtrarMedida(id) {
    limpiarFiltros(false);
    document.getElementById("filtro-medida").value = id;
    cerrarModal("modal-medida");
    cambiarReporte("procesos");
    renderizarProcesos();
}

function filtrarEstado(estado) {
    limpiarFiltros(false);
    document.getElementById("filtro-estado").value = estado;
    cambiarReporte("procesos");
    renderizarProcesos();
}

function limpiarFiltros(redibujar = true) {
    ["filtro-busqueda", "filtro-medida", "filtro-despacho", "filtro-estado"].forEach(id => document.getElementById(id).value = "");
    if (redibujar) renderizarProcesos();
}

function procesosFiltrados() {
    const q = normalizar(document.getElementById("filtro-busqueda").value);
    const medida = document.getElementById("filtro-medida").value;
    const despacho = document.getElementById("filtro-despacho").value;
    const estado = document.getElementById("filtro-estado").value;
    const orden = { recibido: 0, tramite: 1, registrado: 2, devuelto: 3, finalizado: 4 };

    return dbSupervision.procesos.filter(p => {
        const clave = claveEstado(p);
        if (medida && p.medidaId !== Number(medida)) return false;
        if (despacho && p.origen !== despacho && p.destino !== despacho) return false;
        if (estado === "destino" && !["recibido", "tramite"].includes(clave)) return false;
        if (estado === "alerta" && !alertaProceso(p)) return false;
        if (estado && !["destino", "alerta"].includes(estado) && clave !== estado) return false;
        return !q || normalizar([p.codigo, p.partes, p.origen, p.destino].join(" ")).includes(q);
    }).sort((a, b) => (alertaProceso(b) ? 1 : 0) - (alertaProceso(a) ? 1 : 0) || orden[claveEstado(a)] - orden[claveEstado(b)]);
}

function renderizarProcesos() {
    const lista = procesosFiltrados();
    document.getElementById("texto-filtro").innerHTML = `Mostrando <strong>${lista.length}</strong> de ${dbSupervision.procesos.length} proceso(s)`;
    const tbody = document.getElementById("cuerpo-procesos");
    if (!lista.length) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-muted); padding: 2rem;">No hay procesos con los filtros seleccionados.</td></tr>`;
        return;
    }
    tbody.innerHTML = lista.map(p => {
        const e = ESTADOS[claveEstado(p)];
        const u = ultimo(p);
        const alerta = alertaProceso(p);
        const m = obtenerMedida(p.medidaId);
        return `
            <tr>
                <td style="min-width: 210px;">
                    <a href="#" onclick="verProceso('${p.codigo}'); return false;" style="font-family: monospace; font-weight: 700; color: var(--primary-green);">${esc(p.codigo)}</a>
                    <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.15rem;">${esc(p.partes)}</div>
                </td>
                <td>${chip(`📜 ${esc(m.acuerdo.numero)}`, "#ede9fe", "#6d28d9")}</td>
                <td style="font-size: 0.78rem; min-width: 210px;">${esc(p.origen)}<br><strong style="color: #7c3aed;">➔</strong> ${esc(p.destino)}</td>
                <td style="font-size: 0.78rem; min-width: 150px;">${esc(estadoProcesal(p))}</td>
                <td>
                    ${chip(`${e.icono} ${e.texto}`, e.fondo, e.color)}
                    ${alerta ? `<div style="font-size: 0.72rem; font-weight: 600; color: #dc2626; margin-top: 0.3rem;">⚠️ ${esc(alerta)}</div>` : ""}
                </td>
                <td style="font-size: 0.8rem; white-space: nowrap;">${formatoFecha(u.fecha)}<br><span style="font-size: 0.72rem; color: var(--text-muted);">${EVENTOS[u.tipo].titulo}</span></td>
                <td><button class="btn-action edit" style="white-space: nowrap;" onclick="verProceso('${p.codigo}')">🕒 Trazabilidad</button></td>
            </tr>`;
    }).join("");
}

// ---------------------------------------------------------------------
// Líneas de tiempo
// ---------------------------------------------------------------------
function lineaTiempo(items) {
    return `
        <div style="border-left: 3px solid #e2e8f0; margin-left: 0.9rem; padding-left: 1.25rem;">
            ${items.map(it => {
                const t = EVENTOS[it.tipo];
                return `
                <div style="position: relative; margin-bottom: 0.85rem;">
                    <span style="position: absolute; left: -2.15rem; top: 0; width: 1.8rem; height: 1.8rem; border-radius: 50%; background: ${t.fondo}; color: ${t.color}; display: flex; align-items: center; justify-content: center; font-size: 0.85rem; border: 2px solid #ffffff; box-shadow: 0 0 0 1px #e2e8f0;">${t.icono}</span>
                    <div style="display: flex; justify-content: space-between; gap: 0.75rem; flex-wrap: wrap;">
                        <strong style="font-size: 0.85rem; color: var(--text-main);">${t.titulo}${it.radicado ? ` · <span style="font-family: monospace; color: var(--primary-green);">${esc(it.radicado)}</span>` : ""}</strong>
                        <span style="font-size: 0.75rem; color: var(--text-muted); white-space: nowrap;">${formatoFecha(it.fecha)}</span>
                    </div>
                    <div style="font-size: 0.75rem; color: var(--text-muted);">${esc(it.actor)}</div>
                    ${it.detalle ? `<div style="font-size: 0.8rem; color: #334155; margin-top: 0.15rem;">${it.detalle}</div>` : ""}
                </div>`;
            }).join("")}
        </div>`;
}

function detalleEventoProceso(p, e) {
    switch (e.tipo) {
        case "registro":          return `Estado procesal al registrarlo: <strong>${esc(e.estadoProcesal)}</strong>`;
        case "envio":             return `Enviado a <strong>${esc(p.destino)}</strong>.`;
        case "actuacion":         return `Estado procesal: <strong>${esc(e.estadoProcesal)}</strong>${e.proxima ? ` · Próxima actuación: <strong>${formatoFecha(e.proxima)}</strong>` : ""}`;
        case "finalizacion":      return `Forma de terminación: <strong>${esc(e.forma)}</strong>. Se notificó al administrador del despacho origen.`;
        case "devolucion_origen": return `Motivo: <strong>${esc(e.motivo)}</strong>`;
        default: return "";
    }
}

function actorEvento(p, e) {
    const r = rutaDe(p);
    if (["registro", "envio"].includes(e.tipo)) return `Despacho origen: ${p.origen}${r && r.adminOrigen ? ` · ${r.adminOrigen.nombre}` : ""}`;
    return `Despacho destino: ${p.destino}${r && r.adminDestino ? ` · ${r.adminDestino.nombre}` : ""}`;
}

function personaAdmin(a) {
    return a
        ? `👤 ${esc(a.nombre)}<div style="font-size: 0.72rem; color: var(--text-muted);">${esc(a.correo)} · 📱 ${esc(a.celular)}</div>`
        : chip("⚠️ Administrador pendiente", "#fee2e2", "#991b1b");
}

// ---------------------------------------------------------------------
// Reporte de la medida (verificación + rutas + trazabilidad)
// ---------------------------------------------------------------------
function verMedida(id) {
    const m = obtenerMedida(id);
    const r = verificarMedida(m);
    const n = NIVELES[r.general];
    const lista = procesosDe(m);

    document.getElementById("medida-titulo").textContent = `🔎 Reporte del ${textoAcuerdo(m)}`;
    document.getElementById("medida-subtitulo").innerHTML =
        `${esc(m.especialidad)} · Vigencia ${formatoFecha(m.fechaInicio)} al ${formatoFecha(m.fechaFin)} · ${chip(r.v.texto, r.v.fondo, r.v.color)}` +
        (m.resolucion ? ` · Resolución ${esc(m.resolucion.numero)} de ${m.resolucion.anio}` : "");

    // 1. Verificación del cumplimiento
    const verificacion = `
        <div style="display: flex; justify-content: space-between; align-items: center; gap: 0.75rem; flex-wrap: wrap; margin-bottom: 0.6rem;">
            <div style="font-size: 0.9rem; font-weight: 700; color: #6d28d9;">✅ Verificación del cumplimiento</div>
            ${chip(`${n.icono} ${n.texto}`, n.fondo, n.color)}
        </div>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 0.5rem; margin-bottom: 1.25rem;">
            ${r.checks.map(x => {
                const nv = NIVELES[x.nivel];
                return `
                <div style="display: flex; gap: 0.6rem; align-items: flex-start; background: #ffffff; border: 1px solid #e2e8f0; border-left: 4px solid ${nv.color}; border-radius: 6px; padding: 0.55rem 0.7rem;">
                    <span style="flex-shrink: 0; width: 1.4rem; height: 1.4rem; border-radius: 50%; background: ${nv.fondo}; color: ${nv.color}; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 0.75rem;">${nv.icono}</span>
                    <div>
                        <div style="font-size: 0.82rem; font-weight: 700; color: var(--text-main);">${x.titulo}</div>
                        <div style="font-size: 0.76rem; color: #475569;">${esc(x.detalle)}</div>
                    </div>
                </div>`;
            }).join("")}
        </div>`;

    // 2. Cifras de la medida
    const cifras = [["Autorizados", r.total, "#475569"], ["Registrados", r.registrados, "#0369a1"], ["Sin enviar", r.c.registrado, "#0284c7"],
                    ["En destino", r.c.enDestino, "#b45309"], ["Finalizados", r.c.finalizado, "#166534"], ["Devueltos", r.c.devuelto, "#991b1b"]];

    // 3. Avance por ruta, con los administradores
    const rutas = m.rutas.map(ru => {
        const pr = lista.filter(p => p.origen === ru.origen && p.destino === ru.destino);
        const cr = contar(pr);
        return `
            <tr>
                <td style="font-size: 0.78rem; min-width: 180px;"><strong>${esc(ru.origen)}</strong><div style="font-size: 0.75rem; margin-top: 0.2rem;">${personaAdmin(ru.adminOrigen)}</div></td>
                <td style="color: #7c3aed; font-weight: 700;">➔</td>
                <td style="font-size: 0.78rem; min-width: 180px;"><strong>${esc(ru.destino)}</strong><div style="font-size: 0.75rem; margin-top: 0.2rem;">${personaAdmin(ru.adminDestino)}</div></td>
                <td style="text-align: center; font-weight: 700;">${ru.autorizados}</td>
                <td style="text-align: center;">${pr.length}<div style="font-size: 0.7rem; color: var(--text-muted);">${pct(pr.length, ru.autorizados)}%</div></td>
                <td style="text-align: center;">${cr.enDestino}</td>
                <td style="text-align: center; color: #166534; font-weight: 700;">${cr.finalizado}</td>
                <td style="text-align: center; color: #991b1b;">${cr.devuelto}</td>
                <td style="text-align: center;">${cr.alertas ? chip(`⚠️ ${cr.alertas}`, "#fee2e2", "#991b1b") : "—"}</td>
            </tr>`;
    }).join("");

    // 4. Línea de tiempo: eventos de la medida + hitos de cada proceso
    const items = [
        ...m.eventos.map(e => ({ ...e })),
        ...lista.flatMap(p => p.eventos
            .filter(e => ["registro", "envio", "finalizacion", "devolucion_origen"].includes(e.tipo))
            .map(e => ({ tipo: e.tipo, fecha: e.fecha, radicado: p.codigo, actor: actorEvento(p, e), detalle: detalleEventoProceso(p, e) })))
    ].sort((a, b) => a.fecha.localeCompare(b.fecha));

    document.getElementById("medida-contenido").innerHTML = `
        ${verificacion}
        <div style="display: grid; grid-template-columns: repeat(6, 1fr); gap: 0.5rem; margin-bottom: 1.25rem;">
            ${cifras.map(([t, v, col]) => `<div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 0.55rem; text-align: center;">
                <div style="font-size: 1.3rem; font-weight: 800; color: ${col};">${v}</div><div style="font-size: 0.7rem; color: var(--text-muted);">${t}</div></div>`).join("")}
        </div>

        <div style="font-size: 0.9rem; font-weight: 700; color: #6d28d9; margin-bottom: 0.4rem;">🔀 Avance por ruta y administradores autorizados</div>
        <div class="data-table-container" style="margin-bottom: 1.25rem;">
            <table class="data-table">
                <thead><tr><th>Despacho origen</th><th></th><th>Despacho destino</th><th>Autorizados</th><th>Registrados</th><th>En destino</th><th>Finalizados</th><th>Devueltos</th><th>Alertas</th></tr></thead>
                <tbody>${rutas}</tbody>
            </table>
        </div>

        <div style="font-size: 0.9rem; font-weight: 700; color: #6d28d9; margin-bottom: 0.6rem;">🕒 Trazabilidad de la medida (${items.length} movimientos)</div>
        ${lineaTiempo(items)}`;

    document.getElementById("btn-ver-procesos").onclick = () => filtrarMedida(m.id);
    document.getElementById("btn-descargar-medida").onclick = () => descargarCsv(`procesos_${m.acuerdo.numero}.csv`, filasProcesos(procesosDe(m)));
    abrirModal("modal-medida");
}

// ---------------------------------------------------------------------
// Trazabilidad del proceso
// ---------------------------------------------------------------------
function verProceso(codigo) {
    const p = dbSupervision.procesos.find(x => x.codigo === codigo);
    const m = obtenerMedida(p.medidaId);
    const r = rutaDe(p);
    const e = ESTADOS[claveEstado(p)];
    const alerta = alertaProceso(p);
    const tipos = p.eventos.map(x => x.tipo);
    const ev = t => p.eventos.find(x => x.tipo === t);
    const mat = m.eventos.find(x => x.tipo === "materializacion");
    const u = ultimo(p).tipo;

    const etapas = [
        { n: "Medida", f: mat.fecha, s: "hecha" },
        { n: "Registro", f: ev("registro")?.fecha, s: u === "registro" ? "actual" : "hecha" },
        { n: "Envío al destino", f: ev("envio")?.fecha, s: tipos.includes("envio") ? "hecha" : "pendiente" },
        { n: "Gestión", f: ev("actuacion")?.fecha, s: u === "devolucion_origen" ? "alerta" : u === "finalizacion" ? "hecha" : ["envio", "actuacion"].includes(u) ? "actual" : "pendiente" },
        { n: "Finalización", f: ev("finalizacion")?.fecha, s: u === "finalizacion" ? "hecha" : "pendiente" }
    ];
    const estilo = { hecha: ["#16a34a", "#16a34a", "✓"], actual: ["#ffffff", "#7c3aed", "●"], alerta: ["#fee2e2", "#991b1b", "!"], pendiente: ["#ffffff", "#cbd5e1", ""] };

    document.getElementById("proceso-titulo").innerHTML = `🕒 Trazabilidad del proceso <span style="font-family: monospace; color: var(--primary-green);">${esc(p.codigo)}</span>`;
    document.getElementById("proceso-subtitulo").innerHTML = `${esc(p.partes)} · ${esc(textoAcuerdo(m))}`;

    const items = [
        { tipo: "materializacion", fecha: mat.fecha, actor: mat.actor, detalle: `Ruta autorizada: <strong>${esc(p.origen)}</strong> ➔ <strong>${esc(p.destino)}</strong>.` },
        ...p.eventos.map(x => ({ tipo: x.tipo, fecha: x.fecha, actor: actorEvento(p, x), detalle: detalleEventoProceso(p, x) }))
    ];

    document.getElementById("proceso-contenido").innerHTML = `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.6rem; margin-bottom: 0.75rem;">
            <div style="background: #f0f9ff; border: 1px solid #e2e8f0; border-left: 4px solid #0369a1; border-radius: 6px; padding: 0.55rem 0.75rem; font-size: 0.78rem;">
                <div style="font-size: 0.66rem; font-weight: 700; color: #0369a1; text-transform: uppercase;">Despacho origen</div>
                <strong>${esc(p.origen)}</strong><div style="margin-top: 0.2rem;">${personaAdmin(r && r.adminOrigen)}</div>
            </div>
            <div style="background: #fff7ed; border: 1px solid #e2e8f0; border-left: 4px solid #b45309; border-radius: 6px; padding: 0.55rem 0.75rem; font-size: 0.78rem;">
                <div style="font-size: 0.66rem; font-weight: 700; color: #b45309; text-transform: uppercase;">Despacho destino</div>
                <strong>${esc(p.destino)}</strong><div style="margin-top: 0.2rem;">${personaAdmin(r && r.adminDestino)}</div>
            </div>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; gap: 0.75rem; flex-wrap: wrap; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 0.6rem 0.9rem; margin-bottom: 1rem; font-size: 0.8rem;">
            <div><strong>Estado procesal:</strong> ${esc(estadoProcesal(p))}</div>
            <div style="text-align: right;">${chip(`${e.icono} ${e.texto}`, e.fondo, e.color)}
                ${alerta ? `<div style="font-size: 0.75rem; font-weight: 600; color: #dc2626; margin-top: 0.3rem;">⚠️ ${esc(alerta)}</div>` : ""}</div>
        </div>

        <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 0.4rem; margin-bottom: 1.25rem;">
            ${etapas.map(x => {
                const [fondo, borde, marca] = estilo[x.s];
                return `
                <div style="text-align: center;">
                    <div style="width: 2rem; height: 2rem; margin: 0 auto 0.3rem; border-radius: 50%; background: ${fondo}; border: 3px solid ${borde}; color: ${x.s === "hecha" ? "#ffffff" : borde}; font-weight: 800; display: flex; align-items: center; justify-content: center; font-size: 0.8rem;">${marca}</div>
                    <div style="font-size: 0.75rem; font-weight: 700; color: ${x.s === "pendiente" ? "var(--text-muted)" : "var(--text-main)"};">${x.n}</div>
                    <div style="font-size: 0.7rem; color: var(--text-muted);">${x.f && x.s !== "pendiente" ? formatoFecha(x.f) : "Pendiente"}</div>
                </div>`;
            }).join("")}
        </div>

        <div style="font-size: 0.85rem; font-weight: 700; color: #6d28d9; margin-bottom: 0.6rem;">🕒 Movimientos del proceso (${items.length})</div>
        ${lineaTiempo(items)}`;
    abrirModal("modal-proceso");
}

// ---------------------------------------------------------------------
// Descarga de reportes (CSV que abre en Excel)
// ---------------------------------------------------------------------
function descargarCsv(nombre, filas) {
    const celda = v => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const contenido = "﻿" + filas.map(f => f.map(celda).join(";")).join("\r\n");
    const enlace = document.createElement("a");
    enlace.href = URL.createObjectURL(new Blob([contenido], { type: "text/csv;charset=utf-8" }));
    enlace.download = nombre;
    document.body.appendChild(enlace);
    enlace.click();
    enlace.remove();
}

function descargarReporteMedidas() {
    const filas = [["Medida", "Especialidad", "Inicio", "Fin", "Vigencia", "Autorizados", "Registrados", "% registro", "Sin enviar",
                    "En destino", "Finalizados", "% finalización", "Devueltos", "Alertas", "Cumplimiento", "Observaciones"]];
    dbSupervision.medidas.forEach(m => {
        const r = verificarMedida(m);
        filas.push([textoAcuerdo(m), m.especialidad, formatoFecha(m.fechaInicio), formatoFecha(m.fechaFin), r.v.texto, r.total, r.registrados,
            pct(r.registrados, r.total), r.c.registrado, r.c.enDestino, r.c.finalizado, pct(r.c.finalizado, r.recibidos), r.c.devuelto, r.c.alertas,
            NIVELES[r.general].texto, r.checks.filter(x => x.nivel === "critico" || x.nivel === "alerta").map(x => x.detalle).join(" | ")]);
    });
    descargarCsv(`reporte_medidas_${dbSupervision.consejoSeccional}_${hoy()}.csv`, filas);
}

function filasProcesos(lista) {
    const filas = [["Radicado", "Partes", "Medida", "Despacho origen", "Administrador origen", "Despacho destino", "Administrador destino",
                    "Estado procesal", "Estado en la medida", "Alerta", "Fecha de registro", "Fecha de envío", "Último movimiento", "Fecha último movimiento"]];
    lista.forEach(p => {
        const r = rutaDe(p);
        const fecha = t => (p.eventos.find(e => e.tipo === t) || {}).fecha;
        filas.push([p.codigo, p.partes, textoAcuerdo(obtenerMedida(p.medidaId)), p.origen, r && r.adminOrigen ? r.adminOrigen.nombre : "Pendiente",
            p.destino, r && r.adminDestino ? r.adminDestino.nombre : "Pendiente", estadoProcesal(p), ESTADOS[claveEstado(p)].texto, alertaProceso(p),
            formatoFecha(fecha("registro")), formatoFecha(fecha("envio")), EVENTOS[ultimo(p).tipo].titulo, formatoFecha(ultimo(p).fecha)]);
    });
    return filas;
}

function descargarReporteProcesos() {
    descargarCsv(`reporte_procesos_${dbSupervision.consejoSeccional}_${hoy()}.csv`, filasProcesos(procesosFiltrados()));
}

// ---------------------------------------------------------------------
// Inicio
// ---------------------------------------------------------------------
document.addEventListener("keydown", ev => {
    if (ev.key !== "Escape") return;
    const abierto = ["modal-proceso", "modal-medida"].find(id => document.getElementById(id).classList.contains("visible"));
    if (abierto) cerrarModal(abierto);
});

document.addEventListener("DOMContentLoaded", () => {
    llenarFiltros();
    renderizarIndicadores();
    renderizarMedidas();
    renderizarProcesos();
    cambiarReporte("medidas");
});