// =====================================================================
// RUNPD - Medidas de descongestión (Consejo Seccional)
// Solo el Consejo Seccional materializa medidas, con base en el Acuerdo y/o
// Resolución del Consejo Superior de la Judicatura. Los despachos ya existen:
// los garantiza la UDAE en "Gestión y Creación de Despachos".
// Por cada medida, el Consejo registra la información del Administrador de cada
// despacho origen y destino: es el único autorizado en esa medida para registrar
// (origen) o gestionar (destino) los procesos.
// Los despachos de descongestión vienen de js/data.js (dbDatos.despachos).
// =====================================================================
const dbMedidas = {

    // Consejo Seccional que usa la pantalla (rol actual)
    consejoActual: "CALDAS",

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
            ],
            // Administrador del despacho en esta medida (clave: id del despacho)
            administradores: {
                101: { primerNombre: "Luis", segundoNombre: "Fernando", primerApellido: "Giraldo", segundoApellido: "Restrepo", correo: "lgiraldor@cendoj.ramajudicial.gov.co", celular: "3104567821", password: "Temp2026*Lq8m" },
                102: { primerNombre: "Ana", segundoNombre: "María", primerApellido: "Ospina", segundoApellido: "Valencia", correo: "aospinav@cendoj.ramajudicial.gov.co", celular: "3127784410", password: "Temp2026*Xw3n" },
                5:   { primerNombre: "Laura", segundoNombre: "", primerApellido: "Giraldo", segundoApellido: "Henao", correo: "lgiraldo@cendoj.ramajudicial.gov.co", celular: "3015562390", password: "Temp2026*Pk7r" }
            }
        },
        {
            id: 5,
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
            ],
            administradores: {
                101: { primerNombre: "Luis", segundoNombre: "Fernando", primerApellido: "Giraldo", segundoApellido: "Restrepo", correo: "lgiraldor@cendoj.ramajudicial.gov.co", celular: "3104567821", password: "Temp2026*Mn4t" },
                5:   { primerNombre: "Laura", segundoNombre: "", primerApellido: "Giraldo", segundoApellido: "Henao", correo: "lgiraldo@cendoj.ramajudicial.gov.co", celular: "3015562390", password: "Temp2026*Rb9e" }
            }
        },
        {
            id: 6,
            acuerdo: { numero: "PCSJA26-11502", anio: 2026, archivo: "PCSJA26-11502.pdf" },
            consejoseccional: "CALDAS",
            fechaInicio: "2026-03-01",
            fechaFin: "2026-12-31",
            descripcion: "Medida de descongestión para la especialidad civil en Caldas.",
            fechaRegistro: "2026-02-20",
            notificacion: null,
            resolucion: { numero: "CSJCAR26-031", anio: 2026, archivo: "CSJCAR26-031.pdf" },
            distribuciones: [
                { origenId: 108, destinoId: 111, procesos: 10, trasladados: 4 },
                { origenId: 109, destinoId: 112, procesos: 6,  trasladados: 0 }
            ],
            // Falta el administrador del Juzgado 02 de Descongestión Civil (se ve como pendiente)
            administradores: {
                108: { primerNombre: "Jorge", segundoNombre: "Iván", primerApellido: "Cárdenas", segundoApellido: "Mejía", correo: "jcardenasm@cendoj.ramajudicial.gov.co", celular: "3206671245", password: "Temp2026*Hy2d" },
                111: { primerNombre: "Marcela", segundoNombre: "", primerApellido: "Zuluaga", segundoApellido: "Ríos", correo: "mzuluagar@cendoj.ramajudicial.gov.co", celular: "3148820017", password: "Temp2026*Vc6s" },
                109: { primerNombre: "Diego", segundoNombre: "Alejandro", primerApellido: "Patiño", segundoApellido: "", correo: "dpatino@cendoj.ramajudicial.gov.co", celular: "3112093384", password: "Temp2026*Gt5w" }
            }
        }
    ]
};