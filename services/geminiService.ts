import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult, Language } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- IRR Calculation Logic (Newton-Raphson) ---
function calculateIRR(cashFlows: number[], guess = 0.1): number {
  const maxIterations = 100;
  const tolerance = 1e-6;
  let rate = guess;

  for (let i = 0; i < maxIterations; i++) {
    let npv = 0;
    let dNpv = 0;

    for (let t = 0; t < cashFlows.length; t++) {
      const df = Math.pow(1 + rate, -t);
      npv += cashFlows[t] * df;
      if (t > 0) {
        dNpv -= t * cashFlows[t] * Math.pow(1 + rate, -t - 1);
      }
    }

    if (Math.abs(npv) < tolerance) {
      return rate;
    }

    if (dNpv === 0) return rate;
    const newRate = rate - npv / dNpv;
    if (Math.abs(newRate - rate) < tolerance) return newRate;
    rate = newRate;
  }
  return rate;
}

const getSystemInstruction = (lang: Language) => `
You are an expert Financial Auditor and Loan Analyst.
Output Language: ${lang === 'zh' ? 'Simplified Chinese (zh-CN)' : 'English'}.

**ROLE & OBJECTIVE:**
Your goal is to protect the user by providing a **comprehensive, detailed, and professional analysis** of the financial product in the image.
Users are often confused by financial terms. You must explain the *why* and *how* behind the numbers in detail.

**ANALYSIS GUIDELINES:**
1. **Tone**: Professional, objective, educational, and empathetic. 
2. **Detail Level**:
   - **Verdict**: Provide a nuanced assessment (2-3 sentences). Explain the risk factors in detail.
   - **Pitfalls**: Detailed explanation of potential traps. Don't just list them; explain the mechanism (e.g., "The fee is calculated on the full principal throughout the term, not the remaining balance").
   - **Advice**: Provide tailored financial guidance (3-4 sentences). Suggest alternatives if the product is bad.
   - **Math**: Explain the IRR (Internal Rate of Return) concept clearly.

**CRITICAL RULE FOR RATES:**
- **originalNominalRate**: Extract exactly what is on the image (e.g., 0.05).
- **rateUnit**: Identify if it is Daily, Monthly, or Yearly.
- **nominalRate**: Convert the original rate to **ANNUAL** percentage.
  - Daily 0.05% -> Annual 18.25%
  - Monthly 0.6% -> Annual 7.2%

**Section Specifics:**
- **Risk Level**: Be strict. If the Real APR is > 24%, it is HIGH risk. If > 36%, it is likely a SCAM or predatory.
- **Hidden Fees**: Look for "Service Fee", "Insurance", "Guarantee Fee", "Membership Fee".
`;

