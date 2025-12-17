import React, { createContext, useContext, useState, useEffect } from 'react';
import { Client, Product, Sale, SaleStatus, StoreConfig, Expense, CashRegisterSession, CashRegisterMovement } from '../types';
import { supabase } from '../lib/supabase'; 

// --- Atualização nas Interfaces ---
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
  const [cashSession, setCashSession] = useState<CashRegisterSession | null>(null);

  // Configuração Inicial com as Mensagens Padrão
  const [storeConfig, setStoreConfig] = useState<StoreConfig>({
    name: 'R Store',
    subtitle: 'Luxury Fashion Management',
    address: 'Endereço da Loja',
    cnpj: '00.000.000/0001-00',
    phone: '(82) 99999-9999',
    receiptFooter: 'Trocas somente com etiqueta no prazo de 7 dias.',
    logo_url: '',
    // Novas Configurações de Mensagem
    birthday_message: 'Olá {nome}! 🎉 Parabéns pelo seu dia! A R Store deseja muitas felicidades. Venha nos visitar e ganhe um desconto especial de aniversário!',
    promo_message: 'Olá {nome}! A R Store está com novidades incríveis que combinam com você. Venha conferir nossa nova coleção! 🛍️'
  });

  useEffect(() => {
    const storedAuth = localStorage.getItem('rstore_auth');
    if (storedAuth === 'true') setIsAuthenticated(true);
    const storedConfig = localStorage.getItem('rstore_config');
    if (storedConfig) setStoreConfig(JSON.parse(storedConfig));
    
    if (storedAuth === 'true') {
        fetchData();
    }
  }, [isAuthenticated]);

  const fetchData = async () => {
    // --- MAPIAMENTO DE CAMPOS (birth_date -> birthDate) ---
    const { data: cData } = await supabase.from('clients').select('*');
    if (cData) {
        const mappedClients = cData.map((c: any) => ({
            ...c,
            phone: c.whatsapp || c.phone || '', 
            // Mapeia o campo do banco (birth_date) para o do sistema (birthDate)
            birthDate: c.birth_date || '' 
        }));
        setClients(mappedClients);
    }

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
    fetchData();
  };

  const logout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('rstore_auth');
    setClients([]);
    setSales([]);
  };

  const updateStoreConfig = (config: StoreConfig) => {
    setStoreConfig(config);
    localStorage.setItem('rstore_config', JSON.stringify(config));
  };

  const addClient = async (client: Client) => {
    const payload = {
        name: client.name,
        whatsapp: client.phone,
        address: client.address,
        birth_date: client.birthDate, // Envia como birth_date para o banco
        current_debt: 0
    };

    const { data, error } = await supabase.from('clients').insert([payload]).select();
    
    if (error) {
        console.error("Erro ao adicionar cliente:", error);
        alert(`Erro ao salvar: ${error.message}`);
        return;
    }

    if (data) {
        const newLocalClient = { 
            ...data[0], 
            phone: data[0].whatsapp,
            birthDate: data[0].birth_date 
        };
        setClients(prev => [newLocalClient, ...prev]);
    }
  };

  const updateClient = async (updatedClient: Client) => {
    const payload = {
        name: updatedClient.name,
        whatsapp: updatedClient.phone,
        address: updatedClient.address,
        birth_date: updatedClient.birthDate // Atualiza data
    };

    const { error } = await supabase.from('clients').update(payload).eq('id', updatedClient.id);
    
    if (!error) {
        setClients(prev => prev.map(c => c.id === updatedClient.id ? updatedClient : c));
    } else {
        console.error("Erro ao atualizar cliente:", error);
    }
  };

  const deleteClient = async (id: string) => {
    await supabase.from('clients').delete().eq('id', id);
    setClients(prev => prev.filter(c => c.id !== id));
  };

  // ... (O restante das funções addProduct, updateProduct, deleteProduct, addSale, etc. permanecem iguais ao arquivo anterior)
  // Vou omitir aqui para não ficar gigante, mas mantenha as funções que você já tinha no arquivo anterior
  // Certifique-se apenas de que addProduct, updateProduct, etc estão aqui.
  
  const addProduct = async (product: Product) => {
    const { id, ...prodData } = product;
    const { data } = await supabase.from('products').insert([prodData]).select();
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

  const addSale = async (newSale: Sale, items: any[]) => {
    const { id: fakeId, paymentMethod, ...restOfSale } = newSale;
    const salePayload = { ...restOfSale, items: items, payment_method: paymentMethod };
    const { data: saleRes, error } = await supabase.from('sales').insert([salePayload]).select();

    if (error) { console.error("Erro Supabase:", error); alert(`Erro ao salvar venda: ${error.message}`); return; }
    
    const savedSale = saleRes[0];
    const savedSaleFrontend: Sale = { ...savedSale, paymentMethod: savedSale.payment_method };
    setSales(prev => [savedSaleFrontend, ...prev]);

    items.forEach(async (item) => {
        const prod = products.find(p => p.id === item.id);
        if (prod) {
            let updates = {};
            if (newSale.type === 'SALE') { updates = { stock_quantity: Math.max(0, prod.stock_quantity - item.cartQuantity) }; } 
            else { updates = { on_bag_quantity: prod.on_bag_quantity + item.cartQuantity }; }
            await supabase.from('products').update(updates).eq('id', prod.id);
            setProducts(prev => prev.map(p => p.id === prod.id ? { ...p, ...updates } : p));
        }
    });

    const debtToAdd = newSale.total_amount - newSale.paid_amount;
    if (debtToAdd > 0) {
        const client = clients.find(c => c.id === newSale.client_id);
        if (client) {
            const newDebt = (client.current_debt || 0) + debtToAdd;
            await supabase.from('clients').update({ current_debt: newDebt }).eq('id', client.id);
            setClients(prev => prev.map(c => c.id === client.id ? { ...c, current_debt: newDebt } : c));
        }
    }
    
    if (newSale.paid_amount > 0 && cashSession?.status === 'OPEN') {
        addCashMovement('SALE', newSale.paid_amount, `Venda - ${newSale.client_name}`);
    }
  };

  const updateSaleStatus = async (saleId: string, amountPaidNow: number, newStatus: SaleStatus) => {
    const sale = sales.find(s => s.id === saleId);
    if (!sale) return;
    const newPaidAmount = (sale.paid_amount || 0) + amountPaidNow;
    await supabase.from('sales').update({ paid_amount: newPaidAmount, status: newStatus }).eq('id', saleId);
    setSales(prev => prev.map(s => s.id === saleId ? { ...s, paid_amount: newPaidAmount, status: newStatus } : s));

    const client = clients.find(c => c.id === sale.client_id);
    if (client) {
        const newDebt = Math.max(0, (client.current_debt || 0) - amountPaidNow);
        await supabase.from('clients').update({ current_debt: newDebt }).eq('id', client.id);
        setClients(prev => prev.map(c => c.id === client.id ? { ...c, current_debt: newDebt } : c));
    }
    if (amountPaidNow > 0 && cashSession?.status === 'OPEN') {
        addCashMovement('RECEIPT', amountPaidNow, `Recebimento Dívida - ${sale.client_name}`);
    }
  };

  const confirmBag = async (saleId: string, keptItems: { [productId: string]: number }) => {
    const sale = sales.find(s => s.id === saleId);
    if (!sale) return;
    let newTotalAmount = 0;
    const newItemsList = sale.items.map(item => {
        const keptQty = keptItems[item.product_id] || 0;
        newTotalAmount += keptQty * item.unit_price;
        return { ...item, quantity: keptQty };
    }).filter(i => i.quantity > 0);

    await supabase.from('sales').update({
        total_amount: newTotalAmount, items: newItemsList, status: newTotalAmount === 0 ? 'PAID' : 'PENDING', type: 'SALE'
    }).eq('id', saleId);
    fetchData(); 
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

  const openCashRegister = (initialAmount: number) => {
    const newSession: CashRegisterSession = {
        id: Date.now().toString(), status: 'OPEN', opening_balance: initialAmount, current_balance: initialAmount, opened_at: new Date().toISOString(),
        movements: [{ id: 'init', type: 'OPENING', amount: initialAmount, description: 'Abertura de Caixa', timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }), method: 'CASH' }]
    };
    setCashSession(newSession);
  };

  const closeCashRegister = () => {
    if (cashSession) { setCashSession({ ...cashSession, status: 'CLOSED', closed_at: new Date().toISOString() }); }
  };

  const addCashMovement = async (type: CashRegisterMovement['type'], amount: number, description: string, method: string = 'CASH') => {
    if (!cashSession || cashSession.status !== 'OPEN') return;
    const newMovement: CashRegisterMovement = {
        id: Date.now().toString(), type, amount, description, timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }), method
    };
    setCashSession(prev => {
        if (!prev) return null;
        return { ...prev, current_balance: prev.current_balance + amount, movements: [newMovement, ...prev.movements] };
    });
    await supabase.from('cash_movements').insert([{ type, amount, description, method, timestamp: new Date().toISOString() }]);
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