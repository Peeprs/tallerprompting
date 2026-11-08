package mx.portaltransporte.auth;

import java.util.Set;

// Actor: visitante y usuarios (restringe dominios admitidos en registro).
// Politica centralizada de autenticacion. Tecnica: evita duplicar literales en servicio y frontend.
public final class AuthPolicy {
    // Dominios admitidos. Tecnica: lista unica usada en registro y recuperacion.
    public static final Set<String> ADMITTED_DOMAINS = Set.of("gmail.com", "hotmail.com", "outlook.com", "microsoft.com");
    // Regex de contrasena segura 12-128 con 4 clases. Tecnica: misma regla que PasswordRules del frontend.
    public static final String PASSWORD_PATTERN = "(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z0-9]).{12,128}";
    // Tamano del token opaco de sesion/recuperacion. Tecnica: 32 bytes aleatorios en Base64Url.
    public static final int TOKEN_BYTES = 32;
    private AuthPolicy() { }
}
