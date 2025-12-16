import React, { createContext, useContext, useState, useEffect } from 'react';
import { Client, Product, Sale, SaleStatus, StoreConfig, Expense, CashRegisterSession, CashRegisterMovement } from '../types';
import { MOCK_CLIENTS, MOCK_PRODUCTS, MOCK_SALES, MOCK_EXPENSES } from '../constants';

interface StoreContextData {
  // Data
  clients: Client[];
  products: Product[];
  sales: Sale[];
  expenses: Expense[];
  cashSession: CashRegisterSession | null;
  storeConfig: StoreConfig;
  isAuthenticated: boolean;
  
  // Auth Actions
  login: () => void;
  logout: () => void;

  // Store Settings Actions
  updateStoreConfig: (config: StoreConfig) => void;

  // Actions
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

  // Cash Register Actions
  openCashRegister: (initialAmount: number) => void;
  closeCashRegister: () => void;
  addCashMovement: (type: CashRegisterMovement['type'], amount: number, description: string) => void;
}

const StoreContext = createContext<StoreContextData>({} as StoreContextData);

export const StoreProvider = ({ children }: { children?: React.ReactNode }) => {
  // --- AUTH STATE ---
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // --- DATA STATE ---
  const [clients, setClients] = useState<Client[]>(MOCK_CLIENTS);
  const [products, setProducts] = useState<Product[]>(MOCK_PRODUCTS);
  const [sales, setSales] = useState<Sale[]>(MOCK_SALES);
  const [expenses, setExpenses] = useState<Expense[]>(MOCK_EXPENSES);
  const [cashSession, setCashSession] = useState<CashRegisterSession | null>(null);

  // --- CONFIG STATE (Default Values) ---
  const [storeConfig, setStoreConfig] = useState<StoreConfig>({
    name: 'R Store',
    subtitle: 'Luxury Fashion Management',
    address: 'Rua das Flores, 123 - Jardins, SP',
    cnpj: '00.000.000/0001-00',
    phone: '(11) 99999-9999',
    receiptFooter: 'Trocas somente com etiqueta afixada na peça e no prazo de 7 dias.',
    logo_url: ''
  });

  // Load Auth from LocalStorage (Simple Persistence)
  useEffect(() => {
    const storedAuth = localStorage.getItem('rstore_auth');
    if (storedAuth === 'true') {
        setIsAuthenticated(true);
    }
    
    // In a real app, we would load StoreConfig from DB here
    const storedConfig = localStorage.getItem('rstore_config');
    if (storedConfig) {
        setStoreConfig(JSON.parse(storedConfig));
    }
  }, []);

  // Update Document Title when Store Name changes
  useEffect(() => {
    document.title = `${storeConfig.name} - Management`;
  }, [storeConfig.name]);

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

  // --- Client Actions ---
  const addClient = (client: Client) => {
    setClients(prev => [client, ...prev]);
  };

  const updateClient = (updatedClient: Client) => {
    setClients(prev => prev.map(c => c.id === updatedClient.id ? updatedClient : c));
  };

  const deleteClient = (id: string) => {
    setClients(prev => prev.filter(c => c.id !== id));
  };

  // --- Product Actions ---
  const addProduct = (product: Product) => {
    setProducts(prev => [product, ...prev]);
  };

  const updateProduct = (updatedProduct: Product) => {
    setProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
  };

  const deleteProduct = (id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  // --- Expense Actions ---
  const addExpense = (expense: Expense) => {
    setExpenses(prev => [expense, ...prev]);
    // Optional: If expense is paid via Cash, we could bleed the register here automatically.
    // For now, let's keep it manual in Cash Register to avoid confusion.
  };

  const deleteExpense = (id: string) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
  };

  // --- Cash Register Actions ---
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
          setCashSession({
              ...cashSession,
              status: 'CLOSED',
              closed_at: new Date().toISOString()
          });
          // In a real app, save to history/DB here.
      }
  };

  const addCashMovement = (type: CashRegisterMovement['type'], amount: number, description: string, method: string = 'CASH') => {
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
  };

  // --- Sale Actions & Business Logic ---
  
  // 1. CREATE SALE OR BAG
  const addSale = (newSale: Sale, items: any[]) => {
    setSales(prev => [newSale, ...prev]);

    // Handle Inventory Logic
    setProducts(prevProducts => {
        return prevProducts.map(prod => {
            const soldItem = items.find(i => i.id === prod.id);
            if (soldItem) {
                if (newSale.type === 'SALE') {
                    // Direct Sale: Remove from stock permanently
                    return { ...prod, stock_quantity: Math.max(0, prod.stock_quantity - soldItem.cartQuantity) };
                } else {
                    // Bag: Stock remains 'physically' with client (still counts as owned), 
                    // but we increase 'on_bag_quantity' to track what is out.
                    // Note: In NewSale.tsx, we check availability using (stock - on_bag).
                    return { ...prod, on_bag_quantity: prod.on_bag_quantity + soldItem.cartQuantity };
                }
            }
            return prod;
        });
    });

    // Handle Debt Logic
    const debtToAdd = newSale.total_amount - newSale.paid_amount;
    if (debtToAdd > 0) {
        setClients(prevClients => {
            return prevClients.map(c => {
                if (c.id === newSale.client_id) {
                    return { ...c, current_debt: c.current_debt + debtToAdd };
                }
                return c;
            });
        });
    }

    // AUTOMATIC CASH REGISTER INTEGRATION
    // If sale is paid immediately, add to cash register
    if (newSale.paid_amount > 0 && cashSession?.status === 'OPEN') {
        addCashMovement(
            'SALE', 
            newSale.paid_amount, 
            `Venda #${newSale.id.slice(-4)} - ${newSale.client_name}`,
            newSale.paymentMethod || 'UNKNOWN'
        );
    }
  };

  // 2. PAYMENTS
  const updateSaleStatus = (saleId: string, amountPaidNow: number, newStatus: SaleStatus) => {
    // Update Sale Record
    setSales(prev => prev.map(s => {
        if (s.id === saleId) {
            return { 
                ...s, 
                paid_amount: s.paid_amount + amountPaidNow, 
                status: newStatus 
            };
        }
        return s;
    }));

    // Reduce Client Debt
    const targetSale = sales.find(s => s.id === saleId);
    if (targetSale) {
        setClients(prev => prev.map(c => {
            if (c.id === targetSale.client_id) {
                return { ...c, current_debt: Math.max(0, c.current_debt - amountPaidNow) };
            }
            return c;
        }));

        // AUTOMATIC CASH REGISTER INTEGRATION
        // Debt payment received
        if (amountPaidNow > 0 && cashSession?.status === 'OPEN') {
             addCashMovement(
                'RECEIPT',
                amountPaidNow,
                `Receb. Dívida #${saleId.slice(-4)} - ${targetSale.client_name}`
             );
        }
    }
  };

  // 3. FINALIZE BAG (Advanced Logic)
  const confirmBag = (saleId: string, keptItems: { [productId: string]: number }) => {
     const sale = sales.find(s => s.id === saleId);
     if (!sale) return;

     // Calculate new totals based on what was KEPT
     let newTotalAmount = 0;
     const newItemsList = sale.items.map(item => {
         const keptQty = keptItems[item.product_id] || 0;
         newTotalAmount += keptQty * item.unit_price;
         return { ...item, quantity: keptQty }; // Update item quantity in record (or 0 if returned all)
     }).filter(i => i.quantity > 0);

     // Calculate Debt Adjustment
     const debtReduction = sale.total_amount - newTotalAmount;

     // Update Sales Record
     setSales(prev => prev.map(s => {
         if (s.id === saleId) {
             return {
                 ...s,
                 total_amount: newTotalAmount,
                 items: newItemsList,
                 // If total became 0 (returned everything), it's PAID (no debt). 
                 status: newTotalAmount === 0 ? 'PAID' : 'PENDING',
                 type: 'SALE', // CHANGED FROM BAG TO SALE TO REMOVE FROM ACTIVE BAG LIST
             };
         }
         return s;
     }));

     // Update Products Inventory
     setProducts(prev => prev.map(prod => {
         const originalItem = sale.items.find(i => i.product_id === prod.id);
         if (originalItem) {
             const keptQty = keptItems[prod.id] || 0;
             const originalQty = originalItem.quantity;
             
             return {
                 ...prod,
                 stock_quantity: Math.max(0, prod.stock_quantity - keptQty),
                 on_bag_quantity: Math.max(0, prod.on_bag_quantity - originalQty)
             };
         }
         return prod;
     }));

     // Update Client Debt
     if (debtReduction > 0) {
         setClients(prev => prev.map(c => {
             if (c.id === sale.client_id) {
                 return { ...c, current_debt: Math.max(0, c.current_debt - debtReduction) };
             }
             return c;
         }));
     }
  };

  return (
    <StoreContext.Provider value={{
      clients,
      products,
      sales,
      expenses,
      storeConfig,
      isAuthenticated,
      cashSession,
      login,
      logout,
      updateStoreConfig,
      addClient,
      updateClient,
      deleteClient,
      addProduct,
      updateProduct,
      deleteProduct,
      addSale,
      updateSaleStatus,
      confirmBag,
      addExpense,
      deleteExpense,
      openCashRegister,
      closeCashRegister,
      addCashMovement
    }}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};