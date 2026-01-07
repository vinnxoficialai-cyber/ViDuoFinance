import React, { useState, useEffect } from 'react';
import { Sparkles, Plus, Trash2, Heart, Flame, Gem, X } from 'lucide-react';
import { useFinance } from '../App';
import { supabase } from '../supabaseClient';

// Interface para as partículas da animação
interface Particle {
  id: number;
  x: number;
  emoji: string;
  duration: number;
}

const Anotacoes: React.FC = () => {
  const { notes, addNote, deleteNote, userProfile, familyMember, setNotes } = useFinance();
  const [isAdding, setIsAdding] = useState(false);
  const [particles, setParticles] = useState<Particle[]>([]);
  
  const [newNote, setNewNote] = useState({ 
    title: '', 
    content: '', 
    createdBy: userProfile.name,
    color: 'bg-purple-100',
    emoji: '💡'
  });

  const noteColors = [
    { name: 'Lavanda', class: 'bg-purple-100' },
    { name: 'Menta', class: 'bg-emerald-100' },
    { name: 'Céu', class: 'bg-blue-100' },
    { name: 'Pêssego', class: 'bg-orange-100' },
    { name: 'Rosa', class: 'bg-rose-100' },
  ];

  const availableAuthors = [userProfile.name, familyMember?.name].filter(Boolean) as string[];

  // --- FUNÇÃO DE CHUVA DE EMOJIS (10 Segundos) ---
  const triggerConfetti = (emoji: string) => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < 50; i++) {
      newParticles.push({
        id: Math.random(),
        x: Math.random() * 100, // Posição horizontal aleatória (0-100%)
        emoji: emoji,
        duration: 2 + Math.random() * 8 // Duração entre 2s e 10s
      });
    }
    setParticles(prev => [...prev, ...newParticles]);

    // Limpa as partículas depois que a animação acaba
    setTimeout(() => {
        setParticles(prev => prev.filter(p => !newParticles.includes(p)));
    }, 10000);
  };

  const handleAddNote = () => {
    if (!newNote.title.trim()) return;
    
    addNote({
      title: newNote.title,
      content: newNote.content,
      date: new Date().toISOString().split('T')[0],
      createdBy: newNote.createdBy,
      color: newNote.color,
      emoji: newNote.emoji,
      reactions: 0
    });

    setNewNote({ title: '', content: '', createdBy: userProfile.name, color: 'bg-purple-100', emoji: '💡' });
    setIsAdding(false);
  };

  const handleDelete = (id: string) => {
    if(window.confirm("Deseja remover este post-it?")) {
      deleteNote(id);
    }
  };

  // --- FUNÇÃO DE REAÇÃO (Salva no Banco e Anima) ---
  const handleReact = async (noteId: string, type: 'heart' | 'fire' | 'gem') => {
    // 1. Dispara animação visual
    const emojiMap = { heart: '❤️', fire: '🔥', gem: '💎' };
    triggerConfetti(emojiMap[type]);

    // 2. Atualiza visualmente (Optimistic UI)
    setNotes(prev => prev.map(n => n.id === noteId ? { ...n, reactions: (n.reactions || 0) + 1 } : n));

    // 3. Salva no Banco de Dados
    const note = notes.find(n => n.id === noteId);
    if (note) {
        await supabase
            .from('notes')
            .update({ reactions: (note.reactions || 0) + 1 })
            .eq('id', noteId);
    }
  };

  const rotationClasses = ['rotate-1', '-rotate-1', 'rotate-2', '-rotate-2', 'rotate-0'];

  const getAvatarByName = (name: string) => {
    if (name === userProfile.name) return userProfile.avatar;
    if (familyMember && name === familyMember.name) return familyMember.avatar;
    return `https://ui-avatars.com/api/?name=${name}&background=random`;
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24 relative overflow-hidden min-h-screen">
      
      {/* Camada de Animação (Chuva) */}
      <div className="fixed inset-0 pointer-events-none z-[200] overflow-hidden">
        {particles.map((p) => (
            <div 
                key={p.id}
                className="absolute text-4xl animate-fall"
                style={{
                    left: `${p.x}%`,
                    top: '-50px',
                    animationDuration: `${p.duration}s`
                }}
            >
                {p.emoji}
            </div>
        ))}
      </div>

      {/* Estilo da Animação CSS */}
      <style>{`
        @keyframes fall {
            0% { transform: translateY(-50px) rotate(0deg); opacity: 1; }
            100% { transform: translateY(110vh) rotate(360deg); opacity: 0; }
        }
        .animate-fall {
            animation-name: fall;
            animation-timing-function: linear;
            animation-fill-mode: forwards;
        }
      `}</style>

      {/* Mural Header */}
      <div className="flex flex-col items-center justify-center text-center space-y-4">
        <div className="flex -space-x-4">
          <img 
            src={userProfile.avatar} 
            className="w-16 h-16 rounded-full border-4 border-white dark:border-zinc-900 shadow-xl object-cover" 
            alt={userProfile.name} 
          />
          {familyMember && (
            <img 
              src={familyMember.avatar} 
              className="w-16 h-16 rounded-full border-4 border-white dark:border-zinc-900 shadow-xl object-cover" 
              alt={familyMember.name} 
            />
          )}
        </div>
        <div>
          <h2 className="text-3xl font-black tracking-tight text-zinc-800 dark:text-white">Nosso Mural de Ideias ❤️</h2>
          <p className="text-zinc-500 font-medium italic mt-1">Onde cada post-it guarda um pedacinho dos nossos sonhos.</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4">
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-8 space-y-8">
          {notes.map((note, index) => {
            const rotation = rotationClasses[index % rotationClasses.length];
            const creatorName = note.createdBy || (note as any).created_by || 'Anônimo';
            const authorAvatar = getAvatarByName(creatorName);
            const displayDate = new Date(note.date).toLocaleDateString('pt-BR');

            return (
              <div 
                key={note.id} 
                className={`break-inside-avoid group relative ${note.color} dark:bg-opacity-20 dark:border-zinc-800/50 p-8 rounded-3xl shadow-lg transition-all duration-500 hover:shadow-2xl hover:scale-[1.02] border border-zinc-200/50 ${rotation} hover:rotate-0`}
              >
                {/* Creator Info */}
                <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-3">
                      <div className={`relative p-0.5 rounded-full ${creatorName === userProfile.name ? 'bg-blue-400' : 'bg-rose-400'} shadow-[0_0_10px_rgba(0,0,0,0.1)]`}>
                        <img 
                          src={authorAvatar} 
                          className="w-10 h-10 rounded-full object-cover" 
                          alt={creatorName} 
                        />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400">{creatorName}</span>
                        <span className="text-[8px] font-bold text-zinc-400 dark:text-zinc-500">{displayDate}</span>
                      </div>
                    </div>
                    <div className="text-2xl">{note.emoji}</div>
                </div>

                <h3 className="font-black text-xl mb-3 text-zinc-800 dark:text-zinc-100 leading-tight">
                  {note.title}
                </h3>
                
                <p className="text-sm text-zinc-600 dark:text-zinc-300 whitespace-pre-wrap leading-relaxed mb-8">
                  {note.content}
                </p>
                
                {/* --- BARRA DE REAÇÕES --- */}
                <div className="flex items-center justify-between pt-4 border-t border-black/5 dark:border-white/5">
                  <div className="flex gap-2">
                    {/* Botão Coração */}
                    <button 
                        onClick={() => handleReact(note.id, 'heart')}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white/50 dark:bg-zinc-800/50 hover:bg-white dark:hover:bg-zinc-700 rounded-full transition-all active:scale-90 shadow-sm group/btn"
                    >
                      <Heart size={14} className="text-rose-500 group-hover/btn:fill-rose-500 transition-colors" />
                      <span className="text-xs font-black">{note.reactions || 0}</span>
                    </button>

                    {/* Botão Fogo */}
                    <button 
                        onClick={() => handleReact(note.id, 'fire')}
                        className="flex items-center justify-center w-8 h-8 bg-white/50 dark:bg-zinc-800/50 hover:bg-orange-100 dark:hover:bg-orange-900/30 rounded-full transition-all active:scale-90 shadow-sm text-orange-500"
                    >
                      <Flame size={14} />
                    </button>

                    {/* Botão Joia */}
                    <button 
                        onClick={() => handleReact(note.id, 'gem')}
                        className="flex items-center justify-center w-8 h-8 bg-white/50 dark:bg-zinc-800/50 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-full transition-all active:scale-90 shadow-sm text-blue-500"
                    >
                      <Gem size={14} />
                    </button>
                  </div>
                  
                  <button 
                    onClick={() => handleDelete(note.id)}
                    className="p-2 text-zinc-400 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-16 h-8 bg-white/30 dark:bg-black/20 backdrop-blur-md rotate-2 border-x border-white/20"></div>
              </div>
            );
          })}
        </div>
      </div>

      <button 
        onClick={() => setIsAdding(true)}
        className="fixed bottom-28 md:bottom-8 right-8 w-16 h-16 bg-gradient-to-tr from-purple-600 via-indigo-600 to-rose-500 rounded-full flex items-center justify-center text-white shadow-2xl shadow-purple-500/40 hover:scale-110 active:scale-95 transition-all z-50 group glow-button"
      >
        <Plus size={32} className="group-hover:rotate-90 transition-transform duration-500" />
      </button>

      {isAdding && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-lg rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95 duration-300 relative overflow-hidden">
             <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-purple-500 rounded-xl text-white"><Sparkles size={20} /></div>
                  <h3 className="text-xl font-black uppercase tracking-tighter">Nova Ideia Brilhante</h3>
                </div>
                <button onClick={() => setIsAdding(false)} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full"><X size={24} /></button>
             </div>

             <div className="space-y-6">
                <div className="flex gap-4">
                   <div className="w-16 space-y-1 text-center">
                      <label className="text-[8px] font-black uppercase tracking-widest text-zinc-400">Emoji</label>
                      <input 
                        className="w-full text-center bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 text-2xl focus:outline-none"
                        value={newNote.emoji}
                        onChange={e => setNewNote({...newNote, emoji: e.target.value})}
                      />
                   </div>
                   <div className="flex-1 space-y-1">
                      <label className="text-[8px] font-black uppercase tracking-widest text-zinc-400 ml-1">Título</label>
                      <input 
                        placeholder="Qual é a ideia?" 
                        className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 text-sm font-bold focus:outline-none"
                        value={newNote.title}
                        onChange={e => setNewNote({...newNote, title: e.target.value})}
                      />
                   </div>
                </div>

                <div className="space-y-1">
                   <label className="text-[8px] font-black uppercase tracking-widest text-zinc-400 ml-1">Detalhes do post-it</label>
                   <textarea 
                     placeholder="Escreva livremente..." 
                     className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 text-sm focus:outline-none min-h-[120px]"
                     value={newNote.content}
                     onChange={e => setNewNote({...newNote, content: e.target.value})}
                   />
                </div>

                <div className="flex flex-wrap gap-3">
                   {noteColors.map(c => (
                     <button 
                       key={c.class}
                       onClick={() => setNewNote({...newNote, color: c.class})}
                       className={`w-8 h-8 rounded-full border-2 transition-all ${c.class} ${newNote.color === c.class ? 'border-purple-600 scale-125' : 'border-transparent hover:scale-110'}`}
                     />
                   ))}
                </div>

                <div className="flex items-center justify-between pt-6 border-t border-zinc-100 dark:border-zinc-800">
                   <div className="flex items-center gap-3">
                      <span className="text-[10px] font-black uppercase text-zinc-400">Escrito por</span>
                      <div className="flex bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl">
                         {availableAuthors.map(p => (
                           <button 
                             key={p}
                             onClick={() => setNewNote({...newNote, createdBy: p})}
                             className={`px-4 py-2 rounded-lg text-xs font-black transition-all ${newNote.createdBy === p ? 'bg-white dark:bg-zinc-950 shadow-sm text-purple-600' : 'text-zinc-400'}`}
                           >
                             {p}
                           </button>
                         ))}
                      </div>
                   </div>
                   <button 
                     onClick={handleAddNote}
                     className="px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-purple-500/20 active:scale-95 transition-all"
                   >
                     Fixar no Mural
                   </button>
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Anotacoes;