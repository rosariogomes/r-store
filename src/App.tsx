import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { StoreProvider, useStore } from './context/StoreContext';
import { Layout } from './components/Layout';

// Imports das Páginas
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { NewSale } from './pages/NewSale';
import { Clients } from './pages/Clients';
import { Inventory } from './pages/Inventory';
import { Expenses } from './pages/Expenses';
import { Reports } from './pages/Reports';
import { Settings } from './pages/Settings';
import { History } from './pages/History';         // <--- Importante
import { CashRegister } from './pages/CashRegister'; // <--- Importante
import { Catalog } from './pages/Catalog';           // <--- Importante

// Componente para Proteger Rotas
const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useStore();
  
  if (isLoading) return <div className="h-screen bg-black flex items-center justify-center text-white">Carregando...</div>;
  
  return isAuthenticated ? <Layout>{children}</Layout> : <Navigate to="/login" />;
};

const AppRoutes = () => {
    const { isAuthenticated } = useStore();

    return (
        <Routes>
            {/* Rota Pública */}
            <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/" />} />
            
            {/* Rotas Protegidas (Dentro do Layout) */}
            <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
            <Route path="/sales/new" element={<PrivateRoute><NewSale /></PrivateRoute>} />
            
            {/* Rota corrigida para Catálogo/Histórico */}
            <Route path="/sales" element={<PrivateRoute><History /></PrivateRoute>} />
            
            <Route path="/clients" element={<PrivateRoute><Clients /></PrivateRoute>} />
            <Route path="/inventory" element={<PrivateRoute><Inventory /></PrivateRoute>} />
            <Route path="/expenses" element={<PrivateRoute><Expenses /></PrivateRoute>} />
            <Route path="/reports" element={<PrivateRoute><Reports /></PrivateRoute>} />
            <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />
            
            {/* Rotas Extras que você já tem os arquivos */}
            <Route path="/cash-register" element={<PrivateRoute><CashRegister /></PrivateRoute>} />
            <Route path="/catalog" element={<PrivateRoute><Catalog /></PrivateRoute>} />

            {/* Rota padrão (Catch-all) */}
            <Route path="*" element={<Navigate to="/" />} />
        </Routes>
    );
};

function App() {
  return (
    <StoreProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </StoreProvider>
  );
}

export default App;