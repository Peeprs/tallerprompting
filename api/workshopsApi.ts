// Actor: ADMINISTRADOR muta; RECEPCIONISTA lista activos para asociar clientes.
// Cliente HTTP de talleres. Tecnica: ids UUID opacos, foto por multipart, timeout centralizado.
import { jsonRequest, multipartRequest } from './http';
import { PAGE_SIZE } from '../constants/pagination';

export interface WorkshopItem {
  id: string; workshopName: string; workshopEmail: string; statusCode: 'ACTIVO' | 'BAJA';
  statusLabel: string; photoUrl: string | null; street: string; streetNumber: string;
  suburb: string; postalCode: string; state: string; municipality: string;
}

export interface StatusItem { id: string; code: string; label: string; }

export interface WorkshopPage { content: WorkshopItem[]; page: number; size: number; totalElements: number; totalPages: number }

// Tamano de pagina de tablas. Actor: sistema. Tecnica: alias del valor compartido.
export const WORKSHOP_PAGE_SIZE = PAGE_SIZE;

export interface WorkshopForm {
  workshopName: string; rfc: string; workshopEmail: string; street: string; streetNumber: string;
  suburb: string; postalCode: string; state: string; municipality: string; statusId?: string;
}

// Arma el multipart taller + foto. Actor: sistema. Tecnica: JSON como Blob para @RequestPart("workshop").
function buildWorkshopForm(form: WorkshopForm, photoFile: File | null, removePhoto: boolean): FormData {
  const data = new FormData();
  data.append('workshop', new Blob([JSON.stringify(form)], { type: 'application/json' }));
  if (photoFile) data.append('photoFile', photoFile);
  return data;
}

// Endpoints de talleres. Tecnica: el servidor autoriza por rol (403 = sin permiso).
export const workshopsApi = {
  // Pagina validada de talleres. Actor: rol autorizado. onlyActive filtra para el selector de clientes.
  list: (page = 1, size = WORKSHOP_PAGE_SIZE, onlyActive = false) =>
    jsonRequest<WorkshopPage>(`workshops?page=${page}&size=${size}&onlyActive=${onlyActive}`, { method: 'GET' }),
  // Crea taller como ACTIVO. Actor: ADMINISTRADOR. La foto viaja como multipart.
  create: (form: WorkshopForm, photoFile: File | null) =>
    multipartRequest<{ id: string }>('workshops', buildWorkshopForm(form, photoFile, false), 'POST'),
  // Edita taller y cambia estatus. Actor: ADMINISTRADOR. El estatus solo existe en edicion.
  update: (id: string, form: WorkshopForm, photoFile: File | null, removePhoto: boolean) =>
    multipartRequest<WorkshopItem>(`workshops/${id}?removePhoto=${removePhoto}`, buildWorkshopForm(form, photoFile, removePhoto), 'PUT'),
  // Elimina taller. Actor: ADMINISTRADOR. 204 sin cuerpo.
  remove: (id: string) => jsonRequest<void>(`workshops/${id}`, { method: 'DELETE' }),
  // Catalogo global de estatus. Actor: rol autorizado. Se reutiliza en talleres y futuros modulos.
  // Tecnica: el front consume GET /estatus y reenvia el id tal cual en el PUT (sin inventar valores).
  listStatuses: () => jsonRequest<StatusItem[]>('estatus', { method: 'GET' })
};
