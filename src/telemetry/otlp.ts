// Exportador OTLP/HTTP JSON mínimo. Actor: sistema. Técnica: mismo formato de spans que OpenTelemetry Collector.
// Deshabilitado por defecto: solo se activa con VITE_OTLP_TRACES_ENDPOINT para no enviar datos sin destino conocido.
import type { SpanRecord } from './types';

const ENDPOINT = (import.meta.env.VITE_OTLP_TRACES_ENDPOINT ?? '').trim();
const SERVICE_NAME = 'portal-frontend';
const SERVICE_VERSION = import.meta.env.VITE_APP_VERSION ?? '1.0.0';

// Convierte milisegundos a nanosegundos serializados como string (OTLP JSON). Técnica: evita pérdida de precisión en JSON.
function toUnixNano(milliseconds: number): string {
  return String(Math.round(milliseconds * 1_000_000));
}

// Convierte un atributo primitivo al formato AnyValue de OTLP.
function anyValue(value: string | number | boolean): Record<string, unknown> {
  if (typeof value === 'boolean') return { boolValue: value };
  if (typeof value === 'number') return Number.isInteger(value) ? { intValue: String(value) } : { doubleValue: value };
  return { stringValue: value };
}

// Envía un span completado. Actor: sistema. Técnica: fetch keepalive, sin credenciales ni cabeceras sensibles.
export function exportSpan(span: SpanRecord): void {
  if (!ENDPOINT || !span.endTime) return;
  const body = {
    resourceSpans: [{
      resource: {
        attributes: [
          { key: 'service.name', value: { stringValue: SERVICE_NAME } },
          { key: 'service.version', value: { stringValue: SERVICE_VERSION } },
          { key: 'deployment.environment', value: { stringValue: import.meta.env.VITE_ENVIRONMENT ?? import.meta.env.MODE } }
        ]
      },
      scopeSpans: [{
        scope: { name: 'portal-frontend', version: SERVICE_VERSION },
        spans: [{
          traceId: span.context.traceId,
          spanId: span.context.spanId,
          ...(span.context.parentSpanId ? { parentSpanId: span.context.parentSpanId } : {}),
          name: span.name,
          kind: span.name === 'http.client' ? 3 : 1,
          startTimeUnixNano: toUnixNano(span.startTime),
          endTimeUnixNano: toUnixNano(span.endTime),
          attributes: Object.entries(span.attributes).map(([key, value]) => ({ key, value: anyValue(value) })),
          status: { code: span.status === 'error' ? 2 : span.status === 'ok' ? 1 : 0 }
        }]
      }]
    }]
  };
  try {
    void fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      keepalive: true
    }).catch(() => undefined);
  } catch {
    // La telemetría nunca debe romper la aplicación.
  }
}
