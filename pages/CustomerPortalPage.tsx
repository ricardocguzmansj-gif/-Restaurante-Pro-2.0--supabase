
import React, { useState, useMemo, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAppContext } from '../contexts/AppContext';
import { MenuCategory, MenuItem, OrderItem, OrderType, Customer } from '../types';
import { formatCurrency } from '../utils';
import { Pizza, ShoppingCart, Minus, Plus, X, Pencil, Send, CheckCircle, Truck, ShoppingBag, MapPin, Loader2 } from 'lucide-react';
import { Toast } from '../components/ui/Toast';

// --- SUBCOMPONENTS ---

const CartItem: React.FC<{
  item: OrderItem;
  onUpdateQuantity: (id: string, quantity: number) => void;
  onUpdateNote: (id: string, note: string) => void;
}> = ({ item, onUpdateQuantity, onUpdateNote }) => {
  const [isEditingNote, setIsEditingNote] = useState(false);

  return (
    <div className="flex flex-col space-y-2">
      <div className="flex items-center space-x-3">
        <div className="flex-1">
          <p className="font-semibold text-sm">{item.nombre_item_snapshot}</p>
          <p className="text-xs text-gray-500">{formatCurrency(item.precio_unitario)}</p>
        </div>
        <div className="flex items-center space-x-2">
          <button onClick={() => onUpdateQuantity(item.id, item.cantidad - 1)} className="p-1 rounded-full bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500"><Minus className="h-3 w-3"/></button>
          <span className="font-bold w-4 text-center text-sm">{item.cantidad}</span>
          <button onClick={() => onUpdateQuantity(item.id, item.cantidad + 1)} className="p-1 rounded-full bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500"><Plus className="h-3 w-3"/></button>
        </div>
        <p className="font-semibold text-sm w-16 text-right">{formatCurrency(item.total_item)}</p>
      </div>
      <div className="flex items-center gap-2">
        <button onClick={() => setIsEditingNote(p => !p)} className={`p-1 rounded-full ${isEditingNote ? 'bg-orange-100 dark:bg-orange-900/50' : ''}`}>
            <Pencil className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400" />
        </button>
        {isEditingNote ? (
            <input
                type="text"
                value={item.notes || ''}
                onChange={(e) => onUpdateNote(item.id, e.target.value)}
                onBlur={() => setIsEditingNote(false)}
                placeholder="Ej: Sin cebolla, extra picante..."
                autoFocus
                className="w-full text-xs px-2 py-1 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-md"
            />
        ) : item.notes ? (
            <p className="text-xs text-orange-600 dark:text-orange-400 truncate italic cursor-pointer" onClick={() => setIsEditingNote(true)}>"{item.notes}"</p>
        ): null}
      </div>
    </div>
  );
};

const Cart: React.FC<{
  cart: OrderItem[];
  onUpdateQuantity: (id: string, quantity: number) => void;
  onUpdateNote: (id: string, note: string) => void;
  onCheckout: () => void;
  subtotal: number;
  tax: number;
  total: number;
}> = ({ cart, onUpdateQuantity, onUpdateNote, onCheckout, subtotal, tax, total }) => (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 flex flex-col h-full max-h-[85vh]">
        <h2 className="text-2xl font-bold mb-4">Tu Pedido</h2>
        {cart.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-gray-500">Tu carrito está vacío.</div>
        ) : (
          <div className="flex-1 overflow-y-auto pr-2 -mr-2 space-y-4">
            {cart.map(item => <CartItem key={item.id} item={item} onUpdateQuantity={onUpdateQuantity} onUpdateNote={onUpdateNote} />)}
          </div>
        )}
        <div className="border-t dark:border-gray-700 mt-auto pt-4 space-y-2 text-sm">
            <div className="flex justify-between"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
            <div className="flex justify-between text-gray-500"><span>Impuestos</span><span>{formatCurrency(tax)}</span></div>
            <div className="flex justify-between font-bold text-lg"><span>Total</span><span>{formatCurrency(total)}</span></div>
            <button
                onClick={onCheckout}
                disabled={cart.length === 0}
                className="w-full mt-4 py-3 bg-orange-500 text-white font-bold rounded-lg hover:bg-orange-600 disabled:bg-orange-300"
            >
                Pedir
            </button>
        </div>
    </div>
);

