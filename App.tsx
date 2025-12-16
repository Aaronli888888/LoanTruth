import React, { useState } from 'react';
import { Github, Zap, ShieldCheck, Scale, Calculator } from 'lucide-react';
import FileUpload from './components/FileUpload';
import AnalysisView from './components/AnalysisView';
import EducationGrid from './components/EducationGrid';
import { analyzeLoanImage } from './services/geminiService';
import { AnalysisResult } from './types';

const App: React.FC = () => {
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async (files: File[]) => {
    if (files.length === 0) return;

    setIsProcessing(true);
    setError(null);
    setResult(null);

    try {
      // Convert all files to base64
      const filePromises = files.map(file => {
        return new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => reject(reader.error);
          reader.readAsDataURL(file);
        });
      });

      const base64Images = await Promise.all(filePromises);
      const analysis = await analyzeLoanImage(base64Images);
      setResult(analysis);

    } catch (err) {
      console.error(err);
      setError("AI 分析失败。请确保图片清晰，或者网络连接正常。如果上传了多张图片，请确保它们属于同一个产品。");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 flex flex-col font-sans selection:bg-emerald-500/30">
      
      {/* Background Gradients */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px]" />
      </div>

      {/* Navbar */}
      <nav className="relative z-10 border-b border-slate-800/50 bg-slate-900/50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={handleReset}>
            <div className="bg-gradient-to-tr from-emerald-500 to-blue-500 p-1.5 rounded-lg">
              <Scale className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
              LoanTruth <span className="text-emerald-500 text-sm font-medium px-2 py-0.5 bg-emerald-500/10 rounded-full ml-2 hidden sm:inline-block">利率照妖镜</span>
            </span>
          </div>
          <a 
            href="https://github.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-white transition-colors"
          >
            <Github className="w-5 h-5" />
            <span className="hidden sm:inline">加入开源计划</span>
          </a>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 flex-grow flex flex-col items-center justify-start p-4 sm:p-8 pt-12">
        
        {!result && (
          <div className="text-center max-w-3xl mx-auto mb-12 animate-fade-in px-4">
            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight mb-6">
              <span className="block text-white mb-2">拒绝被收割</span>
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 via-teal-400 to-blue-500">
                看清每一个金融陷阱
              </span>
            </h1>
            <p className="text-lg text-slate-400 leading-relaxed max-w-xl mx-auto">
              这是一个开源的 AI 工具。上传你的贷款、信用卡分期或车贷利率截图（支持多图拼接），我们用数学算法 + AI 双重验证还原真实的年化利率 (IRR)。
            </p>

            <div className="flex flex-wrap justify-center gap-4 sm:gap-6 mt-8 text-sm text-slate-500 font-medium">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/50 border border-slate-700">
                <Calculator className="w-4 h-4 text-emerald-500" />
                <span>IRR 算法验真</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/50 border border-slate-700">
                <Zap className="w-4 h-4 text-yellow-500" />
                <span>AI 多图联想</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/50 border border-slate-700">
                <ShieldCheck className="w-4 h-4 text-blue-500" />
                <span>隐私本地加密</span>
              </div>
            </div>
          </div>
        )}

        <div className="w-full transition-all duration-500">
          {error && (
            <div className="max-w-xl mx-auto mb-8 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-center animate-shake backdrop-blur-sm">
              <p>{error}</p>
              <button onClick={() => setError(null)} className="mt-2 text-sm underline hover:text-red-300">关闭</button>
            </div>
          )}

          {!result ? (
            <>
              <FileUpload onAnalyze={handleAnalyze} isProcessing={isProcessing} />
              {!isProcessing && <EducationGrid />}
            </>
          ) : (
            <AnalysisView result={result} onReset={handleReset} />
          )}
        </div>

      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-800/50 bg-slate-900/50 py-8 text-center text-slate-500 text-sm">
        <p className="mb-2">Powered by Google Gemini 2.5 Flash & Mathematical Algorithms</p>
        <p>帮助全球“韭菜”脱离金融贷款的控制 · Open Source</p>
      </footer>

    </div>
  );
};

export default App;