
import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { useAppContext } from '../contexts/AppContext';
import { formatCurrency, formatDate } from '../utils';
import { PlusCircle, X, Trash2, Sparkles, Loader2 } from 'lucide-react';
import { Coupon, UserRole } from '../types';
import { suggestCoupon } from '../services/ai';

// ToggleSwitch Component
const ToggleSwitch: React.FC<{ checked: boolean; onChange: (checked: boolean) => void; disabled?: boolean }> = ({ checked, onChange, disabled = false }) => {
    return (
        <label className={`relative inline-flex items-center ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
            <input type="checkbox" checked={checked} onChange={(e) => !disabled && onChange(e.target.checked)} className="sr-only peer" disabled={disabled} />
            <div className={`w-11 h-6 bg-gray-200 dark:bg-gray-700 rounded-full peer peer-focus:ring-2 peer-focus:ring-orange-300 dark:peer-focus:ring-orange-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-orange-500 ${disabled ? 'opacity-50' : ''}`}></div>
        </label>
    );
};

// Coupon Modal Component
const CouponModal: React.FC<{
    coupon: Coupon | null;
    onClose: () => void;
    onSave: (coupon: Omit<Coupon, 'id' | 'restaurant_id'> | Coupon) => void;
}> = ({ coupon, onClose, onSave }) => {
    const { showToast } = useAppContext();
    const [isGenerating, setIsGenerating] = useState(false);
    const [formData, setFormData] = useState({
        codigo: '',
        tipo: 'PORCENTAJE' as 'PORCENTAJE' | 'FIJO',
        valor: 0,
        activo: true,
        expira_en: '',
        minimo_subtotal: null as number | null,
    });
    
    useEffect(() => {
        if (coupon) {
            setFormData({
                codigo: coupon.codigo,
                tipo: coupon.tipo,
                valor: coupon.valor,
                activo: coupon.activo,
                expira_en: coupon.expira_en.split('T')[0],
                minimo_subtotal: coupon.minimo_subtotal
            });
        } else {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 30);
            setFormData({
                codigo: '',
                tipo: 'PORCENTAJE',
                valor: 10,
                activo: true,
                expira_en: tomorrow.toISOString().split('T')[0],
                minimo_subtotal: null,
            });
        }
    }, [coupon]);
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        
        let processedValue: string | number | null = value;
        if (type === 'number') {
            processedValue = value === '' ? null : parseFloat(value);
        }
        if (name === "minimo_subtotal" && processedValue === 0) {
             processedValue = null;
        }

        setFormData(prev => ({ ...prev, [name]: processedValue }));
    };

    const handleToggle = (activo: boolean) => {
        setFormData(prev => ({ ...prev, activo }));
    };

    const handleSuggest = async () => {
        setIsGenerating(true);
        const suggestion = await suggestCoupon();
        if (suggestion) {
            setFormData(prev => ({
                ...prev,
                codigo: suggestion.codigo,
                tipo: suggestion.tipo,
                valor: suggestion.valor,
            }));
            showToast(`Sugerencia: ${suggestion.descripcion}`);
        } else {
             showToast("No se pudo generar una sugerencia.", "error");
        }
        setIsGenerating(false);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const dataToSave = {
            ...formData,
            expira_en: new Date(formData.expira_en + 'T00:00:00Z').toISOString(),
            valor: Number(formData.valor) || 0,
        };

        if (coupon) {
            onSave({ ...dataToSave, id: coupon.id, restaurant_id: coupon.restaurant_id });
        } else {
            onSave(dataToSave);
        }
    };

    const inputClasses = "mt-1 block w-full px-3 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500";

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
                <form onSubmit={handleSubmit}>
                    <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
                        <h3 className="font-semibold text-lg">{coupon ? 'Editar Cupón' : 'Crear Cupón'}</h3>
                        <button type="button" onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"><X className="h-4 w-4" /></button>
                    </div>
                    <div className="p-6 space-y-4">
                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <label htmlFor="codigo" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Código</label>
                                <button 
                                    type="button" 
                                    onClick={handleSuggest} 
                                    disabled={isGenerating}
                                    className="flex items-center text-xs font-semibold text-purple-600 dark:text-purple-400 hover:text-purple-800 disabled:opacity-50"
                                >
                                    {isGenerating ? <Loader2 className="h-3 w-3 mr-1 animate-spin"/> : <Sparkles className="h-3 w-3 mr-1" />}
                                    {isGenerating ? 'Generando...' : 'Sugerir Promo'}
                                </button>
                            </div>
                            <input type="text" name="codigo" id="codigo" value={formData.codigo} onChange={handleChange} required className={inputClasses} placeholder="ej. VERANO20" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="tipo" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tipo</label>
                                <select name="tipo" id="tipo" value={formData.tipo} onChange={handleChange} className={inputClasses}>
                                    <option value="PORCENTAJE">Porcentaje</option>
                                    <option value="FIJO">Fijo</option>
                                </select>
                            </div>
                            <div>
                                <label htmlFor="valor" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Valor</label>
                                <input type="number" name="valor" id="valor" value={formData.valor} onChange={handleChange} required min="0" step="0.01" className={inputClasses} />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="minimo_subtotal" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Subtotal Mínimo</label>
                                <input type="number" name="minimo_subtotal" id="minimo_subtotal" value={formData.minimo_subtotal || ''} onChange={handleChange} min="0" step="0.01" className={inputClasses} placeholder="Opcional" />
                            </div>
                            <div>
                                <label htmlFor="expira_en" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Fecha de Expiración</label>
                                <input type="date" name="expira_en" id="expira_en" value={formData.expira_en} onChange={handleChange} required className={inputClasses} />
                            </div>
                        </div>
                        <div className="flex items-center justify-between">
                             <label htmlFor="activo" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Activo</label>
                             <ToggleSwitch checked={formData.activo} onChange={handleToggle} />
                        </div>
                    </div>
                    <div className="px-6 py-3 bg-gray-50 dark:bg-gray-700/50 text-right">
                        <button type="submit" className="px-4 py-2 text-sm font-semibold text-white bg-orange-500 rounded-lg hover:bg-orange-600">
                            Guardar Cambios
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};


export const CouponsPage: React.FC = () => {
    const { coupons, user, createCoupon, updateCoupon, deleteCoupon } = useAppContext();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
    const [deletingCoupon, setDeletingCoupon] = useState<Coupon | null>(null);

    const canEdit = user && [UserRole.ADMIN, UserRole.GERENTE].includes(user.rol);

    const handleCreateClick = () => {
        setEditingCoupon(null);
        setIsModalOpen(true);
    };

    const handleEditClick = (coupon: Coupon) => {
        setEditingCoupon(coupon);
        setIsModalOpen(true);
    };
    
    const handleDeleteClick = (coupon: Coupon) => {
        setDeletingCoupon(coupon);
    };
    
    const handleConfirmDelete = () => {
        if (deletingCoupon) {
            deleteCoupon(deletingCoupon.id);
            setDeletingCoupon(null);
        }
    };

    const handleSave = async (couponData: Omit<Coupon, 'id' | 'restaurant_id'> | Coupon) => {
        if ('id' in couponData) {
            await updateCoupon(couponData);
        } else {
            await createCoupon(couponData);
        }
        setIsModalOpen(false);
        setEditingCoupon(null);
    };
    
    const handleToggleActive = (coupon: Coupon, activo: boolean) => {
        updateCoupon({ ...coupon, activo });
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Cupones y Promociones</h1>
                {canEdit && (
                    <button onClick={handleCreateClick} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-orange-500 rounded-lg hover:bg-orange-600">
                        <PlusCircle className="h-4 w-4" />
                        Crear Cupón
                    </button>
                )}
            </div>
            <Card>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700/50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Código</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Tipo</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Valor</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Estado</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Expira</th>
                                {canEdit && <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Acciones</th>}
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {coupons.map(coupon => (
                                <tr key={coupon.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono font-medium text-orange-600 dark:text-orange-400">{coupon.codigo}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{coupon.tipo}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white font-semibold">
                                        {coupon.tipo === 'FIJO' ? formatCurrency(coupon.valor) : `${coupon.valor}%`}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <ToggleSwitch
                                            checked={coupon.activo}
                                            onChange={(checked) => handleToggleActive(coupon, checked)}
                                            disabled={!canEdit}
                                        />
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{formatDate(coupon.expira_en)}</td>
                                    {canEdit && (
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-4">
                                            <button onClick={() => handleEditClick(coupon)} className="text-orange-600 hover:text-orange-900">Editar</button>
                                            <button onClick={() => handleDeleteClick(coupon)} className="text-red-600 hover:text-red-900">Eliminar</button>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                 {coupons.length === 0 && <div className="text-center py-12 text-gray-500">No hay cupones. Haz clic en <strong>Crear Cupón</strong> para empezar.</div>}
            </Card>

            {isModalOpen && <CouponModal coupon={editingCoupon} onClose={() => setIsModalOpen(false)} onSave={handleSave} />}
            {deletingCoupon && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
                        <div className="p-6 text-center">
                            <Trash2 className="h-12 w-12 text-red-500 mx-auto mb-4" />
                            <h3 className="font-semibold text-lg mb-2">Eliminar Cupón</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                                ¿Estás seguro de que quieres eliminar el cupón "<strong>{deletingCoupon.codigo}</strong>"? Esta acción es irreversible.
                            </p>
                            <div className="flex gap-4">
                                <button onClick={() => setDeletingCoupon(null)} className="w-full py-2 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                                    Cancelar
                                </button>
                                <button onClick={handleConfirmDelete} className="w-full py-2 bg-red-500 text-white rounded-lg hover:bg-red-600">
                                    Sí, eliminar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
