---
name: react-best-practices
description: Buenas prácticas y patrones de diseño para React + TypeScript + Vite (SPA). Úsala al escribir, revisar o refactorizar componentes, hooks, estado, data fetching, formularios, accesibilidad, rendimiento, carga diferida y sistema de diseño. Adaptada de Vercel React Best Practices, sin dependencia de Next.js.
license: MIT
metadata:
  author: Vercel Engineering / adaptación Portal de Transporte
  version: "1.1.0"
  source: https://github.com/vercel/react-best-practices
---

# React Best Practices — React + TypeScript + Vite

## 1. Qué es esta skill

Esta skill empaqueta las reglas de **Vercel React Best Practices** y las adapta a una **SPA con React + TypeScript + Vite**. No es un agente autónomo ni un ejecutable: es un documento de instrucciones que el agente carga cuando la tarea toca frontend.

- `SKILL.md` (este archivo) = **índice de activación**. Dice cuándo usarla, qué prioridades tiene y dónde está el detalle.
- `AGENTS.md` = **guía completa**. Contiene las 40+ reglas originales con ejemplos incorrecto/correcto, más la adaptación a React + Vite.

## 2. Para qué sirve

Sirve para que cualquier agente o persona:

1. Escriba componentes React consistentes con el proyecto.
2. Revise código y detecte antipatrones (waterfalls, re-renders, efectos innecesarios, keys inestables, fugas de listeners).
3. Optimice rendimiento sin caer en micro-optimizaciones prematuras.
4. Aplique los patrones de diseño del frontend: composición, cliente HTTP central, cache-aside, guard por rol y sistema de diseño único.
5. Mantenga accesibilidad, estados de error/vacío y validación espejo.

## 3. Cuándo activarla

- Crear o modificar componentes, secciones, diálogos, formularios o tablas.
- Implementar data fetching, caché, paginación o manejo de errores.
- Revisar re-renders, memoización, carga diferida o tamaño del bundle.
- Refactorizar hooks, estado o composición de componentes.
- Auditar accesibilidad, responsive o consistencia visual.
- Documentar o enseñar las reglas al equipo.

## 4. Cómo funciona

```text
Tarea de frontend
      │
      ▼
El agente detecta la skill por su description
      │
      ▼
Lee SKILL.md (índice, prioridades, patrones)
      │
      ▼
Si necesita detalle, lee AGENTS.md (regla concreta)
      │
      ▼
Aplica la regla, verifica con npm run build y revisa el checklist
```

**Progressive disclosure:** no se carga todo el documento de 3.800 líneas de golpe. Primero se consulta este índice; después, solo la sección necesaria de `AGENTS.md`.

## 5. Instalación

La demo reproducible, con comandos para OpenCode global, proyecto local y otros agentes, está en [`INSTALL.md`](./INSTALL.md). Ejecuta estos comandos desde `specs/skills/Frontend/`:

```bash
mkdir -p ~/.config/opencode/skills/react-best-practices
cp SKILL.md ~/.config/opencode/skills/react-best-practices/SKILL.md
cp AGENTS.md ~/.config/opencode/skills/react-best-practices/AGENTS.md
```

En OpenCode se activa por la `description` o invocándola: `usa la skill react-best-practices`.

## 6. Alcance: React + Vite, no Next.js

| Tema | En este proyecto | Estado |
| --- | --- | --- |
| React + TypeScript + Vite | `src/`, build con `npm run build` | Aplica |
| SPA sin SSR/RSC | No hay Server Components ni Server Actions | Aplica |
| Next.js (`next/*`) | No se usa | N/A |
| Data fetching | `src/api/http.ts` + `src/api/*` | Aplica |
| Estado | `useState`/`useRef` + caché de páginas | Aplica |
| Estilos | `src/styles/global.css` | Aplica |
| Navegación | Estado en memoria (`Workspace.tsx`) | Aplica |
| Tests | No configurados hoy | Pendiente |

## 7. Prioridades

| Prioridad | Categoría | Impacto | Prefijo | En esta SPA |
| --- | --- | --- | --- | --- |
| 1 | Eliminating Waterfalls | CRITICAL | `async-` | Aplica (fetch paralelo) |
| 2 | Bundle Size Optimization | CRITICAL | `bundle-` | Aplica (`React.lazy`) |
| 3 | Server-Side Performance | HIGH | `server-` | N/A (sin RSC/SSR) |
| 4 | Client-Side Data Fetching | MEDIUM-HIGH | `client-` | Aplica |
| 5 | Re-render Optimization | MEDIUM | `rerender-` | Aplica |
| 6 | Rendering Performance | MEDIUM | `rendering-` | Aplica |
| 7 | JavaScript Performance | LOW-MEDIUM | `js-` | Aplica |
| 8 | Advanced Patterns | LOW | `advanced-` | Aplica con cuidado |

## 8. Quick reference

