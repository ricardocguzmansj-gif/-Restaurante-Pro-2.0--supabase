import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Card } from '../components/ui/Card';
import { useAppContext } from '../contexts/AppContext';
import { Order, OrderStatus, OrderType, Customer } from '../types';
import { formatTimeAgo } from '../utils';
import { Clock, ShoppingCart, ChefHat, ShieldCheck } from 'lucide-react';
import { GIC_COLUMNS, ORDER_STATUS_COLORS, ORDER_TYPE_ICONS } from '../constants';

const KdsCard: React.FC<{ 
  order: Order; 
  onDragStart: (e: React.DragEvent<HTMLDivElement>, orderId: number) => void;
  customer: Customer | null;
  prepTime: number;
}> = ({ order, onDragStart, customer, prepTime }) => {
  const { updateOrderStatus } = useAppContext();
  const [time, setTime] = useState(formatTimeAgo(order.creado_en));
  
  useEffect(() => {
    const interval = setInterval(() => {
      setTime(formatTimeAgo(order.creado_en));
    }, 1000);
    return () => clearInterval(interval);
  }, [order.creado_en]);

  const TypeIcon = ORDER_TYPE_ICONS[order.tipo] || ShoppingCart;

  const handleClick = () => {
    if (order.estado === OrderStatus.LISTO) {
      if (order.tipo === OrderType.SALA || order.tipo === OrderType.DELIVERY) {
        updateOrderStatus(order.id, OrderStatus.PENDIENTE_PAGO);
      } else { // PARA_LLEVAR
        updateOrderStatus(order.id, OrderStatus.ENTREGADO);
      }
    }
  };
  
  const cardClasses = `bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-4 border-l-4 ${order.estado === OrderStatus.LISTO ? 'cursor-pointer hover:shadow-lg transform hover:-translate-y-1 transition-all' : 'cursor-grab active:cursor-grabbing'}`;
  const customerName = customer?.nombre || 'Genérico';

  return (
    <div 
      draggable 
      onClick={handleClick}
      onDragStart={(e) => onDragStart(e, order.id)}
      className={cardClasses}
      style={{ borderLeftColor: ORDER_STATUS_COLORS[order.estado].replace('bg-', '') }}
    >
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-bold text-xl text-gray-900 dark:text-white">#{order.id}</h3>
        <div className="flex items-center space-x-2">
          <TypeIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          <span className="text-sm font-medium text-gray-600 dark:text-gray-300">{order.tipo}</span>
        </div>
      </div>
       <div className="mb-3 text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
          <span className="font-semibold">Cliente:</span>
          {customer?.is_verified && <span title="Cliente Verificado"><ShieldCheck className="h-4 w-4 text-green-500"/></span>}
          <span>{customerName}</span>
      </div>
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
      <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400 border-t dark:border-gray-700 pt-2 mt-2">
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
      className="flex-1 min-w-[300px] h-full bg-gray-200 dark:bg-gray-800/50 rounded-lg p-3"
    >
      <div className={`flex items-center mb-4 pb-2 border-b-2`} style={{ borderBottomColor: ORDER_STATUS_COLORS[status].replace('bg-', '') }}>
        <div className={`w-3 h-3 rounded-full mr-3 ${ORDER_STATUS_COLORS[status]}`}></div>
        <h2 className="font-bold text-lg uppercase text-gray-700 dark:text-gray-300">{status}</h2>
        <span className="ml-2 bg-gray-300 dark:bg-gray-700 text-gray-600 dark:text-gray-200 text-sm font-semibold px-2 py-0.5 rounded-full">{React.Children.count(children)}</span>
      </div>
      <div className="h-[calc(100%-40px)] overflow-y-auto pr-1">
        {children}
        {React.Children.count(children) === 0 && <div className="text-center text-gray-500 pt-10">No hay pedidos.</div>}
      </div>
    </div>
  );
};


export const KdsPage: React.FC = () => {
    const { orders, updateOrderStatus, customers, menuItems } = useAppContext();
    const notificationSound = useRef<HTMLAudioElement | null>(null);

    const customersMap = useMemo(() => new Map(customers.map(c => [c.id, c])), [customers]);
    const menuItemsMap = useMemo(() => new Map(menuItems.map(item => [item.id, item])), [menuItems]);

    useEffect(() => {
        notificationSound.current = new Audio('https://cdn.pixabay.com/audio/2022/03/15/audio_2c244a341b.mp3');
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
                notificationSound.current.play().catch(err => console.error("Error al reproducir sonido:", err));
            }
        }
    };
    
    return (
        <div className="h-full flex flex-col">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Gestión Integral de Cocina (GIC)</h1>
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
                        return (
                          <KdsCard 
                            key={order.id} 
                            order={order} 
                            onDragStart={onDragStart} 
                            customer={customer}
                            prepTime={prepTime}
                          />
                        )
                      })}
                    </KdsColumn>
                ))}
            </div>
        </div>
    );
};