# AUDIT_OBSERVABILITY.md — Auditoría de observabilidad

> **Proyecto:** Portal de Transporte (Spring Boot 3.4.4 / Java 21 / React + TypeScript + Vite).
> **Fecha de auditoría:** 2026-11-08.
> **Modo:** auditoría de solo lectura en Fase 1; la implementación posterior se registra en §11 y en el informe final.
> **Evidencia:** inspección directa del repositorio, `pom.xml`, `package.json`, `vite.config.ts`, `application.yml`, controladores, servicios, filtros, configuración de seguridad, documentos de agentes/skills y ausencia de pruebas automatizadas.

---

## 1. Resumen ejecutivo

El proyecto es una aplicación monorepo con dos artefactos claramente separados:

- `backend/`: Spring Boot 3.4.4, Java 21, MySQL 8, Flyway, Spring Security con sesión por cookie, JPA, Caffeine y Spring Cache.
- Raíz: React + TypeScript + Vite, sin router, sin gestor de estado global y con un cliente HTTP central (`src/api/http.ts`).
- `specs/` y `docs/`: capa de instrucciones para agentes, skills y documentadores. No es un runtime de agentes: son contratos en Markdown.

**Hallazgo principal:** antes de esta auditoría no existía observabilidad operativa: no había Actuator, Micrometer Tracing, OpenTelemetry, trazas, correlation IDs, métricas expuestas, logging estructurado ni instrumentación de agentes. Solo existía Logback/SLF4J por defecto y un logger de auditoría de talleres. El frontend no tenía logging, manejo global de errores ni métricas de rendimiento.

La intervención posterior añadió una capa mínima y compatible:

- Backend: Actuator, Micrometer Observation/Tracing con puente OTel, exportador OTLP opcional, Prometheus, `RequestCorrelationFilter`, logs ECS y spans `service.*` con `@Observed`.
- Frontend: tracer W3C sin dependencias externas, spans `http.client`, propagación `traceparent`, `X-Request-Id`, `X-Session-Id`, captura de errores, métricas de rendimiento y exportador OTLP/HTTP JSON opcional.
- Agentes: wrapper `scripts/agent-trace.mjs` con eventos JSONL y reglas de evidencia en los documentos existentes.

No se modificaron contratos HTTP, reglas de negocio, entidades, DTOs ni migraciones.

---

## 2. Método y alcance

### 2.1 Método

1. Inventario de archivos y dependencias.
2. Lectura de la cadena de solicitud HTTP en backend y frontend.
3. Lectura de la capa de agentes, skills, reglas y documentadores.
4. Búsqueda de observabilidad existente (`actuator`, `micrometer`, `opentelemetry`, `jaeger`, `zipkin`, `prometheus`, `grafana`, `loki`, `logback`, `slf4j`, `trace`, `correlation`, `MDC`, `@Scheduled`, `@Async`, `ControllerAdvice`).
5. Clasificación por estado: `IMPLEMENTED`, `PARTIAL`, `MISSING`, `UNVERIFIED`, `CONFLICT`.
6. Diseño e implementación mínima, con compilación y pruebas de humo.

### 2.2 Alcance

- Backend completo en `backend/src/main/java/mx/portaltransporte`.
- Frontend completo en `src/`.
- Documentos de agentes/skills en `specs/` y `docs/`.
- Configuración de build, Vite, Docker Compose y variables de entorno.

Fuera de alcance: infraestructura de colectores, despliegue, cambios de negocio, contratos de API y migraciones.

---

## 3. Backend — inventario

### 3.1 Estructura de paquetes