### 1. Eliminating Waterfalls (CRITICAL)

- `async-cheap-condition-before-await` — evalúa condiciones baratas antes de esperar flags remotas.
- `async-defer-await` — mueve el `await` a la rama que realmente lo usa.
- `async-parallel` — `Promise.all()` para operaciones independientes.
- `async-dependencies` — paraleliza dependencias parciales.
- `async-api-routes` — `[Next.js]`; en esta SPA, agrupa llamadas en `src/api/*`.
- `async-suspense-boundaries` — usa `<Suspense>` para carga diferida.

### 2. Bundle Size Optimization (CRITICAL)

- `bundle-barrel-imports` — importa directo, evita barrels.
- `bundle-analyzable-paths` — rutas estáticas y analizables.
- `bundle-dynamic-imports` — `React.lazy()` + `<Suspense>` en lugar de `next/dynamic`.
- `bundle-defer-third-party` — carga analytics/logging después de la UI.
- `bundle-conditional` — carga módulos solo cuando se activa la función.
- `bundle-preload` — precarga en hover/focus con `import()`.

### 3. Server-Side Performance (HIGH) — `[Next.js]` N/A

- `server-auth-actions`, `server-cache-react`, `server-cache-lru`, `server-dedup-props`, `server-hoist-static-io`, `server-no-shared-module-state`, `server-serialization`, `server-parallel-fetching`, `server-parallel-nested-fetching`, `server-after-nonblocking`.
- **En esta SPA no aplican** salvo el concepto de composición/paralelismo. Se conservan para una futura migración.

### 4. Client-Side Data Fetching (MEDIUM-HIGH)

- `client-swr-dedup` — `[Opcional]`; hoy se usa `fetch` + cache-aside.
- `client-event-listeners` — deduplica listeners globales.
- `client-passive-event-listeners` — `{ passive: true }` en scroll/touch.
- `client-localstorage-schema` — versiona y minimiza `localStorage`.

### 5. Re-render Optimization (MEDIUM)

- `rerender-defer-reads` — no te suscribas a estado que solo usas en callbacks.
- `rerender-memo` — extrae trabajo costoso a componentes memoizados.
- `rerender-memo-with-default-value` — hoja defaults no primitivos a constantes.
- `rerender-dependencies` — dependencias primitivas en efectos.
- `rerender-derived-state` — deriva estado en render, no en efectos.
- `rerender-derived-state-no-effect` — no sincronices estado con `useEffect`.
- `rerender-functional-setstate` — usa `setState(prev => ...)`.
- `rerender-lazy-state-init` — inicialización perezosa para valores costosos.
- `rerender-simple-expression-in-memo` — no memoices expresiones simples.
- `rerender-split-combined-hooks` — separa hooks con dependencias independientes.
- `rerender-move-effect-to-event` — lógica de interacción en el handler.
- `rerender-transitions` — `startTransition` para actualizaciones no urgentes.
- `rerender-use-deferred-value` — `useDeferredValue` para renders costosos.
- `rerender-use-ref-transient-values` — `useRef` para valores transitorios.
- `rerender-no-inline-components` — no definas componentes dentro de componentes.

### 6. Rendering Performance (MEDIUM)

- `rendering-animate-svg-wrapper` — anima el wrapper, no el SVG.
- `rendering-content-visibility` — `content-visibility: auto` en listas largas.
- `rendering-hoist-jsx` — extrae JSX estático.
- `rendering-svg-precision` — reduce precisión de SVG.
- `rendering-hydration-no-flicker` — `[Next.js/SSR]`; no aplica en SPA.
- `rendering-hydration-suppress-warning` — `[Next.js/SSR]`; no aplica en SPA.
- `rendering-activity` — `[Experimental]`; no usado hoy.
- `rendering-conditional-render` — usa ternario, no `&&`, para condicionales.
- `rendering-usetransition-loading` — `useTransition` en lugar de loading manual.
- `rendering-resource-hints` — `[Opcional]` en React DOM 19.
- `rendering-script-defer-async` — `defer`/`async` en `index.html`.

### 7. JavaScript Performance (LOW-MEDIUM)

- `js-batch-dom-css`, `js-index-maps`, `js-cache-property-access`, `js-cache-function-results`, `js-cache-storage`, `js-combine-iterations`, `js-length-check-first`, `js-early-exit`, `js-hoist-regexp`, `js-min-max-loop`, `js-set-map-lookups`, `js-tosorted-immutable`, `js-flatmap-filter`, `js-request-idle-callback`.

### 8. Advanced Patterns (LOW)

- `advanced-effect-event-deps` — `[Experimental]`; no metas `useEffectEvent` en deps.
- `advanced-event-handler-refs` — guarda handlers en refs.
- `advanced-init-once` — inicializa la app una vez, no por montaje.
- `advanced-use-latest` — `useLatest` para callbacks estables.

## 9. Patrones de diseño del frontend

