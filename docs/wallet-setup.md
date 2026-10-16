# Guía para destrabar la fase F0 (Wallet real)

Estado: las tarjetas de Apple Wallet y Google Wallet son **simuladas** hasta que alguien con acceso cree
las cuentas de abajo. Todo lo de esta guía lo tiene que hacer el titular de las cuentas; yo no necesito
tus contraseñas, solo los datos que se indican al final de cada bloque.

Las fuentes oficiales y la fecha de consulta están en `docs/wallet-findings/google.md` y `apple.md`.
Si algo de la consola ya no coincide con lo descrito aquí, la documentación oficial manda.

## 0. Dispositivos (tarea 1.1)

- Un teléfono **Android** con Google Wallet instalado y una cuenta de Google.
- Un **iPhone** con Apple Wallet.
- Anota modelo, versión del sistema y versión de la app Wallet de cada uno.

## 1. Google Wallet (tarea 1.2) — es la más rápida

1. Crea (o elige) la cuenta de Google que será la titular. Puede ser una cuenta solo para este proyecto.
2. Da de alta una cuenta de **Issuer** en la Google Pay & Wallet Console
   (https://developers.google.com/wallet/generic/getting-started/issuer-onboarding).
3. En Google Cloud, en un proyecto nuevo, habilita la **Google Wallet API** y crea una **cuenta de servicio**
   con una llave JSON.
4. En la consola de Wallet, registra como **cuenta de prueba** la cuenta de Google del teléfono Android.
   Mientras la cuenta esté en modo demo, solo esas cuentas pueden guardar pases, y llevan la etiqueta
   `[TEST ONLY]`.

Qué me pasas:

- El **Issuer ID** (es un número, no es secreto).
- La llave JSON de la cuenta de servicio, guardada en `poc/wallet/certs/` (esa carpeta está ignorada por git).
  Nunca la pegues en el chat ni la subas al repositorio.

## 2. Apple Wallet (tarea 1.3)

1. Inscribe la cuenta en el **Apple Developer Program** (cuesta 99 USD al año, según la página oficial de inscripción).
2. En _Certificates, Identifiers & Profiles_ registra un **Pass Type ID** (por ejemplo `pass.com.tuempresa.pointscard`).
3. Crea el **certificado de Pass Type ID** (pide un CSR) y expórtalo con su llave privada (`.p12`).
4. Anota el **Team ID** de la cuenta.

Qué me pasas:

- El Pass Type ID y el Team ID (no son secretos).
- El `.p12` y su contraseña, guardados en `poc/wallet/certs/` y en una variable de entorno local. Nunca en el chat.

Importante: para que Apple actualice pases ya guardados, el servidor necesita una URL pública con HTTPS.
Ya existe: `https://agents-dev.hugosantiago.dev/points-card-api/`.

## 3. Qué se prueba con eso (tareas 3.x del cambio `f0-wallet-validation`)

1. Emitir un pase de sellos, uno de puntos y uno de club en cada plataforma y guardarlos en el teléfono.
2. Cambiar el saldo desde el backend y medir cuánto tarda en verse en el pase.
3. Confirmar que el código del pase contiene solo un identificador opaco y que se lee con la cámara.
4. Probar la actualización con el teléfono sin conexión.
5. Al final, las notificaciones: Google (`TEXT_AND_NOTIFY`, aviso por cambio de campo, avisos por ubicación) y
   Apple (`changeMessage`). Su resultado decide qué puede prometer el Club de clientes en F6.

Nada de lo anterior toca el dinero ni los datos de clientes reales: todo corre contra el entorno de desarrollo.
