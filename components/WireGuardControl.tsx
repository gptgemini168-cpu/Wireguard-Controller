import React, { useState, useEffect, useCallback } from 'react';
import { Power, RefreshCcw, Save, Server, Globe, CheckCircle2, AlertCircle } from 'lucide-react';
import { WireGuardService } from '../services/wgApi';
import { StatusResponse, Profile } from '../types';

interface WireGuardControlProps {
  baseUrl: string;
}

const PROFILES: Profile[] = ['tw', 'jp', 'hk', 'th'];
const PROFILE_FLAGS: Record<Profile, string> = {
  tw: '🇹🇼',
  jp: '🇯🇵',
  hk: '🇭🇰',
  th: '🇹🇭'
};

const WireGuardControl: React.FC<WireGuardControlProps> = ({ baseUrl }) => {
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Local state for UI before applying
  const [localSsProfile, setLocalSsProfile] = useState<Profile>('jp');
  const [service, setService] = useState<WireGuardService>(new WireGuardService(baseUrl));

  useEffect(() => {
    setService(new WireGuardService(baseUrl));
  }, [baseUrl]);

  const fetchStatus = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await service.getStatus();
      setStatus(data);
      if (data.ss.profile && PROFILES.includes(data.ss.profile as Profile)) {
        setLocalSsProfile(data.ss.profile as Profile);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch status');
    } finally {
      setLoading(false);
    }
  }, [service]);

  useEffect(() => {
    fetchStatus();
    // Poll every 10 seconds
    const interval = setInterval(fetchStatus, 10000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  const handleApply = async () => {
    if (!status) return;
    setLoading(true);
    setError(null);
    try {
      // Using the /v1/apply endpoint as recommended
      const data = await service.apply({
        wg0_enabled: status.wg0.active,
        ss_enabled: status.ss.active,
        ss_profile: localSsProfile
      });
      setStatus(data);
    } catch (err: any) {
      setError(err.message || 'Failed to apply settings');
    } finally {
      setLoading(false);
    }
  };

  const toggleInterface = async (iface: 'wg0' | 'ss') => {
    if (!status) return;
    const currentState = iface === 'wg0' ? status.wg0.active : status.ss.active;
    const newState = !currentState;
    
    // Optimistic update
    setStatus(prev => prev ? {
      ...prev,
      [iface]: { ...prev[iface], active: newState }
    } : null);

    try {
      // Use atomic apply for toggles as well to keep consistency
      const req = iface === 'wg0' ? { wg0_enabled: newState } : { ss_enabled: newState };
      const data = await service.apply(req);
      setStatus(data);
    } catch (err: any) {
      setError(err.message);
      fetchStatus(); // Revert on error
    }
  };

  if (!status && loading && !error) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {error && (
        <div className="bg-red-900/50 border border-red-500/50 text-red-200 p-4 rounded-xl flex items-center space-x-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
          <button 
            onClick={fetchStatus}
            className="ml-auto text-sm underline hover:text-white"
          >
            Retry
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* WG0 Card */}
        <div className={`relative overflow-hidden rounded-2xl border p-6 transition-all ${
           status?.wg0.active 
             ? 'bg-gradient-to-br from-blue-900/40 to-gray-800 border-blue-500/50 shadow-lg shadow-blue-900/20' 
             : 'bg-gray-800 border-gray-700 opacity-90'
        }`}>
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center space-x-3">
              <div className={`p-3 rounded-lg ${status?.wg0.active ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-700 text-gray-400'}`}>
                <Server className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Interface wg0</h3>
                <p className="text-sm text-gray-400">Primary Tunnel</p>
              </div>
            </div>
            <button
              onClick={() => toggleInterface('wg0')}
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 ${
                status?.wg0.active ? 'bg-blue-600' : 'bg-gray-600'
              }`}
            >
              <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                status?.wg0.active ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>
          <div className="flex items-center space-x-2">
            <div className={`w-2.5 h-2.5 rounded-full ${status?.wg0.active ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
            <span className="text-sm font-medium text-gray-300">
              {status?.wg0.active ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>

        {/* SS Card */}
        <div className={`relative overflow-hidden rounded-2xl border p-6 transition-all ${
           status?.ss.active 
             ? 'bg-gradient-to-br from-emerald-900/40 to-gray-800 border-emerald-500/50 shadow-lg shadow-emerald-900/20' 
             : 'bg-gray-800 border-gray-700 opacity-90'
        }`}>
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center space-x-3">
              <div className={`p-3 rounded-lg ${status?.ss.active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-700 text-gray-400'}`}>
                <Globe className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Interface ss</h3>
                <p className="text-sm text-gray-400">Secure Tunnel</p>
              </div>
            </div>
             <button
              onClick={() => toggleInterface('ss')}
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-gray-900 ${
                status?.ss.active ? 'bg-emerald-600' : 'bg-gray-600'
              }`}
            >
              <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                status?.ss.active ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
               <div className={`w-2.5 h-2.5 rounded-full ${status?.ss.active ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                <span className="text-sm font-medium text-gray-300">
                  {status?.ss.active ? 'Active' : 'Inactive'}
                </span>
                {status?.ss.profile && (
                  <span className="text-xs bg-gray-700 px-2 py-0.5 rounded text-gray-300 ml-2 flex items-center gap-1.5">
                    <span>Current:</span>
                    <span className="flex items-center gap-1">
                      <span>{PROFILE_FLAGS[status.ss.profile as Profile]}</span>
                      <span className="font-bold">{status.ss.profile.toUpperCase()}</span>
                      <span className="opacity-60 text-[10px]">{status.ss.profile}</span>
                    </span>
                  </span>
                )}
            </div>

            <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-700">
              <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">
                Configuration Profile
              </label>
              <div className="flex space-x-3">
                <div className="relative flex-grow">
                  <select
                    value={localSsProfile}
                    onChange={(e) => setLocalSsProfile(e.target.value as Profile)}
                    className="w-full appearance-none bg-gray-800 border border-gray-600 text-white py-2.5 px-4 pr-10 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent cursor-pointer"
                  >
                    {PROFILES.map((p) => (
                      <option key={p} value={p}>
                         {PROFILE_FLAGS[p]} {p.toUpperCase()} - {p} Node
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-400">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                  </div>
                </div>
                
                <button
                  onClick={handleApply}
                  disabled={loading}
                  className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-lg shadow-emerald-900/30"
                >
                  {loading ? (
                     <RefreshCcw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  <span>Apply</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer Info */}
      <div className="text-center text-xs text-gray-600 mt-8">
        API Base: <span className="font-mono text-gray-500">{baseUrl}</span>
      </div>
    </div>
  );
};

export default WireGuardControl;