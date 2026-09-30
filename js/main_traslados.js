// =====================================================================
// RUNPD - Consejo Seccional: traslado de procesos a despachos de descongestión
// Flujo: 1) Predistribuir (borrador en memoria) → 2) Revisar resumen → 3) Transferir
// =====================================================================

let solicitudActualId = null;
let despachoSeleccionadoId = null;
let accionDialogo = null;

// Predistribución en memoria (sin localStorage): { idSolicitud: { idProceso: idDespachoDestino } }
// Se conserva aunque se cierre el modal, hasta que se transfiera o se inicie una nueva distribución.
const predistribuciones = {};

document.addEventListener("DOMContentLoaded", () => {
    if (typeof dbTraslados === "undefined" || !dbTraslados.solicitudes) {
        console.error("No se encontró la base de datos dbTraslados.");
        return;
    }
    llenarFiltros();
    renderizarTablaSolicitudes(dbTraslados.solicitudes);
});

document.addEventListener("keydown", e => {
    if (e.key !== "Escape") return;
    const orden = ["modal-dialogo-alerta", "modal-detalle-proceso", "modal-confirmacion-traslado", "modal-distribucion"];
    const abierto = orden.find(id => document.getElementById(id).classList.contains("visible"));
    if (abierto === "modal-confirmacion-traslado") regresarAModalDistribucion();
    else if (abierto) cerrarModal(abierto);
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

// Soporta ambos formatos de parte: { nombre } o persona natural con nombres y apellidos
function nombreParte(p) {
    if (!p) return "";
    if (p.nombre) return p.nombre;
    return [p.primerNombre, p.segundoNombre, p.primerApellido, p.segundoApellido].filter(Boolean).join(" ");
}

function nombresPartes(lista) {
    return (lista || []).map(nombreParte).filter(Boolean).join(", ") || "No especificado";
}

function obtenerSolicitud(id = solicitudActualId) {
    return dbTraslados.solicitudes.find(s => s.id === Number(id));
}

function obtenerDestino(id) {
    return dbTraslados.despachosDescongestion.find(d => d.id === Number(id));
}

function obtenerPredistribucion(solId) {
    if (!predistribuciones[solId]) predistribuciones[solId] = {};
    return predistribuciones[solId];
}

function contarPredistribuidos(destId) {
    return Object.values(predistribuciones)
        .reduce((total, mapa) => total + Object.values(mapa).filter(d => d === Number(destId)).length, 0);
}

function cargaProyectada(dest) {
    return dest.cargaActual + contarPredistribuidos(dest.id);
}

function destinosCompatibles(especialidad) {
    return dbTraslados.despachosDescongestion
        .filter(d => d.especialidad === especialidad)
        .sort((a, b) => cargaProyectada(a) - cargaProyectada(b));
}

function estadoDeProceso(solId, p) {
    if (p.estado === "Asignado") return "asignado";
    if (obtenerPredistribucion(solId)[p.id]) return "predistribuido";
    return "pendiente";
}

function chipEstado(estado) {
    const estilos = {
        pendiente:      ["PENDIENTE", "#fef9c3", "#854d0e"],
        predistribuido: ["PREDISTRIBUIDO", "#e0f2fe", "#0369a1"],
        asignado:       ["ASIGNADO", "#dcfce7", "#166534"]
    };
    const [texto, fondo, color] = estilos[estado];
    return `<span style="font-size: 0.68rem; font-weight: 700; padding: 0.1rem 0.4rem; border-radius: 4px; background: ${fondo}; color: ${color}; white-space: nowrap;">${texto}</span>`;
}

function badgeTabla(texto, fondo, color) {
    return `<span style="display: inline-block; background: ${fondo}; color: ${color}; padding: 0.2rem 0.6rem; border-radius: 12px; font-weight: 600; font-size: 0.75rem; margin: 0 0.25rem 0.25rem 0;">${texto}</span>`;
}

function cerrarModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove("visible");
}

// ---------------------------------------------------------------------
// Diálogo propio (en sustitución de alert / confirm)
// ---------------------------------------------------------------------
function configurarDialogo(titulo, mensaje, icono, accion) {
    document.getElementById("dialogo-titulo").textContent = titulo;
    document.getElementById("dialogo-mensaje").textContent = mensaje;
    document.getElementById("dialogo-icono").textContent = icono;
    document.getElementById("dialogo-btn-cancelar").style.display = accion ? "" : "none";
    document.getElementById("dialogo-btn-aceptar").textContent = accion ? "Sí, continuar" : "Entendido";
    accionDialogo = accion;
    document.getElementById("modal-dialogo-alerta").classList.add("visible");
}

function mostrarDialogoAlerta(titulo, mensaje, icono = "✅") {
    configurarDialogo(titulo, mensaje, icono, null);
}

function mostrarDialogoConfirmacion(titulo, mensaje, alAceptar, icono = "⚠️") {
    configurarDialogo(titulo, mensaje, icono, alAceptar);
}

function aceptarDialogo() {
    const accion = accionDialogo;
    accionDialogo = null;
    cerrarModal("modal-dialogo-alerta");
    if (accion) accion();
}

// ---------------------------------------------------------------------
// Filtros y tabla principal
// ---------------------------------------------------------------------
function llenarFiltros() {
    const filtros = [
        ["filtro-tipo", "tipo", "Todos los tipos"],
        ["filtro-municipio", "municipio", "Todos los municipios"],
        ["filtro-especialidad", "especialidad", "Todas las especialidades"]
    ];
    filtros.forEach(([idSelect, campo, textoTodos]) => {
        const valores = [...new Set(dbTraslados.solicitudes.map(s => s[campo]))].sort();
        document.getElementById(idSelect).innerHTML =
            `<option value="">${textoTodos}</option>` +
            valores.map(v => `<option value="${esc(v)}">${esc(v)}</option>`).join("");
    });
}

function filtrarSolicitudes() {
    const tipo = document.getElementById("filtro-tipo").value;
    const municipio = document.getElementById("filtro-municipio").value;
    const especialidad = document.getElementById("filtro-especialidad").value;

    const filtradas = dbTraslados.solicitudes.filter(sol =>
        (!tipo || sol.tipo === tipo) &&
        (!municipio || sol.municipio === municipio) &&
        (!especialidad || sol.especialidad === especialidad));

    renderizarTablaSolicitudes(filtradas);
}

function renderizarTablaSolicitudes(lista) {
    const tbody = document.getElementById("cuerpo-tabla-solicitudes");
    if (!tbody) return;

    if (lista.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-muted); padding: 2rem;">No hay solicitudes de traslado con los filtros seleccionados.</td></tr>`;
        return;
    }

    tbody.innerHTML = lista.map(sol => {
        const total = sol.procesos.length;
        const asignados = sol.procesos.filter(p => estadoDeProceso(sol.id, p) === "asignado").length;
        const predistribuidos = sol.procesos.filter(p => estadoDeProceso(sol.id, p) === "predistribuido").length;
        const pendientes = total - asignados - predistribuidos;
        const completa = asignados === total;

        let badges = "";
        if (completa) {
            badges = badgeTabla(`✔ Asignados (${asignados}/${total})`, "#dcfce7", "#166534");
        } else {
            if (pendientes) badges += badgeTabla(`⏳ Pendientes (${pendientes})`, "#fef9c3", "#854d0e");
            if (predistribuidos) badges += badgeTabla(`📝 Predistribuidos (${predistribuidos})`, "#e0f2fe", "#0369a1");
            if (asignados) badges += badgeTabla(`✔ Asignados (${asignados}/${total})`, "#dcfce7", "#166534");
        }

        return `
            <tr>
                <td style="font-weight: 600;">${esc(sol.nombreDespacho)}<br><span style="font-size: 0.75rem; color: var(--text-muted); font-weight: normal;">Código: ${esc(sol.codigoDespacho)}</span></td>
                <td>${esc(sol.municipio)} / <strong>${esc(sol.especialidad)}</strong></td>
                <td>${badges}</td>
                <td>${esc(sol.fechaSolicitud)}</td>
                <td>
                    <button class="btn-primary-action" style="padding: 0.35rem 0.75rem; font-size: 0.8rem;" onclick="abrirModalDistribucion(${sol.id})">
                        ${completa ? "👁️ Ver detalle" : "⚖️ Gestionar y Ver Detalle"}
                    </button>
                </td>
            </tr>`;
    }).join("");
}

