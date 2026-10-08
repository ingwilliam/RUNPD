// =====================================================================
// RUNPD - Materialización de Medidas de Descongestión (Consejo Seccional)
// Solo el Consejo Seccional materializa medidas, con base en el Acuerdo del
// Consejo Superior de la Judicatura. Cada medida tiene: acuerdo (número, año, PDF),
// vigencia, resolución de creación de cargos OPCIONAL, plan de distribución
// (despacho origen → despacho destino → número de procesos) y el Administrador
// de cada despacho origen y destino (único autorizado en la medida).
// Datos: js/data.js (dbDatos) + js/data_medidas.js (dbMedidas). Sin localStorage.
// =====================================================================

let filtroKpi = "todos";
let accionDialogo = null;
let borrador = null; // medida que se está creando o editando

// Agrega los despachos de ejemplo a la lista general (sin modificar data.js)
[...dbMedidas.despachosPermanentesEjemplo, ...(dbMedidas.despachosDescongestionEjemplo || [])].forEach(p => {
    if (!dbDatos.despachos.some(d => d.codigoDespacho === p.codigoDespacho)) dbDatos.despachos.push(p);
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

function diasEntre(desde, hasta) {
    return Math.round((new Date(hasta + "T00:00:00") - new Date(desde + "T00:00:00")) / 86400000);
}

function formatoFecha(iso) {
    if (!iso) return "—";
    const [a, m, d] = iso.split("-");
    return `${d}/${m}/${a}`;
}

function normalizar(texto) {
    return String(texto || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

function chip(texto, fondo, color) {
    return `<span style="display: inline-block; font-size: 0.72rem; font-weight: 700; padding: 0.15rem 0.5rem; border-radius: 12px; background: ${fondo}; color: ${color}; white-space: nowrap;">${texto}</span>`;
}

function despacho(id) {
    return dbDatos.despachos.find(d => d.id === Number(id));
}

function nombreDespacho(id) {
    const d = despacho(id);
    return d ? d.nombreDespacho : "—";
}

function textoAcuerdo(m) {
    return `Acuerdo ${m.acuerdo.numero} de ${m.acuerdo.anio}`;
}

function textoResolucion(r) {
    return r ? `Resolución ${r.numero} de ${r.anio}` : "";
}

const CONSEJO = dbMedidas.consejoActual;
const DOMINIO_INSTITUCIONAL = "@cendoj.ramajudicial.gov.co";

function nombreAdmin(a) {
    return a ? [a.primerNombre, a.segundoNombre, a.primerApellido, a.segundoApellido].filter(Boolean).join(" ") : "";
}

// Despachos de la medida con su rol (origen / destino), sin repetir
function despachosConRol(distribuciones) {
    const lista = [];
    distribuciones.forEach(r => {
        [["origenId", "Origen"], ["destinoId", "Destino"]].forEach(([campo, rol]) => {
            const id = Number(r[campo]);
            if (!id) return;
            const ya = lista.find(x => x.id === id);
            if (ya) { if (!ya.roles.includes(rol)) ya.roles.push(rol); }
            else lista.push({ id, roles: [rol] });
        });
    });
    return lista;
}

function adminCompleto(a) {
    return !!(a && a.primerNombre && a.primerApellido && a.correo && a.celular && a.password);
}

function conteoAdmins(m) {
    const despachos = despachosConRol(m.distribuciones);
    return { total: despachos.length, registrados: despachos.filter(d => adminCompleto((m.administradores || {})[d.id])).length };
}

function totalPlaneado(m) {
    return m.distribuciones.reduce((t, r) => t + Number(r.procesos || 0), 0);
}

function totalTrasladado(m) {
    return m.distribuciones.reduce((t, r) => t + Number(r.trasladados || 0), 0);
}

function cerrarModal(id) { document.getElementById(id).classList.remove("visible"); }
function abrirModal(id) { document.getElementById(id).classList.add("visible"); }

// Estado de la vigencia de la medida
function infoVigencia(m) {
    const actual = hoy();
    if (!m.fechaInicio || !m.fechaFin) return { clave: "sin_fecha", texto: "Sin vigencia", fondo: "#edf2f7", color: "#475569" };
    if (actual < m.fechaInicio) return { clave: "futura", texto: `Inicia en ${diasEntre(actual, m.fechaInicio)} día(s)`, fondo: "#dbeafe", color: "#1d4ed8" };
    const dias = diasEntre(actual, m.fechaFin);
    if (dias < 0)   return { clave: "vencida",    texto: `Vencida hace ${-dias} día(s)`, fondo: "#fee2e2", color: "#991b1b" };
    if (dias <= 30) return { clave: "por_vencer", texto: dias === 0 ? "Vence hoy" : `Vence en ${dias} día(s)`, fondo: "#fee2e2", color: "#991b1b" };
    if (dias <= 60) return { clave: "por_vencer", texto: `Vence en ${dias} días`, fondo: "#fef3c7", color: "#92400e" };
    return { clave: "vigente", texto: `Vigente · ${dias} días restantes`, fondo: "#dcfce7", color: "#166534" };
}

// Barra de avance trasladados / planeados
function barraAvance(trasladados, planeados) {
    const pct = planeados ? Math.min(100, Math.round((trasladados / planeados) * 100)) : 0;
    const color = pct >= 100 ? "var(--primary-green)" : pct > 0 ? "#0ea5e9" : "#cbd5e1";
    return `
        <div style="height: 8px; background: #edf2f7; border-radius: 999px; overflow: hidden; margin-top: 0.3rem;">
            <div style="width: ${pct}%; height: 100%; background: ${color};"></div>
        </div>
        <div style="font-size: 0.7rem; color: var(--text-muted); margin-top: 0.2rem;">${trasladados} de ${planeados} trasladados (${pct}%)</div>`;
}

// ---------------------------------------------------------------------
// Diálogo propio (en sustitución de alert / confirm)
// ---------------------------------------------------------------------
function configurarDialogo(titulo, mensaje, icono, accion, textoAceptar, textoCancelar) {
    document.getElementById("dialogo-titulo").textContent = titulo;
    document.getElementById("dialogo-mensaje").textContent = mensaje;
    document.getElementById("dialogo-icono").textContent = icono;
    const cancelar = document.getElementById("dialogo-btn-cancelar");
    cancelar.style.display = accion ? "" : "none";
    cancelar.textContent = textoCancelar || "Cancelar";
    document.getElementById("dialogo-btn-aceptar").textContent = accion ? (textoAceptar || "Sí, continuar") : "Entendido";
    accionDialogo = accion;
    abrirModal("modal-dialogo-alerta");
}

function mostrarDialogoAlerta(titulo, mensaje, icono = "✅") {
    configurarDialogo(titulo, mensaje, icono, null);
}

function mostrarDialogoConfirmacion(titulo, mensaje, alAceptar, icono = "⚠️", textoAceptar, textoCancelar) {
    configurarDialogo(titulo, mensaje, icono, alAceptar, textoAceptar, textoCancelar);
}

function aceptarDialogo() {
    const accion = accionDialogo;
    accionDialogo = null;
    cerrarModal("modal-dialogo-alerta");
    if (accion) accion();
}

// ---------------------------------------------------------------------
// Indicadores y filtros
// ---------------------------------------------------------------------
function renderizarIndicadores() {
    const lista = dbMedidas.medidas;
    const cuenta = clave => lista.filter(m => infoVigencia(m).clave === clave).length;
    const planeados = lista.reduce((t, m) => t + totalPlaneado(m), 0);
    const trasladados = lista.reduce((t, m) => t + totalTrasladado(m), 0);

    const tarjetas = [
        { clave: "todos",      icono: "📜", valor: lista.length,         texto: "Medidas registradas",            color: "var(--primary-green)" },
        { clave: "sin_admin",  icono: "👤", valor: lista.filter(m => { const c = conteoAdmins(m); return c.registrados < c.total; }).length, texto: "Con administradores pendientes", color: "#dc2626" },
        { clave: "vigente",    icono: "✅", valor: cuenta("vigente"),    texto: "Vigentes",                       color: "#16a34a" },
        { clave: "por_vencer", icono: "⏰", valor: cuenta("por_vencer"), texto: "Por vencer (≤ 60 días)",         color: "#f59e0b" },
        { clave: "sin_notificar", icono: "✉️", valor: lista.filter(m => !m.notificacion).length, texto: "Sin notificar a los despachos", color: "#b45309" },
        { clave: "",           icono: "📤", valor: `${planeados ? Math.round((trasladados / planeados) * 100) : 0}%`, texto: `Avance de traslado (${trasladados} de ${planeados})`, color: "#1e3a8a" }
    ];

    document.getElementById("indicadores").innerHTML = tarjetas.map(t => {
        const activo = t.clave && t.clave !== "todos" && filtroKpi === t.clave;
        const clic = t.clave ? `onclick="aplicarFiltroKpi('${t.clave}')" title="Clic para filtrar" style="cursor: pointer;` : `style="cursor: default;`;
        return `
            <button type="button" ${clic} text-align: left; background: ${activo ? "#f0fdf4" : "#ffffff"}; border: 1px solid ${activo ? "var(--primary-green)" : "#e2e8f0"}; border-top: 4px solid ${t.color}; border-radius: 8px; padding: 0.8rem 1rem; box-shadow: ${activo ? "0 0 0 3px #e6f4ea" : "0 1px 3px rgba(0,0,0,0.05)"};">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-size: 1.6rem; font-weight: 800; color: var(--text-main);">${t.valor}</span>
                    <span style="font-size: 1.3rem;">${t.icono}</span>
                </div>
                <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.15rem; text-align: left;">${t.texto}</div>
            </button>`;
    }).join("");
}

function aplicarFiltroKpi(clave) {
    filtroKpi = filtroKpi === clave ? "todos" : clave;
    document.getElementById("filtro-vigencia").value = "";
    renderizarTabla();
}

function llenarFiltros() {
    // El Consejo Seccional solo ve sus medidas: no hay filtros de entidad
}

function limpiarFiltros() {
    ["filtro-busqueda", "filtro-vigencia"].forEach(id => document.getElementById(id).value = "");
    filtroKpi = "todos";
    renderizarTabla();
}

function cumpleFiltros(m) {
    const q = normalizar(document.getElementById("filtro-busqueda").value);
    const vigencia = document.getElementById("filtro-vigencia").value;
    const clave = infoVigencia(m).clave;

    if (m.consejoseccional !== CONSEJO) return false;
    if (vigencia && clave !== vigencia) return false;
    if (filtroKpi === "sin_notificar") { if (m.notificacion) return false; }
    else if (filtroKpi === "sin_admin") { const c = conteoAdmins(m); if (c.registrados >= c.total) return false; }
    else if (filtroKpi !== "todos" && clave !== filtroKpi) return false;
    if (!q) return true;

    const texto = [m.acuerdo.numero, m.descripcion, m.resolucion ? m.resolucion.numero : "",
        ...m.distribuciones.map(r => `${nombreDespacho(r.origenId)} ${nombreDespacho(r.destinoId)}`),
        ...Object.values(m.administradores || {}).map(a => `${nombreAdmin(a)} ${a.correo}`)].join(" ");
    return normalizar(texto).includes(q);
}

// ---------------------------------------------------------------------
// Tabla de medidas
// ---------------------------------------------------------------------
function renderizarTabla() {
    renderizarIndicadores();
    const tbody = document.getElementById("cuerpo-tabla");
    const propias = dbMedidas.medidas.filter(m => m.consejoseccional === CONSEJO);
    const lista = propias.filter(cumpleFiltros).sort((a, b) => b.fechaInicio.localeCompare(a.fechaInicio));

    document.getElementById("texto-filtro").innerHTML = `Mostrando <strong>${lista.length}</strong> de ${propias.length} medida(s) del Consejo Seccional de ${CONSEJO}`;

    if (!lista.length) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 2rem;">
            No hay medidas con los filtros seleccionados. <a href="#" onclick="limpiarFiltros(); return false;" style="color: var(--primary-green); font-weight: 600;">Limpiar filtros</a></td></tr>`;
        return;
    }

    tbody.innerHTML = lista.map(m => {
        const v = infoVigencia(m);
        const planeados = totalPlaneado(m);
        const destinos = [...new Set(m.distribuciones.map(r => r.destinoId))];
        return `
            <tr>
                <td style="min-width: 220px;">
                    <a href="#" onclick="verMedida(${m.id}); return false;" style="font-weight: 700; color: var(--primary-green); font-size: 0.88rem;">${esc(textoAcuerdo(m))}</a>
                    <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 0.2rem;">📎 ${esc(m.acuerdo.archivo || "Sin adjunto")}</div>
                    <div style="font-size: 0.72rem; margin-top: 0.2rem;">${textoNotificacion(m)}</div>
                    ${m.descripcion ? `<div style="font-size: 0.75rem; color: var(--text-main); margin-top: 0.25rem;">${esc(m.descripcion)}</div>` : ""}
                </td>
                <td style="font-size: 0.8rem; white-space: nowrap;">
                    ${formatoFecha(m.fechaInicio)} → ${formatoFecha(m.fechaFin)}
                    <div style="margin-top: 0.3rem;">${chip(v.texto, v.fondo, v.color)}</div>
                </td>
                <td style="font-size: 0.78rem;">
                    ${m.resolucion
                        ? `<strong>${esc(textoResolucion(m.resolucion))}</strong><div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 0.2rem;">📎 ${esc(m.resolucion.archivo)}</div>`
                        : `<span style="color: var(--text-muted);">Sin resolución</span>`}
                </td>
                <td style="font-size: 0.8rem; min-width: 200px;">
                    <strong>${m.distribuciones.length}</strong> distribución(es) · <strong>${planeados}</strong> proceso(s)<br>
                    <span style="color: var(--text-muted); font-size: 0.72rem;">Hacia ${destinos.length} despacho(s) de descongestión</span>
                    ${barraAvance(totalTrasladado(m), planeados)}
                </td>
                <td style="font-size: 0.8rem; min-width: 140px;">${(() => {
                    const c = conteoAdmins(m);
                    return c.registrados === c.total
                        ? chip(`👤 ${c.registrados} de ${c.total} registrados`, "#dcfce7", "#166534")
                        : `${chip(`👤 ${c.registrados} de ${c.total} registrados`, "#fee2e2", "#991b1b")}<div style="font-size: 0.72rem; color: #991b1b; margin-top: 0.25rem;">Faltan ${c.total - c.registrados}: complételos en Editar</div>`;
                })()}</td>
                <td>
                    <div class="action-buttons" style="flex-direction: column; align-items: stretch;">
                        <button class="btn-action edit" style="white-space: nowrap;" onclick="verMedida(${m.id})">🔍 Ver detalle</button>
                        <button class="btn-action edit" style="white-space: nowrap;" onclick="abrirEditarMedida(${m.id})">✏️ Editar</button>
                        <button class="btn-action edit" style="white-space: nowrap;" onclick="notificarMedida(${m.id})">✉️ ${m.notificacion ? "Reenviar" : "Notificar"}</button>
                    </div>
                </td>
            </tr>`;
    }).join("");
}

// ---------------------------------------------------------------------
// Detalle de la medida (con avance por distribución)
// ---------------------------------------------------------------------
function verMedida(id) {
    const m = dbMedidas.medidas.find(x => x.id === id);
    if (!m) return;
    const v = infoVigencia(m);
    const planeados = totalPlaneado(m);

    document.getElementById("detalle-titulo").textContent = `📜 ${textoAcuerdo(m)}`;
    document.getElementById("detalle-subtitulo").innerHTML =
        `Materializada por el Consejo Seccional de <strong>${esc(m.consejoseccional)}</strong> · Vigencia ${formatoFecha(m.fechaInicio)} → ${formatoFecha(m.fechaFin)} · ${chip(v.texto, v.fondo, v.color)}<br>${textoNotificacion(m)}`;

    // Totales por destino
    const porDestino = {};
    m.distribuciones.forEach(r => {
        porDestino[r.destinoId] = porDestino[r.destinoId] || { procesos: 0, trasladados: 0 };
        porDestino[r.destinoId].procesos += Number(r.procesos);
        porDestino[r.destinoId].trasladados += Number(r.trasladados || 0);
    });

    document.getElementById("detalle-contenido").innerHTML = `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; margin-bottom: 1rem;">
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 0.8rem 1rem; font-size: 0.83rem;">
                <div style="font-size: 0.8rem; font-weight: 700; color: var(--primary-green); margin-bottom: 0.4rem;">📜 Acuerdo del Consejo Superior de la Judicatura</div>
                <div><strong>Número:</strong> ${esc(m.acuerdo.numero)}</div>
                <div><strong>Año de expedición:</strong> ${m.acuerdo.anio}</div>
                <div><strong>Adjunto:</strong> <a href="#" onclick="return false;" style="color: #0284c7;">📎 ${esc(m.acuerdo.archivo || "Sin adjunto")}</a></div>
                ${m.descripcion ? `<div style="margin-top: 0.3rem; color: var(--text-muted);">${esc(m.descripcion)}</div>` : ""}
            </div>
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 0.8rem 1rem; font-size: 0.83rem;">
                <div style="font-size: 0.8rem; font-weight: 700; color: var(--primary-green); margin-bottom: 0.4rem;">🏛️ Resolución de creación de cargos</div>
                ${m.resolucion ? `
                    <div><strong>Número:</strong> ${esc(m.resolucion.numero)}</div>
                    <div><strong>Año de expedición:</strong> ${m.resolucion.anio}</div>
                    <div><strong>Adjunto:</strong> <a href="#" onclick="return false;" style="color: #0284c7;">📎 ${esc(m.resolucion.archivo)}</a></div>`
                  : `<span style="color: var(--text-muted);">La medida no cuenta con resolución de creación de cargos.</span>`}
            </div>
        </div>

        <div style="font-size: 0.85rem; font-weight: 700; color: var(--primary-green); margin-bottom: 0.5rem;">🔀 Plan de distribución de procesos</div>
        <div class="data-table-container" style="margin-bottom: 1rem;">
            <table class="data-table">
                <thead><tr><th>#</th><th>Despacho origen</th><th></th><th>Despacho destino</th><th>Procesos autorizados</th><th>Avance</th></tr></thead>
                <tbody>
                    ${m.distribuciones.map((r, i) => `
                        <tr>
                            <td style="font-size: 0.8rem; color: var(--text-muted);">${i + 1}</td>
                            <td style="font-size: 0.8rem;">${esc(nombreDespacho(r.origenId))}</td>
                            <td style="color: var(--primary-green); font-weight: 700;">➔</td>
                            <td style="font-size: 0.8rem;">${esc(nombreDespacho(r.destinoId))}</td>
                            <td style="font-size: 0.9rem; font-weight: 700; text-align: center;">${r.procesos}</td>
                            <td style="min-width: 150px;">${barraAvance(Number(r.trasladados || 0), Number(r.procesos))}</td>
                        </tr>`).join("")}
                </tbody>
            </table>
        </div>

        <div style="font-size: 0.8rem; font-weight: 700; color: var(--text-main); margin-bottom: 0.4rem;">Total por despacho de destino</div>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 0.6rem;">
            ${Object.entries(porDestino).map(([destId, t]) => `
                <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 6px; padding: 0.6rem 0.8rem;">
                    <div style="font-size: 0.8rem; font-weight: 600;">${esc(nombreDespacho(destId))}</div>
                    ${barraAvance(t.trasladados, t.procesos)}
                </div>`).join("")}
        </div>
        <div style="margin-top: 0.85rem; font-size: 0.85rem;"><strong>Total de la medida:</strong> ${planeados} proceso(s) autorizados · ${totalTrasladado(m)} trasladados.</div>

        <div style="font-size: 0.85rem; font-weight: 700; color: var(--primary-green); margin: 1.25rem 0 0.5rem;">👤 Administradores de los despachos en esta medida</div>
        <div class="data-table-container">
            <table class="data-table">
                <thead><tr><th>Despacho</th><th>Rol</th><th>Administrador</th><th>Correo institucional</th><th>Celular</th></tr></thead>
                <tbody>
                    ${despachosConRol(m.distribuciones).map(d => {
                        const a = (m.administradores || {})[d.id];
                        return `
                        <tr>
                            <td style="font-size: 0.8rem;">${esc(nombreDespacho(d.id))}</td>
                            <td>${d.roles.map(rol => chip(rol, rol === "Origen" ? "#e0f2fe" : "#ffedd5", rol === "Origen" ? "#0369a1" : "#9a3412")).join(" ")}</td>
                            ${adminCompleto(a)
                                ? `<td style="font-size: 0.8rem; font-weight: 600;">${esc(nombreAdmin(a))}</td><td style="font-size: 0.8rem;">${esc(a.correo)}</td><td style="font-size: 0.8rem; white-space: nowrap;">${esc(a.celular)}</td>`
                                : `<td colspan="3">${chip("⚠️ Pendiente de registrar", "#fee2e2", "#991b1b")}</td>`}
                        </tr>`;
                    }).join("")}
                </tbody>
            </table>
        </div>`;

    document.getElementById("detalle-acciones").innerHTML = `
        <button type="button" class="btn btn-secondary" onclick="cerrarModal('modal-detalle'); abrirEditarMedida(${m.id});">✏️ Editar medida</button>
        <button type="button" class="btn btn-secondary" onclick="notificarMedida(${m.id})">✉️ ${m.notificacion ? "Reenviar notificación" : "Notificar a los despachos"}</button>
        <button type="button" class="btn-primary-action" onclick="cerrarModal('modal-detalle')">Cerrar</button>`;
    abrirModal("modal-detalle");
}

// ---------------------------------------------------------------------
// Formulario: crear / editar
// ---------------------------------------------------------------------
function llenarSelectsFormulario() {
    const anioActual = new Date().getFullYear();
    const anios = Array.from({ length: 6 }, (_, i) => anioActual - i);
    const opcionesAnio = anios.map(a => `<option value="${a}">${a}</option>`).join("");
    document.getElementById("acuerdo-anio").innerHTML = opcionesAnio;
    document.getElementById("resolucion-anio").innerHTML = opcionesAnio;
    document.getElementById("consejo").value = CONSEJO;
}

function despachosDelConsejo(tipo) {
    return dbDatos.despachos
        .filter(d => d.tipo === tipo && d.estado !== "Inactivo" && d.consejoseccional === CONSEJO)
        .sort((a, b) => a.nombreDespacho.localeCompare(b.nombreDespacho));
}

function opcionesDespacho(tipo, seleccionado) {
    const lista = despachosDelConsejo(tipo);
    if (!lista.length) return `<option value="">No hay despachos de este tipo en el Consejo</option>`;
    return `<option value="" disabled ${seleccionado ? "" : "selected"}>Seleccione un despacho...</option>` +
        lista.map(d => `<option value="${d.id}" ${Number(seleccionado) === d.id ? "selected" : ""}>${esc(d.nombreDespacho)}</option>`).join("");
}

function abrirNuevaMedida() {
    borrador = { acuerdoArchivo: "", resolucionArchivo: "", administradores: {}, distribuciones: [{ origenId: "", destinoId: "", procesos: "", trasladados: 0 }] };
    document.getElementById("form-medida").reset();
    document.getElementById("medida-id").value = "";
    document.getElementById("form-titulo").textContent = "📝 Materializar medida de descongestión";
    document.getElementById("btn-guardar").textContent = "💾 Materializar medida";
    llenarSelectsFormulario();
    document.getElementById("acuerdo-archivo-actual").textContent = "Ningún archivo seleccionado.";
    mostrarResolucion(null);
    renderizarDistribuciones();
    actualizarResumenVigencia();
    abrirModal("modal-medida");
}

function abrirEditarMedida(id) {
    const m = dbMedidas.medidas.find(x => x.id === id);
    if (!m) return;
    borrador = JSON.parse(JSON.stringify({ acuerdoArchivo: m.acuerdo.archivo, resolucionArchivo: m.resolucion ? m.resolucion.archivo : "", administradores: m.administradores || {}, distribuciones: m.distribuciones }));

    document.getElementById("form-medida").reset();
    document.getElementById("medida-id").value = m.id;
    document.getElementById("form-titulo").textContent = `✏️ Editar ${textoAcuerdo(m)}`;
    document.getElementById("btn-guardar").textContent = "💾 Guardar cambios";
    llenarSelectsFormulario();

    document.getElementById("acuerdo-numero").value = m.acuerdo.numero;
    document.getElementById("acuerdo-anio").value = m.acuerdo.anio;
    document.getElementById("fecha-inicio").value = m.fechaInicio;
    document.getElementById("fecha-fin").value = m.fechaFin;
    document.getElementById("descripcion").value = m.descripcion || "";
    document.getElementById("acuerdo-archivo-actual").innerHTML = `📎 Archivo actual: <strong>${esc(m.acuerdo.archivo)}</strong> (puede reemplazarlo)`;
    mostrarResolucion(m.resolucion);
    renderizarDistribuciones();
    actualizarResumenVigencia();
    abrirModal("modal-medida");
}

function seleccionarArchivoAcuerdo(input) {
    if (!input.files.length) return;
    borrador.acuerdoArchivo = input.files[0].name;
    document.getElementById("acuerdo-archivo-actual").innerHTML = `📎 <strong>${esc(borrador.acuerdoArchivo)}</strong>`;
}

function actualizarResumenVigencia() {
    const inicio = document.getElementById("fecha-inicio").value;
    const fin = document.getElementById("fecha-fin");
    const caja = document.getElementById("resumen-vigencia");
    fin.min = inicio || "";
    if (!inicio || !fin.value) { caja.style.display = "none"; return; }

    const dias = diasEntre(inicio, fin.value);
    caja.style.display = "block";
    if (dias <= 0) {
        caja.style.cssText += "background: #fee2e2; border: 1px solid #fecaca; color: #991b1b;";
        caja.innerHTML = "⚠️ La fecha fin debe ser posterior a la fecha de inicio.";
    } else {
        caja.style.cssText += "background: #f0f9ff; border: 1px solid #bae6fd; color: #0c4a6e;";
        caja.innerHTML = `📅 La medida durará <strong>${dias} días</strong> (aprox. ${Math.round(dias / 30)} mes(es)), del ${formatoFecha(inicio)} al ${formatoFecha(fin.value)}.`;
    }
}

// --- Resolución de creación de cargos (opcional) -------------------------
function mostrarResolucion(resolucion) {
    document.getElementById("tiene-resolucion").checked = !!resolucion;
    document.getElementById("resolucion-numero").value = resolucion ? resolucion.numero : "";
    document.getElementById("resolucion-anio").value = resolucion ? resolucion.anio : new Date().getFullYear();
    document.getElementById("resolucion-archivo").value = "";
    document.getElementById("resolucion-archivo-actual").innerHTML = resolucion
        ? `📎 Archivo actual: <strong>${esc(resolucion.archivo)}</strong> (puede reemplazarlo)`
        : "Ningún archivo seleccionado.";
    cambiarResolucion();
}

function cambiarResolucion() {
    const tiene = document.getElementById("tiene-resolucion").checked;
    document.getElementById("bloque-resolucion").style.display = tiene ? "block" : "none";
    document.getElementById("sin-resolucion").style.display = tiene ? "none" : "block";
    document.getElementById("resolucion-numero").required = tiene;
}

function seleccionarArchivoResolucion(input) {
    if (!input.files.length) return;
    borrador.resolucionArchivo = input.files[0].name;
    document.getElementById("resolucion-archivo-actual").innerHTML = `📎 <strong>${esc(borrador.resolucionArchivo)}</strong>`;
}

// --- Plan de distribución -------------------------------------------------
function renderizarDistribuciones() {
    const cont = document.getElementById("lista-distribuciones");

    cont.innerHTML = `
        <div style="display: grid; grid-template-columns: 0.3fr 2fr 0.3fr 2fr 1fr 0.6fr; gap: 0.6rem; font-size: 0.75rem; font-weight: 600; color: var(--text-muted); padding: 0 0.25rem 0.35rem;">
            <span>#</span><span>Despacho origen</span><span></span><span>Despacho destino</span><span>N.º de procesos</span><span></span>
        </div>` +
        borrador.distribuciones.map((r, i) => {
            const minimo = Math.max(1, Number(r.trasladados || 0));
            return `
            <div style="display: grid; grid-template-columns: 0.3fr 2fr 0.3fr 2fr 1fr 0.6fr; gap: 0.6rem; align-items: center; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 6px; padding: 0.5rem 0.6rem; margin-bottom: 0.45rem;">
                <span style="font-weight: 700; color: var(--text-muted); font-size: 0.85rem;">${i + 1}</span>
                <select class="form-control" required onchange="actualizarDistribucion(${i}, 'origenId', this.value)">${opcionesDespacho("Permanente", r.origenId)}</select>
                <span style="color: var(--primary-green); font-weight: 700; text-align: center;">➔</span>
                <div>
                    <select class="form-control" required onchange="actualizarDistribucion(${i}, 'destinoId', this.value)">${opcionesDespacho("Descongestión", r.destinoId)}</select>
                </div>
                <div>
                    <input type="number" class="form-control" required min="${minimo}" step="1" value="${esc(r.procesos)}" placeholder="Ej: 40" oninput="actualizarDistribucion(${i}, 'procesos', this.value)">
                    ${Number(r.trasladados) ? `<div style="font-size: 0.7rem; color: var(--text-muted); margin-top: 0.2rem;">Ya trasladados: ${r.trasladados}</div>` : ""}
                </div>
                ${borrador.distribuciones.length > 1 && !Number(r.trasladados)
                    ? `<button type="button" class="btn-action inactivate" onclick="quitarDistribucion(${i})" title="Quitar distribución">🗑️</button>`
                    : `<span title="${Number(r.trasladados) ? "Tiene procesos trasladados: no se puede quitar" : ""}" style="text-align: center; color: var(--text-muted);">${Number(r.trasladados) ? "🔒" : ""}</span>`}
            </div>`;
        }).join("");

    renderizarResumenDistribucion();
    renderizarAdministradores();
}

function agregarDistribucion() {
    borrador.distribuciones.push({ origenId: "", destinoId: "", procesos: "", trasladados: 0 });
    renderizarDistribuciones();
}

function quitarDistribucion(i) {
    borrador.distribuciones.splice(i, 1);
    renderizarDistribuciones();
}

function actualizarDistribucion(i, campo, valor) {
    borrador.distribuciones[i][campo] = campo === "procesos" ? valor : Number(valor);
    if (campo === "procesos") renderizarResumenDistribucion();
    else renderizarDistribuciones();
}

// Resumen en vivo: total y procesos por despacho de destino
function renderizarResumenDistribucion() {
    const validas = borrador.distribuciones.filter(r => r.destinoId && Number(r.procesos) > 0);
    const total = validas.reduce((t, r) => t + Number(r.procesos), 0);
    const porDestino = {};
    validas.forEach(r => porDestino[r.destinoId] = (porDestino[r.destinoId] || 0) + Number(r.procesos));

    document.getElementById("resumen-distribucion").innerHTML = `
        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; padding: 0.6rem 0.85rem; font-size: 0.82rem; color: #14532d;">
            <strong>Total del plan: ${total} proceso(s)</strong> en ${borrador.distribuciones.length} distribución(es)
            ${Object.keys(porDestino).length ? `<div style="margin-top: 0.35rem; display: flex; flex-wrap: wrap; gap: 0.35rem;">
                ${Object.entries(porDestino).map(([id, n]) => chip(`${esc(nombreDespacho(id))}: ${n}`, "#ffffff", "#166534")).join("")}
            </div>` : ""}
        </div>`;
}

// --- Administradores de los despachos (uno por despacho origen y destino) ---
function generarPassword() {
    const c = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
    let s = "";
    for (let i = 0; i < 4; i++) s += c[Math.floor(Math.random() * c.length)];
    return `Temp${new Date().getFullYear()}*${s}`;
}

function campoAdmin(id, clave, etiqueta, requerido, tipo, placeholder, extra = "") {
    const a = borrador.administradores[id] || {};
    return `
        <div class="form-group" style="margin-bottom: 0.6rem;">
            <label>${etiqueta}${requerido ? "" : ' <span style="font-weight: 400; color: var(--text-muted);">(opcional)</span>'}</label>
            <input type="${tipo}" class="form-control" value="${esc(a[clave] || "")}" placeholder="${placeholder}" ${extra}
                   oninput="actualizarAdmin(${id}, '${clave}', this)">
        </div>`;
}

function renderizarAdministradores() {
    const cont = document.getElementById("lista-administradores");
    const despachos = despachosConRol(borrador.distribuciones);
    if (!despachos.length) {
        cont.innerHTML = `<div style="font-size: 0.8rem; color: var(--text-muted); padding: 0.6rem 0.8rem; border: 1px dashed #cbd5e1; border-radius: 6px; margin-bottom: 1rem;">
            Seleccione los despachos origen y destino en el plan de distribución para registrar sus administradores.</div>`;
        return;
    }
    cont.innerHTML = despachos.map(d => {
        const a = borrador.administradores[d.id] || {};
        const completo = adminCompleto(a);
        const esOrigen = d.roles.includes("Origen");
        return `
        <div style="border: 1px solid ${completo ? "#bbf7d0" : "#e2e8f0"}; border-left: 4px solid ${esOrigen ? "#0369a1" : "#b45309"}; border-radius: 8px; padding: 0.85rem 1rem; margin-bottom: 0.75rem; background: #fcfcfd;">
            <div style="display: flex; justify-content: space-between; align-items: center; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 0.6rem;">
                <div>
                    <strong style="font-size: 0.85rem; color: var(--text-main);">${esc(nombreDespacho(d.id))}</strong>
                    <div style="font-size: 0.72rem; color: var(--text-muted);">${esOrigen ? "Registrará los procesos de la medida" : "Gestionará los procesos de la medida"}</div>
                </div>
                <div style="display: flex; gap: 0.35rem; align-items: center;">
                    ${d.roles.map(rol => chip(`Despacho ${rol.toLowerCase()}`, rol === "Origen" ? "#e0f2fe" : "#ffedd5", rol === "Origen" ? "#0369a1" : "#9a3412")).join("")}
                    <span id="estado-admin-${d.id}">${completo ? chip("✔ Completo", "#dcfce7", "#166534") : chip("Pendiente", "#fef3c7", "#92400e")}</span>
                </div>
            </div>
            <div class="form-grid" style="grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0 1.25rem; margin-bottom: 0;">
                ${campoAdmin(d.id, "primerNombre", "Primer Nombre", true, "text", "Ej: Carlos")}
                ${campoAdmin(d.id, "segundoNombre", "Segundo Nombre", false, "text", "Ej: Andrés")}
                ${campoAdmin(d.id, "primerApellido", "Primer Apellido", true, "text", "Ej: Pérez")}
                ${campoAdmin(d.id, "segundoApellido", "Segundo Apellido", false, "text", "Ej: Gómez")}
                ${campoAdmin(d.id, "correo", "Correo Electrónico Institucional", true, "email", "Ej: cperez" + DOMINIO_INSTITUCIONAL)}
                ${campoAdmin(d.id, "celular", "Teléfono Celular", true, "tel", "Ej: 3001234567", 'inputmode="numeric" maxlength="10"')}
                <div class="form-group" style="margin-bottom: 0.6rem; grid-column: 1 / -1;">
                    <label>Contraseña Temporal</label>
                    <div style="display: flex; gap: 0.5rem;">
                        <input type="text" id="password-admin-${d.id}" class="form-control" value="${esc(a.password || "")}" placeholder="Ej: Temp2026*" oninput="actualizarAdmin(${d.id}, 'password', this)">
                        <button type="button" class="btn btn-secondary" style="white-space: nowrap;" onclick="generarPasswordAdmin(${d.id})" title="Generar una contraseña temporal">🎲 Generar</button>
                    </div>
                </div>
            </div>
        </div>`;
    }).join("");
}

function actualizarAdmin(id, clave, input) {
    if (clave === "celular") input.value = input.value.replace(/\D/g, "").slice(0, 10);
    borrador.administradores[id] = borrador.administradores[id] || {};
    borrador.administradores[id][clave] = input.value.trim();
    document.getElementById(`estado-admin-${id}`).innerHTML = adminCompleto(borrador.administradores[id])
        ? chip("✔ Completo", "#dcfce7", "#166534") : chip("Pendiente", "#fef3c7", "#92400e");
}

function generarPasswordAdmin(id) {
    const input = document.getElementById(`password-admin-${id}`);
    input.value = generarPassword();
    actualizarAdmin(id, "password", input);
}

// ---------------------------------------------------------------------
// Notificación de la medida a los despachos involucrados
// ---------------------------------------------------------------------
function despachosInvolucrados(m) {
    const ids = [...new Set(m.distribuciones.flatMap(r => [r.origenId, r.destinoId]))];
    return ids.map(id => despacho(id)).filter(Boolean);
}

function textoNotificacion(m) {
    if (!m.notificacion) return `<span style="color: #b45309; font-weight: 600;">✉️ Sin notificar</span>`;
    return `<span style="color: #166534; font-weight: 600;">✉️ Notificada el ${formatoFecha(m.notificacion.fecha)}</span>` +
        (m.notificacion.envios > 1 ? ` <span style="color: var(--text-muted);">(${m.notificacion.envios} envíos)</span>` : "");
}

// Pide confirmación (si es reenvío) y abre el correo con un mensaje por despacho
function notificarMedida(id, preguntar = true) {
    const m = dbMedidas.medidas.find(x => x.id === id);
    if (!m) return;
    const despachos = despachosInvolucrados(m);
    const reenvio = !!m.notificacion;

    const enviar = () => {
        const payload = {
            reenvio,
            expedidaPor: `Consejo Seccional de ${m.consejoseccional}`,
            consejoSeccional: m.consejoseccional,
            acuerdo: m.acuerdo,
            resolucion: m.resolucion,
            fechaInicio: m.fechaInicio,
            fechaFin: m.fechaFin,
            descripcion: m.descripcion,
            fechaEnvio: hoy(),
            despachos: despachos.map(d => {
                const a = (m.administradores || {})[d.id] || {};
                return {
                    id: d.id,
                    nombre: d.nombreDespacho,
                    codigo: d.codigoDespacho,
                    correo: a.correo || "",
                    administrador: nombreAdmin(a),
                    celular: a.celular || "",
                    password: a.password || "",
                    tipo: d.tipo
                };
            }),
            distribuciones: m.distribuciones.map(r => ({
                origenId: r.origenId,
                origen: nombreDespacho(r.origenId),
                destinoId: r.destinoId,
                destino: nombreDespacho(r.destinoId),
                procesos: r.procesos
            }))
        };
        const ventana = window.open(`email_medida_descongestion.html?data=${encodeURIComponent(JSON.stringify(payload))}`, "_blank");

        m.notificacion = { fecha: hoy(), envios: (m.notificacion ? m.notificacion.envios : 0) + 1 };
        cerrarModal("modal-detalle");
        renderizarTabla();
        mostrarDialogoAlerta(reenvio ? "Notificación reenviada" : "Notificación enviada",
            `Se notificó el ${textoAcuerdo(m)} a ${despachos.length} despacho(s).` +
            (ventana ? "" : " El navegador bloqueó la ventana del correo: permita las ventanas emergentes para este sitio."), "✉️");
    };

    const c = conteoAdmins(m);
    if (c.registrados < c.total) {
        mostrarDialogoAlerta("Faltan administradores", `Registre el administrador de los ${c.total - c.registrados} despacho(s) pendiente(s) antes de notificar la medida.`, "⚠️");
        return;
    }
    if (!preguntar) return enviar();
    mostrarDialogoConfirmacion(
        reenvio ? "¿Reenviar la notificación?" : "¿Notificar la medida?",
        `Se enviará el ${textoAcuerdo(m)}, su plan de distribución y las credenciales de acceso al administrador de cada despacho (${despachos.length}): ${despachos.map(d => d.nombreDespacho).join(", ")}.`,
        enviar,
        "✉️",
        reenvio ? "Sí, reenviar" : "Sí, notificar"
    );
}

// ---------------------------------------------------------------------
// Guardar la medida
// ---------------------------------------------------------------------
function guardarMedida(event) {
    event.preventDefault();
    const id = document.getElementById("medida-id").value;
    const numero = document.getElementById("acuerdo-numero").value.trim();
    const anio = Number(document.getElementById("acuerdo-anio").value);
    const inicio = document.getElementById("fecha-inicio").value;
    const fin = document.getElementById("fecha-fin").value;
    const alerta = (titulo, mensaje) => mostrarDialogoAlerta(titulo, mensaje, "⚠️");

    // Acuerdo
    if (dbMedidas.medidas.some(m => m.acuerdo.numero === numero && m.acuerdo.anio === anio && String(m.id) !== id)) {
        return alerta("Acuerdo repetido", `Ya existe una medida registrada con el Acuerdo ${numero} de ${anio}.`);
    }
    if (!borrador.acuerdoArchivo) return alerta("Falta el acuerdo", "Adjunte el PDF del acuerdo de la medida.");
    if (fin <= inicio) return alerta("Revise la vigencia", "La fecha fin de la medida debe ser posterior a la fecha de inicio.");

    // Resolución de creación de cargos (opcional): si se marca, número y PDF son obligatorios
    let resolucion = null;
    if (document.getElementById("tiene-resolucion").checked) {
        const numeroRes = document.getElementById("resolucion-numero").value.trim();
        if (!numeroRes) return alerta("Resolución incompleta", "Indique el número de la resolución de creación de cargos o desmarque la opción.");
        if (!borrador.resolucionArchivo) return alerta("Falta un adjunto", "Adjunte el PDF de la resolución de creación de cargos.");
        resolucion = { numero: numeroRes, anio: Number(document.getElementById("resolucion-anio").value), archivo: borrador.resolucionArchivo };
    }

    // Plan de distribución
    if (!borrador.distribuciones.length) return alerta("Plan vacío", "Agregue al menos una distribución de procesos.");
    const rutas = new Set();
    for (const [i, r] of borrador.distribuciones.entries()) {
        const n = Number(r.procesos);
        if (!r.origenId || !r.destinoId) return alerta("Distribución incompleta", `Seleccione el despacho de origen y de destino en la distribución ${i + 1}.`);
        if (!Number.isInteger(n) || n < 1) return alerta("Número de procesos", `Indique un número entero mayor que cero en la distribución ${i + 1}.`);
        if (n < Number(r.trasladados || 0)) return alerta("Número de procesos", `La distribución ${i + 1} ya tiene ${r.trasladados} procesos trasladados; no puede autorizar menos.`);
        const clave = `${r.origenId}-${r.destinoId}`;
        if (rutas.has(clave)) return alerta("Distribución repetida", `La distribución ${i + 1} repite un origen y destino ya incluidos. Sume los procesos en una sola fila.`);
        rutas.add(clave);
    }

    // Administradores: uno completo por cada despacho origen y destino
    const administradores = {};
    for (const d of despachosConRol(borrador.distribuciones)) {
        const a = borrador.administradores[d.id] || {};
        const nombre = nombreDespacho(d.id);
        if (!a.primerNombre || !a.primerApellido) return alerta("Administrador incompleto", `Indique el primer nombre y el primer apellido del administrador de ${nombre}.`);
        if (!a.correo || !a.correo.toLowerCase().endsWith(DOMINIO_INSTITUCIONAL)) return alerta("Correo no institucional", `El correo del administrador de ${nombre} debe terminar en ${DOMINIO_INSTITUCIONAL}.`);
        if (!/^3\d{9}$/.test(a.celular || "")) return alerta("Celular no válido", `El teléfono celular del administrador de ${nombre} debe tener 10 dígitos y empezar por 3.`);
        if (!a.password || a.password.length < 8) return alerta("Contraseña temporal", `Genere o escriba una contraseña temporal de al menos 8 caracteres para el administrador de ${nombre}.`);
        administradores[d.id] = { ...a };
    }

    const datos = {
        acuerdo: { numero, anio, archivo: borrador.acuerdoArchivo },
        consejoseccional: CONSEJO,
        fechaInicio: inicio,
        fechaFin: fin,
        descripcion: document.getElementById("descripcion").value.trim(),
        resolucion,
        administradores,
        distribuciones: borrador.distribuciones.map(r => ({ origenId: Number(r.origenId), destinoId: Number(r.destinoId), procesos: Number(r.procesos), trasladados: Number(r.trasladados || 0) }))
    };

    let medida;
    if (id) {
        medida = dbMedidas.medidas.find(m => m.id === Number(id));
        Object.assign(medida, datos);
    } else {
        medida = { id: Date.now(), fechaRegistro: hoy(), notificacion: null, ...datos };
        dbMedidas.medidas.push(medida);
    }

    cerrarModal("modal-medida");
    llenarFiltros();
    renderizarTabla();

    const resumen = `${textoAcuerdo(medida)}: ${totalPlaneado(medida)} proceso(s) en ${medida.distribuciones.length} distribución(es).`;
    const cantidad = despachosInvolucrados(medida).length;

    if (!id) {
        mostrarDialogoConfirmacion("Medida materializada",
            `${resumen} ¿Desea notificar ahora la medida y enviar las credenciales a los administradores de los ${cantidad} despacho(s)?`,
            () => notificarMedida(medida.id, false), "✅", "✉️ Enviar notificación", "Más tarde");
    } else if (medida.notificacion) {
        mostrarDialogoConfirmacion("Medida actualizada",
            `${resumen} La medida ya había sido notificada. ¿Desea reenviar la notificación con los cambios a los ${cantidad} despacho(s)?`,
            () => notificarMedida(medida.id, false), "✅", "✉️ Reenviar notificación", "No reenviar");
    } else {
        mostrarDialogoConfirmacion("Medida actualizada",
            `${resumen} La medida aún no ha sido notificada. ¿Desea notificar ahora a los ${cantidad} despacho(s)?`,
            () => notificarMedida(medida.id, false), "✅", "✉️ Enviar notificación", "Más tarde");
    }
}

// ---------------------------------------------------------------------
// Inicio
// ---------------------------------------------------------------------
document.addEventListener("keydown", e => {
    if (e.key !== "Escape") return;
    const orden = ["modal-dialogo-alerta", "modal-detalle", "modal-medida"];
    const abierto = orden.find(id => document.getElementById(id).classList.contains("visible"));
    if (abierto) cerrarModal(abierto);
});

window.onload = function () {
    llenarFiltros();
    renderizarTabla();
};