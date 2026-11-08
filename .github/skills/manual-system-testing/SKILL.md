---
name: manual-system-testing
description: Guía pruebas manuales exploratorias y de aceptación del Portal de Transporte; prepara entorno local, ejecuta flujos de autenticación, permisos y operaciones, y registra evidencia sin exponer datos sensibles. Úsala cuando se soliciten pruebas manuales, validación funcional, checklist de QA o preparación de una sesión de pruebas.
---

# Pruebas manuales del sistema

## Propósito

Guía a una persona para validar el comportamiento funcional desde la interfaz y, cuando corresponda, confirmar autorización en la API. No sustituye las pruebas automatizadas ni el análisis de seguridad de DeepSec.

## Preparación

1. Lee `src/MANUAL_TESTING.md` para los escenarios vigentes y `backend/README.md` para el arranque local.
2. Usa una instancia local o de pruebas autorizada y datos ficticios. No ejecutes escenarios destructivos en producción.
3. Arranca MySQL y Spring Boot según la documentación del backend; inicia el frontend desde la raíz con `npm run dev`.
4. Comprueba que la interfaz abre en `http://127.0.0.1:5173` y que la API responde. Registra cualquier impedimento como bloqueador, no como fallo funcional.
5. Obtén la cuenta administrativa desde la configuración local del backend. Nunca leas, copies ni solicites contraseñas, tokens, cookies o hashes.

## Ejecución y evidencia

1. Selecciona escenarios pertinentes en `src/MANUAL_TESTING.md`: flujos válidos, entradas inválidas, permisos, estados vacíos/errores y accesibilidad básica.
2. Ejecuta un escenario a la vez y compara el resultado visible con lo esperado. Para autorización, verifica también la respuesta de la API cuando el escenario lo indique.
3. Registra cada resultado como `Correcto`, `Error`, `No probado` o `Bloqueado`, junto con fecha, navegador, escenario, resultado esperado/obtenido y un identificador de solicitud o traza si existe.
4. Usa capturas solo con datos ficticios y elimina o tapa información personal. No incluyas credenciales, cookies, tokens, cuerpos de autenticación ni secretos en reportes.
5. Para un error, registra pasos mínimos reproducibles y el mensaje visible. No corrijas datos directamente en producción ni deshabilites controles para continuar.

## Relación con automatización

- Las pruebas manuales validan flujos funcionales, experiencia de usuario, accesibilidad básica y resultados visibles que requieren interacción humana.
- Las pruebas automatizadas cubren solo los casos configurados y ejecutados; no afirmes que existen si no se han encontrado y ejecutado.
- DeepSec es un análisis de seguridad separado. Consulta `src/DEEPSEC.md` y sigue sus pasos explícitos; `process` y `revalidate` pueden usar un agente/modelo y consumir créditos. No ejecutes esos comandos como parte de una sesión manual sin autorización expresa.
- No presentes una sesión manual como auditoría de seguridad ni un escaneo DeepSec como sustituto de la aceptación funcional.

## Cierre

Resume cobertura, resultados, bloqueos y defectos observados. Distingue lo ejecutado de lo no probado; no inventes resultados ni declares aprobado el sistema si quedan escenarios críticos sin validar.

## Activación

En VS Code con GitHub Copilot, pide: `Usa la skill manual-system-testing y guíame para ejecutar las pruebas manuales del sistema.` También puede invocarse con `/manual-system-testing` si aparece en el selector de skills. Si no aparece, confirma que está en `.github/skills/manual-system-testing/SKILL.md` y recarga la ventana de VS Code.