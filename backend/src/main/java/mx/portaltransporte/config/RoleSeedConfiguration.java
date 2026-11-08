package mx.portaltransporte.config;

import mx.portaltransporte.domain.Role;
import mx.portaltransporte.repository.RoleRepository;
import mx.portaltransporte.roles.RolePolicy;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RoleSeedConfiguration {
 // Siembra los roles base si faltan. Actor: sistema en arranque. Tecnica: idempotente por nombre.
 @Bean CommandLineRunner seedRoles(RoleRepository roles) { return ignored -> { create(roles,RolePolicy.ADMINISTRADOR,"Administración total"); create(roles,RolePolicy.RECEPCIONISTA,"Registro y consulta de clientes"); create(roles,RolePolicy.TRANSPORTISTA,"Consulta autorizada"); }; }
 // Crea un rol base. Actor: sistema. Tecnica: solo inserta cuando no existe.
 private void create(RoleRepository roles, String role, String description) { if (roles.findByNameIgnoreCase(role).isEmpty()) roles.save(new Role(role,description)); }
}
