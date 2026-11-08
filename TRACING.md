# TRACING.md — Contrato oficial de observabilidad

> **Ámbito:** Portal de Transporte (Spring Boot 3.4 / Java 21 / React + TypeScript + Vite) y agentes de IA del repositorio.
> **Estado:** contrato vigente. Cualquier cambio de instrumentación, nombres de eventos o campos debe actualizar este archivo.
> **Auditoría de origen:** `AUDIT_OBSERVABILITY.md`.
> **Regla de oro:** no se declara una operación exitosa sin evidencia verificable; no se registran secretos, tokens, cookies, cuerpos de solicitud ni datos personales.

---

## 1. Objetivos

1. Correlacionar una operación de extremo a extremo: interacción en React → solicitud HTTP → Controller → Service → Repository/BD → respuesta → evento de agente.
2. Usar W3C Trace Context (`traceparent`) como mecanismo de propagación y Micrometer/OpenTelemetry como modelo de spans y métricas.
3. Permitir diagnóstico por `trace_id` en logs, métricas, consola del navegador y archivo de eventos de agentes.
4. Medir latencia, errores, tráfico y saturación sin etiquetas de alta cardinalidad ni datos sensibles.
5. Integrar a los agentes y documentadores existentes sin reemplazarlos ni duplicar sus responsabilidades.

## 2. Alcance

Incluido:

- Frontend React/Vite: inicialización, navegación, autenticación, peticiones HTTP, errores globales, rendimiento y exportación OTLP opcional.
- Backend Spring Boot: spans HTTP de servidor, spans de casos de uso (`service.*`), correlación por MDC, Actuator, métricas Prometheus y exportación OTLP opcional.
- Agentes: wrapper `scripts/agent-trace.mjs` y eventos JSONL para tareas, delegaciones, skills, herramientas, archivos, pruebas y cierres.
- Documentadores de Frontend y Backend: reporte de impacto documental y evidencia.

Excluido por ahora:

- Instrumentación automática del runtime de la plataforma de agentes (no expone hooks de ciclo de vida al repositorio).
- Spans de cada sentencia SQL (ver §11.4 y limitaciones).
- Despliegue de Jaeger/Zipkin/Grafana/Loki/Prometheus: el contrato define la integración, no instala infraestructura.
- Captura de cuerpos, cabeceras de autenticación o variables de entorno.

## 3. Arquitectura

```text
┌─────────────────────────────┐        ┌──────────────────────────────────┐
│ React + Vite                │        │ Spring Boot 3.4 / Java 21        │
│                             │        │                                  │
│ app.initialized             │        │ ServerHttpObservationFilter      │
│ app.navigation              │        │   └─ http.server span            │
│ ui.navigation               │        │ RequestCorrelationFilter         │
│ http.client span            │        │   └─ request_id + MDC            │
│   traceparent ──────────────┼───────▶│ Micrometer Tracing (OTel bridge) │
│ X-Request-Id / X-Session-Id │        │   └─ service.* spans (@Observed) │
│                             │        │ Hikari/JPA + Actuator            │
│ OTLP JSON (opcional)        │        │ OTLP HTTP (opcional)             │
└─────────────────────────────┘        └──────────────────────────────────┘
              │                                      │
              │ eventos de consola / búfer            │ logs ECS + métricas
              ▼                                      ▼
      Observabilidad local                 Colector OTLP / Prometheus
              │
              │ trace_id / task_id / agent_id
              ▼
┌────────────────────────────────────────────────────────────────────────┐
│ Agentes: scripts/agent-trace.mjs → .observability/agent-events.jsonl  │
│ Orquestador → delegación → agente hijo → evidencia → cierre            │
└────────────────────────────────────────────────────────────────────────┘
```

Principios:

