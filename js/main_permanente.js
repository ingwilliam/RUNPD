// Renderizar la tabla de validación de despachos permanentes
function renderizarTablaPermanentes() {
    const tbody = document.getElementById('cuerpo-tabla-permanente');
    if (!tbody) return;
    
    tbody.innerHTML = '';

    const listaDespachos = dbDatos.despachosPermanentes || dbDatos.despachos || [];

    listaDespachos.forEach(item => {
        const esAprobado = item.estado === "Aprobado" || item.estado === true;
        const esRechazado = item.estado === "Rechazado";
        const tr = document.createElement('tr');
        
        let badgeHtml = '';
        if (esAprobado) {
            badgeHtml = '<span class="badge" style="background-color: #e6f4ea; color: var(--primary-green);">Habilitado para Procesos</span>';
        } else if (esRechazado) {
            badgeHtml = '<span class="badge" style="background-color: #fee2e2; color: #dc2626;">Rechazado</span>';
        } else {
            badgeHtml = '<span class="badge" style="background-color: #fef3c7; color: #d97706;">Pendiente de Validación</span>';
        }

        tr.innerHTML = `
            <td style="font-weight: 500;">${item.adminNombre || (item.adminPrimerNombre ? item.adminPrimerNombre + ' ' + (item.adminPrimerApellido || '') : 'Luis Fernando Giraldo')}</td>
            <td><strong>${item.adminCorreo || item.correoInstitucional || 'lgiraldo@cendoj.ramajudicial.gov.co'}</strong></td>
            <td>${item.nombreDespacho || 'JUZGADO CIVIL MUNICIPAL'}</td>
            <td><span style="font-family: monospace; font-weight: 600; color: var(--primary-green);">${item.codigoDespacho || ''}</span></td>
            <td>${badgeHtml}</td>
            <td style="text-align: center;">
                <div style="display: flex; gap: 0.4rem; justify-content: center; flex-wrap: wrap;">
                    <button class="btn btn-secondary" style="padding: 0.3rem 0.5rem; font-size: 0.75rem; background-color: #f1f5f9; color: #334155; border-color: #cbd5e1;" onclick="verDetalleSolicitud(${item.id})">🔍 Detalle</button>
                    <button class="btn btn-primary" style="padding: 0.3rem 0.5rem; font-size: 0.75rem;" onclick="aprobarDespachoPermanente(${item.id})">✔ Aprobar</button>
                    <button class="btn btn-secondary" style="padding: 0.3rem 0.5rem; font-size: 0.75rem; background-color: #fee2e2; color: #dc2626; border-color: #fecaca;" onclick="abrirModalRechazo(${item.id})">✖ Rechazar</button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Asegurar que exista el contenedor modal en el DOM
function asegurarContenedorModal() {
    let modalOverlay = document.getElementById('modal-dinamico-overlay');
    if (!modalOverlay) {
        modalOverlay = document.createElement('div');
        modalOverlay.id = 'modal-dinamico-overlay';
        modalOverlay.className = 'modal-overlay';
        modalOverlay.innerHTML = `
            <div class="modal-card" id="modal-dinamico-card" style="max-width: 550px;">
                <div id="modal-dinamico-contenido"></div>
            </div>
        `;
        document.body.appendChild(modalOverlay);
    }
    return modalOverlay;
}

function cerrarModalDinamico() {
    const modalOverlay = document.getElementById('modal-dinamico-overlay');
    if (modalOverlay) {
        modalOverlay.classList.remove('visible');
    }
}

// 1. Ver detalle completo con diseño limpio y toda la información
function verDetalleSolicitud(id) {
    const listaDespachos = dbDatos.despachosPermanentes || dbDatos.despachos || [];
    const item = listaDespachos.find(d => d.id === id);

    if (!item) return;

    const modalOverlay = asegurarContenedorModal();
    const contenido = document.getElementById('modal-dinamico-contenido');

    // Construir nombre completo del administrador de forma segura
    const nombresAdmin = [item.adminPrimerNombre, item.adminSegundoNombre].filter(Boolean).join(' ');
    const apellidosAdmin = [item.adminPrimerApellido, item.adminSegundoApellido].filter(Boolean).join(' ');
    const nombreCompletoAdmin = item.adminNombre || (nombresAdmin || apellidosAdmin ? `${nombresAdmin} ${apellidosAdmin}`.trim() : 'Luis Fernando Giraldo');

    contenido.innerHTML = `
        <h3 style="font-size: 1.15rem; font-weight: 600; color: var(--text-main); margin-bottom: 1rem; border-bottom: 2px solid var(--border-color); padding-bottom: 0.5rem; display: flex; align-items: center; gap: 0.5rem;">
            <span>📋</span> Detalle Completo de la Solicitud #${item.id || ''}
        </h3>
        
        <!-- Contenedor con scroll interno si la información es muy larga -->
        <div style="max-height: 65vh; overflow-y: auto; padding-right: 0.5rem; display: flex; flex-direction: column; gap: 1rem;">
            
            <!-- Sección: Información del Despacho -->
            <div style="background: #f8fafc; padding: 0.85rem 1rem; border-radius: 8px; border: 1px solid #e2e8f0; font-size: 0.9rem;">
                <p style="font-weight: 600; color: var(--primary-green); margin-bottom: 0.5rem; border-bottom: 1px solid #e2e8f0; padding-bottom: 0.25rem;">🏛️ Información del Despacho</p>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.4rem 1rem;">
                    <p><strong>Nombre:</strong> ${item.nombreDespacho || 'No especificado'}</p>
                    <p><strong>Código:</strong> ${item.codigoDespacho || 'No especificado'}</p>
                    <p><strong>Tipo:</strong> ${item.tipo || 'No especificado'}</p>
                    <p><strong>Tipo Despacho:</strong> ${item.tipodespacho || 'No especificado'}</p>
                    <p><strong>Especialidad:</strong> ${item.especialidad || 'No especificado'}</p>
                    <p><strong>Jurisdicción:</strong> ${item.jurisdiccion || 'No especificado'}</p>
                </div>
            </div>

            <!-- Sección: Ubicación y Territorio -->
            <div style="background: #f8fafc; padding: 0.85rem 1rem; border-radius: 8px; border: 1px solid #e2e8f0; font-size: 0.9rem;">
                <p style="font-weight: 600; color: var(--primary-green); margin-bottom: 0.5rem; border-bottom: 1px solid #e2e8f0; padding-bottom: 0.25rem;">📍 Ubicación y Jurisdicción Territorial</p>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.4rem 1rem;">
                    <p><strong>Consejo Seccional:</strong> ${item.consejoseccional || 'No especificado'}</p>
                    <p><strong>Municipio / Dpto:</strong> ${item.deptomunicipio || 'No especificado'}</p>
                    <p><strong>Distrito:</strong> ${item.distrito || 'No especificado'}</p>
                    <p><strong>Circuito:</strong> ${item.circuito || 'No especificado'}</p>
                </div>
            </div>

            <!-- Sección: Vigencia y Estado -->
            <div style="background: #f8fafc; padding: 0.85rem 1rem; border-radius: 8px; border: 1px solid #e2e8f0; font-size: 0.9rem;">
                <p style="font-weight: 600; color: var(--primary-green); margin-bottom: 0.5rem; border-bottom: 1px solid #e2e8f0; padding-bottom: 0.25rem;">📅 Vigencia y Estado</p>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.4rem 1rem;">
                    <p><strong>Fecha Inicio:</strong> ${item.fechaInicio || 'No especificada'}</p>
                    <p><strong>Fecha Fin:</strong> ${item.fechaFin || 'No especificada'}</p>
                    <p><strong>Estado:</strong> <span style="font-weight: 600; color: ${item.estado === 'Activo' || item.estado === 'Aprobado' || item.estado === true ? '#059669' : '#d97706'};">${item.estado === true ? 'Habilitado' : (item.estado || 'Pendiente')}</span></p>
                </div>
                ${item.motivoRechazo ? `<p style="color: #dc2626; margin-top: 0.5rem;"><strong>Motivo de Rechazo:</strong> ${item.motivoRechazo}</p>` : ''}
            </div>

            <!-- Sección: Información del Administrador -->
            <div style="background: #f8fafc; padding: 0.85rem 1rem; border-radius: 8px; border: 1px solid #e2e8f0; font-size: 0.9rem;">
                <p style="font-weight: 600; color: var(--primary-green); margin-bottom: 0.5rem; border-bottom: 1px solid #e2e8f0; padding-bottom: 0.25rem;">👤 Información del Administrador</p>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.4rem 1rem;">
                    <p style="grid-column: span 2;"><strong>Nombre Completo:</strong> ${nombreCompletoAdmin}</p>
                    <p style="grid-column: span 2;"><strong>Correo Institucional:</strong> ${item.adminCorreo || item.correoInstitucional || 'No especificado'}</p>
                </div>
            </div>

        </div>

        <!-- Botón de Cierre -->
        <div style="display: flex; justify-content: flex-end; margin-top: 1.25rem; border-top: 1px solid var(--border-color); padding-top: 0.75rem;">
            <button class="btn btn-secondary" onclick="cerrarModalDinamico()">Cerrar</button>
        </div>
    `;

    modalOverlay.classList.add('visible');
}

// 2. Aprobar despacho: indica que se habilitó y ofrece el botón para Enviar Notificación
function aprobarDespachoPermanente(id) {
    const listaDespachos = dbDatos.despachosPermanentes || dbDatos.despachos || [];
    const item = listaDespachos.find(d => d.id === id);
    if (item) {
        item.estado = "Aprobado";
        item.motivoRechazo = null;
    }

    const modalOverlay = asegurarContenedorModal();
    const contenido = document.getElementById('modal-dinamico-contenido');

    contenido.innerHTML = `
        <div style="text-align: center; padding: 1rem 0;">
            <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">✅</div>
            <h3 style="font-size: 1.15rem; font-weight: 600; color: var(--text-main); margin-bottom: 0.5rem;">¡Despacho Habilitado!</h3>
            <p style="font-size: 0.9rem; color: var(--text-muted); margin-bottom: 1.5rem;">Se habilitó el despacho correctamente. Haga clic en el botón para enviar la notificación.</p>
            <div style="display: flex; gap: 0.75rem; justify-content: center;">
                <button class="btn btn-secondary" onclick="cerrarModalDinamico(); renderizarTablaPermanentes();">Cancelar</button>
                <button class="btn btn-primary" onclick="window.open('email_crear_admin_permanente_aprobado.html', '_blank'); cerrarModalDinamico(); renderizarTablaPermanentes();">Enviar Notificación</button>
            </div>
        </div>
    `;

    modalOverlay.classList.add('visible');
}

// 3. Abrir modal para solicitar el motivo del rechazo
function abrirModalRechazo(id) {
    const modalOverlay = asegurarContenedorModal();
    const contenido = document.getElementById('modal-dinamico-contenido');

    contenido.innerHTML = `
        <h3 style="font-size: 1.15rem; font-weight: 600; color: #dc2626; margin-bottom: 1rem; border-bottom: 2px solid var(--border-color); padding-bottom: 0.5rem;">
            ✖ Rechazar Postulación
        </h3>
        <p style="font-size: 0.9rem; color: var(--text-muted); margin-bottom: 1rem;">
            Por favor, indique el motivo por el cual se rechaza esta postulación. Esta información será enviada al solicitante.
        </p>
        <div class="form-group" style="margin-bottom: 1.25rem;">
            <textarea id="input-motivo-rechazo" class="form-control" rows="4" placeholder="Escriba el motivo del rechazo aquí..." style="resize: vertical;"></textarea>
        </div>
        <div style="display: flex; gap: 0.75rem; justify-content: flex-end;">
            <button class="btn btn-secondary" onclick="cerrarModalDinamico()">Cancelar</button>
            <button class="btn" style="background-color: #dc2626; color: white;" onclick="confirmarRechazo(${id})">Confirmar Rechazo</button>
        </div>
    `;

    modalOverlay.classList.add('visible');
}

// Ejecutar el rechazo, guardar motivo y abrir directamente la notificación en pestaña nueva
function confirmarRechazo(id) {
    const motivo = document.getElementById('input-motivo-rechazo').value.trim();
    
    if (!motivo) {
        alert("Debe especificar un motivo válido para proceder con el rechazo.");
        return;
    }

    const listaDespachos = dbDatos.despachosPermanentes || dbDatos.despachos || [];
    const item = listaDespachos.find(d => d.id === id);
    if (item) {
        item.estado = "Rechazado";
        item.motivoRechazo = motivo;
    }

    // Cerrar modal actual
    cerrarModalDinamico();

    // Abrir directamente la página de rechazo en una nueva pestaña
    window.open('email_crear_admin_permanente_rechazado.html', '_blank');

    // Refrescar la tabla
    renderizarTablaPermanentes();
}

// Inicializar al cargar la vista
window.onload = function() {    
    renderizarTablaPermanentes();
};