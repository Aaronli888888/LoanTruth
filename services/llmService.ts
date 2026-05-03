import { AnalysisResult } from "../types";

// ============================================================
// 配置
// ============================================================
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";
const MODEL = "gemini-2.0-flash";
const API_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_API_KEY}`;

// ============================================================
// IRR 算法：Halley 迭代法
// ============================================================
function calculateIRR(cashFlows: number[], guess = 0.1): { rate: number, logs: string[] } {
  const maxIterations = 20;
  const tolerance = 1e-7;
  let rate = guess;
  const logs: string[] = [];
  logs.push(`[INIT] 初始猜测月利率 (Guess): ${(rate * 100).toFixed(4)}%`);
  for (let i = 0; i < maxIterations; i++) {
    let npv = 0, dNpv = 0, d2Npv = 0;
    for (let t = 0; t < cashFlows.length; t++) {
      const df = Math.pow(1 + rate, -t);
      npv += cashFlows[t] * df;
      if (t > 0) {
        dNpv -= t * cashFlows[t] * Math.pow(1 + rate, -t - 1);
        d2Npv += t * (t + 1) * cashFlows[t] * Math.pow(1 + rate, -t - 2);
      }
    }
    logs.push(`[ITER ${i + 1}] Rate: ${(rate * 100).toFixed(6)}% | NPV: ${npv.toFixed(4)}`);
    if (Math.abs(npv) < tolerance) { logs.push(`[DONE] 误差 < ${tolerance}，收敛成功。`); return { rate, logs }; }
    const denominator = 2 * dNpv * dNpv - npv * d2Npv;
    if (Math.abs(denominator) < 1e-15) {
      logs.push(`[FALLBACK] Halley 分母为0，回退到 Newton-Raphson`);
      if (Math.abs(dNpv) < 1e-15) { logs.push(`[FAIL] 导数为0`); return { rate, logs }; }
      rate = rate - npv / dNpv;
    } else {
      const newRate = rate - (2 * npv * dNpv) / denominator;
      if (Math.abs(newRate) > 100) { logs.push(`[WARN] 发散`); return { rate, logs }; }
      if (Math.abs(newRate - rate) < tolerance) { logs.push(`[DONE] 收敛`); return { rate: newRate, logs }; }
      rate = newRate;
    }
  }
  logs.push(`[STOP] 最大迭代次数`); return { rate, logs };
}

// ============================================================
// 图片压缩（缩放 + PNG 无损编码）
// ============================================================
function compressImage(base64: string, maxWidth = 1600): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let w = img.width, h = img.height;
      if (w > maxWidth) { h = (h * maxWidth) / w; w = maxWidth; }
      const canvas = document.createElement("canvas");
      canvas.width = w; canvas.height = h;
      canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = () => reject(new Error("图片加载失败"));
    img.src = base64;
  });
}

// ============================================================
// System Prompt
// ============================================================
const SYSTEM_PROMPT = `你是一个冷酷的金融审计师，专门揭露贷款广告中的真实利率陷阱。

核心原则：
1. 对广告中的利率数字持怀疑态度，寻找隐藏费用
2. 精确提取数值，用还款计划交叉验证宣传利率
3. 输出严格按 JSON 格式，只返回 JSON，不要其他文字

风险分级：
- LOW: 真实年化 < 10%（正常银行贷款）
- MEDIUM: 真实年化 10% - 24%（信用卡、消费贷）
- HIGH: 真实年化 24% - 36%（高息现金贷）
- SCAM: 真实年化 > 36% 或含有误导性宣传

你必须提取 verification.extractedParams 供外部算法交叉验证：
- principal: 贷款本金
- term: 分期期数（月）
- payment: 每期还款金额
- upfrontFees: 前置扣除费用（砍头息），无则为 0

