# Tasks

## 1. Preparación

- [ ] 1.1 Registrar dispositivos de prueba (modelo y versión de SO y de la app Wallet) en `docs/wallet-findings.md` y verificar que haya al menos un Android y un iPhone
- [ ] 1.2 Crear cuenta de issuer de Google Wallet en modo demo, proyecto de Google Cloud con Wallet API y cuenta de servicio, y verificar que una cuenta de prueba puede guardar un pase
- [ ] 1.3 Crear cuenta de Apple Developer, Pass Type ID y certificado de firma, y verificar que el certificado carga en el spike sin exponerlo en git
- [x] 1.4 Crear el esqueleto `poc/wallet/` (proyecto NestJS mínimo, `.gitignore` de secretos y `evidence/`) y verificar que arranca con un endpoint de salud

## 2. Investigación documental (wallet-findings-report)

- [x] 2.1 Revisar documentación oficial de Google Wallet (tipos de pase, emisión, actualización, mensajes y notificaciones, cuotas) y verificar que cada hallazgo tiene URL y fecha en el informe
- [x] 2.2 Revisar documentación oficial de Apple Wallet/PassKit (formato, firma, registro de dispositivos, actualizaciones, `changeMessage`, políticas) y verificar que cada hallazgo tiene URL y fecha en el informe
- [ ] 2.3 Rellenar costos, cuentas y revisiones requeridas para producción y verificar que lo desconocido está marcado como tal

## 3. Registro de la tarjeta en Wallet (wallet-pass-validation)

- [x] 3.1 Definir la interfaz de proveedor (emitir, actualizar, notificar) y verificar que ambos proveedores la implementan
- [ ] 3.2 Emitir pases de sellos, puntos y club en Google Wallet y verificar con captura en dispositivo que los tres se guardan
- [ ] 3.3 Emitir pases de sellos, puntos y club en Apple Wallet y verificar con captura en dispositivo que los tres se guardan
- [ ] 3.4 Confirmar que el código de cada pase contiene solo un identificador opaco y verificar que un navegador móvil lo lee con la cámara
- [ ] 3.5 Actualizar sellos y puntos desde el backend en ambas plataformas y verificar que el tiempo hasta el cambio visible queda registrado
- [ ] 3.6 Probar la actualización con el dispositivo sin conexión y verificar que el comportamiento observado queda registrado
- [ ] 3.7 Registrar cómo se muestra el progreso de sellos (elementos y máximo M) y verificar con capturas de N de M
- [ ] 3.8 Actualizar el texto informativo del pase club y verificar si la plataforma lo hace visible al cliente

## 4. Informe y decisión para F1 (wallet-findings-report)

- [ ] 4.1 Completar `docs/wallet-findings.md` con la clasificación hecho/supuesto/hipótesis de pases y verificar que ningún hecho carece de fuente o evidencia
- [ ] 4.2 Asignar semáforo de viabilidad a cada capacidad de pase y el tipo de pase por modalidad y plataforma, y verificar que no queda ninguna celda vacía
- [ ] 4.3 Redactar la decisión para F1 (go, go con cambios, stop) indicando que las notificaciones están pendientes, y verificar que el usuario la registra por escrito

## 5. Notificaciones y mensajes (diferido, wallet-notification-validation)

- [ ] 5.1 Probar cada mecanismo de aviso de Apple Wallet en dispositivo real y verificar que el resultado, el retraso y la captura están registrados
- [ ] 5.2 Registrar restricciones documentadas (elegibilidad, cuotas, países, aprobaciones) con fuente y fecha y verificar que lo no confirmado se marca como supuesto
- [ ] 5.3 Clasificar cada mensaje probado como operativo o promocional y verificar que los promocionales indican opt-in separado
- [ ] 5.4 Probar cada mecanismo de mensajes y avisos de Google Wallet (`TEXT_AND_NOTIFY`, aviso por cambio de campo, geoavisos) en dispositivo real y verificar que el resultado, el retraso y la captura están registrados
- [ ] 5.5 Definir el plan B del Club de clientes y verificar que el informe lista el valor que se mantiene y al menos un canal alternativo
- [ ] 5.6 Actualizar el informe con los resultados de notificaciones, registrar la decisión para F6 y, si implica cambios de alcance, actualizar `openspec/config.yaml`
