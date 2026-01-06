import React, { useState, useEffect } from 'react';
import { Plus, Calendar, X, Sparkles, Rocket, Star, Trophy, DollarSign, ArrowRight, Pencil, Trash2 } from 'lucide-react';
import { Goal } from '../types';
import { useFinance } from '../App';

/**
 * Falling Confetti Animation
 * Simulates colorful paper falling from the top of the screen for 5 seconds.
 */
const fireFallingConfetti = () => {
  const container = document.createElement('div');
  container.id = 'confetti-container';
  container.style.position = 'fixed';
  container.style.inset = '0';
  container.style.pointerEvents = 'none';
  container.style.zIndex = '10000';
  document.body.appendChild(container);

  const colors = ['#a855f7', '#ec4899', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4'];
  const particleCount = 150;

  for (let i = 0; i < particleCount; i++) {
    const particle = document.createElement('div');
    particle.style.position = 'absolute';
    // Random size for "paper" look
    const width = 6 + Math.random() * 8;
    const height = 10 + Math.random() * 10;
    particle.style.width = `${width}px`;
    particle.style.height = `${height}px`;
    particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    particle.style.borderRadius = '2px';
    
    // Random starting position above the viewport
    const startX = Math.random() * 100;
    const startY = -(Math.random() * 100 + 20);
    particle.style.left = `${startX}%`;
    particle.style.top = `${startY}px`;
    
    const duration = 3000 + Math.random() * 3000;
    const delay = Math.random() * 2000;
    const rotation = Math.random() * 360;
    const swingRange = 20 + Math.random() * 30;

    // Animation via Web Animations API
    particle.animate([
      { transform: `translateY(0) rotate(${rotation}deg) translateX(0)`, opacity: 1 },
      { transform: `translateY(${window.innerHeight + 100}px) rotate(${rotation + 720}deg) translateX(${swingRange}px)`, opacity: 0 }
    ], {
      duration: duration,
      delay: delay,
      easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      fill: 'forwards'
    });

    container.appendChild(particle);
  }

  // Cleanup after 5 seconds of the actual "show"
  setTimeout(() => {
    container.remove();
  }, 6000);
};

const Metas: React.FC = () => {
  const { accounts, addTransaction, goals, setGoals } = useFinance();
  const [showAddForm, setShowAddForm] = useState(false);
  const [depositingGoalId, setDepositingGoalId] = useState<string | null>(null);
  const [depositAmount, setDepositAmount] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState(accounts[0]?.id || '');
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);

  const [newGoal, setNewGoal] = useState<Partial<Goal>>({
    title: '',
    target: 0,
    current: 0,
    deadline: new Date().toISOString().split('T')[0],
    color: 'from-purple-400 to-indigo-600'
  });

  const availableColors = [
    'from-purple-500 to-indigo-600',
    'from-blue-500 to-indigo-700',
    'from-orange-500 to-rose-600',
    'from-emerald-500 to-teal-700',
    'from-pink-500 to-rose-600',
    'from-amber-500 to-orange-700'
  ];

  const handleOpenEdit = (goal: Goal) => {
    setEditingGoal(goal);
    setNewGoal({
      title: goal.title,
      target: goal.target,
      current: goal.current,
      deadline: goal.deadline,
      color: goal.color
    });
    setShowAddForm(true);
  };

  const resetForm = () => {
    setShowAddForm(false);
    setEditingGoal(null);
    setNewGoal({ title: '', target: 0, current: 0, deadline: new Date().toISOString().split('T')[0], color: availableColors[0] });
  };

  const handleSaveGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoal.title || !newGoal.target) return;

    if (editingGoal) {
      setGoals(goals.map(g => g.id === editingGoal.id ? {
        ...g,
        title: newGoal.title!,
        target: Number(newGoal.target),
        current: Number(newGoal.current),
        deadline: newGoal.deadline!,
        color: newGoal.color!
      } : g));
    } else {
      const goal: Goal = {
        id: Math.random().toString(36).substr(2, 9),
        title: newGoal.title || 'Novo Sonho',
        target: Number(newGoal.target) || 0,
        current: Number(newGoal.current) || 0,
        deadline: newGoal.deadline || new Date().toISOString().split('T')[0],
        color: newGoal.color || availableColors[0]
      };
      setGoals([goal, ...goals]);
    }
    resetForm();
  };

  const handleDeposit = () => {
    if (!depositingGoalId || !depositAmount) return;
    const amount = Number(depositAmount);
    const account = accounts.find(a => a.id === selectedAccountId);
    if (!account) return;

    // Update global transactions via shared state
    const goal = goals.find(g => g.id === depositingGoalId);
    addTransaction({
      description: `Investimento: ${goal?.title}`,
      amount: amount,
      type: 'expense',
      category: 'Metas',
      date: new Date().toISOString().split('T')[0],
      account: account.name,
      status: 'paid'
    });

    // Update local goals state
    setGoals(prev => prev.map(g => 
      g.id === depositingGoalId ? { ...g, current: g.current + amount } : g
    ));

    // Celebration!
    fireFallingConfetti();
    setDepositingGoalId(null);
    setDepositAmount('');
  };

  const deleteGoal = () => {
    if (editingGoal) {
      setGoals(prevGoals => prevGoals.filter(g => g.id !== editingGoal.id));
      resetForm();
    }
  };

  const getVinnxIncentive = (progress: number) => {
    if (progress >= 100) return "META CONQUISTADA! VOCÊS SÃO INCRÍVEIS! 🎊";
    if (progress >= 85) return "Reta final! Só mais um empurrãozinho! 🚀";
    if (progress >= 50) return "Uau! Já passamos da metade! O sonho tá quase lá! 🎉";
    if (progress >= 30) return "Excelente ritmo! Continuem assim! 🔥";
    if (progress > 0) return "O primeiro passo é o mais importante. Vamos juntos! 💪";
    return "Um novo sonho começa aqui. Planejamento é tudo!";
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700 pb-20">
      {/* Header section with Poppins font */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 px-4 md:px-0">
        <div className="text-center md:text-left">
          <h2 className="text-3xl md:text-4xl font-black font-display tracking-tight text-zinc-800 dark:text-white flex items-center justify-center md:justify-start gap-3">
             <Trophy className="text-amber-500 animate-pulse" size={36} /> Sonhos & Metas
          </h2>
          <p className="text-zinc-500 font-medium italic mt-2 text-sm md:text-base">Nossos sonhos tomando forma, um aporte de cada vez.</p>
        </div>
        <button 
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-3 bg-purple-600 text-white px-10 py-5 rounded-[2.5rem] text-xs font-black uppercase tracking-widest hover:scale-105 shadow-2xl shadow-purple-500/30 transition-all active:scale-95 group w-full md:w-auto justify-center"
        >
          <Plus size={22} className="group-hover:rotate-90 transition-transform" /> Adicionar Meta
        </button>
      </div>

      {/* New/Edit Goal Modal */}
      {showAddForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-2xl rounded-[3rem] p-10 shadow-2xl animate-in zoom-in-95 duration-300 relative overflow-hidden border border-zinc-200 dark:border-zinc-800">
             <div className="flex justify-between items-center mb-10">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-purple-100 dark:bg-purple-900/40 rounded-2xl text-purple-600"><Sparkles size={28} /></div>
                  <h3 className="text-2xl font-black font-display uppercase tracking-tighter">{editingGoal ? 'EDITAR META' : 'PROJETAR NOVO SONHO'}</h3>
                </div>
                <button onClick={resetForm} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors"><X size={32} /></button>
             </div>

             <form onSubmit={handleSaveGoal} className="space-y-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest ml-1">O que vamos conquistar?</label>
                  <input 
                    required
                    placeholder="Ex: Reforma da Sala de Estar" 
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-[2rem] p-5 text-lg font-bold focus:outline-none focus:ring-4 focus:ring-purple-600/10 transition-all"
                    value={newGoal.title}
                    onChange={e => setNewGoal({...newGoal, title: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest ml-1">Quanto precisamos? (R$)</label>
                    <input 
                      required
                      type="number"
                      placeholder="0,00" 
                      className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-[2rem] p-5 text-sm font-black text-purple-600 focus:outline-none focus:ring-4 focus:ring-purple-600/10 transition-all"
                      value={newGoal.target || ''}
                      onChange={e => setNewGoal({...newGoal, target: Number(e.target.value)})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest ml-1">Data Desejada</label>
                    <input 
                      required
                      type="date"
                      className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-[2rem] p-5 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-purple-600/10 transition-all"
                      value={newGoal.deadline}
                      onChange={e => setNewGoal({...newGoal, deadline: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                   <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest ml-1">Vibe da Conquista</label>
                   <div className="flex flex-wrap gap-5">
                      {availableColors.map(c => (
                        <button 
                          key={c}
                          type="button"
                          onClick={() => setNewGoal({...newGoal, color: c})}
                          className={`w-14 h-14 rounded-[1.2rem] bg-gradient-to-tr transition-all duration-300 ${c} ${newGoal.color === c ? 'scale-110 ring-4 ring-purple-600 ring-offset-4 dark:ring-offset-zinc-900 shadow-xl' : 'hover:scale-105 opacity-70 hover:opacity-100'}`}
                        />
                      ))}
                   </div>
                </div>

                <div className="flex justify-between items-center pt-8 border-t border-zinc-100 dark:border-zinc-800">
                  {editingGoal ? (
                    <button type="button" onClick={deleteGoal} className="px-6 py-5 text-xs font-black uppercase tracking-widest text-rose-500 hover:bg-rose-500/10 rounded-[2rem] transition-colors flex items-center gap-2">
                      <Trash2 size={16} /> EXCLUIR
                    </button>
                  ) : <div></div>}
                  
                  <div className="flex gap-4">
                    <button type="button" onClick={resetForm} className="px-8 py-5 text-xs font-black uppercase tracking-widest text-zinc-400 hover:text-zinc-600 transition-colors">CANCELAR</button>
                    <button type="submit" className="px-12 py-5 bg-purple-600 text-white rounded-[2rem] text-xs font-black uppercase tracking-widest shadow-2xl shadow-purple-500/30 active:scale-95 transition-all">
                      {editingGoal ? 'ATUALIZAR META' : 'SALVAR META'}
                    </button>
                  </div>
                </div>
             </form>
          </div>
        </div>
      )}

      {/* Contribution Modal */}
      {depositingGoalId && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-[3rem] p-10 shadow-3xl animate-in zoom-in-95 duration-300 border border-white/10">
             <div className="flex justify-between items-center mb-10">
                <h3 className="text-xl font-black font-display uppercase tracking-tighter">Aporte no Sonho</h3>
                <button onClick={() => setDepositingGoalId(null)} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full"><X size={28} /></button>
             </div>
             <div className="space-y-8">
                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest ml-1">Qual o valor do investimento?</label>
                   <div className="relative">
                      <div className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-purple-600 text-lg">R$</div>
                      <input 
                        type="number" 
                        autoFocus
                        placeholder="0,00" 
                        className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-[2rem] py-5 pl-14 pr-6 text-2xl font-black text-purple-600 focus:outline-none focus:ring-4 focus:ring-purple-600/10"
                        value={depositAmount}
                        onChange={e => setDepositAmount(e.target.value)}
                      />
                   </div>
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest ml-1">Utilizar saldo de qual conta?</label>
                   <select 
                      className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-[2rem] p-5 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-purple-600/10"
                      value={selectedAccountId}
                      onChange={e => setSelectedAccountId(e.target.value)}
                   >
                      {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name} (R$ {acc.balance.toLocaleString()})</option>)}
                   </select>
                </div>
                <button 
                  onClick={handleDeposit}
                  className="w-full py-6 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-[2rem] text-sm font-black uppercase tracking-widest shadow-2xl shadow-purple-500/40 active:scale-95 transition-all flex items-center justify-center gap-3"
                >
                  Confirmar Aporte <ArrowRight size={20} />
                </button>
             </div>
          </div>
        </div>
      )}

      {/* Grid of Achievement Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-4 md:px-0">
        {goals.map((goal) => {
          const progress = Math.min((goal.current / goal.target) * 100, 100);
          
          return (
            <div 
              key={goal.id} 
              className={`relative bg-gradient-to-br ${goal.color} rounded-[3.5rem] p-10 shadow-2xl transition-all duration-500 group overflow-hidden border border-white/20`}
            >
              {/* Soft background glow */}
              <div className="absolute -top-12 -right-12 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000"></div>
              
              <div className="flex flex-col h-full space-y-8 relative z-10">
                <div className="flex justify-between items-start">
                  <div className="flex-1 pr-8">
                    <h3 className="text-2xl md:text-3xl font-black font-display text-white leading-tight uppercase tracking-tighter drop-shadow-sm">{goal.title}</h3>
                    <div className="flex items-center gap-2 text-white/80 text-[10px] font-black uppercase tracking-widest mt-2">
                      <Calendar size={12} className="shrink-0" />
                      Prazo: {new Date(goal.deadline).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}
                    </div>
                  </div>
                  <button 
                    onClick={() => handleOpenEdit(goal)}
                    className="p-3 bg-white/10 hover:bg-white/30 rounded-2xl text-white transition-all active:scale-90 shadow-lg"
                  >
                    <Pencil size={16} />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Current vs Target status */}
                  <div className="flex justify-between items-end text-white">
                    <div className="flex flex-col">
                       <span className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-1">Acumulado</span>
                       <span className="text-3xl font-black tracking-tight">R$ {goal.current.toLocaleString()}</span>
                    </div>
                    <div className="flex flex-col text-right">
                       <span className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-1">Objetivo</span>
                       <span className="text-xl font-bold opacity-90">R$ {goal.target.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Suculenta Progress Bar with Moving Icon at the tip */}
                  <div className="relative pt-8 pb-4">
                    <div className="h-10 w-full bg-black/15 rounded-full overflow-hidden p-1.5 backdrop-blur-md shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)]">
                      <div 
                        className="h-full bg-white rounded-full transition-all duration-1500 ease-out shadow-[0_4px_12px_rgba(255,255,255,0.3)] relative min-w-[36px]" 
                        style={{ width: `${progress}%` }}
                      >
                         {/* Animated shine effect */}
                         <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent w-full animate-[pulse_3s_infinite]"></div>
                         
                         {/* Dynamic Icon at the progress tip */}
                         <div className="absolute -right-4 -top-10 transition-transform duration-300">
                            {progress >= 100 ? (
                              <div className="bg-amber-400 p-2 rounded-xl shadow-xl animate-bounce">
                                <Trophy className="text-white drop-shadow-md" size={32} />
                              </div>
                            ) : progress >= 85 ? (
                              <div className="bg-white/20 backdrop-blur-md p-2 rounded-xl animate-pulse">
                                <Rocket className="text-white drop-shadow-xl rotate-45" size={28} />
                              </div>
                            ) : (
                              <div className="p-2 animate-bounce">
                                <Star className="text-white drop-shadow-xl fill-white" size={28} />
                              </div>
                            )}
                         </div>
                      </div>
                    </div>
                    
                    {/* Progress percentage overlay */}
                    <div className="flex justify-end mt-2">
                       <span className="text-xl font-black text-white">{progress.toFixed(0)}%</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-white/90">
                    <span className="text-[10px] font-black uppercase tracking-widest">
                      {goal.target - goal.current > 0 
                        ? `Restam R$ ${(goal.target - goal.current).toLocaleString()}` 
                        : 'CONQUISTADO COM SUCESSO! 🥂'}
                    </span>
                  </div>
                </div>

                {/* Direct Action Button */}
                <button 
                  onClick={() => setDepositingGoalId(goal.id)}
                  className="w-full py-5 bg-white text-zinc-900 rounded-[2rem] flex items-center justify-center gap-3 text-xs font-black uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-95 shadow-2xl group/btn"
                >
                  <DollarSign size={20} className="text-emerald-600" /> Fazer Investimento <ArrowRight size={18} className="group-hover/btn:translate-x-1.5 transition-transform" />
                </button>

                {/* VinnxAI Integrated Insight */}
                <div className="mt-4">
                  <div className="bg-black/10 backdrop-blur-md border border-white/10 p-5 rounded-[2.5rem] flex items-start gap-4 group-hover:bg-black/20 transition-all">
                    <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-inner">
                       <Sparkles size={18} />
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-white italic leading-relaxed">
                        "{getVinnxIncentive(progress)}"
                      </p>
                      <p className="text-[8px] font-black uppercase tracking-widest text-white/50 mt-1">Dica do VinnxAI</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Metas;