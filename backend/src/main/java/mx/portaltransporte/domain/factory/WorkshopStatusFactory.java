package mx.portaltransporte.domain.factory;

import mx.portaltransporte.domain.WorkshopStatus;

// Actor: sistema siembra el catalogo ACTIVO y BAJA.
// Fabrica concreta de WorkshopStatus. Tecnica: Factory Method, centraliza el new con UUID v7.
public class WorkshopStatusFactory implements EntityFactory<WorkshopStatus, WorkshopStatusFactory.StatusParams> {
  // Parametros del estatus. Tecnica: record inmutable, codigo en mayusculas.
  public record StatusParams(String code, String label) { }
  // Crea el estatus. Tecnica: sobrescribe create de EntityFactory.
  @Override
  public WorkshopStatus create(StatusParams params) {
    return new WorkshopStatus(params.code(), params.label());
  }
}
