import { useState } from 'react';
import { signInWithGoogle } from '../firebase';
import { Compass, AlertCircle } from 'lucide-react';
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

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-center">
      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="mb-8 text-teal-400"
      >
        <Compass className="w-24 h-24 mx-auto mb-4" />
        <h1 className="text-4xl font-bold text-slate-100 tracking-tight mb-2">BioBússola</h1>
        <p className="text-slate-400 text-lg max-w-md mx-auto">
          O teu GPS de Saúde. Sem julgamentos, apenas rotas realistas para a tua melhor versão.
        </p>
      </motion.div>

      {error && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-xl flex items-center gap-3 max-w-md text-left"
        >
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p className="text-sm">{error}</p>
        </motion.div>
      )}

      <motion.button
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        onClick={handleLogin}
        disabled={loading}
        className="bg-teal-500 hover:bg-teal-400 text-slate-900 font-semibold py-3 px-8 rounded-full shadow-lg shadow-teal-500/20 transition-all flex items-center gap-3 disabled:opacity-70"
      >
        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-6 h-6 bg-white rounded-full p-1" />
        {loading ? 'A iniciar sessão...' : 'Entrar com o Google'}
      </motion.button>
    </div>
  );
}