| Patrón | Qué resuelve | Dónde vive | Regla de uso |
| --- | --- | --- | --- |
| **Composición / container-presentational** | Separar datos de presentación | `Workspace.tsx` → `*Section.tsx` → `*Dialog.tsx` + `Pager`, `FormField`, `NoticeModal` | La sección orquesta; el diálogo edita; las primitivas no conocen la API |
| **Cliente HTTP centralizado** | Un solo timeout, credenciales y mapeo de errores | `src/api/http.ts` + `recordsApi`, `workshopsApi`, etc. | Ningún componente llama `fetch` directo |
| **Cache-aside con invalidación** | Evitar recargas y datos viejos | `ClientsSection.tsx` (`pageCache`, `evictPages`) | Toda mutación evicta; no cachear errores |
| **Guard por rol (defensa en profundidad)** | Ocultar lo no permitido sin confiar en la UI | `Workspace.tsx` + `@PreAuthorize` | La UI oculta; el servidor decide |
| **Formulario controlado + validación espejo** | Evitar capturas inválidas y divergencia front/back | `ClientDialog.tsx`, `validation.ts` | Mismas regex y mensajes en ambos lados |
| **Diálogo de confirmación** | Evitar acciones destructivas accidentales | `ConfirmDialog.tsx` | Baja/reactivar siempre confirman |
| **Notificación no bloqueante** | Feedback sin interrumpir | `Toast.tsx` + `NoticeModal.tsx` | Éxito → toast; error de permiso → modal |
| **Sistema de diseño único** | Consistencia visual y menos CSS | `global.css` + `Icon.tsx` | Tokens/clases compartidas; sin estilos por componente |
| **Adaptador de API por recurso** | Tipar contratos y aislar rutas | `src/api/*.ts` | El componente consume tipos, no URLs |

## 10. Reglas React obligatorias

1. Hooks en el nivel superior; nunca condicionales.
2. Un componente, una responsabilidad.
3. Estado mínimo y derivado; no sincronizar con efectos.
4. Efectos solo para el exterior (fetch, suscripciones, timers, DOM).
5. Cancelar o ignorar respuestas tardías (`AbortController`, bandera `alive`).
6. Formularios controlados, validación por campo y submit bloqueado mientras `pending`.
7. `key` estable en listas; nunca el índice si se reordena.
8. Accesibilidad: `label`, `aria-label`, foco en modales, Escape, teclado y contraste.
9. `React.lazy` + `<Suspense>` solo para componentes pesados o rutas.
10. Sin `useMemo`/`useCallback` preventivos; medir primero.
11. Loading, error, vacío y sin permiso son estados explícitos.
12. La UI oculta por rol; el backend autoriza.

## 11. Flujo de trabajo con el agente

1. El agente lee `AGENTS.md` del proyecto y este `SKILL.md`.
2. Identifica la categoría afectada (waterfalls, bundle, re-render, etc.).
3. Consulta la regla concreta en `AGENTS.md`.
4. Aplica el cambio mínimo y respeta los patrones del proyecto.
5. Ejecuta `npm run build` y revisa el checklist de la sección 0.5 de `AGENTS.md`.
6. Reporta evidencia: archivos tocados, comandos y resultado.

## 12. Checklist rápido

- [ ] ¿Hooks en nivel superior y dependencias completas?
- [ ] ¿Estado derivado en render, sin efectos de sincronización?
- [ ] ¿Fetch con cancelación, loading/error/vacío?
- [ ] ¿Formularios validados y submit bloqueado?
- [ ] ¿Keys estables y `aria-label` en iconos?
- [ ] ¿Modales con foco y Escape?
- [ ] ¿Carga diferida solo donde aporta?
- [ ] ¿Mutación invalida caché?
- [ ] ¿Rol oculto en UI y validado en backend?
- [ ] ¿`npm run build` en verde?

## 13. Referencias

- Guía completa adaptada: [`AGENTS.md`](./AGENTS.md)
- Instalación y demo: [`INSTALL.md`](./INSTALL.md)
- Presentación de 3 diapositivas: [`react-best-practices-3-diapositivas.pptx`](../../../docs/presentaciones/react-best-practices-3-diapositivas.pptx)
- Reglas originales: <https://github.com/vercel/react-best-practices>
- React: <https://react.dev>
- Vite: <https://vite.dev>

## 14. Observabilidad en cambios de frontend

Todo cambio que toque `src/api/http.ts`, el cliente HTTP o los flujos de autenticación/navegación debe conservar el contrato de `TRACING.md`: propagación de `traceparent` solo hacia `/api`, `X-Request-Id`, `X-Session-Id` anónimo, spans `http.client` y eventos sin cuerpos ni datos personales. No duplicar instrumentación en componentes; usar `src/telemetry/`. Validar con `npm run build` y, si se prueba en navegador, reportar el `X-Trace-Id` del backend.

