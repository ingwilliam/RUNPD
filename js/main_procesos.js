// =====================================================================
// RUNPD - Registro de procesos del despacho permanente
// Los datos vienen de js/data_procesos.js (constante dbProcesos)
// =====================================================================

const despachoActual = dbProcesos.despachoActual;
let partesForm = { demandantes: [], demandados: [] };

// Utilidades
function hoy() {
    const d = new Date();
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

function nombreParte(p) {
    if (p.tipo === "juridica") return p.nombre;
    return [p.primerNombre, p.segundoNombre, p.primerApellido, p.segundoApellido].filter(Boolean).join(" ");
}

function listarPartes(lista) {
    return lista.map(p => `${p.tipo === "juridica" ? "🏢" : "👤"} ${nombreParte(p)}`).join("<br>");
}

function parteVacia() {
    return { tipo: "natural", primerNombre: "", segundoNombre: "", primerApellido: "", segundoApellido: "", nombre: "", correo: "" };
}

function abrirModal(id) { document.getElementById(id).classList.add("visible"); }
function cerrarModal(id) { document.getElementById(id).classList.remove("visible"); }

// 🆕 NUEVO: Mostrar la información detallada del despacho en un diseño compacto de poca altura
function renderizarInfoDespacho() {
    const contenedor = document.getElementById("info-despacho-card");
    if (!contenedor) return;

    // Nombre completo del administrador
    const nombreCompletoAdmin = [
        despachoActual.adminPrimerNombre,
        despachoActual.adminSegundoNombre,
        despachoActual.adminPrimerApellido,
        despachoActual.adminSegundoApellido
    ].filter(Boolean).join(" ");

    contenedor.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.75rem; border-bottom: 1px solid #e2e8f0; padding-bottom: 0.5rem;">
            <h3 style="font-size: 1rem; font-weight: 600; color: var(--text-main); margin: 0; display: flex; align-items: center; gap: 0.4rem;">
                <span>📋</span> Detalle del Despacho Permanente
            </h3>
            <span style="font-size: 0.75rem; background: #e6f4ea; color: var(--primary-green); padding: 0.15rem 0.5rem; border-radius: 4px; font-weight: 600;">Estado: ${despachoActual.estado || 'Activo'}</span>
        </div>
        
        <!-- Contenedor compacto en 3 columnas -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 0.75rem; font-size: 0.85rem;">
            
            <!-- Bloque 1: Despacho -->
            <div style="background: #f8fafc; padding: 0.6rem 0.8rem; border-radius: 6px; border: 1px solid #e2e8f0;">
                <p style="font-weight: 600; color: var(--primary-green); margin: 0 0 0.3rem 0; font-size: 0.8rem;">🏛️ Despacho</p>
                <div style="display: flex; flex-direction: column; gap: 0.15rem; color: var(--text-main);">
                    <div><strong>Nombre:</strong> ${despachoActual.nombreDespacho || 'No especificado'}</div>
                    <div><strong>Código:</strong> <span style="font-family: monospace;">${despachoActual.codigoDespacho || 'N/A'}</span></div>
                    <div><strong>Tipo / Esp:</strong> ${despachoActual.tipo || ''} — ${despachoActual.especialidad || ''}</div>
                </div>
            </div>

            <!-- Bloque 2: Ubicación y Vigencia -->
            <div style="background: #f8fafc; padding: 0.6rem 0.8rem; border-radius: 6px; border: 1px solid #e2e8f0;">
                <p style="font-weight: 600; color: var(--primary-green); margin: 0 0 0.3rem 0; font-size: 0.8rem;">📍 Ubicación y Vigencia</p>
                <div style="display: flex; flex-direction: column; gap: 0.15rem; color: var(--text-main);">
                    <div><strong>Seccional:</strong> ${despachoActual.consejoseccional || 'N/A'}</div>
                    <div><strong>Ubicación:</strong> ${despachoActual.deptomunicipio || 'N/A'}</div>
                    <div><strong>Vigencia:</strong> ${despachoActual.fechaInicio || ''} al ${despachoActual.fechaFin || ''}</div>
                </div>
            </div>

            <!-- Bloque 3: Administrador -->
            <div style="background: #f8fafc; padding: 0.6rem 0.8rem; border-radius: 6px; border: 1px solid #e2e8f0;">
                <p style="font-weight: 600; color: var(--primary-green); margin: 0 0 0.3rem 0; font-size: 0.8rem;">👤 Administrador</p>
                <div style="display: flex; flex-direction: column; gap: 0.15rem; color: var(--text-main);">
                    <div><strong>Nombre:</strong> ${nombreCompletoAdmin}</div>
                    <div style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;"><strong>Correo:</strong> <a href="mailto:${despachoActual.adminCorreo}" style="color: var(--primary-green); text-decoration: none;">${despachoActual.adminCorreo || 'N/A'}</a></div>
                </div>
            </div>

        </div>
    `;
}

// 5. Renderizar la tabla principal
function renderizarTabla() {
    const tbody = document.getElementById("cuerpo-tabla");

    if (dbProcesos.procesos.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: var(--text-muted); padding: 2rem;">
            No hay procesos registrados. Use "Registrar proceso" para agregar el primero.</td></tr>`;
        return;
    }

    tbody.innerHTML = dbProcesos.procesos.map(p => {
        const editable = p.estado === "pendiente";
        const est = dbProcesos.estadosEnvio[p.estado];
        return `
        <tr>
            <td><span style="font-family: monospace; font-weight: 600; color: var(--primary-green);">${p.codigo}</span></td>
            <td>${listarPartes(p.demandantes)}</td>
            <td>${listarPartes(p.demandados)}</td>
            <td>${p.estadoProceso}</td>
            <td>${p.fechaActuacion}</td>
            <td>${p.link ? `<a href="${p.link}" target="_blank" rel="noopener" style="color: var(--primary-green); font-weight: 500;">🔗 Abrir</a>` : "—"}</td>
            <td><span class="${est.clase}">${est.label}</span>${p.fechaEnvio ? `<br><small style="color: var(--text-muted);">${p.fechaEnvio}</small>` : ""}</td>
            <td>
                ${editable ? `
                <div class="action-buttons">
                    <button class="btn-action edit" onclick="abrirEditarProceso(${p.id})">✏️ Editar</button>
                    <button class="btn-action inactivate" onclick="eliminarProceso(${p.id})">🗑️ Eliminar</button>
                </div>` : `<small style="color: var(--text-muted);">🔒 Enviado</small>`}
            </td>
        </tr>`;
    }).join("");
}

