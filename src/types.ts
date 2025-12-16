export interface Client {
  id: string;
  name: string;
  whatsapp: string;
  trust_score: number;
  credit_limit: number;
  current_debt: number;
  image_url?: string;
  birthDate?: string;
}

export interface Product {
  id: string;
  name: string;
  cost_price: number;
  sale_price: number;
  category: string; // Nova coluna
  gender: 'MALE' | 'FEMALE' | 'UNISEX'; // Nova coluna
  size: string;
  color: string;
  stock_quantity: number;
  on_bag_quantity: number;
  image_url?: string;
}

export interface SaleItem {
  id?: string;
  product_id: string;
  product_name: string;
  product_image?: string;
  quantity: number;
  unit_price: number;
  size: string;
  color: string;
}

export type SaleStatus = 'PENDING' | 'PAID' | 'PARTIAL';
export type SaleType = 'SALE' | 'BAG';

export interface Sale {
  id: string;
  client_id: string;
  client_name: string;
  total_amount: number;
  paid_amount: number;
  status: SaleStatus;
  type: SaleType;
  created_at: string;
  items: SaleItem[];
  paymentMethod?: string;
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  category: 'FIXED' | 'VARIABLE' | 'MARKETING' | 'PERSONNEL' | 'TAXES';
  date: string;
  paid: boolean;
}

export interface CashRegisterMovement {
  id: string;
  type: 'OPENING' | 'SALE' | 'SUPPLY' | 'BLEED' | 'RECEIPT';
  amount: number;
  description: string;
  timestamp: string;
  method?: string;
}

export interface CashRegisterSession {
  id: string;
  status: 'OPEN' | 'CLOSED';
  opening_balance: number;
  current_balance: number;
  opened_at: string;
  closed_at?: string;
  movements: CashRegisterMovement[];
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