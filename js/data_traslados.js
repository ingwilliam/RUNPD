const dbTraslados = {
    // Consejo Seccional que distribuye (se usa en la notificación por correo)
    consejoSeccional: "CALDAS",

    solicitudes: [
        {
            id: 5,
            nombreDespacho: "JUZGADO 801 LABORAL MUNICIPAL TRANSITORIO DE MANIZALES",
            codigoDespacho: "170014005801",
            tipo: "JUZGADO MUNICIPAL",
            municipio: "MANIZALES",
            especialidad: "LABORAL",
            fechaSolicitud: "2026-09-20",
            procesos: [
                {
                    id: 1,
                    codigo: "05001400300320240012300",
                    estadoProceso: "Definir 2",
                    fechaActuacion: "2026-08-14",
                    link: "https://procesos.ramajudicial.gov.co/",
                    observaciones: "Pendiente dictamen pericial..........",
                    demandantes: [{ tipo: "natural", primerNombre: "Juan", segundoNombre: "Pablo", primerApellido: "Restrepo", segundoApellido: "Ochoa", nombre: "", correo: "jprestrepo@correo.com" }],
                    demandados: [{ tipo: "juridica", primerNombre: "", segundoNombre: "", primerApellido: "", segundoApellido: "", nombre: "INVERSIONES EL POBLADO S.A.S.", correo: "notificaciones@invpoblado.com" }],
                    estado: "pendiente",
                    despachoAsignado: null
                },
                {
                    id: 2,
                    codigo: "05001400300320250007800",
                    estadoProceso: "Definir 1",
                    fechaActuacion: "2026-09-10",
                    link: "",
                    observaciones: "Sin observaciones adicionales.",
                    demandantes: [{ tipo: "natural", primerNombre: "Sandra", segundoNombre: "", primerApellido: "Múnera", segundoApellido: "Arango", nombre: "", correo: "smunera@correo.com" }],
                    demandados: [{ tipo: "juridica", primerNombre: "", segundoNombre: "", primerApellido: "", segundoApellido: "", nombre: "CONSTRUCTORA ANDINA LTDA.", correo: "juridica@candina.co" }],
                    estado: "pendiente",
                    despachoAsignado: null
                },
                {
                    id: 3,
                    codigo: "05001400300320230045600",
                    estadoProceso: "Definir 3",
                    fechaActuacion: "2026-03-02",
                    link: "",
                    observaciones: "Proceso priorizado por antigüedad.",
                    demandantes: [{ tipo: "juridica", primerNombre: "", segundoNombre: "", primerApellido: "", segundoApellido: "", nombre: "BANCOLOMBIA S.A.", correo: "judicial@bancolombia.com.co" }],
                    demandados: [{ tipo: "natural", primerNombre: "Martha", segundoNombre: "Lucía", primerApellido: "Henao", segundoApellido: "Vélez", nombre: "", correo: "mhenao@correo.com" }],
                    estado: "pendiente",
                    despachoAsignado: null
                }
            ]
        }
    ],
    despachosDescongestion: [
        {
            id: 1,
            nombre: "Juzgado 01 de Descongestión Laboral de Manizales",
            especialidad: "LABORAL",
            cargaActual: 2,
            correo: "j01labdescongestsion@cendoj.ramajudicial.gov.co",
            procesosAsignadosActuales: [
                {
                    id: 901,
                    codigo: "05001400300320220011100",
                    estadoProceso: "Etapa probatoria",
                    fechaActuacion: "2026-08-01",
                    link: "",
                    observaciones: "Asignado en ciclo anterior de descongestión.",
                    demandantes: [{ nombre: "Gloria Inés Pineda" }],
                    demandados: [{ nombre: "Hospital San Juan de Dios" }],
                    fechaAsignacion: "2026-08-01"
                },
                {
                    id: 902,
                    codigo: "05001400300320220022200",
                    estadoProceso: "Alegatos de conclusión",
                    fechaActuacion: "2026-08-10",
                    link: "",
                    observaciones: "Pendiente fallo de segunda instancia.",
                    demandantes: [{ nombre: "Alonso Ramírez" }],
                    demandados: [{ nombre: "Empresa de Licores" }],
                    fechaAsignacion: "2026-08-10"
                }
            ]
        },
        {
            id: 2,
            nombre: "Juzgado 02 de Descongestión Laboral de Manizales",
            especialidad: "LABORAL",
            cargaActual: 0,
            correo: "j02labdescongestsion@cendoj.ramajudicial.gov.co",
            procesosAsignadosActuales: []
        }
    ]
};