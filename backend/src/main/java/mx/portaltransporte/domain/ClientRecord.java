package mx.portaltransporte.domain;

import jakarta.persistence.*;
import java.sql.Types;
import java.util.*;
import org.hibernate.annotations.JdbcTypeCode;

@Entity @Table(name = "client")
public class ClientRecord {
 @Id @JdbcTypeCode(Types.BINARY) private UUID id;
 @Column(name = "client_type", nullable = false) private String clientType;
 @Lob @JdbcTypeCode(Types.LONGVARBINARY) @Column(name = "name_ciphertext", nullable = false) private byte[] nameCiphertext;
 @JdbcTypeCode(Types.BINARY) @Column(name = "name_nonce", nullable = false, length = 12) private byte[] nameNonce;
  @ManyToOne(optional = false) @JoinColumn(name = "created_by") private UserAccount createdBy;
  // Taller activo asociado (UC-CV-01). Actor: RECEPCIONISTA elige taller ACTIVO. Tecnica: opcional por compatibilidad.
  @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "workshop_id") private Workshop workshop;
  @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "status_id") private WorkshopStatus status;
 @OneToMany(mappedBy = "client", cascade = CascadeType.ALL, orphanRemoval = true) private List<ClientIdentification> identifications = new ArrayList<>();
 @OneToMany(mappedBy = "client", cascade = CascadeType.ALL, orphanRemoval = true) private List<ClientContact> contacts = new ArrayList<>();
 protected ClientRecord() { }
 public ClientRecord(String type, byte[] name, byte[] nonce, UserAccount actor) { id=UuidV7.next(); clientType=type; nameCiphertext=name; nameNonce=nonce; createdBy=actor; }
 public UUID getId() { return id; }
 public byte[] getNameCiphertext() { return nameCiphertext; }
 public byte[] getNameNonce() { return nameNonce; }
 public java.util.List<ClientIdentification> getIdentifications() { return identifications; }
 public java.util.List<ClientContact> getContacts() { return contacts; }
 // Asocia el taller activo. Actor: RECEPCIONISTA. Tecnica: el servicio valida ACTIVO antes de asignar.
 public void setWorkshop(Workshop workshop) { this.workshop = workshop; }
 public Workshop getWorkshop() { return workshop; }
 public void updateName(byte[] value, byte[] nonce) { nameCiphertext=value; nameNonce=nonce; }
 public void clearIdentifications() { identifications.clear(); }
 public void clearContacts() { contacts.clear(); }
 public WorkshopStatus getStatus() { return status; }
 // Cambia el estatus con el catalogo global. Actor: RECEPCIONISTA da de baja, ADMINISTRADOR reactiva.
 public void setStatus(WorkshopStatus status) { this.status = status; }
 public void addIdentification(String type, String lookup, byte[] value, byte[] nonce) { identifications.add(new ClientIdentification(this,type,lookup,value,nonce)); }
 public void addEmail(String lookup, byte[] value, byte[] nonce) { contacts.add(new ClientContact(this,"EMAIL",lookup,value,nonce)); }
 // Agrega contacto tipificado con nombre de referencia. Actor: RECEPCIONISTA captura secundarios.
 public void addContact(String type, String lookup, byte[] value, byte[] nonce, byte[] nameCipher, byte[] nameNonce, boolean primary) { ClientContact contact = new ClientContact(this,type,lookup,value,nonce,nameCipher,nameNonce); contact.setPrimary(primary); contacts.add(contact); }
}
