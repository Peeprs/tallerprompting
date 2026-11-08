// Tipos del contrato de telemetría del frontend.
// Actor: sistema. Técnica: nombres alineados con OpenTelemetry (trace_id, span_id, parent_span_id).
export interface SpanContext {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  sampled: boolean;
}

export interface SpanRecord {
  context: SpanContext;
  name: string;
  startTime: number;
  endTime?: number;
  attributes: Record<string, string | number | boolean>;
  status: 'unset' | 'ok' | 'error';
}

export interface TelemetryEvent {
  timestamp: string;
  event_name: string;
  trace_id: string;
  span_id: string;
  parent_span_id?: string;
  session_id: string;
  service_name: string;
  environment: string;
  severity: 'info' | 'warn' | 'error';
  attributes: Record<string, string | number | boolean>;
}