const VerificationModal: React.FC<{
  onClose: () => void;
  onVerify: (code: string) => void;
  phone: string;
  isVerifying: boolean;
}> = ({ onClose, onVerify, phone, isVerifying }) => {
  const [code, setCode] = useState('');
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-sm text-center p-8" onClick={(e) => e.stopPropagation()}>
          <h3 className="font-semibold text-lg mb-2">Verifica tu Teléfono</h3>
          <p className="text-sm text-gray-500 mb-4">Hemos enviado un código de 4 dígitos a {phone}. (Para esta demo, usa '1234')</p>
          <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              maxLength={4}
              className="w-full text-center text-2xl tracking-[1rem] p-3 border rounded-md dark:bg-gray-700 dark:border-gray-600 mb-4"
          />
          <div className="flex gap-4">
            <button onClick={onClose} className="w-full py-2 border rounded-lg" disabled={isVerifying}>Cancelar</button>
            <button onClick={() => onVerify(code)} className="w-full py-2 bg-orange-500 text-white rounded-lg disabled:bg-orange-300" disabled={isVerifying}>
                {isVerifying ? 'Verificando...' : 'Verificar'}
            </button>
          </div>
      </div>
    </div>
  );
};


// --- MAIN PAGE COMPONENT ---

export const CustomerPortalPage: React.FC = () => {
    const { restaurantId } = useParams<{ restaurantId: string }>();
    const { processedMenuItems, categories, restaurantSettings, createPublicOrder, createCustomer, findCustomerByContact, verifyCustomer, switchRestaurant } = useAppContext();
    
    const [activeCategory, setActiveCategory] = useState('all');
    const [cart, setCart] = useState<OrderItem[]>([]);
    const [pageState, setPageState] = useState<'menu' | 'checkout' | 'confirm'>('menu');
    const [orderType, setOrderType] = useState<OrderType>(OrderType.PARA_LLEVAR);
    const [customerDetails, setCustomerDetails] = useState({ nombre: '', telefono: '', email: '', direccion: { calle: '', ciudad: '', codigo_postal: '', lat: 0, lng: 0 }});
    const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
    const [pendingOrder, setPendingOrder] = useState<any>(null);
    const [finalizedOrder, setFinalizedOrder] = useState<any>(null);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isLocating, setIsLocating] = useState(false);

    useEffect(() => {
        if (restaurantId) {
            switchRestaurant(restaurantId);
        }
    }, [restaurantId, switchRestaurant]);

    useEffect(() => {
        if (categories.length > 0 && !categories.find(c => c.id === activeCategory)) {
             setActiveCategory(categories[0].id);
        } else if (categories.length === 0) {
            setActiveCategory('all');
        }
    }, [categories, activeCategory]);

    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
      setToast({ message, type });
      setTimeout(() => setToast(null), 3000);
    };

    const filteredItems = useMemo(() => activeCategory === 'all'
        ? processedMenuItems.filter(i => i.disponible)
        : processedMenuItems.filter(item => item.category_id === activeCategory && item.disponible),
    [processedMenuItems, activeCategory]);

    const handleAddToCart = (item: MenuItem) => {
        setCart(currentCart => {
            const existingItem = currentCart.find(ci => ci.menu_item_id === item.id && !ci.notes);
            if (existingItem) {
                return currentCart.map(ci => ci.id === existingItem.id ? { ...ci, cantidad: ci.cantidad + 1, total_item: (ci.cantidad + 1) * ci.precio_unitario } : ci);
            }
            return [...currentCart, { id: `cart-${item.id}-${Date.now()}`, menu_item_id: item.id, nombre_item_snapshot: item.nombre, precio_unitario: item.precio_base, cantidad: 1, total_item: item.precio_base, notes: '' }];
        });
    };

    const handleUpdateQuantity = (cartItemId: string, newQuantity: number) => {
        setCart(currentCart => newQuantity <= 0 ? currentCart.filter(item => item.id !== cartItemId) : currentCart.map(item => item.id === cartItemId ? { ...item, cantidad: newQuantity, total_item: newQuantity * item.precio_unitario } : item));
    };

    const handleUpdateNote = (cartItemId: string, note: string) => {
      setCart(cart => cart.map(item => item.id === cartItemId ? { ...item, notes: note } : item));
    };

    const { subtotal, tax, total } = useMemo(() => {
        const sub = cart.reduce((sum, item) => sum + item.total_item, 0);
        if (!restaurantSettings) return { subtotal: sub, tax: 0, total: sub };
        const taxRate = restaurantSettings.iva_rate / 100;
        const taxAmount = restaurantSettings.precios_con_iva ? (sub / (1 + taxRate)) * taxRate : sub * taxRate;
        return { subtotal: sub, tax: taxAmount, total: restaurantSettings.precios_con_iva ? sub : sub + taxAmount };
    }, [cart, restaurantSettings]);
    
    const placeOrder = async (customer: Customer) => {
        const orderData = {
            customer_id: customer.id,
            tipo: orderType,
            subtotal,
            descuento: 0,
            impuestos: tax,
            propina: 0,
            total,
            items: cart,
            restaurant_id: restaurantId || 'rest-pizarra-01',
        };
        const newOrder = await createPublicOrder(orderData);
        if(newOrder) {
            setFinalizedOrder(newOrder);
            setPageState('confirm');
            setCart([]);
        }
    };
    
    const handleUseCurrentLocation = () => {
        if (!navigator.geolocation) {
            showToast("La geolocalización no es soportada por tu navegador.", "error");
            return;
        }
        setIsLocating(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setCustomerDetails(prev => ({
                    ...prev,
                    direccion: {
                        ...prev.direccion,
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    }
                }));
                showToast("Ubicación obtenida con éxito.", "success");
                setIsLocating(false);
            },
            (error) => {
                console.error("Error obtaining location", error);
                showToast("No se pudo obtener tu ubicación. Por favor ingrésala manualmente.", "error");
                setIsLocating(false);
            },
            { enableHighAccuracy: true }
        );
    };

    const handlePlaceOrder = async () => {
        if (!customerDetails.nombre.trim() || !customerDetails.telefono.trim()) {
            return showToast('Por favor, completa tu nombre y teléfono.', 'error');
        }
        if (orderType === OrderType.DELIVERY && !customerDetails.direccion.calle.trim()) {
            return showToast('Por favor, ingresa tu dirección para el delivery.', 'error');
        }

        const phoneRegex = /^\d{7,15}$/;
        if (!phoneRegex.test(customerDetails.telefono.replace(/\D/g, ''))) {
            return showToast('Por favor, ingresa un número de teléfono válido.', 'error');
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (customerDetails.email.trim() && !emailRegex.test(customerDetails.email.trim())) {
            return showToast('Por favor, ingresa un formato de email válido.', 'error');
        }

        setIsProcessing(true);
        
        // Simulate geocoding: Assign coordinates if none present and no geolocation used
        let finalAddress = { ...customerDetails.direccion };
        if (orderType === OrderType.DELIVERY && finalAddress.lat === 0 && finalAddress.lng === 0) {
             // Generate random coordinates near Buenos Aires Obelisco for demo fallback
             finalAddress.lat = -34.6037 + (Math.random() - 0.5) * 0.02;
             finalAddress.lng = -58.3816 + (Math.random() - 0.5) * 0.02;
        }

        try {
            const existingCustomer = await findCustomerByContact(customerDetails.telefono);

            if (existingCustomer) {
                // Update existing customer with new address info if provided
                if (orderType === OrderType.DELIVERY) {
                     existingCustomer.direccion = finalAddress;
                }
                
                if (existingCustomer.is_verified) {
                    await placeOrder(existingCustomer);
                } else {
                    setPendingOrder({ customer: existingCustomer });
                    setIsVerificationModalOpen(true);
                    setIsProcessing(false);
                }
            } else {
                const newCustomer = await createCustomer({
                    nombre: customerDetails.nombre,
                    telefono: customerDetails.telefono,
                    email: customerDetails.email || `${customerDetails.telefono}@system.com`,
                    direccion: finalAddress,
                });
                if (newCustomer) {
                    setPendingOrder({ customer: newCustomer });
                    setIsVerificationModalOpen(true);
                    setIsProcessing(false);
                } else {
                    showToast('No se pudo crear tu perfil de cliente. Inténtalo de nuevo.', 'error');
                    setIsProcessing(false);
                }
            }
        } catch (error) {
            console.error(error);
            showToast('Ocurrió un error al procesar tu pedido.', 'error');
            setIsProcessing(false);
        }
    };
    
    const handleVerifyCode = async (code: string) => {
      setIsProcessing(true);
      try {
        if (code === '1234') { // Demo verification
            await verifyCustomer(pendingOrder.customer.id);
            const customerWithVerification = { ...pendingOrder.customer, is_verified: true };
            await placeOrder(customerWithVerification);
            setIsVerificationModalOpen(false);
            setPendingOrder(null);
        } else {
            showToast('Código incorrecto. Inténtalo de nuevo.', 'error');
            setIsProcessing(false);
        }
      } catch (error) {
          console.error(error);
          showToast('Ocurrió un error durante la verificación.', 'error');
          setIsProcessing(false);
      }
    };

    const handleCustomerDetailsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      if(name.includes('.')) {
        const [parent, child] = name.split('.');
        setCustomerDetails(prev => ({...prev, [parent]: { ...prev[parent as 'direccion'], [child]: value }}));
      } else {
        setCustomerDetails(prev => ({ ...prev, [name]: value }));
      }
    }

    if (!restaurantSettings) {
      return <div className="flex h-screen items-center justify-center">Cargando...</div>
    }

    if (pageState === 'confirm') {
      return (
          <div className="flex h-screen items-center justify-center text-center p-4">
              <div>
                  <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                  <h1 className="text-3xl font-bold">¡Gracias por tu pedido!</h1>
                  <p className="text-lg text-gray-600 mt-2">Tu pedido número <strong>#{finalizedOrder?.id}</strong> ha sido recibido.</p>
                  <p className="mt-1">Te notificaremos cuando esté listo.</p>
                  <button onClick={() => setPageState('menu')} className="mt-8 px-6 py-2 bg-orange-500 text-white font-semibold rounded-lg">Hacer otro pedido</button>
              </div>
          </div>
      )
    }

    if (pageState === 'checkout') {
      return (
        <div className="max-w-xl mx-auto py-12 px-4">
          <h1 className="text-3xl font-bold mb-6">Finalizar Pedido</h1>
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-3">1. Tipo de Entrega</h2>
              <div className="grid grid-cols-2 gap-4">
                <button onClick={() => setOrderType(OrderType.PARA_LLEVAR)} className={`p-4 border rounded-lg flex flex-col items-center gap-2 ${orderType === OrderType.PARA_LLEVAR ? 'bg-orange-100 border-orange-500' : ''}`}>
                  <ShoppingBag /> Para Llevar
                </button>
                <button onClick={() => setOrderType(OrderType.DELIVERY)} className={`p-4 border rounded-lg flex flex-col items-center gap-2 ${orderType === OrderType.DELIVERY ? 'bg-orange-100 border-orange-500' : ''}`}>
                  <Truck /> Delivery
                </button>
              </div>
            </div>
            <div>
              <h2 className="text-xl font-semibold mb-3">2. Tus Datos</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input name="nombre" value={customerDetails.nombre} onChange={handleCustomerDetailsChange} placeholder="Nombre" className="p-3 border rounded-md" />
                <input name="telefono" value={customerDetails.telefono} onChange={handleCustomerDetailsChange} placeholder="Teléfono" className="p-3 border rounded-md" />
              </div>
               {orderType === OrderType.DELIVERY && (
                 <div className="mt-4 space-y-4">
                    <div className="relative">
                        <MapPin className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                        <input name="direccion.calle" value={customerDetails.direccion.calle} onChange={handleCustomerDetailsChange} placeholder="Dirección (Calle y Número)" className="w-full pl-10 p-3 border rounded-md" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <input name="direccion.ciudad" value={customerDetails.direccion.ciudad} onChange={handleCustomerDetailsChange} placeholder="Ciudad" className="p-3 border rounded-md" />
                      <input name="direccion.codigo_postal" value={customerDetails.direccion.codigo_postal} onChange={handleCustomerDetailsChange} placeholder="Código Postal" className="p-3 border rounded-md" />
                    </div>
                     <button
                        type="button"
                        onClick={handleUseCurrentLocation}
                        disabled={isLocating}
                        className="flex items-center justify-center gap-2 text-sm text-blue-600 hover:text-blue-800 font-medium mt-2 w-full p-2 border border-blue-200 rounded-md hover:bg-blue-50"
                    >
                        {isLocating ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />}
                        {isLocating ? 'Obteniendo ubicación...' : '📍 Usar mi ubicación actual'}
                    </button>
                    {customerDetails.direccion.lat !== 0 && (
                         <p className="text-xs text-green-600 font-semibold">
                            ✓ Ubicación GPS capturada correctamente.
                         </p>
                    )}
                    <p className="text-xs text-gray-500 italic">
                        * Al confirmar, usaremos tu ubicación para facilitar la entrega.
                    </p>
                 </div>
               )}
            </div>
            <div className="flex gap-4">
              <button onClick={() => setPageState('menu')} className="w-full py-3 border rounded-lg" disabled={isProcessing}>Volver al Menú</button>
              <button onClick={handlePlaceOrder} className="w-full py-3 bg-orange-500 text-white font-bold rounded-lg hover:bg-orange-600 disabled:bg-orange-300" disabled={isProcessing}>
                {isProcessing ? 'Procesando...' : `Realizar Pedido (${formatCurrency(total)})`}
              </button>
            </div>
          </div>
          {isVerificationModalOpen && <VerificationModal onClose={() => setIsVerificationModalOpen(false)} onVerify={handleVerifyCode} phone={customerDetails.telefono} isVerifying={isProcessing}/>}
        </div>
      );
    }

    return (
        <div className="flex flex-col md:flex-row h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
            <div className="flex-1 p-6 overflow-y-auto">
                <header className="mb-6">
                    <div className="flex items-center gap-3 mb-2">
                        <img src={restaurantSettings.logo_url} alt="Logo" className="h-10 w-10 rounded-full" />
                        <h1 className="text-3xl font-bold">{restaurantSettings.nombre}</h1>
                    </div>
                    <p className="text-gray-500">{restaurantSettings.direccion}</p>
                </header>
                <nav className="mb-6 border-b dark:border-gray-700">
                    <div className="-mb-px flex space-x-6 overflow-x-auto">
                        <button onClick={() => setActiveCategory('all')} className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${activeCategory === 'all' ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Todos</button>
                        {categories.map(cat => <button key={cat.id} onClick={() => setActiveCategory(cat.id)} className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${activeCategory === cat.id ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>{cat.nombre}</button>)}
                    </div>
                </nav>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredItems.map(item => (
                        <div key={item.id} className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden flex flex-col">
                            <img src={item.img_url} alt={item.nombre} className="h-40 w-full object-cover"/>
                            <div className="p-4 flex flex-col flex-1">
                                <h3 className="font-bold">{item.nombre}</h3>
                                <p className="text-sm text-gray-500 flex-1">{item.descripcion}</p>
                                <div className="flex justify-between items-center mt-4">
                                    <span className="font-bold text-lg">{formatCurrency(item.precio_base)}</span>
                                    <button onClick={() => handleAddToCart(item)} className="px-3 py-1.5 bg-orange-100 text-orange-600 dark:bg-orange-900/50 dark:text-orange-300 font-semibold text-sm rounded-full hover:bg-orange-200 dark:hover:bg-orange-900">Añadir</button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            <aside className="w-full md:w-96 p-4 bg-gray-100 dark:bg-gray-800/50">
                <Cart cart={cart} onUpdateQuantity={handleUpdateQuantity} onUpdateNote={handleUpdateNote} onCheckout={() => setPageState('checkout')} subtotal={subtotal} tax={tax} total={total} />
            </aside>
            {toast && <Toast message={toast.message} type={toast.type} />}
        </div>
    );
};
