# Proposal

## Why

Todo el producto depende de lo que Apple Wallet y Google Wallet permiten realmente: tipos de pase, actualización de saldos y, sobre todo, notificaciones promocionales. Hoy esas capacidades son supuestos, no hechos verificados. Construir tenancy, ledger y panel sobre supuestos falsos tiene un costo alto; validar primero cuesta poco. La prioridad inmediata es **registrar la tarjeta en Apple Wallet y Google Wallet y actualizarla desde el backend**; eso es lo que habilita F1. Las notificaciones siguen siendo un requisito del negocio, pero su validación se **difiere al final de esta fase** y solo condiciona F6 (club y campañas).

## What Changes

- Investigación documental de Apple PassKit y Google Wallet API, con fuente, fecha y semáforo de viabilidad por hallazgo.
- Prueba de concepto desechable (spike) que emite pases de **sellos**, **puntos** y **club** en Google Wallet y Apple Wallet, y los actualiza desde un backend.
- Medición en dispositivos reales (Android e iOS) de: tiempo de actualización y qué se muestra al cliente.
- Validación de notificaciones (incluidos los mensajes de Google Wallet) **al final de la fase**, después de confirmar el registro y la actualización de pases.
- Informe de hallazgos que clasifica cada afirmación como **hecho confirmado**, **supuesto** o **hipótesis**, y decide: tipo de pase por modalidad, mecanismo de notificación viable y plan B si no lo hay.
- Estimación de costos y requisitos de cuenta (Apple Developer, issuer de Google, certificados).
- No se entrega código de producción: el spike se descarta o se reescribe en F1+.

## Capabilities

### New Capabilities
- `wallet-pass-validation`: requisitos de la prueba de concepto de emisión y actualización de pases por modalidad (sellos, puntos, club) en ambas plataformas.
- `wallet-notification-validation`: requisitos para verificar, en dispositivo real, qué notificaciones o avisos admite cada Wallet, y para decidir el plan B del Club de clientes.
- `wallet-findings-report`: requisitos del informe de hallazgos (fuentes, fechas, semáforo, decisiones) que condiciona el inicio de F1.

### Modified Capabilities

Ninguna: aún no existen specs en `openspec/specs/`.

## Impact

- **Código**: un directorio de spike (`poc/wallet/`) en el monorepo, fuera de `apps/` y `packages/`. No se reutiliza en producción sin revisión.
- **Documentación**: `docs/wallet-findings.md` como entregable principal.
- **Sistemas externos**: cuenta de Google Wallet issuer (modo demo) y cuenta de Apple Developer con certificado de Pass Type ID.
- **Dependencias**: se evalúan librerías de firma de pases en Node (p. ej. `passkit-generator`) y el SDK/REST de Google Wallet; solo se confirman si pasan la prueba.
- **Decisiones que desbloquea**: tipo de pase por modalidad, viabilidad del Club de clientes, mecanismo de campañas (F6), costo por comercio.

## Non-goals

- Tenancy, autenticación, ledger, panel, Stripe o landing de registro.
- Pantallas de producción: solo lo mínimo para disparar operaciones de prueba.
- Validación comercial (entrevistas, disposición a pagar, piloto).
