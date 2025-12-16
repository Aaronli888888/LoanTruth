import React, { useState } from 'react';
import { AlertTriangle, CheckCircle, ShieldAlert, BadgePercent, ScanSearch, Info, Calculator, FileText, ChevronDown, ChevronUp, XCircle, ShieldCheck, Wand2 } from 'lucide-react';
import { AnalysisResult, Language } from '../types';
import AnalysisChart from './AnalysisChart';
import { getTexts } from '../utils/translations';

interface AnalysisViewProps {
  result: AnalysisResult;
  onReset: () => void;
  lang: Language;
}

const AnalysisView: React.FC<AnalysisViewProps> = ({ result, onReset, lang }) => {
  const t = getTexts(lang);
  const [showMath, setShowMath] = useState(false);

  const getRiskStyles = (level: string) => {
    switch (level) {
      case 'LOW': 
        return {
          bg: 'bg-emerald-500/10',
          border: 'border-emerald-500/20',
          text: 'text-emerald-400',
          icon: <CheckCircle className="w-8 h-8 text-emerald-400" />,
          gradient: 'from-emerald-500/20 to-transparent'
        };
      case 'MEDIUM': 
        return {
          bg: 'bg-yellow-500/10',
          border: 'border-yellow-500/20',
          text: 'text-yellow-400',
          icon: <Info className="w-8 h-8 text-yellow-400" />,
          gradient: 'from-yellow-500/20 to-transparent'
        };
      case 'HIGH': 
        return {
          bg: 'bg-orange-500/10',
          border: 'border-orange-500/20',
          text: 'text-orange-400',
          icon: <AlertTriangle className="w-8 h-8 text-orange-400" />,
          gradient: 'from-orange-500/20 to-transparent'
        };
      case 'SCAM': 
        return {
          bg: 'bg-red-500/10',
          border: 'border-red-500/20',
          text: 'text-red-400',
          icon: <ShieldAlert className="w-8 h-8 text-red-500" />,
          gradient: 'from-red-500/20 to-transparent'
        };
      default: 
        return {
          bg: 'bg-slate-500/10',
          border: 'border-slate-500/20',
          text: 'text-slate-400',
          icon: <Info className="w-8 h-8" />,
          gradient: 'from-slate-500/20 to-transparent'
        };
    }
  };

  const styles = getRiskStyles(result.riskLevel);
  const multiplier = result.nominalRate > 0 ? (result.realApr / result.nominalRate).toFixed(1) : "N/A";
  const isHighGap = result.nominalRate > 0 && result.realApr > result.nominalRate * 1.5;
  const isVerified = result.verification?.isVerified;
  const isCorrected = result.verification?.correctionApplied;

  // Determine rate display values
  const rateUnit = result.rateUnit || 'YEAR';
  const displayNominalRate = result.originalNominalRate ?? result.nominalRate;
  
  const unitLabel = {
    'DAY': t.unitDay,
    'MONTH': t.unitMonth,
    'YEAR': t.unitYear
  }[rateUnit];

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8 animate-fade-in-up pb-20">
      
      {/* 1. Verdict Banner */}
      <div className={`relative overflow-hidden rounded-2xl border ${styles.border} bg-slate-900/40 backdrop-blur-xl shadow-2xl`}>
        <div className={`absolute inset-0 bg-gradient-to-r ${styles.gradient} opacity-50`} />
        
        <div className="relative p-6 md:p-8 flex flex-col md:flex-row items-center md:items-start gap-6">
          <div className="p-4 bg-slate-950/50 rounded-full shadow-inner border border-white/5 shrink-0">
            {styles.icon}
          </div>
          
          <div className="flex-1 text-center md:text-left space-y-2">
            <div className="flex flex-col md:flex-row items-center md:items-baseline gap-3">
              <h2 className={`text-3xl md:text-4xl font-black tracking-tight ${styles.text}`}>
                {result.riskLevel === 'SCAM' ? 'SCAM ALERT' : result.riskLevel} RISK
              </h2>
              <span className="px-3 py-1 rounded-full bg-slate-800/50 border border-slate-700 text-xs font-mono text-slate-400 uppercase tracking-wider">
                {result.productType}
              </span>
            </div>
            <p className="text-lg text-slate-200 font-medium leading-relaxed max-w-3xl">
              {result.verdict}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
        
        {/* Left Column: The Hard Numbers */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Rate Comparison Card */}
          <div className="bg-slate-900/60 border border-slate-700/50 rounded-2xl p-6 md:p-8 relative overflow-hidden shadow-lg backdrop-blur-sm">
            {/* Background decoration */}
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl" />
            
            <h3 className="text-slate-400 text-sm font-semibold uppercase tracking-wider mb-8 flex items-center gap-2">
              <BadgePercent className="w-4 h-4" /> Rate Analysis
            </h3>

            <div className="space-y-8 relative z-10">
              {/* Advertised */}
              <div className="flex justify-between items-end group">
                <div>
                  <div className="text-sm text-slate-500 mb-1 flex items-center gap-1">
                    {t.nominalRate}
                    {rateUnit !== 'YEAR' && (
                       <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-400">{unitLabel}</span>
                    )}
                  </div>
                  <div className="text-2xl font-semibold text-slate-300 group-hover:text-white transition-colors">
                    {displayNominalRate}%
                  </div>
                  {rateUnit !== 'YEAR' && (
                    <div className="text-xs text-slate-500 mt-1">
                       ≈ {result.nominalRate}% {t.convertedAnnual}
                    </div>
                  )}
                </div>
                <div className="h-px flex-1 mx-4 bg-slate-800/80 dashed-line relative top-[-10px]" />
              </div>

              {/* Real APR - The Hero */}
              <div className="relative p-6 rounded-2xl bg-slate-950/50 border border-slate-800 shadow-inner">
                {isHighGap && multiplier !== "N/A" && (
                  <div className="absolute -top-3 -right-2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg border border-red-400 animate-pulse">
                    {multiplier}x HIGHER
                  </div>
                )}
                
                <div className="flex justify-between items-start mb-1">
                  <div className="text-sm text-emerald-500 font-bold flex items-center gap-2">
                    {t.realApr}
                    <Info className="w-3 h-3 opacity-50" />
                  </div>
                  
                  {/* Verification Badge */}
                  {isVerified ? (
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-bold text-emerald-400 uppercase tracking-wide">
                      <ShieldCheck className="w-3 h-3" />
                      {t.verifiedBadge}
                      {isCorrected && <span className="text-orange-400 ml-1">({t.correctionNote})</span>}
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-blue-500/10 border border-blue-500/20 text-[10px] font-bold text-blue-400 uppercase tracking-wide">
                      <Wand2 className="w-3 h-3" />
                      {t.estimatedBadge}
                    </div>
                  )}
                </div>

                <div className={`text-5xl md:text-6xl font-black tracking-tighter ${styles.text} drop-shadow-lg`}>
                  {result.realApr}<span className="text-3xl">%</span>
                </div>
                <div className="text-xs text-slate-500 mt-2 leading-relaxed">
                  {t.realAprNote}
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-800/50">
               <AnalysisChart data={result} lang={lang} />
            </div>
          </div>

          {/* Calculation Details (Receipt Style) */}
          <div className="bg-slate-900/60 border border-slate-700/50 rounded-2xl overflow-hidden shadow-lg backdrop-blur-sm">
            <button 
              onClick={() => setShowMath(!showMath)}
              className="w-full flex items-center justify-between p-5 hover:bg-slate-800/50 transition-colors text-slate-300"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
                  <Calculator className="w-5 h-5" />
                </div>
                <span className="font-semibold text-sm">{t.calcTitle}</span>
              </div>
              {showMath ? <ChevronUp className="w-4 h-4 opacity-50" /> : <ChevronDown className="w-4 h-4 opacity-50" />}
            </button>
            
            {showMath && (
              <div className="p-5 pt-0 animate-fade-in bg-slate-950/30">
                <div className="font-mono text-xs text-slate-400 space-y-4 border-t border-slate-800/50 pt-4">
                  
                  {/* Extracted Params Section */}
                  {result.verification?.extractedParams && result.verification.extractedParams.principal > 0 && (
                    <div className="grid grid-cols-3 gap-2 mb-4 p-2 bg-slate-900/50 rounded border border-slate-800">
                       <div className="col-span-3 text-[10px] font-bold text-slate-500 uppercase mb-1">{t.paramsTitle}</div>
                       <div>
                         <span className="block text-slate-600 text-[9px]">{t.paramPrincipal}</span>
                         <span className="text-slate-300">{result.verification.extractedParams.principal}</span>
                       </div>
                       <div>
                         <span className="block text-slate-600 text-[9px]">{t.paramTerm}</span>
                         <span className="text-slate-300">{result.verification.extractedParams.term}</span>
                       </div>
                       <div>
                         <span className="block text-slate-600 text-[9px]">{t.paramPayment}</span>
                         <span className="text-slate-300">{result.verification.extractedParams.payment}</span>
                       </div>
                    </div>
                  )}

                  <div>
                    <span className="block text-slate-500 mb-1 font-sans font-bold text-[10px] uppercase">Formula</span>
                    <div className="bg-slate-950 p-2 rounded border border-slate-800 text-emerald-500/90 break-all">
                      {result.calculationDetails?.formula}
                    </div>
                  </div>
                  <div>
                    <span className="block text-slate-500 mb-1 font-sans font-bold text-[10px] uppercase">Cash Flow Sample</span>
                    <div className="bg-slate-950 p-2 rounded border border-slate-800 text-blue-300/90 leading-relaxed">
                      {result.calculationDetails?.cashFlowSample}
                    </div>
                  </div>
                  <div>
                    <span className="block text-slate-500 mb-1 font-sans font-bold text-[10px] uppercase">Logic</span>
                    <p className="leading-relaxed text-slate-400">
                      {result.calculationDetails?.explanation}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Right Column: Interpretation */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Pitfalls & Fees */}
          <div className="bg-slate-900/60 border border-slate-700/50 rounded-2xl p-6 md:p-8 shadow-lg backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-orange-500/10 rounded-lg text-orange-400">
                <ScanSearch className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-lg text-slate-200">{t.pitfallsTitle}</h3>
            </div>
            
            <div className="space-y-4">
              {result.pitfalls.map((pit, idx) => (
                <div key={idx} className="flex gap-4 p-3 rounded-xl bg-slate-800/30 hover:bg-slate-800/50 border border-transparent hover:border-slate-700 transition-all group">
                  <div className="mt-1 shrink-0">
                    <XCircle className="w-5 h-5 text-orange-500/80 group-hover:text-orange-500 transition-colors" />
                  </div>
                  <span className="text-slate-300 text-sm md:text-base leading-relaxed">{pit}</span>
                </div>
              ))}

              {result.hiddenFees.length > 0 && (
                <div className="mt-6 p-4 rounded-xl bg-red-500/5 border border-red-500/20 flex gap-4">
                  <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
                  <div className="text-sm">
                    <span className="font-bold text-red-300 block mb-1">{t.hiddenFees} Detected:</span>
                    <span className="text-red-200/80 leading-relaxed">{result.hiddenFees.join(", ")}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* The Advisor (Chat Bubble Style) */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 to-blue-500/5 rounded-2xl transform rotate-1 scale-[0.98] z-0" />
            <div className="relative z-10 bg-slate-800/80 border border-slate-600/50 rounded-2xl p-6 md:p-8 shadow-xl backdrop-blur-md">
              <div className="flex items-center gap-3 mb-4 border-b border-white/5 pb-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-400 to-cyan-500 flex items-center justify-center text-slate-900 shadow-lg shadow-emerald-500/20">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-white">{t.adviceTitle}</h3>
                  <p className="text-xs text-slate-400">AI Financial Analyst</p>
                </div>
              </div>
              
              <div className="prose prose-invert prose-sm md:prose-base max-w-none text-slate-300/90 leading-7 font-light">
                 {result.advice.split('\n').map((line, i) => (
                   <p key={i} className="mb-3 last:mb-0">{line}</p>
                 ))}
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Action Footer */}
      <div className="fixed bottom-6 left-0 right-0 z-50 flex justify-center pointer-events-none">
        <button
          onClick={onReset}
          className="pointer-events-auto px-8 py-3 bg-white text-slate-900 font-bold rounded-full hover:bg-slate-100 active:scale-95 transition-all shadow-[0_8px_30px_rgb(0,0,0,0.3)] hover:shadow-[0_8px_30px_rgb(255,255,255,0.2)] flex items-center gap-2 border-2 border-slate-200"
        >
          <ScanSearch className="w-4 h-4" />
          {t.resetBtn}
        </button>
      </div>
    </div>
  );
};

export default AnalysisView;