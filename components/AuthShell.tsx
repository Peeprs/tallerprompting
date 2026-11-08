import type { ReactNode } from 'react';
import { Icon } from './Icon';

export function AuthShell({ children }: { children: ReactNode }) {
  return <main className="authPage">
    <aside className="brandPanel">
      <a className="brand" href="#inicio" aria-label="Portal de Transporte, inicio"><span className="brandMark"><Icon name="car" size={25} /></span><span>Portal de Transporte</span></a>
      <div className="brandContent">
        <p className="eyebrow">Gestión segura</p>
        <h1>Información clara para cada trayecto.</h1>
        <p>Administra clientes, vehículos y acceso del equipo desde un lugar protegido y fácil de usar.</p>
      </div>
      <div className="securityNote"><Icon name="shield" size={19} /><span>Acceso protegido y controlado por roles.</span></div>
    </aside>
    <section className="formPanel">{children}</section>
  </main>;
}
