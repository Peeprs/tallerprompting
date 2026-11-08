package mx.portaltransporte.domain.factory;

import mx.portaltransporte.domain.UserAccount;
import mx.portaltransporte.domain.UserSession;

// Actor: usuario autenticado con sesion opaca.
// Fabrica concreta de UserSession. Tecnica: guarda solo hash SHA-256, nunca el token plano.
public class UserSessionFactory implements EntityFactory<UserSession, UserSessionFactory.SessionParams> {
    // Dueno de la sesion y hash del token. Tecnica: el token plano solo vive en memoria.
    public record SessionParams(UserAccount user, String tokenHash) { }
    // Crea una UserSession con id UUID v7 y expiracion de 8h. Tecnica: Factory Method.
    @Override
    public UserSession create(SessionParams params) {
        return new UserSession(params.user(), params.tokenHash());
    }
}
