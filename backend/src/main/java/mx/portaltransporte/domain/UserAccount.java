package mx.portaltransporte.domain;

import jakarta.persistence.*;
import java.sql.Types;
import java.time.Instant;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;
import org.hibernate.annotations.JdbcTypeCode;

@Entity @Table(name = "user_account")
public class UserAccount {
    @Id @JdbcTypeCode(Types.BINARY) private UUID id;
    @Column(nullable = false, unique = true) private String username;
    @JdbcTypeCode(Types.CHAR) @Column(name = "email_lookup", nullable = false, unique = true, length = 64) private String emailLookup;
    @Lob @JdbcTypeCode(Types.LONGVARBINARY) @Column(name = "email_ciphertext", nullable = false) private byte[] emailCiphertext;
    @JdbcTypeCode(Types.BINARY) @Column(name = "email_nonce", nullable = false, length = 12) private byte[] emailNonce;
    @Column(name = "password_hash", nullable = false) private String passwordHash;
    @Enumerated(EnumType.STRING) @Column(nullable = false) private UserStatus status = UserStatus.PENDING;
    @Column(name = "failed_attempts", nullable = false) private int failedAttempts;
    @Column(name = "locked_until") private Instant lockedUntil;
    @ManyToMany(fetch = FetchType.EAGER) @JoinTable(name = "user_role", joinColumns = @JoinColumn(name = "user_id"), inverseJoinColumns = @JoinColumn(name = "role_id")) private Set<Role> roles = new HashSet<>();
    protected UserAccount() { }
    public UserAccount(String username, String emailLookup, byte[] emailCiphertext, byte[] emailNonce, String passwordHash, Role role) { this.id = UuidV7.next(); this.username = username; this.emailLookup = emailLookup; this.emailCiphertext = emailCiphertext; this.emailNonce = emailNonce; this.passwordHash = passwordHash; this.roles.add(role); }
    public UUID getId() { return id; } public String getUsername() { return username; } public String getPasswordHash() { return passwordHash; } public UserStatus getStatus() { return status; } public Set<Role> getRoles() { return roles; }
    public boolean isLocked() { return lockedUntil != null && lockedUntil.isAfter(Instant.now()); }
    public void recordFailedAttempt() { failedAttempts++; if (failedAttempts >= 5) { lockedUntil = Instant.now().plusSeconds(900); failedAttempts = 0; } }
    public void recordSuccessfulLogin() { failedAttempts = 0; lockedUntil = null; }
    public void activate() { status = UserStatus.ACTIVE; }
    public void changePassword(String hash) { passwordHash = hash; }
}
