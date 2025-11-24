
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../contexts/AppContext';
import { Table, TableStatus, UserRole, OrderType } from '../types';
import { Card } from '../components/ui/Card';
import { Eye, Pencil, Save, PlusCircle, Repeat, X, ShoppingCart, User as UserIcon, Sparkles } from 'lucide-react';

interface DraggableTableProps {
    table: Table;
    isEditing: boolean;
    onTableClick: (table: Table) => void;
    onDrag: (id: number, x: number, y: number) => void;
    onShapeChange: (id: number) => void;
    floorPlanRef: React.RefObject<HTMLDivElement>;
}

const DraggableTable: React.FC<DraggableTableProps> = ({ table, isEditing, onTableClick, onDrag, onShapeChange, floorPlanRef }) => {
    const [isDragging, setIsDragging] = useState(false);
    const dragOffset = useRef({ x: 0, y: 0 });

    // LÓGICA DE COLORES ESTRICTA
    const getTableColor = (status: string) => {
        const normalized = (status || '').toUpperCase();
        
        // 1. LIBRE -> VERDE
        if (normalized === 'LIBRE') {
            return { bg: '#22c55e', border: '#15803d', text: '#ffffff' }; 
        }
        // 2. OCUPADA -> NARANJA
        if (normalized === 'OCUPADA') {
            return { bg: '#f97316', border: '#c2410c', text: '#ffffff' }; 
        }
        // 3. NECESITA_LIMPIEZA -> ROJO
        if (normalized === 'NECESITA_LIMPIEZA') {
            return { bg: '#ef4444', border: '#b91c1c', text: '#ffffff' }; 
        }
        
        // Default fallback (Verde)
        return { bg: '#22c55e', border: '#15803d', text: '#ffffff' };
    };

    const colors = getTableColor(table.estado);

    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!isEditing) return;
        setIsDragging(true);
        dragOffset.current = {
            x: e.clientX - table.x,
            y: e.clientY - table.y
        };
        e.preventDefault();
    };

    const handleMouseMove = (e: MouseEvent) => {
        if (!isDragging || !floorPlanRef.current) return;
        const floorRect = floorPlanRef.current.getBoundingClientRect();
        
        let newX = e.clientX - dragOffset.current.x;
        let newY = e.clientY - dragOffset.current.y;

        // Constrain within the floor plan
        newX = Math.max(0, Math.min(newX, floorRect.width - (table.shape === 'rectangle-h' ? 128 : 64)));
        newY = Math.max(0, Math.min(newY, floorRect.height - (table.shape === 'rectangle-v' ? 128 : 64)));

        // Cast id to number if needed for local state, or update drag handler to accept string | number
        // Assuming drag handler expects number for now based on previous code, but if ID is string, this needs care.
        // For now, let's assume local dragging uses the table ID which might be numeric or we cast it.
        onDrag(table.id as number, newX, newY);
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

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
        }
    };

    return (
        <div
            style={{ 
                left: `${table.x}px`, 
                top: `${table.y}px`,
                backgroundColor: colors.bg,
                borderColor: colors.border,
                color: colors.text,
                borderWidth: '2px',
                borderStyle: 'solid'
            }}
            className={`absolute ${getShapeClasses()} rounded-lg flex items-center justify-center transition-all duration-200 select-none shadow-md
                ${isEditing ? 'cursor-move' : 'cursor-pointer hover:shadow-xl hover:scale-105'}
                ${isDragging ? 'shadow-2xl z-10 scale-105' : ''}`}
            onMouseDown={handleMouseDown}
            onClick={() => !isEditing && onTableClick(table)}
        >
            <span className="font-bold text-lg drop-shadow-md">{table.table_number || table.id}</span>
            {isEditing && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        // Cast to number if needed
                        onShapeChange(table.id as number);
                    }}
                    className="absolute top-1 right-1 p-1 bg-white/50 dark:bg-black/50 rounded-full hover:bg-white dark:hover:bg-black text-gray-700 dark:text-gray-200 z-20"
                    title="Cambiar forma"
                >
                    <Repeat className="h-3 w-3" />
                </button>
            )}
        </div>
    );
};

