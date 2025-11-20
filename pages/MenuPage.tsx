
import React, { useState, useEffect, useMemo } from 'react';
import { Card } from '../components/ui/Card';
import { useAppContext } from '../contexts/AppContext';
import { formatCurrency } from '../utils';
import { PlusCircle, Upload, X, Edit, Trash2, ListOrdered, ArrowUp, ArrowDown, RotateCcw, Sparkles, Loader2 } from 'lucide-react';
import { UserRole, MenuItem, MenuCategory, Ingredient, RecipeItem, IngredientCategory } from '../types';
import { generateMenuDescription } from '../services/ai';

const ToggleSwitch: React.FC<{ checked: boolean; onChange: (checked: boolean) => void; disabled?: boolean }> = ({ checked, onChange, disabled = false }) => {
    return (
        <label className={`relative inline-flex items-center ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
            <input type="checkbox" checked={checked} onChange={(e) => !disabled && onChange(e.target.checked)} className="sr-only peer" disabled={disabled} />
            <div className={`w-11 h-6 bg-gray-200 dark:bg-gray-700 rounded-full peer peer-focus:ring-2 peer-focus:ring-orange-300 dark:peer-focus:ring-orange-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-orange-500 ${disabled ? 'opacity-50' : ''}`}></div>
        </label>
    );
};

const MenuItemModal: React.FC<{
    item: MenuItem | null;
    categories: MenuCategory[];
    onClose: () => void;
    onSave: (itemData: Omit<MenuItem, 'id' | 'restaurant_id' | 'coste' | 'stock_actual'> | MenuItem) => void;
}> = ({ item, categories, onClose, onSave }) => {
    const { ingredients, processedMenuItems, showToast } = useAppContext();
    const [isGenerating, setIsGenerating] = useState(false);
    const [formData, setFormData] = useState({
        nombre: '',
        descripcion: '',
        category_id: categories[0]?.id || '',
        precio_base: 0,
        receta: [] as RecipeItem[],
        img_url: '',
        etiquetas: [] as string[],
        disponible: true,
        tiempo_preparacion_min: 10,
        permite_venta_sin_stock: false,
    });

    const drinksCategoryId = useMemo(() => {
        return categories.find(c => c.nombre.toLowerCase() === 'bebidas')?.id;
    }, [categories]);

    useEffect(() => {
        if (item) {
            setFormData({
                nombre: item.nombre,
                descripcion: item.descripcion,
                category_id: item.category_id,
                precio_base: item.precio_base,
                receta: item.receta || [],
                img_url: item.img_url,
                etiquetas: item.etiquetas,
                disponible: item.disponible,
                tiempo_preparacion_min: item.tiempo_preparacion_min,
                permite_venta_sin_stock: item.permite_venta_sin_stock,
            });
        }
    }, [item]);

    // Effect to clean up recipe if category changes and ingredients become invalid
    useEffect(() => {
        const isDrinkCategory = formData.category_id === drinksCategoryId;
        const ingredientsMap = new Map<string, Ingredient>(ingredients.map(i => [i.id, i]));

        const validRecipe = formData.receta.filter(recipeItem => {
            const ingredient = ingredientsMap.get(recipeItem.ingredient_id);
            if (!ingredient) return false;
            
            const requiredCategory = isDrinkCategory ? IngredientCategory.BEBIDA : IngredientCategory.GENERAL;
            return ingredient.categoria === requiredCategory;
        });

        if (validRecipe.length !== formData.receta.length) {
            setFormData(prev => ({ ...prev, receta: validRecipe }));
        }
    }, [formData.category_id, formData.receta, drinksCategoryId, ingredients]);

    const availableIngredients = useMemo(() => {
        const isDrinkCategory = formData.category_id === drinksCategoryId;
        if (isDrinkCategory) {
            return ingredients.filter(ing => ing.categoria === IngredientCategory.BEBIDA);
        }
        return ingredients.filter(ing => ing.categoria === IngredientCategory.GENERAL);
    }, [formData.category_id, ingredients, drinksCategoryId]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        
        if (type === 'checkbox') {
            const checked = (e.target as HTMLInputElement).checked;
            setFormData(prev => ({ ...prev, [name]: checked }));
        } else {
            if (name === 'precio_base' || name === 'tiempo_preparacion_min') {
                const numValue = value === '' ? null : Number(value);
                const finalValue = numValue !== null ? Math.max(0, numValue) : null;
                setFormData(prev => ({ ...prev, [name]: finalValue }));
            } else {
                setFormData(prev => ({ ...prev, [name]: value }));
            }
        }
    };
    
    const handleRecipeChange = (index: number, field: keyof RecipeItem, value: string) => {
        const newReceta = [...formData.receta];
        const numValue = parseFloat(value);
        newReceta[index] = {
            ...newReceta[index],
            [field]: field === 'cantidad' ? (isNaN(numValue) ? 0 : numValue) : value,
        };
        setFormData(prev => ({ ...prev, receta: newReceta }));
    };

    const addRecipeItem = () => {
        if (availableIngredients.length > 0) {
            setFormData(prev => ({
                ...prev,
                receta: [...prev.receta, { ingredient_id: availableIngredients[0].id, cantidad: 0 }],
            }));
        }
    };

    const removeRecipeItem = (index: number) => {
        setFormData(prev => ({
            ...prev,
            receta: prev.receta.filter((_, i) => i !== index),
        }));
    };

    const calculatedCost = useMemo(() => {
        const ingredientsMap = new Map<string, Ingredient>(ingredients.map(i => [i.id, i]));
        return formData.receta.reduce((total, recipeItem) => {
            const ingredient = ingredientsMap.get(recipeItem.ingredient_id);
            return total + (ingredient ? ingredient.coste_unitario * recipeItem.cantidad : 0);
        }, 0);
    }, [formData.receta, ingredients]);

    const margin = formData.precio_base > 0 ? ((formData.precio_base - calculatedCost) / formData.precio_base) * 100 : 0;

    const handleTagsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({
            ...prev,
            etiquetas: e.target.value.split(',').map(tag => tag.trim()).filter(Boolean)
        }));
    };
    
    const handleGenerateDescription = async () => {
        if (!formData.nombre) {
            showToast("Ingresa un nombre para el producto.", "error");
            return;
        }
        if (formData.receta.length === 0) {
            showToast("Añade ingredientes primero para generar una descripción más precisa.", "error");
            // We continue anyway, just with the name
        }
        
        setIsGenerating(true);
        const ingredientNames = formData.receta
            .map(r => ingredients.find(i => i.id === r.ingredient_id)?.nombre || '')
            .filter(Boolean);
            
        const desc = await generateMenuDescription(formData.nombre, ingredientNames);
        if (desc) {
            setFormData(prev => ({ ...prev, descripcion: desc }));
            showToast("¡Descripción generada con IA!", "success");
        } else {
            showToast("No se pudo generar la descripción. Intenta de nuevo.", "error");
        }
        setIsGenerating(false);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        const normalizedName = formData.nombre.trim().toLowerCase();
        if (!normalizedName) {
            showToast('El nombre del producto no puede estar vacío.', 'error');
            return;
        }

        const isDuplicate = processedMenuItems.some(
            menuItem => menuItem.nombre.trim().toLowerCase() === normalizedName && menuItem.id !== item?.id
        );

        if (isDuplicate) {
            showToast('Ya existe un producto con este nombre.', 'error');
            return;
        }

        const { ...dataToSave } = formData;
        if (item) {
            onSave({ ...item, ...dataToSave });
        } else {
            onSave(dataToSave);
        }
    };
    
    const inputClasses = "mt-1 block w-full px-3 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500";
    
    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                <form onSubmit={handleSubmit} className="flex flex-col h-full">
                    <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
                        <h3 className="font-semibold text-lg">{item ? 'Editar Producto' : 'Crear Producto'}</h3>
                        <button type="button" onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"><X className="h-4 w-4" /></button>
                    </div>
                    <div className="p-6 space-y-4 overflow-y-auto">
                        <div>
                            <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nombre del Producto</label>
                            <input type="text" name="nombre" value={formData.nombre} onChange={handleChange} required className={inputClasses} />
                        </div>
                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Descripción</label>
                                <button 
                                    type="button" 
                                    onClick={handleGenerateDescription} 
                                    disabled={isGenerating}
                                    className="flex items-center text-xs font-semibold text-purple-600 dark:text-purple-400 hover:text-purple-800 disabled:opacity-50"
                                >
                                    {isGenerating ? <Loader2 className="h-3 w-3 mr-1 animate-spin"/> : <Sparkles className="h-3 w-3 mr-1" />}
                                    {isGenerating ? 'Generando...' : 'Mejorar con IA'}
                                </button>
                            </div>
                            <textarea name="descripcion" value={formData.descripcion} onChange={handleChange} rows={3} className={inputClasses}></textarea>
                        </div>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="category_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Categoría</label>
                                <select name="category_id" value={formData.category_id} onChange={handleChange} className={inputClasses}>
                                    {categories.length === 0 && <option value="" disabled>Crea una categoría primero</option>}
                                    {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.nombre}</option>)}
                                </select>
                            </div>
                             <div>
                                <label htmlFor="precio_base" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Precio</label>
                                <input type="number" name="precio_base" value={formData.precio_base} onChange={handleChange} required min="0" step="0.01" className={inputClasses} />
                                <div className="flex justify-between text-xs mt-1 px-1">
                                    <span className="text-gray-500 dark:text-gray-400">Costo: {formatCurrency(calculatedCost)}</span>
                                    <span className={`font-medium ${margin < 0 ? 'text-red-500' : margin < 50 ? 'text-yellow-600 dark:text-yellow-400' : 'text-green-600 dark:text-green-400'}`}>
                                        Margen: {margin.toFixed(1)}%
                                    </span>
                                </div>
                            </div>
                        </div>
                        
                        <div className="pt-4 border-t dark:border-gray-700">
                             <div className="flex justify-between items-center mb-2">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Receta / Ingredientes</label>
                                <span className="text-sm font-bold">Costo Total: {formatCurrency(calculatedCost)}</span>
                            </div>
                            <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                                {formData.receta.map((recipeItem, index) => (
                                    <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700/50 rounded-md">
                                        <select
                                            value={recipeItem.ingredient_id}
                                            onChange={(e) => handleRecipeChange(index, 'ingredient_id', e.target.value)}
                                            className="w-1/2 px-2 py-1 text-sm bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-md"
                                        >
                                            {availableIngredients.map(ing => <option key={ing.id} value={ing.id}>{ing.nombre}</option>)}
                                        </select>
                                        <input
                                            type="number"
                                            value={recipeItem.cantidad}
                                            onChange={(e) => handleRecipeChange(index, 'cantidad', e.target.value)}
                                            min="0"
                                            step="0.01"
                                            className="w-1/4 px-2 py-1 text-sm bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-md"
                                        />
                                        <span className="w-1/4 text-sm text-gray-500 dark:text-gray-400">
                                            {ingredients.find(i => i.id === recipeItem.ingredient_id)?.unidad}
                                        </span>
                                        <button type="button" onClick={() => removeRecipeItem(index)} className="text-red-500 hover:text-red-700"><Trash2 className="h-4 w-4" /></button>
                                    </div>
                                ))}
                            </div>
                            <button type="button" onClick={addRecipeItem} disabled={availableIngredients.length === 0} className="mt-2 text-sm text-orange-600 hover:text-orange-800 disabled:text-gray-400 disabled:cursor-not-allowed">
                                + Añadir Ingrediente
                            </button>
                             {availableIngredients.length === 0 && (
                                <p className="text-xs text-red-500 mt-1">
                                    No hay ingredientes de tipo '{formData.category_id === drinksCategoryId ? 'BEBIDA' : 'GENERAL'}' disponibles.
                                </p>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <div>
                                <label htmlFor="tiempo_preparacion_min" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tiempo de Preparación (min)</label>
                                <input type="number" name="tiempo_preparacion_min" value={formData.tiempo_preparacion_min} onChange={handleChange} min="0" className={inputClasses} />
                            </div>
                        </div>
                        <div>
                            <label htmlFor="img_url" className="block text-sm font-medium text-gray-700 dark:text-gray-300">URL de la Imagen</label>
                            <input type="text" name="img_url" value={formData.img_url} onChange={handleChange} className={inputClasses} placeholder="https://ejemplo.com/imagen.jpg" />
                        </div>
                         <div>
                            <label htmlFor="etiquetas" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Etiquetas (separadas por coma)</label>
                            <input type="text" name="etiquetas" value={formData.etiquetas.join(', ')} onChange={handleTagsChange} className={inputClasses} placeholder="vegano, sin gluten, picante" />
                        </div>
                        <div className="flex items-center gap-4">
                                <label htmlFor="permite_venta_sin_stock" className="text-sm font-medium text-gray-700 dark:text-gray-300">¿Vender sin stock?</label>
                                <input type="checkbox" name="permite_venta_sin_stock" checked={formData.permite_venta_sin_stock} onChange={handleChange} className="h-4 w-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500" />
                        </div>
                        <div className="flex items-center justify-between pt-2">
                             <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Disponible para la venta</label>
                             <ToggleSwitch checked={formData.disponible} onChange={(checked) => setFormData(p => ({...p, disponible: checked}))} />
                        </div>
                    </div>
                    <div className="px-6 py-3 bg-gray-50 dark:bg-gray-700/50 text-right mt-auto">
                        <button type="submit" className="px-4 py-2 text-sm font-semibold text-white bg-orange-500 rounded-lg hover:bg-orange-600">
                            {item ? 'Guardar Cambios' : 'Crear Producto'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const ManageCategoriesModal: React.FC<{
    onClose: () => void;
}> = ({ onClose }) => {
    const { categories, allItemsForDisplay, updateCategories, createCategory, deleteCategory, showToast } = useAppContext();
    const [localCategories, setLocalCategories] = useState<MenuCategory[]>([]);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        setLocalCategories([...categories]);
    }, [categories]);

    const categoryUsageCount = useMemo(() => {
        return allItemsForDisplay.reduce((acc, item) => {
            acc[item.category_id] = (acc[item.category_id] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
    }, [allItemsForDisplay]);


    const handleMove = (index: number, direction: 'up' | 'down') => {
        const newCategories = [...localCategories];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= newCategories.length) return;

        [newCategories[index], newCategories[targetIndex]] = [newCategories[targetIndex], newCategories[index]];
        
        setLocalCategories(newCategories);
    };
    
    const handleAddCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedName = newCategoryName.trim();
        if (trimmedName) {
            const isDuplicate = categories.some(c => c.nombre.trim().toLowerCase() === trimmedName.toLowerCase());
            if (isDuplicate) {
                showToast('Ya existe una categoría con este nombre.', 'error');
                return;
            }
            await createCategory(trimmedName);
            setNewCategoryName('');
        }
    };

    const handleDeleteCategory = (categoryId: string) => {
        if (window.confirm("¿Seguro que quieres eliminar esta categoría? Solo se puede eliminar si no tiene productos asignados.")) {
            deleteCategory(categoryId);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        const orderChanged = JSON.stringify(localCategories.map(c => c.id)) !== JSON.stringify(categories.map(c => c.id));
        if (orderChanged) {
            await updateCategories(localCategories);
        }
        setIsSaving(false);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
                <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
                    <h3 className="font-semibold text-lg">Gestionar Categorías</h3>
                    <button type="button" onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"><X className="h-4 w-4" /></button>
                </div>
                <div className="p-6 max-h-[60vh] overflow-y-auto">
                     <form onSubmit={handleAddCategory} className="flex gap-2 mb-4">
                        <input
                            type="text"
                            value={newCategoryName}
                            onChange={(e) => setNewCategoryName(e.target.value)}
                            placeholder="Nombre de la nueva categoría"
                            className="flex-grow px-3 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                        />
                        <button type="submit" className="px-4 py-2 text-sm font-semibold text-white bg-orange-500 rounded-lg hover:bg-orange-600">Añadir</button>
                    </form>

                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Usa las flechas para cambiar el orden de las categorías en el menú.</p>
                    <ul className="space-y-2">
                        {localCategories.map((cat, index) => {
                            const isInUse = (categoryUsageCount[cat.id] || 0) > 0;
                            return (
                                <li key={cat.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                    <span className="font-medium">{cat.nombre}</span>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => handleDeleteCategory(cat.id)} disabled={isInUse} title={isInUse ? 'No se puede eliminar: categoría en uso' : 'Eliminar categoría'} className="p-1 disabled:opacity-30 disabled:cursor-not-allowed text-red-500 hover:text-red-700">
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                        <button onClick={() => handleMove(index, 'up')} disabled={index === 0} className="p-1 disabled:opacity-30 disabled:cursor-not-allowed">
                                            <ArrowUp className="h-4 w-4" />
                                        </button>
                                        <button onClick={() => handleMove(index, 'down')} disabled={index === localCategories.length - 1} className="p-1 disabled:opacity-30 disabled:cursor-not-allowed">
                                            <ArrowDown className="h-4 w-4" />
                                        </button>
                                    </div>
                                </li>
                            )
                        })}
                    </ul>
                     {localCategories.length === 0 && <p className="text-center text-gray-500 py-4">No hay categorías. ¡Añade una para empezar!</p>}
                </div>
                <div className="px-6 py-3 bg-gray-50 dark:bg-gray-700/50 text-right">
                    <button onClick={handleSave} disabled={isSaving} className="px-4 py-2 text-sm font-semibold text-white bg-orange-500 rounded-lg hover:bg-orange-600 disabled:opacity-50">
                        {isSaving ? 'Guardando...' : 'Guardar y Cerrar'}
                    </button>
                </div>
            </div>
        </div>
    );
};

const DeleteConfirmModal: React.FC<{
    item: MenuItem;
    onClose: () => void;
    onConfirm: () => void;
}> = ({ item, onClose, onConfirm }) => {
    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
                <div className="p-6 text-center">
                    <Trash2 className="h-12 w-12 text-red-500 mx-auto mb-4" />
                    <h3 className="font-semibold text-lg mb-2">Eliminar Producto</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                        ¿Seguro que quieres eliminar "<strong>{item.nombre}</strong>"? No se podrá añadir a nuevos pedidos, pero se mantendrá en los reportes de ventas antiguos.
                    </p>
                    <div className="flex gap-4">
                        <button onClick={onClose} className="w-full py-2 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                            Cancelar
                        </button>
                        <button onClick={onConfirm} className="w-full py-2 bg-red-500 text-white rounded-lg hover:bg-red-600">
                            Sí, eliminar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};


export const MenuPage: React.FC = () => {
    const { allItemsForDisplay, categories, user, updateMenuItem, createMenuItem, deleteMenuItem, restoreMenuItem } = useAppContext();
    const [activeCategory, setActiveCategory] = useState(categories[0]?.id || 'all');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
    const [isManageCategoriesModalOpen, setIsManageCategoriesModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<MenuItem | null>(null);
    
    const canEdit = user && [UserRole.ADMIN, UserRole.GERENTE].includes(user.rol);
    
    useEffect(() => {
        if (!categories.find(c => c.id === activeCategory) && activeCategory !== 'all' && categories.length > 0) {
            setActiveCategory(categories[0].id);
        } else if (categories.length === 0) {
            setActiveCategory('all');
        }
    }, [categories, activeCategory]);


    const filteredItems = activeCategory === 'all' 
        ? allItemsForDisplay
        : allItemsForDisplay.filter(item => item.category_id === activeCategory);

    const handleAvailabilityToggle = (item: MenuItem, disponible: boolean) => {
        updateMenuItem({ ...item, disponible });
    };
    
    const handleCreate = () => {
        setEditingItem(null);
        setIsModalOpen(true);
    };

    const handleEdit = (item: MenuItem) => {
        setEditingItem(item);
        setIsModalOpen(true);
    };

    const handleDelete = (item: MenuItem) => {
        setItemToDelete(item);
    };

    const handleConfirmDelete = () => {
        if (itemToDelete) {
            deleteMenuItem(itemToDelete.id);
            setItemToDelete(null);
        }
    };

    const handleRestore = (item: MenuItem) => {
        restoreMenuItem(item.id);
    };
    
    const handleSave = async (itemData: Omit<MenuItem, 'id' | 'restaurant_id' | 'coste' | 'stock_actual'> | MenuItem) => {
        if ('id' in itemData) {
            await updateMenuItem(itemData);
        } else {
            await createMenuItem(itemData);
        }
        setIsModalOpen(false);
        setEditingItem(null);
    };


    return (
        <div className="space-y-6">
            <div className="flex flex-wrap justify-between items-center gap-4">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Gestión de Menú</h1>
                {canEdit && (
                    <div className="flex items-center gap-2">
                         <button onClick={() => setIsManageCategoriesModalOpen(true)} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600">
                            <ListOrdered className="h-4 w-4" />
                            Gestionar Categorías
                        </button>
                        <button className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600">
                            <Upload className="h-4 w-4" />
                            Importar CSV
                        </button>
                        <button onClick={handleCreate} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-orange-500 rounded-lg hover:bg-orange-600">
                            <PlusCircle className="h-4 w-4" />
                            Nuevo Producto
                        </button>
                    </div>
                )}
            </div>

            <Card>
                <div className="border-b border-gray-200 dark:border-gray-700">
                    <nav className="-mb-px flex space-x-6 overflow-x-auto">
                        <button
                            onClick={() => setActiveCategory('all')}
                            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeCategory === 'all' ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                        >
                            Todos
                        </button>
                        {categories.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => setActiveCategory(cat.id)}
                                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeCategory === cat.id ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                            >
                                {cat.nombre}
                            </button>
                        ))}
                    </nav>
                </div>

                <div className="overflow-x-auto mt-4">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700/50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Producto</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Precio</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Coste</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Stock</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Disponible</th>
                                {canEdit && <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Acciones</th>}
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {filteredItems.map((item) => (
                                <tr key={item.id} className={`${!item.disponible ? 'opacity-50' : ''} ${item.is_deleted ? 'bg-gray-100 dark:bg-gray-800/60 opacity-40 italic' : ''}`}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0 h-10 w-10">
                                                <img className="h-10 w-10 rounded-md object-cover" src={item.img_url || 'https://picsum.photos/seed/placeholder/40'} alt={item.nombre} />
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-medium text-gray-900 dark:text-white">{item.nombre}</div>
                                                <div className="text-sm text-gray-500 dark:text-gray-400">{categories.find(c => c.id === item.category_id)?.nombre}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{formatCurrency(item.precio_base)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{formatCurrency(item.coste)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-800 dark:text-gray-200">{item.stock_actual ?? 'Ilimitado'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <ToggleSwitch checked={item.disponible} onChange={(checked) => handleAvailabilityToggle(item, checked)} disabled={!canEdit || item.is_deleted} />
                                    </td>
                                    {canEdit && (
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex items-center justify-end gap-3">
                                                <button onClick={() => handleEdit(item)} className="text-orange-500 hover:text-orange-700 disabled:text-gray-400" disabled={item.is_deleted}><Edit className="h-4 w-4" /></button>
                                                {item.is_deleted ? (
                                                    <button onClick={() => handleRestore(item)} className="text-green-500 hover:text-green-700" title="Restaurar"><RotateCcw className="h-4 w-4" /></button>
                                                ) : (
                                                    <button onClick={() => handleDelete(item)} className="text-red-500 hover:text-red-700"><Trash2 className="h-4 w-4" /></button>
                                                )}
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {filteredItems.length === 0 && <div className="text-center py-12 text-gray-500">No hay ítems. Usa <strong>Nuevo producto</strong> para añadir platos.</div>}
            </Card>
            {isManageCategoriesModalOpen && <ManageCategoriesModal onClose={() => setIsManageCategoriesModalOpen(false)} />}
            {isModalOpen && <MenuItemModal item={editingItem} categories={categories} onClose={() => setIsModalOpen(false)} onSave={handleSave} />}
            {itemToDelete && (
                <DeleteConfirmModal 
                    item={itemToDelete} 
                    onClose={() => setItemToDelete(null)}
                    onConfirm={handleConfirmDelete}
                />
            )}
        </div>
    );
};