| Paquete | Contenido | Observación |
| --- | --- | --- |
| `mx.portaltransporte` | `PortalBackendApplication` | `@SpringBootApplication`, `@EnableScheduling`; no hay jobs programados visibles. |
| `auth` | `AuthController`, `AuthService`, `AuthDtos`, `AuthPolicy`, `RecoveryProperties` | Login/logout/registro/recuperación. |
| `records` | `RecordController`, `RecordService`, `RecordDtos`, `RecordPolicy`, `ClientRowsCache` | Clientes, vehículos, historial y vínculos. |
| `workshops` | `WorkshopController`, `WorkshopService`, `WorkshopDtos`, `WorkshopPolicy` | Talleres, foto multipart y catálogo de estatus. |
| `roles` | `RoleController`, `RoleService`, `RoleDtos`, `RolePolicy` | Administración de roles. |
| `users` | `UserAdminController`, `UserAdminService`, `UserDtos` | Búsqueda de usuarios. |
| `security` | `SecurityConfiguration`, `SessionAuthenticationFilter`, `CryptoService`, propiedades | Cookie opaca, bcrypt, AES-GCM/HMAC. |
| `config` | `WebConfig`, `CacheConfiguration`, seeds | Configuración y datos iniciales. |
| `domain` | Entidades JPA + `factory` | Factory Method obligatorio; UUID v7. |
| `repository` | 10 repositorios Spring Data | Sin instrumentación explícita. |

### 3.2 Controllers y endpoints

| Método | Ruta | Autorización | Servicio |
| --- | --- | --- | --- |
| POST | `/api/v1/auth/register` | Público | `AuthService.register` |
| POST | `/api/v1/auth/login` | Público | `AuthService.login` |
| POST | `/api/v1/auth/logout` | Público (cookie) | `AuthService.logout` |
| POST | `/api/v1/auth/recovery/request` | Público | `AuthService.requestRecovery` |
| POST | `/api/v1/auth/recovery/reset` | Público | `AuthService.reset` |
| POST | `/api/v1/clients` | ADMINISTRADOR, RECEPCIONISTA | `RecordService.createClient` |
| GET | `/api/v1/clients` | ADMINISTRADOR, RECEPCIONISTA, TRANSPORTISTA | `RecordService.listClients` |
| PUT | `/api/v1/clients/{id}` | ADMINISTRADOR, RECEPCIONISTA | `RecordService.updateClient` |
| PATCH | `/api/v1/clients/{id}/status` | ADMINISTRADOR, RECEPCIONISTA | `RecordService.changeClientStatus` |
| GET | `/api/v1/clients/{id}/history` | ADMINISTRADOR, RECEPCIONISTA | `RecordService.listClientHistory` |
| POST | `/api/v1/clients/{id}/vehicles` | ADMINISTRADOR, RECEPCIONISTA | `RecordService.linkVehicle` |
| GET | `/api/v1/clients/{id}/vehicles` | ADMINISTRADOR, RECEPCIONISTA, TRANSPORTISTA | `RecordService.listClientVehicles` |
| DELETE | `/api/v1/clients/{id}/vehicles/{associationId}` | ADMINISTRADOR, RECEPCIONISTA | `RecordService.unlinkVehicle` |
| POST | `/api/v1/vehicles` | ADMINISTRADOR, RECEPCIONISTA | `RecordService.createVehicle` |
| GET | `/api/v1/vehicles` | ADMINISTRADOR, RECEPCIONISTA, TRANSPORTISTA | `RecordService.listVehicles` |
| PUT | `/api/v1/vehicles/{id}` | ADMINISTRADOR, RECEPCIONISTA | `RecordService.updateVehicle` |
| DELETE | `/api/v1/vehicles/{id}` | ADMINISTRADOR, RECEPCIONISTA | `RecordService.deleteVehicle` |
| POST/GET/PUT/DELETE | `/api/v1/workshops...` | ADMINISTRADOR / roles de consulta | `WorkshopService` |
| GET | `/api/v1/estatus`, `/api/v1/workshop-statuses` | Roles autorizados | `WorkshopService.listStatuses` |
| GET/POST/PUT/DELETE | `/api/v1/roles...` | ADMINISTRADOR | `RoleService` |
| GET | `/api/v1/users?search=...` | ADMINISTRADOR | `UserAdminService.searchUsers` |

### 3.3 Configuración, seguridad y errores

