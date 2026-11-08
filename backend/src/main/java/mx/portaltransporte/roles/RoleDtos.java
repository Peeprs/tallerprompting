package mx.portaltransporte.roles;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.util.List;
import java.util.UUID;

// Actor: ADMINISTRADOR gestiona catalogo y asignaciones.
// DTOs de roles dinamicos (valor + descripcion). Tecnica: validacion estricta sin campos extra.
public final class RoleDtos {
    private RoleDtos() { }
    // Creacion con valor y descripcion. Tecnica: el valor se normaliza a mayusculas en servicio.
    public record CreateRoleRequest(@NotBlank @Pattern(regexp = "^[A-Z][A-Z0-9_]{2,39}$") String name, @NotBlank @Size(max = 150) String description) { }
    // Edicion solo de descripcion. Tecnica: el valor es inmutable para no romper autoridades.
    public record UpdateRoleRequest(@NotBlank @Size(max = 150) String description) { }
    // Asignacion a usuario existente. Tecnica: username opaco en body, sin id en URL.
    public record AssignRoleRequest(@NotBlank String username, @NotBlank @Pattern(regexp = "^[A-Z][A-Z0-9_]{2,39}$") String roleName) { }
    // Respuesta de rol. Tecnica: UUID v7 con fecha, no secuencial.
    public record RoleResponse(UUID id, String name, String description) { }
    // Respuesta de usuario con roles. Tecnica: lista ordenada para UI.
    public record UserRolesResponse(String username, List<String> roles) { }
}
