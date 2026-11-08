package mx.portaltransporte.workshops;

import jakarta.validation.Valid;
import java.security.Principal;
import java.util.List;
import java.util.UUID;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

// Actor: ADMINISTRADOR muta; RECEPCIONISTA y TRANSPORTISTA consultan para asociar y operar.
// Rutas de talleres con UUID opacos. Tecnica: multipart para foto, JSON para el resto.
@RestController @RequestMapping("/api/v1")
public class WorkshopController {
  private final WorkshopService service;
  // Guarda el servicio. Actor: sistema. Tecnica: constructor unico de Spring.
  public WorkshopController(WorkshopService service) { this.service = service; }
  // Crea taller como ACTIVO. Actor: ADMINISTRADOR. Tecnica: 403 si el rol no tiene permiso.
  @PostMapping(value = "/workshops", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  @PreAuthorize("hasRole('ADMINISTRADOR')")
  public ResponseEntity<WorkshopDtos.CreatedWorkshopResponse> createWorkshop(
      @Valid @RequestPart("workshop") WorkshopDtos.CreateWorkshopRequest request,
      @RequestPart(value = "photoFile", required = false) MultipartFile photoFile,
      Principal principal) {
    return ResponseEntity.status(HttpStatus.CREATED)
        .body(new WorkshopDtos.CreatedWorkshopResponse(service.createWorkshop(request, photoFile, principal.getName()).toString()));
  }
  // Lista talleres paginados. Actor: rol autorizado. Tecnica: pagina base 1 con 10 registros.
  @GetMapping("/workshops")
  @PreAuthorize("hasAnyRole('ADMINISTRADOR','RECEPCIONISTA','TRANSPORTISTA')")
  public WorkshopDtos.WorkshopPageResponse listWorkshops(@RequestParam(defaultValue = "1") int page, @RequestParam(defaultValue = "10") int size, @RequestParam(defaultValue = "false") boolean onlyActive) {
    return service.listWorkshops(page, size, onlyActive);
  }
  // Obtiene un taller. Actor: rol autorizado. Tecnica: id UUID en URL, no predecible.
  @GetMapping("/workshops/{id}")
  @PreAuthorize("hasAnyRole('ADMINISTRADOR','RECEPCIONISTA','TRANSPORTISTA')")
  public WorkshopDtos.WorkshopResponse getWorkshop(@PathVariable UUID id) {
    return service.getWorkshop(id);
  }
  // Edita taller y cambia estatus. Actor: ADMINISTRADOR. Tecnica: el dropdown de estatus solo existe aqui.
  @PutMapping(value = "/workshops/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  @PreAuthorize("hasRole('ADMINISTRADOR')")
  public WorkshopDtos.WorkshopResponse updateWorkshop(@PathVariable UUID id,
      @Valid @RequestPart("workshop") WorkshopDtos.UpdateWorkshopRequest request,
      @RequestPart(value = "photoFile", required = false) MultipartFile photoFile,
      @RequestParam(defaultValue = "false") boolean removePhoto, Principal principal) {
    return service.updateWorkshop(id, request, photoFile, removePhoto, principal.getName());
  }
  // Elimina taller. Actor: ADMINISTRADOR. Tecnica: 204 sin cuerpo.
  @DeleteMapping("/workshops/{id}")
  @PreAuthorize("hasRole('ADMINISTRADOR')")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void deleteWorkshop(@PathVariable UUID id, Principal principal) {
    service.deleteWorkshop(id, principal.getName());
  }
  // Catalogo global de estatus. Actor: rol autorizado. Tecnica: el front lista y reenvia el id, nunca texto libre.
  // Se reutiliza en talleres, clientes y futuros modulos. Se expone como /estatus (global) y /workshop-statuses (alias).
  @GetMapping({ "/estatus", "/workshop-statuses" })
  @PreAuthorize("hasAnyRole('ADMINISTRADOR','RECEPCIONISTA','TRANSPORTISTA')")
  public List<WorkshopDtos.StatusResponse> listStatuses() {
    return service.listStatuses();
  }
}
