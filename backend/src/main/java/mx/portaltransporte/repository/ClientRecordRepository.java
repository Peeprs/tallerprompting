package mx.portaltransporte.repository;
import java.util.UUID; import mx.portaltransporte.domain.ClientRecord; import org.springframework.data.jpa.repository.JpaRepository;
public interface ClientRecordRepository extends JpaRepository<ClientRecord, UUID> { }
