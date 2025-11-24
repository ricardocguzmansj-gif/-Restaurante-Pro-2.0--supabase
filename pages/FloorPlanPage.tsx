
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../contexts/AppContext';
import { Table, TableStatus, UserRole, OrderType, Sector, User } from '../types';
import { Card } from '../components/ui/Card';
import { Eye, Pencil, Save, PlusCircle, Repeat, X, ShoppingCart, User as UserIcon, Sparkles, Trash2, RotateCcw, LayoutGrid, MousePointer2, Link as LinkIcon, Unlink } from 'lucide-react';

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

const TableActionButtons: React.FC<{ table: Table; onClose: () => void }> = ({ table, onClose }) => {
    const { cleanTable, createOrder, user, updateTable, showToast, assignMozoToOrder, ungroupTable, users } = useAppContext();
    const navigate = useNavigate();
    const status = (table.estado || '').toUpperCase();
    const [assigningWaiter, setAssigningWaiter] = useState(false);

    const waiters = users.filter(u => u.rol === UserRole.MOZO || u.rol === UserRole.ADMIN || u.rol === UserRole.GERENTE);

    const handleAssign = async (userId: string) => {
        await updateTable({ ...table, mozo_id: userId });
        if (table.order_id) await assignMozoToOrder(table.order_id, userId);
        showToast("Mozo asignado correctamente.");
        setAssigningWaiter(false);
    };

    const handleSplit = async () => {
        if (window.confirm("¿Estás seguro de separar esta mesa del grupo?")) {
            await ungroupTable(table.id);
            onClose();
        }
    };

    if (status === 'LIBRE') {
        const handleCreateOrder = async () => {
            const newOrder = await createOrder({
                customer_id: null, table_id: table.table_number, tipo: OrderType.SALA,
                subtotal: 0, descuento: 0, impuestos: 0, propina: 0, total: 0, items: [],
                restaurant_id: table.restaurant_id,
            });
            if (newOrder) { navigate(`/pedidos?orderId=${newOrder.id}`); }
            onClose();
        };
        return (
            <div className="space-y-3">
                <button onClick={handleCreateOrder} className="w-full flex items-center justify-center gap-3 px-4 py-3 text-sm font-semibold text-white bg-green-600 hover:bg-green-700 rounded-lg shadow-md transition-all hover:scale-[1.02]">
                    <ShoppingCart className="h-5 w-5" /> ABRIR MESA
                </button>
                {table.group_id && (
                    <button onClick={handleSplit} className="w-full flex items-center justify-center gap-3 px-4 py-3 text-sm font-semibold text-purple-600 border border-purple-600 hover:bg-purple-50 rounded-lg">
                        <Unlink className="h-5 w-5" /> SEPARAR MESA
                    </button>
                )}
            </div>
        );
    }

    if (status === 'OCUPADA' || status === 'PIDIENDO_CUENTA') {
        const handleViewOrder = () => {
            if (table.order_id) { navigate(`/pedidos?orderId=${table.order_id}`); onClose(); }
            else { showToast("Error: La mesa figura ocupada pero no tiene ID de pedido.", "error"); }
        };
        
        return (
            <div className="space-y-3">
                <button onClick={handleViewOrder} className="w-full flex items-center justify-center gap-3 px-4 py-3 text-sm font-semibold text-white bg-orange-500 hover:bg-orange-600 rounded-lg shadow-md transition-all hover:scale-[1.02]">
                    <Eye className="h-5 w-5" /> VER PEDIDO ACTIVO
                </button>
                
                {!assigningWaiter ? (
                    <button onClick={() => setAssigningWaiter(true)} className="w-full flex items-center justify-center gap-3 px-4 py-3 text-sm font-semibold text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-all">
                        <UserIcon className="h-5 w-5" /> {table.mozo_id ? 'Cambiar Mozo' : 'Asignar Mozo'}
                    </button>
                ) : (
                    <div className="bg-gray-100 p-3 rounded-lg">
                        <p className="text-xs font-bold text-gray-500 mb-2 uppercase">Seleccionar Mozo</p>
                        <div className="max-h-40 overflow-y-auto space-y-1">
                            {waiters.map(w => (
                                <button key={w.id} onClick={() => handleAssign(w.id)} className="w-full text-left px-3 py-2 text-sm bg-white hover:bg-blue-50 rounded border border-gray-200 flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                    {w.nombre}
                                </button>
                            ))}
                        </div>
                        <button onClick={() => setAssigningWaiter(false)} className="mt-2 w-full text-xs text-red-500 hover:underline">Cancelar</button>
                    </div>
                )}

                {table.group_id && (
                    <button onClick={handleSplit} className="w-full flex items-center justify-center gap-3 px-4 py-3 text-sm font-semibold text-purple-600 border border-purple-600 hover:bg-purple-50 rounded-lg">
                        <Unlink className="h-5 w-5" /> SEPARAR MESA
                    </button>
                )}
            </div>
        );
    }

    if (status === 'NECESITA_LIMPIEZA') {
        const handleCleanTable = async () => { await cleanTable(table.id); onClose(); };
        return (
            <button onClick={handleCleanTable} className="w-full flex items-center justify-center gap-3 px-4 py-3 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-md animate-pulse transition-all hover:scale-[1.02]">
                <Sparkles className="h-5 w-5" /> MARCAR LIMPIA Y LIBERAR
            </button>
        );
    }
    return <div className="text-center text-gray-500">Estado desconocido: {status}</div>;
};

