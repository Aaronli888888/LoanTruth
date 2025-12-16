import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_INSTRUCTION = `
You are a world-class financial auditor and consumer advocate. Your goal is to protect users (often called "leeks" or "韭菜" in slang) from predatory loans. 
You specialize in calculating the TRUE Annual Percentage Rate (APR/IRR) from misleading advertisements, bank screenshots, or contracts.
You speak in "Chinese Internet Slang" style but keep the financial logic rigorous. Be direct, slightly sarcastic about banks/scammers, but extremely helpful to the user.
Always convert "Daily Interest" (万分之X) or "Monthly Fee" (分期费率) into strict annualized compound rates (IRR).
`;

export const analyzeLoanImage = async (base64Image: string): Promise<AnalysisResult> => {
  try {
    // We strip the prefix if present because the API expects just the base64 data
    const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "");

    const prompt = `
      Please analyze this image. It is likely a screenshot of a loan offer, credit card installment plan, or financial product.
      
      1. Identify the Product Type (e.g., Cash Loan, Mortgage, Car Loan, Credit Card Installment).
      2. Extract the 'Nominal Rate' (the rate they advertise, e.g., 'Daily interest 0.05%' or 'Fee 0.3%/month'). Convert this to a yearly percentage for the 'nominalRate' field.
      3. CALCULATE the 'Real APR' (IRR). This is the most important step. If it's a flat fee installment, the IRR is usually ~1.8x to 2x the nominal fee sum. Use the standard financial formulas to estimate the true cost of money.
      4. Compare with standard market rates in China/Global for this category.
      5. Identify hidden traps (fees, prepayment penalties, insurance premiums).
      6. Provide a verdict: 'LOW' (Safe), 'MEDIUM' (Caution), 'HIGH' (Predatory), 'SCAM' (Illegal/Usury).
      
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
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            productType: { type: Type.STRING, description: "Type of loan (e.g., 消费贷, 房贷, 高利贷)" },
            nominalRate: { type: Type.NUMBER, description: "Advertised yearly rate %" },
            realApr: { type: Type.NUMBER, description: "Calculated Real APR (IRR) %" },
            riskLevel: { type: Type.STRING, enum: ["LOW", "MEDIUM", "HIGH", "SCAM"] },
            verdict: { type: Type.STRING, description: "A 5-10 word punchy summary in Chinese" },
            pitfalls: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "List of 3-5 specific traps/risks in Chinese" 
            },
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
            advice: { type: Type.STRING, description: "Detailed advice in '大白话' (Plain Chinese) on how to avoid pits or if they should take it." },
            hiddenFees: { type: Type.ARRAY, items: { type: Type.STRING } }
          }
        }
      }
    });

    if (!response.text) {
      throw new Error("No response from AI");
    }

    const result = JSON.parse(response.text) as AnalysisResult;
    return result;

  } catch (error) {
    console.error("Gemini Analysis Failed:", error);
    throw error;
  }
};
