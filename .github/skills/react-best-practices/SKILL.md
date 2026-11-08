---
name: react-best-practices
description: Aplica la arquitectura, patrones y reglas locales de React + TypeScript + Vite al crear, revisar o reorganizar el frontend, incluidos componentes, API, estado, accesibilidad y rendimiento.
---

# React Best Practices del proyecto

La fuente de verdad es `specs/skills/Frontend/SKILL.md`. Léela primero y consulta en `specs/skills/Frontend/AGENTS.md` solo las reglas que apliquen al cambio. La adaptación es para SPA React + TypeScript + Vite; no apliques reglas exclusivas de Next.js.

Para reorganizar archivos sigue la estructura híbrida de `app`, `features` y `shared` de `docs/frontend/ESTRUCTURA.md`, basada en `docs/frontend/documentadorFrontend.md`. Conserva los contratos del cliente HTTP, telemetría y estilos globales. No hagas un traslado masivo sin actualizar imports y validar el build.