
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
    // Special handling: If Super Admin tries to access a regular route but has access (is managing a restaurant), allow it.
    // The allowedRoles check above handles strict role restriction. 
    // If user IS Super Admin, they generally have access to everything in the AdminApp context EXCEPT when specifically restricted.
    // However, if they are just landing, we want to be careful.
    
    if (user.rol === UserRole.SUPER_ADMIN) {
        // If Super Admin is trying to access /super-admin, allow (it's in allowedRoles usually)
        // If Super Admin is trying to access /dashboard, allow (it's in allowedRoles)
        // This block runs if allowedRoles DOES NOT include SUPER_ADMIN, which shouldn't happen for the main routes 
        // as we added SUPER_ADMIN to them in constants/App.
        
        // Fallback: Redirect to super admin dashboard
        return <Navigate to="/super-admin" replace />;
    }
    
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
  
  // Determine the correct homepage based on role
  const userHomePage = user.rol === UserRole.SUPER_ADMIN 
      ? '/super-admin' 
      : (NAVIGATION_ITEMS.find(item => item.roles.includes(user.rol))?.href || '/dashboard');

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
