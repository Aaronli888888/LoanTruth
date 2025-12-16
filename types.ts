export interface AnalysisResult {
  productType: string;
  originalNominalRate?: number; // The raw number found (e.g. 0.05)
  rateUnit?: 'DAY' | 'MONTH' | 'YEAR'; // The unit found (e.g. Day)
  nominalRate: number; // Annualized nominal rate
  
  realApr: number; // The Final Verified Truth (Algo or AI)
  aiEstimatedApr?: number; // The original AI estimation (for comparison)
  
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
  warnings?: string[]; // Data integrity warnings from cross-verification
  
  // New fields for transparency and verification
  calculationDetails: {
    formula: string; // Description of the formula used
    explanation: string; // Text explanation of the math
    cashFlowSample?: string; // e.g. "In: +10000, Out: -850/mo * 12"
    iterationLogs?: string[]; // Log of Newton-Raphson steps
  };
  verification: {
    isVerified: boolean; // True if local algorithm matches AI or local algo was used
    method: 'AI_ESTIMATE' | 'ALGORITHM_EXACT';
    extractedParams?: {
      principal: number;
      term: number;
      payment: number;
      upfrontFees?: number;
    };
  };
}

export interface ChartData {
  name: string;
  rate: number;
  fill?: string;
}