// =====================================================================
// RUNPD - Consejo Seccional: aprobación de la distribución por medida
// La distribución ya está definida en la medida (origen → destino → cantidad).
// El Consejo revisa cada envío del despacho permanente y lo APRUEBA o lo DEVUELVE.
// Al aprobar: los procesos quedan asignados al destino, se descuentan del cupo
// de la ruta y se abre el correo de notificación al despacho de descongestión.
// Datos: js/data_traslados.js (dbTraslados). Sin localStorage.
// =====================================================================

let envioActualId = null;
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

function formatoFecha(iso) {
    if (!iso) return "—";
    const [a, m, d] = iso.split("-");
    return `${d}/${m}/${a}`;
}

function diasEntre(desde, hasta) {
    return Math.round((new Date(hasta + "T00:00:00") - new Date(desde + "T00:00:00")) / 86400000);
}

function nombreParte(p) {
    if (!p) return "";
    if (p.nombre) return p.nombre;
    return [p.primerNombre, p.segundoNombre, p.primerApellido, p.segundoApellido].filter(Boolean).join(" ");
}

function nombresPartes(lista) {
    return (lista || []).map(nombreParte).filter(Boolean).join(", ") || "No especificado";
}

function cerrarModal(id) { document.getElementById(id).classList.remove("visible"); }
function abrirModal(id) { document.getElementById(id).classList.add("visible"); }

// ---------------------------------------------------------------------
// Medida, ruta y destino de cada envío
// ---------------------------------------------------------------------
function obtenerEnvio(id = envioActualId) {
    return dbTraslados.envios.find(e => e.id === Number(id));
}

function obtenerMedida(id) {
    return dbTraslados.medidas.find(m => m.id === Number(id));
}

function textoAcuerdo(m) {
    return m ? `Acuerdo ${m.acuerdo.numero} de ${m.acuerdo.anio}` : "Sin medida";
}

// La ruta de la medida para el despacho que remite (define el destino y la cantidad)
function rutaDelEnvio(envio) {
    const m = obtenerMedida(envio.medidaId);
    return m ? m.rutas.find(r => r.origen === envio.codigoDespacho) : null;
}

function destinoDelEnvio(envio) {
    const ruta = rutaDelEnvio(envio);
    return ruta ? dbTraslados.despachosDescongestion.find(d => d.id === ruta.destinoId) : null;
}

