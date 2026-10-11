# Design

## Context

Usa tenancy y auth de F1, el ledger de F2 y los proveedores de Wallet validados en F0. Ver `proposal.md`.

## Goals / Non-Goals

**Goals:**
- Alta de cliente en pocos pasos, con evidencia de consentimiento y pase guardado.

**Non-Goals:**
- Identidad global, verificación por código, campañas.

## Decisions

- **Cliente aislado por comercio** (`customers` ligado a `business_id`); `business_customers` solo si más adelante se comparte identidad. En F3 se mantiene una sola tabla por simplicidad. Alternativa: identidad global; se descarta por base jurídica y riesgo.
- **Endpoints públicos separados** del módulo autenticado, con límite de peticiones y desafío anti-bots.
- **Aviso de privacidad versionado** en `privacy_notices`; cada consentimiento referencia la versión. Texto legal lo aporta el comercio con una plantilla base revisada por un abogado.
- **Detección de dispositivo por user agent** para elegir el botón de Wallet, con ambos botones como alternativa manual.
- **Recuperación por enlace de un solo uso con expiración** enviado al contacto registrado; sin contraseñas de cliente.
- **Eliminación por anonimización** de datos personales conservando movimientos agregados sin identificar a la persona.
- **Landing en Angular** con tema por comercio (logo y colores) servido por ruta pública con el identificador del comercio.

## Risks / Trade-offs

- [Spam de registros] → Límite de peticiones y desafío anti-bots.
- [Duplicados por datos distintos] → Aceptado; coincidencia solo por contacto exacto.
- [Enlace de recuperación interceptado] → Un solo uso, expiración corta y el pase anterior sigue vigente hasta deshabilitarlo.
- [Texto legal inadecuado] → Plantilla revisada por un profesional antes de producción.
