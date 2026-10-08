// =====================================================================
// RUNPD - Portada: grafo interactivo del flujo
// Inicio: el Consejo Superior de la Judicatura expide el Acuerdo y/o la Resolución;
// la UDAE garantiza que los despachos existan (los crea si no existen) y, con base
// en el Acuerdo, el Consejo Seccional materializa la medida en el sistema.
// Luego: despacho origen → despacho destino → finalización. El Consejo Seccional
// supervisa y verifica el cumplimiento con reportes por medida y por proceso.
// =====================================================================
const PASOS_FLUJO = [
    { id: "csj", actor: "Inicio · Consejo Superior de la Judicatura", titulo: "Expide el Acuerdo y/o la Resolución",
      desc: "Todo inicia cuando el Consejo Superior de la Judicatura expide el Acuerdo y/o la Resolución de creación de despachos que da origen a la medida de descongestión.", link: "#rol-csj" },
    { id: "udae", actor: "UDAE · garantiza", titulo: "Garantiza que los despachos estén creados",
      desc: "Con el Acuerdo y/o la Resolución, la UDAE se asegura de que los despachos origen y destino existan en el sistema, para que el Consejo Seccional pueda materializar la medida.", link: "#rol-udae" },
    { id: "existe", actor: "UDAE · decisión", titulo: "¿Existen los despachos origen y destino?",
      desc: "Solo la UDAE hace esta validación. SÍ existen: el Consejo Seccional puede materializar la medida. NO existen: la UDAE primero los crea.", link: "#rol-udae" },
    { id: "crear", actor: "UDAE", titulo: "Crea los despachos que no existen",
      desc: "Crea el despacho con medida permanente o transitoria. Así queda listo para que el Consejo Seccional materialice la medida.", link: "#rol-udae" },
    { id: "materializa", actor: "Consejo Seccional · materializa", titulo: "Materializa la medida de descongestión",
      desc: "Con base en el Acuerdo, registra la medida en el sistema: despacho origen ➔ despacho destino, número de procesos y vigencia. Por cada despacho origen y destino ingresa la información del Administrador del Despacho, único autorizado para registrar (origen) o gestionar (destino) los procesos. Se notifica a los despachos.", link: "#rol-consejo-medida" },
    { id: "origen", actor: "Despacho origen con medida de descongestión", titulo: "Registra y envía los procesos",
      desc: "El Administrador del Despacho origen, único autorizado en la medida, la selecciona, registra cada proceso con sus partes hasta completar el total autorizado y los envía directamente al despacho destino.", link: "#rol-origen" },
    { id: "destino", actor: "Despacho destino con medida de descongestión", titulo: "Gestiona los procesos",
      desc: "El Administrador del Despacho destino, único autorizado en la medida, recibe los procesos del despacho origen y registra sus actuaciones. Si un proceso no corresponde o no alcanza a terminarse, lo devuelve al despacho origen.", link: "#rol-destino" },
    { id: "finaliza", actor: "Despacho destino", titulo: "Finaliza el proceso",
      desc: "Registra la forma de terminación del proceso (sentencia ejecutoriada, conciliación, desistimiento, etc.) y se notifica a las partes.", link: "#rol-destino" },
    { id: "supervision", actor: "Consejo Seccional · supervisa y verifica", titulo: "Supervisa y verifica el cumplimiento de la medida",
      desc: "Desde la materialización hasta la finalización, la herramienta le muestra al Consejo Seccional reportes por medida y por proceso para supervisar y verificar el cumplimiento de las medidas adoptadas.", link: "#rol-supervision" }
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