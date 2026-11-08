package mx.portaltransporte.users;

import java.util.List;
import mx.portaltransporte.domain.Role;
import mx.portaltransporte.repository.UserAccountRepository;
import io.micrometer.observation.annotation.Observed;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

// Actor: ADMINISTRADOR filtra usuarios en el dropdown de asignacion.
// Busqueda acotada de usuarios. Tecnica: top 20 insensible a mayusculas, sin exponer correo ni hash.
@Service @Transactional(readOnly = true)
@Observed(name = "service.users")
public class UserAdminService {
  private final UserAccountRepository users;
  // Guarda repositorio. Actor: sistema. Tecnica: inyeccion por constructor.
  public UserAdminService(UserAccountRepository users) { this.users = users; }
  // Busca por fragmento de username. Actor: ADMINISTRADOR. Tecnica: minimo 1 caracter, maximo 20 filas.
  public List<UserDtos.UserSummary> searchUsers(String fragment) { String cleaned = fragment == null ? "" : fragment.trim(); if (cleaned.length() < 1) return List.of(); return users.findTop20ByUsernameContainingIgnoreCase(cleaned).stream().map(user -> new UserDtos.UserSummary(user.getUsername(), user.getRoles().stream().map(Role::getName).sorted().toList())).toList(); }
}
