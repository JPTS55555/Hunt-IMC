import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';
import { Compass, ArrowRight, Loader2, X } from 'lucide-react';
import { motion } from 'framer-motion';

export default function SetupProfile({ user }: { user: any }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    currentWeight: '',
    targetWeight: '',
    height: '',
    gender: 'Feminino',
    birthDate: '',
    diet: 'Omnívoro',
    intolerances: 'Nenhuma'
  });
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [hasExistingProfile, setHasExistingProfile] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      try {
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setFormData({
            currentWeight: data.currentWeight?.toString() || '',
            targetWeight: data.targetWeight?.toString() || '',
            height: data.height?.toString() || '',
            gender: data.gender || 'Feminino',
            birthDate: data.birthDate || '',
            diet: data.diet || 'Omnívoro',
            intolerances: data.intolerances || 'Nenhuma'
          });
          setHasExistingProfile(true);
        }
      } catch (err) {
        console.error("Error fetching profile:", err);
      } finally {
        setInitialLoad(false);
      }
    };
    fetchProfile();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.currentWeight || !formData.targetWeight || !formData.height || !formData.birthDate) {
      setError('Por favor, preenche todos os campos.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const profileData: any = {
        uid: user.uid,
        email: user.email,
        name: user.displayName || 'Viajante',
        currentWeight: parseFloat(formData.currentWeight),
        targetWeight: parseFloat(formData.targetWeight),
        height: parseFloat(formData.height),
        gender: formData.gender,
        birthDate: formData.birthDate,
        diet: formData.diet,
        intolerances: formData.intolerances
      };
      
      if (!hasExistingProfile) {
        profileData.createdAt = new Date().toISOString();
      }
      
      await setDoc(doc(db, 'users', user.uid), profileData, { merge: true });
      navigate('/');
    } catch (err) {
      console.error(err);
      setError('Erro ao guardar o perfil. Tenta novamente.');
      handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`);
    } finally {
      setLoading(false);
    }
  };

  if (initialLoad) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-teal-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 relative">
      {hasExistingProfile && (
        <button 
          onClick={() => navigate('/')}
          className="absolute top-6 right-6 p-2 rounded-full bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
      )}
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="w-full max-w-md bg-slate-800 p-8 rounded-3xl border border-slate-700 shadow-xl"
      >
        <div className="text-center mb-8">
          <Compass className="w-12 h-12 text-teal-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-100">
            {hasExistingProfile ? 'Editar Perfil' : 'Configura a tua Bússola'}
          </h2>
          <p className="text-slate-400 text-sm mt-2">
            {hasExistingProfile ? 'Atualiza os teus dados para recalcularmos a tua rota.' : 'Precisamos de alguns dados para traçar a tua rota ideal.'}
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-xl text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Peso Atual (kg)</label>
              <input 
                type="number" 
                step="0.1"
                value={formData.currentWeight}
                onChange={e => setFormData({...formData, currentWeight: e.target.value})}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:border-teal-500"
                placeholder="Ex: 75.5"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Objetivo (kg)</label>
              <input 
                type="number" 
                step="0.1"
                value={formData.targetWeight}
                onChange={e => setFormData({...formData, targetWeight: e.target.value})}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:border-teal-500"
                placeholder="Ex: 68.0"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Altura (cm)</label>
              <input 
                type="number" 
                value={formData.height}
                onChange={e => setFormData({...formData, height: e.target.value})}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:border-teal-500"
                placeholder="Ex: 170"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Género</label>
              <select 
                value={formData.gender}
                onChange={e => setFormData({...formData, gender: e.target.value})}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:border-teal-500 appearance-none"
              >
                <option>Feminino</option>
                <option>Masculino</option>
                <option>Outro</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Dieta</label>
              <select 
                value={formData.diet}
                onChange={e => setFormData({...formData, diet: e.target.value})}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:border-teal-500 appearance-none"
              >
                <option>Omnívoro</option>
                <option>Vegetariano</option>
                <option>Vegan</option>
                <option>Pescatariano</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Intolerâncias</label>
              <select 
                value={formData.intolerances}
                onChange={e => setFormData({...formData, intolerances: e.target.value})}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:border-teal-500 appearance-none"
              >
                <option>Nenhuma</option>
                <option>Lactose</option>
                <option>Glúten</option>
                <option>Frutos Secos</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Data de Nascimento</label>
            <input 
              type="date" 
              value={formData.birthDate}
              onChange={e => setFormData({...formData, birthDate: e.target.value})}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:border-teal-500 [color-scheme:dark]"
            />
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full mt-6 bg-teal-500 hover:bg-teal-400 text-slate-900 font-semibold py-3 px-4 rounded-xl transition-colors flex justify-center items-center gap-2 disabled:opacity-70"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
              <>
                {hasExistingProfile ? 'Guardar Alterações' : 'Começar a Jornada'} 
                {!hasExistingProfile && <ArrowRight className="w-5 h-5" />}
              </>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
