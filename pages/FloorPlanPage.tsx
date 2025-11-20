import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../contexts/AppContext';
import { Table, TableStatus, UserRole, OrderType, Order } from '../types';
import { Card } from '../components/ui/Card';
import { Eye, Pencil, Save, PlusCircle, Repeat, X, ShoppingCart, CheckCircle, Sparkles, User as UserIcon } from 'lucide-react';
import { TABLE_STATUS_COLORS } from '../constants';

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

    const statusColors = TABLE_STATUS_COLORS[table.estado];

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

        onDrag(table.id, newX, newY);
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
            style={{ left: `${table.x}px`, top: `${table.y}px` }}
            className={`absolute ${getShapeClasses()} ${statusColors.bg} border-2 ${statusColors.border} rounded-lg flex items-center justify-center transition-all duration-200 select-none
                ${isEditing ? 'cursor-move' : 'cursor-pointer hover:shadow-lg hover:scale-105'}
                ${isDragging ? 'shadow-2xl z-10 scale-105' : ''}`}
            onMouseDown={handleMouseDown}
            onClick={() => !isEditing && onTableClick(table)}
        >
            <span className={`font-bold text-lg ${statusColors.text}`}>{table.id}</span>
            {isEditing && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onShapeChange(table.id);
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


const TableDetailsModal: React.FC<{
    table: Table;
    onClose: () => void;
}> = ({ table, onClose }) => {
    const { cleanTable, createOrder, user, users, updateTable, showToast, orders, assignMozoToOrder } = useAppContext();
    const navigate = useNavigate();

    const assignedMozo = useMemo(() => users.find(u => u.id === table.mozo_id), [users, table.mozo_id]);
    const waiters = useMemo(() => users.filter(u => u.rol === UserRole.MOZO), [users]);
    const canAssignMozo = user && [UserRole.ADMIN, UserRole.GERENTE].includes(user.rol);


    const handleCreateOrder = async () => {
        const newOrder = await createOrder({
            customer_id: null,
            table_id: table.id,
            tipo: OrderType.SALA,
            subtotal: 0,
            descuento: 0,
            impuestos: 0,
            propina: 0,
            total: 0,
            items: [],
            restaurant_id: 'rest-pizarra-01',
        });
        if (newOrder) {
            navigate(`/pedidos?orderId=${newOrder.id}`);
        }
        onClose();
    };

    const handleViewOrder = () => {
        if (table.order_id) {
            navigate(`/pedidos?orderId=${table.order_id}`);
            onClose();
        } else {
            showToast("No se encontró un pedido activo para esta mesa.", "error");
            onClose();
        }
    };

    const handleCleanTable = async () => {
        await cleanTable(table.id);
        onClose();
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

    const canSelfAssign = user?.rol === UserRole.MOZO && !table.mozo_id;

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
                    <h2 className="text-xl font-bold">{table.nombre}</h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"><X className="h-5 w-5" /></button>
                </div>
                <div className="p-6 space-y-4">
                    <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Estado</span>
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${TABLE_STATUS_COLORS[table.estado].bg} ${TABLE_STATUS_COLORS[table.estado].text}`}>
                            {table.estado}
                        </span>
                    </div>
                     <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Mozo/a Asignado/a</span>
                        {canAssignMozo ? (
                            <select
                                value={table.mozo_id || ''}
                                onChange={handleAssignMozo}
                                className="max-w-[150px] truncate text-sm font-semibold bg-gray-100 dark:bg-gray-700 rounded-md border-transparent focus:outline-none focus:ring-2 focus:ring-orange-500"
                            >
                                <option value="">N/A</option>
                                {waiters.map(waiter => (
                                    <option key={waiter.id} value={waiter.id}>{waiter.nombre}</option>
                                ))}
                            </select>
                        ) : (
                            <span className="font-semibold text-gray-800 dark:text-gray-200">{assignedMozo?.nombre || 'N/A'}</span>
                        )}
                    </div>
                </div>
                <div className="px-6 pb-6 pt-4 space-y-3">
                    {table.estado === TableStatus.LIBRE && (
                         <button onClick={handleCreateOrder} className="w-full flex items-center justify-center gap-3 px-4 py-3 text-sm font-semibold text-white bg-green-500 rounded-lg hover:bg-green-600">
                             <ShoppingCart className="h-4 w-4" /> Crear Pedido
                         </button>
                    )}
                    {table.estado === TableStatus.OCUPADA && (
                        <>
                            <button onClick={handleViewOrder} className="w-full flex items-center justify-center gap-3 px-4 py-3 text-sm font-semibold text-white bg-blue-500 rounded-lg hover:bg-blue-600">
                                <Eye className="h-4 w-4" /> Ver Pedido
                            </button>
                            {canSelfAssign && (
                                <button onClick={handleAssignSelf} className="w-full flex items-center justify-center gap-3 px-4 py-3 text-sm font-semibold border dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                                    <UserIcon className="h-4 w-4" /> Atender esta mesa
                                </button>
                            )}
                        </>
                    )}
                     {table.estado === TableStatus.NECESITA_LIMPIEZA && (
                         <button onClick={handleCleanTable} className="w-full flex items-center justify-center gap-3 px-4 py-3 text-sm font-semibold text-white bg-orange-500 rounded-lg hover:bg-orange-600">
                             <Sparkles className="h-4 w-4" /> Marcar como Limpia
                         </button>
                    )}
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
            if (JSON.stringify(localTables) !== JSON.stringify(tables)) {
                 if (window.confirm('Tienes cambios sin guardar. ¿Quieres descartarlos?')) {
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
        const newId = Math.max(0, ...localTables.map(t => t.id)) + 1;
        const newTable: Table = {
            id: newId,
            restaurant_id: currentRestaurantId,
            nombre: `Mesa ${newId}`,
            estado: TableStatus.LIBRE,
            order_id: null,
            mozo_id: null,
            x: 10,
            y: 10,
            shape: 'square'
        };
        setLocalTables([...localTables, newTable]);
        showToast(`Nueva mesa #${newId} añadida. Arrástrala a su posición.`, 'success');
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap justify-between items-center gap-4">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Plano del Salón</h1>
                {canEdit && (
                     <div className="flex items-center gap-4">
                         {isEditing && (
                            <>
                                <button onClick={handleAddTable} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-500 rounded-lg hover:bg-blue-600">
                                    <PlusCircle className="h-4 w-4" />
                                    Añadir Mesa
                                </button>
                                <button onClick={handleSaveChanges} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-green-500 rounded-lg hover:bg-green-600">
                                    <Save className="h-4 w-4" />
                                    Guardar Diseño
                                </button>
                            </>
                         )}
                        <button onClick={handleToggleEditMode} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600">
                           {isEditing ? <Eye className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
                           {isEditing ? 'Ver Salón' : 'Editar Diseño'}
                        </button>
                    </div>
                )}
            </div>

            <Card>
                <div 
                    ref={floorPlanRef} 
                    className="relative w-full h-[600px] bg-gray-50 dark:bg-gray-800/50 rounded-lg overflow-hidden"
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