| Componente | Estado | Detalle |
| --- | --- | --- |
| `application.yml` | IMPLEMENTED | Datasource por variables, JPA `validate`, Flyway, multipart 15 MB, `server.port=8082`, `error.include-message=never`. |
| Perfiles Spring | MISSING | No hay `application-*.yml`; el entorno se controla por variables. |
| Seguridad | IMPLEMENTED | `SecurityFilterChain`, sesión stateless con cookie `PORTAL_SESSION`, `SessionAuthenticationFilter`, `@EnableMethodSecurity`, `@PreAuthorize`. |
| CSRF | CONFLICT/RIESGO | Deshabilitado con autenticación por cookie; no se modificó en esta tarea. Requiere decisión de seguridad fuera de alcance. |
| CORS | IMPLEMENTED | Orígenes 127.0.0.1/localhost, credenciales; ahora expone `X-Request-Id` y `X-Trace-Id`. |
| Exception handler global | MISSING | No hay `@RestControllerAdvice`; se usa el manejo por defecto de Spring. No se añadió para no alterar contratos. |
| Filtros | PARTIAL | Solo `SessionAuthenticationFilter`; ahora se suma `RequestCorrelationFilter`. |
| Interceptores | MISSING | No hay `HandlerInterceptor`. |
| Jobs programados | UNVERIFIED | `@EnableScheduling` está activo, pero no se encontró `@Scheduled`. |
| Tareas asíncronas | MISSING | No hay `@Async` ni ejecutores propios. |
| Logging | PARTIAL | Logback/SLF4J por defecto; `workshopAudit` registra altas/ediciones. Sin correlación ni formato estructurado antes de la intervención. |
| Testing | MISSING | No hay `src/test`; `spring-boot-starter-test` está declarado. |
| Actuator | MISSING (antes) | No estaba en `pom.xml` ni expuesto. |

### 3.4 Dependencias

| Dependencia | Versión | Uso |
| --- | --- | --- |
| Spring Boot parent | 3.4.4 | BOM y plugins |
| Java | 21 | Runtime/compilación |
| `spring-boot-starter-web` | gestionada | MVC |
| `spring-boot-starter-validation` | gestionada | Bean Validation |
| `spring-boot-starter-security` | gestionada | Autenticación/autorización |
| `spring-boot-starter-data-jpa` | gestionada | Persistencia |
| `spring-boot-starter-cache` + Caffeine | gestionada | Caché `clientRows`/`workshopRows` |
| Flyway + MySQL | gestionada | Migraciones y BD |
| `spring-boot-starter-test` | gestionada | Pruebas (sin pruebas escritas) |

### 3.5 Flujo actual de una solicitud (antes de instrumentar)

```text
Navegador
  └─ fetch('/api/v1/...') con cookie PORTAL_SESSION
      └─ Vite proxy 5173 → Spring Boot 8082
          └─ SecurityFilterChain
              └─ SessionAuthenticationFilter (cookie → SecurityContext)
                  └─ DispatcherServlet
                      └─ Controller (@PreAuthorize)
                          └─ Service (@Transactional, caché)
                              └─ Repository Spring Data
                                  └─ MySQL 8 (HikariCP)
```

Puntos naturales de instrumentación: entrada HTTP (filtro de observación de Spring Boot), servicios (casos de uso), cliente HTTP saliente (si se añade), pool de BD y borde de seguridad. No se debe duplicar el span de entrada en el controller.

---

## 4. Frontend — inventario

### 4.1 Estructura

| Área | Archivos | Observación |
| --- | --- | --- |
| Entrada | `src/main.tsx` | `createRoot` + `StrictMode`; ahora inicializa telemetría. |
| Raíz | `src/App.tsx` | Estado de pantalla (`login/register/recovery`) y cuenta; sin router. |
| Componentes | `src/components/*.tsx` | 21 componentes; `Workspace` orquesta secciones; diálogos y primitivas. |
| API | `src/api/*.ts` | `http.ts` centraliza fetch, timeout y errores; `authApi`, `recordsApi`, `rolesApi`, `workshopsApi`, `sepomexApi`. |
| Tipos | `src/types.ts` | Contratos TypeScript. |
| Constantes/utilidades | `src/constants`, `src/utils/validation.ts` | Catálogos, paginación y validación espejo. |
| Estilos | `src/styles/global.css` | Sistema de diseño único. |
| Configuración | `vite.config.ts`, `tsconfig.*`, `package.json` | Proxy `/api` → `127.0.0.1:8082`, puerto 5173 estricto. |
| Variables de entorno | Solo `VITE_*` | No hay `.env` versionado; secretos solo en backend. |

