package mx.portaltransporte.domain.factory;

import mx.portaltransporte.domain.ClientHistory;
import mx.portaltransporte.domain.ClientRecord;

// Actor: sistema audita la trazabilidad del cliente.
// Fabrica concreta de ClientHistory. Tecnica: Factory Method, el servicio no usa new directo.
public class ClientHistoryFactory implements EntityFactory<ClientHistory, ClientHistoryFactory.HistoryParams> {
 // Agrupa cliente, accion, detalle y actor. Tecnica: record evita parametros sueltos.
 public record HistoryParams(ClientRecord client, String action, String detail, String actorName) { }
 @Override
 public ClientHistory create(HistoryParams params) {
  return new ClientHistory(params.client(), params.action(), params.detail(), params.actorName());
 }
}
