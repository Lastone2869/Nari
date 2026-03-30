// src/App.jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import SOSButton from './components/SOSButton';
import ProtectedRoute from './components/ProtectedRoute';

import Home from './pages/Home';
import Login from './pages/Login';
import Report from './pages/Report';
import Track from './pages/Track';
import Evidence from './pages/Evidence';
import SafetyMap from './pages/SafetyMap';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen flex flex-col noise">
          <Navbar />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/report" element={<Report />} />
              <Route path="/track/:id?" element={<Track />} />
              <Route path="/map" element={<SafetyMap />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route
                path="/evidence"
                element={
                  <ProtectedRoute>
                    <Evidence />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />
              {/* 404 */}
              <Route
                path="*"
                element={
                  <div className="min-h-screen flex flex-col items-center justify-center text-center px-4 pt-20">
                    <div className="text-6xl mb-4">🔦</div>
                    <h2 className="font-display text-3xl font-bold gradient-text mb-2">Page Not Found</h2>
                    <p className="text-gray-500 mb-6">The page you're looking for doesn't exist.</p>
                    <a href="/" className="px-6 py-3 rounded-xl bg-violet-600 text-white font-semibold hover:bg-violet-700 transition-colors">
                      Go Home
                    </a>
                  </div>
                }
              />
            </Routes>
          </main>
          <Footer />
          <SOSButton />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}
