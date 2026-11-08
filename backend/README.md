# Backend — Portal de Transporte

Spring Boot 3.4, Java 21, MySQL y Flyway. El esquema inicial se crea con `V1__identity_clients_vehicles.sql`; `V10` agrega kilometraje y hasta tres fotos por vehículo.

## Requisitos

- JDK 21 o superior.
- Maven 3.9 o superior.
- MySQL 8.0 o superior.
- Copiar `.env.example` a un archivo de secretos local y exportar sus valores antes de arrancar. Nunca se versionan llaves reales.

## Ejecución

```bash
export DB_URL='jdbc:mysql://127.0.0.1:3306/transporteDb'
export DB_USERNAME='usuario_local'
export DB_PASSWORD='contrasena_local'
export APP_ENCRYPTION_KEY='base64-de-32-bytes'
export APP_LOOKUP_KEY='base64-de-32-bytes'
mvn spring-boot:run
```

Las contraseñas se guardan con BCrypt y no se cifran de forma reversible. AES-GCM protege datos recuperables; las búsquedas sensibles usan HMAC-SHA-256.

## Rutas disponibles

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `GET /api/v1/auth/session` — consulta por hash de la cookie `HttpOnly`, carga la cuenta asociada y excluye sesiones revocadas/vencidas para restaurar usuario y roles.
- `POST /api/v1/auth/logout`
- `POST /api/v1/vehicles` y `PUT /api/v1/vehicles/{id}` — multipart con los datos y hasta 3 fotos PNG, JPG o WebP de 15 MB cada una.
- `POST /api/v1/auth/recovery/request`
- `POST /api/v1/auth/recovery/reset`
- `POST /api/v1/clients` — roles `ADMINISTRADOR`, `RECEPCIONISTA`
- `POST /api/v1/vehicles` — roles `ADMINISTRADOR`, `RECEPCIONISTA`
