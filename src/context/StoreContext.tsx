import React, { createContext, useContext, useState, useEffect } from 'react';
import { Client, Product, Sale, SaleStatus, StoreConfig, Expense, UserProfile, UserRole } from '../types';
import { supabase } from '../lib/supabase'; 

// Tipos do Caixa
export interface CashSession {
    id: string;
    status: 'OPEN' | 'CLOSED';
    opened_at: string;
    closed_at?: string;
    opening_balance: number;
    closing_balance?: number;
    calculated_balance?: number;
    movements?: CashMovement[];
}

export interface CashMovement {
    id: string;
    session_id: string;
    type: 'SUPPLY' | 'BLEED';
    amount: number;
    description: string;
    created_at: string;
}

interface StoreContextData {
  user: UserProfile | null;
  usersList: UserProfile[]; // <--- NOVO: Lista de usuários para o Gestor ver
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<{error?: string}>;
  register: (email: string, pass: string, data: {name: string, cpf: string, role: UserRole, avatarFile?: File}) => Promise<{error?: string}>;
  logout: () => void;
  clients: Client[];
  products: Product[];
  sales: Sale[];
  expenses: Expense[];
  storeConfig: StoreConfig;
  
  // CAIXA
  cashSession: CashSession | null;
  openCashRegister: (amount: number) => Promise<void>;
  closeCashRegister: (closingBalance: number, notes: string) => Promise<void>;
  addCashMovement: (type: 'SUPPLY' | 'BLEED', amount: number, desc: string) => Promise<void>;
  
  updateStoreConfig: (config: StoreConfig) => void;
  updateUserRole: (targetId: string, newRole: UserRole) => Promise<void>; // <--- NOVO: Função para mudar cargo
  addClient: (client: Client) => Promise<void>;
  updateClient: (client: Client) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
  addProduct: (product: Product) => Promise<void>;
  updateProduct: (product: Product) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  addSale: (sale: Sale, items: any[]) => Promise<void>;
  updateSaleStatus: (saleId: string, paidAmount: number, newStatus: SaleStatus) => void;
  addExpense: (expense: Expense) => void;
  deleteExpense: (id: string) => Promise<void>;
  canDelete: () => boolean;
  canEditClients: () => boolean;
}

const StoreContext = createContext<StoreContextData>({} as StoreContextData);

