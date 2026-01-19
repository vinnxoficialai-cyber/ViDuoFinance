import React, { useState, useMemo } from 'react';
import { 
  CreditCard as CardIcon, 
  Calendar, 
  Plus, 
  Receipt,
  AlertCircle,
  Clock,
  LayoutGrid,
  X,
  Store,
  CheckCircle2,
  Wallet,
  User,
  Hash,
  ChevronRight
} from 'lucide-react';
import { CreditCard as ICreditCard, Transaction } from '../types';
import { useFinance } from '../App';

const CartaoFisico = ({ card, active }: { card: ICreditCard, active: boolean }) => {
  return (
    <div className={`relative aspect-[1.58/1] w-[280px] sm:w-[340px] md:w-[400px] rounded-[2rem] p-6 sm:p-8 text-white border transition-all duration-500 cursor-pointer shadow-2xl overflow-hidden shrink-0 snap-center ${
      active ? 'scale-100 ring-4 ring-purple-600/30 z-10' : 'opacity-40 scale-90 grayscale'
    } bg-gradient-to-br ${card.color}`}>
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-8 blur-2xl"></div>
      
      <div className="flex justify-between items-start relative z-10">
        <div className="space-y-1">
          <h4 className="text-base sm:text-lg font-black tracking-tight">{card.name}</h4>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-60 leading-none">**** {card.lastDigits}</p>
        </div>
        <div className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/20 uppercase font-black text-[10px]">
           {card.brand}
        </div>
      </div>

      <div className="absolute bottom-6 sm:bottom-8 left-6 sm:left-8 right-6 sm:right-8 space-y-4">
        <div className="flex justify-between items-end">
          <div className="space-y-1">
            <p className="text-[8px] font-black uppercase tracking-widest opacity-50">Titular</p>
            <p className="text-[10px] sm:text-xs font-bold uppercase tracking-widest">{card.owner}</p>
          </div>
          <div className="flex -space-x-2">
            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-rose-500/80 border border-white/10"></div>
            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-amber-500/80 border border-white/10"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Cartoes: React.FC = () => {
  const { creditCards, accounts, addTransaction, addCreditCard, transactions, userProfile, familyMember, appSettings } = useFinance();
  const [activeCardId, setActiveCardId] = useState(creditCards[0]?.id || '');
  const [isAddCardOpen, setIsAddCardOpen] = useState(false);
  const [isAddPurchaseOpen, setIsAddPurchaseOpen] = useState(false);
  const [isPayInvoiceOpen, setIsPayInvoiceOpen] = useState(false);

  const [newCard, setNewCard] = useState({
    name: '', lastDigits: '', owner: userProfile.name, brand: appSettings.cardBrands[0] || 'mastercard', closingDay: '10', bestDay: '1', limit: '', color: 'from-zinc-900 to-zinc-950'
  });
  
  const [newPurchase, setNewPurchase] = useState({
    desc: '', 
    store: '', 
    amount: '', 
    installments: '1',
    dueDate: new Date().toISOString().split('T')[0]
  });

  const [paymentInfo, setPaymentInfo] = useState({
    accountId: accounts[0]?.id || '',
    date: new Date().toISOString().split('T')[0]
  });

  const activeCard = useMemo(() => creditCards.find(c => c.id === activeCardId) || creditCards[0], [activeCardId, creditCards]);

  const cardTransactions = useMemo(() => {
    if (!activeCard) return [];
    return transactions.filter(t => t.account === activeCard.name && t.status === 'pending');
  }, [transactions, activeCard]);

  const handleAddCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCard.name) return;

    const card: ICreditCard = {
      id: Math.random().toString(36).substr(2, 9),
      name: newCard.name,
      limit: Number(newCard.limit) || 0,
      used: 0,
      bestDay: Number(newCard.bestDay) || 1,
      closingDay: Number(newCard.closingDay) || 10,
      color: newCard.color,
      brand: newCard.brand,
      lastDigits: newCard.lastDigits || '0000',
      owner: newCard.owner
    };

    addCreditCard(card);
    setIsAddCardOpen(false);
    setNewCard({ name: '', lastDigits: '', owner: userProfile.name, brand: 'mastercard', closingDay: '10', bestDay: '1', limit: '', color: 'from-zinc-900 to-zinc-950' });
  };

  const handleAddPurchase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCard) return;
    const amountTotal = Number(newPurchase.amount);
    const instCount = Number(newPurchase.installments);
    const amountPerInst = amountTotal / instCount;

    for (let i = 0; i < instCount; i++) {
      const d = new Date(newPurchase.dueDate);
      d.setMonth(d.getMonth() + i);
      
      addTransaction({
        description: `${newPurchase.desc} (${newPurchase.store}) ${instCount > 1 ? `${i + 1}/${instCount}` : ''}`,
        amount: amountPerInst,
        type: 'expense',
        category: 'Lazer',
        date: d.toISOString().split('T')[0],
        dueDate: d.toISOString().split('T')[0],
        account: activeCard.name,
        status: 'pending'
      });
    }
    setIsAddPurchaseOpen(false);
    setNewPurchase({ desc: '', store: '', amount: '', installments: '1', dueDate: new Date().toISOString().split('T')[0] });
  };

  const handlePayInvoice = () => {
    if (!activeCard) return;
    const account = accounts.find(a => a.id === paymentInfo.accountId);
    if (!account) return;

    addTransaction({
      description: `Pagamento Fatura: ${activeCard.name}`,
      amount: activeCard.used,
      type: 'expense',
      category: 'Geral',
      date: paymentInfo.date,
      account: account.name,
      status: 'paid'
    });

    setIsPayInvoiceOpen(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-24 overflow-x-hidden">
      <div className="space-y-6">
        <div className="flex justify-between items-center px-4 md:px-0">
          <div>
            <h2 className="text-xl md:text-2xl font-black tracking-tight uppercase">Gestão de Cartões</h2>
            <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mt-1">Controle de faturas e limites</p>
          </div>
          <button onClick={() => setIsAddCardOpen(true)} className="p-3 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-2xl shadow-xl hover:scale-105 active:scale-95 transition-all">
            <Plus size={20} />
          </button>
        </div>

        {creditCards.length > 0 ? (
          <div className="flex gap-4 sm:gap-6 md:gap-8 overflow-x-auto pb-6 pt-2 px-4 md:px-0 scrollbar-hide snap-x snap-mandatory">
            {creditCards.map(card => (
              <div key={card.id} className="snap-center" onClick={() => setActiveCardId(card.id)}>
                <CartaoFisico card={card} active={activeCardId === card.id} />
              </div>
            ))}
            <div className="shrink-0 w-4 md:hidden"></div>
          </div>
        ) : (
          <div className="px-4 md:px-0">
            <button 
              onClick={() => setIsAddCardOpen(true)}
              className="w-full aspect-[1.58/1] max-w-[400px] border-4 border-dashed border-zinc-200 dark:border-zinc-800 rounded-[2rem] flex flex-col items-center justify-center text-zinc-400 hover:text-purple-600 hover:border-purple-600/30 transition-all group"
            >
              <Plus size={40} className="mb-4 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-black uppercase tracking-widest">Adicionar Primeiro Cartão</span>
            </button>
          </div>
        )}
      </div>

      {activeCard && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 px-4 md:px-0">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] p-8 shadow-xl">
               <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 bg-purple-500/10 text-purple-600 rounded-2xl flex items-center justify-center"><LayoutGrid size={24} /></div>
                  <div>
                     <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Resumo da Fatura</h3>
                     <p className="text-lg font-black">{activeCard.name}</p>
                  </div>
               </div>

               <div className="space-y-6">
                  <div>
                     <div className="flex justify-between text-xs font-black uppercase tracking-widest mb-3">
                        <span className="text-zinc-400">Utilizado: R$ {activeCard.used.toLocaleString()}</span>
                        <span className="text-zinc-900 dark:text-white">Livre: R$ {(activeCard.limit - activeCard.used).toLocaleString()}</span>
                     </div>
                     <div className="h-4 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden p-1">
                        <div 
                          className="h-full bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full shadow-[0_0_12px_rgba(168,85,247,0.4)] transition-all duration-1000" 
                          style={{ width: `${Math.min((activeCard.used / activeCard.limit) * 100, 100)}%` }}
                        ></div>
                     </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-6 border-t border-zinc-100 dark:border-zinc-800">
                     <div className="space-y-1">
                        <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Melhor Compra</span>
                        <div className="flex items-center gap-2">
                           <Calendar className="text-emerald-500" size={16} />
                           <span className="text-lg font-black">Dia {activeCard.bestDay}</span>
                        </div>
                     </div>
                     <div className="space-y-1">
                        <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Vencimento</span>
                        <div className="flex items-center gap-2">
                           <AlertCircle className="text-rose-500" size={16} />
                           <span className="text-lg font-black">Dia {activeCard.closingDay}</span>
                        </div>
                     </div>
                  </div>
               </div>
            </div>

            <div className="flex flex-col gap-3">
              <button 
                onClick={() => setIsPayInvoiceOpen(true)}
                className="w-full py-5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-[2rem] shadow-2xl shadow-purple-500/30 flex items-center justify-center gap-3 text-xs font-black uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all"
              >
                <Receipt size={20} /> Pagar Fatura Agora
              </button>
              <button 
                onClick={() => setIsAddPurchaseOpen(true)}
                className="w-full py-5 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-[2rem] flex items-center justify-center gap-3 text-xs font-black uppercase tracking-widest hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all"
              >
                <Plus size={20} /> Adicionar na Fatura
              </button>
            </div>
          </div>

          <div className="lg:col-span-3">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] overflow-hidden shadow-xl min-h-[400px]">
              <div className="p-8 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center bg-zinc-50/50 dark:bg-zinc-950/30">
                <div>
                  <h3 className="text-sm font-black uppercase tracking-widest text-zinc-400">Total Aberto</h3>
                  <p className="text-3xl font-black tracking-tighter">R$ {activeCard.used.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </div>
                <span className="px-6 py-2 bg-emerald-500/10 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-500/20">Aberta</span>
              </div>

              <div className="p-8 space-y-8">
                {cardTransactions.length === 0 ? (
                  <div className="py-20 text-center space-y-4">
                    <div className="w-16 h-16 bg-zinc-50 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto text-zinc-300"><Clock size={32} /></div>
                    <p className="text-zinc-500 text-sm font-medium">Nenhuma compra pendente.</p>
                  </div>
                ) : cardTransactions.map(t => (
                  <div key={t.id} className="flex items-center justify-between group">
                    <div className="flex items-center gap-6">
                      <div className="flex flex-col items-center min-w-[40px]">
                         <span className="text-[10px] font-black text-zinc-400 leading-none">{t.date.split('-')[2]}</span>
                         <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-tighter">{new Date(t.date).toLocaleDateString('pt-BR', { month: 'short' })}</span>
                      </div>
                      <div className="w-0.5 h-10 bg-zinc-100 dark:bg-zinc-800 rounded-full"></div>
                      <div>
                         <h4 className="text-sm font-black text-zinc-800 dark:text-zinc-100">{t.description}</h4>
                         <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1"><Store size={10} /> Compra no crédito</span>
                         </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-black text-rose-500">R$ {t.amount.toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD CARD */}
      {isAddCardOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-2xl rounded-[3rem] p-8 md:p-12 shadow-2xl animate-in zoom-in-95 duration-300 relative overflow-y-auto max-h-[90vh]">
             <div className="flex justify-between items-center mb-10">
                <h3 className="text-2xl font-black uppercase tracking-tighter">Novo Cartão</h3>
                <button onClick={() => setIsAddCardOpen(false)} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full"><X size={28} /></button>
             </div>
             <form onSubmit={handleAddCard} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest ml-1 flex items-center gap-2"><CardIcon size={12}/> Nome do Cartão</label>
                    <input required placeholder="Ex: Inter Black" className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 text-sm font-bold focus:outline-none" value={newCard.name} onChange={e => setNewCard({...newCard, name: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest ml-1 flex items-center gap-2"><Hash size={12}/> Final do Cartão</label>
                    <input required maxLength={4} placeholder="Ex: 8812" className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 text-sm font-bold font-mono focus:outline-none" value={newCard.lastDigits} onChange={e => setNewCard({...newCard, lastDigits: e.target.value})} />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest ml-1">Bandeira</label>
                    <select className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 text-sm font-bold focus:outline-none" value={newCard.brand} onChange={e => setNewCard({...newCard, brand: e.target.value as any})}>
                       {appSettings.cardBrands.map(brand => (
                         <option key={brand} value={brand}>{brand}</option>
                       ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest ml-1 flex items-center gap-2"><User size={12}/> Titular</label>
                    <select className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 text-sm font-bold focus:outline-none" value={newCard.owner} onChange={e => setNewCard({...newCard, owner: e.target.value as any})}>
                       <option value={userProfile.name}>{userProfile.name}</option>
                       {familyMember && <option value={familyMember.name}>{familyMember.name}</option>}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest ml-1">Dia do Vencimento</label>
                    <input type="number" placeholder="Dia" className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 text-sm font-bold focus:outline-none" value={newCard.closingDay} onChange={e => setNewCard({...newCard, closingDay: e.target.value})} />
                  </div>
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest ml-1">Limite Total (R$)</label>
                    <input type="number" placeholder="Ex: 5000" className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 text-lg font-black text-purple-600 focus:outline-none" value={newCard.limit} onChange={e => setNewCard({...newCard, limit: e.target.value})} />
                </div>

                <button type="submit" className="w-full py-6 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-[2rem] text-sm font-black uppercase tracking-widest shadow-2xl">Confirmar Cadastro</button>
             </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD PURCHASE */}
      {isAddPurchaseOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-2xl rounded-[3rem] p-10 shadow-2xl animate-in zoom-in-95 duration-300">
             <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-black uppercase tracking-tighter">Lançar na Fatura</h3>
                <button onClick={() => setIsAddPurchaseOpen(false)} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full"><X size={28} /></button>
             </div>
             <form onSubmit={handleAddPurchase} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                     <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest ml-1">O que foi comprado?</label>
                     <input required autoFocus className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 text-sm font-bold" value={newPurchase.desc} onChange={e => setNewPurchase({...newPurchase, desc: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                     <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest ml-1">Estabelecimento</label>
                     <input required className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 text-sm font-bold" value={newPurchase.store} onChange={e => setNewPurchase({...newPurchase, store: e.target.value})} />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                   <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest ml-1">Valor Total</label>
                      <input required type="number" step="0.01" className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 text-sm font-black text-rose-500" value={newPurchase.amount} onChange={e => setNewPurchase({...newPurchase, amount: e.target.value})} />
                   </div>
                   <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest ml-1">Parcelado?</label>
                      <select className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 text-sm font-bold" value={newPurchase.installments} onChange={e => setNewPurchase({...newPurchase, installments: e.target.value})}>
                         {[1,2,3,4,5,6,10,12,24].map(n => <option key={n} value={n}>{n}x</option>)}
                      </select>
                   </div>
                   <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest ml-1">Vencimento</label>
                      <input required type="date" className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 text-sm font-bold" value={newPurchase.dueDate} onChange={e => setNewPurchase({...newPurchase, dueDate: e.target.value})} />
                   </div>
                </div>
                <button type="submit" className="w-full py-5 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-2xl text-xs font-black uppercase tracking-widest">Confirmar Lançamento</button>
             </form>
          </div>
        </div>
      )}

      {/* MODAL: PAY INVOICE */}
      {isPayInvoiceOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-lg rounded-[3rem] p-10 shadow-2xl animate-in zoom-in-95 duration-300">
             <div className="flex justify-between items-center mb-10">
                <div className="flex items-center gap-3">
                   <CheckCircle2 className="text-emerald-500" size={32} />
                   <h3 className="text-2xl font-black uppercase tracking-tighter">Liquidando Fatura</h3>
                </div>
                <button onClick={() => setIsPayInvoiceOpen(false)} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full"><X size={28} /></button>
             </div>
             <div className="space-y-8">
                <div className="bg-zinc-50 dark:bg-zinc-950 p-6 rounded-3xl border border-zinc-100 dark:border-zinc-800 text-center">
                   <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest mb-1">Valor a pagar</p>
                   <p className="text-4xl font-black tracking-tighter text-purple-600">R$ {activeCard?.used.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </div>
                
                <div className="space-y-4">
                   <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest ml-1">Débito em qual conta?</label>
                      <select 
                        className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 text-sm font-bold"
                        value={paymentInfo.accountId}
                        onChange={e => setPaymentInfo({...paymentInfo, accountId: e.target.value})}
                      >
                         {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name} (R$ {acc.balance.toLocaleString()})</option>)}
                      </select>
                   </div>
                   <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest ml-1">Data do Pagamento</label>
                      <input type="date" className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 text-sm font-bold" value={paymentInfo.date} onChange={e => setPaymentInfo({...paymentInfo, date: e.target.value})} />
                   </div>
                </div>

                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-3">
                   <Wallet className="text-emerald-500" size={20} />
                   <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Este pagamento será lançado como uma despesa única no seu extrato financeiro.</p>
                </div>

                <button onClick={handlePayInvoice} className="w-full py-5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-[2rem] text-sm font-black uppercase tracking-widest shadow-2xl">Confirmar Pagamento</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cartoes;