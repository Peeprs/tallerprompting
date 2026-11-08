import type { Notice } from '../types';
import { Icon } from './Icon';

export function Toast({ notice }: { notice: Notice | null }) {
  if (!notice) return null;
  return <div className={`toast ${notice.kind}`} role="status"><Icon name={notice.kind === 'success' ? 'check' : 'close'} /><div><strong>{notice.title}</strong><span>{notice.message}</span></div></div>;
}
