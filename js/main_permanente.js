// =====================================================================
// RUNPD - UDAE: validación de postulaciones de despachos permanentes
// Postulaciones: js/data_postulaciones.js (dbPostulaciones)
// Catálogos y despachos ya registrados: js/data.js (dbDatos)
// =====================================================================

let filtroKpi = "todos";
let solicitudActualId = null;
let accionDialogo = null;

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

function nombreAdministrador(s) {
    return [s.adminPrimerNombre, s.adminSegundoNombre, s.adminPrimerApellido, s.adminSegundoApellido].filter(Boolean).join(" ");
}

function obtenerSolicitud(id = solicitudActualId) {
    return dbPostulaciones.solicitudes.find(s => s.id === Number(id));
}

function cerrarModal(modalId) {
    document.getElementById(modalId).classList.remove("visible");
}

function abrirModal(modalId) {
    document.getElementById(modalId).classList.add("visible");
}

function chip(texto, fondo, color) {
    return `<span style="display: inline-block; font-size: 0.72rem; font-weight: 700; padding: 0.15rem 0.5rem; border-radius: 12px; background: ${fondo}; color: ${color}; white-space: nowrap;">${texto}</span>`;
}

const ESTADOS = {
    Pendiente: { texto: "Pendiente de validación", fondo: "#fef3c7", color: "#b45309" },
    Aprobado:  { texto: "Habilitado para procesos", fondo: "#e6f4ea", color: "#166534" },
    Rechazado: { texto: "Rechazado",                fondo: "#fee2e2", color: "#dc2626" }
};

// ---------------------------------------------------------------------
// Validaciones automáticas de una postulación (ayudan a decidir)
// ---------------------------------------------------------------------
function validacionesSolicitud(s) {
    const correoInstitucional = (s.adminCorreo || "").toLowerCase().endsWith("ramajudicial.gov.co");
    const codigoNumerico = /^\d+$/.test(s.codigoDespacho || "");
    const registrado = (dbDatos.despachos || []).find(d => d.codigoDespacho === s.codigoDespacho);
    const otraSolicitud = dbPostulaciones.solicitudes.find(o => o.id !== s.id && o.codigoDespacho === s.codigoDespacho && o.estado !== "Rechazado");
    const obligatorios = ["adminPrimerNombre", "adminPrimerApellido", "adminCorreo", "jurisdiccion", "tipodespacho", "deptomunicipio",
                          "consejoseccional", "distrito", "circuito", "especialidad", "codigoDespacho", "nombreDespacho"];
    const faltantes = obligatorios.filter(c => !String(s[c] || "").trim());

    return [
        { ok: faltantes.length === 0, texto: faltantes.length ? `Faltan ${faltantes.length} dato(s) obligatorio(s)` : "Todos los datos obligatorios están completos" },
        { ok: correoInstitucional, texto: correoInstitucional ? "El correo es institucional (ramajudicial.gov.co)" : "El correo NO es institucional" },
        { ok: codigoNumerico, texto: codigoNumerico ? `El código tiene formato válido (${s.codigoDespacho.length} dígitos)` : "El código tiene caracteres no válidos" },
        { ok: !registrado, texto: registrado ? `El código ya está registrado: ${registrado.nombreDespacho}` : "El código no está registrado en otro despacho" },
        { ok: !otraSolicitud, texto: otraSolicitud ? `Hay otra postulación con el mismo código (${otraSolicitud.radicado})` : "No hay otra postulación con el mismo código" }
    ];
}

