import { ArrowRight, LogOut } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import type { AuthModalMode } from '@/components/AuthModal';

interface AccountButtonProps {
  onOpenAuth: (mode: AuthModalMode) => void;
}

export function AccountButton({ onOpenAuth }: AccountButtonProps) {
  const { user, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  if (user) {
    const initials = (user.email ?? '?').slice(0, 2).toUpperCase();
    return (
      <div className="account-menu-wrap">
        <button
          className="account-trigger"
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          aria-label="Menu du compte"
        >
          <span className="account-avatar">{initials}</span>
          <span className="account-email">{user.email}</span>
        </button>
        {menuOpen && (
          <>
            <div className="account-overlay" onClick={() => setMenuOpen(false)} />
            <div className="account-dropdown">
              <div className="dropdown-header">
                <span className="account-avatar large">{initials}</span>
                <div>
                  <strong>Mon compte</strong>
                  <small>{user.email}</small>
                </div>
              </div>
              <button
                className="dropdown-item"
                type="button"
                onClick={async () => {
                  setMenuOpen(false);
                  await signOut();
                }}
              >
                <LogOut size={17} /> Se déconnecter
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="header-actions">
      <button className="nav-login-btn" type="button" onClick={() => onOpenAuth('signin')}>
        Se connecter
      </button>
      <button className="header-cta" type="button" onClick={() => onOpenAuth('signup')}>
        Commencer gratuitement <ArrowRight size={16} />
      </button>
    </div>
  );
}