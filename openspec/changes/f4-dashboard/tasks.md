# Tasks

## 1. Diseño

- [ ] 1.1 Inventario de pantallas de F4 documentado y mockups de inicio, clientes, movimientos y canjes aprobados por el usuario

## 2. Métricas (business-metrics)

- [x] 2.1 Documentar las definiciones de métricas y verificar que cada una tiene un caso con datos conocidos
- [x] 2.2 Implementar el cálculo con consultas agregadas e índices y verificar con una prueba con datos sembrados
- [ ] 2.3 Verificar el rendimiento con el volumen de referencia y registrar el tiempo de carga

## 3. Inicio (admin-dashboard)

- [x] 3.1 Implementar el endpoint de KPIs con variación contra el periodo anterior y verificar con pruebas
- [ ] 3.2 Implementar la pantalla de inicio con tarjetas, gráfica y actividad reciente y verificar con capturas en escritorio y teléfono
- [x] 3.3 Verificar el alcance por sucursal y rol con una prueba de gerente restringido

## 4. Clientes y movimientos (customer-management)

- [x] 4.1 Implementar listado, búsqueda y detalle de clientes y verificar el aislamiento entre comercios
- [x] 4.2 Implementar listados de movimientos y canjes con filtros y verificar totales
- [x] 4.3 Implementar exportación CSV en streaming con auditoría y verificar que un cajero no puede exportar
- [x] 4.4 Implementar vista de pases fallidos con reintento y verificar con un job fallido

## 5. Verificación

- [ ] 5.1 Recorrido de extremo a extremo: registrar clientes, acumular, canjear y comprobar que el inicio refleja las cifras
