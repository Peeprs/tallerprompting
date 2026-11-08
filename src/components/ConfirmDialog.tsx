import { Icon } from './Icon';

// Actor: ADMINISTRADOR o RECEPCIONISTA confirma una eliminacion.
// Modal de confirmacion reutilizable. Tecnica: mismo estilo que NoticeModal, solo SVG.
export function ConfirmDialog({ title, target, confirmLabel, onConfirm, onCancel }: { title: string; target: string; confirmLabel: string; onConfirm: () => void; onCancel: () => void }) {
  return <div className="modalBackdrop" role="presentation">
    <section className="noticeModal info" role="alertdialog" aria-modal="true" aria-labelledby="confirmTitle">
      <div className="noticeIcon"><Icon name="shield" size={27} /></div>
      <h2 id="confirmTitle">{title}</h2>
      <p>¿Deseas eliminar {target}?</p>
      <div className="formRow" style={{ justifyContent: 'center' }}>
        <button className="primaryButton" onClick={onConfirm}>{confirmLabel}</button>
        <button className="textButton" onClick={onCancel}>Cancelar</button>
      </div>
    </section>
  </div>;
}
