# AGENTS.md — Reglas para agentes · Portal de Transporte

> **Estándar del archivo.** Fuente única de reglas e instrucciones operativas para cualquier agente
> (IA o persona) que continúe este proyecto. Se lee completo antes de tocar código. Cada regla se
> registra como **Regla | Descripción de lo que se hizo | Estado** y este archivo se actualiza en
> **cada iteración** (ver §2).

**Estados:** 🟢 logrado · 🟡 a medias · 🔴 no logrado

## 0. Suite de especificaciones

| Archivo | Estándar | Qué registra | Estado |
| --- | --- | --- | --- |
| `AGENTS.md` | Entrada común de agentes | Orden de lectura y skills aplicables | 🟢 |
| `.github/copilot-instructions.md` | Entrada de instrucciones VS Code | Enlaces a instrucciones y skills de este proyecto | 🟢 |
| `.github/skills/manual-system-testing/SKILL.md` | Skill de pruebas manuales | Preparación, ejecución, evidencia y límites frente a DeepSec | 🟢 |
| `.github/skills/documentador-frontend/SKILL.md` | Skill de documentación frontend | Organización híbrida y actualización de documentación | 🟢 |
| `.github/skills/react-best-practices/SKILL.md` | Skill React descubrible | Enlace a la fuente React + Vite de `specs/skills/Frontend/` | 🟢 |
| `.github/skills/spring-boot-rest-spec/SKILL.md` | Skill backend descubrible | Enlace al protocolo y guía Spring REST del proyecto | 🟢 |
| `specs/agentes/AGENTS.md` | Reglas para agentes | Restricciones, convenciones, actores, protocolos | 🟢 |
| `specs/skills/SKILLS.md` | Catálogo de habilidades backend | Técnicas aplicadas, con evidencia | 🟢 |
| `specs/arquitectura/ORQUESTADOR.md` | Orquestación | Módulos, rutas, flujos, dependencias | 🟢 |
| `specs/skills/Frontend/SKILL.md` | Fuente de skill React + Vite | Activación, prioridades, quick reference y patrones | 🟢 |
| `specs/skills/Frontend/AGENTS.md` | Guía React + Vite | Reglas detalladas y adaptación Next.js → React | 🟢 |
| `specs/skills/Frontend/INSTALL.md` | Instalación | Demo global, local y para otros agentes | 🟢 |
| `docs/frontend/ESTRUCTURA.md` | Migración frontend | Mapa gradual de estructura plana a `app/features/shared` | 🟡 |
| `specs/skills/Frontend/INSTALL.md` | Instalación | Demo global, local y para otros agentes | 🟢 |
| `specs/PROGRESS.md` | Avance por módulo | Histórico funcional (puede venir desfasado; mandan estos tres) | 🟡 |
| `specs/README.md` | Arranque del frontend | Cómo correr y qué espera del backend | 🟢 |

## 1. Contexto operativo

| Dato | Valor |
| --- | --- |
| Frontend | React + TypeScript + Vite · `src/` · dev en `http://127.0.0.1:5173` · proxy `/api` → `8082` |
| Backend | Spring Boot 3.4 · Java 21 · MySQL 8 · Flyway · `backend/` · instancia del usuario en `8082` |
| Espejo de pruebas | El mismo backend levantado en `8083`: `mvn -B -q spring-boot:run -Dspring-boot.run.arguments="--server.port=8083"` |
| Secretos | `backend/.env.local` (BD y admin). Nunca exponer, versionar ni imprimir; se lee sin echo |
| Arquitectura visual | `docs/architecture/talleres.html` y `docs/architecture/clientes-taller.html` |
| Datos reales del usuario | Cliente `axel tristan segundo` (SEMA060604LUA), taller `Taller Hub`, vehículo `ABC-DEF-01`: no alterar |
| Datos semilla | 20 talleres + 20 vehículos + 20 clientes de prueba (paginación); se limpian solo si el usuario lo pide |

## 2. Protocolo de iteración (permanente)

