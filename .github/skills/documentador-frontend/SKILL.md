---
name: documentador-frontend
description: Usa esta guía para documentar o reorganizar el frontend React + TypeScript + Vite según la estructura híbrida app/features/shared, revisar límites de dominio y mantener documentación frontend coherente.
---

# Documentación y organización frontend

1. Lee `docs/frontend/documentadorFrontend.md` como guía de opciones y criterios empresariales.
2. Lee `docs/frontend/ESTRUCTURA.md` para la adaptación al árbol y contratos reales de este proyecto.
3. Trata la aplicación como SPA React + TypeScript + Vite: conserva `main.tsx`, la navegación actual en memoria, `global.css`, los adaptadores HTTP y la telemetría.
4. Organiza por dominio dentro de `features`; reserva `shared` para piezas realmente reutilizadas y `app` para composición/configuración.
5. Migra en lotes pequeños, actualiza imports en el mismo lote y valida con `npm run build`. Si Node/npm no están disponibles, no declares el build exitoso y limita el cambio a una etapa verificable.

La guía de estructura no autoriza a añadir dependencias, router ni funcionalidades. Conserva el comportamiento y los contratos existentes.