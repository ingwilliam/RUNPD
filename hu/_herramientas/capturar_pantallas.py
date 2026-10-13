"""Captura de pantalla del prototipo HTML con Chrome o Edge en modo headless.

Genera imagenes PNG de una o varias pantallas del prototipo: siempre una vista
completa por pantalla y, opcionalmente, una captura por cada ancla (seccion) que
se indique con --ancla.

Uso:
    python hu/_herramientas/capturar_pantallas.py <pantalla.html>
    python hu/_herramientas/capturar_pantallas.py <pantalla.html> --ancla <id_seccion>:<alto>
    python hu/_herramientas/capturar_pantallas.py <pantalla.html> --ancla flujo:1150 --ancla roles:1450
    python hu/_herramientas/capturar_pantallas.py <pantalla.html> --salida C:\\temp\\capturas

El navegador se busca en la variable de entorno CHROME_PATH o en las rutas
habituales de Chrome y Edge. No modifica el prototipo: solo lo abre y guarda PNG.
"""

import argparse
import os
import shutil
import subprocess
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent.parent
SALIDA_POR_DEFECTO = RAIZ / "hu" / "capturas"
ANCHO = 1500
ALTO_COMPLETO = 3400
ESPERA_MS = 6000  # deja asentar tipografia y animaciones iniciales

RUTAS_NAVEGADOR = [
    r"C:\Program Files\Google\Chrome\Application\chrome.exe",
    r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
    r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
    r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
]


def encontrar_navegador():
    """Devuelve la ruta al ejecutable del navegador o None."""
    candidatos = []
    if os.environ.get("CHROME_PATH"):
        candidatos.append(os.environ["CHROME_PATH"])
    candidatos += RUTAS_NAVEGADOR
    for nombre in ("chrome", "google-chrome", "chromium", "msedge"):
        ruta = shutil.which(nombre)
        if ruta:
            candidatos.append(ruta)
    for ruta in candidatos:
        if ruta and Path(ruta).exists():
            return ruta
    return None


def url_archivo(html, ancla=None):
    url = Path(html).resolve().as_uri()
    if ancla:
        url += "#" + ancla
    return url


def capturar(navegador, url, destino, ancho, alto, perfil):
    """Ejecuta el navegador headless y guarda el PNG en destino."""
    comando = [
        navegador,
        "--headless=new",
        "--disable-gpu",
        "--hide-scrollbars",
        "--no-first-run",
        "--no-default-browser-check",
        f"--user-data-dir={perfil}",
        f"--window-size={ancho},{alto}",
        f"--virtual-time-budget={ESPERA_MS}",
        f"--screenshot={destino}",
        url,
    ]
    subprocess.run(comando, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=False)
    return Path(destino).exists() and Path(destino).stat().st_size > 0


def como_anclas(valores):
    """Convierte ['nombre:alto', ...] en tuplas (ancla, alto)."""
    anclas = []
    for valor in valores or []:
        partes = valor.split(":", 1)
        alto = int(partes[1]) if len(partes) > 1 else 1150
        anclas.append((partes[0], alto))
    return anclas


def main():
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("html", nargs="+", help="Pantallas a capturar (al menos una)")
    parser.add_argument("--salida", type=Path, default=SALIDA_POR_DEFECTO, help="Carpeta de salida")
    parser.add_argument("--ancho", type=int, default=ANCHO, help="Ancho de la ventana")
    parser.add_argument("--alto", type=int, default=ALTO_COMPLETO, help="Alto de la captura completa")
    parser.add_argument("--ancla", action="append", metavar="SECCION:ALTO", help="Anclas adicionales a capturar")
    args = parser.parse_args()

    navegador = encontrar_navegador()
    if not navegador:
        sys.exit("ERROR: no se encontro Chrome ni Edge. Defina la variable CHROME_PATH.")
    print(f"Navegador: {navegador}")

    args.salida.mkdir(parents=True, exist_ok=True)
    perfil = args.salida / "_perfil_temporal"

    generadas = []
    for html in args.html:
        ruta = Path(html)
        if not ruta.is_absolute():
            ruta = RAIZ / ruta
        if not ruta.exists():
            print(f"AVISO: no existe {ruta}")
            continue

        completa = args.salida / f"{ruta.stem}_full.png"
        if capturar(navegador, url_archivo(ruta), completa, args.ancho, args.alto, perfil):
            generadas.append(completa)
            print(f"OK: {completa}")
        else:
            print(f"AVISO: no se pudo capturar {completa}")

        for ancla, alto in como_anclas(args.ancla):
            destino = args.salida / f"{ruta.stem}_{ancla}.png"
            if capturar(navegador, url_archivo(ruta, ancla), destino, args.ancho, alto, perfil):
                generadas.append(destino)
                print(f"OK: {destino}")
            else:
                print(f"AVISO: no se pudo capturar {destino}")

    shutil.rmtree(perfil, ignore_errors=True)
    print(f"Total de capturas: {len(generadas)}")


if __name__ == "__main__":
    main()