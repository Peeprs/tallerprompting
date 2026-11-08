# Frontend — Portal de Transporte

Aplicación React + TypeScript para los flujos de acceso y el espacio de trabajo con control visual por rol.

## Instrucciones y skills

- `.github/copilot-instructions.md` conecta las instrucciones del workspace con la documentación fuente.
- `specs/agentes/AGENTS.md` contiene las reglas del proyecto y `specs/arquitectura/ORQUESTADOR.md` el flujo de trabajo.
- Las skills instalables para Copilot están en `.github/skills/`; su documentación fuente permanece en `specs/skills/`.
- Para aceptación funcional, invoca `manual-system-testing` y sigue `src/MANUAL_TESTING.md`. DeepSec es un análisis de seguridad independiente; consulta `src/DEEPSEC.md`.

## Ejecutar

```bash
npm install
npm run dev
```

La aplicación queda disponible en `http://127.0.0.1:5173`.

Durante desarrollo, Vite reenvía las solicitudes `/api` a Spring Boot en
`http://127.0.0.1:8080`; no se requiere exponer una URL o secreto en React.

## Integración esperada

El frontend usa rutas relativas y no almacena secretos ni tokens:

- `POST /api/v1/auth/login`
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/recovery/request`
- `POST /api/v1/auth/recovery/reset`

El backend debe devolver sesión mediante cookie `HttpOnly`, `Secure` y `SameSite`, además de `displayName` y `roles` después de un inicio de sesión exitoso.