1. Leer `specs/agentes/AGENTS.md`, `specs/skills/SKILLS.md` y `specs/arquitectura/ORQUESTADOR.md` antes de codificar. Para tareas de UI, leer también `specs/skills/Frontend/SKILL.md` y, para detalle, `specs/skills/Frontend/AGENTS.md`.
2. Al cerrar **cada prompt**: agregar la iteración a las tres tablas de historial (Regla | Descripción de lo que se hizo | Estado). Solo pasa a 🟢 con evidencia.
3. Compilar en verde: `mvn -B compile` (backend) y `npm run build` (frontend).
4. Probar en el espejo `8083`; jamás detener ni tocar el `8082` del usuario.
5. Avisar explícitamente si el usuario debe reiniciar su backend `8082` (código o migraciones nuevas).
6. Nunca exponer secretos; nunca dejar de considerar los actores y sus roles.
7. Si el cambio es de frontend, aplicar `specs/skills/Frontend/SKILL.md`, revisar el checklist de `AGENTS.md` y compilar con `npm run build`.

## 3. Reglas del proyecto

| Regla | Descripción de lo que se hizo | Estado |
| --- | --- | --- |
| Factory Method obligatorio | `domain/factory` con `EntityFactory` y una fábrica por entidad: `WorkshopFactory`, `WorkshopStatusFactory`, `VehicleFactory`, `ClientRecordFactory`, `ClientHistoryFactory`, `ClientVehicleFactory`, `UserAccountFactory`, `UserSessionFactory`, `PasswordResetTokenFactory`, `RoleFactory`. | 🟢 |
| CamelCase | Clases, métodos, paquetes, TS y CSS en camelCase/PascalCase; sin snake_case expuesto al exterior. | 🟢 |
| Sin ids autoincrementales | Todas las tablas usan `BINARY(16)` con UUID v7 (fecha embebida, `UuidV7`) generado en la fábrica; rutas con id opaco. | 🟢 |
| Capas Controller → Service → Repository | Cada módulo (`auth`, `roles`, `users`, `workshops`, `records`) con DTOs, `*Policy` de constantes y repositorio; el controlador no lleva lógica. | 🟢 |
| DTOs + Bean Validation | Nunca se expone una entidad JPA; la validación de entrada vive en los DTOs. | 🟢 |
| Transacciones y límites | Escrituras con `@Transactional` (timeout 15 s); foto multipart máx. 15 MB (png/jpg/jpeg/webp). | 🟢 |
| Migraciones Flyway ordenadas | V1 identidad+clientes+vehículos → V9 relación cliente-vehículo; correcciones con patrón propio (V2/V9: ENUM → VARCHAR alineado con JPA; V5: catálogo global `estatus`). | 🟢 |
| Roles restringidos de extremo a extremo | `@PreAuthorize` por ruta + guard en UI; el 403 se muestra como modal "sin permiso", nunca error crudo. | 🟢 |
| Sin acceso sin cuenta | El área privada no se renderiza sin sesión; cookie `HttpOnly` + `SameSite=Strict` (nombre configurable, `PORTAL_SESSION`) validada por hash. | 🟢 |
| Sesión persistente tras recarga | `App` consulta `/api/v1/auth/session`; `AuthService` ejecuta query explícita por hash, carga la cuenta y filtra revocación/expiración; login confirma la restauración. Prueba manual pendiente. | 🟡 |
| Textos de validación claros | Los formularios describen los datos esperados con lenguaje simple y no muestran expresiones ni cadenas técnicas al usuario. | 🟢 |
| Alta y asociación de vehículos | VIN, placa, kilometraje opcional, hasta 3 fotos de 15 MB y asociación/desvinculación con confirmación e historial; migración V10. Validación manual pendiente. | 🟡 |
| URLs seguras e impredecibles | Rutas con UUID opaco (`/clients/{id}`, `/workshops/{id}`, `/vehicles/{id}`); sin secuencias numéricas. | 🟢 |
| Sin emojis; iconografía solo SVG | `src/components/Icon.tsx` centraliza todos los iconos (paginación, historial, vínculo, vehículo, etc.). | 🟢 |
| Sin código hardcodeado | Regex y catálogos en constantes: `RecordPolicy`, `WorkshopPolicy`, `AuthPolicy`, `RolePolicy`, `validation.ts`, `constants/`. | 🟢 |
| Sin exposición de env | El frontend solo usa rutas relativas `/api`; secretos únicamente en backend; nada de claves en el bundle. | 🟢 |
| Sin duplicación de código | `Pager.tsx`, `PAGE_SIZE`/`SELECT_PAGE_SIZE`, `http.ts` y `global.css` compartidos. Pendiente: extraer un hook de paginación (la lógica `loadPage` + `pageCache` se repite en las 3 secciones). | 🟡 |
| Backend, frontend y CSS regularizados | `global.css` concentra tokens y estilos (pager, contactos, timeline, badges, tablas); sin estilos por componente. | 🟢 |
| Paginación validada en todos los listados | Clientes, vehículos y talleres con página validada en front y back. Pendiente: usuarios (hoy solo búsqueda por fragmento). | 🟡 |
| Actores siempre considerados | Cada archivo/bloque declara Actor y Técnica; rutas y UI se validan por rol (ver §4). | 🟢 |
| Evidencia antes de reportar | Nada se reporta terminado sin `mvn compile`, `npm run build` o curls contra el espejo `8083`. | 🟢 |
| Skill React + Vite documentada | `specs/skills/Frontend/` con `SKILL.md` (índice), `AGENTS.md` (detalle), `INSTALL.md` (demo) y presentación en `docs/presentaciones/`; demo en `docs/demo/`. | 🟢 |
| Patrones de diseño frontend | Composición, cliente HTTP central, cache-aside, guard por rol, validación espejo y sistema de diseño único documentados en `specs/skills/Frontend/`. | 🟢 |
| Instrucciones y skills descubribles | `AGENTS.md`, `.github/copilot-instructions.md` y skills nativas enlazan con las fuentes mantenidas en `specs/`. | 🟢 |
| Estructura híbrida del frontend | Guía y skill creadas; `App` y `Workspace` migrados a `src/app/`. El resto de módulos y el build siguen pendientes. | 🟡 |

