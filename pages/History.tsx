import React, { useState, useMemo } from 'react';
import { ICONS } from '../constants';
import { Sale, SaleStatus, SaleType } from '../types';
import { useStore } from '../context/StoreContext';

// --- Printable Receipt Component (Hidden on Screen, Visible on Print) ---
const PrintableReceipt = ({ sale }: { sale: Sale | null }) => {
  const { storeConfig } = useStore();
  
  if (!sale) return null;
  const items = sale.items || [];

  return (
    <div id="printable-receipt" className="hidden bg-white text-black p-8 max-w-[210mm] mx-auto font-mono text-sm">
        {/* Header */}
        <div className="text-center border-b-2 border-black pb-6 mb-6">
            {storeConfig.logo_url && (
                <img src={storeConfig.logo_url} alt="Logo" className="h-16 mx-auto mb-2 grayscale" />
            )}
            <h1 className="text-3xl font-bold uppercase mb-1">{storeConfig.name}</h1>
            <p className="text-xs uppercase tracking-widest text-gray-600 mb-2">{storeConfig.subtitle}</p>
            <p className="text-xs">{storeConfig.address}</p>
            <p className="text-xs">CNPJ: {storeConfig.cnpj} • Tel: {storeConfig.phone}</p>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-8 mb-8">
            <div>
                <p className="text-[10px] font-bold uppercase text-gray-500 mb-1">Cliente</p>
                <p className="text-lg font-bold">{sale.client_name}</p>
                <p className="text-xs text-gray-600">ID Venda: #{sale.id}</p>
            </div>
            <div className="text-right">
                <p className="text-[10px] font-bold uppercase text-gray-500 mb-1">Data / Hora</p>
                <p className="text-lg font-bold">{new Date(sale.created_at).toLocaleDateString('pt-BR')}</p>
                <p className="text-xs text-gray-600">{new Date(sale.created_at).toLocaleTimeString('pt-BR')}</p>
            </div>
        </div>

        {/* Table */}
        <table className="w-full mb-8">
            <thead>
                <tr className="border-b border-black text-[10px] uppercase text-left">
                    <th className="py-2">Item</th>
                    <th className="py-2 text-center">Qtd</th>
                    <th className="py-2 text-right">Unitário</th>
                    <th className="py-2 text-right">Total</th>
                </tr>
            </thead>
            <tbody className="text-xs">
                {items.map((item, idx) => (
                    <tr key={idx} className="border-b border-gray-200">
                        <td className="py-2 pr-2">
                            <span className="font-bold block">{item.product_name}</span>
                            <span className="text-[10px] text-gray-500">{item.size} • {item.color}</span>
                        </td>
                        <td className="py-2 text-center">{item.quantity}</td>
                        <td className="py-2 text-right">R$ {item.unit_price.toFixed(2)}</td>
                        <td className="py-2 text-right font-bold">R$ {(item.quantity * item.unit_price).toFixed(2)}</td>
                    </tr>
                ))}
            </tbody>
        </table>

        {/* Totals */}
        <div className="flex justify-end mb-12">
            <div className="w-1/2 space-y-1">
                <div className="flex justify-between text-xs">
                    <span>Subtotal</span>
                    <span>R$ {sale.total_amount.toFixed(2)}</span>
                </div>
                {sale.paid_amount > 0 && (
                    <div className="flex justify-between text-xs text-gray-600">
                        <span>Valor Pago</span>
                        <span>- R$ {sale.paid_amount.toFixed(2)}</span>
                    </div>
                )}
                <div className="flex justify-between text-lg font-bold border-t-2 border-black pt-2 mt-2">
                    <span>{sale.status === 'PAID' ? 'Total Pago' : 'Saldo Devedor'}</span>
                    <span>R$ {sale.status === 'PAID' ? sale.total_amount.toFixed(2) : (sale.total_amount - sale.paid_amount).toFixed(2)}</span>
                </div>
                <div className="text-right pt-2">
                     <span className={`text-[10px] font-bold px-2 py-1 rounded border ${
                        sale.status === 'PAID' ? 'border-black text-black' : 'border-gray-400 text-gray-600'
                     }`}>
                        STATUS: {sale.status === 'PAID' ? 'QUITADO' : sale.status === 'PENDING' ? 'PENDENTE' : 'PARCIAL'}
                     </span>
                </div>
            </div>
        </div>

        {/* Footer / Terms */}
        <div className="text-center text-[10px] text-gray-500 mt-auto border-t border-gray-200 pt-6">
            {sale.type === 'BAG' ? (
                <p className="italic mb-2 font-bold">
                    *** DOCUMENTO DE CONSIGNAÇÃO (MALINHA) ***
                    <br/>
                    Declaro ter recebido os itens acima. Comprometo-me a devolvê-los ou efetuar o pagamento.
                </p>
            ) : (
                <p className="italic mb-2">{storeConfig.receiptFooter}</p>
            )}
            <p className="mt-4 font-mono text-[8px] uppercase">Gerado via R Store App</p>
        </div>
    </div>
  );
};