// ---------------------------------------------------------------------
// Modal de predistribución
// ---------------------------------------------------------------------
function abrirModalDistribucion(id) {
    solicitudActualId = Number(id);
    const sol = obtenerSolicitud();
    if (!sol) return;

    // Si el destino elegido antes no corresponde a esta especialidad, se toma el de menor carga
    const destinos = destinosCompatibles(sol.especialidad);
    if (!destinos.some(d => d.id === despachoSeleccionadoId)) {
        despachoSeleccionadoId = destinos.length ? destinos[0].id : null;
    }

    document.getElementById("modal-titulo-despacho").textContent = `⚖️ Gestión: ${sol.nombreDespacho}`;
    renderizarModalDistribucion();
    document.getElementById("modal-distribucion").classList.add("visible");
}

function renderizarModalDistribucion() {
    const sol = obtenerSolicitud();
    if (!sol) return;
    renderizarResumenSolicitud(sol);
    renderizarProcesosSolicitud(sol);
    renderizarDespachosDestino(sol.especialidad);
    actualizarDetalleDespachoDestino(despachoSeleccionadoId);
    actualizarBotonesAccion();
    filtrarSolicitudes(); // la tabla principal refleja la predistribución en tiempo real
}

function renderizarResumenSolicitud(sol) {
    const conteo = { pendiente: 0, predistribuido: 0, asignado: 0 };
    sol.procesos.forEach(p => conteo[estadoDeProceso(sol.id, p)]++);
    document.getElementById("resumen-solicitud").innerHTML =
        `Código: <strong>${esc(sol.codigoDespacho)}</strong> · ${esc(sol.municipio)} · ${esc(sol.especialidad)} &nbsp;|&nbsp; ` +
        `⏳ ${conteo.pendiente} pendiente(s) · 📝 ${conteo.predistribuido} predistribuido(s) · ✔ ${conteo.asignado} asignado(s)`;
}

