import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Users, Package, FileText, Settings, LogOut, 
  History, Grid3X3, PlusCircle, CreditCard, DollarSign,
  ChevronLeft, ChevronRight, Menu, X
} from 'lucide-react';
import { useStore } from '../context/StoreContext';

// Componente NavItem Desktop
const NavItem = ({ to, icon: Icon, label, isCollapsed }: { to: string; icon: any; label: string; isCollapsed: boolean }) => {
  return (
    <NavLink
      to={to}
      title={isCollapsed ? label : ''}
      className={({ isActive }) =>
        `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative ${
          isActive
            ? 'bg-brand-600/10 text-brand-600'
            : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800'
        } ${isCollapsed ? 'justify-center' : ''}`
      }
    >
      <Icon size={20} className="stroke-[2px] shrink-0" />
      <span className={`font-medium text-sm whitespace-nowrap overflow-hidden transition-all duration-300 ${
          isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'
      }`}>
          {label}
      </span>
    </NavLink>
  );
};

// Item do Menu Mobile (Grid)
const MobileMenuItem = ({ to, icon: Icon, label, onClick }: { to: string; icon: any; label: string, onClick: () => void }) => {
    return (
        <NavLink 
            to={to} 
            onClick={onClick}
            className={({ isActive }) => `
                flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border transition-all
                ${isActive 
                    ? 'bg-brand-600 border-brand-500 text-white shadow-lg shadow-brand-900/50' 
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-white'}
            `}
        >
            <Icon size={24} />
            <span className="text-xs font-bold">{label}</span>
        </NavLink>
    )
}

export const Layout = ({ children }: { children?: React.ReactNode }) => {
  const { logout, storeConfig, user } = useStore();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Fecha o menu mobile se mudar de rota
  React.useEffect(() => {
      setIsMobileMenuOpen(false);
  }, [location]);

  return (
    <div className="flex h-screen w-full bg-zinc-950 text-zinc-100 overflow-hidden font-sans">
      
      {/* --- DESKTOP SIDEBAR (Inalterada) --- */}
      <aside 
        className={`hidden md:flex flex-col border-r border-zinc-800 bg-zinc-950 transition-all duration-300 ease-in-out ${
            isCollapsed ? 'w-20' : 'w-64'
        }`}
      >
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

          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="absolute -right-3 top-8 bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-white rounded-full p-1 shadow-xl hover:scale-110 transition-all z-20"
          >
              {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        </div>

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

        <div className="p-4 border-t border-zinc-800 bg-zinc-900/30">
          <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} mb-4 px-2 transition-all`}>
              <div className="w-10 h-10 rounded-full bg-zinc-800 overflow-hidden border border-zinc-700 shrink-0">
                  {user?.avatar_url ? <img src={user.avatar_url} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center bg-zinc-800 text-zinc-500"><Users size={20} /></div>}
              </div>
              <div className={`flex-1 overflow-hidden transition-all duration-300 ${isCollapsed ? 'w-0 opacity-0 hidden' : 'w-auto opacity-100'}`}>
                  <p className="text-sm font-bold text-white truncate">{user?.name || 'Usuário'}</p>
                  <span className="text-[10px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded">{user?.role || 'Visitante'}</span>
              </div>
          </div>
          <button onClick={handleLogout} title={isCollapsed ? "Sair" : ""} className={`flex items-center gap-2 px-4 py-2 w-full text-zinc-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors text-sm font-medium ${isCollapsed ? 'justify-center' : ''}`}>
            <LogOut size={18} className="shrink-0" />
            <span className={`whitespace-nowrap overflow-hidden transition-all duration-300 ${isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>Sair do Sistema</span>
          </button>
        </div>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 overflow-y-auto relative h-full bg-black transition-all duration-300">
        <div className="max-w-7xl mx-auto p-4 md:p-8 pb-24 md:pb-8">
          {children}
        </div>
      </main>

      {/* --- MOBILE MENU OVERLAY (Tela Cheia quando aberto) --- */}
      {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col animate-fade-in md:hidden">
              <div className="flex justify-between items-center p-6 border-b border-zinc-800">
                  <span className="text-xl font-bold text-white">Menu Completo</span>
                  <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 bg-zinc-900 rounded-full text-zinc-400 hover:text-white">
                      <X size={24} />
                  </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 grid grid-cols-2 gap-4 content-start">
                  <MobileMenuItem to="/sales" icon={History} label="Histórico" onClick={() => setIsMobileMenuOpen(false)} />
                  <MobileMenuItem to="/clients" icon={Users} label="Clientes" onClick={() => setIsMobileMenuOpen(false)} />
                  <MobileMenuItem to="/inventory" icon={Package} label="Estoque" onClick={() => setIsMobileMenuOpen(false)} />
                  <MobileMenuItem to="/expenses" icon={DollarSign} label="Despesas" onClick={() => setIsMobileMenuOpen(false)} />
                  <MobileMenuItem to="/reports" icon={FileText} label="Relatórios" onClick={() => setIsMobileMenuOpen(false)} />
                  <MobileMenuItem to="/settings" icon={Settings} label="Configurações" onClick={() => setIsMobileMenuOpen(false)} />
              </div>

              <div className="p-6 border-t border-zinc-800">
                  <button onClick={handleLogout} className="w-full py-4 bg-zinc-900 text-red-500 font-bold rounded-xl flex items-center justify-center gap-2">
                      <LogOut size={20} /> Sair do App
                  </button>
              </div>
          </div>
      )}

      {/* --- MOBILE BOTTOM NAV (Barra Inferior Fixa) --- */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-zinc-950 border-t border-zinc-800 px-2 py-2 flex justify-between items-end z-40 pb-safe">
        <NavLink to="/" className={({isActive}) => `flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${isActive ? "text-brand-600" : "text-zinc-500"}`}>
            <LayoutDashboard size={22} />
            <span className="text-[10px] font-medium">Início</span>
        </NavLink>
        
        <NavLink to="/cash-register" className={({isActive}) => `flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${isActive ? "text-brand-600" : "text-zinc-500"}`}>
            <CreditCard size={22} />
            <span className="text-[10px] font-medium">Caixa</span>
        </NavLink>

        <NavLink to="/sales/new" className="relative -top-5">
            <div className="bg-brand-600 p-4 rounded-full border-4 border-zinc-950 text-white shadow-lg shadow-brand-900/50 transform hover:scale-105 transition-all">
              <PlusCircle size={28} />
            </div>
        </NavLink>

        <NavLink to="/catalog" className={({isActive}) => `flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${isActive ? "text-brand-600" : "text-zinc-500"}`}>
            <Grid3X3 size={22} />
            <span className="text-[10px] font-medium">Catálogo</span>
        </NavLink>

        <button 
            onClick={() => setIsMobileMenuOpen(true)} 
            className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${isMobileMenuOpen ? "text-white" : "text-zinc-500"}`}
        >
            <Menu size={22} />
            <span className="text-[10px] font-medium">Menu</span>
        </button>
      </div>
    </div>
  );
};