- **Una traza, varios servicios.** El frontend genera el `trace_id` de la operación; el backend lo consume desde `traceparent`. El agente usa su propio `trace_id` de tarea y lo reporta; cuando llama a la API envía `X-Agent-Id` para dejar el vínculo explícito.
- **Sin duplicación.** Spring Boot ya genera el span HTTP del servidor; no se crea otro filtro de traza. Los servicios se instrumentan una vez con `@Observed`.
- **Sin acoplamiento de negocio.** La telemetría no altera contratos HTTP, reglas de negocio ni respuestas de error.

## 4. Identificadores

| Campo | Obligatorio | Formato | Origen | Uso |
| --- | --- | --- | --- | --- |
| `timestamp` | Sí | RFC 3339 UTC (`2026-11-08T21:00:00.000Z`) | emisor | Orden temporal |
| `event_name` | Sí | `dominio.accion` en minúsculas | emisor | Catálogo §7 |
| `trace_id` | Sí | 32 hex, no todo cero | frontend/backend/agente | Correlación extremo a extremo |
| `span_id` | Sí | 16 hex, no todo cero | emisor | Identidad del span/evento |
| `service_name` | Sí | `portal-frontend`, `portal-backend`, `agent-runtime` | emisor | Origen |
| `environment` | Sí | `local`, `dev`, `staging`, `prod` | configuración | Separación de entornos |
| `parent_span_id` | No | 16 hex | emisor | Relación padre-hijo |
| `session_id` | No | 32 hex anónimo | frontend/backend/agente | Agrupa una pestaña o ejecución |
| `task_id` | No | `TASK-…` | agente | Tarea de negocio/ejecución |
| `agent_id` | No | slug (`backend-doc`, `frontend-doc`, `orquestador`) | agente | Responsable |
| `skill_id` | No | slug de skill | agente | Skill cargada/ejecutada |
| `workflow_id` | No | `WF-…` | orquestador | Flujo completo |
| `request_id` | No | UUID/32-64 caracteres seguros | frontend/backend | Correlación de una petición concreta |

Reglas:

- No generar un `trace_id` nuevo si existe uno válido en `traceparent` o en el entorno de la tarea.
- `request_id` no sustituye a `trace_id`; es un identificador de petición para logs y respuesta HTTP.
- `session_id` del frontend es anónimo y vive en `sessionStorage`; **no** es la cookie `PORTAL_SESSION` ni un token.
- No usar ids de usuario, RFC, placas, correos, teléfonos o nombres como etiquetas de métricas.

## 5. Propagación de contexto

1. **Frontend → Backend:** cabecera `traceparent: 00-<trace_id>-<span_id>-01` en toda petición a `/api/**`. Se añaden `X-Request-Id` y `X-Session-Id` (anónimo). No se envían a terceros (por ejemplo, Postali).
2. **Backend:** Spring Boot extrae `traceparent` con el propagador W3C y continúa la traza. `RequestCorrelationFilter` lee `X-Request-Id`, `X-Session-Id` y `X-Agent-Id`, los valida y los publica en MDC. Devuelve `X-Request-Id` y `X-Trace-Id` al cliente.
3. **Backend → servicios externos:** si en el futuro se usa `RestClient`/`WebClient`, Spring Boot inyecta `traceparent` automáticamente cuando la observación HTTP de cliente está activa. No crear cabeceras manuales.
4. **Agente → Backend:** el agente puede probar la API con `traceparent`, `X-Request-Id` y `X-Agent-Id`; el `trace_id` de la tarea debe coincidir con el de la prueba cuando sea posible. Si no coincide, registrar ambos en `attributes`.
5. **Agente → Agente:** el wrapper recibe `--trace` y `--parent`; la tarea hija conserva el `trace_id` padre y usa el `span_id` padre como `parent_span_id`.
6. **Baggage:** no se usa. Si se incorpora, debe limitarse a valores no sensibles y documentarse aquí.

Formato de cabeceras:

```http
traceparent: 00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01
X-Request-Id: 7d444840-9dc0-11ee-8c99-0242ac120002
X-Session-Id: 5f2d1c3b4a6e7d8c9b0a1f2e3d4c5b6a
X-Agent-Id: backend-doc
```

