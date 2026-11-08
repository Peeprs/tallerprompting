package mx.portaltransporte.records;
import jakarta.validation.constraints.*;
import java.util.UUID;
public final class RecordDtos {
 private RecordDtos() { }
 public record CreateClientRequest(@NotBlank @Size(min=3,max=150) String name, @NotBlank @Pattern(regexp="^[A-Za-z0-9]{10,18}$") String document, @NotBlank String email, UUID workshopId, java.util.List<String> contacts, java.util.List<SecondaryContactDto> secondaryContacts) { }
 // Contacto secundario/referencia con nombre completo y celular. Actor: RECEPCIONISTA. Tecnica: el telefono exacto se valida en servicio.
 public record SecondaryContactDto(@NotBlank @Size(min=3,max=80) String name, @NotBlank String phone) { }
 // Alta UC-CV-01 exige taller activo y un contacto. Actor: RECEPCIONISTA o ADMINISTRADOR. Tecnica: contacts lista N medios.
 // Placa en mayusculas con guion. Actor: RECEPCIONISTA o ADMINISTRADOR. Tecnica: regex compartida con el frontend.
 public record CreateVehicleRequest(@NotBlank @Pattern(regexp=VehiclePolicy.PLATE_PATTERN) String plate, @NotBlank @Size(min=VehiclePolicy.VIN_LENGTH,max=VehiclePolicy.VIN_LENGTH) @Pattern(regexp=VehiclePolicy.VIN_PATTERN) String vin, @NotBlank @Size(max=60) String brand, @NotBlank @Size(max=60) String model, @NotNull @Min(1900) @Max(2099) Integer year, @Min(0) Integer mileageKm) { }
 // Edicion de vehiculo con las mismas reglas. Actor: RECEPCIONISTA o ADMINISTRADOR. Tecnica: reutiliza el patron de placa.
 public record UpdateVehicleRequest(@NotBlank @Pattern(regexp=VehiclePolicy.PLATE_PATTERN) String plate, @NotBlank @Size(min=VehiclePolicy.VIN_LENGTH,max=VehiclePolicy.VIN_LENGTH) @Pattern(regexp=VehiclePolicy.VIN_PATTERN) String vin, @NotBlank @Size(max=60) String brand, @NotBlank @Size(max=60) String model, @NotNull @Min(1900) @Max(2099) Integer year, @Min(0) Integer mileageKm) { }
 public record UpdateClientRequest(@NotBlank @Size(min=3,max=150) String name, @NotBlank @Pattern(regexp="^[A-Za-z0-9]{10,18}$") String document, @NotBlank String email, UUID workshopId, java.util.List<String> contacts, java.util.List<SecondaryContactDto> secondaryContacts) { }
 // Contacto con nombre de referencia para la tabla. Actor: sistema. Tecnica: principal primero.
 public record ClientContactResponse(String name, String value, boolean primary) { }
 public record ClientResponse(UUID id, String name, String document, java.util.List<ClientContactResponse> contacts, UUID workshopId, String workshopName, String statusCode, String statusLabel) { }
 // Pagina validada de clientes. Actor: sistema. Tecnica: pagina base 1 con 10 registros por default.
 public record ClientPageResponse(java.util.List<ClientResponse> content, int page, int size, long totalElements, int totalPages) { }
 // Cambio de estatus con id del catalogo global. Actor: RECEPCIONISTA da de baja, ADMINISTRADOR reactiva.
 public record ChangeStatusRequest(@NotNull UUID statusId) { }
 // Vinculo cliente-vehiculo. Actor: RECEPCIONISTA. Tecnica: relacion del catalogo cerrado.
 public record LinkVehicleRequest(@NotNull UUID vehicleId, @NotBlank @Pattern(regexp="^(OWNER|RESPONSIBLE|POSSESSOR)$") String relationshipType) { }
 public record ClientVehicleResponse(UUID associationId, UUID vehicleId, String plate, String brand, String model, short year, String relationshipType, java.time.LocalDate startsOn) { }
 // Renglon de trazabilidad. Actor: sistema. Tecnica: el id del cliente nunca cambia.
 public record ClientHistoryResponse(UUID id, String action, String detail, String actorName, java.time.Instant createdAt) { }
 public record CreatedResponse(String id) { }
 // Fila de tabla de vehiculos. Tecnica: id UUID opaco para editar y eliminar sin exponer secuencia.
 public record VehicleResponse(UUID id, String plate, String vin, String brand, String model, short year, Integer mileageKm, int photoCount, UUID associationId, UUID clientId, String clientName) { }
 // Pagina validada de vehiculos. Actor: sistema. Tecnica: pagina base 1 con 10 registros por default.
 public record VehiclePageResponse(java.util.List<VehicleResponse> content, int page, int size, long totalElements, int totalPages) { }
}