function renderizarProcesosSolicitud(sol) {
    const contenedor = document.getElementById("lista-procesos-solicitud");
    const pre = obtenerPredistribucion(sol.id);

    contenedor.innerHTML = sol.procesos.map(p => {
        const estado = estadoDeProceso(sol.id, p);
        let lineaDestino = "";

        if (estado === "asignado") {
            lineaDestino = `<div style="margin-top: 0.25rem; color: #166534;">✔ Asignado a: <strong>${esc(p.despachoAsignado)}</strong></div>`;
        } else if (estado === "predistribuido") {
            const destino = obtenerDestino(pre[p.id]);
            lineaDestino = `
                <div style="margin-top: 0.3rem; display: flex; justify-content: space-between; align-items: center; gap: 0.5rem; color: #0369a1;">
                    <span>➔ <strong>${esc(destino ? destino.nombre : "")}</strong></span>
                    <button type="button" onclick="quitarPredistribucion(${sol.id}, ${p.id})" style="background: #fee2e2; color: #991b1b; border: 1px solid #fecaca; padding: 0.15rem 0.45rem; border-radius: 4px; font-size: 0.7rem; font-weight: 600; cursor: pointer; white-space: nowrap;">↩ Quitar</button>
                </div>`;
        }

        const fondo = estado === "predistribuido" ? "#f0f9ff" : "#ffffff";
        const borde = estado === "predistribuido" ? "#bae6fd" : "#e2e8f0";

        return `
            <label style="display: block; background: ${fondo}; padding: 0.6rem; border-radius: 6px; border: 1px solid ${borde}; margin-bottom: 0.5rem; opacity: ${estado === "asignado" ? "0.65" : "1"}; cursor: ${estado === "pendiente" ? "pointer" : "default"};">
                <div style="display: flex; align-items: flex-start; gap: 0.5rem;">
                    <input type="checkbox" class="check-proceso" value="${p.id}" ${estado === "pendiente" ? "checked" : "disabled"} onchange="actualizarBotonesAccion()" style="margin-top: 0.2rem;" aria-label="Seleccionar proceso ${esc(p.codigo)}">
                    <div style="font-size: 0.78rem; width: 100%;">
                        <div style="display: flex; justify-content: space-between; align-items: center; gap: 0.5rem;">
                            <strong style="color: #166534; font-family: monospace;">Cod: ${esc(p.codigo)}</strong>
                            ${chipEstado(estado)}
                        </div>
                        <div style="color: #475569; margin-top: 0.2rem;">${esc(nombresPartes(p.demandantes))} <em>c/</em> ${esc(nombresPartes(p.demandados))}</div>
                        <div style="color: var(--text-main); margin-top: 0.2rem;">
                            <strong>Estado:</strong> ${esc(p.estadoProceso)} | <strong>Actuación:</strong> ${esc(p.fechaActuacion)}
                        </div>
                        ${lineaDestino}
                        <div style="margin-top: 0.3rem;">
                            <button type="button" onclick="verDetalleProcesoModalDirecto('solicitud', ${sol.id}, ${p.id})" style="background: none; border: none; color: var(--primary-green); font-weight: 600; cursor: pointer; padding: 0; font-size: 0.75rem; text-decoration: underline;">
                                🔍 Ver detalles completos de partes y observaciones
                            </button>
                        </div>
                    </div>
                </div>
            </label>`;
    }).join("");

    if (!sol.procesos.some(p => estadoDeProceso(sol.id, p) === "pendiente")) {
        contenedor.insertAdjacentHTML("afterbegin", `<div style="background: #dcfce7; color: #166534; border-radius: 6px; padding: 0.5rem 0.6rem; font-size: 0.78rem; font-weight: 600; margin-bottom: 0.5rem;">✔ Todos los procesos de esta solicitud ya están distribuidos.</div>`);
    }
}

