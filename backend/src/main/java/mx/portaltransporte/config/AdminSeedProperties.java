package mx.portaltransporte.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

// Actor: sistema en arranque.
// Credenciales del administrador inicial desde env. Tecnica: sin hardcodear ni exponer en codigo.
@ConfigurationProperties(prefix = "app.admin")
public record AdminSeedProperties(String username, String email, String password) { }
