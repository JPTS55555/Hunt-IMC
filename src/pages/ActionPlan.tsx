import { useState } from 'react';
import { db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';
import { generateActionPlan } from '../lib/gemini';
import { Camera, Loader2, Sparkles, Target, Activity, Calendar, Zap, BrainCircuit } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ActionPlan({ user }: { user: any }) {
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<any>(null);
  const [image, setImage] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [depth, setDepth] = useState<'rapida' | 'profunda'>('rapida');

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const generatePlan = async () => {
    if (!image) {
      setError('Por favor, tira ou faz upload de uma foto do teu físico para a IA analisar.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      // 1. Fetch user profile
      const docRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        setError('Perfil não encontrado. Por favor, configura o teu perfil primeiro.');
        setLoading(false);
        return;
      }
      const profile = docSnap.data();

      // 2. Call Gemini to analyze image and generate plan
      const base64Data = image.split(',')[1];
      const mimeType = image.split(';')[0].split(':')[1];

      const generatedPlan = await generateActionPlan(base64Data, mimeType, profile, depth);
      setPlan(generatedPlan);
      
      // Save plan to Firestore
      await setDoc(doc(db, 'users', user.uid, 'plans', 'current'), {
        ...generatedPlan,
        depth,
        createdAt: new Date().toISOString()
      });
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Ocorreu um erro ao gerar o plano. Tenta novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 max-w-4xl mx-auto space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
          <Target className="w-6 h-6 text-teal-400" />
          Plano de Ação IA
        </h2>
        <p className="text-slate-400 mt-1">Define objetivos a longo prazo com base no teu físico atual.</p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      {!plan ? (
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-slate-800 rounded-2xl p-6 border border-slate-700 shadow-xl"
        >
          <div className="text-center space-y-4">
            <div className="w-20 h-20 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <Camera className="w-10 h-10 text-teal-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-200">Análise de Físico</h3>
            <p className="text-slate-400 text-sm max-w-sm mx-auto">
              Tira uma foto ou faz upload de uma imagem do teu físico atual para a IA analisar a tua composição corporal e gerar um plano de dieta e treino personalizado.
            </p>
            
            {image && (
              <div className="mt-4 relative w-full max-w-xs mx-auto aspect-[3/4] rounded-xl overflow-hidden border-2 border-teal-500/30">
                <img src={image} alt="Preview" className="w-full h-full object-cover" />
              </div>
            )}

            <div className="pt-4 flex flex-col gap-4 max-w-xs mx-auto">
              <label className="bg-slate-700 hover:bg-slate-600 text-slate-200 font-medium py-3 px-4 rounded-xl cursor-pointer transition-colors flex items-center justify-center gap-2">
                <Camera className="w-5 h-5" />
                {image ? 'Mudar Foto' : 'Tirar Foto / Upload'}
                <input 
                  type="file" 
                  accept="image/*" 
                  capture="environment"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>

              <div className="bg-slate-900/50 p-1 rounded-xl flex">
                <button
                  onClick={() => setDepth('rapida')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-colors ${depth === 'rapida' ? 'bg-slate-700 text-teal-400' : 'text-slate-400 hover:text-slate-300'}`}
                >
                  <Zap className="w-4 h-4" /> Rápida
                </button>
                <button
                  onClick={() => setDepth('profunda')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-colors ${depth === 'profunda' ? 'bg-slate-700 text-coral-400' : 'text-slate-400 hover:text-slate-300'}`}
                >
                  <BrainCircuit className="w-4 h-4" /> Profunda
                </button>
              </div>
              <p className="text-[10px] text-slate-500 text-center -mt-2">
                {depth === 'profunda' ? 'Análise detalhada usando Gemini Pro (pode demorar mais).' : 'Análise rápida usando Gemini Flash Lite.'}
              </p>
              
              <button
                onClick={generatePlan}
                disabled={!image || loading}
                className="bg-teal-500 hover:bg-teal-400 text-slate-900 font-bold py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                {loading ? 'A analisar...' : 'Gerar Plano IA'}
              </button>
            </div>
          </div>
        </motion.div>
      ) : (
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="space-y-6"
        >
          <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-200 flex items-center gap-2 mb-4">
              <Activity className="w-5 h-5 text-teal-400" />
              Análise do Físico
            </h3>
            <p className="text-slate-300 leading-relaxed">{plan.analysis}</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 shadow-xl">
              <h3 className="text-lg font-semibold text-slate-200 flex items-center gap-2 mb-4">
                <Target className="w-5 h-5 text-coral-400" />
                Plano de Dieta
              </h3>
              <ul className="space-y-3">
                {plan.diet.map((item: string, idx: number) => (
                  <li key={idx} className="flex gap-3 text-slate-300">
                    <span className="text-coral-400 font-bold">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 shadow-xl">
              <h3 className="text-lg font-semibold text-slate-200 flex items-center gap-2 mb-4">
                <Activity className="w-5 h-5 text-blue-400" />
                Plano de Treino
              </h3>
              <ul className="space-y-3">
                {plan.workout.map((item: string, idx: number) => (
                  <li key={idx} className="flex gap-3 text-slate-300">
                    <span className="text-blue-400 font-bold">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="bg-teal-500/10 border border-teal-500/30 rounded-2xl p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-teal-500/20 flex items-center justify-center shrink-0">
              <Calendar className="w-6 h-6 text-teal-400" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-teal-400 uppercase tracking-wider mb-1">Estimativa de Tempo</h4>
              <p className="text-slate-200 font-medium">{plan.timeline}</p>
            </div>
          </div>

          <button
            onClick={() => { setPlan(null); setImage(null); }}
            className="w-full bg-slate-700 hover:bg-slate-600 text-slate-200 font-medium py-3 px-4 rounded-xl transition-colors"
          >
            Refazer Análise
          </button>
        </motion.div>
      )}
    </div>
  );
}
