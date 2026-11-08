import { passwordChecks } from '../utils/validation';
import { Icon } from './Icon';

export function PasswordRules({ password }: { password: string }) {
  const checks = passwordChecks(password);
  const rules: [keyof typeof checks, string][] = [['length', '12 caracteres o más'], ['upper', 'Una letra mayúscula'], ['lower', 'Una letra minúscula'], ['number', 'Un número'], ['symbol', 'Un símbolo']];
  return <ul className="passwordRules" aria-label="Requisitos de contraseña">{rules.map(([key, label]) => <li key={key} className={checks[key] ? 'valid' : ''}><Icon name="check" size={15} />{label}</li>)}</ul>;
}
