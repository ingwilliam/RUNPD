// =====================================================================
// RUNPD - Consulta ciudadana: estado actual y trazabilidad del proceso
// =====================================================================

// ---------------------------------------------------------------------
// Configuración de seguridad (prototipo)
// ---------------------------------------------------------------------
const SEGURIDAD = {
    // Llave de PRUEBA pública de Cloudflare (siempre aprueba). En producción se usa la llave del sitio
    // y el token se valida en el servidor con la llave secreta antes de devolver datos.
    turnstileSiteKey: "1x00000000000000000000AA",
    maxConsultasPorMinuto: 5,     // límite de consultas seguidas
    segundosBloqueo: 60,          // espera al superar el límite
    enmascararNombres: true,      // muestra parcialmente los nombres de personas naturales
    mostrarEjemplos: true         // radicados de prueba: SOLO para la presentación (en producción: false)
};

let tokenVerificacion = null;   // token entregado por Turnstile (o por la simulación)
let widgetTurnstile = null;
let consultaPendiente = false;  // el usuario pidió consultar antes de verificarse
const historialConsultas = [];  // marcas de tiempo para el límite de consultas
let bloqueadoHasta = 0;
let intervaloBloqueo = null;

let procesoConsultado = null;
let ordenReciente = false; // false = del origen al estado actual

// Cómo se muestra cada tipo de evento de la trazabilidad (flujo por medida)
const TIPOS_EVENTO = {
    medida:             { icono: "📜", fondo: "#ede9fe", color: "#6d28d9", titulo: "Incluido en una medida de descongestión", rol: "Expide la medida" },
    registro:           { icono: "📝", fondo: "#e0f2fe", color: "#0369a1", titulo: "Registrado por el despacho origen",       rol: "Despacho origen" },
    envio:              { icono: "📤", fondo: "#dbeafe", color: "#1d4ed8", titulo: "Enviado al Consejo Seccional para verificación", rol: "Despacho origen" },
    devolucion_consejo: { icono: "↩",  fondo: "#fef3c7", color: "#92400e", titulo: "Devuelto al despacho origen para corrección",    rol: "Consejo Seccional" },
    aprobacion:         { icono: "✔",  fondo: "#dcfce7", color: "#166534", titulo: "Distribución aprobada (visto bueno)",   rol: "Consejo Seccional" },
    actuacion:          { icono: "✏️", fondo: "#ffedd5", color: "#9a3412", titulo: "Actuación registrada",                  rol: "Despacho destino" },
    devolucion_origen:  { icono: "↩",  fondo: "#fee2e2", color: "#991b1b", titulo: "Devuelto al despacho origen",           rol: "Despacho destino" },
    finalizacion:       { icono: "🏁", fondo: "#359946", color: "#ffffff", titulo: "Proceso terminado",                     rol: "Despacho destino" }
};

document.addEventListener("DOMContentLoaded", () => {
    if (typeof dbConsulta === "undefined") {
        console.error("No se encontró la base de datos dbConsulta.");
        return;
    }

    // Radicados de prueba para la demostración (desactivar en producción)
    if (SEGURIDAD.mostrarEjemplos) {
        document.getElementById("lista-ejemplos").innerHTML = dbConsulta.procesos
            .map((p, i) => `<button type="button" class="cq-chip-ejemplo" onclick="consultarEjemplo('${p.codigo}')" title="${p.escenario}">
                <span class="cq-chip-num">${i + 1}</span><span class="cq-chip-codigo">${p.codigo}</span><small>${p.escenario}</small></button>`)
            .join("");
    } else {
        document.getElementById("bloque-ejemplos").hidden = true;
    }

    // Si llega desde el correo (consulta_ciudadano.html?radicado=...), precarga el radicado
    // pero exige la verificación antes de mostrar información
    const radicado = new URLSearchParams(window.location.search).get("radicado");
    if (radicado) {
        const input = document.getElementById("radicado");
        input.value = radicado;
        limpiarRadicado(input);
        consultaPendiente = true;
        mostrarMensaje("Complete la verificación de seguridad para ver la información del proceso.", "info");
    }

    // Turnstile no funciona abriendo el archivo directamente (file://) ni sin internet:
    // en ese caso se usa la simulación para poder presentar el prototipo
    if (location.protocol === "file:") {
        activarVerificacionSimulada();
    } else {
        setTimeout(() => { if (!widgetTurnstile) activarVerificacionSimulada(); }, 5000);
    }
});

