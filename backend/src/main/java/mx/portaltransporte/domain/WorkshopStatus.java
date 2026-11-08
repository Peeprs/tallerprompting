package mx.portaltransporte.domain;

import jakarta.persistence.*;
import java.sql.Types;
import java.util.UUID;
import org.hibernate.annotations.JdbcTypeCode;

// Actor: ADMINISTRADOR gestiona el catalogo; RECEPCIONISTA y TRANSPORTISTA solo lo leen.
// Catalogo global Estatus (ACTIVO, BAJA) reusable por talleres, clientes y modulos futuros.
// Tecnica: tabla unica "estatus"; el front nunca inventa valores, solo reenvia lo traido de BD.
@Entity @Table(name = "estatus")
public class WorkshopStatus {
  @Id @JdbcTypeCode(Types.BINARY) private UUID id;
  @Column(nullable = false, unique = true, length = 20) private String code;
  @Column(nullable = false, length = 60) private String label;
  protected WorkshopStatus() { }
  // Crea un estatus con id UUID v7. Actor: sistema en seed. Tecnica: Factory Method en WorkshopStatusFactory.
  public WorkshopStatus(String code, String label) { id = UuidV7.next(); this.code = code; this.label = label; }
  public UUID getId() { return id; }
  public String getCode() { return code; }
  public String getLabel() { return label; }
}
