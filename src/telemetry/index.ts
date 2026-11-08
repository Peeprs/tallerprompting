// Núcleo de telemetría del frontend. Actor: sistema. Técnica: spans W3C, eventos estructurados y exportación OTLP opcional.
// No registra cuerpos, cookies, tokens ni parámetros de búsqueda. Los identificadores son opacos y acotados.
import type { SpanContext, SpanRecord, TelemetryEvent } from './types';
import { createChildContext, createRootContext, formatTraceparent, newSpanId } from './traceContext';
import { exportSpan } from './otlp';

const SERVICE_NAME = 'portal-frontend';
const SESSION_KEY = 'portal.telemetry.session_id';
const SAMPLE_RATE = Math.min(1, Math.max(0, Number(import.meta.env.VITE_TRACING_SAMPLE_RATE ?? 1)));
const CONSOLE_ENABLED = import.meta.env.VITE_TELEMETRY_CONSOLE === 'true'
  || (import.meta.env.DEV && import.meta.env.VITE_TELEMETRY_CONSOLE !== 'false');

let sessionId = '';
let rootContext: SpanContext | null = null;
let initialized = false;
const buffer: TelemetryEvent[] = [];
const listeners = new Set<(event: TelemetryEvent) => void>();

// Obtiene o crea un identificador anónimo de pestaña. Actor: sistema. Técnica: sessionStorage, nunca la cookie de sesión.
export function getSessionId(): string {
  if (sessionId) return sessionId;
  try {
    const stored = globalThis.sessionStorage.getItem(SESSION_KEY);
    if (stored && /^[a-f0-9]{32}$/.test(stored)) {
      sessionId = stored;
      return sessionId;
    }
  } catch {
    // sessionStorage puede estar bloqueado; se usa un id efímero en memoria.
  }
  sessionId = newSpanId() + newSpanId();
  try {
    globalThis.sessionStorage.setItem(SESSION_KEY, sessionId);
  } catch {
    // Sin persistencia: el id vive lo que dure la página.
  }
  return sessionId;
}

// Contexto raíz de la aplicación. Actor: sistema. Técnica: un trace_id por sesión de pestaña y spans hijos por operación.
export function getRootContext(): SpanContext {
  if (!rootContext) {
    rootContext = createRootContext(Math.random() < SAMPLE_RATE);
    // Si el backend ya inyectó un traceparent en la URL/documento, se respeta; hoy no se usa, pero queda el punto de extensión.
  }
  return rootContext;
}

// Construye un span hijo. Actor: sistema. Técnica: atributos primitivos y sin datos personales.
export function startSpan(name: string, attributes: Record<string, string | number | boolean> = {}): SpanRecord {
  return {
    context: createChildContext(getRootContext()),
    name,
    startTime: Date.now(),
    attributes,
    status: 'unset'
  };
}

// Cierra un span y lo envía al exportador si está configurado. Actor: sistema.
export function endSpan(span: SpanRecord, status: 'ok' | 'error' | 'unset' = 'unset', errorType?: string): void {
  span.endTime = Date.now();
  span.status = status;
  if (errorType) span.attributes['error.type'] = errorType;
  span.attributes['duration_ms'] = Math.max(0, span.endTime - span.startTime);
  exportSpan(span);
}

// Emite un evento estructurado correlacionado con un contexto de traza. Actor: sistema.
export function trackEvent(
  eventName: string,
  attributes: Record<string, string | number | boolean> = {},
  severity: 'info' | 'warn' | 'error' = 'info',
  context: SpanContext = getRootContext()
): TelemetryEvent {
  const event: TelemetryEvent = {
    timestamp: new Date().toISOString(),
    event_name: eventName,
    trace_id: context.traceId,
    span_id: context.spanId,
    ...(context.parentSpanId ? { parent_span_id: context.parentSpanId } : {}),
    session_id: getSessionId(),
    service_name: SERVICE_NAME,
    environment: import.meta.env.VITE_ENVIRONMENT ?? import.meta.env.MODE,
    severity,
    attributes
  };
  buffer.push(event);
  if (buffer.length > 200) buffer.shift();
  if (CONSOLE_ENABLED) {
    const method = severity === 'error' ? console.error : severity === 'warn' ? console.warn : console.info;
    method('[telemetry]', JSON.stringify(event));
  }
  for (const listener of listeners) {
    try {
      listener(event);
    } catch {
      // Un suscriptor no debe afectar la aplicación.
    }
  }
  return event;
}