export const History = () => {
  const { sales, updateSaleStatus, confirmBag } = useStore(); // Global Context
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | SaleType>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | SaleStatus>('ALL');
  
  // Modal State
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

  // Payment Modal State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState<string>('');

  // Bag Processing Modal State
  const [isBagProcessModalOpen, setIsBagProcessModalOpen] = useState(false);
  const [keptItems, setKeptItems] = useState<{ [id: string]: number }>({});

  // Filter Logic
  const filteredSales = useMemo(() => {
    return sales.filter(sale => {
      const matchesSearch = sale.client_name?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = typeFilter === 'ALL' || sale.type === typeFilter;
      const matchesStatus = statusFilter === 'ALL' || sale.status === statusFilter;
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [searchTerm, typeFilter, statusFilter, sales]);

  // Totals for the current view
  const totalRevenue = filteredSales
    .reduce((acc, s) => acc + s.paid_amount, 0);

  const totalPending = filteredSales
    .reduce((acc, s) => acc + (s.total_amount - s.paid_amount), 0);

  // Helper for Status Badge
  const getStatusBadge = (status: SaleStatus) => {
    switch (status) {
      case 'PAID': return <span className="bg-green-500/10 text-green-500 border border-green-500/20 px-2 py-1 rounded text-xs font-bold uppercase tracking-wider">Pago</span>;
      case 'PENDING': return <span className="bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 px-2 py-1 rounded text-xs font-bold uppercase tracking-wider">Pendente</span>;
      case 'PARTIAL': return <span className="bg-blue-500/10 text-blue-500 border border-blue-500/20 px-2 py-1 rounded text-xs font-bold uppercase tracking-wider">Parcial</span>;
      default: return null;
    }
  };

  // Helper for Type Icon
  const getTypeIcon = (sale: Sale) => {
      // Logic: If Amount is 0 and it was originally a BAG (implied), it's a Return
      if (sale.total_amount === 0) {
          return <div className="flex items-center gap-1 text-zinc-500 text-xs font-medium"><ICONS.Return size={14} /> Devolução</div>;
      }
      return sale.type === 'BAG' 
      ? <div className="flex items-center gap-1 text-purple-400 text-xs font-medium"><ICONS.Sales size={14} /> Malinha</div>
      : <div className="flex items-center gap-1 text-zinc-400 text-xs font-medium"><ICONS.Money size={14} /> Venda</div>;
  };

  // Payment Handler
  const handlePaymentSubmit = () => {
      if (!selectedSale) return;
      const amount = parseFloat(paymentAmount);
      
      const remaining = selectedSale.total_amount - selectedSale.paid_amount;

      if (!amount || amount <= 0) {
          alert("Digite um valor válido.");
          return;
      }

      if (amount > remaining + 0.01) { // small buffer for float precision
          alert(`O valor não pode exceder o saldo restante de R$ ${remaining.toFixed(2)}`);
          return;
      }

      const newPaidAmount = selectedSale.paid_amount + amount;
      const newStatus: SaleStatus = newPaidAmount >= selectedSale.total_amount - 0.01 ? 'PAID' : 'PARTIAL';

      // Update via Global Context
      updateSaleStatus(selectedSale.id, amount, newStatus);
      
      // Update local modal state to reflect changes immediately
      setSelectedSale(prev => prev ? ({ ...prev, paid_amount: newPaidAmount, status: newStatus }) : null);

      setIsPaymentModalOpen(false);
      setPaymentAmount('');
      
      alert("Pagamento registrado com sucesso!");
  };

  // Bag Return Handler
  const handleOpenBagProcess = (sale: Sale) => {
      setSelectedSale(sale);
      // Initialize state: Assume customer kept everything by default, user unchecks what returned
      const initialKept: {[id: string]: number} = {};
      if (sale.items) {
          sale.items.forEach(item => {
              initialKept[item.product_id] = item.quantity;
          });
      }
      setKeptItems(initialKept);
      setIsBagProcessModalOpen(true);
  };

  const handleConfirmBagReturn = () => {
      if (!selectedSale) return;
      confirmBag(selectedSale.id, keptItems);
      setIsBagProcessModalOpen(false);
      setSelectedSale(null); // Close main modal too to refresh
      alert("Malinha processada! Estoque e dívidas atualizados.");
  };

  const toggleItemKept = (productId: string, currentQty: number) => {
      // Toggle logic: For now, we assume simple toggle 0 or Full Qty. 
      // Advanced: Could allow partial qty return (e.g. took 2 shirts, kept 1). 
      // Let's implement full toggle for simplicity in UI, but logic supports partial.
      setKeptItems(prev => ({
          ...prev,
          [productId]: prev[productId] > 0 ? 0 : currentQty
      }));
  };

  const handlePrint = () => {
      window.print();
  };

  return (
    <div className="animate-fade-in pb-20">
      
      {/* Hidden Receipt Component for Printing */}
      <PrintableReceipt sale={selectedSale} />

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Histórico de Transações</h1>
          <p className="text-zinc-400">Consulte vendas passadas, malinhas em aberto e pagamentos.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 rounded-xl text-zinc-300 transition-colors text-sm">
            <ICONS.Calendar size={16} />
            <span>Exportar Relatório</span>
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
         <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-xl">
            <p className="text-zinc-500 text-sm mb-1">Transações Listadas</p>
            <p className="text-2xl font-bold text-white">{filteredSales.length}</p>
         </div>
         <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-xl">
            <p className="text-zinc-500 text-sm mb-1">Total Recebido (Geral)</p>
            <p className="text-2xl font-bold text-green-500">R$ {totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
         </div>
         <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-xl">
            <p className="text-zinc-500 text-sm mb-1">Total Pendente (Geral)</p>
            <p className="text-2xl font-bold text-yellow-500">R$ {totalPending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
         </div>
      </div>

      {/* Filters */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl mb-6 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2 relative">
                <ICONS.Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                <input 
                    type="text" 
                    placeholder="Buscar por nome do cliente..." 
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-brand-600"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <div>
                <select 
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:border-brand-600"
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value as any)}
                >
                    <option value="ALL">Todos os Tipos</option>
                    <option value="SALE">Vendas</option>
                    <option value="BAG">Malinhas</option>
                </select>
            </div>
            <div>
                <select 
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:border-brand-600"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                >
                    <option value="ALL">Todos os Status</option>
                    <option value="PAID">Pago</option>
                    <option value="PENDING">Pendente</option>
                    <option value="PARTIAL">Parcial</option>
                </select>
            </div>
        </div>
      </div>

      {/* Sales List */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
         {filteredSales.length === 0 ? (
            <div className="p-12 text-center text-zinc-500">
                <ICONS.Sales size={48} className="mx-auto mb-4 opacity-50" />
                <p>Nenhuma transação encontrada com os filtros atuais.</p>
            </div>
         ) : (
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-zinc-950/50 text-zinc-400 text-xs uppercase tracking-wider font-semibold">
                            <th className="p-4 border-b border-zinc-800">Data</th>
                            <th className="p-4 border-b border-zinc-800">Cliente</th>
                            <th className="p-4 border-b border-zinc-800">Tipo</th>
                            <th className="p-4 border-b border-zinc-800 text-right">Valor Total</th>
                            <th className="p-4 border-b border-zinc-800 text-right">Valor Pago</th>
                            <th className="p-4 border-b border-zinc-800 text-center">Status</th>
                            <th className="p-4 border-b border-zinc-800"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800">
                        {filteredSales.map(sale => (
                            <tr key={sale.id} className="group hover:bg-zinc-800/30 transition-colors cursor-pointer" onClick={() => setSelectedSale(sale)}>
                                <td className="p-4 text-zinc-400 text-sm whitespace-nowrap">
                                    {new Date(sale.created_at).toLocaleDateString('pt-BR')}
                                    <div className="text-[10px] text-zinc-600">
                                        {new Date(sale.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </td>
                                <td className="p-4 font-medium text-white">
                                    {sale.client_name}
                                </td>
                                <td className="p-4">
                                    {getTypeIcon(sale)}
                                </td>
                                <td className="p-4 text-right font-medium text-white">
                                    R$ {sale.total_amount.toFixed(2)}
                                </td>
                                <td className="p-4 text-right text-zinc-400">
                                    R$ {sale.paid_amount.toFixed(2)}
                                </td>
                                <td className="p-4 text-center">
                                    {getStatusBadge(sale.status)}
                                </td>
                                <td className="p-4 text-right text-zinc-500">
                                    <ICONS.Search size={16} className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
         )}
      </div>

      {/* Transaction Details Modal */}
      {selectedSale && !isPaymentModalOpen && !isBagProcessModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in" onClick={() => setSelectedSale(null)}>
           <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-0 w-full max-w-2xl shadow-2xl relative overflow-hidden" onClick={e => e.stopPropagation()}>
                
                {/* Modal Header */}
                <div className="p-6 border-b border-zinc-800 flex justify-between items-start bg-zinc-950/50">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <h3 className="text-xl font-bold text-white">Detalhes da Transação</h3>
                            {getStatusBadge(selectedSale.status)}
                        </div>
                        <p className="text-zinc-400 text-sm">ID: #{selectedSale.id} • {new Date(selectedSale.created_at).toLocaleString('pt-BR')}</p>
                    </div>
                    <button 
                        onClick={() => setSelectedSale(null)}
                        className="text-zinc-500 hover:text-white"
                    >
                        <ICONS.Plus className="rotate-45" size={24} />
                    </button>
                </div>

                <div className="p-6">
                    {/* Client Info */}
                    <div className="flex items-center gap-4 mb-6 p-4 bg-zinc-950 border border-zinc-800 rounded-xl">
                        <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-white text-lg">
                            {selectedSale.client_name?.charAt(0)}
                        </div>
                        <div>
                            <p className="text-sm text-zinc-500 font-medium uppercase">Cliente</p>
                            <p className="text-lg font-bold text-white">{selectedSale.client_name}</p>
                        </div>
                    </div>

                    {/* Items List */}
                    <h4 className="text-sm font-bold text-zinc-400 uppercase mb-3">Itens</h4>
                    <div className="space-y-3 mb-6">
                        {(selectedSale.items || []).map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 rounded-lg border border-zinc-800/50 bg-zinc-800/20">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded bg-zinc-800 overflow-hidden">
                                        {item.product_image ? (
                                            <img src={item.product_image} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-zinc-600"><ICONS.Inventory size={16}/></div>
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-white">{item.product_name}</p>
                                        <p className="text-xs text-zinc-500">Tam: {item.size} • Cor: {item.color}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-bold text-white">R$ {item.unit_price.toFixed(2)}</p>
                                    <p className="text-xs text-zinc-500">x{item.quantity}</p>
                                </div>
                            </div>
                        ))}
                        {(!selectedSale.items || selectedSale.items.length === 0) && (
                            <p className="text-zinc-500 text-sm">Detalhes dos itens não disponíveis.</p>
                        )}
                    </div>

                    {/* Financial Summary */}
                    <div className="border-t border-zinc-800 pt-4 space-y-2">
                        <div className="flex justify-between text-zinc-400 text-sm">
                            <span>Subtotal</span>
                            <span>R$ {selectedSale.total_amount.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-zinc-400 text-sm">
                            <span>Valor Pago</span>
                            <span className="text-green-500">- R$ {selectedSale.paid_amount.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center text-white font-bold text-lg pt-2">
                            <span>{selectedSale.paid_amount < selectedSale.total_amount ? 'Restante a Pagar' : 'Total Final'}</span>
                            <span className={selectedSale.paid_amount < selectedSale.total_amount ? 'text-red-500' : 'text-white'}>
                                R$ {(selectedSale.total_amount - selectedSale.paid_amount).toFixed(2)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-4 bg-zinc-950 border-t border-zinc-800 flex justify-end gap-3 flex-wrap">
                    <button 
                        onClick={handlePrint}
                        className="px-4 py-2 text-sm bg-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-700 rounded-lg transition-colors flex items-center gap-2"
                    >
                        <ICONS.Inventory size={16} /> {/* Printer Icon equiv */}
                        Recibo
                    </button>
                    
                    {/* BAG PROCESSING ACTION */}
                    {selectedSale.type === 'BAG' && selectedSale.status === 'PENDING' && (
                        <button 
                            onClick={() => handleOpenBagProcess(selectedSale)}
                            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-bold rounded-lg transition-colors shadow-lg shadow-purple-900/20 flex items-center gap-2"
                        >
                            <ICONS.Return size={16} />
                            Processar Retorno
                        </button>
                    )}

                    {selectedSale.status !== 'PAID' && (
                        <button 
                            onClick={() => setIsPaymentModalOpen(true)}
                            className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white text-sm font-bold rounded-lg transition-colors shadow-lg shadow-brand-900/20"
                        >
                            Registrar Pagamento
                        </button>
                    )}
                </div>

           </div>
        </div>
      )}

      {/* Bag Processing Modal (Passo 2) */}
      {isBagProcessModalOpen && selectedSale && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-fade-in">
             <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-2xl shadow-2xl relative flex flex-col max-h-[90vh]">
                 {/* Header */}
                 <div className="p-6 border-b border-zinc-800 bg-zinc-950/50">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <ICONS.Return className="text-purple-500" />
                        Processar Retorno de Malinha
                    </h3>
                    <p className="text-sm text-zinc-400 mt-1">
                        Marque os itens que a cliente <strong>FICOU</strong>. Os desmarcados voltarão para o estoque.
                    </p>
                 </div>

                 {/* Items Checklist */}
                 <div className="flex-1 overflow-y-auto p-6 space-y-3 custom-scrollbar">
                    {selectedSale.items && selectedSale.items.map(item => {
                        const isKept = (keptItems[item.product_id] || 0) > 0;
                        return (
                            <div 
                                key={item.product_id} 
                                className={`flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer ${
                                    isKept 
                                    ? 'bg-green-500/10 border-green-500/50' 
                                    : 'bg-zinc-950 border-zinc-800 opacity-60'
                                }`}
                                onClick={() => toggleItemKept(item.product_id, item.quantity)}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`w-6 h-6 rounded border flex items-center justify-center transition-colors ${
                                        isKept ? 'bg-green-500 border-green-500 text-white' : 'border-zinc-600'
                                    }`}>
                                        {isKept && <ICONS.Check size={14} />}
                                    </div>
                                    <div className="w-12 h-12 rounded bg-zinc-800 overflow-hidden">
                                        {item.product_image && <img src={item.product_image} className="w-full h-full object-cover" alt="" />}
                                    </div>
                                    <div>
                                        <p className={`font-medium ${isKept ? 'text-white' : 'text-zinc-500 line-through'}`}>{item.product_name}</p>
                                        <p className="text-xs text-zinc-500">{item.size} • {item.color}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className={`font-bold ${isKept ? 'text-white' : 'text-zinc-500'}`}>R$ {item.unit_price.toFixed(2)}</p>
                                    <span className={`text-[10px] px-2 py-0.5 rounded ${isKept ? 'bg-green-500/20 text-green-400' : 'bg-zinc-800 text-zinc-500'}`}>
                                        {isKept ? 'FICOU' : 'DEVOLVEU'}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                 </div>

                 {/* Footer Summary */}
                 <div className="p-6 bg-zinc-950 border-t border-zinc-800">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <p className="text-xs text-zinc-500 uppercase">Total Original</p>
                            <p className="text-zinc-400 line-through">R$ {selectedSale.total_amount.toFixed(2)}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-zinc-500 uppercase">Nova Dívida (Ficou)</p>
                            <p className="text-2xl font-bold text-white">
                                R$ {selectedSale.items?.reduce((acc, item) => acc + ((keptItems[item.product_id] || 0) > 0 ? (item.quantity * item.unit_price) : 0), 0).toFixed(2)}
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button 
                            onClick={() => setIsBagProcessModalOpen(false)}
                            className="flex-1 py-3 text-zinc-400 hover:bg-zinc-800 rounded-xl"
                        >
                            Cancelar
                        </button>
                        <button 
                            onClick={handleConfirmBagReturn}
                            className="flex-1 py-3 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-xl shadow-lg shadow-brand-900/20"
                        >
                            Confirmar Devolução
                        </button>
                    </div>
                 </div>
             </div>
        </div>
      )}

      {/* Payment Entry Modal */}
      {isPaymentModalOpen && selectedSale && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-fade-in">
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl relative">
                  <h3 className="text-xl font-bold text-white mb-4">Registrar Pagamento</h3>
                  
                  <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 mb-6">
                      <div className="flex justify-between items-center mb-1">
                          <span className="text-xs text-zinc-500 uppercase">Restante da Dívida</span>
                          <span className="text-xs text-zinc-500">Total: R$ {selectedSale.total_amount.toFixed(2)}</span>
                      </div>
                      <span className="text-2xl font-bold text-red-500">R$ {(selectedSale.total_amount - selectedSale.paid_amount).toFixed(2)}</span>
                  </div>

                  <label className="text-xs font-semibold text-zinc-500 uppercase mb-2 block">Valor a Pagar (R$)</label>
                  <input 
                      type="number" 
                      autoFocus
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 text-white text-lg font-bold mb-6 focus:outline-none focus:border-brand-600"
                      placeholder="0.00"
                      value={paymentAmount}
                      onChange={e => setPaymentAmount(e.target.value)}
                  />

                  <div className="flex gap-3">
                      <button 
                        onClick={() => setIsPaymentModalOpen(false)}
                        className="flex-1 py-3 text-zinc-400 hover:bg-zinc-800 rounded-xl transition-colors"
                      >
                        Cancelar
                      </button>
                      <button 
                        onClick={handlePaymentSubmit}
                        className="flex-1 py-3 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-xl transition-colors shadow-lg shadow-brand-900/20"
                      >
                        Confirmar
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};