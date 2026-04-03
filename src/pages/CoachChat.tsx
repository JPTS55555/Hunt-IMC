import { useState, useRef, useEffect } from 'react';
import { getHealthAdviceWithThinking } from '../lib/gemini';
import { Send, Bot, User, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { db } from '../firebase';
import { doc, getDoc, collection, getDocs, setDoc } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';

export default function CoachChat({ user }: { user: any }) {
  const [messages, setMessages] = useState<{role: 'user'|'model', text: string}[]>([
    { role: 'model', text: 'Olá! Sou o teu Coach BioBússola. Como te estás a sentir hoje em relação aos teus objetivos?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [communityData, setCommunityData] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      try {
        // Fetch chat history
        const chatRef = doc(db, 'users', user.uid, 'chats', 'coach');
        const chatSnap = await getDoc(chatRef);
        if (chatSnap.exists() && chatSnap.data().messages) {
          setMessages(chatSnap.data().messages);
        }

        // Fetch user profile
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProfile(docSnap.data());
        }

        // Fetch anonymized community data
        const usersRef = collection(db, 'users');
        const usersSnap = await getDocs(usersRef);
        
        let totalWeight = 0;
        let totalTarget = 0;
        let count = 0;
        const goals: Record<string, number> = {};

        usersSnap.forEach((doc) => {
          const data = doc.data();
          if (data.currentWeight) totalWeight += data.currentWeight;
          if (data.targetWeight) totalTarget += data.targetWeight;
          if (data.goal) {
            goals[data.goal] = (goals[data.goal] || 0) + 1;
          }
          count++;
        });

        if (count > 0) {
          setCommunityData({
            averageWeight: Math.round(totalWeight / count),
            averageTarget: Math.round(totalTarget / count),
            totalUsers: count,
            commonGoals: Object.entries(goals)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 3)
              .map(([goal]) => goal)
          });
        }
      } catch (err) {
        console.error("Error fetching data for coach:", err);
      }
    };
    fetchData();
  }, [user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const saveChatHistory = async (newMessages: {role: 'user'|'model', text: string}[]) => {
    if (!user) return;
    try {
      await setDoc(doc(db, 'users', user.uid, 'chats', 'coach'), {
        messages: newMessages,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    } catch (error) {
      console.error("Error saving chat history:", error);
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userMsg = input;
    const newMessagesWithUser = [...messages, { role: 'user' as const, text: userMsg }];
    setMessages(newMessagesWithUser);
    setInput('');
    setLoading(true);
    
    // Save immediately after user sends
    await saveChatHistory(newMessagesWithUser);

    const response = await getHealthAdviceWithThinking(userMsg, profile, communityData);
    
    const newMessagesWithAI = [...newMessagesWithUser, { role: 'model' as const, text: response }];
    setMessages(newMessagesWithAI);
    setLoading(false);
    
    // Save again after AI responds
    await saveChatHistory(newMessagesWithAI);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-130px)] max-w-2xl mx-auto">
      <div className="p-4 border-b border-slate-700 bg-slate-800/50">
        <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
          <Bot className="w-5 h-5 text-teal-400" />
          Coach AI
        </h2>
        <p className="text-xs text-slate-400">Aconselhamento personalizado com Gemini Pro</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, idx) => (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            key={idx} 
            className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-coral-500' : 'bg-teal-500'}`}>
              {msg.role === 'user' ? <User className="w-4 h-4 text-white" /> : <Sparkles className="w-4 h-4 text-slate-900" />}
            </div>
            <div className={`max-w-[80%] p-3 rounded-2xl ${msg.role === 'user' ? 'bg-coral-500/20 text-coral-100 rounded-tr-none' : 'bg-slate-800 text-slate-200 rounded-tl-none border border-slate-700'}`}>
              <p className="text-sm whitespace-pre-wrap">{msg.text.replace(/[*#_]/g, '')}</p>
            </div>
          </motion.div>
        ))}
        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-teal-500 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 text-slate-900 animate-pulse" />
            </div>
            <div className="bg-slate-800 p-3 rounded-2xl rounded-tl-none border border-slate-700 flex items-center gap-1">
              <div className="w-2 h-2 bg-teal-400 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-2 h-2 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-slate-800 border-t border-slate-700">
        <div className="flex gap-2">
          <input 
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Pergunta sobre nutrição, treino..."
            className="flex-1 bg-slate-900 border border-slate-700 rounded-full px-4 py-2 text-slate-200 focus:outline-none focus:border-teal-500 transition-colors"
          />
          <button 
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="w-10 h-10 rounded-full bg-teal-500 flex items-center justify-center text-slate-900 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-teal-400 transition-colors"
          >
            <Send className="w-4 h-4 ml-1" />
          </button>
        </div>
      </div>
    </div>
  );
}