## 4. Actores del sistema

| Actor | Alcance | Estado |
| --- | --- | --- |
| Visitante | Registro, login y recuperación; nunca ve el área privada. | 🟢 |
| Usuario con cuenta | Área privada según sus roles; sesión por cookie. | 🟢 |
| ADMINISTRADOR | Talleres (alta/edición/baja), roles, usuarios; también clientes y vehículos. | 🟢 |
| RECEPCIONISTA | Clientes y vehículos: alta, edición, baja/reactivar y asociación; consulta talleres activos. | 🟢 |
| TRANSPORTISTA | Solo consulta (clientes, vehículos, talleres). | 🟢 |
| Sistema | Seeds, caché, auditoría e historial (`createdBy`, `actor_name` desnormalizado). | 🟢 |

## 5. Convenciones de código

- Comentarios en español con **Actor** y **Técnica** en cada clase/bloque nuevo.
- Si un valor lo usan controlador y servicio, vive en el `*Policy` correspondiente; en frontend en `constants/` o `validation.ts`.
- Mensajes de UI en español, sin emojis; iconos siempre `<Icon name="..." />`.
- Componentes en PascalCase (`ClientsSection.tsx`), utilidades y constantes en camelCase (`validation.ts`, `pagination.ts`).
- Tablas de paginación: siempre validar `page` en front antes de pedir y confirmar `totalPages` con el backend.

## 6. Protocolo de verificación

| Paso | Acción | Estado |
| --- | --- | --- |
| 1. Compilar backend | `cd backend && mvn -B compile` | 🟢 |
| 2. Compilar frontend | `npm run build` | 🟢 |
| 3. Levantar espejo | `spring-boot:run` con `--server.port=8083` en segundo plano | 🟢 |
| 4. Login programático | Credenciales de `backend/.env.local` → `POST /api/v1/auth/login` guardando la cookie | 🟢 |
| 5. Curls de humo | 200/201/204 esperados y 400/401/403/409 probados; verificar invalidación de caché tras mutar | 🟢 |
| 6. Apagar espejo | Localizar el proceso por puerto (`ss -ltnp`) y hacer `kill`; confirmar puerto libre | 🟢 |
| 7. Avisar reinicio | Recordar al usuario reiniciar su `8082` si hay código o migraciones nuevas | 🟡 pendiente actual (V6–V9 + paginaciones) |

