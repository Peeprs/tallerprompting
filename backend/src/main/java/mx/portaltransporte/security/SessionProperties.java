package mx.portaltransporte.security;

import org.springframework.boot.context.properties.ConfigurationProperties;

// Actor: sistema (todos los roles). Propiedades de sesion sin hardcodear.
// Tecnica: valores desde env, cookie opaca sin id predecible en URL.
@ConfigurationProperties(prefix = "app.session")
public record SessionProperties(String cookieName, boolean secure, long maxAgeSeconds) { }
