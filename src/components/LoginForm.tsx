import { useState } from 'react';
import { authApi } from '../api/authApi';
import type { AuthResponse, FieldErrors, Notice } from '../types';
import { validateLogin } from '../utils/validation';
import { FormField } from './FormField';

interface Props { onNavigate: (screen: 'register' | 'recovery') => void; onNotice: (notice: Notice) => void; onAuthenticated: (response: AuthResponse) => void; }

export function LoginForm({ onNavigate, onNotice, onAuthenticated }: Props) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [pending, setPending] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const nextErrors = validateLogin(identifier, password);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) { onNotice({ kind: 'error', title: 'Revisa tus datos', message: 'Completa los campos señalados para continuar.' }); return; }
    setPending(true);
    try {
      const account = await authApi.login(identifier.trim(), password);
      onAuthenticated(account);
      onNotice({ kind: 'success', title: 'Acceso correcto', message: 'Tu sesión se ha iniciado de forma segura.' });
    } catch (error) {
      const code = error instanceof Error ? error.message : '';
      const network = code === 'NETWORK_UNAVAILABLE';
      const timeout = code === 'REQUEST_TIMEOUT';
      const session = code === 'SESSION_NOT_RESTORED';
      onNotice({
        kind: 'error',
        title: network ? 'No hay conexión' : timeout ? 'Tiempo de espera agotado' : session ? 'No se conservó la sesión' : 'No fue posible iniciar sesión',
        message: network ? 'Verifica tu conexión a internet e inténtalo nuevamente.' : timeout ? 'El servidor tardó en responder. Comprueba tu conexión e inténtalo de nuevo.' : session ? 'La cookie de acceso no quedó disponible. Revisa que frontend y backend usen el mismo host y vuelve a intentarlo.' : 'Los datos no son válidos o tu cuenta no puede acceder.'
      });
    } finally { setPending(false); }
  };

  return <div className="authCard">
    <header><p className="eyebrow">Bienvenido</p><h2>Inicia sesión</h2><p>Ingresa con las credenciales asignadas a tu cuenta.</p></header>
    <form noValidate onSubmit={submit}>
      <FormField id="identifier" label="Usuario o correo electrónico" value={identifier} onChange={setIdentifier} error={errors.identifier} autoComplete="username" />
      <FormField id="password" label="Contraseña" value={password} onChange={setPassword} error={errors.password} type="password" autoComplete="current-password" />
      <button type="button" className="textButton alignRight" onClick={() => onNavigate('recovery')}>¿Olvidaste tu contraseña?</button>
      <button className="primaryButton fullWidth" disabled={pending}>{pending ? 'Verificando acceso…' : 'Ingresar al sistema'}</button>
    </form>
    <footer>¿Aún no tienes cuenta? <button className="inlineButton" onClick={() => onNavigate('register')}>Solicitar registro</button></footer>
  </div>;
}
