import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Send, Trash2, Bot, TrendingUp, TrendingDown, Target, AlertTriangle, ShieldCheck, Wallet } from 'lucide-react';
import { useFinance } from '../App';
import { vinnxAI } from '../services/aiService';

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
  const hasInitialized = useRef(false);

  // --- 1. CÁLCULO DOS DADOS REAIS (CONTEXTO) ---
  const stats = useMemo(() => {
    const totalBalance = accounts.reduce((acc, curr) => acc + curr.balance, 0);
    const now = new Date();
    
    // Gastos do Mês
    const expenses = transactions
      .filter(t => {
        const d = new Date(t.date);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() && t.type === 'expense';
      })
      .reduce((acc, t) => acc + t.amount, 0);
    
    // Receitas do Mês
    const income = transactions
      .filter(t => {
        const d = new Date(t.date);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() && t.type === 'income';
      })
      .reduce((acc, t) => acc + t.amount, 0);

    // Maior Categoria (Vilão)
    const categories: Record<string, number> = {};
    transactions
      .filter(t => t.type === 'expense' && new Date(t.date).getMonth() === now.getMonth())
      .forEach(t => { categories[t.category] = (categories[t.category] || 0) + t.amount; });
    
    const topCategoryEntry = Object.entries(categories).sort((a, b) => b[1] - a[1])[0];
    const topCategory = topCategoryEntry ? topCategoryEntry[0] : 'Nenhuma';
    const topCategoryAmount = topCategoryEntry ? topCategoryEntry[1] : 0;

    // Meta Principal
    const mainGoal = goals[0];
    const goalProgress = mainGoal && mainGoal.target > 0 ? ((mainGoal.current / mainGoal.target) * 100).toFixed(0) : "0";

    return { totalBalance, expenses, income, topCategory, topCategoryAmount, mainGoal, goalProgress };
  }, [accounts, transactions, creditCards, goals]);

  // --- 2. PREPARAR O TEXTO PARA A IA ---
  const getContextString = () => {
    return `
      - Nome do Usuário: ${userProfile.name}
      - Saldo Total (Todas as Contas): R$ ${stats.totalBalance.toLocaleString('pt-BR')}
      - Total Gasto Este Mês: R$ ${stats.expenses.toLocaleString('pt-BR')}
      - Total Recebido Este Mês: R$ ${stats.income.toLocaleString('pt-BR')}
      - Categoria Onde Mais Gastou: ${stats.topCategory} (R$ ${stats.topCategoryAmount.toLocaleString('pt-BR')})
      - Progresso da Meta Principal: ${stats.goalProgress}%
    `;
  };

  // --- 3. EFEITO DE DIGITAÇÃO ---
  const simulateTypingEffect = async (text: string) => {
    setIsTyping(true);
    await new Promise(resolve => setTimeout(resolve, 600)); // Delay inicial
    
    // Divide em parágrafos para não vir um bloco de texto gigante
    const paragraphs = text.split('\n').filter(p => p.trim() !== "");

    for (const paragraph of paragraphs) {
        // Velocidade da digitação baseada no tamanho do texto
        await new Promise(resolve => setTimeout(resolve, 500 + Math.min(paragraph.length * 10, 1500)));
        setMessages(prev => [...prev, { id: Math.random().toString(), role: 'model', text: paragraph }]);
    }
    setIsTyping(false);
  };

  // --- 4. AÇÃO DE ENVIAR (CONECTADA AO SERVIÇO) ---
  const handleAction = async (text: string) => {
    if (!text.trim() || isTyping) return;

    // 1. Mostra a mensagem do usuário
    setMessages(prev => [...prev, { id: Math.random().toString(), role: 'user', text }]);
    setInputValue('');
    setIsTyping(true);

    // 2. Pega os dados atuais e manda para a IA
    const context = getContextString();
    const response = await vinnxAI.sendMessage(text, context);

    // 3. Exibe a resposta da IA com efeito
    setIsTyping(false); // Reseta para o simulateTypingEffect assumir
    await simulateTypingEffect(response);
  };

  // Mensagem Inicial
  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    const hour = new Date().getHours();
    let greeting = "Bom dia";
    if (hour >= 12) greeting = "Boa tarde";
    if (hour >= 18) greeting = "Boa noite";

    let initialTip = "Tudo sob controle por enquanto. Sobre o que vamos falar?";
    if (stats.totalBalance < 0) initialTip = "⚠️ O saldo está negativo. Vamos traçar um plano?";
    else if (stats.expenses > stats.income && stats.income > 0) initialTip = `⚠️ Atenção: Os gastos com ${stats.topCategory} estão altos.`;

    simulateTypingEffect(`${greeting}, ${userProfile.name}! 👋\nSou a Vinnx.\n${initialTip}`);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

  // Auto-scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  return (
    <div className="flex flex-col h-[80vh] md:h-[85vh] bg-[#09090b] rounded-[2.5rem] overflow-hidden border border-zinc-800 shadow-2xl relative max-w-5xl mx-auto animate-in fade-in zoom-in-95 duration-500">
      
      {/* 1. Header */}
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
            <p className="text-[10px] font-bold text-[#A3E635] uppercase tracking-widest">Online</p>
          </div>
        </div>
        <button onClick={() => { setMessages([]); hasInitialized.current = false; window.location.reload(); }} className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-full transition-all">
           <Trash2 size={18} />
        </button>
      </header>

      {/* 2. Mini Dashboard (Dados Reais) */}
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

      {/* 4. Sugestões Rápidas */}
      {!isTyping && messages.length > 0 && (
        <div className="px-4 pb-2 flex gap-2 overflow-x-auto scrollbar-hide">
            <button onClick={() => handleAction("Faça um resumo financeiro geral")} className="whitespace-nowrap px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-full text-[10px] font-bold text-zinc-400 hover:text-white hover:border-[#8B5CF6] transition-all flex items-center gap-2">
                <Wallet size={12}/> Resumo Geral
            </button>
            <button onClick={() => handleAction("Dê uma dica para economizar")} className="whitespace-nowrap px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-full text-[10px] font-bold text-zinc-400 hover:text-white hover:border-[#8B5CF6] transition-all flex items-center gap-2">
                <ShieldCheck size={12}/> Dica de Economia
            </button>
            <button onClick={() => handleAction("Analise minha meta principal")} className="whitespace-nowrap px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-full text-[10px] font-bold text-zinc-400 hover:text-white hover:border-[#8B5CF6] transition-all flex items-center gap-2">
                <Target size={12}/> Analisar Meta
            </button>
            <button onClick={() => handleAction("Estou gastando muito com cartão?")} className="whitespace-nowrap px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-full text-[10px] font-bold text-zinc-400 hover:text-white hover:border-[#8B5CF6] transition-all flex items-center gap-2">
                <AlertTriangle size={12}/> Alerta Cartão
            </button>
        </div>
      )}

      {/* 5. Área de Input */}
      <div className="p-4 bg-[#09090b] border-t border-zinc-800">
        <form onSubmit={(e) => { e.preventDefault(); handleAction(inputValue); }} className="relative flex items-center gap-3">
          <input 
            type="text" 
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Pergunte sobre seus gastos..."
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