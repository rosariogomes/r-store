// --- TIPOS DE USUÁRIO E PERMISSÕES (NOVO) ---
export type UserRole = 'GESTOR' | 'ADMIN' | 'STANDARD';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  cpf: string;
  avatar_url?: string;
  role: UserRole;
}

// --- TIPOS DO SISTEMA ---

export interface Client {
  id: string;
  name: string;
  whatsapp: string; // Seu campo original
  phone: string;    // Adicionado para compatibilidade com os formulários novos
  address?: string; // Adicionado para o cadastro completo
  birthDate?: string;
  trust_score?: number;
  credit_limit?: number;
  current_debt?: number;
  image_url?: string;
}

export interface Product {
  id: string;
  name: string;
  cost_price: number;
  sale_price: number;
  category: string;
  gender: 'MALE' | 'FEMALE' | 'UNISEX';
  size: string;
  color: string;
  stock_quantity: number;
  on_bag_quantity: number;
  image_url?: string; // Opcional ou obrigatório, conforme sua preferência
}

export interface SaleItem {
  id?: string; // Opcional pois é gerado depois
  sale_id?: string; // Vinculo com a venda
  product_id: string;
  product_name: string;
  product_image?: string;
  quantity: number;
  unit_price: number;
  size: string;
  color: string;
}

export type SaleStatus = 'PENDING' | 'PAID' | 'PARTIAL' | 'CANCELLED';
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
  paymentMethod?: string; // Usado no frontend
  payment_method?: string; // Mapeado do banco de dados (snake_case)
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  category: 'FIXED' | 'VARIABLE' | 'MARKETING' | 'PERSONNEL' | 'TAXES';
  date: string;
  paid: boolean;
  created_at?: string;
}

export interface CashRegisterMovement {
  id: string;
  type: 'OPENING' | 'CLOSING' | 'SALE' | 'EXPENSE' | 'SUPPLY' | 'BLEED' | 'RECEIPT';
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
  // Campos novos para o CRM
  birthday_message?: string;
  promo_message?: string;
}