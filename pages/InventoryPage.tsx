
import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { useAppContext } from '../contexts/AppContext';
import { Ingredient, UserRole, IngredientCategory } from '../types';
import { PlusCircle, X, Edit, Trash2, AlertTriangle } from 'lucide-react';
import { formatCurrency } from '../utils';

const IngredientModal: React.FC<{
    ingredient: Ingredient | null;
    onClose: () => void;
    onSave: (data: Omit<Ingredient, 'id' | 'restaurant_id'> | Ingredient) => void;
}> = ({ ingredient, onClose, onSave }) => {
    const { ingredients, showToast } = useAppContext();
    const [formData, setFormData] = useState({
        nombre: ingredient?.nombre || '',
        unidad: ingredient?.unidad || 'unidad',
        stock_actual: ingredient?.stock_actual || 0,
        stock_minimo: ingredient?.stock_minimo || 0,
        coste_unitario: ingredient?.coste_unitario || 0,
        categoria: ingredient?.categoria || IngredientCategory.GENERAL,
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'number' ? parseFloat(value) || 0 : value
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const normalizedName = formData.nombre.trim().toLowerCase();
        if (!normalizedName) {
            showToast('El nombre del ingrediente no puede estar vacío.', 'error');
            return;
        }

        const isDuplicate = ingredients.some(
            ing => ing.nombre.trim().toLowerCase() === normalizedName && ing.id !== ingredient?.id
        );

        if (isDuplicate) {
            showToast('Ya existe un ingrediente con este nombre.', 'error');
            return;
        }

        if (ingredient) {
            onSave({ ...ingredient, ...formData });
        } else {
            onSave(formData);
        }
    };

    const inputClasses = "mt-1 block w-full px-3 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500";

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
                <form onSubmit={handleSubmit}>
                    <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
                        <h3 className="font-semibold text-lg">{ingredient ? 'Editar Ingrediente' : 'Crear Ingrediente'}</h3>
                        <button type="button" onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"><X className="h-4 w-4" /></button>
                    </div>
                    <div className="p-6 space-y-4">
                        <div>
                            <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nombre del Ingrediente</label>
                            <input type="text" name="nombre" value={formData.nombre} onChange={handleChange} required className={inputClasses} />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <div>
                                <label htmlFor="categoria" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Categoría</label>
                                <select name="categoria" value={formData.categoria} onChange={handleChange} className={inputClasses}>
                                    {Object.values(IngredientCategory).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="unidad" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Unidad de Medida</label>
                                <select name="unidad" value={formData.unidad} onChange={handleChange} className={inputClasses}>
                                    <option value="unidad">Unidad</option>
                                    <option value="gr">Gramos (gr)</option>
                                    <option value="ml">Mililitros (ml)</option>
                                </select>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="stock_actual" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Stock Actual</label>
                                <input type="number" name="stock_actual" value={formData.stock_actual} onChange={handleChange} required min="0" step="any" className={inputClasses} />
                            </div>
                            <div>
                                <label htmlFor="stock_minimo" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Stock Mínimo (Alerta)</label>
                                <input type="number" name="stock_minimo" value={formData.stock_minimo} onChange={handleChange} required min="0" step="any" className={inputClasses} />
                            </div>
                        </div>
                        <div>
                            <label htmlFor="coste_unitario" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Costo por Unidad</label>
                            <input type="number" name="coste_unitario" value={formData.coste_unitario} onChange={handleChange} required min="0" step="0.01" className={inputClasses} />
                        </div>
                    </div>
                    <div className="px-6 py-3 bg-gray-50 dark:bg-gray-700/50 text-right">
                        <button type="submit" className="px-4 py-2 text-sm font-semibold text-white bg-orange-500 rounded-lg hover:bg-orange-600">
                            {ingredient ? 'Guardar Cambios' : 'Crear Ingrediente'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const DeleteConfirmModal: React.FC<{
    ingredient: Ingredient;
    onClose: () => void;
    onConfirm: () => void;
}> = ({ ingredient, onClose, onConfirm }) => {
    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
                <div className="p-6 text-center">
                    <Trash2 className="h-12 w-12 text-red-500 mx-auto mb-4" />
                    <h3 className="font-semibold text-lg mb-2">Eliminar Ingrediente</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                        ¿Seguro que quieres eliminar "<strong>{ingredient.nombre}</strong>"? Esta acción lo quitará de todas las recetas y es irreversible.
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


const Pagination: React.FC<{
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    itemsPerPage: number;
    totalItems: number;
}> = ({ currentPage, totalPages, onPageChange, itemsPerPage, totalItems }) => {
    if (totalPages <= 1) return null;

    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);

    return (
        <div className="flex items-center justify-between mt-4 px-4 py-2 border-t dark:border-gray-700">
            <p className="text-sm text-gray-700 dark:text-gray-300">
                Mostrando <span className="font-medium">{startItem}</span> a <span className="font-medium">{endItem}</span> de <span className="font-medium">{totalItems}</span> resultados
            </p>
            <nav className="flex items-center space-x-2">
                <button
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-1 text-sm font-medium border rounded-md disabled:opacity-50 disabled:cursor-not-allowed bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                >
                    Anterior
                </button>
                <span className="text-sm px-2">
                    Página {currentPage} de {totalPages}
                </span>
                <button
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 text-sm font-medium border rounded-md disabled:opacity-50 disabled:cursor-not-allowed bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                >
                    Siguiente
                </button>
            </nav>
        </div>
    );
};


export const InventoryPage: React.FC = () => {
    const { ingredients, user, createIngredient, updateIngredient, deleteIngredient } = useAppContext();
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [deletingIngredient, setDeletingIngredient] = useState<Ingredient | null>(null);

    const ITEMS_PER_PAGE = 15;

    const canEdit = user && [UserRole.ADMIN, UserRole.GERENTE].includes(user.rol);
    
    const filteredIngredients = ingredients.filter(i => i.nombre.toLowerCase().includes(searchTerm.toLowerCase()));

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    const totalPages = Math.ceil(filteredIngredients.length / ITEMS_PER_PAGE);
    const paginatedIngredients = filteredIngredients.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);


    const handleCreate = () => {
        setEditingIngredient(null);
        setIsModalOpen(true);
    };

    const handleEdit = (ingredient: Ingredient) => {
        setEditingIngredient(ingredient);
        setIsModalOpen(true);
    };

    const handleConfirmDelete = () => {
        if (deletingIngredient) {
            deleteIngredient(deletingIngredient.id);
            setDeletingIngredient(null);
        }
    };
    
    const handleSave = async (data: Omit<Ingredient, 'id' | 'restaurant_id'> | Ingredient) => {
        if ('id' in data) {
            await updateIngredient(data);
        } else {
            await createIngredient(data);
        }
        setIsModalOpen(false);
        setEditingIngredient(null);
    };
    
    return (
        <div className="space-y-6">
            <div className="flex flex-wrap justify-between items-center gap-4">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Inventario</h1>
                {canEdit && (
                     <button onClick={handleCreate} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-orange-500 rounded-lg hover:bg-orange-600">
                         <PlusCircle className="h-4 w-4" />
                         Nuevo Ingrediente
                     </button>
                 )}
            </div>
            
            <Card>
                <div className="mb-4">
                    <input
                        type="text"
                        placeholder="Buscar ingrediente..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full md:w-1/3 px-4 py-2 text-sm text-gray-700 bg-gray-100 dark:bg-gray-700 dark:text-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700/50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Ingrediente</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Categoría</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Stock Actual</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Stock Mínimo</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Unidad</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Costo Unitario</th>
                                {canEdit && <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Acciones</th>}
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                           {paginatedIngredients.map(ing => {
                               const isLowStock = ing.stock_actual <= ing.stock_minimo;
                               return (
                                   <tr key={ing.id} className={isLowStock ? 'bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500' : 'border-l-4 border-transparent'}>
                                       <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{ing.nombre}</td>
                                       <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{ing.categoria}</td>
                                       <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <div className="flex items-center gap-2">
                                                <span className={`font-bold ${isLowStock ? 'text-red-600 dark:text-red-400' : 'text-gray-800 dark:text-gray-200'}`}>
                                                    {ing.stock_actual}
                                                </span>
                                                {isLowStock && <AlertTriangle className="h-4 w-4 text-red-500" title="Stock Bajo" />}
                                            </div>
                                       </td>
                                       <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{ing.stock_minimo}</td>
                                       <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{ing.unidad}</td>
                                       <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{formatCurrency(ing.coste_unitario)}</td>
                                       {canEdit && (
                                           <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                               <div className="flex items-center justify-end gap-3">
                                                   <button onClick={() => handleEdit(ing)} className="text-orange-500 hover:text-orange-700"><Edit className="h-4 w-4" /></button>
                                                   <button onClick={() => setDeletingIngredient(ing)} className="text-red-500 hover:text-red-700"><Trash2 className="h-4 w-4" /></button>
                                               </div>
                                           </td>
                                       )}
                                   </tr>
                               );
                           })}
                        </tbody>
                    </table>
                </div>
                 {filteredIngredients.length === 0 && <div className="text-center py-12 text-gray-500">No se encontraron ingredientes.</div>}
                 <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                    itemsPerPage={ITEMS_PER_PAGE}
                    totalItems={filteredIngredients.length}
                />
            </Card>
            {isModalOpen && <IngredientModal ingredient={editingIngredient} onClose={() => setIsModalOpen(false)} onSave={handleSave} />}
            {deletingIngredient && (
                <DeleteConfirmModal
                    ingredient={deletingIngredient}
                    onClose={() => setDeletingIngredient(null)}
                    onConfirm={handleConfirmDelete}
                />
            )}
        </div>
    );
};