// Los botones muestran cuántos procesos se van a mover y hacia dónde
function actualizarBotonesAccion() {
    const sol = obtenerSolicitud();
    if (!sol) return;
    const marcados = procesosMarcados().length;
    const destino = obtenerDestino(despachoSeleccionadoId);
    const enBorrador = agruparPorDestino(sol).reduce((t, g) => t + g.procesos.length, 0);

    document.getElementById("btn-asignar").textContent = marcados && destino
        ? `➕ Asignar ${marcados} proceso(s) a ${destino.nombre}`
        : "➕ Asignar al despacho elegido";
    document.getElementById("btn-repartir").textContent = marcados
        ? `⚖️ Repartir ${marcados} proceso(s) equitativamente`
        : "⚖️ Repartir equitativamente";
    document.getElementById("btn-siguiente").textContent = enBorrador
        ? `Siguiente: Ver Resumen de Traslado (${enBorrador}) ➔`
        : "Siguiente: Ver Resumen de Traslado ➔";
}

function renderizarDespachosDestino(especialidad) {
    const contenedor = document.getElementById("lista-despachos-destino");
    const destinos = destinosCompatibles(especialidad);

    if (destinos.length === 0) {
        despachoSeleccionadoId = null;
        contenedor.innerHTML = `<span style="color: var(--text-muted); font-style: italic; padding: 0.5rem; display: block; font-size: 0.78rem;">No hay despachos de descongestión habilitados con especialidad ${esc(especialidad)}.</span>`;
        return;
    }

    const menorCarga = cargaProyectada(destinos[0]);

    contenedor.innerHTML = destinos.map(dest => {
        const seleccionado = dest.id === despachoSeleccionadoId;
        const predist = contarPredistribuidos(dest.id);
        const esMenorCarga = cargaProyectada(dest) === menorCarga;

        return `
            <label style="display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; background: ${seleccionado ? "#f0fdf4" : "#ffffff"}; border: 1px solid ${seleccionado ? "#86efac" : "#e2e8f0"}; padding: 0.5rem; border-radius: 6px; margin-bottom: 0.4rem; cursor: pointer;">
                <div style="display: flex; align-items: center; gap: 0.4rem;">
                    <input type="radio" name="despachoDestino" value="${dest.id}" ${seleccionado ? "checked" : ""} onchange="seleccionarDespachoDestino(${dest.id})">
                    <div style="font-size: 0.78rem;">
                        <strong>${esc(dest.nombre)}</strong><br>
                        <span style="color: var(--text-muted);">Carga actual: <strong style="color: #0f172a;">${dest.cargaActual} proceso(s)</strong></span>
                        ${predist ? `<br><span style="color: #0369a1;">+ ${predist} predistribuido(s) = <strong>${cargaProyectada(dest)}</strong></span>` : ""}
                    </div>
                </div>
                ${esMenorCarga ? '<span style="background: #dcfce7; color: #166534; font-size: 0.6rem; font-weight: 700; padding: 0.1rem 0.3rem; border-radius: 3px; white-space: nowrap;">MENOR CARGA</span>' : ""}
            </label>`;
    }).join("");
}

