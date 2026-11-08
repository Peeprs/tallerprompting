package mx.portaltransporte.config;

import java.util.Locale;
import mx.portaltransporte.domain.Role;
import mx.portaltransporte.roles.RolePolicy;
import mx.portaltransporte.domain.factory.UserAccountFactory;
import mx.portaltransporte.repository.RoleRepository;
import mx.portaltransporte.repository.UserAccountRepository;
import mx.portaltransporte.security.CryptoService;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class AdminSeedConfiguration {
  // Crea el administrador inicial si hay credenciales en env. Actor: sistema. Tecnica: idempotente por username.
  // Si el usuario ya existe pero sin ADMINISTRADOR, lo repara. Tecnica: garantiza un admin alcanzable.
  @Bean CommandLineRunner seedAdmin(UserAccountRepository users, RoleRepository roles, PasswordEncoder encoder, CryptoService crypto, AdminSeedProperties props) { return ignored -> {
    if (props.username() == null || props.username().isBlank() || props.password() == null || props.password().isBlank() || props.email() == null || props.email().isBlank()) return;
    Role adminRole = roles.findByName(RolePolicy.ADMINISTRADOR).orElseThrow(() -> new IllegalStateException("Initial roles are absent"));
    var existing = users.findByUsername(props.username().trim());
    if (existing.isPresent()) {
      var account = existing.get();
      if (account.getRoles().stream().noneMatch(role -> RolePolicy.ADMINISTRADOR.equalsIgnoreCase(role.getName()))) account.getRoles().add(adminRole);
      users.save(account);
      return;
    }
    String lookup = crypto.lookup(props.email());
    if (users.findByEmailLookup(lookup).isPresent()) return;
    var encrypted = crypto.encrypt(props.email().trim().toLowerCase(Locale.ROOT));
    var account = new UserAccountFactory().create(new UserAccountFactory.AccountParams(props.username().trim(), lookup, encrypted.value(), encrypted.nonce(), encoder.encode(props.password().trim()), adminRole));
    account.activate();
    users.save(account);
  }; }
}
