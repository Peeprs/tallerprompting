package mx.portaltransporte.users;

import java.util.List;

// Actor: ADMINISTRADOR busca usuarios para asignar roles.
// DTOs de administracion de usuarios. Tecnica: sin datos sensibles, solo username y roles.
public final class UserDtos {
    private UserDtos() { }
    // Resumen para el dropdown buscable. Tecnica: lista acotada a 20 por consulta.
    public record UserSummary(String username, List<String> roles) { }
}
