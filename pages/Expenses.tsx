import React, { useState, useMemo } from 'react';
import { ICONS } from '../constants';
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
    }));
  }, [expenses]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!desc || !amount) return;

    const newExpense: Expense = {
        id: Date.now().toString(),
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
    <div className="animate-fade-in pb-20">
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
            <ICONS.Plus size={20} />
            Lançar Despesa
        </button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
         <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl relative overflow-hidden">
             <div className="absolute -right-4 -top-4 text-red-900/20"><ICONS.Expense size={120} /></div>
             <p className="text-zinc-500 font-medium text-sm mb-2">Total de Saídas (Mês)</p>
             <h2 className="text-3xl font-bold text-red-500">R$ {totalExpenses.toFixed(2)}</h2>
         </div>
         
         <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 p-6 rounded-2xl flex flex-col md:flex-row items-center gap-8">
             <div className="h-40 w-40 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie data={chartData} innerRadius={35} outerRadius={50} paddingAngle={2} dataKey="value">
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                            ))}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '12px' }} itemStyle={{ color: '#fff' }} />
                    </PieChart>
                </ResponsiveContainer>
             </div>
             <div className="flex-1 grid grid-cols-2 gap-4">
                 {chartData.map(item => (
                     <div key={item.name} className="flex items-center justify-between border-b border-zinc-800 pb-2 last:border-0">
                         <div className="flex items-center gap-2">
                             <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                             <span className="text-sm text-zinc-300">{item.name}</span>
                         </div>
                         <span className="text-white font-bold text-sm">R$ {item.value.toFixed(2)}</span>
                     </div>
                 ))}
             </div>
         </div>
      </div>

      {/* Expenses List */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead>
                    <tr className="bg-zinc-950/50 text-zinc-400 text-xs uppercase tracking-wider font-semibold border-b border-zinc-800">
                        <th className="p-4">Descrição</th>
                        <th className="p-4">Categoria</th>
                        <th className="p-4">Data</th>
                        <th className="p-4 text-right">Valor</th>
                        <th className="p-4 text-center">Ações</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                    {expenses.map(expense => (
                        <tr key={expense.id} className="hover:bg-zinc-800/30 transition-colors">
                            <td className="p-4 font-medium text-white">{expense.description}</td>
                            <td className="p-4">
                                <span 
                                    className="text-[10px] uppercase font-bold px-2 py-0.5 rounded text-white"
                                    style={{ backgroundColor: `${CATEGORY_COLORS[expense.category]}30`, color: CATEGORY_COLORS[expense.category] }}
                                >
                                    {CATEGORY_LABELS[expense.category]}
                                </span>
                            </td>
                            <td className="p-4 text-zinc-400 text-sm">
                                {new Date(expense.date).toLocaleDateString('pt-BR')}
                            </td>
                            <td className="p-4 text-right font-bold text-red-500">
                                - R$ {expense.amount.toFixed(2)}
                            </td>
                            <td className="p-4 text-center">
                                <button onClick={() => handleDelete(expense.id)} className="text-zinc-500 hover:text-red-500 transition-colors">
                                    <ICONS.Delete size={18} />
                                </button>
                            </td>
                        </tr>
                    ))}
                    {expenses.length === 0 && (
                        <tr>
                            <td colSpan={5} className="p-8 text-center text-zinc-500">
                                Nenhuma despesa lançada.
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
                  <h3 className="text-xl font-bold text-white mb-6">Nova Despesa</h3>
                  
                  <form onSubmit={handleSubmit} className="space-y-4">
                      <div>
                          <label className="text-xs font-semibold text-zinc-500 uppercase mb-2 block">Descrição</label>
                          <input 
                            type="text" 
                            autoFocus
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-red-600"
                            placeholder="Ex: Conta de Luz"
                            value={desc}
                            onChange={e => setDesc(e.target.value)}
                            required
                          />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-xs font-semibold text-zinc-500 uppercase mb-2 block">Valor (R$)</label>
                            <input 
                                type="number" 
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-red-600"
                                placeholder="0.00"
                                value={amount}
                                onChange={e => setAmount(e.target.value)}
                                required
                            />
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-zinc-500 uppercase mb-2 block">Data</label>
                            <input 
                                type="date" 
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-red-600"
                                value={date}
                                onChange={e => setDate(e.target.value)}
                                required
                            />
                          </div>
                      </div>

                      <div>
                          <label className="text-xs font-semibold text-zinc-500 uppercase mb-2 block">Categoria</label>
                          <div className="grid grid-cols-2 gap-2">
                              {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                                  <button
                                    key={key}
                                    type="button"
                                    onClick={() => setCategory(key as any)}
                                    className={`py-2 px-3 rounded-lg text-xs font-bold text-left border transition-all ${
                                        category === key 
                                        ? `bg-red-500/20 border-red-500 text-white` 
                                        : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:text-zinc-300'
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
                            className="flex-1 py-3 text-zinc-400 hover:bg-zinc-800 rounded-xl transition-colors"
                          >
                            Cancelar
                          </button>
                          <button 
                            type="submit"
                            className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl shadow-lg shadow-red-900/20"
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