function seleccionarDespachoDestino(destId) {
    despachoSeleccionadoId = Number(destId);
    const sol = obtenerSolicitud();
    if (sol) renderizarDespachosDestino(sol.especialidad);
    actualizarDetalleDespachoDestino(despachoSeleccionadoId);
    actualizarBotonesAccion();
}

function actualizarDetalleDespachoDestino(destId) {
    const titulo = document.getElementById("titulo-detalle-destino");
    const contenedor = document.getElementById("detalle-procesos-despacho-destino");
    const destino = obtenerDestino(destId);

    if (!destino) {
        titulo.textContent = "📂 Inventario del despacho de destino seleccionado";
        contenedor.innerHTML = "Seleccione un despacho de destino para ver su inventario de procesos actual.";
        return;
    }

    titulo.textContent = `📂 Inventario de ${destino.nombre}`;

    // Procesos ya asignados (base) + procesos predistribuidos a este destino
    const base = destino.procesosAsignadosActuales || [];
    const predistribuidos = [];
    Object.entries(predistribuciones).forEach(([solId, mapa]) => {
        Object.entries(mapa).forEach(([procId, dId]) => {
            if (dId !== destino.id) return;
            const sol = obtenerSolicitud(solId);
            const proc = sol && sol.procesos.find(x => x.id === Number(procId));
            if (proc) predistribuidos.push({ sol, proc });
        });
    });

    if (base.length === 0 && predistribuidos.length === 0) {
        contenedor.innerHTML = `<span style="color: var(--text-muted); font-style: italic; padding: 0.5rem; display: block;">Este despacho transitorio no cuenta con procesos asignados actualmente.</span>`;
        return;
    }

    const filaBase = (pa, idx) => `
        <div style="background: #f1f5f9; padding: 0.4rem 0.6rem; border-radius: 4px; margin-bottom: 0.3rem; display: flex; justify-content: space-between; align-items: center; gap: 0.5rem; border-left: 3px solid #1e3a8a;">
            <div style="font-size: 0.78rem;">
                <strong>${idx + 1}.</strong> <code style="color: #0f172a; font-weight: 600;">${esc(pa.codigo)}</code> — <span style="color: #475569;">${esc(nombresPartes(pa.demandantes))} c/ ${esc(nombresPartes(pa.demandados))}</span><br>
                <button type="button" onclick="verDetalleProcesoModalDirecto('destino', ${destino.id}, ${idx})" style="background: none; border: none; color: var(--primary-green); font-weight: 600; cursor: pointer; padding: 0; font-size: 0.72rem; text-decoration: underline; margin-top: 0.2rem;">🔍 Ver detalles</button>
            </div>
            <span style="font-size: 0.7rem; color: var(--text-muted); background: #ffffff; padding: 0.1rem 0.4rem; border-radius: 3px; border: 1px solid #e2e8f0; white-space: nowrap;">Asignado ${esc(pa.fechaAsignacion || "")}</span>
        </div>`;

    const filaPre = ({ sol, proc }, idx) => `
        <div style="background: #f0f9ff; padding: 0.4rem 0.6rem; border-radius: 4px; margin-bottom: 0.3rem; display: flex; justify-content: space-between; align-items: center; gap: 0.5rem; border-left: 3px solid #0369a1;">
            <div style="font-size: 0.78rem;">
                <strong>${base.length + idx + 1}.</strong> <code style="color: #0f172a; font-weight: 600;">${esc(proc.codigo)}</code> — <span style="color: #475569;">${esc(nombresPartes(proc.demandantes))} c/ ${esc(nombresPartes(proc.demandados))}</span><br>
                <span style="font-size: 0.7rem; color: var(--text-muted);">Origen: ${esc(sol.nombreDespacho)}</span>
            </div>
            <div style="display: flex; align-items: center; gap: 0.4rem;">
                ${chipEstado("predistribuido")}
                <button type="button" onclick="quitarPredistribucion(${sol.id}, ${proc.id})" style="background: #fee2e2; color: #991b1b; border: 1px solid #fecaca; padding: 0.15rem 0.45rem; border-radius: 4px; font-size: 0.7rem; font-weight: 600; cursor: pointer;">❌ Quitar</button>
            </div>
        </div>`;

    contenedor.innerHTML = base.map(filaBase).join("") + predistribuidos.map(filaPre).join("");
}

// ---------------------------------------------------------------------
// Acciones de predistribución
// ---------------------------------------------------------------------
function procesosMarcados() {
    return [...document.querySelectorAll(".check-proceso:checked:not(:disabled)")].map(c => Number(c.value));
}

