import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- Local Algorithm: Newton-Raphson for IRR ---
// Returns both the rate and the execution logs for transparency
function calculateIRR(cashFlows: number[], guess = 0.1): { rate: number, logs: string[] } {
  const maxIterations = 20; // Newton's method usually converges very fast
  const tolerance = 1e-7;
  let rate = guess;
  const logs: string[] = [];
  
  logs.push(`[INIT] 初始猜测月利率 (Guess): ${(rate * 100).toFixed(4)}%`);

  for (let i = 0; i < maxIterations; i++) {
    let npv = 0;
    let dNpv = 0; // Derivative of NPV

    // f(r) = Σ C_t / (1+r)^t
    // f'(r) = Σ -t * C_t / (1+r)^(t+1)
    for (let t = 0; t < cashFlows.length; t++) {
      const df = Math.pow(1 + rate, -t);
      npv += cashFlows[t] * df;
      if (t > 0) {
        dNpv -= t * cashFlows[t] * Math.pow(1 + rate, -t - 1);
      }
    }

    logs.push(`[ITER ${i + 1}] Rate: ${(rate * 100).toFixed(6)}% | NPV(误差): ${npv.toFixed(4)} | f'(x): ${dNpv.toFixed(2)}`);

    if (Math.abs(npv) < tolerance) {
      logs.push(`[DONE] 误差 < ${tolerance}，收敛成功。`);
      return { rate, logs };
    }

    if (dNpv === 0) {
      logs.push(`[FAIL] 导数为0，无法继续迭代。`);
      return { rate, logs };
    }

    const newRate = rate - npv / dNpv;
    
    // Safety check for wild divergence
    if (Math.abs(newRate) > 100) { 
        logs.push(`[WARN] 结果发散，停止计算。`);
        return { rate, logs }; 
    }
    
    if (Math.abs(newRate - rate) < tolerance) {
        logs.push(`[DONE] 变化量极小，收敛成功。`);
        return { rate: newRate, logs };
    }
    
    rate = newRate;
  }
  
  logs.push(`[STOP] 达到最大迭代次数 (${maxIterations})。`);
  return { rate, logs };
}

const SYSTEM_INSTRUCTION = `
You are a Ruthless Financial Auditor and Consumer Protection Expert. 
Your mission is to expose the TRUTH behind financial loan advertisements. 
Output Language: Chinese (Simplified) for text fields, English for keys.

**CORE PRINCIPLES:**
1. **Skepticism**: Assume the ad is trying to hide the true cost. Look for small print.
2. **Precision**: Extract exact numbers. Do not round up/down unless necessary for final format.
3. **Cross-Validation**: If you see "Monthly Interest 0.5%" but "Total Repayment" implies 20% APR, trust the Repayment schedule.

**CRITICAL DEFINITIONS:**
- **Nominal Rate (Simple)**: The rate often advertised (e.g., "Daily 0.05%").
- **Real APR (IRR)**: The Internal Rate of Return. THIS IS THE TRUTH. It considers compound interest and time value of money.
  - If "Daily 0.05%", Nominal is 18.25%, but Real APR (IRR) is often higher (~20%+) if compound or fees exist.
  - If "Monthly 0.6%", Nominal is 7.2%.
  - If "Fee per period" exists, add it to the payment to calculate Real APR.

**RISK CLASSIFICATION RULES:**
- **LOW**: Real APR < 10% (Bank loans, Mortgages).
- **MEDIUM**: Real APR 10% - 24% (Credit cards, Standard consumer loans).
- **HIGH**: Real APR 24% - 36% (High-interest cash loans).
- **SCAM**: Real APR > 36% OR misleading terms (e.g., advertised 7% but real is 30%).

**DATA EXTRACTION INSTRUCTIONS:**
You must extract raw values for the 'verification' object so our external algorithm can double-check you:
- **Principal**: Total loan amount.
- **Term**: Total duration in months.
- **Payment**: Amount paid per period (Principal + Interest + Fees).
- **UpfrontFees**: Any amount deducted before receiving cash (砍头息).
`;