export const analyzeLoanImage = async (base64Image: string, lang: Language): Promise<AnalysisResult> => {
  try {
    const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "");

    const prompt = `
      Please perform a deep-dive analysis of this financial product image.
      
      **1. Data Extraction & Calculation**:
      - **Product Type**: Specific name (e.g., "Cash Loan", "Revolving Credit").
      - **Nominal Rate**: 
         - \`originalNominalRate\`: The raw number shown (e.g. 0.05).
         - \`rateUnit\`: 'DAY', 'MONTH', or 'YEAR'.
         - \`nominalRate\`: The Annualized % (e.g. 18.25).
      - **Verification Params**: Extract Principal, Term, Monthly Payment, Upfront Fees.
      - **Real APR (IRR)**: Calculate the Internal Rate of Return (Annualized).

      **2. Qualitative Analysis (Detailed)**:
      - **Verdict**: Is this product safe? Why or why not? Provide a summary.
      - **Pitfalls**: Identify specific clauses or pricing structures that are unfavorable. Explain *why* they are bad.
      - **Advice**: What should the user consider before taking this loan? 
      - **Calculation Logic**: Explain the difference between the Advertised Rate and the Real APR. Explain the "Time Value of Money" impact.

      Output JSON only matching the schema.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: cleanBase64
            }
          },
          { text: prompt }
        ]
      },
      config: {
        systemInstruction: getSystemInstruction(lang),
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            productType: { type: Type.STRING },
            originalNominalRate: { type: Type.NUMBER },
            rateUnit: { type: Type.STRING, enum: ["DAY", "MONTH", "YEAR"] },
            nominalRate: { type: Type.NUMBER, description: "Annualized Rate" },
            realApr: { type: Type.NUMBER },
            riskLevel: { type: Type.STRING, enum: ["LOW", "MEDIUM", "HIGH", "SCAM"] },
            verdict: { type: Type.STRING },
            pitfalls: { type: Type.ARRAY, items: { type: Type.STRING } },
            marketComparison: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  category: { type: Type.STRING },
                  averageApr: { type: Type.NUMBER },
                  description: { type: Type.STRING }
                }
              }
            },
            advice: { type: Type.STRING },
            hiddenFees: { type: Type.ARRAY, items: { type: Type.STRING } },
            calculationDetails: {
              type: Type.OBJECT,
              properties: {
                formula: { type: Type.STRING },
                explanation: { type: Type.STRING },
                cashFlowSample: { type: Type.STRING }
              }
            },
            verification: {
              type: Type.OBJECT,
              properties: {
                extractedParams: {
                  type: Type.OBJECT,
                  properties: {
                    principal: { type: Type.NUMBER },
                    term: { type: Type.NUMBER },
                    payment: { type: Type.NUMBER },
                    upfrontFees: { type: Type.NUMBER },
                  },
                  required: ["principal", "term", "payment", "upfrontFees"]
                }
              }
            }
          }
        }
      }
    });

    if (!response.text) {
      throw new Error("No response from AI");
    }

    const rawResult = JSON.parse(response.text);

    // Sanitize arrays and objects
    const result: AnalysisResult = {
      ...rawResult,
      originalNominalRate: rawResult.originalNominalRate ?? rawResult.nominalRate,
      rateUnit: rawResult.rateUnit || 'YEAR',
      pitfalls: Array.isArray(rawResult.pitfalls) ? rawResult.pitfalls : [],
      marketComparison: Array.isArray(rawResult.marketComparison) ? rawResult.marketComparison : [],
      hiddenFees: Array.isArray(rawResult.hiddenFees) ? rawResult.hiddenFees : [],
      advice: rawResult.advice || "",
      calculationDetails: rawResult.calculationDetails || { formula: "N/A", explanation: "Not available", cashFlowSample: "" }
    };

    // --- HEURISTIC CHECK FOR NOMINAL RATE UNITS ---
    // If AI failed to identify unit and Nominal Rate is suspiciously low (< 2.5%) but Real APR is high (> 6%).
    if (result.nominalRate > 0 && result.nominalRate < 2.5 && result.realApr > 6.0) {
      let originalNominal = result.nominalRate;
      let didAutoCorrect = false;

      // Case 1: Likely Daily Rate (e.g., 0.05%)
      // Threshold: < 0.2% usually implies daily
      if (result.nominalRate < 0.2) {
        result.originalNominalRate = originalNominal;
        result.rateUnit = 'DAY';
        result.nominalRate = Number((result.nominalRate * 365).toFixed(2));
        didAutoCorrect = true;
      } 
      // Case 2: Likely Monthly Rate (e.g., 0.5% - 2.0%)
      // Threshold: >= 0.2% and < 2.5% usually implies monthly
      else {
        result.originalNominalRate = originalNominal;
        result.rateUnit = 'MONTH';
        result.nominalRate = Number((result.nominalRate * 12).toFixed(2));
        didAutoCorrect = true;
      }

      if (didAutoCorrect) {
        console.log(`Auto-corrected Nominal Rate from ${originalNominal} to ${result.nominalRate}`);
        // Add a note to the explanation
        const note = lang === 'zh' 
          ? `\n[系统修正]: 检测到宣称利率 (${originalNominal}%) 疑似为${result.rateUnit === 'DAY' ? '日息' : '月息'}，已自动换算为年化利率 (${result.nominalRate}%) 以便对比。`
          : `\n[System Correction]: Detected advertised rate (${originalNominal}%) as likely ${result.rateUnit}. Converted to Annual (${result.nominalRate}%) for fair comparison.`;
        
        result.calculationDetails.explanation += note;
      }
    }

    // --- CLIENT-SIDE IRR VERIFICATION LOGIC ---
    let verificationStatus: AnalysisResult['verification'] = {
      isVerified: false,
      method: 'AI_ESTIMATE',
      correctionApplied: false,
      extractedParams: result.verification?.extractedParams
    };

    const params = result.verification?.extractedParams;
    
    // Check if we have valid parameters to perform a check
    if (params && params.principal > 0 && params.term > 0 && params.payment > 0) {
      const principal = params.principal;
      const fees = params.upfrontFees || 0;
      const payment = params.payment;
      const term = params.term;

      const cashFlows = [principal - fees];
      for (let i = 0; i < term; i++) {
        cashFlows.push(-payment);
      }

      try {
        const monthlyIRR = calculateIRR(cashFlows);
        const calculatedAPR = monthlyIRR * 12 * 100;
        
        if (!isNaN(calculatedAPR) && calculatedAPR > 0 && calculatedAPR < 1000) {
          verificationStatus.isVerified = true;
          verificationStatus.method = 'ALGORITHM_EXACT';
          
          if (Math.abs(calculatedAPR - result.realApr) > 1.0) {
            console.warn(`Correcting AI APR (${result.realApr}%) to Calculated APR (${calculatedAPR.toFixed(2)}%)`);
            result.realApr = Number(calculatedAPR.toFixed(2));
            verificationStatus.correctionApplied = true;
            
            result.calculationDetails.explanation += `\n[System Note]: AI original estimate (${rawResult.realApr}%) was corrected to exact mathematical value based on extracted numbers.`;
          }
        }
      } catch (e) {
        console.warn("IRR Calculation failed", e);
      }
    }

    result.verification = verificationStatus;
    return result;

  } catch (error) {
    console.error("Gemini Analysis Failed:", error);
    throw error;
  }
};