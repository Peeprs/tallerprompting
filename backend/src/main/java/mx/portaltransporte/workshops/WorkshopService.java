package mx.portaltransporte.workshops;

import java.nio.charset.StandardCharsets;
import java.util.*;
import mx.portaltransporte.domain.*;
import mx.portaltransporte.domain.factory.WorkshopFactory;
import mx.portaltransporte.domain.factory.WorkshopStatusFactory;
import mx.portaltransporte.repository.*;
import mx.portaltransporte.security.CryptoService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import io.micrometer.observation.annotation.Observed;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

// Actor: ADMINISTRADOR crea, edita y elimina; RECEPCIONISTA lista activos para asociar clientes.
// Servicio de talleres. Tecnica: Factory Method + AES-GCM + HMAC, timeout para no tirar el servidor.
@Service
@Observed(name = "service.workshops")
public class WorkshopService {
  private static final Logger auditLog = LoggerFactory.getLogger("workshopAudit");
  private final WorkshopRepository workshops; private final WorkshopStatusRepository statuses;
  private final UserAccountRepository users; private final CryptoService crypto;
  private final WorkshopFactory workshopFactory = new WorkshopFactory();
  private final WorkshopStatusFactory statusFactory = new WorkshopStatusFactory();
  // Guarda dependencias. Actor: sistema. Tecnica: inyeccion por constructor, sin literales.
  public WorkshopService(WorkshopRepository workshops, WorkshopStatusRepository statuses,
      UserAccountRepository users, CryptoService crypto) {
    this.workshops = workshops; this.statuses = statuses; this.users = users; this.crypto = crypto;
  }
  // Crea taller como ACTIVO con foto opcional. Actor: ADMINISTRADOR. Tecnica: normaliza antes de validar duplicados.
  @Transactional(timeout = WorkshopPolicy.TRANSACTION_TIMEOUT_SECONDS)
  @org.springframework.cache.annotation.CacheEvict(value="workshopRows", allEntries=true)
  public UUID createWorkshop(WorkshopDtos.CreateWorkshopRequest request, MultipartFile photoFile, String actorId) {
    UserAccount actor = users.findById(UUID.fromString(actorId))
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));
    String normalizedRfc = request.rfc().trim().toUpperCase(Locale.ROOT);
    String normalizedEmail = request.workshopEmail().trim().toLowerCase(Locale.ROOT);
    String rfcLookup = crypto.lookup(normalizedRfc);
    String emailLookup = crypto.lookup(normalizedEmail);
    if (workshops.existsByRfcLookup(rfcLookup) || workshops.existsByEmailLookup(emailLookup)) {
      throw new ResponseStatusException(HttpStatus.CONFLICT, "Workshop already exists");
    }
    WorkshopStatus active = activeStatus();
    var nameCipher = crypto.encrypt(request.workshopName().trim());
    var rfcCipher = crypto.encrypt(normalizedRfc);
    var emailCipher = crypto.encrypt(normalizedEmail);
    Workshop workshop = workshopFactory.create(new WorkshopFactory.WorkshopParams(
        nameCipher.value(), nameCipher.nonce(), rfcLookup, rfcCipher.value(), rfcCipher.nonce(),
        emailLookup, emailCipher.value(), emailCipher.nonce(), request.street().trim(),
        request.streetNumber().trim(), request.suburb().trim(), request.postalCode().trim(),
        request.state().trim(), request.municipality().trim(), active, actor.getId()));
    if (photoFile != null && !photoFile.isEmpty()) {
      applyPhoto(workshop, photoFile);
    }
    Workshop saved = workshops.save(workshop);
    auditLog.info("action=workshop_created actor={} workshop={}", actor.getId(), saved.getId());
    return saved.getId();
  }
  // Edita taller y permite cambiar a BAJA. Actor: ADMINISTRADOR. Tecnica: valida duplicado solo si RFC o email cambian.
  @Transactional(timeout = WorkshopPolicy.TRANSACTION_TIMEOUT_SECONDS)
  @org.springframework.cache.annotation.CacheEvict(value="workshopRows", allEntries=true)
  public WorkshopDtos.WorkshopResponse updateWorkshop(UUID id, WorkshopDtos.UpdateWorkshopRequest request,
      MultipartFile photoFile, boolean removePhoto, String actorId) {
    Workshop workshop = workshops.findById(id)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Workshop not found"));
    String normalizedRfc = request.rfc().trim().toUpperCase(Locale.ROOT);
    String normalizedEmail = request.workshopEmail().trim().toLowerCase(Locale.ROOT);
    String rfcLookup = crypto.lookup(normalizedRfc);
    String emailLookup = crypto.lookup(normalizedEmail);
    if (!workshop.getRfcLookup().equals(rfcLookup) && workshops.existsByRfcLookup(rfcLookup)) {
      throw new ResponseStatusException(HttpStatus.CONFLICT, "Workshop already exists");
    }
    if (!workshop.getEmailLookup().equals(emailLookup) && workshops.existsByEmailLookup(emailLookup)) {
      throw new ResponseStatusException(HttpStatus.CONFLICT, "Workshop already exists");
    }
    WorkshopStatus status = statuses.findById(request.statusId())
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid status"));
    var nameCipher = crypto.encrypt(request.workshopName().trim());
    var rfcCipher = crypto.encrypt(normalizedRfc);
    var emailCipher = crypto.encrypt(normalizedEmail);
    workshop.updateLookups(rfcLookup, emailLookup);
    workshop.updateDetails(nameCipher.value(), nameCipher.nonce(), rfcCipher.value(), rfcCipher.nonce(),
        emailCipher.value(), emailCipher.nonce(), request.street().trim(), request.streetNumber().trim(),
        request.suburb().trim(), request.postalCode().trim(), request.state().trim(),
        request.municipality().trim(), status);
    if (removePhoto) {
      workshop.updatePhoto(null, null, null);
    } else if (photoFile != null && !photoFile.isEmpty()) {
      applyPhoto(workshop, photoFile);
    }
    Workshop saved = workshops.save(workshop);
    auditLog.info("action=workshop_updated actor={} workshop={} status={}", actorId, saved.getId(), status.getCode());
    return toResponse(saved);
  }
  // Lista talleres paginados ordenados por nombre descifrado. Actor: rol autorizado. Tecnica: cache-aside por pagina.
  @Transactional(readOnly = true)
  @org.springframework.cache.annotation.Cacheable(value="workshopRows", key="#onlyActive + '-' + #page + '-' + #size")
  public WorkshopDtos.WorkshopPageResponse listWorkshops(int page, int size, boolean onlyActive) {
    if (page<1) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Invalid page");
    if (size<1||size>50) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Invalid size");
    List<WorkshopDtos.WorkshopResponse> all = (onlyActive ? workshops.findByStatusCode(WorkshopPolicy.ACTIVE_CODE) : workshops.findAll()).stream().map(this::toResponse)
        .sorted(Comparator.comparing(WorkshopDtos.WorkshopResponse::workshopName)).toList();
    int total = all.size();
    int totalPages = total == 0 ? 0 : (int) Math.ceil((double) total / size);
    int from = (page - 1) * size;
    List<WorkshopDtos.WorkshopResponse> content = from >= total ? List.of() : all.subList(from, Math.min(from + size, total));
    return new WorkshopDtos.WorkshopPageResponse(content, page, size, total, totalPages);
  }
  // Obtiene un taller por id opaco. Actor: rol autorizado. Tecnica: 404 si no existe, sin exponer secuencia.
  @Transactional(readOnly = true)
  public WorkshopDtos.WorkshopResponse getWorkshop(UUID id) {
    return toResponse(workshops.findById(id)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Workshop not found")));
  }
  // Elimina taller. Actor: ADMINISTRADOR. Tecnica: baja logica preferida; borrado solo si no hay clientes.
  @Transactional(timeout = WorkshopPolicy.TRANSACTION_TIMEOUT_SECONDS)
  @org.springframework.cache.annotation.CacheEvict(value="workshopRows", allEntries=true)
  public void deleteWorkshop(UUID id, String actorId) {
    Workshop workshop = workshops.findById(id)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Workshop not found"));
    workshops.delete(workshop);
    auditLog.info("action=workshop_deleted actor={} workshop={}", actorId, id);
  }
  // Lista el catalogo de estatus. Actor: rol autorizado. Tecnica: siembra ACTIVO y BAJA si falta.
  @Transactional
  public List<WorkshopDtos.StatusResponse> listStatuses() {
    ensureSeeded();
    return statuses.findAll().stream()
        .map(status -> new WorkshopDtos.StatusResponse(status.getId(), status.getCode(), status.getLabel()))
        .sorted(Comparator.comparing(WorkshopDtos.StatusResponse::code)).toList();
  }
  // Valida y guarda la foto. Actor: sistema. Tecnica: 15 MB maximo y solo png, jpg, jpeg o webp.
  private void applyPhoto(Workshop workshop, MultipartFile photoFile) {
    if (photoFile.getSize() > WorkshopPolicy.MAX_PHOTO_BYTES) {
      throw new ResponseStatusException(HttpStatus.PAYLOAD_TOO_LARGE, "Photo exceeds 15 MB");
    }
    String mime = Objects.toString(photoFile.getContentType(), "").toLowerCase(Locale.ROOT);
    if (!WorkshopPolicy.ALLOWED_PHOTO_MIMES.contains(mime)) {
      throw new ResponseStatusException(HttpStatus.UNSUPPORTED_MEDIA_TYPE, "Photo must be png, jpg, jpeg or webp");
    }
    try {
      workshop.updatePhoto(photoFile.getBytes(), mime,
          Objects.toString(photoFile.getOriginalFilename(), "foto").replaceAll("[^a-zA-Z0-9._-]", "_"));
    } catch (java.io.IOException exception) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unreadable photo");
    }
  }
  // Recupera o siembra ACTIVO. Actor: sistema. Tecnica: seed perezoso con Factory Method.
  private WorkshopStatus activeStatus() {
    ensureSeeded();
    return statuses.findByCode(WorkshopPolicy.ACTIVE_CODE)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR));
  }
  // Siembra ACTIVO y BAJA una vez. Actor: sistema. Tecnica: idempotente, no duplica el catalogo.
  private void ensureSeeded() {
    if (statuses.findByCode(WorkshopPolicy.ACTIVE_CODE).isEmpty()) {
      statuses.save(statusFactory.create(new WorkshopStatusFactory.StatusParams(WorkshopPolicy.ACTIVE_CODE, "Activo")));
    }
    if (statuses.findByCode(WorkshopPolicy.INACTIVE_CODE).isEmpty()) {
      statuses.save(statusFactory.create(new WorkshopStatusFactory.StatusParams(WorkshopPolicy.INACTIVE_CODE, "Baja")));
    }
  }
  // Convierte entidad a fila de tabla. Actor: sistema. Tecnica: foto como data URL, nunca ruta predecible.
  private WorkshopDtos.WorkshopResponse toResponse(Workshop workshop) {
    String displayName;
    String displayEmail;
    try {
      displayName = crypto.decrypt(workshop.getNameCiphertext(), workshop.getNameNonce());
      displayEmail = crypto.decrypt(workshop.getEmailCiphertext(), workshop.getEmailNonce());
    } catch (Exception exception) {
      displayName = "[protegido]";
      displayEmail = "[protegido]";
    }
    String photoUrl = null;
    if (workshop.getPhotoBlob() != null && workshop.getPhotoMime() != null) {
      photoUrl = "data:" + workshop.getPhotoMime() + ";base64,"
          + java.util.Base64.getEncoder().encodeToString(workshop.getPhotoBlob());
    }
    return new WorkshopDtos.WorkshopResponse(workshop.getId(), displayName, displayEmail,
        workshop.getStatus().getCode(), workshop.getStatus().getLabel(), photoUrl, workshop.getStreet(),
        workshop.getStreetNumber(), workshop.getSuburb(), workshop.getPostalCode(), workshop.getState(),
        workshop.getMunicipality());
  }
}
