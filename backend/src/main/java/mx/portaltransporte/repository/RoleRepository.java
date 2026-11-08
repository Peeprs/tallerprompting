package mx.portaltransporte.repository;
import java.util.*; import mx.portaltransporte.domain.*; import org.springframework.data.jpa.repository.JpaRepository;
// Actor: sistema y ADMINISTRADOR.
// Acceso a roles dinamicos. Tecnica: busqueda insensible a mayusculas para evitar duplicados.
public interface RoleRepository extends JpaRepository<Role, UUID> { Optional<Role> findByName(String name); Optional<Role> findByNameIgnoreCase(String name); }
