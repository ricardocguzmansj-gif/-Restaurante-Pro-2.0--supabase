
import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { useAppContext } from '../contexts/AppContext';
import { User, UserRole, RestaurantSettings } from '../types';
import { PlusCircle, X, Trash2, AlertTriangle, Database, Loader2, CheckCircle } from 'lucide-react';
import { migrateToSupabase } from '../services/supabaseMigration';


const UserModal: React.FC<{
    userToEdit: User | null;
    onClose: () => void;
    onSave: (userData: Omit<User, 'id' | 'restaurant_id' | 'avatar_url'> | User) => void;
}> = ({ userToEdit, onClose, onSave }) => {
    const { users, showToast } = useAppContext();
    const [formData, setFormData] = useState({
        nombre: '',
        email: '',
        rol: UserRole.MOZO,
    });

    useEffect(() => {
        if (userToEdit) {
            setFormData({
                nombre: userToEdit.nombre,
                email: userToEdit.email,
                rol: userToEdit.rol,
            });
        }
    }, [userToEdit]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        const normalizedEmail = formData.email.toLowerCase().trim();
        if (!normalizedEmail) {
            showToast('El email no puede estar vacío.', 'error');
            return;
        }
        
        const isDuplicate = users.some(user => 
            user.email.toLowerCase().trim() === normalizedEmail && user.id !== userToEdit?.id
        );

        if (isDuplicate) {
            showToast('El email ya está en uso por otro usuario.', 'error');
            return;
        }

        if (userToEdit) {
            onSave({ ...userToEdit, ...formData });
        } else {
            onSave(formData);
        }
    };

    const inputClasses = "mt-1 block w-full px-3 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500";
    
    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
                <form onSubmit={handleSubmit}>
                    <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
                        <h3 className="font-semibold text-lg">{userToEdit ? 'Editar Usuario' : 'Crear Usuario'}</h3>
                        <button type="button" onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"><X className="h-4 w-4" /></button>
                    </div>
                    <div className="p-6 space-y-4">
                        <div>
                            <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nombre Completo</label>
                            <input type="text" name="nombre" id="nombre" value={formData.nombre} onChange={handleChange} required className={inputClasses} />
                        </div>
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                            <input type="email" name="email" id="email" value={formData.email} onChange={handleChange} required className={inputClasses} />
                        </div>
                        <div>
                            <label htmlFor="rol" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Rol</label>
                            <select name="rol" id="rol" value={formData.rol} onChange={handleChange} className={inputClasses}>
                                {Object.values(UserRole).map(role => (
                                    <option key={role} value={role}>{role}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="px-6 py-3 bg-gray-50 dark:bg-gray-700/50 text-right">
                        <button type="submit" className="px-4 py-2 text-sm font-semibold text-white bg-orange-500 rounded-lg hover:bg-orange-600">
                            {userToEdit ? 'Guardar Cambios' : 'Crear Usuario'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const UserManagementTab: React.FC = () => {
    const { users, user, createUser, updateUser, deleteUser } = useAppContext();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);

    const handleCreate = () => {
        setEditingUser(null);
        setIsModalOpen(true);
    };

    const handleEdit = (user: User) => {
        setEditingUser(user);
        setIsModalOpen(true);
    };

    const handleDelete = (userId: string, userName: string) => {
        if (userId === user?.id) {
            alert("No puedes eliminarte a ti mismo.");
            return;
        }
        if (window.confirm(`¿Estás seguro de que quieres eliminar al usuario "${userName}"? El usuario será desactivado y no podrá acceder al sistema.`)) {
            deleteUser(userId);
        }
    };

    const handleSave = async (userData: Omit<User, 'id' | 'restaurant_id' | 'avatar_url'> | User) => {
        if ('id' in userData) {
            await updateUser(userData);
        } else {
            await createUser(userData);
        }
        setIsModalOpen(false);
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Gestión de Usuarios</h2>
                <button onClick={handleCreate} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-orange-500 rounded-lg hover:bg-orange-600">
                    <PlusCircle className="h-4 w-4" />
                    Nuevo Usuario
                </button>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700/50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Usuario</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Rol</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {users.map(u => (
                            <tr key={u.id}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <img className="h-10 w-10 rounded-full" src={u.avatar_url} alt={u.nombre} />
                                        <div className="ml-4">
                                            <div className="text-sm font-medium text-gray-900 dark:text-white">{u.nombre}</div>
                                            <div className="text-sm text-gray-500 dark:text-gray-400">{u.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{u.rol}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-4">
                                    <button onClick={() => handleEdit(u)} className="text-orange-600 hover:text-orange-900">Editar</button>
                                    <button onClick={() => handleDelete(u.id, u.nombre)} className="text-red-600 hover:text-red-900 disabled:text-gray-400" disabled={u.id === user?.id}>Eliminar</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {isModalOpen && <UserModal userToEdit={editingUser} onClose={() => setIsModalOpen(false)} onSave={handleSave} />}
        </div>
    );
};

const RestaurantSettingsTab: React.FC = () => {
    const { restaurantSettings, updateRestaurantSettings } = useAppContext();
    const [formState, setFormState] = useState<RestaurantSettings | null>(null);

    useEffect(() => {
        if (restaurantSettings) {
            setFormState(restaurantSettings);
        }
    }, [restaurantSettings]);

    if (!formState) {
        return <div>Cargando configuración...</div>;
    }
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormState({ ...formState, [e.target.name]: e.target.value });
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        updateRestaurantSettings(formState);
    };
    
    const inputClasses = "mt-1 block w-full px-3 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500";

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Datos del Restaurante</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nombre del Restaurante</label>
                    <input type="text" name="nombre" id="nombre" value={formState.nombre} onChange={handleChange} className={inputClasses} />
                </div>
                <div>
                    <label htmlFor="logo_url" className="block text-sm font-medium text-gray-700 dark:text-gray-300">URL del Logo</label>
                    <input type="text" name="logo_url" id="logo_url" value={formState.logo_url} onChange={handleChange} className={inputClasses} />
                </div>
                 <div>
                    <label htmlFor="direccion" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Dirección</label>
                    <input type="text" name="direccion" id="direccion" value={formState.direccion} onChange={handleChange} className={inputClasses} />
                </div>
                <div>
                    <label htmlFor="telefono" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Teléfono</label>
                    <input type="text" name="telefono" id="telefono" value={formState.telefono} onChange={handleChange} className={inputClasses} />
                </div>
                <div className="md:col-span-2">
                    <label htmlFor="horarios" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Horarios de Atención</label>
                    <textarea name="horarios" id="horarios" value={formState.horarios} onChange={handleChange} rows={4} className={inputClasses}></textarea>
                </div>
            </div>
            <div className="flex justify-end pt-4 border-t dark:border-gray-700">
                 <button type="submit" className="px-4 py-2 text-sm font-semibold text-white bg-orange-500 rounded-lg hover:bg-orange-600">
                    Guardar Cambios
                </button>
            </div>
        </form>
    );
};

const TaxesAndTipsTab: React.FC = () => {
    const { restaurantSettings, updateRestaurantSettings } = useAppContext();
    const [formState, setFormState] = useState<RestaurantSettings | null>(null);

    useEffect(() => {
        if (restaurantSettings) {
            setFormState(restaurantSettings);
        }
    }, [restaurantSettings]);
    
    if (!formState) {
        return <div>Cargando configuración...</div>;
    }
    
    const handleIvaRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseFloat(e.target.value);
        setFormState(prev => prev ? { ...prev, iva_rate: isNaN(value) ? 0 : value } : null);
    };

    const handlePreciosConIvaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormState(prev => prev ? { ...prev, precios_con_iva: e.target.checked } : null);
    };

    const handleTipOptionChange = (index: number, value: string) => {
        const newOptions = [...formState.propina_opciones];
        const numValue = parseInt(value, 10);
        newOptions[index] = isNaN(numValue) ? 0 : numValue;
        setFormState({ ...formState, propina_opciones: newOptions });
    };

    const addTipOption = () => {
        setFormState({ ...formState, propina_opciones: [...formState.propina_opciones, 0] });
    };
    
    const removeTipOption = (index: number) => {
        const newOptions = formState.propina_opciones.filter((_, i) => i !== index);
        setFormState({ ...formState, propina_opciones: newOptions });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        updateRestaurantSettings(formState);
    };

    const inputClasses = "block w-full px-3 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500";

    return (
        <form onSubmit={handleSubmit} className="space-y-8">
            <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Impuestos (IVA)</h2>
                 <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 mb-4">Configuración del Impuesto al Valor Agregado.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="iva_rate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tasa de IVA (%)</label>
                        <input type="number" name="iva_rate" id="iva_rate" value={formState.iva_rate} onChange={handleIvaRateChange} className={`${inputClasses} mt-1`} />
                    </div>
                     <div className="flex items-end pb-2">
                        <div className="flex items-center h-5">
                            <input id="precios_con_iva" name="precios_con_iva" type="checkbox" checked={formState.precios_con_iva} onChange={handlePreciosConIvaChange} className="h-4 w-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500" />
                        </div>
                        <div className="ml-3 text-sm">
                            <label htmlFor="precios_con_iva" className="font-medium text-gray-700 dark:text-gray-300">Los precios del menú ya incluyen IVA</label>
                        </div>
                    </div>
                </div>
            </div>

            <div className="pt-8 border-t dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Propinas</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 mb-4">Configura los porcentajes de propina sugeridos al cliente. La propina para delivery se asigna al repartidor.</p>
                <div className="space-y-3 max-w-md">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Opciones de Propina Sugeridas (%)</label>
                    {formState.propina_opciones.map((option, index) => (
                        <div key={index} className="flex items-center gap-2">
                            <input
                                type="number"
                                value={option}
                                onChange={(e) => handleTipOptionChange(index, e.target.value)}
                                className={inputClasses}
                            />
                            <button type="button" onClick={() => removeTipOption(index)} className="p-2 text-red-500 hover:text-red-700"><Trash2 className="h-4 w-4" /></button>
                        </div>
                    ))}
                </div>
                <button type="button" onClick={addTipOption} className="mt-4 flex items-center gap-2 px-3 py-1.5 text-sm font-semibold text-orange-600 border border-orange-500 rounded-lg hover:bg-orange-50 dark:hover:bg-orange-900/20">
                    <PlusCircle className="h-4 w-4"/> Añadir Opción
                </button>
            </div>
            
            <div className="flex justify-end pt-4 border-t dark:border-gray-700">
                 <button type="submit" className="px-4 py-2 text-sm font-semibold text-white bg-orange-500 rounded-lg hover:bg-orange-600">
                    Guardar Cambios
                </button>
            </div>
        </form>
    );
};

const AdvancedSettingsTab: React.FC = () => {
    const { showToast } = useAppContext();
    const [supabaseUrl, setSupabaseUrl] = useState('');
    const [supabaseKey, setSupabaseKey] = useState('');
    const [migrationStatus, setMigrationStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [migrationLog, setMigrationLog] = useState<string[]>([]);

    const handleResetData = () => {
        if (window.confirm("¿ESTÁS SEGURO?\n\nEsta acción eliminará TODOS los datos (pedidos, clientes, menú, etc.) y restaurará la aplicación a su estado de demostración inicial.\n\nEsta acción no se puede deshacer.")) {
            const appKeys = ['orders', 'menuItems', 'customers', 'coupons', 'users', 'categories', 'restaurantSettings', 'tables', 'ingredients'];
            appKeys.forEach(key => localStorage.removeItem(key));
            window.location.reload();
        }
    };

    const handleMigrate = async () => {
        if (!supabaseUrl || !supabaseKey) {
            showToast("Debes ingresar URL y API Key de Supabase", "error");
            return;
        }
        
        if(!window.confirm("Asegúrate de haber creado las tablas en Supabase usando el script SQL proporcionado antes de continuar. ¿Deseas iniciar la migración?")) {
            return;
        }

        setMigrationStatus('loading');
        setMigrationLog(['Iniciando conexión...']);

        try {
            await migrateToSupabase(supabaseUrl, supabaseKey, (msg) => {
                setMigrationLog(prev => [...prev, msg]);
            });
            setMigrationStatus('success');
            showToast("Migración a Supabase exitosa.", "success");
        } catch (error: any) {
            console.error(error);
            setMigrationStatus('error');
            setMigrationLog(prev => [...prev, `❌ ERROR FATAL: ${error.message}`]);
            showToast("Falló la migración.", "error");
        }
    };

    return (
        <div className="space-y-8">
             <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Migrar a Base de Datos Real (Supabase)</h2>
                <div className="p-6 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800">
                     <div className="flex items-center mb-4">
                         <Database className="h-6 w-6 text-green-600 mr-2" />
                         <h3 className="text-lg font-medium">Exportar datos a Supabase</h3>
                     </div>
                     <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                         Transfiere todos tus datos locales (Menú, Clientes, Pedidos, etc.) a una instancia de Supabase PostgreSQL.
                         Asegúrate de ejecutar primero el <code>script SQL</code> de creación de tablas en tu proyecto Supabase.
                     </p>

                     <div className="grid gap-4 mb-4">
                         <div>
                             <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Supabase Project URL</label>
                             <input 
                                type="text" 
                                value={supabaseUrl} 
                                onChange={(e) => setSupabaseUrl(e.target.value)}
                                placeholder="https://xyz.supabase.co"
                                className="mt-1 block w-full px-3 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md"
                            />
                         </div>
                         <div>
                             <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Supabase Service Role Key (Secret)</label>
                             <input 
                                type="password" 
                                value={supabaseKey} 
                                onChange={(e) => setSupabaseKey(e.target.value)}
                                placeholder="eyJh..."
                                className="mt-1 block w-full px-3 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md"
                            />
                            <p className="text-xs text-gray-500 mt-1">Usa la 'Service Role Key' para tener permisos de escritura sin restricciones de RLS durante la migración.</p>
                         </div>
                     </div>

                     <button
                        onClick={handleMigrate}
                        disabled={migrationStatus === 'loading'}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-bold text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50"
                    >
                        {migrationStatus === 'loading' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Database className="h-4 w-4" />}
                        {migrationStatus === 'loading' ? 'Migrando...' : 'Iniciar Migración'}
                    </button>

                    {migrationLog.length > 0 && (
                        <div className="mt-4 p-3 bg-black text-green-400 font-mono text-xs rounded-md h-40 overflow-y-auto">
                            {migrationLog.map((log, i) => <div key={i}>{log}</div>)}
                        </div>
                    )}
                </div>
            </div>

            <div className="border-t dark:border-gray-700 pt-8">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Zona de Peligro</h2>
                <div className="p-6 border-2 border-red-500 rounded-lg bg-red-50 dark:bg-red-900/20">
                    <div className="flex items-start">
                        <div className="flex-shrink-0">
                            <AlertTriangle className="h-6 w-6 text-red-500" aria-hidden="true" />
                        </div>
                        <div className="ml-3">
                            <h3 className="text-lg font-medium text-red-800 dark:text-red-200">Restablecer Datos de Demostración</h3>
                            <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                                <p>Esta acción es irreversible. Eliminará todos los datos creados y devolverá la aplicación a su estado inicial con datos de ejemplo. Úsalo solo si quieres empezar de nuevo o para fines de demostración.</p>
                            </div>
                            <div className="mt-4">
                                <button
                                    onClick={handleResetData}
                                    className="px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                >
                                    Restablecer Datos Ahora
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};


export const SettingsPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState('usuarios');
    
    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Configuración</h1>
            
            <div>
                <div className="sm:hidden">
                    <label htmlFor="tabs" className="sr-only">Select a tab</label>
                    <select id="tabs" name="tabs" onChange={(e) => setActiveTab(e.target.value)} value={activeTab} className="block w-full focus:ring-orange-500 focus:border-orange-500 border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600">
                        <option value="usuarios">Usuarios y Roles</option>
                        <option value="restaurante">Restaurante</option>
                        <option value="impuestos">Impuestos y Propinas</option>
                        <option value="avanzado">Avanzado</option>
                    </select>
                </div>
                <div className="hidden sm:block">
                    <div className="border-b border-gray-200 dark:border-gray-700">
                        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                            <button onClick={() => setActiveTab('usuarios')} className={`${activeTab === 'usuarios' ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>
                                Usuarios y Roles
                            </button>
                            <button onClick={() => setActiveTab('restaurante')} className={`${activeTab === 'restaurante' ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>
                                Restaurante
                            </button>
                            <button onClick={() => setActiveTab('impuestos')} className={`${activeTab === 'impuestos' ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>
                                Impuestos y Propinas
                            </button>
                             <button onClick={() => setActiveTab('avanzado')} className={`${activeTab === 'avanzado' ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>
                                Avanzado
                            </button>
                        </nav>
                    </div>
                </div>
            </div>

            <Card>
                {activeTab === 'usuarios' && <UserManagementTab />}
                {activeTab === 'restaurante' && <RestaurantSettingsTab />}
                {activeTab === 'impuestos' && <TaxesAndTipsTab />}
                {activeTab === 'avanzado' && <AdvancedSettingsTab />}
            </Card>
        </div>
    );
};
