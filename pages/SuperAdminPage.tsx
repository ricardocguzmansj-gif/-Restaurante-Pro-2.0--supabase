
import React, { useState } from 'react';
import { Card } from '../components/ui/Card';
import { useAppContext } from '../contexts/AppContext';
import { Restaurant, RestaurantSettings } from '../types';
import { PlusCircle, Trash2, Edit, LogIn } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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

export const SuperAdminPage: React.FC = () => {
    const { restaurants, createRestaurant, deleteRestaurant, updateRestaurantSettings, switchRestaurant, user } = useAppContext();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRestaurant, setEditingRestaurant] = useState<Restaurant | null>(null);
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
        if (editingRestaurant) {
            await updateRestaurantSettings(settings, editingRestaurant.id);
        } else {
            await createRestaurant(settings);
        }
    };
    
    const handleDelete = async (id: string) => {
        if(window.confirm("¿Estás seguro? Esto eliminará el restaurante y TODOS sus datos.")) {
            await deleteRestaurant(id);
        }
    }

    return (
        <div className="p-6 max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Panel Super Admin</h1>
                <button onClick={handleCreate} className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600">
                    <PlusCircle className="h-5 w-5" /> Nuevo Restaurante
                </button>
            </div>
            
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
                            <button onClick={() => handleManage(rest.id)} className="flex-1 flex items-center justify-center gap-2 py-2 bg-green-500 text-white rounded hover:bg-green-600">
                                <LogIn className="h-4 w-4" /> Entrar
                            </button>
                            <button onClick={() => handleEdit(rest)} className="p-2 text-blue-500 hover:bg-blue-50 rounded"><Edit className="h-5 w-5" /></button>
                            <button onClick={() => handleDelete(rest.id)} className="p-2 text-red-500 hover:bg-red-50 rounded"><Trash2 className="h-5 w-5" /></button>
                        </div>
                    </Card>
                ))}
            </div>
            
            {restaurants.length === 0 && (
                <div className="text-center py-20 text-gray-500">
                    No hay restaurantes creados.
                </div>
            )}

            {isModalOpen && <RestaurantModal restaurant={editingRestaurant} onClose={() => setIsModalOpen(false)} onSave={handleSave} />}
        </div>
    );
};