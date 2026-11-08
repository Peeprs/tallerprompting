package mx.portaltransporte.repository;

import java.util.List;
import java.util.UUID;
import mx.portaltransporte.domain.VehiclePhoto;
import org.springframework.data.jpa.repository.JpaRepository;

public interface VehiclePhotoRepository extends JpaRepository<VehiclePhoto, UUID> {
  List<VehiclePhoto> findByVehicleIdOrderByPosition(UUID vehicleId);
  long countByVehicleId(UUID vehicleId);
  void deleteByVehicleId(UUID vehicleId);
}