## 6. Convenciones de nombres

- Eventos: `dominio.accion` (`http.request.started`, `auth.session.started`, `agent.delegation.completed`).
- Spans de servidor: `http.server` (generado por Spring Boot; no renombrar).
- Spans de cliente HTTP: `http.client`.
- Spans de casos de uso: `service.auth`, `service.records`, `service.workshops`, `service.roles`, `service.users`.
- Spans de agente: `agent.task`, `agent.delegation`, `skill.execution`, `tool.invocation`.
- Atributos: `snake_case` para campos del contrato propio (`http.request.method`) y nombres estándar OTel cuando existan (`http.request.method`, `http.response.status_code`, `url.path`, `server.address`, `error.type`).
- Métricas: `portal.http.server.requests` (si se necesita una métrica propia), `http.server.requests` (Micrometer), `jvm.*`, `hikaricp.*`. No crear métricas con `trace_id` como etiqueta.

## 7. Catálogo de eventos

### 7.1 Frontend (implementado en `src/telemetry/`)

| Evento | Cuándo | Atributos mínimos | Severidad |
| --- | --- | --- | --- |
| `app.initialized` | Arranque de la SPA | `service.version`, `page.path` | info |
| `app.navigation` | Cambio de pantalla de acceso | `screen` | info |
| `ui.navigation` | Cambio de sección privada | `section`, `roles_count` | info |
| `auth.session.started` | Login exitoso | `roles_count` | info |
| `auth.session.ended` | Cierre de sesión | `roles_count` | info |
| `auth.logout.requested` | El usuario pulsa cerrar sesión | — | info |
| `http.request.started` | Antes de `fetch` | `http.request.method`, `url.path`, `http.request_id` | info |
| `http.response` | Respuesta 2xx/3xx | `http.response.status_code`, `duration_ms` | info |
| `http.failure` | Respuesta 4xx/5xx o error de red/timeout | `error.type`, `duration_ms` | warn/error |
| `app.exception` | Error global o promesa rechazada | `error.type`, `error.message` saneado, `error.source` | error |
| `performance.navigation` | `load` | `performance.ttfb_ms`, `performance.dom_content_loaded_ms`, `performance.load_ms` | info |
| `performance.largest_contentful_paint` | LCP disponible | `performance.value_ms` | info |
| `performance.first_input_delay` | FID disponible | `performance.value_ms` | info |

### 7.2 Backend (implementado)

| Señal | Cuándo | Campos | Destino |
| --- | --- | --- | --- |
| `http.server` span | Cada request HTTP | método, ruta, status, duración | OTLP / logs |
| `service.*` span | Método público de servicio | clase, método, excepción | OTLP / logs |
| `http.request.completed` | Fin de request | `method`, `path`, `status`, `duration_ms`, `request_id`, `trace_id`, `span_id` | log `httpAudit` |
| `http.request.failed` | Excepción no controlada | `method`, `path`, `error` (clase), ids | log `httpAudit` |
| `workshop_created` / `workshop_updated` | Auditoría existente de talleres | `actor`, `workshop`, `status` | log `workshopAudit` |
| Métricas Actuator | Continuo | `http.server.requests`, `jvm.*`, `hikaricp.*`, `process.*` | `/actuator/metrics`, `/actuator/prometheus` |

### 7.3 Agentes (wrapper `scripts/agent-trace.mjs`)

