# Proposal

## Why

El valor central del producto es acumular sellos o puntos de forma confiable y reflejarlos en el pase. Este núcleo debe ser un solo motor (ledger) con dos estrategias, auditable, idempotente y resistente al fraude, porque el backend es la fuente de verdad y Wallet solo lo muestra.

## What Changes

- Configuración de programas por comercio: modalidad `stamps` o `points`, reglas de acumulación, meta y vigencia.
- Catálogo de recompensas y canjes.
- Ledger de transacciones (acumulación, canje, ajuste, reverso) con idempotency key; saldo derivado.
- Controles antifraude: intervalo mínimo entre operaciones por tarjeta, topes por empleado y por día, y reverso con motivo.
- Escáner web para empleados que lee el código de la tarjeta y registra la operación.
- Sincronización del saldo al pase mediante una tabla outbox con reintentos (sin Redis).
- Pantallas: configuración de programa, recompensas y escáner, diseñadas como mockup antes de Angular.

## Capabilities

### New Capabilities
- `loyalty-programs`: configuración de programas, reglas y recompensas.
- `loyalty-ledger`: transacciones, saldos, canjes e idempotencia.
- `fraud-controls`: límites y reversos para sellos y puntos.
- `staff-scanner`: lector web del empleado y registro de operaciones.
- `wallet-sync`: actualización del pase a partir de cambios de saldo, con reintentos.

### Modified Capabilities

Ninguna.

## Impact

- **Código**: módulos de `apps/api` y pantallas de `apps/web`; tipos en `packages/shared`.
- **Datos**: `programs`, `rewards`, `loyalty_accounts`, `loyalty_transactions`, `redemptions`, `wallet_sync_jobs`.
- **Dependencias**: lector de códigos desde la cámara del navegador; proveedores de Wallet de F0.
- **Condición de inicio**: F1 completo y decisión de F0 sobre tipos de pase.

## Non-goals

- Integración con POS o captura de ticket.
- Registro de clientes y emisión inicial de pases (F3).
- QR rotativo; se evalúa si el fraude real lo exige.
- Multimoneda y reglas de puntos complejas (promociones, multiplicadores por horario).
