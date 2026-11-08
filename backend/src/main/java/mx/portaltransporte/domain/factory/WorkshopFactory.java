package mx.portaltransporte.domain.factory;

import java.util.UUID;
import mx.portaltransporte.domain.Workshop;
import mx.portaltransporte.domain.WorkshopStatus;

// Actor: ADMINISTRADOR registra talleres.
// Fabrica concreta de Workshop. Tecnica: Factory Method, el servicio no usa new directo.
public class WorkshopFactory implements EntityFactory<Workshop, WorkshopFactory.WorkshopParams> {
  // Agrupa cifrados, direccion y auditoria. Tecnica: un solo objeto evita 15 parametros sueltos.
  public record WorkshopParams(byte[] nameCipher, byte[] nameNonce, String rfcLookup, byte[] rfcCipher,
      byte[] rfcNonce, String emailLookup, byte[] emailCipher, byte[] emailNonce, String street,
      String streetNumber, String suburb, String postalCode, String state, String municipality,
      WorkshopStatus status, UUID createdBy) { }
  // Crea el taller con UUID v7 (fecha + aleatorio). Tecnica: id no secuencial ni predecible.
  @Override
  public Workshop create(WorkshopParams params) {
    return new Workshop(params.nameCipher(), params.nameNonce(), params.rfcLookup(), params.rfcCipher(),
        params.rfcNonce(), params.emailLookup(), params.emailCipher(), params.emailNonce(), params.street(),
        params.streetNumber(), params.suburb(), params.postalCode(), params.state(), params.municipality(),
        params.status(), params.createdBy());
  }
}
