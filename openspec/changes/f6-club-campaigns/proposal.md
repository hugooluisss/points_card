# Proposal

## Why

El Club de clientes (identidad sin sellos ni puntos) y las campañas son la parte más incierta del producto: su valor depende de qué avisos permiten realmente Apple Wallet y Google Wallet, y eso se valida al final de F0. Esta fase queda condicionada a esa evidencia y a un plan B si las notificaciones no son viables.

## What Changes

- Modalidad `club`: pase de identidad con contenido informativo actualizable por el comercio.
- Gestión de contenido y promociones visibles en el pase.
- Campañas: creación, segmentación básica por consentimiento, programación y registro de entregas.
- Uso de los mecanismos de aviso de cada Wallet que F0 haya confirmado, y canal alternativo opt-in (p. ej. correo) como plan B.
- Aplicación estricta del consentimiento de marketing en todo envío.
- Introducción de Redis y colas solo si el volumen de campañas lo exige.
- Pantallas: contenido del club, campañas y reportes de entrega, con mockup antes de Angular.

## Capabilities

### New Capabilities
- `club-content`: contenido informativo del pase club y su actualización.
- `campaigns`: creación, programación, segmentación y entrega de campañas.
- `marketing-consent-enforcement`: garantía de que solo reciben mensajes promocionales quienes consintieron.

### Modified Capabilities

Ninguna.

## Impact

- **Código**: módulos de contenido y campañas en `apps/api`, pantallas en `apps/web`.
- **Datos**: `club_content`, `campaigns`, `campaign_deliveries`.
- **Dependencias**: resultados de F0 (notificaciones), servicio de correo si se usa plan B, y Redis/BullMQ solo bajo demanda.
- **Condición de inicio**: F3 y la sección de notificaciones de F0 completada.

## Non-goals

- Campañas omnicanal, automatizaciones complejas, IA.
- Geonotificaciones, salvo que F0 las confirme y se pidan.
- Prometer notificaciones que F0 no haya confirmado en dispositivo real.
