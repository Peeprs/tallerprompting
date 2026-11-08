type IconName = 'arrow' | 'arrowLeft' | 'arrowRight' | 'arrowFirst' | 'arrowLast' | 'lock' | 'mail' | 'user' | 'eye' | 'eyeOff' | 'check' | 'close' | 'shield' | 'car' | 'people' | 'wrench' | 'image' | 'plus' | 'trash' | 'pin' | 'history' | 'link';

const paths: Record<IconName, string> = {
  arrow: 'M5 12h14m-6-6 6 6-6 6',
  // Paginacion. Actor: sistema recorre paginas 1, 2, 3. Tecnica: flechas simples y dobles.
  arrowLeft: 'M15 5l-7 7 7 7',
  arrowRight: 'M9 5l7 7-7 7',
  arrowFirst: 'M17 5l-7 7 7 7M7 5v14',
  arrowLast: 'M7 5l7 7-7 7M17 5v14',
  lock: 'M6 11V8a6 6 0 0 1 12 0v3M5 11h14v10H5z',
  mail: 'M3 5h18v14H3zM3 7l9 6 9-6',
  user: 'M20 21a8 8 0 0 0-16 0m12-14a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z',
  eye: 'M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Zm10 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z',
  eyeOff: 'm3 3 18 18M10.6 6.2A10.6 10.6 0 0 1 12 6c6.5 0 10 6 10 6a18 18 0 0 1-3 3.7M6.7 6.7C3.7 8.5 2 12 2 12s3.5 6 10 6a10 10 0 0 0 2.2-.3M9.9 9.9a3 3 0 0 0 4.2 4.2',
  check: 'm5 12 4 4L19 6',
  close: 'M6 6l12 12M18 6 6 18',
  shield: 'M12 3 20 6v5c0 5.2-3.4 8.6-8 10-4.6-1.4-8-4.8-8-10V6l8-3Z',
  car: 'M5 17h14l-1-6H6l-1 6Zm2 0v2m8-2v2M7 11l2-4h6l2 4',
  people: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2m15-6a4 4 0 0 0 0-8m-6 4a4 4 0 1 0-8 0',
  // Taller mecanico. Actor: navegacion de talleres. Tecnica: solo SVG, sin emojis.
  wrench: 'M14.7 6.3a4.5 4.5 0 0 0-6 6L3 18l3 3 5.7-5.7a4.5 4.5 0 0 0 6-6L14 13l-3-3 3.7-3.7Z',
  // Foto del taller. Actor: drag and drop. Tecnica: trazo simple de imagen.
  image: 'M3 5h18v14H3zM8 10a1.5 1.5 0 1 0 0-.01M3 17l5-5 4 4 3-3 6 6',
  // Agregar contacto. Actor: UC-CV-01 boton mas. Tecnica: cruz minimalista.
  plus: 'M12 5v14M5 12h14',
  // Eliminar registro. Actor: acciones de tabla. Tecnica: bote de basura.
  trash: 'M4 7h16M9 4h6m-8 3 1 13h8l1-13',
  // Direccion. Actor: seccion de domicilio. Tecnica: pin de mapa.
  pin: 'M12 21s-7-6.1-7-11a7 7 0 0 1 14 0c0 4.9-7 11-7 11Zm0-8a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z',
  // Historial de trazabilidad. Actor: edicion de cliente. Tecnica: reloj con flecha.
  history: 'M3 12a9 9 0 1 0 3-6.7M3 4v5h5M12 7v5l3 3',
  // Asociar vehiculo. Actor: RECEPCIONISTA vincula. Tecnica: eslabones de cadena.
  link: 'M10 14a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1.5 1.5M14 10a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1.5-1.5'
};

export function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={paths[name]} /></svg>;
}
