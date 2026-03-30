import { useState, useEffect } from 'react';
import { getAllUsersAdmin, updateUserRole, deleteUserAdmin } from '../../firebase/firestore';
import { Shield, ShieldAlert, Trash2, UserCog, Loader2, Check, X } from 'lucide-react';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [deleting, setDeleting] = useState({}); // { [id]: 'confirm' | 'loading' }
  const [toggling, setToggling] = useState({}); // { [id]: 'confirm' | 'loading' }

  useEffect(() => {
    const unsub = getAllUsersAdmin((data) => setUsers(data));
    return unsub;
  }, []);

  // ── Delete flow ──────────────────────────────────────────────────────────────
  const requestDelete = (id) => setDeleting(prev => ({ ...prev, [id]: 'confirm' }));
  const cancelDelete  = (id) => setDeleting(prev => { const n = { ...prev }; delete n[id]; return n; });
  const confirmDelete = async (id) => {
    setDeleting(prev => ({ ...prev, [id]: 'loading' }));
    try {
      await deleteUserAdmin(id);
      // row disappears via realtime subscription
    } catch (e) {
      console.error('Delete failed:', e);
      cancelDelete(id);
    }
  };

  // ── Role toggle flow ─────────────────────────────────────────────────────────
  const requestToggle  = (id) => setToggling(prev => ({ ...prev, [id]: 'confirm' }));
  const cancelToggle   = (id) => setToggling(prev => { const n = { ...prev }; delete n[id]; return n; });
  const confirmToggle  = async (id, currentRole) => {
    setToggling(prev => ({ ...prev, [id]: 'loading' }));
    try {
      const newRole = currentRole === 'admin' ? 'user' : 'admin';
      await updateUserRole(id, newRole);
    } catch (e) {
      console.error('Role update failed:', e);
    } finally {
      setToggling(prev => { const n = { ...prev }; delete n[id]; return n; });
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
        <h2 className="text-xl font-bold text-nari-navy flex items-center gap-2">
          <UserCog /> User Management
        </h2>
        <div className="text-sm font-bold text-gray-500 bg-white px-4 py-2 rounded-lg border shadow-sm">
          Total Users: {users.length}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
              <th className="p-4 font-bold border-b">Name &amp; Email</th>
              <th className="p-4 font-bold border-b">Phone</th>
              <th className="p-4 font-bold border-b text-center">Role</th>
              <th className="p-4 font-bold border-b text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map(u => {
              const delState    = deleting[u.id];
              const toggleState = toggling[u.id];
              return (
                <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4">
                    <div className="font-bold text-nari-navy">{u.name || 'Anonymous User'}</div>
                    <div className="text-xs text-gray-500">{u.email || 'No email provided'}</div>
                  </td>
                  <td className="p-4 text-sm text-gray-600 font-medium tracking-wide">
                    {u.phone || 'N/A'}
                  </td>
                  <td className="p-4 text-center">
                    <span className={`px-3 py-1 text-xs font-black rounded-full uppercase tracking-widest ${
                      u.role === 'admin' ? 'bg-nari-navy text-white shadow-sm' : 'bg-gray-200 text-gray-600'
                    }`}>
                      {u.role || 'user'}
                    </span>
                  </td>

                  {/* Actions column */}
                  <td className="p-4 text-right">

                    {/* Delete confirmation flow */}
                    {!delState && !toggleState && (
                      <div className="flex items-center justify-end gap-2">
                        {/* Role toggle button */}
                        <button
                          onClick={() => requestToggle(u.id)}
                          className={`p-2 rounded-lg transition ${
                            u.role === 'admin'
                              ? 'bg-amber-50 text-amber-600 hover:bg-amber-100'
                              : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                          }`}
                          title="Toggle Admin Privilege"
                        >
                          {u.role === 'admin' ? <ShieldAlert size={18} /> : <Shield size={18} />}
                        </button>
                        {/* Delete button */}
                        <button
                          onClick={() => requestDelete(u.id)}
                          className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition"
                          title="Delete User"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    )}

                    {/* Delete confirm inline */}
                    {delState === 'confirm' && (
                      <div className="flex items-center justify-end gap-2">
                        <span className="text-xs font-bold text-red-600">Delete user?</span>
                        <button
                          onClick={() => confirmDelete(u.id)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 text-xs transition"
                        >
                          <Check size={12} /> Yes
                        </button>
                        <button
                          onClick={() => cancelDelete(u.id)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-gray-200 text-gray-700 font-bold rounded-lg hover:bg-gray-300 text-xs transition"
                        >
                          <X size={12} /> No
                        </button>
                      </div>
                    )}
                    {delState === 'loading' && (
                      <div className="flex items-center justify-end gap-1 text-red-500 text-xs font-bold">
                        <Loader2 size={14} className="animate-spin" /> Deleting…
                      </div>
                    )}

                    {/* Role toggle confirm inline */}
                    {toggleState === 'confirm' && (
                      <div className="flex items-center justify-end gap-2">
                        <span className="text-xs font-bold text-gray-700">
                          Make {u.role === 'admin' ? 'User' : 'Admin'}?
                        </span>
                        <button
                          onClick={() => confirmToggle(u.id, u.role || 'user')}
                          className="flex items-center gap-1 px-3 py-1.5 bg-nari-navy text-white font-bold rounded-lg hover:opacity-90 text-xs transition"
                        >
                          <Check size={12} /> Yes
                        </button>
                        <button
                          onClick={() => cancelToggle(u.id)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-gray-200 text-gray-700 font-bold rounded-lg hover:bg-gray-300 text-xs transition"
                        >
                          <X size={12} /> No
                        </button>
                      </div>
                    )}
                    {toggleState === 'loading' && (
                      <div className="flex items-center justify-end gap-1 text-blue-500 text-xs font-bold">
                        <Loader2 size={14} className="animate-spin" /> Updating…
                      </div>
                    )}

                  </td>
                </tr>
              );
            })}
            {users.length === 0 && (
              <tr>
                <td colSpan="4" className="p-8 text-center text-gray-500 font-bold">No users found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
