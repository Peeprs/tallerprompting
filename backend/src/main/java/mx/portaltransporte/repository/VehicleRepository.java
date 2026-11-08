package mx.portaltransporte.repository;
import java.util.UUID; import mx.portaltransporte.domain.Vehicle; import org.springframework.data.jpa.repository.JpaRepository;
public interface VehicleRepository extends JpaRepository<Vehicle, UUID> { boolean existsByPlate(String plate); boolean existsByVin(String vin); }
