import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Shield, Menu, X, Phone, User, LogOut, MapPin, FileText, Lock } from 'lucide-react';
import { useAuth } from '../context/useAuth';
import { logout } from '../firebase/auth';
import NariLogo from './NariLogo';

const links = [
  { to: '/', label: 'Home', icon: Shield },
  { to: '/map', label: 'Safety Map', icon: MapPin },
  { to: '/report', label: 'Report', icon: FileText },
  { to: '/evidence', label: 'Evidence', icon: Lock },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (location.pathname.startsWith('/admin')) return null;

  return (
    <nav className="fixed left-0 right-0 top-0 z-50 border-b border-nari-navy/10 bg-white/90 backdrop-blur-xl">
      <div className="mx-auto grid h-[4.5rem] w-full max-w-7xl grid-cols-[auto_1fr_auto] items-center gap-4 px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2.5">
          <NariLogo size={42} />
          <div className="leading-none">
            <span className="block font-display text-xl font-black tracking-[0.22em] text-nari-navy sm:text-2xl">NARI</span>
            <span className="hidden text-[11px] font-semibold uppercase tracking-[0.3em] text-nari-navy/70 sm:block">
              Safety OS
            </span>
          </div>
        </Link>

        <div className="hidden items-center justify-center gap-2 md:flex">
          {links.map(({ to, label }) => {
            const active = location.pathname === to;
            return (
              <Link
                key={to}
                to={to}
                className={`rounded-full px-4 py-2 text-sm font-bold transition-all ${
                  active
                    ? 'bg-nari-navy text-white shadow-sm'
                    : 'text-gray-500 hover:bg-nari-navy/5 hover:text-nari-navy'
                }`}
              >
                {label}
              </Link>
            );
          })}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <a
            href="tel:112"
            className="inline-flex h-11 flex-shrink-0 items-center justify-center gap-1.5 rounded-xl bg-nari-coral-deep px-4 text-sm font-bold whitespace-nowrap text-white transition-colors hover:bg-[#ad2936]"
          >
            <Phone size={15} />
            Call 112
          </a>
          {user ? (
            <div className="flex items-center gap-2">
              <Link
                to="/profile"
                aria-label="My profile"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-nari-navy/15 bg-nari-navy/5 transition-colors hover:bg-nari-navy/10"
              >
                <User size={16} className="text-nari-navy" />
              </Link>
              <button
                onClick={handleLogout}
                aria-label="Sign out"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-nari-navy/10 bg-white transition-colors hover:border-nari-coral/30 hover:bg-nari-coral/10"
              >
                <LogOut size={15} className="text-gray-500" />
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="inline-flex h-11 flex-shrink-0 items-center justify-center rounded-xl bg-nari-navy px-5 text-sm font-bold whitespace-nowrap text-white transition-colors hover:bg-[#132846]"
            >
              Sign in
            </Link>
          )}
        </div>

        <button
          className="flex h-10 w-10 items-center justify-center rounded-full border border-nari-navy/10 bg-white text-gray-500 transition-colors hover:text-nari-navy md:hidden"
          onClick={() => setOpen(!open)}
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {open && (
        <div className="glass animate-slide-up border-t border-nari-navy/10 px-4 pb-5 pt-3 md:hidden">
          <div className="space-y-1 rounded-2xl bg-white/80 p-2 shadow-sm">
            {links.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors ${
                  location.pathname === to
                    ? 'bg-nari-navy text-white'
                    : 'text-gray-600 hover:bg-nari-navy/5 hover:text-nari-navy'
                }`}
              >
                <Icon size={15} />
                {label}
              </Link>
            ))}
            <div className="flex gap-2 px-1 pt-3">
              <a
                href="tel:112"
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-nari-coral-deep py-3 text-sm font-semibold text-white"
              >
                <Phone size={14} />
                Call 112
              </a>
              {user ? (
                <button
                  onClick={() => {
                    setOpen(false);
                    handleLogout();
                  }}
                  className="flex-1 rounded-xl border border-nari-navy/10 bg-white py-3 text-sm text-gray-600"
                >
                  Sign Out
                </button>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setOpen(false)}
                  className="flex-1 rounded-xl bg-nari-navy py-3 text-center text-sm font-semibold text-white"
                >
                  Sign In
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
