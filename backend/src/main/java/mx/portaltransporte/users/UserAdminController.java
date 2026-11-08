package mx.portaltransporte.users;

import java.util.List;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

// Actor: ADMINISTRADOR (unico que consulta el padron para asignar).
// Padron acotado sin datos sensibles. Tecnica: query param de busqueda, sin ids en URL.
@RestController @RequestMapping("/api/v1/users")
@PreAuthorize("hasRole('ADMINISTRADOR')")
public class UserAdminController {
  private final UserAdminService service;
  // Guarda servicio. Actor: sistema. Tecnica: constructor unico.
  public UserAdminController(UserAdminService service) { this.service = service; }
  // Busca usuarios por fragmento. Actor: ADMINISTRADOR. Tecnica: alimenta el dropdown buscable.
  @GetMapping public List<UserDtos.UserSummary> search(@RequestParam(name = "search", required = false, defaultValue = "") String search) { return service.searchUsers(search); }
}
