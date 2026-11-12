import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, User, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { loginWithEmail, loginWithGoogle, registerWithEmail, loginAnonymously } from '../firebase/auth';
import { authErrorMessage } from '../lib/format';
import { IS_NATIVE } from '../lib/saveFile';
import NariLogo from '../components/NariLogo';

const INPUT = 'w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-11 pr-4 text-sm font-medium text-nari-navy outline-none transition focus:border-nari-navy/70 focus:bg-white focus:ring-[3px] focus:ring-nari-navy/10 placeholder:text-gray-400';
const SECONDARY = 'flex h-11 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white text-[13px] font-bold text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60';

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
      setError(authErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  const submit = (e) => {
    e.preventDefault();
    if (mode === 'login') handle(() => loginWithEmail(form.email, form.password));
    else handle(() => registerWithEmail(form.email, form.password, form.name.trim()));
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 pb-16 pt-28">
      <div className="relative w-full max-w-[420px]">
        <div className="mb-8 text-center">
          <div className="mb-2 flex items-center justify-center gap-2.5">
            <NariLogo size={52} />
            <h1 className="text-[34px] font-black tracking-[0.18em] text-nari-navy">NARI</h1>
          </div>
          <p className="text-sm font-medium text-gray-600">{mode === 'login' ? 'Sign in to your account' : 'Create your account'}</p>
        </div>

        <div className="nari-card p-7">
          <div className="mb-6 flex rounded-xl bg-gray-100 p-1" role="tablist" aria-label="Sign in or register">
            {[['login', 'Sign in'], ['register', 'Register']].map(([m, label]) => (
              <button
                key={m}
                type="button"
                role="tab"
                aria-selected={mode === m}
                onClick={() => { setMode(m); setError(''); }}
                className={`flex-1 rounded-[9px] py-2 text-[13px] font-bold transition ${
                  mode === m ? 'bg-white text-nari-navy shadow-sm' : 'text-gray-600'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {error && (
            <div role="alert" className="mb-4 flex items-center gap-2 rounded-[10px] border border-red-200 bg-red-50 px-3 py-2.5 text-[13px] font-semibold text-red-500">
              <AlertCircle size={14} className="flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={submit} className="flex flex-col gap-3">
            {mode === 'register' && (
              <div className="relative">
                <User size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input id="reg-name" type="text" placeholder="Full name" aria-label="Full name" value={form.name} onChange={set('name')} required autoComplete="name" className={INPUT} />
              </div>
            )}

            <div className="relative">
              <Mail size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input id="auth-email" type="email" placeholder="Email address" aria-label="Email address" value={form.email} onChange={set('email')} required autoComplete="email" className={INPUT} />
            </div>

            <div className="relative">
              <Lock size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                id="auth-password"
                type={showPw ? 'text' : 'password'}
                placeholder="Password"
                aria-label="Password"
                value={form.password}
                onChange={set('password')}
                required
                minLength={6}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                className={`${INPUT} pr-11`}
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                aria-label={showPw ? 'Hide password' : 'Show password'}
                className="absolute right-1.5 top-1/2 flex -translate-y-1/2 p-2 text-gray-500 hover:text-nari-navy"
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            <button
              id="auth-submit-btn"
              type="submit"
              disabled={loading}
              className="mt-1 flex h-12 w-full items-center justify-center rounded-xl bg-nari-navy text-[15px] font-bold text-white transition-colors hover:bg-nari-ink disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Please wait...' : mode === 'login' ? 'Sign in' : 'Create account'}
            </button>
          </form>

          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-gray-200" />
            <span className="text-xs font-medium text-gray-500">or continue with</span>
            <div className="h-px flex-1 bg-gray-200" />
          </div>

          <div className={`grid gap-2.5 ${IS_NATIVE ? '' : 'grid-cols-2'}`}>
            {!IS_NATIVE && <button id="google-signin-btn" type="button" onClick={() => handle(loginWithGoogle)} disabled={loading} className={`${SECONDARY} text-gray-700`}>
              <svg width="15" height="15" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Google
            </button>}
            <button id="anon-signin-btn" type="button" onClick={() => handle(loginAnonymously)} disabled={loading} className={SECONDARY}>
              Anonymous
            </button>
          </div>

          <p className="mt-4 text-center text-[11px] leading-relaxed text-gray-500">By continuing you agree to report truthfully.</p>
        </div>
      </div>
    </div>
  );
}
