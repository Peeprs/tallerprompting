import { useEffect, useRef, useState } from 'react';
import type { AuthResponse, Notice, Screen } from '../types';
import { authApi } from '../api/authApi';
import { AuthShell } from '../components/AuthShell';
import { LoginForm } from '../components/LoginForm';
import { RegisterForm } from '../components/RegisterForm';
import { RecoveryForm } from '../components/RecoveryForm';
import { NoticeModal } from '../components/NoticeModal';
import { Toast } from '../components/Toast';
import { Workspace } from './layouts/Workspace';
import { trackEvent } from '../telemetry';

export function App() {
  const [screen, setScreen] = useState<Screen>('login');
  const [notice, setNotice] = useState<Notice | null>(null);
  const [toast, setToast] = useState<Notice | null>(null);
  const [account, setAccount] = useState<AuthResponse | null>(null);
  const [sessionReady, setSessionReady] = useState(false);
  const previousAccount = useRef<AuthResponse | null>(null);
  const previousScreen = useRef<Screen | null>(null);
  const showNotice = (item: Notice) => { setNotice(item); setToast(item); };
  useEffect(() => {
    let active = true;
    void authApi.session()
      .then((session) => { if (active) setAccount(session); })
      .catch(() => { if (active) setAccount(null); })
      .finally(() => { if (active) setSessionReady(true); });
    return () => { active = false; };
  }, []);
  useEffect(() => { if (!toast) return; const timer = window.setTimeout(() => setToast(null), 4500); return () => window.clearTimeout(timer); }, [toast]);
  // Navegación entre pantallas de acceso. Actor: sistema. Técnica: solo nombre de pantalla, sin datos del formulario.
  useEffect(() => { if (previousScreen.current === screen) return; previousScreen.current = screen; trackEvent('app.navigation', { screen }); }, [screen]);
  // Inicio y fin de sesión autenticada. Actor: sistema. Técnica: solo cantidad de roles, nunca el nombre del usuario.
  useEffect(() => {
    if (account) trackEvent('auth.session.started', { roles_count: account.roles.length });
    else if (previousAccount.current) trackEvent('auth.session.ended', { roles_count: previousAccount.current.roles.length });
    previousAccount.current = account;
  }, [account]);
  if (!sessionReady) return <AuthShell><div className="authCard" role="status" aria-live="polite">Comprobando sesión…</div></AuthShell>;
  if (account) return <><Workspace account={account} onNotice={showNotice} onLogout={() => { trackEvent('auth.logout.requested'); setAccount(null); setScreen('login'); showNotice({ kind: 'info', title: 'Sesión cerrada', message: 'Tu acceso se cerró correctamente.' }); }} /><Toast notice={toast} /><NoticeModal notice={notice} onClose={() => setNotice(null)} /></>;
  return <>
    <AuthShell>
      {screen === 'login' && <LoginForm onNavigate={setScreen} onNotice={showNotice} onAuthenticated={setAccount} />}
      {screen === 'register' && <RegisterForm onBack={() => { setNotice(null); setScreen('login'); }} onNotice={showNotice} />}
      {screen === 'recovery' && <RecoveryForm onBack={() => setScreen('login')} onNotice={showNotice} />}
    </AuthShell>
    <Toast notice={toast} />
    <NoticeModal notice={notice} onClose={() => setNotice(null)} />
  </>;
}
