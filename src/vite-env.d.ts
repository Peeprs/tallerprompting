/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ENVIRONMENT?: string;
  readonly VITE_APP_VERSION?: string;
  readonly VITE_TRACING_SAMPLE_RATE?: string;
  readonly VITE_TELEMETRY_CONSOLE?: string;
  readonly VITE_OTLP_TRACES_ENDPOINT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
