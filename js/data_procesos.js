// =====================================================================
// RUNPD - Datos del prototipo: registro de procesos del despacho permanente
// El despacho permanente registra los procesos que trasladará DENTRO de las
// medidas de descongestión en las que participa como origen (ver data_medidas.js).
// =====================================================================
const dbProcesos = {
    // Catálogos
    opcionesSelects: {
        estadoProceso: [
            { value: "Admitida o libra mandamiento", label: "Admitida o libra mandamiento" },
            { value: "Integrada la litis", label: "Integrada la litis" },
            { value: "Para señalar fecha de audiencia", label: "Para señalar fecha de audiencia" },
            { value: "Con fecha para audiencia inicial, de instrucción y juzgamiento", label: "Con fecha para audiencia inicial, de instrucción y juzgamiento" },
            { value: "Decreta pruebas y señala fecha de audiencia", label: "Decreta pruebas y señala fecha de audiencia" },
            { value: "En estado de fallo", label: "En estado de fallo" },
            { value: "Para trámite de apelación", label: "Para trámite de apelación" }
        ],
        tipoPersona: [
            { value: "natural", label: "Persona natural" },
            { value: "juridica", label: "Persona jurídica" }
        ]
    },

    // Estado del proceso dentro del flujo de descongestión (clases de main.css)
    estadosEnvio: {
        pendiente:   { label: "Pendiente de envío", clase: "badge badge-muted" },
        enviado:     { label: "Enviado al Consejo", clase: "badge badge-success" },
        distribuido: { label: "Distribuido",        clase: "badge-status active" }
    },

    // Despacho PERMANENTE que registra (es origen en el plan de distribución de las medidas)
    despachoActual: {
        id: 101,
        consejoseccional: "CALDAS",
        jurisdiccion: "ORDINARIA",
        deptomunicipio: "MANIZALES",
        distrito: "MANIZALES",
        circuito: "MANIZALES",
        tipodespacho: "JUZGADO MUNICIPAL",
        especialidad: "LABORAL",
        tipo: "Permanente",
        codigoDespacho: "170014105002",
        nombreDespacho: "JUZGADO 002 LABORAL MUNICIPAL DE MANIZALES",
        estado: "Activo",
        adminPrimerNombre: "Luis",
        adminSegundoNombre: "Fernando",
        adminPrimerApellido: "Giraldo",
        adminSegundoApellido: "Restrepo",
        adminCorreo: "j02lpmmanizales@cendoj.ramajudicial.gov.co"
    },

    // Medidas de descongestión en las que este despacho participa como ORIGEN.
    // cupo = procesos que el plan de distribución autoriza trasladar desde este despacho.
    medidas: [
        {
            id: 1,
            acuerdo: { numero: "PCSJA26-11234", anio: 2026 },
            resolucion: { numero: "CSJCAR26-045", anio: 2026 },
            consejoseccional: "CALDAS",
            fechaInicio: "2026-01-15",
            fechaFin: "2026-12-31",
            descripcion: "Medida de descongestión para la especialidad laboral en Manizales.",
            destinos: [
                { nombre: "JUZGADO 801 LABORAL MUNICIPAL TRANSITORIO DE MANIZALES", procesos: 40 }
            ]
        },
        {
            id: 5,
            acuerdo: { numero: "PCSJA26-11870", anio: 2026 },
            resolucion: null,
            consejoseccional: "CALDAS",
            fechaInicio: "2026-07-01",
            fechaFin: "2027-03-31",
            descripcion: "Ampliación de la medida laboral para procesos en estado de fallo.",
            destinos: [
                { nombre: "JUZGADO 801 LABORAL MUNICIPAL TRANSITORIO DE MANIZALES", procesos: 15 }
            ]
        }
    ],

    // Procesos registrados (cada uno pertenece a una medida)
    procesos: [
        {
            id: 1,
            medidaId: 1,
            codigo: "05001400300320240012300",
            estadoProceso: "Decreta pruebas y señala fecha de audiencia",
            fechaActuacion: "2026-08-14",
            link: "https://procesos.ramajudicial.gov.co/",
            observaciones: "Pruebas decretadas. Pendiente dictamen pericial para la audiencia.",
            demandantes: [
                { tipo: "natural", primerNombre: "Juan", segundoNombre: "Pablo", primerApellido: "Restrepo", segundoApellido: "Ochoa", nombre: "", correo: "jprestrepo@correo.com" }
            ],
            demandados: [
                { tipo: "juridica", primerNombre: "", segundoNombre: "", primerApellido: "", segundoApellido: "", nombre: "INVERSIONES EL POBLADO S.A.S.", correo: "notificaciones@invpoblado.com" }
            ],
            estado: "pendiente",
            fechaEnvio: ""
        },
        {
            id: 2,
            medidaId: 1,
            codigo: "05001400300320250007800",
            estadoProceso: "Admitida o libra mandamiento",
            fechaActuacion: "2026-09-10",
            link: "",
            observaciones: "Demanda admitida. En trámite de notificación al demandado.",
            demandantes: [
                { tipo: "natural", primerNombre: "Sandra", segundoNombre: "", primerApellido: "Múnera", segundoApellido: "Arango", nombre: "", correo: "smunera@correo.com" }
            ],
            demandados: [
                { tipo: "juridica", primerNombre: "", segundoNombre: "", primerApellido: "", segundoApellido: "", nombre: "CONSTRUCTORA ANDINA LTDA.", correo: "juridica@candina.co" }
            ],
            estado: "pendiente",
            fechaEnvio: ""
        },
        {
            id: 3,
            medidaId: 5,
            codigo: "05001400300320230045600",
            estadoProceso: "En estado de fallo",
            fechaActuacion: "2026-03-02",
            link: "",
            observaciones: "Alegatos surtidos. Pendiente proferir sentencia.",
            demandantes: [
                { tipo: "juridica", primerNombre: "", segundoNombre: "", primerApellido: "", segundoApellido: "", nombre: "BANCOLOMBIA S.A.", correo: "judicial@bancolombia.com.co" }
            ],
            demandados: [
                { tipo: "natural", primerNombre: "Martha", segundoNombre: "Lucía", primerApellido: "Henao", segundoApellido: "Vélez", nombre: "", correo: "mhenao@correo.com" },
                { tipo: "natural", primerNombre: "Andrés", segundoNombre: "", primerApellido: "Henao", segundoApellido: "Vélez", nombre: "", correo: "ahenao@correo.com" }
            ],
            estado: "enviado",
            fechaEnvio: "2026-09-20"
        }
    ]
};