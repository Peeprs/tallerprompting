# Instrucciones del workspace

Antes de cambiar código, lee `specs/agentes/AGENTS.md` y `specs/arquitectura/ORQUESTADOR.md`. Para cambios de backend, consulta `specs/skills/SKILLS.md`; para React/Vite, usa `react-best-practices`; para documentar o reorganizar la arquitectura frontend, usa `documentador-frontend`. Para sesiones de aceptación funcional, usa `manual-system-testing` y los escenarios de `src/MANUAL_TESTING.md`.

Respeta el alcance pedido, los contratos existentes y los datos del usuario. No inventes ejecución ni resultados. No imprimas ni guardes secretos. Distingue análisis manual, pruebas automatizadas y escaneo DeepSec: son controles distintos. Verifica los cambios con comandos disponibles y declara cualquier validación que no pudo ejecutarse.

La documentación fuente se mantiene en `specs/`; las skills descubribles por Copilot viven en `.github/skills/` y deben enlazar a esa fuente para evitar copias divergentes.