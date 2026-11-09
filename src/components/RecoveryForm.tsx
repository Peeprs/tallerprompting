import { useState, useEffect, useRef } from 'react';
import { authApi } from '../api/authApi';
import type { FieldErrors, Notice } from '../types';
import { isAdmittedEmail, isSafePassword } from '../utils/validation';
import { FormField } from './FormField';
import { Icon } from './Icon';
import { PasswordRules } from './PasswordRules';

// Actor: usuario sin acceso que olvido su clave.
// Formulario en dos fases: solicita enlace y luego introduce el código temporal OTP y nueva clave.
export function RecoveryForm({ onBack, onNotice }: { onBack: () => void; onNotice: (notice: Notice) => void }) {
  const [step, setStep] = useState<'request' | 'reset'>('request');
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [devToken, setDevToken] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [pending, setPending] = useState(false);
  const [timeLeft, setTimeLeft] = useState(900); // 15 minutos en segundos

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Contador de expiracion en la fase de codigo OTP
  useEffect(() => {
    if (step !== 'reset' || timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [step, timeLeft]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Solicita el enlace de recuperacion. Tecnica: respuesta identica exista o no la cuenta.
  const submitRequest = async (event: React.FormEvent) => {
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
        setOtpDigits(['', '', '', '', '', '']);
      }
      setTimeLeft(900);
      setStep('reset');
      onNotice({ kind: 'success', title: 'Solicitud procesada', message: 'Si existe una cuenta asociada, recibirás un enlace de un solo uso que vence en 15 minutos.' });
    } catch (error) {
      const network = error instanceof Error && error.message === 'NETWORK_UNAVAILABLE';
      onNotice({ kind: 'error', title: network ? 'No hay conexión' : 'Solicitud no disponible', message: network ? 'Comprueba tu internet y vuelve a intentarlo.' : 'No se pudo procesar la solicitud en este momento.' });
    } finally {
      setPending(false);
    }
  };

  // Manejo de dígitos del código temporal
  const handleOtpChange = (index: number, value: string) => {
    const clean = value.replace(/[^a-zA-Z0-9]/g, '');
    if (!clean) {
      const next = [...otpDigits];
      next[index] = '';
      setOtpDigits(next);
      return;
    }
    if (clean.length > 1) {
      // Manejo de pegado en la casilla
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

  // Restablece la clave con el token. Tecnica: valida fortaleza antes de enviar al servidor.
  const submitReset = async (event: React.FormEvent) => {
    event.preventDefault();
    const effectiveToken = token.trim() || otpDigits.join('').trim();
    const nextErrors: FieldErrors = {};
    if (!effectiveToken) nextErrors.token = 'Introduce el código o token recibido.';
    if (!isSafePassword(newPassword)) nextErrors.newPassword = 'La contraseña aún no cumple los requisitos.';
    if (newPassword !== confirmation || !confirmation) nextErrors.confirmation = 'Las contraseñas deben coincidir.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      onNotice({ kind: 'error', title: 'Revisa los datos', message: 'Completa el código y una contraseña válida.' });
      return;
    }
    setPending(true);
    try {
      await authApi.resetPassword(effectiveToken, newPassword);
      onNotice({ kind: 'success', title: 'Contraseña actualizada', message: 'Ya puedes ingresar con tu nueva contraseña.' });
      // Limpia el estado y regresa a la pantalla inicial como se solicitó
      setToken('');
      setOtpDigits(['', '', '', '', '', '']);
      setNewPassword('');
      setConfirmation('');
      setDevToken('');
      setErrors({});
      setStep('request');
    } catch (error) {
      const network = error instanceof Error && error.message === 'NETWORK_UNAVAILABLE';
      onNotice({ kind: 'error', title: network ? 'No hay conexión' : 'Token no válido', message: network ? 'Comprueba tu internet y vuelve a intentarlo.' : 'El token expiró, ya fue usado o no es correcto.' });
    } finally {
      setPending(false);
    }
  };

  // FASE 1: Solicitud inicial (únicamente se muestra el correo)
  if (step === 'request') {
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

        <form noValidate onSubmit={submitRequest}>
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

  // FASE 2: Introducir código temporal OTP y nueva contraseña (diseño oscuro/morado con temporizador)
  return (
    <div className="authCard">
      <header>
        <button className="backButton" onClick={() => { setErrors({}); setStep('request'); }}>
          <Icon name="arrow" size={16} /> Volver a solicitar
        </button>
        <p className="eyebrow">Recuperación segura</p>
        <h2>Introduce tu código</h2>
        <p>Escribe el código temporal enviado a <strong>{email || 'tu correo'}</strong>.</p>
      </header>

      <form noValidate onSubmit={submitReset}>
        <div className="otpCard">
          <p className="otpInstruction">Introduce el código temporal recibido:</p>
          <div className="otpInputsRow">
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
                className={`otpInputBox ${digit ? 'filled' : ''}`}
                autoFocus={idx === 0}
              />
            ))}
          </div>

          <div className="otpTimerMeta">
            <div>
              Vence en <span className="otpTimerBadge">{formatTimer(timeLeft)}</span>
            </div>
            <div className="otpTimerInfo">
              <Icon name="history" size={14} /> Expira en 15 min
            </div>
          </div>

          {devToken && (
            <button type="button" className="otpDevTokenAlert" onClick={applyDevToken} title="Haz clic para autocompletar">
              <span>⚡ Modo desarrollo: <strong>{devToken.slice(0, 10)}…</strong></span>
              <u>Autocompletar</u>
            </button>
          )}
        </div>

        {errors.token && <p className="fieldError" style={{ marginTop: '-10px', marginBottom: '14px' }}>{errors.token}</p>}

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

        <button className="otpActionBtn" disabled={pending}>
          {pending ? 'Actualizando…' : 'Verificar y entrar →'}
        </button>

        <button
          type="button"
          className="otpSecondaryBtn"
          onClick={() => { setErrors({}); setStep('request'); }}
        >
          Volver
        </button>
      </form>
    </div>
  );
}
