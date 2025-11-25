
import React, { useState, useMemo, useEffect } from 'react';
import { useAppContext } from '../../contexts/AppContext';
import { Order, OrderStatus, OrderType, UserRole, MenuItem, PaymentDetails, OrderItem } from '../../types';
import { formatCurrency, formatDate, formatTimeAgo } from '../../utils';
import { ORDER_STATUS_COLORS, ORDER_TYPE_ICONS } from '../../constants';
import { 
    DollarSign, Ban, CreditCard, Banknote, X, Edit, Minus, Plus, 
    User as UserIcon, AlertTriangle, Bike, QrCode, Trash2, ShoppingBag, Utensils, MapPin, CheckCircle, PackageOpen
} from 'lucide-react';

export const PaymentModal: React.FC<{
    order: Order;
    onClose: () => void;
    onPaymentSuccess: () => void;
}> = ({ order, onClose, onPaymentSuccess }) => {
    const { addPaymentToOrder, generatePaymentQR, showToast } = useAppContext();
    const [amount, setAmount] = useState<number>(order.total - (order.payments?.reduce((s: number, p: any) => s + (Number(p.amount) || 0), 0) || 0));
    const [method, setMethod] = useState<PaymentDetails['method']>('EFECTIVO');
    const [isProcessing, setIsProcessing] = useState(false);
    const [qrUrl, setQrUrl] = useState<string | null>(null);

    const handleGenerateQR = async () => {
        setIsProcessing(true);
        try {
            const url = await generatePaymentQR(order.id, amount);
            if(url) setQrUrl(url);
        } catch (e) {
            console.error(e);
            showToast("Error generando QR", "error");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleSubmit = async () => {
        setIsProcessing(true);
        try {
            await addPaymentToOrder(order.id, method, amount);
            showToast("Pago registrado correctamente.");
            onPaymentSuccess();
            onClose();
        } catch (e) {
            console.error(e);
            showToast("Error al registrar pago", "error");
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={(e) => e.stopPropagation()}>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
                <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
                    <h3 className="font-semibold text-lg text-gray-900 dark:text-white">Registrar Pago - Pedido #{order.id}</h3>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"><X className="h-4 w-4" /></button>
                </div>
                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Monto a Pagar</label>
                        <input 
                            type="number" 
                            value={amount} 
                            onChange={(e) => setAmount(parseFloat(e.target.value))} 
                            className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Método de Pago</label>
                        <div className="grid grid-cols-2 gap-2">
                            {['EFECTIVO', 'TARJETA', 'MERCADOPAGO', 'MODO', 'QR'].map(m => (
                                <button 
                                    key={m}
                                    onClick={() => { setMethod(m as any); setQrUrl(null); }}
                                    className={`p-2 text-sm border rounded flex items-center justify-center gap-2 ${method === m ? 'bg-orange-100 border-orange-500 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' : 'hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
                                >
                                    {m === 'EFECTIVO' && <Banknote className="h-4 w-4"/>}
                                    {m === 'TARJETA' && <CreditCard className="h-4 w-4"/>}
                                    {m === 'QR' && <QrCode className="h-4 w-4"/>}
                                    {m}
                                </button>
                            ))}
                        </div>
                    </div>

                    {method === 'QR' && (
                        <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                            {!qrUrl ? (
                                <button onClick={handleGenerateQR} disabled={isProcessing} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                                    Generar QR
                                </button>
                            ) : (
                                <div className="flex flex-col items-center">
                                    <img src={qrUrl} alt="QR Pago" className="w-48 h-48" />
                                    <p className="text-xs text-gray-500 mt-2">Escanea para pagar</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
                <div className="p-4 border-t dark:border-gray-700 flex justify-end gap-2">
                    <button onClick={onClose} className="px-4 py-2 border rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300">Cancelar</button>
                    <button onClick={handleSubmit} disabled={isProcessing} className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50">
                        Confirmar Pago
                    </button>
                </div>
            </div>
        </div>
    );
};

export const CancelConfirmModal: React.FC<{
    order: Order;
    onClose: () => void;
    onConfirm: () => void;
}> = ({ order, onClose, onConfirm }) => {
    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={(e) => e.stopPropagation()}>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
                <div className="p-6 text-center">
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/30 mb-4">
                        <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
                    </div>
                    <h3 className="font-semibold text-lg mb-2 text-gray-900 dark:text-white">Cancelar Pedido #{order.id}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                        ¿Estás seguro de que deseas cancelar este pedido? Esta acción no se puede deshacer y afectará al inventario si ya estaba en preparación.
                    </p>
                    <div className="flex gap-4">
                        <button onClick={onClose} className="w-full py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 font-medium">
                            Volver
                        </button>
                        <button onClick={onConfirm} className="w-full py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium shadow-sm">
                            Sí, Cancelar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const OrderEditorModal: React.FC<{
    order: Order;
    onClose: () => void;
}> = ({ order, onClose }) => {
    const { processedMenuItems, categories, updateOrder, showToast, users } = useAppContext();
    const [localItems, setLocalItems] = useState<OrderItem[]>(order.items || []);
    const [activeCategory, setActiveCategory] = useState<string>('all');
    const [searchTerm, setSearchTerm] = useState('');
    
    // Estado para manejar Tipo y Asignación
    const [selectedOrderType, setSelectedOrderType] = useState<OrderType>(order.tipo);
    const [assignedStaffId, setAssignedStaffId] = useState<string>('');

    // Inicializar staff asignado
    useEffect(() => {
        if (order.mozo_id) {
            setAssignedStaffId(order.mozo_id);
        } else if (order.repartidor_id) {
            setAssignedStaffId(order.repartidor_id);
        }
    }, [order]);

    // Resetear staff si cambia el tipo a uno incompatible (ej: Sala -> Delivery)
    useEffect(() => {
        // Si cambiamos a TAKE AWAY, limpiar asignación (opcionalmente)
        if (selectedOrderType === OrderType.PARA_LLEVAR) {
            setAssignedStaffId(''); 
        }
        // Si cambiamos entre SALA y DELIVERY, verificar si el staff actual es válido para el rol
        if (assignedStaffId) {
            const staff = users.find(u => u.id === assignedStaffId);
            if (selectedOrderType === OrderType.SALA && staff?.rol !== UserRole.MOZO) {
                setAssignedStaffId('');
            } else if (selectedOrderType === OrderType.DELIVERY && staff?.rol !== UserRole.REPARTO) {
                setAssignedStaffId('');
            }
        }
    }, [selectedOrderType, users]);

    const availableStaff = useMemo(() => {
        if (selectedOrderType === OrderType.SALA) {
            return users.filter(u => u.rol === UserRole.MOZO);
        } else if (selectedOrderType === OrderType.DELIVERY) {
            return users.filter(u => u.rol === UserRole.REPARTO && u.estado_delivery === 'DISPONIBLE');
        }
        return [];
    }, [users, selectedOrderType]);

    const filteredItems = useMemo(() => {
        // MODIFICADO: No filtramos por 'disponible' aquí para mostrarlos visualmente desactivados en lugar de ocultarlos
        let items = processedMenuItems.filter(i => !i.is_deleted);
        
        if (activeCategory !== 'all') {
             items = items.filter(i => i.category_id === activeCategory);
        }
        if (searchTerm) {
            items = items.filter(i => i.nombre.toLowerCase().includes(searchTerm.toLowerCase()));
        }
        return items;
    }, [processedMenuItems, activeCategory, searchTerm]);

    const handleAddItem = (menuItem: MenuItem) => {
        if (!menuItem.disponible) {
            showToast("Producto no disponible o sin stock.", "error");
            return;
        }

        setLocalItems(prev => {
            const existing = prev.find(i => i.menu_item_id === menuItem.id && !i.notes);
            if (existing) {
                return prev.map(i => i.id === existing.id ? { 
                    ...i, 
                    cantidad: i.cantidad + 1, 
                    total_item: (i.cantidad + 1) * i.precio_unitario 
                } : i);
            }
            return [...prev, {
                id: `new-${Date.now()}-${Math.random()}`,
                menu_item_id: menuItem.id,
                nombre_item_snapshot: menuItem.nombre,
                precio_unitario: menuItem.precio_base,
                cantidad: 1,
                total_item: menuItem.precio_base,
                notes: ''
            }];
        });
    };

    const handleUpdateQuantity = (idx: number, delta: number) => {
        setLocalItems(prev => {
            const newItems = [...prev];
            const item = newItems[idx];
            const newQty = item.cantidad + delta;
            if (newQty <= 0) {
                newItems.splice(idx, 1);
            } else {
                newItems[idx] = { ...item, cantidad: newQty, total_item: newQty * item.precio_unitario };
            }
            return newItems;
        });
    };

    const handleSave = async () => {
        const subtotal = localItems.reduce((acc, item) => acc + item.total_item, 0);
        const total = subtotal; // Add tax calculation logic if needed globally

        try {
            const updatePayload: any = {
                items: localItems,
                subtotal,
                total,
                tipo: selectedOrderType
            };

            // Asignación inteligente de IDs según el tipo
            if (selectedOrderType === OrderType.SALA) {
                updatePayload.mozo_id = assignedStaffId || null;
                updatePayload.repartidor_id = null; // Limpiar repartidor si pasa a sala
            } else if (selectedOrderType === OrderType.DELIVERY) {
                updatePayload.repartidor_id = assignedStaffId || null;
                updatePayload.mozo_id = null; // Limpiar mozo si pasa a delivery
            } else {
                // Para llevar
                updatePayload.mozo_id = null;
                updatePayload.repartidor_id = null;
            }

            await updateOrder(order.id, updatePayload);
            showToast("Pedido actualizado correctamente.");
            onClose();
        } catch (e) {
            console.error(e);
            showToast("Error al actualizar pedido.", "error");
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={e => e.stopPropagation()}>
             <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-5xl h-[90vh] flex overflow-hidden" onClick={e => e.stopPropagation()}>
                
                {/* Left Panel: Menu */}
                <div className="w-2/3 flex flex-col border-r dark:border-gray-700 h-full">
                    <div className="p-4 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                        <input 
                            type="text" 
                            placeholder="Buscar producto..." 
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white mb-3 focus:ring-2 focus:ring-orange-500 outline-none"
                        />
                        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                             <button onClick={() => setActiveCategory('all')} className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${activeCategory === 'all' ? 'bg-gray-800 text-white dark:bg-white dark:text-gray-900' : 'bg-white border border-gray-300 text-gray-600 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300'}`}>Todos</button>
                             {categories.map(c => (
                                 <button key={c.id} onClick={() => setActiveCategory(c.id)} className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${activeCategory === c.id ? 'bg-orange-500 text-white border border-orange-600' : 'bg-white border border-gray-300 text-gray-600 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300'}`}>{c.nombre}</button>
                             ))}
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 bg-gray-100 dark:bg-gray-900">
                        {filteredItems.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-gray-400">
                                <PackageOpen className="h-12 w-12 mb-2 opacity-50" />
                                <p>No se encontraron productos.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-3 gap-3 content-start">
                                {filteredItems.map(item => (
                                    <div 
                                        key={item.id} 
                                        onClick={() => handleAddItem(item)} 
                                        className={`
                                            cursor-pointer bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3 shadow-sm transition-all 
                                            group flex flex-col justify-between min-h-[80px]
                                            ${!item.disponible 
                                                ? 'opacity-60 grayscale cursor-not-allowed border-dashed bg-gray-50 dark:bg-gray-800/50' 
                                                : 'hover:shadow-md hover:-translate-y-1 hover:border-orange-300'}
                                        `}
                                    >
                                        <div className="flex justify-between items-start">
                                            <p className={`font-semibold text-sm text-gray-800 dark:text-gray-100 line-clamp-2 mb-1 ${item.disponible ? 'group-hover:text-orange-600 dark:group-hover:text-orange-400' : ''}`}>
                                                {item.nombre}
                                            </p>
                                        </div>
                                        <div className="flex justify-between items-end mt-2">
                                            <p className="text-gray-500 dark:text-gray-400 text-xs font-bold">{formatCurrency(item.precio_base)}</p>
                                            {!item.disponible && (
                                                <span className="text-[10px] font-bold text-red-500 bg-red-100 dark:bg-red-900/30 px-1.5 py-0.5 rounded border border-red-200 dark:border-red-800">
                                                    AGOTADO
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Panel: Order Details & Config */}
                <div className="w-1/3 flex flex-col bg-white dark:bg-gray-800 h-full">
                    <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
                        <h3 className="font-bold text-lg text-gray-900 dark:text-white">Pedido #{order.id}</h3>
                        <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"><X className="h-5 w-5 text-gray-500"/></button>
                    </div>
                    
                    {/* Configuration Section */}
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/10 border-b dark:border-gray-700 space-y-3">
                        
                        {/* Type Selector */}
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tipo de Pedido</label>
                            <div className="flex bg-white dark:bg-gray-700 rounded-lg p-1 border dark:border-gray-600 shadow-sm">
                                {[OrderType.SALA, OrderType.PARA_LLEVAR, OrderType.DELIVERY].map((type) => (
                                    <button
                                        key={type}
                                        onClick={() => setSelectedOrderType(type)}
                                        className={`flex-1 py-1.5 text-xs font-bold rounded-md flex items-center justify-center gap-1 transition-colors ${
                                            selectedOrderType === type 
                                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-600 dark:text-white' 
                                            : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-600 dark:text-gray-300'
                                        }`}
                                    >
                                        {type === OrderType.SALA && <Utensils className="h-3 w-3"/>}
                                        {type === OrderType.PARA_LLEVAR && <ShoppingBag className="h-3 w-3"/>}
                                        {type === OrderType.DELIVERY && <Bike className="h-3 w-3"/>}
                                        {type === OrderType.PARA_LLEVAR ? 'LLEVAR' : type}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Staff Assignment Selector */}
                        {(selectedOrderType === OrderType.SALA || selectedOrderType === OrderType.DELIVERY) && (
                            <div className="animate-fade-in-down">
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                                    {selectedOrderType === OrderType.SALA ? 'Asignar Mozo' : 'Asignar Repartidor'}
                                </label>
                                <div className="relative">
                                    <select 
                                        value={assignedStaffId} 
                                        onChange={(e) => setAssignedStaffId(e.target.value)}
                                        className="w-full p-2 pl-9 border rounded-lg text-sm bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">-- Sin Asignar --</option>
                                        {availableStaff.map(u => (
                                            <option key={u.id} value={u.id}>{u.nombre}</option>
                                        ))}
                                    </select>
                                    <div className="absolute left-3 top-2.5 text-gray-400 pointer-events-none">
                                        {selectedOrderType === OrderType.DELIVERY ? <Bike className="h-4 w-4"/> : <UserIcon className="h-4 w-4"/>}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Items List */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-2">
                        {localItems.length === 0 && (
                            <div className="text-center py-10 text-gray-400 text-sm italic">
                                Carrito vacío. Añade productos del menú.
                            </div>
                        )}
                        {localItems.map((item, idx) => (
                            <div key={idx} className="flex flex-col bg-white dark:bg-gray-700/50 p-2.5 rounded-lg border dark:border-gray-700 shadow-sm">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-sm font-medium text-gray-800 dark:text-white leading-tight">{item.nombre_item_snapshot}</span>
                                    <span className="text-sm font-bold text-gray-900 dark:text-white">{formatCurrency(item.total_item)}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-3 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                                        <button onClick={() => handleUpdateQuantity(idx, -1)} className="w-6 h-6 flex items-center justify-center bg-white dark:bg-gray-700 rounded shadow-sm text-gray-600 hover:text-red-500 transition-colors"><Minus className="h-3 w-3"/></button>
                                        <span className="text-sm font-bold w-4 text-center text-gray-900 dark:text-white">{item.cantidad}</span>
                                        <button onClick={() => handleUpdateQuantity(idx, 1)} className="w-6 h-6 flex items-center justify-center bg-white dark:bg-gray-700 rounded shadow-sm text-gray-600 hover:text-green-500 transition-colors"><Plus className="h-3 w-3"/></button>
                                    </div>
                                    <button 
                                        onClick={() => {
                                            const note = prompt("Nota para cocina:", item.notes || "");
                                            if (note !== null) {
                                                setLocalItems(prev => {
                                                    const copy = [...prev];
                                                    copy[idx] = { ...copy[idx], notes: note };
                                                    return copy;
                                                });
                                            }
                                        }}
                                        className={`text-xs px-2 py-1 rounded ${item.notes ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                                    >
                                        {item.notes ? 'Editar Nota' : '+ Nota'}
                                    </button>
                                </div>
                                {item.notes && <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1 italic">"{item.notes}"</p>}
                            </div>
                        ))}
                    </div>

                    {/* Footer Totals & Actions */}
                    <div className="p-4 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-gray-500 dark:text-gray-400 text-sm">Total Estimado</span>
                            <span className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(localItems.reduce((acc, i) => acc + i.total_item, 0))}</span>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={onClose} className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                                Cancelar
                            </button>
                            <button onClick={handleSave} className="flex-1 py-2.5 bg-orange-600 text-white rounded-lg font-bold hover:bg-orange-700 shadow-lg shadow-orange-500/30 transition-all active:scale-95 flex justify-center items-center gap-2">
                                Confirmar Pedido
                            </button>
                        </div>
                    </div>
                </div>
             </div>
        </div>
    );
};

export const OrderDetailsModal: React.FC<{
    order: Order;
    onClose: () => void;
    onEdit: () => void;
    onPay: () => void;
}> = ({ order, onClose, onEdit, onPay }) => {
    const { customers, updateOrderStatus, user } = useAppContext();
    const customer = customers.find(c => c.id === order.customer_id);
    const canEdit = user && [UserRole.ADMIN, UserRole.GERENTE, UserRole.MOZO].includes(user.rol);
    const isEntregado = order.estado === OrderStatus.ENTREGADO;
    const totalPaid = order.payments?.reduce((s: number, p: any) => s + (Number(p.amount) || 0), 0) || 0;
    const isPaid = totalPaid >= order.total;

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                 <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
                    <div>
                        <h3 className="font-bold text-xl flex items-center gap-2 text-gray-900 dark:text-white">
                            Pedido #{order.id}
                            <span className={`text-xs px-2 py-1 rounded-full text-white ${ORDER_STATUS_COLORS[order.estado]}`}>{order.estado}</span>
                            {isPaid && (
                                <span className="ml-2 flex items-center gap-1 text-xs font-bold text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400 px-2 py-1 rounded-full border border-green-200 dark:border-green-800">
                                    <CheckCircle className="h-3 w-3" /> PAGADO
                                </span>
                            )}
                        </h3>
                        <p className="text-xs text-gray-500">{formatDate(order.creado_en)} - {formatTimeAgo(order.creado_en)}</p>
                    </div>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"><X className="h-5 w-5 text-gray-500" /></button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    <div className="grid grid-cols-2 gap-4 bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg">
                         <div>
                             <h4 className="text-sm font-semibold text-gray-500 uppercase">Cliente</h4>
                             <p className="font-medium text-gray-900 dark:text-white">{customer?.nombre || 'Consumidor Final'}</p>
                             {customer && <p className="text-sm text-gray-600 dark:text-gray-400">{customer.telefono}</p>}
                         </div>
                         <div>
                             <h4 className="text-sm font-semibold text-gray-500 uppercase">Tipo / Mesa</h4>
                             <div className="flex items-center gap-2 text-gray-900 dark:text-white">
                                 {React.createElement(ORDER_TYPE_ICONS[order.tipo], { className: "h-4 w-4" })}
                                 <span>{order.tipo}</span>
                                 {order.table_id && <span className="bg-gray-200 dark:bg-gray-600 px-2 rounded text-xs">Mesa {order.table_id}</span>}
                             </div>
                         </div>
                         {order.tipo === OrderType.DELIVERY && customer?.direccion && (
                             <div className="col-span-2">
                                 <h4 className="text-sm font-semibold text-gray-500 uppercase flex items-center gap-1"><MapPin className="h-3 w-3"/> Dirección de Entrega</h4>
                                 <p className="text-sm text-gray-900 dark:text-white">{customer.direccion.calle}, {customer.direccion.ciudad}</p>
                             </div>
                         )}
                    </div>

                    <div>
                        <h4 className="font-semibold mb-2 text-gray-900 dark:text-white">Items</h4>
                        <div className="border rounded-lg overflow-hidden dark:border-gray-700">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white">
                                    <tr>
                                        <th className="p-2 text-left">Cant</th>
                                        <th className="p-2 text-left">Producto</th>
                                        <th className="p-2 text-right">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="text-gray-800 dark:text-gray-200">
                                    {order.items.map((item, idx) => (
                                        <tr key={idx} className="border-t dark:border-gray-700">
                                            <td className="p-2 w-16 text-center font-medium">{item.cantidad}</td>
                                            <td className="p-2">
                                                <div>{item.nombre_item_snapshot}</div>
                                                {item.notes && <div className="text-xs text-orange-600 italic">{item.notes}</div>}
                                            </td>
                                            <td className="p-2 text-right">{formatCurrency(item.total_item)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="flex justify-end text-gray-900 dark:text-white">
                        <div className="w-48 space-y-1">
                            <div className="flex justify-between text-sm"><span>Subtotal:</span> <span>{formatCurrency(order.subtotal)}</span></div>
                            <div className="flex justify-between text-sm"><span>Impuestos:</span> <span>{formatCurrency(order.impuestos)}</span></div>
                            <div className="flex justify-between text-lg font-bold border-t dark:border-gray-700 pt-1 mt-1"><span>Total:</span> <span>{formatCurrency(order.total)}</span></div>
                        </div>
                    </div>
                </div>

                <div className="p-4 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex flex-wrap gap-2 justify-end">
                    {order.estado !== OrderStatus.CANCELADO && !isEntregado && canEdit && (
                         <button onClick={onEdit} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2">
                             <Edit className="h-4 w-4" /> Editar
                         </button>
                    )}
                    {order.estado !== OrderStatus.CANCELADO && !isEntregado && (
                        <button onClick={() => updateOrderStatus(order.id, OrderStatus.ENTREGADO)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                            Marcar Entregado
                        </button>
                    )}
                    {order.estado !== OrderStatus.CANCELADO && (
                        isPaid ? (
                            <div className="px-4 py-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg border border-green-200 dark:border-green-800 font-bold flex items-center gap-2 cursor-default">
                                <CheckCircle className="h-4 w-4" /> PAGADO
                            </div>
                        ) : (
                            <button onClick={onPay} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2">
                                <DollarSign className="h-4 w-4" /> Pagar
                            </button>
                        )
                    )}
                </div>
            </div>
        </div>
    );
};
