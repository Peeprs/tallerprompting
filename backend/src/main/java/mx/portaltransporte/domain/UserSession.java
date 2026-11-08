package mx.portaltransporte.domain;

import jakarta.persistence.*;
import java.sql.Types;
import java.time.Instant;
import java.util.UUID;
import org.hibernate.annotations.JdbcTypeCode;

@Entity @Table(name = "user_session")
public class UserSession {
    @Id @JdbcTypeCode(Types.BINARY) private UUID id;
    @ManyToOne(optional = false) @JoinColumn(name = "user_id") private UserAccount user;
    @JdbcTypeCode(Types.CHAR) @Column(name = "token_hash", nullable = false, unique = true, length = 64) private String tokenHash;
    @Column(name = "expires_at", nullable = false) private Instant expiresAt;
    @Column(name = "revoked_at") private Instant revokedAt;
    protected UserSession() { }
    public UserSession(UserAccount user, String tokenHash) { this.id = UuidV7.next(); this.user = user; this.tokenHash = tokenHash; this.expiresAt = Instant.now().plusSeconds(28_800); }
    public UserAccount getUser() { return user; } public boolean isValid() { return revokedAt == null && expiresAt.isAfter(Instant.now()); } public void revoke() { revokedAt = Instant.now(); }
}
