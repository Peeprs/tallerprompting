import type { FieldErrors } from '../types';

const admittedDomains = ['gmail.com', 'hotmail.com', 'outlook.com', 'microsoft.com'];
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const isAdmittedEmail = (value: string) => {
  const normalized = value.trim().toLowerCase();
  const domain = normalized.split('@')[1];
  return emailPattern.test(normalized) && admittedDomains.includes(domain);
};

export const passwordChecks = (value: string) => ({
  length: value.length >= 12,
  lower: /[a-z]/.test(value),
  upper: /[A-Z]/.test(value),
  number: /\d/.test(value),
  symbol: /[^A-Za-z0-9]/.test(value)
});

export const isSafePassword = (value: string) => Object.values(passwordChecks(value)).every(Boolean);

export const validateLogin = (identifier: string, password: string): FieldErrors => ({
  ...(identifier.trim() ? {} : { identifier: 'Ingresa tu usuario o correo.' }),
  ...(password ? {} : { password: 'Ingresa tu contraseña.' })
});

export const validateRegister = (username: string, email: string, password: string, confirmation: string): FieldErrors => ({
  ...(/^[a-zA-Z0-9._-]{4,40}$/.test(username) ? {} : { username: 'Usa de 4 a 40 caracteres: letras, números, punto, guion o guion bajo.' }),
  ...(isAdmittedEmail(email) ? {} : { email: 'Usa un correo Gmail, Hotmail, Outlook o Microsoft válido.' }),
  ...(isSafePassword(password) ? {} : { password: 'La contraseña aún no cumple todos los requisitos.' }),
  ...(password === confirmation && confirmation ? {} : { confirmation: 'Las contraseñas deben coincidir.' })
});

// Placa en mayusculas con guion. Actor: RECEPCIONISTA registra vehiculos. Tecnica: misma regex que el backend.
export const platePattern = /^[A-Z0-9]{2,4}-[A-Z0-9]{3,4}$/;
export const isValidPlate = (value: string) => platePattern.test(value.trim().toUpperCase());

// Da formato de placa mientras se escribe. Actor: sistema. Tecnica: mayusculas e inserta el guion.
export const formatPlate = (value: string) => {
  const cleaned = value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
  if (cleaned.length <= 3) return cleaned;
  return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
};

// Ano numerico de 4 digitos. Actor: sistema. Tecnica: bloquea letras antes de validar rango.
export const yearPattern = /^(19|20)\d{2}$/;
export const isValidYear = (value: string) => yearPattern.test(value.trim());

// Valor de rol dinamico. Actor: ADMINISTRADOR crea roles. Tecnica: misma regex que el backend.
export const roleNamePattern = /^[A-Z][A-Z0-9_]{2,39}$/;
export const isValidRoleName = (value: string) => roleNamePattern.test(value.trim().toUpperCase());

// Errores del formulario de vehiculo. Actor: RECEPCIONISTA o ADMINISTRADOR.
export const validateVehicle = (plate: string, brand: string, model: string, year: string): FieldErrors => ({
  ...(isValidPlate(plate) ? {} : { plate: 'Usa formato ABC-123 en mayúsculas con guion.' }),
  ...(brand.trim() ? {} : { brand: 'Elige una marca del catálogo.' }),
  ...(model.trim() ? {} : { model: 'Elige un modelo del catálogo.' }),
  ...(isValidYear(year) ? {} : { year: 'Ingresa un año numérico entre 1900 y 2099.' })
});

// RFC mexicano de 12 o 13 posiciones. Actor: ADMINISTRADOR registra talleres. Tecnica: espejo de WorkshopPolicy.
export const rfcPattern = /^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/;
export const isValidRfc = (value: string) => rfcPattern.test(value.trim().toUpperCase());

// Correo general de taller. Actor: sistema. Tecnica: formato libre, el registro de usuarios sigue con dominios admitidos.
export const workshopEmailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const isValidWorkshopEmail = (value: string) => workshopEmailPattern.test(value.trim().toLowerCase());

// Codigo postal de 5 digitos. Actor: sistema. Tecnica: se valida antes de llamar a SEPOMEX.
export const postalCodePattern = /^\d{5}$/;
export const isValidPostalCode = (value: string) => postalCodePattern.test(value.trim());

