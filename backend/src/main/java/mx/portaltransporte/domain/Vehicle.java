package mx.portaltransporte.domain;

import jakarta.persistence.*; import java.sql.Types; import java.util.UUID; import org.hibernate.annotations.JdbcTypeCode;
@Entity @Table(name="vehicle") public class Vehicle {
 @Id @JdbcTypeCode(Types.BINARY) private UUID id; @Column(nullable=false,unique=true) private String plate; @Column(unique=true) private String vin; @Column(nullable=false) private String brand; @Column(nullable=false) private String model; @Column(name="vehicle_year",nullable=false) private short year; @Column(name="mileage_km") private Integer mileageKm;
 protected Vehicle() { }
 // Crea un vehiculo con id UUID v7. Actor: ADMINISTRADOR o RECEPCIONISTA. Tecnica: Factory Method en VehicleFactory.
 public Vehicle(String plate,String vin,String brand,String model,short year,Integer mileageKm) { id=UuidV7.next(); this.plate=plate; this.vin=vin; this.brand=brand; this.model=model; this.year=year; this.mileageKm=mileageKm; } public UUID getId(){ return id; }
 public String getPlate() { return plate; } public String getVin() { return vin; } public String getBrand() { return brand; } public String getModel() { return model; } public short getYear() { return year; } public Integer getMileageKm() { return mileageKm; }
 // Actualiza datos del vehiculo. Actor: ADMINISTRADOR o RECEPCIONISTA. Tecnica: el id nunca cambia.
 public void updateDetails(String plate,String vin,String brand,String model,short year,Integer mileageKm) { this.plate=plate; this.vin=vin; this.brand=brand; this.model=model; this.year=year; this.mileageKm=mileageKm; }
}
