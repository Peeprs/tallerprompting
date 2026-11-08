import type { Notice } from '../types';
import { Icon } from './Icon';

export function NoticeModal({ notice, onClose }: { notice: Notice | null; onClose: () => void }) {
  if (!notice) return null;
  const icon = notice.kind === 'success' ? 'check' : notice.kind === 'error' ? 'close' : 'shield';
  return <div className="modalBackdrop" role="presentation">
    <section className={`noticeModal ${notice.kind}`} role="alertdialog" aria-modal="true" aria-labelledby="noticeTitle">
      <button className="iconButton" onClick={onClose} aria-label="Cerrar mensaje"><Icon name="close" /></button>
      <div className="noticeIcon"><Icon name={icon} size={27} /></div>
      <h2 id="noticeTitle">{notice.title}</h2>
      <p>{notice.message}</p>
      <button className="primaryButton" onClick={onClose}>Entendido</button>
    </section>
  </div>;
}
