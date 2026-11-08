// Actor: ADMINISTRADOR gestiona roles dinamicos.
// Cliente HTTP de roles. Tecnica: timeout de 12 s en todas las peticiones, ids UUID opacos.
import { fetchWithTimeout } from './http';
export interface RoleItem { id: string; name: string; description: string }
export interface UserSummary { username: string; roles: string[] }

// Peticion fetch con cookie y timeout. Tecnica: mismo origen relativo, sin exponer env.
const roleRequest = async <T>(path: string, init: RequestInit): Promise<T> => {
  const response = await fetchWithTimeout(`/api/v1/roles${path}`, { credentials: 'include', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, ...init });
  if (response.status === 204) return undefined as T;
  if (!response.ok) {
    if (response.status === 409) throw new Error('ROLE_ALREADY_EXISTS');
    if (response.status === 403) throw new Error('FORBIDDEN_ROLE');
    if (response.status === 404) throw new Error('NOT_FOUND_ROLE');
    throw new Error('REQUEST_FAILED');
  }
  return response.json() as Promise<T>;
};

// Busqueda de usuarios con cookie y timeout. Actor: ADMINISTRADOR. Tecnica: query param, maximo 20 filas.
const searchUsersRequest = async (fragment: string): Promise<UserSummary[]> => {
  const response = await fetchWithTimeout(`/api/v1/users?search=${encodeURIComponent(fragment)}`, { credentials: 'include', headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error('REQUEST_FAILED');
  return response.json() as Promise<UserSummary[]>;
};

// Endpoints de roles. Tecnica: solo ADMINISTRADOR autorizado en servidor.
export const rolesApi = {
  // Lista el catalogo. Actor: ADMINISTRADOR. Alimenta dropdown y tabla juntos.
  list: () => roleRequest<RoleItem[]>('', { method: 'GET' }),
  // Crea rol con valor y descripcion. Actor: ADMINISTRADOR. Valida duplicado en servidor.
  create: (name: string, description: string) => roleRequest<RoleItem>('', { method: 'POST', body: JSON.stringify({ name, description }) }),
  // Edita la descripcion. Actor: ADMINISTRADOR. El valor es inmutable.
  update: (id: string, description: string) => roleRequest<RoleItem>(`/${id}`, { method: 'PUT', body: JSON.stringify({ description }) }),
  // Elimina rol sin usuarios. Actor: ADMINISTRADOR. 409 si esta asignado.
  remove: (id: string) => roleRequest<void>(`/${id}`, { method: 'DELETE' }),
  // Asigna rol a usuario. Actor: ADMINISTRADOR. Operacion idempotente.
  assign: (username: string, roleName: string) => roleRequest<{ username: string; roles: string[] }>('/assign', { method: 'POST', body: JSON.stringify({ username, roleName }) }),
  // Busca usuarios por fragmento. Actor: ADMINISTRADOR. Alimenta el dropdown buscable.
  searchUsers: (fragment: string) => searchUsersRequest(fragment)
};
