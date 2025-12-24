import React, { useState, useRef } from 'react';
import { Sparkles, Wand2, Brain, ImagePlus, Loader2, Download, AlertTriangle } from 'lucide-react';
import { generateImage, editImage, thinkingMode } from '../services/gemini';
import { ImageSize, Language } from '../types';
import { TRANSLATIONS } from '../constants/translations';
import ReactMarkdown from 'react-markdown';

interface AIPlaygroundProps {
  hasApiKey: boolean;
  onConnectKey: () => void;
  language: Language;
}

type Mode = 'generate' | 'edit' | 'think';

const AIPlayground: React.FC<AIPlaygroundProps> = ({ hasApiKey, onConnectKey, language }) => {
  const t = TRANSLATIONS[language];
  const [mode, setMode] = useState<Mode>('generate');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Inputs
  const [prompt, setPrompt] = useState('');
  const [imageSize, setImageSize] = useState<ImageSize>('1K');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [selectedImagePreview, setSelectedImagePreview] = useState<string | null>(null);
  
  // Outputs
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [thinkingOutput, setThinkingOutput] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (ev) => {
        setSelectedImagePreview(ev.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if (!hasApiKey) {
      onConnectKey();
      return;
    }
    
    if (!prompt.trim()) {
      setError(t.ai.promptReq);
      return;
    }

    setLoading(true);
    setError(null);
    setGeneratedImages([]);
    setThinkingOutput('');

    try {
      if (mode === 'generate') {
        const images = await generateImage(prompt, imageSize);
        setGeneratedImages(images);
      } else if (mode === 'edit') {
        if (!selectedImagePreview) {
          throw new Error(t.ai.imageReq);
        }
        const images = await editImage(selectedImagePreview, prompt);
        setGeneratedImages(images);
      } else if (mode === 'think') {
        const result = await thinkingMode(prompt);
        if (result) setThinkingOutput(result);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred during AI processing.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {!hasApiKey && (
        <div className="bg-amber-900/30 border border-amber-600/50 rounded-xl p-4 mb-6 flex items-start space-x-3">
          <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5" />
          <div>
            <h3 className="text-amber-200 font-medium">{t.ai.apiKeyReq}</h3>
            <p className="text-amber-400/80 text-sm mt-1">
              {t.ai.apiKeyDesc}
            </p>
            <button 
              onClick={onConnectKey}
              className="mt-3 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              {t.ai.connectBtn}
            </button>
            <div className="mt-2 text-xs text-gray-500">
               <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noreferrer" className="underline hover:text-gray-300">{t.ai.billing}</a>
            </div>
          </div>
        </div>
      )}

      {/* Mode Selector */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {[
          { id: 'generate', label: t.ai.generate, icon: Sparkles, desc: t.ai.genDesc },
          { id: 'edit', label: t.ai.edit, icon: Wand2, desc: t.ai.editDesc },
          { id: 'think', label: t.ai.think, icon: Brain, desc: t.ai.thinkDesc },
        ].map((m) => (
          <button
            key={m.id}
            onClick={() => setMode(m.id as Mode)}
            className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all ${
              mode === m.id
                ? 'bg-gray-800 border-purple-500 ring-1 ring-purple-500/50 shadow-lg shadow-purple-900/20'
                : 'bg-gray-800/50 border-gray-700 hover:bg-gray-800 hover:border-gray-600'
            }`}
          >
            <m.icon className={`w-6 h-6 mb-2 ${mode === m.id ? 'text-purple-400' : 'text-gray-400'}`} />
            <span className={`font-medium ${mode === m.id ? 'text-white' : 'text-gray-300'}`}>{m.label}</span>
            <span className="text-xs text-gray-500 mt-1">{m.desc}</span>
          </button>
        ))}
      </div>

      <div className="bg-gray-800 rounded-2xl border border-gray-700 p-6 shadow-xl">
        {/* Input Section */}
        <div className="space-y-6">
          
          {mode === 'edit' && (
            <div className="border-2 border-dashed border-gray-600 rounded-xl p-6 text-center hover:border-purple-500/50 transition-colors bg-gray-900/50">
               <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleImageSelect}
                className="hidden"
              />
              {selectedImagePreview ? (
                <div className="relative inline-block group">
                  <img src={selectedImagePreview} alt="Preview" className="max-h-64 rounded-lg shadow-md" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="text-white bg-gray-800/80 px-4 py-2 rounded-lg text-sm"
                    >
                      Change Image
                    </button>
                  </div>
                </div>
              ) : (
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="cursor-pointer flex flex-col items-center justify-center py-8"
                >
                  <ImagePlus className="w-10 h-10 text-gray-500 mb-3" />
                  <p className="text-gray-400 font-medium">Click to upload an image to edit</p>
                  <p className="text-xs text-gray-600 mt-1">Supports PNG, JPEG</p>
                </div>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              {mode === 'think' ? t.ai.analyze : t.ai.vision}
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={
                mode === 'edit' ? t.ai.placeholderEdit :
                mode === 'generate' ? t.ai.placeholderGen :
                t.ai.placeholderThink
              }
              className="w-full bg-gray-900 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none h-32 resize-none"
            />
          </div>

          {mode === 'generate' && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">{t.ai.resolution}</label>
              <div className="flex space-x-4">
                {(['1K', '2K', '4K'] as ImageSize[]).map((size) => (
                  <label key={size} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="imageSize"
                      value={size}
                      checked={imageSize === size}
                      onChange={() => setImageSize(size)}
                      className="form-radio text-purple-600 focus:ring-purple-500 bg-gray-900 border-gray-600"
                    />
                    <span className="text-gray-300 font-mono text-sm">{size}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <button
              onClick={handleSubmit}
              disabled={loading || !hasApiKey}
              className="flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg shadow-purple-900/30"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>{t.ai.processing}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  <span>{mode === 'edit' ? t.ai.edit : mode === 'generate' ? t.ai.generate : t.ai.think}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Results Section */}
      {(generatedImages.length > 0 || thinkingOutput || error) && (
        <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
           {error && (
             <div className="bg-red-900/50 border border-red-500/50 text-red-200 p-4 rounded-xl flex items-center mb-6">
                <AlertTriangle className="w-5 h-5 mr-2" />
                {error}
             </div>
           )}

           {thinkingOutput && (
             <div className="bg-gray-800 rounded-2xl border border-gray-700 p-6 shadow-xl">
               <h3 className="text-lg font-bold text-purple-400 mb-4 flex items-center">
                 <Brain className="w-5 h-5 mr-2" />
                 {t.ai.result}
               </h3>
               <div className="prose prose-invert prose-purple max-w-none">
                 <ReactMarkdown>{thinkingOutput}</ReactMarkdown>
               </div>
             </div>
           )}

           {generatedImages.length > 0 && (
             <div className="grid grid-cols-1 gap-6">
               {generatedImages.map((img, idx) => (
                 <div key={idx} className="bg-gray-800 rounded-2xl border border-gray-700 p-4 shadow-xl">
                    <img src={img} alt={`Generated ${idx}`} className="w-full rounded-lg shadow-lg" />
                    <div className="mt-4 flex justify-end">
                      <a 
                        href={img} 
                        download={`gemini-generated-${Date.now()}.png`}
                        className="flex items-center space-x-2 text-sm text-gray-400 hover:text-white transition-colors"
                      >
                        <Download className="w-4 h-4" />
                        <span>{t.ai.download}</span>
                      </a>
                    </div>
                 </div>
               ))}
             </div>
           )}
        </div>
      )}
    </div>
  );
};

export default AIPlayground;