// =====================================================================
// RUNPD - Portada: grafo interactivo del flujo
// Camino A (UDAE): emite el acuerdo, valida y crea despachos, crea la medida.
// Camino B (Consejo Seccional): con el acuerdo de creación de despachos de la
// UDAE emite el acuerdo de redistribución y crea la medida.
// Luego: despacho origen → Consejo supervisa → despacho destino → ciudadano.
// =====================================================================
const PASOS_FLUJO = [
    { id: "udae", actor: "Camino A · UDAE", titulo: "Emite el acuerdo de la medida",
      desc: "La UDAE expide el acuerdo de la medida de descongestión y, cuando se requieren despachos nuevos, la resolución de creación.", link: "#rol-udae" },
    { id: "existe", actor: "Camino A · UDAE · decisión", titulo: "¿El despacho origen y el destino ya existen en el sistema?",
      desc: "Solo la UDAE hace esta validación. NO existen: primero los crea. SÍ existen: continúa directo a crear la medida.", link: "#rol-udae" },
    { id: "crear", actor: "Camino A · UDAE", titulo: "Crea los despachos que faltan",
      desc: "Crea el despacho con medida permanente o transitoria y su administrador, y le envía las credenciales. Luego crea la medida.", link: "#rol-udae" },
    { id: "requisito", actor: "Camino B · requisito obligatorio", titulo: "Acuerdo de creación de despachos de la UDAE",
      desc: "Antes de crear una medida, el Consejo Seccional debe contar sí o sí con el acuerdo de la UDAE que crea los despachos con medidas permanentes y transitorias.", link: "#rol-consejo-medida" },
    { id: "consejo_acuerdo", actor: "Camino B · Consejo Seccional", titulo: "Emite el acuerdo de redistribución",
      desc: "Con los despachos ya creados por la UDAE, el Consejo Seccional expide el acuerdo de redistribución de procesos.", link: "#rol-consejo-medida" },
    { id: "medida", actor: "UDAE o Consejo Seccional", titulo: "Crea la medida de descongestión en el sistema",
      desc: "Registra el acuerdo y configura la medida: despacho origen ➔ despacho destino, número de procesos y vigencia. Se notifica al despacho origen.", link: "#paso-1" },
    { id: "origen", actor: "Despacho origen con medida de descongestión", titulo: "Crea y envía los procesos",
      desc: "Selecciona la medida, crea cada proceso con sus partes hasta completar el total autorizado y los envía al Consejo Seccional.", link: "#rol-origen" },
    { id: "consejo", actor: "Consejo Seccional · supervisa", titulo: "Supervisa y verifica el cumplimiento",
      desc: "Verifica que los procesos enviados cumplan lo adoptado en la medida de descongestión.", link: "#rol-consejo" },
    { id: "aprueba", actor: "Consejo Seccional · decisión", titulo: "¿Cumple la medida?",
      desc: "Sí: da el visto bueno y notifica al despacho destino. No: devuelve el envío al despacho origen con el motivo, para que lo corrija.", link: "#rol-consejo" },
    { id: "destino", actor: "Despacho destino con medida de descongestión", titulo: "Gestiona los procesos",
      desc: "Registra las actuaciones de cada proceso y, según el caso, los finaliza o los devuelve al despacho origen.", link: "#rol-destino" },
    { id: "ciudadano", actor: "Ciudadano", titulo: "Consulta pública",
      desc: "Con el número de radicación consulta el estado del proceso y su trazabilidad de origen a destino.", link: "#rol-ciudadano" }
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