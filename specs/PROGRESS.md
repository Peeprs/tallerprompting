# PROGRESS — Portal de Transporte

Seguimiento por módulo. Cada fila indica si la tarea se completó con éxito, qué falta o qué error persiste.
> **Nota:** la entrada común está en `AGENTS.md`; las reglas, el catálogo técnico y la orquestación viven en `specs/agentes/AGENTS.md`, `specs/skills/SKILLS.md` y `specs/arquitectura/ORQUESTADOR.md`. Este archivo resume el avance funcional y puede quedar desfasado.

## Usuarios
- Registro con BCrypt y roles por defecto: éxito.
- Asignación de roles por ADMINISTRADOR (`/roles/assign`): éxito.
- Falta: listado paginado de usuarios (solo existe búsqueda por fragmento).

## Roles
- Catálogo dinámico de roles con alta, edición y borrado: éxito.
- Guard en UI + `@PreAuthorize` en servidor: éxito.
- Falta: nada bloqueante.

## Taller
- Registro de Taller Mecánico (nombre, RFC, email, foto DragAndDrop 15 MB png/jpg/jpeg/webp, dirección calle/número/colonia/CP/estado/municipio): éxito.
- Validaciones y regex espejo backend/frontend, duplicado por RFC y correo (409): éxito.
- Tabla Foto | Nombre | Correo | Estatus | Acciones editar y eliminar: éxito.
- Catálogo global `estatus` (ACTIVO, BAJA) en tabla propia reutilizable: éxito. El alta no muestra estatus (servidor asigna ACTIVO); al editar aparece el dropdown alimentado por `GET /api/v1/estatus` y se envía el `statusId` traído de BD, nunca texto libre.
- Dirección por CP con Postali (`postali.app`, sin key, CORS, timeout 8 s y caché en memoria): éxito; proveedores previos (postalia.com.mx, idoo.dev, sepomex.kurenn.dev) quedaron muertos y descartados.
- Modales registro exitoso, no se pudo registrar y sin permiso por rol (403, solo ADMINISTRADOR muta): éxito.
- Paginación validada (10 por página, `400` fuera de rango) con caché `workshopRows` y evicción al mutar: éxito.
- Migraciones V4–V9 aplicadas y verificadas en espejo 8083. Pendiente: reinicio del backend del usuario (8082).

## Login
- Sesión por cookie `HttpOnly` + filtro por `token_hash`: éxito.
- Persistencia tras recarga: `/api/v1/auth/session` usa consulta explícita por hash que carga usuario y filtra sesiones revocadas/vencidas; login confirma la restauración antes de abrir el área privada. Compilación correcta; prueba manual con la instancia del usuario pendiente.
- Sin cuenta no se renderiza el área privada (guard en `App`/`Workspace`): éxito.

## Registro
- Formulario de visitante con reglas de contraseña: éxito.
- Falta: confirmación por correo (fuera de alcance).

## Forget Password
- Solicitud y restablecimiento con token de un solo uso: éxito.
- Falta: envío real de correo (solo `devToken` en desarrollo).

## Vehículos
- CRUD con VIN de 17 caracteres, placa única, kilometraje opcional y paginación en BD ordenada por placa: implementado; aceptación manual pendiente.
- Hasta 3 fotos PNG/JPG/WebP de 15 MB por imagen, persistidas en `vehicle_photo`; fotos nuevas reemplazan las previas al editar: implementado; migración V10 y aceptación pendientes en instancia del usuario.
- Asociación desde la tabla de vehículos con selector de clientes activos, estado visual y confirmación al desvincular; mantiene el historial y permite una sola asignación activa por vehículo: implementado; aceptación manual pendiente.

## Clientes
- Alta con nombre normalizado a minúsculas, contactos principales + N secundarios (Nombre Completo | Teléfono Celular, cifrado AES-GCM): éxito.
- Edición sin cambiar el id, con trazabilidad en `client_history` (CREADO, ACTUALIZADO, BAJA, REACTIVADO, VEHICULO_ASOCIADO, VEHICULO_DESVINCULADO): éxito.
- Baja/reactivar por catálogo `estatus` (sin acción Eliminar; los clientes con baja siguen visibles con botón reactivar): éxito.
- Asociación de vehículos desde el modal del cliente: éxito.
- Paginación validada + caché `clientRows`: éxito; verificado en espejo (10/10/1 con 21 registros, `400` en page=0 y size=99).
- Flujo: cliente → taller ACTIVO → vehículo; ver `docs/architecture/clientes-taller.html`.
- Pendiente: reinicio del backend del usuario (8082) para aplicar V6–V9.

## Paginación (transversal)
- Página base 1, default 10, tope 50; `400` fuera de rango: éxito en clientes, vehículos y talleres.
- `Pager` compartido « ‹ 1 2 3 › » con páginas dinámicas y ventana de 5 botones: éxito.
- Falta: usuarios (solo búsqueda por fragmento).

## Caché
- Backend: Caffeine `clientRows`/`workshopRows`, TTL 5 min, máx. 500, evicción en cada mutación: éxito.
- Frontend: caché de páginas por sección con evicción al mutar: éxito.
- Códigos postales: caché en memoria por sesión: éxito.

## Patrones y seguridad
- Backend (Spring Boot): Controller-Service-Repository, **Factory Method** (`EntityFactory` + `WorkshopFactory`, `WorkshopStatusFactory`, `VehicleFactory`, `ClientRecordFactory`, `ClientHistoryFactory`, `ClientVehicleFactory`), DTOs con Bean Validation, `UUID v7` (fecha + aleatorio, no secuencial), transacciones con timeout 15 s y `multipart` 15 MB, `AES-GCM` + `HMAC-SHA-256`, URLs con UUID opacos, caché con evicción por evento.
- Frontend (React + TS): componentes por sección, `camelCase`, cliente HTTP compartido con `AbortController` 12 s en todas las peticiones (auth, roles, fichas, talleres, CP), sin `env` expuesto (rutas relativas `/api`), sin texto plano sensible, solo SVG sin emojis, CSS centralizado en `global.css` sin duplicación, paginador compartido.
- Roles: talleres solo muta ADMINISTRADOR (403 = modal sin permiso); clientes y vehículos mutan ADMINISTRADOR y RECEPCIONISTA; TRANSPORTISTA consulta.
- Actores considerados: visitante, usuario con cuenta, ADMINISTRADOR, RECEPCIONISTA, TRANSPORTISTA y sistema (seed, auditoría `createdBy`, `workshopAudit` e historial).
- Datos semilla para pruebas: 20 talleres + 20 vehículos + 20 clientes (paginación), limpiables a petición.
