
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../contexts/AppContext';
import { Table, TableStatus, UserRole, OrderType, Sector, User, Order } from '../types';
import { Card } from '../components/ui/Card';
import { formatCurrency, formatTimeAgo } from '../utils';
import { Eye, Pencil, Save, PlusCircle, Repeat, X, ShoppingCart, User as UserIcon, Sparkles, Trash2, RotateCcw, LayoutGrid, MousePointer2, Link as LinkIcon, Unlink, Utensils, Receipt, DollarSign, Coffee } from 'lucide-react';
import { PaymentModal, OrderEditorModal } from '../components/orders/SharedModals';

interface DraggableTableProps {
    table: Table;
    isEditing: boolean;
    isSelectionMode: boolean;
    isSelected: boolean;
    isMarkedForDeletion: boolean;
    onTableClick: (table: Table) => void;
    onDrag: (id: number | string, x: number, y: number) => void;
    onShapeChange: (id: number | string) => void;
    onDelete: (id: number | string) => void;
    onUndoDelete: (id: number | string) => void;
    floorPlanRef: React.RefObject<HTMLDivElement>;
    isGrouped: boolean;
}

const DraggableTable: React.FC<DraggableTableProps> = ({ 
    table, 
    isEditing, 
    isSelectionMode,
    isSelected,
    isMarkedForDeletion,
    onTableClick, 
    onDrag, 
    onShapeChange, 
    onDelete,
    onUndoDelete,
    floorPlanRef,
    isGrouped
}) => {
    const [isDragging, setIsDragging] = useState(false);
    const dragOffset = useRef({ x: 0, y: 0 });

    const getTableColor = (status: string) => {
        if (isMarkedForDeletion) return { bg: '#dc2626', border: '#991b1b', text: '#ffffff' };
        const normalized = (status || '').toUpperCase();
        if (normalized === 'LIBRE') return { bg: '#22c55e', border: '#15803d', text: '#ffffff' }; 
        if (normalized === 'OCUPADA') return { bg: '#f97316', border: '#c2410c', text: '#ffffff' }; 
        if (normalized === 'NECESITA_LIMPIEZA') return { bg: '#ef4444', border: '#b91c1c', text: '#ffffff' }; 
        if (normalized === 'PIDIENDO_CUENTA') return { bg: '#3b82f6', border: '#1d4ed8', text: '#ffffff' };
        return { bg: '#22c55e', border: '#15803d', text: '#ffffff' };
    };

    const colors = getTableColor(table.estado);
    const canDelete = (table.estado || 'LIBRE').toUpperCase() === 'LIBRE';

    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!isEditing || isMarkedForDeletion || isSelectionMode) return;
        setIsDragging(true);
        dragOffset.current = { x: e.clientX - table.x, y: e.clientY - table.y };
        e.preventDefault();
    };

    const handleMouseMove = (e: MouseEvent) => {
        if (!isDragging || !floorPlanRef.current) return;
        const floorRect = floorPlanRef.current.getBoundingClientRect();
        let newX = e.clientX - dragOffset.current.x;
        let newY = e.clientY - dragOffset.current.y;
        // Snap to grid 10px
        newX = Math.round(newX / 10) * 10;
        newY = Math.round(newY / 10) * 10;
        
        const width = table.shape === 'rectangle-h' ? 128 : 64;
        const height = table.shape === 'rectangle-v' ? 128 : 64;

        newX = Math.max(0, Math.min(newX, floorRect.width - width));
        newY = Math.max(0, Math.min(newY, floorRect.height - height));

        onDrag(table.id, newX, newY);
    };

    const handleMouseUp = () => setIsDragging(false);

    useEffect(() => {
        if (isDragging) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        } else {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        }
        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging]);

    const getShapeClasses = () => {
        switch (table.shape) {
            case 'square': return 'w-16 h-16';
            case 'rectangle-h': return 'w-32 h-16';
            case 'rectangle-v': return 'w-16 h-32';
            case 'round': return 'w-20 h-20 rounded-full';
            default: return 'w-16 h-16';
        }
    };

    return (
        <div
            style={{ 
                left: `${table.x}px`, top: `${table.y}px`,
                backgroundColor: colors.bg, 
                borderColor: isSelected ? '#2563eb' : (isGrouped ? '#8b5cf6' : colors.border), 
                color: colors.text,
                borderWidth: isSelected || isGrouped ? '4px' : '2px', 
                borderStyle: 'solid', 
                opacity: isMarkedForDeletion ? 0.5 : 1, 
                zIndex: isDragging ? 50 : 1,
                boxShadow: isSelected ? '0 0 15px rgba(37, 99, 235, 0.5)' : 'none'
            }}
            className={`absolute ${getShapeClasses()} flex items-center justify-center transition-all duration-100 select-none shadow-md
                ${(isEditing && !isMarkedForDeletion && !isSelectionMode) ? 'cursor-move' : 'cursor-pointer hover:shadow-xl hover:scale-105'}
                ${isDragging ? 'shadow-2xl scale-105' : ''} ${table.shape === 'round' ? 'rounded-full' : 'rounded-lg'}`}
            onMouseDown={handleMouseDown}
            onClick={() => (!isEditing || isSelectionMode) && onTableClick(table)}
        >
            <div className="flex flex-col items-center">
                <span className="font-bold text-lg drop-shadow-md">{table.table_number}</span>
                {isGrouped && <LinkIcon className="h-3 w-3 text-white drop-shadow-md" />}
                {table.estado === TableStatus.PIDIENDO_CUENTA && <DollarSign className="h-4 w-4 text-white animate-bounce drop-shadow-md mt-1" />}
                {table.estado === TableStatus.NECESITA_LIMPIEZA && <Sparkles className="h-4 w-4 text-white animate-pulse drop-shadow-md mt-1" />}
            </div>
            
            {isEditing && !isSelectionMode && (
                <>
                    {!isMarkedForDeletion && (
                        <button onClick={(e) => { e.stopPropagation(); onShapeChange(table.id); }} className="absolute top-1 right-1 p-1 bg-white/50 rounded-full hover:bg-white text-gray-700 z-20">
                            <Repeat className="h-3 w-3" />
                        </button>
                    )}
                    {canDelete && !isMarkedForDeletion && (
                        <button onClick={(e) => { e.stopPropagation(); onDelete(table.id); }} className="absolute -top-2 -left-2 p-1 bg-red-500 rounded-full hover:bg-red-600 text-white z-20 shadow-sm transform hover:scale-110 transition-transform">
                            <Trash2 className="h-3 w-3" />
                        </button>
                    )}
                    {isMarkedForDeletion && (
                         <button onClick={(e) => { e.stopPropagation(); onUndoDelete(table.id); }} className="absolute -top-2 -left-2 p-1 bg-gray-500 rounded-full hover:bg-gray-600 text-white z-20 shadow-sm">
                            <RotateCcw className="h-3 w-3" />
                        </button>
                    )}
                </>
            )}
        </div>
    );
};

