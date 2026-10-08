// =====================================================================
// RUNPD - Despacho destino: recepción y seguimiento de procesos POR MEDIDA
// Flujo: 1) el administrador selecciona la medida
//        2) ve el detalle de la medida y gestiona sus procesos
// Los procesos llegan directamente del despacho origen. La vigencia es la de la medida.
// Acciones: Actualizar estado · Devolver al despacho origen · Finalizar
// Las notificaciones (devolución y finalización) van SOLO al administrador del
// despacho origen en la medida; no se envían correos a demandantes ni demandados.
// =====================================================================

let filtroActivo = "todos";
let procesoActualId = null;
let medidaActualId = null; // medida seleccionada en el paso 1
let accionDialogo = null;

const DIAS_ALERTA = 7; // la próxima actuación se marca "por vencer" con 7 días o menos

document.addEventListener("DOMContentLoaded", () => {
    if (typeof dbRecepcion === "undefined") {
        console.error("No se encontró la base de datos dbRecepcion.");
        return;
    }
    llenarCatalogos();
    renderizarInfoDespacho();
    llenarSelectorMedida();
    renderizarTodo();
});

document.addEventListener("keydown", e => {
    if (e.key !== "Escape") return;
    const orden = ["modal-dialogo-alerta", "modal-detalle-proceso", "modal-actuacion", "modal-devolver"];
    const abierto = orden.find(id => document.getElementById(id).classList.contains("visible"));
    if (abierto) cerrarModal(abierto);
});

