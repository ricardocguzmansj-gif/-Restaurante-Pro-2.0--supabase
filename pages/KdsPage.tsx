
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../contexts/AppContext';
import { Order, OrderStatus, OrderType, Customer, User, UserRole } from '../types';
import { formatTimeAgo, formatCurrency } from '../utils';
import { Clock, ShoppingCart, ChefHat, ShieldCheck, User as UserIcon, Bike, DollarSign, Send, AlertTriangle } from 'lucide-react';
import { GIC_COLUMNS, ORDER_STATUS_COLORS, ORDER_TYPE_ICONS, NOTIFICATION_SOUND } from '../constants';

const KdsCard: React.FC<{ 
  order: Order; 
  onDragStart: (e: React.DragEvent<HTMLDivElement>, orderId: number) => void;
  customer: Customer | null;
  prepTime: number;
  assignedStaff: User | null;
}> = ({ order, onDragStart, customer, prepTime, assignedStaff }) => {
  const { updateOrderStatus, users, assignRepartidor } = useAppContext();
  const navigate = useNavigate();
  const [time, setTime] = useState(formatTimeAgo(order.creado_en));
  
  useEffect(() => {
    const interval = setInterval(() => {
      setTime(formatTimeAgo(order.creado_en));
    }, 1000);
    return () => clearInterval(interval);
  }, [order.creado_en]);

  const TypeIcon = ORDER_TYPE_ICONS[order.tipo] || ShoppingCart;

  // Payment Check
  const totalPaid = order.payments?.reduce((sum, p: any) => sum + (Number(p.amount) || 0), 0) || 0;
  const isPaid = totalPaid >= order.total;
  const pendingAmount = order.total - totalPaid;

  // Available Drivers
  const availableDrivers = useMemo(() => 
    users.filter(u => u.rol === UserRole.REPARTO && u.estado_delivery === 'DISPONIBLE'),
  [users]);

  const handleAssignDriver = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const driverId = e.target.value;
      if (driverId) {
          assignRepartidor(order.id, driverId);
      }
  };

  const goToPayment = (e: React.MouseEvent) => {
      e.stopPropagation();
      navigate(`/pedidos?orderId=${order.id}`);
  };

  const cardClasses = `bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-4 border-l-4 relative group`;
  const customerName = customer?.nombre || 'Genérico';

  return (
    <div 
      draggable 
      onDragStart={(e) => onDragStart(e, order.id)}
      className={cardClasses}
      style={{ borderLeftColor: ORDER_STATUS_COLORS[order.estado].replace('bg-', '') }}
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-bold text-xl text-gray-900 dark:text-white">#{order.id}</h3>
        <div className="flex items-center space-x-2">
          <TypeIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          <span className="text-sm font-medium text-gray-600 dark:text-gray-300">{order.tipo}</span>
        </div>
      </div>

      {/* Customer Info */}
       <div className="mb-2 text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
          <span className="font-semibold">Cliente:</span>
          {customer?.is_verified && <span title="Cliente Verificado"><ShieldCheck className="h-4 w-4 text-green-500"/></span>}
          <span className="truncate max-w-[150px]">{customerName}</span>
      </div>

      {/* Assigned Staff Label */}
      {assignedStaff && (
          <div className="mb-3 text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 bg-gray-100 dark:bg-gray-700 p-1 rounded w-fit">
              {order.tipo === OrderType.DELIVERY ? <Bike className="h-3 w-3"/> : <UserIcon className="h-3 w-3"/>}
              <span className="font-medium">{assignedStaff.nombre}</span>
          </div>
      )}

      {/* Items List */}
      <div className="mb-3">
        <ul className="space-y-1.5 text-sm">
          {order.items.map(item => (
            <li key={item.id}>
              <div className="flex">
                  <span className="text-gray-800 dark:text-gray-200 font-medium mr-2">{item.cantidad}x</span>
                  <span className="text-gray-700 dark:text-gray-300 flex-1">{item.nombre_item_snapshot}</span>
              </div>
              {item.notes && (
                  <p className="pl-6 text-sm text-yellow-700 dark:text-yellow-400 font-semibold italic">
                      &rdsh; {item.notes}
                  </p>
              )}
            </li>
          ))}
        </ul>
      </div>

      {/* Payment Status Warning */}
      {!isPaid && (
          <div className="mb-3 p-2 bg-red-100 dark:bg-red-900/30 rounded border border-red-200 dark:border-red-800 flex items-center justify-between animate-pulse">
              <div className="flex items-center text-red-700 dark:text-red-300 text-xs font-bold">
                  <AlertTriangle className="h-3 w-3 mr-1"/> DEBE
              </div>
              <div className="text-xs font-bold text-red-700 dark:text-red-300">
                  {formatCurrency(pendingAmount)}
              </div>
          </div>
      )}

      {/* --- ACCIONES PARA ESTADO 'LISTO' --- */}
      {order.estado === OrderStatus.LISTO && (
          <div className="mt-3 pt-3 border-t dark:border-gray-700 space-y-2">
              
              {/* LÓGICA DELIVERY: Asignar Repartidor es crucial aquí */}
              {order.tipo === OrderType.DELIVERY && (
                  <div className="animate-fade-in-down">
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Asignar Repartidor</label>
                        <div className="flex gap-2">
                            <select 
                                className="flex-1 text-sm border rounded p-2 bg-white dark:bg-gray-700 dark:border-gray-600"
                                onChange={handleAssignDriver}
                                defaultValue=""
                            >
                                <option value="" disabled>Seleccionar...</option>
                                {availableDrivers.map(d => (
                                    <option key={d.id} value={d.id}>{d.nombre}</option>
                                ))}
                            </select>
                        </div>
                        {availableDrivers.length === 0 && <p className="text-xs text-orange-500 mt-1">No hay repartidores disponibles.</p>}
                    </div>
              )}

              {/* LÓGICA PARA LLEVAR / SALA */}
              {order.tipo !== OrderType.DELIVERY && (
                  <div className="flex gap-2">
                     {!isPaid && (
                        <button 
                            onClick={goToPayment}
                            className="flex-1 py-2 px-3 bg-red-600 text-white rounded text-xs font-bold hover:bg-red-700 flex items-center justify-center gap-2 shadow-sm"
                        >
                            <DollarSign className="h-4 w-4" /> Cobrar
                        </button>
                     )}
                     <button 
                        onClick={(e) => { e.stopPropagation(); updateOrderStatus(order.id, OrderStatus.ENTREGADO); }}
                        className="flex-1 py-2 px-3 bg-green-600 text-white rounded text-xs font-bold hover:bg-green-700 flex items-center justify-center gap-2"
                    >
                        <Send className="h-3 w-3" /> Entregar
                    </button>
                  </div>
              )}
          </div>
      )}

      {/* Footer Info */}
      <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400 pt-2 mt-2">
        <div className="flex items-center">
          <Clock className="h-4 w-4 mr-1.5" />
          <span>{time}</span>
        </div>
        {prepTime > 0 && (
        <div className="flex items-center font-semibold">
            <ChefHat className="h-4 w-4 mr-1.5" />
            <span>~{prepTime} min</span>
        </div>
        )}
      </div>
    </div>
  );
};

