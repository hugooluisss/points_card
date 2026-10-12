# Definiciones de métricas

Los periodos de 7, 30 y 90 días usan días calendario en la zona horaria del negocio e incluyen hoy; el periodo anterior contiene los mismos días consecutivos inmediatamente anteriores.

- **Altas (registrations):** clientes creados dentro del periodo seleccionado.
- **Pases emitidos (issuedPasses):** pases de Wallet emitidos dentro del periodo. No confirma que el cliente los haya guardado; por eso `savedPasses` es `null` y no está disponible.
- **Clientes activos (activeCustomers):** clientes con al menos una operación válida dentro del periodo.
- **Tasa de visitas repetidas (repeatVisitRate):** clientes con dos o más acumulaciones válidas dividido entre clientes con al menos una operación válida. Si no hay clientes activos, vale cero.
- **Tasa de canje (redemptionRate):** canjes completados y no revertidos dividido entre las veces que el saldo pasó de estar por debajo a alcanzar el costo de la recompensa activa más barata de su programa. Si no hubo oportunidades, vale cero.

Una operación es válida si es acumulación, canje o ajuste y no tiene una fila que la revierta. Las filas de reversión tampoco cuentan como operación válida.

La tasa de canje usa el catálogo actual de recompensas para reconstruir oportunidades históricas; un cambio posterior en las recompensas puede cambiar ese denominador.

El esquema no guarda sucursal en el alta del cliente ni en la emisión del pase. Al consultar por sucursal, esas dos métricas se atribuyen usando la actividad del cliente o cuenta en esa sucursal.
