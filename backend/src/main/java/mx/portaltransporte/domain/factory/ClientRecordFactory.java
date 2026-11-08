package mx.portaltransporte.domain.factory;

import mx.portaltransporte.domain.ClientRecord;
import mx.portaltransporte.domain.UserAccount;

// Actor: RECEPCIONISTA y ADMINISTRADOR crean clientes.
// Fabrica concreta de ClientRecord. Tecnica: encapsula new + UuidV7 interno.
public class ClientRecordFactory implements EntityFactory<ClientRecord, ClientRecordFactory.ClientParams> {
    // Agrupa los datos cifrados del cliente. Tecnica: record inmutable evita parametros sueltos.
    public record ClientParams(String clientType, byte[] nameCipher, byte[] nameNonce, UserAccount actor) { }
    // Crea un ClientRecord con id UUID v7. Tecnica: Factory Method sobrescribe create.
    @Override
    public ClientRecord create(ClientParams params) {
        return new ClientRecord(params.clientType(), params.nameCipher(), params.nameNonce(), params.actor());
    }
}
