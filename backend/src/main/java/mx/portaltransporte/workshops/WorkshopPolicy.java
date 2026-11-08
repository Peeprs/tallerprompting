package mx.portaltransporte.workshops;

// Actor: ADMINISTRADOR muta talleres; RECEPCIONISTA los usa para asociar clientes.
// Constantes del modulo. Tecnica: un solo lugar para regex, limites y timeouts (sin hardcode).
public final class WorkshopPolicy {
  // Estatus por default al crear. Tecnica: el formulario de alta no muestra estatus.
  public static final String ACTIVE_CODE = "ACTIVO";
  // Estatus de baja logica. Tecnica: no se borra fisicamente para auditar clientes asociados.
  public static final String INACTIVE_CODE = "BAJA";
  // RFC mexicano 12 o 13 posiciones. Tecnica: misma regex en backend y frontend.
  public static final String RFC_PATTERN = "^[A-ZÑ&]{3,4}\\d{6}[A-Z0-9]{3}$";
  // Codigo postal de 5 digitos. Tecnica: se valida antes de llamar a SEPOMEX/IDOO/POSTALIA.
  public static final String POSTAL_CODE_PATTERN = "^\\d{5}$";
  // Foto maxima 15 MB. Tecnica: se valida en cliente y servidor (doble barrera).
  public static final long MAX_PHOTO_BYTES = 15L * 1024L * 1024L;
  // Mimes de foto permitidos. Tecnica: lista cerrada png, jpg, jpeg y webp.
  public static final java.util.Set<String> ALLOWED_PHOTO_MIMES =
      java.util.Set.of("image/png", "image/jpeg", "image/webp");
  // Timeout de transacciones del modulo en segundos. Tecnica: no tumba el servidor si la DB tarda.
  public static final int TRANSACTION_TIMEOUT_SECONDS = 15;
  private WorkshopPolicy() { }
}
