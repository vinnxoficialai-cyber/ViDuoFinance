import React, { useState, useMemo } from 'react';
import { 
  LineChart, Line, ResponsiveContainer, Treemap, Tooltip as RechartsTooltip 
} from 'recharts';
import { 
  TrendingUp, Plus, Sparkles, User, X, ArrowDownCircle, Building2, DollarSign, 
  Landmark, Pencil, ShieldCheck, Rocket, Moon, History, ArrowRightLeft, TrendingDown,
  Trash2, Save, Tag, AlertTriangle
} from 'lucide-react';
import { Investment } from '../types';
import { useFinance } from '../App';
import { supabase } from '../supabaseClient'; // Import para editar direto no banco

// --- COMPONENTE DE MINIGRÁFICO ---
const Sparkline = ({ data }: { data: number[] }) => {
  const chartData = data.length > 1 
    ? data.map((v) => ({ value: v })) 
    : [{ value: data[0] || 0 }, { value: data[0] || 0 }];

  return (
    <div className="h-10 w-24">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <Line type="monotone" dataKey="value" stroke="#39FF14" strokeWidth={2} dot={false} isAnimationActive={true} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

const Investimentos: React.FC = () => {
  const { accounts, transactions, addAccount, deleteAccount, addTransaction, appSettings, userProfile, familyMember } = useFinance();
  
  // --- CARREGAR INVESTIMENTOS DO BANCO ---
  const investments = useMemo(() => {
    return accounts
      .filter(acc => acc.type === 'investment')
      .map(acc => {
        // Lógica para separar Instituição do Nome (ex: "XP - PETR4")
        const separatorIndex = acc.name.indexOf(' - ');
        let institutionName = 'Carteira';
        let assetName = acc.name;

        if (separatorIndex !== -1) {
            institutionName = acc.name.substring(0, separatorIndex);
            assetName = acc.name.substring(separatorIndex + 3);
        }

        // Reconstrói histórico
        const accTrans = transactions
          .filter(t => t.account === acc.name && t.status === 'paid')
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        let current = acc.balance;
        const history = [current];
        accTrans.slice(0, 10).forEach(t => {
           if (t.type === 'income') current -= t.amount;
           else current += t.amount;
           history.push(current);
        });
        const chartHistory = history.reverse();
        const yieldVal = acc.balance - (chartHistory[0] || 0); 

        return {
          id: acc.id,
          name: assetName, 
          institution: institutionName, 
          type: acc.color || 'Crescimento', 
          contributedValue: chartHistory[0] || acc.balance,
          currentValue: acc.balance,
          yieldMonth: yieldVal, 
          owner: acc.owner || 'Conjunta',
          history: chartHistory, 
          changesHistory: []
        } as Investment;
      });
  }, [accounts, transactions]);

  const [filter, setFilter] = useState<string>('Geral');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [redeemState, setRedeemState] = useState<{ open: boolean, inv: Investment | null }>({ open: false, inv: null });
  
  // --- ESTADOS DE EDIÇÃO AVANÇADA ---
  const [editState, setEditState] = useState<{ open: boolean, inv: Investment | null }>({ open: false, inv: null });
  const [editForm, setEditForm] = useState({
    name: '', institution: '', type: '', balance: ''
  });

  // --- ESTADOS DE NOVO ATIVO ---
  const [newInv, setNewInv] = useState({
    name: '', type: 'Crescimento', contributed: '', current: '', institution: '', owner: 'Conjunta'
  });
  const [redeemInfo, setRedeemInfo] = useState({ amount: '', accountId: accounts[0]?.id || '' });

  const filterOptions = ['Geral', userProfile.name, familyMember?.name].filter(Boolean) as string[];

  const filteredInvestments = useMemo(() => {
    if (filter === 'Geral') return investments;
    return investments.filter(inv => inv.owner === filter);
  }, [investments, filter]);

  const stats = useMemo(() => {
    const totalCurrent = filteredInvestments.reduce((acc, inv) => acc + inv.currentValue, 0);
    const totalContributed = filteredInvestments.reduce((acc, inv) => acc + inv.contributedValue, 0);
    const totalProfit = totalCurrent - totalContributed;
    const profitPercentage = totalContributed > 0 ? (totalProfit / totalContributed) * 100 : 0;
    return { totalCurrent, totalContributed, totalProfit, profitPercentage };
  }, [filteredInvestments]);

  const treemapData = useMemo(() => {
    const typeColors: Record<string, string> = {
      'Segurança': '#0EA5E9', 'Crescimento': '#39FF14', 'Aposentadoria': '#D4AF37', 'Arrojado': '#F97316'
    };
    const groups: Record<string, number> = {};
    filteredInvestments.forEach(inv => {
        const key = inv.type || 'Geral';
        groups[key] = (groups[key] || 0) + inv.currentValue;
    });
    const children = Object.keys(groups).map((key, idx) => ({
      name: key,
      size: groups[key],
      color: typeColors[key] || `hsl(${idx * 137.5}, 70%, 50%)`
    })).filter(c => c.size > 0);
    if (children.length === 0) return [];
    return [{ name: 'Investimentos', children }];
  }, [filteredInvestments]);

  const millionYear = useMemo(() => {
    const target = 1000000;
    const current = stats.totalCurrent;
    if (current >= target) return "Meta atingida!";
    if (current === 0) return new Date().getFullYear() + 20;
    const monthlyContribution = 2000; 
    const monthlyRate = 0.008; 
    let balance = current;
    let months = 0;
    while (balance < target && months < 600) { 
      balance = balance * (1 + monthlyRate) + monthlyContribution;
      months++;
    }
    return new Date().getFullYear() + Math.floor(months / 12);
  }, [stats]);

  // --- FUNÇÕES DE AÇÃO ---

  const handleOpenEdit = (inv: Investment) => {
    setEditForm({
        name: inv.name,
        institution: inv.institution,
        type: inv.type,
        balance: inv.currentValue.toString()
    });
    setEditState({ open: true, inv });
  };

  const handleSaveEdit = async () => {
    if (!editState.inv) return;
    
    // Constrói o novo nome composto
    const newFullName = `${editForm.institution} - ${editForm.name}`;
    
    try {
        // Atualiza no Supabase
        const { error } = await supabase
            .from('accounts')
            .update({ 
                name: newFullName, 
                balance: Number(editForm.balance),
                color: editForm.type // Salvamos o tipo no campo color
            })
            .eq('id', editState.inv.id);

        if (error) throw error;

        // Recarrega a página para atualizar (solução simples para sync) ou atualiza estado local se preferir
        window.location.reload(); 
    } catch (error) {
        console.error("Erro ao atualizar ativo:", error);
        alert("Erro ao salvar alterações.");
    }
  };

  const handleDeleteAsset = async () => {
    if (!editState.inv) return;
    if (window.confirm("Tem certeza que deseja excluir este ativo? Todo o histórico dele será perdido.")) {
        await deleteAccount(editState.inv.id);
        setEditState({ open: false, inv: null });
    }
  };

  const handleAddInvestment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInv.name || !newInv.current) return;
    const fullName = newInv.institution ? `${newInv.institution} - ${newInv.name}` : newInv.name;
    await addAccount({
      name: fullName,
      balance: Number(newInv.current),
      type: 'investment',
      color: newInv.type
    });
    setIsAddOpen(false);
    setNewInv({ name: '', type: 'Crescimento', contributed: '', current: '', institution: '', owner: 'Conjunta' });
  };

  const handleRedeem = () => {
    if (!redeemState.inv || !redeemInfo.amount) return;
    const accountDest = accounts.find(a => a.id === redeemInfo.accountId);
    addTransaction({
      description: `Resgate: ${redeemState.inv.name}`,
      amount: Number(redeemInfo.amount),
      type: 'income',
      category: 'Investimentos',
      date: new Date().toISOString().split('T')[0],
      account: accountDest ? accountDest.name : 'Carteira',
      status: 'paid'
    });
    // Também precisaria abater do saldo do investimento no banco, mas para MVP o resgate apenas gera caixa.
    // O usuário pode ajustar o saldo manualmente no lápis se quiser abater.
    setRedeemState({ open: false, inv: null });
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-24">
      {/* 1. Header: Bola de Neve */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[3rem] p-8 md:p-12 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#39FF14]/5 rounded-full -translate-y-40 translate-x-40 blur-3xl"></div>
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-10 relative z-10">
          <div className="flex-1 space-y-8">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400 mb-3 ml-1">Efeito Bola de Neve • Patrimônio Total</p>
              <h2 className="text-4xl md:text-7xl font-black tracking-tighter text-zinc-900 dark:text-white flex items-baseline gap-4">
                <span className="text-2xl md:text-3xl font-black text-zinc-400">R$</span>
                {stats.totalCurrent.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </h2>
            </div>
            
            <div className="space-y-5 max-w-2xl">
              <div className="flex justify-between items-end">
                <div className="flex items-center gap-3">
                   <div className="px-4 py-1.5 bg-[#39FF14]/10 text-[#39FF14] rounded-full text-xs font-black border border-[#39FF14]/20 shadow-[0_0_15px_rgba(57,255,20,0.2)]">
                     + R$ {stats.totalProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} Variação
                   </div>
                   <span className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">({stats.profitPercentage.toFixed(1)}% no período)</span>
                </div>
              </div>
              
              <div className="h-8 w-full bg-zinc-100 dark:bg-zinc-950 rounded-2xl overflow-hidden p-1.5 flex shadow-inner border border-zinc-200 dark:border-zinc-800">
                <div className="h-full bg-zinc-800 dark:bg-zinc-700 rounded-l-xl transition-all duration-1000" style={{ width: `${(stats.totalContributed / (stats.totalCurrent || 1)) * 100}%` }}></div>
                <div className="h-full bg-gradient-to-r from-[#39FF14] to-emerald-400 rounded-r-xl transition-all duration-1000 shadow-[0_0_20px_rgba(57,255,20,0.6)] border-l border-white/20" style={{ width: `${Math.abs((stats.totalProfit / (stats.totalCurrent || 1)) * 100)}%` }}></div>
              </div>
              <div className="flex justify-between text-[8px] font-black uppercase tracking-[0.2em] text-zinc-400 px-1">
                <span className="flex items-center gap-2"><div className="w-2 h-2 bg-zinc-700 rounded-sm"></div> Base Aportada</span>
                <span className="flex items-center gap-2 text-[#39FF14]">Crescimento <div className="w-2 h-2 bg-[#39FF14] rounded-sm shadow-[0_0_8px_#39FF14]"></div></span>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center gap-4">
              <div className="flex gap-2 p-1 bg-zinc-100 dark:bg-zinc-800/50 rounded-2xl">
                {filterOptions.map(f => (
                  <button key={f} onClick={() => setFilter(f)} className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === f ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-700'}`}>{f}</button>
                ))}
              </div>
              <button onClick={() => setIsAddOpen(true)} className="w-full py-4 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3">
                <Plus size={16}/> Novo Ativo
              </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* 2. Lista de Ativos */}
        <div className="lg:col-span-2 space-y-6">
          <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400 ml-2">Carteira de Ativos</h3>
          <div className="space-y-4">
            {filteredInvestments.length === 0 ? (
               <div className="text-center py-10 text-zinc-400 text-xs italic bg-zinc-50 dark:bg-zinc-900/50 rounded-[2rem] border border-dashed border-zinc-300 dark:border-zinc-700">
                 Nenhum investimento encontrado. Comece clicando em "Novo Ativo".
               </div>
            ) : filteredInvestments.map(inv => (
              <div key={inv.id} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] p-6 hover:shadow-2xl hover:border-[#39FF14]/20 transition-all duration-500 group flex items-center justify-between gap-6">
                <div className="flex items-center gap-5 flex-1">
                  <div className={`w-14 h-14 rounded-3xl flex items-center justify-center shadow-inner ${inv.type === 'Segurança' ? 'bg-blue-500/10 text-blue-500' : inv.type === 'Crescimento' ? 'bg-emerald-500/10 text-[#39FF14]' : 'bg-amber-500/10 text-[#D4AF37]'}`}>
                    {inv.type === 'Segurança' ? <ShieldCheck size={24} /> : <Rocket size={24} />}
                  </div>
                  <div className="flex flex-col">
                    <h4 className="text-sm font-black text-zinc-900 dark:text-white tracking-tight">{inv.name}</h4>
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2"><Landmark size={10}/> {inv.institution}</p>
                  </div>
                </div>

                <div className="hidden md:block">
                   <Sparkline data={inv.history || [0, 0]} />
                </div>

                <div className="text-right min-w-[140px]">
                  <p className="text-lg font-black text-zinc-900 dark:text-white tracking-tighter">R$ {Number(inv.currentValue).toLocaleString()}</p>
                  <div className={`text-[10px] font-black uppercase flex items-center justify-end gap-1 ${inv.yieldMonth >= 0 ? 'text-[#39FF14]' : 'text-rose-500'}`}>
                    {inv.yieldMonth >= 0 ? <TrendingUp size={10}/> : <TrendingDown size={10}/>}
                    R$ {Math.abs(inv.yieldMonth).toLocaleString()} <span className="text-zinc-500 font-bold tracking-normal text-[8px]">VARIAÇÃO</span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button onClick={() => setRedeemState({ open: true, inv })} className="p-3 text-zinc-300 hover:text-rose-500 hover:bg-rose-500/5 rounded-2xl transition-all" title="Resgatar"><ArrowDownCircle size={20} /></button>
                  <button onClick={() => handleOpenEdit(inv)} className="p-3 text-zinc-300 hover:text-[#D4AF37] hover:bg-[#D4AF37]/5 rounded-2xl transition-all" title="Editar Ativo"><Pencil size={20} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 3. Distribuição & 4. Projeção */}
        <div className="space-y-10">
           <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[3rem] p-8 shadow-xl">
             <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-8 flex items-center gap-2"><History size={14}/> Alocação Estratégica</h3>
             <div className="h-64 w-full">
               <ResponsiveContainer width="100%" height="100%">
                 {treemapData && treemapData.length > 0 ? (
                   <Treemap data={treemapData} dataKey="size" aspectRatio={4 / 3} stroke="#fff" fill="#8884d8">
                     <RechartsTooltip />
                   </Treemap>
                 ) : (
                   <div className="flex items-center justify-center h-full text-zinc-500 text-xs">Sem dados para o gráfico</div>
                 )}
               </ResponsiveContainer>
             </div>
             <div className="mt-8 grid grid-cols-2 gap-4">
                {treemapData && treemapData.length > 0 && treemapData[0].children.map((item: any) => (
                   <div key={item.name} className="flex flex-col gap-1 p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 rounded-2xl">
                      <div className="flex items-center gap-2">
                         <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: item.color }}></div>
                         <span className="text-[9px] font-black uppercase text-zinc-500 tracking-wider">{item.name}</span>
                      </div>
                      <span className="text-sm font-black text-zinc-900 dark:text-white">{((item.size / (stats.totalCurrent || 1)) * 100).toFixed(0)}%</span>
                   </div>
                ))}
             </div>
           </div>

           <div className="bg-gradient-to-br from-zinc-900 to-black border border-purple-500/20 rounded-[3rem] p-10 shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000"></div>
              <Sparkles className="text-[#D4AF37] mb-6 animate-pulse" size={32} />
              <h4 className="text-2xl font-black text-white uppercase tracking-tighter leading-tight">O Primeiro Milhão</h4>
              <p className="text-xs text-purple-100/60 mt-3 leading-relaxed">Com seus aportes recorrentes e a performance atual dos juros compostos, vocês chegam ao marco de R$ 1.000.000,00 em:</p>
              <div className="mt-8 flex items-baseline gap-3">
                 <span className="text-6xl font-black text-[#D4AF37] tracking-tighter shadow-gold">{millionYear}</span>
                 <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Ano Estimado</span>
              </div>
           </div>
        </div>
      </div>

      {/* MODAL: EDITAR ATIVO (NOVO PAINEL DE GERENCIAMENTO) */}
      {editState.open && editState.inv && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-lg rounded-[3.5rem] p-10 md:p-14 shadow-2xl animate-in zoom-in-95 duration-300">
             <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-[#D4AF37]/10 text-[#D4AF37] rounded-2xl"><Pencil size={24} /></div>
                  <div>
                    <h3 className="text-2xl font-black uppercase tracking-tighter">Editar Ativo</h3>
                    <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">Gerenciamento Completo</p>
                  </div>
                </div>
                <button onClick={() => setEditState({ open: false, inv: null })} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors"><X size={28} /></button>
             </div>

             <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                       <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest ml-1">Corretora / Banco</label>
                       <div className="relative">
                         <Building2 size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                         <input className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl py-4 pl-10 pr-4 text-sm font-bold focus:outline-none" value={editForm.institution} onChange={e => setEditForm({...editForm, institution: e.target.value})} />
                       </div>
                    </div>
                    <div className="space-y-1">
                       <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest ml-1">Nome do Ativo</label>
                       <div className="relative">
                         <Tag size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                         <input className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl py-4 pl-10 pr-4 text-sm font-bold focus:outline-none" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} />
                       </div>
                    </div>
                </div>

                <div className="space-y-1">
                   <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest ml-1">Perfil do Ativo</label>
                   <select className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 text-sm font-bold focus:outline-none" value={editForm.type} onChange={e => setEditForm({...editForm, type: e.target.value})}>
                      {appSettings.investmentTypes.map(t => <option key={t} value={t}>{t}</option>)}
                   </select>
                </div>

                <div className="bg-zinc-50 dark:bg-zinc-950 p-6 rounded-[2rem] border border-zinc-100 dark:border-zinc-800">
                   <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest mb-2 block">Saldo Atual (Correção)</label>
                   <div className="relative">
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 text-lg font-black text-zinc-400">R$</span>
                      <input type="number" step="0.01" className="w-full bg-transparent border-none p-0 pl-8 text-3xl font-black text-[#39FF14] focus:ring-0" value={editForm.balance} onChange={e => setEditForm({...editForm, balance: e.target.value})} />
                   </div>
                </div>

                <div className="flex gap-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                   <button onClick={handleDeleteAsset} className="flex-1 py-4 bg-rose-100 dark:bg-rose-900/20 text-rose-600 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-rose-200 dark:hover:bg-rose-900/40 transition-all flex items-center justify-center gap-2">
                      <Trash2 size={16} /> Excluir Ativo
                   </button>
                   <button onClick={handleSaveEdit} className="flex-[2] py-4 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2">
                      <Save size={16} /> Salvar Alterações
                   </button>
                </div>
             </div>
          </div>
        </div>
      )}

      {/* MODAL: REDEEM */}
      {redeemState.open && redeemState.inv && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-lg rounded-[3rem] p-10 shadow-2xl animate-in zoom-in-95 duration-300">
             <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-3"><ArrowDownCircle className="text-rose-500" size={32} /><h3 className="text-2xl font-black uppercase tracking-tighter">Resgatar Valor</h3></div>
                <button onClick={() => setRedeemState({ open: false, inv: null })} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full"><X size={28} /></button>
             </div>
             <div className="space-y-8">
                <div className="bg-zinc-50 dark:bg-zinc-950 p-6 rounded-3xl border border-zinc-100 dark:border-zinc-800 text-center">
                   <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest mb-1">Disponível em {redeemState.inv.name}</p>
                   <p className="text-3xl font-black tracking-tighter text-zinc-900 dark:text-white">R$ {redeemState.inv.currentValue.toLocaleString()}</p>
                </div>
                <div className="space-y-4">
                  <div className="space-y-1"><label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest ml-1">Quanto deseja resgatar?</label><input type="number" step="0.01" className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 text-sm font-black text-rose-500" value={redeemInfo.amount} onChange={e => setRedeemInfo({...redeemInfo, amount: e.target.value})} placeholder="0,00" /></div>
                  <div className="space-y-1"><label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest ml-1 flex items-center gap-2"><Building2 size={12}/> Destino do Saldo</label><select className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 text-sm font-bold focus:outline-none" value={redeemInfo.accountId} onChange={e => setRedeemInfo({...redeemInfo, accountId: e.target.value})}>{accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name} (R$ {acc.balance.toLocaleString()})</option>)}</select></div>
                </div>
                <button onClick={handleRedeem} className="w-full py-5 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl flex items-center justify-center gap-2"><DollarSign size={18}/> Confirmar Resgate</button>
             </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD INVESTMENT */}
      {isAddOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-xl rounded-[3rem] p-10 shadow-2xl animate-in zoom-in-95 duration-300 overflow-y-auto max-h-[90vh]">
             <div className="flex justify-between items-center mb-10">
                <h3 className="text-2xl font-black uppercase tracking-tighter">Novo Ativo</h3>
                <button onClick={() => setIsAddOpen(false)} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full"><X size={28} /></button>
             </div>
             
             <form onSubmit={handleAddInvestment} className="space-y-6">
                <div className="space-y-1">
                   <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest ml-1">Nome do Ativo</label>
                   <input required autoFocus className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 text-sm font-bold focus:outline-none" value={newInv.name} onChange={e => setNewInv({...newInv, name: e.target.value})} placeholder="Ex: PETR4, Tesouro Selic, Bitcoin" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest ml-1">Perfil / Tipo</label>
                      <select className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 text-sm font-bold focus:outline-none" value={newInv.type} onChange={e => setNewInv({...newInv, type: e.target.value as any})}>
                         {appSettings.investmentTypes.map(type => (<option key={type} value={type}>{type}</option>))}
                      </select>
                   </div>
                   <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest ml-1">Instituição</label>
                      <input required className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 text-sm font-bold focus:outline-none" value={newInv.institution} onChange={e => setNewInv({...newInv, institution: e.target.value})} placeholder="Ex: XP, Inter, Nu, Binance" />
                   </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-1 col-span-2">
                      <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest ml-1">Valor Atual Investido (R$)</label>
                      <input type="number" step="0.01" className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 text-sm font-black text-[#D4AF37]" value={newInv.current} onChange={e => setNewInv({...newInv, current: e.target.value})} placeholder="0,00" />
                   </div>
                </div>
                <button type="submit" className="w-full py-5 bg-[#D4AF37] text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl hover:scale-[1.02] active:scale-95 transition-all">Registrar Investimento</button>
             </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Investimentos;