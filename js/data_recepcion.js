// =====================================================================
// RUNPD - Datos del prototipo: recepción y seguimiento en el despacho destino
// Los procesos llegan cuando el despacho origen los ENVÍA directamente, dentro de
// una medida de descongestión materializada por el Consejo Seccional.
// La vigencia es de cada medida. Cada medida trae el administrador autorizado del
// despacho destino (usted) y el de cada despacho origen (a quien se notifica la
// devolución o la finalización de sus procesos).
// =====================================================================
const dbRecepcion = {
    // Despacho de descongestión que recibe (destino en el plan de distribución de las medidas)
    despachoActual: {
        codigo: "170014005801",
        nombre: "JUZGADO 801 LABORAL MUNICIPAL TRANSITORIO DE MANIZALES",
        correo: "lgiraldo@cendoj.ramajudicial.gov.co",
        consejoSeccional: "CALDAS"
    },

    // Medidas en las que el despacho es destino
    // origenes[].procesos = procesos que la medida autoriza recibir de ese despacho origen
    medidas: [
        {
            id: 1,
            acuerdo: { numero: "PCSJA26-11234", anio: 2026 },
            resolucion: { numero: "CSJCAR26-045", anio: 2026 },
            fechaInicio: "2026-01-15",
            fechaFin: "2026-12-31",
            descripcion: "Medida de descongestión para la especialidad laboral en Manizales.",
            administradorDestino: { nombre: "Laura Giraldo Henao", correo: "lgiraldo@cendoj.ramajudicial.gov.co", celular: "3015562390" },
            origenes: [
                { nombre: "JUZGADO 002 LABORAL MUNICIPAL DE MANIZALES", procesos: 40,
                  administrador: { nombre: "Luis Fernando Giraldo Restrepo", correo: "lgiraldor@cendoj.ramajudicial.gov.co", celular: "3104567821" } },
                { nombre: "JUZGADO 003 LABORAL DEL CIRCUITO DE MANIZALES", procesos: 30,
                  administrador: { nombre: "Ana María Ospina Valencia", correo: "aospinav@cendoj.ramajudicial.gov.co", celular: "3127784410" } }
            ]
        },
        {
            id: 5,
            acuerdo: { numero: "PCSJA26-11870", anio: 2026 },
            resolucion: null,
            fechaInicio: "2026-07-01",
            fechaFin: "2027-03-31",
            descripcion: "Ampliación de la medida laboral para procesos en estado de fallo.",
            administradorDestino: { nombre: "Laura Giraldo Henao", correo: "lgiraldo@cendoj.ramajudicial.gov.co", celular: "3015562390" },
            origenes: [
                { nombre: "JUZGADO 002 LABORAL MUNICIPAL DE MANIZALES", procesos: 15,
                  administrador: { nombre: "Luis Fernando Giraldo Restrepo", correo: "lgiraldor@cendoj.ramajudicial.gov.co", celular: "3104567821" } }
            ]
        }
    ],

    catalogos: {
        // Estados definidos por el equipo funcional (despacho con medida de descongestión)
        estadosProceso: [
            "Auto que asume el conocimiento",
            "Fija fecha para audiencia inicial, de instrucción y juzgamiento",
            "Solicitud de nulidad pendiente de resolver",
            "Pruebas decretadas pendientes de práctica",
            "Se concedió apelación de un auto en efecto suspensivo y el expediente se encuentra en el superior",
            "Corre el término para que las partes presenten alegatos de conclusión",
            "Aprueba conciliación",
            "Auto que decreta terminación",
            "Sentencia",
            "Se concedió apelación contra la sentencia y el expediente se remite al superior",
            "Liquidación de costas, entrega de títulos, levantamiento de medidas cautelares u oficios"
        ],
        // Estado especial que cierra el proceso
        estadoFinal: "TERMINADO",
        formasTerminacion: [
            "Sentencia ejecutoriada",
            "Conciliación aprobada",
            "Transacción",
            "Desistimiento",
            "Desistimiento tácito",
            "Pago total de la obligación",
            "Otra forma de terminación"
        ],
        // Forma de terminación que se preselecciona según el último estado registrado
        // ("Auto que decreta terminación" no tiene sugerencia: el usuario elige la causa)
        formaSugeridaPorEstado: {
            "Sentencia": "Sentencia ejecutoriada",
            "Liquidación de costas, entrega de títulos, levantamiento de medidas cautelares u oficios": "Sentencia ejecutoriada",
            "Aprueba conciliación": "Conciliación aprobada"
        },
        motivosDevolucion: [
            { value: "error_traslado", label: "Error de traslado", descripcion: "El proceso no corresponde a este despacho (competencia, especialidad o datos incorrectos)." },
            { value: "fin_medida", label: "Finalizó la medida de descongestión", descripcion: "La medida del proceso terminó y no alcanzó a finalizarse en este despacho." }
        ]
    },

    // Procesos recibidos de los despachos origen
    procesos: [
        {
            id: 901,
            medidaId: 1,
            codigo: "05001400300320220011100",
            estadoProceso: "Decreta pruebas y señala fecha de audiencia",
            fechaActuacion: "2026-07-20",
            link: "",
            observaciones: "",
            demandantes: [{ tipo: "natural", primerNombre: "Gloria", segundoNombre: "Inés", primerApellido: "Pineda", segundoApellido: "", nombre: "", correo: "gpineda@correo.com" }],
            demandados: [{ tipo: "juridica", nombre: "HOSPITAL SAN JUAN DE DIOS", correo: "juridica@hsjd.gov.co" }],
            despachoOrigen: "JUZGADO 002 LABORAL MUNICIPAL DE MANIZALES",
            fechaRecepcion: "2026-08-01",
            visto: true,
            estado: "tramite",
            actuaciones: [
                { tipo: "actuacion", fecha: "2026-08-02", estadoProceso: "Auto que asume el conocimiento", proximaActuacion: "2026-08-20", observacion: "Se avocó conocimiento del proceso." },
                { tipo: "actuacion", fecha: "2026-08-20", estadoProceso: "Pruebas decretadas pendientes de práctica", proximaActuacion: "2026-09-25", observacion: "Se decretaron pruebas testimoniales." }
            ]
        },
        {
            id: 902,
            medidaId: 1,
            codigo: "05001400300320220022200",
            estadoProceso: "Con fecha para audiencia inicial, de instrucción y juzgamiento",
            fechaActuacion: "2026-08-05",
            link: "",
            observaciones: "",
            demandantes: [{ tipo: "natural", primerNombre: "Alonso", segundoNombre: "", primerApellido: "Ramírez", segundoApellido: "", nombre: "", correo: "aramirez@correo.com" }],
            demandados: [{ tipo: "juridica", nombre: "EMPRESA DE LICORES DE CALDAS", correo: "notificaciones@licoreracaldas.gov.co" }],
            despachoOrigen: "JUZGADO 003 LABORAL DEL CIRCUITO DE MANIZALES",
            fechaRecepcion: "2026-08-10",
            visto: true,
            estado: "tramite",
            actuaciones: [
                { tipo: "actuacion", fecha: "2026-08-12", estadoProceso: "Auto que asume el conocimiento", proximaActuacion: "2026-08-30", observacion: "" },
                { tipo: "actuacion", fecha: "2026-09-15", estadoProceso: "Corre el término para que las partes presenten alegatos de conclusión", proximaActuacion: "2026-10-05", observacion: "Se corrió traslado para alegar." }
            ]
        },
        {
            id: 14,
            medidaId: 1,
            codigo: "17001410500220240039100",
            estadoProceso: "Integrada la litis",
            fechaActuacion: "2026-08-30",
            link: "",
            observaciones: "",
            demandantes: [{ tipo: "natural", primerNombre: "Beatriz", segundoNombre: "", primerApellido: "Londoño", segundoApellido: "Gil", nombre: "", correo: "blondono@correo.com" }],
            demandados: [{ tipo: "juridica", nombre: "CLÍNICA SANTA SOFÍA S.A.", correo: "juridica@clinicasantasofia.co" }],
            despachoOrigen: "JUZGADO 002 LABORAL MUNICIPAL DE MANIZALES",
            fechaRecepcion: "2026-09-26",
            visto: false,
            estado: "tramite",
            actuaciones: []
        },
        {
            id: 905,
            medidaId: 1,
            codigo: "17001310500320230066600",
            estadoProceso: "En estado de fallo",
            fechaActuacion: "2026-04-14",
            link: "https://procesos.ramajudicial.gov.co/",
            observaciones: "Alegatos presentados por ambas partes.",
            demandantes: [{ tipo: "natural", primerNombre: "Hernán", segundoNombre: "", primerApellido: "Toro", segundoApellido: "Valencia", nombre: "", correo: "htoro@correo.com" }],
            demandados: [{ tipo: "juridica", nombre: "COLPENSIONES", correo: "notificacionesjudiciales@colpensiones.gov.co" }],
            despachoOrigen: "JUZGADO 003 LABORAL DEL CIRCUITO DE MANIZALES",
            fechaRecepcion: "2026-09-22",
            visto: false,
            estado: "tramite",
            actuaciones: []
        },
        {
            id: 903,
            medidaId: 1,
            codigo: "17001310500120210033300",
            estadoProceso: "En estado de fallo",
            fechaActuacion: "2026-02-10",
            link: "",
            observaciones: "",
            demandantes: [{ tipo: "natural", primerNombre: "Rubén", segundoNombre: "Darío", primerApellido: "Cardona", segundoApellido: "Gil", nombre: "", correo: "rcardona@correo.com" }],
            demandados: [{ tipo: "juridica", nombre: "COLPENSIONES", correo: "notificacionesjudiciales@colpensiones.gov.co" }],
            despachoOrigen: "JUZGADO 003 LABORAL DEL CIRCUITO DE MANIZALES",
            fechaRecepcion: "2026-03-01",
            visto: true,
            estado: "finalizado",
            fechaFinalizacion: "2026-06-18",
            formaTerminacion: "Sentencia ejecutoriada",
            actuaciones: [
                { tipo: "actuacion", fecha: "2026-03-03", estadoProceso: "Auto que asume el conocimiento", proximaActuacion: "2026-04-12", observacion: "" },
                { tipo: "actuacion", fecha: "2026-04-12", estadoProceso: "Sentencia", proximaActuacion: "2026-06-10", observacion: "Sentencia favorable al demandante, pendiente de ejecutoria." },
                { tipo: "actuacion", fecha: "2026-06-10", estadoProceso: "Liquidación de costas, entrega de títulos, levantamiento de medidas cautelares u oficios", proximaActuacion: "2026-06-18", observacion: "Liquidación de costas aprobada." },
                { tipo: "finalizacion", fecha: "2026-06-18", estadoProceso: "TERMINADO – Sentencia ejecutoriada", proximaActuacion: "", observacion: "Sentencia favorable al demandante." }
            ]
        },
        {
            id: 904,
            medidaId: 1,
            codigo: "17001410500220250004400",
            estadoProceso: "Admitida o libra mandamiento",
            fechaActuacion: "2026-05-02",
            link: "",
            observaciones: "",
            demandantes: [{ tipo: "natural", primerNombre: "Paula", segundoNombre: "", primerApellido: "Osorio", segundoApellido: "Marín", nombre: "", correo: "posorio@correo.com" }],
            demandados: [{ tipo: "juridica", nombre: "TRANSPORTES DEL CAFÉ S.A.", correo: "legal@transcafe.com" }],
            despachoOrigen: "JUZGADO 002 LABORAL MUNICIPAL DE MANIZALES",
            fechaRecepcion: "2026-05-20",
            visto: true,
            estado: "devuelto",
            devolucion: { fecha: "2026-05-22", motivo: "Error de traslado", observacion: "El proceso es de especialidad civil, no laboral." },
            actuaciones: [
                { tipo: "devolucion", fecha: "2026-05-22", estadoProceso: "Devuelto al despacho origen – Error de traslado", proximaActuacion: "", observacion: "El proceso es de especialidad civil, no laboral." }
            ]
        },
        {
            id: 3,
            medidaId: 5,
            codigo: "05001400300320230045600",
            estadoProceso: "En estado de fallo",
            fechaActuacion: "2026-03-02",
            link: "",
            observaciones: "Alegatos surtidos. Pendiente proferir sentencia.",
            demandantes: [{ tipo: "juridica", nombre: "BANCOLOMBIA S.A.", correo: "judicial@bancolombia.com.co" }],
            demandados: [
                { tipo: "natural", primerNombre: "Martha", segundoNombre: "Lucía", primerApellido: "Henao", segundoApellido: "Vélez", nombre: "", correo: "mhenao@correo.com" },
                { tipo: "natural", primerNombre: "Andrés", segundoNombre: "", primerApellido: "Henao", segundoApellido: "Vélez", nombre: "", correo: "ahenao@correo.com" }
            ],
            despachoOrigen: "JUZGADO 002 LABORAL MUNICIPAL DE MANIZALES",
            fechaRecepcion: "2026-09-20",
            visto: true,
            estado: "tramite",
            actuaciones: [
                { tipo: "actuacion", fecha: "2026-09-23", estadoProceso: "Auto que asume el conocimiento", proximaActuacion: "2026-10-01", observacion: "" }
            ]
        }
    ]
};