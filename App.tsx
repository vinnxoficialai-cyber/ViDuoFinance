import React, { useState, useEffect, createContext, useContext } from 'react';
import { HashRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Wallet, CreditCard as CardIcon, Target, Briefcase, 
  StickyNote, Sparkles, ChevronLeft, ChevronRight, Plus, Home, User, 
  Bell, Moon, Sun, X, Calendar as CalendarIcon, TrendingUp, ShoppingBag, LayoutGrid
} from 'lucide-react';

import { supabase } from './supabaseClient';

import Dashboard from './components/Dashboard';
import Financeiro from './components/Financeiro';
import Contas from './components/Contas';
import Metas from './components/Metas';
import Projetos from './components/Projetos';
import Anotacoes from './components/Anotacoes';
import Agenda from './components/Agenda';
import Investimentos from './components/Investimentos';
import Cartoes from './components/Cartoes';
import Wishlist from './components/Wishlist';
import VinnxAIView from './components/VinnxAI'; 
import Perfil from './components/Perfil';
import Login from './components/Login';

import { INITIAL_CREDIT_CARDS, INITIAL_GOALS, INITIAL_NOTES, INITIAL_WISHLIST, INITIAL_PROJECTS } from './constants';
import { Transaction, BankAccount, Notification, CreditCard, Goal, Note, WishlistItem, AppSettings, Project } from './types';

interface FamilyMember { name: string; email: string; avatar: string; }
interface UserProfile { name: string; email: string; avatar: string; }

interface FinanceContextType {
  accounts: BankAccount[];
  transactions: Transaction[];
  creditCards: CreditCard[];
  notifications: Notification[];
  goals: Goal[];
  notes: Note[];
  wishlist: WishlistItem[];
  projects: Project[];
  visibleMenus: string[];
  familyMember: FamilyMember | null;
  userProfile: UserProfile;
  isAuthenticated: boolean;
  appSettings: AppSettings;
  setUserProfile: (p: UserProfile) => void;
  setFamilyMember: (m: FamilyMember | null) => void;
  setVisibleMenus: (menus: string[]) => void;
  setAppSettings: (settings: AppSettings) => void;
  
  // Funções de Banco de Dados (CRUD)
  addTransaction: (t: Omit<Transaction, 'id'>) => void;
  deleteTransaction: (id: string) => void;
  addAccount: (a: Omit<BankAccount, 'id'>) => void;
  deleteAccount: (id: string) => void;
  
  addCreditCard: (c: Omit<CreditCard, 'id'>) => void;
  deleteCreditCard: (id: string) => void;
  addGoal: (g: Omit<Goal, 'id'>) => void;
  deleteGoal: (id: string) => void;
  addNote: (n: Omit<Note, 'id'>) => void;
  deleteNote: (id: string) => void;
  addWishlistItem: (w: Omit<WishlistItem, 'id'>) => void;
  deleteWishlistItem: (id: string) => void;
  addProject: (p: Omit<Project, 'id'>) => void;
  deleteProject: (id: string) => void;

  setGoals: React.Dispatch<React.SetStateAction<Goal[]>>;
  setNotes: React.Dispatch<React.SetStateAction<Note[]>>;
  setWishlist: React.Dispatch<React.SetStateAction<WishlistItem[]>>;
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
  
  markNotificationRead: (id: string) => void;
  clearNotifications: () => void;
  logout: () => void;
}

export const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (!context) throw new Error("useFinance must be used within a FinanceProvider");
  return context;
};

