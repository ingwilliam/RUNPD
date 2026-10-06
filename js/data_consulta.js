// =====================================================================
// RUNPD - Datos del prototipo: consulta ciudadana de procesos
// Cada proceso guarda su trazabilidad completa según el flujo:
//   medida (UDAE o Consejo) → registro y envío (despacho origen) →
//   verificación del Consejo (devuelve o aprueba) → gestión (despacho destino) →
//   terminación o devolución al despacho origen.
// Tipos de evento: medida · registro · envio · devolucion_consejo · aprobacion ·
//                  actuacion · devolucion_origen · finalizacion
// Los procesos, despachos y medidas coinciden con las demás pantallas.
// =====================================================================
const MEDIDA_11234 = { acuerdo: "Acuerdo PCSJA26-11234 de 2026", expedidaPor: "UDAE", vigencia: "15/01/2026 al 31/12/2026" };
const MEDIDA_11870 = { acuerdo: "Acuerdo PCSJA26-11870 de 2026", expedidaPor: "Consejo Seccional de Caldas", vigencia: "01/07/2026 al 31/03/2027" };
const J002 = "JUZGADO 002 LABORAL MUNICIPAL DE MANIZALES";
const J003 = "JUZGADO 003 LABORAL DEL CIRCUITO DE MANIZALES";
const J801 = "JUZGADO 801 LABORAL MUNICIPAL TRANSITORIO DE MANIZALES";
const CONSEJO = "Consejo Seccional de Caldas";

