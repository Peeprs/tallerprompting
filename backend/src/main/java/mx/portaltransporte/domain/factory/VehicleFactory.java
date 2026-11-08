package mx.portaltransporte.domain.factory;

import mx.portaltransporte.domain.Vehicle;

// Actor: RECEPCIONISTA y ADMINISTRADOR registran vehiculos.
// Fabrica concreta de Vehicle. Tecnica: centraliza normalizacion previa al new.
public class VehicleFactory implements EntityFactory<Vehicle, VehicleFactory.VehicleParams> {
    // Parametros ya normalizados del vehiculo. Tecnica: record evita duplicar trim/upperCase.
    public record VehicleParams(String plate, String vin, String brand, String model, short year, Integer mileageKm) { }
    // Crea un Vehicle con id UUID v7. Tecnica: Factory Method de la jerarquia EntityFactory.
    @Override
    public Vehicle create(VehicleParams params) {
        return new Vehicle(params.plate(), params.vin(), params.brand(), params.model(), params.year(), params.mileageKm());
    }
}
