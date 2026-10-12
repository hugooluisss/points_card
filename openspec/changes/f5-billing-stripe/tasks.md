# Tasks

## 1. Preparación

- [ ] 1.1 Crear cuenta de Stripe en modo de prueba, productos y precios mensuales en MXN, y verificar que los identificadores se guardan en variables de entorno o en `plans`
- [ ] 1.2 Mockups de plan y facturación aprobados por el usuario

## 2. Planes (billing-plans)

- [x] 2.1 Crear `plans` y `subscriptions` con migraciones y verificar que se aplican y revierten
- [x] 2.2 Implementar plan de prueba por defecto al registrar un comercio y verificar con prueba
- [ ] 2.3 Implementar servicio de límites e integrarlo en altas de sucursales, staff y tarjetas, y verificar que se rechaza al exceder
- [ ] 2.4 Implementar pantalla de plan y uso y verificar con captura

## 3. Stripe (stripe-subscriptions)

- [ ] 3.1 Implementar creación de sesión de Checkout y retorno y verificar un pago de prueba de extremo a extremo
- [x] 3.2 Implementar acceso al portal de facturación y verificar que solo abre el cliente del comercio
- [x] 3.3 Implementar el endpoint de webhooks con verificación de firma y `billing_events` idempotente, y verificar con firma inválida y evento duplicado
- [x] 3.4 Implementar la transición de estados (prueba, activa, en mora, cancelada) y verificar con eventos simulados de Stripe CLI
- [x] 3.5 Implementar periodo de gracia y bloqueo de creación de datos y verificar que lectura y tarjetas existentes siguen funcionando
- [x] 3.6 Implementar job de conciliación y verificar que corrige un estado desalineado
- [x] 3.7 Verificar reactivación dentro del periodo de retención
