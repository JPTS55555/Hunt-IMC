import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';
import { generateFridgeRecipe } from '../lib/gemini';
import { Camera, Loader2, Sparkles, ChefHat, Utensils, Info } from 'lucide-react';
import { motion } from 'framer-motion';

export default function FridgeChef({ user }: { user: any }) {
  const [loading, setLoading] = useState(false);
  const [recipe, setRecipe] = useState<any>(null);
  const [image, setImage] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      try {
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProfile(docSnap.data());
        }
      } catch (err) {
        console.error("Error fetching profile:", err);
      }
    };
    fetchProfile();
  }, [user]);

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

  const generateRecipe = async () => {
    if (!image || !profile) return;
    
    setLoading(true);
    setError('');
    
    try {
      const base64Data = image.split(',')[1];
      const mimeType = image.split(';')[0].split(':')[1];

      const generatedRecipe = await generateFridgeRecipe(base64Data, mimeType, profile);
      setRecipe(generatedRecipe);
      
      // Save recipe to Firestore history
      const recipeId = Date.now().toString();
      await setDoc(doc(db, 'users', user.uid, 'recipes', recipeId), {
        ...generatedRecipe,
        createdAt: new Date().toISOString()
      });
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Ocorreu um erro ao gerar a receita. Tenta novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 max-w-4xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <div className="w-16 h-16 bg-teal-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <ChefHat className="w-8 h-8 text-teal-400" />
        </div>
        <h2 className="text-2xl font-bold text-slate-100">Chef de Frigorífico</h2>
        <p className="text-slate-400 text-sm max-w-md mx-auto">
          Tira uma foto ao teu frigorífico ou despensa. A IA vai criar uma receita saudável baseada no que tens, respeitando a tua dieta ({profile?.diet || 'Omnívoro'}) e intolerâncias ({profile?.intolerances || 'Nenhuma'}).
        </p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-xl text-sm text-center">
          {error}
        </div>
      )}

      {!recipe ? (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-800 rounded-3xl p-6 border border-slate-700 shadow-xl"
        >
          <div className="space-y-6">
            {image && (
              <div className="relative w-full max-w-sm mx-auto aspect-video rounded-xl overflow-hidden border-2 border-teal-500/30">
                <img src={image} alt="Frigorífico" className="w-full h-full object-cover" />
              </div>
            )}

            <div className="flex flex-col gap-4 max-w-sm mx-auto">
              <label className="bg-slate-700 hover:bg-slate-600 text-slate-200 font-medium py-3 px-4 rounded-xl cursor-pointer transition-colors flex items-center justify-center gap-2">
                <Camera className="w-5 h-5" />
                {image ? 'Mudar Foto' : 'Tirar Foto ao Frigorífico'}
                <input 
                  type="file" 
                  accept="image/*" 
                  capture="environment"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
              
              <button
                onClick={generateRecipe}
                disabled={!image || loading}
                className="bg-teal-500 hover:bg-teal-400 text-slate-900 font-bold py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                {loading ? 'A criar receita...' : 'Gerar Receita IA'}
              </button>
            </div>
          </div>
        </motion.div>
      ) : (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-slate-800 rounded-3xl overflow-hidden border border-slate-700 shadow-xl"
        >
          <div className="bg-teal-500/10 p-6 border-b border-teal-500/20">
            <h3 className="text-2xl font-bold text-teal-400 mb-2">{recipe.title}</h3>
            <p className="text-slate-300 text-sm">{recipe.description}</p>
          </div>
          
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-slate-900/50 p-3 rounded-xl text-center border border-slate-700">
                <div className="text-xs text-slate-400 mb-1">Calorias</div>
                <div className="font-bold text-slate-200">{recipe.macros.calories}</div>
              </div>
              <div className="bg-slate-900/50 p-3 rounded-xl text-center border border-slate-700">
                <div className="text-xs text-slate-400 mb-1">Proteína</div>
                <div className="font-bold text-slate-200">{recipe.macros.protein}</div>
              </div>
              <div className="bg-slate-900/50 p-3 rounded-xl text-center border border-slate-700">
                <div className="text-xs text-slate-400 mb-1">Tempo</div>
                <div className="font-bold text-slate-200">{recipe.time}</div>
              </div>
            </div>

            <div>
              <h4 className="text-lg font-semibold text-slate-200 mb-3 flex items-center gap-2">
                <Utensils className="w-5 h-5 text-coral-400" />
                Ingredientes Encontrados
              </h4>
              <ul className="space-y-2">
                {recipe.ingredients.map((ing: string, i: number) => (
                  <li key={i} className="flex items-center gap-2 text-slate-300 text-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-teal-400"></div>
                    {ing}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-lg font-semibold text-slate-200 mb-3 flex items-center gap-2">
                <Info className="w-5 h-5 text-blue-400" />
                Instruções
              </h4>
              <ol className="space-y-4">
                {recipe.instructions.map((step: string, i: number) => (
                  <li key={i} className="flex gap-3 text-slate-300 text-sm">
                    <span className="font-bold text-slate-500">{i + 1}.</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            <button
              onClick={() => {
                setRecipe(null);
                setImage(null);
              }}
              className="w-full bg-slate-700 hover:bg-slate-600 text-slate-200 font-medium py-3 px-4 rounded-xl transition-colors"
            >
              Fazer Nova Receita
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
