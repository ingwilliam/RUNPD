// =====================================================================
// RUNPD - Datos del prototipo: recepción y seguimiento en el despacho de descongestión
// =====================================================================
const dbRecepcion = {
    // Despacho de descongestión que recibe (con la vigencia de su medida)
    despachoActual: {
        codigo: "170013105901",
        nombre: "JUZGADO 01 DE DESCONGESTIÓN LABORAL DE MANIZALES",
        correo: "j01labdescongestsion@cendoj.ramajudicial.gov.co",
        consejoSeccional: "CALDAS",
        medidaInicio: "2026-01-15",
        medidaFin: "2026-11-15"
    },

    catalogos: {
        estadosProceso: [
            "Admisión de la demanda",
            "Notificación",
            "Contestación de la demanda",
            "Audiencia inicial",
            "Etapa probatoria",
            "Audiencia de instrucción y juzgamiento",
            "Alegatos de conclusión",
            "Al despacho para fallo",
            "Recurso en trámite",
            "Suspendido"
        ],
        // Estado especial que cierra el proceso
        estadoFinal: "TERMINADO",
        formasTerminacion: [
            "Sentencia ejecutoriada",
            "Conciliación",
            "Transacción",
            "Desistimiento",
            "Otra forma de terminación"
        ],
        motivosDevolucion: [
            { value: "error_traslado", label: "Error de traslado", descripcion: "El proceso no corresponde a este despacho (competencia, especialidad o datos incorrectos)." },
            { value: "fin_medida", label: "Finalizó la medida de descongestión", descripcion: "La medida terminó y el proceso no alcanzó a finalizarse en este despacho." }
        ]
    },

    // Procesos asignados por el Consejo Seccional
    procesos: [
        {
            id: 901,
            codigo: "05001400300320220011100",
            estadoProceso: "Etapa probatoria",
            fechaActuacion: "2026-07-20",
            link: "",
            observaciones: "Asignado en ciclo anterior de descongestión.",
            demandantes: [{ tipo: "natural", primerNombre: "Gloria", segundoNombre: "Inés", primerApellido: "Pineda", segundoApellido: "", nombre: "", correo: "gpineda@correo.com" }],
            demandados: [{ tipo: "juridica", nombre: "HOSPITAL SAN JUAN DE DIOS", correo: "juridica@hsjd.gov.co" }],
            despachoOrigen: "JUZGADO 002 LABORAL MUNICIPAL DE MANIZALES",
            fechaRecepcion: "2026-08-01",
            visto: true,
            estado: "tramite",
            actuaciones: [
                { tipo: "actuacion", fecha: "2026-08-20", estadoProceso: "Etapa probatoria", proximaActuacion: "2026-09-25", observacion: "Se decretaron pruebas testimoniales." }
            ]
        },
        {
            id: 902,
            codigo: "05001400300320220022200",
            estadoProceso: "Alegatos de conclusión",
            fechaActuacion: "2026-08-05",
            link: "",
            observaciones: "Pendiente fallo de segunda instancia.",
            demandantes: [{ tipo: "natural", primerNombre: "Alonso", segundoNombre: "", primerApellido: "Ramírez", segundoApellido: "", nombre: "", correo: "aramirez@correo.com" }],
            demandados: [{ tipo: "juridica", nombre: "EMPRESA DE LICORES", correo: "notificaciones@licores.gov.co" }],
            despachoOrigen: "JUZGADO 002 LABORAL MUNICIPAL DE MANIZALES",
            fechaRecepcion: "2026-08-10",
            visto: true,
            estado: "tramite",
            actuaciones: [
                { tipo: "actuacion", fecha: "2026-09-15", estadoProceso: "Alegatos de conclusión", proximaActuacion: "2026-10-05", observacion: "Se corrió traslado para alegar." }
            ]
        },
        {
            id: 1,
            codigo: "05001400300320240012300",
            estadoProceso: "Definir 2",
            fechaActuacion: "2026-08-14",
            link: "https://procesos.ramajudicial.gov.co/",
            observaciones: "Pendiente dictamen pericial.",
            demandantes: [{ tipo: "natural", primerNombre: "Juan", segundoNombre: "Pablo", primerApellido: "Restrepo", segundoApellido: "Ochoa", nombre: "", correo: "jprestrepo@correo.com" }],
            demandados: [{ tipo: "juridica", nombre: "INVERSIONES EL POBLADO S.A.S.", correo: "notificaciones@invpoblado.com" }],
            despachoOrigen: "JUZGADO 801 LABORAL MUNICIPAL TRANSITORIO DE MANIZALES",
            fechaRecepcion: "2026-09-29",
            visto: false,
            estado: "tramite",
            actuaciones: []
        },
        {
            id: 3,
            codigo: "05001400300320230045600",
            estadoProceso: "Definir 3",
            fechaActuacion: "2026-03-02",
            link: "",
            observaciones: "Proceso priorizado por antigüedad.",
            demandantes: [{ tipo: "juridica", nombre: "BANCOLOMBIA S.A.", correo: "judicial@bancolombia.com.co" }],
            demandados: [{ tipo: "natural", primerNombre: "Martha", segundoNombre: "Lucía", primerApellido: "Henao", segundoApellido: "Vélez", nombre: "", correo: "mhenao@correo.com" }],
            despachoOrigen: "JUZGADO 801 LABORAL MUNICIPAL TRANSITORIO DE MANIZALES",
            fechaRecepcion: "2026-09-29",
            visto: false,
            estado: "tramite",
            actuaciones: []
        },
        {
            id: 903,
            codigo: "17001310500120210033300",
            estadoProceso: "Al despacho para fallo",
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
                { tipo: "actuacion", fecha: "2026-04-12", estadoProceso: "Al despacho para fallo", proximaActuacion: "2026-06-10", observacion: "" },
                { tipo: "finalizacion", fecha: "2026-06-18", estadoProceso: "TERMINADO – Sentencia ejecutoriada", proximaActuacion: "", observacion: "Sentencia favorable al demandante." }
            ]
        },
        {
            id: 904,
            codigo: "17001410500220250004400",
            estadoProceso: "Admisión de la demanda",
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
                { tipo: "devolucion", fecha: "2026-05-22", estadoProceso: "Devuelto al Consejo Seccional – Error de traslado", proximaActuacion: "", observacion: "El proceso es de especialidad civil, no laboral." }
            ]
        }
    ]
};