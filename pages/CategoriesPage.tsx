
import React, { useState, useMemo } from 'react';
import { Card } from '../components/ui/Card';
import { useAppContext } from '../contexts/AppContext';
import { PlusCircle, Trash2, X, ChevronDown, ChevronRight, Folder, Edit, Tag, Loader2 } from 'lucide-react';
import { MenuCategory, UserRole } from '../types';

// Helper to sort categories flat list into a tree
const buildCategoryTree = (categories: MenuCategory[]) => {
    const rootCategories = categories.filter(c => !c.parent_id).sort((a, b) => a.orden - b.orden);
    
    const getChildren = (parentId: string): any[] => {
        return categories
            .filter(c => c.parent_id === parentId)
            .sort((a, b) => a.orden - b.orden)
            .map(c => ({ ...c, children: getChildren(c.id) }));
    };

    return rootCategories.map(c => ({ ...c, children: getChildren(c.id) }));
};

// Helper to get all descendant IDs for validation
const getDescendantIds = (categoryId: string, allCategories: MenuCategory[]): string[] => {
    const children = allCategories.filter(c => c.parent_id === categoryId);
    let ids = [categoryId];
    for (const child of children) {
        ids = [...ids, ...getDescendantIds(child.id, allCategories)];
    }
    return ids;
};