| Evento | Cuándo | Campos propios |
| --- | --- | --- |
| `agent.task.started` | Inicio de tarea | `agent_id`, `task_id`, `workflow_id`, `summary` |
| `agent.task.completed` | Cierre | `status`, `evidence`, `files_changed` |
| `agent.delegation.started` | Antes de delegar | `parent_span_id`, agente hijo, tarea |
| `agent.delegation.completed` | Al recibir resultado | `status`, `evidence` |
| `skill.loaded` / `skill.executed` | Carga/ejecución de skill | `skill_id` |
| `tool.invoked` | Herramienta | `attributes.tool` |
| `mcp.operation` | Operación MCP | `attributes.server`, `attributes.operation` |
| `file.modified` | Archivo tocado | `files_changed` |
| `test.executed` | Prueba | `attributes.command`, `attributes.result` |
| `security.check` | Revisión de seguridad | `attributes.result` |
| `failure` / `retry` | Error/reintento | `attributes.error_type`, `attributes.attempt` |
| `docs.impact.detected` | Documentador detecta cambio | `components`, `endpoints`, `services`, `dtos`, `configs`, `docs_to_update` |

## 8. Estructura de logs

### 8.1 Evento JSON canónico (frontend/agentes)

```json
{
  "timestamp": "2026-11-08T21:00:00.000Z",
  "event_name": "http.response",
  "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736",
  "span_id": "00f067aa0ba902b7",
  "parent_span_id": "a3ce929d0e0e4736",
  "session_id": "5f2d1c3b4a6e7d8c9b0a1f2e3d4c5b6a",
  "service_name": "portal-frontend",
  "environment": "local",
  "severity": "info",
  "attributes": {
    "http.request.method": "POST",
    "url.path": "/api/v1/auth/login",
    "http.response.status_code": 200,
    "duration_ms": 87
  }
}
```

### 8.2 Log ECS del backend

El backend usa `logging.structured.format.console=ecs` por defecto. Cada línea incluye, además de los campos ECS, el MDC:

- `traceId`, `spanId` (Micrometer Tracing).
- `requestId`, `sessionId`, `agentId` (filtro de correlación).
- El mensaje conserva pares `clave=valor` (`event=...`, `method=...`, `path=...`).

Ejemplo de mensaje (los campos ECS los añade Logback):

```text
event=http.request.completed method=POST path=/api/v1/auth/login status=200 duration_ms=87 request_id=... trace_id=... span_id=...
```

Para volver a formato de texto: `APP_LOG_FORMAT=` o `APP_LOG_FORMAT=plain` (según el valor admitido por Spring Boot; si se usa vacío, eliminar la propiedad). No cambiar el formato en caliente sin actualizar este contrato.

### 8.3 Reglas de redacción

- Nunca registrar: `Authorization`, `Cookie`, `Set-Cookie`, `password`, `token`, `devToken`, cuerpos JSON, números de tarjeta, RFC, placas, correos, teléfonos, nombres.
- `url.path` se sanea: sin query string, ids UUID sustituidos por `{id}` y códigos postales por `{postalCode}`.
- Los errores se registran por tipo y mensaje saneado (correos y secuencias numéricas largas redactados).
- El `session_id` es anónimo; no permite reconstruir la identidad.

## 9. Métricas

| Métrica | Tipo | Etiquetas | Uso |
| --- | --- | --- | --- |
| `http.server.requests` | timer | `method`, `uri`, `status`, `outcome`, `exception` | Latencia y errores HTTP |
| `http.client.requests` | timer | `method`, `uri`, `status`, `outcome` | Dependencias salientes |
| `jvm.memory.used` / `jvm.gc.*` | gauge/timer | `area`, `id`, `cause` | Salud de JVM |
| `hikaricp.connections.*` | gauge | `pool` | Saturación de BD |
| `process.cpu.usage` | gauge | — | CPU |
| `system.cpu.usage` | gauge | — | CPU del host |
| `logback.events` | counter | `level` | Volumen de logs |

Reglas:

- No usar `trace_id`, `session_id`, `request_id`, `task_id` como etiquetas de métricas (alta cardinalidad).
- `application` y `environment` son etiquetas comunes de baja cardinalidad.
- El scraping de Prometheus se hace contra `/actuator/prometheus` con autenticación; `health` es público.

## 10. Instrumentación Frontend

Implementación real:

