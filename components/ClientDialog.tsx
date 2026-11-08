// Actor: RECEPCIONISTA o ADMINISTRADOR con sesion y taller activo (UC-CV-01).
// Modal de alta o edicion: principal + N secundarios (Nombre | Telefono) con boton mas,
// historial de trazabilidad y asociacion de vehiculos en edicion. Tecnica: el id nunca cambia.
import { useEffect, useState } from 'react';
import { recordsApi, type ClientHistoryEntry, type ClientItem, type ClientVehicle, type SecondaryContact, type VehicleItem } from '../api/recordsApi';
import { workshopsApi, type WorkshopItem } from '../api/workshopsApi';
import { SELECT_PAGE_SIZE } from '../constants/pagination';
import type { FieldErrors, Notice } from '../types';
import { isValidClientContact, isValidClientDocument, isValidClientName, isValidRelationship, validateSecondary, VEHICLE_RELATIONSHIPS } from '../utils/validation';
import { FormField } from './FormField';
import { Icon } from './Icon';

interface Props {
  initial?: ClientItem;
  onClose: () => void;
  onNotice: (notice: Notice) => void;
  onSaved: () => void;
}

// Parte contactos heredados en principal + secundarios. Actor: sistema. Tecnica: el primario va primero.
function splitContacts(contacts: ClientItem['contacts']): { principal: string; secondaries: SecondaryContact[] } {
  if (!contacts.length) return { principal: '', secondaries: [] };
  const ordered = [...contacts].sort((left, right) => Number(right.primary) - Number(left.primary));
  const [first, ...rest] = ordered;
  return { principal: first.value, secondaries: rest.map((contact) => ({ name: contact.name, phone: contact.value })) };
}

