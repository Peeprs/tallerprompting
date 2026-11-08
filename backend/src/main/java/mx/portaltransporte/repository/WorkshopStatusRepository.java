package mx.portaltransporte.repository;

import java.util.Optional;
import java.util.UUID;
import mx.portaltransporte.domain.WorkshopStatus;
import org.springframework.data.jpa.repository.JpaRepository;

// Actor: sistema y ADMINISTRADOR consultan el catalogo.
// Repositorio del catalogo Estatus. Tecnica: busqueda por codigo unico ACTIVO o BAJA.
public interface WorkshopStatusRepository extends JpaRepository<WorkshopStatus, UUID> {
  Optional<WorkshopStatus> findByCode(String code);
}
