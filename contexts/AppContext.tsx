
import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback, useMemo, useRef } from 'react';
import { User, Order, OrderStatus, MenuCategory, MenuItem, Customer, Coupon, Toast, OrderType, UserRole, PaymentDetails, Table, RestaurantSettings, TableStatus, Ingredient, RecipeItem, Restaurant } from '../types';
import { api } from '../services/api';
import { formatCurrency } from '../utils';

interface AppContextType {
  user: User | null;
  users: User[];
  login: (email: string, password_provided: string) => Promise<void>;
  logout: () => void;
  currentRestaurantId: string | null;
  switchRestaurant: (restaurantId: string) => Promise<void>;
  restaurants: Restaurant[];
  orders: Order[];
  tables: Table[];
  menuItems: MenuItem[];
  processedMenuItems: MenuItem[];
  allItemsForDisplay: MenuItem[];
  categories: MenuCategory[];
  customers: Customer[];
  coupons: Coupon[];
  ingredients: Ingredient[];
  restaurantSettings: RestaurantSettings | null;
  toast: Toast | null;
  updateOrderStatus: (orderId: number, status: OrderStatus) => Promise<void>;
  cancelOrder: (orderId: number) => Promise<void>;
  createOrder: (orderData: Omit<Order, 'id' | 'creado_en' | 'estado' | 'repartidor_id' | 'payments' | 'creado_por_id' | 'mozo_id'>) => Promise<Order | null>;
  createPublicOrder: (orderData: Omit<Order, 'id' | 'creado_en' | 'estado' | 'repartidor_id' | 'payments' | 'creado_por_id' | 'mozo_id'>) => Promise<Order | null>;
  createCustomer: (customerData: Omit<Customer, 'id' | 'restaurant_id' | 'ltv' | 'ultima_compra' | 'frecuencia_promedio_dias' | 'is_verified'>) => Promise<Customer | null>;
  updateCustomer: (customerData: Customer) => Promise<void>;
  deleteCustomer: (customerId: string) => Promise<void>;
  findCustomerByContact: (contact: string) => Promise<Customer | undefined>;
  verifyCustomer: (customerId: string) => Promise<void>;
  updateOrder: (orderId: number, orderData: Partial<Omit<Order, 'id' | 'creado_en'>>) => Promise<void>;
  assignRepartidor: (orderId: number, repartidorId: string) => Promise<void>;
  assignMozoToOrder: (orderId: number, mozoId: string | null) => Promise<void>;
  showToast: (message: string, type?: 'success' | 'error') => void;
  createCoupon: (couponData: Omit<Coupon, 'id' | 'restaurant_id'>) => Promise<void>;
  updateCoupon: (couponData: Coupon) => Promise<void>;
  deleteCoupon: (couponId: string) => Promise<void>;
  generatePaymentQR: (orderId: number, amount: number) => Promise<string | undefined>;
  addPaymentToOrder: (orderId: number, method: PaymentDetails['method'], amount: number) => Promise<void>;
  createUser: (userData: Omit<User, 'id' | 'restaurant_id' | 'avatar_url'>) => Promise<void>;
  updateUser: (userData: User) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
  createMenuItem: (itemData: Omit<MenuItem, 'id' | 'restaurant_id' | 'coste' | 'stock_actual'>) => Promise<void>;
  updateMenuItem: (itemData: MenuItem) => Promise<void>;
  deleteMenuItem: (itemId: string) => Promise<void>;
  restoreMenuItem: (itemId: string) => Promise<void>;
  updateCategories: (categories: MenuCategory[]) => Promise<void>;
  createCategory: (name: string) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  updateRestaurantSettings: (settings: RestaurantSettings, restaurantId?: string) => Promise<void>;
  cleanTable: (tableId: number) => Promise<void>;
  saveTableLayout: (tables: Table[]) => Promise<void>;
  updateTable: (table: Table) => Promise<void>;
  createIngredient: (data: Omit<Ingredient, 'id' | 'restaurant_id'>) => Promise<void>;
  updateIngredient: (data: Ingredient) => Promise<void>;
  deleteIngredient: (id: string) => Promise<void>;
  createRestaurant: (settings: RestaurantSettings) => Promise<void>;
  deleteRestaurant: (restaurantId: string) => Promise<void>;
  updateUserLocation: (userId: string, lat: number, lng: number) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [currentRestaurantId, setCurrentRestaurantId] = useState<string | null>(null);
  
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [restaurantSettings, setRestaurantSettings] = useState<RestaurantSettings | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const prevOrdersRef = useRef<Order[]>([]);


  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
      const newToast: Toast = { id: Date.now(), message, type };
      setToast(newToast);
      setTimeout(() => setToast(prev => (prev?.id === newToast.id ? null : prev)), 3000);
  }, []);

  const loadInitialData = useCallback(async (restaurantId: string) => {
    try {
      setIsLoading(true);
      const [ordersData, menuItemsData, customersData, couponsData, usersData, categoriesData, settingsData, tablesData, ingredientsData] = await Promise.all([
        api.getOrders(restaurantId),
        api.getMenuItems(restaurantId),
        api.getCustomers(restaurantId),
        api.getCoupons(restaurantId),
        api.getUsers(restaurantId),
        api.getCategories(restaurantId),
        api.getRestaurantSettings(restaurantId),
        api.getTables(restaurantId),
        api.getIngredients(restaurantId),
      ]);
      setOrders(ordersData);
      setMenuItems(menuItemsData);
      setCustomers(customersData);
      setCoupons(couponsData);
      setUsers(usersData);
      setCategories(categoriesData);
      setRestaurantSettings(settingsData);
      setTables(tablesData);
      setIngredients(ingredientsData);
    } catch (error) {
      console.error("Failed to load initial data", error);
      showToast("Error al cargar los datos del restaurante", "error");
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  // Initial load for restaurants for Super Admin context
  useEffect(() => {
      const loadRestaurants = async () => {
          const rests = await api.getRestaurants();
          setRestaurants(rests);
      };
      loadRestaurants();
  }, []);

  // Load data when restaurant ID changes (either by login or explicit switch via portal)
  useEffect(() => {
    if (currentRestaurantId) {
        loadInitialData(currentRestaurantId);
    } else {
        // Reset data if no restaurant is selected (except when logged in as Super Admin who sees global list)
        if (user?.rol !== UserRole.SUPER_ADMIN) {
            setOrders([]);
            setMenuItems([]);
            setCustomers([]);
            setCoupons([]);
            setUsers([]);
            setCategories([]);
            setRestaurantSettings(null);
            setTables([]);
            setIngredients([]);
        }
    }
  }, [currentRestaurantId, loadInitialData, user]);

  const switchRestaurant = async (restaurantId: string) => {
      setCurrentRestaurantId(restaurantId);
  };

  // Syncs the previous orders ref with the current state for comparison.
  useEffect(() => {
    prevOrdersRef.current = orders;
  }, [orders]);


  // Real-time notification polling effect
  useEffect(() => {
    if (!user || !currentRestaurantId) return; 

    const notificationSound = new Audio('https://cdn.pixabay.com/audio/2022/03/15/audio_2c244a341b.mp3');
    notificationSound.volume = 0.5;

    const playSound = () => {
        notificationSound.play().catch(e => console.warn("Sound play blocked (interaction needed):", e));
    };

    const intervalId = setInterval(async () => {
        const currentOrders = prevOrdersRef.current;
        if (!currentOrders) return;
        
        const newOrders = await api.getOrders(currentRestaurantId);
        const newUsers = await api.getUsers(currentRestaurantId);

        if (JSON.stringify(users) !== JSON.stringify(newUsers)) {
            setUsers(newUsers);
        }

        if (JSON.stringify(currentOrders) === JSON.stringify(newOrders)) {
            return; 
        }

        if ([UserRole.ADMIN, UserRole.GERENTE, UserRole.COCINA].includes(user.rol)) {
            const currentNewOrderIds = new Set(currentOrders.filter(o => o.estado === OrderStatus.NUEVO).map(o => o.id));
            const newlyArrivedOrders = newOrders.filter(o => o.estado === OrderStatus.NUEVO && !currentNewOrderIds.has(o.id));

            if (newlyArrivedOrders.length > 0) {
                showToast(`¡Nuevo pedido #${newlyArrivedOrders[0].id} en cocina!`, 'success');
                playSound();
            }
        }

        if (user.rol === UserRole.REPARTO) {
            const myOldOrdersMap = new Map<number, Order>(
                currentOrders.filter(o => o.repartidor_id === user.id).map(o => [o.id, o])
            );
            const myNewOrders = newOrders.filter(o => o.repartidor_id === user.id);

            myNewOrders.forEach(newOrder => {
                const oldOrder = myOldOrdersMap.get(newOrder.id);
                if (!oldOrder) {
                     if ([OrderStatus.LISTO, OrderStatus.EN_CAMINO].includes(newOrder.estado)) {
                        showToast(`📦 ¡Nuevo pedido asignado! #${newOrder.id}`, 'success');
                        playSound();
                     }
                }
                else if (oldOrder.estado !== newOrder.estado) {
                    showToast(`Pedido #${newOrder.id} actualizado: ${newOrder.estado}`, 'success');
                    playSound();
                }
            });
        }
        
        setOrders(newOrders);

    }, 5000); 

    return () => clearInterval(intervalId);
  }, [user, currentRestaurantId, showToast, users]); 

  const login = async (email: string, password_provided: string) => {
    const selectedUser = await api.login(email, password_provided);
    if (selectedUser) {
      setUser(selectedUser);
      if (selectedUser.rol === UserRole.SUPER_ADMIN) {
          setCurrentRestaurantId(null); // Super admin starts at dashboard, no restaurant selected initially
      } else {
          setCurrentRestaurantId(selectedUser.restaurant_id);
      }
    } else {
      showToast("Email o contraseña incorrectos", "error");
    }
  };

  const logout = () => {
    setUser(null);
    setCurrentRestaurantId(null);
  };

  const allItemsForDisplay = useMemo(() => {
    if (!menuItems.length) {
        return [];
    }
    
    const ingredientsMap: Map<string, Ingredient> = new Map(ingredients.map(i => [i.id, i]));

    return menuItems.map(item => {
        let calculatedCost = 0;
        let canMake = Infinity;
        let isAvailable = item.disponible;

        if (item.receta && item.receta.length > 0) {
            for (const recipeItem of item.receta) {
                const ingredient = ingredientsMap.get(recipeItem.ingredient_id);
                if (ingredient) {
                    calculatedCost += ingredient.coste_unitario * recipeItem.cantidad;
                    if (recipeItem.cantidad > 0) {
                        const possibleCount = Math.floor(ingredient.stock_actual / recipeItem.cantidad);
                        if (possibleCount < canMake) {
                            canMake = possibleCount;
                        }
                    }
                } else {
                    canMake = 0;
                }
            }
        }
        
        const stockActual = canMake === Infinity ? null : canMake;

        if (!item.permite_venta_sin_stock && stockActual !== null && stockActual <= 0) {
            isAvailable = false;
        }
        
        return {
            ...item,
            coste: calculatedCost,
            stock_actual: stockActual,
            disponible: isAvailable,
        };
    });
  }, [menuItems, ingredients]);

  const processedMenuItems = useMemo(() => {
    return allItemsForDisplay.filter(item => !item.is_deleted);
  }, [allItemsForDisplay]);


  const updateOrderStatus = async (orderId: number, newStatus: OrderStatus) => {
    if (!currentRestaurantId) return;
    try {
      const originalOrder = orders.find(o => o.id === orderId);
      const updatedOrder = await api.updateOrderStatus(orderId, newStatus);
      setOrders(prevOrders => prevOrders.map(order =>
        order.id === orderId ? updatedOrder : order
      ));

      if (originalOrder?.estado !== OrderStatus.EN_PREPARACION && newStatus === OrderStatus.EN_PREPARACION) {
          await api.deductStockForOrder(orderId);
          const updatedIngredients = await api.getIngredients(currentRestaurantId);
          setIngredients(updatedIngredients);
      }

      if (updatedOrder.tipo === OrderType.DELIVERY) {
        const usersData = await api.getUsers(currentRestaurantId);
        setUsers(usersData);
      }
      showToast(`Pedido #${orderId} actualizado a ${newStatus}`);
    } catch (error) {
      console.error(error);
      showToast("Error al actualizar el pedido", "error");
    }
  };
  
  const cancelOrder = async (orderId: number) => {
    if (!currentRestaurantId) return;
    try {
        const updatedOrder = await api.cancelOrder(orderId);
        setOrders(prevOrders => prevOrders.map(order =>
            order.id === orderId ? updatedOrder : order
        ));
        
        const [updatedIngredients, updatedUsers, updatedTables] = await Promise.all([
            api.getIngredients(currentRestaurantId),
            api.getUsers(currentRestaurantId),
            api.getTables(currentRestaurantId)
        ]);
        setIngredients(updatedIngredients);
        setUsers(updatedUsers);
        setTables(updatedTables);
        showToast(`Pedido #${orderId} ha sido cancelado.`);
    } catch (error: any) {
        console.error(error);
        showToast(error.message || "Error al cancelar el pedido", "error");
    }
  };

  const createOrder = async (orderData: Omit<Order, 'id' | 'creado_en' | 'estado' | 'repartidor_id' | 'payments' | 'creado_por_id' | 'mozo_id'>): Promise<Order | null> => {
    if (!user || !currentRestaurantId) {
        showToast("Error de autenticación o contexto. No se pudo crear el pedido.", "error");
        return null;
    }
    try {
      const isSalaOrder = orderData.tipo === OrderType.SALA;
      const mozo_id = (isSalaOrder && user?.rol === UserRole.MOZO) ? user.id : null;
      
      const newOrder = await api.createOrder({ ...orderData, creado_por_id: user.id, mozo_id, restaurant_id: currentRestaurantId });
      setOrders(prevOrders => [newOrder, ...prevOrders]);

      if (newOrder.tipo === OrderType.SALA && newOrder.table_id) {
          const tableToUpdate = tables.find(t => t.id === newOrder.table_id);
          if (tableToUpdate) {
              await updateTable({
                  ...tableToUpdate,
                  estado: TableStatus.OCUPADA,
                  order_id: newOrder.id,
                  mozo_id: user.id
              });
          }
      }

      if (newOrder.tipo === OrderType.DELIVERY) {
        const usersData = await api.getUsers(currentRestaurantId);
        setUsers(usersData);
      }
      showToast(`Pedido #${newOrder.id} creado.`);
      return newOrder;
    } catch (error) {
      console.error(error);
      showToast("Error al crear el pedido", "error");
      return null;
    }
  };

  const createPublicOrder = async (orderData: Omit<Order, 'id' | 'creado_en' | 'estado' | 'repartidor_id' | 'payments' | 'creado_por_id' | 'mozo_id'>): Promise<Order | null> => {
    if (!currentRestaurantId) return null;
    try {
      const newOrder = await api.createPublicOrder({ ...orderData, restaurant_id: currentRestaurantId });
      setOrders(prevOrders => [newOrder, ...prevOrders]);
      showToast(`Pedido #${newOrder.id} recibido. ¡Gracias!`);
      return newOrder;
    } catch (error) {
      console.error(error);
      showToast("Error al crear el pedido", "error");
      return null;
    }
  };

  const createCustomer = async (customerData: Omit<Customer, 'id' | 'restaurant_id' | 'ltv' | 'ultima_compra' | 'frecuencia_promedio_dias' | 'is_verified'>): Promise<Customer | null> => {
    if (!currentRestaurantId) return null;
    try {
      const newCustomer = await api.createCustomer({ ...customerData, restaurant_id: currentRestaurantId });
      setCustomers(prev => [newCustomer, ...prev].sort((a,b) => a.nombre.localeCompare(b.nombre)));
      showToast(`Cliente '${newCustomer.nombre}' creado con éxito.`);
      return newCustomer;
    } catch (error) {
      console.error(error);
      showToast("Error al crear el cliente", "error");
      return null;
    }
  };

  const findCustomerByContact = async (contact: string): Promise<Customer | undefined> => {
    if (!currentRestaurantId) return undefined;
    try {
        return await api.findCustomerByContact(currentRestaurantId, contact);
    } catch (error) {
        console.error(error);
        showToast("Error al buscar cliente", "error");
        return undefined;
    }
  };

  const verifyCustomer = async (customerId: string) => {
    try {
        const updatedCustomer = await api.verifyCustomer(customerId);
        setCustomers(prev => prev.map(c => c.id === updatedCustomer.id ? updatedCustomer : c));
        showToast("Cliente verificado con éxito.", "success");
    } catch (error) {
        console.error(error);
        showToast("Error al verificar cliente", "error");
    }
  };


  const updateCustomer = async (customerData: Customer) => {
    try {
      const updatedCustomer = await api.updateCustomer(customerData);
      setCustomers(prev => prev.map(c => c.id === updatedCustomer.id ? updatedCustomer : c));
      showToast(`Cliente '${updatedCustomer.nombre}' actualizado correctamente.`);
    } catch (error) {
      console.error(error);
      showToast("Error al actualizar el cliente", "error");
    }
  };
  
  const deleteCustomer = async (customerId: string) => {
    if (!currentRestaurantId) return;
    try {
      await api.deleteCustomer(customerId);
      const updatedCustomers = await api.getCustomers(currentRestaurantId); 
      setCustomers(updatedCustomers); 
      showToast(`Cliente desactivado con éxito.`);
    } catch (error: any) {
      console.error(error);
      showToast(error.message || "Error al desactivar el cliente", "error");
    }
  };
  
  const updateOrder = async (orderId: number, orderData: Partial<Omit<Order, 'id' | 'creado_en'>>) => {
    try {
      if (orderData.tipo === OrderType.DELIVERY && orderData.customer_id) {
          const customer = customers.find(c => c.id === orderData.customer_id);
          if (!customer?.is_verified) {
              showToast("No se puede cambiar a Delivery. El cliente seleccionado no está verificado.", "error");
              return;
          }
      }

      const updatedOrder = await api.updateOrder(orderId, orderData);
      setOrders(prevOrders => prevOrders.map(order => 
        order.id === orderId ? updatedOrder : order
      ));
      showToast(`Pedido #${orderId} actualizado con éxito`);
    } catch (error) {
      console.error(error);
      showToast("Error al actualizar el pedido", "error");
    }
  };

  const assignRepartidor = async (orderId: number, repartidorId: string) => {
    if (!currentRestaurantId) return;
    try {
      const updatedOrder = await api.assignRepartidorToOrder(orderId, repartidorId);
      setOrders(prevOrders => prevOrders.map(order => 
        order.id === orderId ? updatedOrder : order
      ));
      const usersData = await api.getUsers(currentRestaurantId);
      setUsers(usersData);
      showToast(`Pedido #${orderId} asignado con éxito.`);
    } catch (error) {
      console.error(error);
      showToast("Error al asignar repartidor", "error");
    }
  };

  const assignMozoToOrder = async (orderId: number, mozoId: string | null) => {
    try {
        const updatedOrder = await api.updateOrder(orderId, { mozo_id: mozoId });
        setOrders(prev => prev.map(o => o.id === orderId ? updatedOrder : o));
        showToast(`Mozo/a asignado al pedido #${orderId}.`);
    } catch (error) {
        console.error(error);
        showToast("Error al asignar mozo/a", "error");
    }
  };

  const createCoupon = async (couponData: Omit<Coupon, 'id' | 'restaurant_id'>) => {
    if (!currentRestaurantId) return;
    try {
      const newCoupon = await api.createCoupon({ ...couponData, restaurant_id: currentRestaurantId });
      setCoupons(prev => [newCoupon, ...prev].sort((a, b) => (a.activo === b.activo) ? 0 : a.activo ? -1 : 1));
      showToast(`Cupón '${newCoupon.codigo}' creado con éxito.`);
    } catch (error) {
      console.error(error);
      showToast("Error al crear el cupón", "error");
    }
  };

  const updateCoupon = async (couponData: Coupon) => {
    try {
      const updatedCoupon = await api.updateCoupon(couponData);
      setCoupons(prev => prev.map(c => c.id === updatedCoupon.id ? updatedCoupon : c));
      showToast(`Cupón '${updatedCoupon.codigo}' actualizado con éxito.`);
    } catch (error) {
      console.error(error);
      showToast("Error al actualizar el cupón", "error");
    }
  };

  const deleteCoupon = async (couponId: string) => {
    try {
      await api.deleteCoupon(couponId);
      setCoupons(prev => prev.filter(c => c.id !== couponId));
      showToast(`Cupón eliminado con éxito.`);
    } catch (error) {
      console.error(error);
      showToast("Error al eliminar el cupón", "error");
    }
  };

  const generatePaymentQR = async (orderId: number, amount: number): Promise<string | undefined> => {
    try {
        const updatedOrder = await api.generatePaymentQR(orderId, amount);
        const qrCodeUrl = (updatedOrder as any).last_qr_code_url;
        setOrders(prevOrders => prevOrders.map(order =>
            order.id === orderId ? updatedOrder : order
        ));
        showToast("QR de pago generado para el pedido #" + orderId);
        return qrCodeUrl;
    } catch (error) {
        console.error(error);
        showToast("Error al generar el código QR", "error");
    }
    return undefined;
  };

  const addPaymentToOrder = async (orderId: number, method: PaymentDetails['method'], amount: number) => {
    try {
        const originalOrder = orders.find(o => o.id === orderId);
        const updatedOrder = await api.addPaymentToOrder(orderId, method!, amount);
        setOrders(prevOrders => prevOrders.map(order =>
            order.id === orderId ? updatedOrder : order
        ));
        
        if (originalOrder && originalOrder.tipo === OrderType.SALA && originalOrder.table_id) {
            const totalPaid = updatedOrder.payments.reduce((sum, p) => sum + p.amount, 0);
            if(totalPaid >= updatedOrder.total) {
                const tableToUpdate = tables.find(t => t.id === originalOrder.table_id);
                if (tableToUpdate) {
                    await updateTable({
                        ...tableToUpdate,
                        estado: TableStatus.NECESITA_LIMPIEZA,
                        order_id: null,
                        mozo_id: null
                    });
                }
            }
        }

        showToast(`Pago de ${formatCurrency(amount)} registrado para el pedido #${orderId}.`);
    } catch (error) {
        console.error(error);
        showToast("Error al procesar el pago", "error");
    }
  };
  
  const createUser = async (userData: Omit<User, 'id' | 'restaurant_id' | 'avatar_url'>) => {
    if (!currentRestaurantId) return;
    try {
      const newUser = await api.createUser({ ...userData, restaurant_id: currentRestaurantId });
      setUsers(prev => [newUser, ...prev].sort((a, b) => a.nombre.localeCompare(b.nombre)));
      showToast(`Usuario '${newUser.nombre}' creado con éxito.`);
    } catch (error) {
      console.error(error);
      showToast("Error al crear el usuario", "error");
    }
  };

  const updateUser = async (userData: User) => {
    try {
      const updatedUser = await api.updateUser(userData);
      setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
      showToast(`Usuario '${updatedUser.nombre}' actualizado con éxito.`);
    } catch (error) {
      console.error(error);
      showToast("Error al actualizar el usuario", "error");
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      await api.deleteUser(userId);
      setUsers(prev => prev.filter(u => u.id !== userId));
      showToast(`Usuario eliminado con éxito.`);
    } catch (error: any) {
      console.error(error);
      showToast(error.message || "Error al eliminar el usuario", "error");
    }
  };

  const createMenuItem = async (itemData: Omit<MenuItem, 'id' | 'restaurant_id' | 'coste' | 'stock_actual'>) => {
    if (!currentRestaurantId) return;
    try {
      const newItem = await api.createMenuItem({ 
        ...itemData, 
        restaurant_id: currentRestaurantId,
        coste: 0,
        stock_actual: null
      });
      setMenuItems(prev => [newItem, ...prev].sort((a,b) => a.nombre.localeCompare(b.nombre)));
      showToast(`Producto '${newItem.nombre}' creado con éxito.`);
    } catch (error) {
      console.error(error);
      showToast("Error al crear el producto", "error");
    }
  };

  const updateMenuItem = async (itemData: MenuItem) => {
    try {
      const updatedItem = await api.updateMenuItem(itemData);
      setMenuItems(prev => prev.map(item => (item.id === updatedItem.id ? updatedItem : item)));
      showToast(`Producto '${updatedItem.nombre}' actualizado con éxito.`);
    } catch (error) {
      console.error(error);
      showToast("Error al actualizar el producto", "error");
    }
  };

  const deleteMenuItem = async (itemId: string) => {
    try {
      const updatedItem = await api.deleteMenuItem(itemId);
      setMenuItems(prev => prev.map(item => item.id === itemId ? updatedItem : item));
      showToast('Producto eliminado con éxito.');
    } catch (error: any) {
      console.error(error);
      showToast(error.message || 'Error al eliminar el producto', 'error');
    }
  };

  const restoreMenuItem = async (itemId: string) => {
    try {
      const updatedItem = await api.restoreMenuItem(itemId);
      setMenuItems(prev => prev.map(item => item.id === itemId ? updatedItem : item));
      showToast('Producto restaurado con éxito.');
    } catch (error) {
      console.error(error);
      showToast('Error al restaurar el producto', 'error');
    }
  };

  const updateCategories = async (categories: MenuCategory[]) => {
    try {
        const newCategories = await api.updateCategories(categories);
        setCategories(newCategories);
        showToast("Orden de categorías actualizado con éxito.");
    } catch (error) {
        console.error("Error al actualizar categorías", error);
        showToast("Error al actualizar las categorías", "error");
    }
  };

  const createCategory = async (name: string) => {
    if (!currentRestaurantId) return;
    try {
        const newCategory = await api.createCategory({ nombre: name, restaurant_id: currentRestaurantId, orden: 0 });
        setCategories(prev => [...prev, newCategory].sort((a, b) => a.orden - b.orden));
        showToast(`Categoría '${name}' creada con éxito.`);
    } catch (error) {
        console.error("Error al crear categoría", error);
        showToast("Error al crear la categoría", "error");
    }
  };

  const deleteCategory = async (id: string) => {
    try {
        await api.deleteCategory(id);
        setCategories(prev => prev.filter(c => c.id !== id));
        showToast("Categoría eliminada con éxito.");
    } catch (error: any) {
        console.error("Error al eliminar categoría", error);
        showToast(error.message || "Error al eliminar la categoría", "error");
    }
  };
  
  const updateRestaurantSettings = async (settings: RestaurantSettings, restaurantId?: string) => {
    const targetId = restaurantId || currentRestaurantId;
    if (!targetId) return;
    try {
      const updatedSettings = await api.updateRestaurantSettings(targetId, settings);
      
      if (targetId === currentRestaurantId) {
        setRestaurantSettings(updatedSettings);
      }
      
      // Update list if it exists (for Super Admin view)
      setRestaurants(prev => prev.map(r => r.id === targetId ? { ...r, settings: updatedSettings } : r));

      showToast("Configuración del restaurante guardada con éxito.");
    } catch (error) {
      console.error("Failed to update settings", error);
      showToast("Error al guardar la configuración", "error");
    }
  };

  const cleanTable = async (tableId: number) => {
    const tableToClean = tables.find(t => t.id === tableId);
    if(tableToClean) {
        await updateTable({...tableToClean, estado: TableStatus.LIBRE, order_id: null, mozo_id: null});
        showToast(`Mesa ${tableId} marcada como limpia.`);
    }
  };

  const saveTableLayout = async (tablesToSave: Table[]) => {
    try {
        const updatedTables = await api.updateTablesLayout(tablesToSave);
        setTables(updatedTables);
        showToast("Diseño del salón guardado con éxito.");
    } catch (error) {
        console.error("Error saving table layout", error);
        showToast("Error al guardar el diseño del salón", "error");
    }
  };

  const updateTable = async (table: Table) => {
    try {
        const updatedTable = await api.updateTable(table);
        setTables(prev => prev.map(t => t.id === updatedTable.id ? updatedTable : t));
    } catch (error) {
        console.error("Error updating table", error);
        showToast("Error al actualizar la mesa.", "error");
    }
  };

  const createIngredient = async (data: Omit<Ingredient, 'id' | 'restaurant_id'>) => {
    if (!currentRestaurantId) return;
    try {
        const newIngredient = await api.createIngredient({ ...data, restaurant_id: currentRestaurantId });
        setIngredients(prev => [...prev, newIngredient]);
        showToast(`Ingrediente '${newIngredient.nombre}' creado.`);
    } catch (error) {
        console.error(error);
        showToast("Error al crear ingrediente", "error");
    }
  };

  const updateIngredient = async (data: Ingredient) => {
    try {
        const updated = await api.updateIngredient(data);
        setIngredients(prev => prev.map(i => i.id === updated.id ? updated : i));
        showToast(`Ingrediente '${updated.nombre}' actualizado.`);
    } catch (error) {
        console.error(error);
        showToast("Error al actualizar ingrediente", "error");
    }
  };

  const deleteIngredient = async (id: string) => {
    try {
        await api.deleteIngredient(id);
        setIngredients(prev => prev.filter(i => i.id !== id));
        // Also refresh menu items as recipes might change
        if(currentRestaurantId) {
            const items = await api.getMenuItems(currentRestaurantId);
            setMenuItems(items);
        }
        showToast("Ingrediente eliminado.");
    } catch (error) {
        console.error(error);
        showToast("Error al eliminar ingrediente", "error");
    }
  };

  const createRestaurant = async (settings: RestaurantSettings) => {
      try {
          const newRestaurant = await api.createRestaurant(settings);
          setRestaurants(prev => [...prev, newRestaurant]);
          showToast(`Restaurante '${newRestaurant.settings.nombre}' creado.`);
      } catch (error) {
          console.error(error);
          showToast("Error al crear restaurante", "error");
      }
  };

  const deleteRestaurant = async (restaurantId: string) => {
      try {
          await api.deleteRestaurant(restaurantId);
          setRestaurants(prev => prev.filter(r => r.id !== restaurantId));
          showToast("Restaurante eliminado.");
      } catch (error) {
           console.error(error);
           showToast("Error al eliminar restaurante", "error");
      }
  };

  const updateUserLocation = async (userId: string, lat: number, lng: number) => {
     try {
         await api.updateUserLocation(userId, lat, lng);
         setUsers(prev => prev.map(u => u.id === userId ? { ...u, last_location: { lat, lng, updated_at: new Date().toISOString() } } : u));
     } catch (error) {
         console.error("Failed to update user location", error);
     }
  };

  const value = {
    user,
    users,
    login,
    logout,
    currentRestaurantId,
    switchRestaurant,
    restaurants,
    orders,
    tables,
    menuItems,
    processedMenuItems,
    allItemsForDisplay,
    categories,
    customers,
    coupons,
    ingredients,
    restaurantSettings,
    toast,
    updateOrderStatus,
    cancelOrder,
    createOrder,
    createPublicOrder,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    findCustomerByContact,
    verifyCustomer,
    updateOrder,
    assignRepartidor,
    assignMozoToOrder,
    showToast,
    createCoupon,
    updateCoupon,
    deleteCoupon,
    generatePaymentQR,
    addPaymentToOrder,
    createUser,
    updateUser,
    deleteUser,
    createMenuItem,
    updateMenuItem,
    deleteMenuItem,
    restoreMenuItem,
    updateCategories,
    createCategory,
    deleteCategory,
    updateRestaurantSettings,
    cleanTable,
    saveTableLayout,
    updateTable,
    createIngredient,
    updateIngredient,
    deleteIngredient,
    createRestaurant,
    deleteRestaurant,
    updateUserLocation,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};