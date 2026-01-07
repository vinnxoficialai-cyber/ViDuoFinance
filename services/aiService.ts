export class VinnxAIService {
  private apiKey: string;

  constructor() {
    // JEITO SEGURO: Busca a chave nas variáveis de ambiente
    // Se estiver no seu PC, pega do .env
    // Se estiver na Vercel, pega das configurações do site
    this.apiKey = import.meta.env.VITE_GROQ_API_KEY || ""; 
  }

  async sendMessage(userMessage: string, financialContext: string) {
    if (!this.apiKey) {
      return "⚠️ Configuração Pendente: A Chave da API (VITE_GROQ_API_KEY) não foi encontrada.";
    }

    try {
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            {
              role: "system",
              content: `Você é a VinnxAI, consultora financeira. Contexto: ${financialContext}. Responda em PT-BR, curto e motivador.`
            },
            {
              role: "user",
              content: userMessage
            }
          ],
          temperature: 0.7,
          max_tokens: 300
        })
      });

      const data = await response.json();
      if (data.error) return `❌ Erro na IA: ${data.error.message}`;
      return data.choices[0].message.content;

    } catch (error: any) {
      return "Tive um problema de conexão. Tente novamente.";
    }
  }
}

export const vinnxAI = new VinnxAIService();