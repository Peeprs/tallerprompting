// Actor: RECEPCIONISTA o ADMINISTRADOR gestionan clientes; TRANSPORTISTA solo consulta.
// Administracion de clientes con paginacion validada. Tecnica: pagina base 1 con 10 registros,
// cache-aside de paginas en memoria con eviccion al mutar (skill de cacheo).
import { useEffect, useRef, useState } from 'react';
import { CLIENT_PAGE_SIZE, recordsApi, type ClientItem, type ClientPage } from '../api/recordsApi';
import { workshopsApi, type StatusItem } from '../api/workshopsApi';
import type { Notice } from '../types';
import { isValidPage } from '../utils/validation';
import { ClientDialog } from './ClientDialog';
import { ConfirmDialog } from './ConfirmDialog';
import { Icon } from './Icon';
import { Pager } from './Pager';

export function ClientsSection({ canMutate, onNotice }: { canMutate: boolean; onNotice: (notice: Notice) => void }) {
  const [page, setPage] = useState<ClientPage | null>(null);
  const [current, setCurrent] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<ClientItem | null>(null);
  const [confirmStatus, setConfirmStatus] = useState<{ client: ClientItem; code: 'ACTIVO' | 'BAJA' } | null>(null);
  const [statuses, setStatuses] = useState<StatusItem[]>([]);
  const [pending, setPending] = useState(false);
  const pageCache = useRef(new Map<number, ClientPage>());

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
      const fresh = await recordsApi.listClients(requested, CLIENT_PAGE_SIZE, false);
      pageCache.current.set(requested, fresh);
      setPage(fresh);
      setCurrent(requested);
    } catch {
      onNotice({ kind: 'error', title: 'Sin acceso', message: 'No se pudo cargar la página de clientes.' });
    } finally {
      setPending(false);
    }
  };

  // Carga inicial y catalogo de estatus. Actor: sistema. Tecnica: una lectura por recurso.
  useEffect(() => {
    void loadPage(1);
    workshopsApi.listStatuses()
      .then(setStatuses)
      .catch(() => onNotice({ kind: 'error', title: 'Sin catálogo', message: 'No se pudo cargar el estatus.' }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Recarga tras mutar. Actor: sistema. Tecnica: evicta y vuelve a la pagina actual (o la primera).
  const reload = (target = current) => {
    evictPages();
    void loadPage(Math.max(1, target));
  };

  // Da de baja o reactiva con el catalogo global. Actor: RECEPCIONISTA o ADMINISTRADOR.
  const changeStatus = async (client: ClientItem, code: 'ACTIVO' | 'BAJA') => {
    const statusId = statuses.find((item) => item.code === code)?.id;
    if (!statusId) {
      onNotice({ kind: 'error', title: 'Sin catálogo', message: 'No se encontró el estatus en el catálogo.' });
      return;
    }
    try {
      await recordsApi.changeClientStatus(client.id, statusId);
      onNotice({
        kind: 'success',
        title: code === 'BAJA' ? 'Cliente dado de baja' : 'Cliente reactivado',
        message: `El cliente ${client.name} quedó ${code === 'BAJA' ? 'dado de baja' : 'reactivado'}.`
      });
      setConfirmStatus(null);
      reload();
    } catch {
      setConfirmStatus(null);
      onNotice({ kind: 'error', title: 'No se pudo cambiar el estatus', message: 'Verifica tu sesión e intenta de nuevo.' });
    }
  };

  const clients = page?.content ?? [];
  const totalPages = page?.totalPages ?? 0;
  const totalElements = page?.totalElements ?? 0;

  return <section className="rolesSection">
    {canMutate && <div><button className="primaryButton" onClick={() => { setEditing(null); setShowForm(true); }}><Icon name="people" size={18} /> Registrar cliente</button></div>}
    {canMutate && (showForm || editing) && <ClientDialog initial={editing ?? undefined} onNotice={onNotice} onClose={() => { setShowForm(false); setEditing(null); }} onSaved={() => { setShowForm(false); setEditing(null); reload(editing ? current : 1); }} />}
    <article className="dataCard">
      <div className="tableHeader"><h3>Clientes registrados ({totalElements})</h3>
        {totalPages > 0 && <p className="hint">Página {current} de {totalPages}</p>}</div>
      <table className="dataTable"><thead><tr><th>Nombre del cliente</th><th>Medios de contacto</th><th>Taller registrado</th><th>Estatus</th>{canMutate && <th>Acciones</th>}</tr></thead><tbody>
        {clients.map((client) => {
          const principal = client.contacts.find((contact) => contact.primary) ?? client.contacts[0];
          const rest = client.contacts.filter((contact) => contact !== principal);
          const inactive = client.statusCode !== 'ACTIVO';
          return <tr key={client.id} className={inactive ? 'rowInactive' : undefined}>
            <td><strong>{client.name}</strong></td>
            <td><span className="contactPrincipal">{principal?.value}</span>
              {rest.map((contact, index) => <span key={index} className="contactSecondary">{contact.name ? `${contact.name} · ` : ''}{contact.value}</span>)}
            </td>
            <td>{client.workshopName || 'Sin taller'}</td>
            <td><span className={`statusBadge ${inactive ? 'inactive' : 'active'}`}>{client.statusLabel || client.statusCode}</span></td>
            {canMutate && <td className="rowActions">
              <button type="button" className="iconAction" title="Editar" aria-label={`Editar ${client.name}`} onClick={() => { setEditing(client); setShowForm(false); }}><Icon name="eye" size={17} /></button>
              {inactive
                ? <button type="button" className="iconAction" title="Reactivar" aria-label={`Reactivar ${client.name}`} onClick={() => setConfirmStatus({ client, code: 'ACTIVO' })}><Icon name="check" size={17} /></button>
                : <button type="button" className="iconAction danger" title="Dar de baja" aria-label={`Dar de baja ${client.name}`} onClick={() => setConfirmStatus({ client, code: 'BAJA' })}><Icon name="lock" size={17} /></button>}
            </td>}
          </tr>;
        })}
      </tbody></table>
      {!clients.length && !pending && <p className="hint">Aún no hay clientes. Regístralos con el botón superior.</p>}
      {pending && <p className="hint">Cargando página…</p>}
      <Pager current={current} totalPages={totalPages} label="Paginación de clientes" onPage={(number) => void loadPage(number)} />
      {confirmStatus && <ConfirmDialog
        title={confirmStatus.code === 'BAJA' ? 'Dar de baja al cliente' : 'Reactivar al cliente'}
        target={`${confirmStatus.code === 'BAJA' ? 'el cliente' : 'al cliente'} ${confirmStatus.client.name}`}
        confirmLabel={confirmStatus.code === 'BAJA' ? 'Dar de baja' : 'Reactivar'}
        onConfirm={() => void changeStatus(confirmStatus.client, confirmStatus.code)}
        onCancel={() => setConfirmStatus(null)} />}
    </article>
  </section>;
}