function tieneAlertas(s) {
    return validacionesSolicitud(s).some(v => !v.ok);
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
// Indicadores, aviso y filtros
// ---------------------------------------------------------------------
function renderizarIndicadores() {
    const lista = dbPostulaciones.solicitudes;
    const cuenta = estado => lista.filter(s => s.estado === estado).length;
    const sinNotificar = lista.filter(s => s.estado !== "Pendiente" && !s.notificado).length;

    const tarjetas = [
        { clave: "Pendiente",     icono: "⏳", valor: cuenta("Pendiente"), texto: "Pendientes de validación", color: "#f59e0b" },
        { clave: "Aprobado",      icono: "✅", valor: cuenta("Aprobado"),  texto: "Aprobadas",                color: "var(--primary-green)" },
        { clave: "Rechazado",     icono: "✖",  valor: cuenta("Rechazado"), texto: "Rechazadas",               color: "#dc2626" },
        { clave: "sin_notificar", icono: "✉️", valor: sinNotificar,        texto: "Respuestas sin notificar", color: "#1d4ed8" },
        { clave: "todos",         icono: "📥", valor: lista.length,        texto: "Postulaciones recibidas",  color: "#64748b" }
    ];

    document.getElementById("indicadores").innerHTML = tarjetas.map(t => {
        const activo = filtroKpi === t.clave && t.clave !== "todos";
        return `
            <button type="button" onclick="aplicarFiltroKpi('${t.clave}')" title="Clic para filtrar"
                style="text-align: left; background: ${activo ? "#f0fdf4" : "#ffffff"}; border: 1px solid ${activo ? "var(--primary-green)" : "#e2e8f0"}; border-top: 4px solid ${t.color}; border-radius: 8px; padding: 0.8rem 1rem; cursor: pointer; box-shadow: ${activo ? "0 0 0 3px #e6f4ea" : "0 1px 3px rgba(0,0,0,0.05)"};">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-size: 1.6rem; font-weight: 800; color: var(--text-main);">${t.valor}</span>
                    <span style="font-size: 1.3rem;">${t.icono}</span>
                </div>
                <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.15rem;">${t.texto}</div>
            </button>`;
    }).join("");
}

function renderizarAviso() {
    const pendientes = dbPostulaciones.solicitudes.filter(s => s.estado === "Pendiente");
    const aviso = document.getElementById("aviso-pendientes");
    if (!pendientes.length) {
        aviso.style.display = "none";
        return;
    }
    const masAntigua = pendientes.reduce((a, b) => (a.fechaSolicitud < b.fechaSolicitud ? a : b));
    const conAlertas = pendientes.filter(tieneAlertas).length;

    aviso.style.display = "flex";
    aviso.innerHTML = `
        <div style="display: flex; align-items: center; gap: 0.75rem;">
            <span style="font-size: 1.6rem;">📥</span>
            <div style="font-size: 0.85rem; color: #713f12; line-height: 1.5;">
                <div style="font-weight: 700; font-size: 0.9rem;">Tiene ${pendientes.length} postulación(es) por validar</div>
                La más antigua (${esc(masAntigua.radicado)}) lleva <strong>${diasEntre(masAntigua.fechaSolicitud, hoy())} día(s)</strong> en espera.
                ${conAlertas ? ` · <strong>${conAlertas}</strong> con alertas que debe revisar.` : ""}
            </div>
        </div>
        <button type="button" class="btn-primary-action" style="padding: 0.5rem 1rem; font-size: 0.85rem;" onclick="aplicarFiltroKpi('Pendiente', true)">Ver pendientes ➔</button>`;
}

function llenarFiltros() {
    const consejos = [...new Set(dbPostulaciones.solicitudes.map(s => s.consejoseccional).filter(Boolean))].sort();
    document.getElementById("filtro-consejo").innerHTML = `<option value="">Todos</option>` +
        consejos.map(c => `<option value="${esc(c)}">${esc(c)}</option>`).join("");
}

function aplicarFiltroKpi(clave, forzar = false) {
    filtroKpi = (!forzar && filtroKpi === clave) ? "todos" : clave;
    document.getElementById("filtro-estado").value = "";
    renderizarTablaPermanentes();
}

function limpiarFiltros() {
    document.getElementById("filtro-busqueda").value = "";
    document.getElementById("filtro-consejo").value = "";
    document.getElementById("filtro-estado").value = "";
    filtroKpi = "todos";
    renderizarTablaPermanentes();
}

function cumpleFiltros(s) {
    const q = normalizar(document.getElementById("filtro-busqueda").value);
    const consejo = document.getElementById("filtro-consejo").value;
    const estado = document.getElementById("filtro-estado").value;

    if (consejo && s.consejoseccional !== consejo) return false;
    if (estado && s.estado !== estado) return false;
    if (filtroKpi === "sin_notificar" && !(s.estado !== "Pendiente" && !s.notificado)) return false;
    if (["Pendiente", "Aprobado", "Rechazado"].includes(filtroKpi) && s.estado !== filtroKpi) return false;
    if (!q) return true;
    return normalizar([s.radicado, s.nombreDespacho, s.codigoDespacho, nombreAdministrador(s), s.adminCorreo, s.deptomunicipio].join(" ")).includes(q);
}

// ---------------------------------------------------------------------
// Tabla de postulaciones
// ---------------------------------------------------------------------
function renderizarTablaPermanentes() {
    renderizarIndicadores();
    renderizarAviso();

    const tbody = document.getElementById("cuerpo-tabla-permanente");
    const orden = { Pendiente: 0, Aprobado: 1, Rechazado: 2 };
    const lista = dbPostulaciones.solicitudes
        .filter(cumpleFiltros)
        .sort((a, b) => orden[a.estado] - orden[b.estado] || a.fechaSolicitud.localeCompare(b.fechaSolicitud));

    document.getElementById("texto-filtro").innerHTML =
        `Mostrando <strong>${lista.length}</strong> de ${dbPostulaciones.solicitudes.length} postulación(es) · Las pendientes aparecen primero, de la más antigua a la más reciente.`;

    if (!lista.length) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 2rem;">
            No hay postulaciones con los filtros seleccionados. <a href="#" onclick="limpiarFiltros(); return false;" style="color: var(--primary-green); font-weight: 600;">Limpiar filtros</a></td></tr>`;
        return;
    }

    tbody.innerHTML = lista.map(s => {
        const est = ESTADOS[s.estado];
        const pendiente = s.estado === "Pendiente";
        const alertas = pendiente && tieneAlertas(s);
        const correoInst = (s.adminCorreo || "").toLowerCase().endsWith("ramajudicial.gov.co");
        const espera = diasEntre(s.fechaSolicitud, hoy());

        const acciones = pendiente
            ? `<button class="btn-primary-action" style="padding: 0.4rem 0.8rem; font-size: 0.8rem; white-space: nowrap;" onclick="verDetalleSolicitud(${s.id})">🔍 Revisar</button>`
            : `<div class="action-buttons" style="flex-direction: column; align-items: stretch;">
                   <button class="btn-action edit" style="white-space: nowrap;" onclick="verDetalleSolicitud(${s.id})">🔍 Ver detalle</button>
                   <button class="btn-action edit" style="white-space: nowrap;" onclick="enviarNotificacion(${s.id})">✉️ ${s.notificado ? "Reenviar" : "Notificar"}</button>
               </div>`;

        return `
            <tr style="${pendiente ? "" : "background: #fcfcfd;"}">
                <td style="white-space: nowrap;">
                    <span style="font-family: monospace; font-weight: 700; color: var(--primary-green);">${esc(s.radicado)}</span><br>
                    <span style="font-size: 0.75rem; color: var(--text-muted);">${formatoFecha(s.fechaSolicitud)}</span>
                    ${pendiente ? `<br><span style="font-size: 0.72rem; color: ${espera > 7 ? "#dc2626" : "#b45309"}; font-weight: 600;">En espera: ${espera} día(s)</span>` : ""}
                </td>
                <td style="min-width: 220px;">
                    <div style="font-size: 0.85rem; font-weight: 600;">${esc(s.nombreDespacho)}</div>
                    <div style="margin-top: 0.25rem; display: flex; align-items: center; gap: 0.4rem; flex-wrap: wrap;">
                        <span style="font-family: monospace; font-weight: 600; color: var(--primary-green);">${esc(s.codigoDespacho)}</span>
                        ${chip("Permanente", "#edf2f7", "#475569")}
                    </div>
                </td>
                <td style="font-size: 0.8rem;">
                    <strong>${esc(s.deptomunicipio)}</strong> · Consejo ${esc(s.consejoseccional)}<br>
                    <span style="color: var(--text-muted);">${esc(s.tipodespacho)} · ${esc(s.especialidad)}</span>
                </td>
                <td style="font-size: 0.8rem;">
                    ${esc(nombreAdministrador(s))}<br>
                    <span style="color: ${correoInst ? "var(--text-muted)" : "#b45309"}; font-size: 0.75rem;">${correoInst ? "" : "⚠️ "}${esc(s.adminCorreo)}</span>
                </td>
                <td style="font-size: 0.8rem;">
                    ${chip(est.texto, est.fondo, est.color)}
                    ${alertas ? `<div style="margin-top: 0.3rem;">${chip("⚠️ Revisar alertas", "#fff7ed", "#c2410c")}</div>` : ""}
                    ${!pendiente ? `<div style="color: var(--text-muted); font-size: 0.72rem; margin-top: 0.3rem;">Respondida: ${formatoFecha(s.fechaRespuesta)}</div>
                                    <div style="font-size: 0.72rem; margin-top: 0.15rem; color: ${s.notificado ? "#166534" : "#1d4ed8"}; font-weight: 600;">${s.notificado ? "✉️ Notificado" : "✉️ Sin notificar"}</div>` : ""}
                </td>
                <td>${acciones}</td>
            </tr>`;
    }).join("");
}

// ---------------------------------------------------------------------
// 1. Revisar / ver detalle (centro de decisión)
// ---------------------------------------------------------------------
function verDetalleSolicitud(id) {
    const s = obtenerSolicitud(id);
    if (!s) return;
    solicitudActualId = s.id;

    const pendiente = s.estado === "Pendiente";
    const est = ESTADOS[s.estado];
    const validaciones = validacionesSolicitud(s);
    const dato = (etiqueta, valor, completo) =>
        `<div style="${completo ? "grid-column: 1 / -1;" : ""}"><div style="font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.3px;">${etiqueta}</div><div style="font-weight: 600; color: var(--text-main); font-size: 0.85rem;">${esc(valor || "—")}</div></div>`;
    const bloque = (titulo, contenido) => `
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 0.85rem 1rem; margin-bottom: 0.75rem;">
            <div style="font-size: 0.8rem; font-weight: 700; color: var(--primary-green); margin-bottom: 0.6rem;">${titulo}</div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.6rem 1rem;">${contenido}</div>
        </div>`;

    document.getElementById("detalle-titulo").textContent = pendiente ? "🔍 Revisión de la postulación" : "📋 Detalle de la postulación";
    document.getElementById("detalle-subtitulo").innerHTML =
        `Radicado <strong style="font-family: monospace; color: var(--primary-green);">${esc(s.radicado)}</strong> · Recibida el ${formatoFecha(s.fechaSolicitud)} · ${chip(est.texto, est.fondo, est.color)}`;

    document.getElementById("detalle-contenido").innerHTML = `
        <div style="display: grid; grid-template-columns: 1.4fr 1fr; gap: 1rem;">
            <div>
                ${bloque("🏛️ Despacho propuesto", `
                    ${dato("Nombre", s.nombreDespacho, true)}
                    ${dato("Código", s.codigoDespacho)}
                    ${dato("Tipo", "Permanente")}
                    ${dato("Jurisdicción", s.jurisdiccion)}
                    ${dato("Tipo de despacho", s.tipodespacho)}
                    ${dato("Especialidad", s.especialidad, true)}`)}
                ${bloque("📍 Ubicación territorial", `
                    ${dato("Consejo Seccional", s.consejoseccional)}
                    ${dato("Municipio", s.deptomunicipio)}
                    ${dato("Distrito", s.distrito)}
                    ${dato("Circuito", s.circuito)}`)}
                ${bloque("👤 Administrador del despacho", `
                    ${dato("Nombre completo", nombreAdministrador(s), true)}
                    ${dato("Correo institucional", s.adminCorreo, true)}`)}
            </div>
            <div>
                <div style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 0.85rem 1rem; margin-bottom: 0.75rem;">
                    <div style="font-size: 0.8rem; font-weight: 700; color: var(--text-main); margin-bottom: 0.6rem;">🤖 Verificación automática</div>
                    ${validaciones.map(v => `
                        <div style="display: flex; gap: 0.5rem; align-items: flex-start; font-size: 0.8rem; margin-bottom: 0.45rem; color: ${v.ok ? "#166534" : "#c2410c"};">
                            <span>${v.ok ? "✔" : "⚠️"}</span><span>${esc(v.texto)}</span>
                        </div>`).join("")}
                    <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 0.5rem; border-top: 1px solid #e2e8f0; padding-top: 0.5rem;">
                        ${validaciones.every(v => v.ok) ? "Sin alertas: la postulación puede aprobarse." : "Revise las alertas: puede corregir los datos o rechazar la postulación."}
                    </div>
                </div>
                ${s.estado === "Rechazado" ? `
                    <div style="background: #fee2e2; border: 1px solid #fecaca; border-radius: 8px; padding: 0.85rem 1rem; font-size: 0.8rem; color: #991b1b;">
                        <strong>Motivo del rechazo (${formatoFecha(s.fechaRespuesta)}):</strong><br>${esc(s.motivoRechazo)}
                    </div>` : ""}
                ${s.estado === "Aprobado" ? `
                    <div style="background: #e6f4ea; border: 1px solid #bbf7d0; border-radius: 8px; padding: 0.85rem 1rem; font-size: 0.8rem; color: #166534;">
                        <strong>Habilitado el ${formatoFecha(s.fechaRespuesta)}.</strong><br>El despacho ya puede registrar procesos y enviarlos al Consejo Seccional.
                    </div>` : ""}
            </div>
        </div>`;

    document.getElementById("detalle-acciones").innerHTML = pendiente ? `
        <button type="button" class="btn btn-secondary" style="margin-right: auto;" onclick="cerrarModal('modal-detalle')">Cerrar</button>
        <button type="button" class="btn btn-secondary" onclick="abrirModalEdicion(${s.id})">✏️ Corregir datos</button>
        <button type="button" class="btn" style="background-color: #fee2e2; color: #dc2626; border: 1px solid #fecaca;" onclick="abrirModalRechazo(${s.id})">✖ Rechazar</button>
        <button type="button" class="btn-primary-action" onclick="aprobarDespachoPermanente(${s.id})">✔ Aprobar y habilitar</button>`
        : `
        <button type="button" class="btn btn-secondary" onclick="enviarNotificacion(${s.id})">✉️ ${s.notificado ? "Reenviar notificación" : "Enviar notificación"}</button>
        <button type="button" class="btn-primary-action" onclick="cerrarModal('modal-detalle')">Cerrar</button>`;

    abrirModal("modal-detalle");
}

// ---------------------------------------------------------------------
// 2. Aprobar: confirma, habilita y ofrece enviar la notificación
// ---------------------------------------------------------------------
function aprobarDespachoPermanente(id) {
    const s = obtenerSolicitud(id);
    if (!s || s.estado !== "Pendiente") return;

    const alertas = validacionesSolicitud(s).filter(v => !v.ok);
    const advertencia = alertas.length ? ` Atención: la postulación tiene ${alertas.length} alerta(s) sin resolver.` : "";

    mostrarDialogoConfirmacion(
        "¿Aprobar y habilitar el despacho?",
        `${s.nombreDespacho} quedará habilitado como despacho permanente y ${nombreAdministrador(s)} recibirá sus credenciales de acceso.${advertencia}`,
        () => {
            s.estado = "Aprobado";
            s.fechaRespuesta = hoy();
            s.motivoRechazo = null;
            s.notificado = false;
            s.passwordTemporal = generarPassword();
            cerrarModal("modal-detalle");
            renderizarTablaPermanentes();

            mostrarDialogoConfirmacion(
                "¡Despacho habilitado!",
                `${s.nombreDespacho} quedó habilitado. Envíe ahora la notificación con las credenciales a ${s.adminCorreo}.`,
                () => enviarNotificacion(s.id),
                "✅",
                "✉️ Enviar notificación",
                "Más tarde"
            );
        },
        alertas.length ? "⚠️" : "✔",
        "Sí, aprobar"
    );
}

function generarPassword() {
    const caracteres = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
    let aleatorio = "";
    for (let i = 0; i < 4; i++) aleatorio += caracteres[Math.floor(Math.random() * caracteres.length)];
    return `Temp${new Date().getFullYear()}*${aleatorio}`;
}

// Abre el correo de aprobación o rechazo según el estado de la postulación
function enviarNotificacion(id) {
    const s = obtenerSolicitud(id);
    if (!s || s.estado === "Pendiente") return;

    const datos = {
        radicado: s.radicado,
        fechaRespuesta: s.fechaRespuesta,
        administrador: nombreAdministrador(s),
        correo: s.adminCorreo,
        nombreDespacho: s.nombreDespacho,
        codigoDespacho: s.codigoDespacho,
        consejoSeccional: s.consejoseccional
    };
    if (s.estado === "Aprobado") datos.password = s.passwordTemporal || generarPassword();
    if (s.estado === "Rechazado") datos.motivoRechazo = s.motivoRechazo;

    const plantilla = s.estado === "Aprobado" ? "email_crear_admin_permanente_aprobado.html" : "email_crear_admin_permanente_rechazado.html";
    const ventana = window.open(`${plantilla}?data=${encodeURIComponent(JSON.stringify(datos))}`, "_blank");

    s.notificado = true;
    cerrarModal("modal-detalle");
    renderizarTablaPermanentes();
    if (!ventana) mostrarDialogoAlerta("Ventana bloqueada", "El navegador bloqueó la ventana del correo: permita las ventanas emergentes para este sitio.", "⚠️");
}

// ---------------------------------------------------------------------
// 3. Rechazar: motivo obligatorio (con motivos frecuentes)
// ---------------------------------------------------------------------
function abrirModalRechazo(id) {
    const s = obtenerSolicitud(id);
    if (!s || s.estado !== "Pendiente") return;
    solicitudActualId = s.id;

    document.getElementById("rechazo-resumen").innerHTML =
        `<strong style="font-family: monospace; color: var(--primary-green);">${esc(s.radicado)}</strong> · ${esc(s.nombreDespacho)}<br>
         <span style="color: var(--text-muted);">Solicitante: ${esc(nombreAdministrador(s))} (${esc(s.adminCorreo)})</span>`;

    // Sugerir como motivo las alertas encontradas en la verificación automática
    const alertas = validacionesSolicitud(s).filter(v => !v.ok).map(v => v.texto + ".");
    const motivos = [...new Set([...alertas, ...dbPostulaciones.motivosRechazo])];
    document.getElementById("rechazo-motivos").innerHTML = motivos.map((m, i) =>
        `<button type="button" onclick="agregarMotivo(${i})" data-motivo="${esc(m)}" style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 999px; padding: 0.3rem 0.7rem; font-size: 0.75rem; cursor: pointer; color: var(--text-main); text-align: left;">+ ${esc(m)}</button>`
    ).join("");

    document.getElementById("input-motivo-rechazo").value = "";
    abrirModal("modal-rechazo");
}