// ---------------------------------------------------------------------
// Utilidades
// ---------------------------------------------------------------------
function esc(valor) {
    return String(valor ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function hoy() {
    const d = new Date();
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

function sumarDias(fechaIso, dias) {
    const d = new Date(fechaIso + "T00:00:00");
    d.setDate(d.getDate() + dias);
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

function nombreParte(p) {
    if (!p) return "";
    if (p.nombre) return p.nombre;
    return [p.primerNombre, p.segundoNombre, p.primerApellido, p.segundoApellido].filter(Boolean).join(" ");
}

function nombresPartes(lista) {
    return (lista || []).map(nombreParte).filter(Boolean).join(", ") || "No especificado";
}

function obtenerMedida(id) {
    return dbRecepcion.medidas.find(m => m.id === Number(id));
}

function textoAcuerdo(m) {
    return m ? `Acuerdo ${m.acuerdo.numero} de ${m.acuerdo.anio}` : "Sin medida";
}

function medidaActual() {
    return obtenerMedida(medidaActualId);
}

function procesosDeMedida(m) {
    return m ? dbRecepcion.procesos.filter(p => p.medidaId === m.id) : [];
}

function autorizadosMedida(m) {
    return m.origenes.reduce((t, o) => t + Number(o.procesos), 0);
}

// Administrador del despacho origen del proceso en su medida (destinatario de las notificaciones)
function adminOrigen(p) {
    const m = obtenerMedida(p.medidaId);
    const o = m ? m.origenes.find(x => x.nombre === p.despachoOrigen) : null;
    return o ? o.administrador : null;
}

function diasRestantesMedida(m) {
    return diasEntre(hoy(), m.fechaFin);
}

function chipMedida(m) {
    return `<span style="display: inline-block; font-size: 0.72rem; font-weight: 700; padding: 0.15rem 0.5rem; border-radius: 12px; background: #e0f2fe; color: #0369a1; white-space: nowrap;">📜 ${esc(m ? `${m.acuerdo.numero} de ${m.acuerdo.anio}` : "Sin medida")}</span>`;
}

function obtenerProceso(id = procesoActualId) {
    return dbRecepcion.procesos.find(p => p.id === Number(id));
}

function ultimaActuacion(p) {
    const lista = p.actuaciones.filter(a => a.tipo === "actuacion");
    return lista.length ? lista[lista.length - 1] : null;
}

function estadoProcesalActual(p) {
    if (p.estado === "finalizado") return `TERMINADO – ${p.formaTerminacion}`;
    const u = ultimaActuacion(p);
    return u ? u.estadoProceso : p.estadoProceso;
}

function cerrarModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove("visible");
}

function abrirModal(modalId) {
    document.getElementById(modalId).classList.add("visible");
}

// Semáforo de cada proceso: qué tan urgente es y qué debe hacer el usuario
function alertaProceso(p) {
    if (p.estado === "finalizado") {
        return { clave: "finalizado", prioridad: 5, texto: "Finalizado", paso: `Terminado el ${formatoFecha(p.fechaFinalizacion)}`, fondo: "#e6f4ea", color: "#166534" };
    }
    if (p.estado === "devuelto") {
        return { clave: "devuelto", prioridad: 6, texto: "Devuelto", paso: `Devuelto al despacho origen el ${formatoFecha(p.devolucion.fecha)}`, fondo: "#edf2f7", color: "#475569" };
    }
    const m = obtenerMedida(p.medidaId);
    if (m && diasRestantesMedida(m) < 0) {
        return { clave: "medida_vencida", prioridad: -1, texto: "Medida finalizada", paso: "Devuelva el proceso al despacho origen", fondo: "#fee2e2", color: "#991b1b" };
    }
    const u = ultimaActuacion(p);
    if (!u) {
        const dias = diasEntre(p.fechaRecepcion, hoy());
        return { clave: "sin_actuacion", prioridad: 1, texto: "Sin actuación", paso: `Registre la primera actuación (recibido hace ${dias} día(s))`, fondo: "#ffedd5", color: "#9a3412" };
    }
    const dias = diasEntre(hoy(), u.proximaActuacion);
    if (dias < 0) {
        return { clave: "vencida", prioridad: 0, texto: `Vencida hace ${-dias} día(s)`, paso: "Actualice el estado del proceso", fondo: "#fee2e2", color: "#991b1b" };
    }
    if (dias <= DIAS_ALERTA) {
        return { clave: "por_vencer", prioridad: 2, texto: dias === 0 ? "Vence hoy" : `Vence en ${dias} día(s)`, paso: "Prepare la próxima actuación", fondo: "#fef3c7", color: "#92400e" };
    }
    return { clave: "al_dia", prioridad: 3, texto: `En ${dias} días`, paso: "Al día", fondo: "#dcfce7", color: "#166534" };
}

function chip(texto, fondo, color) {
    return `<span style="display: inline-block; font-size: 0.72rem; font-weight: 700; padding: 0.2rem 0.55rem; border-radius: 12px; background: ${fondo}; color: ${color}; white-space: nowrap;">${texto}</span>`;
}

// ---------------------------------------------------------------------
// Diálogo propio (en sustitución de alert / confirm)
// ---------------------------------------------------------------------
function configurarDialogo(titulo, mensaje, icono, accion, textoAceptar) {
    document.getElementById("dialogo-titulo").textContent = titulo;
    document.getElementById("dialogo-mensaje").textContent = mensaje;
    document.getElementById("dialogo-icono").textContent = icono;
    document.getElementById("dialogo-btn-cancelar").style.display = accion ? "" : "none";
    document.getElementById("dialogo-btn-aceptar").textContent = accion ? (textoAceptar || "Sí, continuar") : "Entendido";
    accionDialogo = accion;
    abrirModal("modal-dialogo-alerta");
}

function mostrarDialogoAlerta(titulo, mensaje, icono = "✅") {
    configurarDialogo(titulo, mensaje, icono, null);
}

function mostrarDialogoConfirmacion(titulo, mensaje, alAceptar, icono = "⚠️", textoAceptar) {
    configurarDialogo(titulo, mensaje, icono, alAceptar, textoAceptar);
}

function aceptarDialogo() {
    const accion = accionDialogo;
    accionDialogo = null;
    cerrarModal("modal-dialogo-alerta");
    if (accion) accion();
}

// ---------------------------------------------------------------------
// Render general
// ---------------------------------------------------------------------
function renderizarTodo() {
    renderizarResumenMedida();
    if (!medidaActual()) return;
    renderizarAvisoPendientes();
    renderizarIndicadores();
    renderizarTabla();
}

// Encabezado compacto del despacho
function renderizarInfoDespacho() {
    const d = dbRecepcion.despachoActual;
    document.getElementById("texto-despacho").textContent =
        "Seleccione la medida de descongestión, consulte su detalle y gestione los procesos que le enviaron los despachos origen: actualice su estado, devuélvalos al despacho origen o finalícelos.";
    document.getElementById("info-despacho").innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; gap: 1rem; flex-wrap: wrap;">
            <div style="display: flex; align-items: center; gap: 0.85rem;">
                <div style="width: 2.8rem; height: 2.8rem; border-radius: 10px; background: #ffedd5; display: flex; align-items: center; justify-content: center; font-size: 1.4rem;">🗂️</div>
                <div>
                    <div style="font-weight: 700; color: var(--text-main); font-size: 0.95rem;">${esc(d.nombre)}</div>
                    <div style="font-size: 0.8rem; color: var(--text-muted);">Código <span style="font-family: monospace; font-weight: 700; color: var(--primary-green);">${esc(d.codigo)}</span> · Consejo Seccional de ${esc(d.consejoSeccional)}</div>
                </div>
            </div>
            <div style="background: #ede9fe; color: #6d28d9; padding: 0.45rem 0.85rem; border-radius: 6px; font-size: 0.8rem; font-weight: 600;">📊 Supervisa: Consejo Seccional de ${esc(d.consejoSeccional)}</div>
        </div>`;
}

// ---------------------------------------------------------------------
// PASO 1: seleccionar la medida y ver su detalle
// ---------------------------------------------------------------------
function llenarSelectorMedida() {
    const sel = document.getElementById("selector-medida");
    if (!dbRecepcion.medidas.length) {
        sel.innerHTML = `<option value="">Su despacho no tiene medidas de descongestión asignadas</option>`;
        sel.disabled = true;
        return;
    }
    sel.innerHTML = `<option value="" disabled selected>Seleccione una medida...</option>` +
        dbRecepcion.medidas.map(m => {
            const enTramite = procesosDeMedida(m).filter(p => p.estado === "tramite").length;
            return `<option value="${m.id}">${esc(textoAcuerdo(m))} — ${enTramite} proceso(s) en trámite</option>`;
        }).join("");
    if (dbRecepcion.medidas.length === 1) seleccionarMedida(dbRecepcion.medidas[0].id);
}

function seleccionarMedida(id) {
    medidaActualId = Number(id) || null;
    filtroActivo = "todos";
    document.getElementById("selector-medida").value = medidaActualId || "";
    document.getElementById("filtro-busqueda").value = "";
    renderizarTodo();
}

function infoVigenciaMedida(m) {
    const restantes = diasRestantesMedida(m);
    if (hoy() < m.fechaInicio) return { texto: `Inicia el ${formatoFecha(m.fechaInicio)}`, fondo: "#dbeafe", color: "#1d4ed8", barra: "#3b82f6", mensaje: "La medida aún no inicia." };
    if (restantes < 0) return { texto: `Finalizó hace ${-restantes} día(s)`, fondo: "#fee2e2", color: "#991b1b", barra: "#dc2626", mensaje: "Devuelva al despacho origen los procesos que no alcanzó a terminar." };
    if (restantes <= 30) return { texto: `${restantes} días para finalizar`, fondo: "#fee2e2", color: "#991b1b", barra: "#dc2626", mensaje: "Por terminar: priorice los procesos." };
    if (restantes <= 60) return { texto: `${restantes} días para finalizar`, fondo: "#fef3c7", color: "#92400e", barra: "#f59e0b", mensaje: "Planee el cierre de los procesos." };
    return { texto: `${restantes} días para finalizar`, fondo: "#dcfce7", color: "#166534", barra: "var(--primary-green)", mensaje: "Medida vigente." };
}

function renderizarResumenMedida() {
    const cont = document.getElementById("resumen-medida");
    const m = medidaActual();
    document.getElementById("paso-procesos").style.display = m ? "block" : "none";
    if (!m) {
        cont.innerHTML = `<div style="font-size: 0.82rem; color: var(--text-muted);">Seleccione la medida para ver su detalle y gestionar sus procesos.</div>`;
        return;
    }

    const v = infoVigenciaMedida(m);
    const lista = procesosDeMedida(m);
    const total = Math.max(1, diasEntre(m.fechaInicio, m.fechaFin));
    const transcurrido = Math.min(100, Math.max(0, Math.round((diasEntre(m.fechaInicio, hoy()) / total) * 100)));
    const cuenta = estado => lista.filter(p => p.estado === estado).length;
    const cifra = (valor, texto, color) => `
        <div style="text-align: center; padding: 0 0.4rem;">
            <div style="font-size: 1.45rem; font-weight: 800; color: ${color}; line-height: 1;">${valor}</div>
            <div style="font-size: 0.7rem; color: var(--text-muted); margin-top: 0.25rem;">${texto}</div>
        </div>`;
    const tarjeta = (rol, colorBorde, colorFondo, despacho, a, nota) => `
        <div style="flex: 1; min-width: 230px; background: ${colorFondo}; border: 1px solid #e2e8f0; border-left: 4px solid ${colorBorde}; border-radius: 6px; padding: 0.55rem 0.75rem; font-size: 0.78rem;">
            <div style="font-size: 0.66rem; font-weight: 700; color: ${colorBorde}; text-transform: uppercase; letter-spacing: 0.3px;">${rol}</div>
            <div style="font-weight: 700; color: var(--text-main);">${esc(despacho)}</div>
            ${a ? `<div style="margin-top: 0.2rem;">👤 ${esc(a.nombre)}</div>
                   <div style="color: var(--text-muted);">✉️ ${esc(a.correo)} · 📱 ${esc(a.celular)}</div>` : ""}
            ${nota ? `<div style="font-size: 0.7rem; color: var(--text-muted); margin-top: 0.2rem;">${nota}</div>` : ""}
        </div>`;

    cont.innerHTML = `
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 0.9rem 1rem;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; flex-wrap: wrap;">
                <div style="font-size: 0.82rem; line-height: 1.6;">
                    <div><strong>${esc(textoAcuerdo(m))}</strong> ${m.resolucion ? `· Resolución ${esc(m.resolucion.numero)} de ${m.resolucion.anio}` : ""}</div>
                    <div style="color: var(--text-muted);">Vigencia: ${formatoFecha(m.fechaInicio)} al ${formatoFecha(m.fechaFin)}
                        <span style="font-size: 0.7rem; font-weight: 700; padding: 0.1rem 0.45rem; border-radius: 12px; background: ${v.fondo}; color: ${v.color}; margin-left: 0.3rem;">${v.texto}</span></div>
                    ${m.descripcion ? `<div style="color: var(--text-muted);">${esc(m.descripcion)}</div>` : ""}
                </div>
                <div style="display: flex; gap: 0.4rem; border-left: 1px solid #e2e8f0; padding-left: 0.75rem;">
                    ${cifra(autorizadosMedida(m), "Autorizados", "var(--text-main)")}
                    ${cifra(lista.length, "Recibidos", "#0369a1")}
                    ${cifra(cuenta("tramite"), "En trámite", "#b45309")}
                    ${cifra(cuenta("finalizado"), "Finalizados", "var(--primary-green)")}
                    ${cifra(cuenta("devuelto"), "Devueltos", "#991b1b")}
                </div>
            </div>

            <div style="display: flex; align-items: stretch; gap: 0.5rem; flex-wrap: wrap; margin-top: 0.8rem;">
                <div style="display: flex; flex-direction: column; gap: 0.5rem; flex: 1; min-width: 230px;">
                    ${m.origenes.map(o => tarjeta("Despacho origen · envía los procesos", "#0369a1", "#f0f9ff", o.nombre, o.administrador,
                        `${procesosDeMedida(m).filter(p => p.despachoOrigen === o.nombre).length} de ${o.procesos} recibidos · recibe sus notificaciones`)).join("")}
                </div>
                <div style="display: flex; align-items: center; color: var(--primary-green); font-weight: 800; font-size: 1.1rem;">➔</div>
                ${tarjeta("Despacho destino · usted", "#b45309", "#fff7ed", dbRecepcion.despachoActual.nombre, m.administradorDestino, "Único autorizado para gestionar los procesos")}
            </div>

            <div style="height: 6px; background: #e2e8f0; border-radius: 999px; overflow: hidden; margin-top: 0.8rem;">
                <div style="height: 100%; width: ${transcurrido}%; background: ${v.barra};"></div>
            </div>
            <div style="display: flex; justify-content: space-between; gap: 0.5rem; flex-wrap: wrap; font-size: 0.72rem; margin-top: 0.3rem;">
                <span style="color: var(--text-muted);">Avance de la vigencia: ${transcurrido}%</span>
                <span style="color: ${v.color}; font-weight: 600;">${v.mensaje}</span>
            </div>
        </div>`;
}

function contar() {
    const c = { tramite: 0, sin_actuacion: 0, atencion: 0, vencida: 0, por_vencer: 0, medida_vencida: 0, finalizado: 0, devuelto: 0, nuevos: 0 };
    procesosDeMedida(medidaActual()).forEach(p => {
        const a = alertaProceso(p).clave;
        if (p.estado === "tramite") c.tramite++;
        if (p.estado === "tramite" && !p.visto) c.nuevos++;
        if (a === "sin_actuacion") c.sin_actuacion++;
        if (a === "vencida") { c.vencida++; c.atencion++; }
        if (a === "medida_vencida") { c.medida_vencida++; c.atencion++; }
        if (a === "por_vencer") { c.por_vencer++; c.atencion++; }
        if (a === "finalizado") c.finalizado++;
        if (a === "devuelto") c.devuelto++;
    });
    return c;
}

function renderizarAvisoPendientes() {
    const c = contar();
    const aviso = document.getElementById("aviso-pendientes");
    const partes = [];
    if (c.medida_vencida) partes.push(`<strong>${c.medida_vencida}</strong> de una medida ya finalizada (devuélvalos al despacho origen)`);
    if (c.nuevos) partes.push(`<strong>${c.nuevos}</strong> proceso(s) nuevo(s) recibido(s)`);
    if (c.sin_actuacion) partes.push(`<strong>${c.sin_actuacion}</strong> sin actuación registrada`);
    if (c.vencida) partes.push(`<strong>${c.vencida}</strong> con la próxima actuación vencida`);
    if (c.por_vencer) partes.push(`<strong>${c.por_vencer}</strong> por vencer en los próximos ${DIAS_ALERTA} días`);

    if (partes.length === 0) {
        aviso.style.display = "none";
        return;
    }

    aviso.style.display = "flex";
    aviso.innerHTML = `
        <div style="display: flex; align-items: center; gap: 0.75rem;">
            <span style="font-size: 1.6rem;">⚠️</span>
            <div style="font-size: 0.85rem; color: #713f12; line-height: 1.5;">
                <div style="font-weight: 700; font-size: 0.9rem;">Evite el vencimiento de la próxima actuación</div>
                Tiene ${partes.join(", ")}.
            </div>
        </div>
        <button type="button" class="btn-primary-action" style="padding: 0.5rem 1rem; font-size: 0.85rem;" onclick="aplicarFiltro('pendientes')">Ver procesos pendientes ➔</button>`;
}

function renderizarIndicadores() {
    const c = contar();
    const tarjetas = [
        { clave: "tramite",       icono: "📥", valor: c.tramite,       texto: "En trámite",            color: "var(--primary-green)" },
        { clave: "sin_actuacion", icono: "🆕", valor: c.sin_actuacion, texto: "Sin actuación registrada", color: "#ea580c" },
        { clave: "atencion",      icono: "⏰", valor: c.atencion,      texto: "Vencidas o por vencer",  color: "#dc2626" },
        { clave: "finalizado",    icono: "🏁", valor: c.finalizado,    texto: "Finalizados",            color: "#166534" },
        { clave: "devuelto",      icono: "↩",  valor: c.devuelto,      texto: "Devueltos al origen",   color: "#64748b" }
    ];

    document.getElementById("indicadores").innerHTML = tarjetas.map(t => {
        const activo = filtroActivo === t.clave;
        return `
            <button type="button" onclick="aplicarFiltro('${t.clave}')" title="Clic para filtrar"
                style="text-align: left; background: ${activo ? "#f0fdf4" : "#ffffff"}; border: 1px solid ${activo ? "var(--primary-green)" : "#e2e8f0"}; border-top: 4px solid ${t.color}; border-radius: 8px; padding: 0.8rem 1rem; cursor: pointer; box-shadow: ${activo ? "0 0 0 3px #e6f4ea" : "0 1px 3px rgba(0,0,0,0.05)"};">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-size: 1.6rem; font-weight: 800; color: var(--text-main);">${t.valor}</span>
                    <span style="font-size: 1.3rem;">${t.icono}</span>
                </div>
                <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.15rem;">${t.texto}</div>
            </button>`;
    }).join("");
}

function aplicarFiltro(clave) {
    filtroActivo = filtroActivo === clave ? "todos" : clave;
    renderizarIndicadores();
    renderizarTabla();
}

function cumpleFiltro(p) {
    const a = alertaProceso(p).clave;
    switch (filtroActivo) {
        case "tramite":       return p.estado === "tramite";
        case "sin_actuacion": return a === "sin_actuacion";
        case "atencion":      return a === "vencida" || a === "por_vencer" || a === "medida_vencida";
        case "pendientes":    return a === "sin_actuacion" || a === "vencida" || a === "por_vencer" || a === "medida_vencida";
        case "finalizado":    return a === "finalizado";
        case "devuelto":      return a === "devuelto";
        default:              return true;
    }
}

// ---------------------------------------------------------------------
// Tabla
// ---------------------------------------------------------------------
function renderizarTabla() {
    const tbody = document.getElementById("cuerpo-tabla-procesos");
    const q = document.getElementById("filtro-busqueda").value.trim().toLowerCase();

    const nombresFiltro = {
        todos: "todos los procesos", tramite: "procesos en trámite", sin_actuacion: "procesos sin actuación registrada",
        atencion: "procesos con actuación vencida o por vencer", pendientes: "procesos pendientes (sin actuación, vencidos o por vencer)",
        finalizado: "procesos finalizados", devuelto: "procesos devueltos al despacho origen"
    };

    const lista = procesosDeMedida(medidaActual())
        .filter(cumpleFiltro)
        .filter(p => !q || [p.codigo, nombresPartes(p.demandantes), nombresPartes(p.demandados)].join(" ").toLowerCase().includes(q))
        .sort((a, b) => alertaProceso(a).prioridad - alertaProceso(b).prioridad);

    document.getElementById("texto-filtro").innerHTML = `Mostrando <strong>${lista.length}</strong> de ${nombresFiltro[filtroActivo]}` +
        (filtroActivo !== "todos" ? ` · <a href="#" onclick="aplicarFiltro('${filtroActivo}'); return false;" style="color: var(--primary-green); font-weight: 600;">Ver todos</a>` : "");

    if (lista.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 2rem;">
            ${procesosDeMedida(medidaActual()).length ? "No hay procesos que coincidan con el filtro seleccionado." : "Aún no ha recibido procesos en esta medida."}</td></tr>`;
        return;
    }

    tbody.innerHTML = lista.map(p => {
        const alerta = alertaProceso(p);
        const u = ultimaActuacion(p);
        const enTramite = p.estado === "tramite";
        const nuevo = enTramite && !p.visto;

        const acciones = enTramite ? `
            <div class="action-buttons" style="flex-direction: column; align-items: stretch;">
                <button class="btn-action edit" style="white-space: nowrap;" onclick="abrirActuacion(${p.id}, 'actualizar')" title="Registrar una nueva actuación">✏️ Actualizar</button>
                <button class="btn-action inactivate" style="white-space: nowrap;" onclick="abrirDevolver(${p.id})" title="Devolver al despacho origen">↩ Devolver al origen</button>
                <button class="btn-action edit" style="white-space: nowrap;" onclick="abrirActuacion(${p.id}, 'finalizar')" title="Registrar la terminación del proceso">🏁 Finalizar</button>
            </div>`
            : `<button class="btn-action edit" onclick="verDetalle(${p.id})">👁️ Ver detalle</button>`;

        return `
            <tr style="${nuevo ? "background: #f0fdf4;" : ""}">
                <td>
                    <a href="#" onclick="verDetalle(${p.id}); return false;" title="Ver detalle y trazabilidad" style="font-family: monospace; font-weight: 600; color: var(--primary-green);">${esc(p.codigo)}</a>
                    ${nuevo ? `<br>${chip("🆕 NUEVO", "#dcfce7", "#166534")}` : ""}
                </td>
                <td style="font-size: 0.8rem; min-width: 190px;">
                    <div><span style="color: var(--text-muted); font-weight: 600; font-size: 0.72rem;">Dte.</span> ${esc(nombresPartes(p.demandantes))}</div>
                    <div><span style="color: var(--text-muted); font-weight: 600; font-size: 0.72rem;">Ddo.</span> ${esc(nombresPartes(p.demandados))}</div>
                </td>
                <td style="font-size: 0.8rem; min-width: 200px;">
                    <div>${esc(p.despachoOrigen)}</div>
                    <span style="color: var(--text-muted);">Recibido: ${formatoFecha(p.fechaRecepcion)}</span>
                </td>
                <td style="font-size: 0.8rem;">
                    <strong>${esc(estadoProcesalActual(p))}</strong><br>
                    <span style="color: var(--text-muted);">${u ? `Última actuación: ${formatoFecha(u.fecha)}` : (enTramite ? "Sin actuaciones en este despacho" : "")}</span>
                </td>
                <td style="font-size: 0.8rem;">
                    ${u && enTramite ? `<div style="margin-bottom: 0.25rem;">${formatoFecha(u.proximaActuacion)}</div>` : ""}
                    ${chip(alerta.texto, alerta.fondo, alerta.color)}
                    <div style="color: ${alerta.color}; font-size: 0.72rem; margin-top: 0.25rem;">${esc(alerta.paso)}</div>
                </td>
                <td>${acciones}</td>
            </tr>`;
    }).join("");
}

// ---------------------------------------------------------------------
// Catálogos
// ---------------------------------------------------------------------
function llenarCatalogos() {
    const cat = dbRecepcion.catalogos;
    document.getElementById("act-estado").innerHTML =
        `<option value="" disabled selected>Seleccione una opción...</option>` +
        `<optgroup label="Continuar el trámite">${cat.estadosProceso.map(e => `<option value="${esc(e)}">${esc(e)}</option>`).join("")}</optgroup>` +
        `<optgroup label="Cerrar el proceso"><option value="${cat.estadoFinal}">🏁 ${cat.estadoFinal} (finalizar proceso)</option></optgroup>`;

    document.getElementById("act-forma").innerHTML =
        `<option value="" disabled selected>Seleccione una opción...</option>` +
        cat.formasTerminacion.map(f => `<option value="${esc(f)}">${esc(f)}</option>`).join("");

    document.getElementById("dev-motivos").innerHTML = cat.motivosDevolucion.map(m => `
        <label style="display: flex; gap: 0.6rem; align-items: flex-start; border: 1px solid #e2e8f0; border-radius: 6px; padding: 0.65rem 0.75rem; cursor: pointer; background: #ffffff;">
            <input type="radio" name="dev-motivo" value="${esc(m.label)}" required style="margin-top: 0.2rem;">
            <span style="font-size: 0.82rem;">
                <strong style="color: var(--text-main);">${esc(m.label)}</strong><br>
                <span style="color: var(--text-muted);">${esc(m.descripcion)}</span>
            </span>
        </label>`).join("");
}

function resumenProceso(p) {
    const u = ultimaActuacion(p);
    return `
        <div style="display: flex; justify-content: space-between; gap: 0.5rem; flex-wrap: wrap;">
            <strong style="font-family: monospace; color: #166534;">Cod: ${esc(p.codigo)}</strong>
            <span style="color: var(--text-muted);">${esc(textoAcuerdo(obtenerMedida(p.medidaId)))} · Recibido el ${formatoFecha(p.fechaRecepcion)} de ${esc(p.despachoOrigen)}</span>
        </div>
        <div style="color: #475569; margin-top: 0.25rem;">${esc(nombresPartes(p.demandantes))} <em>c/</em> ${esc(nombresPartes(p.demandados))}</div>
        <div style="margin-top: 0.25rem;"><strong>Estado actual:</strong> ${esc(estadoProcesalActual(p))}
            ${u ? ` · <strong>Última actuación:</strong> ${formatoFecha(u.fecha)} · <strong>Próxima:</strong> ${formatoFecha(u.proximaActuacion)}` : " · <em>Sin actuaciones registradas en este despacho</em>"}
        </div>`;
}

// ---------------------------------------------------------------------
// Actualizar estado / Finalizar
// ---------------------------------------------------------------------
function abrirActuacion(id, modo) {
    const p = obtenerProceso(id);
    if (!p || p.estado !== "tramite") return;
    procesoActualId = p.id;
    p.visto = true;

    document.getElementById("form-actuacion").reset();
    document.getElementById("act-resumen").innerHTML = resumenProceso(p);

    // La fecha de la actuación no puede ser anterior a la recepción ni a la última actuación, ni futura
    const u = ultimaActuacion(p);
    const minimo = u && u.fecha > p.fechaRecepcion ? u.fecha : p.fechaRecepcion;
    const fecha = document.getElementById("act-fecha");
    fecha.min = minimo;
    fecha.max = hoy();
    fecha.value = hoy() >= minimo ? hoy() : minimo;

    document.getElementById("act-estado").value = modo === "finalizar" ? dbRecepcion.catalogos.estadoFinal : "";
    cambiarModoActuacion();
    validarFechas();
    renderizarTodo();
    abrirModal("modal-actuacion");
}

function esModoFinalizar() {
    return document.getElementById("act-estado").value === dbRecepcion.catalogos.estadoFinal;
}

function cambiarModoActuacion() {
    const finalizar = esModoFinalizar();
    const forma = document.getElementById("act-forma");
    const proxima = document.getElementById("act-proxima");

    document.getElementById("grupo-forma").style.display = finalizar ? "" : "none";
    document.getElementById("grupo-proxima").style.display = finalizar ? "none" : "";
    forma.required = finalizar;
    proxima.required = !finalizar;

    document.getElementById("act-aviso-final").style.display = finalizar ? "block" : "none";
    const pFin = obtenerProceso();
    const aFin = pFin ? adminOrigen(pFin) : null;
    document.getElementById("act-aviso-final-destino").innerHTML = aFin
        ? `<br>✉️ Se notificará <strong>solo al administrador del despacho origen</strong>: ${esc(aFin.nombre)} (${esc(aFin.correo)}). No se envía correo a demandantes ni demandados.`
        : "";
    document.getElementById("act-titulo").textContent = finalizar ? "🏁 Finalizar proceso" : "✏️ Actualizar estado del proceso";
    document.getElementById("act-btn-guardar").textContent = finalizar ? "🏁 Finalizar proceso" : "💾 Registrar actuación";
    document.querySelector('label[for="act-observacion"]').textContent = finalizar ? "Observación de la terminación (opcional)" : "Observación (opcional)";
    document.getElementById("act-observacion").placeholder = finalizar ? "Ej: sentencia favorable al demandante" : "Describa brevemente la actuación realizada";
    if (finalizar) sugerirFormaTerminacion();
    validarFechas();
}

// Preselecciona la forma de terminación según el último estado registrado del proceso
function sugerirFormaTerminacion() {
    const p = obtenerProceso();
    const forma = document.getElementById("act-forma");

    // Texto de ayuda debajo del select (se crea una sola vez)
    let ayuda = document.getElementById("act-forma-ayuda");
    if (!ayuda) {
        ayuda = document.createElement("div");
        ayuda.id = "act-forma-ayuda";
        ayuda.style.cssText = "font-size: 0.75rem; margin-top: 0.35rem;";
        forma.insertAdjacentElement("afterend", ayuda);
    }

    const ultima = p ? ultimaActuacion(p) : null;
    const estado = ultima ? ultima.estadoProceso : "";
    const sugerida = (dbRecepcion.catalogos.formaSugeridaPorEstado || {})[estado];

    if (sugerida) {
        if (!forma.value) forma.value = sugerida;
        ayuda.style.color = "var(--primary-green)";
        ayuda.textContent = `✔ Sugerida según el último estado ("${estado}"). Puede cambiarla.`;
    } else if (estado === "Auto que decreta terminación") {
        ayuda.style.color = "#b45309";
        ayuda.textContent = "Indique la causa de la terminación que decretó el auto.";
    } else {
        ayuda.textContent = "";
    }
}

function validarFechas() {
    const fecha = document.getElementById("act-fecha").value;
    const proxima = document.getElementById("act-proxima");
    const aviso = document.getElementById("act-aviso-medida");
    const p = obtenerProceso();
    const medida = p ? obtenerMedida(p.medidaId) : null;
    const finMedida = medida ? medida.fechaFin : "9999-12-31";

    if (fecha) proxima.min = sumarDias(fecha, 1);

    if (!esModoFinalizar() && proxima.value && proxima.value > finMedida) {
        aviso.innerHTML = `⚠️ La próxima actuación (${formatoFecha(proxima.value)}) queda <strong>después del fin de la medida</strong> ${esc(textoAcuerdo(medida))} (${formatoFecha(finMedida)}). Si no alcanza a finalizar el proceso, considere <strong>devolverlo al despacho origen</strong>.`;
        aviso.style.display = "block";
    } else {
        aviso.style.display = "none";
    }
}

function guardarActuacion(event) {
    event.preventDefault();
    const p = obtenerProceso();
    if (!p) return;

    const finalizar = esModoFinalizar();
    const fecha = document.getElementById("act-fecha").value;
    const proxima = document.getElementById("act-proxima").value;
    const observacion = document.getElementById("act-observacion").value.trim();

    if (!finalizar && proxima <= fecha) {
        mostrarDialogoAlerta("Revise las fechas", "La próxima actuación debe ser posterior a la fecha de la actuación.", "⚠️");
        return;
    }

    if (finalizar) {
        const forma = document.getElementById("act-forma").value;
        mostrarDialogoConfirmacion(
            "¿Finalizar el proceso?",
            `El proceso ${p.codigo} quedará terminado por "${forma}" con fecha ${formatoFecha(fecha)}. No podrá registrar más actuaciones.`,
            () => {
                p.actuaciones.push({ tipo: "finalizacion", fecha, estadoProceso: `TERMINADO – ${forma}`, proximaActuacion: "", observacion });
                p.estado = "finalizado";
                p.fechaFinalizacion = fecha;
                p.formaTerminacion = forma;
                cerrarModal("modal-actuacion");
                renderizarTodo();

                // Notificación SOLO al administrador del despacho origen (no a las partes)
                const ventana = abrirCorreoFinalizacion(p, { fecha, forma, observacion });
                const a = adminOrigen(p);

                let mensaje = `El proceso ${p.codigo} quedó registrado como terminado y se notificó a ${a ? `${a.nombre}, administrador(a) de ${p.despachoOrigen}` : p.despachoOrigen}.`;
                if (!ventana) mensaje += " El navegador bloqueó la ventana del correo: permita las ventanas emergentes para este sitio.";
                mostrarDialogoAlerta("Proceso finalizado", mensaje, "🏁");
            },
            "🏁",
            "Sí, finalizar"
        );
        return;
    }

    const estado = document.getElementById("act-estado").value;
    p.actuaciones.push({ tipo: "actuacion", fecha, estadoProceso: estado, proximaActuacion: proxima, observacion });
    cerrarModal("modal-actuacion");
    renderizarTodo();
    mostrarDialogoAlerta("Actuación registrada", `Proceso ${p.codigo}: "${estado}". Próxima actuación estimada: ${formatoFecha(proxima)}.`);
}

// Arma los datos del correo (destinatario: administrador del despacho origen) y lo abre en una pestaña nueva
function abrirCorreoFinalizacion(p, { fecha, forma, observacion }) {
    const d = dbRecepcion.despachoActual;
    const m = obtenerMedida(p.medidaId);

    const payloadCorreo = {
        consejoSeccional: d.consejoSeccional,
        despacho: { nombre: d.nombre, codigo: d.codigo, administrador: m.administradorDestino },
        destinatario: { despacho: p.despachoOrigen, administrador: adminOrigen(p) },
        medida: textoAcuerdo(obtenerMedida(p.medidaId)),
        fechaTerminacion: fecha,
        formaTerminacion: forma,
        observacion,
        proceso: {
            codigo: p.codigo,
            fechaRecepcion: p.fechaRecepcion,
            link: p.link,
            demandantes: p.demandantes.map(nombreParte),
            demandados: p.demandados.map(nombreParte),
            actuaciones: p.actuaciones
                .filter(a => a.tipo === "actuacion")
                .map(a => ({ fecha: a.fecha, estadoProceso: a.estadoProceso }))
        }
    };

    const url = `email_finalizacion_despacho_descongestion.html?data=${encodeURIComponent(JSON.stringify(payloadCorreo))}`;
    return window.open(url, "_blank");
}

// ---------------------------------------------------------------------
// Devolver al despacho origen
// ---------------------------------------------------------------------
function abrirDevolver(id) {
    const p = obtenerProceso(id);
    if (!p || p.estado !== "tramite") return;
    procesoActualId = p.id;
    p.visto = true;

    document.getElementById("form-devolver").reset();
    document.getElementById("dev-resumen").innerHTML = resumenProceso(p);
    const a = adminOrigen(p);
    document.getElementById("dev-destino").innerHTML =
        `ℹ️ El proceso regresará al despacho origen <strong>${esc(p.despachoOrigen)}</strong> y saldrá de su inventario. ` +
        (a ? `Se notificará a su administrador(a) <strong>${esc(a.nombre)}</strong> (${esc(a.correo)}).` : "");
    renderizarTodo();
    abrirModal("modal-devolver");
}

function guardarDevolucion(event) {
    event.preventDefault();
    const p = obtenerProceso();
    if (!p) return;

    const motivo = document.querySelector('input[name="dev-motivo"]:checked').value;
    const observacion = document.getElementById("dev-observacion").value.trim();

    mostrarDialogoConfirmacion(
        "¿Devolver el proceso?",
        `El proceso ${p.codigo} será devuelto a ${p.despachoOrigen} por: ${motivo}.`,
        () => {
            const fecha = hoy();
            // Datos del estado procesal ANTES de marcarlo como devuelto
            const estadoProcesal = estadoProcesalActual(p);
            const ultima = ultimaActuacion(p);

            p.estado = "devuelto";
            p.devolucion = { fecha, motivo, observacion };
            p.actuaciones.push({ tipo: "devolucion", fecha, estadoProceso: `Devuelto al despacho origen – ${motivo}`, proximaActuacion: "", observacion });
            cerrarModal("modal-devolver");
            renderizarTodo();

            // Notificación al administrador del despacho origen
            const ventana = abrirCorreoDevolucion(p, { fecha, motivo, observacion, estadoProcesal, ultima });
            const a = adminOrigen(p);

            let mensaje = `El proceso ${p.codigo} fue devuelto a ${p.despachoOrigen} y se notificó a ${a ? a.nombre : "su administrador"}.`;
            if (!ventana) mensaje += " El navegador bloqueó la ventana del correo: permita las ventanas emergentes para este sitio.";
            mostrarDialogoAlerta("Proceso devuelto", mensaje, "↩");
        },
        "↩",
        "Sí, devolver"
    );
}

// Arma los datos del correo (destinatario: administrador del despacho origen) y lo abre en una pestaña nueva
function abrirCorreoDevolucion(p, { fecha, motivo, observacion, estadoProcesal, ultima }) {
    const d = dbRecepcion.despachoActual;
    const infoMotivo = dbRecepcion.catalogos.motivosDevolucion.find(m => m.label === motivo);
    const m = obtenerMedida(p.medidaId);

    const payloadCorreo = {
        consejoSeccional: d.consejoSeccional,
        despacho: { nombre: d.nombre, codigo: d.codigo, administrador: m.administradorDestino },
        destinatario: { despacho: p.despachoOrigen, administrador: adminOrigen(p) },
        medida: textoAcuerdo(obtenerMedida(p.medidaId)),
        fechaDevolucion: fecha,
        motivo,
        motivoDescripcion: infoMotivo ? infoMotivo.descripcion : "",
        observacion,
        proceso: {
            codigo: p.codigo,
            despachoOrigen: p.despachoOrigen,
            fechaRecepcion: p.fechaRecepcion,
            estadoProcesal,
            fechaUltimaActuacion: ultima ? ultima.fecha : p.fechaActuacion,
            link: p.link,
            demandantes: p.demandantes.map(nombreParte),
            demandados: p.demandados.map(nombreParte),
            // Solo las actuaciones registradas en este despacho (sin la devolución)
            actuaciones: p.actuaciones
                .filter(a => a.tipo === "actuacion")
                .map(a => ({ fecha: a.fecha, estadoProceso: a.estadoProceso, observacion: a.observacion }))
        }
    };

    const url = `email_devolucion_despacho_descongestion.html?data=${encodeURIComponent(JSON.stringify(payloadCorreo))}`;
    return window.open(url, "_blank");
}

// ---------------------------------------------------------------------
// Detalle y trazabilidad
// ---------------------------------------------------------------------
function verDetalle(id) {
    const p = obtenerProceso(id);
    if (!p) return;
    procesoActualId = p.id;
    p.visto = true;

    const alerta = alertaProceso(p);
    const listaPartes = lista => `<ul style="margin: 0.25rem 0 0.5rem 1.2rem;">${(lista || []).map(x =>
        `<li>${x.tipo === "juridica" ? "🏢" : "👤"} ${esc(nombreParte(x))}${x.correo ? ` <span style="color: #64748b;">(${esc(x.correo)})</span>` : ""}</li>`).join("")}</ul>`;

    // Línea de tiempo: recepción + actuaciones + finalización/devolución
    const iconos = { actuacion: "✏️", finalizacion: "🏁", devolucion: "↩" };
    const eventos = [
        { icono: "📥", fecha: p.fechaRecepcion, titulo: "Proceso recibido del despacho origen", detalle: `${textoAcuerdo(obtenerMedida(p.medidaId))} · Origen: ${p.despachoOrigen} · Estado al recibir: ${p.estadoProceso}` },
        ...p.actuaciones.map(a => ({
            icono: iconos[a.tipo],
            fecha: a.fecha,
            titulo: a.estadoProceso,
            detalle: [a.proximaActuacion ? `Próxima actuación: ${formatoFecha(a.proximaActuacion)}` : "", a.observacion].filter(Boolean).join(" · ")
        }))
    ];

    document.getElementById("contenido-detalle-proceso").innerHTML = `
        <div style="background: #f8fafc; padding: 1rem; border-radius: 6px; border: 1px solid #e2e8f0;">
            <div style="display: flex; justify-content: space-between; align-items: center; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 0.5rem;">
                <span style="font-family: monospace; color: #166534; font-weight: 700;">${esc(p.codigo)}</span>
                ${chip(alerta.texto, alerta.fondo, alerta.color)}
            </div>
            <p style="margin: 0 0 0.3rem 0;"><strong>Estado procesal actual:</strong> ${esc(estadoProcesalActual(p))}</p>
            <p style="margin: 0 0 0.3rem 0;"><strong>Medida de descongestión:</strong> ${esc(textoAcuerdo(obtenerMedida(p.medidaId)))} (vigencia ${formatoFecha(obtenerMedida(p.medidaId).fechaInicio)} al ${formatoFecha(obtenerMedida(p.medidaId).fechaFin)})</p>
            <p style="margin: 0 0 0.3rem 0;"><strong>Despacho de origen:</strong> ${esc(p.despachoOrigen)}${adminOrigen(p) ? ` · Administrador(a): ${esc(adminOrigen(p).nombre)}` : ""}</p>
            <p style="margin: 0 0 0.3rem 0;"><strong>Última actuación en origen:</strong> ${formatoFecha(p.fechaActuacion)}</p>
            <hr style="border: 0; border-top: 1px solid #cbd5e1; margin: 0.6rem 0;">
            <p style="margin: 0;"><strong>Demandante(s):</strong></p>${listaPartes(p.demandantes)}
            <p style="margin: 0;"><strong>Demandado(s):</strong></p>${listaPartes(p.demandados)}
            <p style="margin: 0;"><strong>Observaciones del despacho de origen:</strong> ${esc(p.observaciones || "Sin observaciones registradas.")}</p>
            ${p.link ? `<p style="margin: 0.5rem 0 0 0;"><a href="${esc(p.link)}" target="_blank" rel="noopener" style="color: #0284c7; text-decoration: underline; font-weight: 600;">🔗 Ver expediente en línea (Rama Judicial)</a></p>` : ""}
        </div>

        <div style="font-size: 0.85rem; font-weight: 600; color: var(--primary-green); margin: 1rem 0 0.5rem;">🕒 Trazabilidad en este despacho</div>
        <div style="border-left: 3px solid #cbd5e1; margin-left: 0.6rem; padding-left: 1rem;">
            ${eventos.map(ev => `
                <div style="position: relative; margin-bottom: 0.75rem;">
                    <span style="position: absolute; left: -1.75rem; top: 0; background: #ffffff; font-size: 0.9rem;">${ev.icono}</span>
                    <div style="font-size: 0.75rem; color: var(--text-muted);">${formatoFecha(ev.fecha)}</div>
                    <div style="font-weight: 600; font-size: 0.83rem;">${esc(ev.titulo)}</div>
                    ${ev.detalle ? `<div style="font-size: 0.78rem; color: #475569;">${esc(ev.detalle)}</div>` : ""}
                </div>`).join("")}
        </div>`;

    // Acciones directas desde el detalle
    document.getElementById("detalle-acciones").innerHTML = p.estado === "tramite" ? `
        <button type="button" class="btn btn-secondary" onclick="cerrarModal('modal-detalle-proceso'); abrirDevolver(${p.id});">↩ Devolver al origen</button>
        <button type="button" class="btn btn-secondary" onclick="cerrarModal('modal-detalle-proceso'); abrirActuacion(${p.id}, 'finalizar');">🏁 Finalizar</button>
        <button type="button" class="btn-primary-action" onclick="cerrarModal('modal-detalle-proceso'); abrirActuacion(${p.id}, 'actualizar');">✏️ Actualizar estado</button>`
        : `<button type="button" class="btn-primary-action" onclick="cerrarModal('modal-detalle-proceso')">Cerrar</button>`;

    renderizarTodo();
    abrirModal("modal-detalle-proceso");
}