function asignarSeleccionados() {
    const sol = obtenerSolicitud();
    const ids = procesosMarcados();

    if (ids.length === 0) {
        mostrarDialogoAlerta("Atención", "Marque al menos un proceso pendiente para predistribuir.", "⚠️");
        return;
    }
    if (despachoSeleccionadoId === null) {
        mostrarDialogoAlerta("Atención", "Seleccione un despacho de destino.", "⚠️");
        return;
    }

    const pre = obtenerPredistribucion(sol.id);
    ids.forEach(id => pre[id] = despachoSeleccionadoId);
    renderizarModalDistribucion();
}

function repartirEquitativamente() {
    const sol = obtenerSolicitud();
    const ids = procesosMarcados();
    const destinos = dbTraslados.despachosDescongestion.filter(d => d.especialidad === sol.especialidad);

    if (ids.length === 0) {
        mostrarDialogoAlerta("Atención", "Marque los procesos pendientes que desea repartir.", "⚠️");
        return;
    }
    if (destinos.length === 0) {
        mostrarDialogoAlerta("Atención", `No hay despachos de descongestión con especialidad ${sol.especialidad}.`, "⚠️");
        return;
    }

    // Cada proceso va al despacho con menor carga proyectada en ese momento
    const pre = obtenerPredistribucion(sol.id);
    ids.forEach(id => {
        const destino = destinos.slice().sort((a, b) => cargaProyectada(a) - cargaProyectada(b))[0];
        pre[id] = destino.id;
    });
    renderizarModalDistribucion();
}

function quitarPredistribucion(solId, procId) {
    delete obtenerPredistribucion(solId)[procId];
    renderizarModalDistribucion();
}

function nuevaDistribucion() {
    const pre = obtenerPredistribucion(solicitudActualId);
    const cantidad = Object.keys(pre).length;

    if (cantidad === 0) {
        mostrarDialogoAlerta("Sin predistribución", "Esta solicitud no tiene procesos predistribuidos.", "ℹ️");
        return;
    }

    mostrarDialogoConfirmacion(
        "¿Iniciar una nueva distribución?",
        `Se quitarán los ${cantidad} proceso(s) predistribuidos y volverán a quedar pendientes. Los procesos ya transferidos no se modifican.`,
        () => {
            predistribuciones[solicitudActualId] = {};
            renderizarModalDistribucion();
        },
        "🔄"
    );
}

// Agrupa la predistribución de la solicitud por despacho de destino
function agruparPorDestino(sol) {
    const pre = obtenerPredistribucion(sol.id);
    const grupos = [];
    sol.procesos.forEach(p => {
        const destId = pre[p.id];
        if (!destId || p.estado === "Asignado") return;
        let grupo = grupos.find(g => g.destino.id === destId);
        if (!grupo) {
            grupo = { destino: obtenerDestino(destId), procesos: [] };
            grupos.push(grupo);
        }
        grupo.procesos.push(p);
    });
    return grupos;
}

