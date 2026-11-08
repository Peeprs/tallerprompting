package mx.portaltransporte.domain.factory;

import mx.portaltransporte.domain.ClientRecord;
import mx.portaltransporte.domain.ClientVehicle;
import mx.portaltransporte.domain.Vehicle;

// Actor: RECEPCIONISTA asocia vehiculos al cliente.
// Fabrica concreta de ClientVehicle. Tecnica: Factory Method, el servicio no usa new directo.
public class ClientVehicleFactory implements EntityFactory<ClientVehicle, ClientVehicleFactory.LinkParams> {
 // Agrupa cliente, vehiculo y relacion. Tecnica: record evita parametros sueltos.
 public record LinkParams(ClientRecord client, Vehicle vehicle, String relationshipType) { }
 @Override
 public ClientVehicle create(LinkParams params) {
  return new ClientVehicle(params.client(), params.vehicle(), params.relationshipType());
 }
}