## 7. Patrones de error vigilados

- **Auto-asignación en constructores** (`campo = campo` en vez de `this.campo = campo`): ya ocurrió 2 veces (`Workshop.nameNonce` y `ClientContact.nameNonce`). Al crear entidades, revisar cada constructor antes de compilar.
- **ENUM de MySQL vs JPA**: cualquier columna enum nueva o renombrada exige migración correctiva (patrón V2/V9: pasar a VARCHAR).
- **Duplicados → 409**: RFC y correo de taller, placa de vehículo, asociación cliente-vehículo repetida.
- **Cachés desfasadas**: toda mutación debe evictar (`clientRows`, `workshopRows`) y limpiar el caché de páginas del frontend.
- **Instancia equivocada**: verificar el puerto en cada prueba; el usuario vive en `8082`, las verificaciones en `8083`.

## 8. Historial de iteraciones (reglas aplicadas)

| # | Iteración (prompt) | Reglas que se aplicaron | Estado |
| --- | --- | --- | --- |
| 1 | Modal de cliente UC-CV-01 | Alta con nombre, N contactos (botón +) y taller activo obligatorio; validación espejo y modales de aviso. | 🟢 |
| 2 | Reemplazo del buscador de códigos postales | Se descartaron proveedores muertos y se adoptó `postali.app` con caché y timeout. | 🟢 |
| 3 | Regex por campo | Formato espejo front/back para RFC, placa, CP, nombres y direcciones; menos capturas inválidas. | 🟢 |
| 4 | Corrección de altas de taller y cliente | Se detectó y corrigió el patrón de auto-asignación en constructores; altas verificadas por API. | 🟢 |
| 5 | Administración de clientes | Baja/reactivar sin borrar, contactos secundarios, trazabilidad, vehículos, paginación validada y caché (V6–V9). | 🟢 |
| 6 | Semilla 20/20/20 | Datos de prueba por API para validar paginación real (10/10/1 con 21 registros). | 🟢 |
| 7 | Paginación de vehículos y talleres | Misma experiencia que clientes: `Pager` compartido, backend validado y caché `workshopRows`. | 🟢 |
| 8 | Documentación viva (este prompt) | `AGENTS.md`, `SKILL.md` y `ORQUESTADOR.md` con formato Regla · Descripción · Estado y protocolo por iteración. | 🟢 |
| 9 | Skill React + Vite, demo y presentación | `specs/skills/Frontend/` con `SKILL.md`, `AGENTS.md` e `INSTALL.md`; demo en `docs/demo/`; presentación de 3 diapositivas en `docs/presentaciones/`. | 🟢 |
| 10 | Observabilidad de aplicación y agentes | Contrato `TRACING.md`, auditoría `AUDIT_OBSERVABILITY.md`, instrumentación React/Spring Boot y wrapper `scripts/agent-trace.mjs`. Evidencia en la tabla de validación del informe. | 🟢 |
| 11 | Skills manuales y estructura React | Entrada `AGENTS.md`/Copilot, skill manual diferenciada de DeepSec, skills de frontend/backend y primer lote `App`/`Workspace` en `src/app/`; build pendiente por falta de Node/npm. | 🟡 |
| 12 | Persistencia de sesión al recargar | Endpoint autenticado `/api/v1/auth/session`, restauración en `App` y escenario manual para recarga/logout; compilación pendiente por falta de npm y Maven en este entorno. | 🟡 |
| 13 | Corrección de sesión tras reinicio y recarga | Se deshabilitó el registro servlet automático de `SessionAuthenticationFilter` para evitar que compita con su registro en `SecurityFilterChain`; build y prueba manual pendientes. | 🟡 |
| 14 | Alta de vehículos y asociación desde tabla | VIN obligatorio, kilometraje opcional, tres fotos como máximo, clientes activos en selector, estado visual y confirmación para desvincular; mensajes de validación simplificados; migración V10. | 🟡 |
| 15 | Restauración de login desde cookie | `/auth/session` valida la cookie HttpOnly directamente contra la sesión persistida, y el login comprueba esa restauración; backend y chequeo TypeScript correctos, prueba manual pendiente. | 🟡 |
| 16 | Query explícita para restaurar sesión | `UserSessionRepository` consulta por hash, carga la cuenta y filtra sesiones vencidas o revocadas; `AuthService` usa ese resultado. Compilación backend correcta, HTTP pendiente. | 🟡 |

