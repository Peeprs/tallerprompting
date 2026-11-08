package mx.portaltransporte.repository;
import java.util.*; import mx.portaltransporte.domain.UserAccount; import org.springframework.data.jpa.repository.JpaRepository;
// Actor: sistema, ADMINISTRADOR y usuarios que inician sesion.
// Acceso a cuentas. Tecnica: lookups unicos mas busqueda limitada para el dropdown.
public interface UserAccountRepository extends JpaRepository<UserAccount, UUID> { Optional<UserAccount> findByUsername(String username); Optional<UserAccount> findByEmailLookup(String emailLookup); List<UserAccount> findTop20ByUsernameContainingIgnoreCase(String fragment); long countByRolesName(String name); }