- `src/telemetry/traceContext.ts`: generación/parseo W3C, sin dependencias.
- `src/telemetry/index.ts`: sesión anónima, spans, eventos, errores globales, rendimiento y búfer de 200 eventos.
- `src/telemetry/otlp.ts`: exportador OTLP/HTTP JSON opcional (`VITE_OTLP_TRACES_ENDPOINT`).
- `src/api/http.ts`: punto único de instrumentación HTTP. Crea span `http.client`, inyecta `traceparent`/`X-Request-Id`/`X-Session-Id` solo para `/api/**` y registra respuesta/fallo.
- `src/main.tsx`: `initTelemetry()` antes de renderizar y `onUncaughtError` de React.
- `src/App.tsx` y `src/components/Workspace.tsx`: navegación y eventos de sesión/UI.

Contrato para nuevos componentes:

1. No llamar `fetch` directamente; usar `fetchWithTimeout` o los clientes de `src/api/`.
2. No añadir `console.log` de datos de usuario; usar `trackEvent` con atributos primitivos y no sensibles.
3. No duplicar spans por componente; el span HTTP ya existe.
4. Para una operación de negocio nueva, usar `startSpan('operacion.nombre', {...})` y `endSpan(span, 'ok'|'error')`.
5. Respetar `VITE_TRACING_SAMPLE_RATE`; no forzar sampling en producción.

## 11. Instrumentación Backend

### 11.1 Componentes

- `spring-boot-starter-actuator`: health, info, metrics, Prometheus.
- `micrometer-tracing-bridge-otel`: puente Micrometer → OpenTelemetry y propagador W3C.
- `opentelemetry-exporter-otlp`: exportación OTLP/HTTP opcional.
- `micrometer-registry-prometheus`: formato Prometheus.
- `@Observed(name = "service.*")` en `AuthService`, `RecordService`, `WorkshopService`, `RoleService`, `UserAdminService` + `ObservedAspect`.
- `RequestCorrelationFilter`: `request_id`, `session_id`, `agent_id`, MDC y cabeceras de respuesta.

### 11.2 Propiedades

```yaml
management:
  endpoints.web.exposure.include: health,info,metrics,prometheus
  endpoint.health.probes.enabled: true
  tracing.sampling.probability: ${APP_TRACING_SAMPLE_RATE:1.0}
  tracing.propagation.type: w3c
  otlp.tracing.endpoint: ${OTEL_EXPORTER_OTLP_TRACES_ENDPOINT:http://127.0.0.1:4318/v1/traces}
  otlp.tracing.export.enabled: ${OTEL_TRACING_EXPORT_ENABLED:false}
logging.structured.format.console: ${APP_LOG_FORMAT:ecs}
```

Para enviar a un colector: `OTEL_TRACING_EXPORT_ENABLED=true` y `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT=http://<collector>:4318/v1/traces`. Sin colector, la traza sigue viva para logs y cabeceras, pero no se exporta (no se simula una conexión).

### 11.3 Nuevos endpoints

1. Mantener `@PreAuthorize` y los DTOs existentes.
2. No crear un span manual para el controller: el span `http.server` ya cubre la entrada.
3. Si el caso de uso es nuevo, instrumentarlo con `@Observed` en el servicio o `ObservationRegistry` si es asíncrono.
4. Propagar `traceparent` solo a través de clientes HTTP administrados por Spring; no construirlo a mano.
5. Añadir pruebas de humo con `traceparent` y verificar `X-Trace-Id` en la respuesta.

### 11.4 Repositorios y base de datos

- HikariCP y JPA exponen métricas de pool y JVM.
- No se añadió un proxy de repositorios: envolver cada `Repository` con AOP alteraría el comportamiento de Spring Data y añadiría spans de alta cardinalidad. Los spans de caso de uso (`service.*`) delimitan la operación de persistencia.
- Si se requiere SQL por sentencia, evaluar `datasource-proxy` o instrumentación de Hibernate en una tarea específica, con medición de impacto. No está implementado ni validado aquí.
- Nunca registrar SQL con parámetros reales.

