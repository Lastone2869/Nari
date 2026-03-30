// src/pages/Login.jsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, Mail, Lock, User, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { loginWithEmail, loginWithGoogle, registerWithEmail, loginAnonymously, loginAsMagicAdmin } from '../firebase/auth';

export default function Login() {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const handle = async (fn) => {
    setError('');
    setLoading(true);
    try {
      await fn();
      navigate('/');
    } catch (e) {
      setError(e.message?.replace('Firebase: ', '').replace(/\(auth.*\)/, '') || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const handleAdmin = async () => {
    setError('');
    setLoading(true);
    try {
      await loginAsMagicAdmin();
      navigate('/admin');
    } catch (e) {
      setError(e.message?.replace('Firebase: ', '').replace(/\(auth.*\)/, '') || 'Admin login failed.');
    } finally {
      setLoading(false);
    }
  };

  const submit = (e) => {
    e.preventDefault();
    if (mode === 'login') handle(() => loginWithEmail(form.email, form.password));
    else handle(() => registerWithEmail(form.email, form.password, form.name));
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 pt-16 bg-gray-50/50">
      {/* Background orbs */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/4 w-80 h-80 bg-nari-navy/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 right-1/4 w-64 h-64 bg-nari-teal/5 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md animate-slide-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-nari-navy flex items-center justify-center mx-auto mb-4 shadow-md">
            <Shield size={28} className="text-white" />
          </div>
          <h1 className="text-4xl font-black text-nari-navy uppercase tracking-widest">NARI</h1>
          <p className="text-gray-600 font-medium text-sm mt-1">Trust-First Safety Platform</p>
        </div>

        {/* Card */}
        <div className="zomato-card p-10">
          {/* Mode tabs */}
          <div className="flex rounded-xl bg-gray-100 p-1 mb-6 shadow-inner border border-nari-navy/5">
            {['login', 'register'].map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`flex-1 py-2 rounded-lg text-sm font-bold capitalize transition-all ${
                  mode === m ? 'bg-white text-nari-navy shadow-sm' : 'text-gray-500 hover:text-nari-navy'
                }`}
              >
                {m === 'login' ? 'Sign In' : 'Register'}
              </button>
            ))}
          </div>

          {error && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-nari-coral/10 border border-nari-coral/30 text-nari-coral text-sm font-semibold mb-5 shadow-sm">
              <AlertCircle size={15} className="mt-0.5 flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={submit} className="space-y-4">
            {mode === 'register' && (
              <div className="relative">
                <User size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input id="reg-name" type="text" placeholder="Full name" value={form.name} onChange={set('name')}
                  className="nari-input pl-12" required />
              </div>
            )}
            <div className="relative">
              <Mail size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input id="auth-email" type="email" placeholder="Email address" value={form.email} onChange={set('email')}
                className="nari-input pl-12" required />
            </div>
            <div className="relative">
              <Lock size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input id="auth-password" type={showPw ? 'text' : 'password'} placeholder="Password" value={form.password} onChange={set('password')}
                className="nari-input pl-12 pr-12" required />
              <button type="button" onClick={() => setShowPw(!showPw)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-nari-navy transition-colors">
                {showPw ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            <button
              id="auth-submit-btn"
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-xl bg-nari-navy text-white font-bold hover:bg-[#132846] hover:shadow-md disabled:opacity-50 transition-all hover:scale-[1.02] active:scale-95 text-lg shadow-sm mt-2"
            >
              {loading ? 'Please wait…' : mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-nari-navy/10" /></div>
            <div className="relative text-center"><span className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider bg-transparent">or continue with</span></div>
          </div>

          <div className="space-y-3">
            <button
              id="google-signin-btn"
              onClick={() => handle(loginWithGoogle)}
              disabled={loading}
              className="w-full py-3 rounded-xl bg-white border border-nari-navy/20 text-nari-navy text-sm font-bold flex items-center justify-center gap-2 hover:bg-gray-50 shadow-sm transition-all disabled:opacity-50"
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>
            <button
              id="anon-signin-btn"
              onClick={() => handle(loginAnonymously)}
              disabled={loading}
              className="w-full py-3 rounded-xl bg-white border border-nari-navy/10 text-gray-600 text-sm font-bold hover:bg-gray-50 shadow-sm transition-all disabled:opacity-50"
            >
              Continue Anonymously
            </button>
            <button
              id="magic-admin-btn"
              onClick={handleAdmin}
              disabled={loading}
              className="w-full py-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm font-bold hover:bg-red-100 shadow-sm transition-all disabled:opacity-50 mt-4"
            >
              🚀 Access Admin Dashboard (Dev ONLY)
            </button>
          </div>

          <p className="text-center text-gray-500 font-medium text-xs mt-6">
            By continuing you agree to report truthfully. False reports are a punishable offence.
          </p>
        </div>
      </div>
    </div>
  );
}
