package mx.portaltransporte.security;
import org.springframework.boot.context.properties.ConfigurationProperties;
// Actor: sistema. Origen del frontend desde env. Tecnica: sin hardcodear URL.
@ConfigurationProperties(prefix = "app") public record FrontendProperties(String frontendOrigin) { }