## 12. Instrumentación de agentes

### 12.1 Wrapper real

`scripts/agent-trace.mjs` (Node, sin dependencias) escribe `.observability/agent-events.jsonl`.

```bash
node scripts/agent-trace.mjs start --agent backend-doc --task TASK-001 --workflow WF-001 --summary "Documentar cambio"
node scripts/agent-trace.mjs emit --type skill.loaded --trace <trace_id> --parent <span_id> --skill spring-boot-rest-spec
node scripts/agent-trace.mjs emit --type file.modified --trace <trace_id> --parent <span_id> --file-changed backend/src/main/java/...
node scripts/agent-trace.mjs emit --type test.executed --trace <trace_id> --parent <span_id> --attr command="mvn -B compile" --attr result="BUILD SUCCESS"
node scripts/agent-trace.mjs emit --type agent.task.completed --trace <trace_id> --parent <span_id> --status success --evidence "mvn -B compile: BUILD SUCCESS"
node scripts/agent-trace.mjs report
```

### 12.2 Qué depende de la plataforma y qué del wrapper

- **Wrapper:** eventos de tarea, delegación, skills, herramientas, archivos, pruebas y cierres. Es verificable y no depende de la plataforma.
- **Plataforma:** inicio/cierre automático de sesiones de agente, llamadas internas del modelo y uso de tokens. OpenCode no expone esos hooks al repositorio; no se inventan ni se simulan.
- **Integración real disponible:** instrucciones en `specs/agentes/AGENTS.md`, `specs/arquitectura/ORQUESTADOR.md`, `specs/skills/SKILLS.md` y los dos documentadores. El agente debe invocar el wrapper; no se asume telemetría automática.

### 12.3 Evidencia obligatoria

- `status=success` exige al menos una `--evidence` verificable y, si se modificó código, `--file-changed`.
- `status=partial` si falta una validación; `failed` si la validación falló.
- El informe final incluye el `trace_id`, las tareas delegadas y los `X-Trace-Id` de pruebas HTTP.

## 13. Seguridad

- **Datos prohibidos:** secretos, tokens, cookies, contraseñas, cuerpos, RFC, placas, correos, teléfonos, nombres, direcciones, datos de clientes.
- **Cabeceras permitidas:** `traceparent`, `X-Request-Id`, `X-Session-Id` (anónimo), `X-Agent-Id` (slug). El backend valida su forma antes de usarlas.
- **CORS:** el backend expone solo `X-Request-Id` y `X-Trace-Id`; no expone credenciales.
- **Actuator:** `health` público; `metrics`, `prometheus`, `env` y detalles requieren autenticación. No habilitar `env`, `heapdump` ni `threaddump` en producción.
- **OTLP:** endpoint configurable por entorno; no incluir API keys en el bundle del navegador. Si el colector requiere autenticación, usar un proxy del lado servidor.
- **Retención:** los logs y eventos pueden contener metadatos operativos; aplicar la política del proyecto y no conservarlos indefinidamente.
- **Agentes:** el wrapper no ejecuta comandos ni lee archivos; solo escribe el evento que el agente le pasa. La validación de secretos es responsabilidad del agente y del revisor.

## 14. Sampling

- Frontend: `VITE_TRACING_SAMPLE_RATE` (0.0–1.0), por defecto `1.0` en desarrollo. El valor se decide al crear la raíz de la pestaña; los spans hijos heredan `sampled`.
- Backend: `APP_TRACING_SAMPLE_RATE` (por defecto `1.0` en local; en producción usar un valor acorde al volumen, por ejemplo `0.1`).
- El sampling no debe romper la propagación: si no se muestrea, `traceparent` se envía con flags `00`, pero el `trace_id` se conserva.
- Errores y `http.failure` son eventos de alto valor; si se reduce el sampling, mantener el registro de errores (el frontend los emite igualmente; el backend puede usar un sampler específico en una tarea futura).
- No se muestrea el archivo de agentes: es de baja cardinalidad y alto valor de auditoría.

