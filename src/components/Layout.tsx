import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Users, Package, FileText, Settings, LogOut, 
  History, Grid3X3, PlusCircle, CreditCard, DollarSign,
  ChevronLeft, ChevronRight // Ícones novos para o botão
} from 'lucide-react';
import { useStore } from '../context/StoreContext';

// Componente NavItem atualizado para receber o estado 'isCollapsed'
const NavItem = ({ to, icon: Icon, label, isCollapsed }: { to: string; icon: any; label: string; isCollapsed: boolean }) => {
  return (
    <NavLink
      to={to}
      title={isCollapsed ? label : ''} // Mostra tooltip nativo se estiver fechado
      className={({ isActive }) =>
        `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative ${
          isActive
            ? 'bg-brand-600/10 text-brand-600'
            : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800'
        } ${isCollapsed ? 'justify-center' : ''}`
      }
    >
      <Icon size={20} className="stroke-[2px] shrink-0" />
      
      {/* Oculta o texto com animação suave */}
      <span className={`font-medium text-sm whitespace-nowrap overflow-hidden transition-all duration-300 ${
          isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'
      }`}>
          {label}
      </span>
    </NavLink>
  );
};

export const Layout = ({ children }: { children?: React.ReactNode }) => {
  const { logout, storeConfig, user } = useStore();
  const navigate = useNavigate();
  
  // Estado para controlar se o menu está colapsado ou não
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen w-full bg-zinc-950 text-zinc-100 overflow-hidden font-sans">
      
      {/* Desktop Sidebar com largura dinâmica */}
      <aside 
        className={`hidden md:flex flex-col border-r border-zinc-800 bg-zinc-950 transition-all duration-300 ease-in-out ${
            isCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        
        {/* Brand Header */}
        <div className={`p-6 flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} relative`}>
          <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center shadow-lg shadow-brand-900/30 overflow-hidden shrink-0 transition-all">
             {storeConfig.logo_url ? (
                <img src={storeConfig.logo_url} alt="Logo" className="w-full h-full object-cover" />
             ) : (
                <span className="font-bold text-white text-xl">{storeConfig.name.charAt(0)}</span>
             )}
          </div>
          
          <div className={`flex flex-col min-w-0 transition-all duration-300 overflow-hidden ${
              isCollapsed ? 'w-0 opacity-0 absolute' : 'w-auto opacity-100'
          }`}>
             <span className="text-lg font-bold tracking-tight text-white leading-none truncate">{storeConfig.name}</span>
             <span className="text-[10px] text-zinc-500 mt-1 uppercase tracking-wider">Manager</span>
          </div>

          {/* Botão de Toggle (Colapsar) */}
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="absolute -right-3 top-8 bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-white rounded-full p-1 shadow-xl hover:scale-110 transition-all z-20"
          >
              {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1.5 px-3 overflow-y-auto custom-scrollbar overflow-x-hidden">
          <NavItem to="/" icon={LayoutDashboard} label="Dashboard" isCollapsed={isCollapsed} />
          <NavItem to="/sales/new" icon={PlusCircle} label="Nova Venda" isCollapsed={isCollapsed} />
          <NavItem to="/cash-register" icon={CreditCard} label="Caixa" isCollapsed={isCollapsed} />
          
          <div className="my-2 border-t border-zinc-800/50" />
          
          <NavItem to="/catalog" icon={Grid3X3} label="Catálogo Digital" isCollapsed={isCollapsed} />
          <NavItem to="/sales" icon={History} label="Histórico Vendas" isCollapsed={isCollapsed} />
          
          <div className="my-2 border-t border-zinc-800/50" />

          <NavItem to="/clients" icon={Users} label="Clientes" isCollapsed={isCollapsed} />
          <NavItem to="/inventory" icon={Package} label="Estoque" isCollapsed={isCollapsed} />
          <NavItem to="/expenses" icon={DollarSign} label="Despesas" isCollapsed={isCollapsed} />
          <NavItem to="/reports" icon={FileText} label="Relatórios" isCollapsed={isCollapsed} />
          
          <div className={`pt-4 mt-4 border-t border-zinc-800 ${isCollapsed ? 'flex justify-center' : ''}`}>
             <NavItem to="/settings" icon={Settings} label="Configurações" isCollapsed={isCollapsed} />
          </div>
        </nav>

        {/* User Footer */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-900/30">
          <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} mb-4 px-2 transition-all`}>
              <div className="w-10 h-10 rounded-full bg-zinc-800 overflow-hidden border border-zinc-700 shrink-0">
                  {user?.avatar_url ? (
                      <img src={user.avatar_url} alt="User" className="w-full h-full object-cover" />
                  ) : (
                      <div className="w-full h-full flex items-center justify-center bg-zinc-800 text-zinc-500">
                          <Users size={20} />
                      </div>
                  )}
              </div>
              
              <div className={`flex-1 overflow-hidden transition-all duration-300 ${
                  isCollapsed ? 'w-0 opacity-0 hidden' : 'w-auto opacity-100'
              }`}>
                  <p className="text-sm font-bold text-white truncate">{user?.name || 'Usuário'}</p>
                  <span className={`text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded ${
                      user?.role === 'GESTOR' ? 'bg-red-500/20 text-red-400' :
                      user?.role === 'ADMIN' ? 'bg-blue-500/20 text-blue-400' :
                      'bg-zinc-800 text-zinc-400'
                  }`}>
                      {user?.role || 'Visitante'}
                  </span>
              </div>
          </div>

          <button 
            onClick={handleLogout}
            title={isCollapsed ? "Sair do Sistema" : ""}
            className={`flex items-center gap-2 px-4 py-2 w-full text-zinc-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors text-sm font-medium ${
                isCollapsed ? 'justify-center' : ''
            }`}
          >
            <LogOut size={18} className="shrink-0" />
            <span className={`whitespace-nowrap overflow-hidden transition-all duration-300 ${
                isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'
            }`}>
                Sair do Sistema
            </span>
          </button>
        </div>
      </aside>

      {/* Main Content (Área da direita) */}
      {/* O flex-1 fará ele ocupar todo o espaço restante automaticamente */}
      <main className="flex-1 overflow-y-auto relative h-full bg-black transition-all duration-300">
        <div className="max-w-7xl mx-auto p-4 md:p-8 pb-24 md:pb-8">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Nav (Sem alterações) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-zinc-950 border-t border-zinc-800 px-4 py-3 flex justify-between items-center z-50">
        <NavLink to="/" className={({isActive}) => isActive ? "text-brand-600" : "text-zinc-500"}>
            <LayoutDashboard size={24} />
        </NavLink>
        <NavLink to="/catalog" className={({isActive}) => isActive ? "text-brand-600" : "text-zinc-500"}>
            <Grid3X3 size={24} />
        </NavLink>
        <NavLink to="/sales/new" className={({isActive}) => isActive ? "text-brand-600" : "text-zinc-500"}>
            <div className="bg-brand-600 p-3 rounded-full -mt-8 border-4 border-zinc-950 text-white shadow-lg shadow-brand-900/50">
              <PlusCircle size={24} />
            </div>
        </NavLink>
        <NavLink to="/sales" className={({isActive}) => isActive ? "text-brand-600" : "text-zinc-500"}>
            <History size={24} />
        </NavLink>
        <NavLink to="/settings" className={({isActive}) => isActive ? "text-brand-600" : "text-zinc-500"}>
            <Settings size={24} />
        </NavLink>
      </div>
    </div>
  );
};