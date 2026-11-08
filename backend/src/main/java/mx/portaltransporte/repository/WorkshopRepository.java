package mx.portaltransporte.repository;

import java.util.List;
import java.util.UUID;
import mx.portaltransporte.domain.Workshop;
import org.springframework.data.jpa.repository.JpaRepository;

// Actor: ADMINISTRADOR muta; roles autorizados listan.
// Repositorio de talleres. Tecnica: lookups HMAC unicos evitan duplicados por formato.
public interface WorkshopRepository extends JpaRepository<Workshop, UUID> {
  boolean existsByRfcLookup(String rfcLookup);
  boolean existsByEmailLookup(String emailLookup);
  List<Workshop> findByStatusCode(String code);
}