// --- REFACTORIZACIÓN: COMPONENTE DE BOTONES DE ACCIÓN ---
const TableActionButtons: React.FC<{ table: Table; onClose: () => void }> = ({ table, onClose }) => {
    const { cleanTable, createOrder, user, updateTable, showToast, orders, assignMozoToOrder } = useAppContext();
    const navigate = useNavigate();
    const canSelfAssign = user?.rol === UserRole.MOZO && !table.mozo_id;

    // Normalizar estado para evitar errores de strings
    const status = (table.estado || '').toUpperCase();

    // --- CASO 1: MESA LIBRE (VERDE) ---
    if (status === 'LIBRE') {
        const handleCreateOrder = async () => {
            // CRITICAL FIX: Use table.table_number instead of table.id for the order linkage
            const newOrder = await createOrder({
                customer_id: null,
                table_id: table.table_number, 
                tipo: OrderType.SALA,
                subtotal: 0,
                descuento: 0,
                impuestos: 0,
                propina: 0,
                total: 0,
                items: [],
                restaurant_id: table.restaurant_id,
            });
            if (newOrder) {
                navigate(`/pedidos?orderId=${newOrder.id}`);
            }
            onClose();
        };

        return (
            <button 
                onClick={handleCreateOrder} 
                className="w-full flex items-center justify-center gap-3 px-4 py-3 text-sm font-semibold text-white bg-green-600 hover:bg-green-700 rounded-lg shadow-md transition-all hover:scale-[1.02]"
            >
                <ShoppingCart className="h-5 w-5" /> 
                ABRIR MESA (Crear Pedido)
            </button>
        );
    }

    // --- CASO 2: MESA OCUPADA (NARANJA) ---
    if (status === 'OCUPADA') {
        const handleViewOrder = () => {
            if (table.order_id) {
                navigate(`/pedidos?orderId=${table.order_id}`);
                onClose();
            } else {
                showToast("Error: La mesa figura ocupada pero no tiene ID de pedido.", "error");
            }
        };

        const handleAssignSelf = async () => {
            if (user) {
                await updateTable({ ...table, mozo_id: user.id });
                if (table.order_id) {
                    await assignMozoToOrder(table.order_id, user.id);
                }
                showToast(`Te has asignado a la ${table.nombre}.`);
            }
        };

        return (
            <div className="space-y-3">
                <button 
                    onClick={handleViewOrder} 
                    className="w-full flex items-center justify-center gap-3 px-4 py-3 text-sm font-semibold text-white bg-orange-500 hover:bg-orange-600 rounded-lg shadow-md transition-all hover:scale-[1.02]"
                >
                    <Eye className="h-5 w-5" /> 
                    VER PEDIDO ACTIVO
                </button>
                
                {canSelfAssign && (
                    <button 
                        onClick={handleAssignSelf} 
                        className="w-full flex items-center justify-center gap-3 px-4 py-3 text-sm font-semibold text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 dark:bg-gray-700 dark:text-white dark:border-gray-600 rounded-lg transition-all"
                    >
                        <UserIcon className="h-5 w-5" /> 
                        Atender esta mesa
                    </button>
                )}
            </div>
        );
    }

    // --- CASO 3: NECESITA LIMPIEZA (ROJO) ---
    if (status === 'NECESITA_LIMPIEZA') {
        const handleCleanTable = async () => {
            await cleanTable(table.id);
            onClose();
        };

        return (
            <button 
                onClick={handleCleanTable} 
                className="w-full flex items-center justify-center gap-3 px-4 py-3 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-md animate-pulse transition-all hover:scale-[1.02]"
            >
                <Sparkles className="h-5 w-5" /> 
                MARCAR COMO LIMPIA Y LIBERAR
            </button>
        );
    }

    return <div className="text-center text-gray-500">Estado desconocido: {status}</div>;
};

