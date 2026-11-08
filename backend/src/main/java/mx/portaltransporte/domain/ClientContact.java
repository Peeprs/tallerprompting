package mx.portaltransporte.domain;

import jakarta.persistence.*; import java.sql.Types; import java.util.UUID; import org.hibernate.annotations.JdbcTypeCode;
// Actor: RECEPCIONISTA captura contacto principal y secundarios con nombre de referencia.
// Contacto tipificado EMAIL o PHONE. Tecnica: nombre cifrado nulable para compatibilidad.
@Entity @Table(name="client_contact") public class ClientContact {
 @Id @JdbcTypeCode(Types.BINARY) private UUID id; @ManyToOne(optional=false) @JoinColumn(name="client_id") private ClientRecord client; @Column(name="contact_type",nullable=false) private String contactType; @Lob @JdbcTypeCode(Types.LONGVARBINARY) @Column(name="contact_name_ciphertext") private byte[] nameCiphertext; @JdbcTypeCode(Types.BINARY) @Column(name="contact_name_nonce",length=12) private byte[] nameNonce; @JdbcTypeCode(Types.CHAR) @Column(name="value_lookup",length=64) private String valueLookup; @Lob @JdbcTypeCode(Types.LONGVARBINARY) @Column(name="value_ciphertext",nullable=false) private byte[] valueCiphertext; @JdbcTypeCode(Types.BINARY) @Column(name="value_nonce",nullable=false,length=12) private byte[] valueNonce; @Column(name="is_primary",nullable=false) private boolean primaryContact=true;
 protected ClientContact() { } ClientContact(ClientRecord client,String type,String lookup,byte[] value,byte[] nonce) { this(client,type,lookup,value,nonce,null,null); } ClientContact(ClientRecord client,String type,String lookup,byte[] value,byte[] nonce,byte[] nameCipher,byte[] nameNonce) { id=UuidV7.next(); this.client=client; contactType=type; valueLookup=lookup; valueCiphertext=value; valueNonce=nonce; nameCiphertext=nameCipher; this.nameNonce=nameNonce; }
 public String getContactType() { return contactType; }
 public String getLookup() { return valueLookup; }
 public byte[] getValueCiphertext() { return valueCiphertext; }
 public byte[] getValueNonce() { return valueNonce; }
 public byte[] getNameCiphertext() { return nameCiphertext; }
 public byte[] getNameNonce() { return nameNonce; }
 public boolean isPrimary() { return primaryContact; }
 public void setPrimary(boolean primary) { primaryContact=primary; }
}
