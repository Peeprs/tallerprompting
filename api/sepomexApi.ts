// Actor: ADMINISTRADOR captura direccion; el autocompletado ahorra errores de colonia y municipio.
// Direcciones de Mexico por CP. Tecnica: Postali (sin clave, con CORS) como proveedor principal + cache en memoria.
import { fetchWithTimeout } from './http';

export interface PostalLookup { state: string; municipality: string; suburbs: string[]; source: string; }
const LOOKUP_TIMEOUT_MS = 8000;
const cache = new Map<string, PostalLookup>();

// Normaliza colonias de cualquier proveedor. Actor: sistema. Tecnica: minusculas recortadas, sin duplicados.
function cleanSuburbs(values: unknown[]): string[] {
  const seen = new Set<string>();
  for (const raw of values) {
    const name = String(raw ?? '').trim().toLowerCase();
    if (name && !seen.has(name)) seen.add(name);
  }
  return [...seen];
}

// Consulta Postali por CP. Tecnica: GET https://postali.app/api/v1/mx/cp/{cp}, sin API key y con CORS *.
// Respuesta: { cp, estado, municipio, asentamientos: [{ nombre }] }. Verificado con 06600, 44100 y 72000.
async function fromPostali(postalCode: string): Promise<PostalLookup | null> {
  const response = await fetchWithTimeout(`https://postali.app/api/v1/mx/cp/${postalCode}`, { headers: { Accept: 'application/json' } }, LOOKUP_TIMEOUT_MS);
  if (response.status === 404) return null;
  if (!response.ok) return null;
  const payload = await response.json() as {
    estado?: string; municipio?: string;
    asentamientos?: Array<string | { nombre?: string }>;
  };
  if (!payload.estado && !payload.municipio) return null;
  const suburbs = (payload.asentamientos ?? []).map((item) =>
    typeof item === 'string' ? item : item.nombre ?? '');
  return {
    state: String(payload.estado ?? '').toLowerCase(),
    municipality: String(payload.municipio ?? '').toLowerCase(),
    suburbs: cleanSuburbs(suburbs),
    source: 'postali'
  };
}

// Busca el CP con cache. Actor: sistema. Tecnica: evita repetir la red para el mismo CP en la sesion.
export async function lookupPostalCode(postalCode: string): Promise<PostalLookup | null> {
  const code = postalCode.trim();
  if (!/^\d{5}$/.test(code)) return null;
  const cached = cache.get(code);
  if (cached) return cached;
  try {
    const found = await fromPostali(code);
    if (found && (found.state || found.suburbs.length)) {
      cache.set(code, found);
      return found;
    }
  } catch {
    return null;
  }
  return null;
}
