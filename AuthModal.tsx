import { FormEvent, useEffect, useState } from 'react';
import { ArrowRight, Compass, Loader2, Mail, Lock, Eye, EyeOff, X, BadgeCheck } from 'lucide-react';
import { useAuth } from '@/lib/auth';

export type AuthModalMode = 'signin' | 'signup' | 'reset';

interface AuthModalProps {
  mode: AuthModalMode;
  onClose: () => void;
  onSwitchMode: (mode: AuthModalMode) => void;
}

export function AuthModal({ mode, onClose, onSwitchMode }: AuthModalProps) {
  const { signIn, signUp, resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setError(null);
    setSuccess(null);
  }, [mode]);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    if (mode === 'reset') {
      const { error: resetError } = await resetPassword(email);
      setLoading(false);
      if (resetError) {
        setError(translateError(resetError));
      } else {
        setSuccess("Un email de réinitialisation t'a été envoyé. Vérifie ta boîte de réception.");
      }
      return;
    }

    if (mode === 'signup') {
      const pwdError = validatePassword(password);
      if (pwdError) {
        setError(pwdError);
        setLoading(false);
        return;
      }
      const { error: signUpError } = await signUp(email, password);
      setLoading(false);
      if (signUpError) {
        setError(translateError(signUpError));
      } else {
        setSuccess("Compte créé ! Vérifie ta boîte mail pour confirmer ton adresse email, puis connecte-toi.");
      }
      return;
    }

    const { error: signInError } = await signIn(email, password);
    setLoading(false);
    if (signInError) {
      setError(translateError(signInError));
    } else {
      onClose();
    }
  }

  const titles: Record<AuthModalMode, string> = {
    signin: 'Connexion',
    signup: 'Créer ton compte',
    reset: 'Mot de passe oublié',
  };

  const subtitles: Record<AuthModalMode, string> = {
    signin: "Reprends ta recherche là où tu l'avais laissée.",
    signup: " Gratuit, sans carte bancaire, prêt en 2 minutes.",
    reset: "On t'envoie un lien pour choisir un nouveau mot de passe.",
  };

  const buttonText: Record<AuthModalMode, string> = {
    signin: 'Se connecter',
    signup: 'Créer mon compte',
    reset: 'Envoyer le lien',
  };

  return (
    <div className="auth-overlay" onClick={onClose}>
      <div className="auth-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={titles[mode]}>
        <button className="auth-close" type="button" onClick={onClose} aria-label="Fermer">
          <X size={20} />
        </button>

        <div className="auth-header">
          <div className="auth-brand">
            <span className="brand-mark"><Compass size={20} strokeWidth={2.5} /></span>
            <span>Décroche</span>
          </div>
          <h2>{titles[mode]}</h2>
          <p>{subtitles[mode]}</p>
        </div>

        {success ? (
          <div className="auth-success">
            <BadgeCheck size={22} />
            <p>{success}</p>
            {mode === 'reset' && (
              <button className="button button-primary" type="button" onClick={() => onSwitchMode('signin')}>
                Retour à la connexion <ArrowRight size={18} />
              </button>
            )}
          </div>
        ) : (
          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="auth-field">
              <label htmlFor="auth-email">Email</label>
              <div className="input-wrap">
                <Mail size={18} />
                <input
                  id="auth-email"
                  type="email"
                  placeholder="ton.email@exemple.fr"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            {mode !== 'reset' && (
              <div className="auth-field">
                <label htmlFor="auth-password">Mot de passe</label>
                <div className="input-wrap">
                  <Lock size={18} />
                  <input
                    id="auth-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    pattern="(?=.*[A-Z])(?=.*\d).{8,}"
                    title="Min. 8 caractères, 1 majuscule et 1 chiffre"
                    autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                  />
                  <button type="button" className="toggle-password" onClick={() => setShowPassword((s) => !s)} aria-label={showPassword ? 'Masquer' : 'Afficher'}>
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            )}

            {mode === 'signup' && (
              <div className="auth-hint">Min. 8 caractères, 1 majuscule et 1 chiffre.</div>
            )}

            {error && <div className="auth-error">{error}</div>}

            <button className="button button-primary auth-submit" type="submit" disabled={loading}>
              {loading ? <Loader2 size={20} className="spin" /> : <>{buttonText[mode]} <ArrowRight size={18} /></>}
            </button>
          </form>
        )}

        <div className="auth-footer">
          {mode === 'signin' && (
            <>
              <button type="button" className="auth-link" onClick={() => onSwitchMode('reset')}>Mot de passe oublié ?</button>
              <p>Pas encore de compte ? <button type="button" className="auth-link" onClick={() => onSwitchMode('signup')}>Créer un compte</button></p>
            </>
          )}
          {mode === 'signup' && (
            <p>Déjà un compte ? <button type="button" className="auth-link" onClick={() => onSwitchMode('signin')}>Se connecter</button></p>
          )}
          {mode === 'reset' && !success && (
            <p><button type="button" className="auth-link" onClick={() => onSwitchMode('signin')}>Retour à la connexion</button></p>
          )}
        </div>
      </div>
    </div>
  );
}

function validatePassword(pwd: string): string | null {
  if (pwd.length < 8) return 'Le mot de passe doit faire au moins 8 caractères.';
  if (!/[A-Z]/.test(pwd)) return 'Le mot de passe doit contenir au moins une majuscule.';
  if (!/\d/.test(pwd)) return 'Le mot de passe doit contenir au moins un chiffre.';
  return null;
}

function translateError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes('invalid login')) return 'Email ou mot de passe incorrect.';
  if (lower.includes('user already registered')) return 'Cet email est deja utilise. Essaie de te connecter.';
  if (lower.includes('password should be at least')) return 'Le mot de passe doit faire au moins 8 caracteres, 1 majuscule et 1 chiffre.';
  if (lower.includes('email not confirmed')) return 'Tu dois confirmer ton adresse email avant de te connecter. Verifie ta boite mail.';
  if (lower.includes('unable to send')) return 'Impossible d envoyer l email. Verifie l adresse saisie.';
  return 'Une erreur est survenue. Reessaie dans un instant.';
}
