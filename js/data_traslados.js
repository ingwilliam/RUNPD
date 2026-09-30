const dbTraslados = {
    // Consejo Seccional que distribuye (se usa en la notificación por correo)
    consejoSeccional: "CALDAS",

    // =================================================================
    // SOLICITUDES: despachos permanentes que enviaron procesos
    // =================================================================
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
        },
        {
            id: 6,
            nombreDespacho: "JUZGADO 002 LABORAL MUNICIPAL DE MANIZALES",
            codigoDespacho: "170014105002",
            tipo: "JUZGADO MUNICIPAL",
            municipio: "MANIZALES",
            especialidad: "LABORAL",
            fechaSolicitud: "2026-09-24",
            procesos: [
                {
                    id: 11,
                    codigo: "17001410500220250012300",
                    estadoProceso: "Definir 1",
                    fechaActuacion: "2026-07-22",
                    link: "https://procesos.ramajudicial.gov.co/",
                    observaciones: "Reclamación de prestaciones sociales.",
                    demandantes: [{ tipo: "natural", primerNombre: "Óscar", segundoNombre: "Iván", primerApellido: "Salazar", segundoApellido: "Mejía", nombre: "", correo: "osalazar@correo.com" }],
                    demandados: [{ tipo: "juridica", primerNombre: "", segundoNombre: "", primerApellido: "", segundoApellido: "", nombre: "CAFÉ DE LOS ANDES S.A.S.", correo: "juridica@cafeandes.co" }],
                    estado: "pendiente",
                    despachoAsignado: null
                },
                {
                    id: 12,
                    codigo: "17001410500220250018700",
                    estadoProceso: "Definir 2",
                    fechaActuacion: "2026-06-03",
                    link: "",
                    observaciones: "",
                    demandantes: [{ tipo: "natural", primerNombre: "Luz", segundoNombre: "Dary", primerApellido: "Castaño", segundoApellido: "Ríos", nombre: "", correo: "lcastano@correo.com" }],
                    demandados: [{ tipo: "juridica", primerNombre: "", segundoNombre: "", primerApellido: "", segundoApellido: "", nombre: "TRANSPORTES DEL CAFÉ S.A.", correo: "legal@transcafe.com" }],
                    estado: "pendiente",
                    despachoAsignado: null
                },
                {
                    id: 13,
                    codigo: "17001410500220240044500",
                    estadoProceso: "Definir 3",
                    fechaActuacion: "2026-02-18",
                    link: "",
                    observaciones: "Audiencia aplazada dos veces.",
                    demandantes: [{ tipo: "natural", primerNombre: "Jhon", segundoNombre: "Fredy", primerApellido: "Arias", segundoApellido: "", nombre: "", correo: "jarias@correo.com" }],
                    demandados: [{ tipo: "juridica", primerNombre: "", segundoNombre: "", primerApellido: "", segundoApellido: "", nombre: "COLPENSIONES", correo: "notificacionesjudiciales@colpensiones.gov.co" }],
                    estado: "pendiente",
                    despachoAsignado: null
                },
                {
                    id: 14,
                    codigo: "17001410500220240039100",
                    estadoProceso: "Definir 2",
                    fechaActuacion: "2026-08-30",
                    link: "",
                    observaciones: "",
                    demandantes: [{ tipo: "natural", primerNombre: "Beatriz", segundoNombre: "", primerApellido: "Londoño", segundoApellido: "Gil", nombre: "", correo: "blondono@correo.com" }],
                    demandados: [{ tipo: "juridica", primerNombre: "", segundoNombre: "", primerApellido: "", segundoApellido: "", nombre: "CLÍNICA SANTA SOFÍA S.A.", correo: "juridica@clinicasantasofia.co" }],
                    estado: "Asignado",
                    despachoAsignado: "Juzgado 01 de Descongestión Laboral de Manizales",
                    fechaAsignacion: "2026-09-26"
                }
            ]
        },
        {
            id: 7,
            nombreDespacho: "JUZGADO 003 LABORAL DEL CIRCUITO DE MANIZALES",
            codigoDespacho: "170013105003",
            tipo: "JUZGADO DE CIRCUITO",
            municipio: "MANIZALES",
            especialidad: "LABORAL",
            fechaSolicitud: "2026-09-15",
            procesos: [
                {
                    id: 21,
                    codigo: "17001310500320230077700",
                    estadoProceso: "Definir 3",
                    fechaActuacion: "2026-01-20",
                    link: "",
                    observaciones: "Proceso con más de dos años de radicado.",
                    demandantes: [{ tipo: "natural", primerNombre: "Rubén", segundoNombre: "Darío", primerApellido: "Cardona", segundoApellido: "Gil", nombre: "", correo: "rcardona@correo.com" }],
                    demandados: [{ tipo: "juridica", primerNombre: "", segundoNombre: "", primerApellido: "", segundoApellido: "", nombre: "COLPENSIONES", correo: "notificacionesjudiciales@colpensiones.gov.co" }],
                    estado: "pendiente",
                    despachoAsignado: null
                },
                {
                    id: 22,
                    codigo: "17001310500320240010500",
                    estadoProceso: "Definir 1",
                    fechaActuacion: "2026-05-14",
                    link: "",
                    observaciones: "",
                    demandantes: [{ tipo: "natural", primerNombre: "Gustavo", segundoNombre: "", primerApellido: "Patiño", segundoApellido: "Duque", nombre: "", correo: "gpatino@correo.com" }],
                    demandados: [{ tipo: "juridica", primerNombre: "", segundoNombre: "", primerApellido: "", segundoApellido: "", nombre: "CENTRAL HIDROELÉCTRICA DE CALDAS S.A. E.S.P.", correo: "juridica@chec.com.co" }],
                    estado: "pendiente",
                    despachoAsignado: null
                },
                {
                    id: 23,
                    codigo: "17001310500320240033800",
                    estadoProceso: "Definir 2",
                    fechaActuacion: "2026-09-02",
                    link: "https://procesos.ramajudicial.gov.co/",
                    observaciones: "",
                    demandantes: [{ tipo: "natural", primerNombre: "Natalia", segundoNombre: "", primerApellido: "Ospina", segundoApellido: "Marín", nombre: "", correo: "nospina@correo.com" }],
                    demandados: [{ tipo: "juridica", primerNombre: "", segundoNombre: "", primerApellido: "", segundoApellido: "", nombre: "UNIVERSIDAD DE CALDAS", correo: "juridica@ucaldas.edu.co" }],
                    estado: "pendiente",
                    despachoAsignado: null
                }
            ]
        },
        {
            id: 8,
            nombreDespacho: "JUZGADO 001 CIVIL MUNICIPAL DE LA DORADA",
            codigoDespacho: "173804003001",
            tipo: "JUZGADO MUNICIPAL",
            municipio: "LA DORADA",
            especialidad: "CIVIL",
            fechaSolicitud: "2026-09-26",
            procesos: [
                {
                    id: 31,
                    codigo: "17380400300120240021200",
                    estadoProceso: "Definir 1",
                    fechaActuacion: "2026-08-05",
                    link: "",
                    observaciones: "Ejecutivo singular de menor cuantía.",
                    demandantes: [{ tipo: "juridica", primerNombre: "", segundoNombre: "", primerApellido: "", segundoApellido: "", nombre: "BANCO AGRARIO DE COLOMBIA S.A.", correo: "judicial@bancoagrario.gov.co" }],
                    demandados: [{ tipo: "natural", primerNombre: "Wilson", segundoNombre: "", primerApellido: "Quintero", segundoApellido: "Rojas", nombre: "", correo: "wquintero@correo.com" }],
                    estado: "pendiente",
                    despachoAsignado: null
                },
                {
                    id: 32,
                    codigo: "17380400300120250003400",
                    estadoProceso: "Definir 2",
                    fechaActuacion: "2026-06-19",
                    link: "",
                    observaciones: "",
                    demandantes: [{ tipo: "natural", primerNombre: "Carmen", segundoNombre: "Rosa", primerApellido: "Valencia", segundoApellido: "", nombre: "", correo: "cvalencia@correo.com" }],
                    demandados: [{ tipo: "natural", primerNombre: "Hernando", segundoNombre: "", primerApellido: "Morales", segundoApellido: "Parra", nombre: "", correo: "hmorales@correo.com" }],
                    estado: "pendiente",
                    despachoAsignado: null
                },
                {
                    id: 33,
                    codigo: "17380400300120230058900",
                    estadoProceso: "Definir 3",
                    fechaActuacion: "2026-03-11",
                    link: "",
                    observaciones: "Restitución de inmueble arrendado.",
                    demandantes: [{ tipo: "juridica", primerNombre: "", segundoNombre: "", primerApellido: "", segundoApellido: "", nombre: "INMOBILIARIA DEL MAGDALENA LTDA.", correo: "legal@inmomagdalena.co" }],
                    demandados: [{ tipo: "natural", primerNombre: "Edwin", segundoNombre: "", primerApellido: "Cárdenas", segundoApellido: "Villa", nombre: "", correo: "ecardenas@correo.com" }],
                    estado: "pendiente",
                    despachoAsignado: null
                }
            ]
        },
        {
            id: 9,
            nombreDespacho: "JUZGADO 002 DE FAMILIA DE MANIZALES",
            codigoDespacho: "170013110002",
            tipo: "JUZGADO DE CIRCUITO",
            municipio: "MANIZALES",
            especialidad: "FAMILIA",
            fechaSolicitud: "2026-09-10",
            procesos: [
                {
                    id: 41,
                    codigo: "17001311000220240015600",
                    estadoProceso: "Definir 2",
                    fechaActuacion: "2026-07-08",
                    link: "",
                    observaciones: "Fijación de cuota alimentaria.",
                    demandantes: [{ tipo: "natural", primerNombre: "Diana", segundoNombre: "Carolina", primerApellido: "Zuluaga", segundoApellido: "", nombre: "", correo: "dzuluaga@correo.com" }],
                    demandados: [{ tipo: "natural", primerNombre: "Mauricio", segundoNombre: "", primerApellido: "Hoyos", segundoApellido: "Gallego", nombre: "", correo: "mhoyos@correo.com" }],
                    estado: "Asignado",
                    despachoAsignado: "Juzgado 01 de Descongestión de Familia de Manizales",
                    fechaAsignacion: "2026-09-14"
                },
                {
                    id: 42,
                    codigo: "17001311000220240029800",
                    estadoProceso: "Definir 1",
                    fechaActuacion: "2026-08-21",
                    link: "",
                    observaciones: "",
                    demandantes: [{ tipo: "natural", primerNombre: "Adriana", segundoNombre: "", primerApellido: "Ríos", segundoApellido: "Aristizábal", nombre: "", correo: "arios@correo.com" }],
                    demandados: [{ tipo: "natural", primerNombre: "Felipe", segundoNombre: "", primerApellido: "Echeverri", segundoApellido: "", nombre: "", correo: "fecheverri@correo.com" }],
                    estado: "Asignado",
                    despachoAsignado: "Juzgado 01 de Descongestión de Familia de Manizales",
                    fechaAsignacion: "2026-09-14"
                }
            ]
        },
        {
            id: 10,
            nombreDespacho: "JUZGADO 001 CIVIL DEL CIRCUITO DE CHINCHINÁ",
            codigoDespacho: "171743103001",
            tipo: "JUZGADO DE CIRCUITO",
            municipio: "CHINCHINÁ",
            especialidad: "CIVIL",
            fechaSolicitud: "2026-09-28",
            procesos: [
                {
                    id: 51,
                    codigo: "17174310300120240009100",
                    estadoProceso: "Definir 3",
                    fechaActuacion: "2026-04-27",
                    link: "",
                    observaciones: "Responsabilidad civil extracontractual.",
                    demandantes: [{ tipo: "natural", primerNombre: "Álvaro", segundoNombre: "", primerApellido: "Betancur", segundoApellido: "Loaiza", nombre: "", correo: "abetancur@correo.com" }],
                    demandados: [{ tipo: "juridica", primerNombre: "", segundoNombre: "", primerApellido: "", segundoApellido: "", nombre: "SEGUROS DEL ESTADO S.A.", correo: "juridica@segurosdelestado.com" }],
                    estado: "pendiente",
                    despachoAsignado: null
                },
                {
                    id: 52,
                    codigo: "17174310300120250002800",
                    estadoProceso: "Definir 1",
                    fechaActuacion: "2026-09-12",
                    link: "",
                    observaciones: "",
                    demandantes: [{ tipo: "juridica", primerNombre: "", segundoNombre: "", primerApellido: "", segundoApellido: "", nombre: "COOPERATIVA DE CAFICULTORES DE CALDAS", correo: "juridica@coopcaldas.co" }],
                    demandados: [{ tipo: "natural", primerNombre: "Rodrigo", segundoNombre: "", primerApellido: "Giraldo", segundoApellido: "Soto", nombre: "", correo: "rgiraldo@correo.com" }],
                    estado: "pendiente",
                    despachoAsignado: null
                }
            ]
        }
    ],

    // =================================================================
    // DESPACHOS DE DESCONGESTIÓN (cargaActual = procesos en su inventario)
    // =================================================================
    despachosDescongestion: [
        {
            id: 1,
            nombre: "Juzgado 01 de Descongestión Laboral de Manizales",
            especialidad: "LABORAL",
            cargaActual: 3,
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
                },
                {
                    id: 14,
                    codigo: "17001410500220240039100",
                    estadoProceso: "Definir 2",
                    fechaActuacion: "2026-08-30",
                    link: "",
                    observaciones: "",
                    demandantes: [{ tipo: "natural", nombre: "Beatriz Londoño Gil" }],
                    demandados: [{ tipo: "juridica", nombre: "CLÍNICA SANTA SOFÍA S.A." }],
                    fechaAsignacion: "2026-09-26",
                    despachoOrigen: "JUZGADO 002 LABORAL MUNICIPAL DE MANIZALES"
                }
            ]
        },
        {
            id: 2,
            nombre: "Juzgado 02 de Descongestión Laboral de Manizales",
            especialidad: "LABORAL",
            cargaActual: 1,
            correo: "j02labdescongestsion@cendoj.ramajudicial.gov.co",
            procesosAsignadosActuales: [
                {
                    id: 903,
                    codigo: "17001410500120230066100",
                    estadoProceso: "Audiencia inicial",
                    fechaActuacion: "2026-09-05",
                    link: "",
                    observaciones: "",
                    demandantes: [{ nombre: "Marleny Grisales" }],
                    demandados: [{ nombre: "Cooperativa de Transportadores de Caldas" }],
                    fechaAsignacion: "2026-08-20"
                }
            ]
        },
        {
            id: 3,
            nombre: "Juzgado 01 de Descongestión Civil de Manizales",
            especialidad: "CIVIL",
            cargaActual: 4,
            correo: "j01civdescongestion@cendoj.ramajudicial.gov.co",
            procesosAsignadosActuales: [
                { id: 911, codigo: "17001400300420220034500", estadoProceso: "Etapa probatoria", fechaActuacion: "2026-07-15", link: "", observaciones: "", demandantes: [{ nombre: "Banco de Bogotá S.A." }], demandados: [{ nombre: "Jorge Iván Sánchez" }], fechaAsignacion: "2026-07-01" },
                { id: 912, codigo: "17001400300420230011800", estadoProceso: "Al despacho para fallo", fechaActuacion: "2026-08-22", link: "", observaciones: "", demandantes: [{ nombre: "Liliana Vargas" }], demandados: [{ nombre: "Constructora Los Nevados S.A.S." }], fechaAsignacion: "2026-07-01" },
                { id: 913, codigo: "17001400300520230027700", estadoProceso: "Notificación", fechaActuacion: "2026-09-01", link: "", observaciones: "", demandantes: [{ nombre: "Davivienda S.A." }], demandados: [{ nombre: "Paola Rendón" }], fechaAsignacion: "2026-08-12" },
                { id: 914, codigo: "17001400300520240005300", estadoProceso: "Admisión de la demanda", fechaActuacion: "2026-09-18", link: "", observaciones: "", demandantes: [{ nombre: "Hernán Duque" }], demandados: [{ nombre: "Almacenes La 14 S.A." }], fechaAsignacion: "2026-09-10" }
            ]
        },
        {
            id: 4,
            nombre: "Juzgado 02 de Descongestión Civil de Manizales",
            especialidad: "CIVIL",
            cargaActual: 1,
            correo: "j02civdescongestion@cendoj.ramajudicial.gov.co",
            procesosAsignadosActuales: [
                { id: 921, codigo: "17001310300220230040200", estadoProceso: "Contestación de la demanda", fechaActuacion: "2026-09-09", link: "", observaciones: "", demandantes: [{ nombre: "Claudia Montoya" }], demandados: [{ nombre: "Seguros Bolívar S.A." }], fechaAsignacion: "2026-08-28" }
            ]
        },
        {
            id: 5,
            nombre: "Juzgado 01 de Descongestión de Familia de Manizales",
            especialidad: "FAMILIA",
            cargaActual: 3,
            correo: "j01famdescongestion@cendoj.ramajudicial.gov.co",
            procesosAsignadosActuales: [
                { id: 931, codigo: "17001311000120230052100", estadoProceso: "Audiencia inicial", fechaActuacion: "2026-08-25", link: "", observaciones: "", demandantes: [{ nombre: "Sonia Arango" }], demandados: [{ nombre: "Julián Mejía" }], fechaAsignacion: "2026-07-30" },
                { id: 41, codigo: "17001311000220240015600", estadoProceso: "Definir 2", fechaActuacion: "2026-07-08", link: "", observaciones: "Fijación de cuota alimentaria.", demandantes: [{ tipo: "natural", nombre: "Diana Carolina Zuluaga" }], demandados: [{ tipo: "natural", nombre: "Mauricio Hoyos Gallego" }], fechaAsignacion: "2026-09-14", despachoOrigen: "JUZGADO 002 DE FAMILIA DE MANIZALES" },
                { id: 42, codigo: "17001311000220240029800", estadoProceso: "Definir 1", fechaActuacion: "2026-08-21", link: "", observaciones: "", demandantes: [{ tipo: "natural", nombre: "Adriana Ríos Aristizábal" }], demandados: [{ tipo: "natural", nombre: "Felipe Echeverri" }], fechaAsignacion: "2026-09-14", despachoOrigen: "JUZGADO 002 DE FAMILIA DE MANIZALES" }
            ]
        }
    ]
};