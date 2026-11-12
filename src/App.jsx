import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import SOSButton from './components/SOSButton';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';

import Home from './pages/Home';
import Login from './pages/Login';
import Report from './pages/Report';
import Track from './pages/Track';
import Evidence from './pages/Evidence';
import Profile from './pages/Profile';

// Loaded on demand: the map pulls in the Google Maps bindings and the admin area is staff only.
const SafetyMap = lazy(() => import('./pages/SafetyMap'));
const AdminLayout = lazy(() => import('./layouts/AdminLayout'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminReports = lazy(() => import('./pages/admin/AdminReports'));
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers'));
const AdminAlerts = lazy(() => import('./pages/admin/AdminAlerts'));
const AdminMap = lazy(() => import('./pages/admin/AdminMap'));

const Spinner = () => (
  <div className="flex min-h-screen items-center justify-center" role="status" aria-label="Loading">
    <div className="h-10 w-10 animate-spin rounded-full border-2 border-nari-navy border-t-transparent" />
  </div>
);

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="flex min-h-screen flex-col">
          <Navbar />
          <main className="flex-1">
            <Suspense fallback={<Spinner />}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/report" element={<Report />} />
                <Route path="/track/:id?" element={<Track />} />
                <Route path="/map" element={<SafetyMap />} />
                <Route path="/evidence" element={<ProtectedRoute><Evidence /></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

                <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
                  <Route index element={<AdminDashboard />} />
                  <Route path="reports" element={<AdminReports />} />
                  <Route path="users" element={<AdminUsers />} />
                  <Route path="alerts" element={<AdminAlerts />} />
                  <Route path="map" element={<AdminMap />} />
                </Route>

                <Route
                  path="*"
                  element={
                    <div className="flex min-h-screen flex-col items-center justify-center px-4 pt-20 text-center">
                      <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-nari-coral/10 text-2xl font-black text-nari-coral-deep">
                        404
                      </div>
                      <h2 className="mb-2 font-display text-3xl font-bold text-nari-navy">Page Not Found</h2>
                      <p className="mb-6 max-w-md text-gray-500">The page you&apos;re looking for doesn&apos;t exist or may have been moved.</p>
                      <Link to="/" className="rounded-xl bg-nari-navy px-6 py-3 font-semibold text-white transition-colors hover:bg-[#132846]">
                        Go Home
                      </Link>
                    </div>
                  }
                />
              </Routes>
            </Suspense>
          </main>
          <Footer />
          <SOSButton />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}
