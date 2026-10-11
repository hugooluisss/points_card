# Design

## Context

Condicionada a los resultados de notificaciones de F0 (tareas del grupo 5). Reusa el outbox de F2 y los consentimientos de F3. Ver `proposal.md`.

## Goals / Non-Goals

**Goals:**
- Club útil sin notificaciones; campañas solo por canales confirmados.

**Non-Goals:**
- Omnicanal, automatizaciones, IA, geoavisos no confirmados.

## Decisions

- **Los canales son datos y dependen de F0.** Cada canal (alerta de Google, alerta de Apple, correo) se habilita según la evidencia; hasta entonces no aparece en el panel.
- **Contenido del club sincronizado por el mismo outbox de F2**, con el estado final por pase.
- **Compuerta de consentimiento en el service de campañas**, no en la interfaz: la audiencia se calcula en backend en el momento de envío.
- **Redis y BullMQ solo si el volumen lo exige.** Hasta entonces las entregas usan la tabla de entregas y el worker de F2. Alternativa: introducir Redis desde el inicio; se descarta por costo operativo.
- **Cuotas por plataforma** guardadas como configuración de cada proveedor, según F0.
- **Plan B por correo** con proveedor transaccional detrás de una interfaz, activado solo si F0 muestra que las alertas de Wallet no son viables.
- **Entregas por lotes** con registro por pase para poder reintentar fallos sin reenviar los exitosos.

## Risks / Trade-offs

- [Las alertas de Wallet no sirven para promoción] → Plan B por correo y club centrado en contenido del pase.
- [Aplicar mal el consentimiento] → Prueba automática de que la audiencia excluye revocados y no consentidos.
- [Exceder cuotas] → Contador por pase y diferimiento.
- [Volumen alto] → Introducir Redis y colas como cambio posterior, sin afectar los contratos.