function chip(texto, fondo, color) {
    return `<span style="display: inline-block; font-size: 0.72rem; font-weight: 700; padding: 0.15rem 0.5rem; border-radius: 12px; background: ${fondo}; color: ${color}; white-space: nowrap;">${texto}</span>`;
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
// Indicadores y filtros
// ---------------------------------------------------------------------
function renderizarIndicadores() {
    const pendientes = dbTraslados.envios.filter(e => e.estado === "pendiente");
    const aprobadas = dbTraslados.envios.filter(e => e.estado === "aprobada");
    const tarjetas = [
        { icono: "📥", valor: pendientes.length, texto: "Envíos por aprobar", color: "#f59e0b" },
        { icono: "⏳", valor: pendientes.reduce((t, e) => t + e.procesos.length, 0), texto: "Procesos por aprobar", color: "#b45309" },
        { icono: "✔", valor: aprobadas.reduce((t, e) => t + e.procesos.length, 0), texto: "Procesos aprobados", color: "var(--primary-green)" },
        { icono: "↩", valor: dbTraslados.envios.filter(e => e.estado === "devuelta").length, texto: "Envíos devueltos", color: "#b45309" },
        { icono: "📜", valor: dbTraslados.medidas.length, texto: "Medidas del Consejo", color: "#0369a1" }
    ];
    document.getElementById("indicadores").innerHTML = tarjetas.map(t => `
        <div style="background: #ffffff; border: 1px solid #e2e8f0; border-top: 4px solid ${t.color}; border-radius: 8px; padding: 0.8rem 1rem; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="font-size: 1.6rem; font-weight: 800; color: var(--text-main);">${t.valor}</span>
                <span style="font-size: 1.3rem;">${t.icono}</span>
            </div>
            <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.15rem;">${t.texto}</div>
        </div>`).join("");
}

function llenarFiltros() {
    document.getElementById("filtro-medida").innerHTML = `<option value="">Todas las medidas</option>` +
        dbTraslados.medidas.map(m => `<option value="${m.id}">${esc(textoAcuerdo(m))}</option>`).join("");
    const especialidades = [...new Set(dbTraslados.envios.map(e => e.especialidad))].sort();
    document.getElementById("filtro-especialidad").innerHTML = `<option value="">Todas las especialidades</option>` +
        especialidades.map(e => `<option value="${esc(e)}">${esc(e)}</option>`).join("");
}

// ---------------------------------------------------------------------
// Tabla de envíos
// ---------------------------------------------------------------------
function renderizarTabla() {
    renderizarIndicadores();
    const estado = document.getElementById("filtro-estado").value;
    const medida = document.getElementById("filtro-medida").value;
    const especialidad = document.getElementById("filtro-especialidad").value;
    const tbody = document.getElementById("cuerpo-tabla");

    const lista = dbTraslados.envios
        .filter(e => (!estado || e.estado === estado) && (!medida || e.medidaId === Number(medida)) && (!especialidad || e.especialidad === especialidad))
        .sort((a, b) => (a.estado === "pendiente" ? 0 : 1) - (b.estado === "pendiente" ? 0 : 1) || a.fechaEnvio.localeCompare(b.fechaEnvio));

    if (!lista.length) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-muted); padding: 2rem;">
            ${estado === "pendiente" ? "✔ No hay envíos pendientes de aprobación." : "No hay envíos con los filtros seleccionados."}</td></tr>`;
        return;
    }

    tbody.innerHTML = lista.map(e => {
        const m = obtenerMedida(e.medidaId);
        const ruta = rutaDelEnvio(e);
        const destino = destinoDelEnvio(e);
        const pendiente = e.estado === "pendiente";
        const espera = diasEntre(e.fechaEnvio, hoy());

        return `
            <tr>
                <td style="min-width: 210px;">
                    <div style="font-size: 0.85rem; font-weight: 600;">${esc(e.nombreDespacho)}</div>
                    <span style="font-size: 0.75rem; color: var(--text-muted);">Código: <span style="font-family: monospace; font-weight: 600; color: var(--primary-green);">${esc(e.codigoDespacho)}</span> · ${esc(e.especialidad)}</span>
                </td>
                <td>${chip(`📜 ${esc(m.acuerdo.numero)} de ${m.acuerdo.anio}`, "#e0f2fe", "#0369a1")}</td>
                <td style="font-size: 0.8rem; min-width: 200px;">
                    <strong>➔ ${esc(destino ? destino.nombre : "Sin destino en la medida")}</strong>
                    ${ruta ? `<div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 0.2rem;">Ruta: ${ruta.aprobados} de ${ruta.autorizados} procesos aprobados</div>` : ""}
                </td>
                <td style="font-size: 1rem; font-weight: 700; text-align: center;">${e.procesos.length}</td>
                <td style="font-size: 0.8rem; white-space: nowrap;">
                    ${formatoFecha(e.fechaEnvio)}
                    ${pendiente ? `<br><span style="font-size: 0.72rem; font-weight: 600; color: ${espera > 5 ? "#dc2626" : "#b45309"};">En espera: ${espera} día(s)</span>` : ""}
                </td>
                <td>${pendiente
                    ? chip("⏳ Pendiente de aprobación", "#fef3c7", "#92400e")
                    : e.estado === "devuelta"
                        ? `${chip("↩ Devuelta", "#ffedd5", "#9a3412")}<div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 0.25rem;">${formatoFecha(e.fechaDevolucion)}</div>`
                        : `${chip("✔ Aprobada", "#dcfce7", "#166534")}<div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 0.25rem;">${formatoFecha(e.fechaAprobacion)}</div>`}</td>
                <td>
                    <button class="${pendiente ? "btn-primary-action" : "btn btn-secondary"}" style="padding: 0.4rem 0.8rem; font-size: 0.8rem; white-space: nowrap;" onclick="abrirAprobacion(${e.id})">
                        ${pendiente ? "✔ Revisar y aprobar" : "👁️ Ver"}
                    </button>
                </td>
            </tr>`;
    }).join("");
}

// ---------------------------------------------------------------------
// Revisar y aprobar un envío
// ---------------------------------------------------------------------
function abrirAprobacion(id) {
    const e = obtenerEnvio(id);
    if (!e) return;
    envioActualId = e.id;

    const m = obtenerMedida(e.medidaId);
    const ruta = rutaDelEnvio(e);
    const destino = destinoDelEnvio(e);
    const pendiente = e.estado === "pendiente";
    const n = e.procesos.length;

    const devuelta = e.estado === "devuelta";
    document.getElementById("aprobacion-titulo").textContent = pendiente ? "✔ Revisar y aprobar la distribución" : devuelta ? "↩ Envío devuelto al despacho" : "👁️ Distribución aprobada";
    document.getElementById("aprobacion-subtitulo").innerHTML =
        `📜 <strong>${esc(textoAcuerdo(m))}</strong> · Vigencia ${formatoFecha(m.fechaInicio)} al ${formatoFecha(m.fechaFin)} · Enviado el ${formatoFecha(e.fechaEnvio)}`;

    // Distribución definida por la UDAE y efecto de la aprobación sobre la ruta
    const antes = ruta ? ruta.aprobados : 0;
    const despues = pendiente ? antes + n : antes;
    const supera = ruta && pendiente && despues > ruta.autorizados;
    const pctAntes = ruta ? Math.min(100, ((pendiente ? antes : antes - n) / ruta.autorizados) * 100) : 0;
    const pctEnvio = ruta ? Math.min(100 - pctAntes, (n / ruta.autorizados) * 100) : 0;

    document.getElementById("aprobacion-ruta").innerHTML = `
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 0.9rem 1rem;">
            <div style="font-size: 0.78rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.3px; margin-bottom: 0.5rem;">Distribución definida por la UDAE en la medida</div>
            <div style="display: grid; grid-template-columns: 1fr auto 1fr; gap: 0.75rem; align-items: center;">
                <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 6px; padding: 0.6rem 0.75rem;">
                    <div style="font-size: 0.7rem; color: var(--text-muted);">DESPACHO DE ORIGEN (PERMANENTE)</div>
                    <div style="font-size: 0.83rem; font-weight: 700;">${esc(e.nombreDespacho)}</div>
                </div>
                <div style="text-align: center; color: var(--primary-green); font-weight: 800;">
                    <div style="font-size: 1.3rem;">➔</div>
                    <div style="font-size: 0.75rem;">${n} proceso(s)</div>
                </div>
                <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; padding: 0.6rem 0.75rem;">
                    <div style="font-size: 0.7rem; color: var(--text-muted);">DESPACHO DE DESTINO (DESCONGESTIÓN)</div>
                    <div style="font-size: 0.83rem; font-weight: 700;">${esc(destino ? destino.nombre : "—")}</div>
                </div>
            </div>
            ${ruta ? `
            <div style="height: 8px; background: #e2e8f0; border-radius: 999px; overflow: hidden; display: flex; margin-top: 0.8rem;">
                <div style="width: ${pctAntes}%; background: var(--primary-green);"></div>
                <div style="width: ${pctEnvio}%; background: ${supera ? "#dc2626" : "#7dd3fc"};"></div>
            </div>
            <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.3rem;">
                Cupo de la ruta: <strong style="color: var(--text-main);">${ruta.autorizados}</strong> autorizados ·
                ${pendiente ? `aprobados hasta hoy: ${antes} · con este envío: <strong style="color: ${supera ? "#dc2626" : "var(--text-main)"};">${despues} de ${ruta.autorizados}</strong>`
                            : `aprobados: <strong style="color: var(--text-main);">${antes} de ${ruta.autorizados}</strong>`}
            </div>` : ""}
            ${supera ? `<div style="margin-top: 0.5rem; background: #fee2e2; border: 1px solid #fecaca; color: #991b1b; border-radius: 6px; padding: 0.5rem 0.7rem; font-size: 0.78rem;">⚠️ Este envío supera la cantidad autorizada por la UDAE para la ruta. No se puede aprobar.</div>` : ""}
            ${e.nota ? `<div style="margin-top: 0.6rem; font-size: 0.78rem; color: #92400e; background: #fef3c7; border: 1px solid #fde68a; border-radius: 6px; padding: 0.45rem 0.7rem;">💬 Nota del despacho que remite: ${esc(e.nota)}</div>` : ""}
            ${devuelta ? `<div style="margin-top: 0.6rem; font-size: 0.8rem; color: #9a3412; background: #ffedd5; border: 1px solid #fed7aa; border-radius: 6px; padding: 0.55rem 0.75rem;">
                ↩ <strong>Devuelto el ${formatoFecha(e.fechaDevolucion)}.</strong> ${esc(e.motivoDevolucion)}<br>
                <span style="color: #7c2d12;">Observación: ${esc(e.observacionDevolucion)}</span></div>` : ""}
        </div>`;

    // Procesos (solo lectura)
    document.getElementById("aprobacion-procesos").innerHTML = e.procesos.map((p, i) => `
        <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 6px; padding: 0.55rem 0.7rem; margin-bottom: 0.4rem; font-size: 0.78rem;">
            <div style="display: flex; justify-content: space-between; gap: 0.5rem; align-items: center;">
                <strong style="font-family: monospace; color: #166534;">${i + 1}. ${esc(p.codigo)}</strong>
                <button type="button" onclick="verDetalleProceso(${p.id})" style="background: none; border: none; color: var(--primary-green); font-weight: 600; cursor: pointer; padding: 0; font-size: 0.75rem; text-decoration: underline;">🔍 Ver detalle</button>
            </div>
            <div style="color: #475569; margin-top: 0.2rem;">${esc(nombresPartes(p.demandantes))} <em>c/</em> ${esc(nombresPartes(p.demandados))}</div>
            <div style="margin-top: 0.2rem;"><strong>Estado:</strong> ${esc(p.estadoProceso)} · <strong>Última actuación:</strong> ${formatoFecha(p.fechaActuacion)}</div>
        </div>`).join("");

    // Observación y botones
    const obs = document.getElementById("observacion-consejo");
    obs.value = pendiente ? "" : (e.observacionConsejo || "");
    obs.disabled = !pendiente;
    document.getElementById("bloque-observacion").style.display = pendiente || (!devuelta && e.observacionConsejo) ? "" : "none";

    document.getElementById("aprobacion-acciones").innerHTML = pendiente
        ? `<button type="button" class="btn btn-secondary" style="margin-right: auto;" onclick="cerrarModal('modal-aprobacion')">Cancelar</button>
           <button type="button" class="btn" style="background-color: #ffedd5; color: #9a3412; border: 1px solid #fed7aa;" onclick="abrirDevolucion()">↩ Devolver al despacho</button>
           <button type="button" class="btn-primary-action" ${supera ? "disabled style=\"opacity: 0.5;\"" : ""} onclick="aprobarEnvio()">✔ Aprobar distribución y notificar</button>`
        : `<button type="button" class="btn btn-secondary" onclick="${devuelta ? `enviarCorreoDevolucion(obtenerEnvio(${e.id}))` : `reenviarNotificacion(${e.id})`}">✉️ Reenviar notificación</button>
           <button type="button" class="btn-primary-action" onclick="cerrarModal('modal-aprobacion')">Cerrar</button>`;

    abrirModal("modal-aprobacion");
}

