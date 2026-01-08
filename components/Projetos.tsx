import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Plus, 
  ExternalLink, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  Calendar,
  DollarSign,
  X,
  Camera,
  Sparkles,
  TrendingUp,
  Image as ImageIcon,
  History,
  Loader2
} from 'lucide-react';
import { Project } from '../types';
import { useFinance } from '../App';
import { supabase } from '../lib/supabase'; // Certifique-se que o caminho está certo

const Projetos: React.FC = () => {
  const { accounts, addTransaction, projects, setProjects } = useFinance();
  const [isAdding, setIsAdding] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [viewingProject, setViewingProject] = useState<Project | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Estado para o arquivo de imagem real (para upload)
  const [imageFile, setImageFile] = useState<File | null>(null);

  const [newProj, setNewProj] = useState({ 
    title: '', 
    description: '', 
    status: 'active' as const,
    targetValue: '',
    currentValue: '',
    monthlySavings: '',
    deadline: '',
    imageUrl: ''
  });

  const [contribution, setContribution] = useState({
    amount: '',
    accountId: accounts[0]?.id || ''
  });

  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // --- 1. CARREGAR PROJETOS DO BANCO ---
  useEffect(() => {
    fetchProjects();
  }, []);

 // --- VERSÃO CORRIGIDA DO FETCH ---
  const fetchProjects = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      console.log("PROJETOS VINDOS DO BANCO:", data); // <--- ISSO VAI AJUDAR A VER O ERRO (Aperte F12)

      if (data) {
        const formattedProjects: Project[] = data.map(item => ({
          id: item.id,
          title: item.title,
          description: item.description,
          status: item.status,
          targetValue: Number(item.budget || 0),
          currentValue: Number(item.spent || 0),
          monthlySavings: 0,
          deadline: item.deadline,
          // Tenta ler de image_url (padrão) ou imageUrl (caso tenha criado diferente)
          imageUrl: item.image_url || item.imageUrl || null, 
          contributions: [] 
        }));
        setProjects(formattedProjects);
      }
    } catch (error) {
      console.error("Erro ao buscar projetos:", error);
    }
  };

  // --- 2. UPLOAD E SALVAR NO BANCO ---
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file); // Guarda o arquivo para upload
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string); // Mostra preview local
      };
      reader.readAsDataURL(file);
    }
  };

  const addProject = async () => {
    if (!newProj.title.trim()) return;
    setIsLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não logado");

      let finalImageUrl = null;

      // 1. Faz Upload da Imagem se existir
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${user.id}/${Math.random()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('images')
          .upload(fileName, imageFile);

        if (uploadError) throw uploadError;

        // Pega a URL pública
        const { data: publicUrlData } = supabase.storage
          .from('images')
          .getPublicUrl(fileName);
          
        finalImageUrl = publicUrlData.publicUrl;
      }

      // 2. Salva no Banco de Dados
      const projectData = {
        user_id: user.id,
        title: newProj.title,
        description: newProj.description,
        status: newProj.status,
        budget: Number(newProj.targetValue) || 0,
        spent: Number(newProj.currentValue) || 0,
        deadline: newProj.deadline || null,
        image_url: finalImageUrl || newProj.imageUrl
      };

      const { data, error } = await supabase
        .from('projects')
        .insert([projectData])
        .select()
        .single();

      if (error) throw error;

      // 3. Atualiza UI
      await fetchProjects();
      resetForm();

    } catch (error: any) {
      alert("Erro ao salvar: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setNewProj({ 
      title: '', 
      description: '', 
      status: 'active', 
      targetValue: '', 
      currentValue: '', 
      monthlySavings: '',
      deadline: '', 
      imageUrl: '' 
    });
    setImagePreview(null);
    setImageFile(null);
    setIsAdding(false);
  };

  // --- 3. CONTRIBUIÇÃO (SALVAR TRANSAÇÃO + ATUALIZAR PROJETO) ---
  const handleAddContribution = async () => {
    if (!viewingProject || !contribution.amount) return;
    
    const account = accounts.find(a => a.id === contribution.accountId);
    if (!account) return;
    const amountNum = Number(contribution.amount);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Cria a transação de despesa/investimento
      await addTransaction({
        description: `Investimento: ${viewingProject.title}`,
        amount: amountNum,
        type: 'expense',
        category: 'Investimentos',
        date: new Date().toISOString().split('T')[0],
        account: account.name,
        status: 'paid'
      });

      // 2. Atualiza o valor gasto no projeto
      const newSpent = (viewingProject.currentValue || 0) + amountNum;
      
      const { error } = await supabase
        .from('projects')
        .update({ spent: newSpent })
        .eq('id', viewingProject.id);

      if (error) throw error;

      // 3. Atualiza tela
      await fetchProjects();
      
      // Atualiza o modal aberto
      setViewingProject(prev => prev ? ({...prev, currentValue: newSpent}) : null);
      setContribution({ ...contribution, amount: '' });
      alert("Aporte realizado com sucesso!");

    } catch (error: any) {
      alert("Erro ao realizar aporte: " + error.message);
    }
  };

  const deleteProject = async (id: string) => {
    if (!confirm("Tem certeza que deseja apagar este sonho?")) return;
    
    try {
      const { error } = await supabase.from('projects').delete().eq('id', id);
      if (error) throw error;
      setProjects(projects.filter(p => p.id !== id));
    } catch (error: any) {
      alert("Erro ao deletar: " + error.message);
    }
  };

  const calculateDaysRemaining = (date?: string) => {
    if (!date) return 0;
    const diff = new Date(date).getTime() - new Date().getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const achievementDate = useMemo(() => {
    const target = Number(newProj.targetValue);
    const current = Number(newProj.currentValue);
    const savings = Number(newProj.monthlySavings);
    
    if (target > 0 && savings > 0 && target > current) {
      const remaining = target - current;
      const months = Math.ceil(remaining / savings);
      const date = new Date();
      date.setMonth(date.getMonth() + months);
      return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    }
    return null;
  }, [newProj.targetValue, newProj.currentValue, newProj.monthlySavings]);

  const vinnxMotivation = useMemo(() => {
    if (!newProj.title) return "Qual é o próximo grande passo do casal? Quero muito saber!";
    if (!newProj.targetValue) return `O projeto "${newProj.title}" parece incrível! Quanto precisamos poupar para ele?`;
    if (Number(newProj.targetValue) > 50000) return "Uau, um sonho gigante! Com planejamento e união, vocês chegam lá rapidinho.";
    if (achievementDate) return "Cada depósito mensal é um degrau a mais. Estou torcendo muito por vocês!";
    return "Um passo de cada vez. O importante é começar agora!";
  }, [newProj.title, newProj.targetValue, achievementDate]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-black tracking-tight">Projetos Financeiros</h2>
          <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mt-1">Nossos sonhos em construção</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest hover:opacity-90 transition-all shadow-xl active:scale-95"
        >
          <Plus size={18} /> Novo Projeto
        </button>
      </div>

      {isAdding && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-5xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col md:flex-row max-h-[90vh]">
            
            {/* --- FIX MOBILE: h-64 no mobile, h-auto no desktop, shrink-0 para não esmagar --- */}
            <div className="w-full h-64 md:h-auto md:w-1/3 bg-zinc-100 dark:bg-zinc-800/50 relative group shrink-0">
              {imagePreview ? (
                <>
                  <img src={imagePreview} className="w-full h-full object-cover" alt="Preview" />
                  <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex flex-col items-center justify-center p-6 text-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => fileInputRef.current?.click()} className="p-4 bg-white/20 hover:bg-white/30 rounded-full transition-all mb-4">
                      <Camera size={32} />
                    </button>
                    <p className="text-sm font-black uppercase tracking-widest">Trocar Foto</p>
                  </div>
                </>
              ) : (
                <div onClick={() => fileInputRef.current?.click()} className="w-full h-full flex flex-col items-center justify-center p-12 border-4 border-dashed border-zinc-200 dark:border-zinc-700 m-0 cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all">
                  <div className="w-20 h-20 bg-zinc-200 dark:bg-zinc-700 rounded-3xl flex items-center justify-center mb-6 text-zinc-400"><ImageIcon size={40} /></div>
                  <h4 className="font-black text-xs uppercase tracking-widest text-zinc-400">Escolher Foto .jpg</h4>
                  <p className="text-[10px] text-zinc-400 mt-2 text-center uppercase tracking-tighter">Clique para subir a imagem do seu sonho</p>
                </div>
              )}
              <input type="file" ref={fileInputRef} onChange={handleImageChange} className="hidden" accept="image/*" />
            </div>

            <div className="flex-1 p-8 md:p-12 flex flex-col overflow-y-auto">
              <div className="flex justify-between items-start mb-8">
                <h3 className="text-2xl font-black tracking-tighter uppercase">Configurar Novo Projeto</h3>
                <button onClick={resetForm} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors"><X size={24} /></button>
              </div>
              <div className="space-y-6 flex-1">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest ml-1">O que vamos realizar?</label>
                      <input required placeholder="Título do projeto" className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-purple-600/20" value={newProj.title} onChange={e => setNewProj({...newProj, title: e.target.value})} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest ml-1">Descrição rápida</label>
                      <textarea placeholder="Objetivos do sonho..." className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 text-sm focus:outline-none min-h-[80px] focus:ring-2 focus:ring-purple-600/20" value={newProj.description} onChange={e => setNewProj({...newProj, description: e.target.value})} />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest ml-1 flex items-center gap-1.5"><DollarSign size={10} /> Meta Total</label>
                      <input type="number" placeholder="R$ 0,00" className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 text-sm font-black text-purple-600" value={newProj.targetValue} onChange={e => setNewProj({...newProj, targetValue: e.target.value})} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest ml-1 flex items-center gap-1.5"><TrendingUp size={10} /> Depósito Mensal</label>
                      <input type="number" placeholder="Economia p/ mês" className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 text-sm font-bold" value={newProj.monthlySavings} onChange={e => setNewProj({...newProj, monthlySavings: e.target.value})} />
                    </div>
                  </div>
                </div>
                {achievementDate && (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 p-5 rounded-3xl flex items-center gap-4 animate-in slide-in-from-top-2">
                    <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-lg"><Sparkles size={24} /></div>
                    <div>
                      <p className="text-emerald-600 dark:text-emerald-400 text-sm font-bold">Com esse ritmo, o sonho vira realidade em <span className="underline decoration-2">{achievementDate}</span></p>
                    </div>
                  </div>
                )}
              </div>
              <div className="mt-8 pt-6 border-t border-zinc-100 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-full flex items-center justify-center text-white shadow-xl"><Sparkles size={16} /></div>
                  <p className="text-xs font-medium italic text-zinc-500">"{vinnxMotivation}"</p>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <button onClick={resetForm} className="flex-1 sm:flex-none px-6 py-4 text-xs font-black uppercase tracking-widest text-zinc-400">Cancelar</button>
                  <button 
                    onClick={addProject} 
                    disabled={isLoading}
                    className="flex-1 sm:flex-none px-10 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-2xl text-xs font-black uppercase shadow-2xl disabled:opacity-50 flex items-center gap-2 justify-center"
                  >
                    {isLoading ? <Loader2 className="animate-spin" size={16}/> : 'Criar Meu Sonho'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Project Details Modal */}
      {viewingProject && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-4xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
            <div className="h-48 relative shrink-0">
               {viewingProject.imageUrl && <img src={viewingProject.imageUrl} className="w-full h-full object-cover" alt="" />}
               <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent"></div>
               <button onClick={() => setViewingProject(null)} className="absolute top-6 right-6 p-2 bg-white/20 hover:bg-white/40 backdrop-blur-md rounded-full text-white"><X size={24} /></button>
               <div className="absolute bottom-6 left-8">
                  <h3 className="text-3xl font-black text-white uppercase tracking-tighter">{viewingProject.title}</h3>
                  <p className="text-white/70 text-sm font-medium mt-1">Status: {viewingProject.status === 'active' ? 'Em andamento' : 'Pausado'}</p>
               </div>
            </div>

            <div className="flex-1 p-8 md:p-10 overflow-y-auto grid grid-cols-1 lg:grid-cols-5 gap-10">
              <div className="lg:col-span-3 space-y-8">
                <div>
                  <h4 className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-4 flex items-center gap-2">
                    <History size={14} /> Histórico de Evolução
                  </h4>
                  <div className="space-y-4">
                    {/* Nota: Historico detalhado exige tabela de transacoes linkadas, aqui mostramos resumo */}
                    <p className="text-sm text-zinc-500 italic">O histórico detalhado aparecerá nas transações.</p>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-2 space-y-8">
                <div className="bg-zinc-900 text-white p-6 rounded-[2rem] shadow-xl border border-white/5">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-white/50 mb-4">Aporte Rápido</h4>
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[8px] font-black uppercase tracking-widest ml-1 text-white/40">Quanto vamos investir?</label>
                      <input 
                        type="number" 
                        placeholder="R$ 0,00" 
                        className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                        value={contribution.amount}
                        onChange={e => setContribution({...contribution, amount: e.target.value})}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8px] font-black uppercase tracking-widest ml-1 text-white/40">Qual conta usar?</label>
                      <select 
                        className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                        value={contribution.accountId}
                        onChange={e => setContribution({...contribution, accountId: e.target.value})}
                      >
                        {accounts.map(acc => <option key={acc.id} value={acc.id} className="bg-zinc-900">{acc.name} (R$ {acc.balance.toLocaleString()})</option>)}
                      </select>
                    </div>
                    <button 
                      onClick={handleAddContribution}
                      className="w-full py-4 bg-white text-zinc-950 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all mt-2"
                    >
                      Confirmar Aporte
                    </button>
                  </div>
                </div>

                <div className="p-6 bg-purple-600/5 dark:bg-purple-600/10 border border-purple-500/20 rounded-[2rem]">
                   <div className="flex justify-between items-end mb-2">
                      <span className="text-[10px] font-black uppercase tracking-widest text-purple-600">Progresso</span>
                      <span className="text-xl font-black text-purple-600">{Math.min(((viewingProject.currentValue || 0) / (viewingProject.targetValue || 1)) * 100, 100).toFixed(0)}%</span>
                   </div>
                   <div className="h-3 w-full bg-purple-600/20 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-purple-600 transition-all duration-1000" 
                        style={{ width: `${Math.min(((viewingProject.currentValue || 0) / (viewingProject.targetValue || 1)) * 100, 100)}%` }}
                      ></div>
                   </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Project Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {projects.map((project) => {
          const progress = project.targetValue ? Math.min(((project.currentValue || 0) / project.targetValue) * 100, 100) : 0;
          const daysLeft = calculateDaysRemaining(project.deadline);
          
          return (
            <div key={project.id} className="group relative bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] overflow-hidden hover:border-purple-600/40 transition-all duration-500 shadow-xl hover:shadow-2xl hover:-translate-y-1">
              <div className="h-48 relative overflow-hidden">
                {project.imageUrl ? (
                  <>
                    <img src={project.imageUrl} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" alt={project.title} />
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/40 to-transparent"></div>
                  </>
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-purple-600 to-indigo-700"></div>
                )}
                
                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                  <button onClick={(e) => { e.stopPropagation(); deleteProject(project.id); }} className="p-2.5 bg-white/20 backdrop-blur-md rounded-xl text-white hover:bg-rose-500"><Trash2 size={14} /></button>
                </div>

                <div className="absolute top-4 left-4">
                  <span className={`text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest flex items-center gap-1.5 backdrop-blur-md ${
                    project.status === 'active' ? 'bg-emerald-500/80 text-white' : 'bg-amber-500/80 text-white'
                  }`}>
                    {project.status === 'active' ? <CheckCircle2 size={10} /> : <Clock size={10} />}
                    {project.status === 'active' ? 'Ativo' : 'Pausado'}
                  </span>
                </div>

                <div className="absolute bottom-4 left-6 right-6">
                  <h3 className="font-black text-xl text-white mb-1 line-clamp-1">{project.title}</h3>
                  <div className="flex items-center gap-3 text-white/70 text-[10px] font-bold uppercase tracking-widest">
                    <span className="flex items-center gap-1"><Calendar size={12} /> {daysLeft > 0 ? `Faltam ${daysLeft} dias` : 'Finalizado'}</span>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-6">
                <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 min-h-[32px] leading-relaxed">
                  {project.description}
                </p>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-zinc-50 dark:bg-zinc-950 p-3 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-inner">
                    <span className="block text-[8px] font-black text-zinc-400 uppercase tracking-widest mb-1">Acumulado</span>
                    <span className="text-sm font-black text-emerald-500">R$ {(project.currentValue || 0).toLocaleString()}</span>
                  </div>
                  <div className="bg-zinc-50 dark:bg-zinc-950 p-3 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-inner">
                    <span className="block text-[8px] font-black text-zinc-400 uppercase tracking-widest mb-1">Meta Total</span>
                    <span className="text-sm font-black text-zinc-600 dark:text-zinc-300">R$ {(project.targetValue || 0).toLocaleString()}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center px-1">
                    <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Progresso do Sonho</span>
                    <span className="text-xs font-black text-purple-600">{progress.toFixed(0)}%</span>
                  </div>
                  <div className="h-3 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden p-0.5">
                    <div 
                      className={`h-full rounded-full transition-all duration-1000 ease-out relative ${
                        progress === 100 ? 'bg-gradient-to-r from-emerald-500 to-teal-400' : 'bg-gradient-to-r from-purple-600 to-indigo-500'
                      }`}
                      style={{ width: `${progress}%` }}
                    >
                      <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => setViewingProject(project)}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-zinc-100 dark:bg-zinc-800 rounded-2xl text-[10px] font-black uppercase tracking-widest text-zinc-600 dark:text-zinc-300 hover:bg-purple-600 hover:text-white transition-all group-hover:shadow-lg"
                >
                  Ver Detalhes do Projeto <ExternalLink size={14} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Projetos;