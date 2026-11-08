import { useState } from 'react';
import { Icon } from './Icon';

interface Props {
  id: string; label: string; value: string; onChange: (value: string) => void;
  error?: string; type?: 'text' | 'email' | 'password'; autoComplete?: string; hint?: string;
}

export function FormField({ id, label, value, onChange, error, type = 'text', autoComplete, hint }: Props) {
  const [visible, setVisible] = useState(false);
  const password = type === 'password';
  return <div className={`field ${error ? 'hasError' : ''}`}>
    <label htmlFor={id}>{label}</label>
    <div className="inputShell">
      <input id={id} type={password && visible ? 'text' : type} value={value} autoComplete={autoComplete} aria-describedby={error ? `${id}Error` : hint ? `${id}Hint` : undefined} aria-invalid={Boolean(error)} onChange={(event) => onChange(event.target.value)} />
      {password && <button type="button" className="visibilityButton" aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'} onClick={() => setVisible(!visible)}><Icon name={visible ? 'eyeOff' : 'eye'} size={19} /></button>}
    </div>
    {error ? <small id={`${id}Error`} className="fieldError">{error}</small> : hint ? <small id={`${id}Hint`} className="fieldHint">{hint}</small> : null}
  </div>;
}
