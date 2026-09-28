// 2. Llenar los selects dinámicamente según el JSON
function llenarSelects(datosSeleccionados = {}) {
    for (const [campo, opciones] of Object.entries(dbDatos.opcionesSelects)) {
        const selectElement = document.getElementById(campo);
        if (selectElement) {
            selectElement.innerHTML = '<option value="" disabled selected>Seleccione una opción...</option>';
            opciones.forEach(opt => {
                const optionTag = document.createElement('option');
                optionTag.value = opt.value;
                optionTag.textContent = opt.label;
                if (datosSeleccionados[campo] === opt.value) {
                    optionTag.selected = true;
                }
                selectElement.appendChild(optionTag);
            });
        }
    }
}

// 3. Renderizar la tabla principal con las 2 columnas nuevas (Código y Nombre)
function renderizarTabla() {
    const tbody = document.getElementById('cuerpo-tabla');
    tbody.innerHTML = '';

    dbDatos.despachos.forEach(item => {
        const esActivo = item.estado === "Activo" || item.estado === true;
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${item.jurisdiccion}</td>
            <td>${item.tipodespacho}</td>
            <td>
                <span style="font-family: monospace; font-weight: 600; color: var(--primary-green);">${item.codigoDespacho || ''}</span>
            </td>
            <td>
                <div style="font-size: 0.85rem; font-weight: 500; color: var(--text-main);">${item.nombreDespacho || ''}</div>
            </td>
            <td>${item.deptomunicipio}</td>
            <td>${item.especialidad}</td>
            <td>${item.fechaInicio}</td>
            <td>${item.fechaFin}</td>
            <td><span class="badge-status ${esActivo ? 'active' : 'inactive'}">${esActivo ? 'Activo' : 'Inactivo'}</span></td>
            <td>
                <div class="action-buttons">
                    <button class="btn-action edit" onclick="abrirFormularioEditar(${item.id})">✏️ Editar</button>
                    <button class="btn-action inactivate" onclick="toggleInactivar(${item.id})">${esActivo ? '🚫 Inactivar' : '✅ Activar'}</button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// 4. Abrir Layer / Modal vacío para Nuevo
function abrirFormularioNuevo() {
    document.getElementById('despacho-id').value = '';
    document.getElementById('form-titulo').textContent = '📝 Habilitar despacho de descongestión';
    
    // Ocultar el botón de credenciales porque es un registro nuevo
    const btnCredenciales = document.getElementById('btn-enviar-credenciales');
    if (btnCredenciales) {
        btnCredenciales.style.display = 'none';
    }

    document.getElementById('form-despacho').reset();
    llenarSelects();
    document.getElementById('modal-despacho').classList.add('visible');
}

// 5. Abrir Layer / Modal precargado para Editar
function abrirFormularioEditar(id) {
    const despacho = dbDatos.despachos.find(d => d.id === id);
    if (!despacho) return;

    document.getElementById('despacho-id').value = despacho.id;
    document.getElementById('form-titulo').textContent = `✏️ Editar Despacho (ID: ${despacho.id})`;
    
    // MOSTRAR el botón de credenciales porque estamos editando
    const btnCredenciales = document.getElementById('btn-enviar-credenciales');
    if (btnCredenciales) {
        btnCredenciales.style.display = 'flex';
    }

    llenarSelects(despacho);

    // Asignar valores a los inputs de texto del despacho
    const inputCodigo = document.getElementById('codigo_despacho');
    const inputNombre = document.getElementById('nombre_despacho');
    if (inputCodigo) inputCodigo.value = despacho.codigoDespacho || '';
    if (inputNombre) inputNombre.value = despacho.nombreDespacho || '';

    document.getElementById('fecha_inicio').value = despacho.fechaInicio;
    document.getElementById('fecha_fin').value = despacho.fechaFin;

    // Asignar valores a los campos nuevos del Administrador
    const inputPnombre = document.getElementById('admin_primer_nombre');
    const inputSnombre = document.getElementById('admin_segundo_nombre');
    const inputPapellido = document.getElementById('admin_primer_apellido');
    const inputSapellido = document.getElementById('admin_segundo_apellido');
    const inputCorreo = document.getElementById('admin_correo');
    const inputPassword = document.getElementById('admin_password');

    if (inputPnombre) inputPnombre.value = despacho.adminPrimerNombre || '';
    if (inputSnombre) inputSnombre.value = despacho.adminSegundoNombre || '';
    if (inputPapellido) inputPapellido.value = despacho.adminPrimerApellido || '';
    if (inputSapellido) inputSapellido.value = despacho.adminSegundoApellido || '';
    if (inputCorreo) inputCorreo.value = despacho.adminCorreo || '';
    if (inputPassword) inputPassword.value = despacho.adminPassword || '';

    document.getElementById('modal-despacho').classList.add('visible');
}

// 6. Ocultar Layer / Modal
function ocultarFormulario() {
    document.getElementById('modal-despacho').classList.remove('visible');
}

// 7. Guardar o actualizar registro (incluyendo la data del Administrador)
function guardarDespacho(event) {
    event.preventDefault();
    const id = document.getElementById('despacho-id').value;

    const nuevoRegistro = {
        id: id ? parseInt(id) : Date.now(),
        consejoseccional: document.getElementById('consejoseccional').value,
        jurisdiccion: document.getElementById('jurisdiccion').value,
        deptomunicipio: document.getElementById('deptomunicipio').value,
        distrito: document.getElementById('distrito').value,
        circuito: document.getElementById('circuito').value,
        tipodespacho: document.getElementById('tipodespacho').value,
        especialidad: document.getElementById('especialidad').value,
        codigoDespacho: document.getElementById('codigo_despacho').value,
        nombreDespacho: document.getElementById('nombre_despacho').value,
        fechaInicio: document.getElementById('fecha_inicio').value,
        fechaFin: document.getElementById('fecha_fin').value,
        estado: "Activo",
        // Nuevos campos del Administrador
        adminPrimerNombre: document.getElementById('admin_primer_nombre').value,
        adminSegundoNombre: document.getElementById('admin_segundo_nombre').value,
        adminPrimerApellido: document.getElementById('admin_primer_apellido').value,
        adminSegundoApellido: document.getElementById('admin_segundo_apellido').value,
        adminCorreo: document.getElementById('admin_correo').value,
        adminPassword: document.getElementById('admin_password').value
    };

    if (id) {
        const index = dbDatos.despachos.findIndex(d => d.id === parseInt(id));
        if (index !== -1) {
            nuevoRegistro.estado = dbDatos.despachos[index].estado;
            dbDatos.despachos[index] = nuevoRegistro;
        }
    } else {
        dbDatos.despachos.push(nuevoRegistro);
    }

    renderizarTabla();
    ocultarFormulario();
}

// 8. Inactivar / Activar despacho
function toggleInactivar(id) {
    const despacho = dbDatos.despachos.find(d => d.id === id);
    if (despacho) {
        const estadoActual = despacho.estado === "Activo" || despacho.estado === true;
        despacho.estado = estadoActual ? "Inactivo" : "Activo";
        renderizarTabla();
    }
}

// Inicializar al cargar
window.onload = function() {
    renderizarTabla();
};