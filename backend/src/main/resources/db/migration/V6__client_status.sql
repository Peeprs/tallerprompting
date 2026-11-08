-- Estatus de cliente con el catalogo global. Actor: RECEPCIONISTA da de baja, ADMINISTRADOR reactiva.
-- Tecnica: reutiliza estatus (ACTIVO/BAJA); los existentes nacen ACTIVO.
ALTER TABLE client ADD COLUMN status_id BINARY(16) NULL AFTER workshop_id;
UPDATE client SET status_id = (SELECT id FROM estatus WHERE code = 'ACTIVO') WHERE status_id IS NULL;
ALTER TABLE client MODIFY status_id BINARY(16) NOT NULL;
ALTER TABLE client ADD CONSTRAINT fk_client_status FOREIGN KEY (status_id) REFERENCES estatus(id);
CREATE INDEX idx_client_status ON client (status_id);