## 9. Observabilidad y trazabilidad de agentes

El contrato oficial vive en `TRACING.md` (raíz). Este apartado solo fija cómo lo consumen los agentes; no duplica el catálogo de eventos ni los esquemas.

### 9.1 Regla general

- Todo agente que ejecute una tarea debe abrir una traza con `node scripts/agent-trace.mjs start ...` y conservar el `trace_id` devuelto.
- Cada delegación, carga de skill, invocación de herramienta/MCP, modificación de archivo, prueba y cierre debe emitir un evento con `emit`.
- Para una delegación, pasar `--trace <trace_id>` y `--parent <span_id>` del padre. Nunca generar una traza nueva para un trabajo que ya pertenece a una traza activa.
- El evento de cierre debe incluir `--status success|failed|partial` y al menos una `--evidence` verificable (comando ejecutado y resultado, ruta de artefacto o salida de prueba). Sin evidencia no se usa `success`.
- No incluir secretos, contraseñas, tokens, cookies, correos, teléfonos ni cuerpos de solicitud en `--summary`, `--attr`, `--evidence` o `--file-changed`.

### 9.2 Flujo mínimo

```bash
# 1. Abrir tarea (devuelve trace_id y span_id)
node scripts/agent-trace.mjs start --agent backend-doc --task TASK-001 --workflow WF-001 \
  --summary "Documentar cambio de endpoint"

# 2. Registrar carga de skill / herramienta / archivo / prueba
node scripts/agent-trace.mjs emit --type skill.loaded --trace <trace_id> --parent <span_id> --skill spring-boot-rest-spec
node scripts/agent-trace.mjs emit --type file.modified --trace <trace_id> --parent <span_id> --file-changed backend/src/main/java/...

# 3. Cerrar con evidencia
node scripts/agent-trace.mjs emit --type agent.task.completed --trace <trace_id> --parent <span_id> \
  --status success --evidence "mvn -B compile: BUILD SUCCESS"
```

### 9.3 Documentadores de Frontend y Backend

Cuando un cambio afecte la aplicación, el documentador correspondiente debe emitir `docs.impact.detected` antes de actualizar su documentación, con estos atributos separados por comas:

- `components`: componentes React o clases Java afectadas.
- `endpoints`: rutas HTTP afectadas.
- `services`: servicios o casos de uso afectados.
- `dtos`: DTOs o modelos afectados.
- `configs`: propiedades, migraciones o configuración afectada.
- `docs_to_update`: documentos que deben actualizarse.
- `evidence`: referencia a la prueba o al diff que respalda el impacto.

No se permite declarar documentación actualizada sin `trace_id`, lista de archivos y evidencia. La documentación debe enlazar al `trace_id` de la tarea cuando el cambio sea relevante para operación o diagnóstico.

### 9.4 Integración con trazas de aplicación

- Los agentes que toquen frontend o backend deben reportar el `trace_id` de su tarea y, si ejecutaron una prueba HTTP, el `X-Trace-Id` devuelto por Spring Boot.
- Los eventos de agente y los eventos de aplicación comparten el mismo formato de campos (`trace_id`, `span_id`, `parent_span_id`, `session_id`, `task_id`, `agent_id`, `workflow_id`), pero se almacenan en archivos distintos (`.observability/agent-events.jsonl` y logs/OTLP de la aplicación).
- No se simula una integración automática entre la plataforma de agentes y la aplicación: la correlación es por contrato y por ids registrados en ambos lados.


