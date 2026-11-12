import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { LayoutDashboard, FileText, Users, AlertTriangle, Map, LogOut } from 'lucide-react';
import { logout } from '../firebase/auth';
import NariLogo from '../components/NariLogo';

const NAV_ITEMS = [
  { path: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/admin/reports', label: 'Reports', icon: FileText },
  { path: '/admin/users', label: 'Users', icon: Users },
  { path: '/admin/alerts', label: 'Live Alerts', icon: AlertTriangle },
  { path: '/admin/map', label: 'Master Map', icon: Map },
];

export default function AdminLayout() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const exit = () => logout().then(() => navigate('/login'));

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="w-16 md:w-64 bg-nari-ink text-white flex flex-col flex-shrink-0">
        <div className="p-4 md:p-6 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-white"><NariLogo size={24} /></div>
            <span className="hidden md:inline text-xl font-bold tracking-widest uppercase">Admin</span>
          </div>
        </div>

        <nav className="flex-1 py-6 px-2 md:px-4 space-y-2 overflow-y-auto">
          {NAV_ITEMS.map(({ path, label, icon: Icon }) => {
            const active = pathname === path;
            return (
              <Link
                key={path}
                to={path}
                title={label}
                aria-current={active ? 'page' : undefined}
                className={`flex items-center justify-center md:justify-start gap-3 px-3 md:px-4 py-3 rounded-xl font-medium transition-all ${
                  active ? 'bg-white/15 text-white' : 'text-white/65 hover:text-white hover:bg-white/10'
                }`}
              >
                <Icon size={18} className={active ? 'text-teal-400' : ''} />
                <span className="hidden md:inline">{label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10">
          <button
            onClick={exit}
            title="Exit Admin"
            className="flex items-center justify-center md:justify-start gap-3 px-3 md:px-4 py-3 w-full rounded-xl text-red-400 hover:bg-red-500/10 font-bold transition-colors"
          >
            <LogOut size={18} />
            <span className="hidden md:inline">Exit Admin</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden bg-gray-50/50">
        <header className="h-16 bg-white border-b shadow-sm flex items-center px-4 md:px-8 z-10 flex-shrink-0">
          <h1 className="text-lg font-black text-nari-navy">
            {NAV_ITEMS.find(i => i.path === pathname)?.label || 'Administration'}
          </h1>
        </header>

        <div className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-8 relative">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
