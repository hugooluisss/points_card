# Tasks

## 1. Monorepo y base

- [ ] 1.1 Crear workspaces `apps/api`, `apps/web`, `packages/shared` y verificar que `npm install` y `npm run build` en la raíz funcionan
- [ ] 1.2 Configurar NestJS con TypeORM, MySQL, variables de entorno validadas y migraciones, y verificar que la API arranca y aplica migraciones vacías
- [ ] 1.3 Crear repositorio base con scoping por `businessId` y verificar con una prueba que una consulta sin contexto falla

## 2. Tenancy (tenancy)

- [ ] 2.1 Crear entidades y migraciones de `businesses` y `branches` y verificar que se aplican y revierten
- [ ] 2.2 Implementar registro de comercio con sucursal por defecto y verificar con prueba de integración
- [ ] 2.3 Implementar suspensión y reactivación de comercio y verificar que un comercio suspendido rechaza operaciones
- [ ] 2.4 Escribir prueba de aislamiento entre dos comercios (lectura y escritura cruzada) y verificar que ambas fallan

## 3. Autenticación y roles (staff-auth)

- [ ] 3.1 Crear `staff_users` y roles y verificar migración y unicidad del correo
- [ ] 3.2 Implementar inicio de sesión, JWT de acceso, refresh rotativo y limitación de intentos, y verificar con pruebas de credenciales válidas e inválidas
- [ ] 3.3 Implementar guard de roles y de sucursal y verificar que un cajero no puede cambiar configuración
- [ ] 3.4 Implementar gestión de staff por el owner y verificar altas, bajas y cambios de rol
- [ ] 3.5 Implementar `audit_logs` con interceptor y verificar que se registran acciones y que no existe operación de edición

## 4. Panel (dashboard-shell)

- [ ] 4.1 Documentar el inventario de pantallas de F1 y verificar que lista login, registro, armazón e inicio
- [ ] 4.2 Crear mockups HTML de las pantallas de F1 y verificar que el usuario los aprueba
- [ ] 4.3 Configurar Tailwind con tokens de diseño y componentes base (sidebar, KPI, tabla, chip) y verificar que se ven en una página de muestra
- [ ] 4.4 Implementar pantallas de acceso con validación en español y guards de ruta, y verificar que una ruta protegida redirige al login
- [ ] 4.5 Implementar el armazón con menú por rol y diseño responsive y verificar con capturas en ancho de escritorio y de teléfono
- [ ] 4.6 Verificación de extremo a extremo: registrar comercio, iniciar sesión, ver el armazón y cerrar sesión
