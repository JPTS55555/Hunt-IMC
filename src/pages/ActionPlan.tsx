import { useState } from 'react';
import { db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';
import { getGemini } from '../lib/gemini';
import { Camera, Loader2, Sparkles, Target, Activity, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ActionPlan({ user }: { user: any }) {
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<any>(null);
  const [image, setImage] = useState<string | null>(null);
  const [error, setError] = useState('');

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
      const ai = getGemini();
      const base64Data = image.split(',')[1];
      const mimeType = image.split(';')[0].split(':')[1];

      const prompt = `
        Analisa a imagem do físico deste utilizador.
        Dados do utilizador:
        - Peso atual: ${profile.currentWeight}kg
        - Objetivo: ${profile.targetWeight}kg
        - Altura: ${profile.height}cm
        - Género: ${profile.gender}

        Com base na imagem e nestes dados, gera um plano de ação a longo prazo.
        Retorna APENAS um objeto JSON com a seguinte estrutura exata:
        {
          "analysis": "Breve análise do físico atual e viabilidade do objetivo",
          "diet": [
            "Dica de dieta 1",
            "Dica de dieta 2",
            "Dica de dieta 3"
          ],
          "workout": [
            "Dica de treino 1",
            "Dica de treino 2",
            "Dica de treino 3"
          ],
          "timeline": "Estimativa realista de tempo para atingir o objetivo (ex: '3 a 4 meses')"
        }
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-lite-preview",
        contents: [
          {
            inlineData: {
              data: base64Data,
              mimeType: mimeType,
            }
          },
          prompt
        ],
        config: {
          responseMimeType: "application/json"
        }
      });

      if (response.text) {
        const generatedPlan = JSON.parse(response.text);
        setPlan(generatedPlan);
        
        // Save plan to Firestore
        await setDoc(doc(db, 'users', user.uid, 'plans', 'current'), {
          ...generatedPlan,
          createdAt: new Date().toISOString()
        });
      }
    } catch (err: any) {
      console.error(err);
      if (err.message?.includes('GEMINI_API_KEY')) {
        setError('A chave da API do Gemini não está configurada no Vercel. Por favor, adiciona a variável GEMINI_API_KEY e faz um novo Deploy.');
      } else {
        setError('Ocorreu um erro ao gerar o plano. Tenta novamente.');
      }
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

            <div className="pt-4 flex flex-col gap-3 max-w-xs mx-auto">
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
              
              <button
                onClick={generatePlan}
                disabled={!image || loading}
                className="bg-teal-500 hover:bg-teal-400 text-slate-900 font-bold py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
