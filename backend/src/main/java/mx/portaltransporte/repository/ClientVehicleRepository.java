package mx.portaltransporte.repository;
import java.util.List; import java.util.UUID; import mx.portaltransporte.domain.ClientVehicle; import org.springframework.data.jpa.repository.JpaRepository;
public interface ClientVehicleRepository extends JpaRepository<ClientVehicle, UUID> {
 List<ClientVehicle> findByClientIdOrderByStartsOnDesc(UUID clientId);
 boolean existsByClientIdAndVehicleIdAndEndsOnIsNull(UUID clientId, UUID vehicleId);
 java.util.List<ClientVehicle> findByVehicleIdInAndEndsOnIsNullOrderByStartsOnDesc(java.util.Collection<UUID> vehicleIds);
 java.util.Optional<ClientVehicle> findByVehicleIdAndEndsOnIsNull(UUID vehicleId);
}
