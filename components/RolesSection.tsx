import { useEffect, useState } from 'react';
import { rolesApi, type RoleItem, type UserSummary } from '../api/rolesApi';
import type { FieldErrors, Notice } from '../types';
import { isValidRoleName } from '../utils/validation';
import { ConfirmDialog } from './ConfirmDialog';
import { FormField } from './FormField';
import { Icon } from './Icon';

// Actor: ADMINISTRADOR crea roles con valor y descripcion.
// Crea un rol dinamico. Tecnica: al crear se refrescan dropdown y tabla juntos.
export function RoleCreateForm({ onNotice, onCreated }: { onNotice: (notice: Notice) => void; onCreated: () => void }) {
  const [strValor, setStrValor] = useState('');
  const [strDescripcion, setStrDescripcion] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [pending, setPending] = useState(false);
  // Envia la creacion. Tecnica: el servidor responde 409 si el valor ya existe.
  const submitCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    const nextErrors: FieldErrors = {};
    if (!isValidRoleName(strValor)) nextErrors.strValor = 'Usa 3 a 40 caracteres: mayúsculas, números o guion bajo.';
    if (!strDescripcion.trim()) nextErrors.strDescripcion = 'Describe el alcance del rol.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) { onNotice({ kind: 'error', title: 'Revisa los datos', message: 'Completa valor y descripción válidos.' }); return; }
    setPending(true);
    try {
      const created = await rolesApi.create(strValor.trim().toUpperCase(), strDescripcion.trim());
      onNotice({ kind: 'success', title: 'Rol creado', message: `El rol ${created.name} quedó registrado.` });
      setStrValor(''); setStrDescripcion(''); setErrors({});
      onCreated();
    } catch (error) {
      const code = error instanceof Error ? error.message : '';
      onNotice({ kind: 'error', title: code === 'ROLE_ALREADY_EXISTS' ? 'Rol duplicado' : 'No se pudo crear', message: code === 'ROLE_ALREADY_EXISTS' ? 'Ese valor ya existe en el catálogo.' : 'Verifica tu sesión de administrador.' });
    } finally { setPending(false); }
  };
  return <form className="roleCard" noValidate onSubmit={submitCreate}>
    <h3><Icon name="shield" size={18} /> Creación de rol</h3>
    <FormField id="strValor" label="Valor" value={strValor} onChange={(value) => setStrValor(value.toUpperCase())} error={errors.strValor} hint="Ej. SUPERVISOR_RUTA. Queda fijo tras crear." />
    <FormField id="strDescripcion" label="Descripción" value={strDescripcion} onChange={setStrDescripcion} error={errors.strDescripcion} />
    <button className="primaryButton fullWidth" disabled={pending}>{pending ? 'Creando…' : 'Crear rol'}</button>
  </form>;
}

// Actor: ADMINISTRADOR asigna roles con dropdown buscable.
// Asigna un rol a un usuario filtrado por texto. Tecnica: busca en servidor, maximo 20 filas.
export function RoleAssignForm({ roles, onNotice }: { roles: RoleItem[]; onNotice: (notice: Notice) => void }) {
  const [query, setQuery] = useState('');
  const [matches, setMatches] = useState<UserSummary[]>([]);
  const [username, setUsername] = useState('');
  const [roleName, setRoleName] = useState('');
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  // Filtra usuarios mientras se escribe. Tecnica: minimo 1 caracter para consultar.
  useEffect(() => {
    if (query.trim().length < 1) { setMatches([]); return; }
    const timer = window.setTimeout(async () => {
      try { setMatches(await rolesApi.searchUsers(query.trim())); setOpen(true); } catch { setMatches([]); }
    }, 250);
    return () => window.clearTimeout(timer);
  }, [query]);
  // Elige un usuario del dropdown. Tecnica: guarda el username opaco, sin ids visibles.
  const pickUser = (picked: UserSummary) => { setUsername(picked.username); setQuery(picked.username); setOpen(false); };
  // Envia la asignacion. Actor: ADMINISTRADOR. Tecnica: acepta seleccion o texto exacto, el servidor valida.
  const submitAssign = async (event: React.FormEvent) => {
    event.preventDefault();
    const pickedName = username.trim() || matches.find((match) => match.username.toLowerCase() === query.trim().toLowerCase())?.username || query.trim();
    if (!pickedName || !roleName) { onNotice({ kind: 'error', title: 'Faltan datos', message: 'Elige un usuario del buscador y un rol del catálogo.' }); return; }
    setPending(true);
    try {
      const result = await rolesApi.assign(pickedName, roleName);
      onNotice({ kind: 'success', title: 'Rol asignado', message: `${result.username} ahora tiene: ${result.roles.join(', ')}.` });
      setUsername(''); setQuery(''); setMatches([]);
    } catch (error) {
      const code = error instanceof Error ? error.message : '';
      onNotice({ kind: 'error', title: 'No se pudo asignar', message: code === 'NOT_FOUND_ROLE' ? 'El usuario o el rol no existe.' : 'Solo el administrador puede asignar roles.' });
    } finally { setPending(false); }
  };
  return <form className="roleCard" noValidate onSubmit={submitAssign}>
    <h3><Icon name="user" size={18} /> Asignación de rol</h3>
    <label className="fieldLabel" htmlFor="assignUserSearch">Usuario</label>
    <div className="searchBox">
      <input id="assignUserSearch" className="selectInput" value={query} autoComplete="off" placeholder="Escribe para buscar…" onChange={(event) => { setQuery(event.target.value); setUsername(''); }} onFocus={() => setOpen(matches.length > 0)} onBlur={() => window.setTimeout(() => setOpen(false), 150)} />
      {open && matches.length > 0 && <ul className="searchResults">{matches.map((match) => <li key={match.username}><button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => pickUser(match)}><strong>{match.username}</strong><span>{match.roles.join(', ')}</span></button></li>)}</ul>}
    </div>
    <label className="fieldLabel" htmlFor="assignRole">Rol a asignar</label>
    <select id="assignRole" className="selectInput" value={roleName} onChange={(event) => setRoleName(event.target.value)}><option value="">Elige un rol…</option>{roles.map((role) => <option key={role.id} value={role.name}>{role.name}</option>)}</select>
    <button className="primaryButton fullWidth" disabled={pending}>{pending ? 'Asignando…' : 'Asignar rol'}</button>
  </form>;
}

