
import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { useAppContext } from '../contexts/AppContext';
import { User, UserRole, RestaurantSettings } from '../types';
import { PlusCircle, X, Trash2, Database, Key, Eye, EyeOff, FileCode, Copy, ChevronDown, ChevronUp } from 'lucide-react';

// ... [UserModal, UserManagementTab, RestaurantSettingsTab, TaxesAndTipsTab components remain unchanged] ... 
// Re-implementing specific parts only for brevity where context allows, but full file is requested by user instruction so:

const UserModal: React.FC<{
    userToEdit: User | null;
    onClose: () => void;
    onSave: (userData: Omit<User, 'id' | 'restaurant_id' | 'avatar_url'> | User) => void;
}> = ({ userToEdit, onClose, onSave }) => {
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
                password: '',
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

        if (formData.password) {
            dataToSave.password = formData.password;
            dataToSave.must_change_password = false;
        } else if (!userToEdit) {
             dataToSave.password = 'password';
             dataToSave.must_change_password = true;
        }

        if (userToEdit) {
            onSave({ ...userToEdit, ...dataToSave });
        } else {
            onSave(dataToSave);
        }
    };

    const inputClasses = "mt-1 block w-full px-3 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500";
    
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
    
    const displayUsers = users.filter(u => u.rol !== UserRole.SUPER_ADMIN);

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
    const [formState, setFormState] = useState<RestaurantSettings>({
        nombre: '', logo_url: '', direccion: '', telefono: '', horarios: '', iva_rate: 21, precios_con_iva: true, propina_opciones: [10, 15, 20]
    });
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => { 
        if (restaurantSettings) { setFormState(restaurantSettings); setIsLoaded(true); }
    }, [restaurantSettings]);

    useEffect(() => {
        const t = setTimeout(() => setIsLoaded(true), 800);
        return () => clearTimeout(t);
    }, []);

    if (!isLoaded) return <div className="p-4 text-center text-gray-500">Cargando configuración...</div>;

    const handleChange = (e: any) => setFormState({ ...formState, [e.target.name]: e.target.value });
    const handleSubmit = (e: any) => { e.preventDefault(); updateRestaurantSettings(formState); };
    const inputClasses = "mt-1 block w-full px-3 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500";
    
    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Datos del Restaurante</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div><label className="block text-sm font-medium">Nombre</label><input type="text" name="nombre" value={formState.nombre} onChange={handleChange} className={inputClasses} placeholder="Nombre del Restaurante" /></div>
                <div><label className="block text-sm font-medium">URL del Logo</label><input type="text" name="logo_url" value={formState.logo_url} onChange={handleChange} className={inputClasses} placeholder="https://..." /></div>
                <div><label className="block text-sm font-medium">Dirección</label><input type="text" name="direccion" value={formState.direccion} onChange={handleChange} className={inputClasses} placeholder="Dirección física" /></div>
                <div><label className="block text-sm font-medium">Teléfono</label><input type="text" name="telefono" value={formState.telefono} onChange={handleChange} className={inputClasses} placeholder="Teléfono de contacto" /></div>
                <div className="md:col-span-2"><label className="block text-sm font-medium">Horarios</label><textarea name="horarios" value={formState.horarios} onChange={handleChange} rows={4} className={inputClasses} placeholder="Ej: Lun-Dom 9:00 - 23:00"></textarea></div>
            </div>
            <div className="flex justify-end pt-4 border-t dark:border-gray-700"><button type="submit" className="px-4 py-2 text-sm font-semibold text-white bg-orange-500 rounded-lg hover:bg-orange-600">Guardar Cambios</button></div>
        </form>
    );
};

const TaxesAndTipsTab: React.FC = () => {
    const { restaurantSettings, updateRestaurantSettings } = useAppContext();
    const [formState, setFormState] = useState<RestaurantSettings>({
        nombre: '', logo_url: '', direccion: '', telefono: '', horarios: '', iva_rate: 21, precios_con_iva: true, propina_opciones: [10, 15, 20]
    });
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => { if (restaurantSettings) { setFormState(restaurantSettings); setIsLoaded(true); } }, [restaurantSettings]);
    useEffect(() => { const t = setTimeout(() => setIsLoaded(true), 800); return () => clearTimeout(t); }, []);

    if (!isLoaded) return <div className="p-4 text-center text-gray-500">Cargando impuestos...</div>;

    const handleIvaRateChange = (e: any) => setFormState(prev => ({ ...prev, iva_rate: parseFloat(e.target.value) || 0 }));
    const handlePreciosConIvaChange = (e: any) => setFormState(prev => ({ ...prev, precios_con_iva: e.target.checked }));
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

