package mx.portaltransporte.auth;
import jakarta.validation.constraints.*;
import java.util.List;
public final class AuthDtos {
 private AuthDtos() { }
 public record RegisterRequest(@NotBlank @Pattern(regexp="^[A-Za-z0-9._-]{4,40}$") String username, @NotBlank @Email String email, @NotBlank @Size(min=12,max=128) String password) { }
 public record LoginRequest(@NotBlank String identifier, @NotBlank String password) { }
 public record RecoveryRequest(@NotBlank @Email String email) { }
 public record ResetRequest(@NotBlank String token, @NotBlank @Size(min=12,max=128) String password) { }
 public record LoginResponse(String displayName, List<String> roles) { }
}
