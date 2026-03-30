// src/components/Navbar.jsx
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Shield, Menu, X, AlertCircle, User, LogOut, MapPin, FileText, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { logout } from '../firebase/auth';

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
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <div className="flex items-center justify-center group-hover:scale-110 transition-transform">
             <svg width="40" height="40" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Upper purple curve */}
              <path d="M 25 25 C 50 15, 80 20, 85 45 C 80 30, 50 25, 25 25 Z" fill="#7C3AED" />
              {/* Lower light purple face curve */}
              <path d="M 30 35 C 35 55, 40 60, 50 70 C 60 60, 65 55, 65 45 L 60 55 C 50 65, 45 60, 40 45 C 45 45, 45 40, 40 40 C 40 38, 42 35, 30 35 Z" fill="#A78BFA" />
            </svg>
          </div>
          <span className="font-display text-2xl font-bold gradient-text -ml-2">NARI</span>
        </Link>

        {/* Desktop Nav - Centered */}
        <div className="hidden md:flex items-center gap-6 absolute left-1/2 -translate-x-1/2">
          {links.map(({ to, label }) => {
            const active = location.pathname === to;
            return (
              <Link
                key={to}
                to={to}
                className={`text-sm font-bold transition-all border-b-2 py-1 ${
                  active
                    ? 'border-nari-navy text-nari-navy'
                    : 'border-transparent text-gray-400 hover:text-nari-navy hover:border-gray-200'
                }`}
              >
                {label}
              </Link>
            );
          })}
        </div>

        {/* Right actions */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            to="/report"
            className="inline-flex items-center justify-center gap-1.5 h-10 px-4 rounded-xl bg-nari-coral text-white text-sm font-bold whitespace-nowrap animate-pulse-glow hover:bg-[#e55353] transition-colors shadow-md flex-shrink-0"
          >
            <AlertCircle size={15} />
            SOS
          </Link>
          {user ? (
            <div className="flex items-center gap-2">
              <Link
                to="/profile"
                className="w-8 h-8 rounded-full bg-nari-navy/10 border border-nari-navy/20 flex items-center justify-center hover:bg-nari-navy/20 transition-colors"
              >
                <User size={15} className="text-nari-navy" />
              </Link>
              <button
                onClick={handleLogout}
                className="w-8 h-8 rounded-full bg-white border border-nari-navy/10 flex items-center justify-center hover:bg-nari-coral/10 hover:border-nari-coral/30 transition-colors"
              >
                <LogOut size={14} className="text-gray-500 hover:text-nari-coral" />
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="inline-flex items-center justify-center h-10 px-5 rounded-xl bg-nari-navy text-white text-sm font-bold whitespace-nowrap hover:bg-[#132846] transition-colors shadow-sm flex-shrink-0"
            >
              Sign In
            </Link>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden text-gray-500 hover:text-nari-navy transition-colors"
          onClick={() => setOpen(!open)}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden glass border-t border-nari-navy/10 px-4 pt-3 pb-4 space-y-1 animate-slide-up">
          {links.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === to
                  ? 'bg-nari-navy/10 text-nari-navy'
                  : 'text-gray-500 hover:text-nari-navy'
              }`}
            >
              <Icon size={15} />
              {label}
            </Link>
          ))}
          <div className="pt-2 flex gap-2">
            <Link
              to="/report"
              onClick={() => setOpen(false)}
              className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl bg-nari-coral text-white text-sm font-semibold"
            >
              <AlertCircle size={14} /> SOS
            </Link>
            {user ? (
              <button
                onClick={handleLogout}
                className="flex-1 py-2 rounded-xl bg-white border border-nari-navy/10 text-gray-600 text-sm"
              >
                Sign Out
              </button>
            ) : (
              <Link
                to="/login"
                onClick={() => setOpen(false)}
                className="flex-1 text-center py-2 rounded-xl bg-nari-navy text-white text-sm font-semibold"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