function aprobarEnvio() {
    const e = obtenerEnvio();
    const destino = destinoDelEnvio(e);
    const ruta = rutaDelEnvio(e);
    if (!e || !destino || !ruta) return;
    if (ruta.aprobados + e.procesos.length > ruta.autorizados) return;

    mostrarDialogoConfirmacion(
        "¿Aprobar la distribución?",
        `Se aprobará el traslado de ${e.procesos.length} proceso(s) de ${e.nombreDespacho} a ${destino.nombre}, y se notificará al despacho de descongestión para que los tramite.`,
        () => {
            e.estado = "aprobada";
            e.fechaAprobacion = hoy();
            e.observacionConsejo = document.getElementById("observacion-consejo").value.trim();
            ruta.aprobados += e.procesos.length;

            cerrarModal("modal-aprobacion");
            renderizarTabla();
            const ventana = enviarCorreo(e);
            mostrarDialogoAlerta("Distribución aprobada",
                `Se aprobaron ${e.procesos.length} proceso(s) y se notificó a ${destino.nombre}.` +
                (ventana ? "" : " El navegador bloqueó la ventana del correo: permita las ventanas emergentes para este sitio."));
        },
        "✔",
        "Sí, aprobar"
    );
}

// ---------------------------------------------------------------------
// Devolver el envío al despacho permanente (no consume el cupo de la medida)
// ---------------------------------------------------------------------
function abrirDevolucion() {
    const e = obtenerEnvio();
    if (!e || e.estado !== "pendiente") return;
    const ruta = rutaDelEnvio(e);
    const supera = ruta && ruta.aprobados + e.procesos.length > ruta.autorizados;

    document.getElementById("devolucion-resumen").innerHTML =
        `<strong>${esc(e.nombreDespacho)}</strong> · ${esc(textoAcuerdo(obtenerMedida(e.medidaId)))}<br>
         <span style="color: var(--text-muted);">${e.procesos.length} proceso(s) enviados el ${formatoFecha(e.fechaEnvio)} · Se notificará a ${esc(e.correoDespacho || "el despacho")}</span>`;

    const motivos = [...dbTraslados.motivosDevolucion, "Otro motivo."];
    document.getElementById("devolucion-motivos").innerHTML = motivos.map((m, i) => `
        <label style="display: flex; align-items: flex-start; gap: 0.5rem; font-size: 0.82rem; cursor: pointer; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 6px; padding: 0.45rem 0.6rem;">
            <input type="radio" name="motivo-devolucion" value="${esc(m)}" ${(supera && i === 3) ? "checked" : ""} style="margin-top: 0.15rem; accent-color: #b45309;">
            <span>${esc(m)}</span>
        </label>`).join("");
    document.getElementById("devolucion-observacion").value = "";
    abrirModal("modal-devolucion");
}

