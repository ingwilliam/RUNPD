// =====================================================================
// RUNPD - Postulación del despacho permanente (formulario público)
// Los catálogos vienen de js/data.js (constante dbDatos)
// =====================================================================

let solicitudPendiente = null;

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

function valor(id) {
    return document.getElementById(id).value.trim();
}

function cerrarModal(modalId) {
    document.getElementById(modalId).classList.remove("visible");
}

function mostrarDialogoAlerta(titulo, mensaje, icono = "⚠️") {
    document.getElementById("dialogo-titulo").textContent = titulo;
    document.getElementById("dialogo-mensaje").textContent = mensaje;
    document.getElementById("dialogo-icono").textContent = icono;
    document.getElementById("modal-dialogo-alerta").classList.add("visible");
}

// ---------------------------------------------------------------------
// Llenar los selects según el catálogo de dbDatos.opcionesSelects
// ---------------------------------------------------------------------
function llenarSelects(datosSeleccionados = {}) {
    for (const [campo, opciones] of Object.entries(dbDatos.opcionesSelects)) {
        const select = document.getElementById(campo);
        if (!select) continue;
        select.innerHTML = '<option value="" disabled selected>Seleccione una opción...</option>';
        opciones.forEach(opt => {
            const option = document.createElement("option");
            option.value = opt.value;
            option.textContent = opt.label;
            if (datosSeleccionados[campo] === opt.value) option.selected = true;
            select.appendChild(option);
        });
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
    actualizarProgreso();
}

// ---------------------------------------------------------------------
// Ayudas en vivo
// ---------------------------------------------------------------------
function actualizarProgreso() {
    const obligatorios = [...document.querySelectorAll("#form-despacho [required]")];
    const completos = obligatorios.filter(c => c.type === "checkbox" ? c.checked : c.value.trim() !== "" && c.checkValidity()).length;
    const porcentaje = Math.round((completos / obligatorios.length) * 100);

    document.getElementById("progreso-barra").style.width = `${porcentaje}%`;
    document.getElementById("progreso-texto").textContent =
        completos === obligatorios.length ? "✅ Formulario completo, listo para enviar" : `${completos} de ${obligatorios.length} campos obligatorios`;
}

function validarCorreo() {
    const correo = valor("admin_correo").toLowerCase();
    const ayuda = document.getElementById("ayuda-correo");
    if (!correo) {
        ayuda.className = "rp-ayuda";
        ayuda.textContent = "A este correo llegarán las credenciales de acceso.";
    } else if (!document.getElementById("admin_correo").checkValidity()) {
        ayuda.className = "rp-ayuda error";
        ayuda.textContent = "Escriba un correo válido.";
    } else if (!correo.endsWith("ramajudicial.gov.co")) {
        ayuda.className = "rp-ayuda alerta";
        ayuda.textContent = "⚠️ Se recomienda usar el correo institucional (@cendoj.ramajudicial.gov.co).";
    } else {
        ayuda.className = "rp-ayuda ok";
        ayuda.textContent = "✔ Correo institucional. Aquí llegarán las credenciales de acceso.";
    }
}

function validarCodigo() {
    const codigo = valor("codigo_despacho");
    const ayuda = document.getElementById("ayuda-codigo");
    const existente = (dbDatos.despachos || []).find(d => d.codigoDespacho === codigo);

    if (!codigo) {
        ayuda.className = "rp-ayuda";
        ayuda.textContent = "Solo números.";
    } else if (existente) {
        ayuda.className = "rp-ayuda error";
        ayuda.textContent = `Este código ya está registrado para ${existente.nombreDespacho}.`;
    } else {
        ayuda.className = "rp-ayuda ok";
        ayuda.textContent = `✔ ${codigo.length} dígito(s).`;
    }
}

// ---------------------------------------------------------------------
// Enviar: primero se revisa, luego se confirma
// ---------------------------------------------------------------------
function guardarDespacho(event) {
    event.preventDefault();

    const codigo = valor("codigo_despacho");
    const existente = (dbDatos.despachos || []).find(d => d.codigoDespacho === codigo);
    if (existente) {
        mostrarDialogoAlerta("Código ya registrado", `El código ${codigo} corresponde a ${existente.nombreDespacho}. Verifique el código de su despacho.`);
        document.getElementById("codigo_despacho").focus();
        return;
    }

    solicitudPendiente = {
        adminPrimerNombre: valor("admin_primer_nombre"),
        adminSegundoNombre: valor("admin_segundo_nombre"),
        adminPrimerApellido: valor("admin_primer_apellido"),
        adminSegundoApellido: valor("admin_segundo_apellido"),
        adminCorreo: valor("admin_correo"),
        jurisdiccion: valor("jurisdiccion"),
        tipodespacho: valor("tipodespacho"),
        deptomunicipio: valor("deptomunicipio"),
        consejoseccional: valor("consejoseccional"),
        distrito: valor("distrito"),
        circuito: valor("circuito"),
        especialidad: valor("especialidad"),
        tipo: "Permanente", // todas las postulaciones son de despachos permanentes
        codigoDespacho: codigo,
        nombreDespacho: valor("nombre_despacho")
    };

    const s = solicitudPendiente;
    const nombreAdmin = [s.adminPrimerNombre, s.adminSegundoNombre, s.adminPrimerApellido, s.adminSegundoApellido].filter(Boolean).join(" ");
    const dato = (etiqueta, texto, completo) => `<div class="${completo ? "completo" : ""}"><span>${etiqueta}</span><strong>${esc(texto || "—")}</strong></div>`;

    document.getElementById("revision-contenido").innerHTML = `
        <div class="rp-resumen">
            <div class="rp-resumen-titulo">👤 Administrador del despacho</div>
            <div class="rp-resumen-grid">
                ${dato("Nombre completo", nombreAdmin, true)}
                ${dato("Correo institucional", s.adminCorreo, true)}
            </div>
        </div>
        <div class="rp-resumen">
            <div class="rp-resumen-titulo">🏢 Despacho propuesto</div>
            <div class="rp-resumen-grid">
                ${dato("Nombre", s.nombreDespacho, true)}
                ${dato("Código", s.codigoDespacho)}
                ${dato("Tipo", s.tipo)}
                ${dato("Jurisdicción", s.jurisdiccion)}
                ${dato("Tipo de despacho", s.tipodespacho)}
                ${dato("Especialidad", s.especialidad)}
                ${dato("Consejo Seccional", s.consejoseccional)}
                ${dato("Municipio", s.deptomunicipio)}
                ${dato("Distrito / Circuito", `${s.distrito} / ${s.circuito}`)}
            </div>
        </div>`;

    document.getElementById("modal-revision").classList.add("visible");
}

function confirmarEnvio() {
    if (!solicitudPendiente) return;
    const s = solicitudPendiente;
    const radicado = `SOL-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`;

    // Abrir el correo de confirmación con los datos de la solicitud
    const url = `email_crear_admin_permanente.html?data=${encodeURIComponent(JSON.stringify({ ...s, radicado }))}`;
    const ventana = window.open(url, "_blank");

    cerrarModal("modal-revision");

    // Mostrar la pantalla de éxito en lugar del formulario
    document.getElementById("seccion-formulario").hidden = true;
    document.getElementById("seccion-exito").hidden = false;
    document.getElementById("exito-radicado").textContent = radicado;
    document.getElementById("exito-correo").textContent = s.adminCorreo;
    document.getElementById("exito-texto").textContent =
        `La postulación de ${s.nombreDespacho} fue enviada a la UDAE para su validación.` +
        (ventana ? "" : " (El navegador bloqueó la ventana del correo de confirmación: permita las ventanas emergentes).");

    // En la columna lateral, el paso 2 pasa a ser el actual
    const pasos = document.querySelectorAll(".rp-pasos li");
    pasos[0].classList.remove("activo");
    pasos[1].classList.add("activo");
    document.getElementById("progreso-barra").style.width = "100%";
    document.getElementById("progreso-texto").textContent = "✅ Solicitud enviada";

    window.scrollTo({ top: 0, behavior: "smooth" });
    solicitudPendiente = null;
}

// ---------------------------------------------------------------------
// Inicio
// ---------------------------------------------------------------------
document.addEventListener("keydown", e => {
    if (e.key !== "Escape") return;
    ["modal-dialogo-alerta", "modal-revision"].forEach(id => {
        const m = document.getElementById(id);
        if (m.classList.contains("visible")) m.classList.remove("visible");
    });
});

document.addEventListener("DOMContentLoaded", () => {
    if (typeof dbDatos === "undefined") {
        console.error("No se encontró dbDatos (js/data.js).");
        return;
    }
    llenarSelects();
    validarCorreo();
    actualizarProgreso();
});