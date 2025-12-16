import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { AnalysisResult, ChartData } from '../types';

interface AnalysisChartProps {
  data: AnalysisResult;
}

const AnalysisChart: React.FC<AnalysisChartProps> = ({ data }) => {
  const chartData: ChartData[] = [
    { name: '宣称利率', rate: data.nominalRate, fill: '#3b82f6' }, // Blue
    { name: '真实年化 (IRR)', rate: data.realApr, fill: data.realApr > 24 ? '#ef4444' : data.realApr > 15 ? '#f59e0b' : '#10b981' }, // Dynamic color
    ...data.marketComparison.map(m => ({
      name: `市场平均 (${m.category})`,
      rate: m.averageApr,
      fill: '#64748b' // Slate
    })).slice(0, 1) // Just take the first relevant comparison to keep chart clean
  ];

  return (
    <div className="w-full h-64 mt-4 bg-card rounded-lg p-4 border border-slate-700">
      <h3 className="text-sm font-semibold text-slate-400 mb-4 text-center">利率真相对比图 (%)</h3>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#334155" />
          <XAxis type="number" stroke="#94a3b8" unit="%" />
          <YAxis dataKey="name" type="category" width={100} stroke="#94a3b8" style={{ fontSize: '12px' }} />
          <Tooltip 
            cursor={{fill: '#334155', opacity: 0.2}}
            contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', color: '#f1f5f9' }}
          />
          <Bar dataKey="rate" radius={[0, 4, 4, 0]} barSize={30}>
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
