// Actor: ADMINISTRADOR escribe a mano calle, colonia, estado o municipio.
// Combobox buscable con escritura libre. Tecnica: filtra sin acentos, permite valor personalizado.
import { useEffect, useId, useRef, useState } from 'react';

interface Props {
  id: string;
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  error?: string;
  hint?: string;
  placeholder?: string;
}

// Compara sin acentos ni mayusculas. Actor: sistema. Tecnica: normalize NFD + lower.
function fold(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

export function SearchableSelect({ id, label, value, options, onChange, error, hint, placeholder }: Props) {
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(-1);
  const boxRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const query = fold(value.trim());
  const unique = [...new Set(options.map((option) => option.trim()).filter(Boolean))];
  const filtered = query
    ? unique.filter((option) => fold(option).includes(query)).slice(0, 60)
    : unique.slice(0, 60);
  // Muestra el valor libre aunque no este en la lista. Tecnica: opcion personalizada al final.
  const showCustom = value.trim() && !unique.some((option) => fold(option) === query);

  // Cierra al hacer clic fuera. Actor: sistema. Tecnica: listener global con limpieza.
  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  return <div className={`field ${error ? 'hasError' : ''}`}>
    <label htmlFor={id}>{label}</label>
    <div className="comboBox" ref={boxRef}>
      <div className="inputShell">
        <input
          id={id} value={value} role="combobox" aria-expanded={open} aria-controls={listId}
          aria-describedby={error ? `${id}Error` : hint ? `${id}Hint` : undefined} aria-invalid={Boolean(error)}
          placeholder={placeholder} autoComplete="off"
          onChange={(event) => { onChange(event.target.value); setOpen(true); setHighlight(-1); }}
          onFocus={() => setOpen(true)}
          onKeyDown={(event) => {
            if (event.key === 'ArrowDown') { event.preventDefault(); setOpen(true); setHighlight((h) => Math.min(h + 1, filtered.length - 1)); }
            else if (event.key === 'ArrowUp') { event.preventDefault(); setHighlight((h) => Math.max(h - 1, -1)); }
            else if (event.key === 'Enter' && open && highlight >= 0 && filtered[highlight]) { event.preventDefault(); onChange(filtered[highlight]); setOpen(false); }
            else if (event.key === 'Escape') setOpen(false);
          }}
        />
      </div>
      {open && (filtered.length > 0 || showCustom) && <ul id={listId} role="listbox" className="searchResults comboList">
        {filtered.map((option, index) => <li key={option} role="option" aria-selected={value === option}>
          <button type="button" className={index === highlight ? 'highlighted' : undefined} onMouseDown={(event) => { event.preventDefault(); onChange(option); setOpen(false); }}>{option}</button>
        </li>)}
        {showCustom && <li role="option" aria-selected="false"><button type="button" onMouseDown={(event) => { event.preventDefault(); setOpen(false); }}>Usar &ldquo;{value.trim()}&rdquo;</button></li>}
      </ul>}
      {open && !filtered.length && !showCustom && <p className="hint comboEmpty">Sin coincidencias: escribe el valor manualmente.</p>}
    </div>
    {error ? <small id={`${id}Error`} className="fieldError">{error}</small> : hint ? <small id={`${id}Hint`} className="fieldHint">{hint}</small> : null}
  </div>;
}
