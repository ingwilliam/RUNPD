// =====================================================================
// RUNPD - Consejo Seccional: aprobación de la distribución por medida
// La UDAE definió en cada medida el origen, el destino y la cantidad de procesos
// (rutas). El despacho permanente registró y envió los procesos. El Consejo solo
// revisa cada envío y APRUEBA la distribución; con la aprobación se notifica al
// despacho de descongestión de destino.
// rutas[].aprobados = procesos ya aprobados en esa ruta
// =====================================================================
const dbTraslados = {
    consejoSeccional: "CALDAS",

    // Motivos frecuentes para devolver un envío al despacho permanente
    motivosDevolucion: [
        "Los procesos no corresponden a la especialidad de la medida.",
        "La información de los procesos está incompleta o tiene errores.",
        "Algunos procesos ya terminaron o no requieren apoyo de descongestión.",
        "El envío supera la cantidad de procesos autorizada en la medida."
    ],
    medidas: [
        {
            id: 1,
            acuerdo: {
                numero: "PCSJA26-11234",
                anio: 2026
            },
            fechaInicio: "2026-01-15",
            fechaFin: "2026-12-31",
            rutas: [
                {
                    origen: "170014105002",
                    destinoId: 5,
                    autorizados: 40,
                    aprobados: 25
                },
                {
                    origen: "170013105003",
                    destinoId: 5,
                    autorizados: 30,
                    aprobados: 27
                }
            ]
        },
        {
            id: 5,
            acuerdo: {
                numero: "PCSJA26-11870",
                anio: 2026
            },
            fechaInicio: "2026-07-01",
            fechaFin: "2027-03-31",
            rutas: [
                {
                    origen: "170014105002",
                    destinoId: 5,
                    autorizados: 15,
                    aprobados: 0
                }
            ]
        },
        {
            id: 6,
            acuerdo: {
                numero: "PCSJA26-11502",
                anio: 2026
            },
            fechaInicio: "2026-03-01",
            fechaFin: "2026-12-31",
            rutas: [
                {
                    origen: "173804003001",
                    destinoId: 111,
                    autorizados: 10,
                    aprobados: 4
                },
                {
                    origen: "171743103001",
                    destinoId: 112,
                    autorizados: 6,
                    aprobados: 0
                }
            ]
        }
    ],
    envios: [
        {
            id: 1,
            medidaId: 5,
            nombreDespacho: "JUZGADO 002 LABORAL MUNICIPAL DE MANIZALES",
            codigoDespacho: "170014105002",
            correoDespacho: "j02lpmmanizales@cendoj.ramajudicial.gov.co",
            municipio: "MANIZALES",
            especialidad: "LABORAL",
            fechaEnvio: "2026-09-20",
            nota: "Proceso priorizado por antigüedad.",
            estado: "pendiente",
            procesos: [
                {
                    id: 3,
                    codigo: "05001400300320230045600",
                    estadoProceso: "En estado de fallo",
                    fechaActuacion: "2026-03-02",
                    link: "",
                    observaciones: "Alegatos surtidos. Pendiente proferir sentencia.",
                    demandantes: [
                        {
                            tipo: "juridica",
                            nombre: "BANCOLOMBIA S.A.",
                            correo: "judicial@bancolombia.com.co"
                        }
                    ],
                    demandados: [
                        {
                            tipo: "natural",
                            primerNombre: "Martha",
                            segundoNombre: "Lucía",
                            primerApellido: "Henao",
                            segundoApellido: "Vélez",
                            nombre: "",
                            correo: "mhenao@correo.com"
                        },
                        {
                            tipo: "natural",
                            primerNombre: "Andrés",
                            segundoNombre: "",
                            primerApellido: "Henao",
                            segundoApellido: "Vélez",
                            nombre: "",
                            correo: "ahenao@correo.com"
                        }
                    ]
                }
            ]
        },
        {
            id: 2,
            medidaId: 1,
            nombreDespacho: "JUZGADO 002 LABORAL MUNICIPAL DE MANIZALES",
            codigoDespacho: "170014105002",
            correoDespacho: "j02lpmmanizales@cendoj.ramajudicial.gov.co",
            municipio: "MANIZALES",
            especialidad: "LABORAL",
            fechaEnvio: "2026-09-24",
            nota: "",
            estado: "pendiente",
            procesos: [
                {
                    id: 11,
                    codigo: "17001410500220250012300",
                    estadoProceso: "Admitida o libra mandamiento",
                    fechaActuacion: "2026-07-22",
                    link: "https://procesos.ramajudicial.gov.co/",
                    observaciones: "Reclamación de prestaciones sociales.",
                    demandantes: [
                        {
                            tipo: "natural",
                            primerNombre: "Óscar",
                            segundoNombre: "Iván",
                            primerApellido: "Salazar",
                            segundoApellido: "Mejía",
                            nombre: "",
                            correo: "osalazar@correo.com"
                        }
                    ],
                    demandados: [
                        {
                            tipo: "juridica",
                            nombre: "CAFÉ DE LOS ANDES S.A.S.",
                            correo: "juridica@cafeandes.co"
                        }
                    ]
                },
                {
                    id: 12,
                    codigo: "17001410500220250018700",
                    estadoProceso: "Integrada la litis",
                    fechaActuacion: "2026-06-03",
                    link: "",
                    observaciones: "",
                    demandantes: [
                        {
                            tipo: "natural",
                            primerNombre: "Luz",
                            segundoNombre: "Dary",
                            primerApellido: "Castaño",
                            segundoApellido: "Ríos",
                            nombre: "",
                            correo: "lcastano@correo.com"
                        }
                    ],
                    demandados: [
                        {
                            tipo: "juridica",
                            nombre: "TRANSPORTES DEL CAFÉ S.A.",
                            correo: "legal@transcafe.com"
                        }
                    ]
                },
                {
                    id: 13,
                    codigo: "17001410500220240044500",
                    estadoProceso: "Para señalar fecha de audiencia",
                    fechaActuacion: "2026-02-18",
                    link: "",
                    observaciones: "Audiencia aplazada dos veces.",
                    demandantes: [
                        {
                            tipo: "natural",
                            primerNombre: "Jhon",
                            segundoNombre: "Fredy",
                            primerApellido: "Arias",
                            segundoApellido: "",
                            nombre: "",
                            correo: "jarias@correo.com"
                        }
                    ],
                    demandados: [
                        {
                            tipo: "juridica",
                            nombre: "COLPENSIONES",
                            correo: "notificacionesjudiciales@colpensiones.gov.co"
                        }
                    ]
                }
            ]
        },
        {
            id: 3,
            medidaId: 1,
            nombreDespacho: "JUZGADO 003 LABORAL DEL CIRCUITO DE MANIZALES",
            codigoDespacho: "170013105003",
            correoDespacho: "j03lctomanizales@cendoj.ramajudicial.gov.co",
            municipio: "MANIZALES",
            especialidad: "LABORAL",
            fechaEnvio: "2026-09-15",
            nota: "",
            estado: "pendiente",
            procesos: [
                {
                    id: 21,
                    codigo: "17001310500320230077700",
                    estadoProceso: "En estado de fallo",
                    fechaActuacion: "2026-01-20",
                    link: "",
                    observaciones: "Proceso con más de dos años de radicado.",
                    demandantes: [
                        {
                            tipo: "natural",
                            primerNombre: "Rubén",
                            segundoNombre: "Darío",
                            primerApellido: "Cardona",
                            segundoApellido: "Gil",
                            nombre: "",
                            correo: "rcardona@correo.com"
                        }
                    ],
                    demandados: [
                        {
                            tipo: "juridica",
                            nombre: "COLPENSIONES",
                            correo: "notificacionesjudiciales@colpensiones.gov.co"
                        }
                    ]
                },
                {
                    id: 22,
                    codigo: "17001310500320240010500",
                    estadoProceso: "Admitida o libra mandamiento",
                    fechaActuacion: "2026-05-14",
                    link: "",
                    observaciones: "",
                    demandantes: [
                        {
                            tipo: "natural",
                            primerNombre: "Gustavo",
                            segundoNombre: "",
                            primerApellido: "Patiño",
                            segundoApellido: "Duque",
                            nombre: "",
                            correo: "gpatino@correo.com"
                        }
                    ],
                    demandados: [
                        {
                            tipo: "juridica",
                            nombre: "CENTRAL HIDROELÉCTRICA DE CALDAS S.A. E.S.P.",
                            correo: "juridica@chec.com.co"
                        }
                    ]
                },
                {
                    id: 23,
                    codigo: "17001310500320240033800",
                    estadoProceso: "Decreta pruebas y señala fecha de audiencia",
                    fechaActuacion: "2026-09-02",
                    link: "https://procesos.ramajudicial.gov.co/",
                    observaciones: "",
                    demandantes: [
                        {
                            tipo: "natural",
                            primerNombre: "Natalia",
                            segundoNombre: "",
                            primerApellido: "Ospina",
                            segundoApellido: "Marín",
                            nombre: "",
                            correo: "nospina@correo.com"
                        }
                    ],
                    demandados: [
                        {
                            tipo: "juridica",
                            nombre: "UNIVERSIDAD DE CALDAS",
                            correo: "juridica@ucaldas.edu.co"
                        }
                    ]
                }
            ]
        },
        {
            id: 4,
            medidaId: 6,
            nombreDespacho: "JUZGADO 001 CIVIL MUNICIPAL DE LA DORADA",
            codigoDespacho: "173804003001",
            correoDespacho: "j01cmpladorada@cendoj.ramajudicial.gov.co",
            municipio: "LA DORADA",
            especialidad: "CIVIL",
            fechaEnvio: "2026-09-26",
            nota: "",
            estado: "pendiente",
            procesos: [
                {
                    id: 31,
                    codigo: "17380400300120240021200",
                    estadoProceso: "Admitida o libra mandamiento",
                    fechaActuacion: "2026-08-05",
                    link: "",
                    observaciones: "Ejecutivo singular de menor cuantía.",
                    demandantes: [
                        {
                            tipo: "juridica",
                            nombre: "BANCO AGRARIO DE COLOMBIA S.A.",
                            correo: "judicial@bancoagrario.gov.co"
                        }
                    ],
                    demandados: [
                        {
                            tipo: "natural",
                            primerNombre: "Wilson",
                            segundoNombre: "",
                            primerApellido: "Quintero",
                            segundoApellido: "Rojas",
                            nombre: "",
                            correo: "wquintero@correo.com"
                        }
                    ]
                },
                {
                    id: 32,
                    codigo: "17380400300120250003400",
                    estadoProceso: "Integrada la litis",
                    fechaActuacion: "2026-06-19",
                    link: "",
                    observaciones: "",
                    demandantes: [
                        {
                            tipo: "natural",
                            primerNombre: "Carmen",
                            segundoNombre: "Rosa",
                            primerApellido: "Valencia",
                            segundoApellido: "",
                            nombre: "",
                            correo: "cvalencia@correo.com"
                        }
                    ],
                    demandados: [
                        {
                            tipo: "natural",
                            primerNombre: "Hernando",
                            segundoNombre: "",
                            primerApellido: "Morales",
                            segundoApellido: "Parra",
                            nombre: "",
                            correo: "hmorales@correo.com"
                        }
                    ]
                },
                {
                    id: 33,
                    codigo: "17380400300120230058900",
                    estadoProceso: "En estado de fallo",
                    fechaActuacion: "2026-03-11",
                    link: "",
                    observaciones: "Restitución de inmueble arrendado.",
                    demandantes: [
                        {
                            tipo: "juridica",
                            nombre: "INMOBILIARIA DEL MAGDALENA LTDA.",
                            correo: "legal@inmomagdalena.co"
                        }
                    ],
                    demandados: [
                        {
                            tipo: "natural",
                            primerNombre: "Edwin",
                            segundoNombre: "",
                            primerApellido: "Cárdenas",
                            segundoApellido: "Villa",
                            nombre: "",
                            correo: "ecardenas@correo.com"
                        }
                    ]
                }
            ]
        },
        {
            id: 5,
            medidaId: 6,
            nombreDespacho: "JUZGADO 001 CIVIL DEL CIRCUITO DE CHINCHINÁ",
            codigoDespacho: "171743103001",
            correoDespacho: "j01cctochinchina@cendoj.ramajudicial.gov.co",
            municipio: "CHINCHINÁ",
            especialidad: "CIVIL",
            fechaEnvio: "2026-09-28",
            nota: "",
            estado: "pendiente",
            procesos: [
                {
                    id: 51,
                    codigo: "17174310300120240009100",
                    estadoProceso: "Con fecha para audiencia inicial, de instrucción y juzgamiento",
                    fechaActuacion: "2026-04-27",
                    link: "",
                    observaciones: "Responsabilidad civil extracontractual.",
                    demandantes: [
                        {
                            tipo: "natural",
                            primerNombre: "Álvaro",
                            segundoNombre: "",
                            primerApellido: "Betancur",
                            segundoApellido: "Loaiza",
                            nombre: "",
                            correo: "abetancur@correo.com"
                        }
                    ],
                    demandados: [
                        {
                            tipo: "juridica",
                            nombre: "SEGUROS DEL ESTADO S.A.",
                            correo: "juridica@segurosdelestado.com"
                        }
                    ]
                },
                {
                    id: 52,
                    codigo: "17174310300120250002800",
                    estadoProceso: "Admitida o libra mandamiento",
                    fechaActuacion: "2026-09-12",
                    link: "",
                    observaciones: "",
                    demandantes: [
                        {
                            tipo: "juridica",
                            nombre: "COOPERATIVA DE CAFICULTORES DE CALDAS",
                            correo: "juridica@coopcaldas.co"
                        }
                    ],
                    demandados: [
                        {
                            tipo: "natural",
                            primerNombre: "Rodrigo",
                            segundoNombre: "",
                            primerApellido: "Giraldo",
                            segundoApellido: "Soto",
                            nombre: "",
                            correo: "rgiraldo@correo.com"
                        }
                    ]
                }
            ]
        },
        {
            id: 6,
            medidaId: 1,
            nombreDespacho: "JUZGADO 002 LABORAL MUNICIPAL DE MANIZALES",
            codigoDespacho: "170014105002",
            correoDespacho: "j02lpmmanizales@cendoj.ramajudicial.gov.co",
            municipio: "MANIZALES",
            especialidad: "LABORAL",
            fechaEnvio: "2026-09-22",
            nota: "",
            estado: "aprobada",
            fechaAprobacion: "2026-09-26",
            observacionConsejo: "",
            procesos: [
                {
                    id: 14,
                    codigo: "17001410500220240039100",
                    estadoProceso: "Integrada la litis",
                    fechaActuacion: "2026-08-30",
                    link: "",
                    observaciones: "",
                    demandantes: [
                        {
                            tipo: "natural",
                            primerNombre: "Beatriz",
                            segundoNombre: "",
                            primerApellido: "Londoño",
                            segundoApellido: "Gil",
                            nombre: "",
                            correo: "blondono@correo.com"
                        }
                    ],
                    demandados: [
                        {
                            tipo: "juridica",
                            nombre: "CLÍNICA SANTA SOFÍA S.A.",
                            correo: "juridica@clinicasantasofia.co"
                        }
                    ]
                }
            ]
        }
    ],
    despachosDescongestion: [
        {
            id: 5,
            nombre: "JUZGADO 801 LABORAL MUNICIPAL TRANSITORIO DE MANIZALES",
            correo: "lgiraldo@cendoj.ramajudicial.gov.co"
        },
        {
            id: 111,
            nombre: "JUZGADO 01 DE DESCONGESTIÓN CIVIL DE MANIZALES",
            correo: "j01civdescongestion@cendoj.ramajudicial.gov.co"
        },
        {
            id: 112,
            nombre: "JUZGADO 02 DE DESCONGESTIÓN CIVIL DE MANIZALES",
            correo: "j02civdescongestion@cendoj.ramajudicial.gov.co"
        }
    ]
};