import React, { useState, useMemo } from 'react';
import { 
  Search, Filter, Plus, Trash2, Edit3, AlertCircle, X, ChevronLeft, ChevronRight, 
  ArrowUpCircle, ArrowDownCircle, Scale, CalendarClock, Repeat, History, Users, User, 
  MoreVertical, CheckCircle2, Clock, AlertTriangle
} from 'lucide-react';
import { Transaction } from '../types';
import { useFinance } from '../App';

type FinanceTab = 'extrato' | 'pendentes' | 'recorrentes';

const CategoryIcon = ({ category }: { category: string }) => {
  const categories: Record<string, { icon: string, color: string }> = {
    'Alimentação': { icon: '🛒', color: 'bg-amber-100 text-amber-600' },
    'Moradia': { icon: '🏠', color: 'bg-blue-100 text-blue-600' },
    'Lazer': { icon: '🍿', color: 'bg-purple-100 text-purple-600' },
    'Salário': { icon: '💰', color: 'bg-emerald-100 text-emerald-600' },
    'Geral': { icon: '📦', color: 'bg-zinc-100 text-zinc-600' },
    'Metas': { icon: '🎯', color: 'bg-rose-100 text-rose-600' },
    'Saúde': { icon: '💊', color: 'bg-cyan-100 text-cyan-600' },
    'Educação': { icon: '📚', color: 'bg-indigo-100 text-indigo-600' }
  };
  const config = categories[category] || categories['Geral'];
  return (
    <div className={`flex items-center gap-2 px-2.5 py-1 rounded-lg ${config.color} text-xs font-bold`}>
      <span>{config.icon}</span>
      <span className="hidden sm:inline">{category}</span>
    </div>
  );
};

