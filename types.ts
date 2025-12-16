export interface AnalysisResult {
  productType: string;
  nominalRate: number;
  realApr: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'SCAM';
  verdict: string; // A short punchy summary
  pitfalls: string[]; // List of specific traps found
  marketComparison: {
    category: string;
    averageApr: number;
    description: string;
  }[];
  advice: string; // Plain english advice
  hiddenFees: string[]; // Specific fees mentioned
}

export interface ChartData {
  name: string;
  rate: number;
  fill?: string;
}
