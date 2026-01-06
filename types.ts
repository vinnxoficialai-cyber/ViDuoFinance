// src/types.ts

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  date: string;
  account: string;
  status: string; 
  owner?: string;
  division?: string;
  isRecurring?: boolean;
}

export interface BankAccount {
  id: string;
  name: string;
  balance: number;
  color: string;
  owner?: string;
  lastDigits?: string;
  trend?: number;
  type?: string; // Adicionado para compatibilidade
}

export interface CreditCard {
  id: string;
  name: string;
  limit: number;
  used: number;
  bestDay: number;
  closingDay: number;
  color: string;
  brand: string;
  lastDigits: string;
  owner: string;
}

export interface InvestmentChange {
  date: string;
  previousValue: number;
  newValue: number;
  profit: number;
}

export interface Investment {
  id: string;
  name: string;
  type: string;
  contributedValue: number;
  currentValue: number;
  yieldMonth: number;
  institution: string;
  owner: string;
  history?: number[];
  changesHistory?: InvestmentChange[];
}

export interface WishlistItem {
  id: string;
  name: string;
  price: number;
  savedAmount: number;
  imageUrl: string;
  image?: string; // Adicionado para compatibilidade com App.tsx
  link?: string;  // Adicionado para compatibilidade
  priority: number | 'high' | 'medium' | 'low'; // Ajustado para aceitar texto ou número
  category: string;
  viability: 'green' | 'yellow' | 'red';
  targetMonth?: string;
}

export interface Goal {
  id: string;
  title: string;
  target: number;
  current: number;
  deadline: string;
  emoji?: string;
  color?: string;
  name?: string; // Compatibilidade: alguns componentes podem chamar de name ou title
}

export interface Project {
  id: string;
  title: string;
  name?: string; // Compatibilidade
  description: string;
  status: 'active' | 'completed' | 'on-hold';
  targetValue?: number;
  currentValue?: number;
  monthlySavings?: number;
  deadline?: string;
  imageUrl?: string;
  contributions?: any[];
  budget?: number; // Compatibilidade
  spent?: number;  // Compatibilidade
}

export interface Note {
  id: string;
  title: string;
  content: string;
  date: string;
  createdBy: string;
  color?: string;
  emoji?: string;
  reactions?: number;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'transaction' | 'account' | 'goal' | 'project' | 'note' | 'system' | 'alert' | 'info' | 'success';
  targetPath: string;
  timestamp: string;
  date?: string; // Adicionado alias para timestamp
  read: boolean;
  user?: {
    name: string;
    avatar: string;
  };
}

export interface CalendarEvent {
  id: string;
  title: string;
  type: 'finance' | 'social' | 'task' | 'bill' | 'reminder' | 'goal';
  owner: string;
  date: string;
  time?: string;
  description?: string;
}

export interface AppSettings {
  transactionCategories: string[];
  transactionStatus: { value: string; label: string }[];
  transactionDivision: { value: string; label: string }[];
  cardBrands: string[];
  investmentTypes: string[];
  accountColors: { value: string; label: string }[];
}