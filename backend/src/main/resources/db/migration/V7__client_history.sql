-- Trazabilidad de clientes sin cambiar el id. Actor: sistema audita altas, ediciones, estatus y vehiculos.
-- Tecnica: UUID v7 con fecha, actor desnormalizado para no perder historia.
CREATE TABLE client_history (
  id BINARY(16) NOT NULL,
  client_id BINARY(16) NOT NULL,
  action VARCHAR(40) NOT NULL,
  detail VARCHAR(280) NOT NULL,
  actor_name VARCHAR(60) NOT NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  CONSTRAINT fk_history_client FOREIGN KEY (client_id) REFERENCES client(id) ON DELETE CASCADE
);
CREATE INDEX idx_history_client ON client_history (client_id, created_at);
