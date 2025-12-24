
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Power, RefreshCcw, Save, Server, Globe, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { WireGuardService } from '../services/wgApi';
import { StatusResponse, Profile, Language, WSStatusMessage } from '../types';
import { TRANSLATIONS } from '../constants/translations';

// 在 Cloudflare Pages 或多數靜態託管平台中，public 資料夾的內容會被部署到根目錄
// 因此使用絕對路徑 /bg.jpg 是最穩妥的做法
const BG_IMAGE_PATH = '/bg.jpg';

interface WireGuardControlProps {
  baseUrl: string;
  language: Language;
}

const PROFILES: Profile[] = ['tw', 'jp', 'hk', 'th'];
const PROFILE_FLAGS: Record<Profile, string> = {
  tw: '🇹🇼',
  jp: '🇯🇵',
  hk: '🇭🇰',
  th: '🇹🇭'
};

const WireGuardControl: React.FC<WireGuardControlProps> = ({ baseUrl, language }) => {
  const t = TRANSLATIONS[language];
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [localSsProfile, setLocalSsProfile] = useState<Profile>('tw');
  const service = useRef(new WireGuardService(baseUrl));
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    service.current = new WireGuardService(baseUrl);
    connectWebSocket();
    return () => {
      wsRef.current?.close();
    };
  }, [baseUrl]);

  const connectWebSocket = useCallback(() => {
    const wsUrl = baseUrl.replace(/^http/, 'ws') + '/ws/status';
    
    if (wsRef.current) {
      wsRef.current.close();
    }

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setError(null);
      const pingInterval = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send('ping');
        }
      }, 25000);
      ws.addEventListener('close', () => clearInterval(pingInterval), { once: true });
    };

    ws.onmessage = (event) => {
      try {
        const msg: WSStatusMessage = JSON.parse(event.data);
        if (msg.type === 'status') {
          setStatus(msg.data);
          if (msg.data.ss.profile && PROFILES.includes(msg.data.ss.profile as Profile)) {
            setLocalSsProfile(msg.data.ss.profile as Profile);
          }
          setIsInitialLoading(false);
        }
      } catch (e) {}
    };

    ws.onerror = () => {
      setError(t.control.fetchError);
      setIsInitialLoading(false);
    };

    ws.onclose = () => {
      setTimeout(connectWebSocket, 5000);
    };
  }, [baseUrl, t]);

  const handleApply = async () => {
    if (!status) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await service.current.apply({
        wg0_enabled: status.wg0.active,
        ss_enabled: status.ss.active,
        ss_profile: localSsProfile
      });
    } catch (err: any) {
      setError(err.message || t.control.applyError);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleInterface = async (iface: 'wg0' | 'ss') => {
    if (!status) return;
    const currentState = iface === 'wg0' ? status.wg0.active : status.ss.active;
    const newState = !currentState;
    
    setStatus(prev => prev ? {
      ...prev,
      [iface]: { ...prev[iface], active: newState }
    } : null);

    setIsSubmitting(true);
    try {
      const req = iface === 'wg0' ? { wg0_enabled: newState } : { ss_enabled: newState };
      await service.current.apply(req);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isInitialLoading && !status) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 px-4 pb-20">
      {error && (
        <div className="bg-red-900/50 border border-red-500/50 text-red-200 p-4 rounded-xl flex items-center space-x-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
          <button onClick={() => connectWebSocket()} className="ml-auto text-sm underline hover:text-white">
            {t.control.retry}
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* WG0 Card */}
        <div className="bg-[#141d2b]/80 backdrop-blur-sm border border-[#23354d] rounded-[32px] p-8 relative overflow-hidden shadow-2xl transition-all hover:border-blue-500/30">
          <div className="flex justify-between items-start">
            <div className="flex items-center space-x-4">
              <div className="bg-[#1a2b45] p-3 rounded-2xl border border-[#2d466e]">
                <Server className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-gray-100 text-xl font-black">{t.control.wg0Title}</span>
                </div>
                <p className="text-gray-500 text-xs mt-0.5 tracking-wide uppercase">{t.control.primary}</p>
              </div>
            </div>
            <button
              onClick={() => toggleInterface('wg0')}
              disabled={isSubmitting}
              className={`relative inline-flex h-9 w-16 items-center rounded-full transition-all duration-300 shadow-inner ${
                status?.wg0.active ? 'bg-blue-600' : 'bg-gray-800'
              } ${isSubmitting ? 'opacity-50' : ''}`}
            >
              <span className={`inline-block h-7 w-7 transform rounded-full bg-white shadow-lg transition-transform duration-300 ${
                status?.wg0.active ? 'translate-x-8' : 'translate-x-1'
              }`} />
            </button>
          </div>
          <div className="mt-8 flex items-center space-x-2.5">
            <div className={`w-3 h-3 rounded-full ${status?.wg0.active ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
            <span className="text-gray-300 font-bold tracking-tight">{status?.wg0.active ? t.control.active : t.control.inactive}</span>
          </div>
        </div>

        {/* SS Card */}
        <div className="bg-[#0b1b17]/80 backdrop-blur-sm border border-[#14322a] rounded-[32px] p-8 relative overflow-hidden shadow-2xl transition-all hover:border-emerald-500/30">
          <div className="flex justify-between items-start">
            <div className="flex items-center space-x-4">
              <div className="bg-[#0f2a24] p-3 rounded-2xl border border-[#1e5045]">
                <Globe className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-gray-100 text-xl font-black">{t.control.ssTitle}</span>
                </div>
                <p className="text-gray-500 text-xs mt-0.5 tracking-wide uppercase">{t.control.secure}</p>
              </div>
            </div>
            <button
              onClick={() => toggleInterface('ss')}
              disabled={isSubmitting}
              className={`relative inline-flex h-9 w-16 items-center rounded-full transition-all duration-300 shadow-inner ${
                status?.ss.active ? 'bg-emerald-600' : 'bg-gray-800'
              } ${isSubmitting ? 'opacity-50' : ''}`}
            >
              <span className={`inline-block h-7 w-7 transform rounded-full bg-white shadow-lg transition-transform duration-300 ${
                status?.ss.active ? 'translate-x-8' : 'translate-x-1'
              }`} />
            </button>
          </div>

          <div className="mt-8 flex items-center space-x-3">
            <div className={`w-3 h-3 rounded-full ${status?.ss.active ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
            <span className="text-gray-300 font-bold tracking-tight">{status?.ss.active ? t.control.active : t.control.inactive}</span>
            <div className="flex items-center bg-[#1a2f29] rounded-xl px-3 py-1.5 space-x-2 border border-[#2a4d43]">
              <span className="text-[10px] text-emerald-500 font-black uppercase tracking-widest">{t.control.current}</span>
              {status?.ss.profile && (
                <div className="flex items-center space-x-1.5">
                  <span className="text-sm">{PROFILE_FLAGS[status.ss.profile as Profile]}</span>
                  <span className="text-sm font-black text-white">{status.ss.profile.toUpperCase()}</span>
                </div>
              )}
            </div>
          </div>

          <div className="mt-8 bg-[#0c1614] border border-[#1e322d] rounded-[24px] p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-gray-100 font-black text-sm uppercase tracking-widest">{t.control.securityArea}</h4>
              <span className="text-gray-600 text-[10px] font-black uppercase tracking-widest">{t.control.profile}</span>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-grow">
                <select
                  value={localSsProfile}
                  onChange={(e) => setLocalSsProfile(e.target.value as Profile)}
                  disabled={isSubmitting}
                  className="w-full bg-[#162521] border border-[#2a4d43] text-gray-100 rounded-xl py-3 px-4 appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500/50 cursor-pointer font-bold transition-all"
                >
                  {PROFILES.map((p) => (
                    <option key={p} value={p}>
                      {PROFILE_FLAGS[p]} {p.toUpperCase()} Node
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-emerald-500">
                  <RefreshCcw className="h-4 w-4" />
                </div>
              </div>

              <button
                onClick={handleApply}
                disabled={isSubmitting}
                className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl px-8 py-3 font-black uppercase tracking-widest flex items-center justify-center space-x-2 shadow-lg shadow-emerald-900/40 transition-all active:scale-95 disabled:opacity-50"
              >
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                <span>{t.control.apply}</span>
              </button>
            </div>
          </div>
        </div>
      </div>          

      {/* Coming Soon Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
        {/* Shadow PC Card */}
        <div 
          className="relative border border-gray-800 rounded-[32px] h-[360px] overflow-hidden group hover:border-orange-500/50 transition-all shadow-2xl"
          style={{
            backgroundImage: `url(${BG_IMAGE_PATH})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        >
          {/* Glassmorphism Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0d1117] via-transparent to-transparent group-hover:bg-[#0d1117]/60 transition-all duration-500 flex flex-col items-center justify-center p-8">
            <div className="backdrop-blur-2xl bg-black/40 border border-white/10 rounded-[40px] p-12 w-full max-w-sm flex flex-col items-center shadow-2xl transform transition-all duration-700 group-hover:scale-105 group-hover:-translate-y-2">
              <h3 className="text-white text-4xl font-black tracking-tighter mb-4 text-center group-hover:text-orange-400 transition-colors">{t.control.shadowPc}</h3>
              <div className="flex items-center space-x-4">
                <div className="h-[2px] w-12 bg-orange-600/50"></div>
                <p className="text-orange-500 text-xs font-black tracking-[0.5em] uppercase">{t.control.comingSoon}</p>
                <div className="h-[2px] w-12 bg-orange-600/50"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Eco App Card */}
        <div 
          className="relative border border-gray-800 rounded-[32px] h-[360px] overflow-hidden group hover:border-orange-500/50 transition-all shadow-2xl"
          style={{
            backgroundImage: `url(${BG_IMAGE_PATH})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        >
          {/* Glassmorphism Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0d1117] via-transparent to-transparent group-hover:bg-[#0d1117]/60 transition-all duration-500 flex flex-col items-center justify-center p-8">
            <div className="backdrop-blur-2xl bg-black/40 border border-white/10 rounded-[40px] p-12 w-full max-w-sm flex flex-col items-center shadow-2xl transform transition-all duration-700 group-hover:scale-105 group-hover:-translate-y-2">
              <h3 className="text-white text-4xl font-black tracking-tighter mb-4 text-center group-hover:text-orange-400 transition-colors">{t.control.ecoApp}</h3>
              <div className="flex items-center space-x-4">
                <div className="h-[2px] w-12 bg-orange-600/50"></div>
                <p className="text-orange-500 text-xs font-black tracking-[0.5em] uppercase">{t.control.comingSoon}</p>
                <div className="h-[2px] w-12 bg-orange-600/50"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer copyright in center */}
      <footer className="pt-20 pb-10">
        <div className="text-center text-gray-700 text-[10px] tracking-[0.4em] font-black uppercase leading-relaxed">
          &copy; 2025 Ghost System &bull; WireGuard Advanced Controller &bull; All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default WireGuardControl;
