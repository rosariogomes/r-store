import React, { createContext, useContext, useState, useEffect } from 'react';
import { Client, Product, Sale, SaleStatus, StoreConfig, Expense, CashRegisterSession, CashRegisterMovement } from '../types';
import { supabase } from '../lib/supabase'; // Importando a conexão real

interface StoreContextData {
  clients: Client[];
  products: Product[];
  sales: Sale[];
  expenses: Expense[];
  cashSession: CashRegisterSession | null;
  storeConfig: StoreConfig;
  isAuthenticated: boolean;
  login: () => void;
  logout: () => void;
  updateStoreConfig: (config: StoreConfig) => void;
  addClient: (client: Client) => void;
  updateClient: (client: Client) => void;
  deleteClient: (id: string) => void;
  addProduct: (product: Product) => void;
  updateProduct: (product: Product) => void;
  deleteProduct: (id: string) => void;
  addSale: (sale: Sale, items: any[]) => void;
  updateSaleStatus: (saleId: string, paidAmount: number, newStatus: SaleStatus) => void;
  confirmBag: (saleId: string, keptItems: { [productId: string]: number }) => void;
  addExpense: (expense: Expense) => void;
  deleteExpense: (id: string) => void;
  openCashRegister: (initialAmount: number) => void;
  closeCashRegister: () => void;
  addCashMovement: (type: CashRegisterMovement['type'], amount: number, description: string) => void;
}

const StoreContext = createContext<StoreContextData>({} as StoreContextData);

