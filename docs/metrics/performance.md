# Rendimiento del dashboard F4

## Supuestos y criterio

La especificación no define volumen ni límite. Se asumió un negocio con 10,000 clientes, 20,000 cuentas de lealtad/pases y 200,000 movimientos de los últimos 12 meses (60% acumulaciones, 20% canjes y 20% ajustes), dos sucursales y tres personas de staff. Cada timestamp de siembra se generó desde el `Clock` fijado al 15 de octubre de 2026 y se insertó explícitamente en `points_card_test`. El umbral para endpoints interactivos es 1,000 ms.

Cada endpoint se calentó una vez y se midió diez veces mediante HTTP autenticado. La mediana de diez muestras es el promedio de las posiciones quinta y sexta. Para `/exports/movements.csv`, que entrega 200,000 filas, se mide el tiempo hasta el primer byte del cuerpo: el tiempo de transferencia completa no es un límite interactivo porque depende del volumen transferido y de la velocidad del cliente.

## Resultados HTTP

| Endpoint                                | Mín. (ms) | Mediana (ms) | Máx. (ms) | Criterio                |
| --------------------------------------- | --------: | -----------: | --------: | ----------------------- |
| `GET /dashboard/summary?period=90d`     |       305 |          307 |       315 | Cumple                  |
| `GET /metrics?period=90d`               |       580 |          585 |       626 | Cumple                  |
| `GET /branches`                         |       3.1 |          3.3 |       3.4 | Cumple                  |
| `GET /staff/options`                    |       2.9 |          3.0 |       3.5 | Cumple                  |
| `GET /movements` (12 meses, página 1)   |       388 |          395 |       401 | Cumple                  |
| `GET /redemptions` (12 meses, página 1) |        66 |           67 |        69 | Cumple                  |
| `GET /exports/customers.csv`            |       124 |          128 |       158 | Cumple                  |
| `GET /exports/movements.csv` (TTFB)     |       6.3 |          6.9 |       7.5 | Cumple: máx. < 1,000 ms |

El tiempo total de descarga del CSV de movimientos medido en la corrida de referencia anterior fue 4,180–4,284 ms. No se compara con el umbral interactivo. El cliente HTTP de la prueba lee el cuerpo por streaming y registra el primer evento `data`, sin acumular el CSV.

## Diagnóstico y cambios

La muestra anterior de resumen tenía mediana de 943 ms y un pico de 2,045 ms. El pico no era un efecto de buffer pool frío: `EXPLAIN ANALYZE` reprodujo 2,264 ms en la consulta de actividad reciente. El plan elegía el índice de idempotencia, recorría los 200,000 movimientos del negocio, unía 49,320 filas del periodo y ordenaba para devolver diez. Se forzó el índice de negocio/fecha, que permite recorrido inverso y aplicar el límite antes de las uniones; el plan posterior tarda aproximadamente 1–3 ms. El coste era trabajo real de la consulta, no calentamiento de caché.

El resumen también repetía trabajo de operaciones para los periodos actual y anterior y agrupaba ambos en una sola ventana de 180 días. Ahora consulta en paralelo el periodo actual agrupado por timestamp (para KPI y serie diaria) y el conteo del periodo anterior. Conserva los mismos rangos semiabiertos, tipos de operación, exclusión de reversas y conversión de fecha de negocio. Los conteos de clientes y pases fuerzan sus índices compuestos existentes por negocio/fecha; los conteos de canjes usan el índice por negocio/fecha y evitan unir el ledger cuando no hay filtro de sucursal.

`/metrics` inicialmente tuvo un máximo de 1,036 ms. Sus consultas de saldo inicial y movimientos del periodo leían las 200,000 entradas del índice ordenado por cuenta; la segunda además ordenaba 49,320 filas. La nueva migración `1760000016000-AddDashboardEligibilityPeriodIndex` agrega un índice cubriente por negocio, fecha, cuenta, programa, sucursal e importe. El plan de saldo inicial ahora hace un rango cubriente hasta la fecha de inicio (150,132 filas) y agrega por cuenta en aproximadamente 400 ms; el del periodo lee las 49,320 filas del rango, también de forma cubriente, y ordena en aproximadamente 171 ms. La lógica de cruces de saldo permanece igual. El `down` elimina el índice.

## EXPLAIN ANALYZE del resumen

Todos los SQL de `/dashboard/summary?period=90d` se analizaron por separado con `EXPLAIN ANALYZE`; no hubo escaneos completos de tabla después del cambio.

| Consulta                            | Tiempo observado (ms) | Plan                                                                                                                              |
| ----------------------------------- | --------------------: | --------------------------------------------------------------------------------------------------------------------------------- |
| Clientes del periodo actual         |                     9 | Rango cubriente en `ix_customers_business_created`                                                                                |
| Pases del periodo actual            |                    11 | Rango cubriente en `ix_wallet_passes_business_created`                                                                            |
| Operaciones actuales y serie diaria |                   202 | Rango en `ix_transactions_metrics_period`; anti-join con búsquedas en `ix_transactions_reversal_business`; agregado por timestamp |
| Operaciones del periodo anterior    |                   273 | Rango en `ix_transactions_metrics_period`; anti-join con búsquedas en `ix_transactions_reversal_business`                         |
| Canjes actuales                     |                   136 | Rango en `ix_redemptions_business_created`, filtro de estado                                                                      |
| Clientes del periodo anterior       |                     5 | Rango cubriente en `ix_customers_business_created`                                                                                |
| Pases del periodo anterior          |                     9 | Rango cubriente en `ix_wallet_passes_business_created`                                                                            |
| Canjes del periodo anterior         |                    53 | Rango en `ix_redemptions_business_created`, filtro de estado                                                                      |
| Actividad reciente (10 filas)       |                   3.5 | Recorrido inverso de `ix_transactions_business_created`, lookups por clave primaria y límite de diez                              |

Los tiempos de cada SQL son diagnósticos individuales; el tiempo HTTP incluye concurrencia, lógica de aplicación y serialización.

## Streaming del CSV

`DashboardController` entrega un `StreamableFile` construido desde un `Readable`. El repositorio abre un `QueryRunner`, usa `queryRunner.stream()`, emite la cabecera y recorre filas con `for await`, convirtiendo cada fila a CSV antes de continuar. Libera la conexión en `finally`. No carga el conjunto completo de 200,000 movimientos en memoria de Node. El plan de exportación usa un rango de `ix_transactions_business_created` y lookups por clave primaria para dimensiones.

El criterio de exportación es TTFB < 1,000 ms, no duración de descarga completa: el TTFB máximo fue 7.5 ms y la transferencia completa tarda aproximadamente 4.2 s para este volumen.

## Verificación

La prueba de migraciones revirtió todas las migraciones y luego las aplicó de nuevo, incluida la migración nueva del índice; pasó. La suite completa terminó con 42/42 suites y 82/82 pruebas aprobadas. Los mensajes de error temporal de billing y reintentos de sincronización aparecen en pruebas que los provocan y no causaron fallos. `npx tsc --noEmit` también pasó.

F4 2.3 cumple: todos los máximos de endpoints interactivos son menores a 1,000 ms y el TTFB máximo de la exportación de movimientos también es menor a 1,000 ms.