const CreateEditCategoryModal: React.FC<{
    categoryToEdit: MenuCategory | null;
    parentId: string | null;
    parentName?: string;
    onClose: () => void;
}> = ({ categoryToEdit, parentId, parentName, onClose }) => {
    const { createCategory, updateCategories, categories, showToast } = useAppContext();
    const [name, setName] = useState(categoryToEdit?.nombre || '');
    const [isSaving, setIsSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedName = name.trim();
        if (!trimmedName) return;

        // Duplicate check (global within user's scope)
        const isDuplicate = categories.some(c => 
            c.nombre.trim().toLowerCase() === trimmedName.toLowerCase() && c.id !== categoryToEdit?.id
        );
        if (isDuplicate) {
            showToast('Ya existe una categoría con este nombre.', 'error');
            return;
        }

        setIsSaving(true);
        try {
            let success = false;
            if (categoryToEdit) {
                // Update existing
                success = await updateCategories([{ ...categoryToEdit, nombre: trimmedName }]);
            } else {
                // Create new
                const newCat = await createCategory(trimmedName, parentId);
                if (newCat) success = true;
            }
            
            // Solo cerrar si fue exitoso
            if (success) {
                onClose();
            }
        } catch (error) {
            // Error handled by AppContext (toast)
            // Modal remains open so user can retry
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={(e) => e.stopPropagation()}>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
                <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
                    <h3 className="font-semibold text-lg">
                        {categoryToEdit ? 'Editar Categoría' : (parentId ? 'Nueva Subcategoría' : 'Nueva Categoría Raíz')}
                    </h3>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"><X className="h-4 w-4" /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6">
                    {parentName && (
                        <div className="mb-4 text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                            <Folder className="h-4 w-4" /> Dentro de: <span className="font-semibold">{parentName}</span>
                        </div>
                    )}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                            placeholder="Ej: Bebidas, Postres..."
                            autoFocus
                        />
                    </div>
                    <div className="flex justify-end gap-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700">
                            Cancelar
                        </button>
                        <button type="submit" disabled={!name.trim() || isSaving} className="px-4 py-2 text-sm font-semibold text-white bg-orange-500 rounded-lg hover:bg-orange-600 disabled:opacity-50 flex items-center gap-2">
                            {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                            {isSaving ? 'Guardando...' : 'Guardar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export const CategoriesPage: React.FC = () => {
    const { categories, processedMenuItems, deleteCategory, showToast, user } = useAppContext();
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
    const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
    const [modalState, setModalState] = useState<{
        isOpen: boolean;
        type: 'create' | 'edit';
        category?: MenuCategory;
        parentId: string | null;
        parentName?: string;
    }>({ isOpen: false, type: 'create', parentId: null });

    const canEdit = user && [UserRole.ADMIN, UserRole.GERENTE].includes(user.rol);

    const categoryTree = useMemo(() => buildCategoryTree(categories), [categories]);

    const toggleExpand = (categoryId: string) => {
        const newExpanded = new Set(expandedCategories);
        if (newExpanded.has(categoryId)) {
            newExpanded.delete(categoryId);
        } else {
            newExpanded.add(categoryId);
        }
        setExpandedCategories(newExpanded);
    };

    const handleAddRoot = () => {
        setModalState({ isOpen: true, type: 'create', parentId: null });
    };

    const handleAddSub = (category: MenuCategory) => {
        setModalState({ isOpen: true, type: 'create', parentId: category.id, parentName: category.nombre });
        setExpandedCategories(prev => new Set(prev).add(category.id));
    };

    const handleEdit = (category: MenuCategory) => {
        setModalState({ isOpen: true, type: 'edit', category, parentId: category.parent_id || null });
    };

    const handleDelete = async (e: React.MouseEvent, category: MenuCategory) => {
        e.stopPropagation(); // Prevenir que se expanda/colapse al borrar
        
        const hierarchyIds = getDescendantIds(category.id, categories);
        const hasProducts = processedMenuItems.some(item => hierarchyIds.includes(item.category_id));
        
        if (hasProducts) {
            showToast("No se puede eliminar: Hay productos activos asignados a esta categoría o sus subcategorías.", "error");
            return;
        }

        const hasChildren = categories.some(c => c.parent_id === category.id);
        const message = hasChildren
            ? `Esta categoría "${category.nombre}" contiene subcategorías. Si la eliminas, se borrarán todas las subcategorías. ¿Continuar?`
            : `¿Seguro que quieres eliminar la categoría "${category.nombre}"?`;

        if (window.confirm(message)) {
            setDeletingIds(prev => new Set(prev).add(category.id));
            try {
                await deleteCategory(category.id);
            } catch (error) {
                console.error("Delete failed", error);
            } finally {
                setDeletingIds(prev => {
                    const next = new Set(prev);
                    next.delete(category.id);
                    return next;
                });
            }
        }
    };

    const renderTreeItem = (cat: MenuCategory & { children?: any[] }, depth: number) => {
        const hasChildren = cat.children && cat.children.length > 0;
        const isExpanded = expandedCategories.has(cat.id);
        const isDeleting = deletingIds.has(cat.id);

        return (
            <div key={cat.id} className={`select-none transition-opacity duration-300 ${isDeleting ? 'opacity-50 pointer-events-none' : ''}`}>
                <div 
                    className={`group flex items-center justify-between p-3 mb-1 rounded-lg transition-colors ${
                        depth === 0 ? 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700' : 
                        'bg-gray-50 dark:bg-gray-700/30 hover:bg-gray-100 dark:hover:bg-gray-700/50 border-l-2 border-l-transparent hover:border-l-orange-400'
                    }`}
                    style={{ marginLeft: `${depth * 1.5}rem` }}
                >
                    <div className="flex items-center gap-2 flex-1 cursor-pointer" onClick={() => hasChildren && toggleExpand(cat.id)}>
                        {hasChildren ? (
                            <button className="p-1 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-500">
                                {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                            </button>
                        ) : (
                            <div className="w-6" /> // Spacer
                        )}
                        <span className={`font-medium ${depth === 0 ? 'text-gray-900 dark:text-white text-base' : 'text-gray-700 dark:text-gray-300 text-sm'}`}>
                            {cat.nombre}
                        </span>
                        {!hasChildren && (
                            <span className="ml-2 text-xs text-gray-400 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">
                                {processedMenuItems.filter(i => i.category_id === cat.id).length} items
                            </span>
                        )}
                    </div>

                    {canEdit && (
                        <div className="flex items-center gap-1 sm:gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                            {depth < 2 && (
                                <button 
                                    onClick={(e) => { e.stopPropagation(); handleAddSub(cat); }} 
                                    className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded tooltip-trigger"
                                    title="Añadir Subcategoría"
                                >
                                    <PlusCircle className="h-4 w-4" />
                                </button>
                            )}
                            <button 
                                onClick={(e) => { e.stopPropagation(); handleEdit(cat); }} 
                                className="p-1.5 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/30 rounded"
                                title="Editar Nombre"
                            >
                                <Edit className="h-4 w-4" />
                            </button>
                            <button 
                                onClick={(e) => handleDelete(e, cat)} 
                                className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded"
                                title="Eliminar Categoría"
                                disabled={isDeleting}
                            >
                                {isDeleting ? <Loader2 className="h-4 w-4 animate-spin"/> : <Trash2 className="h-4 w-4" />}
                            </button>
                        </div>
                    )}
                </div>
                
                {hasChildren && isExpanded && (
                    <div className="animate-fade-in-down">
                        {cat.children?.map((child: any) => renderTreeItem(child, depth + 1))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Categorías</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Organiza la estructura de tu menú</p>
                </div>
                {canEdit && (
                    <button onClick={handleAddRoot} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-orange-500 rounded-lg hover:bg-orange-600 shadow-sm">
                        <PlusCircle className="h-4 w-4" />
                        Nueva Categoría Raíz
                    </button>
                )}
            </div>

            <div className="space-y-2">
                {categoryTree.length === 0 ? (
                    <Card className="text-center py-12 text-gray-500">
                        <Tag className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p>No hay categorías creadas.</p>
                        <p className="text-sm">Comienza añadiendo una categoría raíz.</p>
                    </Card>
                ) : (
                    categoryTree.map((cat: any) => renderTreeItem(cat, 0))
                )}
            </div>

            {modalState.isOpen && (
                <CreateEditCategoryModal 
                    categoryToEdit={modalState.type === 'edit' ? modalState.category || null : null}
                    parentId={modalState.parentId}
                    parentName={modalState.parentName}
                    onClose={() => setModalState({ ...modalState, isOpen: false })}
                />
            )}
        </div>
    );
};