// Actor: ADMINISTRADOR edita y elimina roles en tabla.
// Tabla de roles con acciones. Tecnica: edita solo descripcion, el valor es inmutable.
export function RolesTable({ roles, onNotice, onChanged }: { roles: RoleItem[]; onNotice: (notice: Notice) => void; onChanged: () => void }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [confirmRole, setConfirmRole] = useState<RoleItem | null>(null);
  // Inicia la edicion. Tecnica: borrador local por fila.
  const startEdit = (role: RoleItem) => { setEditingId(role.id); setDraft(role.description); };
  // Guarda la descripcion. Tecnica: refresca la tabla al instante.
  const saveEdit = async (role: RoleItem) => {
    if (!draft.trim()) { onNotice({ kind: 'error', title: 'Descripción vacía', message: 'Escribe una descripción válida.' }); return; }
    try {
      await rolesApi.update(role.id, draft.trim());
      onNotice({ kind: 'success', title: 'Rol actualizado', message: `La descripción de ${role.name} quedó guardada.` });
      setEditingId(null); onChanged();
    } catch { onNotice({ kind: 'error', title: 'No se pudo editar', message: 'Verifica tu sesión de administrador.' }); }
  };
  // Elimina un rol libre. Tecnica: 409 si tiene usuarios asignados.
  const removeRole = async (role: RoleItem) => {
    try {
      await rolesApi.remove(role.id);
      onNotice({ kind: 'success', title: 'Rol eliminado', message: `El rol ${role.name} quedó fuera del catálogo.` });
      setConfirmRole(null); onChanged();
    } catch (error) { const code = error instanceof Error ? error.message : ''; setConfirmRole(null); onNotice({ kind: 'error', title: code === 'ROLE_ALREADY_EXISTS' ? 'Rol asignado' : 'No se pudo eliminar', message: code === 'ROLE_ALREADY_EXISTS' ? 'Quita la asignación a usuarios antes de eliminar.' : 'Verifica tu sesión de administrador.' }); }
  };
  return <article className="dataCard"><h3>Roles registrados ({roles.length})</h3>
    <table className="dataTable"><thead><tr><th>Valor</th><th>Descripción</th><th>Acciones</th></tr></thead><tbody>
      {roles.map((role) => <tr key={role.id}><td><strong>{role.name}</strong></td><td>{editingId === role.id ? <input className="selectInput" value={draft} onChange={(event) => setDraft(event.target.value)} aria-label="Descripción del rol" /> : role.description}</td><td className="rowActions">{editingId === role.id ? <><button type="button" className="iconAction" title="Guardar" aria-label={`Guardar ${role.name}`} onClick={() => void saveEdit(role)}><Icon name="check" size={17} /></button><button type="button" className="iconAction" title="Cancelar" aria-label="Cancelar edición" onClick={() => setEditingId(null)}><Icon name="close" size={17} /></button></> : <><button type="button" className="iconAction" title="Editar" aria-label={`Editar ${role.name}`} onClick={() => startEdit(role)}><Icon name="eye" size={17} /></button><button type="button" className="iconAction danger" title="Eliminar" aria-label={`Eliminar ${role.name}`} onClick={() => setConfirmRole(role)}><Icon name="close" size={17} /></button></>}</td></tr>)}
    </tbody></table>
    {confirmRole && <ConfirmDialog title="Eliminar rol" target={`el rol ${confirmRole.name}`} confirmLabel="Confirmar" onConfirm={() => void removeRole(confirmRole)} onCancel={() => setConfirmRole(null)} />}
  </article>;
}

// Actor: ADMINISTRADOR consulta el catalogo.
// Pantalla Asignar Roles con creacion, asignacion y tabla. Tecnica: una sola carga alimenta dropdown y tabla.
export function RolesSection({ onNotice }: { onNotice: (notice: Notice) => void }) {
  const [roles, setRoles] = useState<RoleItem[]>([]);
  // Carga el catalogo. Tecnica: tras crear, editar o eliminar se recarga al instante.
  const loadRoles = async () => {
    try { setRoles(await rolesApi.list()); } catch { onNotice({ kind: 'error', title: 'Sin acceso a roles', message: 'Solo el administrador puede ver este catálogo.' }); }
  };
  useEffect(() => { void loadRoles(); }, []);
  return <section className="rolesSection">
    <div className="rolesGrid"><RoleCreateForm onNotice={onNotice} onCreated={loadRoles} /><RoleAssignForm roles={roles} onNotice={onNotice} /></div>
    <RolesTable roles={roles} onNotice={onNotice} onChanged={loadRoles} />
  </section>;
}
