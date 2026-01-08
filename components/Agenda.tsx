import React, { useState, useMemo } from 'react';
import { 
  Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, DollarSign, 
  Heart, CheckSquare, X, Clock, MoreVertical, Trash2
} from 'lucide-react';
import { useFinance } from '../App';
import { useAgenda } from '../hooks/useAgenda'; // Hook do Supabase que criamos

interface CalendarEventDisplay {
  id: string;
  title: string;
  type: string;
  owner: string; // "Conjunta", "Você", ou Nome
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  isManual: boolean; // Para saber se podemos deletar direto daqui
  description?: string;
  amount?: number;
}

const Agenda: React.FC = () => {
  const { userProfile, familyMember, transactions } = useFinance(); // Contas a pagar
  const { events: dbEvents, loading, addEvent, deleteEvent } = useAgenda(); // Eventos do Supabase
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [filter, setFilter] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Estado do formulário
  const [newEvent, setNewEvent] = useState({
    title: '',
    type: 'task',
    owner: 'Conjunta',
    date: new Date().toISOString().split('T')[0],
    time: '12:00',
    description: ''
  });

  // --- 1. PREPARAÇÃO DOS DADOS ---

  // Eventos Financeiros (Contas Pendentes) - Vêm do Financeiro
  const financialEvents = useMemo(() => {
    return transactions
      .filter(t => t.status === 'pending' || t.status === 'overdue')
      .map(t => ({
        id: `fin-${t.id}`, // Prefixo para não confundir ID
        title: `Pagar: ${t.description} (R$ ${Number(t.amount).toLocaleString()})`,
        type: 'finance',
        owner: t.owner || 'Conjunta',
        date: t.date,
        time: '09:00',
        isManual: false,
        amount: Number(t.amount)
      } as CalendarEventDisplay));
  }, [transactions]);

  // Eventos Manuais - Vêm do Supabase (useAgenda)
  const manualEvents = useMemo(() => {
    return dbEvents.map(e => {
      // Ajuste de fuso horário simples para exibição correta
      const dateObj = new Date(e.start);
      const dateStr = dateObj.toISOString().split('T')[0];
      const timeStr = dateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

      return {
        id: e.id,
        title: e.title,
        type: e.type || 'task',
        owner: 'Conjunta', // O banco atual não tem "owner", assumimos conjunta ou você pode criar campo
        date: dateStr,
        time: timeStr,
        isManual: true,
        description: e.description
      } as CalendarEventDisplay;
    });
  }, [dbEvents]);

  // Combina tudo
  const allEvents = useMemo(() => {
    return [...manualEvents, ...financialEvents];
  }, [manualEvents, financialEvents]);


  // --- 2. FILTROS E NAVEGAÇÃO ---

  const filterOptions = [
    { id: 'all', label: 'Ver tudo' },
    { id: 'finance', label: 'Financeiro' },
    { id: 'social', label: 'Lazer' },
    { id: 'task', label: 'Tarefas' }
  ];

  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const totalDays = daysInMonth(year, month);
  const startDay = firstDayOfMonth(year, month);

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  // Aplica os filtros
  const filteredEvents = useMemo(() => {
    return allEvents.filter(e => {
      if (filter === 'all') return true;
      if (filter === 'finance') return e.type === 'finance';
      if (filter === 'social') return e.type === 'social';
      if (filter === 'task') return e.type === 'task';
      return true;
    });
  }, [allEvents, filter]);

  // Próximos eventos (Lista lateral)
  const upcomingEvents = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return [...filteredEvents]
      .filter(e => {
        // Correção de bug de data "ontem" por causa de fuso
        const eventDate = new Date(e.date + 'T00:00:00'); // Força meia noite local
        return eventDate >= today;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 7);
  }, [filteredEvents]);


  // --- 3. AÇÕES (ADICIONAR/DELETAR) ---

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEvent.title || !newEvent.date) return;

    // Criar data combinada (Data + Hora)
    const combinedDate = new Date(`${newEvent.date}T${newEvent.time || '12:00'}:00`);
    
    const success = await addEvent({
      title: newEvent.title,
      type: newEvent.type,
      start: combinedDate,
      // end: combinedDate, // Se quiser eventos com duração, adicionamos depois
      description: newEvent.description,
      status: 'pending'
    });

    if (success) {
      setIsAddModalOpen(false);
      setNewEvent({ title: '', type: 'task', owner: 'Conjunta', date: new Date().toISOString().split('T')[0], time: '12:00', description: '' });
    }
  };

  const handleDelete = async (id: string, isManual: boolean) => {
    if (!isManual) {
      alert("Para remover este evento, marque a conta como paga na tela de Finanças.");
      return;
    }
    if (confirm("Deseja apagar este evento da agenda?")) {
      await deleteEvent(id);
    }
  };

  // Helpers Visuais
  const getEventIcon = (type: string) => {
    switch(type) {
      case 'finance': return <DollarSign size={10} />;
      case 'social': return <Heart size={10} />;
      default: return <CheckSquare size={10} />;
    }
  };

  const getEventColor = (type: string) => {
    switch(type) {
      case 'finance': return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
      case 'social': return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      default: return 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20';
    }
  };

  const getAvatar = (ownerName: string) => {
    if (ownerName === userProfile.name) return userProfile.avatar;
    if (familyMember && ownerName === familyMember.name) return familyMember.avatar;
    return `https://ui-avatars.com/api/?name=${ownerName}&background=random`;
  };

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="flex flex-col lg:flex-row gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-24">
      
      {/* 70% Left: Big Calendar */}
      <div className="lg:w-[70%] space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-2 rounded-2xl shadow-sm">
            <button onClick={prevMonth} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"><ChevronLeft size={20}/></button>
            <span className="text-sm font-black uppercase tracking-widest px-4 min-w-[160px] text-center text-zinc-800 dark:text-zinc-200">
              {currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
            </span>
            <button onClick={nextMonth} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"><ChevronRight size={20}/></button>
          </div>
          
          <div className="flex gap-2 p-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-x-auto">
            {filterOptions.map((f: any) => (
              <button 
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all whitespace-nowrap ${filter === f.id ? 'bg-purple-600 text-white shadow-lg' : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] overflow-hidden shadow-xl p-6 md:p-8">
          <div className="grid grid-cols-7 border-b border-zinc-100 dark:border-zinc-800 pb-4">
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
              <div key={day} className="text-center text-[10px] font-black uppercase tracking-widest text-zinc-400">{day}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 mt-4">
            {Array.from({ length: startDay }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square p-2 border border-transparent" />
            ))}
            {Array.from({ length: totalDays }).map((_, i) => {
              const day = i + 1;
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              
              // Ajuste robusto de data para comparação
              const dayEvents = filteredEvents.filter(e => {
                // Compara apenas a string da data "YYYY-MM-DD"
                return e.date === dateStr; 
              });
              
              const isToday = todayStr === dateStr;

              return (
                <div 
                  key={day} 
                  className={`aspect-square p-2 border border-zinc-50 dark:border-zinc-800/50 group relative hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-all cursor-default ${isToday ? 'bg-purple-600/5 dark:bg-purple-600/5 ring-1 ring-inset ring-purple-600/20' : ''}`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className={`text-xs font-black ${isToday ? 'text-purple-600 dark:text-purple-400' : 'text-zinc-400'}`}>{day}</span>
                    <button 
                      onClick={() => { setNewEvent({...newEvent, date: dateStr}); setIsAddModalOpen(true); }}
                      className="opacity-0 group-hover:opacity-100 p-1 text-zinc-400 hover:text-purple-600 transition-all"
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                  <div className="space-y-1 overflow-y-auto max-h-[80%] scrollbar-hide">
                    {dayEvents.map(e => (
                      <div 
                        key={e.id} 
                        onClick={(ev) => { ev.stopPropagation(); handleDelete(e.id, e.isManual); }}
                        className={`px-1.5 py-0.5 rounded-md text-[8px] font-black uppercase tracking-tighter truncate border flex items-center gap-1 shadow-sm cursor-pointer hover:opacity-80 transition-opacity ${getEventColor(e.type)}`}
                        title={e.title + (e.isManual ? ' (Clique para excluir)' : '')}
                      >
                        {getEventIcon(e.type)}
                        {e.title}
                      </div>
                    ))}
                  </div>
                  {isToday && (
                    <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-purple-600 rounded-full shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 30% Right: Agenda List */}
      <div className="lg:w-[30%] space-y-6">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] p-8 shadow-xl min-h-[500px]">
          <h3 className="text-sm font-black uppercase tracking-widest text-zinc-400 mb-8 flex items-center gap-2">
            <Clock size={16} /> Próximos 7 Dias
          </h3>
          
          <div className="space-y-6">
            {upcomingEvents.length === 0 ? (
              <div className="py-20 text-center space-y-4">
                <div className="w-12 h-12 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto text-zinc-300">
                  <CalendarIcon size={20} />
                </div>
                <p className="text-xs text-zinc-500 font-medium">Nenhum evento agendado.</p>
              </div>
            ) : upcomingEvents.map(e => (
              <div key={e.id} className="group relative pl-4 border-l-2 border-zinc-100 dark:border-zinc-800 hover:border-purple-600 transition-all">
                <div className="flex justify-between items-start mb-1">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                      {/* Formatação segura de data */}
                      {new Date(e.date + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' })}
                    </span>
                    <h4 className="text-sm font-black line-clamp-1 text-zinc-800 dark:text-zinc-200" title={e.title}>{e.title}</h4>
                  </div>
                  <div className="flex items-center gap-2">
                    {e.isManual && (
                       <button 
                         onClick={() => handleDelete(e.id, true)}
                         className="text-zinc-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"
                       >
                         <Trash2 size={14} />
                       </button>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border ${getEventColor(e.type)}`}>
                    {e.type === 'finance' ? 'Conta' : (e.type === 'social' ? 'Lazer' : 'Tarefa')}
                  </span>
                  {e.time && <span className="text-[9px] font-bold text-zinc-400">{e.time}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>

        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="w-full py-5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-[2rem] text-xs font-black uppercase tracking-widest shadow-2xl shadow-purple-500/30 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
        >
          {loading ? 'Salvando...' : <><Plus size={18} /> Novo Evento</>}
        </button>
      </div>

      {/* Add Event Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-lg rounded-[3rem] p-10 shadow-2xl animate-in zoom-in-95 duration-300 relative border border-zinc-200 dark:border-zinc-800">
             <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-black tracking-tighter uppercase text-zinc-900 dark:text-white">Adicionar na Agenda</h3>
                <button onClick={() => setIsAddModalOpen(false)} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors"><X size={24} className="text-zinc-500" /></button>
             </div>
             
             <form onSubmit={handleAddEvent} className="space-y-6">
                <div className="space-y-1.5">
                   <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest ml-1">Título do Evento</label>
                   <input required autoFocus placeholder="Ex: Jantar de aniversário" className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 text-sm font-bold text-zinc-900 dark:text-white" value={newEvent.title} onChange={e => setNewEvent({...newEvent, title: e.target.value})} />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest ml-1">Tipo</label>
                    <select className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 text-sm font-bold text-zinc-900 dark:text-white" value={newEvent.type} onChange={e => setNewEvent({...newEvent, type: e.target.value})}>
                      <option value="task">Tarefa</option>
                      <option value="social">Social / Lazer</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest ml-1">Responsável</label>
                    <select className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 text-sm font-bold text-zinc-900 dark:text-white" value={newEvent.owner} onChange={e => setNewEvent({...newEvent, owner: e.target.value})}>
                      <option value="Conjunta">Conjunta 👥</option>
                      <option value={userProfile.name}>{userProfile.name} 👤</option>
                      {familyMember && <option value={familyMember.name}>{familyMember.name} 👤</option>}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest ml-1">Data</label>
                    <input type="date" className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 text-sm font-bold text-zinc-900 dark:text-white" value={newEvent.date} onChange={e => setNewEvent({...newEvent, date: e.target.value})} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest ml-1">Horário</label>
                    <input type="time" className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 text-sm font-bold text-zinc-900 dark:text-white" value={newEvent.time} onChange={e => setNewEvent({...newEvent, time: e.target.value})} />
                  </div>
                </div>

                <button type="submit" disabled={loading} className="w-full py-5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-[2rem] text-sm font-black uppercase tracking-widest shadow-2xl active:scale-95 transition-all disabled:opacity-50">
                  {loading ? 'Salvando...' : 'Fixar na Agenda'}
                </button>
             </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Agenda;