### 4.2 Estado, routing y autenticación

- Sin React Router: la navegación es estado en memoria (`screen` en `App`, `section` en `Workspace`).
- Sin gestor global: `useState`, `useMemo`, `useEffect`; caché de páginas en memoria por sección.
- Autenticación: cookie `HttpOnly`; el frontend usa `credentials: 'include'` y rutas relativas. No almacena tokens.
- Guards: `App` no renderiza el área privada sin cuenta; `Workspace` oculta secciones por rol. El backend autoriza con `@PreAuthorize`.
- Errores: modales/toasts; no hay `ErrorBoundary` de React ni captura global antes de la intervención.
- Testing: no hay framework de pruebas ni scripts de test.

### 4.3 Flujo de una solicitud

```text
Componente (LoginForm, ClientsSection, ...)
  └─ api client (authApi / recordsApi / workshopsApi / rolesApi / sepomexApi)
      └─ fetchWithTimeout (src/api/http.ts)
          └─ fetch relativo /api/v1/... (cookie)
              └─ Vite proxy → Spring Boot 8082
```

`fetchWithTimeout` es el punto central ideal: todas las llamadas propias pasan por él; Postali también, pero es un tercero y no debe recibir contexto de sesión.

### 4.4 Observabilidad existente en frontend (antes)

| Componente | Estado | Detalle |
| --- | --- | --- |
| Logging | MISSING | Sin logger ni eventos; solo mensajes de UI. |
| Trazas | MISSING | Sin `traceparent`, sin correlación. |
| Errores globales | MISSING | Sin `window.error`, `unhandledrejection` ni boundary. |
| Performance | MISSING | Sin Web Vitals ni medición de latencia. |
| Métricas | MISSING | Sin exportador. |
| Testing | MISSING | Sin pruebas. |

---

## 5. Arquitectura de IA — inventario

### 5.1 Inventario documental

| Activo | Ruta | Estado | Función real |
| --- | --- | --- | --- |
| Reglas de agentes | `specs/agentes/AGENTS.md` | IMPLEMENTED | Reglas, actores, convenciones, protocolo de iteración y verificación. |
| Catálogo de skills backend | `specs/skills/SKILLS.md` | IMPLEMENTED | Guía Spring Boot/REST, SPEC, seguridad, persistencia, validación. |
| Orquestador | `specs/arquitectura/ORQUESTADOR.md` | IMPLEMENTED | Contrato de ejecución por fases, alcance, delegación y cierre. |
| Skill frontend | `specs/skills/Frontend/SKILL.md` + `AGENTS.md` + `INSTALL.md` | IMPLEMENTED | Buenas prácticas React/Vite, patrones y demo. |
| Documentador Backend | `docs/backend/documentadorBackend.md` | PARTIAL/CONFLICT | Guía genérica de prácticas Spring Boot; **no** documenta los endpoints, DTOs ni servicios reales del proyecto. |
| Documentador Frontend | `docs/frontend/documentadorFrontend.md` | PARTIAL/CONFLICT | Guía genérica de estructuras React; **no** documenta los componentes, contratos ni flujos reales. |
| Progreso | `specs/PROGRESS.md` | PARTIAL | Histórico funcional; puede estar desfasado. |
| README frontend | `specs/README.md` | PARTIAL | Dice proxy a `8080`, pero `vite.config.ts` usa `8082`. |
| Demo de skill | `docs/demo/react-skill-demo/.opencode/...` | IMPLEMENTED (aislado) | Skill de demo; no es configuración del repositorio raíz. |
| Presentaciones | `docs/presentaciones/` | IMPLEMENTED | Material de apoyo. |

### 5.2 ¿Qué documentan realmente los documentadores?

| Contenido | Backend | Frontend |
| --- | --- | --- |
| Arquitectura del proyecto | Parcial (prácticas genéricas) | Parcial (estructuras genéricas) |
| Endpoints reales | No | No |
| Componentes reales | No aplica | No |
| Servicios/casos de uso | No | No |
| DTOs/modelos reales | No | No |
| Dependencias reales | No | No |
| Flujos de autenticación | No | No |
| Cambios realizados | No | No |
| Contratos Frontend-Backend | No | No |

