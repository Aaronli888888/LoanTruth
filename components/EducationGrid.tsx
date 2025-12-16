import React from 'react';
import { CreditCard, Banknote, Percent, AlertOctagon, ArrowRight, HelpCircle, ShieldAlert, Ban } from 'lucide-react';

const TRAPS = [
  {
    icon: <CreditCard className="w-6 h-6 text-blue-400" />,
    title: "信用卡账单分期",
    tagline: "“免息”不等于免费",
    trap: "商家通常宣传“0利息，仅收0.6%手续费”。听起来年化是 0.6% x 12 = 7.2%？大错特错！",
    truth: "因为你的本金是按月归还的，但手续费却一直按全额本金计算。随着本金减少，实际利率越来越高。",
    formula: "真实年化 ≈ 名义费率 × 12 × 1.83",
    example: "月费率 0.6% ≈ 真实年化 13.2%",
    color: "from-blue-500/10 to-blue-600/5"
  },
  {
    icon: <AlertOctagon className="w-6 h-6 text-red-400" />,
    title: "信用卡最低还款",
    tagline: "全额罚息的温床",
    trap: "只需还款 10% 就能不逾期？这其实是银行最赚钱的项目。一旦你选择了最低还款，免息期立刻失效。",
    truth: "利息会从你消费的那一天开始，按全额账单计算复利（通常是日息万五，即年化18.25%），哪怕你只剩1元没还，也要按全额算利息。",
    formula: "真实年化 > 18.25% (复利)",
    example: "还了99%，利息仍按100%算",
    color: "from-red-500/10 to-red-600/5"
  },
  {
    icon: <Percent className="w-6 h-6 text-emerald-400" />,
    title: "网贷/微粒贷/借呗",
    tagline: "日息万五的迷惑",
    trap: "宣传“日息万五”（0.05%），借1万每天只要5块钱，感觉很便宜？",
    truth: "0.05% x 365 = 18.25%。这已经是很多银行经营贷利率（3.5%-4.5%）的4倍以上。而且部分平台采用“等本等息”法，实际利率更高。",
    formula: "年化 = (1 + 日息)^365 - 1",
    example: "日息0.05% = 年化 18.25%",
    color: "from-emerald-500/10 to-emerald-600/5"
  },
  {
    icon: <Banknote className="w-6 h-6 text-orange-400" />,
    title: "现金贷 (砍头息)",
    tagline: "到手金额被打折",
    trap: "申请借款 10000 元，实际到手只有 8500 元，平台说是预扣了服务费、保证金或咨询费。",
    truth: "这叫“砍头息”，是典型的高利贷特征。你的本金实际上只有 8500，但利息却按 10000 算。这会让真实利率瞬间翻倍甚至更高。",
    formula: "IRR 基于实际到手金额计算",
    example: "扣费15% = 利率直接翻倍",
    color: "from-orange-500/10 to-orange-600/5"
  },
  {
    icon: <ShieldAlert className="w-6 h-6 text-indigo-400" />,
    title: "隐性费用 (捆绑销售)",
    tagline: "保险费/担保费/会员费",
    trap: "利率看着很低（如 7%），但必须购买一份“个人借款保证保险”或开通“黑卡会员”才能放款。",
    truth: "这些杂费本质上都是利息！很多时候保费比利息还高。合规的计算必须包含利息、保费、担保费、服务费等所有支出。",
    formula: "综合成本 = 利息 + 所有杂费",
    example: "利息8% + 保费20% = 真实28%",
    color: "from-indigo-500/10 to-indigo-600/5"
  },
  {
    icon: <Ban className="w-6 h-6 text-rose-400" />,
    title: "提前还款违约金",
    tagline: "想省利息？没门",
    trap: "想提前还清贷款以节省利息？发现合同规定要收 3% 违约金，或者“手续费不退还”。",
    truth: "如果手续费不退或收违约金，意味着你占用资金的时间短了，但付出的总成本没少。根据 IRR 原理，期限越短，真实年化利率反而会呈指数级飙升。",
    formula: "IRR 随期限缩短而飙升",
    example: "借1年第1月还清 = 年化超100%",
    color: "from-rose-500/10 to-rose-600/5"
  }
];

const EducationGrid: React.FC = () => {
  return (
    <div className="w-full max-w-6xl mx-auto mt-16 px-4 animate-fade-in pb-16">
      <div className="flex items-center gap-2 mb-8 justify-center sm:justify-start">
        <HelpCircle className="w-6 h-6 text-slate-400" />
        <h2 className="text-2xl font-bold text-slate-200 tracking-tight">
          常见金融产品“坑”位解析
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {TRAPS.map((item, idx) => (
          <div 
            key={idx} 
            className={`
              relative overflow-hidden rounded-2xl border border-slate-700/50 
              bg-gradient-to-br ${item.color} backdrop-blur-sm
              hover:border-slate-600 transition-colors duration-300
              group flex flex-col
            `}
          >
            <div className="p-6 flex-grow flex flex-col">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-slate-900/50 rounded-xl border border-slate-700 shadow-sm shrink-0">
                    {item.icon}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-100 leading-tight">{item.title}</h3>
                    <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mt-1">{item.tagline}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4 flex-grow">
                <div className="bg-slate-900/40 rounded-lg p-3 border-l-2 border-red-500/50">
                  <p className="text-sm text-slate-300 leading-relaxed">
                    <span className="text-red-400 font-bold mr-1 block sm:inline">商家话术:</span> 
                    {item.trap}
                  </p>
                </div>

                <div className="bg-slate-900/40 rounded-lg p-3 border-l-2 border-emerald-500/50">
                  <p className="text-sm text-slate-300 leading-relaxed">
                    <span className="text-emerald-400 font-bold mr-1 block sm:inline">数学真相:</span> 
                    {item.truth}
                  </p>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-700/30 flex flex-col gap-2 text-xs">
                <div className="flex items-center gap-2 text-slate-400">
                   <span className="shrink-0">🧮 公式:</span>
                   <code className="bg-slate-800 px-1.5 py-0.5 rounded text-slate-300 font-mono truncate w-full">{item.formula}</code>
                </div>
                <div className="font-bold text-slate-300 flex items-center gap-1">
                   <ArrowRight size={12} className="text-emerald-500 shrink-0" />
                   {item.example}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="text-center mt-12 mb-8">
         <p className="text-slate-500 text-sm">
            看不懂复杂的合同？直接截图上传，让 AI 帮你拆解每一分钱的去向。
         </p>
      </div>
    </div>
  );
};

export default EducationGrid;