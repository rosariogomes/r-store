import React, { useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { User, Lock, Upload, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom'; // <--- IMPORTANTE

export const Login = () => {
  const { login, register, user } = useStore(); // Pegamos 'user' também
  const navigate = useNavigate(); // Hook de navegação
  
  const [isRegistering, setIsRegistering] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [cpf, setCpf] = useState('');
  const [avatar, setAvatar] = useState<File | null>(null);

  // Efeito de Redirecionamento Automático
  // Se o contexto detectar que tem usuário, manda pro Dashboard na hora
  useEffect(() => {
    if (user) {
        console.log("Usuário detectado, redirecionando...");
        navigate('/');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (isRegistering) {
        let role: 'GESTOR' | 'STANDARD' = 'STANDARD';
        if (email.toLowerCase() === 'sidney.lucena@gmail.com') role = 'GESTOR';
        
        const { error } = await register(email, password, { name, cpf, role, avatarFile: avatar || undefined });
        if (error) {
            alert(error);
        } else {
            alert("Cadastro realizado! O sistema fará o login automático.");
            // O próprio contexto vai atualizar o 'user' e o useEffect acima vai redirecionar
        }
    } else {
        const { error } = await login(email, password);
        if (error) {
            alert("Erro: " + error);
        } else {
            // Sucesso! Força a navegação
            navigate('/');
        }
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="text-center mb-8">
            <div className="w-16 h-16 bg-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4 text-white font-bold text-2xl">R</div>
            <h1 className="text-2xl font-bold text-white">{isRegistering ? 'Criar Conta' : 'Acessar Sistema'}</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
            {isRegistering && (
                <>
                    <input type="text" placeholder="Nome" className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white" value={name} onChange={e => setName(e.target.value)} />
                    <input type="text" placeholder="CPF" className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white" value={cpf} onChange={e => setCpf(e.target.value)} />
                    <input type="file" className="w-full text-white" onChange={e => setAvatar(e.target.files?.[0] || null)} />
                </>
            )}
            <div className="relative">
                <User className="absolute left-3 top-3 text-zinc-500" size={18} />
                <input type="email" placeholder="Email" className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 pl-10 text-white" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div className="relative">
                <Lock className="absolute left-3 top-3 text-zinc-500" size={18} />
                <input type="password" placeholder="Senha" className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 pl-10 text-white" value={password} onChange={e => setPassword(e.target.value)} />
            </div>

            <button type="submit" disabled={isLoading} className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl flex justify-center gap-2">
                {isLoading ? <Loader2 className="animate-spin" /> : (isRegistering ? 'Cadastrar' : 'Entrar')}
            </button>
        </form>
        <button onClick={() => setIsRegistering(!isRegistering)} className="w-full mt-4 text-sm text-zinc-500 hover:text-white">
            {isRegistering ? 'Já tem conta? Login' : 'Criar conta'}
        </button>
      </div>
    </div>
  );
};