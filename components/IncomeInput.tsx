import React, { useState } from 'react';
import { DollarSign, TrendingDown, HelpCircle, X, Wallet } from 'lucide-react';

interface IncomeInputProps {
  onSubmit: (monthlyIncome: number) => void;
  onSkip: () => void;
  onBack: () => void;
}

const IncomeInput: React.FC<IncomeInputProps> = ({ onSubmit, onSkip, onBack }) => {
  const [income, setIncome] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    const val = parseInt(income.replace(/,/g, ''), 10);
    if (!income.trim()) {
      setError('请输入你的月收入');
      return;
    }
    if (isNaN(val) || val <= 0) {
      setError('请输入有效的金额数字');
      return;
    }
    if (val < 500) {
      setError('月收入似乎有点低，请确认金额是否正确？');
      return;
    }
    onSubmit(val);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSubmit();
  };

  return (
    <div className="w-full max-w-lg mx-auto animate-fade-in">
      <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-700/50 rounded-3xl p-8 backdrop-blur-sm">
        
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/20">
            <Wallet className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">你的月收入是多少？</h2>
            <p className="text-sm text-slate-400 mt-1">
              填了这个，我们能算清这笔债对你有多重
            </p>
          </div>
        </div>

        {/* Input */}
        <div className="space-y-4">
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
              <DollarSign className="w-5 h-5" />
            </div>
            <input
              type="text"
              value={income}
              onChange={(e) => {
                setIncome(e.target.value.replace(/[^0-9,]/g, ''));
                setError('');
              }}
              onKeyDown={handleKeyDown}
              placeholder="例如 8000"
              className="w-full pl-12 pr-4 py-4 bg-slate-800/50 border border-slate-700 rounded-xl text-white text-lg font-mono placeholder:text-slate-600 focus:outline-none focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20 transition-all"
              autoFocus
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm">
              ￥/月
            </div>
          </div>

          {error && (
            <p className="text-red-400 text-sm flex items-center gap-2">
              <HelpCircle className="w-4 h-4 shrink-0" />
              {error}
            </p>
          )}

          {/* Burden Preview (live) */}
          {income && !error && parseInt(income.replace(/,/g, ''), 10) > 0 && (
            <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/50 space-y-2">
              <p className="text-xs text-slate-500 flex items-center gap-1">
                <TrendingDown className="w-3 h-3" />
                假设你借了 1 万、分 12 期、月还 950：
              </p>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-amber-500 to-red-500 rounded-full transition-all duration-500"
                    style={{ 
                      width: `${Math.min(100, (950 / parseInt(income.replace(/,/g, ''), 10)) * 100)}%` 
                    }}
                  />
                </div>
                <span className="text-xs font-mono text-slate-400 shrink-0">
                  {(950 / parseInt(income.replace(/,/g, ''), 10) * 100).toFixed(0)}%
                </span>
              </div>
              <p className="text-xs text-slate-500">
                月供占收入 {(950 / parseInt(income.replace(/,/g, ''), 10) * 100).toFixed(0)}% 
                <span className={parseInt(income.replace(/,/g, ''), 10) < 3000 ? ' text-red-400' : ' text-slate-500'}>
                  {parseInt(income.replace(/,/g, ''), 10) < 3000 ? ' ⚠️ 负担较重' : ' — 仅供参考'}
                </span>
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={handleSubmit}
              className="flex-1 py-3.5 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl transition-all hover:scale-[1.02] active:scale-95 shadow-lg shadow-amber-500/20"
            >
              继续分析 →
            </button>
            <button
              onClick={onSkip}
              className="px-6 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-all text-sm font-medium border border-slate-700"
            >
              跳过
            </button>
          </div>

          <button
            onClick={onBack}
            className="w-full text-center text-sm text-slate-600 hover:text-slate-400 transition-colors py-2"
          >
            ← 返回上传图片
          </button>
        </div>

        {/* Why */}
        <div className="mt-6 pt-5 border-t border-slate-800">
          <div className="flex items-start gap-3">
            <HelpCircle className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-600 leading-relaxed">
              <p className="font-medium text-slate-500 mb-1">为什么需要你的收入？</p>
              <p>同样的 $500 月供，对月入 $3000 和 $10000 的人是完全不同的概念。我们根据你的 <span className="text-slate-400 font-medium">债务负担比</span> 判断你离崩溃有多远。</p>
              <p className="mt-1">你的收入数据仅在此浏览器中计算，<span className="text-emerald-500">不会上传到任何服务器</span>。</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default IncomeInput;