// ---------------------------------------------------------------------
// Verificación de seguridad (Cloudflare Turnstile)
// ---------------------------------------------------------------------
window.onTurnstileListo = function () {
    if (location.protocol === "file:" || typeof turnstile === "undefined") return;
    widgetTurnstile = turnstile.render("#cf-turnstile", {
        sitekey: SEGURIDAD.turnstileSiteKey,
        language: "es",
        callback: token => verificacionExitosa(token),
        "expired-callback": () => { tokenVerificacion = null; },
        "error-callback": () => activarVerificacionSimulada()
    });
};

function activarVerificacionSimulada() {
    document.getElementById("cf-turnstile").innerHTML = "";
    document.getElementById("verificacion-simulada").hidden = false;
}

function verificarSimulado(check) {
    const caja = document.getElementById("verificacion-simulada");
    const texto = document.getElementById("texto-simulado");
    if (!check.checked) return;
    check.disabled = true;
    texto.textContent = "Verificando…";
    setTimeout(() => {
        texto.textContent = "✔ ¡Verificación exitosa!";
        caja.classList.add("ok");
        verificacionExitosa("token-simulado");
    }, 900);
}

function verificacionExitosa(token) {
    tokenVerificacion = token;
    mostrarMensaje("");
    if (consultaPendiente) {
        consultaPendiente = false;
        consultar();
    }
}

// El token es de un solo uso: después de cada consulta se pide de nuevo
function reiniciarVerificacion() {
    tokenVerificacion = null;
    if (widgetTurnstile !== null && typeof turnstile !== "undefined") turnstile.reset(widgetTurnstile);
    const check = document.getElementById("check-simulado");
    check.checked = false;
    check.disabled = false;
    document.getElementById("texto-simulado").textContent = "Verifique que es humano";
    document.getElementById("verificacion-simulada").classList.remove("ok");
}

// Límite de consultas por minuto (en producción: regla de "rate limiting" en Cloudflare / servidor)
function superaLimiteConsultas() {
    const ahora = Date.now();
    while (historialConsultas.length && ahora - historialConsultas[0] > 60000) historialConsultas.shift();
    if (historialConsultas.length >= SEGURIDAD.maxConsultasPorMinuto) {
        bloqueadoHasta = ahora + SEGURIDAD.segundosBloqueo * 1000;
        iniciarCuentaRegresiva();
        return true;
    }
    historialConsultas.push(ahora);
    return false;
}

function iniciarCuentaRegresiva() {
    const boton = document.getElementById("btn-consultar");
    boton.disabled = true;
    clearInterval(intervaloBloqueo);
    const actualizar = () => {
        const restante = Math.ceil((bloqueadoHasta - Date.now()) / 1000);
        if (restante <= 0) {
            clearInterval(intervaloBloqueo);
            boton.disabled = false;
            boton.textContent = "🔍 Consultar";
            mostrarMensaje("");
            return;
        }
        boton.textContent = `⏳ Espere ${restante} s`;
        mostrarMensaje(`Realizó demasiadas consultas seguidas. Por seguridad, espere ${restante} segundos para continuar.`);
    };
    actualizar();
    intervaloBloqueo = setInterval(actualizar, 1000);
}

function mostrarMensaje(texto, tipo = "") {
    const caja = document.getElementById("error-radicado");
    caja.textContent = texto;
    caja.className = "cq-error" + (tipo ? " " + tipo : "");
}

