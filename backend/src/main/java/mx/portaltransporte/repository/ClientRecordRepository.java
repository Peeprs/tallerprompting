package mx.portaltransporte.repository;
import java.util.List;
import java.util.UUID;
import mx.portaltransporte.domain.ClientRecord;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ClientRecordRepository extends JpaRepository<ClientRecord, UUID> {
  @Override
  @EntityGraph(attributePaths = {"workshop", "status"})
  List<ClientRecord> findAll();
}
