# Guía para agentes

Este archivo es el punto de entrada común para agentes del repositorio.

1. Lee `specs/agentes/AGENTS.md` para reglas, actores, restricciones y contexto del sistema.
2. Lee `specs/arquitectura/ORQUESTADOR.md` para el flujo SPEC, trazabilidad y cierre.
3. En tareas de backend, consulta `specs/skills/SKILLS.md` y la skill `.github/skills/spring-boot-rest-spec/SKILL.md`.
4. En tareas React/Vite, usa `.github/skills/react-best-practices/SKILL.md`; para documentación o estructura, añade `.github/skills/documentador-frontend/SKILL.md`.
5. Para validar flujos de usuario manualmente, usa `.github/skills/manual-system-testing/SKILL.md` y ejecuta los escenarios de `src/MANUAL_TESTING.md`.

Las skills no ejecutan por sí solas pruebas ni análisis. Registra evidencia real y distingue validación manual, pruebas automatizadas y DeepSec.