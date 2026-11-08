CREATE TABLE workshop_status (id BINARY(16) NOT NULL, code VARCHAR(20) NOT NULL, label VARCHAR(60) NOT NULL, PRIMARY KEY (id), CONSTRAINT uk_workshop_status_code UNIQUE (code));
CREATE TABLE workshop (
  id BINARY(16) NOT NULL,
  name_ciphertext BLOB NOT NULL, name_nonce BINARY(12) NOT NULL,
  rfc_lookup CHAR(64) NOT NULL, rfc_ciphertext BLOB NOT NULL, rfc_nonce BINARY(12) NOT NULL,
  email_lookup CHAR(64) NOT NULL, email_ciphertext BLOB NOT NULL, email_nonce BINARY(12) NOT NULL,
  photo_blob LONGBLOB NULL, photo_mime VARCHAR(40) NULL, photo_name VARCHAR(160) NULL,
  street VARCHAR(120) NOT NULL, street_number VARCHAR(20) NOT NULL, suburb VARCHAR(120) NOT NULL,
  postal_code VARCHAR(5) NOT NULL, state VARCHAR(80) NOT NULL, municipality VARCHAR(80) NOT NULL,
  status_id BINARY(16) NOT NULL, created_by BINARY(16) NOT NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  CONSTRAINT uk_workshop_rfc UNIQUE (rfc_lookup),
  CONSTRAINT uk_workshop_email UNIQUE (email_lookup),
  CONSTRAINT fk_workshop_status FOREIGN KEY (status_id) REFERENCES workshop_status(id),
  CONSTRAINT fk_workshop_creator FOREIGN KEY (created_by) REFERENCES user_account(id)
);
CREATE INDEX idx_workshop_status ON workshop (status_id);
-- El cliente exige taller activo: columna preparada para UC-CV-01, nula hasta migrar datos.
ALTER TABLE client ADD COLUMN workshop_id BINARY(16) NULL AFTER created_by;
ALTER TABLE client ADD CONSTRAINT fk_client_workshop FOREIGN KEY (workshop_id) REFERENCES workshop(id);
CREATE INDEX idx_client_workshop ON client (workshop_id);