export const StoreProvider = ({ children }: { children?: React.ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [usersList, setUsersList] = useState<UserProfile[]>([]); // <--- Estado novo
  const [isLoading, setIsLoading] = useState(true);
  
  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  
  // Estado do Caixa
  const [cashSession, setCashSession] = useState<CashSession | null>(null);

  const [storeConfig, setStoreConfig] = useState<StoreConfig>({
    name: 'R Store',
    subtitle: 'Luxury Fashion Management',
    address: 'Endereço da Loja',
    cnpj: '00.000.000/0001-00',
    phone: '(82) 99999-9999',
    receiptFooter: 'Trocas somente com etiqueta no prazo de 7 dias.',
    logo_url: '',
    birthday_message: 'Olá {nome}! 🎉 Parabéns pelo seu dia!',
    promo_message: 'Olá {nome}! Confira nossas promoções!'
  });

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
            const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
            if (profile) {
                setUser({
                    id: session.user.id,
                    email: session.user.email!,
                    name: profile.name,
                    cpf: profile.cpf,
                    role: profile.role,
                    avatar_url: profile.avatar_url
                });
                fetchData();
                fetchCashSession(); // Busca caixa aberto
            }
        }
    } catch (err) {
        console.error("Erro na verificação de usuário:", err);
    } finally {
        setIsLoading(false);
    }
  };

  const fetchCashSession = async () => {
    // Busca caixa OPEN e já traz as movements (movimentações) juntas
    const { data } = await supabase
      .from('cash_register_sessions')
      .select('*, movements:cash_register_movements(*)') 
      .eq('status', 'OPEN')
      .maybeSingle();
    
    if (data) {
        setCashSession(data);
    } else {
        setCashSession(null);
    }
};

  const fetchData = async () => {
    try {
        const { data: cData } = await supabase.from('clients').select('*');
        if (cData) setClients(cData.map((c: any) => ({ ...c, phone: c.whatsapp || c.phone || '', birthDate: c.birth_date || '' })));
        
        const { data: pData } = await supabase.from('products').select('*');
        if (pData) setProducts(pData);
        
        const { data: sData } = await supabase.from('sales').select('*').order('created_at', { ascending: false });
        if (sData) setSales(sData);

        const { data: eData } = await supabase.from('expenses').select('*').order('created_at', { ascending: false });
        if (eData) setExpenses(eData);

        // --- NOVO: Busca lista de usuários para Gestão ---
        const { data: uData } = await supabase.from('profiles').select('*').order('name');
        if (uData) setUsersList(uData as UserProfile[]);

    } catch (e) {
        console.error("Erro ao carregar dados:", e);
    }
  };

  // --- Ações de Caixa ---

  const openCashRegister = async (amount: number) => {
      if (cashSession) return alert("Já existe um caixa aberto!");
      
      const { data, error } = await supabase.from('cash_register_sessions').insert([{
          opening_balance: amount,
          status: 'OPEN',
          opened_at: new Date().toISOString()
      }]).select('*, movements:cash_register_movements(*)').single(); // Traz movements vazio para não quebrar a UI

      if (error) {
          alert("Erro ao abrir caixa");
          console.error(error);
      } else {
          setCashSession(data);
      }
  };

  const closeCashRegister = async (closingBalance: number, notes: string) => {
      if (!cashSession) return;

      const { error } = await supabase.from('cash_register_sessions').update({
          status: 'CLOSED',
          closed_at: new Date().toISOString(),
          closing_balance: closingBalance,
          notes: notes
      }).eq('id', cashSession.id);

      if (error) {
          alert("Erro ao fechar caixa");
      } else {
          setCashSession(null);
      }
  };

  const addCashMovement = async (type: 'SUPPLY' | 'BLEED', amount: number, desc: string) => {
    if (!cashSession) return alert("Caixa fechado!");

    await supabase.from('cash_register_movements').insert([{
        session_id: cashSession.id,
        type,
        amount,
        description: desc
    }]);
    
    await fetchCashSession(); 
};

  // --- Auth ---
  const login = async (email: string, pass: string) => {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass });
      if (error) return { error: "Email ou senha incorretos." };
      if (data.session) {
          await checkUser(); 
          return {};
      }
      return { error: "Erro desconhecido." };
  };

  const register = async (email: string, pass: string, userData: any) => {
      const { data, error } = await supabase.auth.signUp({ email, password: pass });
      if (error) return { error: error.message };
      if (data.user) {
          let avatarUrl = '';
          if (userData.avatarFile) {
              const fileName = `${data.user.id}.png`;
              const { error: upError } = await supabase.storage.from('avatars').upload(fileName, userData.avatarFile, { upsert: true });
              if (!upError) {
                  const { data: pubData } = supabase.storage.from('avatars').getPublicUrl(fileName);
                  avatarUrl = pubData.publicUrl;
              }
          }
          await supabase.from('profiles').insert([{ 
              id: data.user.id, name: userData.name, cpf: userData.cpf, role: userData.role, avatar_url: avatarUrl
          }]);
          await checkUser();
          return {};
      }
      return { error: "Erro ao criar usuário." };
  };

  const logout = async () => { await supabase.auth.signOut(); setUser(null); };

  // --- Helpers Permissão ---
  const canDelete = () => user?.role === 'GESTOR' || user?.role === 'ADMIN';
  const canEditClients = () => user?.role === 'GESTOR' || user?.role === 'ADMIN';
  const canManageUsers = () => user?.role === 'GESTOR';

  // --- CRUD Actions ---
  const updateStoreConfig = (cfg: StoreConfig) => { if (!canManageUsers()) return alert("Apenas Gestores."); setStoreConfig(cfg); };
  
  // --- NOVO: Função para alterar cargo ---
  const updateUserRole = async (targetId: string, newRole: UserRole) => {
    if (user?.role !== 'GESTOR' && user?.role !== 'ADMIN') return alert("Sem permissão.");
    
    const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', targetId);
    
    if (error) {
        alert("Erro ao atualizar permissão.");
        console.error(error);
    } else {
        // Atualiza lista local
        setUsersList(prev => prev.map(u => u.id === targetId ? { ...u, role: newRole } : u));
    }
  };

  const addClient = async (c: Client) => { 
      const { data } = await supabase.from('clients').insert([{name: c.name, whatsapp: c.phone, birth_date: c.birthDate, address: c.address, current_debt: 0}]).select();
      if(data) fetchData();
  };
  
  const updateClient = async (c: Client) => { 
      if (!canEditClients()) return alert("Sem permissão.");
      await supabase.from('clients').update({name: c.name, whatsapp: c.phone, address: c.address, birth_date: c.birthDate}).eq('id', c.id); 
      fetchData(); 
  };
  
  const deleteClient = async (id: string) => { 
      if (!canDelete()) return alert("Sem permissão.");
      await supabase.from('clients').delete().eq('id', id); fetchData(); 
  };
  
  const addProduct = async (p: Product) => { const {id, ...rest} = p; await supabase.from('products').insert([rest]); fetchData(); };
  const updateProduct = async (p: Product) => { await supabase.from('products').update(p).eq('id', p.id); fetchData(); };
  
  const deleteProduct = async (id: string) => { 
    if (!canDelete()) return alert("Sem permissão.");
    
    // 1. Primeiro buscamos o produto para saber se ele tem imagem
    const { data: product } = await supabase.from('products').select('image_url').eq('id', id).single();

    // 2. Se tiver imagem, apagamos ela do Storage
    if (product?.image_url) {
        try {
            const urlParts = product.image_url.split('/products/');
            if (urlParts.length > 1) {
                const fileName = urlParts[1];
                await supabase.storage.from('products').remove([fileName]);
            }
        } catch (err) {
            console.error("Erro ao tentar apagar imagem antiga:", err);
        }
    }

    // 3. Agora sim, apagamos o registro do banco de dados
    const { error } = await supabase.from('products').delete().eq('id', id);
    
    if (error) {
        alert("Erro ao excluir produto do banco de dados.");
        console.error(error);
    } else {
        fetchData(); 
    }
  };
  
  // VENDA COM BLOQUEIO DE CAIXA
  const addSale = async (sale: Sale, items: any[]) => {
    // 1. Verifica se caixa está aberto
    if (!cashSession) {
        throw new Error("CAIXA_FECHADO"); // Lança erro para a UI tratar
    }

    // 2. Salva Venda
    const { error: saleError } = await supabase.from('sales').insert([sale]);
    if (saleError) throw saleError;

    // 3. Salva Itens
    const { error: itemsError } = await supabase.from('sale_items').insert(items);
    if (itemsError) throw itemsError;

    // 4. Baixa Estoque
    if (sale.type === 'SALE') {
        for (const item of items) {
            const product = products.find(p => p.id === item.product_id);
            if (product) {
                const newStock = Math.max(0, product.stock_quantity - item.quantity);
                await supabase.from('products').update({ stock_quantity: newStock }).eq('id', product.id);
                setProducts(prev => prev.map(p => p.id === product.id ? { ...p, stock_quantity: newStock } : p));
            }
        }
    } else if (sale.type === 'BAG') {
        for (const item of items) {
            const product = products.find(p => p.id === item.product_id);
            if (product) {
                const newBagQty = (product.on_bag_quantity || 0) + item.quantity;
                await supabase.from('products').update({ on_bag_quantity: newBagQty }).eq('id', product.id);
                setProducts(prev => prev.map(p => p.id === product.id ? { ...p, on_bag_quantity: newBagQty } : p));
            }
        }
    }

    // 5. Atualiza Dívida
    if (sale.status !== 'PAID') {
        const debtAmount = sale.total_amount - sale.paid_amount;
        const client = clients.find(c => c.id === sale.client_id);
        if (client && debtAmount > 0) {
            const newDebt = (client.current_debt || 0) + debtAmount;
            await supabase.from('clients').update({ current_debt: newDebt }).eq('id', client.id);
            setClients(prev => prev.map(c => c.id === client.id ? { ...c, current_debt: newDebt } : c));
        }
    }

    fetchData(); 
  };
  
  const updateSaleStatus = async (id: string, pd: number, st: SaleStatus) => { await supabase.from('sales').update({paid_amount: pd, status: st}).eq('id', id); fetchData(); };
  const addExpense = async (e: Expense) => { const {id, ...rest} = e; await supabase.from('expenses').insert([rest]); fetchData(); };
  const deleteExpense = async (id: string) => { if (!canDelete()) return alert("Sem permissão."); await supabase.from('expenses').delete().eq('id', id); fetchData(); };

  return (
    <StoreContext.Provider value={{
      user, usersList, isAuthenticated: !!user, isLoading,
      login, logout, register, updateUserRole,
      clients, products, sales, expenses, storeConfig, 
      // Caixa Exports
      cashSession, openCashRegister, closeCashRegister, addCashMovement,
      updateStoreConfig, addClient, updateClient, deleteClient,
      addProduct, updateProduct, deleteProduct, addSale, updateSaleStatus,
      addExpense, deleteExpense, canDelete, canEditClients
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