import { useState, useRef } from 'react';
import { analyzeHealthImage } from '../lib/gemini';
import { Camera, Upload, X, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function VisionAnalyzer({ user }: { user: any }) {
  const [image, setImage] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>('');
  const [analysis, setAnalysis] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setMimeType(file.type);
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = (reader.result as string).split(',')[1];
      setImage(base64String);
      setAnalysis('');
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyze = async () => {
    if (!image) return;
    setLoading(true);
    const result = await analyzeHealthImage(image, mimeType);
    setAnalysis(result);
    setLoading(false);
  };

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-slate-100 mb-2">Análise Visual</h2>
        <p className="text-slate-400">Tira uma foto à tua refeição ou postura de treino para receber feedback instantâneo.</p>
      </div>

      {!image ? (
        <div 
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-slate-600 rounded-2xl p-12 text-center cursor-pointer hover:border-teal-400 hover:bg-slate-800/50 transition-all"
        >
          <Camera className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <p className="text-slate-300 font-medium">Toca para tirar foto ou fazer upload</p>
          <input 
            type="file" 
            accept="image/*" 
            className="hidden" 
            ref={fileInputRef}
            onChange={handleImageUpload}
          />
        </div>
      ) : (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-4"
        >
          <div className="relative rounded-2xl overflow-hidden border border-slate-700 bg-slate-800">
            <img src={`data:${mimeType};base64,${image}`} alt="Upload" className="w-full h-auto max-h-80 object-cover" />
            <button 
              onClick={() => { setImage(null); setAnalysis(''); }}
              className="absolute top-2 right-2 p-2 bg-slate-900/80 rounded-full text-slate-300 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {!analysis && !loading && (
            <button 
              onClick={handleAnalyze}
              className="w-full bg-teal-500 hover:bg-teal-400 text-slate-900 font-semibold py-3 rounded-xl transition-colors flex justify-center items-center gap-2"
            >
              <SparklesIcon /> Analisar Imagem
            </button>
          )}

          {loading && (
            <div className="flex flex-col items-center justify-center py-8 text-teal-400">
              <Loader2 className="w-8 h-8 animate-spin mb-2" />
              <p>A analisar com Gemini Pro...</p>
            </div>
          )}

          {analysis && (
            <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700">
              <h3 className="text-lg font-semibold text-slate-200 mb-3 flex items-center gap-2">
                <SparklesIcon /> Feedback
              </h3>
              <div className="prose prose-invert prose-teal max-w-none text-sm text-slate-300 whitespace-pre-wrap">
                {analysis}
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}

function SparklesIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
      <path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/>
    </svg>
  );
}
