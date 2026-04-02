/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';
import Dashboard from './pages/Dashboard';
import Onboarding from './pages/Onboarding';
import CoachChat from './pages/CoachChat';
import VisionAnalyzer from './pages/VisionAnalyzer';
import Explore from './pages/Explore';
import Layout from './components/Layout';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-teal-400">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-400"></div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Route */}
        <Route path="/login" element={!user ? <Onboarding /> : <Navigate to="/" />} />
        
        {/* Protected Routes */}
        <Route path="/" element={user ? <Layout /> : <Navigate to="/login" />}>
          <Route index element={<Dashboard user={user} />} />
          <Route path="coach" element={<CoachChat user={user} />} />
          <Route path="vision" element={<VisionAnalyzer user={user} />} />
          <Route path="explore" element={<Explore user={user} />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

