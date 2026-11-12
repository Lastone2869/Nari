import { useEffect, useState } from 'react';
import { useAuth } from '../context/useAuth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { ShieldAlert } from 'lucide-react';

export default function AdminRoute({ children }) {
  const { user, loading: authLoading } = useAuth();
  // Role check result keyed by uid, so a new sign-in never reuses the previous user's answer.
  const [check, setCheck] = useState({ uid: null, isAdmin: false });

  useEffect(() => {
    if (!user) return;
    let active = true;
    getDoc(doc(db, 'users', user.uid))
      .then((snap) => active && setCheck({ uid: user.uid, isAdmin: snap.exists() && snap.data().role === 'admin' }))
      .catch((e) => {
        console.error('Admin check failed', e);
        if (active) setCheck({ uid: user.uid, isAdmin: false });
      });
    return () => { active = false; };
  }, [user]);

  const verifying = !!user && check.uid !== user.uid;
  const isAdmin = !!user && check.uid === user.uid && check.isAdmin;

  if (authLoading || verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-nari-navy border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4 text-center">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-4">
          <ShieldAlert size={40} className="text-red-500" />
        </div>
        <h1 className="text-3xl font-black text-nari-navy mb-2">Access Denied</h1>
        <p className="text-gray-500 mb-6">You do not have Administrator permissions to view this section.</p>
        <a href="/" className="px-6 py-3 bg-nari-navy text-white font-bold rounded-xl hover:bg-[#132846] transition-colors">
          Return Home
        </a>
      </div>
    );
  }

  return children;
}