function agregarMotivo(indice) {
    const boton = document.querySelectorAll("#rechazo-motivos button")[indice];
    const texto = boton.dataset.motivo;
    const campo = document.getElementById("input-motivo-rechazo");
    if (!campo.value.includes(texto)) campo.value = campo.value.trim() ? `${campo.value.trim()} ${texto}` : texto;
    boton.style.background = "#fee2e2";
    boton.style.borderColor = "#fecaca";
    campo.focus();
}

function confirmarRechazo() {
    const s = obtenerSolicitud();
    const motivo = document.getElementById("input-motivo-rechazo").value.trim();

    if (!motivo) {
        mostrarDialogoAlerta("Falta el motivo", "Debe especificar el motivo del rechazo; se enviará al solicitante.", "⚠️");
        return;
    }

    mostrarDialogoConfirmacion(
        "¿Rechazar la postulación?",
        `Se rechazará la postulación ${s.radicado} de ${s.nombreDespacho} y se notificará a ${s.adminCorreo}.`,
        () => {
            s.estado = "Rechazado";
            s.fechaRespuesta = hoy();
            s.motivoRechazo = motivo;
            s.notificado = false;
            cerrarModal("modal-rechazo");
            cerrarModal("modal-detalle");
            enviarNotificacion(s.id); // abre directamente el correo de rechazo, como antes
        },
        "✖",
        "Sí, rechazar"
    );
}

