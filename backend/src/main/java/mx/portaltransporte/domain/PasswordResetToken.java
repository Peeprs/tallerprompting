package mx.portaltransporte.domain;

import jakarta.persistence.*;
import java.sql.Types;
import java.time.Instant;
import java.util.UUID;
import org.hibernate.annotations.JdbcTypeCode;

@Entity @Table(name = "password_reset_token")
public class PasswordResetToken {
    @Id @JdbcTypeCode(Types.BINARY) private UUID id;
    @ManyToOne(optional = false) @JoinColumn(name = "user_id") private UserAccount user;
    @JdbcTypeCode(Types.CHAR) @Column(name = "token_hash", nullable = false, unique = true, length = 64) private String tokenHash;
    @Column(name = "expires_at", nullable = false) private Instant expiresAt;
    @Column(name = "used_at") private Instant usedAt;
    protected PasswordResetToken() { }
    public PasswordResetToken(UserAccount user, String hash) { id = UuidV7.next(); this.user = user; tokenHash = hash; expiresAt = Instant.now().plusSeconds(900); }
    public UserAccount getUser() { return user; } public boolean isUsable() { return usedAt == null && expiresAt.isAfter(Instant.now()); } public void consume() { usedAt = Instant.now(); }
}
