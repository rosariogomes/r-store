import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, ShoppingCart, Users, Package, FileText, Settings, LogOut, 
  DollarSign, ListChecks, Receipt, PlusCircle, CreditCard
} from 'lucide-react';
import { useStore } from '../context/StoreContext';

const NavItem = ({ to, icon: Icon, label }: { to: string; icon: any; label: string }) => {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
          isActive
            ? 'bg-brand-600/10 text-brand-600'
            : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800'
        }`
      }
    >
      <Icon size={20} className="stroke-[2px]" />
      <span className="font-medium text-sm">{label}</span>
    </NavLink>
  );
};

export const Layout = ({ children }: { children?: React.ReactNode }) => {
  const { logout, storeConfig, user } = useStore(); // Agora pegamos o 'user' do contexto
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen w-full bg-zinc-950 text-zinc-100 overflow-hidden font-sans">
      
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r border-zinc-800 bg-zinc-950">
        
        {/* Brand Header */}
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center shadow-lg shadow-brand-900/30 overflow-hidden shrink-0">
             {storeConfig.logo_url ? (
                <img src={storeConfig.logo_url} alt="Logo" className="w-full h-full object-cover" />
             ) : (
                <span className="font-bold text-white text-xl">{storeConfig.name.charAt(0)}</span>
             )}
          </div>
          <div className="flex flex-col min-w-0">
             <span className="text-lg font-bold tracking-tight text-white leading-none truncate">{storeConfig.name}</span>
             <span className="text-[10px] text-zinc-500 mt-1 uppercase tracking-wider">Manager</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1.5 px-4 overflow-y-auto custom-scrollbar">
          <NavItem to="/" icon={LayoutDashboard} label="Dashboard" />
          <NavItem to="/sales/new" icon={PlusCircle} label="Nova Venda" />
          <NavItem to="/cash-register" icon={CreditCard} label="Caixa" /> {/* Ajuste a rota se necessário */}
          <NavItem to="/sales" icon={ListChecks} label="Catálogo / Histórico" />
          <NavItem to="/clients" icon={Users} label="Clientes" />
          <NavItem to="/inventory" icon={Package} label="Estoque" />
          <NavItem to="/expenses" icon={DollarSign} label="Despesas" />
          <NavItem to="/reports" icon={FileText} label="Relatórios" />
          
          <div className="pt-4 mt-4 border-t border-zinc-800">
             <NavItem to="/settings" icon={Settings} label="Configurações" />
          </div>
        </nav>

        {/* User Footer (NOVO) */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-900/30">
          <div className="flex items-center gap-3 mb-4 px-2">
              <div className="w-10 h-10 rounded-full bg-zinc-800 overflow-hidden border border-zinc-700 shrink-0">
                  {user?.avatar_url ? (
                      <img src={user.avatar_url} alt="User" className="w-full h-full object-cover" />
                  ) : (
                      // Silhueta Padrão
                      <div className="w-full h-full flex items-center justify-center bg-zinc-800 text-zinc-500">
                          <Users size={20} />
                      </div>
                  )}
              </div>
              <div className="flex-1 overflow-hidden">
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
            className="flex items-center gap-2 px-4 py-2 w-full text-zinc-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors text-sm font-medium"
          >
            <LogOut size={18} />
            <span>Sair do Sistema</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative h-full bg-black">
        <div className="max-w-7xl mx-auto p-4 md:p-8 pb-24 md:pb-8">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-zinc-950 border-t border-zinc-800 px-4 py-3 flex justify-between items-center z-50">
        <NavLink to="/" className={({isActive}) => isActive ? "text-brand-600" : "text-zinc-500"}>
            <LayoutDashboard size={24} />
        </NavLink>
        <NavLink to="/inventory" className={({isActive}) => isActive ? "text-brand-600" : "text-zinc-500"}>
            <Package size={24} />
        </NavLink>
        <NavLink to="/sales/new" className={({isActive}) => isActive ? "text-brand-600" : "text-zinc-500"}>
            <div className="bg-brand-600 p-3 rounded-full -mt-8 border-4 border-zinc-950 text-white shadow-lg shadow-brand-900/50">
              <PlusCircle size={24} />
            </div>
        </NavLink>
        <NavLink to="/expenses" className={({isActive}) => isActive ? "text-brand-600" : "text-zinc-500"}>
            <Receipt size={24} />
        </NavLink>
        <NavLink to="/settings" className={({isActive}) => isActive ? "text-brand-600" : "text-zinc-500"}>
            <Settings size={24} />
        </NavLink>
      </div>
    </div>
  );
};