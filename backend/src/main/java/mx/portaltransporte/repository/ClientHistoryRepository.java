package mx.portaltransporte.repository;
import java.util.List; import java.util.UUID; import mx.portaltransporte.domain.ClientHistory; import org.springframework.data.jpa.repository.JpaRepository;
public interface ClientHistoryRepository extends JpaRepository<ClientHistory, UUID> {
 List<ClientHistory> findByClientIdOrderByCreatedAtDesc(UUID clientId);
}
