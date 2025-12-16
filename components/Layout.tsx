import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { ICONS } from '../constants';
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
  const { logout, storeConfig } = useStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen w-full bg-zinc-950 text-zinc-100 overflow-hidden font-sans">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r border-zinc-800 bg-zinc-950 p-6">
        <div className="flex items-center gap-3 mb-10 px-2">
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

        <nav className="flex-1 space-y-1.5 overflow-y-auto custom-scrollbar">
          <NavItem to="/" icon={ICONS.Dashboard} label="Dashboard" />
          <NavItem to="/sales/new" icon={ICONS.Plus} label="Nova Venda" />
          <NavItem to="/register" icon={ICONS.Wallet} label="Caixa" />
          <NavItem to="/catalog" icon={ICONS.Catalog} label="Catálogo" />
          <NavItem to="/clients" icon={ICONS.Clients} label="Clientes" />
          <NavItem to="/inventory" icon={ICONS.Inventory} label="Estoque" />
          <NavItem to="/expenses" icon={ICONS.Receipt} label="Despesas" />
          <NavItem to="/reports" icon={ICONS.Chart} label="Relatórios" />
          <NavItem to="/sales/history" icon={ICONS.Sales} label="Histórico" />
          <div className="pt-4 mt-4 border-t border-zinc-800">
             <NavItem to="/settings" icon={ICONS.Settings} label="Configurações" />
          </div>
        </nav>

        <div className="pt-6 border-t border-zinc-800">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full text-zinc-500 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-colors"
          >
            <ICONS.Logout size={20} />
            <span className="font-medium text-sm">Sair do Sistema</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative h-full">
        <div className="max-w-7xl mx-auto p-4 md:p-8 pb-24 md:pb-8">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-zinc-900 border-t border-zinc-800 px-4 py-3 flex justify-between items-center z-50">
        <NavLink to="/" className={({isActive}) => isActive ? "text-brand-600" : "text-zinc-500"}>
            <ICONS.Dashboard size={24} />
        </NavLink>
        <NavLink to="/catalog" className={({isActive}) => isActive ? "text-brand-600" : "text-zinc-500"}>
            <ICONS.Catalog size={24} />
        </NavLink>
        <NavLink to="/sales/new" className={({isActive}) => isActive ? "text-brand-600" : "text-zinc-500"}>
            <div className="bg-brand-600 p-3 rounded-full -mt-8 border-4 border-zinc-950 text-white shadow-lg shadow-brand-900/50">
              <ICONS.Plus size={24} />
            </div>
        </NavLink>
        <NavLink to="/expenses" className={({isActive}) => isActive ? "text-brand-600" : "text-zinc-500"}>
            <ICONS.Receipt size={24} />
        </NavLink>
        <NavLink to="/settings" className={({isActive}) => isActive ? "text-brand-600" : "text-zinc-500"}>
            <ICONS.Settings size={24} />
        </NavLink>
      </div>
    </div>
  );
};