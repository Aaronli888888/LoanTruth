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
  
  calculationDetails: {
    formula: string;
    explanation: string;
    cashFlowSample?: string;
    iterationLogs?: string[];
  };
  verification: {
    isVerified: boolean;
    method: 'AI_ESTIMATE' | 'ALGORITHM_EXACT';
    extractedParams?: {
      principal: number;
      term: number;
      payment: number;
      upfrontFees?: number;
    };
  };

  // --- New fields for income-burden & human impact ---
  incomeBurdenAnalysis?: {
    /** Debt-to-income ratio in percentage (e.g. 40 means 40% of income goes to loan) */
    debtToIncomeRatio: number;
    /** Monthly payment / Monthly income */
    monthlyPaymentRatio: number;
    /** Years to pay off at current rate */
    yearsToPayoff: number;
    /** Total interest paid over full term */
    totalInterest: number;
    /** Human-readable summary */
    summary: string;
  };
  /** WARNING: Don't take more loans to pay this one */
  debtCycleWarning?: string;
  /** WARNING: Don't use stocks/crypto/gambling to get out */
  investmentGamblingWarning?: string;
  /** Positive step-by-step survival advice */
  survivalRoadmap?: string[];
  /** Monthly payment amount (for burden calculation client-side) */
  monthlyPayment?: number;
}

export interface ChartData {
  name: string;
  rate: number;
  fill?: string;
}