// ---------------------------------------------------------------------
// 4. Corregir datos de la postulación (antes de aprobar)
// ---------------------------------------------------------------------
function poblarSelectDinamico(elementId, opcionesArray, valorActual) {
    const select = document.getElementById(elementId);
    if (!select || !opcionesArray) return;
    select.innerHTML = '<option value="" disabled>Seleccione una opción...</option>' +
        opcionesArray.map(o => `<option value="${esc(o.value)}" ${o.value === valorActual ? "selected" : ""}>${esc(o.label)}</option>`).join("");
    if (!valorActual) select.value = "";
}

function filtrarOpciones(elementId, catalogo, texto) {
    const select = document.getElementById(elementId);
    const actual = select.value;
    const q = normalizar(texto);
    const opciones = dbDatos.opcionesSelects[catalogo].filter(o => normalizar(o.label).includes(q));
    poblarSelectDinamico(elementId, opciones, actual);
    if (opciones.length === 1) select.value = opciones[0].value;
}

function abrirModalEdicion(id) {
    const s = obtenerSolicitud(id);
    if (!s || s.estado !== "Pendiente") return;
    solicitudActualId = s.id;

    document.getElementById("form-editar-despacho").reset();
    document.getElementById("edicion-titulo").textContent = `✏️ Corregir postulación ${s.radicado}`;

    document.getElementById("edit-admin-pnombre").value = s.adminPrimerNombre || "";
    document.getElementById("edit-admin-snombre").value = s.adminSegundoNombre || "";
    document.getElementById("edit-admin-papellido").value = s.adminPrimerApellido || "";
    document.getElementById("edit-admin-sapellido").value = s.adminSegundoApellido || "";
    document.getElementById("edit-admin-correo").value = s.adminCorreo || "";

    const cat = dbDatos.opcionesSelects;
    poblarSelectDinamico("edit-jurisdiccion", cat.jurisdiccion, s.jurisdiccion);
    poblarSelectDinamico("edit-tipodespacho", cat.tipodespacho, s.tipodespacho);
    poblarSelectDinamico("edit-deptomunicipio", cat.deptomunicipio, s.deptomunicipio);
    poblarSelectDinamico("edit-consejoseccional", cat.consejoseccional, s.consejoseccional);
    poblarSelectDinamico("edit-distrito", cat.distrito, s.distrito);
    poblarSelectDinamico("edit-circuito", cat.circuito, s.circuito);
    poblarSelectDinamico("edit-especialidad", cat.especialidad, s.especialidad);

    document.getElementById("edit-codigo-despacho").value = s.codigoDespacho || "";
    document.getElementById("edit-nombre-despacho").value = s.nombreDespacho || "";

    cerrarModal("modal-detalle");
    abrirModal("modal-edicion");
}

