package mx.portaltransporte.domain.factory;

// Actor: sistema (ADMINISTRADOR, RECEPCIONISTA, TRANSPORTISTA).
// Define el Factory Method para crear entidades con UUID v7 (fecha + aleatorio).
public interface EntityFactory<entityType, paramsType> {
    // Crea la entidad a partir de sus parametros. Tecnica: delega el new a la fabrica concreta.
    entityType create(paramsType params);
}