// 6. Formulario: abrir para nuevo / editar
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

function abrirNuevoProceso() {
    document.getElementById("form-proceso").reset();
    document.getElementById("proceso-id").value = "";
    document.getElementById("form-titulo").textContent = "📝 Registrar proceso";
    document.getElementById("fecha_actuacion").max = hoy();
    llenarEstados();
    partesForm = { demandantes: [parteVacia()], demandados: [parteVacia()] };
    renderizarPartes("demandantes");
    renderizarPartes("demandados");
    abrirModal("modal-proceso");
}

function abrirEditarProceso(id) {
    const p = dbProcesos.procesos.find(x => x.id === id);
    if (!p) return;

    document.getElementById("proceso-id").value = p.id;
    document.getElementById("form-titulo").textContent = `✏️ Editar proceso ${p.codigo}`;
    document.getElementById("codigo_proceso").value = p.codigo;
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

// 7. Demandantes y demandados (persona natural o jurídica)
function campo(rol, i, clave, etiqueta, requerido, tipo = "text", placeholder = "") {
    const valor = (partesForm[rol][i][clave] || "").replace(/"/g, "&quot;");
    return `
        <div class="form-group">
            <label>${etiqueta}</label>
            <input type="${tipo}" class="form-control" value="${valor}" placeholder="${placeholder}" ${requerido ? "required" : ""}
                   oninput="partesForm['${rol}'][${i}]['${clave}'] = this.value">
        </div>`;
}

function renderizarPartes(rol) {
    const singular = rol === "demandantes" ? "Demandante" : "Demandado";

    document.getElementById(`lista-${rol}`).innerHTML = partesForm[rol].map((p, i) => `
        <div style="border: 1px solid #e2e8f0; border-radius: 6px; padding: 1rem; margin-bottom: 1rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
                <strong style="font-size: 0.85rem; color: var(--text-main);">${singular} ${i + 1}</strong>
                ${partesForm[rol].length > 1 ? `<button type="button" class="btn-action inactivate" onclick="quitarParte('${rol}',${i})">🗑️ Quitar</button>` : ""}
            </div>
            <div class="form-grid" style="margin-bottom: 0;">
                <div class="form-group">
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
                    : campo(rol, i, "nombre", "Nombre / Razón Social", true, "text", "Ej: EMPRESA S.A.S.")}
                ${campo(rol, i, "correo", "Correo Electrónico", true, "email", "Ej: correo@dominio.com")}
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

// 8. Guardar o actualizar proceso
function guardarProceso(event) {
    event.preventDefault();
    const id = document.getElementById("proceso-id").value;
    const codigo = document.getElementById("codigo_proceso").value.trim();

    if (dbProcesos.procesos.some(p => p.codigo === codigo && String(p.id) !== id)) {
        alert("Ya existe un proceso registrado con el código " + codigo);
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
        dbProcesos.procesos.unshift({ id: Date.now(), ...datos, estado: "pendiente", fechaEnvio: "" });
    }

    renderizarTabla();
    cerrarModal("modal-proceso");
}

// 9. Eliminar proceso
function eliminarProceso(id) {
    const p = dbProcesos.procesos.find(x => x.id === id);
    if (!p || !confirm(`¿Eliminar el proceso ${p.codigo}? Esta acción no se puede deshacer.`)) return;
    dbProcesos.procesos = dbProcesos.procesos.filter(x => x.id !== id);
    renderizarTabla();
}

// 10. Enviar al Consejo Seccional
function abrirEnvio() {
    const pendientes = dbProcesos.procesos.filter(p => p.estado === "pendiente");
    if (pendientes.length === 0) {
        alert("No hay procesos pendientes de envío.");
        return;
    }

    document.getElementById("envio-titulo").textContent = `📤 Enviar al Consejo Seccional de ${despachoActual.consejoSeccional}`;
    document.getElementById("check-todos").checked = true;
    document.getElementById("nota_envio").value = "";
    document.getElementById("cuerpo-envio").innerHTML = pendientes.map(p => `
        <tr>
            <td><input type="checkbox" class="check-envio" value="${p.id}" checked></td>
            <td><span style="font-family: monospace; font-weight: 600; color: var(--primary-green);">${p.codigo}</span></td>
            <td>${nombreParte(p.demandantes[0])} <small style="color: var(--text-muted);">vs</small> ${nombreParte(p.demandados[0])}</td>
            <td>${p.estadoProceso}</td>
        </tr>`).join("");
    abrirModal("modal-envio");
}

function marcarTodos(marcado) {
    document.querySelectorAll(".check-envio").forEach(c => c.checked = marcado);
}

function confirmarEnvio() {
    const ids = [...document.querySelectorAll(".check-envio:checked")].map(c => parseInt(c.value));
    if (ids.length === 0) {
        alert("Seleccione al menos un proceso para enviar.");
        return;
    }

    const nota = document.getElementById("nota_envio").value.trim();
    let procesosEnviados = [];

    dbProcesos.procesos.forEach(p => {
        if (ids.includes(p.id)) {
            p.estado = "enviado";
            p.fechaEnvio = hoy();
            p.consejoSeccional = despachoActual.consejoSeccional;
            p.despachoOrigen = despachoActual.nombreDespacho;
            p.notaEnvio = nota;
            
            procesosEnviados.push({
                codigo: p.codigo,
                estadoProceso: p.estadoProceso,
                fechaActuacion: p.fechaActuacion
            });
        }
    });

    renderizarTabla();
    cerrarModal("modal-envio");

    // 🛠️ CORREGIDO: Se envían todas las propiedades de identificación del despacho
    const payload = {
        nombreDespacho: despachoActual.nombreDespacho,
        codigoDespacho: despachoActual.codigoDespacho,
        consejoSeccional: despachoActual.consejoseccional,
        nota: nota,
        procesos: procesosEnviados
    };

    const datosCodificados = encodeURIComponent(JSON.stringify(payload));

    window.open(`email_crear_procesos_permanantes.html?data=${datosCodificados}`, '_blank');
}

// Inicializar al cargar
document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("texto-despacho").textContent =
        `${despachoActual.nombre} — Registre los procesos y envíelos al Consejo Seccional de ${despachoActual.consejoSeccional} para su distribución`;
    
    // Llamada añadida para pintar la tarjeta de información del despacho
    renderizarInfoDespacho();
    
    renderizarTabla();
});