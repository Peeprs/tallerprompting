package mx.portaltransporte.domain.factory;

import mx.portaltransporte.domain.Role;

// Actor: ADMINISTRADOR crea roles dinamicos.
// Fabrica concreta de Role. Tecnica: centraliza new para validar duplicados antes en servicio.
public class RoleFactory implements EntityFactory<Role, RoleFactory.RoleParams> {
    // Valor en mayusculas y descripcion. Tecnica: record evita parametros sueltos.
    public record RoleParams(String name, String description) { }
    // Crea un Role con id UUID v7. Tecnica: Factory Method de la familia EntityFactory.
    @Override
    public Role create(RoleParams params) {
        return new Role(params.name(), params.description());
    }
}
