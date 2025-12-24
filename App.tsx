import React, { useState } from 'react';
import { Settings, Shield, Lock, Globe, Loader2, AlertCircle } from 'lucide-react';
import WireGuardControl from './components/WireGuardControl';
import { WireGuardService } from './services/wgApi';

const App: React.FC = () => {
  const [baseUrl, setBaseUrl] = useState<string>('https://gateway.ccg.tw');
  const [isVerified, setIsVerified] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerifying(true);
    setConnectError(null);
    
    try {
      const service = new WireGuardService(baseUrl);
      // Attempt to fetch status to verify connection
      await service.getStatus();
      setIsVerified(true);
    } catch (err: any) {
      setConnectError('Connection failed. Please check the URL and try again.');
    } finally {
      setVerifying(false);
    }
  };

  if (!isVerified) {
    return (
      <div className="min-h-screen bg-gray-900 text-gray-100 font-sans flex items-center justify-center p-4 selection:bg-blue-500 selection:text-white">
        <div className="max-w-md w-full bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl p-8 animate-in fade-in zoom-in-95 duration-300">
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mb-4">
               <Shield className="w-8 h-8 text-blue-500" />
            </div>
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">
              WG Controller
            </h1>
            <p className="text-gray-400 text-sm mt-2">Connect to your WireGuard Server</p>
          </div>

          <form onSubmit={handleConnect} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Server API URL
              </label>
              <div className="relative">
                <Globe className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
                <input
                  type="text"
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-600 rounded-xl py-2.5 pl-10 pr-4 text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  placeholder="https://gateway.ccg.tw"
                  required
                />
              </div>
            </div>

            {connectError && (
              <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-3 flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-red-200">{connectError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={verifying}
              className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-xl font-medium transition-all shadow-lg shadow-blue-900/20"
            >
              {verifying ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Connecting...</span>
                </>
              ) : (
                <>
                  <Lock className="w-5 h-5" />
                  <span>Connect</span>
                </>
              )}
            </button>
          </form>
          
           <div className="mt-6 text-center text-xs text-gray-500">
             Enter the URL of your WireGuard API endpoint.
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans selection:bg-blue-500 selection:text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-gray-800/80 backdrop-blur-md border-b border-gray-700 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Shield className="w-8 h-8 text-blue-500" />
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">
              WG Controller
            </h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setIsSettingsOpen(!isSettingsOpen)}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-full transition-colors"
            >
              <Settings className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Settings Dropdown */}
        {isSettingsOpen && (
          <div className="absolute top-16 right-4 w-72 bg-gray-800 border border-gray-700 rounded-lg shadow-xl p-4 animate-in fade-in slide-in-from-top-2">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              WireGuard API Base URL
            </label>
            <input
              type="text"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="https://gateway.ccg.tw"
            />
            <p className="text-xs text-gray-500 mt-2">
              Ensure the server allows CORS if running on a different origin.
            </p>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-in fade-in zoom-in-95 duration-300">
            <WireGuardControl baseUrl={baseUrl} />
        </div>
      </main>
    </div>
  );
};

export default App;