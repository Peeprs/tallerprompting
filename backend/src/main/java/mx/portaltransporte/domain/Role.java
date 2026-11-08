package mx.portaltransporte.domain;

import jakarta.persistence.*;
import java.sql.Types;
import java.util.UUID;
import org.hibernate.annotations.JdbcTypeCode;

@Entity @Table(name = "role")
public class Role {
    @Id @JdbcTypeCode(Types.BINARY) private UUID id;
    @Column(nullable = false, unique = true, length = 50) private String name;
    @Column(nullable = false, length = 150) private String description;
    protected Role() { }
    // Crea un rol dinamico con id UUID v7. Actor: ADMINISTRADOR. Tecnica: nombre en mayusculas, sin enum.
    public Role(String name, String description) { this.id = UuidV7.next(); this.name = name; this.description = description; }
    public UUID getId() { return id; }
    public String getName() { return name; }
    public String getDescription() { return description; }
    // Actualiza solo la descripcion. Actor: ADMINISTRADOR. Tecnica: el valor es inmutable tras crear.
    public void updateDescription(String description) { this.description = description; }
}
