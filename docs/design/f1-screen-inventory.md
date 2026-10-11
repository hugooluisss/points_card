# Inventario de pantallas F1

Este inventario cubre el acceso y el armazón inicial de Points Card. Inicio muestra solo indicadores de referencia: los datos de lealtad se incorporarán en fases posteriores.

| Pantalla | Propósito | Campos / contenido | Estados | Visibilidad por rol |
|---|---|---|---|---|
| Inicio de sesión (`/login`) | Permitir que el personal acceda a su comercio. | Correo electrónico, contraseña, botón «Iniciar sesión» y enlace para registrar comercio. | Vacío: formulario listo. Cargando: botón ocupado y campos bloqueados. Error: mensaje general para credenciales rechazadas; errores junto a campos inválidos. | Público, sin sesión. Todos los roles autenticados usan este acceso. |
| Registro de comercio (`/registro`) | Crear un comercio y su cuenta propietaria. | Nombre del comercio, nombre de la persona responsable, correo, contraseña y confirmación/aceptación de términos. | Vacío: formulario listo. Cargando: envío en curso. Error: mensaje general si el registro no puede completarse y validación junto al campo correspondiente. | Público, sin sesión; crea el primer usuario con rol owner. |
| Armazón de la aplicación (sidebar + header) | Dar navegación persistente, contexto del usuario y salida segura. | Sidebar agrupada: «Inicio»; «Operación» con Clientes, Movimientos, Canjes y Escáner; «Programa» con Programas; «Administración» con Configuración; pie con Cerrar sesión. Badges de conteo solo cuando haya datos disponibles. Header con nombre del comercio/sucursal y menú de usuario. En móvil, sidebar reemplazada por botón de menú. | Vacío: shell visible mientras aún no hay actividad. Cargando: placeholder o indicación discreta durante la navegación. Error: aviso dentro del contenido si no se puede cargar la sección. | Owner: todas las entradas. Manager: operación y programas, configuración según permisos. Cashier: operación y escáner; se ocultan gestión de programas y configuración. El backend debe validar permisos aunque una entrada no aparezca. |
| Inicio (`/`) | Ofrecer un resumen rápido sin inventar métricas antes de que existan datos. | Saludo y selector de periodo visual; KPI placeholders: clientes, movimientos, canjes y programas activos; un panel de actividad con gráfica ilustrativa; lista de actividad reciente. El estado inicial explica qué aparecerá al iniciar la operación. | Vacío: KPIs con guion/0 y explicación para comenzar; actividad vacía con llamada a configurar el programa. Cargando: bloques de placeholder. Error: aviso de carga con acción para reintentar. | Owner y manager: resumen completo. Cashier: resumen operativo con clientes, movimientos y canjes; ocultar datos/configuración que su rol no puede consultar. |

## Notas de navegación y accesibilidad

- En pantallas anchas, el sidebar permanece visible; en teléfono se abre desde el botón «Menú» y se cierra al elegir una ruta.
- Los controles tienen etiquetas visibles, foco de teclado marcado y contraste suficiente. Los errores se expresan en español y se asocian al campo cuando corresponda.
- Los badges son decorativos/indicativos y no son la única forma de comunicar un estado.
