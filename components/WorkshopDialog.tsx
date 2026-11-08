// Actor: ADMINISTRADOR captura o edita taller; el estatus solo aparece al editar.
// Modal de taller con foto DragAndDrop y direccion por CP. Tecnica: Postali + dropdowns buscables para captura manual.
import { useEffect, useRef, useState } from 'react';
import { lookupPostalCode } from '../api/sepomexApi';
import { workshopsApi, type StatusItem, type WorkshopItem } from '../api/workshopsApi';
import { MEXICO_STATES } from '../constants/mexicoStates';
import type { FieldErrors, Notice } from '../types';
import { validateWorkshop, validateWorkshopPhoto } from '../utils/validation';
import { FormField } from './FormField';
import { Icon } from './Icon';
import { SearchableSelect } from './SearchableSelect';

interface Props {
  initial?: WorkshopItem;
  onClose: () => void;
  onNotice: (notice: Notice) => void;
  onSaved: () => void;
}

// Lee el estatus actual como id de BD. Actor: sistema. Tecnica: compara por codigo contra el catalogo traido.
function resolveStatusId(statuses: StatusItem[], initial: WorkshopItem | undefined): string {
  if (!initial) return '';
  return statuses.find((item) => item.code === initial.statusCode)?.id ?? '';
}

