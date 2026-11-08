package mx.portaltransporte.domain.factory;

import mx.portaltransporte.domain.PasswordResetToken;
import mx.portaltransporte.domain.UserAccount;

// Actor: usuario que solicita recuperar acceso.
// Fabrica de tokens de recuperacion. Tecnica: persiste solo hash para no exponer URL predecible.
public class PasswordResetTokenFactory implements EntityFactory<PasswordResetToken, PasswordResetTokenFactory.ResetParams> {
    // Usuario dueno y hash del token. Tecnica: el token plano se envia solo por correo.
    public record ResetParams(UserAccount user, String tokenHash) { }
    // Crea el token con vigencia de 15 min. Tecnica: Factory Method de la familia.
    @Override
    public PasswordResetToken create(ResetParams params) {
        return new PasswordResetToken(params.user(), params.tokenHash());
    }
}
