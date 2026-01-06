import React, { useState } from 'react';
import { HeartHandshake, Mail, Lock, ArrowRight, AlertCircle } from 'lucide-react';
import { supabase } from '../supabaseClient'; // Importamos a conexão real

interface LoginProps {
  onLogin: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Aqui acontece a mágica: enviamos email/senha para o Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (error) {
        // Se der erro (senha errada ou usuário não existe)
        setError('Acesso negado. Verifique seu e-mail e senha.');
        console.error('Erro de Login:', error.message);
      } else {
        // Se der certo
        onLogin();
      }
    } catch (err) {
      setError('Ocorreu um erro inesperado de conexão.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Orbes de fundo para profundidade */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 rounded-full blur-[120px] pointer-events-none animate-pulse"></div>

      <div className="w-full max-w-[420px] z-10 animate-in fade-in zoom-in-95 duration-700">
        {/* TÍTULO E ASSINATURA CENTRALIZADOS */}
        <div className="text-center mb-10">
          {/* Ícone com Degradê Suave */}
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-tr from-pink-500/20 via-emerald-500/20 to-blue-500/20 p-[1px] mb-4 shadow-inner">
            <div className="w-full h-full bg-slate-950/40 rounded-3xl flex items-center justify-center backdrop-blur-sm border border-white/5">
              <HeartHandshake className="text-emerald-400" size={38} />
            </div>
          </div>

          {/* Nome do SaaS */}
          <h1 className="text-4xl font-black text-white mb-1 tracking-tighter">
            Duo<span className="text-emerald-500">Finance</span>
          </h1>

          {/* Assinatura Vinnx */}
          <div className="flex items-center justify-center gap-1.5">
            <span className="h-[1px] w-4 bg-slate-800"></span>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em]">
              By <span className="text-slate-300">Vinnx</span>
            </p>
            <span className="h-[1px] w-4 bg-slate-800"></span>
          </div>
          
          <p className="mt-4 text-slate-400 text-sm font-medium max-w-[250px] mx-auto">
            Gestão financeira inteligente para quem planeja o futuro a dois.
          </p>
        </div>

        {/* Card do Formulário de Login */}
        <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 p-8 rounded-[2.5rem] shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-2xl flex items-center gap-3 animate-in slide-in-from-top-2 duration-300">
                <AlertCircle className="text-rose-500 shrink-0" size={18} />
                <p className="text-[11px] font-bold text-rose-500 uppercase tracking-wider">{error}</p>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] ml-2">E-mail do Casal</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-500 transition-colors" size={18} />
                <input 
                  required
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="w-full bg-slate-950/50 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/40 transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] ml-2">Senha</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-500 transition-colors" size={18} />
                <input 
                  required
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950/50 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/40 transition-all"
                />
              </div>
            </div>

            <div className="space-y-4">
              <button 
                type="submit"
                disabled={isLoading}
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-emerald-500/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 group"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-slate-950/20 border-t-slate-950 rounded-full animate-spin"></div>
                ) : (
                  <>
                    Entrar no Dashboard
                    <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>

              <button 
                type="button" 
                className="w-full text-center text-[10px] font-bold text-slate-500 hover:text-emerald-500 uppercase tracking-widest transition-colors"
              >
                Esqueceu senha?
              </button>
            </div>
          </form>
        </div>

        <div className="mt-8 text-center space-y-2">
           <p className="text-slate-500 text-xs">
             Não tem uma conta conjunta? <button className="text-emerald-500 font-bold hover:underline">Adquirir plano agora</button>
           </p>
           <p className="text-[10px] text-slate-600 font-medium">©DuoFinance V1.0.0 2026</p>
        </div>
      </div>
    </div>
  );
};

export default Login;