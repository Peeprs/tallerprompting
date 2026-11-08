package mx.portaltransporte.roles;

// Actor: ADMINISTRADOR y sistema (seeds y registro inicial).
// Nombres base y reglas de roles dinamicos. Tecnica: evita literales duplicados en servicios.
public final class RolePolicy {
    // Roles base del sistema. Tecnica: mismos valores que el seed inicial.
    public static final String ADMINISTRADOR = "ADMINISTRADOR";
    public static final String RECEPCIONISTA = "RECEPCIONISTA";
    public static final String TRANSPORTISTA = "TRANSPORTISTA";
    // Valor de rol: mayusculas, numeros y guion bajo, 3-40. Tecnica: misma regex que el frontend.
    public static final String NAME_PATTERN = "^[A-Z][A-Z0-9_]{2,39}$";
    private RolePolicy() { }
}