export const analyzeLoanImage = async (base64Images: string[]): Promise<AnalysisResult> => {
  try {
    const parts = base64Images.map(base64 => {
      const cleanBase64 = base64.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "");
      return {
        inlineData: {
          mimeType: "image/jpeg",
          data: cleanBase64
        }
      };
    });

    const prompt = `
      Analyze the provided images of a loan/financial product. 
      Act as a "Rate Detector" (利率照妖镜).

      **STEP 1: IDENTIFY PRODUCT**
      What is it? (Cash Loan, Credit Card Installment, Auto Loan, Payday Loan, etc.)

      **STEP 2: EXTRACT NUMBERS (CRITICAL)**
      Scan all images for:
      - Loan Amount (本金)
      - Periods/Term (期数, in months)
      - Repayment Amount (每期还款)
      - Fees (手续费, 服务费, 保险费, 担保费) -> Treat these as INTEREST.
      - Advertised Rate (宣传利率)

      **STEP 3: CALCULATE REAL APR (IRR)**
      Estimate the Internal Rate of Return (IRR) annualized.
      - If you have exact Principal, Term, and Payment, use them to calculate IRR precisely.
      - If specific numbers are missing, estimate based on the advertised rate type (e.g. Daily 0.05% -> (1+0.0005)^365 - 1).
      - **WARNING**: Advertised "Service Fee" + "Low Interest" usually means HIGH IRR.

      **STEP 4: DETECT TRAPS**
      Look for:
      - "Insurance fee" required to get the loan.
      - "Prepayment penalty" (提前还款违约金).
      - "Compound interest" hidden in terms.
      - "砍头息" (Upfront deduction).

      **STEP 5: EXPLAIN CALCULATION**
      - formula: Show the math (e.g. "APR = (1 + r)^n - 1" or "Newton-Raphson method for IRR").
      - cashFlowSample: Show the flows (e.g. "T0: +10000 (Principal), T1-T12: -890 (Repayment)").

      **STEP 6: GENERATE ADVICE**
      Be direct. If it's a bad deal, say "Don't touch this." If it's okay, say "Acceptable but be careful."
      
      Output JSON only.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          ...parts,
          { text: prompt }
        ]
      },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.0, // Force deterministic output
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            productType: { type: Type.STRING },
            originalNominalRate: { type: Type.NUMBER },
            rateUnit: { type: Type.STRING, enum: ["DAY", "MONTH", "YEAR"] },
            nominalRate: { type: Type.NUMBER, description: "Annualized Rate %" },
            realApr: { type: Type.NUMBER, description: "AI Estimated APR" },
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

    // --- CLIENT-SIDE CROSS-VERIFICATION ---
    // We trust Math over AI for the final number, but we check for Logical Sanity first.
    let finalApr = rawResult.realApr;
    const aiEstimatedApr = rawResult.realApr; 
    let isVerified = false;
    let method: 'AI_ESTIMATE' | 'ALGORITHM_EXACT' = 'AI_ESTIMATE';
    
    const warnings: string[] = [];
    
    // Default explanation from AI
    let calculationDetails = rawResult.calculationDetails || { 
      formula: "IRR Estimation", 
      explanation: "AI estimated based on advertised rates.", 
      cashFlowSample: "N/A" 
    };
    
    const params = rawResult.verification?.extractedParams;

    if (params && params.principal > 0 && params.term > 0 && params.payment > 0) {
      
      const effectivePrincipal = params.principal - (params.upfrontFees || 0);
      const totalRepayment = params.payment * params.term;

      // SANITY CHECK 1: Negative Interest / Impossible Terms
      if (totalRepayment < effectivePrincipal) {
        warnings.push(`数据异常警报：识别到的总还款额 (${totalRepayment}) 小于实际到手本金 (${effectivePrincipal})。`);
        warnings.push(`可能原因：1. "每期还款"识别为不含本金的利息；2. 存在未识别的尾款；3. 期数识别错误。`);
        warnings.push(`已自动暂停算法验证，保留 AI 估算结果供参考。`);
      } else {
        // Construct Cash Flow if sane
        const cashFlows = [effectivePrincipal];
        for (let i = 0; i < params.term; i++) {
          cashFlows.push(-params.payment);
        }

        try {
          // Calculate IRR
          const { rate: monthlyIRR, logs: iterationLogs } = calculateIRR(cashFlows);
          const calculatedAPR = monthlyIRR * 12 * 100; 
          
          // SANITY CHECK 2: Result Validity
          if (isNaN(calculatedAPR) || calculatedAPR > 1000 || calculatedAPR < -100) {
             warnings.push(`算法异常：计算出的 APR (${calculatedAPR.toFixed(2)}%) 超出合理范围。可能是输入参数极度偏差导致。`);
          } else {
            // Valid calculation - Override AI
            finalApr = Number(calculatedAPR.toFixed(2));
            isVerified = true;
            method = 'ALGORITHM_EXACT';
            
            const monthlyRatePercent = (monthlyIRR * 100).toFixed(4);
            const diff = (finalApr - aiEstimatedApr).toFixed(2);
            const diffVal = parseFloat(diff);
            
            let varianceExplanation = "";
            if (Math.abs(diffVal) > 5) {
               varianceExplanation = `
[交叉验证] ⚠️ 注意：算法计算值 (${finalApr}%) 与 AI 估算值 (${aiEstimatedApr}%) 存在较大差异 (${diffVal > 0 ? '+' : ''}${diff}%)。
通常算法结果更准确，因为它基于具体的现金流（每期还款 ${params.payment} × ${params.term}期）。
差异原因可能是 AI 低估了复利效应或手续费的影响。
               `.trim();
            } else if (Math.abs(diffVal) > 0.1) {
               varianceExplanation = `
[交叉验证] 偏差分析: AI 估算 ${aiEstimatedApr}% vs 算法精确值 ${finalApr}%。
               `.trim();
            }

            calculationDetails = {
              formula: `NPV = ${effectivePrincipal} - Σ (${params.payment} / (1 + r)^n) = 0`,
              cashFlowSample: `T0 (借款): +${effectivePrincipal.toLocaleString()}\nT1 - T${params.term} (还款): -${params.payment.toLocaleString()}`,
              iterationLogs: iterationLogs,
              explanation: `
1. 数据提取 (Data Extraction):
   - 借款本金: ${params.principal}
   - 前置扣除: ${params.upfrontFees || 0}
   - 实际到手: ${effectivePrincipal}
   - 每期还款: ${params.payment}
   - 期数: ${params.term}

2. 算法求解 (Algorithm):
   - 使用牛顿迭代法求解实际月利率。
   - 收敛结果: 月利率 ≈ ${monthlyRatePercent}%

3. 最终验证:
   - 真实年化 (IRR) = ${monthlyRatePercent}% × 12 = ${finalApr}%

${varianceExplanation}
              `.trim()
            };
          }
        } catch (e) {
          console.warn("Calculation failed", e);
          warnings.push("内部计算错误，已回退至 AI 估算值。");
        }
      }
    } else {
      // params missing
      if (rawResult.verdict.includes("High") || rawResult.riskLevel === "SCAM") {
         // No warnings needed, just typical behavior
      }
    }

    const result: AnalysisResult = {
      ...rawResult,
      realApr: finalApr,
      aiEstimatedApr: aiEstimatedApr,
      warnings: warnings.length > 0 ? warnings : undefined,
      verification: {
        isVerified,
        method,
        extractedParams: params
      },
      calculationDetails: calculationDetails
    };

    return result;

  } catch (error) {
    console.error("Gemini Analysis Failed:", error);
    throw error;
  }
};