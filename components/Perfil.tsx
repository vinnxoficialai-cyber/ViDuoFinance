import React, { useState, useRef, useEffect } from 'react';
import { 
  User, Shield, Users, Moon, Sun, Camera, LogOut,
  Plus, Palette, Check, Eye, EyeOff, UserPlus, Key, List, X
} from 'lucide-react';
import { useFinance } from '../App';
import { supabase } from '../supabaseClient';

interface PerfilProps {
  isDarkMode: boolean;
  onToggleTheme: () => void;
}

// Helper component for managing a list of strings
const StringListEditor = ({ title, items, onUpdate }: { title: string, items: string[], onUpdate: (newItems: string[]) => void }) => {
  const [newValue, setNewValue] = useState('');
  const add = () => { if (newValue.trim()) { onUpdate([...items, newValue.trim()]); setNewValue(''); } };
  const remove = (index: number) => { const newItems = [...items]; newItems.splice(index, 1); onUpdate(newItems); };
  return (
    <div className="bg-zinc-50 dark:bg-zinc-950 p-6 rounded-3xl border border-zinc-100 dark:border-zinc-800">
      <h4 className="text-xs font-black uppercase tracking-widest text-zinc-500 mb-4">{title}</h4>
      <div className="flex gap-2 mb-4">
        <input className="flex-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2 text-sm font-bold focus:outline-none" placeholder="Adicionar novo..." value={newValue} onChange={e => setNewValue(e.target.value)} onKeyDown={e => e.key === 'Enter' && add()} />
        <button onClick={add} className="p-2 bg-purple-600 text-white rounded-xl"><Plus size={18} /></button>
      </div>
      <div className="flex flex-wrap gap-2">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-3 py-1.5 rounded-lg text-xs font-bold">
            {item} <button onClick={() => remove(i)} className="text-rose-500 hover:text-rose-700"><X size={12} /></button>
          </div>
        ))}
      </div>
    </div>
  );
};

const KeyValueListEditor = ({ title, items, onUpdate }: { title: string, items: { value: string, label: string }[], onUpdate: (newItems: { value: string, label: string }[]) => void }) => {
    const [newLabel, setNewLabel] = useState('');
    const add = () => { if(newLabel.trim()) { const val = newLabel.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, ''); onUpdate([...items, { value: val, label: newLabel.trim() }]); setNewLabel(''); } }
    const remove = (index: number) => { const newItems = [...items]; newItems.splice(index, 1); onUpdate(newItems); }
    return (
        <div className="bg-zinc-50 dark:bg-zinc-950 p-6 rounded-3xl border border-zinc-100 dark:border-zinc-800">
          <h4 className="text-xs font-black uppercase tracking-widest text-zinc-500 mb-4">{title}</h4>
          <div className="flex gap-2 mb-4">
            <input className="flex-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2 text-sm font-bold focus:outline-none" placeholder="Novo Item..." value={newLabel} onChange={e => setNewLabel(e.target.value)} onKeyDown={e => e.key === 'Enter' && add()} />
            <button onClick={add} className="p-2 bg-purple-600 text-white rounded-xl"><Plus size={18} /></button>
          </div>
          <div className="flex flex-wrap gap-2">
            {items.map((item, i) => (
              <div key={i} className="flex items-center gap-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-3 py-1.5 rounded-lg text-xs font-bold">
                {item.label} <button onClick={() => remove(i)} className="text-rose-500 hover:text-rose-700"><X size={12} /></button>
              </div>
            ))}
          </div>
        </div>
    );
}

