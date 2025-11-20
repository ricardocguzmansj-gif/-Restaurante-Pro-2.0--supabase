
// ... (Imports)
import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { useAppContext } from '../contexts/AppContext';
import { User, UserRole, RestaurantSettings } from '../types';
import { PlusCircle, X, Trash2, AlertTriangle, Database, Loader2, CheckCircle, Key, Eye, EyeOff } from 'lucide-react';
import { migrateToSupabase } from '../services/supabaseMigration';
import { isSupabaseConfigured } from '../services/supabase';


const UserModal: React.FC<{
    userToEdit: User | null;
    onClose: () => void;
    onSave: (userData: Omit<User, 'id' | 'restaurant_id' | 'avatar_url'> | User) => void;
}> = ({ userToEdit, onClose, onSave }) => {
    // Renaming context user to 'currentUser' to avoid confusion with local variables
    const { users, showToast, user: currentUser } = useAppContext();
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
        nombre: '',
        email: '',
        rol: UserRole.MOZO,
        password: '',
        confirmPassword: ''
    });

    useEffect(() => {
        if (userToEdit) {
            setFormData({
                nombre: userToEdit.nombre,
                email: userToEdit.email,
                rol: userToEdit.rol,
                password: '', // Don't show existing password for security
                confirmPassword: ''
            });
        }
    }, [userToEdit]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const generateSecurePassword = () => {
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
        let pass = "";
        for (let i = 0; i < 16; i++) {
            pass += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        setFormData(prev => ({ ...prev, password: pass, confirmPassword: pass }));
        setShowPassword(true); 
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
        
        if (formData.password && formData.password !== formData.confirmPassword) {
             showToast('Las contraseñas no coinciden.', 'error');
             return;
        }

        const dataToSave: any = {
            nombre: formData.nombre,
            email: formData.email,
            rol: formData.rol,
        };

        // Only update password if entered
        if (formData.password) {
            dataToSave.password = formData.password;
        } else if (!userToEdit) {
             // Default password for new users if not provided
             dataToSave.password = 'password';
        }

        if (userToEdit) {
            onSave({ ...userToEdit, ...dataToSave });
        } else {
            onSave(dataToSave);
        }
    };

    const inputClasses = "mt-1 block w-full px-3 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500";
    
    // Filter roles: SUPER_ADMIN option is ONLY available if the logged-in user is a SUPER_ADMIN
    const availableRoles = Object.values(UserRole).filter(role => {
        if (role === UserRole.SUPER_ADMIN) {
            return currentUser?.rol === UserRole.SUPER_ADMIN;
        }
        return true;
    });

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
                            <div className="flex justify-between items-center mb-1">
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Contraseña {userToEdit && '(Opcional)'}</label>
                                <button 
                                    type="button" 
                                    onClick={generateSecurePassword}
                                    className="text-xs flex items-center gap-1 text-blue-500 hover:text-blue-600 font-medium"
                                >
                                    <Key className="h-3 w-3" /> Sugerir
                                </button>
                            </div>
                            <div className="relative">
                                <input 
                                    type={showPassword ? "text" : "password"}
                                    name="password" 
                                    id="password" 
                                    value={formData.password} 
                                    onChange={handleChange} 
                                    className={`${inputClasses} pr-10`} 
                                    placeholder={userToEdit ? "••••••••" : "Nueva contraseña"} 
                                    required={!userToEdit}
                                />
                                 <button 
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-2 top-2 text-gray-400 hover:text-gray-600"
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4"/> : <Eye className="h-4 w-4"/>}
                                </button>
                            </div>
                        </div>
                        
                        {(formData.password) && (
                             <div className="animate-fade-in-down">
                                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Confirmar Contraseña</label>
                                <input 
                                    type={showPassword ? "text" : "password"}
                                    name="confirmPassword" 
                                    id="confirmPassword" 
                                    value={formData.confirmPassword} 
                                    onChange={handleChange} 
                                    className={`${inputClasses} border-orange-300 focus:border-orange-500`} 
                                    placeholder="Repetir contraseña"
                                    required
                                />
                                {formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword && (
                                    <p className="text-xs text-red-500 mt-1">Las contraseñas no coinciden.</p>
                                )}
                            </div>
                        )}

                        <div>
                            <label htmlFor="rol" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Rol</label>
                            <select name="rol" id="rol" value={formData.rol} onChange={handleChange} className={inputClasses}>
                                {availableRoles.map(role => (
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

// ... (Rest of the file: UserManagementTab, RestaurantSettingsTab, TaxesAndTipsTab, AdvancedSettingsTab, SettingsPage)
const UserManagementTab: React.FC = () => {
    const { users, user, createUser, updateUser, deleteUser } = useAppContext();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);

    const handleCreate = () => { setEditingUser(null); setIsModalOpen(true); };
    const handleEdit = (userToEdit: User) => { setEditingUser(userToEdit); setIsModalOpen(true); };
    const handleDelete = (userId: string, userName: string) => {
        if (userId === user?.id) { alert("No puedes eliminarte a ti mismo."); return; }
        if (window.confirm(`¿Estás seguro de que quieres eliminar al usuario "${userName}"?`)) { deleteUser(userId); }
    };
    const handleSave = async (userData: any) => {
        if ('id' in userData) await updateUser(userData);
        else await createUser(userData);
        setIsModalOpen(false);
    };
    
    // Filter out SUPER_ADMIN from the list. The Super Admin manages themselves in the Super Admin Dashboard.
    // Even if the currently logged-in user IS the super admin, they shouldn't see themselves in the restaurant's employee list here.
    const displayUsers = users.filter(u => u.rol !== UserRole.SUPER_ADMIN);

    // Ensure current user is visible in the list if they are logged in AND not super admin
    if (user && user.rol !== UserRole.SUPER_ADMIN && !displayUsers.find(u => u.id === user.id)) {
        displayUsers.unshift(user);
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Gestión de Usuarios</h2>
                <button onClick={handleCreate} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-orange-500 rounded-lg hover:bg-orange-600"><PlusCircle className="h-4 w-4" /> Nuevo Usuario</button>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700/50">
                        <tr><th className="px-6 py-3 text-left text-xs font-medium uppercase">Usuario</th><th className="px-6 py-3 text-left text-xs font-medium uppercase">Rol</th><th className="px-6 py-3 text-right text-xs font-medium uppercase">Acciones</th></tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {displayUsers.map(u => (
                            <tr key={u.id}>
                                <td className="px-6 py-4 whitespace-nowrap"><div className="flex items-center"><img className="h-10 w-10 rounded-full" src={u.avatar_url} alt={u.nombre} /><div className="ml-4"><div className="text-sm font-medium">{u.nombre}</div><div className="text-sm text-gray-500">{u.email}</div></div></div></td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">{u.rol}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-4">
                                    <button onClick={() => handleEdit(u)} className="text-orange-600 hover:text-orange-800">Editar</button>
                                    <button 
                                        onClick={() => handleDelete(u.id, u.nombre)} 
                                        className="text-red-600 hover:text-red-800 disabled:text-gray-400 disabled:cursor-not-allowed" 
                                        disabled={u.id === user?.id}
                                        title="Eliminar usuario"
                                    >
                                        Eliminar
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {displayUsers.length === 0 && <div className="text-center py-8 text-gray-500">No hay usuarios registrados en este restaurante.</div>}
            </div>
            {isModalOpen && <UserModal userToEdit={editingUser} onClose={() => setIsModalOpen(false)} onSave={handleSave} />}
        </div>
    );
};

const RestaurantSettingsTab: React.FC = () => {
    const { restaurantSettings, updateRestaurantSettings } = useAppContext();
    const [formState, setFormState] = useState<RestaurantSettings | null>(null);
    useEffect(() => { if (restaurantSettings) setFormState(restaurantSettings); }, [restaurantSettings]);
    if (!formState) return <div>Cargando...</div>;
    const handleChange = (e: any) => setFormState({ ...formState, [e.target.name]: e.target.value });
    const handleSubmit = (e: any) => { e.preventDefault(); updateRestaurantSettings(formState); };
    const inputClasses = "mt-1 block w-full px-3 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500";
    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Datos del Restaurante</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div><label className="block text-sm font-medium">Nombre</label><input type="text" name="nombre" value={formState.nombre} onChange={handleChange} className={inputClasses} /></div>
                <div><label className="block text-sm font-medium">URL del Logo</label><input type="text" name="logo_url" value={formState.logo_url} onChange={handleChange} className={inputClasses} /></div>
                <div><label className="block text-sm font-medium">Dirección</label><input type="text" name="direccion" value={formState.direccion} onChange={handleChange} className={inputClasses} /></div>
                <div><label className="block text-sm font-medium">Teléfono</label><input type="text" name="telefono" value={formState.telefono} onChange={handleChange} className={inputClasses} /></div>
                <div className="md:col-span-2"><label className="block text-sm font-medium">Horarios</label><textarea name="horarios" value={formState.horarios} onChange={handleChange} rows={4} className={inputClasses}></textarea></div>
            </div>
            <div className="flex justify-end pt-4 border-t dark:border-gray-700"><button type="submit" className="px-4 py-2 text-sm font-semibold text-white bg-orange-500 rounded-lg hover:bg-orange-600">Guardar Cambios</button></div>
        </form>
    );
};

const TaxesAndTipsTab: React.FC = () => {
    const { restaurantSettings, updateRestaurantSettings } = useAppContext();
    const [formState, setFormState] = useState<RestaurantSettings | null>(null);
    useEffect(() => { if (restaurantSettings) setFormState(restaurantSettings); }, [restaurantSettings]);
    if (!formState) return <div>Cargando...</div>;
    const handleIvaRateChange = (e: any) => setFormState(prev => prev ? { ...prev, iva_rate: parseFloat(e.target.value) || 0 } : null);
    const handlePreciosConIvaChange = (e: any) => setFormState(prev => prev ? { ...prev, precios_con_iva: e.target.checked } : null);
    const handleTipOptionChange = (index: number, value: string) => { const newOptions = [...formState.propina_opciones]; newOptions[index] = parseInt(value) || 0; setFormState({ ...formState, propina_opciones: newOptions }); };
    const addTipOption = () => setFormState({ ...formState, propina_opciones: [...formState.propina_opciones, 0] });
    const removeTipOption = (index: number) => { setFormState({ ...formState, propina_opciones: formState.propina_opciones.filter((_, i) => i !== index) }); };
    const handleSubmit = (e: any) => { e.preventDefault(); updateRestaurantSettings(formState); };
    const inputClasses = "block w-full px-3 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500";
    return (
        <form onSubmit={handleSubmit} className="space-y-8">
            <div>
                <h2 className="text-xl font-semibold">Impuestos (IVA)</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                    <div><label className="block text-sm font-medium">Tasa de IVA (%)</label><input type="number" value={formState.iva_rate} onChange={handleIvaRateChange} className={`${inputClasses} mt-1`} /></div>
                    <div className="flex items-end pb-2"><div className="flex items-center h-5"><input type="checkbox" checked={formState.precios_con_iva} onChange={handlePreciosConIvaChange} className="h-4 w-4 text-orange-600 border-gray-300 rounded" /></div><div className="ml-3 text-sm"><label className="font-medium">Precios incluyen IVA</label></div></div>
                </div>
            </div>
            <div className="pt-8 border-t dark:border-gray-700">
                <h2 className="text-xl font-semibold">Propinas</h2>
                <div className="space-y-3 max-w-md mt-4">
                    <label className="block text-sm font-medium">Opciones Sugeridas (%)</label>
                    {formState.propina_opciones.map((option, index) => (
                        <div key={index} className="flex items-center gap-2"><input type="number" value={option} onChange={(e) => handleTipOptionChange(index, e.target.value)} className={inputClasses} /><button type="button" onClick={() => removeTipOption(index)} className="p-2 text-red-500"><Trash2 className="h-4 w-4" /></button></div>
                    ))}
                </div>
                <button type="button" onClick={addTipOption} className="mt-4 flex items-center gap-2 px-3 py-1.5 text-sm font-semibold text-orange-600 border border-orange-500 rounded-lg hover:bg-orange-50 dark:hover:bg-orange-900/20"><PlusCircle className="h-4 w-4"/> Añadir Opción</button>
            </div>
            <div className="flex justify-end pt-4 border-t dark:border-gray-700"><button type="submit" className="px-4 py-2 text-sm font-semibold text-white bg-orange-500 rounded-lg hover:bg-orange-600">Guardar Cambios</button></div>
        </form>
    );
};

export const AdvancedSettingsTab: React.FC = () => {
    const { showToast } = useAppContext();
    const [supabaseUrl, setSupabaseUrl] = useState(localStorage.getItem('supabase_url') || '');
    const [supabaseKey, setSupabaseKey] = useState(localStorage.getItem('supabase_key') || '');
    const [migrationStatus, setMigrationStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [migrationLog, setMigrationLog] = useState<string[]>([]);
    const [isConfigured, setIsConfigured] = useState(isSupabaseConfigured());

    useEffect(() => {
        setIsConfigured(isSupabaseConfigured());
    }, []);

    const handleSaveCredentials = () => {
        localStorage.setItem('supabase_url', supabaseUrl);
        localStorage.setItem('supabase_key', supabaseKey);
        setIsConfigured(true);
        showToast("Credenciales guardadas. Recarga la página para activar el modo Online.", "success");
    };

    const handleClearCredentials = () => {
        localStorage.removeItem('supabase_url');
        localStorage.removeItem('supabase_key');
        setSupabaseUrl('');
        setSupabaseKey('');
        setIsConfigured(false);
        showToast("Credenciales eliminadas. Modo Demo activado.", "success");
    };

    const handleResetData = () => {
        if (window.confirm("¿ESTÁS SEGURO? Esto eliminará TODOS los datos locales.")) {
            const appKeys = ['orders', 'menuItems', 'customers', 'coupons', 'users', 'categories', 'restaurantSettings', 'tables', 'ingredients'];
            appKeys.forEach(key => localStorage.removeItem(key));
            window.location.reload();
        }
    };

    const handleMigrate = async () => {
        if (!supabaseUrl || !supabaseKey) {
            showToast("Debes guardar las credenciales primero.", "error");
            return;
        }
        
        if(!window.confirm("¿Iniciar migración de datos locales a Supabase? Asegúrate de que las tablas existan.")) {
            return;
        }

        setMigrationStatus('loading');
        setMigrationLog(['Iniciando conexión...']);

        try {
            await migrateToSupabase(supabaseUrl, supabaseKey, (msg) => {
                setMigrationLog(prev => [...prev, msg]);
            });
            setMigrationStatus('success');
            showToast("Migración exitosa. Ahora estás trabajando Online.", "success");
            setTimeout(() => window.location.reload(), 2000);
        } catch (error: any) {
            console.error(error);
            setMigrationStatus('error');
            setMigrationLog(prev => [...prev, `❌ ERROR: ${error.message}`]);
            showToast("Falló la migración.", "error");
        }
    };

    return (
        <div className="space-y-8">
             <div className="p-6 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800">
                 <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                     <Database className="h-6 w-6 text-blue-600" /> Configuración de Base de Datos (Supabase)
                 </h2>
                 
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
                         <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Supabase API Key (Service Role recommended for migration)</label>
                         <input 
                            type="password" 
                            value={supabaseKey} 
                            onChange={(e) => setSupabaseKey(e.target.value)}
                            placeholder="eyJh..."
                            className="mt-1 block w-full px-3 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md"
                        />
                     </div>
                 </div>
                 
                 <div className="flex gap-4">
                     <button onClick={handleSaveCredentials} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Guardar Credenciales</button>
                     {isConfigured && <button onClick={handleClearCredentials} className="px-4 py-2 border border-red-500 text-red-500 rounded hover:bg-red-50">Desconectar</button>}
                 </div>

                 {isConfigured && (
                     <div className="mt-6 pt-6 border-t dark:border-gray-700">
                        <h3 className="text-lg font-medium mb-2">Migración de Datos</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                             Sube tus datos locales actuales a la base de datos configurada.
                        </p>
                        <button
                            onClick={handleMigrate}
                            disabled={migrationStatus === 'loading'}
                            className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-bold text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50"
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
                 )}
            </div>

            <div className="border-t dark:border-gray-700 pt-8">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Zona de Peligro</h2>
                <div className="p-6 border-2 border-red-500 rounded-lg bg-red-50 dark:bg-red-900/20">
                    <div className="flex items-start">
                        <AlertTriangle className="h-6 w-6 text-red-500 mr-3" />
                        <div>
                            <h3 className="text-lg font-medium text-red-800 dark:text-red-200">Restablecer Datos Locales</h3>
                            <p className="mt-2 text-sm text-red-700 dark:text-red-300">Elimina datos locales (Demo). No afecta a Supabase.</p>
                            <button onClick={handleResetData} className="mt-4 px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700">Restablecer Todo</button>
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
                    <select onChange={(e) => setActiveTab(e.target.value)} value={activeTab} className="block w-full border-gray-300 rounded-md dark:bg-gray-700">
                        <option value="usuarios">Usuarios</option><option value="restaurante">Restaurante</option><option value="impuestos">Impuestos</option><option value="avanzado">Avanzado / DB</option>
                    </select>
                </div>
                <div className="hidden sm:block border-b border-gray-200 dark:border-gray-700">
                    <nav className="-mb-px flex space-x-8">
                        {['usuarios', 'restaurante', 'impuestos', 'avanzado'].map(tab => (
                            <button key={tab} onClick={() => setActiveTab(tab)} className={`${activeTab === tab ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-500 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm capitalize`}>{tab === 'avanzado' ? 'Avanzado / DB' : tab}</button>
                        ))}
                    </nav>
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
