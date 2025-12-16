import React, { useMemo, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { ICONS } from '../constants';
import { useStore } from '../context/StoreContext';

// --- Data Helpers ---

const getChartData = () => [
  { name: 'Seg', vendas: 4000, receber: 2400 },
  { name: 'Ter', vendas: 3000, receber: 1398 },
  { name: 'Qua', vendas: 2000, receber: 9800 },
  { name: 'Qui', vendas: 2780, receber: 3908 },
  { name: 'Sex', vendas: 1890, receber: 4800 },
  { name: 'Sab', vendas: 2390, receber: 3800 },
  { name: 'Dom', vendas: 3490, receber: 4300 },
];

const openWhatsApp = (phone: string, message: string = "") => {
    const cleanPhone = phone.replace(/\D/g, '');
    const finalPhone = cleanPhone.length <= 11 ? `55${cleanPhone}` : cleanPhone;
    window.open(`https://wa.me/${finalPhone}?text=${encodeURIComponent(message)}`, '_blank');
};

// --- Components ---

const StatCard = ({ title, value, subtext, icon: Icon, trend, colorClass = "text-white", onClick }: any) => (
  <div 
    onClick={onClick}
    className={`bg-zinc-900 border border-zinc-800 p-6 rounded-2xl relative overflow-hidden group hover:border-zinc-700 transition-all ${onClick ? 'cursor-pointer hover:bg-zinc-800/30' : ''}`}
  >
    <div className="flex justify-between items-start mb-4 relative z-10">
        <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 text-zinc-400 group-hover:text-white transition-colors">
            <Icon size={22} />
        </div>
        {trend && (
            <span className={`text-xs font-bold px-2 py-1 rounded-full border ${trend > 0 ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
                {trend > 0 ? '+' : ''}{trend}%
            </span>
        )}
    </div>
    <div className="relative z-10">
        <p className="text-zinc-500 text-sm font-medium mb-1">{title}</p>
        <h3 className={`text-2xl font-bold tracking-tight ${colorClass}`}>{value}</h3>
        {subtext && <p className="text-xs text-zinc-600 mt-2">{subtext}</p>}
    </div>
    {/* Decorative Background Blob */}
    <div className={`absolute -right-4 -bottom-4 w-24 h-24 rounded-full blur-3xl opacity-10 group-hover:opacity-20 transition-opacity ${colorClass.includes('red') || colorClass.includes('brand') ? 'bg-brand-600' : 'bg-zinc-500'}`} />
  </div>
);

const QuickAction = ({ icon: Icon, label, onClick, highlight = false }: any) => (
    <button 
        onClick={onClick}
        className={`flex flex-col items-center justify-center gap-3 p-4 rounded-xl border transition-all active:scale-[0.98] ${
            highlight 
            ? 'bg-brand-600 border-brand-500 text-white shadow-lg shadow-brand-900/30' 
            : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-white hover:border-zinc-700'
        }`}
    >
        <Icon size={24} />
        <span className="text-xs font-bold">{label}</span>
    </button>
);

export const Dashboard = () => {
  const navigate = useNavigate();
  const { clients, products, sales } = useStore(); // Global Context
  const [isBagsModalOpen, setIsBagsModalOpen] = useState(false);
  
  const birthdays = useMemo(() => {
    const today = new Date();
    const currentMonth = today.getMonth() + 1;
    const currentDay = today.getDate();

    return clients.filter(c => {
        if (!c.birthDate) return false;
        const [_, month, day] = c.birthDate.split('-').map(Number); // Assuming YYYY-MM-DD
        return month === currentMonth && day === currentDay;
    });
  }, [clients]);

  const metrics = useMemo(() => {
    const totalDebt = clients.reduce((acc, c) => acc + c.current_debt, 0);
    const totalInventory = products.reduce((acc, p) => acc + (p.sale_price * p.stock_quantity), 0);
    const activeBags = sales.filter(s => s.type === 'BAG' && s.status === 'PENDING').length;
    const monthlySales = sales
        .filter(s => s.type === 'SALE' && s.status === 'PAID')
        .reduce((acc, s) => acc + s.total_amount, 0);

    return { totalDebt, totalInventory, activeBags, monthlySales };
  }, [clients, products, sales]);

  const overdueClients = clients.filter(c => c.current_debt > 0).sort((a,b) => b.current_debt - a.current_debt).slice(0, 3); // Top 3 debtors
  const lowStock = products.filter(p => p.stock_quantity < 3).slice(0, 5);

  // Get active bags list for modal
  const activeBagsList = useMemo(() => {
    return sales.filter(s => s.type === 'BAG' && s.status === 'PENDING');
  }, [sales]);

  return (
    <div className="animate-fade-in space-y-8">
      
      {/* 1. Header & Quick Actions */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
        <div>
            <h1 className="text-3xl font-bold text-white mb-1">
                Olá, Admin <span className="text-2xl">👋</span>
            </h1>
            <p className="text-zinc-400 text-sm">
                {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full xl:w-auto">
            <QuickAction icon={ICONS.Plus} label="Nova Venda" onClick={() => navigate('/sales/new')} highlight={true} />
            <QuickAction icon={ICONS.Clients} label="Novo Cliente" onClick={() => navigate('/clients')} />
            <QuickAction icon={ICONS.Inventory} label="Add Produto" onClick={() => navigate('/inventory')} />
            <QuickAction icon={ICONS.Sales} label="Malinhas" onClick={() => navigate('/sales/history')} />
        </div>
      </div>

      {/* 2. KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard 
            title="Vendas (Mês)" 
            value={`R$ ${metrics.monthlySales.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} 
            icon={ICONS.Trending}
            trend={12}
            colorClass="text-white"
        />
        <StatCard 
            title="A Receber (Dívidas)" 
            value={`R$ ${metrics.totalDebt.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} 
            icon={ICONS.Alert}
            subtext={`${overdueClients.length} clientes pendentes`}
            colorClass="text-brand-500"
        />
        <StatCard 
            title="Valor em Estoque" 
            value={`R$ ${metrics.totalInventory.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`} 
            icon={ICONS.Inventory}
            colorClass="text-white"
        />
        <StatCard 
            title="Malinhas Ativas" 
            value={metrics.activeBags} 
            icon={ICONS.Sales}
            subtext="Toque para ver lista"
            colorClass="text-purple-400"
            onClick={() => setIsBagsModalOpen(true)}
        />
      </div>

      {/* 3. Main Grid Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          
          {/* LEFT COLUMN: Charts & Activity */}
          <div className="xl:col-span-2 space-y-6">
             
             {/* Chart */}
             <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-white flex items-center gap-2">
                        <ICONS.Trending size={20} className="text-zinc-500" />
                        Fluxo Financeiro
                    </h3>
                    <select className="bg-zinc-950 border border-zinc-800 text-xs rounded-lg px-2 py-1 text-zinc-400 focus:outline-none">
                        <option>Últimos 7 dias</option>
                    </select>
                </div>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={getChartData()}>
                        <defs>
                        <linearGradient id="colorVendas" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#dc2626" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#dc2626" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorReceber" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3f3f46" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#3f3f46" stopOpacity={0}/>
                        </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                        <XAxis dataKey="name" stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `R$${value}`} />
                        <Tooltip 
                            contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '12px', color: '#fff' }} 
                            itemStyle={{ color: '#fff' }}
                        />
                        <Area type="monotone" dataKey="vendas" stroke="#dc2626" strokeWidth={3} fillOpacity={1} fill="url(#colorVendas)" name="Vendas" />
                        <Area type="monotone" dataKey="receber" stroke="#71717a" strokeWidth={3} fillOpacity={1} fill="url(#colorReceber)" name="A Receber" />
                    </AreaChart>
                    </ResponsiveContainer>
                </div>
             </div>

             {/* Recent Activity */}
             <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-white">Últimas Movimentações</h3>
                    <button onClick={() => navigate('/sales/history')} className="text-xs text-brand-500 hover:text-brand-400 font-medium">Ver tudo</button>
                </div>
                <div className="space-y-4">
                    {sales.slice(0, 4).map((sale) => (
                        <div key={sale.id} className="flex items-center justify-between p-3 hover:bg-zinc-950/50 rounded-xl transition-colors border border-transparent hover:border-zinc-800 cursor-pointer">
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${sale.type === 'BAG' ? 'bg-purple-500/10 text-purple-500' : 'bg-green-500/10 text-green-500'}`}>
                                    {sale.type === 'BAG' ? <ICONS.Sales size={18} /> : <ICONS.Money size={18} />}
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-white">{sale.client_name}</p>
                                    <p className="text-xs text-zinc-500">
                                        {sale.type === 'BAG' ? 'Levou condicional' : 'Compra realizada'} • {new Date(sale.created_at).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}
                                    </p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className={`text-sm font-bold ${sale.type === 'BAG' ? 'text-zinc-300' : 'text-white'}`}>
                                    R$ {sale.total_amount.toFixed(2)}
                                </p>
                                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${sale.status === 'PAID' ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'}`}>
                                    {sale.status === 'PAID' ? 'Pago' : 'Pendente'}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
             </div>

          </div>

          {/* RIGHT COLUMN: Notifications & Alerts */}
          <div className="space-y-6">
            
            {/* Birthdays - Special Card */}
            <div className="bg-gradient-to-br from-brand-900/40 to-zinc-900 border border-brand-900/30 rounded-2xl p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <ICONS.Gift size={100} className="text-brand-500" />
                </div>
                <h3 className="font-bold text-white flex items-center gap-2 mb-4 relative z-10">
                    <ICONS.Gift className="text-brand-500" /> Aniversariantes do Dia
                </h3>
                
                {birthdays.length > 0 ? (
                    <div className="space-y-3 relative z-10">
                        {birthdays.map(client => (
                            <div key={client.id} className="bg-zinc-950/80 backdrop-blur-sm p-3 rounded-xl border border-zinc-800/50 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <img src={client.image_url} alt="" className="w-8 h-8 rounded-full bg-zinc-800 object-cover" />
                                    <span className="text-sm font-medium text-white">{client.name}</span>
                                </div>
                                <button 
                                    onClick={() => openWhatsApp(client.whatsapp, `Parabéns ${client.name}! Temos um presente especial para você na R Store hoje! 🎁`)}
                                    className="p-2 bg-brand-600 hover:bg-brand-500 text-white rounded-lg transition-colors shadow-lg shadow-brand-900/20"
                                >
                                    <ICONS.WhatsApp size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-6 relative z-10">
                        <p className="text-zinc-400 text-sm">Nenhum aniversariante hoje.</p>
                    </div>
                )}
            </div>

            {/* Overdue Payments */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                <div className="flex justify-between items-center mb-4">
                     <h3 className="font-bold text-white text-sm flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                        Pagamentos Pendentes
                     </h3>
                     <span className="text-xs text-zinc-500">{metrics.totalDebt > 0 ? 'Ação necessária' : 'Tudo certo'}</span>
                </div>
                {overdueClients.length > 0 ? (
                    <div className="space-y-3">
                        {overdueClients.map(client => (
                            <div key={client.id} className="flex items-center justify-between p-3 bg-zinc-950 rounded-xl border border-zinc-800">
                                <div>
                                    <p className="text-sm font-bold text-white">{client.name}</p>
                                    <p className="text-xs text-red-400 font-medium">Deve R$ {client.current_debt.toFixed(2)}</p>
                                </div>
                                <button 
                                    onClick={() => openWhatsApp(client.whatsapp, `Olá ${client.name}, tudo bem? Consta um pendência de R$ {client.current_debt.toFixed(2)} na R Store. Podemos agendar o pagamento?`)}
                                    className="text-xs text-zinc-400 hover:text-white border border-zinc-700 hover:bg-zinc-800 px-3 py-1.5 rounded-lg transition-colors"
                                >
                                    Cobrar
                                </button>
                            </div>
                        ))}
                        <button onClick={() => navigate('/clients')} className="w-full text-center text-xs text-zinc-500 hover:text-white mt-2 py-2">
                            Ver todos os devedores
                        </button>
                    </div>
                ) : (
                    <div className="text-center py-8 text-zinc-500 text-sm bg-zinc-950 rounded-xl border border-zinc-800 border-dashed">
                        <ICONS.Check className="mx-auto mb-2 text-green-500" />
                        Todos os pagamentos em dia!
                    </div>
                )}
            </div>

            {/* Low Stock Alert */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                <h3 className="font-bold text-white text-sm mb-4 flex items-center gap-2">
                    <ICONS.Alert className="text-yellow-500" size={16} /> Estoque Baixo
                </h3>
                {lowStock.length > 0 ? (
                    <div className="space-y-2">
                        {lowStock.map(p => (
                             <div key={p.id} className="flex justify-between items-center text-sm p-2 hover:bg-zinc-950 rounded-lg transition-colors">
                                <span className="text-zinc-300 truncate max-w-[150px]">{p.name}</span>
                                <span className="text-yellow-500 font-bold bg-yellow-500/10 px-2 py-0.5 rounded text-xs">
                                    Restam {p.stock_quantity}
                                </span>
                             </div>
                        ))}
                         <button onClick={() => navigate('/inventory')} className="w-full text-center text-xs text-zinc-500 hover:text-white mt-2 pt-2 border-t border-zinc-800">
                            Gerenciar Estoque
                        </button>
                    </div>
                ) : (
                    <p className="text-xs text-zinc-500">Níveis de estoque saudáveis.</p>
                )}
            </div>

          </div>
      </div>

      {/* ACTIVE BAGS MODAL */}
      {isBagsModalOpen && (
         <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl w-full max-w-md shadow-2xl relative">
                <button 
                    onClick={() => setIsBagsModalOpen(false)}
                    className="absolute top-4 right-4 text-zinc-500 hover:text-white"
                >
                    <ICONS.Close size={24} />
                </button>
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-purple-500/10 rounded-xl border border-purple-500/20 text-purple-500">
                        <ICONS.Sales size={24} />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white">Malinhas Ativas</h3>
                        <p className="text-sm text-zinc-400">Clientes com condicionais em aberto</p>
                    </div>
                </div>

                <div className="space-y-3 max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
                    {activeBagsList.length > 0 ? (
                        activeBagsList.map(sale => (
                            <div key={sale.id} className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 flex justify-between items-center group hover:border-purple-500/30 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-white text-sm">
                                        {sale.client_name?.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-white">{sale.client_name}</p>
                                        <p className="text-xs text-zinc-500">
                                            {new Date(sale.created_at).toLocaleDateString('pt-BR')} • {new Date(sale.created_at).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-bold text-purple-400">R$ {sale.total_amount.toFixed(2)}</p>
                                    <span className="text-[10px] bg-yellow-500/10 text-yellow-500 px-1.5 py-0.5 rounded border border-yellow-500/20">
                                        Pendente
                                    </span>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-8 text-zinc-500">
                            <ICONS.Check size={32} className="mx-auto mb-2 text-zinc-700" />
                            <p>Nenhuma malinha ativa no momento.</p>
                        </div>
                    )}
                </div>
                
                <div className="mt-6 pt-4 border-t border-zinc-800">
                    <button 
                        onClick={() => navigate('/sales/history')}
                        className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
                    >
                        <span>Gerenciar no Histórico</span>
                        <ICONS.ArrowRight size={16} />
                    </button>
                </div>
            </div>
         </div>
      )}
    </div>
  );
};