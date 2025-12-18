import React, { useState, useMemo } from 'react';
import { 
  Search, Plus, X, ArrowRight, Star, ShoppingBag, Banknote, 
  Package, Users, AlertTriangle, Check
} from 'lucide-react';
import { Client, Product, Sale } from '../types';
import { useStore } from '../context/StoreContext';
import { useNavigate } from 'react-router-dom';

// Interface estendida para itens no carrinho
interface CartItem extends Product {
  cartQuantity: number;
}

export const NewSale = () => {
  const { clients, products, sales, addClient, addSale } = useStore(); 
  const navigate = useNavigate();

  // -- Estados Globais --
  const [step, setStep] = useState<1 | 2>(1);
  const [isProcessing, setIsProcessing] = useState(false);

  // -- Seleção de Cliente --
  const [searchClient, setSearchClient] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  
  // -- Modal Novo Cliente --
  const [isNewClientModalOpen, setIsNewClientModalOpen] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');

  // -- PDV / Carrinho --
  const [searchProduct, setSearchProduct] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [saleType, setSaleType] = useState<'SALE' | 'BAG'>('SALE');

  // -- Pagamento --
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'PIX' | 'CREDIT' | 'DEBIT'>('PIX');
  const [installments, setInstallments] = useState<number>(1);
  const [interestRate, setInterestRate] = useState<number>(0);

  // ------------------------------------------------------------------
  // Lógica e Cálculos
  // ------------------------------------------------------------------

  const filteredClients = useMemo(() => {
    return clients.filter(c => c.name.toLowerCase().includes(searchClient.toLowerCase()));
  }, [searchClient, clients]);

  const clientHistory = useMemo(() => {
    if (!selectedClient) return [];
    return (sales || []).filter(s => s.client_id === selectedClient.id).sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [selectedClient, sales]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => p.name.toLowerCase().includes(searchProduct.toLowerCase()));
  }, [searchProduct, products]);

  // Lógica do Carrinho
  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      
      const availableStock = product.stock_quantity - (product.on_bag_quantity || 0);
      const currentQtyInCart = existing ? existing.cartQuantity : 0;
      
      if (currentQtyInCart + 1 > availableStock) {
        alert("Estoque indisponível (itens reservados em malinhas ou esgotados).");
        return prev;
      }

      if (existing) {
        return prev.map(item => 
          item.id === product.id 
            ? { ...item, cartQuantity: item.cartQuantity + 1 }
            : item
        );
      }
      return [...prev, { ...product, cartQuantity: 1 }];
    });
    setSearchProduct('');
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.id === productId) {
          const newQty = item.cartQuantity + delta;
          if (newQty < 1) return item; 
          
          const productInStore = products.find(p => p.id === productId);
          if (productInStore) {
             const available = productInStore.stock_quantity - (productInStore.on_bag_quantity || 0);
             if (newQty > available) {
                 alert("Limite de estoque atingido.");
                 return item;
             }
          }
          return { ...item, cartQuantity: newQty };
        }
        return item;
      });
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  };

  // Cálculos Financeiros
  const subtotal = cart.reduce((acc, item) => acc + (item.sale_price * item.cartQuantity), 0);
  const totalItems = cart.reduce((acc, item) => acc + item.cartQuantity, 0);

  const paymentDetails = useMemo(() => {
    let totalInterest = 0;
    if (interestRate > 0) {
      totalInterest = subtotal * (interestRate / 100);
    }
    const finalTotal = subtotal + totalInterest;
    const installmentValue = installments > 0 ? finalTotal / installments : finalTotal;

    return { finalTotal, totalInterest, installmentValue };
  }, [subtotal, paymentMethod, installments, interestRate]);

  // ------------------------------------------------------------------
  // Ações (Handlers)
  // ------------------------------------------------------------------

  const handleCreateClient = async () => {
    if (!newClientName.trim()) {
      alert('Nome do cliente é obrigatório.');
      return;
    }
    const newClient: Client = {
      id: Date.now().toString(),
      name: newClientName,
      phone: newClientPhone,
      whatsapp: newClientPhone,
      address: '',
      trust_score: 3, 
      credit_limit: 500,
      current_debt: 0
    };
    await addClient(newClient); 
    setSelectedClient(newClient);
    setIsNewClientModalOpen(false);
    setNewClientName('');
    setNewClientPhone('');
  };

  const handleFinish = async () => {
    if (!selectedClient) return;
    if (cart.length === 0) return alert("Carrinho vazio!");

    setIsProcessing(true);
    
    // 1. Preparar ID Único da Venda
    const saleId = crypto.randomUUID(); 

    // 2. Preparar Itens (Vinculando ao sale_id)
    const saleItems = cart.map(cItem => ({
        sale_id: saleId, // IMPORTANTE: Vincula o item à venda
        product_id: cItem.id,
        product_name: cItem.name,
        product_image: cItem.image_url,
        quantity: cItem.cartQuantity,
        unit_price: cItem.sale_price,
        size: cItem.size,
        color: cItem.color
    }));

    // 3. Criar Objeto de Venda
    const newSale: any = {
        id: saleId,
        client_id: selectedClient.id,
        client_name: selectedClient.name,
        total_amount: paymentDetails.finalTotal,
        paid_amount: saleType === 'SALE' ? paymentDetails.finalTotal : 0,
        status: saleType === 'SALE' ? 'PAID' : 'PENDING',
        type: saleType,
        created_at: new Date().toISOString(),
        payment_method: saleType === 'SALE' ? paymentMethod : null
    };

    try {
        // Envia para o Contexto salvar no Banco
        await addSale(newSale, saleItems);

        let msg = '';
        if (saleType === 'SALE') {
          msg = `Venda realizada!\nTotal: R$ ${paymentDetails.finalTotal.toFixed(2)}`;
        } else {
          msg = `Malinha criada para ${selectedClient?.name}!\nDívida: R$ ${paymentDetails.finalTotal.toFixed(2)}`;
          if (installments > 1) {
            msg += `\nParcelamento: ${installments}x de R$ ${paymentDetails.installmentValue.toFixed(2)}`;
          }
        }
        
        alert(msg);
        
        // Reset Total
        setCart([]);
        setStep(1);
        setSelectedClient(null);
        setInstallments(1);
        setInterestRate(0);
        setPaymentMethod('PIX');
        
        navigate('/sales'); // Redireciona para o histórico
    } catch (error: any) {
        console.error("Erro ao finalizar venda:", error);
        
        // Verifica se o erro foi "Caixa Fechado"
        if (error.message === "CAIXA_FECHADO") {
            const irParaCaixa = window.confirm(
                "⚠️ CAIXA FECHADO!\n\nVocê precisa abrir o caixa do dia antes de realizar vendas.\nDeseja ir para a tela de Abertura de Caixa agora?"
            );
            if (irParaCaixa) {
                navigate('/cash-register');
            }
        } else {
            alert("Erro ao salvar venda: " + (error.message || "Erro desconhecido"));
        }
    } finally {
        setIsProcessing(false);
    }
  };

  // ------------------------------------------------------------------
  // Renderização Auxiliar
  // ------------------------------------------------------------------

  const renderHistoryItem = (sale: Sale) => (
    <div key={sale.id} className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 flex items-center justify-between group hover:border-zinc-700 transition-colors">
        <div className="flex items-center gap-4">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${sale.type === 'BAG' ? 'bg-purple-500/10 text-purple-500' : 'bg-green-500/10 text-green-500'}`}>
                {sale.type === 'BAG' ? <ShoppingBag size={18} /> : <Banknote size={18} />}
            </div>
            <div>
                <p className="text-sm font-bold text-white">
                    {sale.type === 'BAG' ? 'Sacola Condicional' : 'Venda Direta'}
                </p>
                <p className="text-xs text-zinc-500">
                    {new Date(sale.created_at).toLocaleDateString('pt-BR')} • {new Date(sale.created_at).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}
                </p>
            </div>
        </div>
        <div className="text-right">
            <p className="text-sm font-bold text-white">R$ {(Number(sale.total_amount) || 0).toFixed(2)}</p>
            <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                sale.status === 'PAID' ? 'bg-green-500/10 text-green-500' : 
                sale.status === 'PENDING' ? 'bg-yellow-500/10 text-yellow-500' : 
                'bg-blue-500/10 text-blue-500'
            }`}>
                {sale.status === 'PAID' ? 'Pago' : sale.status === 'PENDING' ? 'Pendente' : 'Parcial'}
            </span>
        </div>
    </div>
  );

  return (
    <div className="h-[calc(100vh-140px)] md:h-[calc(100vh-100px)] flex flex-col animate-fade-in">
      
      {/* Top Bar Navigation */}
      <div className="flex items-center justify-between mb-4 md:mb-6 shrink-0">
        <div>
           {step === 1 ? (
             <>
                <h1 className="text-2xl md:text-3xl font-bold text-white">Nova Venda</h1>
                <p className="text-zinc-400 text-sm">Selecione o cliente e confira o histórico.</p>
             </>
           ) : (
             <div className="flex items-center gap-3">
                <button 
                  onClick={() => setStep(1)} 
                  className="p-2 bg-zinc-900 border border-zinc-800 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
                >
                   <ArrowRight size={20} className="rotate-180" />
                </button>
                <div>
                   <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                     Caixa 
                     <span className="text-sm font-normal text-zinc-500 bg-zinc-900 px-2 py-0.5 rounded-md border border-zinc-800">
                        {saleType === 'SALE' ? 'Venda Direta' : 'Malinha / Fiado'}
                     </span>
                   </h1>
                   <p className="text-zinc-400 text-xs">Atendendo: <span className="text-brand-500 font-bold">{selectedClient?.name}</span></p>
                </div>
             </div>
           )}
        </div>
        
        {/* Progress Steps */}
        <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${step === 1 ? 'bg-brand-600 text-white' : 'bg-zinc-800 text-zinc-500'}`}>1. Cliente</span>
            <div className="w-8 h-[1px] bg-zinc-800" />
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${step === 2 ? 'bg-brand-600 text-white' : 'bg-zinc-800 text-zinc-500'}`}>2. Caixa</span>
        </div>
      </div>

      {/* STEP 1: CLIENT SELECTION & HISTORY INSPECTION */}
      {step === 1 && (
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 overflow-hidden">
            
            {/* LEFT: Client List */}
            <div className={`flex flex-col bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden transition-all ${selectedClient ? 'hidden lg:flex lg:col-span-4' : 'col-span-12'}`}>
                <div className="p-4 border-b border-zinc-800 bg-zinc-900/50 space-y-3">
                      <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={20} />
                        <input 
                            type="text" 
                            placeholder="Buscar cliente..." 
                            autoFocus
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-brand-600 transition-colors"
                            value={searchClient}
                            onChange={(e) => setSearchClient(e.target.value)}
                        />
                    </div>
                    <button 
                        onClick={() => setIsNewClientModalOpen(true)}
                        className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl transition-colors border border-zinc-700 flex items-center justify-center gap-2"
                    >
                        <Plus size={18} />
                        <span>Novo Cliente</span>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-2">
                    {filteredClients.map(client => (
                        <button 
                            key={client.id}
                            onClick={() => setSelectedClient(client)}
                            className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                                selectedClient?.id === client.id 
                                ? 'bg-brand-600/10 border-brand-600' 
                                : 'bg-zinc-950 border-zinc-800 hover:border-zinc-600 hover:bg-zinc-900'
                            }`}
                        >
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${selectedClient?.id === client.id ? 'bg-brand-600 text-white' : 'bg-zinc-800 text-white'}`}>
                                {client.name ? client.name.charAt(0) : '?'}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className={`font-bold truncate ${selectedClient?.id === client.id ? 'text-brand-500' : 'text-white'}`}>{client.name}</h3>
                                <p className="text-zinc-500 text-xs truncate">{client.whatsapp || client.phone}</p>
                            </div>
                            {client.current_debt > 0 && (
                                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" title="Débito Pendente" />
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* RIGHT: Client Details & History */}
            <div className={`bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden flex flex-col ${selectedClient ? 'col-span-12 lg:col-span-8 flex' : 'hidden lg:flex lg:col-span-8 items-center justify-center text-zinc-600'}`}>
                {selectedClient ? (
                    <>
                        <div className="p-6 border-b border-zinc-800 bg-zinc-900 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                             <div className="flex items-center gap-4">
                                 <div className="w-16 h-16 rounded-full bg-zinc-800 border-2 border-zinc-700 overflow-hidden">
                                     {selectedClient.image_url ? (
                                         <img src={selectedClient.image_url} alt="" className="w-full h-full object-cover" />
                                     ) : (
                                         <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-zinc-500">{selectedClient.name ? selectedClient.name.charAt(0) : '?'}</div>
                                     )}
                                 </div>
                                 <div>
                                     <h2 className="text-2xl font-bold text-white">{selectedClient.name}</h2>
                                     <div className="flex items-center gap-3 text-sm text-zinc-400 mt-1">
                                         <span>{selectedClient.whatsapp || selectedClient.phone}</span>
                                     </div>
                                 </div>
                             </div>
                             <div className="flex gap-2 w-full sm:w-auto">
                                 <button 
                                    onClick={() => setSelectedClient(null)} 
                                    className="lg:hidden p-3 bg-zinc-800 rounded-xl text-white"
                                 >
                                    <X size={20} />
                                 </button>
                                 <button 
                                    onClick={() => setStep(2)}
                                    className="flex-1 sm:flex-none px-6 py-3 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-xl shadow-lg shadow-brand-900/20 flex items-center justify-center gap-2 transition-transform active:scale-95"
                                 >
                                     <span>Iniciar Venda</span>
                                     <ArrowRight size={20} />
                                 </button>
                             </div>
                        </div>

                        <div className="grid grid-cols-3 gap-1 p-4 bg-zinc-950/30 border-b border-zinc-800">
                             <div className="text-center border-r border-zinc-800 last:border-0">
                                 <p className="text-xs text-zinc-500 uppercase font-bold mb-1">Total Gasto</p>
                                 <p className="text-white font-bold">R$ {clientHistory.reduce((acc, s) => acc + (Number(s.total_amount) || 0), 0).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</p>
                             </div>
                             <div className="text-center border-r border-zinc-800 last:border-0">
                                 <p className="text-xs text-zinc-500 uppercase font-bold mb-1">Última Compra</p>
                                 <p className="text-white font-bold">{clientHistory.length > 0 ? new Date(clientHistory[0].created_at).toLocaleDateString('pt-BR') : '-'}</p>
                             </div>
                             <div className="text-center border-r border-zinc-800 last:border-0">
                                 <p className="text-xs text-zinc-500 uppercase font-bold mb-1">Dívida Atual</p>
                                 <p className={`${selectedClient.current_debt > 0 ? 'text-red-500' : 'text-green-500'} font-bold`}>
                                     R$ {(selectedClient.current_debt || 0).toFixed(2)}
                                 </p>
                             </div>
                        </div>

                        <div className="flex-1 overflow-hidden flex flex-col bg-zinc-900/50">
                            <div className="p-4 flex items-center gap-2">
                                <ShoppingBag size={18} className="text-zinc-500" />
                                <h3 className="font-bold text-white">Histórico de Vendas</h3>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 pt-0 custom-scrollbar space-y-3">
                                {clientHistory.length > 0 ? (
                                    clientHistory.map(sale => renderHistoryItem(sale))
                                ) : (
                                    <div className="h-40 flex flex-col items-center justify-center text-zinc-500 border-2 border-dashed border-zinc-800 rounded-xl m-2">
                                        <Package size={32} className="mb-2 opacity-50" />
                                        <p className="text-sm">Nenhuma venda registrada para este cliente.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center gap-4 opacity-50">
                        <div className="w-20 h-20 bg-zinc-800 rounded-full flex items-center justify-center">
                            <Users size={40} />
                        </div>
                        <div className="text-center">
                            <h3 className="text-xl font-bold text-white">Selecione um Cliente</h3>
                            <p className="text-sm">Escolha um cliente na lista para visualizar<br/>o histórico completo e iniciar uma venda.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
      )}

      {/* STEP 2: POS INTERFACE */}
      {step === 2 && selectedClient && (
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden">
            
            {/* LEFT: PRODUCT CATALOG */}
            <div className="lg:col-span-2 flex flex-col bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                {/* Search Bar */}
                <div className="p-4 border-b border-zinc-800 bg-zinc-900/50">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={20} />
                        <input 
                            type="text" 
                            placeholder="Buscar produto por nome, código..." 
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-brand-600"
                            value={searchProduct}
                            onChange={(e) => setSearchProduct(e.target.value)}
                        />
                    </div>
                </div>

                {/* Product Grid */}
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                        {filteredProducts.map(product => {
                            const inCart = cart.find(i => i.id === product.id)?.cartQuantity || 0;
                            const available = (product.stock_quantity - (product.on_bag_quantity || 0)) - inCart;
                            const isOOS = available <= 0;

                            return (
                                <button 
                                    key={product.id}
                                    disabled={isOOS}
                                    onClick={() => addToCart(product)}
                                    className={`relative group flex flex-col text-left rounded-xl border transition-all overflow-hidden ${
                                        isOOS 
                                        ? 'border-zinc-800 opacity-50 cursor-not-allowed bg-zinc-950' 
                                        : 'border-zinc-800 bg-zinc-950 hover:border-brand-600 hover:shadow-lg hover:shadow-brand-900/10 cursor-pointer'
                                    }`}
                                >
                                    <div className="aspect-[3/4] w-full bg-zinc-900 relative">
                                        {product.image_url ? (
                                                <img src={product.image_url} alt={product.name} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                                        ) : (
                                                <div className="w-full h-full flex items-center justify-center"><Package className="text-zinc-700"/></div>
                                        )}
                                        {isOOS && (
                                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center flex-col p-2">
                                                <span className="text-white font-bold text-xs bg-red-600 px-2 py-1 rounded mb-1">INDISPONÍVEL</span>
                                            </div>
                                        )}
                                        {inCart > 0 && (
                                            <div className="absolute top-2 right-2 bg-brand-600 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center shadow-lg">
                                                {inCart}
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-3">
                                        <h4 className="text-sm font-medium text-white line-clamp-1">{product.name}</h4>
                                        <div className="flex justify-between items-center mt-1">
                                            <span className="text-zinc-500 text-xs">{product.size}</span>
                                            <span className="text-brand-500 font-bold text-sm">R$ {product.sale_price}</span>
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* RIGHT: CART & CHECKOUT */}
            <div className="flex flex-col bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden h-full">
                
                {/* Mode Toggles */}
                <div className="p-4 border-b border-zinc-800">
                    <div className="grid grid-cols-2 gap-2 p-1 bg-zinc-950 rounded-xl border border-zinc-800">
                        <button 
                            onClick={() => { setSaleType('SALE'); setInstallments(1); }}
                            className={`py-2 text-xs font-bold uppercase tracking-wide rounded-lg transition-all ${saleType === 'SALE' ? 'bg-zinc-800 text-white shadow' : 'text-zinc-500 hover:text-zinc-300'}`}
                        >
                            Venda
                        </button>
                        <button 
                            onClick={() => { setSaleType('BAG'); setInstallments(1); }}
                            className={`py-2 text-xs font-bold uppercase tracking-wide rounded-lg transition-all ${saleType === 'BAG' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/20' : 'text-zinc-500 hover:text-zinc-300'}`}
                        >
                            Malinha / Fiado
                        </button>
                    </div>
                </div>

                {/* Cart Items List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                    {cart.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-zinc-600 space-y-4 opacity-50">
                            <ShoppingBag size={48} className="stroke-1" />
                            <p className="text-sm">Carrinho vazio</p>
                        </div>
                    ) : (
                        cart.map(item => (
                            <div key={item.id} className="flex gap-3 bg-zinc-950 p-3 rounded-xl border border-zinc-800">
                                {item.image_url ? (
                                    <img src={item.image_url} alt="" className="w-12 h-16 object-cover rounded-lg bg-zinc-900" />
                                ) : (
                                    <div className="w-12 h-16 rounded-lg bg-zinc-900 flex items-center justify-center"><Package size={20} className="text-zinc-700"/></div>
                                )}
                                <div className="flex-1 flex flex-col justify-between">
                                    <div className="flex justify-between items-start">
                                        <span className="text-sm font-medium text-white line-clamp-1">{item.name}</span>
                                        <button onClick={() => removeFromCart(item.id)} className="text-zinc-600 hover:text-red-500">
                                            <X size={14} />
                                        </button>
                                    </div>
                                    <div className="flex justify-between items-end">
                                        <div className="flex items-center gap-2 bg-zinc-900 rounded-lg p-1 border border-zinc-800">
                                            <button onClick={() => updateQuantity(item.id, -1)} className="w-6 h-6 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 rounded">-</button>
                                            <span className="text-xs font-bold text-white w-4 text-center">{item.cartQuantity}</span>
                                            <button onClick={() => updateQuantity(item.id, 1)} className="w-6 h-6 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 rounded">+</button>
                                        </div>
                                        <span className="text-sm font-bold text-white">R$ {(item.sale_price * item.cartQuantity).toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Footer / Payment Config */}
                <div className="bg-zinc-950 border-t border-zinc-800 p-4 space-y-4">
                    
                    {/* Totals */}
                    <div className="space-y-1">
                        <div className="flex justify-between text-zinc-500 text-sm">
                            <span>Itens ({totalItems})</span>
                            <span>R$ {subtotal.toFixed(2)}</span>
                        </div>
                        {paymentDetails.totalInterest > 0 && (
                             <div className="flex justify-between text-red-400 text-sm">
                                <span>Juros ({interestRate}%)</span>
                                <span>+ R$ {paymentDetails.totalInterest.toFixed(2)}</span>
                            </div>
                        )}
                        <div className="flex justify-between text-white font-bold text-xl pt-2 border-t border-zinc-800 mt-2">
                            <span>Total</span>
                            <span>R$ {paymentDetails.finalTotal.toFixed(2)}</span>
                        </div>
                    </div>

                    {/* Controls: SALE */}
                    {saleType === 'SALE' && (
                        <div className="space-y-3 pt-2">
                             <select 
                                value={paymentMethod} 
                                onChange={(e) => { setPaymentMethod(e.target.value as any); setInstallments(1); setInterestRate(0); }}
                                className="w-full bg-zinc-900 border border-zinc-800 text-white text-sm rounded-lg p-2.5 focus:border-brand-600 focus:outline-none"
                             >
                                <option value="PIX">Pix / Dinheiro</option>
                                <option value="CREDIT">Cartão de Crédito</option>
                                <option value="DEBIT">Cartão de Débito</option>
                             </select>

                             {paymentMethod === 'CREDIT' && (
                                <div className="grid grid-cols-2 gap-2 animate-fade-in">
                                    <div className="relative">
                                        <span className="absolute left-2 top-2 text-[10px] text-zinc-500 uppercase font-bold">Parc.</span>
                                        <select 
                                            value={installments}
                                            onChange={(e) => setInstallments(Number(e.target.value))}
                                            className="w-full bg-zinc-900 border border-zinc-800 text-white text-sm rounded-lg pt-6 pb-2 px-2 focus:border-brand-600 focus:outline-none"
                                        >
                                            {[1,2,3,4,5,6,10,12].map(i => <option key={i} value={i}>{i}x</option>)}
                                        </select>
                                    </div>
                                    <div className="relative">
                                        <span className="absolute left-2 top-2 text-[10px] text-zinc-500 uppercase font-bold">Juros %</span>
                                        <input 
                                            type="number" 
                                            value={interestRate}
                                            onChange={(e) => setInterestRate(Number(e.target.value))}
                                            className="w-full bg-zinc-900 border border-zinc-800 text-white text-sm rounded-lg pt-6 pb-2 px-2 focus:border-brand-600 focus:outline-none"
                                        />
                                    </div>
                                </div>
                             )}
                        </div>
                    )}

                    {/* Controls: BAG/MALINHA - Installment Planning */}
                    {saleType === 'BAG' && (
                         <div className="space-y-3 pt-2">
                             <div className="flex items-center gap-2 p-2 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                                <AlertTriangle size={16} className="text-purple-400" />
                                <span className="text-xs text-purple-200">Itens serão reservados. Dívida será criada.</span>
                             </div>
                             
                             <div className="relative">
                                <span className="absolute left-2 top-2 text-[10px] text-zinc-500 uppercase font-bold">Parcelar Malinha em:</span>
                                <select 
                                    value={installments}
                                    onChange={(e) => setInstallments(Number(e.target.value))}
                                    className="w-full bg-zinc-900 border border-zinc-800 text-white text-sm rounded-lg pt-6 pb-2 px-2 focus:border-brand-600 focus:outline-none"
                                >
                                    {[1,2,3,4,5,6,10,12].map(i => <option key={i} value={i}>{i}x</option>)}
                                </select>
                            </div>
                         </div>
                    )}

                    {/* Installment Summary Display (Common) */}
                    {installments > 1 && (
                         <div className="text-center text-xs text-brand-500 font-medium bg-brand-500/10 py-2 rounded-lg animate-fade-in">
                             {installments}x de R$ {paymentDetails.installmentValue.toFixed(2)}
                         </div>
                    )}

                    <button 
                        disabled={cart.length === 0 || isProcessing}
                        onClick={handleFinish}
                        className="w-full py-3.5 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-lg shadow-brand-900/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                        {isProcessing ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Check size={20} />}
                        <span>{saleType === 'SALE' ? 'Finalizar Venda' : 'Confirmar Malinha'}</span>
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* New Client Modal */}
      {isNewClientModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
             <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-md shadow-2xl relative">
                <button onClick={() => setIsNewClientModalOpen(false)} className="absolute top-4 right-4 text-zinc-500 hover:text-white">
                    <X size={24} />
                </button>
                <h3 className="text-xl font-bold text-white mb-1">Novo Cliente</h3>
                <p className="text-zinc-400 text-sm mb-6">Cadastro rápido para venda.</p>
                <div className="space-y-4 mb-8">
                    <input 
                        type="text" 
                        autoFocus
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-brand-600"
                        placeholder="Nome Completo *"
                        value={newClientName}
                        onChange={(e) => setNewClientName(e.target.value)}
                    />
                    <input 
                        type="text" 
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-brand-600"
                        placeholder="WhatsApp (Opcional)"
                        value={newClientPhone}
                        onChange={(e) => setNewClientPhone(e.target.value)}
                    />
                </div>
                <button 
                    onClick={handleCreateClient}
                    disabled={!newClientName.trim()}
                    className="w-full py-3 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white font-bold rounded-xl"
                >
                    Cadastrar e Selecionar
                </button>
             </div>
        </div>
      )}
    </div>
  );
};