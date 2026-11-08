package mx.portaltransporte.domain;

import jakarta.persistence.*; import java.sql.Types; import java.time.Instant; import java.util.UUID; import org.hibernate.annotations.JdbcTypeCode;

// Actor: sistema registra la trazabilidad del cliente sin cambiar su id.
// Historial de cliente. Tecnica: Factory Method, UUID v7 con fecha, actor desnormalizado.
@Entity @Table(name="client_history") public class ClientHistory {
 @Id @JdbcTypeCode(Types.BINARY) private UUID id; @ManyToOne(optional=false,fetch=FetchType.LAZY) @JoinColumn(name="client_id") private ClientRecord client; @Column(nullable=false,length=40) private String action; @Column(nullable=false,length=280) private String detail; @Column(name="actor_name",nullable=false,length=60) private String actorName; @Column(name="created_at",nullable=false) private Instant createdAt;
 protected ClientHistory() { }
 public ClientHistory(ClientRecord client,String action,String detail,String actorName) { id=UuidV7.next(); this.client=client; this.action=action; this.detail=detail; this.actorName=actorName; createdAt=Instant.now(); }
 public UUID getId() { return id; }
 public String getAction() { return action; }
 public String getDetail() { return detail; }
 public String getActorName() { return actorName; }
 public Instant getCreatedAt() { return createdAt; }
}
