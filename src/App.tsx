import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Login } from '@/pages/Login';
import { Dashboard } from '@/pages/Dashboard';
import { Revendedores } from '@/pages/Revendedores';
import { Vendas } from '@/pages/Vendas';
import { Envios } from '@/pages/Envios';
import { Pagamentos } from '@/pages/Pagamentos';
import { VendaCliente } from '@/pages/VendaCliente';
import { Estoque } from '@/pages/Estoque';
import { Configuracoes } from '@/pages/Configuracoes';
import { IAAna } from '@/pages/IAAna';
import { Relatorios } from '@/pages/Relatorios';
import Usuarios from '@/pages/Usuarios';
import Backups from '@/pages/Backups';
import { useUserStore } from '@/stores/userStore';

function App() {
  const { isAuthenticated } = useUserStore();

  return (
    <Router>
      <Routes>
        <Route
          path="/login"
          element={
            isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />
          }
        />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="revendedores" element={
            <ProtectedRoute requirePermission="canManageResellers">
              <Revendedores />
            </ProtectedRoute>
          } />
          <Route path="vendas" element={
            <ProtectedRoute requirePermission="canViewSales">
              <Vendas />
            </ProtectedRoute>
          } />
          <Route path="envios" element={<Envios />} />
          <Route path="pagamentos" element={
            <ProtectedRoute requirePermission="canViewPayments">
              <Pagamentos />
            </ProtectedRoute>
          } />
          <Route path="estoque" element={
            <ProtectedRoute requirePermission="canViewInventory">
              <Estoque />
            </ProtectedRoute>
          } />
          <Route path="configuracoes" element={
            <ProtectedRoute requirePermission="canConfigurePix">
              <Configuracoes />
            </ProtectedRoute>
          } />
          <Route path="ia" element={<IAAna />} />
          <Route path="relatorios" element={
            <ProtectedRoute requirePermission="canViewReports">
              <Relatorios />
            </ProtectedRoute>
          } />
          <Route path="usuarios" element={
            <ProtectedRoute requirePermission="canManageUsers">
              <Usuarios />
            </ProtectedRoute>
          } />
          <Route path="backups" element={
            <ProtectedRoute requirePermission="canManageBackups">
              <Backups />
            </ProtectedRoute>
          } />
        </Route>

        {/* Rota pública para vendas de clientes */}
        <Route path="/venda" element={<VendaCliente />} />

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
