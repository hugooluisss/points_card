# Proposal

## Why

Sin clientes con tarjeta en su Wallet no hay programa. El alta debe ser un escaneo de QR en el establecimiento, con pocos campos, aviso de privacidad y consentimiento de marketing separado, y terminar con el pase guardado. Es también el punto donde nacen las obligaciones de privacidad (LFPDPPP).

## What Changes

- QR público de registro por comercio (y por sucursal si se requiere) que abre una landing con la identidad del negocio.
- Formulario de registro configurable por el comercio, con pocos campos por defecto.
- Aviso de privacidad y términos versionados; consentimiento de marketing separado y opcional, con fecha, versión y origen.
- Creación de cliente aislado por comercio y de su tarjeta (cuenta de lealtad) con identificador opaco.
- Emisión del pase en Apple Wallet o Google Wallet y botón "Agregar a Wallet" según el dispositivo.
- Recuperación de la tarjeta mediante enlace seguro; prevención de duplicados.
- Derechos ARCO: acceso, rectificación, cancelación y revocación de consentimiento.
- Pantallas: landing de registro, configuración de formulario y marca; mockup antes de Angular.

## Capabilities

### New Capabilities
- `customer-onboarding`: QR público, landing y formulario configurable.
- `consent-privacy`: aviso de privacidad, consentimientos y derechos ARCO.
- `wallet-pass-issuance`: emisión y entrega del pase al cliente, y recuperación de la tarjeta.

### Modified Capabilities

Ninguna.

## Impact

- **Código**: módulo público en `apps/api` (sin autenticación de staff, con límite de peticiones), landing en `apps/web`.
- **Datos**: `customers`, `business_customers`, `consents`, `wallet_passes`, `privacy_notices`.
- **Seguridad y legal**: minimización de datos; retención y eliminación definidas.
- **Condición de inicio**: F1 y F2; proveedores de Wallet de F0.

## Non-goals

- Identidad global del cliente entre comercios.
- Envío de campañas (F6).
- Verificación de teléfono o correo por código en la primera versión.
