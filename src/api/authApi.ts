// Actor: visitante sin cuenta y usuario sin acceso.
// Cliente HTTP de autenticacion. Tecnica: rutas relativas, sesion por cookie HttpOnly, timeout de 12 s.
import type { AuthResponse } from '../types';
import { fetchWithTimeout } from './http';

// Ejecuta POST JSON con cookie incluida. Tecnica: centraliza red y error de red.
const request = async <T>(path: string, body: Record<string, string>): Promise<T> => {
  const response = await fetchWithTimeout(`/api/v1/${path}`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body)
  });
  if (response.status === 204) return undefined as T;
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.code ?? 'REQUEST_FAILED');
  }
  return response.json() as Promise<T>;
};

// Respuesta de solicitud de recuperacion. Tecnica: devToken solo existe en desarrollo.
interface RecoveryRequestResponse { devToken?: string }

// Endpoints de autenticacion. Tecnica: sin ids ni tokens en URL.
export const authApi = {
  // Autentica usuario registrado. Actor: usuario con cuenta.
  login: async (identifier: string, password: string): Promise<AuthResponse> => {
    await request<AuthResponse>('auth/login', { identifier, password });
    const session = await authApi.session();
    if (!session) throw new Error('SESSION_NOT_RESTORED');
    return session;
  },
  // Recupera la sesion vigente desde la cookie HttpOnly. Actor: usuario con cuenta.
  session: async (): Promise<AuthResponse | null> => {
    const response = await fetchWithTimeout('/api/v1/auth/session', { credentials: 'include', cache: 'no-store', headers: { Accept: 'application/json' } });
    if (response.status === 401 || response.status === 403) return null;
    if (!response.ok) throw new Error('REQUEST_FAILED');
    return response.json() as Promise<AuthResponse>;
  },
  // Registra visitante. Actor: visitante sin cuenta.
  register: (username: string, email: string, password: string) => request<void>('auth/register', { username, email, password }),
  // Solicita enlace de recuperacion. Actor: usuario sin acceso. Devuelve token solo en dev.
  requestRecovery: (email: string) => request<RecoveryRequestResponse>('auth/recovery/request', { email }),
  // Restablece clave con token de un solo uso. Actor: usuario con token de correo.
  resetPassword: (token: string, password: string) => request<void>('auth/recovery/reset', { token, password })
};
