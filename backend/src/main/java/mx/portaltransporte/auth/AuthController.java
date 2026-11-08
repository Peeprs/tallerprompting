package mx.portaltransporte.auth;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import java.util.Map;
import java.util.Optional;
import mx.portaltransporte.security.SessionProperties;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

// Actor: visitante sin cuenta (register/login/recovery) y usuario autenticado (logout).
// Rutas opacas sin id predecible. Tecnica: sesion via cookie HttpOnly, nunca en URL.
@RestController @RequestMapping("/api/v1/auth")
public class AuthController {
  private final AuthService service;
  private final SessionProperties sessionProps;
  private final RecoveryProperties recoveryProps;
  // Guarda servicio y config de sesion. Actor: sistema. Tecnica: cookie desde env, no hardcodeada.
  public AuthController(AuthService service, SessionProperties sessionProps, RecoveryProperties recoveryProps) { this.service = service; this.sessionProps = sessionProps; this.recoveryProps = recoveryProps; }
  // Registra visitante. Actor: visitante sin cuenta. Tecnica: 204 sin filtrar existencia.
  @PostMapping("/register") @ResponseStatus(HttpStatus.NO_CONTENT) public void register(@Valid @RequestBody AuthDtos.RegisterRequest request) { service.register(request); }
  // Autentica y emite cookie opaca. Actor: usuario registrado. Tecnica: Secure/SameSite desde propiedades.
  @PostMapping("/login") public AuthDtos.LoginResponse login(@Valid @RequestBody AuthDtos.LoginRequest request, HttpServletResponse response) { var result=service.login(request); response.addHeader(HttpHeaders.SET_COOKIE,buildCookie(result.rawSessionToken(),sessionProps.maxAgeSeconds()).toString()); return result.response(); }
  // Restaura la sesión desde la cookie opaca. Actor: usuario con cuenta. Técnica: el servicio valida hash, vigencia y estado sin depender del SecurityContext.
  @GetMapping("/session") public AuthDtos.LoginResponse session(HttpServletRequest request) { return service.currentSession(readSessionCookie(request)); }
  // Cierra sesion y revoca token. Actor: usuario autenticado. Tecnica: revoca en BD y expira cookie.
  @PostMapping("/logout") @ResponseStatus(HttpStatus.NO_CONTENT) public void logout(HttpServletRequest request, HttpServletResponse response) { String token = readSessionCookie(request); if (token != null && !token.isBlank()) service.logout(token); response.addHeader(HttpHeaders.SET_COOKIE,buildCookie("",0).toString()); }
  // Solicita recuperacion. Actor: usuario sin acceso. Tecnica: 204 identico; en dev expone token para validar pantalla.
  @PostMapping("/recovery/request") public ResponseEntity<Map<String, String>> requestRecovery(@Valid @RequestBody AuthDtos.RecoveryRequest request) { Optional<String> raw = service.requestRecovery(request); if (recoveryProps.devExpose() && raw.isPresent()) return ResponseEntity.ok(Map.of("devToken", raw.get())); return ResponseEntity.noContent().build(); }
  // Restablece clave. Actor: usuario con token de correo. Tecnica: token de un solo uso de 15 min.
  @PostMapping("/recovery/reset") @ResponseStatus(HttpStatus.NO_CONTENT) public void reset(@Valid @RequestBody AuthDtos.ResetRequest request) { service.reset(request); }
  // Construye cookie de sesion. Actor: sistema. Tecnica: centraliza nombre/flags para no duplicar.
  private ResponseCookie buildCookie(String value, long maxAge) { return ResponseCookie.from(sessionProps.cookieName(),value).httpOnly(true).secure(sessionProps.secure()).sameSite("Strict").path("/").maxAge(maxAge).build(); }
  // Lee la cookie por nombre configurado. Actor: sistema. Tecnica: evita hardcodear PORTAL_SESSION.
  private String readSessionCookie(HttpServletRequest request) { Cookie[] cookies = request.getCookies(); if (cookies == null) return null; for (Cookie cookie : cookies) if (sessionProps.cookieName().equals(cookie.getName())) return cookie.getValue(); return null; }
}