**Conclusión:** los documentadores existentes son guías de estilo, no documentación viva del sistema. No se reemplazaron ni duplicaron: se les añadió un contrato de reporte de impacto y evidencia (§9 de `AGENTS.md` y anexos en cada documento).

### 5.3 Orchestrator, skills, rules, hooks, MCP, tools, memory, workflows, evals

| Capacidad | Estado | Evidencia |
| --- | --- | --- |
| Orchestrator | IMPLEMENTED (documento) | `specs/arquitectura/ORQUESTADOR.md`; no es un runtime ejecutable. |
| Skills | IMPLEMENTED (documentos) | `specs/skills/SKILLS.md`, `specs/skills/Frontend/`. |
| Rules | IMPLEMENTED | `specs/agentes/AGENTS.md`. |
| Security policies | PARTIAL | Reglas de seguridad en `SKILLS.md` y `AGENTS.md`; no hay política automatizada. |
| Hooks | MISSING | No hay `.opencode/hooks` ni hooks de repositorio. |
| MCP | MISSING | No hay configuración MCP en el proyecto. |
| Tools | PARTIAL | El agente usa herramientas del entorno; no hay catálogo local. |
| Memory | MISSING | No hay memoria persistente de agentes; `PROGRESS.md` es histórico manual. |
| Workflows | PARTIAL | Flujo por fases en `ORQUESTADOR.md`; no hay workflow ejecutable. |
| Testing/Evals de agentes | MISSING | No hay evals ni pruebas de agentes. |
| Agent tracing | MISSING (antes) | No había wrapper ni eventos. |
| Delegación real | PARTIAL | El orquestador puede delegar si el entorno lo permite; no hay integración automática con la plataforma. |

### 5.4 Integración con el sistema de tracing

Se integró sin reemplazar agentes:

- `AGENTS.md` §9: regla de traza por tarea, delegación, evidencia y documentadores.
- `ORQUESTADOR.md` §13: obligación de abrir traza, emitir delegaciones y validar evidencia.
- `SKILLS.md` §13: reglas de observabilidad para cambios Spring Boot.
- Documentadores: `docs.impact.detected` + `docs_to_update`.
- Wrapper `scripts/agent-trace.mjs`: mecanismo real disponible; la plataforma no expone hooks automáticos.

---

## 6. Observabilidad existente — matriz de estado

Clasificación **antes** de la implementación. La columna "Después" se actualiza en §11.

| Componente | Antes | Evidencia | Después |
| --- | --- | --- | --- |
| Spring Boot Actuator | MISSING | No estaba en `pom.xml`. | IMPLEMENTED |
| Micrometer Observation | PARTIAL | `micrometer-observation` transitivo de Spring Web; sin registro/exposición. | IMPLEMENTED |
| Micrometer Tracing | MISSING | Sin puente ni sampler. | IMPLEMENTED |
| OpenTelemetry Java | MISSING | Sin agente/SDK/exportador. | IMPLEMENTED (puente + OTLP opcional) |
| OpenTelemetry JS | MISSING | Sin SDK ni propagación. | PARTIAL (tracer propio compatible W3C/OTLP; no SDK oficial) |
| Jaeger | MISSING | Sin configuración. | MISSING (no se instaló) |
| Zipkin | MISSING | Sin configuración. | MISSING (no se instaló) |
| Prometheus | MISSING | Sin registro ni endpoint. | IMPLEMENTED (registro + `/actuator/prometheus`) |
| Grafana | MISSING | Sin configuración. | MISSING (infraestructura externa) |
| Loki | MISSING | Sin configuración. | MISSING (infraestructura externa) |
| Logback / SLF4J | IMPLEMENTED | Spring Boot por defecto; `workshopAudit`. | IMPLEMENTED + ECS |
| Structured logging | MISSING | Patrón de texto plano. | IMPLEMENTED (`logging.structured.format.console=ecs`) |
| Distributed tracing | MISSING | Sin `traceparent` ni spans. | IMPLEMENTED |
| Correlation IDs | MISSING | Sin `request_id`/MDC. | IMPLEMENTED |
| Health checks | MISSING | Sin Actuator. | IMPLEMENTED (`/actuator/health`) |
| Métricas de aplicación | MISSING | Sin registro. | IMPLEMENTED |
| Métricas JVM/Hikari | MISSING | Sin Actuator. | IMPLEMENTED |
| Logs de autenticación | MISSING | `AuthService` no registra eventos. | PARTIAL (solo trazas HTTP; no se añadió log de credenciales) |
| Frontend logging | MISSING | Sin logger. | IMPLEMENTED |
| Frontend error boundary | MISSING | Sin boundary. | PARTIAL (captura global + `onUncaughtError`; no boundary visual) |
| Frontend performance | MISSING | Sin Web Vitals. | PARTIAL (navigation/LCP/FID; sin CLS) |
| Agent tracing | MISSING | Sin eventos. | IMPLEMENTED vía wrapper |
| Tests de observabilidad | MISSING | Sin `src/test`. | PARTIAL (build + pruebas de humo manuales; sin tests automatizados) |

