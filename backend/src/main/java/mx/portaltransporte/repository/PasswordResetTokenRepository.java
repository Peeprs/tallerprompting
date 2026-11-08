package mx.portaltransporte.repository;
import java.util.*; import mx.portaltransporte.domain.PasswordResetToken; import org.springframework.data.jpa.repository.JpaRepository;
public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, UUID> { Optional<PasswordResetToken> findByTokenHash(String tokenHash); }
