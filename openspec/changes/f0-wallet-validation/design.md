# Design

## Context

Repo vacío; el spike es la primera pieza de código. Ver `proposal.md` para la motivación. El stack final (NestJS, TypeORM, MySQL, Angular) se fija en `config.yaml`, pero esta fase no necesita base de datos ni frontend: lo que se mide es el comportamiento de Wallet.

## Goals / Non-Goals

**Goals:**
- Obtener evidencia en dispositivo real con el mínimo código posible.
- Dejar una interfaz de proveedor (emitir, actualizar, notificar) que el producto pueda adoptar si el spike funciona.

**Non-Goals:**
- Persistencia, multi-tenant, autenticación, UI de producción.
- Soportar cada tipo de pase de las plataformas: solo los candidatos por modalidad.

## Decisions

- **Spike en `poc/wallet/`, desechable.** Un proyecto NestJS mínimo, con un script/endpoint por operación (emitir, actualizar, notificar). Alternativa: scripts sueltos sin Nest; se descarta porque la interfaz de proveedor se quiere probar con la misma forma que tendrá en `apps/api`.
- **Estado en memoria o archivo JSON.** Un archivo local con `cardId`, plataforma y objeto de pase. Alternativa: MySQL; se descarta, no aporta evidencia sobre Wallet y añade preparación.
- **Registro de tarjeta primero, notificaciones al final.** El objetivo inmediato es poder guardar y actualizar el pase en el Wallet; los mensajes y notificaciones (Google `TEXT_AND_NOTIFY`, geoavisos, `changeMessage`) se prueban al final. Así F1 no espera una validación que solo afecta a F6. Alternativa: probar todo por plataforma; se descarta porque retrasa el hito que sí desbloquea el producto.
- **Primero Google Wallet, después Apple.** Google no exige hardware propio ni certificado de pago para empezar en modo demo; Apple requiere cuenta de desarrollador y certificado. Ambos son necesarios para la decisión final, pero el orden reduce el tiempo hasta el primer resultado.
- **Candidatos por modalidad, a confirmar con documentación:** sellos y puntos con el tipo de pase de lealtad en ambas plataformas; club con el pase de lealtad sin saldo o con un tipo genérico. Es hipótesis hasta que el informe lo confirme.
- **Identificador de tarjeta opaco.** El código del pase es un UUID/token sin datos personales ni saldo; el backend lo resuelve. Esto es lo que se usará en producción para el escáner del empleado.
- **Evidencia obligatoria.** Cada prueba guarda captura/video y hora en `poc/wallet/evidence/`. Sin evidencia no es hecho confirmado.
- **Secretos fuera del repo.** Certificados y credenciales de servicio van en variables de entorno o un directorio ignorado por git.

## Risks / Trade-offs

- [Falta de dispositivo iOS o Android] → Conseguir ambos antes de empezar; sin uno de ellos esa plataforma se marca como no verificada.
- [Cuenta de Google en modo demo limita quién puede guardar pases] → Registrar las cuentas de prueba en la consola; documentar los pasos para pasar a producción.
- [Las notificaciones requieren aprobación o elegibilidad no obtenible] → Se registra como rojo/amarillo y se activa el plan B del Club.
- [El spike se convierte en código de producción por inercia] → Vive fuera de `apps/` y `packages/`; F1 lo reescribe o lo adopta tras revisión.
- [Los resultados dependen de la versión del SO o de la app Wallet] → Anotar versiones del dispositivo y de la app en cada evidencia.

## Open Questions

- ¿Qué dispositivos físicos Android e iOS están disponibles para las pruebas? (no cambia los specs, sí el calendario).
