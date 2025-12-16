export type Language = 'zh' | 'en';

export interface AnalysisResult {
  productType: string;
  originalNominalRate?: number; // The raw number seen in the image (e.g. 0.05)
  rateUnit?: 'DAY' | 'MONTH' | 'YEAR'; // The unit of the raw number
  nominalRate: number; // The Annualized rate (e.g. 18.25)
  realApr: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'SCAM';
  verdict: string;
  pitfalls: string[];
  marketComparison: {
    category: string;
    averageApr: number;
    description: string;
  }[];
  advice: string;
  hiddenFees: string[];
  calculationDetails: {
    formula: string;
    explanation: string; // Detailed step-by-step explanation
    cashFlowSample: string; // e.g. "Loan: +10000, Month 1: -850..."
  };
  verification?: {
    isVerified: boolean;
    method: 'AI_ESTIMATE' | 'ALGORITHM_EXACT';
    correctionApplied: boolean;
    extractedParams?: {
      principal: number;
      term: number;
      payment: number;
      upfrontFees: number;
    };
  };
}

export interface ChartData {
  name: string;
  rate: number;
  fill?: string;
}