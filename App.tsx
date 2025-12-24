import React, { useState } from 'react';
import { Settings, Shield, Lock, Loader2, AlertCircle, Ghost } from 'lucide-react';
import WireGuardControl from './components/WireGuardControl';
import { Language } from './types';
import { TRANSLATIONS } from './constants/translations';

const LANGUAGES: { code: Language; label: string; flag: string }[] = [
  { code: 'zh-TW', label: '繁體中文', flag: '🇹🇼' },
  { code: 'ja', label: '日本語', flag: '🇯🇵' },
  { code: 'th', label: 'ไทย', flag: '🇹🇭' },
  { code: 'en', label: 'English', flag: '🇺🇸' },
];

const App: React.FC = () => {
  const [baseUrl, setBaseUrl] = useState<string>('https://gateway.ccg.tw');
  const [password, setPassword] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [language, setLanguage] = useState<Language>('zh-TW');

  const t = TRANSLATIONS[language];

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setVerifying(true);
    setLoginError(null);
    
    setTimeout(() => {
      if (password === 'user123') {
        setIsLoggedIn(true);
        setLoginError(null);
      } else {
        setLoginError(t.login.error);
      }
      setVerifying(false);
    }, 500);
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#0d1117] text-gray-100 font-sans flex flex-col items-center justify-center p-4 selection:bg-orange-500 selection:text-white">
        <div className="absolute top-4 right-4 flex space-x-2">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => setLanguage(lang.code)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                language === lang.code 
                  ? 'bg-orange-600 text-white shadow-lg shadow-orange-900/20' 
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              <span className="mr-1.5">{lang.flag}</span>
              {lang.label}
            </button>
          ))}
        </div>

        <div className="max-w-md w-full bg-gray-800/30 backdrop-blur-xl border border-gray-700/50 rounded-3xl shadow-2xl p-10 animate-in fade-in zoom-in-95 duration-500">
          <div className="flex flex-col items-center mb-10 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-600 rounded-[2rem] flex items-center justify-center mb-6 shadow-2xl shadow-orange-900/30">
               <Ghost className="w-12 h-12 text-gray-900" strokeWidth={2.5} />
            </div>
            <div className="space-y-1">
              <h1 className="text-4xl font-black tracking-tighter text-white">
                GHOST
              </h1>
              <h2 className="text-sm font-bold tracking-[0.4em] text-orange-500 uppercase ml-1">
                SYSTEM
              </h2>
            </div>
            <p className="text-gray-500 text-xs mt-8 font-semibold tracking-widest uppercase">{t.login.restricted}</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2 px-1">
                {t.login.password}
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-4 w-5 h-5 text-gray-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full bg-[#0d1117]/80 border ${loginError ? 'border-red-500' : 'border-gray-700'} rounded-2xl py-4 pl-12 pr-4 text-white placeholder-gray-700 focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 outline-none transition-all font-mono text-lg`}
                  placeholder="••••"
                  required
                  autoFocus
                />
              </div>
            </div>

            {loginError && (
              <div className="bg-red-900/20 border border-red-500/50 rounded-xl p-3 flex items-start space-x-3 animate-in slide-in-from-top-1">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-red-200">{loginError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={verifying}
              className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 disabled:opacity-50 disabled:cursor-not-allowed text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-xl shadow-orange-900/40 active:scale-[0.98]"
            >
              {verifying ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>{t.login.verifying}</span>
                </>
              ) : (
                <>
                  <Lock className="w-5 h-5" />
                  <span>{t.login.unlock}</span>
                </>
              )}
            </button>
          </form>
          
          <div className="mt-10 text-center">
             <span className="text-[10px] text-gray-600 uppercase tracking-[0.2em] font-bold">{t.login.authOnly}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d1117] text-gray-100 font-sans selection:bg-orange-500 selection:text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0d1117]/90 backdrop-blur-md border-b border-gray-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-5 group cursor-default">
            <div className="bg-gradient-to-br from-yellow-400 to-orange-500 p-2 rounded-xl shadow-lg shadow-orange-900/20 transition-transform group-hover:rotate-6">
              <Ghost className="w-6 h-6 text-gray-900" strokeWidth={2.5} />
            </div>
            <div className="flex flex-col -space-y-1">
              <h1 className="text-xl font-black tracking-tighter text-white">
                GHOST
              </h1>
              <span className="text-[11px] font-black tracking-[0.25em] text-orange-500 uppercase">
                SYSTEM
              </span>
            </div>
          </div>
          
          <div className="flex items-center space-x-6">
            <div className="flex bg-[#161b22] rounded-xl p-1.5 space-x-1 border border-gray-800">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => setLanguage(lang.code)}
                  className={`px-3 py-1.5 rounded-lg transition-all flex items-center space-x-2 ${
                    language === lang.code 
                      ? 'bg-orange-600 text-white shadow-md' 
                      : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800'
                  }`}
                >
                  <span className="text-base">{lang.flag}</span>
                  <span className="text-xs font-bold uppercase hidden sm:inline">{lang.code.split('-')[0]}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="py-12">
        <section className="animate-in fade-in duration-1000 slide-in-from-bottom-2">
          <WireGuardControl baseUrl={baseUrl} language={language} />
        </section>
      </main>
    </div>
  );
};

export default App;