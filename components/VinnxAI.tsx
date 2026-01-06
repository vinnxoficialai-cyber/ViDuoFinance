import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Send, Trash2, Bot, Sparkles, TrendingUp, TrendingDown, Target, AlertTriangle, ShieldCheck, Wallet } from 'lucide-react';
import { useFinance } from '../App';

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
}

const VinnxAIView: React.FC = () => {
  const { accounts, transactions, creditCards, goals, userProfile } = useFinance();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  // Trava de segurança para não duplicar a mensagem inicial
  const hasInitialized = useRef(false);

  // --- 1. CÉREBRO DA IA: CALCULAR O CONTEXTO FINANCEIRO REAL ---
  const stats = useMemo(() => {
    const totalBalance = accounts.reduce((acc, curr) => acc + curr.balance, 0);
    const now = new Date();
    
    // Gastos do Mês Atual
    const expenses = transactions
      .filter(t => {
        const d = new Date(t.date);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() && t.type === 'expense';
      })
      .reduce((acc, t) => acc + t.amount, 0);
    
    // Receitas do Mês Atual
    const income = transactions
      .filter(t => {
        const d = new Date(t.date);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() && t.type === 'income';
      })
      .reduce((acc, t) => acc + t.amount, 0);

    // Maior Categoria de Gasto
    const categories: Record<string, number> = {};
    transactions
      .filter(t => t.type === 'expense' && new Date(t.date).getMonth() === now.getMonth())
      .forEach(t => { categories[t.category] = (categories[t.category] || 0) + t.amount; });
    
    const topCategoryEntry = Object.entries(categories).sort((a, b) => b[1] - a[1])[0];
    const topCategory = topCategoryEntry ? topCategoryEntry[0] : 'Nenhuma';
    const topCategoryAmount = topCategoryEntry ? topCategoryEntry[1] : 0;

    // Cartões
    const creditUsed = creditCards.reduce((acc, c) => acc + c.used, 0);
    const creditLimit = creditCards.reduce((acc, c) => acc + c.limit, 0);
    const creditUtilization = creditLimit > 0 ? (creditUsed / creditLimit) * 100 : 0;

    // Metas
    const mainGoal = goals[0];
    const goalProgress = mainGoal && mainGoal.target > 0 ? ((mainGoal.current / mainGoal.target) * 100).toFixed(0) : "0";

    return { totalBalance, expenses, income, creditUsed, creditUtilization, topCategory, topCategoryAmount, mainGoal, goalProgress };
  }, [accounts, transactions, creditCards, goals]);

  // --- 2. GERADOR DE RESPOSTAS INTELIGENTES ---
  const generateAIResponse = (query: string): string[] => {
    const q = query.toLowerCase();
    const responses: string[] = [];

    // Lógica: RESUMO
    if (q.includes('resumo') || q.includes('geral') || q.includes('situação')) {
        responses.push(`📊 **Resumo Executivo do Casal:**`);
        responses.push(`O saldo atual em todas as contas é de **R$ ${stats.totalBalance.toLocaleString()}**.`);
        
        if (stats.income > stats.expenses) {
            const savings = stats.income - stats.expenses;
            responses.push(`✅ **Ótima notícia:** Neste mês, vocês estão no azul! Sobraram **R$ ${savings.toLocaleString()}** até agora.`);
            responses.push(`💡 **Dica:** Que tal direcionar 50% desse valor para a meta "${stats.mainGoal?.title || 'Reserva'}"?`);
        } else {
            const deficit = stats.expenses - stats.income;
            responses.push(`⚠️ **Atenção:** Os gastos superaram as receitas em R$ ${deficit.toLocaleString()}.`);
            responses.push(`O maior vilão foi a categoria **${stats.topCategory}** (R$ ${stats.topCategoryAmount.toLocaleString()}). Vamos tentar reduzir isso semana que vem?`);
        }
        return responses;
    }

    // Lógica: CONSELHO / ECONOMIA
    if (q.includes('conselho') || q.includes('dica') || q.includes('economizar') || q.includes('ajuda')) {
        responses.push("Analisando seus hábitos de consumo... 🧐");
        
        if (stats.creditUtilization > 30) {
            responses.push(`🚨 **Alerta de Crédito:** Vocês estão usando ${stats.creditUtilization.toFixed(0)}% do limite dos cartões.`);
            responses.push("Meu conselho número 1: **Parem de usar o cartão** até pagar a próxima fatura. Juros de cartão destroem patrimônios.");
        } else if (stats.topCategoryAmount > (stats.income * 0.2)) {
            responses.push(`Notei que **${stats.topCategory}** está consumindo uma fatia muito grande da renda.`);
            responses.push(`👉 **Desafio da Vinnx:** Tentem reduzir os gastos com ${stats.topCategory} em 20% no próximo mês. Isso liberaria R$ ${(stats.topCategoryAmount * 0.2).toLocaleString()} para seus sonhos!`);
        } else {
            responses.push("Vocês estão bem equilibrados! 🏆");
            responses.push("O próximo passo para a liberdade financeira é aumentar os aportes mensais. Tentem aumentar o investimento mensal em R$ 100,00.");
        }
        return responses;
    }

    // Lógica: METAS
    if (q.includes('meta') || q.includes('sonho') || q.includes('objetivo')) {
        if (!stats.mainGoal) return ["Vocês ainda não cadastraram nenhuma meta. Vão na aba 'Metas' e criem um sonho! ✨"];
        
        const remaining = stats.mainGoal.target - stats.mainGoal.current;
        responses.push(`🎯 **Foco no Objetivo: ${stats.mainGoal.title}**`);
        responses.push(`Já completamos **${stats.goalProgress}%** do caminho.`);
        
        if (stats.income > stats.expenses) {
            const savings = stats.income - stats.expenses;
            const months = savings > 0 ? Math.ceil(remaining / savings) : 0;
            if (months > 0) {
                responses.push(`Faltam R$ ${remaining.toLocaleString()}. No ritmo atual de economia (R$ ${savings.toLocaleString()}/mês), vocês chegam lá em cerca de **${months} meses**! 🚀`);
            } else {
                responses.push(`Faltam R$ ${remaining.toLocaleString()}. Continue economizando para acelerar!`);
            }
        } else {
            responses.push(`Faltam R$ ${remaining.toLocaleString()}. Precisamos voltar a economizar para ter uma previsão de quando vamos conquistar isso.`);
        }
        return responses;
    }

    // Fallback
    return [
        "Posso analisar qualquer parte da vida financeira de vocês.",
        "Tente perguntar: 'Me dê um resumo', 'Preciso de um conselho' ou 'Como está minha meta?'"
    ];
  };

  // --- 3. EFEITO DE DIGITAÇÃO E BOAS VINDAS ---
  
  // Função para simular a IA digitando
  const simulateConversation = async (texts: string[]) => {
    setIsTyping(true);
    for (const text of texts) {
        // Tempo de leitura proporcional ao texto (mínimo 800ms)
        await new Promise(resolve => setTimeout(resolve, 800 + text.length * 20));
        setMessages(prev => {
            // Evita duplicar se a última mensagem for idêntica (segurança extra)
            if (prev.length > 0 && prev[prev.length - 1].text === text) return prev;
            return [...prev, { id: Math.random().toString(), role: 'model', text }];
        });
    }
    setIsTyping(false);
  };

  useEffect(() => {
    // Se já inicializou, não faz nada (Evita duplicação no React StrictMode)
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    const hour = new Date().getHours();
    let greeting = "Bom dia";
    if (hour >= 12) greeting = "Boa tarde";
    if (hour >= 18) greeting = "Boa noite";

    // Mensagem de Boas-vindas baseada no Saldo
    let initialTip = "";
    if (stats.totalBalance < 0) initialTip = "Vi que o saldo está negativo. Quer um plano de recuperação?";
    else if (stats.expenses > stats.income && stats.income > 0) initialTip = "Os gastos estão altos este mês. Quer um resumo?";
    else initialTip = "As finanças estão saudáveis! Como posso ajudar a otimizar hoje?";

    const welcomeMsg = [
        `${greeting}, ${userProfile.name}! 👋`,
        `Sou a Vinnx, sua consultora financeira.`,
        initialTip
    ];

    simulateConversation(welcomeMsg);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Roda apenas ao montar

  const handleSendMessage = () => {
    if (!inputValue.trim() || isTyping) return;

    const text = inputValue;
    setInputValue('');
    setMessages(prev => [...prev, { id: Math.random().toString(), role: 'user', text }]);
    
    // Aciona a IA
    const aiResponses = generateAIResponse(text);
    simulateConversation(aiResponses);
  };

  const handleQuickAction = (text: string) => {
    if (isTyping) return;
    setMessages(prev => [...prev, { id: Math.random().toString(), role: 'user', text }]);
    const aiResponses = generateAIResponse(text);
    simulateConversation(aiResponses);
  };

  // Auto-scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  return (
    <div className="flex flex-col h-[80vh] md:h-[85vh] bg-[#09090b] rounded-[2.5rem] overflow-hidden border border-zinc-800 shadow-2xl relative max-w-5xl mx-auto animate-in fade-in zoom-in-95 duration-500">
      
      {/* 1. Header Fixo */}
      <header className="flex items-center justify-between px-6 py-4 bg-[#09090b]/90 backdrop-blur-md border-b border-zinc-800 z-10">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 bg-gradient-to-tr from-[#8B5CF6] to-indigo-600 rounded-full flex items-center justify-center text-white shadow-lg">
              <Bot size={20} />
            </div>
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-zinc-950 rounded-full flex items-center justify-center">
               <span className="w-2 h-2 bg-[#A3E635] rounded-full animate-ping absolute opacity-75"></span>
               <span className="w-2 h-2 bg-[#A3E635] rounded-full relative"></span>
            </div>
          </div>
          <div>
            <h2 className="text-sm font-bold text-white tracking-wide">VinnxAI</h2>
            <p className="text-[10px] font-bold text-[#A3E635] uppercase tracking-widest">Consultora Oficial</p>
          </div>
        </div>
        <button onClick={() => { setMessages([]); hasInitialized.current = false; window.location.reload(); }} className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-full transition-all">
           <Trash2 size={18} />
        </button>
      </header>

      {/* 2. Mini Dashboard (Resumo Rápido) */}
      <div className="grid grid-cols-3 gap-1 px-4 py-2 bg-[#18181b] border-b border-zinc-800">
         <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-zinc-900/50 border border-zinc-800/50">
            <div className="flex items-center gap-1 text-[9px] uppercase font-bold text-zinc-500 mb-0.5"><TrendingUp size={10} /> Saldo</div>
            <span className={`text-xs font-black ${stats.totalBalance >= 0 ? 'text-white' : 'text-rose-500'}`}>R$ {stats.totalBalance.toLocaleString('pt-BR', {compactDisplay: "short", notation: "compact"})}</span>
         </div>
         <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-zinc-900/50 border border-zinc-800/50">
            <div className="flex items-center gap-1 text-[9px] uppercase font-bold text-zinc-500 mb-0.5"><TrendingDown size={10} /> Gastos Mês</div>
            <span className="text-xs font-black text-rose-400">R$ {stats.expenses.toLocaleString('pt-BR', {compactDisplay: "short", notation: "compact"})}</span>
         </div>
         <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-zinc-900/50 border border-zinc-800/50">
            <div className="flex items-center gap-1 text-[9px] uppercase font-bold text-zinc-500 mb-0.5"><Target size={10} /> Meta</div>
            <span className="text-xs font-black text-[#A3E635]">{stats.goalProgress}%</span>
         </div>
      </div>

      {/* 3. Área de Chat */}
      <div className="flex-1 overflow-y-auto px-4 md:px-6 pt-6 pb-4 space-y-4 bg-[#09090b] scrollbar-thin scrollbar-thumb-zinc-800">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2`}>
            <div className={`max-w-[85%] md:max-w-[70%] px-5 py-3 text-sm md:text-[15px] leading-relaxed shadow-md ${
                msg.role === 'user' 
                  ? 'bg-[#27272a] text-white rounded-2xl rounded-tr-none' 
                  : 'bg-[#8B5CF6] text-white rounded-2xl rounded-tl-none'
              }`}
            >
              {/* Renderização de Markdown Simples */}
              {msg.text.split('\n').map((line, i) => (
                  <p key={i} className={i > 0 ? 'mt-2' : ''}>
                      {line.split('**').map((part, idx) => idx % 2 === 1 ? <strong key={idx}>{part}</strong> : part)}
                  </p>
              ))}
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex justify-start animate-in fade-in">
            <div className="bg-[#8B5CF6] px-4 py-3 rounded-2xl rounded-tl-none flex items-center gap-1.5 shadow-md">
              <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce [animation-delay:-0.3s]"></span>
              <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce [animation-delay:-0.15s]"></span>
              <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce"></span>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* 4. Sugestões Rápidas (Aparecem quando não está digitando) */}
      {!isTyping && messages.length > 0 && (
        <div className="px-4 pb-2 flex gap-2 overflow-x-auto scrollbar-hide">
            <button onClick={() => handleQuickAction("Gere um resumo financeiro")} className="whitespace-nowrap px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-full text-[10px] font-bold text-zinc-400 hover:text-white hover:border-[#8B5CF6] transition-all flex items-center gap-2">
                <Wallet size={12}/> Resumo Geral
            </button>
            <button onClick={() => handleQuickAction("Me dê um conselho para economizar")} className="whitespace-nowrap px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-full text-[10px] font-bold text-zinc-400 hover:text-white hover:border-[#8B5CF6] transition-all flex items-center gap-2">
                <ShieldCheck size={12}/> Dica de Economia
            </button>
            <button onClick={() => handleQuickAction("Como está minha meta principal?")} className="whitespace-nowrap px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-full text-[10px] font-bold text-zinc-400 hover:text-white hover:border-[#8B5CF6] transition-all flex items-center gap-2">
                <Target size={12}/> Analisar Meta
            </button>
            <button onClick={() => handleQuickAction("Estou gastando muito com cartão?")} className="whitespace-nowrap px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-full text-[10px] font-bold text-zinc-400 hover:text-white hover:border-[#8B5CF6] transition-all flex items-center gap-2">
                <AlertTriangle size={12}/> Alerta Cartão
            </button>
        </div>
      )}

      {/* 5. Área de Input */}
      <div className="p-4 bg-[#09090b] border-t border-zinc-800">
        <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="relative flex items-center gap-3">
          <input 
            type="text" 
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Digite algo para a Vinnx..."
            disabled={isTyping}
            className="w-full bg-[#18181b] text-white border border-zinc-800 rounded-full pl-6 pr-14 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]/50 transition-all placeholder:text-zinc-600 disabled:opacity-50"
          />
          <button 
            type="submit"
            disabled={!inputValue.trim() || isTyping}
            className="absolute right-2 p-2.5 bg-[#27272a] hover:bg-[#3f3f46] rounded-full text-[#A3E635] disabled:opacity-30 transition-all active:scale-90"
          >
            <Send size={20} fill="currentColor" />
          </button>
        </form>
        <p className="text-center text-[10px] text-zinc-600 mt-2 font-medium">IA Financeira Especialista em Casais • Vinnx</p>
      </div>
    </div>
  );
};

export default VinnxAIView;