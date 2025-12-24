
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Power, RefreshCcw, Save, Server, Globe, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { WireGuardService } from '../services/wgApi';
import { StatusResponse, Profile, Language, WSStatusMessage } from '../types';
import { TRANSLATIONS } from '../constants/translations';

// 在原生 ESM 環境下，不要使用 import 導入非 JS 資源
// 直接定義路徑常量
const BG_IMAGE_PATH = './bg.jpg';

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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 px-4">
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
        <div className="bg-[#141d2b] border border-[#23354d] rounded-[24px] p-8 relative overflow-hidden shadow-2xl">
          <div className="flex justify-between items-start">
            <div className="flex items-center space-x-4">
              <div className="bg-[#1a2b45] p-3 rounded-xl border border-[#2d466e]">
                <Server className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-gray-100 text-xl font-bold">{t.control.wg0Title}</span>
                  <span className="text-gray-400 text-xl"></span>
                </div>
                <p className="text-gray-500 text-sm mt-0.5">{t.control.primary}</p>
              </div>
            </div>
            <button
              onClick={() => toggleInterface('wg0')}
              disabled={isSubmitting}
              className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                status?.wg0.active ? 'bg-[#2563eb]' : 'bg-gray-700'
              } ${isSubmitting ? 'opacity-50' : ''}`}
            >
              <span className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                status?.wg0.active ? 'translate-x-7' : 'translate-x-1'
              }`} />
            </button>
          </div>
          <div className="mt-8 flex items-center space-x-2">
            <div className={`w-2.5 h-2.5 rounded-full ${status?.wg0.active ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-gray-300 font-medium">{status?.wg0.active ? t.control.active : t.control.inactive}</span>
          </div>
        </div>

        {/* SS Card */}
        <div className="bg-[#0b1b17] border border-[#14322a] rounded-[24px] p-8 relative overflow-hidden shadow-2xl">
          <div className="flex justify-between items-start">
            <div className="flex items-center space-x-4">
              <div className="bg-[#0f2a24] p-3 rounded-xl border border-[#1e5045]">
                <Globe className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-gray-100 text-xl font-bold">{t.control.ssTitle}</span>
                  <span className="text-gray-400 text-xl"></span>
                </div>
                <p className="text-gray-500 text-sm mt-0.5">{t.control.secure}</p>
              </div>
            </div>
            <button
              onClick={() => toggleInterface('ss')}
              disabled={isSubmitting}
              className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                status?.ss.active ? 'bg-[#10b981]' : 'bg-gray-700'
              } ${isSubmitting ? 'opacity-50' : ''}`}
            >
              <span className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                status?.ss.active ? 'translate-x-7' : 'translate-x-1'
              }`} />
            </button>
          </div>

          <div className="mt-8 flex items-center space-x-3">
            <div className={`w-2.5 h-2.5 rounded-full ${status?.ss.active ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-gray-300 font-medium">{status?.ss.active ? t.control.active : t.control.inactive}</span>
            <div className="flex items-center bg-[#1a2f29] rounded-md px-2 py-1 space-x-2 border border-[#2a4d43]">
              <span className="text-[10px] text-gray-400">{t.control.current}</span>
              {status?.ss.profile && (
                <div className="flex items-center space-x-1.5">
                  <span className="text-sm">{PROFILE_FLAGS[status.ss.profile as Profile]}</span>
                  <span className="text-sm font-bold text-gray-200">{status.ss.profile.toUpperCase()}</span>
                  <span className="text-[10px] text-gray-500">{status.ss.profile}</span>
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 bg-[#0c1614] border border-[#1e322d] rounded-[20px] p-5">
            <h4 className="text-gray-100 font-bold mb-1">{t.control.securityArea}</h4>
            <p className="text-gray-500 text-[10px] mb-4 uppercase tracking-wider">{t.control.profile}</p>
            
            <div className="flex gap-4">
              <div className="relative flex-grow">
                <select
                  value={localSsProfile}
                  onChange={(e) => setLocalSsProfile(e.target.value as Profile)}
                  disabled={isSubmitting}
                  className="w-full bg-[#162521] border border-[#2a4d43] text-gray-100 rounded-xl py-2.5 px-4 appearance-none focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                >
                  {PROFILES.map((p) => (
                    <option key={p} value={p}>
                      {PROFILE_FLAGS[p]} {p.toUpperCase()} - {p} {t.control.node}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-400">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                </div>
              </div>

              <button
                onClick={handleApply}
                disabled={isSubmitting}
                className="bg-[#10b981] hover:bg-[#059669] text-white rounded-xl px-6 py-2.5 font-bold flex items-center space-x-2 shadow-lg shadow-emerald-900/20 transition-all disabled:opacity-50"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
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
          className="relative border border-gray-700/50 rounded-[24px] h-[320px] overflow-hidden group hover:border-orange-500/50 transition-all shadow-2xl"
          style={{
            backgroundImage: `url(${BG_IMAGE_PATH})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        >
          {/* Glassmorphism Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0d1117] via-transparent to-transparent group-hover:bg-[#0d1117]/40 transition-colors flex flex-col items-center justify-center p-8">
            <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-10 w-full max-w-sm flex flex-col items-center shadow-2xl transform transition-transform group-hover:scale-105 duration-500">
              <h3 className="text-white text-3xl font-black tracking-tight mb-4 text-center">{t.control.shadowPc}</h3>
              <div className="flex items-center space-x-3">
                <div className="h-[2px] w-8 bg-orange-600"></div>
                <p className="text-orange-500 text-xs font-black tracking-[0.4em] uppercase">{t.control.comingSoon}</p>
                <div className="h-[2px] w-8 bg-orange-600"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Eco App Card */}
        <div 
          className="relative border border-gray-700/50 rounded-[24px] h-[320px] overflow-hidden group hover:border-orange-500/50 transition-all shadow-2xl"
          style={{
            backgroundImage: `url(${BG_IMAGE_PATH})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        >
          {/* Glassmorphism Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0d1117] via-transparent to-transparent group-hover:bg-[#0d1117]/40 transition-colors flex flex-col items-center justify-center p-8">
            <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-10 w-full max-w-sm flex flex-col items-center shadow-2xl transform transition-transform group-hover:scale-105 duration-500">
              <h3 className="text-white text-3xl font-black tracking-tight mb-4 text-center">{t.control.ecoApp}</h3>
              <div className="flex items-center space-x-3">
                <div className="h-[2px] w-8 bg-orange-600"></div>
                <p className="text-orange-500 text-xs font-black tracking-[0.4em] uppercase">{t.control.comingSoon}</p>
                <div className="h-[2px] w-8 bg-orange-600"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer copyright in center as requested */}
      <div className="text-center text-gray-600 text-[10px] py-16 tracking-[0.3em] font-black uppercase">
        &copy; 2025 Ghost System &bull; WireGuard Advanced Controller &bull; All rights reserved.
      </div>
    </div>
  );
};

export default WireGuardControl;
