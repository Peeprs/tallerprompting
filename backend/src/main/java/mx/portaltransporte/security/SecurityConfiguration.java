package mx.portaltransporte.security;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.*;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.web.cors.*;
import java.util.List;

@Configuration @EnableMethodSecurity @EnableConfigurationProperties({CryptoProperties.class, FrontendProperties.class, SessionProperties.class, mx.portaltransporte.auth.RecoveryProperties.class, mx.portaltransporte.config.AdminSeedProperties.class})
public class SecurityConfiguration {
 @Bean PasswordEncoder passwordEncoder() { return new BCryptPasswordEncoder(12); }
 // Evita registrar el filtro dos veces. Actor: usuario con cookie; técnica: se ejecuta solo dentro de Spring Security.
 @Bean FilterRegistrationBean<SessionAuthenticationFilter> sessionFilterRegistration(SessionAuthenticationFilter filter) {
   FilterRegistrationBean<SessionAuthenticationFilter> registration = new FilterRegistrationBean<>(filter);
   registration.setEnabled(false);
   return registration;
 }
 @Bean SecurityFilterChain securityFilterChain(HttpSecurity http, SessionAuthenticationFilter filter) throws Exception { return http.csrf(csrf -> csrf.disable()).cors(cors -> {}).sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)).authorizeHttpRequests(auth -> auth.dispatcherTypeMatchers(jakarta.servlet.DispatcherType.ERROR).permitAll().requestMatchers("/api/v1/auth/**", "/actuator/health", "/actuator/health/**").permitAll().anyRequest().authenticated()).addFilterBefore(filter, org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter.class).build(); }
 @Bean CorsConfigurationSource corsConfigurationSource(FrontendProperties props) {
   CorsConfiguration config = new CorsConfiguration();
   config.setAllowedOriginPatterns(List.of(
     "http://localhost:*",
     "http://127.0.0.1:*",
     "https://*.vercel.app",
     "https://tallerprompting.vercel.app"
   ));
   if (props.frontendOrigin() != null && !props.frontendOrigin().isBlank()) {
     config.addAllowedOrigin(props.frontendOrigin());
   }
   config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
   config.setAllowedHeaders(List.of("*"));
   // El frontend lee trace_id/request_id de la respuesta para correlacionar. Actor: sistema. Técnica: solo cabeceras de correlación.
   config.setExposedHeaders(List.of("X-Request-Id", "X-Trace-Id"));
   config.setAllowCredentials(true);
   UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
   source.registerCorsConfiguration("/**", config);
   return source;
 }
}
