import React, { useState, useRef } from 'react';
import { 
  Plus, 
  X, 
  Sparkles,
  Camera,
  Edit2,
  Save,
  Trash2,
} from 'lucide-react';
import { WishlistItem } from '../types';
import { useWishlist } from '../hooks/useWishlist'; // <--- IMPORTANTE: Importando o Hook do Supabase

const Wishlist: React.FC = () => {
  // Substituindo o contexto local pelo Hook do Supabase
  const { items: wishlist, loading, addItem, deleteItem, refresh } = useWishlist();
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<WishlistItem | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Estado para guardar o ARQUIVO real para upload no Supabase
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    savedAmount: '',
    imageUrl: '',
    priority: 3,
    category: 'Lazer',
    viability: 'red' as 'green' | 'yellow' | 'red',
    targetMonth: ''
  });

  const resetForm = () => {
    setFormData({
      name: '',
      price: '',
      savedAmount: '0',
      imageUrl: '',
      priority: 3,
      category: 'Lazer',
      viability: 'red',
      targetMonth: ''
    });
    setSelectedFile(null); // Limpa o arquivo
  };

  const openAddModal = () => {
    resetForm();
    setIsAddModalOpen(true);
  };

  const openEditModal = (item: WishlistItem) => {
    setSelectedItem(item);
    setFormData({
      name: item.name,
      price: item.price.toString(),
      savedAmount: item.savedAmount.toString(),
      imageUrl: item.imageUrl || '',
      priority: item.priority,
      category: item.category,
      viability: item.viability as 'green' | 'yellow' | 'red',
      targetMonth: item.targetMonth || ''
    });
    setIsEditModalOpen(true);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file); // Guarda o arquivo para o Supabase
      
      // Preview local para o usuário ver na hora
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, imageUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Função para ADICIONAR (Conectada ao Supabase)
  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.price) return;

    // Chama o hook passando os dados e o arquivo (se houver)
    const success = await addItem({
      name: formData.name,
      price: Number(formData.price),
      savedAmount: Number(formData.savedAmount) || 0,
      imageUrl: '', // O hook vai preencher isso após o upload
      priority: formData.priority,
      category: formData.category,
      viability: formData.viability,
      targetMonth: formData.targetMonth
    }, selectedFile || undefined);

    if (success) {
      setIsAddModalOpen(false);
      resetForm();
    }
  };

  // Função para ATUALIZAR (Simplificada para editar dados, imagem requer lógica extra se quiser editar foto)
  const handleUpdateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;
    
    // NOTA: Para edição completa com imagem no Supabase, precisaríamos adicionar um updateItem no hook.
    // Por enquanto, vou manter a lógica visual ou você pode me pedir para criar o update no hook.
    // Esta parte abaixo ainda é apenas visual se não tivermos a função update no backend:
    alert("Para editar itens no banco, precisamos adicionar a função 'updateItem' no hook useWishlist. Quer que eu faça isso?");
    setIsEditModalOpen(false);
  };

  const handleDeleteItem = async () => {
    if (!selectedItem) return;
    
    await deleteItem(selectedItem.id); // Deleta do Supabase
    
    setIsEditModalOpen(false);
    setSelectedItem(null);
  };

  const getCardColors = (viability: string) => {
    if (viability === 'green') return { dot: 'bg-emerald-500', line: 'bg-emerald-500 shadow-[0_0_15px_#10b981]' };
    if (viability === 'yellow') return { dot: 'bg-amber-500', line: 'bg-purple-600 shadow-[0_0_15px_#a855f7]' };
    return { dot: 'bg-rose-500', line: 'bg-rose-600 shadow-[0_0_15px_#e11d48]' };
  };

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-32">
      <div className="flex flex-col md:flex-row justify-between items-end gap-6 px-4 md:px-0">
        <div>
          <h2 className="text-3xl font-black tracking-tighter uppercase font-display text-zinc-900 dark:text-white">Vitrine de Desejos</h2>
          <p className="text-zinc-500 text-sm font-medium mt-1">Transformando intenção em posse, com inteligência.</p>
        </div>
        <button 
          onClick={refresh}
          className="bg-zinc-900 dark:bg-zinc-800 px-5 py-3 rounded-full border border-zinc-800 dark:border-zinc-700 flex items-center gap-3 hover:bg-zinc-800 dark:hover:bg-zinc-700 transition-colors shadow-lg"
        >
          <Sparkles size={16} className="text-purple-500" />
          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-200">
            {loading ? 'Sincronizando...' : 'Curadoria VinnxAI'}
          </span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 px-4 md:px-0">
        {/* ADD CARD */}
        <button 
          onClick={openAddModal}
          disabled={loading}
          className="aspect-[3/4] rounded-[2.5rem] flex flex-col items-center justify-center gap-6 group transition-all duration-300 border-2 border-dashed border-zinc-300 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 bg-transparent hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
        >
          <div className="w-16 h-16 rounded-full border border-zinc-300 dark:border-zinc-700 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
             <Plus size={28} className="text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-200 transition-colors" strokeWidth={1.5} />
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors">Adicionar à Lista</span>
        </button>

        {/* LOADING STATE SKELETON (Opcional) */}
        {loading && wishlist.length === 0 && (
          <div className="aspect-[3/4] bg-zinc-900/20 rounded-[2.5rem] animate-pulse"></div>
        )}

        {wishlist.map(item => {
          const { dot, line } = getCardColors(item.viability);
          
          return (
            <div 
              key={item.id} 
              onClick={() => openEditModal(item)}
              className="relative aspect-[3/4] bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-[2.5rem] overflow-hidden flex flex-col shadow-2xl group cursor-pointer hover:-translate-y-2 transition-transform duration-500"
            >
              <div className={`absolute top-8 left-8 w-3 h-3 rounded-full ${dot} z-20`}></div>

              <div className="flex-1 relative bg-zinc-100 dark:bg-zinc-900 overflow-hidden">
                 <div className="absolute inset-0 bg-gradient-to-b from-transparent to-zinc-900/90 z-10"></div>
                 {item.imageUrl ? (
                   <img src={item.imageUrl} className="w-full h-full object-cover opacity-80 group-hover:scale-110 transition-transform duration-1000" alt={item.name} />
                 ) : (
                   <div className="w-full h-full bg-zinc-900 flex items-center justify-center">
                     <Sparkles className="text-zinc-800" size={40} />
                   </div>
                 )}
                 <div className={`absolute bottom-0 left-8 right-8 h-[2px] ${line} z-20`}></div>
              </div>

              <div className="h-[45%] bg-white dark:bg-zinc-950 p-8 flex flex-col justify-between relative z-20">
                 <div>
                    <h3 className="text-lg font-black text-zinc-900 dark:text-white mb-2 leading-tight line-clamp-2">{item.name}</h3>
                    <div className="flex items-center gap-3">
                       <p className="text-sm font-black text-zinc-900 dark:text-white">
                         R$ {Number(item.price).toLocaleString()}
                       </p>
                       {item.priority >= 4 && (
                         <span className="px-2 py-0.5 bg-rose-500/10 text-rose-500 rounded text-[8px] font-black uppercase tracking-wider">Prioridade Alta</span>
                       )}
                    </div>
                 </div>

                 <div className="flex items-end justify-between border-t border-zinc-100 dark:border-zinc-900 pt-4">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
                       {item.viability === 'green' ? 'Disponível' : (item.targetMonth || 'Planejado').toUpperCase()}
                    </span>
                    <Edit2 size={16} className="text-zinc-300 group-hover:text-white transition-colors" />
                 </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL (Add/Edit) */}
      {(isAddModalOpen || isEditModalOpen) && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-[#09090b] w-full max-w-2xl rounded-[3rem] p-8 md:p-10 shadow-2xl animate-in zoom-in-95 duration-300 border border-zinc-800 overflow-y-auto max-h-[95vh] scrollbar-hide text-white">
            
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-black uppercase tracking-tighter font-display text-white">
                {isAddModalOpen ? 'Projetar Novo Sonho' : 'Gerenciar Desejo'}
              </h3>
              <button 
                onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }} 
                className="p-2 hover:bg-zinc-800 rounded-full transition-colors text-zinc-400 hover:text-white"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={isAddModalOpen ? handleAddItem : handleUpdateItem} className="space-y-8">
              {/* IMAGE UPLOAD AREA */}
              <div 
                className="relative h-56 w-full rounded-[2.5rem] border-2 border-dashed border-zinc-800 bg-zinc-900/50 flex flex-col items-center justify-center overflow-hidden cursor-pointer hover:border-zinc-700 hover:bg-zinc-900 transition-all group"
                onClick={() => fileInputRef.current?.click()}
              >
                {formData.imageUrl ? (
                  <>
                    <img src={formData.imageUrl} className="w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity" alt="Preview" />
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                       <Camera size={32} className="text-white drop-shadow-md mb-2" />
                       <span className="text-[10px] font-black uppercase tracking-widest text-white drop-shadow-md">Alterar Imagem</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-16 h-16 bg-zinc-800 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                       <Camera size={28} className="text-zinc-400" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 group-hover:text-zinc-300">Escolher Imagem</span>
                  </>
                )}
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleImageUpload} 
                  className="hidden" 
                  accept="image/jpeg,image/png,image/webp" 
                />
              </div>

              {/* INPUTS (Campos iguais ao anterior) */}
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest ml-2">Nome do Item</label>
                  <input 
                    required 
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-6 py-4 text-sm font-bold text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-white/10 transition-all" 
                    placeholder="Ex: PlayStation 5"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest ml-2">Valor Total (R$)</label>
                    <input 
                      required 
                      type="number" 
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-6 py-4 text-sm font-bold text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-white/10 transition-all" 
                      placeholder="0.00"
                      value={formData.price}
                      onChange={e => setFormData({...formData, price: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest ml-2">Previsão (Mês)</label>
                    <input 
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-6 py-4 text-sm font-bold text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-white/10 transition-all" 
                      placeholder="Ex: Julho"
                      value={formData.targetMonth}
                      onChange={e => setFormData({...formData, targetMonth: e.target.value})}
                    />
                  </div>
                </div>

                {/* Restante dos inputs igual... */}
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest ml-2">Categoria</label>
                    <select 
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-6 py-4 text-sm font-bold text-white focus:outline-none"
                      value={formData.category}
                      onChange={e => setFormData({...formData, category: e.target.value})}
                    >
                      <option>Lazer</option>
                      <option>Casa</option>
                      <option>Viagem</option>
                      <option>Tecnologia</option>
                      <option>Estilo</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest ml-2">Status de Viabilidade</label>
                    <select 
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-6 py-4 text-sm font-bold text-white focus:outline-none"
                      value={formData.viability}
                      onChange={e => setFormData({...formData, viability: e.target.value as any})}
                    >
                      <option value="green">🟢 Disponível</option>
                      <option value="yellow">🟡 Próximos meses</option>
                      <option value="red">🔴 Longo prazo</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-4 pt-2">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest ml-2">Prioridade: {formData.priority}</label>
                    <span className="text-[10px] font-bold text-purple-400">{formData.priority >= 4 ? 'Urgente' : 'Desejo'}</span>
                  </div>
                  <input 
                    type="range" 
                    min="1" 
                    max="5" 
                    className="w-full h-1.5 bg-zinc-800 rounded-full appearance-none cursor-pointer accent-purple-500"
                    value={formData.priority}
                    onChange={e => setFormData({...formData, priority: parseInt(e.target.value)})}
                  />
                </div>
              </div>

              {/* ACTION BUTTONS */}
              <div className="pt-6 mt-6 border-t border-zinc-800 flex gap-4">
                {isEditModalOpen ? (
                  <>
                    <button 
                      type="button" 
                      onClick={handleDeleteItem}
                      className="px-8 py-5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 border border-rose-500/10"
                    >
                      <Trash2 size={16} /> Excluir
                    </button>
                    <button 
                      type="submit" 
                      className="flex-1 py-5 bg-white text-black rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-[0_0_20px_rgba(255,255,255,0.1)] active:scale-95 transition-all flex items-center justify-center gap-2 hover:bg-zinc-200"
                    >
                      <Save size={16} /> Salvar Alterações
                    </button>
                  </>
                ) : (
                  <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full py-5 bg-white text-black rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-[0_0_20px_rgba(255,255,255,0.1)] active:scale-95 transition-all flex items-center justify-center gap-2 hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                       <span>Processando...</span>
                    ) : (
                       <>
                         <Plus size={16} /> Adicionar à Lista
                       </>
                    )}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Wishlist;