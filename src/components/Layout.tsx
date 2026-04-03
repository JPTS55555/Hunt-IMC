import { Outlet, Link, useLocation } from 'react-router-dom';
import { logOut } from '../firebase';
import { Compass, MessageSquare, Camera, MapPin, LogOut, Target, ChefHat } from 'lucide-react';

export default function Layout() {
  const location = useLocation();

  const navItems = [
    { path: '/', icon: Compass, label: 'Bússola' },
    { path: '/plan', icon: Target, label: 'Plano' },
    { path: '/coach', icon: MessageSquare, label: 'Coach' },
    { path: '/fridge', icon: ChefHat, label: 'Receitas' },
  ];

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      {/* Top Header */}
      <header className="bg-slate-800 border-b border-slate-700 p-4 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center gap-2 text-teal-400">
          <Compass className="w-6 h-6" />
          <h1 className="text-xl font-bold tracking-tight">BioBússola</h1>
        </div>
        <button 
          onClick={logOut}
          className="p-2 text-slate-400 hover:text-coral-400 transition-colors"
          title="Sair"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-20">
        <Outlet />
      </main>

      {/* Bottom Navigation (Mobile First) */}
      <nav className="fixed bottom-0 w-full bg-slate-800 border-t border-slate-700 flex justify-around items-center p-3 pb-safe z-10">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <Link 
              key={item.path} 
              to={item.path}
              className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
                isActive ? 'text-teal-400 bg-slate-700/50' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className={`w-6 h-6 ${isActive ? 'fill-teal-400/20' : ''}`} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
