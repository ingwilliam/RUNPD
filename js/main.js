// =====================================================================
// RUNPD - Gestión de despachos con medida de descongestión (UDAE)
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

// Quita tildes para buscar sin importar cómo se escriba
function normalizar(texto) {
    return String(texto || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

function esActivo(item) {
    return item.estado === "Activo" || item.estado === true;
}

function nombreAdministrador(item) {
    return [item.adminPrimerNombre, item.adminSegundoNombre, item.adminPrimerApellido, item.adminSegundoApellido].filter(Boolean).join(" ");
}

function cerrarModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove("visible");
}

// Estado de la vigencia de la medida
function infoVigencia(item) {
    const actual = hoy();
    if (!item.fechaInicio || !item.fechaFin) return { clave: "sin_fecha", texto: "Sin vigencia", fondo: "#edf2f7", color: "#475569" };
    if (actual < item.fechaInicio) {
        const d = diasEntre(actual, item.fechaInicio);
        return { clave: "futura", texto: `Inicia en ${d} día(s)`, fondo: "#dbeafe", color: "#1d4ed8" };
    }
    const dias = diasEntre(actual, item.fechaFin);
    if (dias < 0)   return { clave: "vencida",    texto: `Vencida hace ${-dias} día(s)`, fondo: "#fee2e2", color: "#991b1b" };
    if (dias <= 30) return { clave: "por_vencer", texto: dias === 0 ? "Vence hoy" : `Vence en ${dias} día(s)`, fondo: "#fee2e2", color: "#991b1b" };
    if (dias <= 60) return { clave: "por_vencer", texto: `Vence en ${dias} días`, fondo: "#fef3c7", color: "#92400e" };
    return { clave: "vigente", texto: `${dias} días restantes`, fondo: "#dcfce7", color: "#166534" };
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
// 2. Llenar los selects dinámicamente según el JSON
// ---------------------------------------------------------------------
function llenarSelects(datosSeleccionados = {}) {
    for (const [campo, opciones] of Object.entries(dbDatos.opcionesSelects)) {
        const selectElement = document.getElementById(campo);
        if (selectElement) {
            selectElement.innerHTML = '<option value="" disabled selected>Seleccione una opción...</option>';
            opciones.forEach(opt => {
                const optionTag = document.createElement('option');
                optionTag.value = opt.value;
                optionTag.textContent = opt.label;
                if (datosSeleccionados[campo] === opt.value) {
                    optionTag.selected = true;
                }
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
    document.getElementById("filtro-consejo").innerHTML = `<option value="">Todos</option>` +
        unicos("consejoseccional").map(v => `<option value="${esc(v)}">${esc(v)}</option>`).join("");
    document.getElementById("filtro-especialidad").innerHTML = `<option value="">Todas</option>` +
        unicos("especialidad").map(v => `<option value="${esc(v)}">${esc(v)}</option>`).join("");
}

function limpiarFiltros() {
    document.getElementById("filtro-busqueda").value = "";
    document.getElementById("filtro-consejo").value = "";
    document.getElementById("filtro-especialidad").value = "";
    document.getElementById("filtro-estado").value = "";
    filtroKpi = "todos";
    renderizarTabla();
}

// ---------------------------------------------------------------------
// Indicadores
// ---------------------------------------------------------------------
function renderizarIndicadores() {
    const lista = dbDatos.despachos;
    const activos = lista.filter(esActivo);
    const tarjetas = [
        { clave: "todos",      icono: "🏛️", valor: lista.length,                                                  texto: "Despachos registrados", color: "var(--primary-green)" },
        { clave: "activos",    icono: "✅", valor: activos.length,                                                texto: "Activos",               color: "#166534" },
        { clave: "inactivos",  icono: "🚫", valor: lista.length - activos.length,                                 texto: "Inactivos",             color: "#64748b" },
        { clave: "por_vencer", icono: "⏰", valor: activos.filter(d => infoVigencia(d).clave === "por_vencer").length, texto: "Medida por vencer (≤ 60 días)", color: "#f59e0b" },
        { clave: "vencidas",   icono: "⌛", valor: activos.filter(d => infoVigencia(d).clave === "vencida").length,    texto: "Activos con medida vencida", color: "#dc2626" }
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
    const estado = document.getElementById("filtro-estado").value;
    const vigencia = infoVigencia(item).clave;

    if (consejo && item.consejoseccional !== consejo) return false;
    if (especialidad && item.especialidad !== especialidad) return false;
    if (estado && (esActivo(item) ? "Activo" : "Inactivo") !== estado) return false;

    if (filtroKpi === "activos" && !esActivo(item)) return false;
    if (filtroKpi === "inactivos" && esActivo(item)) return false;
    if (filtroKpi === "por_vencer" && !(esActivo(item) && vigencia === "por_vencer")) return false;
    if (filtroKpi === "vencidas" && !(esActivo(item) && vigencia === "vencida")) return false;

    if (!q) return true;
    const texto = normalizar([item.nombreDespacho, item.codigoDespacho, item.deptomunicipio, item.consejoseccional, nombreAdministrador(item), item.adminCorreo].join(" "));
    return texto.includes(q);
}

// ---------------------------------------------------------------------
// 3. Renderizar la tabla principal
// ---------------------------------------------------------------------
function renderizarTabla() {
    renderizarIndicadores();

    const tbody = document.getElementById('cuerpo-tabla');
    const lista = dbDatos.despachos.filter(cumpleFiltros);

    document.getElementById("texto-filtro").innerHTML =
        `Mostrando <strong>${lista.length}</strong> de ${dbDatos.despachos.length} despacho(s)`;

    if (lista.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: var(--text-muted); padding: 2rem;">
            No hay despachos que coincidan con los filtros. <a href="#" onclick="limpiarFiltros(); return false;" style="color: var(--primary-green); font-weight: 600;">Limpiar filtros</a></td></tr>`;
        return;
    }

    tbody.innerHTML = lista.map(item => {
        const activo = esActivo(item);
        const vigencia = infoVigencia(item);
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
                <td style="font-size: 0.8rem;">
                    ${esc(nombreAdministrador(item))}<br>
                    <span style="color: var(--text-muted); font-size: 0.72rem;">${esc(item.adminCorreo)}</span>
                </td>
                <td style="font-size: 0.8rem; white-space: nowrap;">
                    ${formatoFecha(item.fechaInicio)} → ${formatoFecha(item.fechaFin)}<br>
                    <div style="margin-top: 0.3rem;">${chip(vigencia.texto, vigencia.fondo, vigencia.color)}</div>
                </td>
                <td><span class="badge-status ${activo ? 'active' : 'inactive'}">${activo ? 'Activo' : 'Inactivo'}</span></td>
                <td>
                    <div class="action-buttons" style="flex-direction: column; align-items: stretch;">
                        <button class="btn-action edit" style="white-space: nowrap;" onclick="abrirFormularioEditar(${item.id})">✏️ Editar</button>
                        <button class="btn-action inactivate" style="white-space: nowrap;" onclick="toggleInactivar(${item.id})">${activo ? '🚫 Inactivar' : '✅ Activar'}</button>
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

function actualizarVigencia() {
    const inicio = document.getElementById("fecha_inicio").value;
    const fin = document.getElementById("fecha_fin");
    const resumen = document.getElementById("resumen-vigencia");

    fin.min = inicio || "";

    if (!inicio || !fin.value) {
        resumen.style.display = "none";
        return;
    }

    const dias = diasEntre(inicio, fin.value);
    resumen.style.display = "block";
    if (dias <= 0) {
        resumen.style.background = "#fee2e2"; resumen.style.borderColor = "#fecaca"; resumen.style.color = "#991b1b";
        resumen.innerHTML = "⚠️ La fecha fin debe ser posterior a la fecha de inicio.";
    } else {
        const vigencia = infoVigencia({ fechaInicio: inicio, fechaFin: fin.value });
        resumen.style.background = "#f0f9ff"; resumen.style.borderColor = "#bae6fd"; resumen.style.color = "#0c4a6e";
        resumen.innerHTML = `📅 La medida durará <strong>${dias} días</strong> (aprox. ${Math.round(dias / 30)} mes(es)), del ${formatoFecha(inicio)} al ${formatoFecha(fin.value)}. Estado: <strong>${vigencia.texto}</strong>.`;
    }
}

function generarPassword() {
    const caracteres = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
    let aleatorio = "";
    for (let i = 0; i < 4; i++) aleatorio += caracteres[Math.floor(Math.random() * caracteres.length)];
    document.getElementById("admin_password").value = `Temp${new Date().getFullYear()}*${aleatorio}`;
}

// Enlace a la plantilla de credenciales con los datos del despacho
function enlaceCredenciales(item) {
    const datos = {
        nombreDespacho: item.nombreDespacho,
        codigoDespacho: item.codigoDespacho,
        consejoSeccional: item.consejoseccional,
        administrador: nombreAdministrador(item),
        correo: item.adminCorreo,
        password: item.adminPassword
    };
    return `email_credenciales.html?data=${encodeURIComponent(JSON.stringify(datos))}`;
}

// ---------------------------------------------------------------------
// 4. Abrir Layer / Modal vacío para Nuevo
// ---------------------------------------------------------------------
function abrirFormularioNuevo() {
    document.getElementById('despacho-id').value = '';
    document.getElementById('form-titulo').textContent = '📝 Habilitar despacho de descongestión';

    // Ocultar el botón de credenciales porque es un registro nuevo
    const btnCredenciales = document.getElementById('btn-enviar-credenciales');
    if (btnCredenciales) {
        btnCredenciales.style.display = 'none';
    }

    document.getElementById('form-despacho').reset();
    limpiarBuscadoresFormulario();
    llenarSelects();
    actualizarVigencia();
    document.getElementById('btn-guardar').textContent = '💾 Habilitar despacho';
    document.getElementById('modal-despacho').classList.add('visible');
}

// ---------------------------------------------------------------------
// 5. Abrir Layer / Modal precargado para Editar
// ---------------------------------------------------------------------
function abrirFormularioEditar(id) {
    const despacho = dbDatos.despachos.find(d => d.id === id);
    if (!despacho) return;

    document.getElementById('form-despacho').reset();
    limpiarBuscadoresFormulario();

    document.getElementById('despacho-id').value = despacho.id;
    document.getElementById('form-titulo').textContent = `✏️ Editar: ${despacho.nombreDespacho}`;
    document.getElementById('btn-guardar').textContent = '💾 Guardar cambios';

    // MOSTRAR el botón de credenciales porque estamos editando
    const btnCredenciales = document.getElementById('btn-enviar-credenciales');
    if (btnCredenciales) {
        btnCredenciales.style.display = 'inline-flex';
        btnCredenciales.href = enlaceCredenciales(despacho);
    }

    llenarSelects(despacho);

    // Asignar valores a los inputs de texto del despacho
    document.getElementById('codigo_despacho').value = despacho.codigoDespacho || '';
    document.getElementById('nombre_despacho').value = despacho.nombreDespacho || '';
    document.getElementById('fecha_inicio').value = despacho.fechaInicio;
    document.getElementById('fecha_fin').value = despacho.fechaFin;

    // Asignar valores a los campos del Administrador
    document.getElementById('admin_primer_nombre').value = despacho.adminPrimerNombre || '';
    document.getElementById('admin_segundo_nombre').value = despacho.adminSegundoNombre || '';
    document.getElementById('admin_primer_apellido').value = despacho.adminPrimerApellido || '';
    document.getElementById('admin_segundo_apellido').value = despacho.adminSegundoApellido || '';
    document.getElementById('admin_correo').value = despacho.adminCorreo || '';
    document.getElementById('admin_password').value = despacho.adminPassword || '';

    actualizarVigencia();
    document.getElementById('modal-despacho').classList.add('visible');
}

// ---------------------------------------------------------------------
// 6. Ocultar Layer / Modal
// ---------------------------------------------------------------------
function ocultarFormulario() {
    cerrarModal('modal-despacho');
}

// ---------------------------------------------------------------------
// 7. Guardar o actualizar registro (incluyendo la data del Administrador)
// ---------------------------------------------------------------------
function guardarDespacho(event) {
    event.preventDefault();
    const id = document.getElementById('despacho-id').value;

    const nuevoRegistro = {
        id: id ? parseInt(id) : Date.now(),
        consejoseccional: document.getElementById('consejoseccional').value,
        jurisdiccion: document.getElementById('jurisdiccion').value,
        deptomunicipio: document.getElementById('deptomunicipio').value,
        distrito: document.getElementById('distrito').value,
        circuito: document.getElementById('circuito').value,
        tipodespacho: document.getElementById('tipodespacho').value,
        especialidad: document.getElementById('especialidad').value,
        tipo: document.getElementById('tipo').value, // antes no se guardaba
        codigoDespacho: document.getElementById('codigo_despacho').value.trim(),
        nombreDespacho: document.getElementById('nombre_despacho').value.trim(),
        fechaInicio: document.getElementById('fecha_inicio').value,
        fechaFin: document.getElementById('fecha_fin').value,
        estado: "Activo",
        // Campos del Administrador
        adminPrimerNombre: document.getElementById('admin_primer_nombre').value.trim(),
        adminSegundoNombre: document.getElementById('admin_segundo_nombre').value.trim(),
        adminPrimerApellido: document.getElementById('admin_primer_apellido').value.trim(),
        adminSegundoApellido: document.getElementById('admin_segundo_apellido').value.trim(),
        adminCorreo: document.getElementById('admin_correo').value.trim(),
        adminPassword: document.getElementById('admin_password').value.trim()
    };

    // Validaciones adicionales
    if (nuevoRegistro.fechaFin <= nuevoRegistro.fechaInicio) {
        mostrarDialogoAlerta("Revise la vigencia", "La fecha fin de la medida debe ser posterior a la fecha de inicio.", "⚠️");
        return;
    }
    const duplicado = dbDatos.despachos.find(d => d.codigoDespacho === nuevoRegistro.codigoDespacho && d.id !== nuevoRegistro.id);
    if (duplicado) {
        mostrarDialogoAlerta("Código repetido", `El código ${nuevoRegistro.codigoDespacho} ya está registrado para: ${duplicado.nombreDespacho}.`, "⚠️");
        return;
    }

    if (id) {
        const index = dbDatos.despachos.findIndex(d => d.id === parseInt(id));
        if (index !== -1) {
            nuevoRegistro.estado = dbDatos.despachos[index].estado;
            dbDatos.despachos[index] = nuevoRegistro;
        }
    } else {
        dbDatos.despachos.push(nuevoRegistro);
    }

    llenarFiltros();
    renderizarTabla();
    ocultarFormulario();

    if (id) {
        mostrarDialogoAlerta("Cambios guardados", `Se actualizó la información de ${nuevoRegistro.nombreDespacho}.`);
    } else {
        // Al habilitar un despacho nuevo, ofrecer el envío inmediato de credenciales
        mostrarDialogoConfirmacion(
            "Despacho habilitado",
            `${nuevoRegistro.nombreDespacho} quedó activo del ${formatoFecha(nuevoRegistro.fechaInicio)} al ${formatoFecha(nuevoRegistro.fechaFin)}. ¿Desea enviar ahora las credenciales a ${nombreAdministrador(nuevoRegistro)}?`,
            () => window.open(enlaceCredenciales(nuevoRegistro), "_blank"),
            "✅",
            "✉️ Enviar credenciales",
            "Más tarde"
        );
    }
}

// ---------------------------------------------------------------------
// 8. Inactivar / Activar despacho (con confirmación)
// ---------------------------------------------------------------------
function toggleInactivar(id) {
    const despacho = dbDatos.despachos.find(d => d.id === id);
    if (!despacho) return;

    const estadoActual = esActivo(despacho);
    mostrarDialogoConfirmacion(
        estadoActual ? "¿Inactivar el despacho?" : "¿Activar el despacho?",
        estadoActual
            ? `${despacho.nombreDespacho} dejará de estar disponible para recibir procesos de descongestión.`
            : `${despacho.nombreDespacho} volverá a estar disponible para recibir procesos de descongestión.`,
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
window.onload = function() {
    llenarFiltros();
    renderizarTabla();
};