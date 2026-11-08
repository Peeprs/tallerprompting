package mx.portaltransporte.roles;

import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

// Actor: ADMINISTRADOR (unico que crea, edita, elimina y asigna).
// Rutas de roles con UUID opacos. Tecnica: ids no secuenciales, nunca en texto predecible.
@RestController @RequestMapping("/api/v1/roles")
@PreAuthorize("hasRole('ADMINISTRADOR')")
public class RoleController {
  private final RoleService service;
  // Guarda servicio. Actor: sistema. Tecnica: constructor unico.
  public RoleController(RoleService service) { this.service = service; }
  // Lista roles. Actor: ADMINISTRADOR. Tecnica: alimenta dropdown y tabla juntos.
  @GetMapping public List<RoleDtos.RoleResponse> list() { return service.listRoles(); }
  // Crea rol validando duplicado. Actor: ADMINISTRADOR. Tecnica: 409 si el valor ya existe.
  @PostMapping @ResponseStatus(HttpStatus.CREATED) public RoleDtos.RoleResponse create(@Valid @RequestBody RoleDtos.CreateRoleRequest request) { return service.createRole(request); }
  // Edita descripcion. Actor: ADMINISTRADOR. Tecnica: id UUID en URL, no predecible.
  @PutMapping("/{id}") public RoleDtos.RoleResponse update(@PathVariable UUID id, @Valid @RequestBody RoleDtos.UpdateRoleRequest request) { return service.updateRole(id, request); }
  // Elimina rol libre. Actor: ADMINISTRADOR. Tecnica: 409 si tiene usuarios asignados.
  @DeleteMapping("/{id}") @ResponseStatus(HttpStatus.NO_CONTENT) public void delete(@PathVariable UUID id) { service.deleteRole(id); }
  // Asigna rol a usuario. Actor: ADMINISTRADOR. Tecnica: operacion idempotente por username.
  @PostMapping("/assign") public RoleDtos.UserRolesResponse assign(@Valid @RequestBody RoleDtos.AssignRoleRequest request) { return service.assignRole(request); }
}
