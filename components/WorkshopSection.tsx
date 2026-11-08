// Actor: ADMINISTRADOR edita y elimina; RECEPCIONISTA consulta activos para asociar clientes.
// Tabla de talleres con paginacion validada: Foto, Nombre, Correo, Estatus y Acciones.
// Tecnica: pagina base 1 con 10 registros, cache-aside de paginas con eviccion al mutar.
import { useEffect, useRef, useState } from 'react';
import { WORKSHOP_PAGE_SIZE, workshopsApi, type WorkshopItem, type WorkshopPage } from '../api/workshopsApi';
import type { Notice } from '../types';
import { isValidPage } from '../utils/validation';
import { ConfirmDialog } from './ConfirmDialog';
import { Icon } from './Icon';
import { Pager } from './Pager';
import { WorkshopDialog } from './WorkshopDialog';

export function WorkshopSection({ canMutate, onNotice }: { canMutate: boolean; onNotice: (notice: Notice) => void }) {
  const [page, setPage] = useState<WorkshopPage | null>(null);
  const [current, setCurrent] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<WorkshopItem | null>(null);
  const [confirmWorkshop, setConfirmWorkshop] = useState<WorkshopItem | null>(null);
  const [pending, setPending] = useState(false);
  const pageCache = useRef(new Map<number, WorkshopPage>());

  // Evicta el cache de paginas al mutar. Actor: sistema. Tecnica: invalidacion por evento, no por tiempo.
  const evictPages = () => pageCache.current.clear();

  // Carga una pagina validada. Actor: sistema. Tecnica: valida front, cache-aside, luego red.
  const loadPage = async (requested: number) => {
    const total = page?.totalPages ?? 0;
    if (!isValidPage(requested, total)) return;
    const cached = pageCache.current.get(requested);
    if (cached) {
      setPage(cached);
      setCurrent(requested);
      return;
    }
    setPending(true);
    try {
      const fresh = await workshopsApi.list(requested, WORKSHOP_PAGE_SIZE, false);
      pageCache.current.set(requested, fresh);
      setPage(fresh);
      setCurrent(requested);
    } catch (error) {
      const code = error instanceof Error ? error.message : '';
      if (code === 'FORBIDDEN_ROLE') onNotice({ kind: 'error', title: 'Sin permiso', message: 'No tienes el rol para ver talleres.' });
      else if (code === 'NETWORK_UNAVAILABLE' || code === 'REQUEST_TIMEOUT') onNotice({ kind: 'error', title: 'Servidor no disponible', message: 'Verifica que el backend esté corriendo e intenta de nuevo.' });
      else onNotice({ kind: 'error', title: 'Sin acceso', message: 'No se pudo cargar la página de talleres.' });
    } finally {
      setPending(false);
    }
  };
  useEffect(() => { void loadPage(1); }, []);

  // Recarga tras mutar. Actor: sistema. Tecnica: evicta y vuelve a la pagina actual (o la primera).
  const reload = (target = current) => {
    evictPages();
    void loadPage(Math.max(1, target));
  };

  // Elimina por id opaco. Actor: ADMINISTRADOR. Tecnica: 403 muestra el modal de permiso.
  const removeWorkshop = async (workshop: WorkshopItem) => {
    try {
      await workshopsApi.remove(workshop.id);
      onNotice({ kind: 'success', title: 'Taller eliminado', message: `El taller ${workshop.workshopName} quedó fuera del registro.` });
      setConfirmWorkshop(null);
      reload();
    } catch (error) {
      const code = error instanceof Error ? error.message : '';
      setConfirmWorkshop(null);
      onNotice(code === 'FORBIDDEN_ROLE'
        ? { kind: 'error', title: 'Sin permiso', message: 'No tienes el rol para eliminar talleres.' }
        : { kind: 'error', title: 'No se pudo eliminar', message: 'Verifica tu sesión de administrador.' });
    }
  };

  const workshops = page?.content ?? [];
  const totalPages = page?.totalPages ?? 0;
  const totalElements = page?.totalElements ?? 0;

  return <section className="rolesSection">
    {canMutate && <button className="primaryButton" onClick={() => { setEditing(null); setShowForm(true); }}><Icon name="wrench" size={18} /> Registrar taller</button>}
    {canMutate && (showForm || editing) && <WorkshopDialog initial={editing ?? undefined} onNotice={onNotice} onClose={() => { setShowForm(false); setEditing(null); }} onSaved={() => { setShowForm(false); setEditing(null); reload(editing ? current : 1); }} />}
    <article className="dataCard">
      <div className="tableHeader"><h3>Talleres registrados ({totalElements})</h3>
        {totalPages > 0 && <p className="hint">Página {current} de {totalPages}</p>}</div>
      <table className="dataTable"><thead><tr><th>Foto</th><th>Nombre del taller</th><th>Correo</th><th>Estatus</th>{canMutate && <th>Acciones</th>}</tr></thead><tbody>
        {workshops.map((workshop) => <tr key={workshop.id}>
          <td>{workshop.photoUrl ? <img className="tablePhoto" src={workshop.photoUrl} alt={`Foto de ${workshop.workshopName}`} /> : <span className="photoEmpty"><Icon name="image" size={18} /></span>}</td>
          <td><strong>{workshop.workshopName}</strong></td>
          <td>{workshop.workshopEmail}</td>
          <td><span className={`statusBadge ${workshop.statusCode === 'ACTIVO' ? 'active' : 'inactive'}`}>{workshop.statusLabel}</span></td>
          {canMutate && <td className="rowActions">
            <button type="button" className="iconAction" title="Editar" aria-label={`Editar ${workshop.workshopName}`} onClick={() => { setEditing(workshop); setShowForm(false); }}><Icon name="eye" size={17} /></button>
            <button type="button" className="iconAction danger" title="Eliminar" aria-label={`Eliminar ${workshop.workshopName}`} onClick={() => setConfirmWorkshop(workshop)}><Icon name="trash" size={17} /></button>
          </td>}
        </tr>)}
      </tbody></table>
      {!workshops.length && !pending && <p className="hint">Aún no hay talleres. Registra el primero con el botón superior.</p>}
      {pending && <p className="hint">Cargando página…</p>}
      <Pager current={current} totalPages={totalPages} label="Paginación de talleres" onPage={(number) => void loadPage(number)} />
      {confirmWorkshop && <ConfirmDialog title="Eliminar taller" target={`el taller ${confirmWorkshop.workshopName}`} confirmLabel="Confirmar" onConfirm={() => void removeWorkshop(confirmWorkshop)} onCancel={() => setConfirmWorkshop(null)} />}
    </article>
  </section>;
}