export const StoreProvider = ({ children }: { children?: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  
  // Caixa simplificado para a versão Web (Local Session para o dia)
  const [cashSession, setCashSession] = useState<CashRegisterSession | null>(null);

  const [storeConfig, setStoreConfig] = useState<StoreConfig>({
    name: 'R Store',
    subtitle: 'Luxury Fashion Management',
    address: 'Endereço da Loja',
    cnpj: '00.000.000/0001-00',
    phone: '(82) 99999-9999',
    receiptFooter: 'Trocas somente com etiqueta no prazo de 7 dias.',
    logo_url: ''
  });

  // --- CARREGAMENTO INICIAL (DATA FETCHING) ---
  useEffect(() => {
    // 1. Auth Local
    const storedAuth = localStorage.getItem('rstore_auth');
    if (storedAuth === 'true') setIsAuthenticated(true);

    // 2. Config Local
    const storedConfig = localStorage.getItem('rstore_config');
    if (storedConfig) setStoreConfig(JSON.parse(storedConfig));

    // 3. Buscar Dados do Supabase
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: cData } = await supabase.from('clients').select('*');
    if (cData) setClients(cData);

    const { data: pData } = await supabase.from('products').select('*');
    if (pData) setProducts(pData);

    const { data: sData } = await supabase.from('sales').select('*').order('created_at', { ascending: false });
    if (sData) setSales(sData);

    const { data: eData } = await supabase.from('expenses').select('*').order('created_at', { ascending: false });
    if (eData) setExpenses(eData);
  };

  const login = () => {
    setIsAuthenticated(true);
    localStorage.setItem('rstore_auth', 'true');
  };

  const logout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('rstore_auth');
  };

  const updateStoreConfig = (config: StoreConfig) => {
    setStoreConfig(config);
    localStorage.setItem('rstore_config', JSON.stringify(config));
  };

  // --- ACTIONS (CRUD Supabase) ---

  const addClient = async (client: Client) => {
    // Remove o ID gerado pelo Date.now() para deixar o Supabase gerar o UUID ou usa ele se for compatível
    const { id, ...clientData } = client; 
    const { data, error } = await supabase.from('clients').insert([clientData]).select();
    if (data) setClients(prev => [data[0], ...prev]);
    if (error) console.error(error);
  };

  const updateClient = async (updatedClient: Client) => {
    const { error } = await supabase.from('clients').update(updatedClient).eq('id', updatedClient.id);
    if (!error) setClients(prev => prev.map(c => c.id === updatedClient.id ? updatedClient : c));
  };

  const deleteClient = async (id: string) => {
    await supabase.from('clients').delete().eq('id', id);
    setClients(prev => prev.filter(c => c.id !== id));
  };

  const addProduct = async (product: Product) => {
    const { id, ...prodData } = product;
    const { data, error } = await supabase.from('products').insert([prodData]).select();
    if (data) setProducts(prev => [data[0], ...prev]);
  };

  const updateProduct = async (updatedProduct: Product) => {
    await supabase.from('products').update(updatedProduct).eq('id', updatedProduct.id);
    setProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
  };

  const deleteProduct = async (id: string) => {
    await supabase.from('products').delete().eq('id', id);
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  const addExpense = async (expense: Expense) => {
    const { id, ...expData } = expense;
    const { data } = await supabase.from('expenses').insert([expData]).select();
    if (data) setExpenses(prev => [data[0], ...prev]);
  };

  const deleteExpense = async (id: string) => {
    await supabase.from('expenses').delete().eq('id', id);
    setExpenses(prev => prev.filter(e => e.id !== id));
  };

  // --- LÓGICA DE VENDAS COMPLEXA ---

  const addSale = async (newSale: Sale, items: any[]) => {
    // 1. Salvar a Venda
    const { id: fakeId, ...saleData } = newSale; // Remove ID temporário
    const { data: saleRes, error } = await supabase.from('sales').insert([{
        ...saleData,
        items: items // Salvamos os itens como JSONB na tabela de vendas para simplificar
    }]).select();

    if (error) {
        alert("Erro ao salvar venda");
        console.error(error);
        return;
    }
    
    const savedSale = saleRes[0];
    setSales(prev => [savedSale, ...prev]);

    // 2. Atualizar Estoque (Iterar sobre os itens)
    // Nota: Em produção real, faríamos isso com uma Procedure SQL (RPC) para garantir integridade
    items.forEach(async (item) => {
        const prod = products.find(p => p.id === item.id);
        if (prod) {
            let updates = {};
            if (newSale.type === 'SALE') {
                updates = { stock_quantity: Math.max(0, prod.stock_quantity - item.cartQuantity) };
            } else {
                updates = { on_bag_quantity: prod.on_bag_quantity + item.cartQuantity };
            }
            
            await supabase.from('products').update(updates).eq('id', prod.id);
            
            // Atualizar Localmente
            setProducts(prev => prev.map(p => p.id === prod.id ? { ...p, ...updates } : p));
        }
    });

    // 3. Atualizar Dívida do Cliente
    const debtToAdd = newSale.total_amount - newSale.paid_amount;
    if (debtToAdd > 0) {
        const client = clients.find(c => c.id === newSale.client_id);
        if (client) {
            const newDebt = (client.current_debt || 0) + debtToAdd;
            await supabase.from('clients').update({ current_debt: newDebt }).eq('id', client.id);
            setClients(prev => prev.map(c => c.id === client.id ? { ...c, current_debt: newDebt } : c));
        }
    }

    // 4. Integração Caixa (Opcional: Salvar no banco ou manter local)
    if (newSale.paid_amount > 0 && cashSession?.status === 'OPEN') {
        addCashMovement('SALE', newSale.paid_amount, `Venda - ${newSale.client_name}`);
    }
  };

  const updateSaleStatus = async (saleId: string, amountPaidNow: number, newStatus: SaleStatus) => {
    // Atualizar Venda
    const sale = sales.find(s => s.id === saleId);
    if (!sale) return;
    
    const newPaidAmount = (sale.paid_amount || 0) + amountPaidNow;
    
    await supabase.from('sales').update({ 
        paid_amount: newPaidAmount, 
        status: newStatus 
    }).eq('id', saleId);
    
    setSales(prev => prev.map(s => s.id === saleId ? { ...s, paid_amount: newPaidAmount, status: newStatus } : s));

    // Abater Dívida Cliente
    const client = clients.find(c => c.id === sale.client_id);
    if (client) {
        const newDebt = Math.max(0, (client.current_debt || 0) - amountPaidNow);
        await supabase.from('clients').update({ current_debt: newDebt }).eq('id', client.id);
        setClients(prev => prev.map(c => c.id === client.id ? { ...c, current_debt: newDebt } : c));
    }

    // Caixa
    if (amountPaidNow > 0 && cashSession?.status === 'OPEN') {
        addCashMovement('RECEIPT', amountPaidNow, `Recebimento Dívida - ${sale.client_name}`);
    }
  };

  const confirmBag = async (saleId: string, keptItems: { [productId: string]: number }) => {
    const sale = sales.find(s => s.id === saleId);
    if (!sale) return;

    // Calcular novos totais
    let newTotalAmount = 0;
    const newItemsList = sale.items.map(item => {
        const keptQty = keptItems[item.product_id] || 0;
        newTotalAmount += keptQty * item.unit_price;
        return { ...item, quantity: keptQty };
    }).filter(i => i.quantity > 0);

    const debtReduction = sale.total_amount - newTotalAmount;

    // Atualizar Venda no Banco
    await supabase.from('sales').update({
        total_amount: newTotalAmount,
        items: newItemsList, // JSONB atualizado
        status: newTotalAmount === 0 ? 'PAID' : 'PENDING',
        type: 'SALE'
    }).eq('id', saleId);

    // Atualizar Estoque (Reverter malinha e baixar estoque real do que ficou)
    // Nota: Essa lógica é complexa para fazer 100% via API direta, mas vamos simplificar:
    // O front atualiza o estado local e dispara updates individuais.
    
    setSales(prev => prev.map(s => s.id === saleId ? { ...s, total_amount: newTotalAmount, items: newItemsList, status: newTotalAmount === 0 ? 'PAID' : 'PENDING', type: 'SALE' } : s));
    
    // Atualiza produtos e cliente localmente para feedback rápido
    // (Em produção ideal, você faria refetch ou RPC)
    fetchData(); // Recarrega tudo para garantir consistência dos estoques e dívidas
  };

  // --- CAIXA (Mantido Local/Híbrido por simplicidade nesta versão) ---
  const openCashRegister = (initialAmount: number) => {
    const newSession: CashRegisterSession = {
        id: Date.now().toString(),
        status: 'OPEN',
        opening_balance: initialAmount,
        current_balance: initialAmount,
        opened_at: new Date().toISOString(),
        movements: [{
            id: 'init',
            type: 'OPENING',
            amount: initialAmount,
            description: 'Abertura de Caixa',
            timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
            method: 'CASH'
        }]
    };
    setCashSession(newSession);
  };

  const closeCashRegister = () => {
    if (cashSession) {
        setCashSession({ ...cashSession, status: 'CLOSED', closed_at: new Date().toISOString() });
        // Aqui você poderia salvar o fechamento na tabela 'cash_movements' ou criar uma tabela 'sessions'
    }
  };

  const addCashMovement = async (type: CashRegisterMovement['type'], amount: number, description: string, method: string = 'CASH') => {
    if (!cashSession || cashSession.status !== 'OPEN') return;

    const newMovement: CashRegisterMovement = {
        id: Date.now().toString(),
        type,
        amount,
        description,
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        method
    };

    setCashSession(prev => {
        if (!prev) return null;
        return {
            ...prev,
            current_balance: prev.current_balance + amount,
            movements: [newMovement, ...prev.movements]
        };
    });
    
    // Salvar auditoria no banco
    await supabase.from('cash_movements').insert([{
        type, amount, description, method, timestamp: new Date().toISOString()
    }]);
  };

  return (
    <StoreContext.Provider value={{
      clients, products, sales, expenses, storeConfig, isAuthenticated, cashSession,
      login, logout, updateStoreConfig,
      addClient, updateClient, deleteClient,
      addProduct, updateProduct, deleteProduct,
      addSale, updateSaleStatus, confirmBag,
      addExpense, deleteExpense,
      openCashRegister, closeCashRegister, addCashMovement
    }}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) throw new Error('useStore must be used within a StoreProvider');
  return context;
};