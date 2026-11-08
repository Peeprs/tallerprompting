package mx.portaltransporte.domain;

import jakarta.persistence.*; import java.sql.Types; import java.time.LocalDate; import java.util.UUID; import org.hibernate.annotations.JdbcTypeCode;

// Actor: RECEPCIONISTA asocia vehiculos al cliente; el sistema audita el vinculo.
// Vinculo cliente-vehiculo. Tecnica: Factory Method, baja logica con ends_on para trazabilidad.
@Entity @Table(name="client_vehicle") public class ClientVehicle {
 @Id @JdbcTypeCode(Types.BINARY) private UUID id; @ManyToOne(optional=false) @JoinColumn(name="client_id") private ClientRecord client; @ManyToOne(optional=false) @JoinColumn(name="vehicle_id") private Vehicle vehicle; @Column(name="relationship_type",nullable=false,length=20) private String relationshipType; @Column(name="starts_on",nullable=false) private LocalDate startsOn; @Column(name="ends_on") private LocalDate endsOn;
 protected ClientVehicle() { }
 public ClientVehicle(ClientRecord client,Vehicle vehicle,String relationshipType) { id=UuidV7.next(); this.client=client; this.vehicle=vehicle; this.relationshipType=relationshipType; startsOn=LocalDate.now(); }
 public UUID getId() { return id; }
 public ClientRecord getClient() { return client; }
 public Vehicle getVehicle() { return vehicle; }
 public String getRelationshipType() { return relationshipType; }
 public LocalDate getStartsOn() { return startsOn; }
 public LocalDate getEndsOn() { return endsOn; }
 public boolean isActive() { return endsOn==null; }
 // Desvincula con fecha. Actor: RECEPCIONISTA. Tecnica: no borra, conserva historia.
 public void endNow() { endsOn=LocalDate.now(); }
}
