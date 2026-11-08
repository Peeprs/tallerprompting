package mx.portaltransporte.security;

import jakarta.servlet.*; import jakarta.servlet.http.*;
import java.io.IOException;
import mx.portaltransporte.repository.UserSessionRepository;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class SessionAuthenticationFilter extends OncePerRequestFilter {
 // Guarda repos y config. Actor: sistema. Tecnica: nombre de cookie desde env, no hardcodeado.
 private final UserSessionRepository sessions; private final CryptoService crypto; private final SessionProperties sessionProps;
 // Inyecta dependencias. Actor: sistema. Tecnica: constructor unico de Spring.
 public SessionAuthenticationFilter(UserSessionRepository sessions, CryptoService crypto, SessionProperties sessionProps) { this.sessions = sessions; this.crypto = crypto; this.sessionProps = sessionProps; }
 // Autentica por cookie opaca. Actor: usuario con sesion. Tecnica: solo acepta sesion valida no revocada.
 @Override protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain) throws ServletException, IOException {
  if (SecurityContextHolder.getContext().getAuthentication() == null) { String token = readCookie(request, sessionProps.cookieName()); if (token != null) sessions.findByTokenHash(crypto.sha256(token)).filter(session -> session.isValid()).ifPresent(session -> { var authorities = session.getUser().getRoles().stream().map(role -> new SimpleGrantedAuthority("ROLE_" + role.getName())).toList(); SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(session.getUser().getId().toString(), null, authorities)); }); }
  chain.doFilter(request, response);
 }
 // Lee cookie esperada. Actor: sistema. Tecnica: compara por nombre configurado.
 private String readCookie(HttpServletRequest request, String expected) { Cookie[] cookies = request.getCookies(); if (cookies == null) return null; for (Cookie cookie : cookies) if (expected.equals(cookie.getName())) return cookie.getValue(); return null; }
}
