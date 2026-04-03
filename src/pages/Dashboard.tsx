import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, getDoc, setDoc, collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { motion } from 'framer-motion';
import { generateMicroHabits } from '../lib/gemini';
import { Settings, Target, Activity, Droplets, Moon, Flame } from 'lucide-react';
import { format, addWeeks } from 'date-fns';
import { pt } from 'date-fns/locale';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';
import { useNavigate } from 'react-router-dom';

export default function Dashboard({ user }: { user: any }) {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [habits, setHabits] = useState<string[]>([]);
  const [routeData, setRouteData] = useState<any[]>([]);

  const calculateBMI = (weight: number, heightCm: number) => {
    if (!weight || !heightCm) return 0;
    const heightM = heightCm / 100;
    return (weight / (heightM * heightM)).toFixed(1);
  };

  const getBMICategory = (bmi: number) => {
    if (bmi < 18.5) return { label: 'Abaixo do peso', color: 'text-blue-400', bg: 'bg-blue-400/20' };
    if (bmi >= 18.5 && bmi < 25) return { label: 'Peso normal', color: 'text-teal-400', bg: 'bg-teal-400/20' };
    if (bmi >= 25 && bmi < 30) return { label: 'Excesso de peso', color: 'text-yellow-400', bg: 'bg-yellow-400/20' };
    return { label: 'Obesidade', color: 'text-coral-500', bg: 'bg-coral-500/20' };
  };

  useEffect(() => {
    loadProfile();
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;
    try {
      const docRef = doc(db, 'users', user.uid);
      let docSnap;
      try {
        docSnap = await getDoc(docRef);
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
        return;
      }
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        setProfile(data);
        generateRoute(data.currentWeight, data.targetWeight);
        // Load habits or generate new ones
        const h = await generateMicroHabits("Perder peso de forma saudável", data.currentWeight, data.targetWeight);
        setHabits(h);
      } else {
        // Redirect to setup if profile doesn't exist
        navigate('/setup');
      }
    } catch (error) {
      console.error("Error loading profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateRoute = (current: number, target: number) => {
    // Simulate a healthy 0.5kg change per week
    const diff = target - current;
    const weeksNeeded = Math.abs(diff) / 0.5;
    const data = [];
    let currentW = current;
    
    for (let i = 0; i <= weeksNeeded; i++) {
      data.push({
        week: format(addWeeks(new Date(), i), 'dd MMM', { locale: pt }),
        peso: parseFloat(currentW.toFixed(1)),
        objetivo: target
      });
      currentW += (diff > 0 ? 0.5 : -0.5);
    }
    setRouteData(data);
  };

  if (loading) return <div className="p-6 text-center text-slate-400">A calcular a tua rota...</div>;

  const bmi = profile ? calculateBMI(profile.currentWeight, profile.height) : 0;
  const bmiCategory = getBMICategory(Number(bmi));

  return (
    <div className="p-4 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-100">Olá, {profile?.name?.split(' ')[0] || 'Viajante'}</h2>
          <p className="text-slate-400">Aqui está o teu GPS de Saúde para hoje.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/setup')}
            className="p-2 rounded-full bg-slate-800 border border-slate-700 text-slate-400 hover:text-teal-400 transition-colors"
            title="Editar Perfil"
          >
            <Settings className="w-5 h-5" />
          </button>
          <div className="w-12 h-12 rounded-full bg-slate-800 border-2 border-teal-500/30 flex items-center justify-center text-teal-400 overflow-hidden shrink-0">
            {user?.photoURL ? (
              <img src={user.photoURL} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <Target className="w-6 h-6" />
            )}
          </div>
        </div>
      </div>

      {/* Calculadora de IMC */}
      {profile && (
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-slate-800 rounded-2xl p-5 border border-slate-700 shadow-xl flex items-center justify-between"
        >
          <div>
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-1">O teu IMC Atual</h3>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-slate-100">{bmi}</span>
              <span className={`text-sm font-medium px-2 py-1 rounded-md ${bmiCategory.color} ${bmiCategory.bg}`}>
                {bmiCategory.label}
              </span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-slate-400 mb-1">Altura: {profile.height}cm</div>
            <div className="text-xs text-slate-400">Peso: {profile.currentWeight}kg</div>
          </div>
        </motion.div>
      )}

      {/* Simulador de Rotas */}
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-slate-800 rounded-2xl p-5 border border-slate-700 shadow-xl"
      >
        <div className="flex justify-between items-end mb-6">
          <div>
            <h3 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
              <Activity className="w-5 h-5 text-coral-400" />
              Simulador de Rota
            </h3>
            <p className="text-sm text-slate-400">Previsão realista: 0.5kg/semana</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-teal-400">{profile?.currentWeight} <span className="text-sm text-slate-500">kg</span></div>
            <div className="text-sm text-slate-400">Objetivo: {profile?.targetWeight} kg</div>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={routeData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
              <XAxis dataKey="week" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis domain={['dataMin - 2', 'dataMax + 2']} stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#f8fafc' }}
                itemStyle={{ color: '#2dd4bf' }}
              />
              <ReferenceLine y={profile?.targetWeight} stroke="#fb7185" strokeDasharray="3 3" label={{ position: 'top', value: 'Objetivo', fill: '#fb7185', fontSize: 12 }} />
              <Line type="monotone" dataKey="peso" stroke="#2dd4bf" strokeWidth={3} dot={{ r: 4, fill: '#2dd4bf', strokeWidth: 0 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Micro-Hábitos */}
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <h3 className="text-lg font-semibold text-slate-200 mb-4">Micro-Hábitos de Hoje</h3>
        <div className="grid gap-3">
          {habits.map((habit, idx) => (
            <div key={idx} className="bg-slate-800 rounded-xl p-4 border border-slate-700 flex items-center gap-4 active:scale-[0.98] transition-transform">
              <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-teal-400 shrink-0">
                {idx === 0 ? <Droplets className="w-5 h-5" /> : idx === 1 ? <Flame className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </div>
              <div className="flex-1">
                <p className="text-slate-200 font-medium">{habit}</p>
              </div>
              <div className="w-6 h-6 rounded-full border-2 border-slate-600"></div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
