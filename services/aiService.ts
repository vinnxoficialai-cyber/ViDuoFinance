// src/services/aiService.ts
import { GoogleGenerativeAI } from "@google/generative-ai";

export class VinnxAIService {
  private genAI: GoogleGenerativeAI;
  private apiKey: string;

  constructor() {
    // CORREÇÃO: No Vite usamos import.meta.env
    this.apiKey = import.meta.env.VITE_GEMINI_API_KEY || "";
    if (!this.apiKey) {
      console.error("VinnxAI Error: API Key do Gemini não encontrada no .env.local");
    }
    this.genAI = new GoogleGenerativeAI(this.apiKey);
  }

  async getFinancialInsight(data: any) {
    // Usando o modelo Flash que é rápido e eficiente
    const model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
      Atue como VinnxAI, um mentor financeiro humano, leve e extremamente direto.
      Sua missão é dar um toque rápido sobre os dados do casal como se fosse um WhatsApp.
      
      REGRAS DE OURO:
      - Curto e Grosso (com carinho): Máximo de 2 ou 3 frases curtas.
      - NÃO use listas (numeradas ou bullets).
      - NÃO use negrito (**).
      - Sem enrolação: Foque no dado mais importante e comente.
      - Use expressões como 'Boa!', 'Fica de olho nisso', 'Que tal fazer assim?'.
      
      Dados contextuais:
      ${JSON.stringify(data)}
      
      Mande um insight extremamente curto e humano.
    `;

    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error("AI Error:", error);
      return "Oi! Tive um probleminha aqui. Mas ó, continua firme que logo a gente conversa.";
    }
  }

  createChat(contextData: string = "") {
    const model = this.genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      systemInstruction: `
        Você é o VinnxAI, um mentor financeiro para casais.
        Sua Regra de Ouro: NUNCA pergunte dados que você já possui.
        Seja extremamente breve (máximo de 3 frases ou 40 palavras).

        DADOS ATUAIS DO CASAL (Leia isso antes de responder):
        ${contextData}

        Instruções de Resposta:
        1. Analise os dados acima.
        2. Responda a pergunta do usuário direto ao ponto.
        3. Use tom coloquial e parceiro.
        4. Se o saldo for baixo, dê um alerta suave. Se for alto, parabenize.
        5. Seja cirúrgico. Sem textão.
      `
    });

    return model.startChat({
      history: [],
      generationConfig: {
        maxOutputTokens: 100,
      },
    });
  }
}

export const vinnxAI = new VinnxAIService();