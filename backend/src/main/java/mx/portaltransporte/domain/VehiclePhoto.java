package mx.portaltransporte.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.sql.Types;
import java.util.UUID;
import org.hibernate.annotations.JdbcTypeCode;

// Actor: RECEPCIONISTA o ADMINISTRADOR registra fotos del vehículo. Técnica: imágenes en tabla propia.
@Entity @Table(name = "vehicle_photo")
public class VehiclePhoto {
  @Id @JdbcTypeCode(Types.BINARY) private UUID id;
  @ManyToOne(optional = false, fetch = FetchType.LAZY) @JoinColumn(name = "vehicle_id") private Vehicle vehicle;
  @Column(nullable = false) private short position;
  @JdbcTypeCode(Types.LONGVARBINARY) @Column(name = "photo_blob", nullable = false) private byte[] photoBlob;
  @Column(name = "photo_mime", nullable = false, length = 40) private String photoMime;
  @Column(name = "photo_name", nullable = false, length = 160) private String photoName;

  protected VehiclePhoto() { }
  public VehiclePhoto(Vehicle vehicle, short position, byte[] photoBlob, String photoMime, String photoName) {
    this.id = UuidV7.next(); this.vehicle = vehicle; this.position = position; this.photoBlob = photoBlob; this.photoMime = photoMime; this.photoName = photoName;
  }
  public UUID getId() { return id; }
  public short getPosition() { return position; }
  public byte[] getPhotoBlob() { return photoBlob; }
  public String getPhotoMime() { return photoMime; }
  public String getPhotoName() { return photoName; }
}
