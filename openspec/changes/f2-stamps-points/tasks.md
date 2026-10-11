# Tasks

## 1. Programas y recompensas (loyalty-programs)

- [x] 1.1 Crear entidades y migraciones de `programs` y `rewards` y verificar que se aplican y revierten
- [x] 1.2 Implementar CRUD de programas con validación y regla de un programa activo por modalidad, y verificar con pruebas
- [x] 1.3 Implementar CRUD de recompensas y verificar que un cambio de regla no altera saldos existentes
- [ ] 1.4 Mockups de configuración de programa y recompensas aprobados por el usuario y pantallas Angular implementadas con captura de verificación

## 2. Ledger (loyalty-ledger)

- [x] 2.1 Crear `loyalty_accounts`, `loyalty_transactions` y `redemptions` con UNIQUE de idempotency key y verificar migraciones
- [x] 2.2 Implementar estrategias `stamps` y `points` y verificar con pruebas de acumulación y meta alcanzada
- [x] 2.3 Implementar acumulación y canje con bloqueo de fila y verificar con prueba concurrente que no hay doble canje
- [x] 2.4 Implementar reversos y ajustes como transacciones nuevas y verificar que el original no cambia
- [x] 2.5 Verificar idempotencia con una prueba que repite la misma petición y comprueba una sola transacción

## 3. Antifraude (fraud-controls)

- [x] 3.1 Implementar intervalo mínimo y topes por tarjeta y empleado y verificar con pruebas de rechazo
- [x] 3.2 Implementar límite de monto por operación y reverso con motivo obligatorio y verificar con pruebas
- [x] 3.3 Implementar marca de actividad anómala por empleado y verificar que el owner la ve

## 4. Escáner (staff-scanner)

- [ ] 4.1 Mockup del escáner aprobado por el usuario
- [ ] 4.2 Implementar lectura por cámara con entrada manual de respaldo y verificar en un teléfono real
- [ ] 4.3 Implementar flujo de sello, puntos por monto y canje con confirmación y verificar de extremo a extremo
- [ ] 4.4 Implementar reintento con la misma idempotency key y verificar cortando la conexión

## 5. Sincronización con Wallet (wallet-sync)

- [x] 5.1 Crear `wallet_sync_jobs` y encolar en la misma transacción del movimiento, y verificar con prueba que existe un job por cambio
- [x] 5.2 Implementar worker con reintentos y estado final por cuenta y verificar con un proveedor simulado que falla y se recupera
- [ ] 5.3 Mostrar y reintentar jobs fallidos en el panel y verificar con un job forzado a fallar
- [ ] 5.4 Verificar en dispositivo real que un sello registrado por el escáner se ve en el pase
