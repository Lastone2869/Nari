import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, User, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { loginWithEmail, loginWithGoogle, registerWithEmail, loginAnonymously } from '../firebase/auth';
import NariLogo from '../components/NariLogo';

export default function Login() {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const from = useLocation().state?.from || '/';

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const handle = async (fn) => {
    setError('');
    setLoading(true);
    try {
      await fn();
      navigate(from, { replace: true });
    } catch (e) {
      setError(e.message?.replace('Firebase: ', '').replace(/\(auth.*\)/, '') || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const submit = (e) => {
    e.preventDefault();
    if (mode === 'login') handle(() => loginWithEmail(form.email, form.password));
    else handle(() => registerWithEmail(form.email, form.password, form.name));
  };

  const inputStyle = {
    width: '100%',
    padding: '13px 16px 13px 44px',
    borderRadius: '12px',
    background: '#F9FAFB',
    border: '1px solid #E5E7EB',
    color: '#1A365D',
    fontSize: '14px',
    fontWeight: '500',
    outline: 'none',
    fontFamily: 'inherit',
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, rgba(247,250,252,1) 0%, rgba(255,255,255,1) 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '104px 16px 40px',
      }}
    >
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        <div
          style={{
            position: 'absolute',
            top: '10%',
            left: '15%',
            width: 300,
            height: 300,
            borderRadius: '50%',
            background: 'rgba(26,54,93,0.05)',
            filter: 'blur(80px)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '15%',
            right: '10%',
            width: 250,
            height: 250,
            borderRadius: '50%',
            background: 'rgba(79,209,197,0.06)',
            filter: 'blur(80px)',
          }}
        />
      </div>

      <div style={{ width: '100%', maxWidth: '420px', position: 'relative' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '8px' }}>
            <NariLogo size={52} />
            <span style={{ fontSize: '34px', fontWeight: 900, color: '#1A365D', letterSpacing: '0.18em', fontFamily: 'inherit' }}>
              NARI
            </span>
          </div>
          <p style={{ color: '#6B7280', fontSize: '13px', fontWeight: 500 }}>
            {mode === 'login' ? 'Sign in to your account' : 'Create your account'}
          </p>
        </div>

        <div
          style={{
            background: 'white',
            border: '1px solid #F3F4F6',
            borderRadius: '28px',
            padding: '32px 28px',
            boxShadow: '0 24px 70px rgba(15,39,67,0.08)',
          }}
        >
          <div style={{ display: 'flex', background: '#F3F4F6', borderRadius: '12px', padding: '4px', marginBottom: '24px' }}>
            {[['login', 'Sign In'], ['register', 'Register']].map(([m, label]) => (
              <button
                key={m}
                onClick={() => {
                  setMode(m);
                  setError('');
                }}
                style={{
                  flex: 1,
                  padding: '8px',
                  borderRadius: '9px',
                  fontSize: '13px',
                  fontWeight: 700,
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  fontFamily: 'inherit',
                  ...(mode === m
                    ? { background: 'white', color: '#1A365D', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }
                    : { background: 'transparent', color: '#6B7280' }),
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {error && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 12px',
                borderRadius: 10,
                marginBottom: 16,
                background: '#FEF2F2',
                border: '1px solid #FECACA',
                color: '#EF4444',
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              <AlertCircle size={14} style={{ flexShrink: 0 }} />
              {error}
            </div>
          )}

          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {mode === 'register' && (
              <div style={{ position: 'relative' }}>
                <User size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
                <input
                  id="reg-name"
                  type="text"
                  placeholder="Full name"
                  value={form.name}
                  onChange={set('name')}
                  required
                  style={inputStyle}
                  className="login-input"
                />
              </div>
            )}

            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
              <input
                id="auth-email"
                type="email"
                placeholder="Email address"
                value={form.email}
                onChange={set('email')}
                required
                style={inputStyle}
                className="login-input"
              />
            </div>

            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
              <input
                id="auth-password"
                type={showPw ? 'text' : 'password'}
                placeholder="Password"
                value={form.password}
                onChange={set('password')}
                required
                style={{ ...inputStyle, paddingRight: '44px' }}
                className="login-input"
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                style={{
                  position: 'absolute',
                  right: 14,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#9CA3AF',
                  display: 'flex',
                  padding: 0,
                }}
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            <button
              id="auth-submit-btn"
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                height: '48px',
                borderRadius: '12px',
                marginTop: '4px',
                background: 'linear-gradient(135deg, #1A365D, #25538C)',
                color: 'white',
                fontSize: '15px',
                fontWeight: 800,
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1,
                transition: 'all 0.2s',
                boxShadow: '0 8px 24px rgba(26,54,93,0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'inherit',
                letterSpacing: '0.02em',
              }}
            >
              {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' }}>
            <div style={{ flex: 1, height: 1, background: '#E5E7EB' }} />
            <span style={{ color: '#9CA3AF', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              or continue with
            </span>
            <div style={{ flex: 1, height: 1, background: '#E5E7EB' }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
            <button
              id="google-signin-btn"
              onClick={() => handle(loginWithGoogle)}
              disabled={loading}
              style={{
                height: 44,
                borderRadius: 12,
                border: '1px solid #E5E7EB',
                background: 'white',
                color: '#374151',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 7,
                transition: 'all 0.2s',
                fontFamily: 'inherit',
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Google
            </button>

            <button
              id="anon-signin-btn"
              onClick={() => handle(loginAnonymously)}
              disabled={loading}
              style={{
                height: 44,
                borderRadius: 12,
                border: '1px solid #E5E7EB',
                background: 'white',
                color: '#6B7280',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s',
                fontFamily: 'inherit',
              }}
            >
              Anonymous
            </button>
          </div>

          <p style={{ textAlign: 'center', color: '#9CA3AF', fontSize: 11, marginTop: 16, lineHeight: 1.5 }}>
            By continuing you agree to report truthfully.
          </p>
        </div>
      </div>

      <style>{`
        .login-input::placeholder { color: #9CA3AF; }
        .login-input:focus { border-color: rgba(26,54,93,0.7) !important; box-shadow: 0 0 0 3px rgba(26,54,93,0.12); background: white !important; }
      `}</style>
    </div>
  );
}
