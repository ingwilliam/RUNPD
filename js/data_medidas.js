// =====================================================================
// RUNPD - Medidas de descongestión (UDAE)
// Los despachos de descongestión vienen de js/data.js (dbDatos.despachos).
// expedidaPor: "UDAE" o "CONSEJO".
//   - UDAE: acuerdo de la medida + resolución de creación de cargos (opcional).
//   - CONSEJO: acuerdo de redistribución del Consejo Seccional de la medida, con el
//     requisito obligatorio del acuerdo de creación de despachos de la UDAE
//     (acuerdoCreacion). No lleva resolución porque no crea despachos.
// La resolución de creación de cargos es OPCIONAL y no se relaciona con despachos:
// los despachos se crean antes en "Gestión y Creación de Despachos".
// Aquí se agregan despachos PERMANENTES de ejemplo (origen de los procesos);
// en el sistema real saldrían de "Gestión y Creación de Despachos".
// =====================================================================
const dbMedidas = {

    // Entidades que pueden expedir una medida: la UDAE o un Consejo Seccional
    consejosSeccionales: [
        "ANTIOQUIA", "ATLÁNTICO", "BOGOTÁ", "BOLÍVAR", "BOYACÁ - CASANARE", "CALDAS", "CAQUETÁ", "CAUCA",
        "CESAR", "CHOCÓ", "CÓRDOBA", "CUNDINAMARCA", "HUILA", "LA GUAJIRA", "MAGDALENA", "META",
        "NARIÑO", "NORTE DE SANTANDER", "QUINDÍO", "RISARALDA", "SANTANDER", "SUCRE", "TOLIMA", "VALLE DEL CAUCA"
    ],

    despachosPermanentesEjemplo: [
        { id: 101, tipo: "Permanente", consejoseccional: "CALDAS", deptomunicipio: "MANIZALES", especialidad: "LABORAL", codigoDespacho: "170014105002", adminCorreo: "j02lpmmanizales@cendoj.ramajudicial.gov.co", nombreDespacho: "JUZGADO 002 LABORAL MUNICIPAL DE MANIZALES", estado: "Activo" },
        { id: 102, tipo: "Permanente", consejoseccional: "CALDAS", deptomunicipio: "MANIZALES", especialidad: "LABORAL", codigoDespacho: "170013105003", adminCorreo: "j03lctomanizales@cendoj.ramajudicial.gov.co", nombreDespacho: "JUZGADO 003 LABORAL DEL CIRCUITO DE MANIZALES", estado: "Activo" },
        { id: 103, tipo: "Permanente", consejoseccional: "ANTIOQUIA", deptomunicipio: "MEDELLÍN", especialidad: "CIVIL", codigoDespacho: "050014003003", adminCorreo: "j03cmpalmed@cendoj.ramajudicial.gov.co", nombreDespacho: "JUZGADO 003 CIVIL MUNICIPAL DE MEDELLÍN", estado: "Activo" },
        { id: 104, tipo: "Permanente", consejoseccional: "ANTIOQUIA", deptomunicipio: "MEDELLÍN", especialidad: "CIVIL", codigoDespacho: "050014003005", adminCorreo: "j05cmpalmed@cendoj.ramajudicial.gov.co", nombreDespacho: "JUZGADO 005 CIVIL MUNICIPAL DE MEDELLÍN", estado: "Activo" },
        { id: 105, tipo: "Permanente", consejoseccional: "BOGOTÁ", deptomunicipio: "BOGOTÁ", especialidad: "LABORAL", codigoDespacho: "110013105010", adminCorreo: "j10lctobta@cendoj.ramajudicial.gov.co", nombreDespacho: "JUZGADO 010 LABORAL DEL CIRCUITO DE BOGOTÁ", estado: "Activo" },
        { id: 106, tipo: "Permanente", consejoseccional: "TOLIMA", deptomunicipio: "IBAGUÉ", especialidad: "LABORAL", codigoDespacho: "730014105002", adminCorreo: "j02lpmibague@cendoj.ramajudicial.gov.co", nombreDespacho: "JUZGADO 002 LABORAL MUNICIPAL DE IBAGUÉ", estado: "Activo" },
        { id: 108, tipo: "Permanente", consejoseccional: "CALDAS", deptomunicipio: "LA DORADA", especialidad: "CIVIL", codigoDespacho: "173804003001", adminCorreo: "j01cmpladorada@cendoj.ramajudicial.gov.co", nombreDespacho: "JUZGADO 001 CIVIL MUNICIPAL DE LA DORADA", estado: "Activo" },
        { id: 109, tipo: "Permanente", consejoseccional: "CALDAS", deptomunicipio: "CHINCHINÁ", especialidad: "CIVIL", codigoDespacho: "171743103001", adminCorreo: "j01cctochinchina@cendoj.ramajudicial.gov.co", nombreDespacho: "JUZGADO 001 CIVIL DEL CIRCUITO DE CHINCHINÁ", estado: "Activo" },
        { id: 107, tipo: "Permanente", consejoseccional: "BOLÍVAR", deptomunicipio: "CARTAGENA", especialidad: "CIVIL RESTITUCIÓN DE TIERRAS", codigoDespacho: "130012221001", adminCorreo: "des01rtcartagena@cendoj.ramajudicial.gov.co", nombreDespacho: "DESPACHO 001 DE LA SALA CIVIL ESPECIALIZADA EN RESTITUCIÓN DE TIERRAS DE CARTAGENA", estado: "Activo" }
    ],

    // Despachos de descongestión de ejemplo (además de los de data.js)
    despachosDescongestionEjemplo: [
        { id: 111, tipo: "Descongestión", consejoseccional: "CALDAS", deptomunicipio: "MANIZALES", especialidad: "CIVIL", codigoDespacho: "170014003901", adminCorreo: "j01civdescongestion@cendoj.ramajudicial.gov.co", nombreDespacho: "JUZGADO 01 DE DESCONGESTIÓN CIVIL DE MANIZALES", estado: "Activo" },
        { id: 112, tipo: "Descongestión", consejoseccional: "CALDAS", deptomunicipio: "MANIZALES", especialidad: "CIVIL", codigoDespacho: "170014003902", adminCorreo: "j02civdescongestion@cendoj.ramajudicial.gov.co", nombreDespacho: "JUZGADO 02 DE DESCONGESTIÓN CIVIL DE MANIZALES", estado: "Activo" }
    ],

    medidas: [
        {
            id: 1,
            expedidaPor: "UDAE",
            acuerdo: { numero: "PCSJA26-11234", anio: 2026, archivo: "PCSJA26-11234.pdf" },
            consejoseccional: "CALDAS",
            fechaInicio: "2026-01-15",
            fechaFin: "2026-12-31",
            descripcion: "Medida de descongestión para la especialidad laboral en Manizales.",
            fechaRegistro: "2026-01-10",
            notificacion: { fecha: "2026-01-12", envios: 1 },
            resolucion: { numero: "CSJCAR26-045", anio: 2026, archivo: "CSJCAR26-045.pdf" },
            distribuciones: [
                { origenId: 101, destinoId: 5, procesos: 40, trasladados: 25 },
                { origenId: 102, destinoId: 5, procesos: 30, trasladados: 27 }
            ]
        },
        {
            id: 2,
            expedidaPor: "UDAE",
            acuerdo: { numero: "PCSJA26-11050", anio: 2026, archivo: "PCSJA26-11050.pdf" },
            consejoseccional: "ANTIOQUIA",
            fechaInicio: "2026-01-01",
            fechaFin: "2026-12-31",
            descripcion: "Medida de descongestión para la especialidad civil en Medellín.",
            fechaRegistro: "2025-12-20",
            notificacion: { fecha: "2025-12-22", envios: 2 },
            resolucion: { numero: "CSJANTR26-012", anio: 2026, archivo: "CSJANTR26-012.pdf" },
            distribuciones: [
                { origenId: 103, destinoId: 1, procesos: 50, trasladados: 12 },
                { origenId: 104, destinoId: 1, procesos: 35, trasladados: 0 }
            ]
        },
        {
            id: 3,
            expedidaPor: "UDAE",
            acuerdo: { numero: "PCSJA25-12890", anio: 2025, archivo: "PCSJA25-12890.pdf" },
            consejoseccional: "TOLIMA",
            fechaInicio: "2026-01-01",
            fechaFin: "2026-11-15",
            descripcion: "",
            fechaRegistro: "2025-12-15",
            notificacion: { fecha: "2025-12-16", envios: 1 },
            resolucion: { numero: "CSJTOR25-210", anio: 2025, archivo: "CSJTOR25-210.pdf" },
            distribuciones: [
                { origenId: 106, destinoId: 6, procesos: 20, trasladados: 18 }
            ]
        },
        {
            id: 4,
            expedidaPor: "CONSEJO",
            acuerdoCreacion: { numero: "PCSJA25-12755", anio: 2025 },
            acuerdo: { numero: "PCSJA26-11400", anio: 2026, archivo: "PCSJA26-11400.pdf" },
            consejoseccional: "BOGOTÁ",
            fechaInicio: "2026-02-01",
            fechaFin: "2026-12-31",
            descripcion: "Prórroga de la medida para el juzgado laboral transitorio de Bogotá.",
            fechaRegistro: "2026-01-25",
            notificacion: null, // aún no se ha notificado a los despachos
            resolucion: null, // opcional: esta medida no tiene resolución de creación de cargos
            distribuciones: [
                { origenId: 105, destinoId: 2, procesos: 60, trasladados: 10 }
            ]
        },
        {
            id: 5,
            expedidaPor: "CONSEJO",
            acuerdoCreacion: { numero: "PCSJA26-11234", anio: 2026 },
            acuerdo: { numero: "PCSJA26-11870", anio: 2026, archivo: "PCSJA26-11870.pdf" },
            consejoseccional: "CALDAS",
            fechaInicio: "2026-07-01",
            fechaFin: "2027-03-31",
            descripcion: "Ampliación de la medida laboral para procesos en estado de fallo.",
            fechaRegistro: "2026-06-20",
            notificacion: { fecha: "2026-06-22", envios: 1 },
            resolucion: null,
            distribuciones: [
                { origenId: 101, destinoId: 5, procesos: 15, trasladados: 0 }
            ]
        },
        {
            id: 6,
            expedidaPor: "UDAE",
            acuerdo: { numero: "PCSJA26-11502", anio: 2026, archivo: "PCSJA26-11502.pdf" },
            consejoseccional: "CALDAS",
            fechaInicio: "2026-03-01",
            fechaFin: "2026-12-31",
            descripcion: "Medida de descongestión para la especialidad civil en Caldas.",
            fechaRegistro: "2026-02-20",
            notificacion: { fecha: "2026-02-22", envios: 1 },
            resolucion: { numero: "CSJCAR26-031", anio: 2026, archivo: "CSJCAR26-031.pdf" },
            distribuciones: [
                { origenId: 108, destinoId: 111, procesos: 10, trasladados: 4 },
                { origenId: 109, destinoId: 112, procesos: 6,  trasladados: 0 }
            ]
        }
    ]
};