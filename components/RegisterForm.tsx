import { useState } from 'react';
import { authApi } from '../api/authApi';
import type { FieldErrors, Notice } from '../types';
import { validateRegister } from '../utils/validation';
import { FormField } from './FormField';
import { Icon } from './Icon';
import { PasswordRules } from './PasswordRules';

export function RegisterForm({ onBack, onNotice }: { onBack: () => void; onNotice: (notice: Notice) => void }) {
  const [username, setUsername] = useState(''); const [email, setEmail] = useState('');
  const [password, setPassword] = useState(''); const [confirmation, setConfirmation] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({}); const [pending, setPending] = useState(false);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const nextErrors = validateRegister(username, email, password, confirmation); setErrors(nextErrors);
    if (Object.keys(nextErrors).length) { onNotice({ kind: 'error', title: 'Faltan datos por corregir', message: 'Revisa los campos marcados y los requisitos de contraseña.' }); return; }
    setPending(true);
    try {
      await authApi.register(username.trim(), email.trim().toLowerCase(), password);
      onNotice({ kind: 'success', title: 'Solicitud creada', message: 'Revisa tu correo para conocer el siguiente paso de activación.' });
    } catch (error) {
      const network = error instanceof Error && error.message === 'NETWORK_UNAVAILABLE';
      onNotice({ kind: 'error', title: network ? 'No hay conexión' : 'No fue posible crear tu registro', message: network ? 'Verifica tu conexión e inténtalo nuevamente.' : 'El usuario o correo ya está registrado, o el servicio no está disponible.' });
    } finally { setPending(false); }
  };
  return <div className="authCard wide"><header><button className="backButton" onClick={onBack}><Icon name="arrow" size={16} /> Volver al acceso</button><p className="eyebrow">Registro de cuenta</p><h2>Solicita tu acceso</h2><p>El sistema validará tu información antes de habilitar el rol correspondiente.</p></header>
    <form noValidate onSubmit={submit}>
      <FormField id="username" label="Nombre de usuario" value={username} onChange={setUsername} error={errors.username} autoComplete="username" hint="No uses espacios ni datos personales sensibles." />
      <FormField id="email" label="Correo electrónico" value={email} onChange={setEmail} error={errors.email} type="email" autoComplete="email" hint="Solo Gmail, Hotmail, Outlook o Microsoft." />
      <FormField id="newPassword" label="Contraseña" value={password} onChange={setPassword} error={errors.password} type="password" autoComplete="new-password" />
      <PasswordRules password={password} />
      <FormField id="confirmation" label="Confirmar contraseña" value={confirmation} onChange={setConfirmation} error={errors.confirmation} type="password" autoComplete="new-password" />
      <button className="primaryButton fullWidth" disabled={pending}>{pending ? 'Creando solicitud…' : 'Crear solicitud de registro'}</button>
    </form></div>;
}
