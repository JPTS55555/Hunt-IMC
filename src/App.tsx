/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDocFromServer } from 'firebase/firestore';
import { auth, db } from './firebase';
import Dashboard from './pages/Dashboard';
import Onboarding from './pages/Onboarding';
import CoachChat from './pages/CoachChat';
import VisionAnalyzer from './pages/VisionAnalyzer';
import Explore from './pages/Explore';
import Layout from './components/Layout';
import ActionPlan from './pages/ActionPlan';
import FridgeChef from './pages/FridgeChef';
import SetupProfile from './pages/SetupProfile';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function testConnection() {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if(error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration. ");
        }
      }
    }
    testConnection();

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
        
        {/* Setup Route (No Layout) */}
        <Route path="/setup" element={user ? <SetupProfile user={user} /> : <Navigate to="/login" />} />

        {/* Protected Routes */}
        <Route path="/" element={user ? <Layout /> : <Navigate to="/login" />}>
          <Route index element={<Dashboard user={user} />} />
          <Route path="coach" element={<CoachChat user={user} />} />
          <Route path="vision" element={<VisionAnalyzer user={user} />} />
          <Route path="plan" element={<ActionPlan user={user} />} />
          <Route path="fridge" element={<FridgeChef user={user} />} />
          <Route path="explore" element={<Explore user={user} />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

