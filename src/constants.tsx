import { Client, Product, Sale, Expense } from './src/types';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Users, 
  Package, 
  LogOut, 
  Plus, 
  Search, 
  Star, 
  AlertCircle,
  TrendingUp,
  DollarSign,
  Calendar,
  MessageCircle,
  Edit,
  Trash2,
  Camera,
  X,
  Check,
  Gift,
  ArrowRight,
  Bell,
  Wallet,
  BarChart3,
  ArrowUpCircle,
  ArrowDownCircle,
  Lock,
  RefreshCw,
  Grid,
  Settings,
  Receipt
} from 'lucide-react';

export const ICONS = {
  Dashboard: LayoutDashboard,
  Sales: ShoppingBag,
  Clients: Users,
  Inventory: Package,
  Logout: LogOut,
  Plus: Plus,
  Search: Search,
  Star: Star,
  Alert: AlertCircle,
  Trending: TrendingUp,
  Money: DollarSign,
  Calendar: Calendar,
  WhatsApp: MessageCircle,
  Edit: Edit,
  Delete: Trash2,
  Camera: Camera,
  Close: X,
  Check: Check,
  Gift: Gift,
  ArrowRight: ArrowRight,
  Bell: Bell,
  Wallet: Wallet,
  Chart: BarChart3,
  Income: ArrowUpCircle,
  Expense: ArrowDownCircle,
  Lock: Lock,
  Return: RefreshCw,
  Catalog: Grid,
  Settings: Settings,
  Receipt: Receipt
};

// Mock Data simulates DB content
const today = new Date();
const currentMonth = String(today.getMonth() + 1).padStart(2, '0');
const currentDay = String(today.getDate()).padStart(2, '0');
const currentYear = today.getFullYear();

export const MOCK_CLIENTS: Client[] = [
  { id: '1', name: 'Mariana Silva', whatsapp: '11999999999', trust_score: 5, credit_limit: 2000, current_debt: 0, image_url: 'https://i.pravatar.cc/150?u=1', birthDate: `1990-${currentMonth}-${currentDay}` }, // Birthday Today
  { id: '2', name: 'Fernanda Costa', whatsapp: '11988888888', trust_score: 4, credit_limit: 1000, current_debt: 450.50, image_url: 'https://i.pravatar.cc/150?u=2', birthDate: '1995-05-20' },
  { id: '3', name: 'Julia Roberts', whatsapp: '11977777777', trust_score: 2, credit_limit: 500, current_debt: 1200.00, birthDate: '1988-12-10' },
  { id: '4', name: 'Ana Clara', whatsapp: '11966666666', trust_score: 5, credit_limit: 3000, current_debt: 150.00, image_url: 'https://i.pravatar.cc/150?u=4', birthDate: '1999-01-15' },
];

export const MOCK_PRODUCTS: Product[] = [
  { id: '101', name: 'Vestido Seda Vermelho', cost_price: 150, sale_price: 399.90, size: 'M', color: 'Vermelho', stock_quantity: 5, on_bag_quantity: 0, image_url: 'https://picsum.photos/200/300?random=1' },
  { id: '102', name: 'Calça Alfaiataria Preta', cost_price: 90, sale_price: 249.90, size: '38', color: 'Preto', stock_quantity: 12, on_bag_quantity: 2, image_url: 'https://picsum.photos/200/300?random=2' },
  { id: '103', name: 'Blazer Off-White', cost_price: 200, sale_price: 599.90, size: 'G', color: 'Off-White', stock_quantity: 2, on_bag_quantity: 0, image_url: 'https://picsum.photos/200/300?random=3' }, // Low Stock
  { id: '104', name: 'Cropped Renda', cost_price: 40, sale_price: 129.90, size: 'P', color: 'Branco', stock_quantity: 20, on_bag_quantity: 5, image_url: 'https://picsum.photos/200/300?random=4' },
];

export const MOCK_SALES: Sale[] = [
  { 
    id: '501', 
    client_id: '2', 
    client_name: 'Fernanda Costa', 
    total_amount: 450.50, 
    paid_amount: 0, 
    status: 'PENDING', 
    type: 'SALE', 
    created_at: '2023-10-25T14:30:00',
    items: [
        { id: 'i1', product_id: '102', product_name: 'Calça Alfaiataria Preta', product_image: '', quantity: 1, unit_price: 249.90, size: '38', color: 'Preto' }
    ]
  },
  { 
    id: '503', 
    client_id: '3', 
    client_name: 'Julia Roberts', 
    total_amount: 800.00, 
    paid_amount: 0, 
    status: 'PENDING', 
    type: 'BAG', 
    created_at: '2023-10-27T16:45:00',
    items: [
        { id: 'i2', product_id: '101', product_name: 'Vestido Seda Vermelho', product_image: '', quantity: 2, unit_price: 399.90, size: 'M', color: 'Vermelho' }
    ]
  },
];

export const MOCK_EXPENSES: Expense[] = [
  { id: '1', description: 'Aluguel Loja', amount: 1500.00, category: 'FIXED', date: `${currentYear}-${currentMonth}-05`, paid: true },
  { id: '2', description: 'Internet + Telefone', amount: 120.00, category: 'FIXED', date: `${currentYear}-${currentMonth}-10`, paid: true },
  { id: '3', description: 'Embalagens Premium', amount: 450.00, category: 'VARIABLE', date: `${currentYear}-${currentMonth}-15`, paid: true },
  { id: '4', description: 'Motoboy (Entregas)', amount: 180.00, category: 'VARIABLE', date: `${currentYear}-${currentMonth}-20`, paid: true },
];