import { GoogleGenAI } from "@google/genai";
import { Expense } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getFinancialAdvice = async (
  query: string,
  expenses: Expense[],
  baseCurrency: string
): Promise<string> => {
  try {
    // Summarize data to reduce token usage and provide context
    const summary = expenses.map(e => 
      `- ${e.date}: ${e.description} (${e.amount} ${e.currency}) [${e.category}]`
    ).join('\n');

    const prompt = `
      You are a smart personal finance assistant. 
      The user's base currency is ${baseCurrency}.
      
      Here is the user's recent transaction history:
      ${summary}

      User Question: "${query}"

      Provide a helpful, concise, and friendly answer. 
      If the user asks for totals, calculate them accurately based on the provided list.
      If the user asks for advice, provide actionable tips based on their spending habits visible in the list.
      Format the response with clear paragraphs or bullet points.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: "You are a helpful financial assistant for an Android app. Keep responses concise and easy to read on mobile.",
      }
    });

    return response.text || "I couldn't generate a response at this time.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Sorry, I'm having trouble connecting to the financial brain right now. Please try again later.";
  }
};
