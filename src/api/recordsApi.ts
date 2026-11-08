// Actor: RECEPCIONISTA y ADMINISTRADOR gestionan vehiculos y clientes UC-CV-01.
// Cliente HTTP de fichas. Tecnica: timeout centralizado de 12 s y sesion por cookie.
import { fetchWithTimeout, mapStatusError, multipartRequest } from './http';

export interface VehicleItem { id: string; plate: string; vin: string | null; brand: string; model: string; year: number; mileageKm: number | null; photoCount: number; associationId: string | null; clientId: string | null; clientName: string | null }
export interface VehiclePage { content: VehicleItem[]; page: number; size: number; totalElements: number; totalPages: number }
export interface SecondaryContact { name: string; phone: string }
export interface ClientContact { name: string; value: string; primary: boolean }
export interface ClientBody { name: string; document: string; email: string; workshopId?: string; contacts?: string[]; secondaryContacts?: SecondaryContact[] }
export interface ClientItem { id: string; name: string; document: string; contacts: ClientContact[]; workshopId: string | null; workshopName: string; statusCode: string; statusLabel: string }
export interface ClientPage { content: ClientItem[]; page: number; size: number; totalElements: number; totalPages: number }
export interface StatusItem { id: string; code: string; label: string }
export interface ClientVehicle { associationId: string; vehicleId: string; plate: string; brand: string; model: string; year: number; relationshipType: string; startsOn: string }
export interface ClientHistoryEntry { id: string; action: string; detail: string; actorName: string; createdAt: string }
import { PAGE_SIZE } from '../constants/pagination';
import { VEHICLE_UPLOAD_TIMEOUT_MS } from '../constants/vehicle';
// Tamano de pagina de clientes. Actor: sistema. Tecnica: alias del valor compartido.
export const CLIENT_PAGE_SIZE = PAGE_SIZE;

// Peticion fetch con cookie y timeout. Actor: usuario con sesion. Tecnica: mismo origen relativo, sin exponer env.
const recordsRequest = async <T>(path: string, init: RequestInit): Promise<T> => {
  const response = await fetchWithTimeout(`/api/v1/${path}`, { credentials: 'include', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, ...init });
  if (response.status === 204) return undefined as T;
  if (!response.ok) {
      if (response.status === 409 && path.startsWith('vehicles')) throw new Error('VEHICLE_ALREADY_EXISTS');
    throw mapStatusError(response.status);
  }
  return response.json() as Promise<T>;
};

// Endpoints de fichas. Tecnica: el servidor autoriza por rol (403 = sin permiso).
export const recordsApi = {
  // Crea cliente UC-CV-01 con taller activo y N contactos. Actor: ADMINISTRADOR o RECEPCIONISTA.
  createClient: (body: ClientBody | Record<string, string | string[] | SecondaryContact[]>) => recordsRequest<void>('clients', { method: 'POST', body: JSON.stringify(body) }),
  // Pagina validada de clientes. Actor: rol autorizado. Cache de paginas en memoria con eviccion al mutar.
  listClients: (page = 1, size = CLIENT_PAGE_SIZE, onlyActive = false) =>
    recordsRequest<ClientPage>(`clients?page=${page}&size=${size}&onlyActive=${onlyActive}`, { method: 'GET' }),
  // Edita cliente. Actor: ADMINISTRADOR o RECEPCIONISTA. Id opaco en URL.
  updateClient: (id: string, body: ClientBody | Record<string, string | string[] | SecondaryContact[]>) => recordsRequest<ClientItem>(`clients/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  // Da de baja o reactiva con id del catalogo global. Actor: ADMINISTRADOR o RECEPCIONISTA.
  changeClientStatus: (id: string, statusId: string) => recordsRequest<ClientItem>(`clients/${id}/status`, { method: 'PATCH', body: JSON.stringify({ statusId }) }),
  // Historial de trazabilidad. Actor: ADMINISTRADOR o RECEPCIONISTA. El id nunca cambia.
  listClientHistory: (id: string) => recordsRequest<ClientHistoryEntry[]>(`clients/${id}/history`, { method: 'GET' }),
  // Vehiculos asociados activos. Actor: rol autorizado. Aparecen tras asociar.
  listClientVehicles: (id: string) => recordsRequest<ClientVehicle[]>(`clients/${id}/vehicles`, { method: 'GET' }),
  // Asocia un vehiculo. Actor: ADMINISTRADOR o RECEPCIONISTA.
  linkVehicle: (id: string, vehicleId: string, relationshipType: string) => recordsRequest<ClientVehicle>(`clients/${id}/vehicles`, { method: 'POST', body: JSON.stringify({ vehicleId, relationshipType }) }),
  // Desvincula con fecha. Actor: ADMINISTRADOR o RECEPCIONISTA. Conserva historia.
  unlinkVehicle: (id: string, associationId: string) => recordsRequest<void>(`clients/${id}/vehicles/${associationId}`, { method: 'DELETE' }),
  // Crea vehiculo. Actor: ADMINISTRADOR o RECEPCIONISTA. Placa unica con guion.
  createVehicle: (body: Record<string, string | number | null>, photos: File[]) => multipartRequest<{ id: string }>('vehicles', buildVehicleForm(body, photos), 'POST', VEHICLE_UPLOAD_TIMEOUT_MS),
  // Pagina validada de vehiculos. Actor: rol autorizado. Cache de paginas con eviccion al mutar.
  listVehicles: (page = 1, size = CLIENT_PAGE_SIZE) =>
    recordsRequest<VehiclePage>(`vehicles?page=${page}&size=${size}`, { method: 'GET' }),
  // Edita vehiculo. Actor: ADMINISTRADOR o RECEPCIONISTA. Id opaco en URL.
  updateVehicle: (id: string, body: Record<string, string | number | null>, photos: File[]) => multipartRequest<VehicleItem>(`vehicles/${id}`, buildVehicleForm(body, photos), 'PUT', VEHICLE_UPLOAD_TIMEOUT_MS),
  // Elimina vehiculo. Actor: ADMINISTRADOR o RECEPCIONISTA. 204 sin cuerpo.
  removeVehicle: (id: string) => recordsRequest<void>(`vehicles/${id}`, { method: 'DELETE' })
};

function buildVehicleForm(body: Record<string, string | number | null>, photos: File[]): FormData {
  const form = new FormData();
  form.append('vehicle', new Blob([JSON.stringify(body)], { type: 'application/json' }));
  photos.forEach((photo) => form.append('photos', photo));
  return form;
}
