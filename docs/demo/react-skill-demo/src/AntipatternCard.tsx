// Ejemplo con antipatrones para la demo de react-best-practices.
// No es código de producción: sirve para que el agente detecte los problemas.
import { useEffect, useState } from 'react';

type Item = { id: string; name: string };

export function AntipatternCard() {
  const [items, setItems] = useState<Item[]>([]);
  const [query, setQuery] = useState('');
  const [count, setCount] = useState(0);

  // 1. fetch sin AbortController ni manejo de error/loading.
  useEffect(() => {
    fetch('/api/items')
      .then((response) => response.json())
      .then(setItems);
  }, []);

  // 2. estado derivado guardado y sincronizado con un efecto.
  useEffect(() => {
    setCount(items.filter((item) => item.name.includes(query)).length);
  }, [items, query]);

  return (
    <section>
      {/* 3. input sin label asociado. */}
      <input value={query} onChange={(event) => setQuery(event.target.value)} />
      <p>{count} resultados</p>
      <ul>
        {/* 4. key por índice. */}
        {items.map((item, index) => (
          <li key={index}>{item.name}</li>
        ))}
      </ul>
    </section>
  );
}
