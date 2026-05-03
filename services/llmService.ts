import { AnalysisResult } from "../types";

// ============================================================
// 配置
// ============================================================
const API_ENDPOINT = "https://open.bigmodel.cn/api/paas/v4/chat/completions";
const API_KEY = import.meta.env.VITE_ZHIPU_API_KEY || "";
const MODEL = "glm-4v-flash";

// ============================================================
// IRR 算法：Halley 迭代法（三阶收敛，比 Newton-Raphson 快 3x）
// ============================================================
function calculateIRR(cashFlows: number[], guess = 0.1): { rate: number, logs: string[] } {
  const maxIterations = 20;
  const tolerance = 1e-7;
  let rate = guess;
  const logs: string[] = [];

  logs.push(`[INIT] 初始猜测月利率 (Guess): ${(rate * 100).toFixed(4)}%`);

  for (let i = 0; i < maxIterations; i++) {
    let npv = 0;
    let dNpv = 0;    // f'(r)
    let d2Npv = 0;   // f''(r)

    for (let t = 0; t < cashFlows.length; t++) {
      const df = Math.pow(1 + rate, -t);
      npv += cashFlows[t] * df;
      if (t > 0) {
        dNpv -= t * cashFlows[t] * Math.pow(1 + rate, -t - 1);
        d2Npv += t * (t + 1) * cashFlows[t] * Math.pow(1 + rate, -t - 2);
      }
    }

    logs.push(`[ITER ${i + 1}] Rate: ${(rate * 100).toFixed(6)}% | NPV: ${npv.toFixed(4)}`);

    if (Math.abs(npv) < tolerance) {
      logs.push(`[DONE] 误差 < ${tolerance}，收敛成功。`);
      return { rate, logs };
    }

    // Halley 公式：x_new = x - 2f(x)f'(x) / [2(f'(x))² - f(x)f''(x)]
    const denominator = 2 * dNpv * dNpv - npv * d2Npv;

    if (Math.abs(denominator) < 1e-15) {
      // 分母接近零，回退到 Newton-Raphson
      logs.push(`[FALLBACK] Halley 分母为0，回退到 Newton-Raphson`);
      if (Math.abs(dNpv) < 1e-15) {
        logs.push(`[FAIL] 导数为0，无法继续迭代。`);
        return { rate, logs };
      }
      rate = rate - npv / dNpv;
    } else {
      const newRate = rate - (2 * npv * dNpv) / denominator;

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
  }

  logs.push(`[STOP] 达到最大迭代次数 (${maxIterations})。`);
  return { rate, logs };
}

// ============================================================
// 图片压缩（上传前缩小体积）
// ============================================================
function compressImage(base64: string, maxWidth = 1600, quality = 0.92): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let w = img.width;
      let h = img.height;

      // 等比例缩放
      if (w > maxWidth) {
        h = (h * maxWidth) / w;
        w = maxWidth;
      }

      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => reject(new Error("图片加载失败"));
    img.src = base64;
  });
}

