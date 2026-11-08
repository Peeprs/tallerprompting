package mx.portaltransporte.roles;

import java.util.List;
import java.util.Locale;
import java.util.UUID;
import mx.portaltransporte.domain.Role;
import mx.portaltransporte.domain.UserAccount;
import mx.portaltransporte.domain.factory.RoleFactory;
import mx.portaltransporte.repository.RoleRepository;
import mx.portaltransporte.repository.UserAccountRepository;
import io.micrometer.observation.annotation.Observed;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

// Actor: ADMINISTRADOR crea, edita, elimina y asigna roles.
// Servicio de roles dinamicos. Tecnica: solo valida duplicado y persiste via Factory.
@Service @Transactional
@Observed(name = "service.roles")
public class RoleService {
  private final RoleRepository roles;
  private final UserAccountRepository users;
  private final RoleFactory roleFactory = new RoleFactory();
  // Guarda dependencias. Actor: sistema. Tecnica: inyeccion por constructor.
  public RoleService(RoleRepository roles, UserAccountRepository users) { this.roles = roles; this.users = users; }
  // Lista catalogo ordenado. Actor: ADMINISTRADOR. Tecnica: alimenta dropdown y tabla en una sola lectura.
  public List<RoleDtos.RoleResponse> listRoles() { return roles.findAll().stream().map(role -> new RoleDtos.RoleResponse(role.getId(), role.getName(), role.getDescription())).sorted((left, right) -> left.name().compareTo(right.name())).toList(); }
  // Crea rol si el valor no existe. Actor: ADMINISTRADOR. Tecnica: normaliza a mayusculas, 409 si duplicado.
  public RoleDtos.RoleResponse createRole(RoleDtos.CreateRoleRequest request) { String wanted = request.name().trim().toUpperCase(Locale.ROOT); if (roles.findByNameIgnoreCase(wanted).isPresent()) throw new ResponseStatusException(HttpStatus.CONFLICT, "Role already exists"); Role saved = roles.save(roleFactory.create(new RoleFactory.RoleParams(wanted, request.description().trim()))); return new RoleDtos.RoleResponse(saved.getId(), saved.getName(), saved.getDescription()); }
  // Edita la descripcion. Actor: ADMINISTRADOR. Tecnica: el valor no cambia para no romper sesiones.
  public RoleDtos.RoleResponse updateRole(UUID id, RoleDtos.UpdateRoleRequest request) { Role role = roles.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Role not found")); role.updateDescription(request.description().trim()); Role saved = roles.save(role); return new RoleDtos.RoleResponse(saved.getId(), saved.getName(), saved.getDescription()); }
  // Elimina rol sin usuarios. Actor: ADMINISTRADOR. Tecnica: 409 si esta asignado, nunca borra usuarios.
  public void deleteRole(UUID id) { Role role = roles.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Role not found")); if (users.countByRolesName(role.getName()) > 0) throw new ResponseStatusException(HttpStatus.CONFLICT, "Role is assigned to users"); roles.delete(role); }
  // Asigna rol existente a usuario existente. Actor: ADMINISTRADOR. Tecnica: idempotente, no duplica asignacion.
  public RoleDtos.UserRolesResponse assignRole(RoleDtos.AssignRoleRequest request) { UserAccount user = users.findByUsername(request.username().trim()).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found")); Role role = roles.findByNameIgnoreCase(request.roleName().trim()).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Role not found")); if (user.getRoles().stream().noneMatch(current -> current.getName().equalsIgnoreCase(role.getName()))) user.getRoles().add(role); users.save(user); List<String> names = user.getRoles().stream().map(Role::getName).sorted().toList(); return new RoleDtos.UserRolesResponse(user.getUsername(), names); }
}