// UPDATED SQL Script to include Sectors and new structure
const SUPABASE_SCHEMA_SQL = `
-- CREACIÓN DE TABLAS PARA RESTAURANTE PRO 2.0 - ACTUALIZADO
-- Incluye Sectores, Turnos y Estructura Avanzada

DO $$ 
DECLARE 
    r RECORD; 
BEGIN 
    -- Limpieza segura de políticas (RLS)
    FOR r IN (SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public') LOOP 
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON "' || r.tablename || '";'; 
    END LOOP; 
END $$;

create table if not exists restaurants (
  id text primary key,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone default now()
);

create table if not exists app_users (
  id text primary key,
  restaurant_id text references restaurants(id) on delete cascade,
  nombre text not null,
  email text not null,
  rol text not null,
  avatar_url text,
  password text,
  estado_delivery text default 'DISPONIBLE',
  is_deleted boolean default false,
  must_change_password boolean default false,
  last_location jsonb,
  created_at timestamp with time zone default now()
);

create table if not exists sectors (
  id text primary key,
  restaurant_id text references restaurants(id) on delete cascade,
  nombre text not null,
  orden integer default 0,
  is_active boolean default true,
  created_at timestamp with time zone default now()
);

create table if not exists categories (
  id text primary key,
  restaurant_id text references restaurants(id) on delete cascade,
  nombre text not null,
  orden integer default 0,
  parent_id text references categories(id) on delete cascade,
  created_at timestamp with time zone default now()
);

-- Migración: parent_id en categories
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'categories' AND column_name = 'parent_id') THEN 
        ALTER TABLE categories ADD COLUMN parent_id text references categories(id) on delete cascade; 
    END IF; 
END $$;

create table if not exists ingredients (
  id text primary key,
  restaurant_id text references restaurants(id) on delete cascade,
  nombre text not null,
  unidad text not null,
  stock_actual numeric default 0,
  stock_minimo numeric default 0,
  coste_unitario numeric default 0,
  categoria text default 'GENERAL',
  created_at timestamp with time zone default now()
);

create table if not exists menu_items (
  id text primary key,
  restaurant_id text references restaurants(id) on delete cascade,
  category_id text references categories(id) on delete set null,
  nombre text not null,
  descripcion text,
  precio_base numeric default 0,
  coste numeric default 0,
  receta jsonb default '[]'::jsonb,
  img_url text,
  etiquetas text[],
  disponible boolean default true,
  tiempo_preparacion_min integer default 0,
  stock_actual numeric,
  permite_venta_sin_stock boolean default false,
  is_deleted boolean default false,
  created_at timestamp with time zone default now()
);

create table if not exists customers (
  id text primary key,
  restaurant_id text references restaurants(id) on delete cascade,
  nombre text not null,
  telefono text,
  email text,
  ltv numeric default 0,
  ultima_compra timestamp with time zone,
  frecuencia_promedio_dias numeric default 0,
  is_verified boolean default false,
  direccion jsonb default '{}'::jsonb,
  is_deleted boolean default false,
  created_at timestamp with time zone default now()
);

create table if not exists tables (
  id text primary key,
  table_number integer,
  restaurant_id text references restaurants(id) on delete cascade,
  sector_id text references sectors(id) on delete set null,
  nombre text,
  estado text default 'LIBRE',
  x integer default 0,
  y integer default 0,
  shape text default 'square',
  order_id integer,
  mozo_id text,
  created_at timestamp with time zone default now()
);

-- Migración: sector_id en tables
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tables' AND column_name = 'sector_id') THEN 
        ALTER TABLE tables ADD COLUMN sector_id text references sectors(id) on delete set null; 
    END IF; 
END $$;

create table if not exists orders (
  id bigint generated by default as identity primary key,
  restaurant_id text references restaurants(id) on delete cascade,
  customer_id text references customers(id) on delete set null,
  table_id integer,
  creado_por_id text,
  repartidor_id text,
  mozo_id text,
  tipo text not null,
  estado text not null,
  subtotal numeric default 0,
  descuento numeric default 0,
  impuestos numeric default 0,
  propina numeric default 0,
  total numeric default 0,
  items jsonb default '[]'::jsonb,
  payments jsonb default '[]'::jsonb,
  delivery_info jsonb default '{}'::jsonb,
  creado_en text,
  created_at timestamp with time zone default now()
);

-- Migración: delivery_info en orders
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'delivery_info') THEN 
        ALTER TABLE orders ADD COLUMN delivery_info jsonb default '{}'::jsonb; 
    END IF; 
END $$;

create table if not exists coupons (
  id text primary key,
  restaurant_id text references restaurants(id) on delete cascade,
  codigo text not null,
  tipo text not null,
  valor numeric default 0,
  activo boolean default true,
  expira_en text,
  minimo_subtotal numeric,
  created_at timestamp with time zone default now()
);

-- Indices
create index if not exists idx_orders_restaurant on orders(restaurant_id);
create index if not exists idx_tables_sector on tables(sector_id);

-- DESHABILITAR RLS (MODO DESARROLLO ÁGIL)
ALTER TABLE restaurants DISABLE ROW LEVEL SECURITY;
ALTER TABLE app_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE sectors DISABLE ROW LEVEL SECURITY;
ALTER TABLE categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE ingredients DISABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE tables DISABLE ROW LEVEL SECURITY;
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE coupons DISABLE ROW LEVEL SECURITY;

-- SEED DATA (DEMO)
INSERT INTO restaurants (id, settings)
VALUES ('rest-demo', '{"nombre": "Restaurante Demo", "direccion": "Av. Siempre Viva 123", "telefono": "555-0100", "logo_url": "https://via.placeholder.com/150", "horarios": "Lun-Dom 9am-12pm", "iva_rate": 21, "precios_con_iva": true, "propina_opciones": [10, 15]}')
ON CONFLICT (id) DO NOTHING;

INSERT INTO sectors (id, restaurant_id, nombre, orden)
VALUES 
('sec-main', 'rest-demo', 'Salón Principal', 1),
('sec-terrace', 'rest-demo', 'Terraza', 2)
ON CONFLICT (id) DO NOTHING;

INSERT INTO app_users (id, restaurant_id, nombre, email, rol, password, avatar_url)
VALUES 
('user-super-admin', NULL, 'Super Admin', 'admin@restaurante.com', 'SUPER_ADMIN', '123456', 'https://i.pravatar.cc/150?u=super'),
('user-demo-mgr', 'rest-demo', 'Gerente Demo', 'demo@restaurante.com', 'GERENTE', '123456', 'https://i.pravatar.cc/150?u=mgr'),
('user-demo-waiter', 'rest-demo', 'Mozo Juan', 'juan@restaurante.com', 'MOZO/A', '123456', 'https://i.pravatar.cc/150?u=waiter'),
('user-demo-driver', 'rest-demo', 'Repartidor Pedro', 'pedro@restaurante.com', 'REPARTO', '123456', 'https://i.pravatar.cc/150?u=driver')
ON CONFLICT (id) DO NOTHING;
`;

