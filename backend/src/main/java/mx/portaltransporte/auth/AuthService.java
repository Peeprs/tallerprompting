package mx.portaltransporte.auth;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.*;
import mx.portaltransporte.domain.*;
import mx.portaltransporte.roles.RolePolicy;
import mx.portaltransporte.domain.factory.PasswordResetTokenFactory;
import mx.portaltransporte.domain.factory.UserAccountFactory;
import mx.portaltransporte.domain.factory.UserSessionFactory;
import mx.portaltransporte.repository.*;
import mx.portaltransporte.security.CryptoService;
import io.micrometer.observation.annotation.Observed;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service @Transactional
@Observed(name = "service.auth")
public class AuthService {
  private final UserAccountRepository users; private final RoleRepository roles; private final UserSessionRepository sessions; private final PasswordResetTokenRepository resets; private final PasswordEncoder encoder; private final CryptoService crypto; private final SecureRandom random = new SecureRandom();
  private final UserAccountFactory accountFactory = new UserAccountFactory();
  private final UserSessionFactory sessionFactory = new UserSessionFactory();
  private final PasswordResetTokenFactory resetFactory = new PasswordResetTokenFactory();
  // Guarda dependencias. Actor: sistema. Tecnica: inyeccion por constructor.
  public AuthService(UserAccountRepository users, RoleRepository roles, UserSessionRepository sessions, PasswordResetTokenRepository resets, PasswordEncoder encoder, CryptoService crypto) { this.users=users; this.roles=roles; this.sessions=sessions; this.resets=resets; this.encoder=encoder; this.crypto=crypto; }
  // Registra visitante como TRANSPORTISTA. Actor: visitante sin cuenta. Tecnica: Factory Method crea la cuenta con UUID v7.
  public void register(AuthDtos.RegisterRequest request) { validateEmail(request.email()); validatePassword(request.password()); String lookup=crypto.lookup(request.email()); if(users.findByUsername(request.username().trim()).isPresent() || users.findByEmailLookup(lookup).isPresent()) throw conflict(); Role role=roles.findByName(RolePolicy.TRANSPORTISTA).orElseThrow(() -> new IllegalStateException("Initial roles are absent")); var encrypted=crypto.encrypt(request.email().trim().toLowerCase(Locale.ROOT)); var user=accountFactory.create(new UserAccountFactory.AccountParams(request.username().trim(),lookup,encrypted.value(),encrypted.nonce(),encoder.encode(request.password()),role)); user.activate(); users.save(user); }
  // Inicia sesion y crea cookie opaca. Actor: usuario registrado. Tecnica: solo guarda hash SHA-256 del token.
  public LoginResult login(AuthDtos.LoginRequest request) { UserAccount user = findByIdentifier(request.identifier()).orElseThrow(this::unauthorized); if (user.getStatus()!=UserStatus.ACTIVE || user.isLocked() || !encoder.matches(request.password(),user.getPasswordHash())) { user.recordFailedAttempt(); users.save(user); throw unauthorized(); } user.recordSuccessfulLogin(); String raw=randomToken(); sessions.save(sessionFactory.create(new UserSessionFactory.SessionParams(user,crypto.sha256(raw)))); return new LoginResult(raw,new AuthDtos.LoginResponse(user.getUsername(),user.getRoles().stream().map(role -> role.getName()).sorted().toList())); }
  // Recupera la cuenta de una sesion autenticada. Actor: usuario con cookie vigente.
  public AuthDtos.LoginResponse currentSession(String rawToken) { if(rawToken==null||rawToken.isBlank()) throw unauthorized(); UserSession session=sessions.findUsableByTokenHash(crypto.sha256(rawToken),Instant.now()).orElseThrow(this::unauthorized); UserAccount user=session.getUser(); if(user.getStatus()!=UserStatus.ACTIVE||user.isLocked()) throw unauthorized(); return new AuthDtos.LoginResponse(user.getUsername(),user.getRoles().stream().map(Role::getName).sorted().toList()); }
  // Revoca la sesion al cerrar. Actor: usuario autenticado. Tecnica: marca revoked para invalidar cookie robada.
  public void logout(String rawToken) { sessions.findByTokenHash(crypto.sha256(rawToken)).ifPresent(session -> { session.revoke(); sessions.save(session); }); }
  // Genera token de recuperacion sin revelar si el correo existe. Actor: usuario sin acceso. Tecnica: respuesta identica exista o no.
  // Devuelve el token plano solo para validacion local. Tecnica: el hash queda en BD, el plano jamas se persiste.
  public Optional<String> requestRecovery(AuthDtos.RecoveryRequest request) { validateEmail(request.email()); Optional<UserAccount> target = users.findByEmailLookup(crypto.lookup(request.email())); if (target.isEmpty()) return Optional.empty(); String raw=randomToken(); resets.save(resetFactory.create(new PasswordResetTokenFactory.ResetParams(target.get(),crypto.sha256(raw)))); return Optional.of(raw); }
  // Cambia la contrasena con token usable. Actor: usuario con token de correo. Tecnica: consume el token de un solo uso.
  // Tambien desbloquea la cuenta. Tecnica: el token de correo prueba titularidad como un login exitoso.
  public void reset(AuthDtos.ResetRequest request) { validatePassword(request.password()); PasswordResetToken reset=resets.findByTokenHash(crypto.sha256(request.token())).filter(PasswordResetToken::isUsable).orElseThrow(this::unauthorized); reset.getUser().changePassword(encoder.encode(request.password())); reset.getUser().recordSuccessfulLogin(); reset.consume(); }
  // Busca por usuario o correo. Actor: sistema. Tecnica: usa lookup HMAC para correo cifrado.
  private Optional<UserAccount> findByIdentifier(String input) { return input.contains("@") ? users.findByEmailLookup(crypto.lookup(input)) : users.findByUsername(input.trim()); }
  // Valida dominio admitido. Actor: visitante. Tecnica: compara contra AuthPolicy centralizada.
  private void validateEmail(String email) { String[] pieces=email.trim().toLowerCase(Locale.ROOT).split("@",2); if(pieces.length!=2 || !AuthPolicy.ADMITTED_DOMAINS.contains(pieces[1])) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Invalid email"); }
  // Valida fortaleza de clave. Actor: visitante/usuario. Tecnica: regex compartida con el frontend.
  private void validatePassword(String password) { if (!password.matches(AuthPolicy.PASSWORD_PATTERN)) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Weak password"); }
  // Error 401 generico. Tecnica: no revela si el usuario existe.
  private ResponseStatusException unauthorized() { return new ResponseStatusException(HttpStatus.UNAUTHORIZED,"Invalid credentials"); } private ResponseStatusException conflict() { return new ResponseStatusException(HttpStatus.CONFLICT,"Account already exists"); }
  // Genera token opaco no predecible. Tecnica: 32 bytes aleatorios en Base64Url sin relleno.
  private String randomToken() { byte[] bytes=new byte[AuthPolicy.TOKEN_BYTES]; random.nextBytes(bytes); return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes); }
  public record LoginResult(String rawSessionToken, AuthDtos.LoginResponse response) { }
}
