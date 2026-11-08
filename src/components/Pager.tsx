// Actor: sistema recorre paginas 1, 2, 3 de clientes, vehiculos y talleres.
// Paginador compartido. Tecnica: ventana de 5 botones alrededor de la actual, sin duplicar marcado.
import { Icon } from './Icon';

// Ventana de paginas alrededor de la actual. Actor: sistema. Tecnica: maximo 5 botones.
export function pageWindow(current: number, total: number): number[] {
  if (total <= 0) return [];
  const start = Math.max(1, Math.min(current - 2, total - 4));
  const end = Math.min(total, start + 4);
  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}

interface Props {
  current: number;
  totalPages: number;
  label: string;
  onPage: (page: number) => void;
}

export function Pager({ current, totalPages, label, onPage }: Props) {
  if (totalPages <= 1) return null;
  return <nav className="pager" aria-label={label}>
    <button type="button" className="iconAction" disabled={current <= 1} title="Primera página" aria-label="Primera página" onClick={() => onPage(1)}><Icon name="arrowFirst" size={17} /></button>
    <button type="button" className="iconAction" disabled={current <= 1} title="Página anterior" aria-label="Página anterior" onClick={() => onPage(current - 1)}><Icon name="arrowLeft" size={17} /></button>
    {pageWindow(current, totalPages).map((number) => <button key={number} type="button" className={number === current ? 'pagerNumber active' : 'pagerNumber'} aria-label={`Página ${number}`} aria-current={number === current ? 'page' : undefined} onClick={() => onPage(number)}>{number}</button>)}
    <button type="button" className="iconAction" disabled={current >= totalPages} title="Página siguiente" aria-label="Página siguiente" onClick={() => onPage(current + 1)}><Icon name="arrowRight" size={17} /></button>
    <button type="button" className="iconAction" disabled={current >= totalPages} title="Última página" aria-label="Última página" onClick={() => onPage(totalPages)}><Icon name="arrowLast" size={17} /></button>
  </nav>;
}