const KdsColumn: React.FC<{ status: OrderStatus; children: React.ReactNode; onDrop: (e: React.DragEvent<HTMLDivElement>, status: OrderStatus) => void }> = ({ status, children, onDrop }) => {
  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };
  
  return (
    <div
      onDrop={(e) => onDrop(e, status)}
      onDragOver={onDragOver}
      className="flex-1 min-w-[320px] h-full bg-gray-200 dark:bg-gray-800/50 rounded-lg p-3 flex flex-col"
    >
      <div className={`flex items-center mb-4 pb-2 border-b-2`} style={{ borderBottomColor: ORDER_STATUS_COLORS[status].replace('bg-', '') }}>
        <div className={`w-3 h-3 rounded-full mr-3 ${ORDER_STATUS_COLORS[status]}`}></div>
        <h2 className="font-bold text-lg uppercase text-gray-700 dark:text-gray-300">{status}</h2>
        <span className="ml-2 bg-gray-300 dark:bg-gray-700 text-gray-600 dark:text-gray-200 text-sm font-semibold px-2 py-0.5 rounded-full">{React.Children.count(children)}</span>
      </div>
      <div className="flex-1 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-gray-400 dark:scrollbar-thumb-gray-600">
        {children}
        {React.Children.count(children) === 0 && <div className="text-center text-gray-500 pt-10">Sin pedidos.</div>}
      </div>
    </div>
  );
};


export const KdsPage: React.FC = () => {
    const { orders, updateOrderStatus, customers, menuItems, users } = useAppContext();
    const notificationSound = useRef<HTMLAudioElement | null>(null);

    const customersMap = useMemo(() => new Map(customers.map(c => [c.id, c])), [customers]);
    const menuItemsMap = useMemo(() => new Map(menuItems.map(item => [item.id, item])), [menuItems]);
    const usersMap = useMemo(() => new Map(users.map(u => [u.id, u])), [users]);

    useEffect(() => {
        notificationSound.current = new Audio(NOTIFICATION_SOUND);
        notificationSound.current.load();
    }, []);

    const onDragStart = (e: React.DragEvent<HTMLDivElement>, orderId: number) => {
        e.dataTransfer.setData("orderId", orderId.toString());
    };

    const onDrop = (e: React.DragEvent<HTMLDivElement>, newStatus: OrderStatus) => {
        const orderId = parseInt(e.dataTransfer.getData("orderId"), 10);
        const order = orders.find(o => o.id === orderId);

        if (order && order.estado !== newStatus) {
            updateOrderStatus(orderId, newStatus);
            if (newStatus === OrderStatus.LISTO && notificationSound.current) {
                notificationSound.current.play().catch(err => console.warn("Sonido bloqueado", err));
            }
        }
    };
    
    return (
        <div className="h-full flex flex-col">
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Gestión Integral de Cocina (GIC)</h1>
                <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1 text-xs font-medium px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-full">
                        <ChefHat className="h-4 w-4"/> Solo pedidos confirmados
                    </span>
                </div>
            </div>
            
            <div className="flex-1 flex gap-4 overflow-x-auto pb-4">
                {GIC_COLUMNS.map(status => (
                    <KdsColumn
                        key={status}
                        status={status}
                        onDrop={onDrop}
                    >
                      {orders
                        .filter(o => o.estado === status)
                        .sort((a, b) => a.id - b.id)
                        .map(order => {
                        const customer = order.customer_id ? customersMap.get(order.customer_id) : null;
                        const prepTime = Math.max(0, ...order.items.map(item => menuItemsMap.get(item.menu_item_id)?.tiempo_preparacion_min || 0));
                        
                        let assignedStaff = null;
                        if (order.tipo === OrderType.SALA && order.mozo_id) {
                            assignedStaff = usersMap.get(order.mozo_id) || null;
                        } else if (order.tipo === OrderType.DELIVERY && order.repartidor_id) {
                            assignedStaff = usersMap.get(order.repartidor_id) || null;
                        }

                        return (
                          <KdsCard 
                            key={order.id} 
                            order={order} 
                            onDragStart={onDragStart} 
                            customer={customer}
                            prepTime={prepTime}
                            assignedStaff={assignedStaff}
                          />
                        )
                      })}
                    </KdsColumn>
                ))}
            </div>
        </div>
    );
};