function confirmarDevolucion() {
    const e = obtenerEnvio();
    const motivo = (document.querySelector('input[name="motivo-devolucion"]:checked') || {}).value;
    const observacion = document.getElementById("devolucion-observacion").value.trim();

    if (!motivo) return mostrarDialogoAlerta("Falta el motivo", "Seleccione el motivo de la devolución.", "⚠️");
    if (!observacion) return mostrarDialogoAlerta("Falta la observación", "Indique qué debe corregir el despacho antes de volver a enviar los procesos.", "⚠️");

    mostrarDialogoConfirmacion(
        "¿Devolver el envío?",
        `Se devolverán ${e.procesos.length} proceso(s) a ${e.nombreDespacho} para su corrección. No se descontarán del cupo de la medida.`,
        () => {
            e.estado = "devuelta";
            e.fechaDevolucion = hoy();
            e.motivoDevolucion = motivo;
            e.observacionDevolucion = observacion;

            cerrarModal("modal-devolucion");
            cerrarModal("modal-aprobacion");
            renderizarTabla();
            const ventana = enviarCorreoDevolucion(e);
            mostrarDialogoAlerta("Envío devuelto",
                `Se devolvió el envío a ${e.nombreDespacho} y se le notificó para que corrija y vuelva a enviar los procesos.` +
                (ventana ? "" : " El navegador bloqueó la ventana del correo: permita las ventanas emergentes para este sitio."), "↩");
        },
        "↩",
        "Sí, devolver"
    );
}

