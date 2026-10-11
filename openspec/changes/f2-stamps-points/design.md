# Design

## Context

Depende de F1 (tenancy, auth, repositorio base) y de la decisión de F0 sobre tipos de pase. Ver `proposal.md`.

## Goals / Non-Goals

**Goals:**
- Un solo motor de ledger con estrategias `stamps` y `points`.
- Operaciones seguras ante reintentos y concurrencia.

**Non-Goals:**
- Reglas promocionales avanzadas, POS, QR rotativo.

## Decisions

- **Ledger inmutable, saldo en `loyalty_accounts` como caché derivada.** Se actualiza en la misma transacción que el movimiento; se puede reconstruir sumando. Alternativa: calcular siempre desde el ledger; se descarta por costo de lectura en el escáner.
- **Concurrencia con bloqueo de fila.** `SELECT ... FOR UPDATE` sobre la cuenta dentro de la transacción. Alternativa: versionado optimista; se descarta por reintentos en canjes simultáneos.
- **Idempotency key única por comercio** en `loyalty_transactions`; una restricción UNIQUE garantiza la unicidad aunque falle la lógica.
- **Estrategia por modalidad** (`StampsStrategy`, `PointsStrategy`) detrás de una interfaz, porque son dos implementaciones reales con reglas distintas.
- **Outbox `wallet_sync_jobs` en MySQL**, procesada por un worker con `@nestjs/schedule`; sin Redis hasta F6. Un job por cuenta con el estado final.
- **Antifraude por configuración del programa**: intervalo mínimo, topes por tarjeta/empleado/día. El código estático se acepta como riesgo conocido; QR rotativo queda fuera.
- **Escáner con API de cámara del navegador** y detector de códigos; entrada manual como respaldo.

## Risks / Trade-offs

- [QR capturado y compartido] → Intervalo mínimo, topes y reverso; revisar anomalías por empleado.
- [Worker de sync se detiene] → Jobs fallidos visibles y reintento manual.
- [Bloqueos de fila bajo carga] → Transacciones cortas; volumen esperado por comercio es bajo.
- [Escaneo falla con poca luz] → Entrada manual del código.