export const AdvancedSettingsTab: React.FC = () => {
    const [showSql, setShowSql] = useState(false);
    const { showToast } = useAppContext();

    const handleCopySql = () => {
        navigator.clipboard.writeText(SUPABASE_SCHEMA_SQL);
        showToast("SQL copiado al portapapeles.");
    };

    return (
        <div className="space-y-8">
             <div className="p-6 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800">
                 <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                     <Database className="h-6 w-6 text-blue-600" /> Configuración de Base de Datos (Supabase)
                 </h2>
                 
                 <div className="mt-6 pt-6 border-t dark:border-gray-700">
                     <button 
                        onClick={() => setShowSql(!showSql)}
                        className="flex items-center justify-between w-full text-left text-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 p-2 rounded-lg transition-colors"
                     >
                         <span className="flex items-center gap-2"><FileCode className="h-5 w-5 text-indigo-500"/> Esquema de Base de Datos (SQL)</span>
                         {showSql ? <ChevronUp className="h-5 w-5"/> : <ChevronDown className="h-5 w-5"/>}
                     </button>
                     
                     {showSql && (
                         <div className="mt-3 animate-fade-in-down">
                             <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                 Este script crea las tablas avanzadas (Sectores, Turnos, etc.) necesarias para la versión 2.0. Ejecútalo en el <strong>SQL Editor</strong> de Supabase.
                             </p>
                             <div className="relative">
                                <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-xs font-mono overflow-x-auto h-64">
                                    {SUPABASE_SCHEMA_SQL}
                                </pre>
                                <button 
                                    onClick={handleCopySql}
                                    className="absolute top-2 right-2 p-2 bg-white/10 hover:bg-white/20 rounded text-white"
                                    title="Copiar SQL"
                                >
                                    <Copy className="h-4 w-4" />
                                </button>
                             </div>
                         </div>
                     )}
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
