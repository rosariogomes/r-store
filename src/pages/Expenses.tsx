import React, { useState, useMemo } from 'react';
import { 
  Plus, Trash2, TrendingDown, X, Filter, Calendar 
} from 'lucide-react';
import { Expense } from '../types';
import { useStore } from '../context/StoreContext';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const CATEGORY_COLORS = {
  FIXED: '#3b82f6', // blue
  VARIABLE: '#eab308', // yellow
  MARKETING: '#a855f7', // purple
  PERSONNEL: '#f97316', // orange
  TAXES: '#ef4444', // red
};

const CATEGORY_LABELS = {
  FIXED: 'Custos Fixos',
  VARIABLE: 'Custos Variáveis',
  MARKETING: 'Marketing',
  PERSONNEL: 'Pessoal/Pro-labore',
  TAXES: 'Impostos/Taxas',
};

export const Expenses = () => {
  const { expenses, addExpense, deleteExpense } = useStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form State
  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<Expense['category']>('FIXED');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  // Calculations
  const totalExpenses = expenses.reduce((acc, e) => acc + e.amount, 0);
  
  const chartData = useMemo(() => {
    const data: {[key: string]: number} = {};
    expenses.forEach(e => {
        data[e.category] = (data[e.category] || 0) + e.amount;
    });
    return Object.entries(data).map(([key, value]) => ({
        name: CATEGORY_LABELS[key as keyof typeof CATEGORY_LABELS],
        value,
        color: CATEGORY_COLORS[key as keyof typeof CATEGORY_COLORS]
    })).filter(item => item.value > 0);
  }, [expenses]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!desc || !amount) return;

    const newExpense: Expense = {
        id: Date.now().toString(), // ID Temporário, o Contexto/Supabase gera o real
        description: desc,
        amount: parseFloat(amount),
        category,
        date,
        paid: true
    };

    addExpense(newExpense);
    setIsModalOpen(false);
    setDesc('');
    setAmount('');
    setCategory('FIXED');
  };

  const handleDelete = (id: string) => {
    if(window.confirm("Deseja remover esta despesa?")) {
        deleteExpense(id);
    }
  };

  return (
    <div className="animate-fade-in pb-20 p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Gestão de Despesas</h1>
          <p className="text-zinc-400">Controle seus custos operacionais para apurar o lucro real.</p>
        </div>
        <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl shadow-lg shadow-red-900/20 transition-all active:scale-[0.98]"
        >
            <Plus size={20} />
            Lançar Despesa
        </button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
         <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl relative overflow-hidden flex flex-col justify-center">
             <div className="absolute -right-4 -top-4 text-red-900/10 rotate-12">
                 <TrendingDown size={140} />
             </div>
             <p className="text-zinc-500 font-bold text-xs uppercase mb-2">Total de Saídas (Geral)</p>
             <h2 className="text-4xl font-bold text-red-500">R$ {totalExpenses.toFixed(2)}</h2>
         </div>
         
         <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 p-6 rounded-2xl flex flex-col sm:flex-row items-center gap-8">
             <div className="h-48 w-48 shrink-0 relative">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie 
                            data={chartData} 
                            innerRadius={40} 
                            outerRadius={60} 
                            paddingAngle={5} 
                            dataKey="value"
                            stroke="none"
                        >
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Pie>
                        <Tooltip 
                            formatter={(value: number) => `R$ ${value.toFixed(2)}`}
                            contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '12px', color: '#fff' }} 
                            itemStyle={{ color: '#fff' }}
                        />
                    </PieChart>
                </ResponsiveContainer>
                {/* Texto Central se vazio */}
                {chartData.length === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center text-xs text-zinc-600 font-medium">
                        Sem dados
                    </div>
                )}
             </div>
             
             <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
                 {chartData.length > 0 ? chartData.map(item => (
                     <div key={item.name} className="flex items-center justify-between border-b border-zinc-800/50 pb-2 last:border-0">
                         <div className="flex items-center gap-2">
                             <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: item.color }} />
                             <span className="text-xs text-zinc-300 font-medium">{item.name}</span>
                         </div>
                         <span className="text-white font-bold text-xs">R$ {item.value.toFixed(2)}</span>
                     </div>
                 )) : (
                     <p className="text-zinc-500 text-sm italic">Cadastre despesas para visualizar o gráfico de distribuição.</p>
                 )}
             </div>
         </div>
      </div>

      {/* Expenses List */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-zinc-800 flex items-center gap-2">
            <Filter size={16} className="text-zinc-500" />
            <h3 className="font-bold text-white text-sm">Histórico de Lançamentos</h3>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead>
                    <tr className="bg-zinc-950/50 text-zinc-500 text-[10px] uppercase tracking-wider font-bold border-b border-zinc-800">
                        <th className="p-4">Descrição</th>
                        <th className="p-4">Categoria</th>
                        <th className="p-4">Data</th>
                        <th className="p-4 text-right">Valor</th>
                        <th className="p-4 text-center">Ações</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                    {expenses.map(expense => (
                        <tr key={expense.id} className="hover:bg-zinc-800/30 transition-colors group">
                            <td className="p-4 font-medium text-white">{expense.description}</td>
                            <td className="p-4">
                                <span 
                                    className="text-[10px] uppercase font-bold px-2 py-1 rounded border"
                                    style={{ 
                                        backgroundColor: `${CATEGORY_COLORS[expense.category as keyof typeof CATEGORY_COLORS]}15`, 
                                        borderColor: `${CATEGORY_COLORS[expense.category as keyof typeof CATEGORY_COLORS]}30`, 
                                        color: CATEGORY_COLORS[expense.category as keyof typeof CATEGORY_COLORS] 
                                    }}
                                >
                                    {CATEGORY_LABELS[expense.category as keyof typeof CATEGORY_LABELS]}
                                </span>
                            </td>
                            <td className="p-4 text-zinc-400 text-xs font-medium flex items-center gap-2">
                                <Calendar size={12} />
                                {new Date(expense.date).toLocaleDateString('pt-BR')}
                            </td>
                            <td className="p-4 text-right font-bold text-red-500">
                                - R$ {expense.amount.toFixed(2)}
                            </td>
                            <td className="p-4 text-center">
                                <button 
                                    onClick={() => handleDelete(expense.id)} 
                                    className="p-2 rounded-lg text-zinc-600 hover:text-red-500 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100"
                                    title="Excluir"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </td>
                        </tr>
                    ))}
                    {expenses.length === 0 && (
                        <tr>
                            <td colSpan={5} className="p-12 text-center text-zinc-500 flex flex-col items-center justify-center">
                                <div className="bg-zinc-800/50 p-4 rounded-full mb-3">
                                    <TrendingDown size={24} className="opacity-50" />
                                </div>
                                Nenhuma despesa lançada ainda.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
      </div>

      {/* Add Modal */}
      {isModalOpen && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-md shadow-2xl relative">
                  <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xl font-bold text-white">Nova Despesa</h3>
                      <button onClick={() => setIsModalOpen(false)} className="text-zinc-500 hover:text-white transition-colors">
                          <X size={24} />
                      </button>
                  </div>
                  
                  <form onSubmit={handleSubmit} className="space-y-4">
                      <div>
                          <label className="text-xs font-bold text-zinc-500 uppercase mb-1.5 block">Descrição</label>
                          <input 
                            type="text" 
                            autoFocus
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-red-600 transition-colors"
                            placeholder="Ex: Conta de Luz"
                            value={desc}
                            onChange={e => setDesc(e.target.value)}
                            required
                          />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-xs font-bold text-zinc-500 uppercase mb-1.5 block">Valor (R$)</label>
                            <input 
                                type="number" 
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-red-600 transition-colors"
                                placeholder="0.00"
                                value={amount}
                                onChange={e => setAmount(e.target.value)}
                                required
                            />
                          </div>
                          <div>
                            <label className="text-xs font-bold text-zinc-500 uppercase mb-1.5 block">Data</label>
                            <input 
                                type="date" 
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-red-600 transition-colors"
                                value={date}
                                onChange={e => setDate(e.target.value)}
                                required
                            />
                          </div>
                      </div>

                      <div>
                          <label className="text-xs font-bold text-zinc-500 uppercase mb-1.5 block">Categoria</label>
                          <div className="grid grid-cols-2 gap-2">
                              {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                                  <button
                                    key={key}
                                    type="button"
                                    onClick={() => setCategory(key as any)}
                                    className={`py-2.5 px-3 rounded-lg text-xs font-bold text-left border transition-all ${
                                        category === key 
                                        ? `bg-red-600 text-white border-red-600 shadow-lg shadow-red-900/20` 
                                        : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700'
                                    }`}
                                  >
                                      {label}
                                  </button>
                              ))}
                          </div>
                      </div>

                      <div className="flex gap-3 pt-4">
                          <button 
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            className="flex-1 py-3 text-zinc-400 hover:bg-zinc-800 rounded-xl transition-colors font-medium"
                          >
                            Cancelar
                          </button>
                          <button 
                            type="submit"
                            className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl shadow-lg shadow-red-900/20 transition-all"
                          >
                            Salvar
                          </button>
                      </div>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};