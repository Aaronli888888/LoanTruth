import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { AnalysisResult, ChartData, Language } from '../types';
import { getTexts } from '../utils/translations';

interface AnalysisChartProps {
  data: AnalysisResult;
  lang: Language;
}

const AnalysisChart: React.FC<AnalysisChartProps> = ({ data, lang }) => {
  const t = getTexts(lang);
  
  const chartData: ChartData[] = [
    { name: t.nominalRate.split(' (')[0], rate: data.nominalRate, fill: '#64748b' }, // Slate 500
    { name: t.realApr.split(' (')[0], rate: data.realApr, fill: data.realApr > 24 ? '#ef4444' : data.realApr > 15 ? '#f59e0b' : '#10b981' },
    ...data.marketComparison.map(m => ({
      name: `${t.marketAvg}`,
      rate: m.averageApr,
      fill: '#334155' // Slate 700
    })).slice(0, 1)
  ];

  return (
    <div className="w-full h-48 mt-2">
      <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 text-center">{t.chartTitle}</h3>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 0, right: 40, left: 10, bottom: 0 }}
          barCategoryGap={15}
        >
          <XAxis type="number" hide />
          <YAxis 
            dataKey="name" 
            type="category" 
            width={90} 
            stroke="#64748b" 
            tick={{fontSize: 11, fill: '#94a3b8'}}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip 
            cursor={{fill: '#334155', opacity: 0.1}}
            contentStyle={{ 
              backgroundColor: 'rgba(15, 23, 42, 0.9)', 
              borderColor: 'rgba(71, 85, 105, 0.5)', 
              color: '#f8fafc',
              borderRadius: '8px',
              fontSize: '12px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.5)'
            }}
            formatter={(value: number) => [`${value}%`]}
            itemStyle={{ color: '#e2e8f0' }}
          />
          <Bar dataKey="rate" radius={[0, 4, 4, 0]} barSize={24} label={{ position: 'right', fill: '#94a3b8', fontSize: 12, formatter: (v: number) => `${v}%` }}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default AnalysisChart;