所有数值字段必须为数字，不要加逗号或货币符号。`;

// ============================================================
// 主要分析函数
// ============================================================
export const analyzeLoanImage = async (base64Images: string[], monthlyIncome?: number): Promise<AnalysisResult> => {
  try {
    // 1. 压缩图片 + 提取纯 base64 数据
    const parts: any[] = [];
    for (const b64 of base64Images) {
      const compressed = await compressImage(b64);
      const pureB64 = compressed.replace(/^data:image\/\w+;base64,/, "");
      parts.push({ inlineData: { mimeType: "image/png", data: pureB64 } });
    }

    // 2. 构造文本 prompt
    parts.push({
      text: `分析以上贷款/金融产品截图，按以下 JSON 格式返回（不要包含其他文字）：

{
  "productType": "产品类型",
  "originalNominalRate": 宣传利率数值,
  "rateUnit": "DAY" 或 "MONTH" 或 "YEAR",
  "nominalRate": 折合年化名义利率(%),
  "realApr": 估算的真实年化 IRR(%),
  "monthlyPayment": 每期还款金额,
  "riskLevel": "LOW" 或 "MEDIUM" 或 "HIGH" 或 "SCAM",
  "verdict": "一句结论",
  "pitfalls": ["坑1", "坑2"],
  "hiddenFees": ["隐藏费用1"],
  "advice": "大白话建议",
  "debtCycleWarning": ${monthlyIncome ? '"债务循环警告文字"' : '""'},
  "investmentGamblingWarning": "投资赌博警告文字",
  "survivalRoadmap": ["步骤1", "步骤2", "步骤3", "步骤4", "步骤5"],
  "calculationDetails": {
    "formula": "IRR = ...",
    "explanation": "计算说明",
    "cashFlowSample": "T0: +本金, T1-Tn: -还款"
  },
  "marketComparison": [
    {"category": "银行消费贷", "averageApr": 6, "description": "参考"},
    {"category": "信用卡分期", "averageApr": 15, "description": "参考"}
  ],
  "verification": {
    "extractedParams": {
      "principal": 本金数字,
      "term": 期数数字,
      "payment": 每期还款数字,
      "upfrontFees": 前置费用数字或0
    }
  }
}`
    });

    if (monthlyIncome && monthlyIncome > 0) {
      parts.push({
        text: `用户的月收入约为：${monthlyIncome}。请额外计算 incomeBurdenAnalysis，格式：
