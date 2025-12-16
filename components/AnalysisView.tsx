import React from 'react';
import { AlertTriangle, CheckCircle, ShieldAlert, BadgePercent, ScanSearch, Info } from 'lucide-react';
import { AnalysisResult } from '../types';
import AnalysisChart from './AnalysisChart';

interface AnalysisViewProps {
  result: AnalysisResult;
  onReset: () => void;
}

const AnalysisView: React.FC<AnalysisViewProps> = ({ result, onReset }) => {
  const getRiskColor = (level: string) => {
    switch (level) {
      case 'LOW': return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
      case 'MEDIUM': return 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10';
      case 'HIGH': return 'text-orange-500 border-orange-500/30 bg-orange-500/10';
      case 'SCAM': return 'text-red-500 border-red-500/30 bg-red-500/10';
      default: return 'text-slate-400 border-slate-500/30';
    }
  };

  const getRiskIcon = (level: string) => {
    switch (level) {
      case 'LOW': return <CheckCircle className="w-8 h-8" />;
      case 'MEDIUM': return <Info className="w-8 h-8" />;
      case 'HIGH': return <AlertTriangle className="w-8 h-8" />;
      case 'SCAM': return <ShieldAlert className="w-8 h-8" />;
      default: return <Info className="w-8 h-8" />;
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 animate-fade-in-up">
      
      {/* Header / Verdict */}
      <div className={`p-6 rounded-2xl border flex flex-col md:flex-row items-center justify-between gap-4 ${getRiskColor(result.riskLevel)}`}>
        <div className="flex items-center gap-4">
          <div className="p-3 bg-black/20 rounded-full backdrop-blur-sm">
            {getRiskIcon(result.riskLevel)}
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">AI 鉴定结论</h2>
            <p className="text-lg opacity-90 font-medium mt-1">{result.verdict}</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs uppercase tracking-wider opacity-70">产品类型</div>
          <div className="font-bold">{result.productType}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Left Col: The Numbers */}
        <div className="space-y-6">
          {/* Rate Card */}
          <div className="bg-card border border-slate-700 rounded-xl p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <BadgePercent size={100} />
            </div>
            
            <div className="flex justify-between items-end mb-4">
              <div>
                <p className="text-slate-400 text-sm">宣称利率 (Nominal)</p>
                <p className="text-3xl font-semibold text-white">{result.nominalRate}%</p>
              </div>
              <div className="text-right">
                <p className="text-emerald-400 text-sm font-bold animate-pulse">真实年化 (Real APR)</p>
                <p className={`text-4xl font-bold ${result.realApr > 24 ? 'text-red-500' : 'text-emerald-400'}`}>
                  {result.realApr}%
                </p>
              </div>
            </div>
            
            <div className="text-xs text-slate-500 mt-2 bg-slate-900/50 p-2 rounded">
              注：真实年化采用 IRR (内部收益率) 计算，包含了复利效应和隐藏的时间成本。
            </div>
          </div>

          {/* Chart */}
          <AnalysisChart data={result} />
        </div>

        {/* Right Col: The Analysis */}
        <div className="space-y-6">
          
          {/* Pitfalls */}
          <div className="bg-card border border-slate-700 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4 text-orange-400">
              <ScanSearch className="w-5 h-5" />
              <h3 className="font-bold">主要“坑”点 (Pitfalls)</h3>
            </div>
            <ul className="space-y-3">
              {result.pitfalls.map((pit, idx) => (
                <li key={idx} className="flex items-start gap-3 text-slate-300 text-sm">
                  <span className="mt-1 w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0" />
                  {pit}
                </li>
              ))}
              {result.hiddenFees.length > 0 && (
                 <li className="flex items-start gap-3 text-slate-300 text-sm mt-2 pt-2 border-t border-slate-700">
                 <span className="mt-1 w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                 <span className="font-semibold text-red-400">隐藏费用：</span> {result.hiddenFees.join(", ")}
               </li>
              )}
            </ul>
          </div>

          {/* Advice */}
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-xl p-6">
            <h3 className="font-bold text-emerald-400 mb-3 flex items-center gap-2">
              <span>💡</span> 韭菜救星大白话
            </h3>
            <p className="text-slate-300 leading-relaxed text-sm whitespace-pre-wrap">
              {result.advice}
            </p>
          </div>

        </div>
      </div>

      {/* Action Area */}
      <div className="flex justify-center pt-8 pb-12">
        <button
          onClick={onReset}
          className="px-8 py-3 bg-white text-black font-bold rounded-full hover:bg-slate-200 transition-colors shadow-lg shadow-white/10 flex items-center gap-2"
        >
          <ScanSearch className="w-4 h-4" />
          分析下一张图片
        </button>
      </div>
    </div>
  );
};

export default AnalysisView;
