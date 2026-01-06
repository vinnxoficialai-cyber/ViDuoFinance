
import React, { useState } from 'react';
import { 
  CreditCard, 
  Plus, 
  X, 
  Eye, 
  EyeOff, 
  User, 
  Users, 
  TrendingUp, 
  TrendingDown,
  Cpu,
  Shield
} from 'lucide-react';
import { BankAccount } from '../types';
import { useFinance } from '../App';

const AccountCard = ({ 
  account, 
  hideBalance, 
  onDelete 
}: { 
  account: BankAccount; 
  hideBalance: boolean; 
  onDelete: (id: string) => void 
}) => {
  const isPositive = (account.trend || 0) >= 0;

  // Visual mapping for banks
  const themes: Record<string, string> = {
    purple: 'from-indigo-900 via-purple-900 to-fuchsia-900 border-purple-500/30 hover:shadow-[0_0_30px_-5px_rgba(168,85,247,0.4)]',
    orange: 'from-orange-950 via-orange-900 to-amber-900 border-orange-500/30 hover:shadow-[0_0_30px_-5px_rgba(249,115,22,0.4)]',
    black: 'from-zinc-900 via-zinc-800 to-zinc-950 border-amber-500/20 hover:shadow-[0_0_30px_-5px_rgba(251,191,36,0.2)]',
    blue: 'from-sky-950 via-blue-900 to-indigo-950 border-blue-500/30 hover:shadow-[0_0_30px_-5px_rgba(59,130,246,0.4)]',
    pink: 'from-pink-950 via-pink-900 to-rose-950 border-pink-500/30 hover:shadow-[0_0_30px_-5px_rgba(236,72,153,0.4)]',
    emerald: 'from-emerald-950 via-emerald-900 to-teal-950 border-emerald-500/30 hover:shadow-[0_0_30px_-5px_rgba(16,185,129,0.4)]',
    slate: 'from-slate-900 via-slate-800 to-gray-900 border-slate-500/30 hover:shadow-[0_0_30px_-5px_rgba(148,163,184,0.4)]'
  };

  const colors = themes[account.color] || themes.blue;

  return (
    <div className={`relative group aspect-[1.58/1] w-full rounded-[1.5rem] p-6 text-white border bg-gradient-to-br ${colors} transition-all duration-500 hover:-translate-y-2 cursor-pointer shadow-2xl overflow-hidden`}>
      {/* Glossy overlay */}
      <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
      
      {/* Branding and Ownership */}
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner">
             <span className="font-black text-xs">{account.name.substring(0, 2).toUpperCase()}</span>
          </div>
          <div className="flex flex-col">
            <h3 className="text-sm font-bold tracking-tight">{account.name}</h3>
            <span className="text-[10px] opacity-60 font-medium">Digital Account</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2 px-3 py-1 bg-black/20 backdrop-blur-md rounded-full border border-white/10">
           {account.owner === 'Conjunta' ? <Users size={12} /> : <User size={12} />}
           <span className="text-[10px] font-black uppercase tracking-widest">{account.owner || 'Titular'}</span>
        </div>
      </div>

      {/* Chip and Trend */}
      <div className="flex justify-between items-center mb-6">
        <div className="w-10 h-8 bg-amber-500/20 rounded-md border border-amber-500/40 flex items-center justify-center opacity-80">
          <Cpu size={20} className="text-amber-500/60" />
        </div>
        {account.trend !== undefined && (
          <div className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold ${isPositive ? 'text-emerald-400 bg-emerald-400/10' : 'text-rose-400 bg-rose-400/10'}`}>
            {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {Math.abs(account.trend)}%
          </div>
        )}
      </div>

      {/* Balance */}
      <div className="space-y-1">
        <p className="text-[10px] uppercase font-black tracking-widest opacity-60">Balance</p>
        <div className="flex items-baseline gap-1">
          <span className="text-xs font-bold opacity-80">R$</span>
          <span className="text-2xl font-black tracking-tighter">
            {hideBalance ? '••••••' : account.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      {/* Card Details Footer */}
      <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end">
        <span className="font-mono text-xs opacity-60 tracking-[0.2em]">
          **** **** **** {account.lastDigits || '4829'}
        </span>
        <div className="flex -space-x-3 opacity-80">
          <div className="w-6 h-6 rounded-full bg-rose-500/80"></div>
          <div className="w-6 h-6 rounded-full bg-amber-500/80"></div>
        </div>
      </div>

      {/* Delete trigger */}
      <button 
        onClick={(e) => { e.stopPropagation(); onDelete(account.id); }}
        className="absolute top-2 right-2 p-1.5 text-white/40 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all rounded-full hover:bg-white/10"
      >
        <X size={14} />
      </button>
    </div>
  );
};

const Contas: React.FC = () => {
  const { accounts, addAccount, deleteAccount, appSettings, userProfile, familyMember } = useFinance();
  const [showAddForm, setShowAddForm] = useState(false);
  const [hideBalances, setHideBalances] = useState(false);
  const [newAccount, setNewAccount] = useState<Partial<BankAccount>>({
    name: '',
    balance: 0,
    color: 'purple',
    owner: 'Conjunta',
    lastDigits: ''
  });

  const handleAddAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccount.name) return;

    addAccount({
      name: newAccount.name || 'Nova Conta',
      balance: Number(newAccount.balance) || 0,
      color: newAccount.color || 'purple',
      owner: newAccount.owner as any,
      lastDigits: newAccount.lastDigits || Math.floor(1000 + Math.random() * 9000).toString(),
      trend: 0
    });

    setShowAddForm(false);
    setNewAccount({ name: '', balance: 0, color: 'purple', owner: 'Conjunta', lastDigits: '' });
  };

  const totalBalance = accounts.reduce((acc, curr) => acc + curr.balance, 0);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      {/* Premium Wallet Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-3xl font-black tracking-tight flex items-center gap-3">
             <div className="p-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl"><CreditCard size={24} /></div>
             Carteira Digital Premium
          </h2>
          <p className="text-zinc-500 text-sm font-medium mt-1">Gestão centralizada de ativos com segurança bancária.</p>
        </div>
        
        <div className="flex items-center gap-4 bg-white dark:bg-zinc-900 p-2 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
           <div className="px-4">
              <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Patrimônio Líquido</p>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black">
                  {hideBalances ? 'R$ •••••••' : `R$ ${totalBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                </span>
                <button 
                  onClick={() => setHideBalances(!hideBalances)}
                  className="p-1 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
                >
                  {hideBalances ? <Eye size={18} /> : <EyeOff size={18} />}
                </button>
              </div>
           </div>
           <button 
            onClick={() => setShowAddForm(true)}
            className="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 p-4 rounded-xl shadow-lg hover:scale-105 active:scale-95 transition-all"
          >
            <Plus size={20} />
          </button>
        </div>
      </div>

      {showAddForm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-lg rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95 duration-300 relative border border-zinc-200 dark:border-zinc-800">
             <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center text-purple-600">
                    <Plus size={24} />
                  </div>
                  <h3 className="text-xl font-black tracking-tighter uppercase">Configurar Novo Cartão</h3>
                </div>
                <button onClick={() => setShowAddForm(false)} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full"><X size={24} /></button>
             </div>
             
             <form onSubmit={handleAddAccount} className="space-y-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest ml-1">Instituição</label>
                  <input required placeholder="Nome do Banco" className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-purple-600/20" value={newAccount.name} onChange={e => setNewAccount({...newAccount, name: e.target.value})} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest ml-1">Saldo Atual (R$)</label>
                    <input required type="number" step="0.01" className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-purple-600/20" value={newAccount.balance || ''} onChange={e => setNewAccount({...newAccount, balance: Number(e.target.value)})} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest ml-1">Titularidade</label>
                    <select className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-purple-600/20" value={newAccount.owner} onChange={e => setNewAccount({...newAccount, owner: e.target.value as any})}>
                      <option value="Conjunta">Conjunta</option>
                      <option value={userProfile.name}>{userProfile.name}</option>
                      {familyMember && <option value={familyMember.name}>{familyMember.name}</option>}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest ml-1">Estilo Visual</label>
                    <select className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-purple-600/20" value={newAccount.color} onChange={e => setNewAccount({...newAccount, color: e.target.value})}>
                      {appSettings.accountColors.map(col => (
                        <option key={col.value} value={col.value}>{col.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest ml-1">Últimos 4 Dígitos</label>
                    <input maxLength={4} placeholder="4829" className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-purple-600/20" value={newAccount.lastDigits} onChange={e => setNewAccount({...newAccount, lastDigits: e.target.value})} />
                  </div>
                </div>

                <button type="submit" className="w-full py-4 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl hover:opacity-90 active:scale-95 transition-all">
                  Emitir Cartão Virtual
                </button>
             </form>
          </div>
        </div>
      )}

      {/* Credit Card Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {accounts.map((account) => (
          <AccountCard 
            key={account.id} 
            account={account} 
            hideBalance={hideBalances}
            onDelete={deleteAccount}
          />
        ))}
        
        {/* Placeholder Add Account Card */}
        <button 
          onClick={() => setShowAddForm(true)}
          className="aspect-[1.58/1] w-full rounded-[1.5rem] border-4 border-dashed border-zinc-200 dark:border-zinc-800 flex flex-col items-center justify-center text-zinc-400 hover:text-purple-500 hover:border-purple-500/50 hover:bg-purple-500/5 transition-all duration-300 group"
        >
          <div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Plus size={32} />
          </div>
          <span className="text-xs font-black uppercase tracking-widest">Adicionar Nova Conta</span>
        </button>
      </div>

      {/* Statistics / Indicators Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
         <div className="bg-white dark:bg-zinc-900/50 p-6 rounded-3xl border border-zinc-100 dark:border-zinc-800 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-500/10 text-emerald-500 rounded-2xl flex items-center justify-center">
               <TrendingUp size={24} />
            </div>
            <div>
               <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Desempenho Médio</p>
               <h4 className="text-lg font-black">+4.2% este mês</h4>
            </div>
         </div>
         <div className="bg-white dark:bg-zinc-900/50 p-6 rounded-3xl border border-zinc-100 dark:border-zinc-800 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-500/10 text-purple-500 rounded-2xl flex items-center justify-center">
               <Users size={24} />
            </div>
            <div>
               <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Contas Compartilhadas</p>
               <h4 className="text-lg font-black">{accounts.filter(a => a.owner === 'Conjunta').length} de {accounts.length} contas</h4>
            </div>
         </div>
         <div className="bg-white dark:bg-zinc-900/50 p-6 rounded-3xl border border-zinc-100 dark:border-zinc-800 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-500/10 text-blue-500 rounded-2xl flex items-center justify-center">
               <Shield size={24} />
            </div>
            <div>
               <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Nível de Segurança</p>
               <h4 className="text-lg font-black">Criptografado AES-256</h4>
            </div>
         </div>
      </div>
    </div>
  );
};

export default Contas;
