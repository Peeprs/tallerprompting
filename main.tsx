import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { initTelemetry, recordException } from './telemetry';
import './styles/global.css';

// La telemetría se inicializa antes de renderizar para capturar el arranque y los errores tempranos.
// Actor: sistema. Técnica: instrumentación central, sin repetir código en componentes.
initTelemetry();

createRoot(document.getElementById('root')!, {
  onUncaughtError: (error) => recordException(error, 'react.uncaught')
}).render(
  <StrictMode><App /></StrictMode>
);
