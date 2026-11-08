package mx.portaltransporte.domain.factory;

import mx.portaltransporte.domain.Role;
import mx.portaltransporte.domain.UserAccount;

// Actor: visitante sin cuenta que se registra (rol TRANSPORTISTA inicial).
// Fabrica concreta de UserAccount. Tecnica: aisla el new para no repetirlo en servicios.
public class UserAccountFactory implements EntityFactory<UserAccount, UserAccountFactory.AccountParams> {
    // Datos ya cifrados de la cuenta. Tecnica: el servicio cifra, la fabrica solo ensambla.
    public record AccountParams(String username, String emailLookup, byte[] emailCipher, byte[] emailNonce, String passwordHash, Role role) { }
    // Crea un UserAccount con id UUID v7. Tecnica: implementacion del Factory Method.
    @Override
    public UserAccount create(AccountParams params) {
        return new UserAccount(params.username(), params.emailLookup(), params.emailCipher(), params.emailNonce(), params.passwordHash(), params.role());
    }
}