// ---------------------------------------------------------------------
// PASO 2: Resumen de traslado (no modifica datos)
// ---------------------------------------------------------------------
function ejecutarTransferencia() {
    const sol = obtenerSolicitud();
    if (!sol) {
        mostrarDialogoAlerta("Error", "No se encontró la solicitud activa.", "❌");
        return;
    }

    const grupos = agruparPorDestino(sol);
    if (grupos.length === 0) {
        mostrarDialogoAlerta("Atención", "Primero predistribuya: marque procesos, elija el despacho de destino y pulse 'Asignar al despacho elegido'.", "⚠️");
        return;
    }

    const totalTraslado = grupos.reduce((t, g) => t + g.procesos.length, 0);
    const sinDistribuir = sol.procesos.filter(p => estadoDeProceso(sol.id, p) === "pendiente").length;

    document.getElementById("conf-origen").textContent = `${sol.nombreDespacho} (Código: ${sol.codigoDespacho})`;
    document.getElementById("conf-destino").textContent = grupos.map(g => g.destino.nombre).join(" · ");
    document.getElementById("conf-total").textContent = totalTraslado;

    const advertencia = document.getElementById("conf-advertencia");
    if (sinDistribuir > 0) {
        advertencia.textContent = `⚠️ ${sinDistribuir} proceso(s) de esta solicitud quedarán pendientes sin distribuir. Podrá asignarlos en otro momento.`;
        advertencia.style.display = "block";
    } else {
        advertencia.style.display = "none";
    }

    document.getElementById("conf-lista-procesos").innerHTML = grupos.map(({ destino, procesos }) => `
        <div style="border: 1px solid #e2e8f0; border-radius: 6px; margin-bottom: 0.6rem; overflow: hidden;">
            <div style="background: #f0fdf4; padding: 0.5rem 0.75rem; display: flex; justify-content: space-between; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
                <div style="font-size: 0.8rem;">
                    <strong style="color: #166534;">➔ ${esc(destino.nombre)}</strong><br>
                    <span style="font-size: 0.72rem; color: var(--text-muted);">✉️ ${esc(destino.correo)}</span>
                </div>
                <span style="font-size: 0.75rem; color: #0f172a;">Carga: <strong>${destino.cargaActual}</strong> ➔ <strong style="color: #166534;">${destino.cargaActual + procesos.length}</strong></span>
            </div>
            ${procesos.map((p, idx) => `
                <div style="font-size: 0.78rem; padding: 0.35rem 0.75rem; border-top: 1px solid #f1f5f9;">
                    <strong>${idx + 1}. Cod: ${esc(p.codigo)}</strong> — <span style="color: #475569;">${esc(nombresPartes(p.demandantes))} c/ ${esc(nombresPartes(p.demandados))}</span>
                    <span style="color: var(--text-muted);">| ${esc(p.estadoProceso)}</span>
                </div>`).join("")}
        </div>`).join("");

    cerrarModal("modal-distribucion");
    document.getElementById("modal-confirmacion-traslado").classList.add("visible");
}

// Regresar: vuelve a la predistribución SIN perder lo que ya se había asignado
function regresarAModalDistribucion() {
    cerrarModal("modal-confirmacion-traslado");
    if (solicitudActualId !== null) abrirModalDistribucion(solicitudActualId);
}

// ---------------------------------------------------------------------
// PASO 3: Transferencia definitiva + apertura de la plantilla de correo
// ---------------------------------------------------------------------
function confirmarYEjecutarTransferenciaFinal() {
    const sol = obtenerSolicitud();
    if (!sol) {
        mostrarDialogoAlerta("Error", "No se pudo procesar la solicitud.", "❌");
        return;
    }

    const grupos = agruparPorDestino(sol);
    if (grupos.length === 0) return;

    const fecha = hoy();
    const procesosSeleccionadosParaCorreo = [];

    grupos.forEach(({ destino, procesos }) => {
        procesos.forEach(p => {
            p.estado = "Asignado";
            p.despachoAsignado = destino.nombre;
            p.fechaAsignacion = fecha;

            // Queda en el inventario definitivo del despacho de destino
            destino.procesosAsignadosActuales.push({
                id: p.id,
                codigo: p.codigo,
                estadoProceso: p.estadoProceso,
                fechaActuacion: p.fechaActuacion,
                link: p.link,
                observaciones: p.observaciones,
                demandantes: p.demandantes,
                demandados: p.demandados,
                fechaAsignacion: fecha,
                despachoOrigen: sol.nombreDespacho
            });

            // 🛠️ AQUÍ INCLUIMOS TODA LA INFORMACIÓN PARA EL CORREO HTML
            procesosSeleccionadosParaCorreo.push({
                codigo: p.codigo,
                estadoProceso: p.estadoProceso,
                fechaActuacion: p.fechaActuacion,
                observaciones: p.observaciones,
                link: p.link,
                demandantes: p.demandantes,
                demandados: p.demandados,
                despachoDestino: destino.nombre,
                correoDestino: destino.correo
            });
        });
        destino.cargaActual += procesos.length;
    });

    // La predistribución de esta solicitud ya se consolidó
    predistribuciones[sol.id] = {};

    // Datos para la plantilla HTML del correo
    const payloadCorreo = {
        nombreDespacho: sol.nombreDespacho,
        codigoDespacho: sol.codigoDespacho,
        consejoSeccional: dbTraslados.consejoSeccional || "CALDAS",
        fechaTraslado: fecha,
        procesos: procesosSeleccionadosParaCorreo,
        destinos: grupos.map(g => ({
            nombre: g.destino.nombre,
            correo: g.destino.correo,
            procesos: g.procesos.map(p => p.codigo)
        }))
    };

    const urlCorreo = `email_distribucion_procesos_descongestion.html?data=${encodeURIComponent(JSON.stringify(payloadCorreo))}`;
    const ventana = window.open(urlCorreo, "_blank");

    cerrarModal("modal-confirmacion-traslado");
    filtrarSolicitudes();

    let mensaje = `Se transfirieron ${procesosSeleccionadosParaCorreo.length} proceso(s) a ${grupos.length} despacho(s) de descongestión y se generó el correo de notificación.`;
    if (!ventana) mensaje += " El navegador bloqueó la ventana del correo: permita las ventanas emergentes para este sitio.";
    mostrarDialogoAlerta("¡Traslado Exitoso!", mensaje);
}

