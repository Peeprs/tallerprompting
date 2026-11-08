package mx.portaltransporte.records;

// Actor: ADMINISTRADOR o RECEPCIONISTA registra vehículos. Técnica: límites compartidos por el contrato REST.
public final class VehiclePolicy {
  public static final String PLATE_PATTERN = "^[A-Z0-9]{2,4}-[A-Z0-9]{3,4}$";
  public static final String VIN_PATTERN = "^[A-HJ-NPR-Z0-9]{17}$";
  public static final int VIN_LENGTH = 17;
  public static final int MAX_PHOTOS = 3;
  public static final long MAX_PHOTO_BYTES = 15L * 1024 * 1024;
  public static final int UPLOAD_TIMEOUT_SECONDS = 60;
  public static final java.util.Set<String> ALLOWED_PHOTO_MIMES = java.util.Set.of("image/png", "image/jpeg", "image/webp");
  private VehiclePolicy() { }
}