const TableDetailsModal: React.FC<{
    table: Table;
    onClose: () => void;
}> = ({ table, onClose }) => {
    const { users, user, updateTable, showToast, orders, assignMozoToOrder } = useAppContext();

    const assignedMozo = useMemo(() => users.find(u => u.id === table.mozo_id), [users, table.mozo_id]);
    const waiters = useMemo(() => users.filter(u => u.rol === UserRole.MOZO), [users]);
    const canAssignMozo = user && [UserRole.ADMIN, UserRole.GERENTE].includes(user.rol);

    const getStatusBadgeClass = (status: string) => {
        const normalized = (status || '').toUpperCase();
        if (normalized === 'LIBRE') return 'bg-green-100 text-green-800 border-green-200';
        if (normalized === 'OCUPADA') return 'bg-orange-100 text-orange-800 border-orange-200';
        if (normalized === 'NECESITA_LIMPIEZA') return 'bg-red-100 text-red-800 border-red-200';
        return 'bg-gray-100 text-gray-800';
    };
    
    const handleAssignMozo = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const mozoId = e.target.value || null;
        await updateTable({ ...table, mozo_id: mozoId });

        if (table.order_id) {
            const associatedOrder = orders.find(o => o.id === table.order_id);
            if (associatedOrder && associatedOrder.mozo_id !== mozoId) {
                await assignMozoToOrder(table.order_id, mozoId);
            }
        }
        showToast(`Mozo/a actualizado para la ${table.nombre}.`);
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden transform transition-all" onClick={e => e.stopPropagation()}>
                
                {/* Header */}
                <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-700/50">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white">{table.nombre}</h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"><X className="h-5 w-5 text-gray-500" /></button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6">
                    
                    {/* Estado Badge */}
                    <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg border dark:border-gray-600">
                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Estado Actual</span>
                        <span className={`px-3 py-1 text-xs font-bold uppercase tracking-wide rounded-full border ${getStatusBadgeClass(table.estado)}`}>
                            {table.estado.replace('_', ' ')}
                        </span>
                    </div>

                    {/* Mozo Selector */}
                     <div>
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                            Mozo/a Responsable
                        </label>
                        {canAssignMozo ? (
                            <div className="relative">
                                <select
                                    value={table.mozo_id || ''}
                                    onChange={handleAssignMozo}
                                    className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm rounded-md dark:bg-gray-700 dark:border-gray-600"
                                >
                                    <option value="">-- Sin Asignar --</option>
                                    {waiters.map(waiter => (
                                        <option key={waiter.id} value={waiter.id}>{waiter.nombre}</option>
                                    ))}
                                </select>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700 rounded-md border dark:border-gray-600">
                                <UserIcon className="h-4 w-4 text-gray-400" />
                                <span className="font-medium text-gray-800 dark:text-gray-200">{assignedMozo?.nombre || 'Sin Asignar'}</span>
                            </div>
                        )}
                    </div>

                    {/* Action Buttons Area */}
                    <div className="pt-2">
                        <TableActionButtons table={table} onClose={onClose} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export const FloorPlanPage: React.FC = () => {
    const { tables, user, saveTableLayout, showToast, currentRestaurantId } = useAppContext();
    const [isEditing, setIsEditing] = useState(false);
    const [localTables, setLocalTables] = useState<Table[]>([]);
    const [selectedTable, setSelectedTable] = useState<Table | null>(null);
    const floorPlanRef = useRef<HTMLDivElement>(null);

    // Sincronizar tablas locales con el contexto cuando este cambia
    useEffect(() => {
        setLocalTables(JSON.parse(JSON.stringify(tables)));
    }, [tables]);
    
    const canEdit = useMemo(() => user && [UserRole.ADMIN, UserRole.GERENTE].includes(user.rol), [user]);

    const handleTableClick = (table: Table) => {
        if (!isEditing) {
            setSelectedTable(table);
        }
    };

    const handleToggleEditMode = () => {
        if (isEditing) {
            // Si estamos saliendo del modo edición, comprobar cambios
            if (JSON.stringify(localTables) !== JSON.stringify(tables)) {
                 if (window.confirm('Tienes cambios de diseño sin guardar. ¿Quieres descartarlos?')) {
                    setLocalTables(JSON.parse(JSON.stringify(tables)));
                    setIsEditing(false);
                 }
            } else {
                 setIsEditing(false);
            }
        } else {
             setIsEditing(true);
        }
    };
    
    const handleSaveChanges = async () => {
        await saveTableLayout(localTables);
        setIsEditing(false);
    };
    
    const handleDrag = (id: number, x: number, y: number) => {
        setLocalTables(prevTables =>
            prevTables.map(t => (t.id === id ? { ...t, x, y } : t))
        );
    };
    
    const handleShapeChange = (tableId: number) => {
        setLocalTables(prevTables =>
            prevTables.map(t => {
                if (t.id === tableId) {
                    let newShape: 'square' | 'rectangle-h' | 'rectangle-v';
                    switch (t.shape) {
                        case 'square': newShape = 'rectangle-h'; break;
                        case 'rectangle-h': newShape = 'rectangle-v'; break;
                        case 'rectangle-v': newShape = 'square'; break;
                        default: newShape = 'square';
                    }
                    return { ...t, shape: newShape };
                }
                return t;
            })
        );
    };

    const handleAddTable = () => {
        if (!currentRestaurantId) return;
        // Encontrar un ID numérico único (esto es para la UI local, el backend usa UUID o composite)
        // Para simplificar en este frontend, asumimos que table_number es lo que mostramos
        const newNumber = localTables.length > 0 ? Math.max(...localTables.map(t => t.table_number || 0)) + 1 : 1;
        
        const newTable: Table = {
            id: Date.now(), // ID temporal para React key
            table_number: newNumber,
            restaurant_id: currentRestaurantId,
            nombre: `Mesa ${newNumber}`,
            estado: TableStatus.LIBRE,
            order_id: null,
            mozo_id: null,
            x: 50,
            y: 50,
            shape: 'square'
        };
        setLocalTables([...localTables, newTable]);
        showToast(`Nueva mesa #${newNumber} añadida.`, 'success');
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap justify-between items-center gap-4">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Plano del Salón</h1>
                
                <div className="flex items-center gap-2">
                    {/* Leyenda de Colores Simple */}
                    <div className="flex gap-3 text-xs mr-4 bg-white dark:bg-gray-800 p-2 rounded-lg shadow-sm">
                        <div className="flex items-center gap-1"><div className="w-3 h-3 bg-green-500 rounded-full"></div> Libre</div>
                        <div className="flex items-center gap-1"><div className="w-3 h-3 bg-orange-500 rounded-full"></div> Ocupada</div>
                        <div className="flex items-center gap-1"><div className="w-3 h-3 bg-red-500 rounded-full"></div> Limpieza</div>
                    </div>

                    {canEdit && (
                        <>
                            {isEditing ? (
                                <>
                                    <button onClick={handleAddTable} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-500 rounded-lg hover:bg-blue-600 shadow-sm">
                                        <PlusCircle className="h-4 w-4" /> Mesa
                                    </button>
                                    <button onClick={handleSaveChanges} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 shadow-sm">
                                        <Save className="h-4 w-4" /> Guardar
                                    </button>
                                </>
                            ) : (
                                <button onClick={handleToggleEditMode} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600 rounded-lg shadow-sm">
                                <Pencil className="h-4 w-4" /> Editar Diseño
                                </button>
                            )}
                        </>
                    )}
                </div>
            </div>

            <Card className="p-0 overflow-hidden border-2 border-gray-200 dark:border-gray-700">
                <div 
                    ref={floorPlanRef} 
                    className="relative w-full h-[600px] bg-slate-100 dark:bg-slate-800/50"
                    style={{
                        backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)',
                        backgroundSize: '20px 20px'
                    }}
                >
                    {localTables.map(table => (
                        <DraggableTable
                            key={table.id}
                            table={table}
                            isEditing={isEditing}
                            onTableClick={handleTableClick}
                            onDrag={handleDrag}
                            onShapeChange={handleShapeChange}
                            floorPlanRef={floorPlanRef}
                        />
                    ))}
                </div>
            </Card>

            {selectedTable && <TableDetailsModal table={selectedTable} onClose={() => setSelectedTable(null)} />}
        </div>
    );
};
