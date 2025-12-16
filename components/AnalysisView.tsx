import React, { useState } from 'react';
import { AlertTriangle, CheckCircle, ShieldAlert, BadgePercent, ScanSearch, Info, Calculator, FileText, TrendingDown, ArrowRight, ShieldCheck, Terminal, ChevronDown, ChevronUp, RefreshCw, TriangleAlert, FileJson } from 'lucide-react';
import { AnalysisResult } from '../types';
import AnalysisChart from './AnalysisChart';

interface AnalysisViewProps {
  result: AnalysisResult;
  onReset: () => void;
}

const AnalysisView: React.FC<AnalysisViewProps> = ({ result, onReset }) => {
  const [showLogs, setShowLogs] = useState(false);
  const [showFullReport, setShowFullReport] = useState(false);

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

  const diff = result.aiEstimatedApr ? (result.realApr - result.aiEstimatedApr).toFixed(2) : "0";
  const hasSignificantDiff = Math.abs(parseFloat(diff)) > 0.1;

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 animate-fade-in-up pb-12">
      
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

      {/* Warnings Section (if any) */}
      {result.warnings && result.warnings.length > 0 && (
        <div className="bg-orange-500/10 border border-orange-500/40 rounded-xl p-4 flex items-start gap-3">
          <TriangleAlert className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-orange-400">数据交叉验证警报</h3>
            {result.warnings.map((warn, idx) => (
              <p key={idx} className="text-xs text-orange-300/90">{warn}</p>
            ))}
          </div>
        </div>
      )}

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
                <p className="text-slate-400 text-sm flex items-center gap-1">
                  宣称利率 
                  {result.rateUnit && <span className="text-xs bg-slate-700 px-1 rounded">{result.rateUnit === 'DAY' ? '日息' : result.rateUnit === 'MONTH' ? '月息' : '年化'}</span>}
                </p>
                <div className="flex items-baseline gap-2">
                   <p className="text-2xl font-semibold text-white">
                    {result.originalNominalRate ? result.originalNominalRate + '%' : result.nominalRate + '%'}
                   </p>
                   {result.originalNominalRate && result.originalNominalRate !== result.nominalRate && (
                     <span className="text-xs text-slate-500">→ 折合年化 {result.nominalRate}%</span>
                   )}
                </div>
              </div>
              <div className="text-right">
                <p className="text-emerald-400 text-sm font-bold flex items-center justify-end gap-1">
                  真实年化 (Real APR)
                  {result.verification.isVerified && <CheckCircle size={14} className="text-emerald-500" />}
                </p>
                <p className={`text-4xl font-bold ${result.realApr > 24 ? 'text-red-500' : 'text-emerald-400'}`}>
                  {result.realApr}%
                </p>
              </div>
            </div>
            
            {/* Calibration View: AI vs Algo */}
            {result.verification.isVerified && hasSignificantDiff && (
               <div className="mt-3 pt-3 border-t border-slate-700/50 flex items-center justify-between text-xs">
                 <div className="flex items-center gap-1.5 text-slate-400">
                    <span className="bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded">AI 估算</span>
                    <span>{result.aiEstimatedApr}%</span>
                 </div>
                 <div className="flex items-center gap-1 text-slate-500">
                    <RefreshCw size={10} />
                    <span>算法校准</span>
                 </div>
                 <div className={`font-mono font-medium ${parseFloat(diff) > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                    {parseFloat(diff) > 0 ? '+' : ''}{diff}%
                 </div>
               </div>
            )}
            
            <div className="text-xs text-slate-500 mt-2 bg-slate-900/50 p-2 rounded flex items-start gap-2">
               <Info size={14} className="shrink-0 mt-0.5" />
               <span>
                 {result.verification.isVerified 
                    ? "该结果已通过算法验证。根据提取的还款参数，使用 Newton-Raphson 公式精确计算得出。"
                    : "该结果由 AI 根据行业标准估算。若提供更详细的还款计划截图，可触发精确算法验证。"
                 }
               </span>
            </div>
          </div>

          {/* Chart */}
          <AnalysisChart data={result} />

          {/* Verification Box - The "Show your work" section */}
          {result.verification.extractedParams && (
            <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-4">
              <h3 className="text-sm font-bold text-slate-300 mb-3 flex items-center gap-2">
                <Calculator size={14} /> 
                提取的计算参数
              </h3>
              <div className="grid grid-cols-3 gap-2 text-center text-sm">
                <div className="bg-slate-800 p-2 rounded border border-slate-700">
                  <div className="text-xs text-slate-500 mb-1">贷款本金</div>
                  <div className="font-mono text-white">{result.verification.extractedParams.principal.toLocaleString()}</div>
                </div>
                <div className="bg-slate-800 p-2 rounded border border-slate-700">
                  <div className="text-xs text-slate-500 mb-1">分期期数</div>
                  <div className="font-mono text-white">{result.verification.extractedParams.term} <span className="text-xs text-slate-500">期</span></div>
                </div>
                <div className="bg-slate-800 p-2 rounded border border-slate-700">
                  <div className="text-xs text-slate-500 mb-1">每期还款</div>
                  <div className="font-mono text-white">{result.verification.extractedParams.payment.toLocaleString()}</div>
                </div>
              </div>
            </div>
          )}
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
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0" />
                  {pit}
                </li>
              ))}
              {result.hiddenFees.length > 0 && (
                 <li className="flex items-start gap-3 text-slate-300 text-sm mt-2 pt-2 border-t border-slate-700">
                 <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
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

          {/* Calculation Breakdown - Redesigned */}
          {result.calculationDetails && (
            <div className="bg-slate-900/40 border border-slate-800 rounded-xl overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText size={16} className="text-slate-400" />
                  <h3 className="text-sm font-bold text-slate-300">计算过程详解 (Breakdown)</h3>
                </div>
                {result.verification.isVerified && (
                  <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded text-[10px] text-emerald-400 font-medium">
                    <ShieldCheck size={12} />
                    算法验证通过
                  </div>
                )}
              </div>
              
              <div className="p-5 space-y-5">
                {/* Formula */}
                {result.calculationDetails.formula && (
                  <div>
                    <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                      <Calculator size={12} /> 核心公式
                    </h4>
                    <div className="bg-[#0f172a] border border-slate-800 rounded-md p-3 overflow-x-auto shadow-inner">
                      <code className="font-mono text-xs text-emerald-400 whitespace-nowrap">
                        {result.calculationDetails.formula}
                      </code>
                    </div>
                  </div>
                )}
                
                {/* Cash Flow */}
                {result.calculationDetails.cashFlowSample && (
                  <div>
                    <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                       <TrendingDown size={12} /> 现金流模型
                    </h4>
                    <div className="bg-[#0f172a] border border-slate-800 rounded-md p-3 shadow-inner">
                      <pre className="font-mono text-xs text-blue-300 whitespace-pre-wrap font-sans">
                        {result.calculationDetails.cashFlowSample}
                      </pre>
                    </div>
                  </div>
                )}

                {/* Newton-Raphson Iteration Logs (Terminal Style) */}
                {result.calculationDetails.iterationLogs && result.calculationDetails.iterationLogs.length > 0 && (
                  <div>
                    <div 
                      className="flex items-center justify-between cursor-pointer group"
                      onClick={() => setShowLogs(!showLogs)}
                    >
                      <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2 group-hover:text-emerald-400 transition-colors">
                        <Terminal size={12} /> 牛顿迭代过程 (Debug Log)
                      </h4>
                      {showLogs ? <ChevronUp size={14} className="text-slate-500" /> : <ChevronDown size={14} className="text-slate-500" />}
                    </div>
                    
                    {showLogs && (
                      <div className="bg-black border border-slate-800 rounded-md p-3 shadow-inner overflow-hidden animate-fade-in">
                        <div className="font-mono text-[10px] leading-relaxed text-emerald-500/80 space-y-1 h-40 overflow-y-auto custom-scrollbar">
                           <div className="text-slate-500 border-b border-slate-800 mb-2 pb-1">
                             $ executing newton_raphson_solver.py...
                           </div>
                           {result.calculationDetails.iterationLogs.map((log, i) => (
                             <div key={i} className="flex">
                               <span className="text-slate-600 mr-2">{(i+1).toString().padStart(2, '0')}</span>
                               <span>{log}</span>
                             </div>
                           ))}
                           <div className="text-emerald-400 font-bold mt-2 animate-pulse">
                             $ _
                           </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Analysis Text */}
                <div>
                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                    <ArrowRight size={12} /> 分析逻辑
                  </h4>
                  <div className="text-sm text-slate-400 leading-relaxed space-y-3">
                    {result.calculationDetails.explanation.split('\n').map((line, i) => {
                      if (!line.trim()) return null;
                      // Highlight headers in the explanation text
                      const isHeader = line.match(/^\d+\./); 
                      return (
                        <p key={i} className={`pl-3 border-l-2 ${isHeader ? 'border-emerald-500 text-slate-300 font-medium' : 'border-slate-700 text-slate-400'}`}>
                          {line}
                        </p>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Full Report Collapsible Section */}
      <div className="border-t border-slate-800 pt-6 mt-4">
        <button 
          onClick={() => setShowFullReport(!showFullReport)}
          className="flex items-center justify-center w-full gap-2 text-slate-500 hover:text-emerald-400 transition-colors text-sm font-medium py-2 group"
        >
          <FileJson size={16} className="group-hover:scale-110 transition-transform"/>
          {showFullReport ? "收起完整数据档案" : "查看完整分析报告 (Raw Data Evidence)"}
          {showFullReport ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        {showFullReport && (
          <div className="mt-4 bg-[#0b1120] rounded-xl border border-slate-800 p-0 overflow-hidden animate-fade-in shadow-2xl">
            <div className="bg-slate-900/50 px-4 py-2 border-b border-slate-800 flex justify-between items-center">
              <span className="text-xs text-slate-500 font-mono">analysis_result.json</span>
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500/20 border border-red-500/50"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/20 border border-yellow-500/50"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-green-500/20 border border-green-500/50"></div>
              </div>
            </div>
            <div className="p-4 overflow-x-auto custom-scrollbar">
              <pre className="text-xs font-mono text-emerald-300/80 leading-relaxed">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>

      {/* Action Area */}
      <div className="flex justify-center pt-8">
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