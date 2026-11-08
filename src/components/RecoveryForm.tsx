import { useState } from 'react';
import { authApi } from '../api/authApi';
import type { FieldErrors, Notice } from '../types';
import { isAdmittedEmail, isSafePassword } from '../utils/validation';
import { FormField } from './FormField';
import { Icon } from './Icon';
import { PasswordRules } from './PasswordRules';

// Actor: usuario sin acceso que olvido su clave.
// Formulario en dos pasos: solicita enlace y restablece con token. Tecnica: token opaco de un solo uso, 15 min.
export function RecoveryForm({ onBack, onNotice }: { onBack: () => void; onNotice: (notice: Notice) => void }) {
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [devToken, setDevToken] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [pending, setPending] = useState(false);
  // Solicita el enlace de recuperacion. Tecnica: respuesta identica exista o no la cuenta.
  const submitRequest = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!isAdmittedEmail(email)) { setErrors({ email: 'Ingresa un correo permitido y válido.' }); onNotice({ kind: 'error', title: 'Correo no válido', message: 'Verifica el formato y el dominio de tu correo.' }); return; }
    setErrors({}); setPending(true);
    try {
      const result = await authApi.requestRecovery(email.trim().toLowerCase());
      if (result?.devToken) setDevToken(result.devToken);
      onNotice({ kind: 'success', title: 'Solicitud procesada', message: 'Si existe una cuenta asociada, recibirás un enlace de un solo uso que vence en 15 minutos.' });
    } catch (error) { const network = error instanceof Error && error.message === 'NETWORK_UNAVAILABLE'; onNotice({ kind: 'error', title: network ? 'No hay conexión' : 'Solicitud no disponible', message: network ? 'Comprueba tu internet y vuelve a intentarlo.' : 'No se pudo procesar la solicitud en este momento.' }); }
    finally { setPending(false); }
  };
  // Restablece la clave con el token. Tecnica: valida fortaleza antes de enviar al servidor.
  const submitReset = async (event: React.FormEvent) => {
    event.preventDefault();
    const nextErrors: FieldErrors = {};
    if (!token.trim()) nextErrors.token = 'Pega el token recibido por correo.';
    if (!isSafePassword(newPassword)) nextErrors.newPassword = 'La contraseña aún no cumple los requisitos.';
    if (newPassword !== confirmation || !confirmation) nextErrors.confirmation = 'Las contraseñas deben coincidir.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) { onNotice({ kind: 'error', title: 'Revisa los datos', message: 'Completa el token y una contraseña válida.' }); return; }
    setPending(true);
    try {
      await authApi.resetPassword(token.trim(), newPassword);
      onNotice({ kind: 'success', title: 'Contraseña actualizada', message: 'Ya puedes ingresar con tu nueva contraseña.' });
      setToken(''); setNewPassword(''); setConfirmation(''); setDevToken('');
    } catch (error) { const network = error instanceof Error && error.message === 'NETWORK_UNAVAILABLE'; onNotice({ kind: 'error', title: network ? 'No hay conexión' : 'Token no válido', message: network ? 'Comprueba tu internet y vuelve a intentarlo.' : 'El token expiró, ya fue usado o no es correcto.' }); }
    finally { setPending(false); }
  };
  return <div className="authCard"><header><button className="backButton" onClick={onBack}><Icon name="arrow" size={16} /> Volver al acceso</button><p className="eyebrow">Recuperación segura</p><h2>Restablece tu contraseña</h2><p>Escribe tu correo. Por seguridad, no confirmaremos si una cuenta existe.</p></header>
    <ol className="recoverySteps"><li>Solicita el enlace de recuperación.</li><li>Abre el correo recibido.</li><li>Crea una contraseña nueva antes de que expire.</li></ol>
    <form noValidate onSubmit={submitRequest}><FormField id="recoveryEmail" label="Correo electrónico" value={email} onChange={setEmail} error={errors.email} type="email" autoComplete="email" /><button className="primaryButton fullWidth" disabled={pending}>{pending ? 'Procesando…' : 'Enviar enlace seguro'}</button></form>
    {devToken && <p className="hint">Token de desarrollo recibido. Cópialo al siguiente paso.</p>}
    <form noValidate onSubmit={submitReset}><FormField id="recoveryToken" label="Token recibido" value={token} onChange={setToken} error={errors.token} hint={devToken ? 'Se detectó un token de desarrollo para validar el flujo.' : 'Pega el token de un solo uso.'} /><FormField id="recoveryPassword" label="Nueva contraseña" value={newPassword} onChange={setNewPassword} error={errors.newPassword} type="password" autoComplete="new-password" /><PasswordRules password={newPassword} /><FormField id="recoveryConfirmation" label="Confirmar contraseña" value={confirmation} onChange={setConfirmation} error={errors.confirmation} type="password" autoComplete="new-password" /><button className="primaryButton fullWidth" disabled={pending}>{pending ? 'Actualizando…' : 'Cambiar contraseña'}</button></form>
  </div>;
}
