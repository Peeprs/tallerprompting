package mx.portaltransporte.records;

import java.util.*;
import mx.portaltransporte.domain.*;
import mx.portaltransporte.domain.factory.ClientHistoryFactory;
import mx.portaltransporte.domain.factory.ClientRecordFactory;
import mx.portaltransporte.domain.factory.ClientVehicleFactory;
import mx.portaltransporte.domain.factory.VehicleFactory;
import mx.portaltransporte.domain.factory.WorkshopStatusFactory;
import mx.portaltransporte.repository.*;
import mx.portaltransporte.security.CryptoService;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.cache.annotation.Cacheable;

// Actor: sistema acelera GET /clients paginado sin repetir el descifrado.
// Cache-aside de filas descifradas. Tecnica: la pagina se recorta del cache; se evicta al mutar.
@Component
public class ClientRowsCache {
 private final ClientRecordRepository clients; private final CryptoService crypto;
 // Guarda dependencias. Actor: sistema. Tecnica: inyeccion por constructor.
 public ClientRowsCache(ClientRecordRepository clients, CryptoService crypto) { this.clients=clients; this.crypto=crypto; }
 // Filas descifradas y ordenadas por nombre. Actor: sistema. Tecnica: solo exitos, TTL 5 min.
 @Cacheable(value="clientRows", key="#onlyActive")
 public List<RecordDtos.ClientResponse> all(boolean onlyActive) {
  List<RecordDtos.ClientResponse> out=new ArrayList<>();
  for (ClientRecord c : clients.findAll()) {
   if (onlyActive && (c.getStatus()==null || !mx.portaltransporte.workshops.WorkshopPolicy.ACTIVE_CODE.equals(c.getStatus().getCode()))) continue;
   out.add(one(c));
  }
  out.sort(Comparator.comparing(RecordDtos.ClientResponse::name));
  return out;
 }
 // Convierte un cliente a fila de tabla. Actor: sistema. Tecnica: [protegido] si la clave cambio.
 public RecordDtos.ClientResponse one(ClientRecord client) {
  String name; try { name=crypto.decrypt(client.getNameCiphertext(),client.getNameNonce()); } catch (Exception failed) { name="[protegido]"; }
  String document=""; if (!client.getIdentifications().isEmpty()) { var row=client.getIdentifications().get(0); try { document=crypto.decrypt(row.getValueCiphertext(),row.getValueNonce()); } catch (Exception failed) { document="[protegido]"; } }
  List<RecordDtos.ClientContactResponse> contacts=new ArrayList<>();
  for (ClientContact contact : client.getContacts()) {
   String value; try { value=crypto.decrypt(contact.getValueCiphertext(),contact.getValueNonce()); } catch (Exception failed) { value="[protegido]"; }
   String contactName=""; if (contact.getNameCiphertext()!=null) { try { contactName=crypto.decrypt(contact.getNameCiphertext(),contact.getNameNonce()); } catch (Exception failed) { contactName="[protegido]"; } }
   contacts.add(new RecordDtos.ClientContactResponse(contactName,value,contact.isPrimary()));
  }
  contacts.sort(Comparator.comparing(RecordDtos.ClientContactResponse::primary).reversed());
  UUID workshopId=null; String workshopName="";
  if (client.getWorkshop()!=null) { workshopId=client.getWorkshop().getId(); try { workshopName=crypto.decrypt(client.getWorkshop().getNameCiphertext(),client.getWorkshop().getNameNonce()); } catch (Exception failed) { workshopName="[protegido]"; } }
  String statusCode="", statusLabel="";
  if (client.getStatus()!=null) { statusCode=client.getStatus().getCode(); statusLabel=client.getStatus().getLabel(); }
  return new RecordDtos.ClientResponse(client.getId(),name,document,contacts,workshopId,workshopName,statusCode,statusLabel);
 }
}