export function ClientDialog({ initial, onClose, onNotice, onSaved }: Props) {
  const isEditing = Boolean(initial);
  const seed = initial ? splitContacts(initial.contacts) : { principal: '', secondaries: [] as SecondaryContact[] };
  const [fullName, setFullName] = useState(initial?.name ?? '');
  const [document, setDocument] = useState(initial?.document ?? '');
  const [principal, setPrincipal] = useState(seed.principal);
  const [secondaries, setSecondaries] = useState<SecondaryContact[]>(seed.secondaries);
  const [workshops, setWorkshops] = useState<WorkshopItem[]>([]);
  const [workshopId, setWorkshopId] = useState(initial?.workshopId ?? '');
  const [vehicles, setVehicles] = useState<VehicleItem[]>([]);
  const [linked, setLinked] = useState<ClientVehicle[]>([]);
  const [history, setHistory] = useState<ClientHistoryEntry[]>([]);
  const [linkVehicleId, setLinkVehicleId] = useState('');
  const [linkRelationship, setLinkRelationship] = useState<string>('OWNER');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [pending, setPending] = useState(false);
  const title = isEditing ? 'Editar cliente' : 'Registrar cliente';

  // Carga talleres activos, y en edicion historial + vehiculos. Actor: sistema. Tecnica: una lectura por recurso.
  useEffect(() => {
    let alive = true;
    workshopsApi.list(1, SELECT_PAGE_SIZE, true)
      .then((page) => { if (alive) setWorkshops(page.content); })
      .catch((error) => {
        if (!alive) return;
        const code = error instanceof Error ? error.message : '';
        onNotice(code === 'NETWORK_UNAVAILABLE' || code === 'REQUEST_TIMEOUT'
          ? { kind: 'error', title: 'Servidor no disponible', message: 'Verifica que el backend esté corriendo e intenta de nuevo.' }
          : { kind: 'error', title: 'Sin talleres', message: 'No se pudieron cargar los talleres activos.' });
      });
    if (initial) {
      recordsApi.listVehicles(1, SELECT_PAGE_SIZE)
        .then((page) => { if (alive) setVehicles(page.content); })
        .catch(() => { if (alive) onNotice({ kind: 'error', title: 'Sin vehículos', message: 'No se pudo cargar el catálogo de vehículos.' }); });
      reloadLinked();
      recordsApi.listClientHistory(initial.id)
        .then((items) => { if (alive) setHistory(items); })
        .catch(() => { if (alive) onNotice({ kind: 'error', title: 'Sin historial', message: 'No se pudo cargar la trazabilidad.' }); });
    }
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Recarga los vehiculos asociados. Actor: sistema. Tecnica: aparecen tras asociar.
  const reloadLinked = () => {
    if (!initial) return;
    recordsApi.listClientVehicles(initial.id)
      .then(setLinked)
      .catch(() => onNotice({ kind: 'error', title: 'Sin vehículos', message: 'No se pudieron cargar los vehículos asociados.' }));
  };

  // Cambia un secundario por indice. Actor: sistema. Tecnica: copia el arreglo, sin mutar estado.
  const changeSecondary = (index: number, field: keyof SecondaryContact, value: string) =>
    setSecondaries((current) => current.map((item, position) => (position === index ? { ...item, [field]: value } : item)));
  // Agrega otro secundario Nombre | Telefono. Actor: RECEPCIONISTA con boton mas. Tecnica: N dinamicos.
  const addSecondary = () => setSecondaries((current) => [...current, { name: '', phone: '' }]);
  // Quita un secundario. Actor: sistema. Tecnica: la lista puede quedar vacia.
  const removeSecondary = (index: number) =>
    setSecondaries((current) => current.filter((_, position) => position !== index));

  // Valida principal + secundarios con regex. Actor: sistema. Tecnica: espejo del backend.
  const validateForm = (): FieldErrors => {
    const next: FieldErrors = {};
    if (!isValidClientName(fullName)) next.fullName = 'Usa de 3 a 80 caracteres: letras, acentos, espacios, punto, apóstrofo o guion.';
    if (document.trim() && !isValidClientDocument(document)) next.document = 'Regex: ^[A-Z0-9]{10,18}$ sin espacios (RFC, CURP u otra clave).';
    if (!principal.trim()) next.principal = 'Agrega el medio de contacto principal.';
    else if (!isValidClientContact(principal)) next.principal = 'Usa un correo válido o un teléfono de 7 a 20 dígitos.';
    secondaries.forEach((item, index) => {
      const row = validateSecondary(item.name, item.phone);
      if (row.name) next[`secondaryName-${index}`] = row.name;
      if (row.phone) next[`secondaryPhone-${index}`] = row.phone;
    });
    const phones = secondaries.map((item) => item.phone.trim()).filter(Boolean);
    if (new Set(phones).size !== phones.length) next.secondaries = 'Hay teléfonos secundarios duplicados.';
    if (!workshopId) next.workshopId = 'Elige un taller activo.';
    return next;
  };

  // Confirma, persiste y audita. Actor: RECEPCIONISTA o ADMINISTRADOR. Tecnica: el servidor audita con createdBy.
  const submitClient = async (event: React.FormEvent) => {
    event.preventDefault();
    const nextErrors = validateForm();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      onNotice({ kind: 'error', title: 'Revisa la información', message: 'Hay campos obligatorios o duplicados.' });
      return;
    }
    const body = {
      name: fullName.trim().toLowerCase(),
      document: document.trim() || 'SNIDENTIFICADOR01',
      email: principal.trim().toLowerCase(),
      contacts: [principal.trim().toLowerCase()],
      secondaryContacts: secondaries.map((item) => ({ name: item.name.trim(), phone: item.phone.trim() })),
      workshopId
    };
    setPending(true);
    try {
      if (initial) await recordsApi.updateClient(initial.id, body);
      else await recordsApi.createClient(body);
      onNotice({ kind: 'success', title: initial ? 'Cliente actualizado' : 'Cliente registrado', message: `El cliente ${body.name} quedó ${initial ? 'actualizado' : 'asociado al taller activo'}.` });
      onSaved();
    } catch (error) {
      const code = error instanceof Error ? error.message : '';
      if (code === 'FORBIDDEN_ROLE') onNotice({ kind: 'error', title: 'Sin permiso', message: 'No tienes el rol para registrar clientes.' });
      else if (code === 'ALREADY_EXISTS') onNotice({ kind: 'error', title: 'Cliente duplicado', message: 'Ese documento o contacto ya existe.' });
      else if (code === 'VALIDATION_FAILED') onNotice({ kind: 'error', title: 'Datos rechazados', message: 'El servidor rechazó algún campo. Revisa el formato.' });
      else if (code === 'NOT_AUTHENTICATED') onNotice({ kind: 'error', title: 'Sesión vencida', message: 'Vuelve a iniciar sesión para registrar clientes.' });
      else if (code === 'REQUEST_TIMEOUT') onNotice({ kind: 'error', title: 'Tiempo agotado', message: 'La petición tardó demasiado, intenta de nuevo.' });
      else if (code === 'NETWORK_UNAVAILABLE') onNotice({ kind: 'error', title: 'Servidor no disponible', message: 'Verifica que el backend esté corriendo e intenta de nuevo.' });
      else onNotice({ kind: 'error', title: 'No se pudo guardar', message: 'Error del servidor. Intenta de nuevo y avisa a soporte si persiste.' });
    } finally {
      setPending(false);
    }
  };

  // Asocia un vehiculo al cliente. Actor: RECEPCIONISTA o ADMINISTRADOR. Tecnica: audita VEHICULO_ASOCIADO.
  const submitLink = async () => {
    if (!initial || !linkVehicleId || !isValidRelationship(linkRelationship)) {
      onNotice({ kind: 'error', title: 'Revisa la asociación', message: 'Elige un vehículo y una relación válida.' });
      return;
    }
    try {
      await recordsApi.linkVehicle(initial.id, linkVehicleId, linkRelationship);
      onNotice({ kind: 'success', title: 'Vehículo asociado', message: 'El vínculo quedó registrado en el historial.' });
      setLinkVehicleId('');
      reloadLinked();
    } catch (error) {
      const code = error instanceof Error ? error.message : '';
      onNotice(code === 'ALREADY_EXISTS'
        ? { kind: 'error', title: 'Ya está asociado', message: 'Ese vehículo ya está vinculado al cliente.' }
        : { kind: 'error', title: 'No se pudo asociar', message: 'Verifica tu sesión e intenta de nuevo.' });
    }
  };

  // Desvincula con fecha sin borrar historia. Actor: RECEPCIONISTA o ADMINISTRADOR.
  const submitUnlink = async (association: ClientVehicle) => {
    if (!initial) return;
    try {
      await recordsApi.unlinkVehicle(initial.id, association.associationId);
      onNotice({ kind: 'success', title: 'Vehículo desvinculado', message: `La placa ${association.plate} quedó fuera de la lista.` });
      reloadLinked();
    } catch {
      onNotice({ kind: 'error', title: 'No se pudo desvincular', message: 'Verifica tu sesión e intenta de nuevo.' });
    }
  };

  const relationshipLabel = (value: string) =>
    VEHICLE_RELATIONSHIPS.find((item) => item.value === value)?.label ?? value;

  return <div className="modalBackdrop"><section className="recordDialog wide" role="dialog" aria-modal="true" aria-labelledby="clientTitle">
    <button className="iconButton" onClick={onClose} aria-label="Cerrar formulario"><Icon name="close" /></button>
    <header><p className="eyebrow">Captura segura</p><h2 id="clientTitle">{title}</h2><p>Requiere sesión, rol autorizado y un taller activo. El alta confirma, persiste y audita.</p></header>
    <form noValidate onSubmit={submitClient}>
      <div className="twoColumns">
        <FormField id="clientFullName" label="Nombre completo" value={fullName} onChange={(value) => setFullName(value.slice(0, 80))} error={errors.fullName} hint="Regex: 3 a 80 caracteres, letras, acentos, espacios, punto, apóstrofo o guion." />
        <FormField id="clientDocument" label="Identificación (opcional)" value={document} onChange={(value) => setDocument(value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 18))} error={errors.document} hint="Regex: ^[A-Z0-9]{10,18}$ sin espacios." />
      </div>
      <div><span className="fieldLabel">Contacto principal</span>
        <FormField id="clientPrincipal" label="Correo o teléfono principal" value={principal} onChange={(value) => setPrincipal(value.slice(0, 120))} error={errors.principal} hint="Regex: correo válido o teléfono de 7 a 20 dígitos." /></div>
      <div><span className="fieldLabel">Contactos secundarios / referencia</span>
        {secondaries.map((item, index) => <div className="formRow" key={index}>
          <div style={{ flex: 1 }}><FormField id={`secondaryName-${index}`} label="Nombre completo" value={item.name} onChange={(value) => changeSecondary(index, 'name', value.slice(0, 80))} error={errors[`secondaryName-${index}`]} /></div>
          <div style={{ flex: 1 }}><FormField id={`secondaryPhone-${index}`} label="Teléfono celular" value={item.phone} onChange={(value) => changeSecondary(index, 'phone', value.slice(0, 20))} error={errors[`secondaryPhone-${index}`]} hint="10 dígitos, +52 opcional." /></div>
          <button type="button" className="iconAction danger" title="Quitar secundario" aria-label="Quitar secundario" onClick={() => removeSecondary(index)}><Icon name="close" size={17} /></button>
        </div>)}
        <button type="button" className="iconAction" title="Agregar secundario" aria-label="Agregar secundario" onClick={addSecondary}><Icon name="plus" size={17} /></button>
        {errors.secondaries && <span className="fieldError">{errors.secondaries}</span>}</div>
      <div><label className="fieldLabel" htmlFor="clientWorkshop">Taller activo</label>
        <select id="clientWorkshop" className="selectInput" value={workshopId} onChange={(event) => setWorkshopId(event.target.value)}>
          <option value="">Elige un taller activo…</option>
          {initial?.workshopId && !workshops.some((workshop) => workshop.id === initial.workshopId) && <option value={initial.workshopId}>{initial.workshopName || 'Taller actual'}</option>}
          {workshops.map((workshop) => <option key={workshop.id} value={workshop.id}>{workshop.workshopName} · {workshop.municipality}</option>)}
        </select>
        {errors.workshopId && <span className="fieldError">{errors.workshopId}</span>}
        {!workshops.length && <p className="hint">Sin talleres activos: registra uno primero en la sección Talleres.</p>}</div>
      <button className="primaryButton fullWidth" disabled={pending} style={{ marginTop: 16 }}>{pending ? 'Guardando…' : title}</button>
    </form>
    {isEditing && initial && <>
      <p className="sectionLabel"><Icon name="link" size={17} /> Vehículos asociados</p>
      <div className="formRow">
        <div style={{ flex: 2 }}>
          <label className="fieldLabel" htmlFor="linkVehicle">Vehículo registrado</label>
          <select id="linkVehicle" className="selectInput" value={linkVehicleId} onChange={(event) => setLinkVehicleId(event.target.value)}>
            <option value="">Elige un vehículo…</option>
            {vehicles.map((vehicle) => <option key={vehicle.id} value={vehicle.id}>{vehicle.plate} · {vehicle.brand} {vehicle.model}</option>)}
          </select>
        </div>
        <div style={{ flex: 1 }}>
          <label className="fieldLabel" htmlFor="linkRelationship">Relación</label>
          <select id="linkRelationship" className="selectInput" value={linkRelationship} onChange={(event) => setLinkRelationship(event.target.value)}>
            {VEHICLE_RELATIONSHIPS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
        </div>
        <button type="button" className="primaryButton" onClick={() => void submitLink()}>Asociar</button>
      </div>
      {!linked.length && <p className="hint">Sin vehículos asociados: aparecerán aquí al asociar el primero.</p>}
      {!!linked.length && <ul className="linkList">
        {linked.map((association) => <li key={association.associationId}>
          <span><strong>{association.plate}</strong> · {association.brand} {association.model} ({association.year})</span>
          <span className="linkMeta">{relationshipLabel(association.relationshipType)} · desde {association.startsOn}</span>
          <button type="button" className="textButton" onClick={() => void submitUnlink(association)}>Desvincular</button>
        </li>)}
      </ul>}
      <p className="sectionLabel"><Icon name="history" size={17} /> Historial de trazabilidad</p>
      {!history.length && <p className="hint">Sin movimientos registrados.</p>}
      {!!history.length && <ol className="timeline">
        {history.map((entry) => <li key={entry.id}>
          <span className="timelineAction">{entry.action}</span>
          <span>{entry.detail}</span>
          <span className="timelineMeta">{entry.actorName} · {new Date(entry.createdAt).toLocaleString()}</span>
        </li>)}
      </ol>}
    </>}
  </section></div>;
}
