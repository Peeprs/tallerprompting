package mx.portaltransporte.records;

// Actor: RECEPCIONISTA y ADMINISTRADOR registran fichas.
// Constantes de fichas. Tecnica: evita literales duplicados en servicio y controlador.
public final class RecordPolicy {
    // Tipo de cliente persona. Tecnica: valor unico de catalogo.
    public static final String PERSON_TYPE = "PERSON";
    // Tipo de identificacion generica. Tecnica: catalogo minimo ampliable.
    public static final String OTHER_TYPE = "OTHER";
    // Tipos de contacto. Tecnica: EMAIL o PHONE segun formato detectado.
    public static final String CONTACT_EMAIL = "EMAIL";
    public static final String CONTACT_PHONE = "PHONE";
    // Paginacion validada de clientes. Tecnica: pagina 1 con 10 registros por default, tope 50.
    public static final int CLIENT_PAGE_MIN = 1;
    public static final int CLIENT_PAGE_SIZE_DEFAULT = 10;
    public static final int CLIENT_PAGE_SIZE_MAX = 50;
    // Celular mexicano de 10 digitos con +52 opcional. Tecnica: misma regex que el frontend.
    public static final String CELLPHONE_PATTERN = "^(\\+?52)?[0-9]{10}$";
    // Acciones de trazabilidad del cliente. Tecnica: el historial nunca cambia el id.
    public static final String HISTORY_CREATED = "CREADO";
    public static final String HISTORY_UPDATED = "ACTUALIZADO";
    public static final String HISTORY_DEACTIVATED = "BAJA";
    public static final String HISTORY_REACTIVATED = "REACTIVADO";
    public static final String HISTORY_VEHICLE_LINKED = "VEHICULO_ASOCIADO";
    public static final String HISTORY_VEHICLE_UNLINKED = "VEHICULO_DESVINCULADO";
    // Relaciones cliente-vehiculo. Tecnica: catalogo cerrado igual que la tabla.
    public static final java.util.Set<String> VEHICLE_RELATIONSHIPS =
        java.util.Set.of("OWNER", "RESPONSIBLE", "POSSESSOR");
    private RecordPolicy() { }
}
