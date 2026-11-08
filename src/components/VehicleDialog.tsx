import { useEffect, useState } from 'react';
import { recordsApi, type VehicleItem } from '../api/recordsApi';
import { vehicleBrands, vehicleCatalog } from '../constants/vehicleCatalog';
import { MAX_VEHICLE_PHOTOS, MAX_VEHICLE_PHOTO_BYTES, VEHICLE_PHOTO_TYPES, VEHICLE_VIN_LENGTH } from '../constants/vehicle';
import type { FieldErrors, Notice } from '../types';
import { formatPlate, isValidVin, validateVehicle } from '../utils/validation';
import { FormField } from './FormField';
import { Icon } from './Icon';

// Actor: ADMINISTRADOR o RECEPCIONISTA registra vehículos. Técnica: tres fotos como máximo, 15 MB cada una.
export function VehicleDialog({ initial, onClose, onNotice, onSaved }: { initial?: VehicleItem; onNotice: (notice: Notice) => void; onClose: () => void; onSaved: (vehicle: VehicleItem) => void }) {
  const [plate, setPlate] = useState(initial?.plate ?? '');
  const [vin, setVin] = useState(initial?.vin ?? '');
  const [brand, setBrand] = useState(initial?.brand ?? '');
  const [model, setModel] = useState(initial?.model ?? '');
  const [year, setYear] = useState(initial ? String(initial.year) : '');
  const [mileageKm, setMileageKm] = useState(initial?.mileageKm == null ? '' : String(initial.mileageKm));
  const [photos, setPhotos] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [photoError, setPhotoError] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [pending, setPending] = useState(false);
  const models = brand ? vehicleCatalog[brand] ?? [] : [];
  const title = initial ? 'Editar vehículo' : 'Registrar vehículo';

  useEffect(() => {
    const urls = photos.map((photo) => URL.createObjectURL(photo));
    setPreviews(urls);
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, [photos]);

  const selectPhotos = (files: FileList | null) => {
    const selected = Array.from(files ?? []);
    if (selected.length > MAX_VEHICLE_PHOTOS) { setPhotoError(`Puedes agregar hasta ${MAX_VEHICLE_PHOTOS} fotos.`); return; }
    if (selected.some((file) => file.size > MAX_VEHICLE_PHOTO_BYTES)) { setPhotoError('Cada foto debe pesar 15 MB o menos.'); return; }
    if (selected.some((file) => !VEHICLE_PHOTO_TYPES.includes(file.type))) { setPhotoError('Usa fotos PNG, JPG o WebP.'); return; }
    setPhotoError('');
    setPhotos(selected);
  };

  const submitVehicle = async (event: React.FormEvent) => {
    event.preventDefault();
    const nextErrors = validateVehicle(plate, brand, model, year);
    if (!isValidVin(vin)) nextErrors.vin = `Ingresa los ${VEHICLE_VIN_LENGTH} caracteres del VIN; no uses I, O ni Q.`;
    if (mileageKm && (!/^\d+$/.test(mileageKm) || Number(mileageKm) > 2147483647)) nextErrors.mileageKm = 'Ingresa un kilometraje válido o deja el campo vacío.';
    setErrors(nextErrors);
    if (photoError || Object.keys(nextErrors).length) { onNotice({ kind: 'error', title: 'Revisa los datos', message: 'Corrige los campos marcados antes de guardar.' }); return; }
    const body = { plate: plate.trim().toUpperCase(), vin: vin.trim().toUpperCase(), brand: brand.trim(), model: model.trim(), year: Number(year), mileageKm: mileageKm ? Number(mileageKm) : null };
    setPending(true);
    try {
      let saved: VehicleItem;
      if (initial) saved = await recordsApi.updateVehicle(initial.id, body, photos);
      else {
        const result = await recordsApi.createVehicle(body, photos);
        saved = { ...body, id: result.id, photoCount: photos.length, associationId: null, clientId: null, clientName: null };
      }
      if (initial) onNotice({ kind: 'success', title: 'Vehículo actualizado', message: `La placa ${body.plate} quedó guardada.` });
      onSaved(saved);
    } catch (error) {
      const code = error instanceof Error ? error.message : '';
      onNotice({ kind: 'error', title: code === 'VEHICLE_ALREADY_EXISTS' || code === 'ALREADY_EXISTS' ? 'Vehículo duplicado' : 'No se pudo guardar', message: code === 'VEHICLE_ALREADY_EXISTS' || code === 'ALREADY_EXISTS' ? 'La placa o el VIN ya están registrados.' : 'Verifica tu sesión y los datos.' });
    } finally { setPending(false); }
  };

  return <div className="modalBackdrop"><section className="recordDialog" role="dialog" aria-modal="true" aria-labelledby="vehicleTitle"><button className="iconButton" onClick={onClose} aria-label="Cerrar formulario"><Icon name="close" /></button><header><p className="eyebrow">Datos del vehículo</p><h2 id="vehicleTitle">{title}</h2><p>El VIN y la placa son obligatorios. El kilometraje es opcional.</p></header>
    <form noValidate onSubmit={submitVehicle}>
      <div className="twoColumns">
        <FormField id={initial ? `editPlate-${initial.id}` : 'vehiclePlate'} label="Placa" value={plate} onChange={(value) => setPlate(formatPlate(value))} error={errors.plate} hint="Ejemplo: ABC-123." />
        <FormField id={initial ? `editVin-${initial.id}` : 'vehicleVin'} label="VIN" value={vin} onChange={(value) => setVin(value.toUpperCase().replace(/[^A-HJ-NPR-Z0-9]/g, '').slice(0, 17))} error={errors.vin} hint="17 caracteres; no uses I, O ni Q." />
      </div>
      <div className="twoColumns">
        <div><label className="fieldLabel" htmlFor={initial ? `editBrand-${initial.id}` : 'vehicleBrand'}>Marca</label><select id={initial ? `editBrand-${initial.id}` : 'vehicleBrand'} className="selectInput" value={brand} onChange={(event) => { setBrand(event.target.value); setModel(''); }}><option value="">Elige una marca…</option>{vehicleBrands.map((name) => <option key={name} value={name}>{name}</option>)}</select>{errors.brand && <span className="fieldError">{errors.brand}</span>}</div>
        <div><label className="fieldLabel" htmlFor={initial ? `editModel-${initial.id}` : 'vehicleModel'}>Modelo</label><select id={initial ? `editModel-${initial.id}` : 'vehicleModel'} className="selectInput" value={model} disabled={!brand} onChange={(event) => setModel(event.target.value)}><option value="">{brand ? 'Elige un modelo…' : 'Primero elige la marca…'}</option>{models.map((name) => <option key={name} value={name}>{name}</option>)}</select>{errors.model && <span className="fieldError">{errors.model}</span>}</div>
      </div>
      <div className="twoColumns">
        <FormField id={initial ? `editYear-${initial.id}` : 'vehicleYear'} label="Año" value={year} onChange={(value) => { if (/^\d{0,4}$/.test(value)) setYear(value); }} error={errors.year} hint="De 1900 a 2099." />
        <FormField id={initial ? `editMileage-${initial.id}` : 'vehicleMileage'} label="Kilometraje (opcional)" value={mileageKm} onChange={(value) => { if (/^\d*$/.test(value)) setMileageKm(value); }} error={errors.mileageKm} hint="En kilómetros." />
      </div>
      <div className="vehiclePhotoPicker"><label className="fieldLabel" htmlFor="vehiclePhotos">Fotos (máximo {MAX_VEHICLE_PHOTOS}, 15 MB cada una)</label><input id="vehiclePhotos" className="textInput" type="file" accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp" multiple onChange={(event) => { selectPhotos(event.target.files); event.target.value = ''; }} />{initial?.photoCount ? <p className="hint">Fotos guardadas: {initial.photoCount}. Si eliges nuevas, reemplazarán las actuales.</p> : null}{photoError && <span className="fieldError">{photoError}</span>}{previews.length > 0 && <div className="vehiclePhotoPreviews">{previews.map((src, index) => <img key={src} src={src} alt={`Vista previa ${index + 1}`} />)}</div>}</div>
      <button className="primaryButton fullWidth" disabled={pending}>{pending ? 'Guardando…' : title}</button>
    </form></section></div>;
}
