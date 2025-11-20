
import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Pizza, LogOut, ArrowLeftCircle } from 'lucide-react';
import { useAppContext } from '../../contexts/AppContext';
import { NAVIGATION_ITEMS } from '../../constants';
import { UserRole } from '../../types';

export const Sidebar: React.FC = () => {
    const { user, logout, switchRestaurant, restaurantSettings } = useAppContext();
    const location = useLocation();

    if (!user) return null;

    // Show specialized sidebar if on Super Admin Dashboard main page
    const isSuperAdminPage = location.pathname === '/super-admin';

    if (user.rol === UserRole.SUPER_ADMIN && isSuperAdminPage) {
        return (
             <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-center h-20 border-b border-gray-200 dark:border-gray-700">
                     <Pizza className="h-8 w-8 text-orange-500" />
                    <span className="ml-2 text-xl font-bold text-gray-800 dark:text-white">Restaurante Pro</span>
                </div>
                <div className="p-4 text-center">
                    <span className="inline-block px-3 py-1 bg-purple-100 text-purple-800 text-xs font-bold rounded-full uppercase tracking-wide">
                        Modo Super Admin
                    </span>
                </div>
                <div className="mt-auto p-4 border-t border-gray-200 dark:border-gray-700">
                    <button
                        onClick={logout}
                        className="flex items-center w-full px-4 py-2.5 text-sm font-medium rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                    >
                        <LogOut className="h-5 w-5 mr-3" />
                        Cerrar Sesión
                    </button>
                </div>
            </aside>
        );
    }

    const hasAccess = (allowedRoles: UserRole[]) => {
        // Super Admin has access to everything when inside a restaurant context
        if (user.rol === UserRole.SUPER_ADMIN) return true;
        return allowedRoles.includes(user.rol);
    }

    const handleBackToSuperAdmin = async () => {
        await switchRestaurant(''); // Clear current restaurant context
        // Since we are using HashRouter in App.tsx but navigating programmatically might need full path
        // Ideally we use navigate('/super-admin'), but here we can let the Link or just simple location change work.
        // However, using window.location.hash is a hard force.
        window.location.hash = '#/super-admin';
    };

    return (
        <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-center h-20 border-b border-gray-200 dark:border-gray-700 px-4">
                 <Pizza className="h-8 w-8 text-orange-500 flex-shrink-0" />
                <span className="ml-2 text-lg font-bold text-gray-800 dark:text-white truncate" title={restaurantSettings?.nombre || 'Restaurante Pro'}>
                    {restaurantSettings?.nombre || 'Restaurante Pro'}
                </span>
            </div>
            <nav className="flex-1 p-4 space-y-2">
                {user.rol === UserRole.SUPER_ADMIN && (
                     <button
                        onClick={handleBackToSuperAdmin}
                        className="flex items-center w-full px-4 py-2.5 mb-4 text-sm font-bold rounded-lg bg-purple-100 text-purple-700 hover:bg-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:hover:bg-purple-800/50 transition-colors"
                    >
                        <ArrowLeftCircle className="h-5 w-5 mr-3" />
                        Volver al Panel
                    </button>
                )}
                
                {NAVIGATION_ITEMS.map((item) => (
                    hasAccess(item.roles) && (
                        <NavLink
                            key={item.href}
                            to={item.href}
                            className={({ isActive }) =>
                                `flex items-center px-4 py-2.5 text-sm font-medium rounded-lg transition-colors duration-200 ${
                                isActive
                                    ? 'bg-orange-500 text-white'
                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                                }`
                            }
                        >
                            <item.icon className="h-5 w-5 mr-3" />
                            {item.label}
                        </NavLink>
                    )
                ))}
            </nav>
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                <button
                    onClick={logout}
                    className="flex items-center w-full px-4 py-2.5 text-sm font-medium rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                >
                    <LogOut className="h-5 w-5 mr-3" />
                    Cerrar Sesión
                </button>
            </div>
        </aside>
    );
};
