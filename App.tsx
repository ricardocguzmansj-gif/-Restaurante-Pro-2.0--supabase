
import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { DashboardPage } from './pages/DashboardPage';
import { KdsPage } from './pages/KdsPage';
import { LoginPage } from './pages/LoginPage';
import { MenuPage } from './pages/MenuPage';
import { OrdersPage } from './pages/OrdersPage';
import { CustomersPage } from './pages/CustomersPage';
import { CouponsPage } from './pages/CouponsPage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';
import { useAppContext } from './contexts/AppContext';
import { UserRole } from './types';
import { NAVIGATION_ITEMS } from './constants';
import { FloorPlanPage } from './pages/FloorPlanPage';
import { InventoryPage } from './pages/InventoryPage';
import { CustomerPortalPage } from './pages/CustomerPortalPage';
import { SuperAdminPage } from './pages/SuperAdminPage';

const ProtectedRoute: React.FC<{ children: React.ReactNode; allowedRoles: UserRole[] }> = ({ children, allowedRoles }) => {
  const { user } = useAppContext();

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (!allowedRoles.includes(user.rol)) {
    // Redirect Super Admin to their specific dashboard if they try to access unauthorized regular routes
    if (user.rol === UserRole.SUPER_ADMIN) return <Navigate to="/super-admin" replace />;
    
    const fallbackUrl = NAVIGATION_ITEMS.find(item => item.roles.includes(user.rol))?.href || '/';
    return <Navigate to={fallbackUrl} replace />;
  }

  return <>{children}</>;
};

const AdminApp: React.FC = () => {
  const { user } = useAppContext();

  if (!user) {
    return <LoginPage />;
  }
  
  // Redirect Super Admin to their dashboard on root load
  if (user.rol === UserRole.SUPER_ADMIN && window.location.hash === '#/') {
      return <Navigate to="/super-admin" replace />;
  }
  
  const userHomePage = NAVIGATION_ITEMS.find(item => item.roles.includes(user.rol))?.href || '/';

  return (
    <Routes>
      <Route path="/" element={<Layout />}>
         {/* Super Admin Route */}
        <Route path="super-admin" element={<ProtectedRoute allowedRoles={[UserRole.SUPER_ADMIN]}><SuperAdminPage /></ProtectedRoute>} />

        {/* Standard Routes - Accessible by Super Admin when "logged in" to a restaurant context */}
        <Route index element={<Navigate to={userHomePage} replace />} />
        <Route path="dashboard" element={<ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.GERENTE, UserRole.SUPER_ADMIN]}><DashboardPage /></ProtectedRoute>} />
        <Route path="pedidos" element={<ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.GERENTE, UserRole.MOZO, UserRole.REPARTO, UserRole.SUPER_ADMIN]}><OrdersPage /></ProtectedRoute>} />
        <Route path="salon" element={<ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.GERENTE, UserRole.MOZO, UserRole.SUPER_ADMIN]}><FloorPlanPage /></ProtectedRoute>} />
        <Route path="gic" element={<ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.GERENTE, UserRole.COCINA, UserRole.SUPER_ADMIN]}><KdsPage /></ProtectedRoute>} />
        <Route path="menu" element={<ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.GERENTE, UserRole.SUPER_ADMIN]}><MenuPage /></ProtectedRoute>} />
        <Route path="inventario" element={<ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.GERENTE, UserRole.SUPER_ADMIN]}><InventoryPage /></ProtectedRoute>} />
        <Route path="clientes" element={<ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.GERENTE, UserRole.MOZO, UserRole.SUPER_ADMIN]}><CustomersPage /></ProtectedRoute>} />
        <Route path="cupones" element={<ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.GERENTE, UserRole.SUPER_ADMIN]}><CouponsPage /></ProtectedRoute>} />
        <Route path="reportes" element={<ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.GERENTE, UserRole.SUPER_ADMIN]}><ReportsPage /></ProtectedRoute>} />
        <Route path="configuracion" element={<ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.SUPER_ADMIN]}><SettingsPage /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to={userHomePage} replace />} />
      </Route>
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <HashRouter>
      <Routes>
        <Route path="/portal/:restaurantId" element={<CustomerPortalPage />} />
        <Route path="/*" element={<AdminApp />} />
      </Routes>
    </HashRouter>
  );
};

export default App;
