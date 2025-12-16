import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { ICONS } from '../constants';

export const Login = () => {
  const navigate = useNavigate();
  const { login, storeConfig } = useStore();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Simulated Authentication
    setTimeout(() => {
        if (email === 'admin' && password === 'admin') {
            login();
            navigate('/');
        } else {
            setError('Credenciais inválidas. Tente admin/admin');
            setIsLoading(false);
        }
    }, 800);
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute top-[-20%] left-[-20%] w-[500px] h-[500px] bg-brand-600/20 rounded-full blur-[128px]" />
        <div className="absolute bottom-[-20%] right-[-20%] w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[128px]" />

        <div className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-3xl p-8 md:p-12 shadow-2xl relative z-10 animate-fade-in">
            <div className="text-center mb-10">
                <div className="w-20 h-20 bg-zinc-900 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-brand-900/40 border border-zinc-800 overflow-hidden">
                    {storeConfig.logo_url ? (
                         <img src={storeConfig.logo_url} alt="Logo" className="w-full h-full object-cover" />
                    ) : (
                         <span className="text-3xl font-bold text-white">{storeConfig.name.charAt(0)}</span>
                    )}
                </div>
                <h1 className="text-3xl font-bold text-white mb-2">{storeConfig.name}</h1>
                <p className="text-zinc-500">{storeConfig.subtitle}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="text-xs font-bold text-zinc-500 uppercase mb-2 block tracking-wider">Usuário</label>
                    <div className="relative">
                        <ICONS.Clients className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={20} />
                        <input 
                            type="text" 
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-3.5 pl-12 pr-4 text-white focus:outline-none focus:border-brand-600 focus:bg-zinc-900/80 transition-all"
                            placeholder="admin"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                </div>

                <div>
                    <label className="text-xs font-bold text-zinc-500 uppercase mb-2 block tracking-wider">Senha</label>
                    <div className="relative">
                        <ICONS.Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={20} />
                        <input 
                            type="password" 
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-3.5 pl-12 pr-4 text-white focus:outline-none focus:border-brand-600 focus:bg-zinc-900/80 transition-all"
                            placeholder="••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                </div>

                {error && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm text-center font-medium">
                        {error}
                    </div>
                )}

                <button 
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-4 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-xl shadow-lg shadow-brand-900/30 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                >
                    {isLoading ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                        <span>Entrar no Sistema</span>
                    )}
                </button>
            </form>

            <p className="mt-8 text-center text-zinc-600 text-xs">
                &copy; {new Date().getFullYear()} {storeConfig.name}. Todos os direitos reservados.
            </p>
        </div>
    </div>
  );
};