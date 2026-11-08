// Actor: rol autorizado consulta; ADMINISTRADOR o RECEPCIONISTA edita y elimina.
// Tabla de vehiculos con paginacion validada. Tecnica: pagina base 1 con 10 registros,
// cache-aside de paginas en memoria con eviccion al mutar (skill de cacheo).
import { useEffect, useRef, useState } from 'react';
import { CLIENT_PAGE_SIZE, recordsApi, type ClientItem, type VehicleItem, type VehiclePage } from '../api/recordsApi';
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
  const [associationTarget, setAssociationTarget] = useState<VehicleItem | null>(null);
  const [unlinkTarget, setUnlinkTarget] = useState<VehicleItem | null>(null);
  const [availableClients, setAvailableClients] = useState<ClientItem[]>([]);
  const [associationClientId, setAssociationClientId] = useState('');
  const [associationPending, setAssociationPending] = useState(false);
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

  const openAssociation = async (vehicle: VehicleItem) => {
    setAssociationTarget(vehicle);
    setAssociationClientId('');
    try {
      const firstPage = await recordsApi.listClients(1, 50, true);
      const otherPages = await Promise.all(Array.from({ length: Math.max(0, firstPage.totalPages - 1) }, (_, index) => recordsApi.listClients(index + 2, 50, true)));
      setAvailableClients([...firstPage.content, ...otherPages.flatMap((pageResult) => pageResult.content)]);
    } catch {
      setAssociationTarget(null);
      onNotice({ kind: 'error', title: 'No se pudieron cargar los clientes', message: 'Intenta abrir la asociación nuevamente.' });
    }
  };

  const associateVehicle = async () => {
    if (!associationTarget || !associationClientId) return;
    setAssociationPending(true);
    try {
      await recordsApi.linkVehicle(associationClientId, associationTarget.id, 'OWNER');
      setAssociationTarget(null);
      onNotice({ kind: 'success', title: 'Vehículo asociado', message: `La placa ${associationTarget.plate} quedó vinculada al cliente.` });
      reload();
    } catch {
      onNotice({ kind: 'error', title: 'No se pudo asociar', message: 'Elige un cliente activo e intenta de nuevo.' });
    } finally { setAssociationPending(false); }
  };

  const unlinkVehicle = async (vehicle: VehicleItem) => {
    if (!vehicle.clientId || !vehicle.associationId) return;
    try {
      await recordsApi.unlinkVehicle(vehicle.clientId, vehicle.associationId);
      setUnlinkTarget(null);
      onNotice({ kind: 'success', title: 'Vehículo desvinculado', message: `La placa ${vehicle.plate} quedó disponible.` });
      reload();
    } catch {
      setUnlinkTarget(null);
      onNotice({ kind: 'error', title: 'No se pudo desvincular', message: 'Verifica tu sesión e intenta de nuevo.' });
    }
  };

  const vehicles = page?.content ?? [];
  const totalPages = page?.totalPages ?? 0;
  const totalElements = page?.totalElements ?? 0;

  return <section className="rolesSection">
    {canMutate && <button className="primaryButton" onClick={() => { setEditing(null); setShowForm(true); }}><Icon name="car" size={18} /> Registrar vehículo</button>}
    {canMutate && (showForm || editing) && <VehicleDialog initial={editing ?? undefined} onNotice={onNotice} onClose={() => { setShowForm(false); setEditing(null); }} onSaved={(vehicle) => { setShowForm(false); setEditing(null); reload(editing ? current : 1); if (!editing) void openAssociation(vehicle); }} />}
    <article className="dataCard">
      <div className="tableHeader"><h3>Vehículos registrados ({totalElements})</h3>
        {totalPages > 0 && <p className="hint">Página {current} de {totalPages}</p>}</div>
      <table className="dataTable"><thead><tr><th>Placa</th><th>VIN</th><th>Marca y modelo</th><th>Año</th><th>Kilometraje</th><th>Fotos</th><th>Cliente</th>{canMutate && <th>Acciones</th>}</tr></thead><tbody>
        {vehicles.map((vehicle) => <tr key={vehicle.id}><td><strong>{vehicle.plate}</strong></td><td>{vehicle.vin}</td><td>{vehicle.brand} {vehicle.model}</td><td>{vehicle.year}</td><td>{vehicle.mileageKm == null ? 'Sin dato' : `${vehicle.mileageKm.toLocaleString()} km`}</td><td>{vehicle.photoCount}</td><td><span className={`statusBadge ${vehicle.clientId ? 'assigned' : 'available'}`}>{vehicle.clientName ?? 'Disponible'}</span></td>{canMutate && <td className="rowActions"><button type="button" className="iconAction" title="Editar" aria-label={`Editar ${vehicle.plate}`} onClick={() => { setEditing(vehicle); setShowForm(false); }}><Icon name="eye" size={17} /></button><button type="button" className={vehicle.clientId ? 'textButton' : 'primaryButton'} onClick={() => vehicle.clientId ? setUnlinkTarget(vehicle) : void openAssociation(vehicle)}>{vehicle.clientId ? 'Desvincular' : 'Asociar'}</button><button type="button" className="iconAction danger" title="Eliminar" aria-label={`Eliminar ${vehicle.plate}`} onClick={() => setConfirmVehicle(vehicle)}><Icon name="close" size={17} /></button></td>}</tr>)}
      </tbody></table>
      {!vehicles.length && !pending && <p className="hint">Aún no hay vehículos. Regístralos con el botón superior.</p>}
      {pending && <p className="hint">Cargando página…</p>}
      <Pager current={current} totalPages={totalPages} label="Paginación de vehículos" onPage={(number) => void loadPage(number)} />
      {confirmVehicle && <ConfirmDialog title="Eliminar vehículo" target={`el vehículo con placa ${confirmVehicle.plate}`} confirmLabel="Confirmar" onConfirm={() => void removeVehicle(confirmVehicle)} onCancel={() => setConfirmVehicle(null)} />}
      {unlinkTarget && <ConfirmDialog title="Desvincular vehículo" target={`la placa ${unlinkTarget.plate} del cliente ${unlinkTarget.clientName ?? ''}`} confirmLabel="Desvincular" onConfirm={() => void unlinkVehicle(unlinkTarget)} onCancel={() => setUnlinkTarget(null)} />}
    </article>
    {associationTarget && <div className="modalBackdrop"><section className="recordDialog" role="dialog" aria-modal="true" aria-labelledby="associateVehicleTitle"><button className="iconButton" type="button" aria-label="Cerrar asociación" onClick={() => setAssociationTarget(null)}><Icon name="close" /></button><header><p className="eyebrow">Asociación</p><h2 id="associateVehicleTitle">Asignar vehículo</h2><p>Elige un cliente activo para la placa {associationTarget.plate}.</p></header><label className="fieldLabel" htmlFor="vehicleClientSelect">Cliente</label><select id="vehicleClientSelect" className="selectInput" value={associationClientId} onChange={(event) => setAssociationClientId(event.target.value)}><option value="">Elige un cliente…</option>{availableClients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}</select>{!availableClients.length && <p className="hint">No hay clientes activos disponibles.</p>}<button type="button" className="primaryButton fullWidth" disabled={!associationClientId || associationPending} onClick={() => void associateVehicle()}>{associationPending ? 'Asociando…' : 'Confirmar asociación'}</button></section></div>}
  </section>;
}