---

## 7. Problemas y riesgos detectados

| ID | Problema | Impacto | Clasificación | Tratamiento |
| --- | --- | --- | --- | --- |
| OBS-001 | Sin Actuator ni métricas | No hay salud, saturación ni latencia observable | ALTO | Añadido Actuator + Prometheus |
| OBS-002 | Sin trazas ni correlación | Imposible seguir una solicitud entre React y Spring | ALTO | `traceparent` + Micrometer Tracing + MDC |
| OBS-003 | Sin logs estructurados | Difícil ingerir en Loki/ELK | MEDIO | ECS + campos `event=`, ids |
| OBS-004 | Sin instrumentación frontend | Errores y latencias del navegador invisibles | MEDIO | `src/telemetry/` + `fetchWithTimeout` |
| OBS-005 | Sin instrumentación de agentes | No se puede auditar una delegación | MEDIO | Wrapper JSONL + reglas |
| OBS-006 | Documentadores genéricos | No documentan el sistema real; riesgo de duplicar | MEDIO | Contrato de impacto + referencia a `TRACING.md`; no se reescribieron |
| OBS-007 | `specs/README.md` apunta a 8080 | Confusión operativa | BAJO | Registrar como deuda documental; no se tocó por alcance |
| OBS-008 | CSRF deshabilitado con cookie | Riesgo de seguridad preexistente | ALTO (fuera de alcance) | Documentar; no cambiar sin autorización |
| OBS-009 | Sin pruebas automatizadas | La evidencia depende de build/humo | MEDIO | Declarar limitación; no inventar tests |
| OBS-010 | `@EnableScheduling` sin jobs visibles | Ruido de configuración | BAJO | UNVERIFIED; no se tocó |
| OBS-011 | Exportador OTLP sin colector | Las trazas no salen del proceso por defecto | MEDIO | Exportación deshabilitada por defecto; documentar activación |
| OBS-012 | Sin spans SQL por sentencia | Diagnóstico de BD limitado | BAJO | Métricas Hikari/JVM; evaluar proxy en tarea futura |

---

## 8. Diseño propuesto (Fase 2)

### 8.1 Modelo de correlación

- `trace_id` + `span_id` + `parent_span_id` W3C.
- `session_id` anónimo de pestaña (frontend) / ejecución (agente).
- `request_id` por petición HTTP.
- `task_id`, `agent_id`, `skill_id`, `workflow_id` para agentes.
- `service_name` y `environment` obligatorios en todo evento.

### 8.2 Frontend

- Instrumentar el punto único `fetchWithTimeout`, no cada componente.
- Propagar `traceparent` solo a `/api/**`.
- Capturar errores globales, navegación, autenticación y rendimiento.
- Sampling configurable y exportación OTLP opcional.

### 8.3 Backend

- No duplicar el span HTTP de Spring Boot.
- Añadir Actuator, Micrometer Tracing y OTLP.
- Instrumentar casos de uso con `@Observed`.
- Correlacionar logs con MDC (`traceId`, `spanId`, `requestId`, `sessionId`, `agentId`).
- Proteger Actuator y no registrar datos sensibles.