export function WorkshopDialog({ initial, onClose, onNotice, onSaved }: Props) {
  const isEditing = Boolean(initial);
  const [workshopName, setWorkshopName] = useState(initial?.workshopName ?? '');
  const [rfc, setRfc] = useState('');
  const [workshopEmail, setWorkshopEmail] = useState(initial?.workshopEmail ?? '');
  const [street, setStreet] = useState(initial?.street ?? '');
  const [streetNumber, setStreetNumber] = useState(initial?.streetNumber ?? '');
  const [suburb, setSuburb] = useState(initial?.suburb ?? '');
  const [postalCode, setPostalCode] = useState(initial?.postalCode ?? '');
  const [state, setState] = useState(initial?.state ?? '');
  const [municipality, setMunicipality] = useState(initial?.municipality ?? '');
  const [statuses, setStatuses] = useState<StatusItem[]>([]);
  const [statusId, setStatusId] = useState('');
  const [suburbOptions, setSuburbOptions] = useState<string[]>([]);
  const [municipalityOptions, setMunicipalityOptions] = useState<string[]>([]);
  const [lookupStatus, setLookupStatus] = useState<'idle' | 'ok' | 'error'>('idle');
  const [lookupMessage, setLookupMessage] = useState('');
  const lastSearched = useRef('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(initial?.photoUrl ?? null);
  const [removePhoto, setRemovePhoto] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [lookingUp, setLookingUp] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const title = isEditing ? 'Editar taller' : 'Registrar taller';

  // Carga el catalogo global de estatus desde BD. Actor: sistema. Tecnica: el dropdown solo usa lo traido.
  useEffect(() => {
    let alive = true;
    workshopsApi.listStatuses()
      .then((items) => { if (alive) { setStatuses(items); setStatusId(resolveStatusId(items, initial)); } })
      .catch((error) => {
        if (!alive) return;
        const code = error instanceof Error ? error.message : '';
        onNotice(code === 'NETWORK_UNAVAILABLE' || code === 'REQUEST_TIMEOUT'
          ? { kind: 'error', title: 'Servidor no disponible', message: 'Verifica que el backend esté corriendo e intenta de nuevo.' }
          : { kind: 'error', title: 'Sin catálogo', message: 'No se pudo cargar el estatus desde la base de datos.' });
      });
    return () => { alive = false; };
  }, [initial, onNotice]);

  // Libera el object URL del preview. Actor: sistema. Tecnica: evita fugas de memoria.
  useEffect(() => () => { if (photoPreview && photoPreview.startsWith('blob:')) URL.revokeObjectURL(photoPreview); }, [photoPreview]);

  // RFC en mayusculas sin espacios. Actor: sistema. Tecnica: normaliza igual que el backend.
  const changeRfc = (value: string) => setRfc(value.toUpperCase().replace(/[\s-]/g, '').slice(0, 13));
  // CP solo digitos. Actor: sistema. Tecnica: el autocompletado va con debounce + boton Buscar.
  const changePostalCode = (value: string) => {
    setPostalCode(value.replace(/\D/g, '').slice(0, 5));
  };

  // Autocompleta estado, municipio y colonias por CP con debounce. Actor: ADMINISTRADOR.
  // Tecnica: Postali con cache; no borra lo manual si la API viene vacia; boton Buscar reintenta.
  const fetchAddress = async (code: string, manual = false) => {
    if (!/^\d{5}$/.test(code)) {
      if (manual) onNotice({ kind: 'error', title: 'Código incompleto', message: 'Escribe los 5 dígitos antes de buscar.' });
      return;
    }
    if (!manual && lastSearched.current === code) return;
    lastSearched.current = code;
    setLookingUp(true);
    try {
      const found = await lookupPostalCode(code);
      if (!found) {
        setLookupStatus('error');
        setLookupMessage('Sin cobertura para ese código: captúralo manualmente.');
        onNotice({ kind: 'error', title: 'Sin cobertura', message: 'Postali no devolvió ese código postal. Puedes capturarlo a mano.' });
        return;
      }
      if (found.state) setState(found.state);
      if (found.municipality) {
        setMunicipality(found.municipality);
        setMunicipalityOptions((current) => [...new Set([...current, found.municipality])]);
      }
      setSuburbOptions((current) => [...new Set([...current, ...found.suburbs])]);
      if (!suburb.trim() && found.suburbs.length === 1) setSuburb(found.suburbs[0]);
      setLookupStatus('ok');
      setLookupMessage(`Datos de ${found.source}: ${found.suburbs.length} colonia(s).`);
      onNotice({ kind: 'info', title: 'Dirección localizada', message: `Datos de ${found.source} para el código ${code}.` });
    } catch {
      setLookupStatus('error');
      setLookupMessage('Sin conexión: intenta de nuevo o captura a mano.');
      onNotice({ kind: 'error', title: 'No hay conexión', message: 'No se pudo consultar el código postal.' });
    } finally {
      setLookingUp(false);
    }
  };

  // Dispara la busqueda 600 ms despues de completar 5 digitos. Actor: sistema. Tecnica: evita una peticion por tecla.
  useEffect(() => {
    if (postalCode.length !== 5 || lookingUp) return;
    const timer = window.setTimeout(() => { void fetchAddress(postalCode); }, 600);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postalCode]);

  // Siembra los combos con los valores iniciales (edicion). Actor: sistema. Tecnica: lo manual tambien es opcion.
  useEffect(() => {
    if (initial?.suburb) setSuburbOptions((current) => [...new Set([...current, initial.suburb])]);
    if (initial?.municipality) setMunicipalityOptions((current) => [...new Set([...current, initial.municipality])]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Valida y guarda la foto. Actor: sistema. Tecnica: 15 MB y extensiones png, jpg, jpeg o webp.
  const takePhoto = (file: File | undefined) => {
    if (!file) return;
    const message = validateWorkshopPhoto(file);
    if (message) { setPhotoError(message); return; }
    setPhotoError(null);
    setPhotoFile(file);
    setRemovePhoto(false);
    setPhotoPreview(URL.createObjectURL(file));
  };

  // Guarda o actualiza. Actor: ADMINISTRADOR. Tecnica: alta sin estatus (servidor asigna ACTIVO), edicion con statusId de BD.
  const submitWorkshop = async (event: React.FormEvent) => {
    event.preventDefault();
    const values = { workshopName, rfc, workshopEmail, street, streetNumber, suburb, postalCode, state, municipality, statusId };
    const nextErrors = validateWorkshop(values, isEditing);
    setErrors(nextErrors);
    if (photoError || Object.keys(nextErrors).length) {
      onNotice({ kind: 'error', title: 'Revisa la información', message: 'Hay campos obligatorios o inválidos.' });
      return;
    }
    const body = {
      workshopName: workshopName.trim(),
      rfc: rfc.trim().toUpperCase(),
      workshopEmail: workshopEmail.trim().toLowerCase(),
      street: street.trim().toLowerCase(),
      streetNumber: streetNumber.trim(),
      suburb: suburb.trim().toLowerCase(),
      postalCode: postalCode.trim(),
      state: state.trim().toLowerCase(),
      municipality: municipality.trim().toLowerCase(),
      ...(isEditing ? { statusId } : {})
    };
    setPending(true);
    try {
      if (initial) await workshopsApi.update(initial.id, body, photoFile, removePhoto);
      else await workshopsApi.create(body, photoFile);
      onNotice({ kind: 'success', title: initial ? 'Taller actualizado' : 'Taller registrado', message: `El taller ${body.workshopName} quedó guardado.` });
      onSaved();
    } catch (error) {
      const code = error instanceof Error ? error.message : '';
      if (code === 'FORBIDDEN_ROLE') onNotice({ kind: 'error', title: 'Sin permiso', message: 'No tienes el rol para modificar talleres.' });
      else if (code === 'ALREADY_EXISTS') onNotice({ kind: 'error', title: 'Taller duplicado', message: 'Ese RFC o correo ya está registrado.' });
      else if (code === 'VALIDATION_FAILED') onNotice({ kind: 'error', title: 'Datos rechazados', message: 'El servidor rechazó algún campo (RFC, correo o dirección). Revisa el formato.' });
      else if (code === 'NOT_AUTHENTICATED') onNotice({ kind: 'error', title: 'Sesión vencida', message: 'Vuelve a iniciar sesión para registrar talleres.' });
      else if (code === 'UNSUPPORTED_FILE') onNotice({ kind: 'error', title: 'Foto no válida', message: 'Usa una foto png, jpg, jpeg o webp.' });
      else if (code === 'FILE_TOO_LARGE') onNotice({ kind: 'error', title: 'Foto muy pesada', message: 'La foto supera los 15 MB permitidos.' });
      else if (code === 'REQUEST_TIMEOUT') onNotice({ kind: 'error', title: 'Tiempo agotado', message: 'La petición tardó demasiado, intenta de nuevo.' });
      else if (code === 'NETWORK_UNAVAILABLE') onNotice({ kind: 'error', title: 'Servidor no disponible', message: 'Verifica que el backend esté corriendo e intenta de nuevo.' });
      else onNotice({ kind: 'error', title: 'No se pudo registrar el taller', message: 'Error del servidor. Intenta de nuevo y avisa a soporte si persiste.' });
    } finally {
      setPending(false);
    }
  };

  return <div className="modalBackdrop"><section className="recordDialog wide" role="dialog" aria-modal="true" aria-labelledby="workshopTitle">
    <button className="iconButton" onClick={onClose} aria-label="Cerrar formulario"><Icon name="close" /></button>
    <header><p className="eyebrow">Datos del taller</p><h2 id="workshopTitle">{title}</h2><p>Completa los datos del taller y su dirección.</p></header>
    <form noValidate onSubmit={submitWorkshop}>
      <FormField id={initial ? `workshopName-${initial.id}` : 'workshopName'} label="Nombre del taller" value={workshopName} onChange={(value) => setWorkshopName(value.slice(0, 80))} error={errors.workshopName} hint="De 3 a 80 caracteres; puedes usar letras, números, espacios, &, punto y guion." />
      <div className="twoColumns">
        <FormField id={initial ? `workshopRfc-${initial.id}` : 'workshopRfc'} label="RFC del taller" value={rfc} onChange={changeRfc} error={errors.rfc} hint="Escríbelo en mayúsculas y sin espacios ni guiones." />
        <FormField id={initial ? `workshopEmail-${initial.id}` : 'workshopEmail'} label="Correo del taller" type="email" value={workshopEmail} onChange={(value) => setWorkshopEmail(value.slice(0, 120))} error={errors.workshopEmail} hint="Ejemplo: contacto@taller.com." />
      </div>
      <div>
        <span className="fieldLabel">Foto del taller</span>
        <div className={`dropzone${dragging ? ' dragging' : ''}${photoError ? ' hasError' : ''}`}
          role="button" tabIndex={0} aria-label="Arrastra la foto o elige un archivo"
          onClick={() => fileInput.current?.click()}
          onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') fileInput.current?.click(); }}
          onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => { event.preventDefault(); setDragging(false); takePhoto(event.dataTransfer.files?.[0]); }}>
          {photoPreview && !removePhoto
            ? <>
              <img className="dropzoneImage" src={photoPreview} alt="Foto del taller" />
              <strong>Arrastra otra foto para reemplazarla o elige un archivo</strong>
              <span>PNG, JPG, JPEG o WEBP hasta 15 MB.</span>
              <button type="button" className="textButton" onClick={(event) => { event.stopPropagation(); setPhotoFile(null); setRemovePhoto(true); setPhotoPreview(null); }}>Quitar foto</button>
            </>
            : <>
              <Icon name="image" size={30} />
              <strong>Arrastra la foto aquí o elige un archivo</strong>
              <span>PNG, JPG, JPEG o WEBP hasta 15 MB.</span>
            </>}
          <input ref={fileInput} type="file" accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp" hidden onChange={(event) => takePhoto(event.target.files?.[0])} />
        </div>
        {photoError && <span className="fieldError">{photoError}</span>}
      </div>
      <p className="sectionLabel"><Icon name="pin" size={17} /> Dirección completa</p>
      <div className="twoColumns">
        <SearchableSelect id={initial ? `workshopStreet-${initial.id}` : 'workshopStreet'} label="Calle" value={street} options={[]} onChange={(value) => setStreet(value.slice(0, 80))} error={errors.street} placeholder="Escribe la calle…" hint="Incluye el nombre de la calle." />
        <FormField id={initial ? `workshopNumber-${initial.id}` : 'workshopNumber'} label="Número" value={streetNumber} onChange={(value) => setStreetNumber(value.slice(0, 10))} error={errors.streetNumber} hint="Ejemplo: 123, 45-A o S/N." />
      </div>
      <div className="twoColumns">
        <div>
          <FormField id={initial ? `workshopPostal-${initial.id}` : 'workshopPostal'} label="Código postal" value={postalCode} onChange={changePostalCode} error={errors.postalCode} hint={lookingUp ? 'Buscando dirección…' : 'Ingresa los 5 dígitos para buscar la dirección.'} />
          <div className="cpSearchRow">
            <button type="button" className="iconAction" disabled={lookingUp || postalCode.length !== 5} title="Buscar por código postal" aria-label="Buscar por código postal" onClick={() => void fetchAddress(postalCode, true)}><Icon name="pin" size={17} /></button>
            {lookupStatus !== 'idle' && <span className={`lookupStatus ${lookupStatus}`}>{lookingUp ? 'Buscando…' : lookupMessage}</span>}
          </div>
        </div>
        <SearchableSelect id={initial ? `workshopSuburb-${initial.id}` : 'workshopSuburb'} label="Colonia" value={suburb} options={suburbOptions} onChange={(value) => setSuburb(value.slice(0, 80))} error={errors.suburb} placeholder="Escribe o elige la colonia…" hint={suburbOptions.length ? `${suburbOptions.length} opciones encontradas para el código postal.` : 'Si no aparece, escribe la colonia.'} />
      </div>
      <div className="twoColumns">
        <SearchableSelect id={initial ? `workshopState-${initial.id}` : 'workshopState'} label="Estado" value={state} options={MEXICO_STATES} onChange={(value) => setState(value.slice(0, 60))} error={errors.state} placeholder="Escribe o elige el estado…" hint="Elige una opción de la lista o escríbela." />
        <SearchableSelect id={initial ? `workshopMunicipality-${initial.id}` : 'workshopMunicipality'} label="Municipio" value={municipality} options={municipalityOptions} onChange={(value) => setMunicipality(value.slice(0, 60))} error={errors.municipality} placeholder="Escribe o elige el municipio…" hint="Elige una opción de la lista o escríbela." />
      </div>
      {isEditing && <div><label className="fieldLabel" htmlFor={initial ? `workshopStatus-${initial?.id}` : 'workshopStatus'}>Estatus</label>
        <select id={initial ? `workshopStatus-${initial?.id}` : 'workshopStatus'} className="selectInput" value={statusId} onChange={(event) => setStatusId(event.target.value)}>
          <option value="">Elige un estatus…</option>
          {statuses.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
        </select>
        {errors.statusId && <span className="fieldError">{errors.statusId}</span>}
        <p className="hint">El catálogo viene de la base de datos y se reutiliza en futuros módulos.</p></div>}
      <button className="primaryButton fullWidth" disabled={pending}>{pending ? 'Guardando…' : title}</button>
    </form>
  </section></div>;
}
