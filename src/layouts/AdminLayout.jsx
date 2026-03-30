import { Link, useLocation, Outlet } from 'react-router-dom';
import { LayoutDashboard, FileText, Users, AlertTriangle, Map, LogOut } from 'lucide-react';
import { logout } from '../firebase/auth';

const NAV_ITEMS = [
  { path: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/admin/reports', label: 'Reports', icon: FileText },
  { path: '/admin/users', label: 'Users', icon: Users },
  { path: '/admin/alerts', label: 'Live Alerts', icon: AlertTriangle },
  { path: '/admin/map', label: 'Master Map', icon: Map },
];

export default function AdminLayout() {
  const { pathname } = useLocation();

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden font-sans">
      {/* Sidebar */}
      <div className="w-64 bg-gray-900 text-white flex flex-col flex-shrink-0">
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center font-black">N</div>
            <span className="text-xl font-bold tracking-widest uppercase">Admin</span>
          </div>
        </div>

        <div className="flex-1 py-6 px-4 space-y-2 overflow-y-auto">
          {NAV_ITEMS.map(({ path, label, icon: Icon }) => {
            const active = pathname === path;
            return (
              <Link
                key={path}
                to={path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
                  active ? 'bg-nari-navy text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                <Icon size={18} className={active ? 'text-teal-400' : ''} />
                {label}
              </Link>
            );
          })}
        </div>

        <div className="p-4 border-t border-gray-800">
          <button
            onClick={logout}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-red-400 hover:bg-red-500/10 font-bold transition-colors"
          >
            <LogOut size={18} />
            Exit Admin
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden bg-gray-50/50">
        <header className="h-16 bg-white border-b shadow-sm flex items-center px-8 z-10 flex-shrink-0">
          <h1 className="text-lg font-black text-nari-navy">
            {NAV_ITEMS.find(i => i.path === pathname)?.label || 'Administration'}
          </h1>
        </header>

        <main className="flex-1 overflow-x-hidden overflow-y-auto p-8 relative">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
