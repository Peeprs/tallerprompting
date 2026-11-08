package mx.portaltransporte.auth;

import org.springframework.boot.context.properties.ConfigurationProperties;

// Actor: usuario sin acceso que recupera clave.
// Bandera de exposicion de token solo para desarrollo. Tecnica: en prod siempre false.
@ConfigurationProperties(prefix = "app.recovery")
public record RecoveryProperties(boolean devExpose) { }
