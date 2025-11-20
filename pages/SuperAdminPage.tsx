
import React, { useState } from 'react';
import { Card } from '../components/ui/Card';
import { useAppContext } from '../contexts/AppContext';
import { Restaurant, RestaurantSettings, User } from '../types';
import { PlusCircle, Trash2, Edit, LogIn, Loader2, UserCircle, X, Database, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AdvancedSettingsTab } from './SettingsPage';

const RestaurantModal: React.FC<{
    restaurant: Restaurant | null;
    onClose: () => void;
    onSave: (settings: RestaurantSettings) => void;
}> = ({ restaurant, onClose, onSave }) => {
    const [formData, setFormData] = useState<RestaurantSettings>({
        nombre: '',
        logo_url: '',
        direccion: '',
        telefono: '',
        horarios: '',
        iva_rate: 21,
        precios_con_iva: true,
        propina_opciones: [5, 10, 15],
    });

    React.useEffect(() => {
        if (restaurant) {
            setFormData(restaurant.settings);
        }
    }, [restaurant]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
        onClose();
    };
    
    const inputClasses = "mt-1 block w-full px-3 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500";

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
                <form onSubmit={handleSubmit}>
                    <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
                        <h3 className="font-semibold text-lg">{restaurant ? 'Editar Restaurante' : 'Nuevo Restaurante'}</h3>
                        <button type="button" onClick={onClose} className="text-gray-500 hover:text-gray-700">X</button>
                    </div>
                    <div className="p-6 space-y-4">
                        <div>
                            <label className="block text-sm font-medium">Nombre</label>
                            <input name="nombre" value={formData.nombre} onChange={handleChange} required className={inputClasses} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium">Logo URL</label>
                            <input name="logo_url" value={formData.logo_url} onChange={handleChange} className={inputClasses} />
                        </div>
                         <div>
                            <label className="block text-sm font-medium">Dirección</label>
                            <input name="direccion" value={formData.direccion} onChange={handleChange} className={inputClasses} />
                        </div>
                         <div>
                            <label className="block text-sm font-medium">Teléfono</label>
                            <input name="telefono" value={formData.telefono} onChange={handleChange} className={inputClasses} />
                        </div>
                    </div>
                    <div className="px-6 py-3 bg-gray-50 dark:bg-gray-700/50 text-right">
                        <button type="submit" className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600">Guardar</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const SuperAdminProfileModal: React.FC<{
    user: User;
    onClose: () => void;
    onSave: (userData: Partial<User>) => Promise<void>;
}> = ({ user, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        nombre: user.nombre,
        email: user.email,
        password: user.password || '',
    });
    const [isSaving, setIsSaving] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await onSave({
                id: user.id,
                nombre: formData.nombre,
                email: formData.email,
                password: formData.password
            });
            onClose();
        } catch (error) {
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    };
    
    const inputClasses = "mt-1 block w-full px-3 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500";

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
                <form onSubmit={handleSubmit}>
                    <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
                        <h3 className="font-semibold text-lg">Perfil Super Admin</h3>
                        <button type="button" onClick={onClose} className="text-gray-500 hover:text-gray-700"><X className="h-5 w-5"/></button>
                    </div>
                    <div className="p-6 space-y-4">
                        <div>
                            <label className="block text-sm font-medium">Nombre</label>
                            <input name="nombre" value={formData.nombre} onChange={handleChange} required className={inputClasses} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium">Email</label>
                            <input type="email" name="email" value={formData.email} onChange={handleChange} required className={inputClasses} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium">Contraseña</label>
                            <input type="password" name="password" value={formData.password} onChange={handleChange} required className={inputClasses} />
                        </div>
                    </div>
                    <div className="px-6 py-3 bg-gray-50 dark:bg-gray-700/50 text-right">
                         <button type="submit" disabled={isSaving} className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50">
                            {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const GlobalSettingsModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                        <Database className="h-5 w-5" /> Configuración Global (Supabase)
                    </h3>
                    <button type="button" onClick={onClose} className="text-gray-500 hover:text-gray-700"><X className="h-5 w-5"/></button>
                </div>
                <div className="p-6 overflow-y-auto">
                    <AdvancedSettingsTab />
                </div>
                <div className="px-6 py-3 bg-gray-50 dark:bg-gray-700/50 text-right">
                     <button onClick={onClose} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500">
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
}