## 15. Retención

| Señal | Retención sugerida | Responsable |
| --- | --- | --- |
| Logs de aplicación (ECS) | 7–30 días según entorno | operación |
| Trazas OTLP | 7 días en local; 30 días en staging/prod | operación del colector |
| Métricas Prometheus | 15–30 días | operación |
| `.observability/agent-events.jsonl` | por ejecución; rotar/archivar al cerrar el proyecto | orquestador |
| Búfer del navegador | 200 eventos en memoria; se pierde al cerrar la pestaña | frontend |

La retención real la define la infraestructura. Este contrato no crea políticas de borrado automático.

## 16. Manejo de errores

- **Frontend:** `window.error`, `unhandledrejection`, `onUncaughtError` de React y fallos HTTP se registran como `app.exception`/`http.failure` con tipo y mensaje saneado. La telemetría nunca lanza una excepción hacia la UI.
- **Backend:** el span HTTP registra el estado y la excepción; `RequestCorrelationFilter` registra `http.request.failed` con la clase de excepción, sin mensaje ni stack. No se añadió un `@RestControllerAdvice` para no alterar el contrato de errores existente.
- **Agentes:** `failure`/`retry` con `error_type` y `attempt`; el cierre debe ser `partial`/`failed` si no hay evidencia.
- **Correlación de errores:** todo error debe incluir `trace_id` y `span_id`; si no existe traza, el wrapper genera una y lo indica en el reporte.

## 17. Integración de nuevos agentes

Checklist:

- [ ] Declarar `agent_id` estable y `workflow_id` si participa en un flujo.
- [ ] Abrir traza con `agent-trace.mjs start`.
- [ ] Registrar `skill.loaded`/`skill.executed` y `tool.invoked`/`mcp.operation`.
- [ ] Propagar `--trace` y `--parent` en delegaciones.
- [ ] Registrar `file.modified` con rutas relativas.
- [ ] Registrar `test.executed` con comando y resultado.
- [ ] Cerrar con `agent.task.completed`, `status` y `evidence`.
- [ ] No duplicar reglas de `AGENTS.md`; solo referenciar `TRACING.md`.

## 18. Integración de nuevas Skills

- La skill debe declarar su `skill_id` y los eventos que emite (`skill.loaded`, `skill.executed`).
- No crear una skill de observabilidad paralela: usar `src/telemetry/` y `scripts/agent-trace.mjs`.
- Si la skill genera código, debe respetar §10/§11 y añadir una validación con `npm run build` o `mvn -B compile`.
- Documentar en la skill solo lo específico; el contrato general vive aquí.

## 19. Integración de nuevos endpoints

1. Definir ruta, método, DTO, validación, autorización y errores según `specs/skills/SKILLS.md`.
2. No crear spans manuales en el controller.
3. Instrumentar el servicio con `@Observed` si el caso de uso es relevante.
4. Verificar `traceparent` entrante y `X-Trace-Id` saliente.
5. Añadir el endpoint al catálogo de documentación del documentador de Backend y emitir `docs.impact.detected`.
6. Probar 200/201/204 y al menos un error 400/401/403/409, con `trace_id` continuo.

## 20. Procedimientos de validación

### 20.1 Build

```bash
cd backend && mvn -B -q -DskipTests compile
npm run build
```

### 20.2 Prueba HTTP con traza conocida

```bash
TRACE_ID=4bf92f3577b34da6a3ce929d0e0e4736
SPAN_ID=00f067aa0ba902b7
curl -i -X POST http://127.0.0.1:8083/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -H "traceparent: 00-${TRACE_ID}-${SPAN_ID}-01" \
  -H 'X-Request-Id: prueba-login-001' \
  -H 'X-Session-Id: 5f2d1c3b4a6e7d8c9b0a1f2e3d4c5b6a' \
  -d '{"identifier":"...","password":"..."}'
```

