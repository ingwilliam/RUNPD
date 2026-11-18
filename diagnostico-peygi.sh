#!/bin/bash

# =====================================================
# DIAGNOSTICO DE SEGURIDAD - PEYGI
# Recopilacion de evidencias de infraestructura
# =====================================================

FECHA=$(date +%Y%m%d_%H%M%S)
HOST=$(hostname -s)
DIRECTORIO="$HOME/evidencias-peygi"

mkdir -p "$DIRECTORIO"

ARCHIVO="$DIRECTORIO/diagnostico_${HOST}_${FECHA}.txt"

exec > >(tee -a "$ARCHIVO") 2>&1

separador() {
    echo
    echo "====================================================="
    echo "$1"
    echo "====================================================="
}

separador "IDENTIFICACION DEL SERVIDOR"

date
hostname -f
hostname -I

separador "SISTEMA OPERATIVO"

cat /etc/os-release
uname -a

separador "NODE.JS"

if command -v node >/dev/null 2>&1; then
    node --version
    node -p "'Brotli: ' + process.versions.brotli"
else
    echo "Node.js no encontrado en el servidor anfitrion"
fi

separador "NGINX"

if command -v nginx >/dev/null 2>&1; then
    nginx -v 2>&1
else
    echo "NGINX no encontrado en el servidor anfitrion"
fi

separador "POSTGRESQL"

if command -v psql >/dev/null 2>&1; then
    psql --version
else
    echo "Cliente PostgreSQL no encontrado"
fi

separador "DOCKER"

if command -v docker >/dev/null 2>&1; then

    docker --version

    echo
    echo "CONTENEDORES ACTIVOS:"
    docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Status}}"

    echo
    echo "IMAGENES:"
    docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.ID}}"

else
    echo "Docker no encontrado"
fi

separador "PAQUETES BROTLI DEL SISTEMA OPERATIVO"

if command -v dpkg >/dev/null 2>&1; then
    dpkg -l | grep -i brotli || echo "No se encontraron paquetes Brotli registrados"
    echo
    apt-cache policy libbrotli1 brotli

elif command -v rpm >/dev/null 2>&1; then
    rpm -qa | grep -i brotli || echo "No se encontraron paquetes Brotli registrados"

elif command -v apk >/dev/null 2>&1; then
    apk info -v | grep -i brotli || echo "No se encontraron paquetes Brotli registrados"
fi

separador "ACTUALIZACIONES PENDIENTES"

if command -v apt >/dev/null 2>&1; then
    apt list --upgradable 2>/dev/null
fi

separador "FIN DEL DIAGNOSTICO"

echo "Servidor: $HOST"
echo "Fecha: $FECHA"
echo "Archivo generado: $ARCHIVO"

echo
echo "Diagnostico finalizado."
