package mx.portaltransporte.records;

import jakarta.validation.Valid;
import java.security.Principal;
import java.util.List;
import java.util.UUID;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

// Actor: ADMINISTRADOR y RECEPCIONISTA mutan; los tres roles base consultan.
// Rutas de fichas con UUID opacos. Tecnica: ids con fecha aleatoria, nunca secuencias.
@RestController @RequestMapping("/api/v1")
public class RecordController {
 private final RecordService service; public RecordController(RecordService service) { this.service=service; }
 // Crea cliente. Actor: ADMINISTRADOR o RECEPCIONISTA. Tecnica: actor desde la sesion, no de la URL.
 @PostMapping("/clients") @PreAuthorize("hasAnyRole('ADMINISTRADOR','RECEPCIONISTA')") public ResponseEntity<RecordDtos.CreatedResponse> createClient(@Valid @RequestBody RecordDtos.CreateClientRequest request, Principal principal) { return ResponseEntity.status(HttpStatus.CREATED).body(new RecordDtos.CreatedResponse(service.createClient(request,principal.getName()).toString())); }
 // Pagina validada de clientes. Actor: rol autorizado. Tecnica: pagina base 1 con 10 registros por default.
 @GetMapping("/clients") @PreAuthorize("hasAnyRole('ADMINISTRADOR','RECEPCIONISTA','TRANSPORTISTA')") public RecordDtos.ClientPageResponse listClients(@RequestParam(defaultValue="1") int page, @RequestParam(defaultValue="10") int size, @RequestParam(defaultValue="false") boolean onlyActive) { return service.listClients(page, size, onlyActive); }
 // Edita cliente con trazabilidad. Actor: ADMINISTRADOR o RECEPCIONISTA. Tecnica: id UUID en URL, no predecible.
 @PutMapping("/clients/{id}") @PreAuthorize("hasAnyRole('ADMINISTRADOR','RECEPCIONISTA')") public RecordDtos.ClientResponse updateClient(@PathVariable UUID id, @Valid @RequestBody RecordDtos.UpdateClientRequest request, Principal principal) { return service.updateClient(id, request, principal.getName()); }
 // Da de baja o reactiva. Actor: ADMINISTRADOR o RECEPCIONISTA. Tecnica: sin eliminar, conserva historia.
 @PatchMapping("/clients/{id}/status") @PreAuthorize("hasAnyRole('ADMINISTRADOR','RECEPCIONISTA')") public RecordDtos.ClientResponse changeClientStatus(@PathVariable UUID id, @Valid @RequestBody RecordDtos.ChangeStatusRequest request, Principal principal) { return service.changeClientStatus(id, request.statusId(), principal.getName()); }
 // Historial de trazabilidad. Actor: ADMINISTRADOR o RECEPCIONISTA. Tecnica: el id del cliente nunca cambia.
 @GetMapping("/clients/{id}/history") @PreAuthorize("hasAnyRole('ADMINISTRADOR','RECEPCIONISTA')") public List<RecordDtos.ClientHistoryResponse> listClientHistory(@PathVariable UUID id) { return service.listClientHistory(id); }
 // Asocia un vehiculo. Actor: ADMINISTRADOR o RECEPCIONISTA. Tecnica: la seccion aparece por default en edicion.
 @PostMapping("/clients/{id}/vehicles") @PreAuthorize("hasAnyRole('ADMINISTRADOR','RECEPCIONISTA')") public ResponseEntity<RecordDtos.ClientVehicleResponse> linkVehicle(@PathVariable UUID id, @Valid @RequestBody RecordDtos.LinkVehicleRequest request, Principal principal) { return ResponseEntity.status(HttpStatus.CREATED).body(service.linkVehicle(id, request, principal.getName())); }
 // Vehiculos asociados activos. Actor: rol autorizado. Tecnica: aparecen tras asociar.
 @GetMapping("/clients/{id}/vehicles") @PreAuthorize("hasAnyRole('ADMINISTRADOR','RECEPCIONISTA','TRANSPORTISTA')") public List<RecordDtos.ClientVehicleResponse> listClientVehicles(@PathVariable UUID id) { return service.listClientVehicles(id); }
 // Desvincula con fecha. Actor: ADMINISTRADOR o RECEPCIONISTA. Tecnica: 204 sin cuerpo, conserva historia.
 @DeleteMapping("/clients/{id}/vehicles/{associationId}") @PreAuthorize("hasAnyRole('ADMINISTRADOR','RECEPCIONISTA')") @ResponseStatus(HttpStatus.NO_CONTENT) public void unlinkVehicle(@PathVariable UUID id, @PathVariable UUID associationId, Principal principal) { service.unlinkVehicle(id, associationId, principal.getName()); }
 // Crea vehiculo. Actor: ADMINISTRADOR o RECEPCIONISTA. Tecnica: placa unica con guion en mayusculas.
 @PostMapping(value="/vehicles", consumes=MediaType.MULTIPART_FORM_DATA_VALUE) @PreAuthorize("hasAnyRole('ADMINISTRADOR','RECEPCIONISTA')") public ResponseEntity<RecordDtos.CreatedResponse> createVehicle(@Valid @RequestPart("vehicle") RecordDtos.CreateVehicleRequest request, @RequestPart(value="photos", required=false) List<MultipartFile> photos) { return ResponseEntity.status(HttpStatus.CREATED).body(new RecordDtos.CreatedResponse(service.createVehicle(request, photos).toString())); }
 // Lista vehiculos paginados para la tabla. Actor: rol autorizado. Tecnica: pagina base 1 con 10 registros.
 @GetMapping("/vehicles") @PreAuthorize("hasAnyRole('ADMINISTRADOR','RECEPCIONISTA','TRANSPORTISTA')") public RecordDtos.VehiclePageResponse listVehicles(@RequestParam(defaultValue="1") int page, @RequestParam(defaultValue="10") int size) { return service.listVehicles(page, size); }
 // Edita vehiculo. Actor: ADMINISTRADOR o RECEPCIONISTA. Tecnica: id UUID en URL, no predecible.
 @PutMapping(value="/vehicles/{id}", consumes=MediaType.MULTIPART_FORM_DATA_VALUE) @PreAuthorize("hasAnyRole('ADMINISTRADOR','RECEPCIONISTA')") public RecordDtos.VehicleResponse updateVehicle(@PathVariable UUID id, @Valid @RequestPart("vehicle") RecordDtos.UpdateVehicleRequest request, @RequestPart(value="photos", required=false) List<MultipartFile> photos) { return service.updateVehicle(id, request, photos); }
 // Elimina vehiculo. Actor: ADMINISTRADOR o RECEPCIONISTA. Tecnica: 204 sin cuerpo.
 @DeleteMapping("/vehicles/{id}") @PreAuthorize("hasAnyRole('ADMINISTRADOR','RECEPCIONISTA')") @ResponseStatus(HttpStatus.NO_CONTENT) public void deleteVehicle(@PathVariable UUID id) { service.deleteVehicle(id); }
}
