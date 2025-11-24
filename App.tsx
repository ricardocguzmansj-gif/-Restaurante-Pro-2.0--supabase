
import React, { useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { DashboardPage } from './pages/DashboardPage';
import { KdsPage } from './pages/KdsPage';
import { LoginPage } from './pages/LoginPage';
import { MenuPage } from './pages/MenuPage';
import { CategoriesPage } from './pages/CategoriesPage';
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
import { Eye, EyeOff, Lock, LogOut, Key } from 'lucide-react';

const ProtectedRoute: React.FC<{ children: React.ReactNode; allowedRoles: UserRole[] }> = ({ children, allowedRoles }) => {
  const { user } = useAppContext();

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (!allowedRoles.includes(user.rol)) {
    // Special handling: If Super Admin tries to access a regular route but has access (is managing a restaurant), allow it.
    if (user.rol === UserRole.SUPER_ADMIN) {
        return <Navigate to="/super-admin" replace />;
    }
    
    const fallbackUrl = NAVIGATION_ITEMS.find(item => item.roles.includes(user.rol))?.href || '/';
    return <Navigate to={fallbackUrl} replace />;
  }

  return <>{children}</>;
};

const ForcePasswordChangePage: React.FC = () => {
    const { user, updateUser, showToast, logout } = useAppContext();
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const generateSecurePassword = () => {
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
        let pass = "";
        for (let i = 0; i < 16; i++) {
            pass += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        setNewPassword(pass);
        setConfirmPassword(pass);
        setShowPassword(true); 
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        if (newPassword.length < 6) {
            showToast("La contraseña debe tener al menos 6 caracteres.", "error");
            return;
        }

        if (newPassword !== confirmPassword) {
            showToast("Las contraseñas no coinciden.", "error");
            return;
        }

        setIsLoading(true);
        try {
            await updateUser({
                ...user,
                password: newPassword,
                must_change_password: false // Clear the flag
            });
            showToast("Contraseña actualizada. Por favor, inicia sesión con tu nueva contraseña.");
            logout(); // Log out to force re-authentication with new password
        } catch (error) {
            console.error(error);
            showToast("Error al actualizar la contraseña.", "error");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
            <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8">
                <div className="text-center mb-6">
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-orange-100 dark:bg-orange-900/30 mb-4">
                        <Lock className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Cambio de Contraseña Requerido</h2>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        Por seguridad, debes cambiar tu contraseña temporal antes de continuar.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                         <div className="flex justify-between items-center mb-1">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nueva Contraseña</label>
                            <button 
                                type="button" 
                                onClick={generateSecurePassword}
                                className="text-xs flex items-center gap-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                            >
                                <Key className="h-3 w-3" /> Sugerir Segura
                            </button>
                         </div>
                         <div className="mt-1 relative">
                            <input 
                                type={showPassword ? "text" : "password"}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:text-white"
                                required
                            />
                            <button 
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer"
                            >
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                         </div>
                    </div>
                    <div>
                         <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Confirmar Contraseña</label>
                         <input 
                            type={showPassword ? "text" : "password"}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:text-white"
                            required
                        />
                    </div>
                    
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50"
                    >
                        {isLoading ? 'Actualizando...' : 'Establecer Contraseña'}
                    </button>
                </form>
                
                <div className="mt-6 text-center">
                    <button onClick={logout} className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 flex items-center justify-center gap-2 w-full">
                        <LogOut className="h-4 w-4" /> Cancelar y Salir
                    </button>
                </div>
            </div>
        </div>
    );
};

const AdminApp: React.FC = () => {
  const { user } = useAppContext();

  if (!user) {
    return <LoginPage />;
  }

  // Intercept users who must change password
  if (user.must_change_password) {
      return <ForcePasswordChangePage />;
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
        <Route path="dashboard" element={<ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.GERENTE, UserRole.CAJA, UserRole.SUPER_ADMIN]}><DashboardPage /></ProtectedRoute>} />
        <Route path="pedidos" element={<ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.GERENTE, UserRole.MOZO, UserRole.REPARTO, UserRole.CAJA, UserRole.SUPER_ADMIN]}><OrdersPage /></ProtectedRoute>} />
        <Route path="salon" element={<ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.GERENTE, UserRole.MOZO, UserRole.SUPER_ADMIN]}><FloorPlanPage /></ProtectedRoute>} />
        <Route path="gic" element={<ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.GERENTE, UserRole.COCINA, UserRole.SUPER_ADMIN]}><KdsPage /></ProtectedRoute>} />
        <Route path="menu" element={<ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.GERENTE, UserRole.SUPER_ADMIN]}><MenuPage /></ProtectedRoute>} />
        <Route path="categorias" element={<ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.GERENTE, UserRole.SUPER_ADMIN]}><CategoriesPage /></ProtectedRoute>} />
        <Route path="inventario" element={<ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.GERENTE, UserRole.SUPER_ADMIN]}><InventoryPage /></ProtectedRoute>} />
        <Route path="clientes" element={<ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.GERENTE, UserRole.MOZO, UserRole.CAJA, UserRole.SUPER_ADMIN]}><CustomersPage /></ProtectedRoute>} />
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
