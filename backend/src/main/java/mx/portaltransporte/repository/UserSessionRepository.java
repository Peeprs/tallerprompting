package mx.portaltransporte.repository;
import java.util.*; import mx.portaltransporte.domain.UserSession; import org.springframework.data.jpa.repository.JpaRepository;
import java.time.Instant;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
public interface UserSessionRepository extends JpaRepository<UserSession, UUID> {
 Optional<UserSession> findByTokenHash(String tokenHash);
 @Query("select userSession from UserSession userSession join fetch userSession.user account where userSession.tokenHash = :tokenHash and userSession.revokedAt is null and userSession.expiresAt > :now")
 Optional<UserSession> findUsableByTokenHash(@Param("tokenHash") String tokenHash, @Param("now") Instant now);
}
