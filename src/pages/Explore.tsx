import { useState } from 'react';
import { searchHealthyPlaces } from '../lib/gemini';
import { MapPin, Search, Loader2, ExternalLink } from 'lucide-react';

export default function Explore({ user }: { user: any }) {
  const [location, setLocation] = useState('');
  const [results, setResults] = useState<{text: string, places: any[]}>({ text: '', places: [] });
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!location.trim()) return;
    setLoading(true);
    const res = await searchHealthyPlaces(location);
    setResults(res);
    setLoading(false);
  };

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-100 mb-2">Explorar</h2>
        <p className="text-slate-400">Encontra restaurantes saudáveis, ginásios ou parques perto de ti.</p>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input 
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Ex: Lisboa, Porto..."
            className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-slate-200 focus:outline-none focus:border-teal-500 transition-colors"
          />
        </div>
        <button 
          onClick={handleSearch}
          disabled={loading || !location.trim()}
          className="bg-teal-500 hover:bg-teal-400 text-slate-900 px-6 rounded-xl font-semibold transition-colors disabled:opacity-50 flex items-center justify-center"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
        </button>
      </div>

      {results.text && (
        <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700 mt-6">
          <div className="prose prose-invert prose-teal max-w-none text-sm text-slate-300 whitespace-pre-wrap mb-6">
            {results.text}
          </div>

          {results.places && results.places.length > 0 && (
            <div className="space-y-3 border-t border-slate-700 pt-4">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Locais Encontrados</h3>
              {results.places.map((chunk: any, idx: number) => {
                if (chunk.web?.uri) {
                  return (
                    <a 
                      key={idx} 
                      href={chunk.web.uri} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="block bg-slate-900 p-3 rounded-lg border border-slate-700 hover:border-teal-500 transition-colors flex justify-between items-center group"
                    >
                      <span className="text-teal-400 text-sm font-medium truncate pr-4">{chunk.web.title || chunk.web.uri}</span>
                      <ExternalLink className="w-4 h-4 text-slate-500 group-hover:text-teal-400 shrink-0" />
                    </a>
                  );
                }
                return null;
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
