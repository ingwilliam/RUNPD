// =====================================================================
// RUNPD - Consejo Seccional: supervisión y verificación de las medidas
// Desde la materialización hasta la finalización, el Consejo Seccional consulta
// reportes por medida y por proceso para verificar el cumplimiento de las medidas
// adoptadas. Solo consulta: no modifica procesos.
//
// Eventos de la medida:  acuerdo (CSJ) · despachos (UDAE) · materializacion · notificacion
// Eventos del proceso:   registro · envio · actuacion · finalizacion · devolucion_origen
// Los datos coinciden con las pantallas de medidas, registro (origen) y recepción (destino).
// =====================================================================
const J002 = "JUZGADO 002 LABORAL MUNICIPAL DE MANIZALES";
const J003 = "JUZGADO 003 LABORAL DEL CIRCUITO DE MANIZALES";
const J801 = "JUZGADO 801 LABORAL MUNICIPAL TRANSITORIO DE MANIZALES";
const JDOR = "JUZGADO 001 CIVIL MUNICIPAL DE LA DORADA";
const JCHI = "JUZGADO 001 CIVIL DEL CIRCUITO DE CHINCHINÁ";
const JC01 = "JUZGADO 01 DE DESCONGESTIÓN CIVIL DE MANIZALES";
const JC02 = "JUZGADO 02 DE DESCONGESTIÓN CIVIL DE MANIZALES";

// Administradores de los despachos en las medidas (registrados por el Consejo Seccional)
const ADM = {
    luis:    { nombre: "Luis Fernando Giraldo Restrepo", correo: "lgiraldor@cendoj.ramajudicial.gov.co", celular: "3104567821" },
    ana:     { nombre: "Ana María Ospina Valencia", correo: "aospinav@cendoj.ramajudicial.gov.co", celular: "3127784410" },
    laura:   { nombre: "Laura Giraldo Henao", correo: "lgiraldo@cendoj.ramajudicial.gov.co", celular: "3015562390" },
    jorge:   { nombre: "Jorge Iván Cárdenas Mejía", correo: "jcardenasm@cendoj.ramajudicial.gov.co", celular: "3206671245" },
    marcela: { nombre: "Marcela Zuluaga Ríos", correo: "mzuluagar@cendoj.ramajudicial.gov.co", celular: "3148820017" },
    diego:   { nombre: "Diego Alejandro Patiño", correo: "dpatino@cendoj.ramajudicial.gov.co", celular: "3112093384" }
};

