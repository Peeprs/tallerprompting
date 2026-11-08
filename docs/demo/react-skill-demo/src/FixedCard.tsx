// Versión corregida del ejemplo, alineada con react-best-practices.
import { useEffect, useMemo, useState } from 'react';

type Item = { id: string; name: string };
type Status = 'loading' | 'ready' | 'error';

export function FixedCard() {
  const [items, setItems] = useState<Item[]>([]);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<Status>('loading');

  // 1. fetch con cancelación, error y estados explícitos.
  useEffect(() => {
    const controller = new AbortController();

    fetch('/api/items', { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error('REQUEST_FAILED');
        return response.json() as Promise<Item[]>;
      })
      .then((data) => {
        setItems(data);
        setStatus('ready');
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        setStatus('error');
      });

    return () => controller.abort();
  }, []);

  // 2. estado derivado en render, sin useEffect.
  const filtered = useMemo(
    () => items.filter((item) => item.name.toLowerCase().includes(query.toLowerCase())),
    [items, query]
  );

  if (status === 'loading') return <p>Cargando…</p>;
  if (status === 'error') return <p>No se pudo cargar. Intenta de nuevo.</p>;
  if (!filtered.length) return <p>Sin resultados.</p>;

  return (
    <section>
      {/* 3. label asociado. */}
      <label htmlFor="item-query">Buscar</label>
      <input
        id="item-query"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
      <p>{filtered.length} resultados</p>
      <ul>
        {/* 4. key estable. */}
        {filtered.map((item) => (
          <li key={item.id}>{item.name}</li>
        ))}
      </ul>
    </section>
  );
}