export const SuperAdminPage: React.FC = () => {
    const { restaurants, createRestaurant, deleteRestaurant, updateRestaurantSettings, switchRestaurant, showToast, user, updateUser } = useAppContext();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [isGlobalSettingsOpen, setIsGlobalSettingsOpen] = useState(false);
    const [editingRestaurant, setEditingRestaurant] = useState<Restaurant | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleCreate = () => {
        setEditingRestaurant(null);
        setIsModalOpen(true);
    };

    const handleEdit = (restaurant: Restaurant) => {
        setEditingRestaurant(restaurant);
        setIsModalOpen(true);
    };
    
    const handleManage = async (restaurantId: string) => {
        await switchRestaurant(restaurantId);
        navigate('/dashboard');
    };

    const handleSave = async (settings: RestaurantSettings) => {
        setIsLoading(true);
        try {
            if (editingRestaurant) {
                await updateRestaurantSettings(settings, editingRestaurant.id);
                showToast("Restaurante actualizado exitosamente.");
            } else {
                await createRestaurant(settings);
                showToast("Restaurante creado exitosamente.");
            }
        } catch (error) {
            console.error(error);
            showToast("Error al guardar restaurante.", "error");
        } finally {
            setIsLoading(false);
            setIsModalOpen(false);
        }
    };
    
    const handleDelete = async (id: string) => {
        if(window.confirm("¿Estás seguro? Esto eliminará el restaurante y TODOS sus datos (pedidos, clientes, usuarios). Esta acción no se puede deshacer.")) {
            setIsLoading(true);
            try {
                await deleteRestaurant(id);
                showToast("Restaurante eliminado correctamente.");
            } catch (error) {
                console.error(error);
                showToast("Error al eliminar restaurante.", "error");
            } finally {
                setIsLoading(false);
            }
        }
    }

    const handleUpdateProfile = async (userData: Partial<User>) => {
        try {
            await updateUser(userData as User);
            showToast("Perfil actualizado.");
        } catch (e) {
            showToast("Error al actualizar perfil", "error");
        }
    };

    return (
        <div className="p-6 max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Panel Super Admin</h1>
                <div className="flex gap-3">
                     <button onClick={() => setIsGlobalSettingsOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm">
                        <Settings className="h-5 w-5" /> Configuración Global
                    </button>
                    <button onClick={() => setIsProfileModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600">
                        <UserCircle className="h-5 w-5" /> Mi Perfil
                    </button>
                    <button onClick={handleCreate} disabled={isLoading} className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 shadow-sm">
                        {isLoading ? <Loader2 className="h-5 w-5 animate-spin"/> : <PlusCircle className="h-5 w-5" />}
                        Nuevo Restaurante
                    </button>
                </div>
            </div>
            
            {isLoading && <div className="text-center py-4 text-gray-500 animate-pulse">Procesando cambios...</div>}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {restaurants.map(rest => (
                    <Card key={rest.id} className="flex flex-col">
                        <div className="flex items-center gap-4 mb-4">
                            <img src={rest.settings.logo_url || 'https://via.placeholder.com/50'} alt={rest.settings.nombre} className="h-16 w-16 rounded-full object-cover border" />
                            <div>
                                <h3 className="font-bold text-lg">{rest.settings.nombre}</h3>
                                <p className="text-sm text-gray-500">{rest.settings.direccion}</p>
                            </div>
                        </div>
                        <div className="mt-auto flex gap-2 pt-4 border-t dark:border-gray-700">
                            <button onClick={() => handleManage(rest.id)} disabled={isLoading} className="flex-1 flex items-center justify-center gap-2 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50">
                                <LogIn className="h-4 w-4" /> Entrar
                            </button>
                            <button onClick={() => handleEdit(rest)} disabled={isLoading} className="p-2 text-blue-500 hover:bg-blue-50 rounded disabled:opacity-50"><Edit className="h-5 w-5" /></button>
                            <button onClick={() => handleDelete(rest.id)} disabled={isLoading} className="p-2 text-red-500 hover:bg-red-50 rounded disabled:opacity-50"><Trash2 className="h-5 w-5" /></button>
                        </div>
                    </Card>
                ))}
            </div>
            
            {restaurants.length === 0 && !isLoading && (
                <div className="text-center py-20 text-gray-500">
                    No hay restaurantes creados.
                </div>
            )}

            {isModalOpen && <RestaurantModal restaurant={editingRestaurant} onClose={() => setIsModalOpen(false)} onSave={handleSave} />}
            {isProfileModalOpen && user && <SuperAdminProfileModal user={user} onClose={() => setIsProfileModalOpen(false)} onSave={handleUpdateProfile} />}
            {isGlobalSettingsOpen && <GlobalSettingsModal onClose={() => setIsGlobalSettingsOpen(false)} />}
        </div>
    );
};
