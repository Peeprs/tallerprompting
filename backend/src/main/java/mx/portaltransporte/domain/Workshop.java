package mx.portaltransporte.domain;

import jakarta.persistence.*;
import java.sql.Types;
import java.time.Instant;
import java.util.UUID;
import org.hibernate.annotations.JdbcTypeCode;

// Actor: ADMINISTRADOR crea y edita; RECEPCIONISTA consulta para asociar clientes.
// Taller mecanico con foto y direccion. Tecnica: RFC y email cifrados + lookup HMAC para no duplicar.
@Entity @Table(name = "workshop")
public class Workshop {
  @Id @JdbcTypeCode(Types.BINARY) private UUID id;
  @Lob @JdbcTypeCode(Types.LONGVARBINARY) @Column(name = "name_ciphertext", nullable = false) private byte[] nameCiphertext;
  @JdbcTypeCode(Types.BINARY) @Column(name = "name_nonce", nullable = false, length = 12) private byte[] nameNonce;
  @Column(name = "rfc_lookup", nullable = false, unique = true, length = 64, columnDefinition = "CHAR(64)") private String rfcLookup;
  @Lob @JdbcTypeCode(Types.LONGVARBINARY) @Column(name = "rfc_ciphertext", nullable = false) private byte[] rfcCiphertext;
  @JdbcTypeCode(Types.BINARY) @Column(name = "rfc_nonce", nullable = false, length = 12) private byte[] rfcNonce;
  @Column(name = "email_lookup", nullable = false, unique = true, length = 64, columnDefinition = "CHAR(64)") private String emailLookup;
  @Lob @JdbcTypeCode(Types.LONGVARBINARY) @Column(name = "email_ciphertext", nullable = false) private byte[] emailCiphertext;
  @JdbcTypeCode(Types.BINARY) @Column(name = "email_nonce", nullable = false, length = 12) private byte[] emailNonce;
  @Lob @JdbcTypeCode(Types.LONGVARBINARY) @Column(name = "photo_blob") private byte[] photoBlob;
  @Column(name = "photo_mime", length = 40) private String photoMime;
  @Column(name = "photo_name", length = 160) private String photoName;
  @Column(nullable = false, length = 120) private String street;
  @Column(name = "street_number", nullable = false, length = 20) private String streetNumber;
  @Column(nullable = false, length = 120) private String suburb;
  @Column(name = "postal_code", nullable = false, length = 5) private String postalCode;
  @Column(nullable = false, length = 80) private String state;
  @Column(nullable = false, length = 80) private String municipality;
  @ManyToOne(optional = false, fetch = FetchType.EAGER) @JoinColumn(name = "status_id") private WorkshopStatus status;
  @JdbcTypeCode(Types.BINARY) @Column(name = "created_by", nullable = false) private UUID createdBy;
  @Column(name = "created_at", nullable = false) private Instant createdAt;
  @Column(name = "updated_at", nullable = false) private Instant updatedAt;
  protected Workshop() { }
  // Constructor interno con UUID v7. Actor: sistema. Tecnica: solo WorkshopFactory invoca este new.
  public Workshop(byte[] nameCipher, byte[] nameNonce, String rfcLookup, byte[] rfcCipher, byte[] rfcNonce,
      String emailLookup, byte[] emailCipher, byte[] emailNonce, String street, String streetNumber,
      String suburb, String postalCode, String state, String municipality, WorkshopStatus status, UUID createdBy) {
    id = UuidV7.next(); nameCiphertext = nameCipher; this.nameNonce = nameNonce; this.rfcLookup = rfcLookup;
    rfcCiphertext = rfcCipher; this.rfcNonce = rfcNonce; this.emailLookup = emailLookup;
    emailCiphertext = emailCipher; this.emailNonce = emailNonce; this.street = street;
    this.streetNumber = streetNumber; this.suburb = suburb; this.postalCode = postalCode;
    this.state = state; this.municipality = municipality; this.status = status;
    this.createdBy = createdBy; createdAt = Instant.now(); updatedAt = Instant.now();
  }
  public UUID getId() { return id; }
  public String getRfcLookup() { return rfcLookup; }
  public String getEmailLookup() { return emailLookup; }
  public WorkshopStatus getStatus() { return status; }
  public byte[] getPhotoBlob() { return photoBlob; }
  public String getPhotoMime() { return photoMime; }
  public String getPhotoName() { return photoName; }
  // Actualiza datos y foto. Actor: ADMINISTRADOR. Tecnica: el id y createdBy nunca cambian (auditoria).
  public void updateDetails(byte[] nameCipher, byte[] nameNonce, byte[] rfcCipher, byte[] rfcNonce,
      byte[] emailCipher, byte[] emailNonce, String street, String streetNumber, String suburb,
      String postalCode, String state, String municipality, WorkshopStatus status) {
    nameCiphertext = nameCipher; this.nameNonce = nameNonce; rfcCiphertext = rfcCipher;
    this.rfcNonce = rfcNonce; emailCiphertext = emailCipher; this.emailNonce = emailNonce;
    this.street = street; this.streetNumber = streetNumber; this.suburb = suburb;
    this.postalCode = postalCode; this.state = state; this.municipality = municipality;
    this.status = status; updatedAt = Instant.now();
  }
  // Cambia solo el lookup cuando RFC o email cambian. Actor: sistema. Tecnica: lookup separado del cifrado.
  public void updateLookups(String rfcLookup, String emailLookup) { this.rfcLookup = rfcLookup; this.emailLookup = emailLookup; updatedAt = Instant.now(); }
  // Guarda o limpia la foto. Actor: ADMINISTRADOR. Tecnica: blob en DB evita exponer rutas predecibles.
  public void updatePhoto(byte[] blob, String mime, String name) { photoBlob = blob; photoMime = mime; photoName = name; updatedAt = Instant.now(); }
  // Getters de direccion para la respuesta. Tecnica: lectura directa sin descifrar (direccion no sensible).
  public String getStreet() { return street; }
  public String getStreetNumber() { return streetNumber; }
  public String getSuburb() { return suburb; }
  public String getPostalCode() { return postalCode; }
  public String getState() { return state; }
  public String getMunicipality() { return municipality; }
  public byte[] getNameCiphertext() { return nameCiphertext; }
  public byte[] getNameNonce() { return nameNonce; }
  public byte[] getEmailCiphertext() { return emailCiphertext; }
  public byte[] getEmailNonce() { return emailNonce; }
}