const dbConsulta = {
    procesos: [
        {
            // Escenario 1: registrado, pendiente de envío al Consejo
            codigo: "05001400300320240012300",
            escenario: "Pendiente de envío",
            jurisdiccion: "ORDINARIA",
            especialidad: "LABORAL",
            consejoSeccional: "CALDAS",
            medida: MEDIDA_11234,
            despachoOrigen: J002,
            despachoDestino: J801,
            demandantes: [{ tipo: "natural", nombre: "Juan Pablo Restrepo Ochoa" }],
            demandados: [{ tipo: "juridica", nombre: "INVERSIONES EL POBLADO S.A.S." }],
            trazabilidad: [
                { tipo: "medida", fecha: "2026-01-10", actor: "UDAE" },
                { tipo: "registro", fecha: "2026-09-10", actor: J002, estadoProcesal: "Decreta pruebas y señala fecha de audiencia" }
            ]
        },
        {
            // Escenario 2: medida del Consejo (camino B), en verificación del Consejo
            codigo: "05001400300320230045600",
            escenario: "En verificación del Consejo",
            jurisdiccion: "ORDINARIA",
            especialidad: "LABORAL",
            consejoSeccional: "CALDAS",
            medida: MEDIDA_11870,
            despachoOrigen: J002,
            despachoDestino: J801,
            demandantes: [{ tipo: "juridica", nombre: "BANCOLOMBIA S.A." }],
            demandados: [{ tipo: "natural", nombre: "Martha Lucía Henao Vélez" }, { tipo: "natural", nombre: "Andrés Henao Vélez" }],
            trazabilidad: [
                { tipo: "medida", fecha: "2026-06-20", actor: CONSEJO },
                { tipo: "registro", fecha: "2026-09-12", actor: J002, estadoProcesal: "En estado de fallo" },
                { tipo: "envio", fecha: "2026-09-20", actor: J002 }
            ]
        },
        {
            // Escenario 3: aprobado, en el despacho destino sin primera actuación
            codigo: "17001410500220240039100",
            escenario: "Aprobado, sin primera actuación",
            jurisdiccion: "ORDINARIA",
            especialidad: "LABORAL",
            consejoSeccional: "CALDAS",
            medida: MEDIDA_11234,
            despachoOrigen: J002,
            despachoDestino: J801,
            demandantes: [{ tipo: "natural", nombre: "Beatriz Londoño Gil" }],
            demandados: [{ tipo: "juridica", nombre: "CLÍNICA SANTA SOFÍA S.A." }],
            trazabilidad: [
                { tipo: "medida", fecha: "2026-01-10", actor: "UDAE" },
                { tipo: "registro", fecha: "2026-09-05", actor: J002, estadoProcesal: "Integrada la litis" },
                { tipo: "envio", fecha: "2026-09-22", actor: J002 },
                { tipo: "aprobacion", fecha: "2026-09-26", actor: CONSEJO, despachoDestino: J801 }
            ]
        },
        {
            // Escenario 4: el Consejo lo devolvió, se corrigió, se aprobó y está en trámite
            codigo: "05001400300320220011100",
            escenario: "Devuelto por el Consejo, luego aprobado",
            jurisdiccion: "ORDINARIA",
            especialidad: "LABORAL",
            consejoSeccional: "CALDAS",
            medida: MEDIDA_11234,
            despachoOrigen: J002,
            despachoDestino: J801,
            demandantes: [{ tipo: "natural", nombre: "Gloria Inés Pineda" }],
            demandados: [{ tipo: "juridica", nombre: "HOSPITAL SAN JUAN DE DIOS" }],
            trazabilidad: [
                { tipo: "medida", fecha: "2026-01-10", actor: "UDAE" },
                { tipo: "registro", fecha: "2026-06-25", actor: J002, estadoProcesal: "Decreta pruebas y señala fecha de audiencia" },
                { tipo: "envio", fecha: "2026-06-30", actor: J002 },
                { tipo: "devolucion_consejo", fecha: "2026-07-05", actor: CONSEJO, motivo: "La información del proceso está incompleta o tiene errores." },
                { tipo: "envio", fecha: "2026-07-20", actor: J002, nota: "Reenviado con las correcciones solicitadas." },
                { tipo: "aprobacion", fecha: "2026-08-01", actor: CONSEJO, despachoDestino: J801 },
                { tipo: "actuacion", fecha: "2026-08-02", actor: J801, estadoProcesal: "Auto que asume el conocimiento", proximaActuacion: "2026-08-20" },
                { tipo: "actuacion", fecha: "2026-08-20", actor: J801, estadoProcesal: "Pruebas decretadas pendientes de práctica", proximaActuacion: "2026-09-25" }
            ]
        },
        {
            // Escenario 5: terminado en el despacho destino
            codigo: "17001310500120210033300",
            escenario: "Terminado",
            jurisdiccion: "ORDINARIA",
            especialidad: "LABORAL",
            consejoSeccional: "CALDAS",
            medida: MEDIDA_11234,
            despachoOrigen: J003,
            despachoDestino: J801,
            demandantes: [{ tipo: "natural", nombre: "Rubén Darío Cardona Gil" }],
            demandados: [{ tipo: "juridica", nombre: "COLPENSIONES" }],
            trazabilidad: [
                { tipo: "medida", fecha: "2026-01-10", actor: "UDAE" },
                { tipo: "registro", fecha: "2026-02-12", actor: J003, estadoProcesal: "En estado de fallo" },
                { tipo: "envio", fecha: "2026-02-15", actor: J003 },
                { tipo: "aprobacion", fecha: "2026-03-01", actor: CONSEJO, despachoDestino: J801 },
                { tipo: "actuacion", fecha: "2026-03-03", actor: J801, estadoProcesal: "Auto que asume el conocimiento", proximaActuacion: "2026-04-12" },
                { tipo: "actuacion", fecha: "2026-04-12", actor: J801, estadoProcesal: "Sentencia", proximaActuacion: "2026-06-10" },
                { tipo: "actuacion", fecha: "2026-06-10", actor: J801, estadoProcesal: "Liquidación de costas, entrega de títulos, levantamiento de medidas cautelares u oficios", proximaActuacion: "2026-06-18" },
                { tipo: "finalizacion", fecha: "2026-06-18", actor: J801, formaTerminacion: "Sentencia ejecutoriada" }
            ]
        },
        {
            // Escenario 6: el despacho destino lo devolvió al despacho origen
            codigo: "17001410500220250004400",
            escenario: "Devuelto al despacho origen",
            jurisdiccion: "ORDINARIA",
            especialidad: "LABORAL",
            consejoSeccional: "CALDAS",
            medida: MEDIDA_11234,
            despachoOrigen: J002,
            despachoDestino: J801,
            demandantes: [{ tipo: "natural", nombre: "Paula Osorio Marín" }],
            demandados: [{ tipo: "juridica", nombre: "TRANSPORTES DEL CAFÉ S.A." }],
            trazabilidad: [
                { tipo: "medida", fecha: "2026-01-10", actor: "UDAE" },
                { tipo: "registro", fecha: "2026-05-05", actor: J002, estadoProcesal: "Admitida o libra mandamiento" },
                { tipo: "envio", fecha: "2026-05-08", actor: J002 },
                { tipo: "aprobacion", fecha: "2026-05-20", actor: CONSEJO, despachoDestino: J801 },
                { tipo: "devolucion_origen", fecha: "2026-05-22", actor: J801, motivo: "Error de traslado" }
            ]
        }
    ]
};