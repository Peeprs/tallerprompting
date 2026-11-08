package mx.portaltransporte.workshops;

import jakarta.validation.constraints.*;
import java.util.UUID;

// Actor: ADMINISTRADOR envia altas y ediciones con foto opcional.
// DTOs del modulo talleres. Tecnica: validacion Bean Validation espejo del frontend.
public final class WorkshopDtos {
  private WorkshopDtos() { }
  // Alta sin estatus: el servidor asigna ACTIVO. Tecnica: evita que el cliente fuerce BAJA al crear.
  public record CreateWorkshopRequest(
      @NotBlank @Size(min = 3, max = 120) String workshopName,
      @NotBlank @Pattern(regexp = WorkshopPolicy.RFC_PATTERN) String rfc,
      @NotBlank @Email @Size(max = 160) String workshopEmail,
      @NotBlank @Size(min = 2, max = 120) String street,
      @NotBlank @Size(min = 1, max = 20) String streetNumber,
      @NotBlank @Size(min = 2, max = 120) String suburb,
      @NotBlank @Pattern(regexp = WorkshopPolicy.POSTAL_CODE_PATTERN) String postalCode,
      @NotBlank @Size(min = 2, max = 80) String state,
      @NotBlank @Size(min = 2, max = 80) String municipality) { }
  // Edicion con estatus global por id de BD. Actor: ADMINISTRADOR.
  // Tecnica: el front no envia texto libre; reenvia el id traido de GET /estatus.
  public record UpdateWorkshopRequest(
      @NotBlank @Size(min = 3, max = 120) String workshopName,
      @NotBlank @Pattern(regexp = WorkshopPolicy.RFC_PATTERN) String rfc,
      @NotBlank @Email @Size(max = 160) String workshopEmail,
      @NotBlank @Size(min = 2, max = 120) String street,
      @NotBlank @Size(min = 1, max = 20) String streetNumber,
      @NotBlank @Size(min = 2, max = 120) String suburb,
      @NotBlank @Pattern(regexp = WorkshopPolicy.POSTAL_CODE_PATTERN) String postalCode,
      @NotBlank @Size(min = 2, max = 80) String state,
      @NotBlank @Size(min = 2, max = 80) String municipality,
      @NotNull UUID statusId) { }
  // Fila de tabla: foto como data URL lista para <img>. Tecnica: id UUID opaco, sin secuencias.
  public record WorkshopResponse(UUID id, String workshopName, String workshopEmail, String statusCode,
      String statusLabel, String photoUrl, String street, String streetNumber, String suburb,
      String postalCode, String state, String municipality) { }
  // Respuesta de alta. Tecnica: devuelve el id opaco recien creado.
  public record CreatedWorkshopResponse(String id) { }
  // Pagina validada de talleres. Actor: sistema. Tecnica: pagina base 1 con 10 registros por default.
  public record WorkshopPageResponse(java.util.List<WorkshopResponse> content, int page, int size, long totalElements, int totalPages) { }
  // Catalogo de estatus. Tecnica: se reutiliza en talleres y futuros modulos.
  public record StatusResponse(UUID id, String code, String label) { }
}
