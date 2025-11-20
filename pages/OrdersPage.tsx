
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { useAppContext } from '../contexts/AppContext';
import { formatCurrency, formatDate, formatTimeAgo } from '../utils';
import { PlusCircle, Search, X, Minus, Plus, MapPin, Truck, UserCheck, Clock, List, LayoutGrid, CreditCard, QrCode, Smartphone, DollarSign, MessageSquare, Split, Pencil, ShieldCheck, AlertTriangle, Eye, Filter, Calendar, Navigation } from 'lucide-react';
import { Order, OrderStatus, UserRole, OrderType, MenuItem as MenuItemType, OrderItem, Customer, PaymentDetails, User } from '../types';
import { ORDER_STATUS_COLORS } from '../constants';

const CancelConfirmModal: React.FC<{
    order: Order;
    onClose: () => void;
    onConfirm: () => void;
}> = ({ order, onClose, onConfirm }) => {
    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
                <div className="p-6 text-center">
                    <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                    <h3 className="font-semibold text-lg mb-2">Confirmar Cancelación</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                        ¿Seguro que quieres cancelar el pedido #<strong>{order.id}</strong>? Esta acción es irreversible. El stock será devuelto al inventario y se liberarán los recursos asociados.
                    </p>
                    <div className="flex gap-4">
                        <button onClick={onClose} className="w-full py-2 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                            No, volver
                        </button>
                        <button onClick={onConfirm} className="w-full py-2 bg-red-500 text-white rounded-lg hover:bg-red-600">
                            Sí, cancelar pedido
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const OrderDetailsModal: React.FC<{ order: Order; onClose: () => void }> = ({ order, onClose }) => {
    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
                <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white">Detalles del Pedido #{order.id}</h3>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"><X className="h-5 w-5" /></button>
                </div>
                <div className="p-6 max-h-[60vh] overflow-y-auto">
                    <ul className="space-y-4">
                        {order.items.map((item) => (
                            <li key={item.id} className="flex flex-col pb-3 border-b dark:border-gray-700 last:border-0 last:pb-0">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-start gap-3">
                                        <span className="flex-shrink-0 bg-orange-100 text-orange-800 text-xs font-medium px-2.5 py-0.5 rounded dark:bg-orange-900 dark:text-orange-300">
                                            x{item.cantidad}
                                        </span>
                                        <div>
                                            <p className="text-sm font-medium text-gray-900 dark:text-white">{item.nombre_item_snapshot}</p>
                                            {item.notes && (
                                                <p className="text-xs text-gray-500 dark:text-gray-400 italic mt-1">
                                                    Nota: {item.notes}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                        {formatCurrency(item.total_item)}
                                    </span>
                                </div>
                            </li>
                        ))}
                    </ul>
                    <div className="mt-6 pt-4 border-t dark:border-gray-700 space-y-2">
                        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                            <span>Subtotal</span>
                            <span>{formatCurrency(order.subtotal)}</span>
                        </div>
                        {order.descuento > 0 && (
                             <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
                                <span>Descuento</span>
                                <span>-{formatCurrency(order.descuento)}</span>
                            </div>
                        )}
                        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                            <span>Impuestos</span>
                            <span>{formatCurrency(order.impuestos)}</span>
                        </div>
                         {order.propina > 0 && (
                             <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                                <span>Propina</span>
                                <span>{formatCurrency(order.propina)}</span>
                            </div>
                        )}
                        <div className="flex justify-between text-base font-bold text-gray-900 dark:text-white pt-2 border-t dark:border-gray-700 mt-2">
                            <span>Total</span>
                            <span>{formatCurrency(order.total)}</span>
                        </div>
                    </div>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-b-lg text-right">
                     <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700">
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
};


const CreateOrderModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { processedMenuItems, customers, createOrder, showToast, tables, restaurantSettings } = useAppContext();
    const [searchTerm, setSearchTerm] = useState('');
    const [cart, setCart] = useState<OrderItem[]>([]);
    const [orderType, setOrderType] = useState<OrderType>(OrderType.SALA);
    const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);
    const [selectedTable, setSelectedTable] = useState<string>('');
    const [isSaving, setIsSaving] = useState(false);
    const [editingNoteFor, setEditingNoteFor] = useState<string | null>(null);

    const availableTables = useMemo(() => tables.filter(t => t.estado === 'LIBRE'), [tables]);
    
    useEffect(() => {
        if (orderType === OrderType.SALA) {
            setSelectedCustomer(null);
            if (availableTables.length > 0) {
                setSelectedTable(String(availableTables[0].id));
            } else {
                setSelectedTable('');
            }
        } else {
            setSelectedTable('');
        }
    }, [orderType, availableTables]);

    const selectableCustomers = useMemo(() => {
        if (orderType === OrderType.DELIVERY) {
            return customers.filter(c => c.is_verified);
        }
        return customers;
    }, [orderType, customers]);

    useEffect(() => {
        if (orderType === OrderType.DELIVERY && selectedCustomer) {
            const customer = customers.find(c => c.id === selectedCustomer);
            if (customer && !customer.is_verified) {
                setSelectedCustomer(null);
                showToast("Cliente deseleccionado. No está verificado para delivery.", "error");
            }
        }
    }, [orderType, selectedCustomer, customers, showToast]);


    const filteredMenuItems = searchTerm
        ? processedMenuItems.filter(item => item.nombre.toLowerCase().includes(searchTerm.toLowerCase()) && item.disponible)
        : processedMenuItems.filter(item => item.disponible).slice(0, 10);

    const addToCart = (item: MenuItemType) => {
        setCart(currentCart => {
            const existingItem = currentCart.find(ci => ci.menu_item_id === item.id && !ci.notes); // Only group if no notes
            if (existingItem) {
                return currentCart.map(ci =>
                    ci.id === existingItem.id ? { ...ci, cantidad: ci.cantidad + 1, total_item: (ci.cantidad + 1) * ci.precio_unitario } : ci
                );
            }
            return [...currentCart, {
                id: `cart-${item.id}-${Date.now()}`,
                menu_item_id: item.id,
                nombre_item_snapshot: item.nombre,
                precio_unitario: item.precio_base,
                cantidad: 1,
                total_item: item.precio_base,
                notes: ''
            }];
        });
    };
    
    const updateQuantity = (cartItemId: string, newQuantity: number) => {
        setCart(currentCart => {
            if (newQuantity <= 0) {
                return currentCart.filter(item => item.id !== cartItemId);
            }
            return currentCart.map(item =>
                item.id === cartItemId ? { ...item, cantidad: newQuantity, total_item: newQuantity * item.precio_unitario } : item
            );
        });
    };
    
    const handleNoteChange = (cartItemId: string, notes: string) => {
        setCart(cart => cart.map(item => item.id === cartItemId ? { ...item, notes } : item));
    };


    const { subtotal, impuestos, total } = useMemo(() => {
        const currentSubtotal = cart.reduce((sum, item) => sum + item.total_item, 0);
        if (!restaurantSettings) return { subtotal: currentSubtotal, impuestos: 0, total: currentSubtotal };

        const taxRate = restaurantSettings.iva_rate / 100;
        let taxAmount = 0;
        if (restaurantSettings.precios_con_iva) {
            const base = currentSubtotal / (1 + taxRate);
            taxAmount = base * taxRate;
            return { subtotal: currentSubtotal, impuestos: taxAmount, total: currentSubtotal };
        } else {
            taxAmount = currentSubtotal * taxRate;
            return { subtotal: currentSubtotal, impuestos: taxAmount, total: currentSubtotal + taxAmount };
        }
    }, [cart, restaurantSettings]);
    
    const handleSaveOrder = async () => {
        if(cart.length === 0) {
            showToast("El carrito está vacío.", "error");
            return;
        }

        if (orderType === OrderType.SALA && !selectedTable) {
            showToast("Selecciona una mesa libre para pedidos en SALA.", "error");
            return;
        }
        
        if (orderType === OrderType.DELIVERY && !selectedCustomer) {
            showToast("Selecciona un cliente con dirección para pedidos a domicilio.", "error");
            return;
        }
        
        setIsSaving(true);
        const orderData = {
            customer_id: orderType === OrderType.SALA ? null : selectedCustomer,
            table_id: orderType === OrderType.SALA ? parseInt(selectedTable, 10) : undefined,
            tipo: orderType,
            subtotal,
            descuento: 0,
            impuestos,
            propina: 0,
            total,
            items: cart,
            restaurant_id: 'rest-pizarra-01', // demo id
        };
        await createOrder(orderData);
        setIsSaving(false);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
                    <h2 className="text-xl font-bold">Crear Nuevo Pedido</h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                        <X className="h-5 w-5" />
                    </button>
                </div>
                <div className="flex-1 flex overflow-hidden">
                    {/* Left side: Menu */}
                    <div className="w-1/2 p-4 flex flex-col border-r dark:border-gray-700">
                        <input
                            type="text"
                            placeholder="Buscar producto..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-4 py-2 mb-4 text-sm text-gray-700 bg-gray-100 dark:bg-gray-700 dark:text-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                        <ul className="flex-1 overflow-y-auto space-y-2 pr-2">
                            {filteredMenuItems.map(item => (
                                <li key={item.id} onClick={() => addToCart(item)} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg flex justify-between items-center cursor-pointer hover:bg-orange-100 dark:hover:bg-orange-900/40">
                                    <div>
                                        <p className="font-semibold">{item.nombre}</p>
                                        <p className="text-sm text-gray-500">{formatCurrency(item.precio_base)}</p>
                                    </div>
                                    <PlusCircle className="h-5 w-5 text-orange-500"/>
                                </li>
                            ))}
                        </ul>
                    </div>
                    {/* Right side: Cart */}
                    <div className="w-1/2 p-4 flex flex-col">
                        <h3 className="text-lg font-semibold mb-3">Resumen del Pedido</h3>
                        <div className="flex-1 overflow-y-auto pr-2">
                            {cart.length === 0 ? (
                                <div className="text-center text-gray-500 pt-16">El carrito está vacío. Añade productos desde el menú.</div>
                            ) : (
                                <ul className="space-y-3">
                                    {cart.map(item => (
                                        <li key={item.id} className="flex flex-col">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="font-medium text-sm">{item.nombre_item_snapshot}</p>
                                                    <p className="text-xs text-gray-500">{formatCurrency(item.precio_unitario)}</p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <button onClick={() => updateQuantity(item.id, item.cantidad - 1)} className="p-1 rounded-full bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500"><Minus className="h-3 w-3"/></button>
                                                    <span className="font-bold w-4 text-center">{item.cantidad}</span>
                                                    <button onClick={() => updateQuantity(item.id, item.cantidad + 1)} className="p-1 rounded-full bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500"><Plus className="h-3 w-3"/></button>
                                                    <span className="text-sm font-semibold w-16 text-right">{formatCurrency(item.total_item)}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 mt-1.5">
                                                <button onClick={() => setEditingNoteFor(prev => prev === item.id ? null : item.id)} className={`p-1 rounded-full ${editingNoteFor === item.id ? 'bg-orange-100 dark:bg-orange-900/50' : ''}`}>
                                                    <Pencil className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400" />
                                                </button>
                                                {editingNoteFor === item.id ? (
                                                    <input
                                                        type="text"
                                                        value={item.notes}
                                                        onChange={(e) => handleNoteChange(item.id, e.target.value)}
                                                        onBlur={() => setEditingNoteFor(null)}
                                                        placeholder="Ej: Sin cebolla, Alergia..."
                                                        autoFocus
                                                        className="w-full text-xs px-2 py-1 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-md"
                                                    />
                                                ) : item.notes ? (
                                                    <p className="text-xs text-orange-600 dark:text-orange-400 truncate italic cursor-pointer" onClick={() => setEditingNoteFor(item.id)}>"{item.notes}"</p>
                                                ): null}
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                        <div className="border-t dark:border-gray-700 pt-4 space-y-3 text-sm">
                             <div className="flex gap-2">
                                <select value={orderType} onChange={e => setOrderType(e.target.value as OrderType)} className="w-full px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 rounded-lg border-transparent focus:outline-none focus:ring-2 focus:ring-orange-500">
                                    {Object.values(OrderType).map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                                {orderType === OrderType.SALA ? (
                                    <select value={selectedTable} onChange={e => setSelectedTable(e.target.value)} disabled={availableTables.length === 0} className="w-full px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 rounded-lg border-transparent focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50">
                                        {availableTables.length > 0 ? (
                                            availableTables.map(t => <option key={t.id} value={t.id}>Mesa {t.id}</option>)
                                        ) : (
                                            <option value="">No hay mesas libres</option>
                                        )}
                                    </select>
                                ) : (
                                    <select value={selectedCustomer || ''} onChange={e => setSelectedCustomer(e.target.value || null)} className="w-full px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 rounded-lg border-transparent focus:outline-none focus:ring-2 focus:ring-orange-500">
                                        <option value="">Cliente Genérico</option>
                                        {selectableCustomers.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                                    </select>
                                )}
                            </div>
                            <div className="flex justify-between"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
                            <div className="flex justify-between"><span>Impuestos (IVA {restaurantSettings?.iva_rate}%)</span><span>{formatCurrency(impuestos)}</span></div>
                            <div className="flex justify-between font-bold text-base"><span>Total</span><span>{formatCurrency(total)}</span></div>
                             <button
                                onClick={handleSaveOrder}
                                disabled={cart.length === 0 || isSaving}
                                className="w-full mt-2 px-4 py-3 text-sm font-semibold text-white bg-orange-500 rounded-lg hover:bg-orange-600 disabled:bg-orange-300 dark:disabled:bg-orange-800 disabled:cursor-not-allowed"
                            >
                                {isSaving ? 'Guardando...' : 'Crear Pedido'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const EditOrderModal: React.FC<{ order: Order; onClose: () => void }> = ({ order, onClose }) => {
    const { processedMenuItems, customers, updateOrder, showToast, restaurantSettings } = useAppContext();
    const [cart, setCart] = useState<OrderItem[]>(() => JSON.parse(JSON.stringify(order.items))); // Deep copy
    const [orderType, setOrderType] = useState<OrderType>(order.tipo);
    const [selectedCustomer, setSelectedCustomer] = useState<string | null>(order.customer_id);
    const [isSaving, setIsSaving] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [editingNoteFor, setEditingNoteFor] = useState<string | null>(null);

    const isSalaOrder = order.tipo === OrderType.SALA;

    const selectableCustomers = useMemo(() => {
        if (orderType === OrderType.DELIVERY) {
            return customers.filter(c => c.is_verified);
        }
        return customers;
    }, [orderType, customers]);

    useEffect(() => {
        if (orderType === OrderType.DELIVERY && selectedCustomer) {
            const customer = customers.find(c => c.id === selectedCustomer);
            if (customer && !customer.is_verified) {
                setSelectedCustomer(null);
                showToast("Cliente deseleccionado. No está verificado para delivery.", "error");
            }
        }
    }, [orderType, selectedCustomer, customers, showToast]);


    const filteredMenuItems = searchTerm
        ? processedMenuItems.filter(item => item.nombre.toLowerCase().includes(searchTerm.toLowerCase()) && item.disponible)
        : processedMenuItems.filter(item => item.disponible).slice(0, 10);

    const addToCart = (item: MenuItemType) => {
        setCart(currentCart => {
            const existingItem = currentCart.find(ci => ci.menu_item_id === item.id && !ci.notes);
            if (existingItem) {
                return currentCart.map(ci =>
                    ci.id === existingItem.id ? { ...ci, cantidad: ci.cantidad + 1, total_item: (ci.cantidad + 1) * ci.precio_unitario } : ci
                );
            }
            return [...currentCart, {
                id: `cart-${item.id}-${Date.now()}`,
                menu_item_id: item.id,
                nombre_item_snapshot: item.nombre,
                precio_unitario: item.precio_base,
                cantidad: 1,
                total_item: item.precio_base,
                notes: ''
            }];
        });
    };
    
    const updateQuantity = (cartItemId: string, newQuantity: number) => {
        if (newQuantity <= 0) {
            setCart(currentCart => currentCart.filter(item => item.id !== cartItemId));
        } else {
            setCart(currentCart => currentCart.map(item =>
                item.id === cartItemId ? { ...item, cantidad: newQuantity, total_item: newQuantity * item.precio_unitario } : item
            ));
        }
    };
    
    const handleNoteChange = (cartItemId: string, notes: string) => {
        setCart(cart => cart.map(item => item.id === cartItemId ? { ...item, notes } : item));
    };


    const { subtotal, impuestos, total } = useMemo(() => {
        const currentSubtotal = cart.reduce((sum, item) => sum + item.total_item, 0);
        if (!restaurantSettings) return { subtotal: currentSubtotal, impuestos: 0, total: currentSubtotal };

        const taxRate = restaurantSettings.iva_rate / 100;
        let taxAmount = 0;
        let finalTotal = currentSubtotal;

        if (restaurantSettings.precios_con_iva) {
            const base = currentSubtotal / (1 + taxRate);
            taxAmount = base * taxRate;
            finalTotal = currentSubtotal;
        } else {
            taxAmount = currentSubtotal * taxRate;
            finalTotal = currentSubtotal + taxAmount;
        }
        
        // Add existing propina to the final total
        finalTotal += order.propina;

        return { subtotal: currentSubtotal, impuestos: taxAmount, total: finalTotal };
    }, [cart, restaurantSettings, order.propina]);
    
    const handleUpdateOrder = async () => {
        if(cart.length === 0) return;
        
        if (orderType === OrderType.DELIVERY && !selectedCustomer) {
            showToast("Selecciona un cliente con dirección para pedidos a domicilio.", "error");
            return;
        }

        setIsSaving(true);
        const orderData = {
            customer_id: selectedCustomer,
            tipo: orderType,
            subtotal,
            descuento: order.descuento,
            impuestos,
            propina: order.propina,
            total,
            items: cart,
        };
        await updateOrder(order.id, orderData);
        setIsSaving(false);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
                    <h2 className="text-xl font-bold">Editar Pedido #{order.id}</h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                        <X className="h-5 w-5" />
                    </button>
                </div>
                 <div className="flex-1 flex overflow-hidden">
                    {/* Left side: Menu */}
                    <div className="w-1/2 p-4 flex flex-col border-r dark:border-gray-700">
                        <input
                            type="text"
                            placeholder="Buscar producto..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-4 py-2 mb-4 text-sm text-gray-700 bg-gray-100 dark:bg-gray-700 dark:text-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                        <ul className="flex-1 overflow-y-auto space-y-2 pr-2">
                            {filteredMenuItems.map(item => (
                                <li key={item.id} onClick={() => addToCart(item)} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg flex justify-between items-center cursor-pointer hover:bg-orange-100 dark:hover:bg-orange-900/40">
                                    <div>
                                        <p className="font-semibold">{item.nombre}</p>
                                        <p className="text-sm text-gray-500">{formatCurrency(item.precio_base)}</p>
                                    </div>
                                    <PlusCircle className="h-5 w-5 text-orange-500"/>
                                </li>
                            ))}
                        </ul>
                    </div>
                    {/* Right side: Cart */}
                    <div className="w-1/2 p-4 flex flex-col">
                        <h3 className="text-lg font-semibold mb-3">Resumen del Pedido</h3>
                        <div className="flex-1 overflow-y-auto pr-2">
                            {cart.length === 0 ? (
                                <div className="text-center text-gray-500 pt-16">El carrito está vacío.</div>
                            ) : (
                               <ul className="space-y-3">
                                    {cart.map(item => (
                                        <li key={item.id} className="flex flex-col">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="font-medium text-sm">{item.nombre_item_snapshot}</p>
                                                    <p className="text-xs text-gray-500">{formatCurrency(item.precio_unitario)}</p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <button onClick={() => updateQuantity(item.id, item.cantidad - 1)} className="p-1 rounded-full bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500"><Minus className="h-3 w-3"/></button>
                                                    <span className="font-bold w-4 text-center">{item.cantidad}</span>
                                                    <button onClick={() => updateQuantity(item.id, item.cantidad + 1)} className="p-1 rounded-full bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500"><Plus className="h-3 w-3"/></button>
                                                    <span className="text-sm font-semibold w-16 text-right">{formatCurrency(item.total_item)}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 mt-1.5">
                                                <button onClick={() => setEditingNoteFor(prev => prev === item.id ? null : item.id)} className={`p-1 rounded-full ${editingNoteFor === item.id ? 'bg-orange-100 dark:bg-orange-900/50' : ''}`}>
                                                    <Pencil className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400" />
                                                </button>
                                                {editingNoteFor === item.id ? (
                                                    <input
                                                        type="text"
                                                        value={item.notes}
                                                        onChange={(e) => handleNoteChange(item.id, e.target.value)}
                                                        onBlur={() => setEditingNoteFor(null)}
                                                        placeholder="Ej: Sin cebolla, Alergia..."
                                                        autoFocus
                                                        className="w-full text-xs px-2 py-1 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-md"
                                                    />
                                                ) : item.notes ? (
                                                    <p className="text-xs text-orange-600 dark:text-orange-400 truncate italic cursor-pointer" onClick={() => setEditingNoteFor(item.id)}>"{item.notes}"</p>
                                                ): null}
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                        <div className="border-t dark:border-gray-700 pt-4 space-y-3 text-sm">
                            <div className="flex gap-2">
                                <select value={orderType} onChange={e => setOrderType(e.target.value as OrderType)} disabled={isSalaOrder} className="w-full px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 rounded-lg border-transparent focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50">
                                    {Object.values(OrderType).map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                                {isSalaOrder ? (
                                    <div className="w-full px-3 py-2 text-sm bg-gray-200 dark:bg-gray-600 rounded-lg flex items-center justify-center font-medium">
                                        Mesa {order.table_id}
                                    </div>
                                ) : (
                                    <select value={selectedCustomer || ''} onChange={e => setSelectedCustomer(e.target.value || null)} className="w-full px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 rounded-lg border-transparent focus:outline-none focus:ring-2 focus:ring-orange-500">
                                        <option value="">Cliente Genérico</option>
                                        {selectableCustomers.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                                    </select>
                                )}
                            </div>
                            <div className="flex justify-between"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
                            <div className="flex justify-between"><span>Impuestos (IVA {restaurantSettings?.iva_rate}%)</span><span>{formatCurrency(impuestos)}</span></div>
                            {order.propina > 0 && <div className="flex justify-between"><span>Propina</span><span>{formatCurrency(order.propina)}</span></div>}
                            <div className="flex justify-between font-bold text-base"><span>Total</span><span>{formatCurrency(total)}</span></div>
                             <button
                                onClick={handleUpdateOrder}
                                disabled={cart.length === 0 || isSaving}
                                className="w-full mt-2 px-4 py-3 text-sm font-semibold text-white bg-orange-500 rounded-lg hover:bg-orange-600 disabled:bg-orange-300 dark:disabled:bg-orange-800 disabled:cursor-not-allowed"
                            >
                                {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const MapModal: React.FC<{ customer: Customer; onClose: () => void; driver?: User | null }> = ({ customer, onClose, driver }) => {
    
    // Calculate linear distance (Haversine simple approx)
    const getDistance = () => {
        if (!driver?.last_location) return null;
        const R = 6371; // km
        const dLat = (customer.direccion.lat - driver.last_location.lat) * Math.PI / 180;
        const dLon = (customer.direccion.lng - driver.last_location.lng) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(driver.last_location.lat * Math.PI / 180) * Math.cos(customer.direccion.lat * Math.PI / 180) *
                  Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return (R * c).toFixed(2);
    }

    const distance = getDistance();
    const mapUrl = driver?.last_location 
        ? `https://www.google.com/maps/dir/?api=1&origin=${driver.last_location.lat},${driver.last_location.lng}&destination=${customer.direccion.lat},${customer.direccion.lng}`
        : `https://www.google.com/maps/search/?api=1&query=${customer.direccion.lat},${customer.direccion.lng}`;

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
                <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
                    <h3 className="font-semibold">Rastreo de Entrega</h3>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"><X className="h-4 w-4" /></button>
                </div>
                <div className="p-4">
                    <div className="mb-4 flex justify-between">
                        <div>
                            <p className="font-bold text-sm text-gray-500">CLIENTE</p>
                            <p className="font-bold">{customer.nombre}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-300">{customer.direccion.calle}</p>
                        </div>
                        {driver && (
                            <div className="text-right">
                                <p className="font-bold text-sm text-gray-500">REPARTIDOR</p>
                                <p className="font-bold">{driver.nombre}</p>
                                {distance && <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold">A {distance} km del destino</p>}
                            </div>
                        )}
                    </div>
                    
                    <div className="mt-4 h-64 bg-gray-200 dark:bg-gray-700 rounded-md relative overflow-hidden group border dark:border-gray-600">
                        <img 
                            src={`https://picsum.photos/seed/${customer.direccion.lat},${customer.direccion.lng}/600/400`} 
                            alt="Mapa simulado" 
                            className="w-full h-full object-cover opacity-50 group-hover:opacity-80 transition-opacity"
                        />
                        {/* Line simulating route */}
                        {driver?.last_location && (
                            <svg className="absolute inset-0 w-full h-full pointer-events-none">
                                <line x1="33%" y1="33%" x2="50%" y2="50%" stroke="#3b82f6" strokeWidth="3" strokeDasharray="5,5" />
                            </svg>
                        )}

                        <div className="absolute inset-0 pointer-events-none">
                            {/* Customer Pin - Centered */}
                             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                                <MapPin className="h-8 w-8 text-red-500 drop-shadow-md" />
                                <span className="bg-white dark:bg-gray-800 text-xs px-1 rounded shadow">Cliente</span>
                            </div>

                            {/* Driver Pin - Offset based on simulation */}
                            {driver?.last_location && (
                                <div className="absolute top-1/3 left-1/3 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center transition-all duration-1000 ease-in-out">
                                    <div className="bg-blue-500 p-1.5 rounded-full shadow-lg animate-pulse">
                                        <Truck className="h-5 w-5 text-white" />
                                    </div>
                                    <span className="bg-white dark:bg-gray-800 text-xs px-1 rounded shadow mt-1">Repartidor</span>
                                </div>
                            )}
                        </div>
                    </div>
                    
                    <div className="mt-4">
                        <a 
                            href={mapUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 w-full py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            <Navigation className="h-4 w-4" /> Ver Ruta en Google Maps
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};

const PaymentModal: React.FC<{ order: Order; onClose: () => void; }> = ({ order, onClose }) => {
    const { generatePaymentQR, addPaymentToOrder, updateOrder, restaurantSettings } = useAppContext();
    const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [tipAmount, setTipAmount] = useState(order.propina || 0);
    const [customTip, setCustomTip] = useState((order.propina || 0) > 0 ? order.propina.toString() : '');
    const [isSplitBillVisible, setIsSplitBillVisible] = useState(false);
    
    const totalPaid = useMemo(() => order.payments.reduce((sum, p) => sum + p.amount, 0), [order.payments]);
    const remainingAmount = useMemo(() => order.total - totalPaid, [order.total, totalPaid]);

    const [paymentAmounts, setPaymentAmounts] = useState<number[]>([remainingAmount]);

    useEffect(() => {
        if(remainingAmount <= 0) {
            onClose();
        }
        setPaymentAmounts([remainingAmount]);
    }, [remainingAmount, onClose]);
    
    const [activeTip, setActiveTip] = useState<number | 'custom' | null>(() => {
        if (!order.propina || order.propina <= 0) return null;
        const matchingPercentage = restaurantSettings?.propina_opciones.find(p =>
            Math.abs(parseFloat(((order.subtotal * p) / 100).toFixed(2)) - order.propina) < 0.001
        );
        return matchingPercentage !== undefined ? matchingPercentage : 'custom';
    });

    const handleGenerateQR = async (amount: number) => {
        setIsProcessing(true);
        if (tipAmount !== order.propina) {
            await updateOrder(order.id, { propina: tipAmount, total: order.total - order.propina + tipAmount });
        }
        const url = await generatePaymentQR(order.id, amount);
        if (url) {
            setQrCodeUrl(url);
        }
        setIsProcessing(false);
    };

    const handlePayment = async (method: PaymentDetails['method'], amount: number) => {
        setIsProcessing(true);
        if (tipAmount !== order.propina) {
            await updateOrder(order.id, { propina: tipAmount, total: order.total - order.propina + tipAmount });
        }
        await addPaymentToOrder(order.id, method, amount);
        setIsProcessing(false);
    };

    return (
        <>
            <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
                    <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
                        <h2 className="text-xl font-bold">Pagar Pedido #{order.id}</h2>
                        <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"><X className="h-5 w-5" /></button>
                    </div>
                    <div className="p-6">
                        <div className="mb-4">
                            <p className="text-sm text-gray-500 dark:text-gray-400">Total Pedido: {formatCurrency(order.total)}</p>
                            <p className="text-sm text-green-600 dark:text-green-400">Ya Pagado: {formatCurrency(totalPaid)}</p>
                            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">Pendiente: {formatCurrency(remainingAmount)}</p>
                        </div>

                         <div className="space-y-4">
                            {paymentAmounts.map((amount, index) => (
                               <div key={index} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                   <p className="font-bold text-lg text-center mb-3">Pago #{index+1}: {formatCurrency(amount)}</p>
                                    {qrCodeUrl ? (
                                        <div className="text-center">
                                            <img src={qrCodeUrl} alt="Código QR de pago" className="mx-auto rounded-lg" />
                                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Escanea para pagar.</p>
                                            <button onClick={() => handlePayment('QR', amount)} disabled={isProcessing} className="w-full mt-4 px-4 py-2 text-sm font-semibold text-white bg-green-500 rounded-lg hover:bg-green-600 disabled:opacity-50">
                                                {isProcessing ? 'Procesando...' : 'Confirmar Pago QR'}
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-2 gap-2">
                                            <button onClick={() => handlePayment('TARJETA', amount)} disabled={isProcessing} className="flex items-center justify-center gap-2 px-3 py-2 text-sm font-semibold border dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50">
                                                <CreditCard className="h-4 w-4" /> Tarjeta
                                            </button>
                                            <button onClick={() => handlePayment('EFECTIVO', amount)} disabled={isProcessing} className="flex items-center justify-center gap-2 px-3 py-2 text-sm font-semibold border dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50">
                                                <DollarSign className="h-4 w-4" /> Efectivo
                                            </button>
                                            <button onClick={() => handleGenerateQR(amount)} disabled={isProcessing} className="col-span-2 flex items-center justify-center gap-2 px-3 py-2 text-sm font-semibold border dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50">
                                                <QrCode className="h-4 w-4"/> Generar QR
                                            </button>
                                        </div>
                                    )}
                               </div>
                            ))}
                        </div>

                         <div className="mt-4 pt-4 border-t dark:border-gray-700">
                             <button onClick={() => setIsSplitBillVisible(true)} className="w-full flex items-center justify-center gap-3 px-4 py-3 text-sm font-semibold text-orange-600 border-2 border-orange-500 rounded-lg hover:bg-orange-50 dark:hover:bg-orange-900/30">
                                 <Split className="h-5 w-5"/> Dividir Cuenta
                             </button>
                         </div>
                    </div>
                </div>
            </div>
            {isSplitBillVisible && <SplitBillModal order={order} currentRemaining={remainingAmount} onSave={(amounts) => { setPaymentAmounts(amounts); setIsSplitBillVisible(false); }} onClose={() => setIsSplitBillVisible(false)} />}
        </>
    );
};

const SplitBillModal: React.FC<{
    order: Order;
    currentRemaining: number;
    onSave: (amounts: number[]) => void;
    onClose: () => void;
}> = ({ order, currentRemaining, onSave, onClose }) => {
    const [mode, setMode] = useState<'equal' | 'item'>('equal');
    const [equalParts, setEqualParts] = useState(2);
    const [itemGroups, setItemGroups] = useState<OrderItem[][]>([[]]);

    const handleSave = () => {
        if(mode === 'equal') {
            if (equalParts <= 1) return;
            const amountPerPart = currentRemaining / equalParts;
            onSave(Array(equalParts).fill(amountPerPart));
        } else {
            const groupTotals = itemGroups.map(group => group.reduce((sum, item) => sum + item.total_item, 0));
            // Add taxes proportionally
            const subtotal = order.items.reduce((sum, i) => sum + i.total_item, 0);
            const taxAndTipRatio = subtotal > 0 ? (order.total - subtotal) / subtotal : 0;
            const finalAmounts = groupTotals.map(t => t * (1 + taxAndTipRatio));
            onSave(finalAmounts.filter(t => t > 0));
        }
    }

    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
                 <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
                    <h2 className="text-xl font-bold">Dividir Cuenta</h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"><X className="h-5 w-5" /></button>
                </div>
                <div className="p-6">
                     <div className="flex justify-center mb-4 p-1 bg-gray-200 dark:bg-gray-700 rounded-lg">
                        <button onClick={() => setMode('equal')} className={`w-1/2 py-2 text-sm font-semibold rounded-md ${mode === 'equal' ? 'bg-white dark:bg-gray-800' : ''}`}>En Partes Iguales</button>
                        <button onClick={() => setMode('item')} className={`w-1/2 py-2 text-sm font-semibold rounded-md ${mode === 'item' ? 'bg-white dark:bg-gray-800' : ''}`}>Por Ítem</button>
                    </div>

                    {mode === 'equal' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Dividir en:</label>
                             <input type="number" value={equalParts} onChange={e => setEqualParts(Math.max(2, parseInt(e.target.value) || 2))} className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"/>
                            <p className="mt-4 text-center text-lg">
                                <span className="font-bold">{equalParts}</span> pagos de <span className="font-bold">{formatCurrency(currentRemaining / equalParts)}</span>
                            </p>
                        </div>
                    )}
                    {mode === 'item' && (
                        <div className="text-center text-gray-500 py-8">
                            Funcionalidad para dividir por ítem próximamente.
                        </div>
                    )}
                </div>
                 <div className="px-6 py-3 bg-gray-50 dark:bg-gray-700/50 text-right">
                    <button onClick={handleSave} className="px-4 py-2 text-sm font-semibold text-white bg-orange-500 rounded-lg hover:bg-orange-600">
                        Aplicar División
                    </button>
                </div>
            </div>
        </div>
    );
}

const DeliveryManagementView: React.FC<{ 
    onShowMap: (customer: Customer, driver?: User | null) => void;
    onViewDetails: (order: Order) => void;
}> = ({ onShowMap, onViewDetails }) => {
    const { orders, users, customers, assignRepartidor, showToast, updateUserLocation } = useAppContext();
    const [dateRange, setDateRange] = useState({ from: '', to: '' });
    const [dragOverRepartidor, setDragOverRepartidor] = useState<string | null>(null);
    const [sharingLocationFor, setSharingLocationFor] = useState<Set<number>>(new Set());
    const locationIntervals = useRef<Map<number, number>>(new Map());
    
    const repartidores = users.filter(u => u.rol === UserRole.REPARTO);

    useEffect(() => {
        return () => {
            locationIntervals.current.forEach(id => clearInterval(id));
        };
    }, []);
    
    const deliveryOrders = useMemo(() => {
        return orders.filter(order => {
            if (order.tipo !== OrderType.DELIVERY) return false;
            if (!dateRange.from && !dateRange.to) return true;
            
            const orderDate = new Date(order.creado_en);
            const fromDate = dateRange.from ? new Date(dateRange.from) : null;
            const toDate = dateRange.to ? new Date(dateRange.to) : null;

            if (fromDate) {
                fromDate.setHours(0, 0, 0, 0);
                if (orderDate < fromDate) return false;
            }
            if (toDate) {
                toDate.setHours(23, 59, 59, 999);
                if (orderDate > toDate) return false;
            }
            return true;
        });
    }, [orders, dateRange]);

    const waitingOrders = deliveryOrders.filter(o => !o.repartidor_id && o.estado === OrderStatus.LISTO && o.payments.reduce((s,p) => s+p.amount, 0) >= o.total);
    const activeDeliveries = deliveryOrders.filter(o => o.repartidor_id && ![OrderStatus.ENTREGADO, OrderStatus.CANCELADO, OrderStatus.DEVOLUCION].includes(o.estado));
    const customersMap = new Map<string, Customer>(customers.map(c => [c.id, c]));
    const repartidoresMap = new Map<string, User>(repartidores.map(r => [r.id, r]));
    
    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setDateRange(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleDragStart = (e: React.DragEvent<HTMLLIElement>, orderId: number) => {
        e.dataTransfer.setData("orderId", orderId.toString());
    };

    const handleDragOver = (e: React.DragEvent<HTMLLIElement>) => {
        e.preventDefault();
    };

    const handleDrop = (e: React.DragEvent<HTMLLIElement>, repartidorId: string) => {
        e.preventDefault();
        setDragOverRepartidor(null);
        const orderId = parseInt(e.dataTransfer.getData("orderId"), 10);
        const repartidor = repartidores.find(r => r.id === repartidorId);
        if (orderId && repartidor && repartidor.estado_delivery === 'DISPONIBLE') {
            assignRepartidor(orderId, repartidorId);
        } else {
            showToast("Este repartidor no está disponible para recibir pedidos.", "error");
        }
    };

    const handleToggleLocation = (orderId: number, driverId: string) => {
        const newSharingSet = new Set(sharingLocationFor);
        if (newSharingSet.has(orderId)) {
            newSharingSet.delete(orderId);
            clearInterval(locationIntervals.current.get(orderId));
            locationIntervals.current.delete(orderId);
            showToast(`Se dejó de compartir la ubicación.`, 'success');
        } else {
            if ("geolocation" in navigator) {
                newSharingSet.add(orderId);
                showToast(`Iniciando rastreo GPS...`, 'success');
                
                const sendLocation = () => {
                    navigator.geolocation.getCurrentPosition(
                        (position) => {
                             updateUserLocation(driverId, position.coords.latitude, position.coords.longitude);
                        },
                        (error) => console.error(error),
                        { enableHighAccuracy: true }
                    );
                };
                sendLocation();
                const intervalId = window.setInterval(sendLocation, 5000);
                locationIntervals.current.set(orderId, intervalId);
            } else {
                showToast("Geolocalización no soportada.", "error");
                return;
            }
        }
        setSharingLocationFor(newSharingSet);
    };

    return (
        <div className="space-y-6">
            <Card>
                <h3 className="font-semibold mb-3 text-lg">Filtrar Entregas por Fecha</h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                    <div>
                        <label htmlFor="from" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Desde</label>
                        <input type="date" id="from" name="from" value={dateRange.from} onChange={handleDateChange} className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm" />
                    </div>
                    <div>
                        <label htmlFor="to" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Hasta</label>
                        <input type="date" id="to" name="to" value={dateRange.to} onChange={handleDateChange} className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm" />
                    </div>
                </div>
            </Card>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 space-y-4">
                    <Card>
                        <h3 className="font-semibold mb-3 text-lg">Estado de Repartidores</h3>
                        <ul className="space-y-3">
                            {repartidores.map(r => {
                                const activeOrder = activeDeliveries.find(o => o.repartidor_id === r.id);
                                const isDroppable = r.estado_delivery === 'DISPONIBLE' && dragOverRepartidor === r.id;
                                return (
                                    <li 
                                      key={r.id}
                                      onDragOver={handleDragOver}
                                      onDrop={(e) => handleDrop(e, r.id)}
                                      onDragEnter={() => r.estado_delivery === 'DISPONIBLE' && setDragOverRepartidor(r.id)}
                                      onDragLeave={() => setDragOverRepartidor(null)}
                                      className={`flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg transition-all ${ isDroppable ? 'ring-2 ring-orange-500 ring-offset-2 dark:ring-offset-gray-900' : ''} ${ r.estado_delivery !== 'DISPONIBLE' ? 'opacity-60' : ''}`}
                                    >
                                        <div className="flex items-center">
                                            <img src={r.avatar_url} className="h-8 w-8 rounded-full mr-3" alt={r.nombre} />
                                            <div className="flex flex-col">
                                                <span className="font-medium text-sm">{r.nombre}</span>
                                                {r.last_location && <span className="text-[10px] text-gray-400">Ubicación hace: {formatTimeAgo(r.last_location.updated_at)}</span>}
                                            </div>
                                        </div>
                                        <div className="flex items-center text-xs font-semibold">
                                            <span className={`w-2.5 h-2.5 rounded-full mr-2 ${r.estado_delivery === 'DISPONIBLE' ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
                                            <span className={`${r.estado_delivery === 'DISPONIBLE' ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'}`}>
                                                {r.estado_delivery}{activeOrder ? ` (#${activeOrder.id})` : ''}
                                            </span>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    </Card>
                </div>
                <div className="lg:col-span-2 space-y-6">
                     <Card>
                        <h3 className="font-semibold mb-3 text-lg">Pedidos Pagados en Espera ({waitingOrders.length})</h3>
                        {waitingOrders.length > 0 ? (
                            <ul className="space-y-3 max-h-64 overflow-y-auto pr-2">
                            {waitingOrders.map(order => {
                                const customer = customersMap.get(order.customer_id!);
                                return (
                                    <li 
                                      key={order.id} 
                                      draggable 
                                      onDragStart={(e) => handleDragStart(e, order.id)}
                                      className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg cursor-grab active:cursor-grabbing"
                                    >
                                        <div className="flex flex-wrap justify-between items-start">
                                            <div>
                                                <p className="font-bold">Pedido #{order.id}</p>
                                                <p className="text-sm">{customer?.nombre}</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center mt-1"><Clock className="w-3 h-3 mr-1" />{formatTimeAgo(order.creado_en)}</p>
                                            </div>
                                            <div className="flex flex-col items-end gap-1">
                                                 <p className="font-semibold">{formatCurrency(order.total)}</p>
                                                 <p className="text-xs text-green-600 dark:text-green-400 font-bold">PAGADO</p>
                                                 <button onClick={() => onViewDetails(order)} className="text-xs bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded hover:bg-gray-300 dark:hover:bg-gray-500 flex items-center gap-1">
                                                     <List className="w-3 h-3" /> Detalles
                                                 </button>
                                            </div>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                        ) : <p className="text-sm text-gray-500 text-center py-4">No hay pedidos listos y pagados esperando repartidor.</p>}
                    </Card>
                    <Card>
                        <h3 className="font-semibold mb-3 text-lg">Repartos en Curso ({activeDeliveries.length})</h3>
                        {activeDeliveries.length > 0 ? (
                            <ul className="space-y-3 max-h-96 overflow-y-auto pr-2">
                            {activeDeliveries.map(order => {
                                 const customer = customersMap.get(order.customer_id!);
                                 const repartidor = repartidoresMap.get(order.repartidor_id!);
                                 return (
                                    <li key={order.id} className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                         <div className="flex flex-wrap justify-between items-start">
                                            <div>
                                                <p className="font-bold">Pedido #{order.id}</p>
                                                <p className="text-sm flex items-center"><MapPin className="w-3 h-3 mr-1.5 text-gray-500" />{customer?.nombre}</p>
                                                <p className="text-sm flex items-center mt-1"><UserCheck className="w-3 h-3 mr-1.5 text-gray-500" />{repartidor?.nombre}</p>
                                            </div>
                                            <div className="flex flex-col items-end gap-1">
                                                 <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center"><Clock className="w-3 h-3 mr-1" />{formatTimeAgo(order.creado_en)}</p>
                                                 <div className="flex gap-2 mt-1">
                                                    <button onClick={() => customer && onShowMap(customer, repartidor)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-500 rounded-lg hover:bg-blue-600"><MapPin className="w-3 h-3" /> Mapa</button>
                                                    <button onClick={() => onViewDetails(order)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"><List className="w-3 h-3" /> Detalles</button>
                                                    {repartidor && (
                                                        <button
                                                            onClick={() => handleToggleLocation(order.id, repartidor.id)}
                                                            className={`px-2 py-1 text-xs rounded border ${sharingLocationFor.has(order.id) ? 'bg-green-100 border-green-500 text-green-700' : 'bg-white border-gray-300'}`}
                                                            title="Simular GPS del Repartidor"
                                                        >
                                                            {sharingLocationFor.has(order.id) ? 'GPS Activo' : 'Activar GPS'}
                                                        </button>
                                                    )}
                                                 </div>
                                            </div>
                                        </div>
                                    </li>
                                 )
                            })}
                        </ul>
                        ) : <p className="text-sm text-gray-500 text-center py-4">No hay repartos en curso.</p>}
                    </Card>
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

export const OrdersPage: React.FC = () => {
    const { orders, user, customers, users, updateOrderStatus, showToast, assignMozoToOrder, cancelOrder, assignRepartidor, updateUserLocation } = useAppContext();
    const [searchParams] = useSearchParams();
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<OrderStatus | 'ALL'>('ALL');
    const [dateFilter, setDateFilter] = useState<{ from: string; to: string }>({ from: '', to: '' });
    const [currentPage, setCurrentPage] = useState(1);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editingOrder, setEditingOrder] = useState<Order | null>(null);
    const [payingOrder, setPayingOrder] = useState<Order | null>(null);
    const [view, setView] = useState<'list' | 'delivery'>('list');
    const [mapData, setMapData] = useState<{customer: Customer, driver: User | null} | null>(null);
    const [orderToCancel, setOrderToCancel] = useState<Order | null>(null);
    const [viewingOrder, setViewingOrder] = useState<Order | null>(null);
    
    // Initialize filter: ALL for Admins, UserID for Mozos (default to "My Orders")
    const [mozoFilter, setMozoFilter] = useState<string>('ALL');
    
    useEffect(() => {
         if (user?.rol === UserRole.MOZO) {
            setMozoFilter(user.id);
         }
    }, [user]);

    const ITEMS_PER_PAGE = 15;

    useEffect(() => {
        const orderIdFromParams = searchParams.get('orderId');
        if (orderIdFromParams) {
            setSearchTerm(orderIdFromParams);
        }
    }, [searchParams]);

    const customersMap = useMemo(() => new Map<string, Customer>(customers.map(c => [c.id, c])), [customers]);
    const usersMap = useMemo(() => new Map<string, string>(users.map(u => [u.id, u.nombre])), [users]);
    const waiters = useMemo(() => users.filter(u => u.rol === UserRole.MOZO), [users]);
    const repartidores = useMemo(() => users.filter(u => u.rol === UserRole.REPARTO), [users]);
    
    const getNextStatusesForRepartidor = (currentStatus: OrderStatus): OrderStatus[] => {
        switch (currentStatus) {
            case OrderStatus.LISTO:
                return [OrderStatus.EN_CAMINO];
            case OrderStatus.EN_CAMINO:
                return [OrderStatus.ENTREGADO, OrderStatus.INCIDENCIA];
            case OrderStatus.INCIDENCIA:
                return [OrderStatus.ENTREGADO, OrderStatus.EN_CAMINO, OrderStatus.DEVOLUCION];
            default:
                return [];
        }
    };
    
    const handleCancelOrder = (order: Order) => {
        setOrderToCancel(order);
    };

    const handleConfirmCancel = () => {
        if (orderToCancel) {
            cancelOrder(orderToCancel.id);
            setOrderToCancel(null);
        }
    };

    const handleDateFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setDateFilter(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };


    // Reparto View Logic
    if (user?.rol === UserRole.REPARTO) {
        const [dateRange, setDateRange] = useState({ from: '', to: '' });
        const [sharingLocationFor, setSharingLocationFor] = useState<Set<number>>(new Set());
        const locationIntervals = useRef<Map<number, number>>(new Map());

        useEffect(() => {
            // Cleanup intervals on component unmount
            return () => {
                locationIntervals.current.forEach(intervalId => clearInterval(intervalId));
            };
        }, []);

        const handleToggleLocation = (orderId: number) => {
            const newSharingSet = new Set(sharingLocationFor);
            if (newSharingSet.has(orderId)) {
                // Stop sharing
                newSharingSet.delete(orderId);
                clearInterval(locationIntervals.current.get(orderId));
                locationIntervals.current.delete(orderId);
                showToast(`Se dejó de compartir la ubicación para el pedido #${orderId}.`);
            } else {
                // Start sharing
                if ("geolocation" in navigator) {
                    newSharingSet.add(orderId);
                    showToast(`Compartiendo ubicación para el pedido #${orderId}...`, 'success');

                    // Function to send location to backend
                    const sendLocation = () => {
                        navigator.geolocation.getCurrentPosition(
                            (position) => {
                                updateUserLocation(user.id, position.coords.latitude, position.coords.longitude);
                            },
                            (error) => {
                                console.error("Error fetching location", error);
                            },
                            { enableHighAccuracy: true }
                        );
                    };

                    // Send immediately
                    sendLocation();

                    // Send every 10 seconds
                    const intervalId = window.setInterval(sendLocation, 10000); 
                    locationIntervals.current.set(orderId, intervalId);
                } else {
                     showToast("Geolocalización no soportada en este navegador.", "error");
                     return;
                }
            }
             setSharingLocationFor(newSharingSet);
        };


        const myDeliveries = useMemo(() => {
            return orders
                .filter(order => order.repartidor_id === user.id)
                .filter(order => {
                    if (!dateRange.from && !dateRange.to) return true;
                    const orderDate = new Date(order.creado_en);
                    const fromDate = dateRange.from ? new Date(dateRange.from) : null;
                    const toDate = dateRange.to ? new Date(dateRange.to) : null;

                    if (fromDate) {
                        fromDate.setHours(0, 0, 0, 0);
                        if (orderDate < fromDate) return false;
                    }
                    if (toDate) {
                        toDate.setHours(23, 59, 59, 999);
                        if (orderDate > toDate) return false;
                    }
                    return true;
                })
                .sort((a, b) => new Date(b.creado_en).getTime() - new Date(a.creado_en).getTime());
        }, [orders, user.id, dateRange]);

        const totalDeliveries = myDeliveries.length;
        const totalValue = myDeliveries.reduce((sum, order) => sum + order.total, 0);
        
        const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            setDateRange(prev => ({ ...prev, [e.target.name]: e.target.value }));
        };

        return (
            <div className="space-y-6">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Mis Entregas</h1>

                <Card>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                        <div>
                            <label htmlFor="from" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Desde</label>
                            <input type="date" id="from" name="from" value={dateRange.from} onChange={handleDateChange} className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm" />
                        </div>
                        <div>
                            <label htmlFor="to" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Hasta</label>
                            <input type="date" id="to" name="to" value={dateRange.to} onChange={handleDateChange} className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm" />
                        </div>
                    </div>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="flex items-center">
                        <div className="p-3 rounded-full mr-4 bg-blue-500"><Truck className="h-6 w-6 text-white"/></div>
                        <div><p className="text-sm text-gray-500 dark:text-gray-400">Entregas Realizadas</p><p className="text-2xl font-bold text-gray-900 dark:text-white">{totalDeliveries}</p></div>
                    </Card>
                    <Card className="flex items-center">
                        <div className="p-3 rounded-full mr-4 bg-green-500"><DollarSign className="h-6 w-6 text-white"/></div>
                        <div><p className="text-sm text-gray-500 dark:text-gray-400">Valor Total Transportado</p><p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(totalValue)}</p></div>
                    </Card>
                </div>

                <Card>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                             <thead className="bg-gray-50 dark:bg-gray-700/50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Pedido</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Fecha</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Cliente</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Dirección</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Estado</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Total</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Localización</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {myDeliveries.map(order => {
                                    const customer = customers.find(c => c.id === order.customer_id);
                                    const nextStatuses = getNextStatusesForRepartidor(order.estado);
                                    return (
                                        <tr key={order.id}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">#{order.id}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{formatDate(order.creado_en)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{customer?.nombre || 'N/A'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{customer?.direccion.calle || 'N/A'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap"><span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${ORDER_STATUS_COLORS[order.estado]} text-white`}>{order.estado}</span></td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-gray-900 dark:text-white">{formatCurrency(order.total)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                {order.estado === OrderStatus.EN_CAMINO ? (
                                                    <button
                                                        onClick={() => handleToggleLocation(order.id)}
                                                        className={`px-3 py-1.5 text-xs font-semibold rounded-md text-white transition-colors ${
                                                            sharingLocationFor.has(order.id)
                                                                ? 'bg-red-500 hover:bg-red-600'
                                                                : 'bg-blue-500 hover:bg-blue-600'
                                                        }`}
                                                    >
                                                        {sharingLocationFor.has(order.id) ? 'Dejar de Compartir' : 'Compartir Ubicación'}
                                                    </button>
                                                ) : <span className="text-gray-400 dark:text-gray-500">-</span>}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm flex gap-2 items-center">
                                                 <button onClick={() => setViewingOrder(order)} className="text-blue-500 hover:text-blue-700" title="Ver Detalles">
                                                    <List className="h-5 w-5" />
                                                 </button>
                                                {nextStatuses.length > 0 ? (
                                                    <select
                                                        onChange={(e) => {
                                                            if (e.target.value) {
                                                                updateOrderStatus(order.id, e.target.value as OrderStatus);
                                                            }
                                                        }}
                                                        defaultValue=""
                                                        className="w-full max-w-[150px] px-2 py-1 text-xs bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-orange-500"
                                                        aria-label={`Actualizar estado para pedido #${order.id}`}
                                                    >
                                                        <option value="" disabled>ACTUALIZAR</option>
                                                        {nextStatuses.map(status => (
                                                            <option key={status} value={status}>{status}</option>
                                                        ))}
                                                    </select>
                                                ) : (
                                                    <span className="text-gray-400 dark:text-gray-500">-</span>
                                                )}
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                        {myDeliveries.length === 0 && <div className="text-center py-12 text-gray-500">No se encontraron entregas en el rango seleccionado.</div>}
                    </div>
                </Card>
                {viewingOrder && <OrderDetailsModal order={viewingOrder} onClose={() => setViewingOrder(null)} />}
            </div>
        );
    }


    const canCreate = user && [UserRole.ADMIN, UserRole.GERENTE, UserRole.MOZO].includes(user.rol);
    const canManageDelivery = user && [UserRole.ADMIN, UserRole.GERENTE].includes(user.rol);
    const canAssignMozo = user && [UserRole.ADMIN, UserRole.GERENTE].includes(user.rol);

    // Allow all orders to be filtered, rather than restricting by role here.
    const ordersToDisplay = useMemo(() => {
        if (!user) return [];
        return orders;
    }, [orders, user]);


    const filteredOrders = useMemo(() => ordersToDisplay.filter(order => {
        let customer: Customer | undefined | null = null;
        let recipientInfo = '';

        if (order.tipo === OrderType.SALA && order.table_id) {
            recipientInfo = `Mesa ${order.table_id}`;
        } else if (order.customer_id) {
            customer = customersMap.get(order.customer_id);
            recipientInfo = customer?.nombre ?? 'Cliente Anónimo';
        } else {
            recipientInfo = 'Cliente Genérico';
        }

        const lowerCaseSearch = searchTerm.toLowerCase();
        const numericSearch = searchTerm.replace(/\D/g, '');

        const matchesSearch = searchTerm === '' ||
            order.id.toString().includes(searchTerm) ||
            recipientInfo.toLowerCase().includes(lowerCaseSearch) ||
            (customer && numericSearch && customer.telefono.replace(/\D/g, '').includes(numericSearch)) ||
            (customer && customer.direccion.calle.toLowerCase().includes(lowerCaseSearch)) ||
            (customer && customer.direccion.ciudad.toLowerCase().includes(lowerCaseSearch));
        
        const matchesStatus = statusFilter === 'ALL' || order.estado === statusFilter;

        // Filter by Mozo logic
        let matchesMozo = true;
        if (mozoFilter !== 'ALL') {
            if (user?.rol === UserRole.MOZO && mozoFilter === user.id) {
                // For Mozo's "My Orders", include orders assigned OR created by them
                matchesMozo = order.mozo_id === user.id || order.creado_por_id === user.id;
            } else {
                // For strict filtering (Admin dropdown), check assigned mozo
                matchesMozo = order.mozo_id === mozoFilter;
            }
        }

        // Filter by Date
        let matchesDate = true;
        const orderDate = new Date(order.creado_en);
        if (dateFilter.from) {
            const fromDate = new Date(dateFilter.from);
            fromDate.setHours(0, 0, 0, 0);
            if (orderDate < fromDate) matchesDate = false;
        }
        if (matchesDate && dateFilter.to) {
            const toDate = new Date(dateFilter.to);
            toDate.setHours(23, 59, 59, 999);
            if (orderDate > toDate) matchesDate = false;
        }


        return matchesSearch && matchesStatus && matchesMozo && matchesDate;
    }), [ordersToDisplay, searchTerm, statusFilter, customersMap, mozoFilter, user, dateFilter]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, statusFilter, mozoFilter, dateFilter]);

    const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE);
    const paginatedOrders = filteredOrders.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
    
    const ViewToggle = () => (
        <div className="flex items-center gap-2 p-1 bg-gray-200 dark:bg-gray-700 rounded-lg">
            <button onClick={() => setView('list')} className={`flex items-center gap-2 px-3 py-1.5 text-sm font-semibold rounded-md transition-colors ${view === 'list' ? 'bg-white dark:bg-gray-800 text-gray-800 dark:text-white' : 'text-gray-500'}`}>
                <List className="h-4 w-4" /> Lista de Pedidos
            </button>
             <button onClick={() => setView('delivery')} className={`flex items-center gap-2 px-3 py-1.5 text-sm font-semibold rounded-md transition-colors ${view === 'delivery' ? 'bg-white dark:bg-gray-800 text-gray-800 dark:text-white' : 'text-gray-500'}`}>
                <Truck className="h-4 w-4" /> Gestión de Delivery
            </button>
        </div>
    );

    const OrderRow: React.FC<{ order: Order, onEditOrder: () => void; onPayOrder: () => void; onViewDetails: (order: Order) => void; }> = ({ order, onEditOrder, onPayOrder, onViewDetails }) => {
        const canEdit = user && [UserRole.ADMIN, UserRole.GERENTE, UserRole.MOZO].includes(user.rol);
        const canCancel = user && [UserRole.ADMIN, UserRole.GERENTE].includes(user.rol) && ![OrderStatus.ENTREGADO, OrderStatus.CANCELADO, OrderStatus.DEVOLUCION].includes(order.estado);
        const isCancellable = [OrderStatus.NUEVO, OrderStatus.EN_PREPARACION].includes(order.estado);

        const isPreKitchenPending = order.estado === OrderStatus.PENDIENTE_PAGO && order.tipo === OrderType.PARA_LLEVAR;
        const canEditOrder = canEdit && ([OrderStatus.NUEVO, OrderStatus.EN_PREPARACION].includes(order.estado) || isPreKitchenPending);
        const showPayButton = order.estado === OrderStatus.PENDIENTE_PAGO;

        const customer = order.customer_id ? customersMap.get(order.customer_id) : null;
        const customerName = customer ? customer.nombre : (order.tipo === OrderType.SALA ? `Mesa ${order.table_id}` : 'Cliente Genérico');
        const repartidorName = order.repartidor_id ? usersMap.get(order.repartidor_id) : null;
        const mozoName = order.mozo_id ? usersMap.get(order.mozo_id) : 'N/A';

        const typeInfo = order.tipo === OrderType.DELIVERY
            ? `${order.tipo} (${repartidorName || 'Pendiente'})`
            : `Mesa ${order.table_id}`;
            
        const canChangeStatus = order.estado === OrderStatus.LISTO;

        const handleStatusClick = () => {
            if (!canChangeStatus) return;
            
            if (order.estado === OrderStatus.LISTO) {
                if (order.tipo === OrderType.SALA || order.tipo === OrderType.DELIVERY) {
                    updateOrderStatus(order.id, OrderStatus.PENDIENTE_PAGO);
                } else { // PARA_LLEVAR
                    updateOrderStatus(order.id, OrderStatus.ENTREGADO);
                }
            }
        };

        const showWhatsAppIcon = customer?.telefono && (
            (order.tipo === OrderType.PARA_LLEVAR && order.estado === OrderStatus.LISTO) ||
            (order.tipo === OrderType.DELIVERY && order.estado === OrderStatus.EN_CAMINO)
        );

        const whatsAppMessage = encodeURIComponent(
            order.estado === OrderStatus.LISTO
                ? `¡Hola ${customer?.nombre}! Tu pedido #${order.id} está listo para retirar.`
                : `¡Hola ${customer?.nombre}! Tu pedido #${order.id} va en camino.`
        );

        return (
            <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">#{order.id}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{formatDate(order.creado_en)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                    <div className="flex items-center gap-2">
                        {customer?.is_verified && <span title="Cliente Verificado"><ShieldCheck className="h-4 w-4 text-green-500"/></span>}
                        <span>{customerName}</span>
                        {showWhatsAppIcon && (
                            <a
                                href={`https://wa.me/${customer.telefono.replace(/\D/g, '')}?text=${whatsAppMessage}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-green-500 hover:text-green-600"
                                title="Notificar por WhatsApp"
                                onClick={e => e.stopPropagation()}
                            >
                                <MessageSquare className="h-4 w-4" />
                            </a>
                        )}
                    </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                    {order.tipo === OrderType.SALA ? typeInfo : order.tipo}
                </td>
                {canAssignMozo ? (
                     <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {order.tipo === OrderType.SALA ? (
                            <select
                                value={order.mozo_id || ''}
                                onChange={(e) => assignMozoToOrder(order.id, e.target.value || null)}
                                className="w-full max-w-[150px] truncate px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-500 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-orange-500"
                            >
                                <option value="">Sin Asignar</option>
                                {waiters.map(waiter => <option key={waiter.id} value={waiter.id}>{waiter.nombre}</option>)}
                            </select>
                        ) : order.tipo === OrderType.DELIVERY && order.estado === OrderStatus.LISTO ? (
                             <select
                                value={order.repartidor_id || ''}
                                onChange={(e) => {
                                    if (e.target.value) assignRepartidor(order.id, e.target.value);
                                }}
                                className="w-full max-w-[150px] truncate px-2 py-1 text-xs bg-blue-50 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-500 text-blue-700 dark:text-blue-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                            >
                                <option value="">Asignar Repartidor</option>
                                {repartidores.map(r => (
                                    <option key={r.id} value={r.id} disabled={r.estado_delivery !== 'DISPONIBLE'}>
                                        {r.nombre} {r.estado_delivery !== 'DISPONIBLE' ? '(Ocupado)' : ''}
                                    </option>
                                ))}
                            </select>
                        ) : (
                            <span className="text-gray-400 dark:text-gray-500">-</span>
                        )}
                    </td>
                ) : (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        {order.tipo === OrderType.SALA ? mozoName : (order.repartidor_id ? repartidorName : '-')}
                    </td>
                )}
                <td className="px-6 py-4 whitespace-nowrap">
                    <button
                        onClick={handleStatusClick}
                        disabled={!canChangeStatus}
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${ORDER_STATUS_COLORS[order.estado]} text-white transition-opacity ${canChangeStatus ? 'cursor-pointer hover:opacity-80' : 'cursor-default'} disabled:opacity-70 disabled:cursor-not-allowed`}
                    >
                        {order.estado}
                    </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                    <button onClick={() => onViewDetails(order)} className="text-blue-500 hover:text-blue-700 flex items-center gap-1">
                        <List className="h-4 w-4" /> <span className="text-xs font-medium">Ver Ítems</span>
                    </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 dark:text-white">{formatCurrency(order.total)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end items-center space-x-4">
                        {showPayButton ? (
                            <button onClick={onPayOrder} className="font-semibold text-white bg-green-500 hover:bg-green-600 px-3 py-1 rounded-md text-xs">
                                Pagar
                            </button>
                        ) : canEdit ? (
                            <button 
                                onClick={onEditOrder} 
                                disabled={!canEditOrder}
                                className="text-orange-600 hover:text-orange-900 disabled:text-gray-400 disabled:cursor-not-allowed">
                                Editar
                            </button>
                        ) : (
                            <a href="#" onClick={(e) => { e.preventDefault(); onEditOrder(); }} className="text-orange-600 hover:text-orange-900">Ver</a>
                        )}
                        {canCancel && (
                             <button
                                onClick={() => handleCancelOrder(order)}
                                disabled={!isCancellable}
                                className="text-red-600 hover:text-red-900 disabled:text-gray-400 disabled:cursor-not-allowed"
                                title={isCancellable ? 'Cancelar Pedido' : 'Solo se pueden cancelar pedidos en estado NUEVO o EN PREPARACIÓN.'}
                            >
                                Cancelar
                            </button>
                        )}
                    </div>
                </td>
            </tr>
        );
    };

    const orderForPayment = payingOrder ? orders.find(o => o.id === payingOrder.id) : null;

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap justify-between items-center gap-4">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Pedidos</h1>
                <div className="flex items-center gap-4">
                    {canManageDelivery && <ViewToggle />}
                    {canCreate && (
                        <button onClick={() => setIsCreateModalOpen(true)} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-orange-500 rounded-lg hover:bg-orange-600">
                            <PlusCircle className="h-4 w-4" />
                            Nuevo Pedido
                        </button>
                    )}
                </div>
            </div>
            
            {view === 'list' ? (
                <Card>
                    <div className="flex flex-wrap items-center gap-4 mb-4">
                        <div className="relative flex-grow">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Buscar por ID, cliente, teléfono, dirección..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 text-sm text-gray-700 bg-gray-100 dark:bg-gray-700 dark:text-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-2 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-lg border border-transparent">
                                <Calendar className="h-4 w-4 text-gray-500"/>
                                <input
                                    type="date"
                                    name="from"
                                    value={dateFilter.from}
                                    onChange={handleDateFilterChange}
                                    className="bg-transparent text-sm focus:outline-none w-28"
                                    title="Desde"
                                />
                                <span className="text-gray-400">-</span>
                                <input
                                    type="date"
                                    name="to"
                                    value={dateFilter.to}
                                    onChange={handleDateFilterChange}
                                    className="bg-transparent text-sm focus:outline-none w-28"
                                    title="Hasta"
                                />
                            </div>
                        </div>
                        <div>
                            <select 
                                value={statusFilter} 
                                onChange={(e) => setStatusFilter(e.target.value as OrderStatus | 'ALL')}
                                className="w-full sm:w-auto px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 rounded-lg border-transparent focus:outline-none focus:ring-2 focus:ring-orange-500"
                            >
                                <option value="ALL">Todos los estados</option>
                                {Object.values(OrderStatus).map(status => (
                                    <option key={status} value={status}>{status}</option>
                                ))}
                            </select>
                        </div>

                        {/* FILTRO POR MOZO */}
                        {[UserRole.ADMIN, UserRole.GERENTE].includes(user?.rol as UserRole) && (
                            <div>
                                <div className="relative">
                                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <select 
                                        value={mozoFilter} 
                                        onChange={(e) => setMozoFilter(e.target.value)}
                                        className="w-full sm:w-auto pl-10 pr-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 rounded-lg border-transparent focus:outline-none focus:ring-2 focus:ring-orange-500"
                                    >
                                        <option value="ALL">Todos los Mozos</option>
                                        {waiters.map(waiter => (
                                            <option key={waiter.id} value={waiter.id}>{waiter.nombre}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        )}

                        {user?.rol === UserRole.MOZO && (
                            <div className="flex items-center">
                                <button 
                                    onClick={() => setMozoFilter(prev => prev === 'ALL' ? user.id : 'ALL')}
                                    className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors border ${
                                        mozoFilter !== 'ALL'
                                        ? 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800'
                                        : 'bg-white text-gray-700 border-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                                    }`}
                                >
                                    <UserCheck className="h-4 w-4" />
                                    {mozoFilter !== 'ALL' ? 'Solo mis pedidos' : 'Ver todos los pedidos'}
                                </button>
                            </div>
                        )}
                    </div>
                    
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-700/50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">ID Pedido</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Fecha</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Cliente/Mesa</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Tipo</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Responsable</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Estado</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Detalles</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Total</th>
                                    <th scope="col" className="relative px-6 py-3"><span className="sr-only">Acciones</span></th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {paginatedOrders.map(order => {
                                    return (
                                        <OrderRow 
                                            key={order.id} 
                                            order={order}
                                            onEditOrder={() => setEditingOrder(order)}
                                            onPayOrder={() => setPayingOrder(order)}
                                            onViewDetails={setViewingOrder}
                                        />
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    {filteredOrders.length === 0 && <div className="text-center py-12 text-gray-500">No se encontraron pedidos.</div>}
                     <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                        itemsPerPage={ITEMS_PER_PAGE}
                        totalItems={filteredOrders.length}
                    />
                </Card>
            ) : (
                <DeliveryManagementView 
                    onShowMap={(customer, driver) => setMapData({customer, driver: driver || null})} 
                    onViewDetails={setViewingOrder}
                />
            )}
            
            {isCreateModalOpen && <CreateOrderModal onClose={() => setIsCreateModalOpen(false)} />}
            {editingOrder && <EditOrderModal order={editingOrder} onClose={() => setEditingOrder(null)} />}
            {mapData && <MapModal customer={mapData.customer} driver={mapData.driver} onClose={() => setMapData(null)} />}
            {orderForPayment && <PaymentModal order={orderForPayment} onClose={() => setPayingOrder(null)} />}
            {viewingOrder && <OrderDetailsModal order={viewingOrder} onClose={() => setViewingOrder(null)} />}
            {orderToCancel && (
                <CancelConfirmModal 
                    order={orderToCancel}
                    onClose={() => setOrderToCancel(null)}
                    onConfirm={handleConfirmCancel}
                />
            )}
        </div>
    );
};
