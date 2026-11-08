ALTER TABLE vehicle ADD COLUMN mileage_km INT NULL;

CREATE TABLE vehicle_photo (
  id BINARY(16) NOT NULL,
  vehicle_id BINARY(16) NOT NULL,
  position SMALLINT UNSIGNED NOT NULL,
  photo_blob LONGBLOB NOT NULL,
  photo_mime VARCHAR(40) NOT NULL,
  photo_name VARCHAR(160) NOT NULL,
  PRIMARY KEY (id),
  CONSTRAINT uk_vehicle_photo_position UNIQUE (vehicle_id, position),
  CONSTRAINT ck_vehicle_photo_position CHECK (position BETWEEN 1 AND 3),
  CONSTRAINT fk_vehicle_photo_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicle(id) ON DELETE CASCADE
);
