package mx.portaltransporte.domain.factory;

import mx.portaltransporte.domain.Vehicle;
import mx.portaltransporte.domain.VehiclePhoto;

// Actor: sistema almacena fotos del vehículo. Técnica: fábrica concreta con orden estable.
public class VehiclePhotoFactory implements EntityFactory<VehiclePhoto, VehiclePhotoFactory.PhotoParams> {
  public record PhotoParams(Vehicle vehicle, short position, byte[] content, String mimeType, String fileName) { }
  @Override public VehiclePhoto create(PhotoParams params) {
    return new VehiclePhoto(params.vehicle(), params.position(), params.content(), params.mimeType(), params.fileName());
  }
}