const TableDetailsModal: React.FC<{ table: Table; onClose: () => void; }> = ({ table, onClose }) => {
    const { users } = useAppContext();
    const mozo = users.find(u => u.id === table.mozo_id);

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-700/50">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800 dark:text-white">{table.nombre}</h2>
                        {table.group_id && <span className="text-xs text-purple-600 font-bold flex items-center gap-1"><LinkIcon className="h-3 w-3"/> Mesa Unida</span>}
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600"><X className="h-5 w-5 text-gray-500" /></button>
                </div>
                <div className="p-6 space-y-6">
                    <div className="space-y-2">
                        <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg border dark:border-gray-600">
                            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Estado Actual</span>
                            <span className={`px-3 py-1 text-xs font-bold uppercase tracking-wide rounded-full border bg-gray-100 text-gray-800`}>{table.estado.replace('_', ' ')}</span>
                        </div>
                        {mozo && (
                            <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg border dark:border-gray-600">
                                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Mozo Asignado</span>
                                <span className="font-semibold text-gray-800 dark:text-white">{mozo.nombre}</span>
                            </div>
                        )}
                    </div>
                    <div className="pt-2">
                        <TableActionButtons table={table} onClose={onClose} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export const FloorPlanPage: React.FC = () => {
    const { tables, sectors, user, saveTableLayout, showToast, currentRestaurantId, deleteTable, createSector, deleteSector, joinTables } = useAppContext();
    const [isEditing, setIsEditing] = useState(false);
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedTableIds, setSelectedTableIds] = useState<Set<string | number>>(new Set());
    
    const [localTables, setLocalTables] = useState<Table[]>([]);
    const [selectedTable, setSelectedTable] = useState<Table | null>(null);
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

    // --- Selection Logic ---
    const toggleSelectionMode = () => {
        setIsSelectionMode(!isSelectionMode);
        setSelectedTableIds(new Set());
    };

    const handleTableClick = (table: Table) => {
        if (isSelectionMode) {
            const newSet = new Set(selectedTableIds);
            if (newSet.has(table.id)) newSet.delete(table.id);
            else newSet.add(table.id);
            setSelectedTableIds(newSet);
        } else {
            setSelectedTable(table);
        }
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
                    <LayoutGrid className="h-6 w-6 text-orange-500" /> Plano
                </h1>
                
                <div className="flex items-center gap-2">
                    <button 
                        onClick={toggleSelectionMode}
                        className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg transition-colors ${isSelectionMode ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-white'}`}
                    >
                        <MousePointer2 className="h-4 w-4" /> {isSelectionMode ? 'Cancelar Selección' : 'Seleccionar'}
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

            {selectedTable && <TableDetailsModal table={selectedTable} onClose={() => setSelectedTable(null)} />}
        </div>
    );
};