// Abre el correo de devolución dirigido al despacho permanente
function enviarCorreoDevolucion(e) {
    const m = obtenerMedida(e.medidaId);
    const destino = destinoDelEnvio(e);
    const payload = {
        consejoSeccional: dbTraslados.consejoSeccional,
        despacho: { nombre: e.nombreDespacho, codigo: e.codigoDespacho, correo: e.correoDespacho || "" },
        medida: textoAcuerdo(m),
        vigencia: `${formatoFecha(m.fechaInicio)} al ${formatoFecha(m.fechaFin)}`,
        destino: destino ? destino.nombre : "",
        fechaEnvio: e.fechaEnvio,
        fechaDevolucion: e.fechaDevolucion,
        motivo: e.motivoDevolucion,
        observacion: e.observacionDevolucion,
        procesos: e.procesos.map(p => ({ codigo: p.codigo, estadoProceso: p.estadoProceso, demandantes: p.demandantes, demandados: p.demandados }))
    };
    return window.open(`email_devolucion_envio_consejo.html?data=${encodeURIComponent(JSON.stringify(payload))}`, "_blank");
}

function reenviarNotificacion(id) {
    const e = obtenerEnvio(id);
    const ventana = enviarCorreo(e);
    if (!ventana) mostrarDialogoAlerta("Ventana bloqueada", "Permita las ventanas emergentes para ver el correo.", "⚠️");
}