// --- Componentes Mobile (Corrigido: Adicionado "Contas") ---
const MobileMenuDrawer = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  const { visibleMenus } = useFinance();
  const location = useLocation();
  if (!isOpen) return null;
  
  const menuItems = [
    { key: 'contas', label: 'Contas / Bancos', icon: CardIcon, path: '/contas' }, // <--- ITEM ADICIONADO AQUI
    { key: 'investimentos', label: 'Investimentos', icon: TrendingUp, path: '/investimentos' },
    { key: 'agenda', label: 'Agenda', icon: CalendarIcon, path: '/agenda' },
    { key: 'metas', label: 'Sonhos', icon: Target, path: '/metas' },
    { key: 'projetos', label: 'Projetos', icon: Briefcase, path: '/projetos' },
    { key: 'wishlist', label: 'Wishlist', icon: ShoppingBag, path: '/wishlist' },
    { key: 'anotacoes', label: 'Anotações', icon: StickyNote, path: '/anotacoes' },
    { key: 'vinnx-ai', label: 'VinnxAI', icon: Sparkles, path: '/vinnx-ai' },
    { key: 'perfil', label: 'Perfil', icon: User, path: '/perfil' },
  ];

  return (
    <div className="fixed inset-0 z-[100] md:hidden animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="absolute bottom-0 left-0 right-0 bg-zinc-950 border-t border-zinc-800 rounded-t-[2.5rem] p-8 pb-12 animate-in slide-in-from-bottom duration-500">
        <div className="grid grid-cols-3 gap-y-10">
          {menuItems.filter(item => visibleMenus.includes(item.key) || item.key === 'perfil').map((item) => (
            <Link key={item.key} to={item.path} onClick={onClose} className="flex flex-col items-center gap-3 group">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${location.pathname === item.path ? 'bg-purple-600 text-white shadow-lg' : 'bg-zinc-900 text-zinc-400'}`}>
                <item.icon size={24} />
              </div>
              <span className={`text-[10px] font-black uppercase tracking-widest ${location.pathname === item.path ? 'text-white' : 'text-zinc-500'}`}>{item.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

const MobileBottomNav = ({ onOpenAdd }: { onOpenAdd: () => void }) => {
  const location = useLocation();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const isActive = (path: string) => location.pathname === path;
  return (
    <>
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-20 bg-zinc-950/80 backdrop-blur-xl border-t border-zinc-800 px-6 flex items-center justify-between z-50 safe-area-bottom">
        <Link to="/dashboard" className={`p-2 transition-colors ${isActive('/dashboard') || isActive('/') ? 'text-white' : 'text-zinc-500'}`}><Home size={22} /></Link>
        <Link to="/financeiro" className={`p-2 transition-colors ${isActive('/financeiro') ? 'text-white' : 'text-zinc-500'}`}><Wallet size={22} /></Link>
        <div className="relative -mt-10">
          <button onClick={onOpenAdd} className="w-16 h-16 bg-gradient-to-tr from-purple-600 to-indigo-600 rounded-full flex items-center justify-center text-white shadow-xl shadow-purple-500/40 border-4 border-zinc-950 active:scale-95 transition-all">
            <Plus size={28} strokeWidth={2.5} />
          </button>
        </div>
        <Link to="/cartoes" className={`p-2 transition-colors ${isActive('/cartoes') ? 'text-white' : 'text-zinc-500'}`}><CardIcon size={22} /></Link>
        <button onClick={() => setIsDrawerOpen(true)} className={`p-2 transition-colors ${isDrawerOpen ? 'text-white' : 'text-zinc-500'}`}><LayoutGrid size={22} /></button>
      </div>
      <MobileMenuDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />
    </>
  );
};

const AddTransactionModal = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  const { accounts, creditCards, addTransaction, appSettings } = useFinance();
  const [paymentMethod, setPaymentMethod] = useState<'debit' | 'credit'>('debit');
  const [formData, setFormData] = useState({
    description: '', amount: '', type: 'expense' as 'income' | 'expense',
    category: appSettings.transactionCategories[0] || 'Geral', date: new Date().toISOString().split('T')[0],
    account: accounts[0]?.name || '', card: creditCards[0]?.name || '', status: 'paid' as string
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: any = { ...formData, amount: Number(formData.amount) };
    if (paymentMethod === 'credit') {
        payload.account = formData.card; 
        payload.status = 'pending';
    }
    addTransaction(payload);
    onClose();
    setFormData({ ...formData, description: '', amount: '' });
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white dark:bg-zinc-900 w-full max-md rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95 duration-300">
        <div className="flex justify-between items-center mb-8"><h3 className="text-xl font-black uppercase tracking-tighter">Nova Atividade</h3><button onClick={onClose} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full"><X size={20} /></button></div>
        <div className="flex gap-2 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-2xl mb-8">
           <button onClick={() => setPaymentMethod('debit')} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${paymentMethod === 'debit' ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-500'}`}>Débito / PIX</button>
           <button onClick={() => setPaymentMethod('credit')} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${paymentMethod === 'credit' ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-500'}`}>Crédito</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-1"><label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest ml-1">Descrição</label><input required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 text-sm font-bold" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1"><label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest ml-1">Valor</label><input required type="number" step="0.01" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 text-sm font-black text-purple-600" /></div>
            <div className="space-y-1"><label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest ml-1">Categoria</label><select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 text-sm font-bold">{appSettings.transactionCategories.map(cat => (<option key={cat} value={cat}>{cat}</option>))}</select></div>
          </div>
          <div className="space-y-1"><label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest ml-1">{paymentMethod === 'debit' ? 'Origem do Saldo' : 'Cartão Utilizado'}</label><select value={paymentMethod === 'debit' ? formData.account : formData.card} onChange={e => setFormData(paymentMethod === 'debit' ? {...formData, account: e.target.value} : {...formData, card: e.target.value})} className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 text-sm font-bold">{paymentMethod === 'debit' ? accounts.map(acc => <option key={acc.id} value={acc.name}>{acc.name}</option>) : creditCards.map(card => <option key={card.id} value={card.name}>{card.name}</option>)}</select></div>
          <button type="submit" className="w-full py-5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-2xl active:scale-95 transition-all">Confirmar</button>
        </form>
      </div>
    </div>
  );
};

const SidebarLink = ({ to, icon: Icon, label, collapsed }: { to: string, icon: any, label: string, collapsed: boolean }) => {
  const location = useLocation();
  const isActive = location.pathname === to || (location.pathname === '/' && to === '/dashboard');
  return (<Link to={to} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${isActive ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 shadow-lg font-semibold' : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-800'}`}><Icon size={20} />{!collapsed && <span className="text-sm whitespace-nowrap font-medium">{label}</span>}</Link>);
};

const App: React.FC = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(() => { return localStorage.getItem('vinnx_auth') === 'true'; });
  
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [creditCards, setCreditCards] = useState<CreditCard[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  // ESTADO INICIAL DO PERFIL
  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('userProfile');
    return saved ? JSON.parse(saved) : { name: 'Usuário', email: 'usuario@vinnx.com', avatar: 'https://ui-avatars.com/api/?name=User&background=random' };
  });

  const [familyMember, setFamilyMember] = useState<FamilyMember | null>(() => {
    const saved = localStorage.getItem('familyMember');
    return saved ? JSON.parse(saved) : null;
  });
  const [visibleMenus, setVisibleMenus] = useState<string[]>(() => {
    const saved = localStorage.getItem('visibleMenus');
    return saved ? JSON.parse(saved) : ['dashboard', 'financeiro', 'cartoes', 'investimentos', 'contas', 'agenda', 'metas', 'wishlist', 'projetos', 'anotacoes', 'vinnx-ai'];
  });
  const [appSettings, setAppSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('appSettings');
    return saved ? JSON.parse(saved) : {
      transactionCategories: ['Geral', 'Alimentação', 'Moradia', 'Lazer', 'Salário', 'Metas', 'Saúde', 'Educação'],
      transactionStatus: [ { value: 'paid', label: 'Pago / Concluído' }, { value: 'pending', label: 'Pendente / Agendado' }, { value: 'overdue', label: 'Em Atraso' } ],
      transactionDivision: [ { value: 'shared', label: 'Compartilhada (50/50)' }, { value: 'individual', label: 'Individual' }, { value: 'proportional', label: 'Proporcional' } ],
      cardBrands: ['visa', 'mastercard', 'amex', 'elo'], investmentTypes: ['Segurança', 'Crescimento', 'Aposentadoria', 'Arrojado'], accountColors: [ { value: 'purple', label: 'Roxo Premium' }, { value: 'orange', label: 'Laranja Vibrante' }, { value: 'black', label: 'Deep Black / Gold' }, { value: 'blue', label: 'Blue Horizon' }, { value: 'pink', label: 'Rosa Shock' }, { value: 'emerald', label: 'Verde Finanças' }, { value: 'slate', label: 'Cinza Metálico' } ]
    };
  });
  const [isDarkMode, setIsDarkMode] = useState(() => { const savedTheme = localStorage.getItem('theme'); return savedTheme ? savedTheme === 'dark' : true; });

  // 🔴 1. FUNÇÃO LOGOUT (Movida para cima para ser acessada pelo fetchData)
  const logout = async () => { 
      await supabase.auth.signOut(); 
      setIsAuthenticated(false); 
      localStorage.removeItem('vinnx_auth'); 
      localStorage.removeItem('userProfile');
      // Limpa dados sensíveis para evitar piscar dados antigos
      setAccounts([]);
      setTransactions([]);
  };

  // --- CARREGAR DADOS ---
  const fetchData = async () => {
    try {
        // 🔴 2. VERIFICAÇÃO "MATADORA DE ZUMBI"
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
            console.log("Sessão inválida ou usuário excluído. Fazendo logout.");
            await logout();
            return;
        }

        // 1. DADOS DO PERFIL
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        if (profile) {
            const newProfile = {
                name: profile.name || 'Usuário',
                email: profile.email || user.email || '',
                avatar: profile.avatar_url || 'https://ui-avatars.com/api/?name=User&background=random'
            };
            setUserProfile(newProfile);
            localStorage.setItem('userProfile', JSON.stringify(newProfile));
        }

        // 2. Busca restante dos dados...
        const { data: accData } = await supabase.from('accounts').select('*');
        if (accData) setAccounts(accData as any);

        const { data: transData } = await supabase.from('transactions').select('*').order('created_at', { ascending: false });
        if (transData) {
            const formatted = transData.map((t: any) => ({ ...t, account: t.account_name || 'Desconhecido', date: t.date || new Date().toISOString() }));
            setTransactions(formatted);
        }

        const { data: cardsData } = await supabase.from('credit_cards').select('*');
        if (cardsData) setCreditCards(cardsData as any);

        const { data: goalsData } = await supabase.from('goals').select('*');
        if (goalsData) setGoals(goalsData as any);

        const { data: notesData } = await supabase.from('notes').select('*');
        if (notesData) setNotes(notesData as any);

        const { data: wishData } = await supabase.from('wishlist').select('*');
        if (wishData) setWishlist(wishData as any);

        const { data: projData } = await supabase.from('projects').select('*');
        if (projData) setProjects(projData as any);

    } catch (error) { 
        console.error("Erro ao carregar dados:", error); 
    }
  };

  useEffect(() => { if (isAuthenticated) fetchData(); }, [isAuthenticated]);
  useEffect(() => { localStorage.setItem('vinnx_auth', isAuthenticated.toString()); }, [isAuthenticated]);
  useEffect(() => { localStorage.setItem('visibleMenus', JSON.stringify(visibleMenus)); }, [visibleMenus]);
  useEffect(() => { if (isDarkMode) document.documentElement.classList.add('dark'); else document.documentElement.classList.remove('dark'); localStorage.setItem('theme', isDarkMode ? 'dark' : 'light'); }, [isDarkMode]);

  // --- FUNÇÕES CRUD (IGUAIS) ---
  const addTransaction = async (t: Omit<Transaction, 'id'>) => {
    const tempId = Math.random().toString(36).substr(2, 9);
    setTransactions([ { ...t, id: tempId } as Transaction, ...transactions]);
    if (t.status === 'paid') setAccounts(prev => prev.map(acc => acc.name === t.account ? { ...acc, balance: t.type === 'income' ? acc.balance + t.amount : acc.balance - t.amount } : acc));
    const user = (await supabase.auth.getUser()).data.user;
    if (user) await supabase.from('transactions').insert([{ description: t.description, amount: t.amount, type: t.type, category: t.category, account_name: t.account, date: t.date, status: t.status, user_id: user.id }]);
  };
  const deleteTransaction = async (id: string) => {
    const t = transactions.find(item => item.id === id);
    if (!t) return;
    setTransactions(transactions.filter(item => item.id !== id));
    if (t.status === 'paid') setAccounts(prev => prev.map(acc => acc.name === t.account ? { ...acc, balance: t.type === 'income' ? acc.balance - t.amount : acc.balance + t.amount } : acc));
    await supabase.from('transactions').delete().eq('id', id);
  };
  const addAccount = async (a: Omit<BankAccount, 'id'>) => {
    const tempId = Math.random().toString(36).substr(2, 9);
    setAccounts([...accounts, { ...a, id: tempId } as BankAccount]);
    const user = (await supabase.auth.getUser()).data.user;
    if (user) await supabase.from('accounts').insert([{ name: a.name, balance: a.balance, type: a.type || 'checking', color: a.color, user_id: user.id }]);
  };
  const deleteAccount = async (id: string) => {
    setAccounts(accounts.filter(a => a.id !== id));
    await supabase.from('accounts').delete().eq('id', id);
  };
  const addCreditCard = async (c: Omit<CreditCard, 'id'>) => {
    const tempId = Math.random().toString(36).substr(2, 9);
    setCreditCards([...creditCards, { ...c, id: tempId } as CreditCard]);
    const user = (await supabase.auth.getUser()).data.user;
    if (user) await supabase.from('credit_cards').insert([{ ...c, user_id: user.id }]);
  };
  const deleteCreditCard = async (id: string) => {
    setCreditCards(creditCards.filter(c => c.id !== id));
    await supabase.from('credit_cards').delete().eq('id', id);
  };
  const addGoal = async (g: Omit<Goal, 'id'>) => {
    const tempId = Math.random().toString(36).substr(2, 9);
    setGoals([...goals, { ...g, id: tempId } as Goal]);
    const user = (await supabase.auth.getUser()).data.user;
    if (user) await supabase.from('goals').insert([{ ...g, target_amount: g.target, current_amount: g.current, user_id: user.id }]);
  };
  const deleteGoal = async (id: string) => {
    setGoals(goals.filter(g => g.id !== id));
    await supabase.from('goals').delete().eq('id', id);
  };
  const addNote = async (n: Omit<Note, 'id'>) => {
    const tempId = Math.random().toString(36).substr(2, 9);
    setNotes([ { ...n, id: tempId } as Note, ...notes]);
    const user = (await supabase.auth.getUser()).data.user;
    if (user) await supabase.from('notes').insert([{ title: n.title, content: n.content, color: n.color, emoji: n.emoji, created_by: n.createdBy, date: n.date, user_id: user.id }]);
  };
  const deleteNote = async (id: string) => {
    setNotes(notes.filter(n => n.id !== id));
    await supabase.from('notes').delete().eq('id', id);
  };
  const addWishlistItem = async (w: Omit<WishlistItem, 'id'>) => {
    const tempId = Math.random().toString(36).substr(2, 9);
    setWishlist([...wishlist, { ...w, id: tempId } as WishlistItem]);
    const user = (await supabase.auth.getUser()).data.user;
    if (user) await supabase.from('wishlist').insert([{ name: w.name, price: w.price, saved_amount: w.savedAmount, image_url: w.imageUrl, priority: w.priority, link: w.link || '', user_id: user.id }]);
  };
  const deleteWishlistItem = async (id: string) => {
    setWishlist(wishlist.filter(w => w.id !== id));
    await supabase.from('wishlist').delete().eq('id', id);
  };
  const addProject = async (p: Omit<Project, 'id'>) => {
    const tempId = Math.random().toString(36).substr(2, 9);
    setProjects([...projects, { ...p, id: tempId } as Project]);
    const user = (await supabase.auth.getUser()).data.user;
    if (user) await supabase.from('projects').insert([{ ...p, user_id: user.id }]);
  };
  const deleteProject = async (id: string) => {
    setProjects(projects.filter(p => p.id !== id));
    await supabase.from('projects').delete().eq('id', id);
  };
  const markNotificationRead = (id: string) => setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  const clearNotifications = () => setNotifications([]);

  if (!isAuthenticated) return <Login onLogin={() => setIsAuthenticated(true)} />;

  return (
    <FinanceContext.Provider value={{ accounts, transactions, creditCards, notifications, visibleMenus, familyMember, userProfile, goals, notes, wishlist, projects, isAuthenticated, appSettings, setUserProfile, setFamilyMember, setVisibleMenus, setAppSettings, addTransaction, deleteTransaction, addAccount, deleteAccount, addCreditCard, deleteCreditCard, addGoal, deleteGoal, addNote, deleteNote, addWishlistItem, deleteWishlistItem, addProject, deleteProject, setGoals, setNotes, setWishlist, setProjects, markNotificationRead, clearNotifications, logout }}>
      <Router>
        <div className="flex min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 selection:bg-purple-500/30">
          <aside className={`fixed left-0 top-0 bottom-0 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 transition-all duration-300 z-40 hidden md:block ${sidebarCollapsed ? 'w-20' : 'w-72'}`}>
            <div className="p-4 flex flex-col h-full">
              <div className="flex items-center justify-between mb-8 px-2">
                {!sidebarCollapsed && <span className="font-display font-black text-2xl bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent tracking-tighter">VinnxAI</span>}
                <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-500 transition-colors">{sidebarCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}</button>
              </div>
              <nav className="flex flex-col gap-2 flex-1 scrollbar-hide overflow-y-auto pr-2">
                {visibleMenus.includes('dashboard') && <SidebarLink to="/dashboard" icon={LayoutDashboard} label="Dashboard" collapsed={sidebarCollapsed} />}
                {visibleMenus.includes('financeiro') && <SidebarLink to="/financeiro" icon={Wallet} label="Financeiro" collapsed={sidebarCollapsed} />}
                {visibleMenus.includes('cartoes') && <SidebarLink to="/cartoes" icon={CardIcon} label="Cartões de Crédito" collapsed={sidebarCollapsed} />}
                {visibleMenus.includes('investimentos') && <SidebarLink to="/investimentos" icon={TrendingUp} label="Investimentos" collapsed={sidebarCollapsed} />}
                {visibleMenus.includes('contas') && <SidebarLink to="/contas" icon={CardIcon} label="Contas / Bancos" collapsed={sidebarCollapsed} />}
                {visibleMenus.includes('agenda') && <SidebarLink to="/agenda" icon={CalendarIcon} label="Agenda Compartilhada" collapsed={sidebarCollapsed} />}
                {visibleMenus.includes('metas') && <SidebarLink to="/metas" icon={Target} label="Sonhos & Metas" collapsed={sidebarCollapsed} />}
                {visibleMenus.includes('wishlist') && <SidebarLink to="/wishlist" icon={ShoppingBag} label="Wishlist & Desejos" collapsed={sidebarCollapsed} />}
                {visibleMenus.includes('projetos') && <SidebarLink to="/projetos" icon={Briefcase} label="Projetos" collapsed={sidebarCollapsed} />}
                {visibleMenus.includes('anotacoes') && <SidebarLink to="/anotacoes" icon={StickyNote} label="Anotações" collapsed={sidebarCollapsed} />}
                <div className="my-4 border-t border-zinc-200 dark:border-zinc-800"></div>
                {visibleMenus.includes('vinnx-ai') && <SidebarLink to="/vinnx-ai" icon={Sparkles} label="VinnxAI" collapsed={sidebarCollapsed} />}
              </nav>
              <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 space-y-2"><SidebarLink to="/perfil" icon={User} label="Meu Perfil" collapsed={sidebarCollapsed} /></div>
            </div>
          </aside>
          <main className={`flex-1 transition-all duration-300 pb-32 md:pb-8 ${sidebarCollapsed ? 'md:ml-20' : 'md:ml-72'} w-full`}>
            <header className="px-6 py-6 md:py-8 flex justify-between items-center max-w-7xl mx-auto">
              <div><h1 className="text-2xl md:text-3xl font-display font-black tracking-tighter">Vinnx<span className="text-purple-600">AI</span></h1><p className="text-zinc-500 text-xs md:text-sm font-medium">Dashboard Compartilhado</p></div>
              <div className="flex items-center gap-3 md:gap-4 relative">
                <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-900 rounded-full text-zinc-500 transition-all active:scale-95">{isDarkMode ? <Sun size={20} /> : <Moon size={20} />}</button>
                <div className="relative"><button onClick={() => setIsNotificationsOpen(!isNotificationsOpen)} className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-900 rounded-full text-zinc-500 relative transition-all active:scale-95"><Bell size={20} />{notifications.filter(n => !n.read).length > 0 && <span className="absolute top-2 right-2 w-4 h-4 bg-rose-500 text-white text-[8px] font-black flex items-center justify-center rounded-full border-2 border-zinc-50 dark:border-zinc-900 animate-bounce">{notifications.filter(n => !n.read).length}</span>}</button></div>
                <Link to="/perfil" className="flex -space-x-3"><img src={userProfile.avatar} className="w-8 h-8 md:w-10 md:h-10 rounded-full border-2 border-zinc-50 dark:border-zinc-900 object-cover shadow-sm" alt={userProfile.name} />{familyMember && <img src={familyMember.avatar} className="w-8 h-8 md:w-10 md:h-10 rounded-full border-2 border-zinc-50 dark:border-zinc-900 object-cover shadow-sm" alt={familyMember.name} />}</Link>
              </div>
            </header>
            <div className="max-w-7xl mx-auto px-4 md:px-6">
              <Routes>
                <Route path="/" element={<Dashboard />} /><Route path="/dashboard" element={<Dashboard />} /><Route path="/financeiro" element={<Financeiro />} /><Route path="/cartoes" element={<Cartoes />} /><Route path="/investimentos" element={<Investimentos />} /><Route path="/contas" element={<Contas />} /><Route path="/agenda" element={<Agenda />} /><Route path="/metas" element={<Metas />} /><Route path="/wishlist" element={<Wishlist />} /><Route path="/projetos" element={<Projetos />} /><Route path="/anotacoes" element={<Anotacoes />} /><Route path="/vinnx-ai" element={<VinnxAIView />} /><Route path="/perfil" element={<Perfil isDarkMode={isDarkMode} onToggleTheme={() => setIsDarkMode(!isDarkMode)} />} />
              </Routes>
            </div>
          </main>
          <MobileBottomNav onOpenAdd={() => setIsAddModalOpen(true)} /><AddTransactionModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />
        </div>
      </Router>
    </FinanceContext.Provider>
  );
};

export default App;