const Perfil: React.FC<PerfilProps> = ({ isDarkMode, onToggleTheme }) => {
  const { visibleMenus, setVisibleMenus, familyMember, setFamilyMember, userProfile, setUserProfile, logout, appSettings, setAppSettings } = useFinance();
  const [activeTab, setActiveTab] = useState<'profile' | 'settings' | 'family' | 'system'>('profile');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [partnerForm, setPartnerForm] = useState({ name: '', email: '', password: '' });
  const [inviteCode, setInviteCode] = useState<string>('');

  // Estados para a aba de Segurança
  const [securityForm, setSecurityForm] = useState({
    newEmail: '',
    newPassword: '',
    confirmPassword: ''
  });

  // 1. CARREGAMENTO DE DADOS
  useEffect(() => {
    const fetchFamilyData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: userData } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      
      if (userData) {
          if(userData.name !== userProfile.name || userData.avatar_url !== userProfile.avatar) {
             const newProfile = { 
                 name: userData.name || userProfile.name, 
                 email: userData.email || userProfile.email, 
                 avatar: userData.avatar_url || userProfile.avatar 
             };
             setUserProfile(newProfile);
             localStorage.setItem('userProfile', JSON.stringify(newProfile));
          }

          if (userData.family_id) {
            const { data: familyData } = await supabase.from('families').select('invite_code').eq('id', userData.family_id).single();
            if (familyData) setInviteCode(familyData.invite_code);
            
            const { data: members } = await supabase.from('profiles').select('*').eq('family_id', userData.family_id);
            const partner = members?.find((m: any) => m.email !== userData.email);
            if (partner) {
                setFamilyMember({ name: partner.name, email: partner.email, avatar: partner.avatar_url });
            }
          }
      }
    };
    fetchFamilyData();
  }, [activeTab]);

  const menuVisibilityOptions = [
    { key: 'dashboard', label: 'Dashboard Principal' },
    { key: 'financeiro', label: 'Financeiro / Extrato' },
    { key: 'cartoes', label: 'Gestão de Cartões' },
    { key: 'investimentos', label: 'Investimentos' },
    { key: 'contas', label: 'Contas Bancárias' },
    { key: 'agenda', label: 'Agenda Compartilhada' },
    { key: 'metas', label: 'Sonhos & Metas' },
    { key: 'wishlist', label: 'Wishlist de Desejos' },
    { key: 'projetos', label: 'Projetos de Médio Prazo' },
    { key: 'anotacoes', label: 'Anotações e Post-its' },
    { key: 'vinnx-ai', label: 'VinnxAI Mentor' },
  ];

  const handleToggleMenu = (key: string) => {
    if (visibleMenus.includes(key)) setVisibleMenus(visibleMenus.filter(m => m !== key));
    else setVisibleMenus([...visibleMenus, key]);
  };

  const handleAddPartner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!partnerForm.name || !partnerForm.email || !partnerForm.password) return;
    try {
        const { error } = await supabase.auth.signUp({
            email: partnerForm.email,
            password: partnerForm.password,
            options: { data: { name: partnerForm.name, invite_code: inviteCode } }
        });
        if (error) throw error;
        setFamilyMember({ name: partnerForm.name, email: partnerForm.email, avatar: `https://ui-avatars.com/api/?name=${partnerForm.name}&background=random` });
        setPartnerForm({ name: '', email: '', password: '' });
        alert(`Conta criada para ${partnerForm.name}!`);
    } catch (err: any) { alert("Erro: " + err.message); }
  };

  // --- LÓGICA FOTO (BASE64) ---
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    setUploading(true);

    reader.onloadend = async () => {
        try {
            const base64String = reader.result as string;
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { alert("Faça login novamente."); return; }

            const { error } = await supabase
                .from('profiles')
                .upsert({ 
                    id: user.id,
                    email: user.email,
                    avatar_url: base64String,
                    updated_at: new Date()
                });

            if (error) throw error;

            const updatedProfile = { ...userProfile, avatar: base64String };
            setUserProfile(updatedProfile);
            localStorage.setItem('userProfile', JSON.stringify(updatedProfile));
            alert("Foto salva com sucesso!");

        } catch (error: any) {
            console.error(error);
            alert("Erro ao salvar: " + error.message);
        } finally {
            setUploading(false);
        }
    };
    reader.readAsDataURL(file);
  };

  // --- LÓGICA SALVAR NOME ---
  const handleSaveProfile = async () => {
      try {
        setSaving(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { alert("Você precisa estar logado."); return; }

        const { error } = await supabase
            .from('profiles')
            .upsert({ 
                id: user.id,
                name: userProfile.name,
                email: user.email,
                updated_at: new Date()
            });

        if (error) throw error;

        localStorage.setItem('userProfile', JSON.stringify(userProfile));
        alert("Dados salvos com sucesso!");
      } catch (error: any) {
          console.error("Erro Save:", error);
          alert("Erro ao salvar: " + error.message);
      } finally {
          setSaving(false);
      }
  };

  // --- NOVA LÓGICA: ATUALIZAR CREDENCIAIS (Email/Senha) ---
  const handleUpdateSecurity = async () => {
    setSaving(true);
    try {
        const updates: any = {};
        let message = "";

        // 1. Troca de Email
        if (securityForm.newEmail && securityForm.newEmail !== userProfile.email) {
            updates.email = securityForm.newEmail;
            message += "• Um link de confirmação foi enviado para o novo e-mail.\n";
        }

        // 2. Troca de Senha
        if (securityForm.newPassword) {
            if (securityForm.newPassword !== securityForm.confirmPassword) {
                alert("As senhas não coincidem!");
                setSaving(false);
                return;
            }
            updates.password = securityForm.newPassword;
            message += "• Senha atualizada com sucesso.\n";
        }

        if (Object.keys(updates).length === 0) {
            alert("Preencha o e-mail ou a senha para atualizar.");
            setSaving(false);
            return;
        }

        const { error } = await supabase.auth.updateUser(updates);

        if (error) throw error;

        alert("Sucesso!\n" + message);
        setSecurityForm({ newEmail: '', newPassword: '', confirmPassword: '' }); // Limpa formulário

    } catch (error: any) {
        alert("Erro ao atualizar segurança: " + error.message);
    } finally {
        setSaving(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[3rem] overflow-hidden shadow-2xl group/profile p-10">
        <div className="flex flex-col md:flex-row items-center md:items-center justify-between gap-8">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="relative group/avatar">
              <img 
                src={userProfile.avatar || `https://ui-avatars.com/api/?name=${userProfile.name}&background=random`} 
                className="w-32 h-32 md:w-44 md:h-44 rounded-[2.5rem] border-8 border-zinc-100 dark:border-zinc-800 object-cover shadow-2xl transition-opacity duration-300" 
                style={{ opacity: uploading ? 0.5 : 1 }}
                alt="Profile" 
              />
              <button 
                onClick={() => avatarInputRef.current?.click()}
                disabled={uploading}
                className="absolute inset-2 bg-black/40 backdrop-blur-sm rounded-[2rem] flex items-center justify-center text-white opacity-0 group-hover/avatar:opacity-100 transition-all border-2 border-white/20 disabled:cursor-not-allowed"
              >
                {uploading ? <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : <Camera size={32} />}
              </button>
              <input type="file" ref={avatarInputRef} onChange={handleAvatarUpload} className="hidden" accept="image/*" />
            </div>
            <div className="mb-4 text-center md:text-left space-y-1">
              <h2 className="text-3xl md:text-4xl font-black tracking-tighter uppercase text-zinc-900 dark:text-white">{userProfile.name}</h2>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                 <span className="px-3 py-1 bg-purple-600 text-white text-[10px] font-black uppercase rounded-full tracking-widest shadow-lg shadow-purple-500/20">Administrador</span>
                 <p className="text-zinc-500 text-sm font-bold uppercase tracking-widest">Plano Pro • Desde 2024</p>
              </div>
            </div>
          </div>
          <div className="flex justify-center">
             <button onClick={logout} className="bg-rose-500/10 text-rose-500 px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-rose-500/20 transition-all">
              <LogOut size={16} /> Sair da Conta
             </button>
          </div>
        </div>

        <div className="flex border-t border-zinc-100 dark:border-zinc-800 px-6 overflow-x-auto scrollbar-hide bg-zinc-50/50 dark:bg-zinc-950/20 mt-10 -mx-10 -mb-10 pt-4">
          {['profile', 'family', 'system', 'settings'].map((tab) => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-8 py-6 text-xs font-black uppercase tracking-widest transition-all border-b-2 whitespace-nowrap ${activeTab === tab ? 'border-purple-600 text-purple-600' : 'border-transparent text-zinc-400 hover:text-zinc-600'}`}
            >
              {tab === 'profile' ? 'Dados Pessoais' : tab === 'family' ? 'Membros do Casal' : tab === 'system' ? 'Sistema' : 'Segurança'}
            </button>
          ))}
        </div>
      </div>

      <div className="w-full space-y-6">
        {activeTab === 'profile' && (
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-10 md:p-12 rounded-[3rem] space-y-10 shadow-sm">
            <div className="flex justify-between items-center">
               <h3 className="text-xl font-black uppercase tracking-tighter flex items-center gap-4"><User size={24} className="text-purple-600" /> Perfil Principal</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-2">
                 <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-2">Nome Completo</label>
                 <input type="text" value={userProfile.name} onChange={(e) => setUserProfile({...userProfile, name: e.target.value})} className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-6 py-4 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-purple-600/10 transition-all" />
              </div>
              <div className="space-y-2">
                 <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-2">Email de Acesso</label>
                 <input type="email" disabled value={userProfile.email} className="w-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl px-6 py-4 text-sm font-bold text-zinc-500 cursor-not-allowed" />
              </div>
            </div>
            <div className="pt-8 border-t border-zinc-100 dark:border-zinc-800 flex justify-end">
               <button onClick={handleSaveProfile} disabled={saving} className="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-12 py-4 rounded-2xl text-xs font-black uppercase tracking-widest shadow-2xl transition-all active:scale-95 disabled:opacity-70 disabled:cursor-wait">
                   {saving ? 'Salvando...' : 'Salvar Alterações'}
               </button>
            </div>
          </div>
        )}

        {/* ... (Manter abas Family e System iguais) ... */}
        {activeTab === 'family' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-10 md:p-12 rounded-[3rem] space-y-10 shadow-sm">
              <h3 className="text-xl font-black uppercase tracking-tighter flex items-center gap-4"><Users size={24} className="text-purple-600" /> Membros da Família</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="flex items-center justify-between p-6 bg-zinc-50 dark:bg-zinc-950 rounded-[2rem] border border-zinc-100 dark:border-zinc-800">
                  <div className="flex items-center gap-5">
                    <img src={userProfile.avatar} className="w-14 h-14 rounded-2xl object-cover shadow-lg" />
                    <div>
                      <p className="text-base font-black">{userProfile.name} (Você)</p>
                      <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Administrador Master</p>
                    </div>
                  </div>
                  <span className="px-4 py-1.5 bg-emerald-500/10 text-emerald-600 text-[10px] font-black uppercase rounded-full">Sessão Ativa</span>
                </div>

                {familyMember ? (
                  <div className="flex items-center justify-between p-6 bg-zinc-50 dark:bg-zinc-950 rounded-[2rem] border border-zinc-100 dark:border-zinc-800 group">
                    <div className="flex items-center gap-5">
                      <img src={familyMember.avatar} className="w-14 h-14 rounded-2xl object-cover shadow-lg" />
                      <div>
                        <p className="text-base font-black">{familyMember.name}</p>
                        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">{familyMember.email}</p>
                      </div>
                    </div>
                    <button className="p-3 text-rose-500 hover:bg-rose-500/10 rounded-2xl transition-all"><Check size={20} className="text-emerald-500" /></button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-6 border-4 border-dashed border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] text-center space-y-4">
                      <p className="text-sm font-black text-zinc-400 uppercase tracking-widest">Vaga para Parceiro(a)</p>
                      <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Crie um acesso compartilhado abaixo</p>
                  </div>
                )}
              </div>

              {!familyMember && (
                <div className="bg-zinc-50 dark:bg-zinc-900 p-10 rounded-[3rem] border border-zinc-100 dark:border-zinc-800">
                  <div className="flex flex-col items-center text-center space-y-6 mb-10">
                    <div className="w-20 h-20 bg-purple-100 dark:bg-purple-900/30 rounded-[2rem] flex items-center justify-center text-purple-600 shadow-inner">
                      <UserPlus size={40} />
                    </div>
                    <div>
                      <h4 className="font-black text-xl uppercase tracking-tighter">Vinnx Connect</h4>
                      <p className="text-sm text-zinc-500 max-w-md mt-1">Gere um login e senha para que seu parceiro(a) possa gerir as finanças no mesmo dashboard que você.</p>
                    </div>
                  </div>
                  
                  <form onSubmit={handleAddPartner} className="space-y-6 max-w-2xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div className="space-y-1">
                         <label className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.2em] ml-2">Nome Completo</label>
                         <input required className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-5 py-4 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-purple-600/10 transition-all" placeholder="Ex: Maria Silva" value={partnerForm.name} onChange={e => setPartnerForm({...partnerForm, name: e.target.value})} />
                       </div>
                       <div className="space-y-1">
                         <label className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.2em] ml-2">Email de Acesso</label>
                         <input required type="email" className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-5 py-4 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-purple-600/10 transition-all" placeholder="parceiro@email.com" value={partnerForm.email} onChange={e => setPartnerForm({...partnerForm, email: e.target.value})} />
                       </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.2em] ml-2">Senha Temporária</label>
                      <div className="relative">
                        <Key className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                        <input required type="password" className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl pl-14 pr-6 py-4 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-purple-600/10 transition-all" placeholder="••••••••" value={partnerForm.password} onChange={e => setPartnerForm({...partnerForm, password: e.target.value})} />
                      </div>
                    </div>
                    <button type="submit" className="w-full py-5 bg-purple-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-2xl shadow-purple-500/30 active:scale-95 transition-all">Ativar Acesso Compartilhado</button>
                  </form>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'system' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-10 md:p-12 rounded-[3rem] space-y-10 shadow-sm">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-black uppercase tracking-tighter flex items-center gap-4"><Palette size={24} className="text-purple-600" /> Aparência e Configuração</h3>
                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Personalização Avançada</span>
              </div>
              
              <div className="flex items-center justify-between p-6 bg-zinc-50 dark:bg-zinc-950 rounded-[2.5rem] border border-zinc-100 dark:border-zinc-800 mb-10 shadow-sm">
                <div className="flex items-center gap-5">
                  <div className="p-4 bg-white dark:bg-zinc-800 rounded-2xl shadow-sm">{isDarkMode ? <Moon size={24} className="text-purple-600" /> : <Sun size={24} className="text-amber-500" />}</div>
                  <div>
                    <p className="text-base font-black">Tema Visual</p>
                    <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">Atualmente em modo {isDarkMode ? 'Dark' : 'Light'}</p>
                  </div>
                </div>
                <button onClick={onToggleTheme} className={`w-16 h-8 rounded-full relative transition-colors ${isDarkMode ? 'bg-purple-600' : 'bg-zinc-300'}`}>
                  <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transition-all ${isDarkMode ? 'right-1' : 'left-1'}`}></div>
                </button>
              </div>

              <div className="space-y-8">
                <div className="flex items-center gap-3 mb-6">
                  <List className="text-purple-600" size={20} />
                  <h4 className="text-sm font-black uppercase tracking-widest">Opções do Sistema</h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <StringListEditor title="Categorias Financeiras" items={appSettings.transactionCategories} onUpdate={(items) => setAppSettings({ ...appSettings, transactionCategories: items })} />
                  <KeyValueListEditor title="Status de Transação" items={appSettings.transactionStatus} onUpdate={(items) => setAppSettings({ ...appSettings, transactionStatus: items })} />
                  <KeyValueListEditor title="Divisão de Custos" items={appSettings.transactionDivision} onUpdate={(items) => setAppSettings({ ...appSettings, transactionDivision: items })} />
                  <StringListEditor title="Bandeiras de Cartão" items={appSettings.cardBrands} onUpdate={(items) => setAppSettings({ ...appSettings, cardBrands: items })} />
                  <StringListEditor title="Perfis de Investimento" items={appSettings.investmentTypes} onUpdate={(items) => setAppSettings({ ...appSettings, investmentTypes: items })} />
                  <KeyValueListEditor title="Cores de Contas" items={appSettings.accountColors} onUpdate={(items) => setAppSettings({ ...appSettings, accountColors: items })} />
                </div>
              </div>

              <div className="h-px bg-zinc-100 dark:bg-zinc-800 w-full my-10" />

              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-6 ml-2">Menu Lateral Personalizado</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {menuVisibilityOptions.map(option => (
                  <button key={option.key} onClick={() => handleToggleMenu(option.key)} className={`flex items-center justify-between p-5 rounded-2xl border-2 transition-all ${visibleMenus.includes(option.key) ? 'bg-purple-600/5 border-purple-600/20 text-purple-600' : 'bg-zinc-50 dark:bg-zinc-950 border-zinc-100 dark:border-zinc-800 text-zinc-400'}`}>
                    <span className="text-xs font-black uppercase tracking-widest">{option.label}</span>
                    {visibleMenus.includes(option.key) ? <Eye size={18} /> : <EyeOff size={18} />}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* --- ABA SEGURANÇA CORRIGIDA --- */}
        {activeTab === 'settings' && (
           <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-10 md:p-12 rounded-[3rem] space-y-10 shadow-sm">
              <h3 className="text-xl font-black uppercase tracking-tighter flex items-center gap-4"><Shield size={24} className="text-purple-600" /> Segurança da Conta</h3>
              
              <div className="max-w-2xl space-y-10">
                <div className="bg-zinc-50 dark:bg-zinc-950 p-8 md:p-10 rounded-[2.5rem] border border-zinc-100 dark:border-zinc-800 shadow-sm">
                  <h4 className="text-sm font-black uppercase tracking-widest text-zinc-800 dark:text-zinc-100 mb-8 flex items-center gap-2">
                    <Key size={18} className="text-purple-600" /> Alterar E-mail e Senha
                  </h4>
                  
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest ml-2">Novo E-mail</label>
                      {/* INPUT DE E-MAIL AGORA É EDITÁVEL */}
                      <input 
                        type="email" 
                        placeholder="Ex: novo@email.com" 
                        value={securityForm.newEmail}
                        onChange={e => setSecurityForm({...securityForm, newEmail: e.target.value})}
                        className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-6 py-4 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-purple-600/10 transition-all shadow-inner" 
                      />
                    </div>
                    
                    {/* Campos de Senha Opcionais */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest ml-2">Nova Senha</label>
                        <input 
                          type="password" 
                          placeholder="••••••••" 
                          value={securityForm.newPassword}
                          onChange={e => setSecurityForm({...securityForm, newPassword: e.target.value})}
                          className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-6 py-4 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-purple-600/10 transition-all shadow-inner" 
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest ml-2">Repetir Nova Senha</label>
                        <input 
                          type="password" 
                          placeholder="••••••••" 
                          value={securityForm.confirmPassword}
                          onChange={e => setSecurityForm({...securityForm, confirmPassword: e.target.value})}
                          className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-6 py-4 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-purple-600/10 transition-all shadow-inner" 
                        />
                      </div>
                    </div>
                    
                    <button 
                        onClick={handleUpdateSecurity}
                        disabled={saving}
                        className="w-full py-5 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-2xl active:scale-95 transition-all mt-4 disabled:opacity-70"
                    >
                      {saving ? 'Atualizando...' : 'Atualizar Credenciais'}
                    </button>
                  </div>
                </div>

                <div className="p-6 bg-rose-500/5 border border-rose-500/10 rounded-[2rem] flex items-center gap-4">
                  <div className="w-12 h-12 bg-rose-500/10 text-rose-500 rounded-2xl flex items-center justify-center shrink-0"><Shield size={24} /></div>
                  <div>
                    <p className="text-xs font-bold text-rose-600 uppercase tracking-widest">Atenção</p>
                    <p className="text-[10px] text-zinc-500 font-medium">Ao mudar seu e-mail, você será deslogado e precisará confirmar o novo endereço.</p>
                  </div>
                </div>
              </div>
           </div>
        )}
      </div>
    </div>
  );
};

export default Perfil;