Verificar:

- `X-Trace-Id` en la respuesta = `TRACE_ID`.
- `X-Request-Id` = `prueba-login-001`.
- Log `http.request.completed` con `trace_id=TRACE_ID` y `span_id` del servidor.
- Span `http.server` y span `service.auth` con el mismo `trace_id` (en colector o en logs con `traceId`).

### 20.3 Prueba frontend

1. `npm run dev` y abrir la SPA.
2. En consola, comprobar `[telemetry]` con `app.initialized`.
3. Ejecutar login; comprobar `http.request.started` y `http.response` con el mismo `trace_id`.
4. Capturar la solicitud en DevTools: debe llevar `traceparent` y `X-Request-Id`.
5. Comparar el `trace_id` del frontend con `X-Trace-Id` de la respuesta y con el log del backend.

### 20.4 Prueba de agentes

```bash
node scripts/agent-trace.mjs start --agent orquestador --task TASK-DEMO --workflow WF-DEMO
node scripts/agent-trace.mjs emit --type agent.delegation.started --trace <trace_id> --parent <span_id> --agent backend-doc --task TASK-DEMO-1
node scripts/agent-trace.mjs emit --type agent.delegation.completed --trace <trace_id> --parent <span_id> --status success --evidence "revisión de archivos"
node scripts/agent-trace.mjs report
```

Verificar que la tarea hija comparte `trace_id` y que `parent_span_id` apunta al span del orquestador.

### 20.5 Criterio de cierre

- [ ] Build backend y frontend en verde.
- [ ] `traceparent` propagado y `X-Trace-Id` coincide.
- [ ] Logs con `trace_id`/`span_id`/`request_id`.
- [ ] Actuator `health` y `metrics`/`prometheus` protegidos según §13.
- [ ] Eventos de agente con evidencia y sin datos sensibles.
- [ ] Limitaciones declaradas (especialmente ausencia de colector y de hooks automáticos de la plataforma).

---

## Anexo A — Esquema JSON mínimo

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "Portal Transporte Telemetry Event",
  "type": "object",
  "required": ["timestamp", "event_name", "trace_id", "span_id", "service_name", "environment"],
  "properties": {
    "timestamp": { "type": "string", "format": "date-time" },
    "event_name": { "type": "string", "pattern": "^[a-z0-9]+(\\.[a-z0-9_]+)+$" },
    "trace_id": { "type": "string", "pattern": "^[a-f0-9]{32}$" },
    "span_id": { "type": "string", "pattern": "^[a-f0-9]{16}$" },
    "parent_span_id": { "type": "string", "pattern": "^[a-f0-9]{16}$" },
    "session_id": { "type": "string" },
    "task_id": { "type": "string" },
    "agent_id": { "type": "string" },
    "skill_id": { "type": "string" },
    "workflow_id": { "type": "string" },
    "service_name": { "type": "string" },
    "environment": { "type": "string" },
    "severity": { "enum": ["info", "warn", "error"] },
    "attributes": { "type": "object" }
  },
  "additionalProperties": false
}
```

## Anexo B — Mapeo a OpenTelemetry

| Contrato | OTel/OTLP |
| --- | --- |
| `trace_id` | `traceId` (hex) |
| `span_id` | `spanId` (hex) |
| `parent_span_id` | `parentSpanId` |
| `event_name` | nombre del span o atributo `event.name` |
| `timestamp` | `startTimeUnixNano`/`endTimeUnixNano` |
| `service_name` | `resource.attributes["service.name"]` |
| `environment` | `resource.attributes["deployment.environment"]` |
| `attributes.*` | `span.attributes[]` (AnyValue) |
| `severity` | `status.code` (1 OK, 2 ERROR) |

El exportador del frontend envía `resourceSpans[].scopeSpans[].spans[]` en OTLP/HTTP JSON. El backend usa el exportador OTLP de OpenTelemetry a través del puente de Micrometer.
