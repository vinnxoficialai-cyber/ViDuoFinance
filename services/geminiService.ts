import { GoogleGenerativeAI } from "@google/generative-ai";

export class VinnxAIService {
  private genAI: GoogleGenerativeAI;
  private apiKey: string;

  constructor() {
    // Pega a chave do arquivo .env.local
    this.apiKey = import.meta.env.VITE_GEMINI_API_KEY || "";
    if (!this.apiKey) {
      console.error("VinnxAI Error: API Key não encontrada!");
    }
    this.genAI = new GoogleGenerativeAI(this.apiKey);
  }

  async getFinancialInsight(data: any) {
    const model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `Analise estes dados financeiros e dê uma dica curta: ${JSON.stringify(data)}`;

    try {
      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (error) {
      console.error("Erro AI:", error);
      return "Estou recarregando minhas energias, tente novamente em breve.";
    }
  }

  createChat(contextData: string = "") {
    const model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    return model.startChat({
      history: [
        {
          role: "user",
          parts: [{ text: `O contexto do usuário é: ${contextData}` }],
        },
      ],
    });
  }
}

// ESTA LINHA É A MAIS IMPORTANTE (Correção do erro):
export const vinnxAI = new VinnxAIService();