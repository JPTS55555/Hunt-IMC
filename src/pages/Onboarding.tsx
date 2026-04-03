import { useState } from 'react';
import { signInWithGoogle } from '../firebase';
import { Compass, AlertCircle, Target, MessageSquare, ChefHat, Activity, ArrowRight, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Onboarding() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      setError(err.message || 'Erro ao iniciar sessão. Tenta novamente.');
    } finally {
      setLoading(false);
    }
  };

  const features = [
    {
      icon: <Activity className="w-6 h-6 text-teal-400" />,
      title: "GPS de Saúde",
      description: "Acompanha o teu progresso com um simulador de rotas realista e um BioScore baseado nos teus hábitos diários."
    },
    {
      icon: <MessageSquare className="w-6 h-6 text-coral-400" />,
      title: "Coach AI Pessoal",
      description: "Um assistente inteligente e empático que conhece os teus objetivos e te motiva todos os dias."
    },
    {
      icon: <ChefHat className="w-6 h-6 text-yellow-400" />,
      title: "Chef de Frigorífico",
      description: "Tira uma foto aos teus ingredientes e a IA cria receitas saudáveis que respeitam a tua dieta e intolerâncias."
    },
    {
      icon: <Target className="w-6 h-6 text-blue-400" />,
      title: "Planos de Ação",
      description: "Análise visual do teu físico para gerar planos de treino e nutrição a longo prazo."
    }
  ];

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans overflow-x-hidden">
      {/* Hero Section */}
      <div className="relative pt-20 pb-16 px-6 sm:pt-32 sm:pb-24 lg:pb-32">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-teal-500/10 blur-3xl rounded-full"></div>
          <div className="absolute top-40 -left-40 w-96 h-96 bg-coral-500/10 blur-3xl rounded-full"></div>
        </div>
        
        <div className="relative max-w-5xl mx-auto text-center">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="flex justify-center mb-6"
          >
            <div className="p-4 bg-slate-800/50 rounded-3xl border border-slate-700 backdrop-blur-sm">
              <Compass className="w-16 h-16 text-teal-400" />
            </div>
          </motion.div>
          
          <motion.h1 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-5xl sm:text-6xl font-extrabold tracking-tight mb-6"
          >
            A tua <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-blue-500">BioBússola</span>
          </motion.h1>
          
          <motion.p 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto mb-10"
          >
            O teu GPS de Saúde inteligente. Sem julgamentos, apenas rotas realistas e personalizadas com Inteligência Artificial para atingires a tua melhor versão.
          </motion.p>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col items-center gap-4"
          >
            {error && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-xl flex items-center gap-3 max-w-md text-left w-full">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <p className="text-sm">{error}</p>
              </div>
            )}

            <button
              onClick={handleLogin}
              disabled={loading}
              className="group bg-teal-500 hover:bg-teal-400 text-slate-900 font-bold py-4 px-8 rounded-full shadow-lg shadow-teal-500/20 transition-all flex items-center gap-3 disabled:opacity-70 text-lg w-full sm:w-auto justify-center"
            >
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-6 h-6 bg-white rounded-full p-1" />
              {loading ? 'A iniciar sessão...' : 'Começar com o Google'}
              {!loading && <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
            </button>
            
            <div className="flex items-center gap-2 text-sm text-slate-500 mt-4">
              <ShieldCheck className="w-4 h-4" />
              <span>Os teus dados são privados e seguros.</span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-16 px-6 bg-slate-800/50 border-y border-slate-800">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-100 mb-4">Tudo o que precisas numa só app</h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              A BioBússola utiliza os modelos mais avançados de Inteligência Artificial para te guiar na tua jornada de saúde e fitness.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-8">
            {features.map((feature, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="bg-slate-800 p-6 rounded-3xl border border-slate-700 hover:border-teal-500/30 transition-colors"
              >
                <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center mb-4 border border-slate-700">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-slate-200 mb-2">{feature.title}</h3>
                <p className="text-slate-400 leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer CTA */}
      <div className="py-20 px-6 text-center">
        <h2 className="text-3xl font-bold text-slate-100 mb-8">Pronto para mudar de vida?</h2>
        <button
          onClick={handleLogin}
          disabled={loading}
          className="bg-slate-100 hover:bg-white text-slate-900 font-bold py-4 px-8 rounded-full shadow-lg transition-all flex items-center gap-3 disabled:opacity-70 text-lg mx-auto"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-6 h-6 bg-white rounded-full p-1" />
          {loading ? 'A iniciar sessão...' : 'Entrar com o Google'}
        </button>
      </div>
    </div>
  );
}
