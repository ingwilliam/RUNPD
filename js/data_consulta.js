// =====================================================================
// RUNPD - Datos del prototipo: consulta ciudadana de procesos
// Cada proceso guarda su trazabilidad completa, de origen a destino.
// Tipos de evento: registro · envio · asignacion · devolucion · reasignacion · actuacion · finalizacion
//
// Estados usados (los mismos de las demás pantallas):
//  - registro    → catálogo del despacho permanente (data_procesos.js)
//  - actuacion   → catálogo del despacho de descongestión (data_recepcion.js)
//  - finalizacion→ formas de terminación (data_recepcion.js)
// =====================================================================
const dbConsulta = {
    procesos: [
        {
            codigo: "05001400300320240012300",
            jurisdiccion: "ORDINARIA",
            especialidad: "LABORAL",
            consejoSeccional: "CALDAS",
            demandantes: [{ tipo: "natural", nombre: "Juan Pablo Restrepo Ochoa" }],
            demandados: [{ tipo: "juridica", nombre: "INVERSIONES EL POBLADO S.A.S." }],
            trazabilidad: [
                { tipo: "registro", fecha: "2026-09-10", actor: "JUZGADO 801 LABORAL MUNICIPAL TRANSITORIO DE MANIZALES", estadoProcesal: "Decreta pruebas y señala fecha de audiencia" },
                { tipo: "envio", fecha: "2026-09-20", actor: "JUZGADO 801 LABORAL MUNICIPAL TRANSITORIO DE MANIZALES" },
                { tipo: "asignacion", fecha: "2026-09-29", actor: "Consejo Seccional de Caldas", despachoDestino: "JUZGADO 01 DE DESCONGESTIÓN LABORAL DE MANIZALES" },
                { tipo: "actuacion", fecha: "2026-09-30", actor: "JUZGADO 01 DE DESCONGESTIÓN LABORAL DE MANIZALES", estadoProcesal: "Auto que asume el conocimiento", proximaActuacion: "2026-10-20" }
            ]
        },
        {
            codigo: "05001400300320220011100",
            jurisdiccion: "ORDINARIA",
            especialidad: "LABORAL",
            consejoSeccional: "CALDAS",
            demandantes: [{ tipo: "natural", nombre: "Gloria Inés Pineda" }],
            demandados: [{ tipo: "juridica", nombre: "HOSPITAL SAN JUAN DE DIOS" }],
            trazabilidad: [
                { tipo: "registro", fecha: "2026-06-25", actor: "JUZGADO 002 LABORAL MUNICIPAL DE MANIZALES", estadoProcesal: "Decreta pruebas y señala fecha de audiencia" },
                { tipo: "envio", fecha: "2026-06-30", actor: "JUZGADO 002 LABORAL MUNICIPAL DE MANIZALES" },
                { tipo: "asignacion", fecha: "2026-07-10", actor: "Consejo Seccional de Caldas", despachoDestino: "JUZGADO 02 DE DESCONGESTIÓN CIVIL DE MANIZALES" },
                { tipo: "devolucion", fecha: "2026-07-15", actor: "JUZGADO 02 DE DESCONGESTIÓN CIVIL DE MANIZALES", motivo: "Error de traslado" },
                { tipo: "reasignacion", fecha: "2026-08-01", actor: "Consejo Seccional de Caldas", despachoDestino: "JUZGADO 01 DE DESCONGESTIÓN LABORAL DE MANIZALES" },
                { tipo: "actuacion", fecha: "2026-08-02", actor: "JUZGADO 01 DE DESCONGESTIÓN LABORAL DE MANIZALES", estadoProcesal: "Auto que asume el conocimiento", proximaActuacion: "2026-08-20" },
                { tipo: "actuacion", fecha: "2026-08-20", actor: "JUZGADO 01 DE DESCONGESTIÓN LABORAL DE MANIZALES", estadoProcesal: "Pruebas decretadas pendientes de práctica", proximaActuacion: "2026-09-25" },
                { tipo: "actuacion", fecha: "2026-09-26", actor: "JUZGADO 01 DE DESCONGESTIÓN LABORAL DE MANIZALES", estadoProcesal: "Fija fecha para audiencia inicial, de instrucción y juzgamiento", proximaActuacion: "2026-10-28" }
            ]
        },
        {
            codigo: "17001310500120210033300",
            jurisdiccion: "ORDINARIA",
            especialidad: "LABORAL",
            consejoSeccional: "CALDAS",
            demandantes: [{ tipo: "natural", nombre: "Rubén Darío Cardona Gil" }],
            demandados: [{ tipo: "juridica", nombre: "COLPENSIONES" }],
            trazabilidad: [
                { tipo: "registro", fecha: "2026-02-12", actor: "JUZGADO 003 LABORAL DEL CIRCUITO DE MANIZALES", estadoProcesal: "En estado de fallo" },
                { tipo: "envio", fecha: "2026-02-15", actor: "JUZGADO 003 LABORAL DEL CIRCUITO DE MANIZALES" },
                { tipo: "asignacion", fecha: "2026-03-01", actor: "Consejo Seccional de Caldas", despachoDestino: "JUZGADO 01 DE DESCONGESTIÓN LABORAL DE MANIZALES" },
                { tipo: "actuacion", fecha: "2026-03-03", actor: "JUZGADO 01 DE DESCONGESTIÓN LABORAL DE MANIZALES", estadoProcesal: "Auto que asume el conocimiento", proximaActuacion: "2026-04-12" },
                { tipo: "actuacion", fecha: "2026-04-12", actor: "JUZGADO 01 DE DESCONGESTIÓN LABORAL DE MANIZALES", estadoProcesal: "Sentencia", proximaActuacion: "2026-06-10" },
                { tipo: "actuacion", fecha: "2026-06-10", actor: "JUZGADO 01 DE DESCONGESTIÓN LABORAL DE MANIZALES", estadoProcesal: "Liquidación de costas, entrega de títulos, levantamiento de medidas cautelares u oficios", proximaActuacion: "2026-06-18" },
                { tipo: "finalizacion", fecha: "2026-06-18", actor: "JUZGADO 01 DE DESCONGESTIÓN LABORAL DE MANIZALES", formaTerminacion: "Sentencia ejecutoriada" }
            ]
        },
        {
            codigo: "05001400300320250007800",
            jurisdiccion: "ORDINARIA",
            especialidad: "LABORAL",
            consejoSeccional: "CALDAS",
            demandantes: [{ tipo: "natural", nombre: "Sandra Múnera Arango" }],
            demandados: [{ tipo: "juridica", nombre: "CONSTRUCTORA ANDINA LTDA." }],
            trazabilidad: [
                { tipo: "registro", fecha: "2026-09-12", actor: "JUZGADO 801 LABORAL MUNICIPAL TRANSITORIO DE MANIZALES", estadoProcesal: "Admitida o libra mandamiento" },
                { tipo: "envio", fecha: "2026-09-20", actor: "JUZGADO 801 LABORAL MUNICIPAL TRANSITORIO DE MANIZALES" }
            ]
        },
        {
            codigo: "17001410500220250004400",
            jurisdiccion: "ORDINARIA",
            especialidad: "LABORAL",
            consejoSeccional: "CALDAS",
            demandantes: [{ tipo: "natural", nombre: "Paula Osorio Marín" }],
            demandados: [{ tipo: "juridica", nombre: "TRANSPORTES DEL CAFÉ S.A." }],
            trazabilidad: [
                { tipo: "registro", fecha: "2026-05-05", actor: "JUZGADO 002 LABORAL MUNICIPAL DE MANIZALES", estadoProcesal: "Admitida o libra mandamiento" },
                { tipo: "envio", fecha: "2026-05-08", actor: "JUZGADO 002 LABORAL MUNICIPAL DE MANIZALES" },
                { tipo: "asignacion", fecha: "2026-05-20", actor: "Consejo Seccional de Caldas", despachoDestino: "JUZGADO 01 DE DESCONGESTIÓN LABORAL DE MANIZALES" },
                { tipo: "devolucion", fecha: "2026-05-22", actor: "JUZGADO 01 DE DESCONGESTIÓN LABORAL DE MANIZALES", motivo: "Error de traslado" }
            ]
        }
    ]
};