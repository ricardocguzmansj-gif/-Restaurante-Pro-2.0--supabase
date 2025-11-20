
import React, { useState, useRef, useEffect } from 'react';
import { Bell, Search, X, Upload, Camera, Loader2, User as UserIcon, Lock, Mail, Key, Eye, EyeOff } from 'lucide-react';
import { useAppContext } from '../../contexts/AppContext';
import { User } from '../../types';

const UserProfileModal: React.FC<{
    user: User;
    onClose: () => void;
}> = ({ user, onClose }) => {
    const { updateUser, showToast } = useAppContext();
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
        nombre: user.nombre,
        email: user.email,
        password: '',
        confirmPassword: '',
        avatar_url: user.avatar_url
    });
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5000000) { // 5MB limit
                showToast("La imagen es demasiado grande (max 5MB).", "error");
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({ ...prev, avatar_url: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

    const generateSecurePassword = () => {
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
        let pass = "";
        for (let i = 0; i < 16; i++) {
            pass += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        setFormData(prev => ({ ...prev, password: pass, confirmPassword: pass }));
        setShowPassword(true); // Show it so they can copy it
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (formData.password && formData.password !== formData.confirmPassword) {
            showToast("Las contraseñas no coinciden.", "error");
            return;
        }

        setIsLoading(true);
        try {
            const updatedData: User = {
                ...user,
                nombre: formData.nombre,
                email: formData.email,
                avatar_url: formData.avatar_url,
            };

            if (formData.password) {
                updatedData.password = formData.password;
            }

            await updateUser(updatedData);
            showToast("Perfil actualizado correctamente.");
            onClose();
        } catch (error) {
            console.error(error);
            showToast("Error al actualizar el perfil.", "error");
        } finally {
            setIsLoading(false);
        }
    };

    const inputClasses = "mt-1 block w-full px-3 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500";

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={(e) => e.stopPropagation()}>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
                <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white">Editar Mi Perfil</h3>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"><X className="h-5 w-5" /></button>
                </div>
                
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Avatar Section */}
                    <div className="flex flex-col items-center">
                        <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                            <img 
                                src={formData.avatar_url || 'https://via.placeholder.com/150'} 
                                alt="Avatar" 
                                className="w-24 h-24 rounded-full object-cover border-4 border-gray-100 dark:border-gray-700 group-hover:opacity-75 transition-opacity"
                            />
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Camera className="h-8 w-8 text-white drop-shadow-lg" />
                            </div>
                            <div className="absolute bottom-0 right-0 bg-orange-500 p-1.5 rounded-full border-2 border-white dark:border-gray-800">
                                <Upload className="h-3 w-3 text-white" />
                            </div>
                        </div>
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            onChange={handleImageUpload} 
                            accept="image/*" 
                            className="hidden" 
                        />
                        <p className="text-xs text-gray-500 mt-2">Click para cambiar foto</p>
                    </div>

                    {/* Basic Info */}
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Información Personal</label>
                            <div className="relative">
                                <UserIcon className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                <input 
                                    type="text" 
                                    name="nombre" 
                                    value={formData.nombre} 
                                    onChange={handleChange} 
                                    placeholder="Tu Nombre"
                                    className={`${inputClasses} pl-9`} 
                                    required 
                                />
                            </div>
                        </div>
                        <div>
                            <div className="relative">
                                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                <input 
                                    type="email" 
                                    name="email" 
                                    value={formData.email} 
                                    onChange={handleChange} 
                                    placeholder="tucorreo@ejemplo.com"
                                    className={`${inputClasses} pl-9`} 
                                    required 
                                />
                            </div>
                        </div>
                    </div>

                    {/* Security */}
                    <div className="pt-4 border-t dark:border-gray-700 space-y-4">
                        <div className="flex justify-between items-center">
                             <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Seguridad</label>
                             <button 
                                type="button" 
                                onClick={generateSecurePassword}
                                className="text-xs flex items-center gap-1 text-blue-500 hover:text-blue-600 font-medium"
                             >
                                <Key className="h-3 w-3" /> Sugerir Contraseña Segura
                             </button>
                        </div>
                        
                        <div>
                            <div className="relative">
                                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                <input 
                                    type={showPassword ? "text" : "password"}
                                    name="password" 
                                    value={formData.password} 
                                    onChange={handleChange} 
                                    placeholder="Nueva Contraseña (opcional)"
                                    className={`${inputClasses} pl-9 pr-10`} 
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
                        {(formData.password || formData.confirmPassword) && (
                            <div className="animate-fade-in-down">
                                <div className="relative">
                                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                    <input 
                                        type={showPassword ? "text" : "password"}
                                        name="confirmPassword" 
                                        value={formData.confirmPassword} 
                                        onChange={handleChange} 
                                        placeholder="Confirmar Nueva Contraseña"
                                        className={`${inputClasses} pl-9 border-orange-300 focus:border-orange-500`} 
                                        required
                                    />
                                </div>
                                {formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword && (
                                    <p className="text-xs text-red-500 mt-1">Las contraseñas no coinciden.</p>
                                )}
                            </div>
                        )}
                    </div>
                </form>

                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-b-lg flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700">
                        Cancelar
                    </button>
                    <button 
                        onClick={handleSubmit} 
                        disabled={isLoading}
                        className="px-4 py-2 text-sm font-semibold text-white bg-orange-500 rounded-lg hover:bg-orange-600 disabled:opacity-50 flex items-center gap-2"
                    >
                        {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                        Guardar Cambios
                    </button>
                </div>
            </div>
        </div>
    );
};

export const Header: React.FC = () => {
    const { user, restaurantSettings } = useAppContext();
    const [isProfileOpen, setIsProfileOpen] = useState(false);

    if (!user) return null;

    return (
        <>
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
                    <button className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 relative group">
                        <Bell className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                        <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
                    </button>
                    
                    <button 
                        onClick={() => setIsProfileOpen(true)}
                        className="flex items-center p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors border border-transparent hover:border-gray-200 dark:hover:border-gray-600"
                        title="Editar Perfil"
                    >
                        <div className="relative">
                            <img
                                className="h-10 w-10 rounded-full object-cover border border-gray-200 dark:border-gray-600"
                                src={user.avatar_url}
                                alt={user.nombre}
                            />
                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></div>
                        </div>
                        <div className="ml-3 hidden md:block text-left">
                            <p className="text-sm font-semibold text-gray-800 dark:text-white">{user.nombre}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">{user.rol}</p>
                        </div>
                    </button>
                </div>
            </header>
            {isProfileOpen && <UserProfileModal user={user} onClose={() => setIsProfileOpen(false)} />}
        </>
    );
};