// ============================================================
// System Prompt（与原来一致，精简至核心）
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
    // 1. 压缩所有图片
    const compressedImages = await Promise.all(
      base64Images.map(b64 => compressImage(b64.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "data:image/jpeg;base64,")))
    );

    // 2. 构造请求体（GLM-4V-Flash 多模态格式）
    const userContent: any[] = [];

    // 添加所有图片
    for (const img of compressedImages) {
      userContent.push({
        type: "image_url",
        image_url: { url: img }
      });
    }

    // 添加文本 prompt
    userContent.push({
      type: "text",
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

    // 收入负担分析
    if (monthlyIncome && monthlyIncome > 0) {
      userContent.push({
        type: "text",
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

    const response = await fetch(API_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userContent }
        ],
        temperature: 0.1,
        max_tokens: 4096
      })
    });

    if (!response.ok) {
      const errBody = await response.text();
      throw new Error(`API 错误 (${response.status}): ${errBody}`);
    }

    const data = await response.json();
    const rawText = data.choices?.[0]?.message?.content;
    if (!rawText) throw new Error("AI 返回为空");

    // 3. 解析 JSON（AI 可能夹带额外文字）
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    const rawResult = JSON.parse(jsonMatch ? jsonMatch[0] : rawText);

    // ============================================================
    // 4. CLIENT-SIDE CROSS-VERIFICATION（与原来一致）
    // ============================================================
    let finalApr = rawResult.realApr;
    const aiEstimatedApr = rawResult.realApr;
    let isVerified = false;
    let method: 'AI_ESTIMATE' | 'ALGORITHM_EXACT' = 'AI_ESTIMATE';
    const warnings: string[] = [];

    let calculationDetails = rawResult.calculationDetails || {
      formula: "IRR Estimation",
      explanation: "AI estimated based on advertised rates.",
      cashFlowSample: "N/A"
    };

    const params = rawResult.verification?.extractedParams;

    if (params && params.principal > 0 && params.term > 0 && params.payment > 0) {
      const effectivePrincipal = params.principal - (params.upfrontFees || 0);
      const totalRepayment = params.payment * params.term;

      if (totalRepayment < effectivePrincipal) {
        warnings.push(`数据异常警报：识别到的总还款额 (${totalRepayment}) 小于实际到手本金 (${effectivePrincipal})。`);
        warnings.push(`可能原因：1. "每期还款"识别为不含本金的利息；2. 存在未识别的尾款；3. 期数识别错误。`);
        warnings.push(`已自动暂停算法验证，保留 AI 估算结果供参考。`);
      } else {
        const cashFlows = [effectivePrincipal];
        for (let i = 0; i < params.term; i++) {
          cashFlows.push(-params.payment);
        }

        try {
          const { rate: monthlyIRR, logs: iterationLogs } = calculateIRR(cashFlows);
          const calculatedAPR = monthlyIRR * 12 * 100;

          if (isNaN(calculatedAPR) || calculatedAPR > 1000 || calculatedAPR < -100) {
            warnings.push(`算法异常：计算出的 APR (${calculatedAPR.toFixed(2)}%) 超出合理范围。可能是输入参数极度偏差导致。`);
          } else {
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
差异原因可能是 AI 低估了复利效应或手续费的影响。`;
            } else if (Math.abs(diffVal) > 0.1) {
              varianceExplanation = `
[交叉验证] 偏差分析: AI 估算 ${aiEstimatedApr}% vs 算法精确值 ${finalApr}%。`;
            }

            // 客户端收入负担分析
            let incomeBurdenAnalysis = rawResult.incomeBurdenAnalysis;
            if (monthlyIncome && monthlyIncome > 0 && !incomeBurdenAnalysis) {
              const monthlyPayment = rawResult.monthlyPayment || params.payment;
              const ratio = (monthlyPayment / monthlyIncome) * 100;
              const totalInterestCalc = (params.payment * params.term) - effectivePrincipal;

              incomeBurdenAnalysis = {
                debtToIncomeRatio: Math.round(ratio * 100) / 100,
                monthlyPaymentRatio: Math.round((monthlyPayment / monthlyIncome) * 100) / 100,
                yearsToPayoff: Math.round(params.term / 12 * 10) / 10,
                totalInterest: Math.round(totalInterestCalc),
                summary: ratio > 50
                  ? `⚠️ 你的月供 (${monthlyPayment}) 占月收入 (${monthlyIncome}) 的 ${ratio.toFixed(0)}%！超过 50% = 债务陷阱，基本没有余力应付生活开支。`
                  : ratio > 30
                    ? `月供占收入 ${ratio.toFixed(0)}%，属于高负担。超过 30% 就已经很吃力了。`
                    : `月供占收入 ${ratio.toFixed(0)}%，尚可承受，但仍需注意不要新增其他债务。`
              };
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
   - 使用 Halley 迭代法求解实际月利率（三阶收敛）。
   - 收敛结果: 月利率 ≈ ${monthlyRatePercent}%

3. 最终验证:
   - 真实年化 (IRR) = ${monthlyRatePercent}% × 12 = ${finalApr}%

${varianceExplanation}`.trim()
            };
          }
        } catch (e) {
          console.warn("Calculation failed", e);
          warnings.push("内部计算错误，已回退至 AI 估算值。");
        }
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
    console.error("Analysis Failed:", error);
    throw error;
  }
};

// ============================================================
// 导出函数别名（兼容旧代码）
// ============================================================
export const analyzeLoanImageWithGemini = analyzeLoanImage;