// Abre el correo de asignación dirigido al despacho de descongestión
function enviarCorreo(e) {
    const destino = destinoDelEnvio(e);
    const payload = {
        nombreDespacho: e.nombreDespacho,
        codigoDespacho: e.codigoDespacho,
        consejoSeccional: dbTraslados.consejoSeccional,
        medida: textoAcuerdo(obtenerMedida(e.medidaId)),
        fechaTraslado: e.fechaAprobacion,
        observacion: e.observacionConsejo || "",
        procesos: e.procesos.map(p => ({
            codigo: p.codigo,
            estadoProceso: p.estadoProceso,
            fechaActuacion: p.fechaActuacion,
            observaciones: p.observaciones,
            link: p.link,
            demandantes: p.demandantes,
            demandados: p.demandados,
            despachoDestino: destino.nombre,
            correoDestino: destino.correo
        }))
    };
    return window.open(`email_distribucion_procesos_descongestion.html?data=${encodeURIComponent(JSON.stringify(payload))}`, "_blank");
}

// ---------------------------------------------------------------------
// Detalle de un proceso
// ---------------------------------------------------------------------
function verDetalleProceso(procId) {
    const e = obtenerEnvio();
    const p = e && e.procesos.find(x => x.id === Number(procId));
    if (!p) return;
    const lista = l => (l && l.length)
        ? `<ul style="margin: 0.25rem 0 0.5rem 1.2rem;">${l.map(x => `<li>${x.tipo === "juridica" ? "🏢" : "👤"} ${esc(nombreParte(x))}${x.correo ? ` <span style="color: #64748b;">(${esc(x.correo)})</span>` : ""}</li>`).join("")}</ul>`
        : `<p style="margin: 0 0 0.5rem 0;">No especificado</p>`;

    document.getElementById("contenido-detalle-proceso").innerHTML = `
        <div style="background: #f8fafc; padding: 1rem; border-radius: 6px; border: 1px solid #e2e8f0;">
            <p style="margin: 0 0 0.4rem 0;"><strong>Código:</strong> <span style="font-family: monospace; color: #166534; font-weight: 700;">${esc(p.codigo)}</span></p>
            <p style="margin: 0 0 0.4rem 0;"><strong>Estado del proceso:</strong> ${esc(p.estadoProceso)}</p>
            <p style="margin: 0 0 0.4rem 0;"><strong>Última actuación:</strong> ${formatoFecha(p.fechaActuacion)}</p>
            <hr style="border: 0; border-top: 1px solid #cbd5e1; margin: 0.6rem 0;">
            <p style="margin: 0;"><strong>Demandante(s):</strong></p>${lista(p.demandantes)}
            <p style="margin: 0;"><strong>Demandado(s):</strong></p>${lista(p.demandados)}
            <p style="margin: 0;"><strong>Observaciones:</strong> ${esc(p.observaciones || "Sin observaciones.")}</p>
            ${p.link ? `<p style="margin: 0.5rem 0 0 0;"><a href="${esc(p.link)}" target="_blank" rel="noopener" style="color: #0284c7; text-decoration: underline; font-weight: 600;">🔗 Ver expediente en línea</a></p>` : ""}
        </div>`;
    abrirModal("modal-detalle-proceso");
}

// ---------------------------------------------------------------------
// Inicio
// ---------------------------------------------------------------------
document.addEventListener("keydown", ev => {
    if (ev.key !== "Escape") return;
    const orden = ["modal-dialogo-alerta", "modal-detalle-proceso", "modal-devolucion", "modal-aprobacion"];
    const abierto = orden.find(id => document.getElementById(id).classList.contains("visible"));
    if (abierto) cerrarModal(abierto);
});

document.addEventListener("DOMContentLoaded", () => {
    llenarFiltros();
    renderizarTabla();
});