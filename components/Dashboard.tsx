import React, { useMemo } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line 
} from 'recharts';
import { 
  ArrowUpRight, ArrowDownRight, Wallet, Sparkles, CreditCard, TrendingUp, 
  ShoppingBag, Calendar, Clock, ChevronRight, MoreHorizontal, StickyNote, Trophy
} from 'lucide-react';
import { useFinance } from '../App';
import { Link } from 'react-router-dom';

// Componente Cartãozinho (Mantido igual)
const MiniStatCard = ({ title, value, type, trend }: { title: string, value: string, type: 'income' | 'expense' | 'balance', trend?: string }) => {
  const colors = { income: 'text-emerald-500', expense: 'text-rose-500', balance: 'text-zinc-900 dark:text-white' };
  const icons = {
    income: <ArrowUpRight size={16} className="text-emerald-500" />,
    expense: <ArrowDownRight size={16} className="text-rose-500" />,
    balance: <Wallet size={16} className="text-zinc-400" />
  };
  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 rounded-2xl shadow-sm flex items-center justify-between">
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">{title}</p>
        <p className={`text-lg font-black tracking-tight ${colors[type]}`}>{value}</p>
      </div>
      <div className="text-right">
        <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-1 ml-auto">{icons[type]}</div>
        {trend && <p className="text-[9px] font-bold text-zinc-400">{trend}</p>}
      </div>
    </div>
  );
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md border border-zinc-200 dark:border-zinc-800 p-3 rounded-xl shadow-2xl">
        <p className="text-zinc-500 dark:text-zinc-400 text-[10px] mb-2 font-bold uppercase tracking-widest">{label}</p>
        <div className="space-y-1.5">
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-6">
              <span className="text-xs font-bold" style={{ color: entry.color }}>{entry.name}</span>
              <span className="text-xs font-black">R$ {entry.value.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

const Dashboard: React.FC = () => {
  const { transactions, accounts, creditCards, familyMember, userProfile, goals, notes, wishlist } = useFinance();

  // 1. CÁLCULOS TOTAIS (Baseado no Supabase)
  const totals = useMemo(() => {
    const totalBalance = accounts.reduce((acc, curr) => acc + Number(curr.balance), 0);
    const now = new Date();
    
    // Filtra transações deste mês
    const monthlyIncome = transactions
      .filter(t => {
        const d = new Date(t.date);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() && t.type === 'income';
      })
      .reduce((acc, t) => acc + Number(t.amount), 0);

    const monthlyExpense = transactions
      .filter(t => {
        const d = new Date(t.date);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() && t.type === 'expense';
      })
      .reduce((acc, t) => acc + Number(t.amount), 0);

    return { balance: totalBalance, income: monthlyIncome, expense: monthlyExpense };
  }, [transactions, accounts]);

  // 2. DADOS DO GRÁFICO (Dinâmico: Últimos 6 meses)
  const chartData = useMemo(() => {
    const months = [];
    const today = new Date();
    
    // Gera os últimos 6 meses
    for (let i = 5; i >= 0; i--) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const monthName = d.toLocaleDateString('pt-BR', { month: 'short' });
        const monthKey = d.getMonth();
        const yearKey = d.getFullYear();

        // Filtra transações daquele mês específico
        const monthTrans = transactions.filter(t => {
            const tDate = new Date(t.date);
            return tDate.getMonth() === monthKey && tDate.getFullYear() === yearKey;
        });

        const entrada1 = monthTrans
            .filter(t => t.type === 'income' && (t.owner === userProfile.name || !t.owner || t.owner === 'Conjunta'))
            .reduce((acc, t) => acc + Number(t.amount), 0);
            
        const entrada2 = monthTrans
            .filter(t => t.type === 'income' && t.owner === familyMember?.name)
            .reduce((acc, t) => acc + Number(t.amount), 0);

        const gastos = monthTrans
            .filter(t => t.type === 'expense')
            .reduce((acc, t) => acc + Number(t.amount), 0);

        months.push({ name: monthName, entrada1, entrada2, gastos });
    }
    return months;
  }, [transactions, userProfile, familyMember]);

  // 3. WIDGETS
  const mainCard = creditCards[0];
  const cardUsage = mainCard ? (mainCard.used / mainCard.limit) * 100 : 0;
  
  // Calcula total investido baseado nas contas do tipo 'investment'
  const totalInvested = accounts
    .filter(a => a.type === 'investment')
    .reduce((acc, curr) => acc + Number(curr.balance), 0);
    
  const investmentTrend = [100, 102, 105, 104, 108, 112, 115]; // Simulação visual de tendência (pode manter estático por enquanto)

  const nextDream = useMemo(() => {
    if (!wishlist || wishlist.length === 0) return null;
    return [...wishlist].sort((a: any, b: any) => b.priority - a.priority)[0];
  }, [wishlist]);

  const topGoal = goals[0];
  const latestNote = notes[0];

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Bom dia";
    if (hour < 18) return "Boa tarde";
    return "Boa noite";
  }, []);

  // 4. AGENDA REAL (Apenas contas pendentes)
  const agendaItems = useMemo(() => {
    return transactions
      .filter(t => t.status === 'pending' || t.status === 'overdue')
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 4) // Pega as próximas 4 contas
      .map(t => ({
        id: t.id,
        title: t.description,
        date: t.date,
        type: 'finance',
        amount: t.amount
      }));
  }, [transactions]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 w-full pb-10">
      
      {/* 1. SAUDAÇÃO INTELIGENTE */}
      <div className="relative bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] p-8 md:p-10 shadow-sm overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="relative z-10">
          <h1 className="text-3xl md:text-4xl font-black tracking-tighter text-zinc-900 dark:text-white">
            {greeting}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-indigo-500 font-display">{userProfile.name}</span>
          </h1>
          <p className="text-zinc-500 text-sm font-medium mt-1">
            Visão geral do império de vocês hoje.
          </p>
        </div>

        <div className="relative z-10 bg-zinc-50 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 p-4 rounded-2xl max-w-sm flex items-start gap-3 shadow-sm">
          <div className="p-2 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-xl shrink-0 shadow-lg">
            <Sparkles size={18} className="text-white" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-0.5">Vinnx Insight</p>
            <p className="text-xs md:text-sm text-zinc-800 dark:text-zinc-100 font-medium leading-snug">
               {totals.balance >= 0 
                 ? "O saldo está positivo! Ótimo momento para revisar as metas." 
                 : "Atenção ao fluxo de caixa. O saldo atual está negativo."}
            </p>
          </div>
        </div>
      </div>

      {/* 2. RESUMO FINANCEIRO */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MiniStatCard title="Saldo em Conta" value={`R$ ${totals.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} type="balance" />
        <MiniStatCard title="Receitas (Mês)" value={`R$ ${totals.income.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} type="income" trend="Este mês" />
        <MiniStatCard title="Despesas (Mês)" value={`R$ ${totals.expense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} type="expense" trend="Este mês" />
      </div>

      {/* 3. WIDGETS CENTRAIS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Widget Cartões */}
        <Link to="/cartoes" className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-[2rem] shadow-sm hover:shadow-lg transition-all group relative overflow-hidden">
          <div className="flex justify-between items-start mb-6 relative z-10">
            <div className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-2xl text-zinc-900 dark:text-white">
              <CreditCard size={24} />
            </div>
            {mainCard && <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">{mainCard.name}</span>}
          </div>
          {mainCard ? (
            <div className="space-y-4 relative z-10">
              <div>
                <p className="text-xs font-bold text-zinc-500 mb-1">Fatura Atual</p>
                <p className="text-2xl font-black text-zinc-900 dark:text-white">R$ {mainCard.used.toLocaleString()}</p>
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-zinc-400">
                  <span>Limite Usado</span>
                  <span>{cardUsage.toFixed(0)}%</span>
                </div>
                <div className="h-2 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div className="h-full bg-purple-600 rounded-full" style={{ width: `${cardUsage}%` }}></div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-24 text-zinc-400">
              <p className="text-xs font-bold">Sem cartões cadastrados</p>
            </div>
          )}
        </Link>

        {/* Widget Investimentos */}
        <Link to="/investimentos" className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-[2rem] shadow-sm hover:shadow-lg transition-all relative overflow-hidden group">
          <div className="flex justify-between items-start mb-6 relative z-10">
            <div className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-2xl text-zinc-900 dark:text-white">
              <TrendingUp size={24} />
            </div>
            <span className="px-3 py-1 bg-emerald-500 text-white text-[10px] font-black uppercase rounded-full tracking-widest">Total</span>
          </div>
          
          <div className="relative z-10">
            <p className="text-xs font-bold text-zinc-400 dark:text-zinc-500 mb-1">Patrimônio Investido</p>
            <p className="text-2xl font-black text-zinc-900 dark:text-white">R$ {totalInvested.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            
            <div className="h-10 mt-4 -mx-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={investmentTrend.map((v, i) => ({ val: v }))}>
                  <Line type="monotone" dataKey="val" stroke="#10b981" strokeWidth={3} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Link>

        {/* Widget Wishlist */}
        <Link to="/wishlist" className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-1 rounded-[2rem] shadow-sm hover:shadow-lg transition-all flex flex-col">
          {nextDream ? (
            <>
              <div className="relative h-32 w-full overflow-hidden rounded-[1.8rem]">
                <img src={nextDream.imageUrl} className="w-full h-full object-cover transition-transform duration-700 hover:scale-110" alt={nextDream.name} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
                   <h3 className="text-white font-black text-sm line-clamp-1">{nextDream.name}</h3>
                </div>
              </div>
              <div className="p-5 flex justify-between items-center">
                 <div className="flex items-center gap-2 text-zinc-500">
                    <ShoppingBag size={16} />
                    <span className="text-xs font-bold">Próxima Conquista</span>
                 </div>
                 <div className="text-right">
                    <p className="text-[10px] uppercase font-black tracking-widest text-zinc-400">Faltam</p>
                    <p className="text-sm font-black text-purple-600">R$ {(nextDream.price - nextDream.savedAmount).toLocaleString()}</p>
                 </div>
              </div>
            </>
          ) : (
             <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                <div className="w-12 h-12 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-2">
                   <Sparkles className="text-zinc-400" size={20} />
                </div>
                <p className="text-xs font-bold text-zinc-500">Nenhum sonho cadastrado ainda.</p>
             </div>
          )}
        </Link>
      </div>

      {/* 4. FLUXO E AGENDA */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* Gráfico de Fluxo (60%) */}
        <div className="lg:col-span-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] p-8 shadow-sm">
           <div className="flex justify-between items-center mb-8">
              <div>
                 <h3 className="text-lg font-black tracking-tight text-zinc-900 dark:text-white">Fluxo de Caixa</h3>
                 <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest mt-1">Últimos 6 meses</p>
              </div>
              <div className="flex gap-2">
                 <span className="w-3 h-3 rounded-full bg-amber-400" title="Você"></span>
                 <span className="w-3 h-3 rounded-full bg-cyan-400" title="Parceiro"></span>
                 <span className="w-3 h-3 rounded-full bg-rose-400" title="Gastos"></span>
              </div>
           </div>
           
           <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorE1" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#fbbf24" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorE2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorG" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#a1a1aa', fontSize: 10, fontWeight: 700 }}
                    dy={10}
                  />
                  <YAxis hide domain={['auto', 'auto']} />
                  <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#e4e4e7', strokeWidth: 1 }} />
                  <Area type="monotone" dataKey="entrada1" name={userProfile.name} stroke="#fbbf24" strokeWidth={3} fillOpacity={1} fill="url(#colorE1)" />
                  <Area type="monotone" dataKey="entrada2" name={familyMember?.name || 'Parceiro'} stroke="#06b6d4" strokeWidth={3} fillOpacity={1} fill="url(#colorE2)" />
                  <Area type="monotone" dataKey="gastos" name="Gastos" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorG)" />
                </AreaChart>
              </ResponsiveContainer>
           </div>
        </div>

        {/* Agenda de Hoje (40%) */}
        <div className="lg:col-span-2 bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] p-8">
           <div className="flex justify-between items-center mb-6">
              <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2 text-zinc-900 dark:text-white">
                 <Calendar size={16} className="text-purple-600" /> Próximas Contas
              </h3>
              <Link to="/financeiro" className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-full transition-colors">
                 <MoreHorizontal size={20} className="text-zinc-400" />
              </Link>
           </div>

           <div className="space-y-4">
              {agendaItems.length === 0 ? (
                 <div className="py-10 text-center text-zinc-400 italic text-xs">Tudo pago! Sem contas pendentes.</div>
              ) : agendaItems.map((item: any, i) => (
                 <div key={i} className="flex items-center gap-4 p-4 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm transition-transform hover:scale-[1.02]">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-rose-100 text-rose-500 dark:bg-rose-900/20">
                       <Clock size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                       <h4 className="text-sm font-black truncate text-zinc-900 dark:text-white">{item.title}</h4>
                       <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                          {new Date(item.date).toLocaleDateString('pt-BR')} • R$ {item.amount.toLocaleString('pt-BR')}
                       </p>
                    </div>
                    <ChevronRight size={16} className="text-zinc-300" />
                 </div>
              ))}
           </div>
           
           <Link to="/financeiro" className="block w-full text-center mt-6 text-[10px] font-black uppercase tracking-widest text-purple-600 hover:underline">
              Ver todas as contas
           </Link>
        </div>
      </div>

      {/* 5. METAS E ANOTAÇÕES (Mantido igual) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Metas Widget */}
        <Link to="/metas" className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-8 rounded-[2.5rem] shadow-sm hover:shadow-lg transition-all group">
          <div className="flex justify-between items-center mb-6">
             <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2 text-zinc-900 dark:text-white">
                <Trophy size={16} className="text-amber-500" /> Próxima Meta
             </h3>
             <ChevronRight size={20} className="text-zinc-300 group-hover:text-amber-500 transition-colors" />
          </div>
          
          {topGoal ? (
             <div className="space-y-4">
               <div>
                  <h4 className="text-xl font-black text-zinc-900 dark:text-white leading-tight">{topGoal.title}</h4>
                  <p className="text-xs text-zinc-500 mt-1">Prazo: {new Date(topGoal.deadline).toLocaleDateString('pt-BR')}</p>
               </div>
               <div className="space-y-2">
                 <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                    <span className="text-zinc-400">Progresso</span>
                    <span className="text-amber-500">{((topGoal.current / topGoal.target) * 100).toFixed(0)}%</span>
                 </div>
                 <div className="h-3 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 rounded-full" style={{ width: `${Math.min((topGoal.current / topGoal.target) * 100, 100)}%` }}></div>
                 </div>
                 <p className="text-[10px] font-bold text-zinc-400 text-right">Faltam R$ {(topGoal.target - topGoal.current).toLocaleString()}</p>
               </div>
             </div>
          ) : (
             <div className="py-8 text-center">
                <p className="text-xs text-zinc-400 italic">Nenhuma meta definida.</p>
             </div>
          )}
        </Link>

        {/* Anotações Widget */}
        <Link to="/anotacoes" className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-8 rounded-[2.5rem] shadow-sm hover:shadow-lg transition-all group">
           <div className="flex justify-between items-center mb-6">
             <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2 text-zinc-900 dark:text-white">
                <StickyNote size={16} className="text-purple-600" /> Última Ideia
             </h3>
             <ChevronRight size={20} className="text-zinc-300 group-hover:text-purple-600 transition-colors" />
          </div>
          {latestNote ? (
            <div className={`p-6 rounded-2xl ${latestNote.color || 'bg-purple-100'} bg-opacity-50 border border-zinc-200/50 dark:border-zinc-700/50 relative overflow-hidden`}>
               <div className="flex justify-between items-start mb-2">
                  <h4 className="text-base font-black text-zinc-800 dark:text-zinc-900">{latestNote.title}</h4>
                  <span className="text-xl">{latestNote.emoji}</span>
               </div>
               <p className="text-xs text-zinc-600 dark:text-zinc-800 line-clamp-2 leading-relaxed">{latestNote.content}</p>
               <div className="mt-4 flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-white/50 flex items-center justify-center text-[10px] font-black text-zinc-600">{latestNote.createdBy.substring(0,1)}</div>
                  <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Postado por {latestNote.createdBy}</span>
               </div>
            </div>
          ) : (
            <div className="py-8 text-center"><p className="text-xs text-zinc-400 italic">O mural está vazio.</p></div>
          )}
        </Link>
      </div>

    </div>
  );
};

export default Dashboard;