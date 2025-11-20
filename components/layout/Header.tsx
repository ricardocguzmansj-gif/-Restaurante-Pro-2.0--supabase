
import React from 'react';
import { Bell, Search } from 'lucide-react';
import { useAppContext } from '../../contexts/AppContext';

export const Header: React.FC = () => {
    const { user, restaurantSettings } = useAppContext();

    if (!user) return null;

    return (
        <header className="flex items-center justify-between h-20 px-6 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center flex-1">
                {restaurantSettings && (
                    <div className="mr-6 hidden md:block">
                        <h2 className="text-2xl font-extrabold text-orange-600 dark:text-orange-400 truncate max-w-[300px]">
                            {restaurantSettings.nombre}
                        </h2>
                    </div>
                )}
                <div className="relative hidden sm:block w-full max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Buscar producto (Ctrl+K)..."
                        className="w-full pl-10 pr-4 py-2 text-sm text-gray-700 bg-gray-100 dark:bg-gray-700 dark:text-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                </div>
            </div>
            <div className="flex items-center space-x-4">
                <button className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                    <Bell className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                </button>
                <div className="flex items-center">
                    <img
                        className="h-10 w-10 rounded-full object-cover"
                        src={user.avatar_url}
                        alt={user.nombre}
                    />
                    <div className="ml-3 hidden md:block">
                        <p className="text-sm font-semibold text-gray-800 dark:text-white">{user.nombre}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{user.rol}</p>
                    </div>
                </div>
            </div>
        </header>
    );
};
