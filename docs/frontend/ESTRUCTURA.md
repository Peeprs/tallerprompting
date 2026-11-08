# Estructura propuesta para el frontend

La guía de `documentadorFrontend.md` recomienda una estructura híbrida: configuración en `app`, código organizado por dominio en `features` y reutilización real en `shared`. Para esta SPA React + TypeScript + Vite, se propone esta adaptación sin introducir React Router ni nuevas dependencias.

## Estructura objetivo

```text
src/
  app/
    App.tsx
    layouts/
      Workspace.tsx
  features/
    auth/
      api/
      components/
      model/
    clients/
      components/
      model/
    records/
      api/                 # API compartida hoy por clientes y vehículos
    vehicles/
      components/
      model/
    workshops/
      api/
      components/
      model/
    users/
      api/
      components/
  shared/
    api/                   # cliente HTTP y contratos transversales
    ui/                    # primitivas reutilizables sin lógica de dominio
    constants/
    lib/
    styles/
    telemetry/
    types/
  main.tsx                 # punto de entrada de Vite
```

## Reglas de límites

- `app` compone pantallas y navegación actual en memoria; no reemplazarla por router sin una necesidad aprobada.
- Cada `features/<dominio>` posee sus componentes y adaptadores específicos. `recordsApi` queda en `features/records` mientras sirva tanto a clientes como a vehículos.
- `shared` contiene piezas usadas por más de un dominio: `http`, controles genéricos, tipos comunes, paginación, validación general, estilos y telemetría.
- Los componentes consumen adaptadores tipados; no llaman `fetch` directamente ni construyen URLs.
- Mantén `global.css` centralizado y no dupliques CSS por componente. Conserva el contrato de trazas descrito en `TRACING.md`.
- Mueve por lotes pequeños, actualiza imports en el mismo lote y ejecuta `npm run build` antes de continuar.

## Correspondencia inicial

| Actual | Destino |
| --- | --- |
| `src/app/App.tsx`, `src/app/layouts/Workspace.tsx` | Ya migrados a `src/app/` |
| `AuthShell`, formularios de acceso, `PasswordRules` | `src/features/auth/` |
| `ClientDialog`, `ClientsSection` | `src/features/clients/` |
| `VehicleDialog`, `VehiclesSection`, catálogo de vehículos | `src/features/vehicles/` |
| `WorkshopDialog`, `WorkshopSection`, API de talleres, estados y CP | `src/features/workshops/` |
| `RolesSection`, API de roles | `src/features/users/` |
| API de fichas de clientes/vehículos | `src/features/records/api/` |
| controles comunes, HTTP, tipos, utilidades, paginación, estilos, telemetría | `src/shared/` |

El shell de aplicación (`App` y `Workspace`) ya está en `src/app/`; las secciones y servicios restantes siguen en sus rutas actuales y se migrarán por lotes. No dejes carpetas vacías ni agregues capas que solo reexporten módulos sin aportar una frontera útil.