// src/components/Navbar.jsx
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Shield, Menu, X, AlertCircle, User, LogOut, LayoutDashboard, MapPin, FileText, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { logout } from '../firebase/auth';

const links = [
  { to: '/', label: 'Home', icon: Shield },
  { to: '/map', label: 'Safety Map', icon: MapPin },
  { to: '/report', label: 'Report', icon: FileText },
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
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

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-pink-500 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Shield size={16} className="text-white" />
          </div>
          <span className="font-display text-xl font-bold gradient-text">NARI</span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-1">
          {links.map(({ to, label }) => {
            const active = location.pathname === to;
            return (
              <Link
                key={to}
                to={to}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  active
                    ? 'bg-violet-600/20 text-violet-300 border border-violet-600/30'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
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
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500 text-white text-sm font-semibold animate-pulse-glow hover:bg-red-600 transition-colors"
          >
            <AlertCircle size={14} />
            SOS
          </Link>
          {user ? (
            <div className="flex items-center gap-2">
              <Link
                to="/profile"
                className="w-8 h-8 rounded-full bg-violet-600/30 border border-violet-600/40 flex items-center justify-center hover:bg-violet-600/50 transition-colors"
              >
                <User size={15} className="text-violet-300" />
              </Link>
              <button
                onClick={handleLogout}
                className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-red-500/20 hover:border-red-500/40 transition-colors"
              >
                <LogOut size={14} className="text-gray-400 hover:text-red-400" />
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="px-4 py-1.5 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 transition-colors"
            >
              Sign In
            </Link>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden text-gray-400 hover:text-white transition-colors"
          onClick={() => setOpen(!open)}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden glass border-t border-white/5 px-4 pt-3 pb-4 space-y-1 animate-slide-up">
          {links.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === to
                  ? 'bg-violet-600/20 text-violet-300'
                  : 'text-gray-400 hover:text-white'
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
              className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl bg-red-500 text-white text-sm font-semibold"
            >
              <AlertCircle size={14} /> SOS
            </Link>
            {user ? (
              <button
                onClick={handleLogout}
                className="flex-1 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-300 text-sm"
              >
                Sign Out
              </button>
            ) : (
              <Link
                to="/login"
                onClick={() => setOpen(false)}
                className="flex-1 text-center py-2 rounded-xl bg-violet-600 text-white text-sm font-semibold"
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