// --- Service Mode Modals ---

const OpenTableModal: React.FC<{
    table: Table;
    onClose: () => void;
    onOpen: (pax: number, customerId: string | null) => void;
}> = ({ table, onClose, onOpen }) => {
    const [pax, setPax] = useState(2);
    const { customers } = useAppContext();
    const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");

    const handleConfirm = (e: React.FormEvent) => {
        e.preventDefault();
        onOpen(pax, selectedCustomerId || null);
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4 border-b dark:border-gray-700 pb-2">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Abrir Mesa {table.table_number}</h3>
                    <button onClick={onClose}><X className="h-5 w-5 text-gray-500" /></button>
                </div>
                <form onSubmit={handleConfirm} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Comensales (Pax)</label>
                        <div className="flex items-center gap-3">
                            <button type="button" onClick={() => setPax(Math.max(1, pax - 1))} className="p-2 bg-gray-200 dark:bg-gray-700 rounded-full"><X className="h-4 w-4 rotate-45" /></button> {/* Using X rotated as Minus because lucide Minus conflicts if imported twice */}
                            <span className="text-2xl font-bold w-12 text-center dark:text-white">{pax}</span>
                            <button type="button" onClick={() => setPax(pax + 1)} className="p-2 bg-gray-200 dark:bg-gray-700 rounded-full"><PlusCircle className="h-4 w-4" /></button>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cliente (Opcional)</label>
                        <select 
                            className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            value={selectedCustomerId}
                            onChange={(e) => setSelectedCustomerId(e.target.value)}
                        >
                            <option value="">Cliente Casual</option>
                            {customers.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                        </select>
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 rounded">Cancelar</button>
                        <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-bold">Abrir Mesa</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const TableServiceModal: React.FC<{
    table: Table;
    order: Order | undefined;
    onClose: () => void;
    onEditOrder: () => void;
    onPay: () => void;
    onRequestBill: () => void;
    onClean: () => void;
    onViewBill: () => void; // Not used in this version but kept for extensibility
}> = ({ table, order, onClose, onEditOrder, onPay, onRequestBill, onClean }) => {
    
    if (!order) return null; // Should generally not happen if status is occupied

    const isPaid = order.total > 0 && (order.payments?.reduce((s: number, p: any) => s + (Number(p.amount) || 0), 0) || 0) >= order.total;
    const status = table.estado;

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="bg-orange-600 p-4 text-white flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold">Mesa {table.table_number}</h2>
                        <p className="text-sm opacity-90 flex items-center gap-2">
                            Orden #{order.id} &bull; {formatTimeAgo(order.creado_en)}
                        </p>
                    </div>
                    <button onClick={onClose} className="bg-white/20 p-1 rounded-full hover:bg-white/30"><X className="h-5 w-5"/></button>
                </div>
                
                <div className="p-6 grid grid-cols-2 gap-4">
                    {/* Main Actions */}
                    <button 
                        onClick={() => { onClose(); onEditOrder(); }}
                        className="col-span-2 py-4 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-200 rounded-xl flex flex-col items-center justify-center gap-2 hover:bg-orange-200 dark:hover:bg-orange-900/50 transition-colors"
                    >
                        <Utensils className="h-8 w-8" />
                        <span className="font-bold">Agregar Ítems / Comanda</span>
                    </button>

                    <button 
                        onClick={() => { onRequestBill(); onClose(); }}
                        disabled={status === TableStatus.PIDIENDO_CUENTA || isPaid}
                        className="py-4 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-200 rounded-xl flex flex-col items-center justify-center gap-2 hover:bg-blue-100 dark:hover:bg-blue-900/40 disabled:opacity-50"
                    >
                        <Receipt className="h-6 w-6" />
                        <span className="font-semibold">Pre-cuenta</span>
                    </button>

                    <button 
                        onClick={() => { onClose(); onPay(); }}
                        className="py-4 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-200 rounded-xl flex flex-col items-center justify-center gap-2 hover:bg-green-100 dark:hover:bg-green-900/40"
                    >
                        <DollarSign className="h-6 w-6" />
                        <span className="font-semibold">Cobrar</span>
                    </button>
                </div>

                <div className="px-6 pb-6">
                    <div className="p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg flex justify-between items-center mb-4">
                        <span className="text-gray-500 dark:text-gray-400">Total Consumo</span>
                        <span className="text-xl font-bold text-gray-900 dark:text-white">{formatCurrency(order.total)}</span>
                    </div>

                    {isPaid ? (
                        <button 
                            onClick={() => { onClean(); onClose(); }}
                            className="w-full py-3 bg-gray-800 dark:bg-gray-700 text-white rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-gray-700"
                        >
                            <Sparkles className="h-5 w-5 text-yellow-400" /> Liberar Mesa
                        </button>
                    ) : (
                        <div className="text-center text-xs text-gray-400">
                            La mesa debe estar pagada para liberarse automáticamente.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export const FloorPlanPage: React.FC = () => {
    const { 
        tables, sectors, user, saveTableLayout, showToast, currentRestaurantId, 
        deleteTable, createSector, deleteSector, joinTables, orders, 
        createOrder, updateTable, cleanTable, ungroupTable
    } = useAppContext();

    const [isEditing, setIsEditing] = useState(false);
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedTableIds, setSelectedTableIds] = useState<Set<string | number>>(new Set());
    
    const [localTables, setLocalTables] = useState<Table[]>([]);
    
    // Modals State
    const [selectedTable, setSelectedTable] = useState<Table | null>(null); // For details view
    const [openTableModal, setOpenTableModal] = useState<Table | null>(null);
    const [serviceModalTable, setServiceModalTable] = useState<Table | null>(null);
    
    // Shared Modals State (imported logic)
    const [editingOrder, setEditingOrder] = useState<Order | null>(null);
    const [payingOrder, setPayingOrder] = useState<Order | null>(null);

    const [deletedTableIds, setDeletedTableIds] = useState<Set<number | string>>(new Set());
    const [activeSectorId, setActiveSectorId] = useState<string>('all');
    const [isCreatingSector, setIsCreatingSector] = useState(false);
    const [newSectorName, setNewSectorName] = useState('');
    const floorPlanRef = useRef<HTMLDivElement>(null);

    // Sync tables when not editing
    useEffect(() => {
        if (!isEditing) {
            setLocalTables(JSON.parse(JSON.stringify(tables)));
            setDeletedTableIds(new Set());
        }
    }, [tables, isEditing]);

    // Set initial sector if none selected but sectors exist
    useEffect(() => {
        if (activeSectorId === 'all' && sectors.length > 0) {
            setActiveSectorId(sectors[0].id);
        }
    }, [sectors, activeSectorId]);

    const canEdit = useMemo(() => user && [UserRole.ADMIN, UserRole.GERENTE].includes(user.rol), [user]);

    const currentSectorTables = useMemo(() => {
        return localTables.filter(t => activeSectorId === 'all' || t.sector_id === activeSectorId || (!t.sector_id && activeSectorId === 'default'));
    }, [localTables, activeSectorId]);

    // --- Handlers ---

    const handleTableClick = (table: Table) => {
        if (isEditing) return; // Drag logic handles selection/edit

        if (isSelectionMode) {
            const newSet = new Set(selectedTableIds);
            if (newSet.has(table.id)) newSet.delete(table.id);
            else newSet.add(table.id);
            setSelectedTableIds(newSet);
            return;
        }

        // SERVICE MODE LOGIC
        if (table.estado === TableStatus.LIBRE) {
            setOpenTableModal(table);
        } else if (table.estado === TableStatus.NECESITA_LIMPIEZA) {
            if (window.confirm(`¿Marcar Mesa ${table.table_number} como limpia y libre?`)) {
                cleanTable(table.id);
            }
        } else {
            // Occupied or Asking Bill
            setServiceModalTable(table);
        }
    };

    const handleOpenTable = async (pax: number, customerId: string | null) => {
        if (!openTableModal || !currentRestaurantId) return;
        try {
            // 1. Create Order
            const newOrder = await createOrder({
                customer_id: customerId,
                table_id: openTableModal.table_number,
                tipo: OrderType.SALA,
                subtotal: 0, descuento: 0, impuestos: 0, propina: 0, total: 0, 
                items: [],
                restaurant_id: currentRestaurantId,
                mozo_id: user?.rol === UserRole.MOZO ? user.id : null // Auto assign if waiter
            });

            if (newOrder) {
                setOpenTableModal(null);
                // 2. Immediate Edit (First Round)
                setEditingOrder(newOrder);
            }
        } catch (e) {
            console.error(e);
            showToast("Error al abrir mesa", "error");
        }
    };

    const handleRequestBill = async (table: Table) => {
        if (!table) return;
        await updateTable({ ...table, estado: TableStatus.PIDIENDO_CUENTA });
        showToast(`Mesa ${table.table_number} solicitó la cuenta (Pre-cuenta generada).`);
    };

    // --- Editor Handlers (Same as before) ---
    const handleEnterEditMode = () => {
        setLocalTables(JSON.parse(JSON.stringify(tables)));
        setDeletedTableIds(new Set());
        setIsEditing(true);
        setIsSelectionMode(false);
        setSelectedTableIds(new Set());
    };
    
    const handleSaveChanges = async () => {
        try {
            if (deletedTableIds.size > 0) {
                for (const id of Array.from(deletedTableIds)) await deleteTable(id);
            }
            const tablesToSave = localTables.filter(t => !deletedTableIds.has(t.id));
            if (tablesToSave.length > 0 || localTables.length === 0) {
                await saveTableLayout(tablesToSave);
            }
            setDeletedTableIds(new Set());
            setIsEditing(false);
            showToast("Distribución guardada correctamente.");
        } catch (error) {
            console.error(error);
            showToast("Error al guardar cambios.", "error");
        }
    };
    
    const handleDrag = (id: number | string, x: number, y: number) => {
        setLocalTables(prev => prev.map(t => (t.id === id ? { ...t, x, y } : t)));
    };
    
    const handleShapeChange = (tableId: number | string) => {
        setLocalTables(prev => prev.map(t => {
            if (t.id === tableId) {
                let newShape: 'square' | 'rectangle-h' | 'rectangle-v' | 'round';
                if (t.shape === 'square') newShape = 'rectangle-h';
                else if (t.shape === 'rectangle-h') newShape = 'rectangle-v';
                else if (t.shape === 'rectangle-v') newShape = 'round';
                else newShape = 'square';
                return { ...t, shape: newShape };
            }
            return t;
        }));
    };

    const handleDeleteLocal = (id: number | string) => {
        const target = localTables.find(t => t.id === id);
        if (target?.estado !== TableStatus.LIBRE) {
            showToast("Solo se pueden borrar mesas LIBRES.", "error");
            return;
        }
        setDeletedTableIds(prev => new Set(prev).add(id));
    };

    const handleAddTable = () => {
        if (!currentRestaurantId) return;
        const activeTables = localTables.filter(t => !deletedTableIds.has(t.id));
        const newNumber = activeTables.length > 0 ? Math.max(...activeTables.map(t => t.table_number || 0)) + 1 : 1;
        
        const newTable: Table = {
            id: `temp-${Date.now()}`,
            table_number: newNumber,
            restaurant_id: currentRestaurantId,
            sector_id: activeSectorId !== 'all' ? activeSectorId : undefined,
            nombre: `Mesa ${newNumber}`,
            estado: TableStatus.LIBRE,
            order_id: null,
            mozo_id: null,
            x: 50, y: 50,
            shape: 'square'
        };
        setLocalTables([...localTables, newTable]);
    };

    const handleCreateSector = async () => {
        if(newSectorName.trim()) {
            await createSector(newSectorName.trim());
            setNewSectorName('');
            setIsCreatingSector(false);
        }
    };

    const handleDeleteSector = async (id: string) => {
        if(window.confirm("¿Borrar sector? Las mesas asignadas podrían quedar huérfanas.")) {
            await deleteSector(id);
            if(activeSectorId === id) setActiveSectorId(sectors[0]?.id || 'all');
        }
    };

    const toggleSelectionMode = () => {
        setIsSelectionMode(!isSelectionMode);
        setSelectedTableIds(new Set());
    };

    const handleJoinTables = async () => {
        if (selectedTableIds.size < 2) {
            showToast("Selecciona al menos 2 mesas para unir.", "info");
            return;
        }
        // Verify all are free
        const targets = localTables.filter(t => selectedTableIds.has(t.id));
        if (targets.some(t => t.estado !== TableStatus.LIBRE)) {
            showToast("Solo se pueden unir mesas que estén LIBRES.", "error");
            return;
        }

        await joinTables(Array.from(selectedTableIds));
        setIsSelectionMode(false);
        setSelectedTableIds(new Set());
    };

    return (
        <div className="space-y-6 h-full flex flex-col">
            <div className="flex flex-wrap justify-between items-center gap-4 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <LayoutGrid className="h-6 w-6 text-orange-500" /> Plano de Salón
                </h1>
                
                <div className="flex items-center gap-2">
                    <button 
                        onClick={toggleSelectionMode}
                        disabled={isEditing}
                        className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg transition-colors ${isSelectionMode ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-white'} ${isEditing ? 'opacity-50' : ''}`}
                    >
                        <MousePointer2 className="h-4 w-4" /> {isSelectionMode ? 'Cancelar' : 'Seleccionar'}
                    </button>

                    {canEdit && (
                        <>
                            {isEditing ? (
                                <>
                                    <button onClick={handleAddTable} className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-white bg-blue-500 rounded-lg hover:bg-blue-600 shadow-sm">
                                        <PlusCircle className="h-4 w-4" /> Mesa
                                    </button>
                                    <button onClick={handleSaveChanges} className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 shadow-sm">
                                        <Save className="h-4 w-4" /> Guardar
                                    </button>
                                </>
                            ) : (
                                <button onClick={handleEnterEditMode} className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:text-white rounded-lg">
                                    <Pencil className="h-4 w-4" /> Editar
                                </button>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Sectors Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
                {sectors.map(sector => (
                    <div key={sector.id} className="relative group">
                        <button
                            onClick={() => setActiveSectorId(sector.id)}
                            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                                activeSectorId === sector.id 
                                ? 'bg-orange-600 text-white shadow-md' 
                                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                            }`}
                        >
                            {sector.nombre}
                        </button>
                        {isEditing && canEdit && (
                            <button 
                                onClick={() => handleDeleteSector(sector.id)}
                                className="absolute -top-1 -right-1 p-1 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        )}
                    </div>
                ))}
                
                {isEditing && canEdit && (
                    <div className="flex items-center gap-1">
                        {isCreatingSector ? (
                            <div className="flex items-center bg-white dark:bg-gray-800 rounded-full p-1 border border-orange-300 animate-fade-in-right">
                                <input 
                                    autoFocus
                                    className="bg-transparent border-none text-sm px-2 py-1 outline-none w-32"
                                    placeholder="Nombre sector..."
                                    value={newSectorName}
                                    onChange={e => setNewSectorName(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleCreateSector()}
                                />
                                <button onClick={handleCreateSector} className="p-1 text-green-600"><Save className="h-4 w-4"/></button>
                                <button onClick={() => setIsCreatingSector(false)} className="p-1 text-red-500"><X className="h-4 w-4"/></button>
                            </div>
                        ) : (
                            <button onClick={() => setIsCreatingSector(true)} className="p-2 bg-gray-200 dark:bg-gray-700 rounded-full text-gray-600 hover:bg-gray-300">
                                <PlusCircle className="h-5 w-5" />
                            </button>
                        )}
                    </div>
                )}
            </div>

            <Card className="p-0 flex-1 overflow-hidden border-2 border-gray-200 dark:border-gray-700 relative flex flex-col">
                {sectors.length === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                        <p className="text-gray-400 bg-white/80 dark:bg-gray-900/80 p-4 rounded-lg">
                            {isEditing ? "Crea un sector (+) para comenzar" : "No hay sectores configurados"}
                        </p>
                    </div>
                )}
                
                <div 
                    ref={floorPlanRef} 
                    className="relative w-full h-full min-h-[500px] bg-slate-100 dark:bg-slate-800/50 overflow-hidden"
                    style={{
                        backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)',
                        backgroundSize: '20px 20px'
                    }}
                >
                    {currentSectorTables.map(table => (
                        <DraggableTable
                            key={table.id}
                            table={table}
                            isEditing={isEditing}
                            isSelectionMode={isSelectionMode}
                            isSelected={selectedTableIds.has(table.id)}
                            isGrouped={!!table.group_id}
                            isMarkedForDeletion={deletedTableIds.has(table.id)}
                            onTableClick={handleTableClick}
                            onDrag={handleDrag}
                            onShapeChange={handleShapeChange}
                            onDelete={handleDeleteLocal}
                            onUndoDelete={id => setDeletedTableIds(prev => { const n = new Set(prev); n.delete(id); return n; })}
                            floorPlanRef={floorPlanRef}
                        />
                    ))}
                </div>

                {isSelectionMode && selectedTableIds.size > 0 && (
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white dark:bg-gray-800 p-2 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 flex items-center gap-3 z-50 animate-fade-in-up">
                        <span className="text-sm font-bold px-2">{selectedTableIds.size} seleccionadas</span>
                        <div className="h-6 w-px bg-gray-300 dark:bg-gray-600"></div>
                        <button 
                            onClick={handleJoinTables}
                            className="flex items-center gap-2 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-semibold"
                        >
                            <LinkIcon className="h-4 w-4" /> Unir Mesas
                        </button>
                    </div>
                )}
            </Card>

            {/* --- MODALS --- */}
            
            {openTableModal && (
                <OpenTableModal 
                    table={openTableModal} 
                    onClose={() => setOpenTableModal(null)} 
                    onOpen={handleOpenTable}
                />
            )}

            {serviceModalTable && (
                <TableServiceModal 
                    table={serviceModalTable}
                    order={orders.find(o => o.id === serviceModalTable.order_id)}
                    onClose={() => setServiceModalTable(null)}
                    onEditOrder={() => {
                        const ord = orders.find(o => o.id === serviceModalTable.order_id);
                        if(ord) setEditingOrder(ord);
                    }}
                    onPay={() => {
                        const ord = orders.find(o => o.id === serviceModalTable.order_id);
                        if(ord) setPayingOrder(ord);
                    }}
                    onRequestBill={() => handleRequestBill(serviceModalTable)}
                    onClean={() => cleanTable(serviceModalTable.id)}
                    onViewBill={() => {}}
                />
            )}

            {editingOrder && (
                <OrderEditorModal 
                    order={editingOrder} 
                    onClose={() => setEditingOrder(null)} 
                />
            )}

            {payingOrder && (
                <PaymentModal 
                    order={payingOrder} 
                    onClose={() => setPayingOrder(null)} 
                    onPaymentSuccess={() => {}} 
                />
            )}
        </div>
    );
};