"incomeBurdenAnalysis": {
  "debtToIncomeRatio": 债务收入比百分比,
  "monthlyPaymentRatio": 月供占收入比,
  "yearsToPayoff": 还清年数,
  "totalInterest": 总利息,
  "summary": "一句话总结"
}`
      });
    }

    const response = await fetchWithRetry({
      contents: [{ role: "user", parts }],
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
      generationConfig: { temperature: 0.1, maxOutputTokens: 4096 }
    });

    if (!response.ok) {
      const errBody = await response.text();
      throw new Error(`API 错误 (${response.status}): ${errBody}`);
    }

    const data = await response.json();
    let rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) throw new Error("AI 返回为空");

    // 清理 markdown 代码块标记
    rawText = rawText.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();

    // 3. 解析 JSON
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    const rawResult = JSON.parse(jsonMatch ? jsonMatch[0] : rawText);

    // ============================================================
    // 4. CLIENT-SIDE CROSS-VERIFICATION
    // ============================================================
    let finalApr = rawResult.realApr;
    const aiEstimatedApr = rawResult.realApr;
    let isVerified = false;
    let method: 'AI_ESTIMATE' | 'ALGORITHM_EXACT' = 'AI_ESTIMATE';
    const warnings: string[] = [];
    let calculationDetails = rawResult.calculationDetails || { formula: "IRR Estimation", explanation: "AI estimated.", cashFlowSample: "N/A" };
    const params = rawResult.verification?.extractedParams;

    if (params && params.principal > 0 && params.term > 0 && params.payment > 0) {
      const effectivePrincipal = params.principal - (params.upfrontFees || 0);
      const totalRepayment = params.payment * params.term;

      if (totalRepayment < effectivePrincipal) {
        warnings.push(`数据异常：总还款额 (${totalRepayment}) < 实际到手本金 (${effectivePrincipal})。已暂停算法验证。`);
      } else {
        const cashFlows = [effectivePrincipal];
        for (let i = 0; i < params.term; i++) cashFlows.push(-params.payment);

        try {
          const { rate: monthlyIRR, logs: iterationLogs } = calculateIRR(cashFlows);
          const calculatedAPR = monthlyIRR * 12 * 100;

          if (!isNaN(calculatedAPR) && calculatedAPR <= 1000 && calculatedAPR >= -100) {
            finalApr = Number(calculatedAPR.toFixed(2));
            isVerified = true;
            method = 'ALGORITHM_EXACT';
            const monthlyRatePercent = (monthlyIRR * 100).toFixed(4);
            const diff = (finalApr - aiEstimatedApr).toFixed(2);
            const diffVal = parseFloat(diff);
            let varianceExplanation = "";
            if (Math.abs(diffVal) > 5) {
              varianceExplanation = `\n[交叉验证] ⚠️ 算法值 (${finalApr}%) vs AI 估算 (${aiEstimatedApr}%) 差异较大 (${diff}%)。`;
            } else if (Math.abs(diffVal) > 0.1) {
              varianceExplanation = `\n[交叉验证] 偏差分析: AI 估算 ${aiEstimatedApr}% vs 算法 ${finalApr}%。`;
            }

            let incomeBurdenAnalysis = rawResult.incomeBurdenAnalysis;
            if (monthlyIncome && monthlyIncome > 0 && !incomeBurdenAnalysis) {
              const monthlyPayment = rawResult.monthlyPayment || params.payment;
              const ratio = (monthlyPayment / monthlyIncome) * 100;
              incomeBurdenAnalysis = {
                debtToIncomeRatio: Math.round(ratio * 100) / 100,
                monthlyPaymentRatio: Math.round(ratio * 100) / 100,
                yearsToPayoff: Math.round(params.term / 12 * 10) / 10,
                totalInterest: Math.round((params.payment * params.term) - effectivePrincipal),
                summary: ratio > 50 ? `⚠️ 月供占收入 ${ratio.toFixed(0)}%，债务陷阱！` : ratio > 30 ? `月供占收入 ${ratio.toFixed(0)}%，高负担。` : `月供占收入 ${ratio.toFixed(0)}%，尚可承受。`
              };
            }

            calculationDetails = {
              formula: `NPV = ${effectivePrincipal} - Σ (${params.payment} / (1 + r)^n) = 0`,
              cashFlowSample: `T0: +${effectivePrincipal.toLocaleString()}\nT1-T${params.term}: -${params.payment.toLocaleString()}`,
              iterationLogs,
              explanation: `1. 数据: 本金=${params.principal}, 前置扣除=${params.upfrontFees||0}, 到手=${effectivePrincipal}, 月供=${params.payment}, ${params.term}期\n2. 月利率 ≈ ${monthlyRatePercent}%\n3. 年化 IRR = ${finalApr}%${varianceExplanation}`.trim()
            };
          } else {
            warnings.push(`算法异常: APR=${calculatedAPR.toFixed(2)}%`);
          }
        } catch (e) {
          console.warn("Calculation failed", e);
          warnings.push("内部计算错误，回退至 AI 估算。");
        }
      }
    }

    return {
      ...rawResult,
      realApr: finalApr,
      aiEstimatedApr,
      warnings: warnings.length > 0 ? warnings : undefined,
      verification: { isVerified, method, extractedParams: params },
      calculationDetails
    };

  } catch (error) {
    console.error("Analysis Failed:", error);
    throw error;
  }
};

// ============================================================
// API 请求（带 429 自动重试）
// ============================================================
async function fetchWithRetry(body: Record<string, unknown>, maxRetries = 3): Promise<Response> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const resp = await fetch(API_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    if (resp.status !== 429 || attempt >= maxRetries) return resp;
    await new Promise(r => setTimeout(r, (attempt + 1) * 2_000));
  }
  throw new Error("API 请求重试耗尽");
}

export const analyzeLoanImageWithGemini = analyzeLoanImage;