const dbSupervision = {
    consejoSeccional: "CALDAS",

    medidas: [
        {
            id: 1,
            acuerdo: { numero: "PCSJA26-11234", anio: 2026 },
            resolucion: { numero: "CSJCAR26-045", anio: 2026 },
            especialidad: "LABORAL",
            fechaInicio: "2026-01-15",
            fechaFin: "2026-12-31",
            rutas: [
                { origen: J002, destino: J801, autorizados: 40, adminOrigen: ADM.luis, adminDestino: ADM.laura },
                { origen: J003, destino: J801, autorizados: 30, adminOrigen: ADM.ana,  adminDestino: ADM.laura }
            ],
            eventos: [
                { tipo: "acuerdo", fecha: "2025-12-18", actor: "Consejo Superior de la Judicatura", detalle: "Expide el Acuerdo PCSJA26-11234 de 2026 y la Resolución CSJCAR26-045 de creación de despachos." },
                { tipo: "despachos", fecha: "2026-01-08", actor: "UDAE", detalle: `El despacho destino no existía: la UDAE creó el ${J801}.` },
                { tipo: "materializacion", fecha: "2026-01-10", actor: "Consejo Seccional de Caldas", detalle: "Materializó la medida: 2 rutas, 70 procesos autorizados y los administradores de los 3 despachos." },
                { tipo: "notificacion", fecha: "2026-01-12", actor: "Consejo Seccional de Caldas", detalle: "Notificó la medida a los administradores de los 3 despachos." }
            ]
        },
        {
            id: 5,
            acuerdo: { numero: "PCSJA26-11870", anio: 2026 },
            resolucion: null,
            especialidad: "LABORAL",
            fechaInicio: "2026-07-01",
            fechaFin: "2027-03-31",
            rutas: [
                { origen: J002, destino: J801, autorizados: 15, adminOrigen: ADM.luis, adminDestino: ADM.laura }
            ],
            eventos: [
                { tipo: "acuerdo", fecha: "2026-06-10", actor: "Consejo Superior de la Judicatura", detalle: "Expide el Acuerdo PCSJA26-11870 de 2026 que amplía la medida laboral." },
                { tipo: "despachos", fecha: "2026-06-15", actor: "UDAE", detalle: "Verificó que los despachos origen y destino ya existen. No fue necesario crear despachos." },
                { tipo: "materializacion", fecha: "2026-06-20", actor: "Consejo Seccional de Caldas", detalle: "Materializó la medida: 1 ruta, 15 procesos autorizados y los administradores de los 2 despachos." },
                { tipo: "notificacion", fecha: "2026-06-22", actor: "Consejo Seccional de Caldas", detalle: "Notificó la medida a los administradores de los 2 despachos." }
            ]
        },
        {
            id: 6,
            acuerdo: { numero: "PCSJA26-11502", anio: 2026 },
            resolucion: { numero: "CSJCAR26-031", anio: 2026 },
            especialidad: "CIVIL",
            fechaInicio: "2026-03-01",
            fechaFin: "2026-12-31",
            rutas: [
                { origen: JDOR, destino: JC01, autorizados: 10, adminOrigen: ADM.jorge, adminDestino: ADM.marcela },
                { origen: JCHI, destino: JC02, autorizados: 6,  adminOrigen: ADM.diego, adminDestino: null } // administrador pendiente
            ],
            eventos: [
                { tipo: "acuerdo", fecha: "2026-02-05", actor: "Consejo Superior de la Judicatura", detalle: "Expide el Acuerdo PCSJA26-11502 de 2026 y la Resolución CSJCAR26-031 de creación de despachos." },
                { tipo: "despachos", fecha: "2026-02-16", actor: "UDAE", detalle: `Los despachos destino no existían: la UDAE creó el ${JC01} y el ${JC02}.` },
                { tipo: "materializacion", fecha: "2026-02-20", actor: "Consejo Seccional de Caldas", detalle: "Materializó la medida: 2 rutas y 16 procesos autorizados. Registró 3 de 4 administradores." }
            ]
        }
    ],

    // Procesos de las medidas con su trazabilidad (el último evento define el estado)
    procesos: [
        // ---- Medida PCSJA26-11234 ----
        { codigo: "05001400300320240012300", medidaId: 1, origen: J002, destino: J801,
          partes: "Juan Pablo Restrepo Ochoa c/ INVERSIONES EL POBLADO S.A.S.",
          eventos: [ { tipo: "registro", fecha: "2026-09-10", estadoProcesal: "Decreta pruebas y señala fecha de audiencia" } ] },
        { codigo: "05001400300320250007800", medidaId: 1, origen: J002, destino: J801,
          partes: "Sandra Múnera Arango c/ CONSTRUCTORA ANDINA LTDA.",
          eventos: [ { tipo: "registro", fecha: "2026-09-12", estadoProcesal: "Admitida o libra mandamiento" } ] },
        { codigo: "17001410500220240039100", medidaId: 1, origen: J002, destino: J801,
          partes: "Beatriz Londoño Gil c/ CLÍNICA SANTA SOFÍA S.A.",
          eventos: [
            { tipo: "registro", fecha: "2026-09-05", estadoProcesal: "Integrada la litis" },
            { tipo: "envio", fecha: "2026-09-26" }
          ] },
        { codigo: "05001400300320220011100", medidaId: 1, origen: J002, destino: J801,
          partes: "Gloria Inés Pineda c/ HOSPITAL SAN JUAN DE DIOS",
          eventos: [
            { tipo: "registro", fecha: "2026-07-25", estadoProcesal: "Decreta pruebas y señala fecha de audiencia" },
            { tipo: "envio", fecha: "2026-08-01" },
            { tipo: "actuacion", fecha: "2026-08-02", estadoProcesal: "Auto que asume el conocimiento", proxima: "2026-08-20" },
            { tipo: "actuacion", fecha: "2026-08-20", estadoProcesal: "Pruebas decretadas pendientes de práctica", proxima: "2026-09-25" }
          ] },
        { codigo: "05001400300320220022200", medidaId: 1, origen: J003, destino: J801,
          partes: "Alonso Ramírez c/ EMPRESA DE LICORES DE CALDAS",
          eventos: [
            { tipo: "registro", fecha: "2026-08-04", estadoProcesal: "Con fecha para audiencia inicial, de instrucción y juzgamiento" },
            { tipo: "envio", fecha: "2026-08-10" },
            { tipo: "actuacion", fecha: "2026-08-12", estadoProcesal: "Auto que asume el conocimiento", proxima: "2026-08-30" },
            { tipo: "actuacion", fecha: "2026-09-15", estadoProcesal: "Corre el término para que las partes presenten alegatos de conclusión", proxima: "2026-10-20" }
          ] },
        { codigo: "17001310500320230066600", medidaId: 1, origen: J003, destino: J801,
          partes: "Hernán Toro Valencia c/ COLPENSIONES",
          eventos: [
            { tipo: "registro", fecha: "2026-09-15", estadoProcesal: "En estado de fallo" },
            { tipo: "envio", fecha: "2026-09-22" }
          ] },
        { codigo: "17001310500120210033300", medidaId: 1, origen: J003, destino: J801,
          partes: "Rubén Darío Cardona Gil c/ COLPENSIONES",
          eventos: [
            { tipo: "registro", fecha: "2026-02-12", estadoProcesal: "En estado de fallo" },
            { tipo: "envio", fecha: "2026-03-01" },
            { tipo: "actuacion", fecha: "2026-03-03", estadoProcesal: "Auto que asume el conocimiento", proxima: "2026-04-12" },
            { tipo: "actuacion", fecha: "2026-04-12", estadoProcesal: "Sentencia", proxima: "2026-06-10" },
            { tipo: "actuacion", fecha: "2026-06-10", estadoProcesal: "Liquidación de costas, entrega de títulos, levantamiento de medidas cautelares u oficios", proxima: "2026-06-18" },
            { tipo: "finalizacion", fecha: "2026-06-18", forma: "Sentencia ejecutoriada" }
          ] },
        { codigo: "17001410500220250004400", medidaId: 1, origen: J002, destino: J801,
          partes: "Paula Osorio Marín c/ TRANSPORTES DEL CAFÉ S.A.",
          eventos: [
            { tipo: "registro", fecha: "2026-05-05", estadoProcesal: "Admitida o libra mandamiento" },
            { tipo: "envio", fecha: "2026-05-20" },
            { tipo: "devolucion_origen", fecha: "2026-05-22", motivo: "Error de traslado: el proceso es de especialidad civil." }
          ] },

        // ---- Medida PCSJA26-11870 ----
        { codigo: "05001400300320230045600", medidaId: 5, origen: J002, destino: J801,
          partes: "BANCOLOMBIA S.A. c/ Martha Lucía Henao Vélez y otro",
          eventos: [
            { tipo: "registro", fecha: "2026-09-12", estadoProcesal: "En estado de fallo" },
            { tipo: "envio", fecha: "2026-09-20" },
            { tipo: "actuacion", fecha: "2026-09-23", estadoProcesal: "Auto que asume el conocimiento", proxima: "2026-10-01" }
          ] },

        // ---- Medida PCSJA26-11502 (civil) ----
        { codigo: "17380400300120240021200", medidaId: 6, origen: JDOR, destino: JC01,
          partes: "BANCO AGRARIO DE COLOMBIA S.A. c/ Wilson Quintero Rojas",
          eventos: [
            { tipo: "registro", fecha: "2026-08-05", estadoProcesal: "Admitida o libra mandamiento" },
            { tipo: "envio", fecha: "2026-08-12" },
            { tipo: "actuacion", fecha: "2026-08-14", estadoProcesal: "Auto que asume el conocimiento", proxima: "2026-09-10" },
            { tipo: "actuacion", fecha: "2026-09-10", estadoProcesal: "Fija fecha para audiencia inicial, de instrucción y juzgamiento", proxima: "2026-11-05" }
          ] },
        { codigo: "17380400300120250003400", medidaId: 6, origen: JDOR, destino: JC01,
          partes: "Carmen Rosa Valencia c/ Hernando Morales Parra",
          eventos: [ { tipo: "registro", fecha: "2026-09-28", estadoProcesal: "Integrada la litis" } ] },
        { codigo: "17174310300120240009100", medidaId: 6, origen: JCHI, destino: JC02,
          partes: "Álvaro Betancur Loaiza c/ SEGUROS DEL ESTADO S.A.",
          eventos: [
            { tipo: "registro", fecha: "2026-04-20", estadoProcesal: "Con fecha para audiencia inicial, de instrucción y juzgamiento" },
            { tipo: "envio", fecha: "2026-04-27" },
            { tipo: "actuacion", fecha: "2026-04-30", estadoProcesal: "Auto que asume el conocimiento", proxima: "2026-06-15" },
            { tipo: "actuacion", fecha: "2026-06-15", estadoProcesal: "Aprueba conciliación", proxima: "2026-06-25" },
            { tipo: "finalizacion", fecha: "2026-06-25", forma: "Conciliación aprobada" }
          ] }
    ]
};