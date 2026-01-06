
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Send, MoreVertical, Trash2, Bot, Sparkles } from 'lucide-react';
import { vinnxAI } from '../services/geminiService';
import { useFinance } from '../App';

const VinnxAIView: React.FC = () => {
  const { accounts, transactions, creditCards, goals } = useFinance();
  const [messages, setMessages] = useState<{ id: string; role: 'user' | 'model'; text: string }[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(true); // Starts true to simulate initial analysis
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatInstance = useRef<any>(null);

  // Calculate Context Data
  const contextData = useMemo(() => {
    const totalBalance = accounts.reduce((acc, curr) => acc + curr.balance, 0);
    
    const now = new Date();
    const expenses = transactions
      .filter(t => {
        const d = new Date(t.date);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() && t.type === 'expense';
      })
      .reduce((acc, t) => acc + t.amount, 0);

    const totalInvoice = creditCards.reduce((acc, c) => acc + c.used, 0);

    const mainGoal = goals[0];
    const goalName = mainGoal ? mainGoal.title : "Nenhuma meta definida";
    const goalProgress = mainGoal && mainGoal.target > 0 ? ((mainGoal.current / mainGoal.target) * 100).toFixed(0) : "0";

    return `
Saldo em Conta: R$ ${totalBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
Gastos este mês: R$ ${expenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
Fatura Cartão Aberta: R$ ${totalInvoice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
Principal Meta: ${goalName} (Progresso: ${goalProgress}%)
    `.trim();
  }, [accounts, transactions, creditCards, goals]);

  // Auto-start and Welcome Message
  useEffect(() => {
    // Initialize Gemini Chat with Context
    if (!chatInstance.current) {
      chatInstance.current = vinnxAI.createChat(contextData);
    }

    // Simulate initial delay and welcome message
    const timer = setTimeout(() => {
      const hour = new Date().getHours();
      let greeting = "Bom dia";
      if (hour >= 12) greeting = "Boa tarde";
      if (hour >= 18) greeting = "Boa noite";

      const initialMessage = {
        id: 'init-1',
        role: 'model' as const,
        text: `${greeting}, Casal! ☀️ Já analisei as contas de hoje. Vocês têm R$ ${accounts.reduce((acc, curr) => acc + curr.balance, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} disponíveis no total. Querem uma sugestão de como usar?`
      };

      setMessages([initialMessage]);
      setIsTyping(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []); // Run once on mount

  // Auto-scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userText = inputValue;
    const newMsgId = Math.random().toString(36).substr(2, 9);
    
    // Add user message
    setMessages(prev => [...prev, { id: newMsgId, role: 'user', text: userText }]);
    setInputValue('');
    setIsTyping(true);

    try {
      if (!chatInstance.current) {
        chatInstance.current = vinnxAI.createChat(contextData);
      }
      
      const result = await chatInstance.current.sendMessage({ message: userText });
      const responseText = result.text;

      setMessages(prev => [...prev, { 
        id: Math.random().toString(36).substr(2, 9), 
        role: 'model', 
        text: responseText 
      }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { 
        id: Math.random().toString(36).substr(2, 9), 
        role: 'model', 
        text: "Tive uma oscilação na conexão. Pode repetir? 🔌" 
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleClearChat = () => {
    setMessages([]);
    setIsMenuOpen(false);
    // Create new chat instance with FRESH context
    chatInstance.current = vinnxAI.createChat(contextData);
    
    // Re-trigger welcome (simplified)
    setIsTyping(true);
    setTimeout(() => {
        setMessages([{
            id: Math.random().toString(36),
            role: 'model',
            text: "Histórico limpo! O que vamos planejar agora?"
        }]);
        setIsTyping(false);
    }, 1000);
  };

  return (
    <div className="flex flex-col h-[80vh] md:h-[85vh] bg-[#09090b] rounded-[2.5rem] overflow-hidden border border-zinc-800 shadow-2xl relative max-w-5xl mx-auto animate-in fade-in zoom-in-95 duration-500">
      
      {/* 1. Header Moderno */}
      <header className="flex items-center justify-between px-6 py-4 bg-[#09090b]/80 backdrop-blur-md border-b border-zinc-800 z-10 absolute top-0 left-0 right-0">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 bg-gradient-to-tr from-purple-600 to-indigo-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-purple-500/20">
              <Bot size={20} />
            </div>
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-zinc-950 rounded-full flex items-center justify-center">
               <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping absolute opacity-75"></span>
               <span className="w-2 h-2 bg-emerald-500 rounded-full relative"></span>
            </div>
          </div>
          <div>
            <h2 className="text-sm font-bold text-white tracking-wide">VinnxAI</h2>
            <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest flex items-center gap-1">
              Online
            </p>
          </div>
        </div>

        <div className="relative">
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-full transition-all"
          >
            <MoreVertical size={20} />
          </button>
          
          {isMenuOpen && (
            <div className="absolute right-0 top-12 bg-zinc-900 border border-zinc-800 rounded-xl shadow-xl p-1 min-w-[160px] z-50 animate-in slide-in-from-top-2 duration-200">
              <button 
                onClick={handleClearChat}
                className="w-full flex items-center gap-2 px-4 py-3 text-xs font-bold text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"
              >
                <Trash2 size={14} /> Limpar Conversa
              </button>
            </div>
          )}
        </div>
      </header>

      {/* 2. Área de Mensagens Scrollável */}
      <div className="flex-1 overflow-y-auto px-4 md:px-6 pt-24 pb-4 space-y-3 bg-[#09090b] scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}
          >
            <div 
              className={`max-w-[85%] md:max-w-[70%] px-5 py-3 text-sm md:text-[15px] leading-relaxed relative shadow-md ${
                msg.role === 'user' 
                  ? 'bg-[#374151] text-white rounded-2xl rounded-tr-none' 
                  : 'bg-[#8B5CF6] text-white rounded-2xl rounded-tl-none'
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}

        {/* Typing Indicator */}
        {isTyping && (
          <div className="flex justify-start animate-in fade-in duration-300">
            <div className="bg-[#8B5CF6] px-4 py-3 rounded-2xl rounded-tl-none flex items-center gap-1.5 shadow-md">
              <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce [animation-delay:-0.3s]"></span>
              <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce [animation-delay:-0.15s]"></span>
              <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce"></span>
            </div>
          </div>
        )}
        
        <div ref={chatEndRef} className="h-1" />
      </div>

      {/* 3. Input Area (Rodapé) */}
      <div className="p-4 bg-[#09090b] border-t border-zinc-800">
        <form 
          onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
          className="relative flex items-center gap-3"
        >
          <input 
            type="text" 
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Digite sua mensagem..."
            className="w-full bg-[#18181b] text-white border border-zinc-800 rounded-full pl-6 pr-14 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]/50 focus:border-[#8B5CF6] transition-all placeholder:text-zinc-600"
          />
          <button 
            type="submit"
            disabled={!inputValue.trim()}
            className="absolute right-2 p-2.5 bg-[#18181b] hover:bg-[#27272a] rounded-full text-[#A3E635] disabled:opacity-30 disabled:hover:bg-transparent transition-all active:scale-90"
          >
            <Send size={20} fill="currentColor" />
          </button>
        </form>
        <p className="text-center text-[10px] text-zinc-600 mt-2 font-medium">VinnxAI pode cometer erros. Verifique informações importantes.</p>
      </div>

    </div>
  );
};

export default VinnxAIView;
