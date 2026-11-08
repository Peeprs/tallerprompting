// Utilidades W3C Trace Context. Actor: sistema. Técnica: generar/parsear traceparent sin dependencias externas.
// El frontend reutiliza el trace_id del backend si ya existe un contexto válido; nunca inventa ids si la traza ya está activa.
import type { SpanContext } from './types';

const TRACE_ID_PATTERN = /^[0-9a-f]{32}$/;
const SPAN_ID_PATTERN = /^[0-9a-f]{16}$/;

// Genera bytes aleatorios en hexadecimal. Técnica: Web Crypto, disponible en navegadores modernos.
function randomHex(length: number): string {
  const bytes = new Uint8Array(length / 2);
  globalThis.crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

// Genera un trace_id de 16 bytes que no sea todo cero. Actor: sistema.
export function newTraceId(): string {
  let value = randomHex(32);
  while (/^0+$/.test(value)) value = randomHex(32);
  return value;
}

// Genera un span_id de 8 bytes que no sea todo cero. Actor: sistema.
export function newSpanId(): string {
  let value = randomHex(16);
  while (/^0+$/.test(value)) value = randomHex(16);
  return value;
}

// Crea el contexto raíz de la sesión de aplicación. Actor: sistema.
export function createRootContext(sampled: boolean): SpanContext {
  return { traceId: newTraceId(), spanId: newSpanId(), sampled };
}

// Deriva un span hijo conservando trace_id y sampling. Actor: sistema. Técnica: parent_span_id explícito.
export function createChildContext(parent: SpanContext): SpanContext {
  return { traceId: parent.traceId, spanId: newSpanId(), parentSpanId: parent.spanId, sampled: parent.sampled };
}

// Parsea un traceparent entrante (versión 00). Actor: sistema. Técnica: valida longitudes y ceros.
export function parseTraceparent(value: string | null | undefined): SpanContext | null {
  if (!value) return null;
  const parts = value.trim().toLowerCase().split('-');
  if (parts.length !== 4 || parts[0] !== '00') return null;
  const [, traceId, spanId, flags] = parts;
  if (!TRACE_ID_PATTERN.test(traceId) || !SPAN_ID_PATTERN.test(spanId)) return null;
  if (/^0+$/.test(traceId) || /^0+$/.test(spanId)) return null;
  return { traceId, spanId, sampled: (parseInt(flags, 16) & 0x01) === 0x01 };
}

// Serializa el contexto al formato W3C. Actor: sistema. Técnica: flags 01 sampled / 00 no sampled.
export function formatTraceparent(context: SpanContext): string {
  return `00-${context.traceId}-${context.spanId}-${context.sampled ? '01' : '00'}`;
}
