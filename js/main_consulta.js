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

// Cómo se muestra cada tipo de evento de la trazabilidad
const TIPOS_EVENTO = {
    registro:     { icono: "📝", fondo: "#edf2f7", color: "#475569", titulo: "Proceso registrado para descongestión", rol: "Despacho permanente" },
    envio:        { icono: "📤", fondo: "#dbeafe", color: "#1d4ed8", titulo: "Enviado al Consejo Seccional",          rol: "Despacho permanente" },
    asignacion:   { icono: "⚖️", fondo: "#dcfce7", color: "#166534", titulo: "Asignado a despacho de descongestión",  rol: "Consejo Seccional" },
    devolucion:   { icono: "↩",  fondo: "#fef3c7", color: "#92400e", titulo: "Devuelto al Consejo Seccional",         rol: "Despacho de descongestión" },
    reasignacion: { icono: "🔁", fondo: "#dcfce7", color: "#166534", titulo: "Nueva asignación",                      rol: "Consejo Seccional" },
    actuacion:    { icono: "✏️", fondo: "#e6f4ea", color: "#2e843c", titulo: "Actuación registrada",                  rol: "Despacho de descongestión" },
    finalizacion: { icono: "🏁", fondo: "#359946", color: "#ffffff", titulo: "Proceso terminado",                     rol: "Despacho de descongestión" }
};

