import { BankAccount, Transaction, CreditCard, Goal, Note, WishlistItem, Project, Investment, CalendarEvent } from './types';

// DADOS PARA OS GRÁFICOS (Isso corrige o erro do Dashboard)
export const MOCK_CHART_DATA = [
  { name: 'Jan', entrada1: 4000, entrada2: 2400, gastos: 2400 },
  { name: 'Fev', entrada1: 3000, entrada2: 1398, gastos: 2210 },
  { name: 'Mar', entrada1: 2000, entrada2: 9800, gastos: 2290 },
  { name: 'Abr', entrada1: 2780, entrada2: 3908, gastos: 2000 },
  { name: 'Mai', entrada1: 1890, entrada2: 4800, gastos: 2181 },
  { name: 'Jun', entrada1: 2390, entrada2: 3800, gastos: 2500 },
  { name: 'Jul', entrada1: 3490, entrada2: 4300, gastos: 2100 },
];

// DADOS INICIAIS (Isso corrige os erros do App.tsx)
export const INITIAL_ACCOUNTS: BankAccount[] = [
  { id: '1', name: 'Conta Principal', balance: 0, color: 'purple', type: 'checking' },
];

export const INITIAL_TRANSACTIONS: Transaction[] = [];

export const INITIAL_CREDIT_CARDS: CreditCard[] = [];

export const INITIAL_GOALS: Goal[] = [];

export const INITIAL_NOTES: Note[] = [];

export const INITIAL_WISHLIST: WishlistItem[] = [];

export const INITIAL_PROJECTS: Project[] = [];

export const INITIAL_INVESTMENTS: Investment[] = [];

export const INITIAL_EVENTS: CalendarEvent[] = [];