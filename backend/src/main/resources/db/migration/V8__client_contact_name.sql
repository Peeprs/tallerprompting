-- Nombre del contacto secundario/referencia cifrado. Actor: RECEPCIONISTA captura Nombre + Telefono.
-- Tecnica: columnas nulables para no romper contactos heredados.
ALTER TABLE client_contact ADD COLUMN contact_name_ciphertext BLOB NULL AFTER contact_type;
ALTER TABLE client_contact ADD COLUMN contact_name_nonce BINARY(12) NULL AFTER contact_name_ciphertext;