document.addEventListener("DOMContentLoaded", () => {
    if (typeof dbConsulta === "undefined") {
        console.error("No se encontró la base de datos dbConsulta.");
        return;
    }

    // Radicados de prueba para la demostración (desactivar en producción)
    if (SEGURIDAD.mostrarEjemplos) {
        document.getElementById("lista-ejemplos").innerHTML = dbConsulta.procesos
            .map(p => `<button type="button" class="cq-chip-ejemplo" onclick="consultarEjemplo('${p.codigo}')">${p.codigo}</button>`)
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
            Si el número es correcto, es posible que el proceso no haya sido incluido en una medida de descongestión.
            Consulte directamente con el despacho de conocimiento.</p>
        </div>`;
}

// ---------------------------------------------------------------------
// Estado actual del proceso (se deduce del último evento)
// ---------------------------------------------------------------------
function estadoActual(p) {
    const ultimo = p.trazabilidad[p.trazabilidad.length - 1];
    const asignacion = ultimoEvento(p, ["asignacion", "reasignacion"]);
    const actuacion = ultimoEvento(p, ["actuacion"]);

    const estados = {
        registro:     { texto: "Registrado",                    fondo: "#edf2f7", color: "#475569", descripcion: "El despacho de origen registró el proceso para enviarlo a descongestión." },
        envio:        { texto: "En revisión del Consejo",       fondo: "#dbeafe", color: "#1d4ed8", descripcion: "El Consejo Seccional está definiendo a qué despacho de descongestión se asignará." },
        asignacion:   { texto: "Asignado",                      fondo: "#dcfce7", color: "#166534", descripcion: "El proceso fue asignado a un despacho de descongestión." },
        reasignacion: { texto: "Asignado",                      fondo: "#dcfce7", color: "#166534", descripcion: "El proceso fue asignado a un nuevo despacho de descongestión." },
        devolucion:   { texto: "En redistribución",             fondo: "#fef3c7", color: "#92400e", descripcion: "El proceso fue devuelto al Consejo Seccional, que lo asignará a otro despacho." },
        actuacion:    { texto: "En trámite",                    fondo: "#dcfce7", color: "#166534", descripcion: "El despacho de descongestión está adelantando el proceso." },
        finalizacion: { texto: "Terminado",                     fondo: "#359946", color: "#ffffff", descripcion: `Proceso terminado por ${ultimo.formaTerminacion || "decisión del despacho"}.` }
    };

    const tieneDespachoActivo = asignacion && !["devolucion"].includes(ultimo.tipo) &&
        p.trazabilidad.indexOf(asignacion) > p.trazabilidad.map(e => e.tipo).lastIndexOf("devolucion");

    return {
        ...estados[ultimo.tipo],
        ultimo,
        despachoActual: ultimo.tipo === "finalizacion" ? ultimo.actor
            : tieneDespachoActivo ? asignacion.despachoDestino
            : ["registro"].includes(ultimo.tipo) ? p.trazabilidad[0].actor
            : `Consejo Seccional de ${p.consejoSeccional.charAt(0) + p.consejoSeccional.slice(1).toLowerCase()}`,
        estadoProcesal: ultimo.tipo === "finalizacion" ? `Terminado – ${ultimo.formaTerminacion}`
            : actuacion ? actuacion.estadoProcesal
            : p.trazabilidad[0].estadoProcesal,
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
                    <div class="cq-dato-label">Próxima actuación estimada</div>
                    <div class="cq-dato-valor">${est.proxima ? formatoFecha(est.proxima) : "—"}</div>
                </div>
                <div>
                    <div class="cq-dato-label">Jurisdicción / Especialidad</div>
                    <div class="cq-dato-valor">${esc(p.jurisdiccion)} · ${esc(p.especialidad)}</div>
                </div>
            </div>
        </div>`;
}

// Las 5 etapas del flujo con su avance
function htmlEtapas(p) {
    const tipos = p.trazabilidad.map(e => e.tipo);
    const ultimo = tipos[tipos.length - 1];
    const primero = t => p.trazabilidad.find(e => t.includes(e.tipo));
    const devoluciones = tipos.filter(t => t === "devolucion").length;
    const enDevolucion = ultimo === "devolucion";

    const etapas = [
        { nombre: "Registro",   icono: "📝", evento: primero(["registro"]) },
        { nombre: "Consejo Seccional", icono: "📤", evento: primero(["envio"]) },
        { nombre: "Asignación", icono: "⚖️", evento: enDevolucion ? null : ultimoEvento(p, ["asignacion", "reasignacion"]) },
        { nombre: "Gestión",    icono: "✏️", evento: enDevolucion ? null : primero(["actuacion"]) },
        { nombre: "Terminación", icono: "🏁", evento: primero(["finalizacion"]) }
    ];

    // La etapa actual es la última con evento
    let actual = etapas.map(e => !!e.evento).lastIndexOf(true);

    return `
        <div class="cq-card">
            <div class="cq-card-titulo">Etapas del proceso</div>
            <ol class="cq-etapas">
                ${etapas.map((e, i) => {
                    let clase = i < actual ? "hecha" : i === actual ? (ultimo === "finalizacion" ? "hecha" : "actual") : "pendiente";
                    if (enDevolucion && i === 2) clase = "alerta";
                    const nota = i === 2 && devoluciones
                        ? `<span class="cq-etapa-nota">${enDevolucion ? "En redistribución" : `Reasignado (${devoluciones} devolución${devoluciones > 1 ? "es" : ""})`}</span>`
                        : "";
                    return `
                        <li class="cq-etapa ${clase}">
                            <div class="cq-etapa-circulo">${clase === "hecha" ? "✓" : e.icono}</div>
                            <div>
                                <div class="cq-etapa-nombre">${e.nombre}</div>
                                <div class="cq-etapa-fecha">${e.evento ? formatoFecha(e.evento.fecha) : (clase === "alerta" ? "Pendiente de nueva asignación" : "Pendiente")}</div>
                                ${nota}
                            </div>
                        </li>`;
                }).join("")}
            </ol>
        </div>`;
}

// Recorrido del proceso entre despachos: origen → Consejo → destinos
function htmlRuta(p, est) {
    const nodos = [{ rol: "Origen · Despacho permanente", nombre: p.trazabilidad[0].actor, clase: "" }];

    if (p.trazabilidad.some(e => e.tipo === "envio")) {
        const enConsejo = ["envio", "devolucion"].includes(est.ultimo.tipo);
        nodos.push({
            rol: "Distribución",
            nombre: `Consejo Seccional de ${p.consejoSeccional.charAt(0) + p.consejoSeccional.slice(1).toLowerCase()}`,
            clase: enConsejo ? "actual" : "",
            tag: enConsejo ? { texto: "Aquí está hoy", fondo: "#dcfce7", color: "#166534" } : null
        });
    }

    p.trazabilidad.forEach((e, i) => {
        if (!["asignacion", "reasignacion"].includes(e.tipo)) return;
        const devuelto = p.trazabilidad.slice(i + 1).find(x => x.tipo === "devolucion" && x.actor === e.despachoDestino);
        const esActual = !devuelto && est.despachoActual === e.despachoDestino;
        nodos.push({
            rol: e.tipo === "reasignacion" ? "Nuevo destino · Descongestión" : "Destino · Descongestión",
            nombre: e.despachoDestino,
            clase: devuelto ? "devuelto" : esActual ? "actual" : "",
            tag: devuelto ? { texto: `Devuelto: ${devuelto.motivo}`, fondo: "#fef3c7", color: "#92400e" }
                : esActual ? { texto: est.ultimo.tipo === "finalizacion" ? "Terminó el proceso" : "Aquí está hoy", fondo: "#dcfce7", color: "#166534" }
                : null
        });
    });

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
function detalleEvento(e) {
    switch (e.tipo) {
        case "registro":     return `Estado procesal al registrarlo: <strong>${esc(e.estadoProcesal)}</strong>`;
        case "envio":        return "Se solicitó al Consejo Seccional su distribución a un despacho de descongestión.";
        case "asignacion":
        case "reasignacion": return `Despacho asignado: <strong>${esc(e.despachoDestino)}</strong>`;
        case "devolucion":   return `Motivo: <strong>${esc(e.motivo)}</strong>. El Consejo Seccional asignará el proceso a otro despacho.`;
        case "actuacion":    return `Estado procesal: <strong>${esc(e.estadoProcesal)}</strong>` +
                                    (e.proximaActuacion ? ` · Próxima actuación estimada: <strong>${formatoFecha(e.proximaActuacion)}</strong>` : "");
        case "finalizacion": return `Forma de terminación: <strong>${esc(e.formaTerminacion)}</strong>`;
        default:             return "";
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
                            <div class="cq-evento-detalle">${detalleEvento(e)}</div>
                        </div>
                    </li>`;
            }).join("")}
        </ol>`;
}

function cambiarOrden() {
    ordenReciente = !ordenReciente;
    document.getElementById("tarjeta-trazabilidad").innerHTML = htmlTrazabilidad(procesoConsultado);
}