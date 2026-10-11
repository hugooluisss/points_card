# Tasks

## 1. Datos y privacidad (consent-privacy)

- [ ] 1.1 Crear `customers`, `consents`, `privacy_notices` y `wallet_passes` con migraciones y verificar que se aplican y revierten
- [ ] 1.2 Implementar aviso de privacidad versionado y registro de consentimiento y verificar con pruebas que guardan versión y fecha
- [ ] 1.3 Implementar consentimiento de marketing separado y revocación y verificar que la revocación excluye al cliente
- [ ] 1.4 Implementar acceso y cancelación ARCO con anonimización y verificar con una prueba que los datos personales desaparecen
- [ ] 1.5 Documentar retención de datos y verificar que lo revisa el usuario

## 2. Registro (customer-onboarding)

- [ ] 2.1 Generar el QR público por comercio y verificar que abre la landing y no crea transacciones
- [ ] 2.2 Implementar configuración del formulario por comercio con mínimos por defecto y verificar con pruebas
- [ ] 2.3 Implementar el registro público con límite de peticiones y desafío anti-bots y verificar con una ráfaga de peticiones
- [ ] 2.4 Implementar prevención de duplicados y verificar que un segundo registro devuelve la tarjeta existente
- [ ] 2.5 Mockup de landing y configuración aprobado por el usuario, y pantallas Angular con captura en teléfono

## 3. Emisión del pase (wallet-pass-issuance)

- [ ] 3.1 Emitir el pase al terminar el registro con el proveedor correspondiente y verificar en dispositivo real
- [ ] 3.2 Implementar selección de botón por dispositivo con alternativa manual y verificar en Android, iPhone y un navegador de escritorio
- [ ] 3.3 Implementar recuperación por enlace de un solo uso y verificar expiración y reutilización rechazada
- [ ] 3.4 Implementar deshabilitar y reemitir pase conservando saldo y verificar que el código anterior deja de funcionar
- [ ] 3.5 Verificación de extremo a extremo: escanear QR, registrarse, guardar el pase y acumular un sello con el escáner
