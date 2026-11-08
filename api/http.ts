// Actor: usuario autenticado en cualquier modulo.
// Cliente HTTP compartido. Tecnica: timeout con AbortController para no colgar ni tirar el servidor.
// Simple: una funcion para JSON y otra para multipart; ambas con credenciales y 12 s de limite.
import { endSpan, getSessionId, newRequestId, sanitizePath, startSpan, trackEvent, traceparentFor } from '../telemetry';

export const REQUEST_TIMEOUT_MS = 12000;

// Extrae el host de una URL absoluta sin conservar query. Actor: sistema. Tecnica: atributo de baja cardinalidad.
function hostOf(input: string): string {
  try {
    return /^https?:\/\//i.test(input) ? new URL(input).hostname : window.location.hostname;
  } catch {
    return 'unknown';
  }
}

// Ejecuta fetch con timeout. Actor: sistema. Tecnica: AbortController aborta a los 12 s y un span http.client registra la salida.
export async function fetchWithTimeout(input: string, init: RequestInit = {}, timeoutMs = REQUEST_TIMEOUT_MS): Promise<Response> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);
  const method = (init.method ?? 'GET').toUpperCase();
  const path = sanitizePath(input);
  const requestId = newRequestId();
  const span = startSpan('http.client', {
    'http.request.method': method,
    'url.path': path,
    'server.address': hostOf(input),
    'http.request_id': requestId
  });
  const headers = new Headers(init.headers);
  // Solo se propaga contexto a la API propia; nunca se envían ids de sesión a terceros.
  if (input.startsWith('/api/')) {
    headers.set('X-Request-Id', requestId);
    headers.set('X-Session-Id', getSessionId());
    headers.set('traceparent', traceparentFor(span.context));
  }
  trackEvent('http.request.started', { 'http.request.method': method, 'url.path': path, 'http.request_id': requestId }, 'info', span.context);
  try {
    const response = await fetch(input, { ...init, headers, signal: controller.signal });
    const duration = Date.now() - span.startTime;
    trackEvent(response.ok ? 'http.response' : 'http.failure', {
      'http.request.method': method,
      'url.path': path,
      'http.response.status_code': response.status,
      'http.request_id': requestId,
      duration_ms: duration
    }, response.ok ? 'info' : 'warn', span.context);
    endSpan(span, response.ok ? 'ok' : 'error');
    return response;
  } catch (error) {
    const timeout = error instanceof DOMException && error.name === 'AbortError';
    const code = timeout ? 'REQUEST_TIMEOUT' : 'NETWORK_UNAVAILABLE';
    trackEvent('http.failure', {
      'http.request.method': method,
      'url.path': path,
      'http.request_id': requestId,
      'error.type': code,
      duration_ms: Date.now() - span.startTime
    }, 'error', span.context);
    endSpan(span, 'error', code);
    if (timeout) throw new Error('REQUEST_TIMEOUT');
    throw new Error('NETWORK_UNAVAILABLE');
  } finally {
    window.clearTimeout(timer);
  }
}

// Lee error del servidor. Actor: sistema. Tecnica: mapea 400, 403, 404, 409, 413 y 415 a codigos estables.
export function mapStatusError(status: number): Error {
  if (status === 400) return new Error('VALIDATION_FAILED');
  if (status === 401) return new Error('NOT_AUTHENTICATED');
  if (status === 403) return new Error('FORBIDDEN_ROLE');
  if (status === 404) return new Error('NOT_FOUND');
  if (status === 409) return new Error('ALREADY_EXISTS');
  if (status === 413) return new Error('FILE_TOO_LARGE');
  if (status === 415) return new Error('UNSUPPORTED_FILE');
  return new Error('REQUEST_FAILED');
}

// Peticion JSON con cookie. Actor: usuario con sesion. Tecnica: mismo origen relativo, sin exponer env.
export async function jsonRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetchWithTimeout(`/api/v1/${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    ...init
  });
  if (response.status === 204) return undefined as T;
  if (!response.ok) throw mapStatusError(response.status);
  return response.json() as Promise<T>;
}

// Peticion multipart con cookie. Actor: ADMINISTRADOR sube foto. Tecnica: sin Content-Type manual (el borde lo pone el navegador).
export async function multipartRequest<T>(path: string, form: FormData, method: 'POST' | 'PUT'): Promise<T> {
  const response = await fetchWithTimeout(`/api/v1/${path}`, { method, credentials: 'include', body: form });
  if (response.status === 204) return undefined as T;
  if (!response.ok) throw mapStatusError(response.status);
  const text = await response.text();
  return (text ? JSON.parse(text) : undefined) as T;
}