// 5. Guardar los cambios y volver a la revisión
function guardarEdicionDespacho(event) {
    event.preventDefault();
    const s = obtenerSolicitud();
    if (!s) return;

    const v = id => document.getElementById(id).value.trim();
    Object.assign(s, {
        adminPrimerNombre: v("edit-admin-pnombre"),
        adminSegundoNombre: v("edit-admin-snombre"),
        adminPrimerApellido: v("edit-admin-papellido"),
        adminSegundoApellido: v("edit-admin-sapellido"),
        adminCorreo: v("edit-admin-correo"),
        jurisdiccion: v("edit-jurisdiccion"),
        tipodespacho: v("edit-tipodespacho"),
        deptomunicipio: v("edit-deptomunicipio"),
        consejoseccional: v("edit-consejoseccional"),
        distrito: v("edit-distrito"),
        circuito: v("edit-circuito"),
        especialidad: v("edit-especialidad"),
        codigoDespacho: v("edit-codigo-despacho"),
        nombreDespacho: v("edit-nombre-despacho"),
        tipo: "Permanente"
    });

    cerrarModal("modal-edicion");
    llenarFiltros();
    renderizarTablaPermanentes();
    verDetalleSolicitud(s.id); // vuelve a la revisión con la verificación actualizada
}

// ---------------------------------------------------------------------
// Inicio
// ---------------------------------------------------------------------
document.addEventListener("keydown", e => {
    if (e.key !== "Escape") return;
    const orden = ["modal-dialogo-alerta", "modal-rechazo", "modal-edicion", "modal-detalle"];
    const abierto = orden.find(id => document.getElementById(id).classList.contains("visible"));
    if (abierto) cerrarModal(abierto);
});

window.onload = function () {
    if (typeof dbPostulaciones === "undefined" || typeof dbDatos === "undefined") {
        console.error("Faltan js/data.js o js/data_postulaciones.js");
        return;
    }
    llenarFiltros();
    renderizarTablaPermanentes();
};