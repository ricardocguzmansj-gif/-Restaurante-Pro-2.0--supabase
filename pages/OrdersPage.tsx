
import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { useAppContext } from '../contexts/AppContext';
import { Order, OrderStatus, OrderType, UserRole } from '../types';
import { formatCurrency, formatTimeAgo } from '../utils';
import { ORDER_STATUS_COLORS, ORDER_TYPE_ICONS } from '../constants';
import { 
    PlusCircle, Search, DollarSign, Ban, 
    X, User as UserIcon,
    History, FileText, Bike, CheckCircle, AlertTriangle, Edit
} from 'lucide-react';
import { PaymentModal, OrderEditorModal, OrderDetailsModal, CancelConfirmModal } from '../components/orders/SharedModals';

// Keep CollectionsHistoryModal local as it's specific to this page
const CollectionsHistoryModal: React.FC<{
    onClose: () => void;
}> = ({ onClose }) => {
    const { orders, users } = useAppContext();
    const [searchTerm, setSearchTerm] = useState('');

    const usersMap = useMemo(() => new Map(users.map(u => [u.id, u.nombre])), [users]);

    const allPayments = useMemo(() => {
        const payments: Array<{
            orderId: number;
            paymentDate: string;
            amount: number;
            method: string;
            mozoName: string;
            customerName: string;
        }> = [];

        orders.forEach(order => {
            if (order.payments && order.payments.length > 0) {
                order.payments.forEach((p: any) => {
                    payments.push({
                        orderId: order.id,
                        paymentDate: p.creado_en,
                        amount: Number(p.amount) || 0,
                        method: p.method,
                        mozoName: order.mozo_id ? (usersMap.get(order.mozo_id) || 'Desconocido') : 'Sin Mozo',
                        customerName: 'Cliente'
                    });
                });
            }
        });
        
        return payments.sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime());
    }, [orders, usersMap]);

    const filteredPayments = useMemo(() => {
        return allPayments.filter(p => 
            p.orderId.toString().includes(searchTerm) ||
            p.mozoName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.method.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [allPayments, searchTerm]);

    const totalsByMethod = useMemo(() => {
        return filteredPayments.reduce((acc: Record<string, number>, curr) => {
            const method = String(curr.method);
            const currentTotal = acc[method] || 0;
            acc[method] = currentTotal + curr.amount;
            return acc;
        }, {} as Record<string, number>);
    }, [filteredPayments]);

    const totalCollected = (Object.values(totalsByMethod) as number[]).reduce((acc, curr) => acc + curr, 0);

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={(e) => e.stopPropagation()}>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-5xl h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
                    <h3 className="font-semibold text-lg flex items-center gap-2 text-gray-900 dark:text-white">
                        <History className="h-5 w-5 text-orange-500" />
                        Historial de Cobranzas
                    </h3>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"><X className="h-5 w-5" /></button>
                </div>
                
                <div className="p-4 bg-gray-50 dark:bg-gray-900/50 border-b dark:border-gray-700">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <Card className="p-3 bg-white dark:bg-gray-800 border-l-4 border-green-500">
                            <p className="text-xs text-gray-500 uppercase">Total Recaudado</p>
                            <p className="text-xl font-bold text-gray-900 dark:text-white">{formatCurrency(totalCollected)}</p>
                        </Card>
                        {Object.entries(totalsByMethod).map(([method, amount]) => (
                            <Card key={method} className="p-3 bg-white dark:bg-gray-800">
                                <p className="text-xs text-gray-500 uppercase">{method}</p>
                                <p className="text-lg font-semibold text-gray-900 dark:text-white">{formatCurrency(amount as number)}</p>
                            </Card>
                        ))}
                    </div>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input 
                            type="text" 
                            placeholder="Buscar por Pedido, Mozo o Método..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 text-sm border rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-auto p-0">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700/50 sticky top-0">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Fecha</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Nº Pedido</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Método</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Mozo</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Monto</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {filteredPayments.map((payment, idx) => (
                                <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                        <div className="flex flex-col">
                                            <span>{new Date(payment.paymentDate).toLocaleDateString()}</span>
                                            <span className="text-xs opacity-70">{new Date(payment.paymentDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">#{payment.orderId}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs font-semibold text-gray-800 dark:text-gray-200">
                                            {payment.method}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                                        <UserIcon className="h-3 w-3" /> {payment.mozoName}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-gray-900 dark:text-white">
                                        {formatCurrency(payment.amount)}
                                    </td>
                                </tr>
                            ))}
                            {filteredPayments.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                        No se encontraron registros de cobranzas.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export const OrdersPage: React.FC = () => {
    const { orders, user, cancelOrder, customers, createOrder, users, updateOrderStatus } = useAppContext();
    const [searchParams, setSearchParams] = useSearchParams();
    
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<OrderStatus | 'TODOS'>('TODOS');
    const [typeFilter, setTypeFilter] = useState<OrderType | 'TODOS'>('TODOS');
    const [page, setPage] = useState(1);
    const ITEMS_PER_PAGE = 10;

    const [editingOrder, setEditingOrder] = useState<Order | null>(null);
    const [viewingOrder, setViewingOrder] = useState<Order | null>(null);
    const [payingOrder, setPayingOrder] = useState<Order | null>(null);
    const [orderToCancel, setOrderToCancel] = useState<Order | null>(null);
    const [showCollections, setShowCollections] = useState(false);

    const customersMap = useMemo(() => new Map(customers.map(c => [c.id, c])), [customers]);
    const usersMap = useMemo(() => new Map(users.map(u => [u.id, u])), [users]);

    const pendingOrders = useMemo(() => 
        orders.filter(o => o.estado === OrderStatus.PENDIENTE_PAGO).sort((a,b) => a.id - b.id),
    [orders]);

    useEffect(() => {
        const orderIdParam = searchParams.get('orderId');
        if (orderIdParam) {
            const orderId = parseInt(orderIdParam);
            const order = orders.find(o => o.id === orderId);
            if (order) {
                if (order.items.length === 0 && (order.estado === OrderStatus.NUEVO || order.estado === OrderStatus.PENDIENTE_PAGO)) {
                    setEditingOrder(order);
                } else {
                    setViewingOrder(order);
                }
            }
            setSearchParams({});
        }
    }, [searchParams, orders, setSearchParams]);

    const handleCreateOrder = async () => {
        if (!user) return;
        const newOrder = await createOrder({
            customer_id: null,
            tipo: OrderType.PARA_LLEVAR,
            subtotal: 0, 
            descuento: 0,
            impuestos: 0, 
            propina: 0, 
            total: 0, 
            items: [],
            restaurant_id: user.restaurant_id
        });
        if (newOrder) {
            setEditingOrder(newOrder);
        }
    };

    const handleConfirmCancel = async () => {
        if (orderToCancel) {
            await cancelOrder(orderToCancel.id);
            setOrderToCancel(null);
        }
    };

    const filteredOrders = useMemo(() => {
        return orders.filter(order => {
            const matchesStatus = statusFilter === 'TODOS' || order.estado === statusFilter;
            const matchesType = typeFilter === 'TODOS' || order.tipo === typeFilter;
            const customerName = customersMap.get(order.customer_id || '')?.nombre.toLowerCase() || '';
            const matchesSearch = searchTerm === '' || 
                order.id.toString().includes(searchTerm) || 
                customerName.includes(searchTerm.toLowerCase());
            
            return matchesStatus && matchesType && matchesSearch;
        });
    }, [orders, statusFilter, typeFilter, searchTerm, customersMap]);

    const paginatedOrders = filteredOrders.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);
    const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE);

    const canManage = user && [UserRole.ADMIN, UserRole.GERENTE, UserRole.MOZO, UserRole.CAJA].includes(user.rol);
    const canCancel = user && [UserRole.ADMIN, UserRole.GERENTE].includes(user.rol);
    const canSeeCollections = user && [UserRole.ADMIN, UserRole.GERENTE, UserRole.CAJA].includes(user.rol);
    const canEdit = user && [UserRole.ADMIN, UserRole.GERENTE, UserRole.MOZO, UserRole.CAJA].includes(user.rol);

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap justify-between items-center gap-4">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Pedidos</h1>
                <div className="flex items-center gap-2">
                    {canSeeCollections && (
                        <button onClick={() => setShowCollections(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-semibold shadow-sm text-sm">
                            <FileText className="h-4 w-4" /> Historial Cobranzas
                        </button>
                    )}
                    {canManage && (
                        <button onClick={handleCreateOrder} className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 font-semibold shadow-sm text-sm">
                            <PlusCircle className="h-5 w-5" /> Nuevo Pedido
                        </button>
                    )}
                </div>
            </div>

            {pendingOrders.length > 0 && (
                <Card className="bg-purple-50 dark:bg-purple-900/20 border-l-4 border-purple-500">
                    <h2 className="text-lg font-bold text-purple-800 dark:text-purple-200 mb-3 flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 animate-pulse" /> Pedidos Entrantes (Web/App) - Pendientes de Aprobación
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {pendingOrders.map(order => {
                            const customer = customersMap.get(order.customer_id || '');
                            return (
                                <div key={order.id} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border dark:border-gray-700 flex flex-col">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="font-bold text-gray-900 dark:text-white">#{order.id}</span>
                                        <span className="text-xs bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 px-2 py-1 rounded">{formatTimeAgo(order.creado_en)}</span>
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-medium text-sm text-gray-900 dark:text-white">{customer?.nombre || 'Cliente Web'}</p>
                                        <p className="text-xs text-gray-500">{order.tipo}</p>
                                        <p className="font-bold text-lg mt-1 text-gray-900 dark:text-white">{formatCurrency(order.total)}</p>
                                    </div>
                                    <div className="flex gap-2 mt-3">
                                        <button 
                                            onClick={() => setViewingOrder(order)}
                                            className="flex-1 px-2 py-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-xs font-bold rounded text-gray-700 dark:text-gray-200"
                                        >
                                            Ver Detalle
                                        </button>
                                        <button 
                                            onClick={() => {
                                                updateOrderStatus(order.id, OrderStatus.NUEVO);
                                            }}
                                            className="flex-1 px-2 py-1 bg-green-500 hover:bg-green-600 text-white text-xs font-bold rounded flex items-center justify-center gap-1"
                                        >
                                            <CheckCircle className="h-3 w-3"/> Aceptar
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </Card>
            )}

            <Card>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input 
                            type="text" 
                            placeholder="Buscar por ID o Cliente..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                    </div>
                    <select 
                        value={statusFilter} 
                        onChange={(e) => setStatusFilter(e.target.value as any)}
                        className="p-2 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    >
                        <option value="TODOS">Todos los Estados</option>
                        {Object.values(OrderStatus).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <select 
                        value={typeFilter} 
                        onChange={(e) => setTypeFilter(e.target.value as any)}
                        className="p-2 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    >
                        <option value="TODOS">Todos los Tipos</option>
                        {Object.values(OrderType).map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700/50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">ID</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Tipo</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Cliente / Mesa</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Responsable</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Estado</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Total</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Hora</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {paginatedOrders.map(order => {
                                const customer = customersMap.get(order.customer_id || '');
                                const totalPaid = order.payments?.reduce((sum: number, p: any) => sum + (Number(p.amount) || 0), 0) || 0;
                                const isPaid = totalPaid >= order.total;
                                
                                let assignedStaff = null;
                                if (order.tipo === OrderType.SALA && order.mozo_id) {
                                    assignedStaff = usersMap.get(order.mozo_id);
                                } else if (order.tipo === OrderType.DELIVERY && order.repartidor_id) {
                                    assignedStaff = usersMap.get(order.repartidor_id);
                                }
                                
                                const isEntregado = order.estado === OrderStatus.ENTREGADO;
                                const canEditOrder = !isEntregado && (order.estado === OrderStatus.NUEVO || order.estado === OrderStatus.PENDIENTE_PAGO);
                                const isCancellable = !isEntregado && order.estado !== OrderStatus.CANCELADO;

                                return (
                                    <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer" onClick={() => setViewingOrder(order)}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 dark:text-white">#{order.id}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <div className="flex items-center gap-2">
                                                {React.createElement(ORDER_TYPE_ICONS[order.tipo], { className: "h-4 w-4 text-gray-500" })}
                                                <span className="text-gray-700 dark:text-gray-300">{order.tipo}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <div className="flex flex-col">
                                                <span className="font-medium text-gray-900 dark:text-white">{customer?.nombre || 'Consumidor Final'}</span>
                                                {order.table_id && <span className="text-xs text-gray-500">Mesa {order.table_id}</span>}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            {assignedStaff ? (
                                                <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                                                    {order.tipo === OrderType.DELIVERY ? <Bike className="h-3 w-3"/> : <UserIcon className="h-3 w-3"/>}
                                                    <span>{assignedStaff.nombre}</span>
                                                </div>
                                            ) : (
                                                <span className="text-gray-400 text-xs italic">Sin asignar</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${ORDER_STATUS_COLORS[order.estado]} text-white`}>
                                                {order.estado}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 dark:text-white">
                                            {formatCurrency(order.total)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                            {formatTimeAgo(order.creado_en)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex justify-end items-center space-x-2">
                                                {isPaid ? (
                                                    <span className="font-bold text-green-600 bg-green-100 dark:bg-green-900/30 px-3 py-1 rounded-md text-xs flex items-center gap-1 border border-green-200 dark:border-green-800 cursor-default select-none">
                                                        <CheckCircle className="h-3 w-3"/> Pagado
                                                    </span>
                                                ) : order.estado !== OrderStatus.CANCELADO && (
                                                    <button onClick={(e) => { e.stopPropagation(); setPayingOrder(order); }} className="font-semibold text-white bg-green-500 hover:bg-green-600 px-3 py-1 rounded-md text-xs flex items-center gap-1 shadow-sm transition-colors">
                                                        <DollarSign className="h-3 w-3"/> Pagar
                                                    </button>
                                                )}

                                                {isEntregado ? (
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); setViewingOrder(order); }}
                                                        className="text-gray-600 hover:text-gray-900 bg-gray-100 dark:bg-gray-700 dark:text-gray-300 px-3 py-1 rounded-md text-xs font-semibold"
                                                    >
                                                        Ver
                                                    </button>
                                                ) : canEdit && canEditOrder ? (
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); setEditingOrder(order); }} 
                                                        className="text-orange-600 hover:text-orange-900 bg-orange-100 dark:bg-orange-900/30 px-3 py-1 rounded-md text-xs font-semibold">
                                                        Editar
                                                    </button>
                                                ) : (
                                                    !isEntregado && (
                                                        <button onClick={(e) => { e.stopPropagation(); setViewingOrder(order); }} className="text-blue-600 hover:text-blue-900 bg-blue-100 dark:bg-blue-900/30 px-3 py-1 rounded-md text-xs font-semibold">Ver</button>
                                                    )
                                                )}
                                                
                                                {canCancel && isCancellable && (
                                                     <button
                                                        onClick={(e) => { e.stopPropagation(); setOrderToCancel(order); }}
                                                        className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20"
                                                        title="Cancelar Pedido"
                                                    >
                                                        <Ban className="h-4 w-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-4 border-t dark:border-gray-700 pt-4">
                        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-4 py-2 border rounded disabled:opacity-50 dark:text-white">Anterior</button>
                        <span className="dark:text-gray-300">Página {page} de {totalPages}</span>
                        <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-4 py-2 border rounded disabled:opacity-50 dark:text-white">Siguiente</button>
                    </div>
                )}
            </Card>

            {editingOrder && <OrderEditorModal order={editingOrder} onClose={() => setEditingOrder(null)} />}
            {payingOrder && <PaymentModal order={payingOrder} onClose={() => setPayingOrder(null)} onPaymentSuccess={() => {}} />}
            {viewingOrder && <OrderDetailsModal order={viewingOrder} onClose={() => setViewingOrder(null)} onEdit={() => { setViewingOrder(null); setEditingOrder(viewingOrder); }} onPay={() => { setViewingOrder(null); setPayingOrder(viewingOrder); }} />}
            {orderToCancel && <CancelConfirmModal order={orderToCancel} onClose={() => setOrderToCancel(null)} onConfirm={handleConfirmCancel} />}
            {showCollections && <CollectionsHistoryModal onClose={() => setShowCollections(false)} />}
        </div>
    );
};
