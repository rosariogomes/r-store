import React, { useMemo, useState } from 'react';
import { useStore } from '../context/StoreContext';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell 
} from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Calendar, Package, AlertCircle, CreditCard } from 'lucide-react';

// Cores para os métodos de pagamento
const COLORS: Record<string, string> = {
    PIX: '#10b981',      // Verde
    CREDIT: '#3b82f6',   // Azul
    DEBIT: '#8b5cf6',    // Roxo
    CASH: '#f59e0b',     // Laranja
    OTHER: '#71717a'     // Cinza
};

const PAYMENT_LABELS: Record<string, string> = {
    PIX: 'Pix',
    CREDIT: 'Crédito',
    DEBIT: 'Débito',
    CASH: 'Dinheiro',
    OTHER: 'Outro'
};

export const Reports = () => {
  const { sales, expenses, products } = useStore();
  const [timeRange, setTimeRange] = useState<'7' | '30'>('7');

  // --- 1. Cálculos Financeiros ---
  const financials = useMemo(() => {
    const safeSales = sales || [];
    const safeExpenses = expenses || [];

    const paidSales = safeSales.filter(s => s.paid_amount > 0);
    const grossRevenue = paidSales.reduce((acc, s) => acc + (s.paid_amount || 0), 0);
    const totalExpenses = safeExpenses.reduce((acc, e) => acc + (e.amount || 0), 0);
    const netProfit = grossRevenue - totalExpenses;
    const margin = grossRevenue > 0 ? (netProfit / grossRevenue) * 100 : 0;
    const averageTicket = paidSales.length > 0 ? grossRevenue / paidSales.length : 0;

    return { grossRevenue, totalExpenses, netProfit, margin, averageTicket };
  }, [sales, expenses]);

  // --- 2. Gráfico de Pagamentos (Pizza) ---
  const paymentData = useMemo(() => {
      const counts: Record<string, number> = {};
      
      (sales || []).forEach(sale => {
          if (sale.paid_amount > 0) {
              let method = sale.paymentMethod || sale.payment_method || 'OTHER';
              if (method.includes('CREDIT')) method = 'CREDIT';
              else if (method.includes('DEBIT')) method = 'DEBIT';
              else if (method.includes('PIX')) method = 'PIX';
              else if (method.includes('CASH') || method.includes('MONEY')) method = 'CASH';
              else method = 'OTHER';

              counts[method] = (counts[method] || 0) + sale.paid_amount;
          }
      });

      return Object.entries(counts).map(([key, value]) => ({
          name: PAYMENT_LABELS[key] || key,
          value: value,
          color: COLORS[key] || COLORS.OTHER
      })).filter(item => item.value > 0);
  }, [sales]);

  // --- 3. Gráfico de Barras ---
  const chartData = useMemo(() => {
    const days = parseInt(timeRange);
    const data = [];
    const today = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateKey = d.toLocaleDateString('en-CA');
      const displayDate = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });

      const dayIncome = (sales || [])
        .filter(s => s.created_at && new Date(s.created_at).toLocaleDateString('en-CA') === dateKey)
        .reduce((acc, s) => acc + (s.paid_amount || 0), 0);

      const dayExpense = (expenses || [])
        .filter(e => {
            const date = e.date || e.created_at;
            return date && new Date(date).toLocaleDateString('en-CA') === dateKey;
        })
        .reduce((acc, e) => acc + (e.amount || 0), 0);

      data.push({
        name: displayDate,
        Entradas: dayIncome,
        Saídas: dayExpense
      });
    }
    return data;
  }, [sales, expenses, timeRange]);

  // --- 4. Produtos Mais Vendidos ---
  const topProducts = useMemo(() => {
    if (!sales || !products) return [];
    const productCounts: Record<string, number> = {};

    sales.forEach(sale => {
        if (sale.items && Array.isArray(sale.items)) {
            sale.items.forEach((item: any) => {
                const prodId = item.product_id || item.id; 
                const qty = item.quantity || item.cartQuantity || item.amount || 0;
                if (prodId && qty > 0) {
                    productCounts[prodId] = (productCounts[prodId] || 0) + qty;
                }
            });
        }
    });

    return Object.entries(productCounts)
        .map(([id, qty]) => {
            const product = products.find(p => p.id === id);
            return product ? { ...product, soldQty: qty } : null;
        })
        .filter(Boolean)
        .sort((a: any, b: any) => b.soldQty - a.soldQty)
        .slice(0, 5);
  }, [sales, products]);

  return (
    <div className="pb-20 p-6 animate-fade-in">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Relatórios Gerenciais</h1>
          <p className="text-zinc-400">Análise completa da sua loja.</p>
        </div>
        
        <div className="flex bg-zinc-900 p-1 rounded-xl border border-zinc-800 self-start md:self-auto">
            <button onClick={() => setTimeRange('7')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${timeRange === '7' ? 'bg-zinc-800 text-white shadow' : 'text-zinc-500 hover:text-white'}`}>7 Dias</button>
            <button onClick={() => setTimeRange('30')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${timeRange === '30' ? 'bg-zinc-800 text-white shadow' : 'text-zinc-500 hover:text-white'}`}>30 Dias</button>
        </div>
      </div>

      {/* Cards de KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5"><TrendingUp size={80} /></div>
            <p className="text-zinc-400 text-xs font-bold uppercase mb-2">Faturamento</p>
            <h3 className="text-2xl lg:text-3xl font-bold text-white">R$ {financials.grossRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5"><TrendingDown size={80} /></div>
            <p className="text-zinc-400 text-xs font-bold uppercase mb-2">Despesas</p>
            <h3 className="text-2xl lg:text-3xl font-bold text-red-500">R$ {financials.totalExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
        </div>

        <div className={`bg-zinc-900 border p-6 rounded-2xl relative overflow-hidden ${financials.netProfit >= 0 ? 'border-green-500/30 bg-green-500/5' : 'border-red-500/30 bg-red-500/5'}`}>
            <div className="absolute top-0 right-0 p-4 opacity-5"><DollarSign size={80} /></div>
            <p className="text-zinc-400 text-xs font-bold uppercase mb-2">Lucro Líquido</p>
            <h3 className={`text-2xl lg:text-3xl font-bold ${financials.netProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                R$ {financials.netProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </h3>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5"><CreditCard size={80} /></div>
            <p className="text-zinc-400 text-xs font-bold uppercase mb-2">Ticket Médio</p>
            <h3 className="text-2xl lg:text-3xl font-bold text-blue-500">
                R$ {financials.averageTicket.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </h3>
            <span className="text-xs text-zinc-500">Média por venda</span>
        </div>
      </div>

      {/* Área Principal de Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        
        {/* Gráfico de Barras */}
        <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <h3 className="text-white font-bold mb-6 flex items-center gap-2">
                <Calendar size={20} className="text-zinc-400" /> Fluxo de Caixa Diário
            </h3>
            <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                        <XAxis dataKey="name" stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} />
                        <Tooltip 
                            cursor={{fill: '#27272a'}} 
                            contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '12px', color: '#fff' }} 
                            itemStyle={{ color: '#fff' }} 
                        />
                        <Legend wrapperStyle={{ color: "#d4d4d8" }} />
                        <Bar dataKey="Entradas" fill="#10b981" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="Saídas" fill="#ef4444" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* Gráfico de Pizza CORRIGIDO */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col">
            <h3 className="text-white font-bold mb-2 flex items-center gap-2">
                <CreditCard size={20} className="text-blue-500" /> Métodos de Pgto
            </h3>
            <div className="h-[250px] w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={paymentData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {paymentData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                            ))}
                        </Pie>
                        <Tooltip 
                            formatter={(value: number) => `R$ ${value.toFixed(2)}`}
                            contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '12px', color: '#fff' }}
                            itemStyle={{ color: '#fff' }} // CORREÇÃO 1: Texto interno branco
                        />
                        <Legend 
                            verticalAlign="bottom" 
                            height={36} 
                            wrapperStyle={{ color: "#ffffff", fontSize: "12px", paddingTop: "10px" }} // CORREÇÃO 2: Legenda Branca
                        />
                    </PieChart>
                </ResponsiveContainer>
                
                {paymentData.length === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center text-zinc-600 text-xs">
                        Sem dados
                    </div>
                )}
            </div>
        </div>
      </div>

      {/* Produtos Mais Vendidos */}
      <div className="grid grid-cols-1">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
              <h3 className="text-white font-bold mb-6 flex items-center gap-2">
                  <Package size={20} className="text-brand-500" /> Produtos Mais Vendidos
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {topProducts.length > 0 ? topProducts.map((prod: any, i) => {
                      const price = prod.price || prod.sale_price || 0;
                      const totalValue = price * prod.soldQty;
                      return (
                          <div key={prod.id} className="flex items-center justify-between p-4 bg-zinc-950 rounded-xl border border-zinc-800 hover:border-zinc-700 transition-colors">
                              <div className="flex items-center gap-4">
                                  <span className={`text-xl font-bold w-6 ${i === 0 ? 'text-yellow-500' : 'text-zinc-700'}`}>#{i+1}</span>
                                  <div className="w-12 h-12 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-500 shrink-0 overflow-hidden">
                                      {prod.image_url ? <img src={prod.image_url} className="w-full h-full object-cover"/> : <Package size={24}/>}
                                  </div>
                                  <div className="overflow-hidden">
                                      <p className="text-white font-medium line-clamp-1">{prod.name}</p>
                                      <p className="text-xs text-zinc-500">{prod.stock_quantity} em estoque</p>
                                  </div>
                              </div>
                              <div className="text-right shrink-0">
                                  <p className="text-white font-bold">{prod.soldQty} un.</p>
                                  <p className="text-xs text-green-500">R$ {totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                              </div>
                          </div>
                      );
                  }) : (
                      <div className="col-span-full flex flex-col items-center justify-center py-10 text-zinc-500">
                          <AlertCircle size={40} className="mb-2 opacity-50"/>
                          <p>Nenhuma venda registrada ainda.</p>
                      </div>
                  )}
              </div>
          </div>
      </div>
    </div>
  );
};