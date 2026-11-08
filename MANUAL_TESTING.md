# Guía de pruebas manuales

Pruebas exploratorias para el portal. Usa una base local y datos ficticios. El backend ofrece rutas bajo `/api/v1`; la interfaz React se sirve con Vite.

## Preparación

1. En la raíz del repositorio, prepara las variables requeridas por `backend/.env.example` y arranca MySQL y Spring Boot según `backend/README.md`.
2. En otra terminal, desde la raíz, ejecuta `npm run dev` y abre `http://127.0.0.1:5173`.
3. El usuario administrador inicial se crea desde `APP_ADMIN_USERNAME`, `APP_ADMIN_EMAIL` y `APP_ADMIN_PASSWORD` del entorno del backend. Usa esos valores locales; si se olvidaron, cambia/restablece la contraseña, no intentes leerla de MySQL.
4. Registra los resultados de cada escenario (Correcto / Error / No probado), navegador, fecha y mensaje visible. No pongas contraseñas, tokens ni datos reales en capturas.

## Autenticación y cuentas

- **Inicio de sesión válido:** entra con el administrador de desarrollo; debe abrirse el espacio de trabajo y mostrar nombre/roles correctos.
- **Inicio inválido:** prueba usuario inexistente y contraseña incorrecta; no debe abrir sesión ni revelar si existe una cuenta.
- **Persistencia de sesión:** inicia sesión y recarga la página; debe mantenerse el espacio de trabajo mientras la cookie siga vigente. En Red, `GET /api/v1/auth/session` debe responder 200. Cierra sesión, recarga y confirma que vuelve al login.
- **Registro:** crea usuario con username válido, correo admitido y contraseña que cumpla cada regla; confirma el aviso de éxito y el regreso al login después de 3 segundos. Confirma también rechazo de nombre duplicado, correo no admitido, contraseñas débiles y confirmación distinta.
- **Cerrar sesión:** cierra sesión y vuelve atrás en el navegador; las rutas protegidas deben seguir bloqueadas.
- **Recuperación:** solicita recuperación para una cuenta de prueba, usa el token de desarrollo solo en entorno local, establece una contraseña válida y verifica que el token usado o vencido no sirva otra vez.
- **Bloqueo y sesión:** repite intentos fallidos hasta observar el comportamiento de protección; valida expiración/cierre según la configuración del backend.

## Roles y autorización

- Como `ADMINISTRADOR`, comprueba que aparece “Asignar Roles”, busca por fragmento de usuario, asigna un rol y confirma que queda reflejado.
- Como usuario sin privilegios administrativos, confirma que la sección no se muestra y que una petición directa de gestión de usuarios/roles responde no autorizado.
- Prueba un rol inválido y un usuario inexistente; no debe guardarse una asignación parcial.

## Flujos principales

- **Clientes:** crear cliente persona y empresa con datos ficticios; valida campos obligatorios, duplicados y contactos. Consulta, pagina, edita y elimina según permisos.
- **Vehículos:** registra VIN válido de 17 caracteres y placa; deja el kilometraje vacío y repite con uno válido. Prueba duplicados de VIN y placa, VIN incompleto, edición y consulta.
- **Fotos de vehículos:** sube de 1 a 3 imágenes PNG, JPG o WebP de hasta 15 MB cada una; confirma el rechazo de una cuarta foto, un archivo mayor al límite o un formato distinto. Al editar, las fotos nuevas reemplazan el conjunto anterior.
- **Asociación de vehículos:** al terminar el alta, elige un cliente activo en el modal. En la tabla confirma que aparece como asignado; para un vehículo disponible abre el selector de cliente. Al pulsar “Desvincular”, cancela y confirma el modal; el vehículo debe quedar disponible y el historial del cliente conservar la desvinculación.
- **Talleres:** alta y edición; prueba búsqueda de código postal válido, sin cobertura e incompleto, captura manual de dirección, carga/cambio de imagen y eliminación.
- **Navegación y estados:** cambia entre secciones, usa paginación, recarga y verifica mensajes de éxito/error, estados vacíos, indicador de carga y recuperación ante API desconectada.
- **Accesibilidad básica:** recorre formularios con Tab/Shift+Tab, comprueba etiquetas, foco visible, errores asociados al campo y botones operables con teclado.

## Consulta de usuarios en MySQL

La tabla `user_account` guarda `username` y `password_hash`; la contraseña es BCrypt y no se puede consultar/revertir. Para listar solamente cuentas y roles desde un cliente MySQL local:

```sql
SELECT u.username, GROUP_CONCAT(r.name ORDER BY r.name SEPARATOR ', ') AS roles,
       u.status, u.created_at
FROM user_account u
LEFT JOIN user_role ur ON ur.user_id = u.id
LEFT JOIN role r ON r.id = ur.role_id
GROUP BY u.id, u.username, u.status, u.created_at
ORDER BY u.username;
```

Usa las credenciales locales de `docker-compose.yml` o del entorno de la aplicación sin copiarlas a este documento. Para recuperar acceso, usa el flujo de recuperación o actualiza la contraseña mediante la aplicación/seed administrativo; nunca selecciones ni compartas `password_hash`.
