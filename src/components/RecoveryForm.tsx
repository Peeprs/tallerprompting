import { useState, useRef } from 'react';
import { authApi } from '../api/authApi';
import type { FieldErrors, Notice } from '../types';
import { isAdmittedEmail, isSafePassword } from '../utils/validation';
import { FormField } from './FormField';
import { Icon } from './Icon';
import { PasswordRules } from './PasswordRules';

// Actor: usuario sin acceso que olvido su clave.
// Flujo secuencial estricto:
// 1. 'email': Solo solicita correo.
// 2. 'code': Solo pide introducir el código (sin campos de contraseña).
// 3. 'new-password': Solo tras validar el código, pide la nueva contraseña.
// Al terminar exitosamente, regresa a la pantalla 'email' inicial.
export function RecoveryForm({ onBack, onNotice }: { onBack: () => void; onNotice: (notice: Notice) => void }) {
  const [step, setStep] = useState<'email' | 'code' | 'new-password'>('email');
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [devToken, setDevToken] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [pending, setPending] = useState(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // 1. Enviar solicitud de correo
  const submitEmail = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!isAdmittedEmail(email)) {
      setErrors({ email: 'Ingresa un correo permitido y válido.' });
      onNotice({ kind: 'error', title: 'Correo no válido', message: 'Verifica el formato y el dominio de tu correo.' });
      return;
    }
    setErrors({});
    setPending(true);
    try {
      const result = await authApi.requestRecovery(email.trim().toLowerCase());
      if (result?.devToken) {
        setDevToken(result.devToken);
        setToken(result.devToken);
        const chars = result.devToken.slice(0, 6).split('');
        setOtpDigits([...chars, '', '', '', '', ''].slice(0, 6));
      } else {
        setToken('');
        setOtpDigits(['', '', '', '', '', '']);
      }
      setStep('code');
      onNotice({ kind: 'success', title: 'Solicitud procesada', message: 'Si existe una cuenta asociada, recibirás un enlace de un solo uso que vence en 15 minutos.' });
    } catch (error) {
      const network = error instanceof Error && error.message === 'NETWORK_UNAVAILABLE';
      onNotice({ kind: 'error', title: network ? 'No hay conexión' : 'Solicitud no disponible', message: network ? 'Comprueba tu internet y vuelve a intentarlo.' : 'No se pudo procesar la solicitud en este momento.' });
    } finally {
      setPending(false);
    }
  };

  // 2. Manejo de cajas de código OTP adaptadas al diseño del sistema
  const handleOtpChange = (index: number, value: string) => {
    const clean = value.replace(/[^a-zA-Z0-9]/g, '');
    if (!clean) {
      const next = [...otpDigits];
      next[index] = '';
      setOtpDigits(next);
      return;
    }
    if (clean.length > 1) {
      handleOtpPaste(clean);
      return;
    }
    const next = [...otpDigits];
    next[index] = clean[0];
    setOtpDigits(next);
    setToken(next.join(''));
    if (index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Backspace' && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (pasted: string) => {
    const clean = pasted.trim();
    setToken(clean);
    const chars = clean.slice(0, 6).split('');
    const next = Array.from({ length: 6 }, (_, i) => chars[i] || '');
    setOtpDigits(next);
    inputRefs.current[Math.min(chars.length, 5)]?.focus();
  };

  const applyDevToken = () => {
    if (!devToken) return;
    setToken(devToken);
    const chars = devToken.slice(0, 6).split('');
    setOtpDigits(Array.from({ length: 6 }, (_, i) => chars[i] || ''));
  };

  // 2b. Validar el código antes de mostrar el formulario de nueva contraseña
  const submitCode = (event: React.FormEvent) => {
    event.preventDefault();
    const effectiveToken = token.trim() || otpDigits.join('').trim();
    if (!effectiveToken || effectiveToken.length < 4) {
      setErrors({ token: 'Introduce el código o token completo recibido.' });
      onNotice({ kind: 'error', title: 'Código incompleto', message: 'Por favor ingresa el código recibido en tu correo.' });
      return;
    }
    setErrors({});
    setStep('new-password');
  };

  // 3. Restablecer la contraseña una vez validado el código
  const submitReset = async (event: React.FormEvent) => {
    event.preventDefault();
    const effectiveToken = token.trim() || otpDigits.join('').trim();
    const nextErrors: FieldErrors = {};
    if (!effectiveToken) nextErrors.token = 'Falta el código de recuperación.';
    if (!isSafePassword(newPassword)) nextErrors.newPassword = 'La contraseña aún no cumple los requisitos.';
    if (newPassword !== confirmation || !confirmation) nextErrors.confirmation = 'Las contraseñas deben coincidir.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      onNotice({ kind: 'error', title: 'Revisa los datos', message: 'Completa una contraseña válida y asegúrate de que coincidan.' });
      return;
    }
    setPending(true);
    try {
      await authApi.resetPassword(effectiveToken, newPassword);
      onNotice({ kind: 'success', title: 'Contraseña actualizada', message: 'Tu contraseña ha sido actualizada. Ingresa con tus nuevas credenciales.' });
      // Limpia todo y regresa a la pantalla inicial 'email'
      setEmail('');
      setToken('');
      setOtpDigits(['', '', '', '', '', '']);
      setNewPassword('');
      setConfirmation('');
      setDevToken('');
      setErrors({});
      setStep('email');
    } catch (error) {
      const network = error instanceof Error && error.message === 'NETWORK_UNAVAILABLE';
      onNotice({ kind: 'error', title: network ? 'No hay conexión' : 'Token no válido', message: network ? 'Comprueba tu internet y vuelve a intentarlo.' : 'El token expiró, ya fue usado o no es correcto.' });
      // Si el token es inválido, regresa al paso de código para corregirlo
      setStep('code');
    } finally {
      setPending(false);
    }
  };

  // ==========================================
  // FASE 1: ÚNICAMENTE SOLICITAR CORREO
  // ==========================================
  if (step === 'email') {
    return (
      <div className="authCard">
        <header>
          <button className="backButton" onClick={onBack}>
            <Icon name="arrow" size={16} /> Volver al acceso
          </button>
          <p className="eyebrow">Recuperación segura</p>
          <h2>Restablece tu contraseña</h2>
          <p>Escribe tu correo. Por seguridad, no confirmaremos si una cuenta existe.</p>
        </header>

        <ol className="recoverySteps">
          <li>Solicita el enlace de recuperación.</li>
          <li>Abre el correo recibido.</li>
          <li>Crea una contraseña nueva antes de que expire.</li>
        </ol>

        <form noValidate onSubmit={submitEmail}>
          <FormField
            id="recoveryEmail"
            label="Correo electrónico"
            value={email}
            onChange={setEmail}
            error={errors.email}
            type="email"
            autoComplete="email"
          />
          <button className="primaryButton fullWidth" disabled={pending}>
            {pending ? 'Procesando…' : 'Enviar enlace seguro'}
          </button>
        </form>
      </div>
    );
  }

  // ==========================================
  // FASE 2: ÚNICAMENTE INTRODUCIR CÓDIGO
  // (Sin campos de contraseña, diseño actual del sistema)
  // ==========================================
  if (step === 'code') {
    return (
      <div className="authCard">
        <header>
          <button className="backButton" onClick={() => { setErrors({}); setStep('email'); }}>
            <Icon name="arrow" size={16} /> Volver a solicitar
          </button>
          <p className="eyebrow">Recuperación segura</p>
          <h2>Introduce tu código</h2>
          <p>Escribe el código recibido en tu correo <strong>{email}</strong>.</p>
        </header>

        <form noValidate onSubmit={submitCode}>
          <div className="otpBoxGroup">
            {otpDigits.map((digit, idx) => (
              <input
                key={idx}
                ref={el => {
                  inputRefs.current[idx] = el;
                }}
                type="text"
                maxLength={6}
                value={digit}
                onChange={e => handleOtpChange(idx, e.target.value)}
                onKeyDown={e => handleOtpKeyDown(idx, e)}
                onPaste={e => {
                  e.preventDefault();
                  handleOtpPaste(e.clipboardData.getData('text'));
                }}
                className={`otpBoxInput ${digit ? 'filled' : ''}`}
                autoFocus={idx === 0}
              />
            ))}
          </div>

          {errors.token && (
            <p className="fieldError" style={{ marginTop: '-14px', marginBottom: '14px' }}>
              {errors.token}
            </p>
          )}

          {devToken && (
            <button type="button" className="devTokenHelper" onClick={applyDevToken} title="Haz clic para autocompletar">
              <span>⚡ Token detectado: <strong>{devToken.slice(0, 12)}…</strong></span>
              <u>Autocompletar</u>
            </button>
          )}

          <button className="primaryButton fullWidth">
            Verificar código →
          </button>

          <button
            type="button"
            className="secondaryActionBtn"
            onClick={() => { setErrors({}); setStep('email'); }}
          >
            Volver
          </button>
        </form>
      </div>
    );
  }

  // ==========================================
  // FASE 3: ÚNICAMENTE NUEVA CONTRASEÑA Y CONFIRMACIÓN
  // (Aparece solo una vez validado el código)
  // ==========================================
  return (
    <div className="authCard">
      <header>
        <button className="backButton" onClick={() => { setErrors({}); setStep('code'); }}>
          <Icon name="arrow" size={16} /> Modificar código
        </button>
        <p className="eyebrow">Recuperación segura</p>
        <h2>Crea tu nueva contraseña</h2>
        <p>Escribe y confirma tu nueva contraseña de acceso seguro.</p>
      </header>

      <form noValidate onSubmit={submitReset}>
        <FormField
          id="recoveryPassword"
          label="Nueva contraseña"
          value={newPassword}
          onChange={setNewPassword}
          error={errors.newPassword}
          type="password"
          autoComplete="new-password"
        />

        <PasswordRules password={newPassword} />

        <FormField
          id="recoveryConfirmation"
          label="Confirmar contraseña"
          value={confirmation}
          onChange={setConfirmation}
          error={errors.confirmation}
          type="password"
          autoComplete="new-password"
        />

        <button className="primaryButton fullWidth" disabled={pending}>
          {pending ? 'Actualizando…' : 'Actualizar contraseña'}
        </button>

        <button
          type="button"
          className="secondaryActionBtn"
          onClick={() => { setErrors({}); setStep('code'); }}
        >
          Volver al código
        </button>
      </form>
    </div>
  );
}