// ---------------------------------------------------------------------
// Detalle completo de un proceso
//   origen = 'solicitud' → (idSolicitud, idProceso)
//   origen = 'destino'   → (idDespachoDestino, posición en su inventario)
// ---------------------------------------------------------------------
function verDetalleProcesoModalDirecto(origen, idContenedor, idProceso) {
    let p = null;
    let ubicacion = "";

    if (origen === "solicitud") {
        const sol = obtenerSolicitud(idContenedor);
        p = sol && sol.procesos.find(x => x.id === Number(idProceso));
        if (p && p.estado === "Asignado") {
            ubicacion = `✔ Asignado a ${p.despachoAsignado}${p.fechaAsignacion ? " el " + p.fechaAsignacion : ""}`;
        } else if (p && obtenerPredistribucion(sol.id)[p.id]) {
            ubicacion = `📝 Predistribuido a ${obtenerDestino(obtenerPredistribucion(sol.id)[p.id]).nombre} (sin confirmar)`;
        } else if (p) {
            ubicacion = "⏳ Pendiente de distribución";
        }
    } else {
        const destino = obtenerDestino(idContenedor);
        p = destino && destino.procesosAsignadosActuales[Number(idProceso)];
        if (p) ubicacion = `✔ En inventario de ${destino.nombre}${p.fechaAsignacion ? " desde " + p.fechaAsignacion : ""}`;
    }

    if (!p) return;

    const listaPartes = lista => (lista && lista.length)
        ? `<ul style="margin: 0.25rem 0 0.5rem 1.2rem;">${lista.map(x =>
            `<li>${x.tipo === "juridica" ? "🏢" : "👤"} ${esc(nombreParte(x))}${x.correo ? ` <span style="color: #64748b;">(${esc(x.correo)})</span>` : ""}</li>`).join("")}</ul>`
        : `<p style="margin: 0 0 0.5rem 0;">No especificado</p>`;

    document.getElementById("contenido-detalle-proceso").innerHTML = `
        <div style="background: #f8fafc; padding: 1rem; border-radius: 6px; border: 1px solid #e2e8f0;">
            <p style="margin: 0 0 0.5rem 0;"><strong>Código del Proceso:</strong> <span style="font-family: monospace; color: #166534; font-weight: 700;">${esc(p.codigo)}</span></p>
            <p style="margin: 0 0 0.5rem 0;"><strong>Estado Actual:</strong> ${esc(p.estadoProceso || "—")}</p>
            <p style="margin: 0 0 0.5rem 0;"><strong>Fecha Última Actuación:</strong> ${esc(p.fechaActuacion || "N/A")}</p>
            <p style="margin: 0 0 0.5rem 0;"><strong>Situación:</strong> ${esc(ubicacion)}</p>
            <hr style="border: 0; border-top: 1px solid #cbd5e1; margin: 0.75rem 0;">
            <p style="margin: 0;"><strong>Demandante(s):</strong></p>
            ${listaPartes(p.demandantes)}
            <p style="margin: 0;"><strong>Demandado(s):</strong></p>
            ${listaPartes(p.demandados)}
            <p style="margin: 0 0 0.5rem 0;"><strong>Observaciones:</strong> ${esc(p.observaciones || "Sin observaciones registradas.")}</p>
            ${p.link ? `<p style="margin: 0.5rem 0 0 0;"><a href="${esc(p.link)}" target="_blank" rel="noopener" style="color: #0284c7; text-decoration: underline; font-weight: 600;">🔗 Ver expediente en línea (Rama Judicial)</a></p>` : ""}
        </div>`;

    document.getElementById("modal-detalle-proceso").classList.add("visible");
}