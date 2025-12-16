export interface Client {
  id: string;
  name: string;
  whatsapp: string;
  trust_score: number; // 1-5
  credit_limit: number;
  current_debt: number; // Calculated field for UI
  image_url?: string;
  birthDate?: string; // Format: 'MM-DD' or 'YYYY-MM-DD'
}

export interface Product {
  id: string;
  name: string;
  cost_price: number;
  sale_price: number;
  size: string;
  color: string;
  stock_quantity: number; // Total physical items in store (shelf + bags)
  on_bag_quantity: number; // Quantity currently out with clients
  image_url: string;
}

export type SaleStatus = 'PENDING' | 'PAID' | 'PARTIAL';
export type SaleType = 'SALE' | 'BAG'; // Venda Direta vs Sacola

export interface SaleItem {
  id: string;
  product_id: string;
  product_name: string;
  product_image: string;
  quantity: number;
  unit_price: number;
  size: string; // Snapshot
  color: string; // Snapshot
}

export interface Sale {
  id: string;
  client_id: string;
  total_amount: number;
  paid_amount: number;
  status: SaleStatus;
  type: SaleType;
  created_at: string;
  client_name?: string; // Joined field
  paymentMethod?: string; // 'PIX', 'CASH', 'CREDIT', etc.
  items: SaleItem[]; // Storing items inside the Sale object for easy retrieval
}

export interface Payment {
  id: string;
  sale_id: string;
  amount: number;
  date: string;
  method: 'CASH' | 'PIX' | 'CREDIT_CARD';
}

export interface CashRegisterMovement {
  id: string;
  type: 'OPENING' | 'SALE' | 'SUPPLY' | 'BLEED' | 'CLOSING' | 'RECEIPT'; 
  amount: number;
  description: string;
  timestamp: string;
  method?: string; // To track Cash vs Card in register
}

export interface CashRegisterSession {
  id: string;
  status: 'OPEN' | 'CLOSED';
  opening_balance: number;
  current_balance: number; // Real-time balance
  opened_at: string;
  closed_at?: string;
  movements: CashRegisterMovement[];
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  category: 'FIXED' | 'VARIABLE' | 'MARKETING' | 'PERSONNEL' | 'TAXES';
  date: string;
  paid: boolean;
}

export interface StoreConfig {
  name: string;
  subtitle: string;
  address: string;
  cnpj: string;
  phone: string;
  receiptFooter: string;
  logo_url?: string;
}