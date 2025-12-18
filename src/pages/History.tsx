import React, { useState, useMemo } from 'react';
import { useStore } from '../context/StoreContext';
import { 
    Search, Filter, ArrowUpRight, ArrowDownLeft, Calendar, 
    User, AlertCircle, CheckCircle, X, Package, DollarSign 
} from 'lucide-react';
import { Sale, SaleStatus } from '../types';

export const History = () => {
  const { sales, updateSaleStatus } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<SaleStatus | 'ALL'>('ALL');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'SALE' | 'BAG'>('ALL');
  
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

  // --- Filtros ---
  const filteredSales = useMemo(() => {
    return sales.filter(sale => {
      const matchesSearch = (sale.client_name || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'ALL' || sale.status === statusFilter;
      const matchesType = typeFilter === 'ALL' || sale.type === typeFilter;
      return matchesSearch && matchesStatus && matchesType;
    });
  }, [sales, searchTerm, statusFilter, typeFilter]);

  // --- Cálculos Financeiros ---
  const getClientFinancialStatus = (clientId: string) => {
      if (!clientId) return 0;
      const pendingSales = sales.filter(s => 
          s.client_id === clientId && s.status !== 'PAID' && s.status !== 'CANCELLED'
      );
      
      const totalDebt = pendingSales.reduce((acc, s) => {
          const total = Number(s.total_amount) || 0;
          const paid = Number(s.paid_amount) || 0;
          return acc + (total - paid);
      }, 0);

      return totalDebt;
  };

  // --- Renderização do Modal ---
  const renderSaleDetailsModal = () => {
      if (!selectedSale) return null;

      const debt = getClientFinancialStatus(selectedSale.client_id);
      const isPaid = selectedSale.status === 'PAID';
      
      // Proteção contra valores nulos na Venda Principal
      const saleTotal = Number(selectedSale.total_amount) || 0;
      const salePaid = Number(selectedSale.paid_amount) || 0;
      const saleRest = saleTotal - salePaid;

      return (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
              <div className="bg-zinc-900 border border-zinc-800 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                  
                  {/* Cabeçalho */}
                  <div className="p-6 border-b border-zinc-800 flex justify-between items-start bg-zinc-950">
                      <div>
                          <h2 className="text-xl font-bold text-white flex items-center gap-2">
                              {selectedSale.type === 'SALE' ? 'Detalhes da Venda' : 'Detalhes da Sacola'}
                              <span className="text-xs font-normal text-zinc-500 bg-zinc-800 px-2 py-1 rounded-full">
                                  #{selectedSale.id ? selectedSale.id.slice(0, 8) : '---'}
                              </span>
                          </h2>
                          <p className="text-zinc-400 text-sm mt-1 flex items-center gap-2">
                              <Calendar size={14} /> 
                              {selectedSale.created_at ? new Date(selectedSale.created_at).toLocaleString('pt-BR') : 'Data desconhecida'}
                          </p>
                      </div>
                      <button onClick={() => setSelectedSale(null)} className="text-zinc-500 hover:text-white transition-colors">
                          <X size={24} />
                      </button>
                  </div>

                  {/* Corpo */}
                  <div className="p-6 overflow-y-auto custom-scrollbar space-y-6">
                      
                      {/* Cliente */}
                      <div className="bg-zinc-800/50 rounded-xl p-4 border border-zinc-700/50">
                          <div className="flex justify-between items-start">
                              <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center text-white font-bold">
                                      <User size={20} />
                                  </div>
                                  <div>
                                      <p className="text-sm text-zinc-400 font-bold uppercase">Cliente</p>
                                      <p className="text-white font-bold text-lg">{selectedSale.client_name || 'Cliente Desconhecido'}</p>
                                  </div>
                              </div>
                              
                              <div className="text-right">
                                  <p className="text-xs text-zinc-500 uppercase font-bold mb-1">Situação Financeira</p>
                                  {debt > 0.01 ? (
                                      <div className="flex items-center justify-end gap-1 text-orange-500 font-bold bg-orange-500/10 px-2 py-1 rounded">
                                          <AlertCircle size={14} /> Deve R$ {debt.toFixed(2)}
                                      </div>
                                  ) : (
                                      <div className="flex items-center justify-end gap-1 text-green-500 font-bold bg-green-500/10 px-2 py-1 rounded">
                                          <CheckCircle size={14} /> Em dia
                                      </div>
                                  )}
                              </div>
                          </div>
                      </div>

                      {/* Lista de Produtos (Aqui estava o erro) */}
                      <div>
                          <h3 className="text-sm font-bold text-zinc-400 uppercase mb-3 flex items-center gap-2">
                              <Package size={16} /> Itens Comprados
                          </h3>
                          <div className="space-y-2">
                              {selectedSale.items && selectedSale.items.length > 0 ? (
                                  selectedSale.items.map((item, idx) => {
                                      // PROTEÇÃO: Garante que os números existam antes de usar .toFixed
                                      const qtd = Number(item.quantity) || 0;
                                      const price = Number(item.unit_price) || 0;
                                      const totalItem = qtd * price;

                                      return (
                                        <div key={idx} className="flex items-center gap-4 bg-zinc-950 p-3 rounded-lg border border-zinc-800">
                                            {item.product_image ? (
                                                <img src={item.product_image} alt="" className="w-12 h-12 rounded object-cover bg-zinc-800" />
                                            ) : (
                                                <div className="w-12 h-12 rounded bg-zinc-800 flex items-center justify-center text-zinc-600"><Package size={16}/></div>
                                            )}
                                            <div className="flex-1">
                                                <p className="text-white font-medium text-sm">{item.product_name || 'Produto sem nome'}</p>
                                                <p className="text-zinc-500 text-xs">{item.size || '-'} | {item.color || '-'}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-zinc-400 text-xs">{qtd}x R$ {price.toFixed(2)}</p>
                                                <p className="text-white font-bold text-sm">R$ {totalItem.toFixed(2)}</p>
                                            </div>
                                        </div>
                                      );
                                  })
                              ) : (
                                  <p className="text-zinc-500 text-sm italic">Nenhum item registrado nesta venda.</p>
                              )}
                          </div>
                      </div>

                      {/* Resumo */}
                      <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 space-y-2">
                          <div className="flex justify-between text-sm">
                              <span className="text-zinc-400">Total da Venda</span>
                              <span className="text-white font-bold">R$ {saleTotal.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                              <span className="text-zinc-400">Valor Pago</span>
                              <span className="text-green-500 font-bold">R$ {salePaid.toFixed(2)}</span>
                          </div>
                          <div className="border-t border-zinc-800 pt-2 flex justify-between items-center mt-2">
                              <span className="text-zinc-400 font-bold">Restante</span>
                              <span className={`font-bold text-lg ${isPaid ? 'text-zinc-600' : 'text-orange-500'}`}>
                                  R$ {saleRest.toFixed(2)}
                              </span>
                          </div>
                      </div>

                      {/* Botão Quitar */}
                      {!isPaid && (
                          <button 
                            onClick={() => {
                                if(window.confirm("Confirmar recebimento total desta venda?")) {
                                    updateSaleStatus(selectedSale.id, saleTotal, 'PAID');
                                    setSelectedSale(prev => prev ? {...prev, status: 'PAID', paid_amount: saleTotal} : null);
                                }
                            }}
                            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
                          >
                              <DollarSign size={20} />
                              Receber Valor Restante Agora
                          </button>
                      )}
                  </div>
              </div>
          </div>
      );
  };

  return (
    <div className="pb-20 p-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Histórico</h1>
          <p className="text-zinc-400">Visualize todas as vendas e sacolas.</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
             <input 
                type="text" 
                placeholder="Buscar por cliente..." 
                className="w-full bg-zinc-900 border border-zinc-800 text-white p-3 rounded-xl pl-10 focus:border-brand-500 outline-none"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
             />
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
          </div>
          
          <div className="flex gap-2 overflow-x-auto pb-1">
             <select 
                className="bg-zinc-900 border border-zinc-800 text-white p-3 rounded-xl outline-none focus:border-brand-500"
                value={typeFilter}
                onChange={e => setTypeFilter(e.target.value as any)}
             >
                 <option value="ALL">Todos os Tipos</option>
                 <option value="SALE">Vendas</option>
                 <option value="BAG">Sacolas</option>
             </select>

             <select 
                className="bg-zinc-900 border border-zinc-800 text-white p-3 rounded-xl outline-none focus:border-brand-500"
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value as any)}
             >
                 <option value="ALL">Todos os Status</option>
                 <option value="PAID">Pagos</option>
                 <option value="PENDING">Pendentes</option>
                 <option value="CANCELLED">Cancelados</option>
             </select>
          </div>
      </div>

      {/* Tabela */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-zinc-950 text-zinc-400 text-xs uppercase font-bold">
              <tr>
                <th className="p-4">Tipo</th>
                <th className="p-4">Cliente</th>
                <th className="p-4">Data</th>
                <th className="p-4">Valor Total</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {filteredSales.map((sale) => (
                <tr key={sale.id} className="hover:bg-zinc-800/50 transition-colors">
                  <td className="p-4">
                      {sale.type === 'SALE' ? (
                          <span className="flex items-center gap-1 text-green-400 bg-green-400/10 px-2 py-1 rounded text-xs w-fit font-bold">
                              <ArrowUpRight size={14} /> Venda
                          </span>
                      ) : (
                          <span className="flex items-center gap-1 text-purple-400 bg-purple-400/10 px-2 py-1 rounded text-xs w-fit font-bold">
                              <ArrowDownLeft size={14} /> Sacola
                          </span>
                      )}
                  </td>
                  <td className="p-4">
                      <p className="font-bold text-white">{sale.client_name || 'Anônimo'}</p>
                      <p className="text-xs text-zinc-500">{sale.items ? sale.items.length : 0} itens</p>
                  </td>
                  <td className="p-4 text-zinc-400 text-sm">
                      {sale.created_at ? new Date(sale.created_at).toLocaleDateString('pt-BR') : '-'}
                  </td>
                  <td className="p-4 font-bold text-white">
                      R$ {(Number(sale.total_amount) || 0).toFixed(2)}
                  </td>
                  <td className="p-4">
                      <span className={`text-xs font-bold px-2 py-1 rounded ${
                          sale.status === 'PAID' ? 'text-green-500 bg-green-500/10' :
                          sale.status === 'CANCELLED' ? 'text-red-500 bg-red-500/10' :
                          'text-orange-500 bg-orange-500/10'
                      }`}>
                          {sale.status === 'PAID' ? 'PAGO' : sale.status === 'PENDING' ? 'PENDENTE' : 'CANCELADO'}
                      </span>
                  </td>
                  <td className="p-4 text-right">
                      <button 
                        onClick={() => setSelectedSale(sale)}
                        className="text-sm font-bold text-brand-500 hover:text-brand-400 hover:underline"
                      >
                          Ver Detalhes
                      </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredSales.length === 0 && (
              <div className="p-8 text-center text-zinc-500">
                  <Filter size={32} className="mx-auto mb-2 opacity-20" />
                  <p>Nenhuma venda encontrada com estes filtros.</p>
              </div>
          )}
        </div>
      </div>

      {renderSaleDetailsModal()}
    </div>
  );
};