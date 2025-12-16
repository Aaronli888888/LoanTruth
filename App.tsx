import React, { useState } from 'react';
import { Github, Zap, ShieldCheck, Scale, Globe } from 'lucide-react';
import FileUpload from './components/FileUpload';
import AnalysisView from './components/AnalysisView';
import { analyzeLoanImage } from './services/geminiService';
import { AnalysisResult, Language } from './types';
import { getTexts } from './utils/translations';

const App: React.FC = () => {
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lang, setLang] = useState<Language>('zh');

  const t = getTexts(lang);

  const handleFileSelect = async (file: File) => {
    setIsProcessing(true);
    setError(null);
    setResult(null);

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64 = reader.result as string;
        const analysis = await analyzeLoanImage(base64, lang);
        setResult(analysis);
      } catch (err) {
        console.error(err);
        setError(t.error);
      } finally {
        setIsProcessing(false);
      }
    };
    reader.onerror = () => {
      setError("Read Error");
      setIsProcessing(false);
    };
    reader.readAsDataURL(file);
  };

  const handleReset = () => {
    setResult(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 flex flex-col font-sans selection:bg-emerald-500/30 overflow-x-hidden">
      
      {/* Background Gradients - Adjusted to be subtler */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-emerald-900/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-900/10 rounded-full blur-[120px]" />
        {/* Noise overlay for texture */}
        <div className="absolute inset-0 opacity-[0.02]" style={{backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`}}></div>
      </div>

      {/* Navbar */}
      <nav className="relative z-20 border-b border-white/5 bg-slate-950/30 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={handleReset}>
            <div className="bg-gradient-to-tr from-emerald-500 to-cyan-500 p-1.5 rounded-lg shadow-lg shadow-emerald-500/20">
              <Scale className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2">
              <span className="text-lg sm:text-xl font-bold tracking-tight text-white">
                {t.appTitle}
              </span>
              <span className="text-emerald-500 text-xs sm:text-sm font-medium px-2 py-0.5 bg-emerald-500/10 rounded-full border border-emerald-500/10">
                {t.appSubtitle}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setLang(l => l === 'zh' ? 'en' : 'zh')}
              className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition-colors px-3 py-1.5 rounded-full bg-slate-800/50 border border-slate-700 hover:bg-slate-700"
            >
              <Globe className="w-3 h-3" />
              <span>{lang === 'zh' ? 'EN' : '中文'}</span>
            </button>
            <a 
              href="https://github.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-white transition-colors hidden sm:flex"
            >
              <Github className="w-5 h-5" />
              <span className="hidden sm:inline">{t.joinGithub}</span>
            </a>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 flex-grow flex flex-col items-center justify-start p-4 sm:p-8 pt-12 sm:pt-16">
        
        {!result && (
          <div className="text-center max-w-3xl mx-auto mb-16 animate-fade-in px-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/50 border border-slate-700 text-emerald-400 text-xs font-medium mb-6 animate-fade-in-up">
              <Zap className="w-3 h-3 fill-emerald-400" /> AI-Powered Financial Protection
            </div>
            <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight mb-8 leading-tight">
              <span className="block text-white mb-2 drop-shadow-sm">{t.heroTitle}</span>
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500 animate-pulse-slow">
                {t.heroSubtitle}
              </span>
            </h1>
            <p className="text-lg md:text-xl text-slate-400 leading-relaxed max-w-2xl mx-auto mb-10">
              {t.heroDesc}
            </p>

            <div className="flex flex-wrap justify-center gap-4 sm:gap-8 text-sm text-slate-500 font-medium">
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900/50 border border-slate-800">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>{t.featureIrr}</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900/50 border border-slate-800">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <span>{t.featurePrivacy}</span>
              </div>
            </div>
          </div>
        )}

        <div className="w-full transition-all duration-500">
          {error && (
            <div className="max-w-xl mx-auto mb-8 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-center animate-shake flex flex-col items-center gap-2 backdrop-blur-sm">
              <div className="p-2 bg-red-500/20 rounded-full mb-1"><ShieldCheck className="w-6 h-6" /></div>
              <p className="font-medium">{error}</p>
              <button onClick={() => setError(null)} className="mt-2 px-4 py-1.5 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-sm transition-colors">
                {t.retry}
              </button>
            </div>
          )}

          {!result ? (
            <FileUpload onFileSelect={handleFileSelect} isProcessing={isProcessing} lang={lang} />
          ) : (
            <AnalysisView result={result} onReset={handleReset} lang={lang} />
          )}
        </div>

      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-800/50 bg-slate-950/30 py-8 text-center text-slate-600 text-xs sm:text-sm">
        <p className="mb-2">Powered by Google Gemini 2.5 Flash</p>
        <p>© {new Date().getFullYear()} LoanTruth Open Source Project</p>
      </footer>

    </div>
  );
};

export default App;