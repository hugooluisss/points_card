# Design

## Context

Depende de F1 (comercio y roles). El estado de cobro condiciona operaciones de F2 y F3. Ver `proposal.md`.

## Goals / Non-Goals

**Goals:**
- Cobro mensual confiable con mínima superficie propia.

**Non-Goals:**
- CFDI, cobro por uso, precios definitivos.

## Decisions

- **Stripe Checkout (alojado) y Customer Portal.** Sin formularios de tarjeta propios; menor alcance PCI. Alternativa: Elements propios; se descarta por costo y riesgo.
- **Fuente de verdad del cobro: eventos de Stripe**, no la redirección de retorno. La suscripción local se actualiza solo por webhook.
- **Tabla `billing_events` con el `event.id` único** para idempotencia; el procesamiento ocurre en transacción.
- **Planes y límites como filas** en `plans`; el `price` de Stripe se enlaza por identificador. Los precios se crean en Stripe, no en código.
- **Comprobación de límites en el service** mediante un servicio de plan que los repositorios no conocen.
- **Estados con periodo de gracia** configurable; en mora no se bloquea la lectura ni el uso de tarjetas ya emitidas, solo la creación de datos nuevos.
- **Llaves y secreto de webhook por entorno**; modo de prueba de Stripe hasta el piloto.
- **Moneda MXN**; la zona horaria y los impuestos los resuelve Stripe según su configuración.

## Risks / Trade-offs

- [Webhook perdido] → Stripe reintenta; además un job de conciliación consulta el estado de suscripciones activas.
- [Orden de eventos no garantizado] → Aplicar según la marca de tiempo del objeto y no retroceder estados.
- [Bloquear a un cliente que sí pagó] → Estado de gracia y conciliación antes de bloquear.
- [Precios cambian] → Planes como datos; los cambios no requieren desplegar.
