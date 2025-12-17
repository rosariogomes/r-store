import React, { createContext, useContext, useState, useEffect } from 'react';
import { Client, Product, Sale, SaleStatus, StoreConfig, Expense, CashRegisterSession, CashRegisterMovement, UserProfile, UserRole } from '../types';
import { supabase } from '../lib/supabase'; 

interface StoreContextData {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<{error?: string}>;
  register: (email: string, pass: string, data: {name: string, cpf: string, role: UserRole, avatarFile?: File}) => Promise<{error?: string}>;
  logout: () => void;
  clients: Client[];
  products: Product[];
  sales: Sale[];
  expenses: Expense[];
  cashSession: CashRegisterSession | null;
  storeConfig: StoreConfig;
  updateStoreConfig: (config: StoreConfig) => void;
  addClient: (client: Client) => void;
  updateClient: (client: Client) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
  addProduct: (product: Product) => void;
  updateProduct: (product: Product) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  addSale: (sale: Sale, items: any[]) => void;
  updateSaleStatus: (saleId: string, paidAmount: number, newStatus: SaleStatus) => void;
  confirmBag: (saleId: string, keptItems: { [productId: string]: number }) => void;
  addExpense: (expense: Expense) => void;
  deleteExpense: (id: string) => Promise<void>;
  openCashRegister: (initialAmount: number) => void;
  closeCashRegister: () => void;
  addCashMovement: (type: CashRegisterMovement['type'], amount: number, description: string) => void;
  // Permissões
  canDelete: () => boolean;
  canEditClients: () => boolean;
}

const StoreContext = createContext<StoreContextData>({} as StoreContextData);

export const StoreProvider = ({ children }: { children?: React.ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [cashSession, setCashSession] = useState<CashRegisterSession | null>(null);

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
            }
        }
    } catch (err) {
        console.error("Erro na verificação de usuário:", err);
    } finally {
        setIsLoading(false);
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
    } catch (e) {
        console.error("Erro ao carregar dados:", e);
    }
  };

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
              id: data.user.id, 
              name: userData.name, 
              cpf: userData.cpf, 
              role: userData.role,
              avatar_url: avatarUrl
          }]);
          await checkUser();
          return {};
      }
      return { error: "Erro ao criar usuário." };
  };

  const logout = async () => {
      await supabase.auth.signOut();
      setUser(null);
  };

  // --- Helpers de Permissão ---
  const canDelete = () => user?.role === 'GESTOR' || user?.role === 'ADMIN';
  const canEditClients = () => user?.role === 'GESTOR' || user?.role === 'ADMIN';
  const canManageUsers = () => user?.role === 'GESTOR';

  // --- Ações de Dados ---
  const updateStoreConfig = (cfg: StoreConfig) => { 
      if (!canManageUsers()) return alert("Apenas Gestores podem alterar configurações.");
      setStoreConfig(cfg); 
  };

  const addClient = async (c: Client) => { 
      const { data } = await supabase.from('clients').insert([{name: c.name, whatsapp: c.phone, birth_date: c.birthDate, address: c.address, current_debt: 0}]).select();
      if(data) fetchData();
  };
  
  const updateClient = async (c: Client) => { 
      if (!canEditClients()) return alert("Sem permissão para editar clientes.");
      await supabase.from('clients').update({name: c.name, whatsapp: c.phone, address: c.address, birth_date: c.birthDate}).eq('id', c.id); 
      fetchData(); 
  };
  
  const deleteClient = async (id: string) => { 
      if (!canDelete()) return alert("Sem permissão para excluir.");
      await supabase.from('clients').delete().eq('id', id); 
      fetchData(); 
  };
  
  const addProduct = async (p: Product) => { const {id, ...rest} = p; await supabase.from('products').insert([rest]); fetchData(); };
  
  const updateProduct = async (p: Product) => { await supabase.from('products').update(p).eq('id', p.id); fetchData(); };
  
  const deleteProduct = async (id: string) => { 
      if (!canDelete()) return alert("Sem permissão para excluir produtos.");
      await supabase.from('products').delete().eq('id', id); 
      fetchData(); 
  };
  
  const addSale = async (s: Sale, i: any[]) => { await supabase.from('sales').insert([{...s, items: i}]); fetchData(); };
  
  const updateSaleStatus = async (id: string, pd: number, st: SaleStatus) => { await supabase.from('sales').update({paid_amount: pd, status: st}).eq('id', id); fetchData(); };
  
  const confirmBag = async (id: string, items: any) => { fetchData(); };
  
  const addExpense = async (e: Expense) => { const {id, ...rest} = e; await supabase.from('expenses').insert([rest]); fetchData(); };
  
  const deleteExpense = async (id: string) => { 
      if (!canDelete()) return alert("Sem permissão para excluir despesas.");
      await supabase.from('expenses').delete().eq('id', id); 
      fetchData(); 
  };
  
  const openCashRegister = (v: number) => setCashSession({id: '1', status: 'OPEN', opening_balance: v, current_balance: v, opened_at: new Date().toISOString(), movements: []});
  const closeCashRegister = () => setCashSession(prev => prev ? {...prev, status: 'CLOSED'} : null);
  const addCashMovement = () => {};

  return (
    <StoreContext.Provider value={{
      user, isAuthenticated: !!user, isLoading,
      login, logout, register,
      clients, products, sales, expenses, storeConfig, cashSession,
      updateStoreConfig, addClient, updateClient, deleteClient,
      addProduct, updateProduct, deleteProduct, addSale, updateSaleStatus, confirmBag,
      addExpense, deleteExpense, openCashRegister, closeCashRegister, addCashMovement,
      canDelete, canEditClients
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