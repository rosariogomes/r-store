import React, { useMemo } from 'react';
import { useStore } from '../context/StoreContext';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Link } from 'react-router-dom';
import { DollarSign, Wallet, TrendingUp, Package, History, Gift, MessageCircle } from 'lucide-react';

const StatCard = ({ title, value, icon: Icon, color, to }: any) => (
  <Link to={to || '#'} className="block h-full">
    <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl hover:border-zinc-700 transition-all group cursor-pointer relative overflow-hidden h-full">
      {Icon && (
        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
          <Icon size={80} />
        </div>
      )}
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-zinc-400 text-sm font-medium mb-1">{title}</p>
          <h3 className={`text-2xl font-bold ${color}`}>{value}</h3>
        </div>
        <div className={`p-3 rounded-xl bg-zinc-950 border border-zinc-800 ${color.replace('text-', 'bg-opacity-10 ')}`}>
          {Icon && <Icon size={24} className={color} />}
        </div>
      </div>
    </div>
  </Link>
);

export const Dashboard = () => {
  const { sales, expenses, products, clients, storeConfig } = useStore();

  const summary = useMemo(() => {
    const safeSales = sales || [];
    const safeExpenses = expenses || [];
    const safeProducts = products || [];

    const totalRevenue = safeSales.filter(s => s.status === 'PAID').reduce((acc, curr) => acc + (curr.paid_amount || 0), 0);
    const pendingSales = safeSales.filter(s => s.status !== 'PAID' && s.status !== 'CANCELLED').reduce((acc, curr) => acc + ((curr.total_amount || 0) - (curr.paid_amount || 0)), 0);
    const totalExpenses = safeExpenses.reduce((acc, curr) => acc + (curr.amount || 0), 0);
    const profit = totalRevenue - totalExpenses;
    const totalStock = safeProducts.reduce((acc, curr) => acc + (curr.stock_quantity || 0), 0);

    return { totalRevenue, pendingSales, profit, totalStock };
  }, [sales, expenses, products]);

  // --- LÓGICA DE ANIVERSARIANTES ---
  const birthdays = useMemo(() => {
      if (!clients) return [];
      const today = new Date();
      const currentYear = today.getFullYear();
      
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      startOfWeek.setHours(0,0,0,0);
      
      const endOfWeek = new Date(today);
      endOfWeek.setDate(today.getDate() + (6 - today.getDay()));
      endOfWeek.setHours(23,59,59,999);

      return clients.filter(c => {
          if (!c.birthDate) return false;
          const [year, month, day] = c.birthDate.split('-').map(Number);
          // Mês no JS começa em 0 (Jan = 0)
          const bdayThisYear = new Date(currentYear, month - 1, day);
          
          return bdayThisYear >= startOfWeek && bdayThisYear <= endOfWeek;
      }).sort((a, b) => {
          const [, mA, dA] = (a.birthDate || '').split('-');
          const [, mB, dB] = (b.birthDate || '').split('-');
          return parseInt(dA) - parseInt(dB);
      });
  }, [clients]);

  const openBirthdayChat = (phone: string, name: string) => {
      if(!phone) return alert('Sem telefone cadastrado');
      const msg = storeConfig.birthday_message?.replace('{nome}', name) || `Parabéns ${name}!`;
      const num = phone.replace(/\D/g, '');
      window.open(`https://wa.me/55${num}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  // Chart Data
  const chartData = useMemo(() => {
    if (!sales) return [];
    const data = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString('en-CA');
      const daySales = sales.filter(s => {
            if (!s.created_at) return false;
            const saleDate = new Date(s.created_at).toLocaleDateString('en-CA');
            return saleDate === dateStr && s.status === 'PAID';
        }).reduce((acc, s) => acc + (s.paid_amount || 0), 0);
      data.push({ name: d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }), vendas: daySales });
    }
    return data;
  }, [sales]);

  const todayDate = new Date().getDate();

  return (
    <div className="pb-20 p-6 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Visão Geral</h1>
        <p className="text-zinc-400">Resumo da sua loja hoje.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard title="Faturamento" value={`R$ ${summary.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} icon={DollarSign} color="text-green-500" to="/reports" />
        <StatCard title="A Receber" value={`R$ ${summary.pendingSales.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} icon={Wallet} color="text-orange-500" to="/clients" />
        <StatCard title="Lucro Líquido" value={`R$ ${summary.profit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} icon={TrendingUp} color="text-blue-500" to="/reports" />
        <StatCard title="Estoque (Qtd)" value={summary.totalStock} icon={Package} color="text-purple-500" to="/inventory" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráfico */}
        <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <h3 className="font-bold text-white mb-4">Vendas da Semana</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                    <linearGradient id="colorVendas" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="name" stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} />
                
                {/* --- CORREÇÃO DO TOOLTIP AQUI --- */}
                <Tooltip 
                    contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', color: '#fff', borderRadius: '8px' }}
                    formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 'Vendas']}
                />
                
                <Area type="monotone" dataKey="vendas" stroke="#10b981" fill="url(#colorVendas)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Aniversariantes & Recentes */}
        <div className="flex flex-col gap-6">
            
            {/* CARD ANIVERSARIANTES */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col max-h-[300px]">
                <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                    <Gift size={20} className="text-pink-500" />
                    Aniversariantes (Semana)
                </h3>
                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-1">
                    {birthdays.length > 0 ? birthdays.map(client => {
                        const day = parseInt(client.birthDate?.split('-')[2] || '0');
                        const isToday = day === todayDate;

                        return (
                            <div key={client.id} className={`flex justify-between items-center p-3 rounded-xl border transition-all ${isToday ? 'bg-pink-600/20 border-pink-500' : 'bg-zinc-950 border-zinc-800'}`}>
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${isToday ? 'bg-pink-500 text-white animate-pulse' : 'bg-zinc-800 text-zinc-400'}`}>
                                        {day}
                                    </div>
                                    <div className="overflow-hidden">
                                        <p className={`font-bold text-sm truncate max-w-[100px] ${isToday ? 'text-white' : 'text-zinc-300'}`}>{client.name}</p>
                                        {isToday && <p className="text-[10px] text-pink-400 font-bold uppercase">É Hoje!</p>}
                                    </div>
                                </div>
                                <button 
                                    onClick={() => openBirthdayChat(client.phone, client.name)}
                                    className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors shadow-lg"
                                    title="Mandar Parabéns"
                                >
                                    <MessageCircle size={16} />
                                </button>
                            </div>
                        )
                    }) : (
                        <div className="flex flex-col items-center justify-center h-full text-zinc-500 opacity-50">
                            <Gift size={40} className="mb-2" />
                            <p className="text-xs">Nenhum aniversariante.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Recentes */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex-1">
                <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                    <History size={20} className="text-zinc-400" /> Vendas Recentes
                </h3>
                <div className="space-y-4 max-h-[200px] overflow-y-auto custom-scrollbar">
                    {(sales || []).slice(0, 3).map(sale => (
                    <div key={sale.id} className="flex justify-between items-center p-3 bg-zinc-950 rounded-xl border border-zinc-800">
                        <div>
                        <p className="text-white font-bold text-sm truncate max-w-[120px]">{sale.client_name}</p>
                        <p className="text-xs text-zinc-500">{new Date(sale.created_at).toLocaleDateString('pt-BR')}</p>
                        </div>
                        <div className="text-right">
                        <p className="text-white font-bold text-sm">R$ {(sale.total_amount || 0).toFixed(2)}</p>
                        <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${sale.status === 'PAID' ? 'text-green-500 bg-green-500/10' : 'text-orange-500 bg-orange-500/10'}`}>
                            {sale.status === 'PAID' ? 'PAGO' : 'PENDENTE'}
                        </span>
                        </div>
                    </div>
                    ))}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};