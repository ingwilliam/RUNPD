// =====================================================================
// RUNPD - Datos del prototipo: registro de procesos del despacho permanente
// =====================================================================
const dbProcesos = {
    // Catálogos
    opcionesSelects: {
        estadoProceso: [
            { value: "Definir 1", label: "Definir 1" },
            { value: "Definir 2", label: "Definir 2" },
            { value: "Definir 3", label: "Definir 3" },
            { value: "Definir 4", label: "Definir 4" },
            { value: "Definir n....", label: "Definir n...." }
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

    // Despacho permanente que registra
    despachoActual: {
        id: 5,
        consejoseccional: "CALDAS",
        jurisdiccion: "ORDINARIA",
        deptomunicipio: "MANIZALES",
        distrito: "MANIZALES",
        circuito: "MANIZALES",
        tipodespacho: "JUZGADO MUNICIPAL",
        especialidad: "LABORAL",
        tipo:"Descongestión",
        codigoDespacho: "170014005801",
        nombreDespacho: "JUZGADO 801 LABORAL MUNICIPAL TRANSITORIO DE MANIZALES",
        fechaInicio: "2026-01-15",
        fechaFin: "2026-12-31",
        estado: "Activo",
        adminPrimerNombre: "Luis",
        adminSegundoNombre: "Fernando",
        adminPrimerApellido: "Giraldo",
        adminSegundoApellido: "Restrepo",
        adminCorreo: "lgiraldo@cendoj.ramajudicial.gov.co",        
    },

    // Procesos registrados
    procesos: [
        {
            id: 1,
            codigo: "05001400300320240012300",
            estadoProceso: "Definir 2",
            fechaActuacion: "2026-08-14",
            link: "https://procesos.ramajudicial.gov.co/",
            observaciones: "Pendiente dictamen pericial..........",
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
            codigo: "05001400300320250007800",
            estadoProceso: "Definir 1",
            fechaActuacion: "2026-09-10",
            link: "",
            observaciones: "",
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
            codigo: "05001400300320230045600",
            estadoProceso: "Definir 3",
            fechaActuacion: "2026-03-02",
            link: "",
            observaciones: "",
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