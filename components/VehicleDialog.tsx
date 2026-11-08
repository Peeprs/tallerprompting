import { useState } from 'react';
import { recordsApi, type VehicleItem } from '../api/recordsApi';
import { vehicleBrands, vehicleCatalog } from '../constants/vehicleCatalog';
import type { FieldErrors, Notice } from '../types';
import { formatPlate, isValidYear, validateVehicle } from '../utils/validation';
import { FormField } from './FormField';
import { Icon } from './Icon';

// Actor: ADMINISTRADOR o RECEPCIONISTA registra o edita vehiculos.
// Modal identico al de cliente. Tecnica: misma estructura modalBackdrop/recordDialog y tamano.
export function VehicleDialog({ initial, onClose, onNotice, onSaved }: { initial?: VehicleItem; onNotice: (notice: Notice) => void; onClose: () => void; onSaved: () => void }) {
  const [plate, setPlate] = useState(initial?.plate ?? '');
  const [brand, setBrand] = useState(initial?.brand ?? '');
  const [model, setModel] = useState(initial?.model ?? '');
  const [year, setYear] = useState(initial ? String(initial.year) : '');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [pending, setPending] = useState(false);
  const models = brand ? vehicleCatalog[brand] ?? [] : [];
  const title = initial ? 'Editar vehículo' : 'Registrar vehículo';
  // Cambia la marca y limpia el modelo. Tecnica: evita combinaciones fuera de catalogo.
  const changeBrand = (value: string) => { setBrand(value); setModel(''); };
  // Solo digitos en el ano. Actor: sistema. Tecnica: filtra letras antes de validar rango.
  const changeYear = (value: string) => { if (/^\d{0,4}$/.test(value)) setYear(value); };
  // Guarda o actualiza. Tecnica: la tabla se recarga al instante tras guardar.
  const submitVehicle = async (event: React.FormEvent) => {
    event.preventDefault();
    const nextErrors = validateVehicle(plate, brand, model, year);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) { onNotice({ kind: 'error', title: 'Revisa los datos', message: 'Placa, marca, modelo y año deben ser válidos.' }); return; }
    const normalizedYear = Number(year);
    if (!isValidYear(String(normalizedYear))) { onNotice({ kind: 'error', title: 'Año no válido', message: 'Ingresa un año numérico entre 1900 y 2099.' }); return; }
    const body = { plate: plate.trim().toUpperCase(), brand: brand.trim(), model: model.trim(), year: normalizedYear };
    setPending(true);
    try {
      if (initial) await recordsApi.updateVehicle(initial.id, body);
      else await recordsApi.createVehicle(body);
      onNotice({ kind: 'success', title: initial ? 'Vehículo actualizado' : 'Vehículo registrado', message: `La placa ${body.plate} quedó guardada.` });
      onSaved();
    } catch (error) {
      const code = error instanceof Error ? error.message : '';
      onNotice({ kind: 'error', title: code === 'VEHICLE_ALREADY_EXISTS' ? 'Placa duplicada' : 'No se pudo guardar', message: code === 'VEHICLE_ALREADY_EXISTS' ? 'Esa placa ya está registrada.' : 'Verifica tu sesión y los datos.' });
    } finally { setPending(false); }
  };
  return <div className="modalBackdrop"><section className="recordDialog" role="dialog" aria-modal="true" aria-labelledby="vehicleTitle"><button className="iconButton" onClick={onClose} aria-label="Cerrar formulario"><Icon name="close" /></button><header><p className="eyebrow">Captura segura</p><h2 id="vehicleTitle">{title}</h2><p>Los campos se validan antes de enviarse al servicio autorizado.</p></header>
    <form noValidate onSubmit={submitVehicle}>
      <FormField id={initial ? `editPlate-${initial.id}` : 'vehiclePlate'} label="Placa" value={plate} onChange={(value) => setPlate(formatPlate(value))} error={errors.plate} hint="Formato ABC-123 en mayúsculas con guion." />
      <div className="twoColumns">
        <div><label className="fieldLabel" htmlFor={initial ? `editBrand-${initial.id}` : 'vehicleBrand'}>Marca</label><select id={initial ? `editBrand-${initial.id}` : 'vehicleBrand'} className="selectInput" value={brand} onChange={(event) => changeBrand(event.target.value)}><option value="">Elige una marca…</option>{vehicleBrands.map((name) => <option key={name} value={name}>{name}</option>)}</select>{errors.brand && <span className="fieldError">{errors.brand}</span>}</div>
        <div><label className="fieldLabel" htmlFor={initial ? `editModel-${initial.id}` : 'vehicleModel'}>Modelo</label><select id={initial ? `editModel-${initial.id}` : 'vehicleModel'} className="selectInput" value={model} disabled={!brand} onChange={(event) => setModel(event.target.value)}><option value="">{brand ? 'Elige un modelo…' : 'Primero elige la marca…'}</option>{models.map((name) => <option key={name} value={name}>{name}</option>)}</select>{errors.model && <span className="fieldError">{errors.model}</span>}</div>
      </div>
      <FormField id={initial ? `editYear-${initial.id}` : 'vehicleYear'} label="Año" value={year} onChange={changeYear} error={errors.year} hint="Solo números, de 1900 a 2099." />
      <button className="primaryButton fullWidth" disabled={pending}>{pending ? 'Guardando…' : title}</button>
    </form></section></div>;
}