### 8.4 Agentes

- Wrapper Node sin dependencias para eventos JSONL.
- Campos compartidos con la aplicación.
- Evidencia obligatoria para `success`.
- Documentadores reportan impacto y documentos a actualizar.

---

## 9. Plan de implementación y compatibilidad

| Fase | Cambio | Riesgo | Mitigación |
| --- | --- | --- | --- |
| P4.1 | Añadir Actuator, AOP, Micrometer Tracing OTel, OTLP, Prometheus | Bajo: BOM de Boot 3.4.4 gestiona versiones | Compilar antes de seguir |
| P4.2 | `application.yml`: management, ECS, sampling | Medio: cambia formato de logs | Configurable por `APP_LOG_FORMAT`; documentado |
| P4.3 | `RequestCorrelationFilter` | Bajo: solo añade cabeceras/MDC | Validación de formato y limpieza en `finally` |
| P4.4 | `@Observed` en servicios | Bajo: AOP; no cambia firmas | Spans de baja cardinalidad |
| P4.5 | Seguridad: health público y cabeceras CORS expuestas | Bajo | Solo `health`; resto autenticado |
| P4.6 | Frontend `src/telemetry/` + `fetchWithTimeout` | Medio: toca el cliente HTTP central | Preservar semántica de timeout/errores; build |
| P4.7 | `main.tsx`, `App.tsx`, `Workspace.tsx` | Bajo: eventos, sin lógica de negocio | Sin datos personales |
| P4.8 | Wrapper de agentes + documentos | Bajo: no ejecuta acciones | Solo escribe JSONL |
| P5 | Validación build + HTTP + navegador + agente | — | Evidencia en el informe final |

Compatibilidad:

- Spring Boot 3.4.4 gestiona Micrometer 1.14.5, Micrometer Tracing 1.4.4 y OpenTelemetry 1.43.0.
- Java 21 cumple los requisitos.
- No se actualizaron dependencias mayores.
- No se modificaron entidades, DTOs, rutas, respuestas ni migraciones.
- Se añadieron rutas de Actuator; son nuevas y no sustituyen contratos existentes.

---

## 10. Recomendaciones

1. **Mantener el contrato:** cualquier evento nuevo debe pasar por `TRACING.md` y por revisión de datos sensibles.
2. **Activar OTLP en un entorno controlado:** desplegar un colector (OTel Collector + Jaeger/Tempo) y activar `OTEL_TRACING_EXPORT_ENABLED=true`.
3. **Prometheus/Grafana:** scrapear `/actuator/prometheus` con autenticación o red interna; no exponerlo a Internet.
4. **Pruebas automatizadas:** añadir tests de contrato HTTP con `traceparent` y tests de `traceContext` en frontend; hoy solo hay build y humo manual.
5. **CSRF:** revisar la decisión de deshabilitarlo con cookies; es un riesgo preexistente, no parte de esta intervención.
6. **Documentadores:** convertirlos en documentación viva del proyecto (endpoints/componentes reales) o renombrarlos como guías; hoy no cumplen esa función.
7. **Spans SQL:** evaluar `datasource-proxy` solo si el diagnóstico lo exige; medir impacto.
8. **Retención y acceso:** definir políticas de retención y control de acceso a logs/trazas antes de producción.

---

## 11. Resultado de la intervención (Fase 4)

### 11.1 Archivos añadidos/modificados

