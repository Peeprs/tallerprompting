-- Relacion cliente-vehiculo alineada con JPA. Actor: sistema valida el catalogo en servicio.
-- Tecnica: mismo patron que V2, VARCHAR en vez de ENUM.
ALTER TABLE client_vehicle MODIFY relationship_type VARCHAR(20) NOT NULL;