// Permite observar eventos desde pruebas o integraciones locales sin acoplarse al console.
export function onTelemetry(listener: (event: TelemetryEvent) => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// Devuelve una copia del búfer en memoria para diagnóstico local.
export function getBufferedEvents(): TelemetryEvent[] {
  return [...buffer];
}

// Normaliza una ruta para telemetría: sin query, sin ids opacos y sin códigos postales.
export function sanitizePath(input: string): string {
  let path = input;
  try {
    if (/^https?:\/\//i.test(input)) path = new URL(input).pathname;
  } catch {
    path = input;
  }
  path = path.split('?')[0].split('#')[0];
  path = path.replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '{id}');
  path = path.replace(/\/\d{5}(?=\/|$)/, '/{postalCode}');
  return path || '/';
}

// Genera un request_id por petición. Actor: sistema. Técnica: UUID v4, validable por el filtro del backend.
export function newRequestId(): string {
  if (typeof globalThis.crypto.randomUUID === 'function') return globalThis.crypto.randomUUID();
  return `${newSpanId()}-${newSpanId()}`;
}

// Devuelve el traceparent actual para inyectarlo en HTTP. Actor: sistema.
export function traceparentFor(context: SpanContext): string {
  return formatTraceparent(context);
}

// Limpia mensajes de error antes de registrarlos. Técnica: redacta correos y secuencias numéricas largas.
function sanitizeMessage(value: string): string {
  return value
    .replace(/[\w.+-]+@[\w-]+\.[\w.-]+/g, '[email]')
    .replace(/\b\d{8,}\b/g, '[number]')
    .replace(/\s+/g, ' ')
    .slice(0, 240);
}

// Registra una excepción no controlada. Actor: sistema. Técnica: nombre, mensaje saneado y origen; nunca el cuerpo de usuario.
export function recordException(error: unknown, source: string): void {
  const normalized = error instanceof Error ? error : new Error(String(error ?? 'unknown'));
  trackEvent('app.exception', {
    'error.type': normalized.name,
    'error.message': sanitizeMessage(normalized.message),
    'error.source': source
  }, 'error');
}

// Instala captura global de errores y promesas rechazadas. Actor: sistema.
function installErrorHandlers(): void {
  window.addEventListener('error', (event) => {
    if (!event.filename && !event.error) return;
    const error = event.error instanceof Error ? event.error : new Error(event.message || 'window.error');
    recordException(error, event.filename ? `window.error:${sanitizePath(event.filename)}` : 'window.error');
  });
  window.addEventListener('unhandledrejection', (event) => {
    recordException(event.reason, 'window.unhandledrejection');
  });
}

// Registra métricas de navegación y pintura relevantes. Actor: sistema. Técnica: PerformanceObserver cuando está disponible.
function installPerformanceObservers(): void {
  const reportNavigation = () => {
    const entry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
    if (!entry) return;
    trackEvent('performance.navigation', {
      'performance.ttfb_ms': Math.round(entry.responseStart),
      'performance.dom_content_loaded_ms': Math.round(entry.domContentLoadedEventEnd),
      'performance.load_ms': Math.round(entry.loadEventEnd)
    });
  };
  if (document.readyState === 'complete') reportNavigation();
  else window.addEventListener('load', reportNavigation, { once: true });

  if (!('PerformanceObserver' in window)) return;
  try {
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const last = entries[entries.length - 1] as PerformanceEntry & { value?: number };
      if (last?.value) trackEvent('performance.largest_contentful_paint', { 'performance.value_ms': Math.round(last.value) });
    });
    lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
  } catch {
    // El navegador no soporta el tipo de entrada.
  }
  try {
    const fidObserver = new PerformanceObserver((list) => {
      const first = list.getEntries()[0] as PerformanceEntry & { processingStart?: number };
      if (first?.processingStart) {
        trackEvent('performance.first_input_delay', { 'performance.value_ms': Math.round(first.processingStart - first.startTime) });
      }
    });
    fidObserver.observe({ type: 'first-input', buffered: true });
  } catch {
    // El navegador no soporta el tipo de entrada.
  }
}

// Inicializa telemetría una sola vez. Actor: sistema. Técnica: idempotente y tolerante a entornos sin window.
export function initTelemetry(): void {
  if (initialized || typeof window === 'undefined') return;
  initialized = true;
  getSessionId();
  trackEvent('app.initialized', {
    'service.version': import.meta.env.VITE_APP_VERSION ?? '1.0.0',
    'page.path': sanitizePath(window.location.pathname)
  });
  installErrorHandlers();
  installPerformanceObservers();
}
