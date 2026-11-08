import { useEffect, useMemo, useRef, useState } from 'react';
import type { AuthResponse } from '../types';
import { trackEvent } from '../telemetry';
import { Icon } from './Icon';
import { ClientsSection } from './ClientsSection';
import { RolesSection } from './RolesSection';
import { VehiclesSection } from './VehiclesSection';
import { WorkshopSection } from './WorkshopSection';
import type { Notice } from '../types';

type Section = 'summary' | 'clients' | 'vehicles' | 'workshops' | 'users';
// Etiquetas de navegacion. Tecnica: sin ids en URL, estado en memoria por rol.
const labels: Record<Section, string> = { summary: 'Resumen', clients: 'Clientes', vehicles: 'Vehículos', workshops: 'Talleres', users: 'Asignar Roles' };

// Area privada por rol. Actor: ADMINISTRADOR muta talleres y roles; RECEPCIONISTA registra clientes y vehiculos.
// Tecnica: sin cuenta no se renderiza (guard en App), sesion por cookie HttpOnly.
export function Workspace({ account, onLogout, onNotice }: { account: AuthResponse; onLogout: () => void; onNotice: (notice: Notice) => void }) {
  const [section, setSection] = useState<Section>('summary');
  const previousSection = useRef<Section | null>(null);
  // Navegación interna del área privada. Actor: sistema. Técnica: sección y cantidad de roles, sin datos del usuario.
  useEffect(() => {
    if (previousSection.current === section) return;
    previousSection.current = section;
    trackEvent('ui.navigation', { section, roles_count: account.roles.length });
  }, [section, account.roles.length]);
  // Permisos por rol asignado. Tecnica: la UI oculta, el servidor autoriza (403 = modal sin permiso).
  const canManageUsers = account.roles.includes('ADMINISTRADOR');
  const canRegisterRecords = canManageUsers || account.roles.includes('RECEPCIONISTA');
  // Solo ADMINISTRADOR muta talleres. Tecnica: recepcionista ve activos para asociar clientes.
  const canMutateWorkshops = canManageUsers;
  // Icono por seccion. Actor: sistema. Tecnica: solo SVG, sin emojis.
  const sectionIcon = (option: Section) =>
    option === 'clients' ? <Icon name="people" /> : option === 'vehicles' ? <Icon name="car" /> : option === 'workshops' ? <Icon name="wrench" /> : <Icon name="shield" />;
  // Opciones visibles segun rol. Tecnica: TRANSPORTISTA consulta, no muta.
  const options = useMemo(() => (['summary', 'clients', 'vehicles', 'workshops', ...(canManageUsers ? ['users'] : [])] as Section[]), [canManageUsers]);
  return <main className="workspace">
    <aside className="sidebar"><a className="brand" href="#inicio"><span className="brandMark"><Icon name="car" size={22} /></span><span>Portal de Transporte</span></a>
      <nav aria-label="Navegación principal">{options.map(option => <button key={option} className={section === option ? 'navItem active' : 'navItem'} onClick={() => setSection(option)}>{sectionIcon(option)}{labels[option]}</button>)}</nav>
      <div className="accountBox"><strong>{account.displayName}</strong><span>{account.roles.join(' · ')}</span><button className="textButton" onClick={onLogout}>Cerrar sesión</button></div>
    </aside>
    <section className="workspaceContent"><header className="workspaceHeader"><div><p className="eyebrow">Área autorizada</p><h1>{labels[section]}</h1></div></header>
      {section === 'summary' && <section className="overview"><div className="welcome"><p>Sesión activa</p><h2>Hola, {account.displayName}.</h2><span>Las opciones disponibles se ajustan a tu rol asignado.</span></div><article><Icon name="people" size={24} /><h3>Clientes</h3><p>Alta UC-CV-01 con taller activo y N contactos.</p></article><article><Icon name="wrench" size={24} /><h3>Talleres</h3><p>Registro con foto y dirección verificada por código postal.</p></article></section>}
      {section === 'users' && canManageUsers && <RolesSection onNotice={onNotice} />}
      {section === 'vehicles' && <VehiclesSection canMutate={canRegisterRecords} onNotice={onNotice} />}
      {section === 'workshops' && <WorkshopSection canMutate={canMutateWorkshops} onNotice={onNotice} />}
      {section === 'clients' && (canRegisterRecords ? <ClientsSection canMutate={canRegisterRecords} onNotice={onNotice} /> : <section className="emptyState"><div><Icon name="people" size={34} /></div><h2>Sin permiso</h2><p>Tu rol no puede registrar clientes.</p></section>)}
    </section>
  </main>;
}