// Foto de 15 MB maximo solo png, jpg, jpeg o webp. Actor: sistema. Tecnica: doble barrera con el backend.
export const MAX_WORKSHOP_PHOTO_BYTES = 15 * 1024 * 1024;
export const ALLOWED_WORKSHOP_PHOTO_MIMES = ['image/png', 'image/jpeg', 'image/webp'];
export const ALLOWED_WORKSHOP_PHOTO_EXTENSIONS = ['png', 'jpg', 'jpeg', 'webp'];
export const validateWorkshopPhoto = (file: File | null): string | null => {
  if (!file) return null;
  if (file.size > MAX_WORKSHOP_PHOTO_BYTES) return 'La foto supera los 15 MB permitidos.';
  const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
  if (!ALLOWED_WORKSHOP_PHOTO_MIMES.includes(file.type) || !ALLOWED_WORKSHOP_PHOTO_EXTENSIONS.includes(extension)) {
    return 'Usa una foto png, jpg, jpeg o webp.';
  }
  return null;
};

// Errores del formulario de taller. Actor: ADMINISTRADOR. Estatus solo se valida al editar.
// Tecnica: regex por campo (nombre, calle, numero, colonia, estado, municipio) + estatus como id de BD.
export const validateWorkshop = (values: Record<string, string>, isEditing: boolean): FieldErrors => ({
  ...(isValidWorkshopName(values.workshopName) ? {} : { workshopName: 'Usa de 3 a 80 caracteres: letras, números, espacios, &, punto o guion.' }),
  ...(isValidRfc(values.rfc) ? {} : { rfc: 'Ingresa un RFC válido en mayúsculas, sin espacios ni guiones.' }),
  ...(isValidWorkshopEmail(values.workshopEmail) ? {} : { workshopEmail: 'Ingresa el correo del taller.' }),
  ...(isValidStreet(values.street) ? {} : { street: 'Usa de 2 a 80 caracteres: letras, números, espacios, punto o guion.' }),
  ...(isValidStreetNumber(values.streetNumber) ? {} : { streetNumber: 'Usa de 1 a 10 caracteres: número, letra, espacio, guion o diagonal (ej. 123, 45-A, S/N).' }),
  ...(isValidSuburb(values.suburb) ? {} : { suburb: 'Usa de 2 a 80 caracteres: letras, números, espacios, punto o guion.' }),
  ...(isValidPostalCode(values.postalCode) ? {} : { postalCode: 'Ingresa un código postal de 5 dígitos.' }),
  ...(isValidState(values.state) ? {} : { state: 'Usa de 2 a 60 caracteres: solo letras, espacios o guion.' }),
  ...(isValidMunicipality(values.municipality) ? {} : { municipality: 'Usa de 2 a 60 caracteres: solo letras, espacios o guion.' }),
  ...(isEditing ? (values.statusId ? {} : { statusId: 'Elige un estatus del catálogo.' }) : {})
});

