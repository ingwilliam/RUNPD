# Proyecto RUNPD: prototipo HTML

Prototipo navegable en HTML/CSS/JS que se usa para levantar requerimientos y validar diseño.
No es un sistema en producción: no hay backend, pruebas ni build.
Omite las reglas globales de validación (pruebas, linters, tipos). Mantén las de comunicación y seguridad.

## Estructura
* Raíz: pantallas del prototipo (.html).
* `css/`, `img/`, `js/`: recursos compartidos. Un cambio en `css/` o `js/` puede afectar varias pantallas.
* `email_*.html`: plantillas de notificaciones por correo.
* Variantes `_c`, `_d`, `_p` y archivos `index_admin*`, `modulo*`, `funcionalidades_*`:
  corresponden a distintos roles o tipos de despacho. Deduce su significado del contenido;
  si no es claro, pregunta.
* `hu/`: historias de usuario. `Anexo_Formato_Historias_Usuario.docx` es la plantilla oficial
  y nunca se modifica.

## Agentes
* `hu`: genera historias de usuario. Solo lectura sobre el prototipo.
* `diseno`: mejora o modifica el diseño según las indicaciones del usuario.