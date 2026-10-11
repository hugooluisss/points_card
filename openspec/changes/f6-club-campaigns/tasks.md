# Tasks

## 1. Condiciones previas

- [ ] 1.1 Confirmar que las tareas de notificaciones de F0 están completas y que el informe define los canales viables y el plan B, y verificar con el usuario
- [ ] 1.2 Mockups de contenido del club, campañas y reporte de entregas aprobados por el usuario

## 2. Club (club-content)

- [ ] 2.1 Crear `club_content` con migración y verificar que se aplica y revierte
- [ ] 2.2 Implementar publicación de contenido con vigencia y límites de texto y verificar con pruebas
- [ ] 2.3 Sincronizar el contenido a los pases por el outbox y verificar en dispositivo real que se ve al abrir el pase

## 3. Consentimiento (marketing-consent-enforcement)

- [ ] 3.1 Implementar la compuerta de consentimiento en el cálculo de audiencia y verificar con pruebas de revocado y nunca consentido
- [ ] 3.2 Implementar clasificación operativa/promocional de mensajes y verificar que los promocionales pasan por la compuerta
- [ ] 3.3 Implementar auditoría de envíos con audiencia y base de consentimiento y verificar que el owner la ve

## 4. Campañas (campaigns)

- [ ] 4.1 Crear `campaigns` y `campaign_deliveries` con migraciones y verificar que se aplican y revierten
- [ ] 4.2 Implementar borrador, programación y envío por lotes con registro por entrega y verificar con un proveedor simulado
- [ ] 4.3 Implementar el canal de alerta de Wallet confirmado en F0 con control de cuotas y verificar en dispositivo real
- [ ] 4.4 Implementar el canal alternativo opt-in si F0 lo requiere y verificar que sólo llega a quien consintió
- [ ] 4.5 Implementar el reporte de entregas con reintento de fallidos y verificar con un fallo forzado
- [ ] 4.6 Evaluar el volumen y decidir si se introduce Redis, y registrar la decisión
