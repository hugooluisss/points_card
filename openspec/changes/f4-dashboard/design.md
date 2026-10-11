# Design

## Context

Lee datos de F2 (ledger) y F3 (clientes y pases). Referencia visual en `config.yaml`. Ver `proposal.md`.

## Goals / Non-Goals

**Goals:**
- Pantallas de lectura rápidas y fieles al ledger.

**Non-Goals:**
- Analítica predictiva, reportes programados, panel global de plataforma.

## Decisions

- **Consultas agregadas directas sobre MySQL** con índices `(business_id, created_at)`; sin tablas de resumen. Alternativa: tabla de agregados; se descarta hasta que el volumen lo pida (añadir si el tiempo de carga supera el límite definido).
- **Módulos de lectura separados** de los de escritura (servicios de consulta), manteniendo controller → service → repository.
- **Gráficas con una librería ligera de gráficos** o SVG propio; colores de la paleta de la referencia y valores accesibles como texto.
- **Exportación CSV en streaming** para no cargar todo en memoria, con auditoría de cada exportación.
- **"Pase guardado" depende de la validación de F0**: si la plataforma no confirma, se reporta "emitido".
- **Pantallas primero como mockup**: inicio, clientes, movimientos, canjes y exportación.

## Risks / Trade-offs

- [Consultas lentas con volumen alto] → Índices, paginación y límite de rango de fechas.
- [Métricas ambiguas] → Definiciones escritas en la especificación y probadas con datos conocidos.
- [Exportación con datos personales] → Solo owner y manager, auditada.
