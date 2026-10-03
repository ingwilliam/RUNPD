// =====================================================================
// RUNPD - Portada: grafo interactivo del flujo
// Recorre los pasos automáticamente; al pasar el mouse o hacer clic en un
// nodo se muestra su explicación. Sin dependencias.
// =====================================================================
const PASOS_FLUJO = [
    { id: "acuerdos",  actor: "Entrada", titulo: "Llegan los acuerdos de medidas de descongestión", desc: "La UDAE recibe los acuerdos. Cuando una medida crea despachos, el acuerdo llega con la resolución de creación de los despachos.", link: "#rol-udae" },
    { id: "udae",      actor: "UDAE", titulo: "Revisa acuerdo por acuerdo", desc: "Analiza cada acuerdo para identificar el despacho origen, el despacho destino, el número de procesos y la vigencia de la medida.", link: "#rol-udae" },
    { id: "existen",   actor: "UDAE · decisión", titulo: "¿Existen los despachos?", desc: "Si el despacho origen o destino ya existe, continúa con la medida. Si no existe, primero lo crea.", link: "#rol-udae" },
    { id: "crear",     actor: "UDAE", titulo: "Crea los despachos que faltan", desc: "Crea el despacho permanente o de descongestión con su administrador, según la resolución de creación, y le envía las credenciales.", link: "#rol-udae" },
    { id: "medida",    actor: "UDAE", titulo: "Crea la medida y notifica", desc: "Registra el acuerdo y configura el plan: despacho origen ➔ despacho destino · número de procesos. Notifica al despacho origen.", link: "#rol-udae" },
    { id: "origen",    actor: "Despacho origen (permanente)", titulo: "Registra los procesos de la medida", desc: "Selecciona la medida, registra el detalle de cada proceso y sus partes hasta completar el total autorizado, y los envía al Consejo Seccional.", link: "#rol-permanente" },
    { id: "consejo",   actor: "Consejo Seccional", titulo: "Revisa el envío", desc: "Revisa los procesos remitidos frente a lo que autorizó la UDAE en la medida.", link: "#rol-consejo" },
    { id: "aprueba",   actor: "Consejo Seccional · decisión", titulo: "¿Aprueba la distribución?", desc: "Sí: aprueba la distribución y notifica al despacho destino. No: devuelve el envío al despacho origen con el motivo, para que lo corrija.", link: "#rol-consejo" },
    { id: "destino",   actor: "Despacho destino (descongestión)", titulo: "Gestiona los procesos hasta terminarlos", desc: "Registra cada actuación y la última actuación del proceso, lo finaliza o lo devuelve al Consejo si termina la medida.", link: "#rol-descongestion" },
    { id: "ciudadano", actor: "Ciudadano", titulo: "Consulta pública", desc: "Con el número de radicación consulta el estado del proceso y su trazabilidad de origen a destino.", link: "#rol-ciudadano" }
];

(function () {
    const nodos = document.querySelectorAll(".g-nodo");
    if (!nodos.length) return;

    let indice = 0;
    let pausaHasta = 0;

    function activar(id) {
        const i = PASOS_FLUJO.findIndex(p => p.id === id);
        if (i < 0) return;
        indice = i;
        const paso = PASOS_FLUJO[i];

        nodos.forEach(n => n.classList.toggle("activo", n.dataset.paso === id));
        document.getElementById("gp-num").textContent = i + 1;
        document.getElementById("gp-actor").textContent = paso.actor;
        document.getElementById("gp-titulo").textContent = paso.titulo;
        document.getElementById("gp-desc").textContent = paso.desc;
        document.getElementById("gp-link").href = paso.link;

        const panel = document.getElementById("grafo-panel");
        const color = document.querySelector(`.g-nodo[data-paso="${id}"]`).style.getPropertyValue("--col");
        panel.style.setProperty("--col", color);
        panel.classList.remove("cambio");
        void panel.offsetWidth; // reinicia la animación del panel
        panel.classList.add("cambio");
    }

    // Interacción: el usuario elige un nodo y el recorrido automático se pausa unos segundos
    nodos.forEach(n => {
        const elegir = () => { pausaHasta = Date.now() + 8000; activar(n.dataset.paso); };
        n.addEventListener("mouseenter", elegir);
        n.addEventListener("focus", elegir);
        n.addEventListener("click", () => { elegir(); document.querySelector(PASOS_FLUJO[indice].link).scrollIntoView({ behavior: "smooth" }); });
        n.addEventListener("keydown", e => { if (e.key === "Enter") n.dispatchEvent(new Event("click")); });
    });

    activar(PASOS_FLUJO[0].id);

    // Recorrido automático
    setInterval(() => {
        if (Date.now() < pausaHasta) return;
        activar(PASOS_FLUJO[(indice + 1) % PASOS_FLUJO.length].id);
    }, 2600);
})();