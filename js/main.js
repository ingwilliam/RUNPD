// =====================================================================
// RUNPD - Gestión y creación de despachos (UDAE)
// Los datos vienen de js/data.js (constante dbDatos) y no se modifican.
// =====================================================================

let filtroKpi = "todos";
let accionDialogo = null;

// ---------------------------------------------------------------------
// Utilidades
// ---------------------------------------------------------------------
function esc(valor) {
    return String(valor ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

// Quita tildes para buscar sin importar cómo se escriba
function normalizar(texto) {
    return String(texto || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

function esActivo(item) {
    return item.estado === "Activo" || item.estado === true;
}

function cerrarModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove("visible");
}

function chip(texto, fondo, color) {
    return `<span style="display: inline-block; font-size: 0.72rem; font-weight: 700; padding: 0.15rem 0.5rem; border-radius: 12px; background: ${fondo}; color: ${color}; white-space: nowrap;">${texto}</span>`;
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
    document.getElementById("modal-dialogo-alerta").classList.add("visible");
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
// Llenar los selects dinámicamente según el JSON
// ---------------------------------------------------------------------
function llenarSelects(datosSeleccionados = {}) {
    for (const [campo, opciones] of Object.entries(dbDatos.opcionesSelects)) {
        const selectElement = document.getElementById(campo);
        if (selectElement) {
            selectElement.innerHTML = '<option value="" disabled selected>Seleccione una opción...</option>';
            opciones.forEach(opt => {
                const optionTag = document.createElement("option");
                optionTag.value = opt.value;
                optionTag.textContent = opt.label;
                if (datosSeleccionados[campo] === opt.value) optionTag.selected = true;
                selectElement.appendChild(optionTag);
            });
        }
    }
}

// Buscador para las listas largas (municipio y circuito)
function filtrarOpciones(campo, texto) {
    const select = document.getElementById(campo);
    const actual = select.value;
    const q = normalizar(texto);
    const opciones = dbDatos.opcionesSelects[campo].filter(o => normalizar(o.label).includes(q));

    select.innerHTML =
        `<option value="" disabled ${actual ? "" : "selected"}>${opciones.length ? (q ? `Seleccione (${opciones.length} coincidencia(s))...` : "Seleccione una opción...") : "Sin coincidencias"}</option>` +
        opciones.map(o => `<option value="${esc(o.value)}" ${o.value === actual ? "selected" : ""}>${esc(o.label)}</option>`).join("");

    // Si solo queda una opción, se selecciona sola
    if (opciones.length === 1) select.value = opciones[0].value;
}

// Opciones de los filtros de la tabla (solo valores que existen en los despachos)
function llenarFiltros() {
    const unicos = campo => [...new Set(dbDatos.despachos.map(d => d[campo]).filter(Boolean))].sort();
    const llenar = (id, campo, textoTodos) => {
        const select = document.getElementById(id);
        const actual = select.value;
        select.innerHTML = `<option value="">${textoTodos}</option>` +
            unicos(campo).map(v => `<option value="${esc(v)}">${esc(v)}</option>`).join("");
        select.value = actual;
    };
    llenar("filtro-consejo", "consejoseccional", "Todos");
    llenar("filtro-especialidad", "especialidad", "Todas");
    // El filtro de tipo toma las opciones del catálogo (Permanente / Descongestión)
    const tipo = document.getElementById("filtro-tipo");
    const actualTipo = tipo.value;
    tipo.innerHTML = `<option value="">Todos</option>` +
        dbDatos.opcionesSelects.tipo.map(t => `<option value="${esc(t.value)}">${esc(t.label)}</option>`).join("");
    tipo.value = actualTipo;
}

function limpiarFiltros() {
    ["filtro-busqueda", "filtro-consejo", "filtro-especialidad", "filtro-tipo", "filtro-estado"]
        .forEach(id => document.getElementById(id).value = "");
    filtroKpi = "todos";
    renderizarTabla();
}

// ---------------------------------------------------------------------
// Indicadores
// ---------------------------------------------------------------------
function renderizarIndicadores() {
    const lista = dbDatos.despachos;
    const activos = lista.filter(esActivo).length;
    const tarjetas = [
        { clave: "todos",         icono: "🏛️", valor: lista.length,                                          texto: "Despachos registrados",    color: "var(--primary-green)" },
        { clave: "activos",       icono: "✅", valor: activos,                                               texto: "Activos",                  color: "#166534" },
        { clave: "inactivos",     icono: "🚫", valor: lista.length - activos,                                texto: "Inactivos",                color: "#64748b" },
        { clave: "permanentes",   icono: "🏢", valor: lista.filter(d => d.tipo === "Permanente").length,     texto: "Permanentes",              color: "#475569" },
        { clave: "descongestion", icono: "⚖️", valor: lista.filter(d => d.tipo === "Descongestión").length,  texto: "De descongestión",         color: "#0369a1" }
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

function aplicarFiltroKpi(clave) {
    filtroKpi = filtroKpi === clave ? "todos" : clave;
    renderizarTabla();
}

function cumpleFiltros(item) {
    const q = normalizar(document.getElementById("filtro-busqueda").value);
    const consejo = document.getElementById("filtro-consejo").value;
    const especialidad = document.getElementById("filtro-especialidad").value;
    const tipo = document.getElementById("filtro-tipo").value;
    const estado = document.getElementById("filtro-estado").value;

    if (consejo && item.consejoseccional !== consejo) return false;
    if (especialidad && item.especialidad !== especialidad) return false;
    if (tipo && item.tipo !== tipo) return false;
    if (estado && (esActivo(item) ? "Activo" : "Inactivo") !== estado) return false;

    if (filtroKpi === "activos" && !esActivo(item)) return false;
    if (filtroKpi === "inactivos" && esActivo(item)) return false;
    if (filtroKpi === "permanentes" && item.tipo !== "Permanente") return false;
    if (filtroKpi === "descongestion" && item.tipo !== "Descongestión") return false;

    if (!q) return true;
    const texto = normalizar([item.nombreDespacho, item.codigoDespacho, item.deptomunicipio, item.consejoseccional].join(" "));
    return texto.includes(q);
}

// ---------------------------------------------------------------------
// Renderizar la tabla principal
// ---------------------------------------------------------------------
function renderizarTabla() {
    renderizarIndicadores();

    const tbody = document.getElementById("cuerpo-tabla");
    const lista = dbDatos.despachos.filter(cumpleFiltros);

    document.getElementById("texto-filtro").innerHTML =
        `Mostrando <strong>${lista.length}</strong> de ${dbDatos.despachos.length} despacho(s)`;

    if (lista.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 2rem;">
            No hay despachos que coincidan con los filtros. <a href="#" onclick="limpiarFiltros(); return false;" style="color: var(--primary-green); font-weight: 600;">Limpiar filtros</a></td></tr>`;
        return;
    }

    tbody.innerHTML = lista.map(item => {
        const activo = esActivo(item);
        const esDescongestion = item.tipo === "Descongestión";

        return `
            <tr style="${activo ? "" : "opacity: 0.6;"}">
                <td style="min-width: 230px;">
                    <div style="font-size: 0.85rem; font-weight: 600; color: var(--text-main);">${esc(item.nombreDespacho)}</div>
                    <div style="margin-top: 0.25rem; display: flex; align-items: center; gap: 0.4rem; flex-wrap: wrap;">
                        <span style="font-family: monospace; font-weight: 600; color: var(--primary-green);">${esc(item.codigoDespacho)}</span>
                        ${item.tipo ? chip(esc(item.tipo), esDescongestion ? "#e0f2fe" : "#edf2f7", esDescongestion ? "#0369a1" : "#475569") : ""}
                    </div>
                </td>
                <td style="font-size: 0.8rem;">
                    ${esc(item.tipodespacho)}<br>
                    <span style="color: var(--text-muted);">${esc(item.jurisdiccion)}</span>
                </td>
                <td style="font-size: 0.8rem; min-width: 170px;">
                    <strong>${esc(item.deptomunicipio)}</strong><br>
                    <span style="color: var(--text-muted);">Consejo: ${esc(item.consejoseccional)}</span><br>
                    <span style="color: var(--text-muted); font-size: 0.72rem;">Distrito ${esc(item.distrito)} · Circuito ${esc(item.circuito)}</span>
                </td>
                <td style="font-size: 0.8rem;">${esc(item.especialidad)}</td>
                <td><span class="badge-status ${activo ? "active" : "inactive"}">${activo ? "Activo" : "Inactivo"}</span></td>
                <td>
                    <div class="action-buttons" style="flex-direction: column; align-items: stretch;">
                        <button class="btn-action edit" style="white-space: nowrap;" onclick="abrirFormularioEditar(${item.id})">✏️ Editar</button>
                        <button class="btn-action inactivate" style="white-space: nowrap;" onclick="toggleInactivar(${item.id})">${activo ? "🚫 Inactivar" : "✅ Activar"}</button>
                    </div>
                </td>
            </tr>`;
    }).join("");
}

// ---------------------------------------------------------------------
// Ayudas del formulario
// ---------------------------------------------------------------------
function limpiarBuscadoresFormulario() {
    document.querySelectorAll('#form-despacho input[type="search"]').forEach(i => i.value = "");
}

// ---------------------------------------------------------------------
// Abrir el formulario vacío para crear
// ---------------------------------------------------------------------
function abrirFormularioNuevo() {
    document.getElementById("despacho-id").value = "";
    document.getElementById("form-titulo").textContent = "📝 Crear despacho";

    document.getElementById("form-despacho").reset();
    limpiarBuscadoresFormulario();
    llenarSelects();
    document.getElementById("btn-guardar").textContent = "💾 Crear despacho";
    document.getElementById("modal-despacho").classList.add("visible");
}

// ---------------------------------------------------------------------
// Abrir el formulario precargado para editar
// ---------------------------------------------------------------------
function abrirFormularioEditar(id) {
    const despacho = dbDatos.despachos.find(d => d.id === id);
    if (!despacho) return;

    document.getElementById("form-despacho").reset();
    limpiarBuscadoresFormulario();

    document.getElementById("despacho-id").value = despacho.id;
    document.getElementById("form-titulo").textContent = `✏️ Editar: ${despacho.nombreDespacho}`;
    document.getElementById("btn-guardar").textContent = "💾 Guardar cambios";

    llenarSelects(despacho);

    document.getElementById("codigo_despacho").value = despacho.codigoDespacho || "";
    document.getElementById("nombre_despacho").value = despacho.nombreDespacho || "";

    document.getElementById("modal-despacho").classList.add("visible");
}

function ocultarFormulario() {
    cerrarModal("modal-despacho");
}

// ---------------------------------------------------------------------
// Guardar o actualizar el despacho
// ---------------------------------------------------------------------
function guardarDespacho(event) {
    event.preventDefault();
    const id = document.getElementById("despacho-id").value;
    const valor = campo => document.getElementById(campo).value.trim();

    const datos = {
        id: id ? parseInt(id) : Date.now(),
        consejoseccional: valor("consejoseccional"),
        jurisdiccion: valor("jurisdiccion"),
        deptomunicipio: valor("deptomunicipio"),
        distrito: valor("distrito"),
        circuito: valor("circuito"),
        tipodespacho: valor("tipodespacho"),
        especialidad: valor("especialidad"),
        tipo: valor("tipo"),
        codigoDespacho: valor("codigo_despacho"),
        nombreDespacho: valor("nombre_despacho")
    };

    const duplicado = dbDatos.despachos.find(d => d.codigoDespacho === datos.codigoDespacho && d.id !== datos.id);
    if (duplicado) {
        mostrarDialogoAlerta("Código repetido", `El código ${datos.codigoDespacho} ya está registrado para: ${duplicado.nombreDespacho}.`, "⚠️");
        return;
    }

    if (id) {
        // Se conserva lo que el formulario no maneja (estado y demás campos existentes)
        const index = dbDatos.despachos.findIndex(d => d.id === datos.id);
        if (index !== -1) dbDatos.despachos[index] = { ...dbDatos.despachos[index], ...datos };
    } else {
        dbDatos.despachos.push({ ...datos, estado: "Activo" });
    }

    llenarFiltros();
    renderizarTabla();
    ocultarFormulario();

    if (id) {
        mostrarDialogoAlerta("Cambios guardados", `Se actualizó la información de ${datos.nombreDespacho}.`);
    } else {
        mostrarDialogoAlerta("Despacho creado", `${datos.nombreDespacho} quedó creado y activo.`);
    }
}

// ---------------------------------------------------------------------
// Inactivar / Activar despacho (con confirmación)
// ---------------------------------------------------------------------
function toggleInactivar(id) {
    const despacho = dbDatos.despachos.find(d => d.id === id);
    if (!despacho) return;

    const estadoActual = esActivo(despacho);
    mostrarDialogoConfirmacion(
        estadoActual ? "¿Inactivar el despacho?" : "¿Activar el despacho?",
        estadoActual
            ? `${despacho.nombreDespacho} quedará inactivo.`
            : `${despacho.nombreDespacho} volverá a estar activo.`,
        () => {
            despacho.estado = estadoActual ? "Inactivo" : "Activo";
            renderizarTabla();
        },
        estadoActual ? "🚫" : "✅",
        estadoActual ? "Sí, inactivar" : "Sí, activar"
    );
}

// Tecla Escape: cierra la ventana que esté encima
document.addEventListener("keydown", e => {
    if (e.key !== "Escape") return;
    if (document.getElementById("modal-dialogo-alerta").classList.contains("visible")) cerrarModal("modal-dialogo-alerta");
    else ocultarFormulario();
});

// Inicializar al cargar
window.onload = function () {
    llenarFiltros();
    renderizarTabla();
};