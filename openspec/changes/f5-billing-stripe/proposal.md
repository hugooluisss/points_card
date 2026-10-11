# Proposal

## Why

El producto es una suscripción SaaS y se cobrará con Stripe. Los precios y la disposición a pagar aún no están validados, así que el cobro debe ser configurable (planes y límites como datos) y no imponer decisiones comerciales en el código.

## What Changes

- Planes configurables (nombre, precio mensual en MXN, límites de sucursales, tarjetas y staff).
- Suscripción del comercio mediante Stripe Checkout y gestión desde el portal de facturación de Stripe.
- Webhooks de Stripe verificados e idempotentes que actualizan el estado de la suscripción y el `plan` del comercio.
- Periodo de prueba y estados de cobro (prueba, activa, en mora, cancelada) con reglas de acceso.
- Aplicación de límites del plan en las operaciones que crean sucursales, staff y tarjetas.
- Pantallas de plan y facturación, con mockup aprobado antes de Angular.

## Capabilities

### New Capabilities
- `billing-plans`: definición de planes, límites y su aplicación.
- `stripe-subscriptions`: alta de suscripción, portal, webhooks y estados de cobro.

### Modified Capabilities

Ninguna.

## Impact

- **Código**: módulo de facturación en `apps/api`, pantallas en `apps/web`.
- **Datos**: `plans`, `subscriptions`, `billing_events`.
- **Sistemas externos**: cuenta de Stripe (modo prueba primero), endpoint de webhooks público con verificación de firma.
- **Seguridad**: llaves de Stripe en variables de entorno; sin datos de tarjeta en el sistema.
- **Condición de inicio**: F1; puede ejecutarse en paralelo con F2 a F4 si se desea.

## Non-goals

- Facturación fiscal mexicana (CFDI) y facturas personalizadas.
- Cobros por tarjeta emitida o por campaña (uso medido).
- Precios definitivos; los planes son datos editables.
- Cobros a clientes finales del comercio.
