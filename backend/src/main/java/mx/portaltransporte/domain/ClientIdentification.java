package mx.portaltransporte.domain;

import jakarta.persistence.*; import java.sql.Types; import java.util.UUID; import org.hibernate.annotations.JdbcTypeCode;
@Entity @Table(name="client_identification") public class ClientIdentification {
 @Id @JdbcTypeCode(Types.BINARY) private UUID id; @ManyToOne(optional=false) @JoinColumn(name="client_id") private ClientRecord client; @Column(nullable=false) private String type; @JdbcTypeCode(Types.CHAR) @Column(name="value_lookup",nullable=false,length=64) private String valueLookup; @Lob @JdbcTypeCode(Types.LONGVARBINARY) @Column(name="value_ciphertext",nullable=false) private byte[] valueCiphertext; @JdbcTypeCode(Types.BINARY) @Column(name="value_nonce",nullable=false,length=12) private byte[] valueNonce;
 protected ClientIdentification() { } ClientIdentification(ClientRecord client,String type,String lookup,byte[] value,byte[] nonce) { id=UuidV7.next(); this.client=client; this.type=type; valueLookup=lookup; valueCiphertext=value; valueNonce=nonce; }
 public String getLookup() { return valueLookup; }
 public byte[] getValueCiphertext() { return valueCiphertext; }
 public byte[] getValueNonce() { return valueNonce; }
}
