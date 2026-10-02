// =====================================================================
// RUNPD - Registro de procesos del despacho permanente POR MEDIDA
// Flujo: 1) el despacho selecciona la medida que configuró la UDAE
//        2) registra los procesos de esa medida hasta el número autorizado
//        3) los envía al Consejo Seccional
// Los datos vienen de js/data_procesos.js (constante dbProcesos)
// =====================================================================

const despachoActual = dbProcesos.despachoActual;
let partesForm = { demandantes: [], demandados: [] };
let medidaActualId = null; // medida seleccionada en el paso 1
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

function diasDesde(iso) {
    return Math.round((new Date(hoy() + "T00:00:00") - new Date(iso + "T00:00:00")) / 86400000);
}

function normalizar(texto) {
    return String(texto || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

// Los datos usan consejoseccional / nombreDespacho (antes se leían con otro nombre y salía "undefined")
function consejoDestino() {
    return despachoActual.consejoseccional || despachoActual.consejoSeccional || "";
}

function nombreDelDespacho() {
    return despachoActual.nombreDespacho || despachoActual.nombre || "";
}

function nombreParte(p) {
    if (!p) return "";
    if (p.tipo === "juridica") return p.nombre;
    return [p.primerNombre, p.segundoNombre, p.primerApellido, p.segundoApellido].filter(Boolean).join(" ");
}

function listarPartes(lista) {
    return lista.map(p => `${p.tipo === "juridica" ? "🏢" : "👤"} ${esc(nombreParte(p))}`).join("<br>");
}

function parteVacia() {
    return { tipo: "natural", primerNombre: "", segundoNombre: "", primerApellido: "", segundoApellido: "", nombre: "", correo: "" };
}

// ---------------------------------------------------------------------
// Medidas y número de procesos autorizados
// ---------------------------------------------------------------------
function obtenerMedida(id) {
    return dbProcesos.medidas.find(m => m.id === Number(id));
}

function medidaActual() {
    return obtenerMedida(medidaActualId);
}

function textoAcuerdo(m) {
    return m ? `Acuerdo ${m.acuerdo.numero} de ${m.acuerdo.anio}` : "";
}

// Número de procesos que la UDAE autorizó a este despacho en la medida
function cupoMedida(m) {
    return m.destinos.reduce((t, d) => t + Number(d.procesos), 0);
}

function procesosDeMedida(m) {
    return dbProcesos.procesos.filter(p => p.medidaId === m.id);
}

function infoVigencia(m) {
    const actual = hoy();
    if (actual < m.fechaInicio) return { clave: "futura", texto: `Inicia el ${formatoFecha(m.fechaInicio)}`, fondo: "#dbeafe", color: "#1d4ed8" };
    const dias = Math.round((new Date(m.fechaFin + "T00:00:00") - new Date(actual + "T00:00:00")) / 86400000);
    if (dias < 0)   return { clave: "vencida", texto: "Medida vencida", fondo: "#fee2e2", color: "#991b1b" };
    if (dias <= 60) return { clave: "por_vencer", texto: `Vence en ${dias} día(s)`, fondo: "#fef3c7", color: "#92400e" };
    return { clave: "vigente", texto: `Vigente hasta ${formatoFecha(m.fechaFin)}`, fondo: "#dcfce7", color: "#166534" };
}

function puedeRegistrar(m) {
    return infoVigencia(m).clave !== "vencida" && procesosDeMedida(m).length < cupoMedida(m);
}

function abrirModal(id) { document.getElementById(id).classList.add("visible"); }
function cerrarModal(id) { document.getElementById(id).classList.remove("visible"); }

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
// Información del despacho (compacta)
// ---------------------------------------------------------------------
function renderizarInfoDespacho() {
    const contenedor = document.getElementById("info-despacho-card");
    if (!contenedor) return;

    const d = despachoActual;
    const nombreCompletoAdmin = [d.adminPrimerNombre, d.adminSegundoNombre, d.adminPrimerApellido, d.adminSegundoApellido].filter(Boolean).join(" ");

    const dato = (etiqueta, valor) => `
        <div>
            <div style="font-size: 0.68rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.3px;">${etiqueta}</div>
            <div style="font-size: 0.82rem; font-weight: 600; color: var(--text-main); word-break: break-word;">${valor || "—"}</div>
        </div>`;

    const bloque = (titulo, contenido) => `
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 0.7rem 0.9rem;">
            <div style="font-size: 0.78rem; font-weight: 700; color: var(--primary-green); margin-bottom: 0.5rem;">${titulo}</div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem 0.75rem;">${contenido}</div>
        </div>`;

    contenedor.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; flex-wrap: wrap; margin-bottom: 0.85rem;">
            <div style="display: flex; align-items: center; gap: 0.85rem;">
                <div style="width: 2.8rem; height: 2.8rem; border-radius: 10px; background: #e6f4ea; display: flex; align-items: center; justify-content: center; font-size: 1.4rem;">🏛️</div>
                <div>
                    <div style="font-weight: 700; color: var(--text-main); font-size: 0.98rem;">${esc(nombreDelDespacho())}</div>
                    <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.1rem;">
                        Código <span style="font-family: monospace; font-weight: 700; color: var(--primary-green);">${esc(d.codigoDespacho || "N/A")}</span>
                        &nbsp;·&nbsp; <span style="background: #e6f4ea; color: var(--primary-green); padding: 0.1rem 0.45rem; border-radius: 4px; font-weight: 600; font-size: 0.72rem;">${esc(d.estado || "Activo")}</span>
                    </div>
                </div>
            </div>
            <div style="background: #e6f4ea; color: var(--primary-green); padding: 0.45rem 0.85rem; border-radius: 6px; font-size: 0.8rem; font-weight: 600;">
                📤 Destino de envío: Consejo Seccional de ${esc(consejoDestino())}
            </div>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 0.75rem;">
            ${bloque("🏛️ Despacho", `
                ${dato("Jurisdicción", esc(d.jurisdiccion))}
                ${dato("Tipo de despacho", esc(d.tipodespacho))}
                ${dato("Tipo", esc(d.tipo))}
                ${dato("Especialidad", esc(d.especialidad))}`)}
            ${bloque("📍 Ubicación", `
                ${dato("Consejo Seccional", esc(consejoDestino()))}
                ${dato("Municipio", esc(d.deptomunicipio))}
                ${dato("Distrito", esc(d.distrito))}
                ${dato("Circuito", esc(d.circuito))}`)}
            ${bloque("👤 Administrador", `
                ${dato("Primer nombre", esc(d.adminPrimerNombre))}
                ${dato("Segundo nombre", esc(d.adminSegundoNombre))}
                ${dato("Primer apellido", esc(d.adminPrimerApellido))}
                ${dato("Segundo apellido", esc(d.adminSegundoApellido))}
                <div style="grid-column: 1 / -1;">${dato("Correo institucional", d.adminCorreo
                    ? `<a href="mailto:${esc(d.adminCorreo)}" style="color: var(--primary-green); text-decoration: none;">${esc(d.adminCorreo)}</a>` : "")}</div>`)}
        </div>`;
}

// ---------------------------------------------------------------------
// PASO 1: seleccionar la medida
// ---------------------------------------------------------------------
function llenarSelectorMedida() {
    const sel = document.getElementById("selector-medida");
    if (!dbProcesos.medidas.length) {
        sel.innerHTML = `<option value="">Su despacho no tiene medidas de descongestión asignadas</option>`;
        sel.disabled = true;
        return;
    }
    sel.innerHTML = `<option value="" disabled selected>Seleccione una medida...</option>` +
        dbProcesos.medidas.map(m => `<option value="${m.id}">${esc(textoAcuerdo(m))} — ${cupoMedida(m)} proceso(s) a registrar</option>`).join("");

    // Si hay una sola medida, se selecciona sola
    if (dbProcesos.medidas.length === 1) seleccionarMedida(dbProcesos.medidas[0].id);
}

function seleccionarMedida(id) {
    medidaActualId = Number(id) || null;
    document.getElementById("selector-medida").value = medidaActualId || "";
    document.getElementById("filtro-busqueda").value = "";
    renderizarTodo();
}

// Resumen de la medida: lo que configuró la UDAE y el avance del despacho
function renderizarResumenMedida() {
    const cont = document.getElementById("resumen-medida");
    const m = medidaActual();
    document.getElementById("paso-procesos").style.display = m ? "block" : "none";

    if (!m) {
        cont.innerHTML = `<div style="font-size: 0.82rem; color: var(--text-muted);">Seleccione la medida para ver cuántos procesos debe registrar y registrar sus procesos.</div>`;
        return;
    }

    const v = infoVigencia(m);
    const cupo = cupoMedida(m);
    const lista = procesosDeMedida(m);
    const registrados = lista.length;
    const pendientes = lista.filter(p => p.estado === "pendiente").length;
    const enviados = registrados - pendientes;
    const faltan = Math.max(0, cupo - registrados);
    const pct = cupo ? Math.min(100, Math.round((registrados / cupo) * 100)) : 0;
    const cifra = (valor, texto, color) => `
        <div style="text-align: center; padding: 0 0.5rem;">
            <div style="font-size: 1.5rem; font-weight: 800; color: ${color}; line-height: 1;">${valor}</div>
            <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 0.25rem;">${texto}</div>
        </div>`;

    cont.innerHTML = `
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 0.9rem 1rem;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; flex-wrap: wrap;">
                <div style="font-size: 0.82rem; line-height: 1.6;">
                    <div><strong>${esc(textoAcuerdo(m))}</strong> ${m.resolucion ? `· Resolución ${esc(m.resolucion.numero)} de ${m.resolucion.anio}` : ""}</div>
                    <div style="color: var(--text-muted);">Vigencia: ${formatoFecha(m.fechaInicio)} al ${formatoFecha(m.fechaFin)}
                        <span style="font-size: 0.7rem; font-weight: 700; padding: 0.1rem 0.45rem; border-radius: 12px; background: ${v.fondo}; color: ${v.color}; margin-left: 0.3rem;">${v.texto}</span></div>
                    <div style="color: var(--text-muted);">Destino: ${m.destinos.map(d => esc(d.nombre)).join(", ")}</div>
                </div>
                <div style="display: flex; gap: 0.5rem; border-left: 1px solid #e2e8f0; padding-left: 0.75rem;">
                    ${cifra(cupo, "Autorizados por la UDAE", "var(--text-main)")}
                    ${cifra(registrados, "Registrados", "#0369a1")}
                    ${cifra(enviados, "Enviados al Consejo", "var(--primary-green)")}
                    ${cifra(faltan, "Por registrar", faltan ? "#b45309" : "var(--primary-green)")}
                </div>
            </div>
            <div style="height: 8px; background: #e2e8f0; border-radius: 999px; overflow: hidden; margin-top: 0.8rem;">
                <div style="width: ${pct}%; height: 100%; background: ${pct >= 100 ? "var(--primary-green)" : "#0ea5e9"};"></div>
            </div>
            <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.3rem;">
                ${registrados} de ${cupo} procesos registrados${pendientes ? ` · <strong style="color: #b45309;">${pendientes} pendiente(s) de enviar al Consejo</strong>` : ""}
                ${v.clave === "vencida" ? ` · <strong style="color: #991b1b;">La medida venció: no admite nuevos registros.</strong>` : (faltan ? "" : ` · <strong style="color: var(--primary-green);">Ya registró todos los procesos autorizados.</strong>`)}
            </div>
        </div>`;

    // Botón de registro según el cupo
    const btn = document.getElementById("btn-registrar");
    btn.disabled = !puedeRegistrar(m);
    btn.style.opacity = btn.disabled ? "0.5" : "1";
    btn.title = btn.disabled ? "No hay cupo disponible en esta medida" : "";
    document.getElementById("btn-abrir-envio").textContent = pendientes ? `📤 Enviar ${pendientes} al Consejo Seccional` : "📤 Enviar al Consejo Seccional";
}

// ---------------------------------------------------------------------
// PASO 2: tabla de procesos de la medida seleccionada
// ---------------------------------------------------------------------
function renderizarTodo() {
    renderizarResumenMedida();
    renderizarTabla();
}

function renderizarTabla() {
    const m = medidaActual();
    if (!m) return;
    const tbody = document.getElementById("cuerpo-tabla");
    const q = normalizar(document.getElementById("filtro-busqueda").value);
    const orden = { pendiente: 0, enviado: 1, distribuido: 2 };

    const lista = procesosDeMedida(m)
        .filter(p => !q || normalizar([p.codigo, ...p.demandantes.map(nombreParte), ...p.demandados.map(nombreParte)].join(" ")).includes(q))
        .sort((a, b) => (orden[a.estado] ?? 9) - (orden[b.estado] ?? 9));

    if (lista.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-muted); padding: 2rem;">
            ${procesosDeMedida(m).length ? "Ningún proceso coincide con la búsqueda." : 'Aún no ha registrado procesos en esta medida. Use "Registrar proceso".'}</td></tr>`;
        return;
    }

    tbody.innerHTML = lista.map(p => {
        const editable = p.estado === "pendiente";
        const est = dbProcesos.estadosEnvio[p.estado];
        const dias = diasDesde(p.fechaActuacion);
        return `
        <tr>
            <td><a href="#" onclick="verDetalle(${p.id}); return false;" title="Ver detalle" style="font-family: monospace; font-weight: 600; color: var(--primary-green);">${esc(p.codigo)}</a></td>
            <td style="font-size: 0.8rem; min-width: 200px;">
                <div><span style="color: var(--text-muted); font-weight: 600; font-size: 0.72rem;">Dte.</span> ${listarPartes(p.demandantes)}</div>
                <div style="margin-top: 0.2rem;"><span style="color: var(--text-muted); font-weight: 600; font-size: 0.72rem;">Ddo.</span> ${listarPartes(p.demandados)}</div>
            </td>
            <td style="font-size: 0.85rem;">${esc(p.estadoProceso)}</td>
            <td style="font-size: 0.85rem; white-space: nowrap;">
                ${formatoFecha(p.fechaActuacion)}<br>
                <span style="font-size: 0.72rem; color: ${dias > 180 ? "#dc2626" : "var(--text-muted)"}; font-weight: ${dias > 180 ? 600 : 400};">hace ${dias} día(s)</span>
            </td>
            <td>${p.link ? `<a href="${esc(p.link)}" target="_blank" rel="noopener" style="color: var(--primary-green); font-weight: 500;">🔗 Abrir</a>` : '<span style="color: var(--text-muted);">—</span>'}</td>
            <td><span class="${est.clase}">${est.label}</span>${p.fechaEnvio ? `<br><small style="color: var(--text-muted);">${formatoFecha(p.fechaEnvio)}</small>` : ""}</td>
            <td>
                ${editable ? `
                <div class="action-buttons" style="flex-direction: column; align-items: stretch;">
                    <button class="btn-action edit" style="white-space: nowrap;" onclick="abrirEditarProceso(${p.id})">✏️ Editar</button>
                    <button class="btn-action inactivate" style="white-space: nowrap;" onclick="eliminarProceso(${p.id})">🗑️ Eliminar</button>
                </div>` : `
                <button class="btn-action edit" style="white-space: nowrap;" onclick="verDetalle(${p.id})">👁️ Ver</button>
                <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 0.3rem;">🔒 Enviado</div>`}
            </td>
        </tr>`;
    }).join("");
}

// ---------------------------------------------------------------------
// Detalle de un proceso
// ---------------------------------------------------------------------
function verDetalle(id) {
    const p = dbProcesos.procesos.find(x => x.id === id);
    if (!p) return;
    const est = dbProcesos.estadosEnvio[p.estado];
    const partes = lista => `<ul style="margin: 0.25rem 0 0.5rem 1.2rem;">${lista.map(x =>
        `<li>${x.tipo === "juridica" ? "🏢" : "👤"} ${esc(nombreParte(x))} <span style="color: #64748b;">(${esc(x.correo)})</span></li>`).join("")}</ul>`;

    document.getElementById("contenido-detalle").innerHTML = `
        <div style="background: #f8fafc; padding: 1rem; border-radius: 6px; border: 1px solid #e2e8f0;">
            <div style="display: flex; justify-content: space-between; align-items: center; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 0.5rem;">
                <span style="font-family: monospace; color: #166534; font-weight: 700;">${esc(p.codigo)}</span>
                <span class="${est.clase}">${est.label}</span>
            </div>
            <p style="margin: 0 0 0.3rem 0;"><strong>Medida de descongestión:</strong> ${esc(textoAcuerdo(obtenerMedida(p.medidaId)))}</p>
            <p style="margin: 0 0 0.3rem 0;"><strong>Estado del proceso:</strong> ${esc(p.estadoProceso)}</p>
            <p style="margin: 0 0 0.3rem 0;"><strong>Última actuación:</strong> ${formatoFecha(p.fechaActuacion)}</p>
            ${p.fechaEnvio ? `<p style="margin: 0 0 0.3rem 0;"><strong>Enviado al Consejo:</strong> ${formatoFecha(p.fechaEnvio)}</p>` : ""}
            ${p.notaEnvio ? `<p style="margin: 0 0 0.3rem 0;"><strong>Nota de envío:</strong> ${esc(p.notaEnvio)}</p>` : ""}
            <hr style="border: 0; border-top: 1px solid #cbd5e1; margin: 0.6rem 0;">
            <p style="margin: 0;"><strong>Demandante(s):</strong></p>${partes(p.demandantes)}
            <p style="margin: 0;"><strong>Demandado(s):</strong></p>${partes(p.demandados)}
            <p style="margin: 0;"><strong>Observaciones:</strong> ${esc(p.observaciones || "Sin observaciones.")}</p>
            ${p.link ? `<p style="margin: 0.5rem 0 0 0;"><a href="${esc(p.link)}" target="_blank" rel="noopener" style="color: #0284c7; text-decoration: underline; font-weight: 600;">🔗 Ver expediente en línea</a></p>` : ""}
        </div>`;

    document.getElementById("detalle-acciones").innerHTML = p.estado === "pendiente"
        ? `<button type="button" class="btn btn-secondary" onclick="cerrarModal('modal-detalle')">Cerrar</button>
           <button type="button" class="btn-primary-action" onclick="cerrarModal('modal-detalle'); abrirEditarProceso(${p.id});">✏️ Editar</button>`
        : `<button type="button" class="btn-primary-action" onclick="cerrarModal('modal-detalle')">Cerrar</button>`;

    abrirModal("modal-detalle");
}

// ---------------------------------------------------------------------
// Formulario: registrar / editar (siempre dentro de la medida seleccionada)
// ---------------------------------------------------------------------
function llenarEstados(valor = "") {
    const sel = document.getElementById("estado_proceso");
    sel.innerHTML = '<option value="" disabled selected>Seleccione una opción...</option>';
    dbProcesos.opcionesSelects.estadoProceso.forEach(e => {
        const opt = document.createElement("option");
        opt.value = e.value;
        opt.textContent = e.label;
        if (e.value === valor) opt.selected = true;
        sel.appendChild(opt);
    });
}

function contarDigitos(input) {
    input.value = input.value.replace(/\D/g, "").slice(0, 23);
    const contador = document.getElementById("codigo-contador");
    contador.textContent = `${input.value.length}/23`;
    contador.style.color = input.value.length === 23 ? "var(--primary-green)" : "var(--text-muted)";
    contador.style.fontWeight = input.value.length === 23 ? "700" : "400";
}

function mostrarMedidaEnFormulario(m, esEdicion) {
    const registrados = procesosDeMedida(m).length;
    const numero = esEdicion ? registrados : registrados + 1;
    document.getElementById("medida-formulario").innerHTML =
        `📜 <strong>${esc(textoAcuerdo(m))}</strong> · ${esEdicion ? "Editando proceso de la medida" : `Proceso <strong>${numero} de ${cupoMedida(m)}</strong> autorizados`}`;
}

function abrirNuevoProceso() {
    const m = medidaActual();
    if (!m) return;
    if (!puedeRegistrar(m)) {
        mostrarDialogoAlerta("No puede registrar más procesos",
            infoVigencia(m).clave === "vencida"
                ? "La medida está vencida y no admite nuevos registros."
                : `Ya registró los ${cupoMedida(m)} procesos autorizados por la UDAE en esta medida.`, "ℹ️");
        return;
    }
    document.getElementById("form-proceso").reset();
    document.getElementById("proceso-id").value = "";
    document.getElementById("form-titulo").textContent = "📝 Registrar proceso";
    mostrarMedidaEnFormulario(m, false);
    document.getElementById("fecha_actuacion").max = hoy();
    contarDigitos(document.getElementById("codigo_proceso"));
    llenarEstados();
    partesForm = { demandantes: [parteVacia()], demandados: [parteVacia()] };
    renderizarPartes("demandantes");
    renderizarPartes("demandados");
    abrirModal("modal-proceso");
}

function abrirEditarProceso(id) {
    const p = dbProcesos.procesos.find(x => x.id === id);
    if (!p || p.estado !== "pendiente") return;

    document.getElementById("form-proceso").reset();
    document.getElementById("proceso-id").value = p.id;
    document.getElementById("form-titulo").textContent = `✏️ Editar proceso ${p.codigo}`;
    mostrarMedidaEnFormulario(obtenerMedida(p.medidaId), true);
    document.getElementById("codigo_proceso").value = p.codigo;
    contarDigitos(document.getElementById("codigo_proceso"));
    llenarEstados(p.estadoProceso);
    document.getElementById("fecha_actuacion").max = hoy();
    document.getElementById("fecha_actuacion").value = p.fechaActuacion;
    document.getElementById("link_proceso").value = p.link;
    document.getElementById("observaciones").value = p.observaciones;

    partesForm = JSON.parse(JSON.stringify({ demandantes: p.demandantes, demandados: p.demandados }));
    renderizarPartes("demandantes");
    renderizarPartes("demandados");
    abrirModal("modal-proceso");
}

// ---------------------------------------------------------------------
// 7. Demandantes y demandados (persona natural o jurídica)
// ---------------------------------------------------------------------
function campo(rol, i, clave, etiqueta, requerido, tipo = "text", placeholder = "", completo = false) {
    const valor = esc(partesForm[rol][i][clave] || "");
    return `
        <div class="form-group" style="${completo ? "grid-column: 1 / -1;" : ""}">
            <label>${etiqueta}</label>
            <input type="${tipo}" class="form-control" value="${valor}" placeholder="${placeholder}" ${requerido ? "required" : ""}
                   oninput="partesForm['${rol}'][${i}]['${clave}'] = this.value">
        </div>`;
}

function renderizarPartes(rol) {
    const singular = rol === "demandantes" ? "Demandante" : "Demandado";

    document.getElementById(`lista-${rol}`).innerHTML = partesForm[rol].map((p, i) => `
        <div style="border: 1px solid #e2e8f0; border-radius: 6px; padding: 1rem; margin-bottom: 1rem; background: #fcfcfd;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
                <strong style="font-size: 0.85rem; color: var(--text-main);">${p.tipo === "juridica" ? "🏢" : "👤"} ${singular} ${i + 1}</strong>
                ${partesForm[rol].length > 1 ? `<button type="button" class="btn-action inactivate" onclick="quitarParte('${rol}',${i})">🗑️ Quitar</button>` : ""}
            </div>
            <div class="form-grid" style="grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0 1.25rem; margin-bottom: 0;">
                <div class="form-group" style="grid-column: 1 / -1;">
                    <label>Tipo de Persona</label>
                    <select class="form-control" onchange="cambiarTipo('${rol}', ${i}, this.value)">
                        ${dbProcesos.opcionesSelects.tipoPersona.map(t =>
                            `<option value="${t.value}" ${p.tipo === t.value ? "selected" : ""}>${t.label}</option>`).join("")}
                    </select>
                </div>
                ${p.tipo === "natural"
                    ? campo(rol, i, "primerNombre", "Primer Nombre", true, "text", "Ej: Carlos") +
                      campo(rol, i, "segundoNombre", "Segundo Nombre", false, "text", "Ej: Andrés") +
                      campo(rol, i, "primerApellido", "Primer Apellido", true, "text", "Ej: Pérez") +
                      campo(rol, i, "segundoApellido", "Segundo Apellido", false, "text", "Ej: Gómez")
                    : campo(rol, i, "nombre", "Nombre / Razón Social", true, "text", "Ej: EMPRESA S.A.S.", true)}
                ${campo(rol, i, "correo", "Correo Electrónico", true, "email", "Ej: correo@dominio.com", true)}
            </div>
        </div>`).join("");
}

function agregarParte(rol) {
    partesForm[rol].push(parteVacia());
    renderizarPartes(rol);
}

function quitarParte(rol, i) {
    partesForm[rol].splice(i, 1);
    renderizarPartes(rol);
}

function cambiarTipo(rol, i, tipo) {
    partesForm[rol][i].tipo = tipo;
    renderizarPartes(rol);
}

// ---------------------------------------------------------------------
// Guardar o actualizar proceso
// ---------------------------------------------------------------------
function guardarProceso(event) {
    event.preventDefault();
    const id = document.getElementById("proceso-id").value;
    const codigo = document.getElementById("codigo_proceso").value.trim();
    const m = medidaActual();

    if (dbProcesos.procesos.some(p => p.codigo === codigo && String(p.id) !== id)) {
        mostrarDialogoAlerta("Código repetido", `Ya existe un proceso registrado con el código ${codigo}.`, "⚠️");
        return;
    }
    if (!id && !puedeRegistrar(m)) {
        mostrarDialogoAlerta("No puede registrar más procesos", `Ya registró los ${cupoMedida(m)} procesos autorizados en esta medida.`, "⚠️");
        return;
    }

    const limpiar = lista => lista.map(p => p.tipo === "natural"
        ? { ...p, nombre: "" }
        : { ...p, primerNombre: "", segundoNombre: "", primerApellido: "", segundoApellido: "" });

    const datos = {
        codigo,
        estadoProceso: document.getElementById("estado_proceso").value,
        fechaActuacion: document.getElementById("fecha_actuacion").value,
        link: document.getElementById("link_proceso").value.trim(),
        observaciones: document.getElementById("observaciones").value.trim(),
        demandantes: limpiar(partesForm.demandantes),
        demandados: limpiar(partesForm.demandados)
    };

    if (id) {
        const index = dbProcesos.procesos.findIndex(p => p.id === parseInt(id));
        dbProcesos.procesos[index] = { ...dbProcesos.procesos[index], ...datos };
    } else {
        dbProcesos.procesos.unshift({ id: Date.now(), medidaId: m.id, ...datos, estado: "pendiente", fechaEnvio: "" });
    }

    cerrarModal("modal-proceso");
    renderizarTodo();
    const faltan = cupoMedida(m) - procesosDeMedida(m).length;
    mostrarDialogoAlerta(id ? "Proceso actualizado" : "Proceso registrado",
        id ? `Se guardaron los cambios del proceso ${codigo}.`
           : `El proceso ${codigo} quedó registrado en el ${textoAcuerdo(m)}. ${faltan ? `Faltan ${faltan} proceso(s) por registrar.` : "Ya registró todos los procesos autorizados."}`);
}

// ---------------------------------------------------------------------
// 9. Eliminar proceso (con confirmación)
// ---------------------------------------------------------------------
function eliminarProceso(id) {
    const p = dbProcesos.procesos.find(x => x.id === id);
    if (!p || p.estado !== "pendiente") return;
    mostrarDialogoConfirmacion(
        "¿Eliminar el proceso?",
        `Se eliminará el proceso ${p.codigo}. Esta acción no se puede deshacer.`,
        () => {
            dbProcesos.procesos = dbProcesos.procesos.filter(x => x.id !== id);
            renderizarTodo();
        },
        "🗑️",
        "Sí, eliminar"
    );
}

// ---------------------------------------------------------------------
// Enviar al Consejo Seccional (procesos pendientes de la medida seleccionada)
// ---------------------------------------------------------------------
function abrirEnvio() {
    const m = medidaActual();
    const pendientes = procesosDeMedida(m).filter(p => p.estado === "pendiente");
    if (pendientes.length === 0) {
        mostrarDialogoAlerta("Sin procesos pendientes", "Esta medida no tiene procesos pendientes de envío.", "ℹ️");
        return;
    }

    document.getElementById("envio-titulo").textContent = `📤 Enviar al Consejo Seccional de ${consejoDestino()} · ${textoAcuerdo(m)}`;
    document.getElementById("check-todos").checked = true;
    document.getElementById("nota_envio").value = "";
    document.getElementById("cuerpo-envio").innerHTML = pendientes.map(p => `
        <tr>
            <td><input type="checkbox" class="check-envio" value="${p.id}" checked onchange="actualizarContadorEnvio()"></td>
            <td><span style="font-family: monospace; font-weight: 600; color: var(--primary-green);">${esc(p.codigo)}</span></td>
            <td style="font-size: 0.8rem;">${esc(nombreParte(p.demandantes[0]))} <small style="color: var(--text-muted);">vs</small> ${esc(nombreParte(p.demandados[0]))}</td>
            <td style="font-size: 0.8rem;">${esc(p.estadoProceso)}</td>
        </tr>`).join("");
    actualizarContadorEnvio();
    abrirModal("modal-envio");
}

function marcarTodos(marcado) {
    document.querySelectorAll(".check-envio").forEach(c => c.checked = marcado);
    actualizarContadorEnvio();
}

function actualizarContadorEnvio() {
    const total = document.querySelectorAll(".check-envio").length;
    const marcados = document.querySelectorAll(".check-envio:checked").length;
    document.getElementById("envio-contador").innerHTML = `<strong>${marcados}</strong> de ${total} proceso(s) seleccionado(s)`;
    document.getElementById("btn-enviar").textContent = marcados ? `📤 Enviar ${marcados} proceso(s)` : "📤 Enviar procesos";
    document.getElementById("check-todos").checked = total > 0 && marcados === total;
}

function confirmarEnvio() {
    const ids = [...document.querySelectorAll(".check-envio:checked")].map(c => parseInt(c.value));
    if (ids.length === 0) {
        mostrarDialogoAlerta("Seleccione procesos", "Marque al menos un proceso para enviar.", "⚠️");
        return;
    }

    const m = medidaActual();
    const nota = document.getElementById("nota_envio").value.trim();
    const procesosEnviados = [];

    dbProcesos.procesos.forEach(p => {
        if (ids.includes(p.id)) {
            p.estado = "enviado";
            p.fechaEnvio = hoy();
            p.consejoSeccional = consejoDestino();
            p.despachoOrigen = nombreDelDespacho();
            p.notaEnvio = nota;
            procesosEnviados.push({
                medida: textoAcuerdo(m),
                codigo: p.codigo,
                estadoProceso: p.estadoProceso,
                fechaActuacion: p.fechaActuacion,
                demandantes: p.demandantes,
                demandados: p.demandados,
                observaciones: p.observaciones,
                link: p.link
            });
        }
    });

    cerrarModal("modal-envio");
    renderizarTodo();

    // Datos para la plantilla del correo al Consejo Seccional
    const payload = {
        nombreDespacho: nombreDelDespacho(),
        codigoDespacho: despachoActual.codigoDespacho,
        consejoSeccional: consejoDestino(),
        fechaEnvio: hoy(),
        nota: nota,
        medida: {
            acuerdo: textoAcuerdo(m),
            resolucion: m.resolucion ? `Resolución ${m.resolucion.numero} de ${m.resolucion.anio}` : "",
            vigencia: `${formatoFecha(m.fechaInicio)} al ${formatoFecha(m.fechaFin)}`,
            autorizados: cupoMedida(m),
            remitidosTotal: procesosDeMedida(m).filter(x => x.estado !== "pendiente").length,
            destinos: m.destinos
        },
        procesos: procesosEnviados
    };
    const ventana = window.open(`email_crear_procesos_permanantes.html?data=${encodeURIComponent(JSON.stringify(payload))}`, "_blank");

    let mensaje = `Se enviaron ${procesosEnviados.length} proceso(s) del ${textoAcuerdo(m)} al Consejo Seccional de ${consejoDestino()} para su distribución.`;
    if (!ventana) mensaje += " El navegador bloqueó la ventana del correo: permita las ventanas emergentes para este sitio.";
    mostrarDialogoAlerta("Procesos enviados", mensaje, "📤");
}

// ---------------------------------------------------------------------
// Inicializar al cargar
// ---------------------------------------------------------------------
document.addEventListener("keydown", e => {
    if (e.key !== "Escape") return;
    const orden = ["modal-dialogo-alerta", "modal-detalle", "modal-envio", "modal-proceso"];
    const abierto = orden.find(id => document.getElementById(id).classList.contains("visible"));
    if (abierto) cerrarModal(abierto);
});

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("texto-despacho").textContent =
        `Seleccione la medida de descongestión configurada por la UDAE, registre sus procesos y envíelos al Consejo Seccional de ${consejoDestino()}.`;
    renderizarInfoDespacho();
    llenarSelectorMedida();
    renderizarResumenMedida();
});