const Financeiro: React.FC = () => {
  const { transactions, accounts, addTransaction, deleteTransaction, appSettings, userProfile, familyMember } = useFinance();
  const [activeTab, setActiveTab] = useState<FinanceTab>('extrato');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTransaction, setNewTransaction] = useState<Partial<Transaction>>({
    description: '', amount: 0, type: 'expense', category: appSettings.transactionCategories[0] || 'Geral',
    date: new Date().toISOString().split('T')[0], account: accounts[0]?.name || '', status: 'paid',
    owner: 'Conjunta', division: 'shared', isRecurring: false
  });

  const nextMonth = () => { const next = new Date(currentMonth); next.setMonth(next.getMonth() + 1); setCurrentMonth(next); };
  const prevMonth = () => { const prev = new Date(currentMonth); prev.setMonth(prev.getMonth() - 1); setCurrentMonth(prev); };
  const monthLabel = currentMonth.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  const filteredData = useMemo(() => {
    return transactions.filter(t => {
      // Proteção contra datas inválidas
      if (!t.date) return false;
      const tDate = new Date(t.date);
      const isThisMonth = tDate.getMonth() === currentMonth.getMonth() && tDate.getFullYear() === currentMonth.getFullYear();
      if (!isThisMonth) return false;
      if (activeTab === 'extrato') return t.status === 'paid';
      if (activeTab === 'pendentes') return t.status === 'pending' || t.status === 'overdue';
      if (activeTab === 'recorrentes') return t.isRecurring;
      return true;
    });
  }, [transactions, activeTab, currentMonth]);

  const summary = useMemo(() => {
    const monthTransactions = transactions.filter(t => {
      if (!t.date) return false;
      const tDate = new Date(t.date);
      return tDate.getMonth() === currentMonth.getMonth() && tDate.getFullYear() === currentMonth.getFullYear();
    });
    const income = monthTransactions.filter(t => t.type === 'income' && t.status === 'paid').reduce((acc, t) => acc + t.amount, 0);
    const expenses = monthTransactions.filter(t => t.type === 'expense' && t.status === 'paid').reduce((acc, t) => acc + t.amount, 0);
    const pending = monthTransactions.filter(t => t.type === 'expense' && (t.status === 'pending' || t.status === 'overdue')).reduce((acc, t) => acc + t.amount, 0);
    return { income, expenses, balance: income - expenses, pending };
  }, [transactions, currentMonth]);

  const handleAddTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTransaction.description || !newTransaction.amount) return;
    addTransaction({
      description: newTransaction.description || '', amount: Number(newTransaction.amount) || 0,
      type: newTransaction.type as 'income' | 'expense', category: newTransaction.category || 'Geral',
      date: newTransaction.date || new Date().toISOString().split('T')[0], account: newTransaction.account || accounts[0]?.name || '',
      status: newTransaction.status as any, owner: newTransaction.owner as any, division: newTransaction.division as any, isRecurring: newTransaction.isRecurring
    });
    setShowAddForm(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-2 rounded-2xl shadow-sm">
            <button onClick={prevMonth} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"><ChevronLeft size={20}/></button>
            <span className="text-sm font-black uppercase tracking-widest px-4 min-w-[140px] text-center">{monthLabel}</span>
            <button onClick={nextMonth} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"><ChevronRight size={20}/></button>
          </div>
          <div className="flex gap-2">
            <button onClick={() => {setNewTransaction(prev => ({...prev, status: 'pending'})); setShowAddForm(true);}} className="px-6 py-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all flex items-center gap-2"><CalendarClock size={16} className="text-amber-500" /> Agendar Conta</button>
            <button onClick={() => {setNewTransaction(prev => ({...prev, status: 'paid'})); setShowAddForm(true);}} className="px-6 py-3 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-black uppercase tracking-widest rounded-2xl shadow-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2"><Plus size={16} /> Nova Transação</button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-zinc-900/50 p-6 rounded-[2rem] border border-zinc-200 dark:border-zinc-800/50 shadow-sm group">
            <div className="flex justify-between items-start mb-2"><span className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Receitas Totais</span><ArrowUpCircle className="text-emerald-500 opacity-40 group-hover:opacity-100 transition-opacity" size={20} /></div>
            <p className="text-2xl font-black text-emerald-500">R$ {summary.income.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          </div>
          <div className="bg-white dark:bg-zinc-900/50 p-6 rounded-[2rem] border border-zinc-200 dark:border-zinc-800/50 shadow-sm group">
            <div className="flex justify-between items-start mb-2"><span className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Despesas Totais</span><ArrowDownCircle className="text-rose-500 opacity-40 group-hover:opacity-100 transition-opacity" size={20} /></div>
            <p className="text-2xl font-black text-rose-500">R$ {summary.expenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          </div>
          <div className="bg-white dark:bg-zinc-900/50 p-6 rounded-[2rem] border border-zinc-200 dark:border-zinc-800/50 shadow-sm group">
            <div className="flex justify-between items-start mb-2"><span className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Saldo do Mês</span><Scale className="text-purple-500 opacity-40 group-hover:opacity-100 transition-opacity" size={20} /></div>
            <p className={`text-2xl font-black ${summary.balance >= 0 ? 'text-zinc-900 dark:text-white' : 'text-rose-600'}`}>R$ {summary.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          </div>
          <div className="bg-white dark:bg-zinc-900/50 p-6 rounded-[2rem] border border-zinc-200 dark:border-zinc-800/50 shadow-sm group border-amber-500/20">
            <div className="flex justify-between items-start mb-2"><span className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Previsto a Pagar</span><Clock className="text-amber-500 opacity-40 group-hover:opacity-100 transition-opacity" size={20} /></div>
            <p className="text-2xl font-black text-amber-500">R$ {summary.pending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex border-b border-zinc-200 dark:border-zinc-800">
           {[ { id: 'extrato', label: 'Extrato', icon: History }, { id: 'pendentes', label: 'Contas a Pagar', icon: Clock }, { id: 'recorrentes', label: 'Recorrentes', icon: Repeat } ].map((tab) => (
             <button key={tab.id} onClick={() => setActiveTab(tab.id as FinanceTab)} className={`flex items-center gap-2 px-6 py-4 text-xs font-black uppercase tracking-widest transition-all relative ${ activeTab === tab.id ? 'text-purple-600' : 'text-zinc-400 hover:text-zinc-600' }`}><tab.icon size={16} />{tab.label}{activeTab === tab.id && <div className="absolute bottom-0 left-0 right-0 h-1 bg-purple-600 rounded-t-full" />}</button>
           ))}
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[900px]">
              <thead>
                <tr className="bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-100 dark:border-zinc-800">
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-400">Transação</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-400">Categoria</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-400">Conta / Titular</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-400">Divisão</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-400">Status</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-400 text-right">Valor</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-400"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {filteredData.length === 0 ? (
                  <tr><td colSpan={7} className="px-6 py-20 text-center text-zinc-400 italic">Nenhuma transação encontrada para este período.</td></tr>
                ) : filteredData.map((t) => (
                  <tr key={t.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors group">
                    <td className="px-6 py-5"><div className="flex flex-col"><span className="text-sm font-black">{t.description}</span><span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mt-0.5">{t.date}</span></div></td>
                    <td className="px-6 py-5"><CategoryIcon category={t.category} /></td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-[10px] font-black border border-zinc-200 dark:border-zinc-700">
                          {(t.account || '?').substring(0, 1)}
                        </div>
                        <div className="flex -space-x-2">
                           {(t.owner === userProfile.name || t.owner === 'Conjunta') && <img src={userProfile.avatar} className="w-6 h-6 rounded-full border-2 border-white dark:border-zinc-900 object-cover" title={userProfile.name} />}
                           {(t.owner === familyMember?.name || t.owner === 'Conjunta') && <img src={familyMember?.avatar || "https://picsum.photos/seed/maria/100"} className="w-6 h-6 rounded-full border-2 border-white dark:border-zinc-900 object-cover" title={familyMember?.name || 'Parceiro'} />}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                        {t.division === 'shared' ? ( <div className="flex items-center gap-1.5 text-[10px] font-black text-purple-600 bg-purple-100 dark:bg-purple-900/30 px-2 py-1 rounded-full w-fit"><Users size={12} /> 50/50</div> ) : ( <div className="flex items-center gap-1.5 text-[10px] font-black text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded-full w-fit"><User size={12} /> INDIV.</div> )}
                    </td>
                    <td className="px-6 py-5">
                        {t.status === 'paid' && <span className="flex items-center gap-1 text-[10px] font-black text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 px-3 py-1 rounded-full w-fit"><CheckCircle2 size={12} /> PAGO</span>}
                        {t.status === 'pending' && <span className="flex items-center gap-1 text-[10px] font-black text-amber-600 bg-amber-100 dark:bg-amber-900/30 px-3 py-1 rounded-full w-fit"><Clock size={12} /> PENDENTE</span>}
                        {t.status === 'overdue' && <span className="flex items-center gap-1 text-[10px] font-black text-rose-600 bg-rose-100 dark:bg-rose-900/30 px-3 py-1 rounded-full w-fit animate-pulse"><AlertTriangle size={12} /> ATRASADO</span>}
                    </td>
                    <td className="px-6 py-5 text-right">
                        <span className={`text-sm font-black ${t.type === 'income' ? 'text-emerald-500' : 'text-rose-500'}`}>{t.type === 'income' ? '+' : '-'} R$ {t.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </td>
                    <td className="px-6 py-5"><button onClick={() => deleteTransaction(t.id)} className="p-2 hover:bg-rose-500 hover:text-white rounded-xl transition-all opacity-0 group-hover:opacity-100"><Trash2 size={16} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* --- MODAL COM CORREÇÃO PARA MOBILE --- */}
      {showAddForm && (
        // 1. O Container Principal: Agora tem overflow-y-auto e z-index alto
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto">
          
          {/* 2. O Backdrop (Fundo): Fica fixo atrás e fecha ao clicar */}
          <div 
             className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity"
             onClick={() => setShowAddForm(false)}
          />

          {/* 3. O Card: Agora é relative e tem scroll interno (max-h) se for muito grande */}
          <div className="relative bg-white dark:bg-zinc-900 w-full max-w-2xl rounded-[3rem] p-8 md:p-10 shadow-2xl animate-in zoom-in-95 duration-300 border border-zinc-200 dark:border-zinc-800 max-h-[90vh] overflow-y-auto scrollbar-hide">
             <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-black tracking-tighter uppercase">Registrar no Command Center</h3>
                <button onClick={() => setShowAddForm(false)} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors"><X size={24} /></button>
             </div>
             
             <form onSubmit={handleAddTransaction} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="space-y-1.5"><label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest ml-1">Descrição</label><input required className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 text-sm font-bold" value={newTransaction.description} onChange={e => setNewTransaction({...newTransaction, description: e.target.value})} /></div>
                   <div className="space-y-1.5"><label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest ml-1">Valor (R$)</label><input type="number" step="0.01" className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 text-sm font-black text-purple-600" value={newTransaction.amount || ''} onChange={e => setNewTransaction({...newTransaction, amount: Number(e.target.value)})} /></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                   <div className="space-y-1.5"><label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest ml-1">Tipo</label><select className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 text-sm font-bold" value={newTransaction.type} onChange={e => setNewTransaction({...newTransaction, type: e.target.value as any})}><option value="expense">Despesa (Saída)</option><option value="income">Receita (Entrada)</option></select></div>
                   <div className="space-y-1.5"><label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest ml-1">Categoria</label><select className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 text-sm font-bold" value={newTransaction.category} onChange={e => setNewTransaction({...newTransaction, category: e.target.value})}>{appSettings.transactionCategories.map(cat => (<option key={cat} value={cat}>{cat}</option>))}</select></div>
                   <div className="space-y-1.5"><label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest ml-1">Status</label><select className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 text-sm font-bold" value={newTransaction.status} onChange={e => setNewTransaction({...newTransaction, status: e.target.value as any})}>{appSettings.transactionStatus.map(st => (<option key={st.value} value={st.value}>{st.label}</option>))}</select></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                   <div className="space-y-1.5"><label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest ml-1">Titularidade</label><select className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 text-sm font-bold" value={newTransaction.owner} onChange={e => setNewTransaction({...newTransaction, owner: e.target.value as any})}><option value="Conjunta">Conjunta 👥</option><option value={userProfile.name}>{userProfile.name} 👤</option>{familyMember && <option value={familyMember.name}>{familyMember.name} 👤</option>}</select></div>
                   <div className="space-y-1.5"><label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest ml-1">Divisão</label><select className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 text-sm font-bold" value={newTransaction.division} onChange={e => setNewTransaction({...newTransaction, division: e.target.value as any})}>{appSettings.transactionDivision.map(div => (<option key={div.value} value={div.value}>{div.label}</option>))}</select></div>
                   <div className="space-y-1.5 flex items-end"><label className="w-full flex items-center justify-between bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 cursor-pointer"><span className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Recorrente?</span><input type="checkbox" className="w-5 h-5 rounded-md text-purple-600 focus:ring-purple-500" checked={newTransaction.isRecurring} onChange={e => setNewTransaction({...newTransaction, isRecurring: e.target.checked})} /></label></div>
                </div>
                <button type="submit" className="w-full py-5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-[2rem] text-sm font-black uppercase tracking-widest shadow-2xl active:scale-95 transition-all">Processar Transação</button>
             </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Financeiro;