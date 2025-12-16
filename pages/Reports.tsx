import React, { useMemo } from 'react';
import { 
  AreaChart, Area, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, BarChart, Bar 
} from 'recharts';
import { ICONS } from '../constants';
import { useStore } from '../context/StoreContext';

const PAYMENT_DATA_MOCK = [
  { name: 'Pix', value: 45, color: '#10b981' }, 
  { name: 'Crédito', value: 30, color: '#dc2626' }, 
  { name: 'Dinheiro', value: 15, color: '#f59e0b' }, 
  { name: 'Débito', value: 10, color: '#3b82f6' }, 
];

export const Reports = () => {
  const { sales, expenses, products, clients } = useStore();

  // --- Calculations for DRE (Demonstração do Resultado do Exercício) ---
  const dre = useMemo(() => {
    // 1. Receita Bruta (Vendas Pagas)
    const grossRevenue = sales
        .filter(s => s.status === 'PAID')
        .reduce((acc, s) => acc + s.paid_amount, 0);

    // 2. CMV (Custo da Mercadoria Vendida) - Estimated
    // We iterate over sold items in Paid sales
    let cmv = 0;
    sales.filter(s => s.status === 'PAID').forEach(sale => {
        sale.items.forEach(item => {
            // Find current cost price of product
            const product = products.find(p => p.id === item.product_id);
            if (product) {
                cmv += product.cost_price * item.quantity;
            }
        });
    });

    const grossProfit = grossRevenue - cmv;

    // 3. Despesas Operacionais
    const operationalExpenses = expenses.reduce((acc, e) => acc + e.amount, 0);

    // 4. Lucro Líquido
    const netProfit = grossProfit - operationalExpenses;

    // Margin
    const margin = grossRevenue > 0 ? (netProfit / grossRevenue) * 100 : 0;

    return { grossRevenue, cmv, grossProfit, operationalExpenses, netProfit, margin };
  }, [sales, expenses, products]);

  // --- Top Products Calculation ---
  const topProducts = useMemo(() => {
      const counts: {[key: string]: number} = {};
      sales.filter(s => s.status === 'PAID').forEach(s => {
          s.items.forEach(i => {
              counts[i.product_id] = (counts[i.product_id] || 0) + i.quantity;
          });
      });
      return Object.entries(counts)
        .map(([id, qty]) => {
            const prod = products.find(p => p.id === id);
            return prod ? { ...prod, soldQty: qty } : null;
        })
        .filter(Boolean)
        .sort((a, b) => (b?.soldQty || 0) - (a?.soldQty || 0))
        .slice(0, 5);
  }, [sales, products]);

  return (
    <div className="animate-fade-in pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Relatórios Gerenciais</h1>
          <p className="text-zinc-400">Análise de desempenho, DRE e saúde financeira.</p>
        </div>
        <div className="flex bg-zinc-900 border border-zinc-800 rounded-xl p-1">
            <button className="px-4 py-2 bg-zinc-800 text-white rounded-lg text-sm font-medium shadow">Geral</button>
            <button className="px-4 py-2 text-zinc-400 hover:text-white rounded-lg text-sm font-medium transition-colors">Este Mês</button>
        </div>
      </div>

      {/* DRE Cards (Simplified P&L) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl">
              <p className="text-zinc-500 text-xs uppercase font-bold mb-1">Faturamento Bruto</p>
              <h3 className="text-2xl font-bold text-white">R$ {dre.grossRevenue.toFixed(2)}</h3>
              <div className="w-full bg-zinc-800 h-1 mt-3 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 w-full" />
              </div>
          </div>
          
          <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl">
              <p className="text-zinc-500 text-xs uppercase font-bold mb-1">Custo Produtos (CMV)</p>
              <h3 className="text-2xl font-bold text-orange-400">R$ {dre.cmv.toFixed(2)}</h3>
              <div className="w-full bg-zinc-800 h-1 mt-3 rounded-full overflow-hidden">
                  <div className="h-full bg-orange-500" style={{ width: `${(dre.cmv / (dre.grossRevenue || 1)) * 100}%` }} />
              </div>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl">
              <p className="text-zinc-500 text-xs uppercase font-bold mb-1">Despesas Operacionais</p>
              <h3 className="text-2xl font-bold text-red-500">R$ {dre.operationalExpenses.toFixed(2)}</h3>
              <div className="w-full bg-zinc-800 h-1 mt-3 rounded-full overflow-hidden">
                  <div className="h-full bg-red-500" style={{ width: `${(dre.operationalExpenses / (dre.grossRevenue || 1)) * 100}%` }} />
              </div>
          </div>

          <div className={`bg-zinc-900 border p-5 rounded-2xl ${dre.netProfit >= 0 ? 'border-green-500/30 bg-green-500/5' : 'border-red-500/30 bg-red-500/5'}`}>
              <p className="text-zinc-500 text-xs uppercase font-bold mb-1">Lucro Líquido Real</p>
              <h3 className={`text-2xl font-bold ${dre.netProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}>R$ {dre.netProfit.toFixed(2)}</h3>
              <span className={`text-xs font-bold px-2 py-0.5 rounded ${dre.netProfit >= 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                  Margem: {dre.margin.toFixed(1)}%
              </span>
          </div>
      </div>

      {/* Main Charts Area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        
        {/* Waterfall / Composition Chart */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <h3 className="text-white font-bold mb-6 flex items-center gap-2">
                <ICONS.Trending size={20} className="text-brand-500" /> Composição do Resultado
            </h3>
            <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={[
                            { name: 'Faturamento', valor: dre.grossRevenue, fill: '#3b82f6' },
                            { name: 'Custos (CMV)', valor: dre.cmv, fill: '#f97316' },
                            { name: 'Despesas', valor: dre.operationalExpenses, fill: '#ef4444' },
                            { name: 'Lucro', valor: dre.netProfit, fill: dre.netProfit > 0 ? '#10b981' : '#ef4444' },
                        ]}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                        <XAxis dataKey="name" stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} />
                        <Tooltip 
                            cursor={{fill: '#27272a'}}
                            contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '12px', color: '#fff' }} 
                            itemStyle={{ color: '#fff' }}
                        />
                        <Bar dataKey="valor" radius={[4, 4, 0, 0]} barSize={50} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* Payment Methods (Still Mocked for simplicity or can be calculated) */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <h3 className="text-white font-bold mb-6 flex items-center gap-2">
                <ICONS.Money size={20} className="text-green-500" /> Métodos de Pagamento
            </h3>
            <div className="flex flex-col md:flex-row items-center justify-center gap-8 h-[300px]">
                <div className="w-full h-full md:w-1/2">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={PAYMENT_DATA_MOCK}
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {PAYMENT_DATA_MOCK.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                                ))}
                            </Pie>
                            <Tooltip contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '12px' }} itemStyle={{ color: '#fff' }} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
                <div className="w-full md:w-1/2 space-y-3">
                    {PAYMENT_DATA_MOCK.map((item) => (
                        <div key={item.name} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                                <span className="text-zinc-300 text-sm">{item.name}</span>
                            </div>
                            <span className="text-white font-bold">{item.value}%</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         
         {/* Top Products Real Data */}
         <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <h3 className="text-white font-bold mb-6">Produtos Mais Vendidos</h3>
            <div className="space-y-4">
                {topProducts.length > 0 ? topProducts.map((prod: any, i) => (
                    <div key={prod.id} className="flex items-center justify-between p-3 bg-zinc-950 rounded-xl border border-zinc-800">
                        <div className="flex items-center gap-4">
                            <span className="text-2xl font-bold text-zinc-700 w-6">#{i+1}</span>
                            <img src={prod.image_url} alt="" className="w-10 h-10 rounded-lg object-cover bg-zinc-800" />
                            <div>
                                <p className="text-white font-medium">{prod.name}</p>
                                <p className="text-xs text-zinc-500">{prod.color} • {prod.size}</p>
                            </div>
                        </div>
                        <div className="text-right">
                             <p className="text-white font-bold">{prod.soldQty} un.</p>
                             <p className="text-xs text-green-500">R$ {(prod.sale_price * prod.soldQty).toLocaleString('pt-BR')}</p>
                        </div>
                    </div>
                )) : (
                    <p className="text-zinc-500 text-center py-4">Nenhuma venda registrada ainda.</p>
                )}
            </div>
         </div>

         {/* Top Clients - Can be updated to real logic if desired, kept mock for UI stability */}
         <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <h3 className="text-white font-bold mb-6">Top Clientes (Mock)</h3>
            <div className="space-y-4">
                {clients.slice(0, 4).map((client, i) => (
                    <div key={client.id} className="flex items-center gap-3">
                         <div className="relative">
                            <img src={client.image_url || `https://i.pravatar.cc/150?u=${i}`} alt="" className="w-10 h-10 rounded-full border border-zinc-800" />
                            {i === 0 && <div className="absolute -top-1 -right-1 text-yellow-500 bg-yellow-500/10 rounded-full p-0.5"><ICONS.Star size={10} fill="currentColor" /></div>}
                         </div>
                         <div className="flex-1">
                             <p className="text-sm text-white font-medium">{client.name}</p>
                             <div className="w-full bg-zinc-800 h-1.5 rounded-full mt-1 overflow-hidden">
                                 <div className="bg-brand-600 h-full rounded-full" style={{ width: `${100 - (i * 15)}%` }} />
                             </div>
                         </div>
                    </div>
                ))}
            </div>
         </div>
      </div>
    </div>
  );
};