// Actor: rol autorizado consulta; ADMINISTRADOR o RECEPCIONISTA edita y elimina.
// Tabla de vehiculos con paginacion validada. Tecnica: pagina base 1 con 10 registros,
// cache-aside de paginas en memoria con eviccion al mutar (skill de cacheo).
import { useEffect, useRef, useState } from 'react';
import { CLIENT_PAGE_SIZE, recordsApi, type VehicleItem, type VehiclePage } from '../api/recordsApi';
import type { Notice } from '../types';
import { isValidPage } from '../utils/validation';
import { ConfirmDialog } from './ConfirmDialog';
import { Icon } from './Icon';
import { Pager } from './Pager';
import { VehicleDialog } from './VehicleDialog';

export function VehiclesSection({ canMutate, onNotice }: { canMutate: boolean; onNotice: (notice: Notice) => void }) {
  const [page, setPage] = useState<VehiclePage | null>(null);
  const [current, setCurrent] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<VehicleItem | null>(null);
  const [confirmVehicle, setConfirmVehicle] = useState<VehicleItem | null>(null);
  const [pending, setPending] = useState(false);
  const pageCache = useRef(new Map<number, VehiclePage>());

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
      const fresh = await recordsApi.listVehicles(requested, CLIENT_PAGE_SIZE);
      pageCache.current.set(requested, fresh);
      setPage(fresh);
      setCurrent(requested);
    } catch {
      onNotice({ kind: 'error', title: 'Sin acceso', message: 'No se pudo cargar la página de vehículos.' });
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

  // Elimina por id opaco. Actor: ADMINISTRADOR o RECEPCIONISTA. Tecnica: refresca al instante.
  const removeVehicle = async (vehicle: VehicleItem) => {
    try {
      await recordsApi.removeVehicle(vehicle.id);
      onNotice({ kind: 'success', title: 'Vehículo eliminado', message: `La placa ${vehicle.plate} quedó fuera del registro.` });
      setConfirmVehicle(null);
      reload();
    } catch {
      setConfirmVehicle(null);
      onNotice({ kind: 'error', title: 'No se pudo eliminar', message: 'Verifica tu sesión de administrador o recepción.' });
    }
  };

  const vehicles = page?.content ?? [];
  const totalPages = page?.totalPages ?? 0;
  const totalElements = page?.totalElements ?? 0;

  return <section className="rolesSection">
    {canMutate && <button className="primaryButton" onClick={() => { setEditing(null); setShowForm(true); }}><Icon name="car" size={18} /> Registrar vehículo</button>}
    {canMutate && (showForm || editing) && <VehicleDialog initial={editing ?? undefined} onNotice={onNotice} onClose={() => { setShowForm(false); setEditing(null); }} onSaved={() => { setShowForm(false); setEditing(null); reload(editing ? current : 1); }} />}
    <article className="dataCard">
      <div className="tableHeader"><h3>Vehículos registrados ({totalElements})</h3>
        {totalPages > 0 && <p className="hint">Página {current} de {totalPages}</p>}</div>
      <table className="dataTable"><thead><tr><th>Placa</th><th>Marca</th><th>Modelo</th><th>Año</th>{canMutate && <th>Acciones</th>}</tr></thead><tbody>
        {vehicles.map((vehicle) => <tr key={vehicle.id}><td><strong>{vehicle.plate}</strong></td><td>{vehicle.brand}</td><td>{vehicle.model}</td><td>{vehicle.year}</td>{canMutate && <td className="rowActions"><button type="button" className="iconAction" title="Editar" aria-label={`Editar ${vehicle.plate}`} onClick={() => { setEditing(vehicle); setShowForm(false); }}><Icon name="eye" size={17} /></button><button type="button" className="iconAction danger" title="Eliminar" aria-label={`Eliminar ${vehicle.plate}`} onClick={() => setConfirmVehicle(vehicle)}><Icon name="close" size={17} /></button></td>}</tr>)}
      </tbody></table>
      {!vehicles.length && !pending && <p className="hint">Aún no hay vehículos. Regístralos con el botón superior.</p>}
      {pending && <p className="hint">Cargando página…</p>}
      <Pager current={current} totalPages={totalPages} label="Paginación de vehículos" onPage={(number) => void loadPage(number)} />
      {confirmVehicle && <ConfirmDialog title="Eliminar vehículo" target={`el vehículo con placa ${confirmVehicle.plate}`} confirmLabel="Confirmar" onConfirm={() => void removeVehicle(confirmVehicle)} onCancel={() => setConfirmVehicle(null)} />}
    </article>
  </section>;
}