// ---------------------------------------------------------------------
// Utilidades
// ---------------------------------------------------------------------
function esc(valor) {
    return String(valor ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function formatoFecha(iso) {
    if (!iso) return "—";
    const [a, m, d] = iso.split("-");
    const meses = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
    return `${Number(d)} ${meses[Number(m) - 1]} ${a}`;
}

// Personas naturales: primer nombre completo y el resto con la inicial (ej: "Juan P*** R*** O***").
// Las personas jurídicas se muestran completas.
function enmascararNombre(parte) {
    if (!SEGURIDAD.enmascararNombres || parte.tipo === "juridica") return parte.nombre;
    const palabras = String(parte.nombre || "").trim().split(/\s+/);
    return palabras.map((p, i) => i === 0 ? p : `${p.charAt(0)}***`).join(" ");
}

function nombres(lista) {
    return (lista || []).map(enmascararNombre).join(", ") || "No especificado";
}

function ultimoEvento(p, tipos) {
    const lista = p.trazabilidad.filter(e => tipos.includes(e.tipo));
    return lista.length ? lista[lista.length - 1] : null;
}

// ---------------------------------------------------------------------
// Buscador
// ---------------------------------------------------------------------
function limpiarRadicado(input) {
    input.value = input.value.replace(/\D/g, "").slice(0, 23);
    const contador = document.getElementById("radicado-contador");
    contador.textContent = `${input.value.length}/23`;
    contador.classList.toggle("completo", input.value.length === 23);
    if (Date.now() >= bloqueadoHasta) mostrarMensaje("");
}

function consultarEjemplo(codigo) {
    const input = document.getElementById("radicado");
    input.value = codigo;
    limpiarRadicado(input);
    consultar();
}

function consultar(event) {
    if (event) event.preventDefault();
    const codigo = document.getElementById("radicado").value.trim();

    if (Date.now() < bloqueadoHasta) return;

    if (codigo.length !== 23) {
        mostrarMensaje("El número de radicación debe tener exactamente 23 dígitos.");
        document.getElementById("radicado").focus();
        return;
    }

    // 1) Verificación anti-bots obligatoria
    if (!tokenVerificacion) {
        consultaPendiente = true;
        mostrarMensaje("Complete la verificación de seguridad para consultar.", "info");
        return;
    }

    // 2) Límite de consultas seguidas
    if (superaLimiteConsultas()) return;

    // 3) El token se consume: la siguiente consulta requiere verificarse otra vez
    reiniciarVerificacion();
    mostrarMensaje("");

    procesoConsultado = dbConsulta.procesos.find(p => p.codigo === codigo) || null;
    ordenReciente = false;

    // Deja el radicado en la dirección para poder compartir o recargar la consulta
    history.replaceState(null, "", `?radicado=${codigo}`);

    if (procesoConsultado) renderizarResultado();
    else renderizarNoEncontrado(codigo);

    document.getElementById("resultado").scrollIntoView({ behavior: "smooth", block: "start" });
}

function nuevaConsulta() {
    const input = document.getElementById("radicado");
    input.value = "";
    limpiarRadicado(input);
    document.getElementById("resultado").innerHTML = "";
    history.replaceState(null, "", window.location.pathname);
    window.scrollTo({ top: 0, behavior: "smooth" });
    input.focus();
}

function renderizarNoEncontrado(codigo) {
    document.getElementById("resultado").innerHTML = `
        <div class="cq-card cq-vacio">
            <div class="cq-vacio-icono">🔎</div>
            <h2>No encontramos el radicado ${esc(codigo)}</h2>
            <p>Verifique que los 23 dígitos estén completos y correctos.<br>
            Si el número es correcto, es posible que el proceso no haya sido incluido en una medida de descongestión
            o que el despacho origen aún no lo haya registrado.
            Consulte directamente con el despacho de conocimiento.</p>
        </div>`;
}

// ---------------------------------------------------------------------
// Estado actual del proceso (se deduce del último evento)
// ---------------------------------------------------------------------
function estadoActual(p) {
    const ultimo = p.trazabilidad[p.trazabilidad.length - 1];
    const actuacion = ultimoEvento(p, ["actuacion"]);
    const registro = ultimoEvento(p, ["registro"]);
    const consejo = `Consejo Seccional de ${p.consejoSeccional.charAt(0) + p.consejoSeccional.slice(1).toLowerCase()}`;

    const estados = {
        medida:             { texto: "Incluido en la medida", fondo: "#ede9fe", color: "#6d28d9", donde: p.despachoOrigen,
                              descripcion: "El proceso hace parte de una medida de descongestión." },
        registro:           { texto: "Registrado · pendiente de envío", fondo: "#e0f2fe", color: "#0369a1", donde: p.despachoOrigen,
                              descripcion: "El despacho origen registró el proceso en la medida y aún no lo ha enviado al Consejo Seccional." },
        envio:              { texto: "En verificación del Consejo", fondo: "#dbeafe", color: "#1d4ed8", donde: consejo,
                              descripcion: "El Consejo Seccional verifica que el proceso cumpla la medida antes de dar su visto bueno." },
        devolucion_consejo: { texto: "Devuelto para corrección", fondo: "#fef3c7", color: "#92400e", donde: p.despachoOrigen,
                              descripcion: "El Consejo Seccional devolvió el proceso al despacho origen para que lo corrija y lo envíe de nuevo." },
        aprobacion:         { texto: "Aprobado · en el despacho destino", fondo: "#dcfce7", color: "#166534", donde: p.despachoDestino,
                              descripcion: "El Consejo Seccional dio el visto bueno. El despacho destino debe registrar la primera actuación." },
        actuacion:          { texto: "En trámite", fondo: "#ffedd5", color: "#9a3412", donde: p.despachoDestino,
                              descripcion: "El despacho destino con medida de descongestión está adelantando el proceso." },
        devolucion_origen:  { texto: "Devuelto al despacho origen", fondo: "#fee2e2", color: "#991b1b", donde: p.despachoOrigen,
                              descripcion: `El despacho destino devolvió el proceso al despacho origen (${ultimo.motivo || "sin motivo"}).` },
        finalizacion:       { texto: "Terminado", fondo: "#359946", color: "#ffffff", donde: p.despachoDestino,
                              descripcion: `Proceso terminado por ${ultimo.formaTerminacion || "decisión del despacho"}.` }
    };
    const e = estados[ultimo.tipo];

    return {
        ...e,
        ultimo,
        consejo,
        despachoActual: e.donde,
        estadoProcesal: ultimo.tipo === "finalizacion" ? `Terminado – ${ultimo.formaTerminacion}`
            : actuacion ? actuacion.estadoProcesal
            : registro ? registro.estadoProcesal : "—",
        fechaUltimo: ultimo.fecha,
        proxima: ultimo.tipo === "actuacion" ? actuacion.proximaActuacion : null
    };
}

// ---------------------------------------------------------------------
// Render del resultado
// ---------------------------------------------------------------------
function renderizarResultado() {
    const p = procesoConsultado;
    const est = estadoActual(p);

    document.getElementById("resultado").innerHTML = `
        ${htmlResumen(p, est)}
        ${htmlEtapas(p)}
        ${htmlRuta(p, est)}
        <div class="cq-card" id="tarjeta-trazabilidad">${htmlTrazabilidad(p)}</div>
        <div class="cq-acciones">
            <button type="button" class="btn btn-secondary" onclick="nuevaConsulta()">🔍 Nueva consulta</button>
            <button type="button" class="btn-primary-action" onclick="window.print()">🖨️ Imprimir consulta</button>
        </div>`;
}

function htmlResumen(p, est) {
    return `
        <div class="cq-card">
            <div class="cq-resumen-top">
                <div>
                    <div class="cq-radicado-label">Código</div>
                    <div class="cq-radicado">${esc(p.codigo)}</div>
                    <div class="cq-partes">${esc(nombres(p.demandantes))} <em>contra</em> ${esc(nombres(p.demandados))}</div>
                </div>
                <div class="cq-estado">
                    <span class="cq-estado-badge" style="background: ${est.fondo}; color: ${est.color};">${esc(est.texto)}</span>
                    <div class="cq-estado-texto">${esc(est.descripcion)}</div>
                </div>
            </div>
            <div class="cq-datos">
                <div>
                    <div class="cq-dato-label">Estado procesal</div>
                    <div class="cq-dato-valor">${esc(est.estadoProcesal)}</div>
                </div>
                <div>
                    <div class="cq-dato-label">Dónde está hoy</div>
                    <div class="cq-dato-valor">${esc(est.despachoActual)}</div>
                </div>
                <div>
                    <div class="cq-dato-label">Último movimiento</div>
                    <div class="cq-dato-valor">${formatoFecha(est.fechaUltimo)}</div>
                </div>
                <div>
                    <div class="cq-dato-label">Medida de descongestión</div>
                    <div class="cq-dato-valor">${esc(p.medida.acuerdo)}<br><span class="cq-dato-sub">Expedida por ${esc(p.medida.expedidaPor)} · vigencia ${esc(p.medida.vigencia)}</span></div>
                </div>
                <div>
                    <div class="cq-dato-label">Jurisdicción / Especialidad</div>
                    <div class="cq-dato-valor">${esc(p.jurisdiccion)} · ${esc(p.especialidad)}</div>
                </div>
            </div>
        </div>`;
}

// Las 5 etapas del flujo: Medida · Registro · Verificación · Gestión · Terminación
function htmlEtapas(p) {
    const tipos = p.trazabilidad.map(e => e.tipo);
    const ultimo = tipos[tipos.length - 1];
    const ev = t => p.trazabilidad.find(e => e.tipo === t);
    const ultimoDe = t => ultimoEvento(p, [t]);
    const devConsejo = tipos.filter(t => t === "devolucion_consejo").length;

    // estado de cada etapa: hecha · actual · alerta · pendiente
    const etapas = [
        { nombre: "Medida",       icono: "📜", estado: "hecha", fecha: ev("medida")?.fecha },
        { nombre: "Registro",     icono: "📝", estado: ev("registro") ? (ultimo === "registro" ? "actual" : "hecha") : "pendiente", fecha: ev("registro")?.fecha,
          nota: ultimo === "registro" ? "Pendiente de envío" : "" },
        { nombre: "Verificación del Consejo", icono: "⚖️",
          estado: ev("aprobacion") ? "hecha" : ultimo === "devolucion_consejo" ? "alerta" : ultimo === "envio" ? "actual" : "pendiente",
          fecha: ev("aprobacion")?.fecha || ultimoDe("envio")?.fecha,
          nota: ultimo === "devolucion_consejo" ? "Devuelto para corrección" : devConsejo && ev("aprobacion") ? `Aprobado tras ${devConsejo} devolución${devConsejo > 1 ? "es" : ""}` : ultimo === "envio" ? "En verificación" : "" },
        { nombre: "Gestión",      icono: "✏️",
          estado: ultimo === "devolucion_origen" ? "alerta" : ultimo === "finalizacion" ? "hecha" : ["aprobacion", "actuacion"].includes(ultimo) ? "actual" : "pendiente",
          fecha: ev("actuacion")?.fecha || (ev("aprobacion") ? ev("aprobacion").fecha : null),
          nota: ultimo === "aprobacion" ? "Sin primera actuación" : ultimo === "devolucion_origen" ? "Devuelto al despacho origen" : "" },
        { nombre: "Terminación",  icono: "🏁", estado: ev("finalizacion") ? "hecha" : "pendiente", fecha: ev("finalizacion")?.fecha }
    ];

    return `
        <div class="cq-card">
            <div class="cq-card-titulo">Etapas del proceso</div>
            <ol class="cq-etapas">
                ${etapas.map(e => `
                    <li class="cq-etapa ${e.estado}">
                        <div class="cq-etapa-circulo">${e.estado === "hecha" ? "✓" : e.icono}</div>
                        <div>
                            <div class="cq-etapa-nombre">${e.nombre}</div>
                            <div class="cq-etapa-fecha">${e.fecha && e.estado !== "pendiente" ? formatoFecha(e.fecha) : "Pendiente"}</div>
                            ${e.nota ? `<span class="cq-etapa-nota ${e.estado === "alerta" ? "alerta" : ""}">${e.nota}</span>` : ""}
                        </div>
                    </li>`).join("")}
            </ol>
        </div>`;
}

// Recorrido del proceso: medida → despacho origen → Consejo Seccional → despacho destino
function htmlRuta(p, est) {
    const tipos = p.trazabilidad.map(e => e.tipo);
    const u = est.ultimo.tipo;
    const aprobado = tipos.includes("aprobacion");
    const aqui = { texto: "Aquí está hoy", fondo: "#dcfce7", color: "#166534" };

    const nodos = [
        { rol: `Medida · expedida por ${p.medida.expedidaPor}`, nombre: p.medida.acuerdo, clase: "" },
        {
            rol: "Despacho origen",
            nombre: p.despachoOrigen,
            clase: ["registro", "devolucion_consejo", "devolucion_origen"].includes(u) ? "actual" : "",
            tag: ["registro", "devolucion_consejo", "devolucion_origen"].includes(u)
                ? { texto: u === "registro" ? "Aquí está hoy · pendiente de envío" : "Aquí está hoy · devuelto", fondo: u === "registro" ? "#dcfce7" : "#fef3c7", color: u === "registro" ? "#166534" : "#92400e" }
                : null
        },
        {
            rol: "Verificación · Consejo Seccional",
            nombre: est.consejo,
            clase: u === "envio" ? "actual" : tipos.includes("envio") ? "" : "pendiente",
            tag: u === "envio" ? aqui : aprobado ? { texto: "✔ Visto bueno", fondo: "#dcfce7", color: "#166534" } : null
        },
        {
            rol: "Despacho destino",
            nombre: p.despachoDestino,
            clase: u === "devolucion_origen" ? "devuelto" : ["aprobacion", "actuacion", "finalizacion"].includes(u) ? "actual" : "pendiente",
            tag: u === "devolucion_origen" ? { texto: `Devuelto: ${est.ultimo.motivo}`, fondo: "#fee2e2", color: "#991b1b" }
                : u === "finalizacion" ? { texto: "Terminó el proceso", fondo: "#dcfce7", color: "#166534" }
                : ["aprobacion", "actuacion"].includes(u) ? aqui
                : { texto: "Aún no llega", fondo: "#f1f5f9", color: "#64748b" }
        }
    ];

    return `
        <div class="cq-card">
            <div class="cq-card-titulo">Recorrido del proceso</div>
            <div class="cq-ruta">
                ${nodos.map((n, i) => `
                    ${i > 0 ? '<div class="cq-ruta-flecha">→</div>' : ""}
                    <div class="cq-ruta-nodo ${n.clase}">
                        <div class="cq-ruta-rol">${esc(n.rol)}</div>
                        <div class="cq-ruta-nombre">${esc(n.nombre)}</div>
                        ${n.tag ? `<span class="cq-ruta-tag" style="background: ${n.tag.fondo}; color: ${n.tag.color};">${esc(n.tag.texto)}</span>` : ""}
                    </div>`).join("")}
            </div>
        </div>`;
}

// Detalle de cada movimiento
function detalleEvento(p, e) {
    switch (e.tipo) {
        case "medida":             return `${esc(p.medida.acuerdo)} · vigencia ${esc(p.medida.vigencia)}. Despacho origen: <strong>${esc(p.despachoOrigen)}</strong> ➔ despacho destino: <strong>${esc(p.despachoDestino)}</strong>.`;
        case "registro":           return `Estado procesal al registrarlo: <strong>${esc(e.estadoProcesal)}</strong>`;
        case "envio":              return e.nota ? esc(e.nota) : "Se envió al Consejo Seccional para que verifique el cumplimiento de la medida.";
        case "devolucion_consejo": return `Motivo: <strong>${esc(e.motivo)}</strong> El despacho origen debe corregir y enviar de nuevo.`;
        case "aprobacion":         return `El Consejo Seccional dio el visto bueno y notificó al despacho destino: <strong>${esc(e.despachoDestino)}</strong>`;
        case "actuacion":          return `Estado procesal: <strong>${esc(e.estadoProcesal)}</strong>` +
                                          (e.proximaActuacion ? ` · Próxima actuación estimada: <strong>${formatoFecha(e.proximaActuacion)}</strong>` : "");
        case "devolucion_origen":  return `Motivo: <strong>${esc(e.motivo)}</strong>. El proceso regresó al despacho origen.`;
        case "finalizacion":       return `Forma de terminación: <strong>${esc(e.formaTerminacion)}</strong>`;
        default:                   return "";
    }
}

function htmlTrazabilidad(p) {
    const eventos = ordenReciente ? [...p.trazabilidad].reverse() : p.trazabilidad;
    return `
        <div class="cq-timeline-head">
            <div class="cq-card-titulo">Trazabilidad completa (${p.trazabilidad.length} movimientos)</div>
            <button type="button" class="cq-orden" onclick="cambiarOrden()">${ordenReciente ? "⬇ Ver desde el origen" : "⬆ Ver más recientes primero"}</button>
        </div>
        <ol class="cq-timeline">
            ${eventos.map(e => {
                const t = TIPOS_EVENTO[e.tipo];
                return `
                    <li class="cq-evento">
                        <div class="cq-evento-icono" style="background: ${t.fondo}; color: ${t.color};">${t.icono}</div>
                        <div class="cq-evento-cuerpo">
                            <div class="cq-evento-top">
                                <span class="cq-evento-titulo">${t.titulo}</span>
                                <span class="cq-evento-fecha">${formatoFecha(e.fecha)}</span>
                            </div>
                            <div class="cq-evento-actor">${t.rol}: ${esc(e.actor)}</div>
                            <div class="cq-evento-detalle">${detalleEvento(p, e)}</div>
                        </div>
                    </li>`;
            }).join("")}
        </ol>`;
}

function cambiarOrden() {
    ordenReciente = !ordenReciente;
    document.getElementById("tarjeta-trazabilidad").innerHTML = htmlTrazabilidad(procesoConsultado);
}