| Archivo | Cambio |
| --- | --- |
| `backend/pom.xml` | Actuator, AOP, `micrometer-tracing-bridge-otel`, `opentelemetry-exporter-otlp`, `micrometer-registry-prometheus`. |
| `backend/src/main/resources/application.yml` | `management.*`, sampling, OTLP opcional, ECS, `app.environment`, patrón de logs. |
| `backend/.../observability/ObservabilityConfiguration.java` | `ObservedAspect` + etiquetas comunes. |
| `backend/.../observability/RequestCorrelationFilter.java` | `request_id`, `session_id`, `agent_id`, MDC, `X-Request-Id`, `X-Trace-Id`, log de cierre. |
| `backend/.../security/SecurityConfiguration.java` | `/actuator/health` público, cabeceras CORS expuestas. |
| `backend/.../auth/AuthService.java` | `@Observed(name="service.auth")`. |
| `backend/.../records/RecordService.java` | `@Observed(name="service.records")`. |
| `backend/.../workshops/WorkshopService.java` | `@Observed(name="service.workshops")`. |
| `backend/.../roles/RoleService.java` | `@Observed(name="service.roles")`. |
| `backend/.../users/UserAdminService.java` | `@Observed(name="service.users")`. |
| `src/telemetry/types.ts` | Contrato TypeScript de spans/eventos. |
| `src/telemetry/traceContext.ts` | W3C trace context. |
| `src/telemetry/index.ts` | Eventos, errores, rendimiento, sesión. |
| `src/telemetry/otlp.ts` | Exportador OTLP/HTTP JSON opcional. |
| `src/api/http.ts` | Span `http.client`, `traceparent`, `X-Request-Id`, `X-Session-Id`, eventos. |
| `src/main.tsx` | `initTelemetry()` + `onUncaughtError`. |
| `src/App.tsx` | Eventos de navegación/sesión. |
| `src/components/Workspace.tsx` | Evento `ui.navigation`. |
| `src/vite-env.d.ts` | Variables `VITE_*`. |
| `.env.example` | Configuración de telemetría frontend. |
| `scripts/agent-trace.mjs` | Wrapper de eventos de agentes. |
| `specs/agentes/AGENTS.md` | §9 y fila 10 del historial. |
| `specs/arquitectura/ORQUESTADOR.md` | §13. |
| `specs/skills/SKILLS.md` | §13. |
| `docs/backend/documentadorBackend.md` | Contrato de reporte de impacto. |
| `docs/frontend/documentadorFrontend.md` | Contrato de reporte de impacto. |
| `specs/skills/Frontend/SKILL.md` | §14 de observabilidad. |
| `TRACING.md` | Contrato oficial. |
| `AUDIT_OBSERVABILITY.md` | Este documento. |

### 11.2 Estado final (resumen; el detalle validado está en el informe de entrega)

| Componente | Estado final | Implementación | Validación |
| --- | --- | --- | --- |
| Actuator/health | IMPLEMENTED | Starter + exposición | Build + humo |
| Micrometer Observation/Tracing | IMPLEMENTED | `@Observed`, bridge OTel | Build + span en logs |
| OTLP export | IMPLEMENTED (opcional) | Exportador OTLP/HTTP | Deshabilitado por defecto; no se probó colector |
| Prometheus | IMPLEMENTED | Registro + endpoint | Build; endpoint autenticado |
| Correlation ID | IMPLEMENTED | Filtro + MDC + cabeceras | Prueba HTTP |
| Structured logging | IMPLEMENTED | ECS | Log de arranque/HTTP |
| Frontend tracing | IMPLEMENTED | `src/telemetry/` + fetch | Build + navegador |
| Frontend errors/perf | PARTIAL | Global handlers + LCP/FID | Build; sin boundary visual ni CLS |
| Agent tracing | IMPLEMENTED | Wrapper JSONL | Prueba de delegación |
| Documentadores | PARTIAL | Contrato de impacto | Revisión documental |

---

## 12. Limitaciones declaradas

1. No hay colector OTLP desplegado; la exportación está deshabilitada por defecto y no se validó recepción externa.
2. No hay integración automática entre la plataforma de agentes y la aplicación; el wrapper es invocado por el agente.
3. No se añadieron spans de repositorio/SQL por sentencia; solo spans de servicio y métricas de pool/JVM.
4. No se añadió un `ErrorBoundary` visual; se capturan errores globales y de render de React 19, pero la UI no tiene una pantalla de fallback específica.
5. No hay pruebas automatizadas de observabilidad; la validación es build + pruebas de humo documentadas.
6. El cambio a logs ECS altera el formato de consola; es configurable con `APP_LOG_FORMAT`.
7. La instrumentación de agentes depende de que el agente invoque el wrapper; no se simula telemetría automática.
