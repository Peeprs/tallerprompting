import { defineConfig } from 'deepsec/config';

export default defineConfig({
  defaultAgent: 'codex',
  projects: [
    {
      id: 'portal-transporte',
      // Esta carpeta es src/; el repositorio completo está en el directorio padre.
      root: '..',
      priorityPaths: [
        'backend/src/main/java/mx/portaltransporte/auth/',
        'backend/src/main/java/mx/portaltransporte/security/',
        'backend/src/main/java/mx/portaltransporte/users/',
        'src/api/',
        'src/components/',
      ],
      promptAppend:
        'Prioriza autenticación, autorización por roles, gestión de sesiones, recuperación de contraseña, validación de entrada y exposición de datos. Las contraseñas se guardan con BCrypt; no es posible recuperarlas en texto plano. Revisa el frontend y backend juntos.',
    },
  ],
});