// Contacto de cliente: email o telefono. Actor: RECEPCIONISTA. Tecnica: al menos un medio valido.
export const clientNamePattern = /^[A-Za-zÁÉÍÓÚáéíóúÑñÜü'.\s-]{3,80}$/;
export const isValidClientName = (value: string) => clientNamePattern.test(value.trim());
export const clientDocumentPattern = /^[A-Z0-9]{10,18}$/i;
export const isValidClientDocument = (value: string) => clientDocumentPattern.test(value.trim());
export const clientPhonePattern = /^[+\d][\d\s-]{6,19}$/;
export const isValidClientContact = (value: string) => {
  const normalized = value.trim().toLowerCase();
  return workshopEmailPattern.test(normalized) || clientPhonePattern.test(value.trim());
};

// Errores UC-CV-01: nombre, N contactos y taller activo. Actor: RECEPCIONISTA o ADMINISTRADOR.
// Tecnica: regex con acentos y per-contacto (contact-i) ademas del global.
export const validateClient = (fullName: string, contacts: string[], workshopId: string): FieldErrors => {
  const next: FieldErrors = {};
  if (!isValidClientName(fullName)) next.fullName = 'Usa de 3 a 80 caracteres: letras, acentos, espacios, punto, apóstrofo o guion.';
  const filled = contacts.map((contact) => contact.trim()).filter(Boolean);
  if (!filled.length) next.contacts = 'Agrega al menos un medio de contacto.';
  else {
    contacts.forEach((contact, index) => {
      const trimmed = contact.trim();
      if (trimmed && !isValidClientContact(trimmed)) next[`contact-${index}`] = 'Usa un correo válido o un teléfono de 7 a 20 dígitos.';
    });
    if (filled.some((contact) => !isValidClientContact(contact))) next.contacts = 'Revisa el formato de cada contacto.';
    else if (new Set(filled.map((contact) => contact.toLowerCase())).size !== filled.length) next.contacts = 'Hay contactos duplicados.';
  }
  if (!workshopId) next.workshopId = 'Elige un taller activo.';
  return next;
};

// Regex de direccion de taller. Actor: ADMINISTRADOR. Tecnica: espejo flexible del backend (alla solo NotBlank).
export const workshopNamePattern = /^[A-Za-z0-9ÁÉÍÓÚáéíóúÑñÜü&'.\s-]{3,80}$/;
export const isValidWorkshopName = (value: string) => workshopNamePattern.test(value.trim());
export const streetPattern = /^[A-Za-z0-9ÁÉÍÓÚáéíóúÑñÜü'.\s-]{2,80}$/;
export const isValidStreet = (value: string) => streetPattern.test(value.trim());
export const streetNumberPattern = /^[A-Za-z0-9][A-Za-z0-9\s\-/.]{0,9}$/;
export const isValidStreetNumber = (value: string) => streetNumberPattern.test(value.trim());
export const suburbPattern = /^[A-Za-z0-9ÁÉÍÓÚáéíóúÑñÜü'.\s-]{2,80}$/;
export const isValidSuburb = (value: string) => suburbPattern.test(value.trim());
export const statePattern = /^[A-Za-zÁÉÍÓÚáéíóúÑñÜü\s-]{2,60}$/;
export const isValidState = (value: string) => statePattern.test(value.trim());
export const municipalityPattern = /^[A-Za-zÁÉÍÓÚáéíóúÑñÜü\s-]{2,60}$/;
export const isValidMunicipality = (value: string) => municipalityPattern.test(value.trim());

// Contacto secundario/referencia: nombre completo + celular. Actor: RECEPCIONISTA.
// Tecnica: misma regex que el backend (RecordPolicy.CELLPHONE_PATTERN) sobre digitos canonicos.
export const secondaryNamePattern = clientNamePattern;
export const isValidSecondaryName = (value: string) => secondaryNamePattern.test(value.trim());
export const canonicalCellphone = (value: string) => value.replace(/[\s-]/g, '');
export const cellphonePattern = /^(\+?52)?\d{10}$/;
export const isValidSecondaryPhone = (value: string) => cellphonePattern.test(canonicalCellphone(value.trim()));
export const validateSecondary = (name: string, phone: string): FieldErrors => ({
  ...(isValidSecondaryName(name) ? {} : { name: 'Usa de 3 a 80 caracteres: letras, acentos, espacios, punto, apóstrofo o guion.' }),
  ...(isValidSecondaryPhone(phone) ? {} : { phone: 'Usa 10 dígitos, con +52 opcional (ej. 5512345678).' })
});

// Relaciones cliente-vehiculo. Actor: RECEPCIONISTA asocia. Tecnica: catalogo cerrado igual que el backend.
export const VEHICLE_RELATIONSHIPS = [
  { value: 'OWNER', label: 'Propietario' },
  { value: 'RESPONSIBLE', label: 'Responsable' },
  { value: 'POSSESSOR', label: 'Poseedor' }
] as const;
export const isValidRelationship = (value: string) =>
  (VEHICLE_RELATIONSHIPS as readonly { value: string }[]).some((item) => item.value === value);

// Paginacion validada de clientes. Actor: sistema. Tecnica: pagina base 1, espejo del backend.
export const isValidPage = (page: number, totalPages: number) =>
  Number.isInteger(page) && page >= 1 && (totalPages <= 0 || page <= totalPages);
