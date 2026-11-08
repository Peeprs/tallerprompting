import { useState } from 'react';
import { recordsApi } from '../api/recordsApi';
import type { FieldErrors, Notice } from '../types';
import { FormField } from './FormField';
import { Icon } from './Icon';

type Kind = 'client' | 'vehicle';
const clientErrors = (name: string, document: string, email: string): FieldErrors => ({
  ...(name.trim().length >= 3 ? {} : { name: 'Ingresa el nombre completo o razón social.' }),
  ...(/^[A-Z0-9]{10,18}$/i.test(document) ? {} : { document: 'Ingresa una identificación válida, sin espacios.' }),
  ...(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? {} : { email: 'Ingresa un correo válido.' })
});
const vehicleErrors = (plate: string, brand: string, model: string, year: string): FieldErrors => ({
  ...(/^[A-Z0-9-]{5,12}$/i.test(plate) ? {} : { plate: 'Ingresa una placa válida.' }),
  ...(brand.trim() ? {} : { brand: 'Ingresa la marca.' }), ...(model.trim() ? {} : { model: 'Ingresa el modelo.' }),
  ...(/^(19|20)\d{2}$/.test(year) ? {} : { year: 'Ingresa un año entre 1900 y 2099.' })
});

export function RecordDialog({ kind, onClose, onNotice }: { kind: Kind; onClose: () => void; onNotice: (notice: Notice) => void }) {
  const [values, setValues] = useState<Record<string, string>>({}); const [errors, setErrors] = useState<FieldErrors>({}); const [pending, setPending] = useState(false);
  const set = (key: string) => (value: string) => setValues(current => ({ ...current, [key]: value }));
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const next = kind === 'client' ? clientErrors(values.name ?? '', values.document ?? '', values.email ?? '') : vehicleErrors(values.plate ?? '', values.brand ?? '', values.model ?? '', values.year ?? '');
    setErrors(next); if (Object.keys(next).length) { onNotice({ kind: 'error', title: 'Revisa la información', message: 'Hay campos obligatorios o inválidos.' }); return; }
    setPending(true);
    try { await (kind === 'client' ? recordsApi.createClient(values) : recordsApi.createVehicle(values)); onClose(); onNotice({ kind: 'success', title: kind === 'client' ? 'Cliente registrado' : 'Vehículo registrado', message: 'La información se guardó correctamente.' }); }
    catch (error) { onNotice({ kind: 'error', title: error instanceof Error && error.message === 'NETWORK_UNAVAILABLE' ? 'No hay conexión' : 'No fue posible guardar', message: 'Verifica la conexión o intenta de nuevo.' }); }
    finally { setPending(false); }
  };
  const title = kind === 'client' ? 'Registrar cliente' : 'Registrar vehículo';
  return <div className="modalBackdrop"><section className="recordDialog" role="dialog" aria-modal="true" aria-labelledby="recordTitle"><button className="iconButton" onClick={onClose} aria-label="Cerrar formulario"><Icon name="close" /></button><header><p className="eyebrow">Captura segura</p><h2 id="recordTitle">{title}</h2><p>Los campos se validan antes de enviarse al servicio autorizado.</p></header><form noValidate onSubmit={submit}>{kind === 'client' ? <><FormField id="clientName" label="Nombre o razón social" value={values.name ?? ''} onChange={set('name')} error={errors.name} /><FormField id="clientDocument" label="RFC, CURP u otra identificación" value={values.document ?? ''} onChange={set('document')} error={errors.document} /><FormField id="clientEmail" label="Correo de contacto" type="email" value={values.email ?? ''} onChange={set('email')} error={errors.email} /></> : <><FormField id="vehiclePlate" label="Placa" value={values.plate ?? ''} onChange={set('plate')} error={errors.plate} /><div className="twoColumns"><FormField id="vehicleBrand" label="Marca" value={values.brand ?? ''} onChange={set('brand')} error={errors.brand} /><FormField id="vehicleModel" label="Modelo" value={values.model ?? ''} onChange={set('model')} error={errors.model} /></div><FormField id="vehicleYear" label="Año" value={values.year ?? ''} onChange={set('year')} error={errors.year} /></>}<button className="primaryButton fullWidth" disabled={pending}>{pending ? 'Guardando…' : title}</button></form></section></div>;
}
