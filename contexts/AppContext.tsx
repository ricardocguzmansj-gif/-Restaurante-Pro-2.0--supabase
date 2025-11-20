
import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback, useMemo, useRef } from 'react';
import { User, Order, OrderStatus, MenuCategory, MenuItem, Customer, Coupon, Toast, OrderType, UserRole, PaymentDetails, Table, RestaurantSettings, TableStatus, Ingredient, RecipeItem, Restaurant } from '../types';
import { api } from '../services/api';
import { formatCurrency } from '../utils';
import { isSupabaseConfigured, getSupabaseClient } from '../services/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

interface AppContextType {
  user: User | null;
  users: User[];
  login: (email: string, password_provided: string) => Promise<void>;
  logout: () => void;
  recoverPassword: (email: string) => Promise<string>;
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
  isOnline: boolean;
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
  const subscriptionRef = useRef<RealtimeChannel | null>(null);

  // Determine if we are using Supabase
  const isOnline = isSupabaseConfigured();

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
      showToast("Error al cargar los datos. Verifica tu conexión.", "error");
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  // Initial load for restaurants for Super Admin context
  useEffect(() => {
      const loadRestaurants = async () => {
          try {
              const rests = await api.getRestaurants();
              setRestaurants(rests);
          } catch (e) {
              console.error(e);
          }
      };
      loadRestaurants();
  }, []);

  // Load data when restaurant ID changes
  useEffect(() => {
    if (currentRestaurantId) {
        loadInitialData(currentRestaurantId);
    } else {
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

  // Setup Realtime Subscription for Orders (Supabase Mode)
  useEffect(() => {
    if (!isOnline || !currentRestaurantId) return;
    
    const supabase = getSupabaseClient();
    if (!supabase) return;

    const playSound = () => {
        const notificationSound = new Audio('https://cdn.pixabay.com/audio/2022/03/15/audio_2c244a341b.mp3');
        notificationSound.volume = 0.5;
        notificationSound.play().catch(e => console.warn("Sound play blocked:", e));
    };

    // Clean up previous subscription
    if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
    }

    const channel = supabase
        .channel(`restaurant_${currentRestaurantId}`)
        .on('postgres_changes', 
            { event: '*', schema: 'public', table: 'orders', filter: `restaurant_id=eq.${currentRestaurantId}` }, 
            (payload) => {
                if (payload.eventType === 'INSERT') {
                    const newOrder = payload.new as Order;
                    setOrders(prev => [newOrder, ...prev]);
                    if ([UserRole.ADMIN, UserRole.GERENTE, UserRole.COCINA].includes(user?.rol as UserRole)) {
                        showToast(`¡Nuevo pedido #${newOrder.id}!`, 'success');
                        playSound();
                    }
                } else if (payload.eventType === 'UPDATE') {
                    const updatedOrder = payload.new as Order;
                    setOrders(prev => prev.map(o => o.id === updatedOrder.id ? updatedOrder : o));
                }
            }
        )
        .subscribe();
    
    subscriptionRef.current = channel;

    return () => {
        if (subscriptionRef.current) supabase.removeChannel(subscriptionRef.current);
    };
  }, [isOnline, currentRestaurantId, user, showToast]);


  // Fallback Polling for Local Mode (legacy)
  useEffect(() => {
    if (isOnline || !user || !currentRestaurantId) return; 

    const notificationSound = new Audio('https://cdn.pixabay.com/audio/2022/03/15/audio_2c244a341b.mp3');
    notificationSound.volume = 0.5;

    const playSound = () => {
        notificationSound.play().catch(e => console.warn("Sound play blocked:", e));
    };

    const intervalId = setInterval(async () => {
        const currentOrders = prevOrdersRef.current;
        if (!currentOrders) return;
        
        const newOrders = await api.getOrders(currentRestaurantId);
        
        if (JSON.stringify(currentOrders) === JSON.stringify(newOrders)) {
            return; 
        }

        // Logic for notifications same as before...
         if ([UserRole.ADMIN, UserRole.GERENTE, UserRole.COCINA].includes(user.rol)) {
            const currentNewOrderIds = new Set(currentOrders.filter(o => o.estado === OrderStatus.NUEVO).map(o => o.id));
            const newlyArrivedOrders = newOrders.filter(o => o.estado === OrderStatus.NUEVO && !currentNewOrderIds.has(o.id));

            if (newlyArrivedOrders.length > 0) {
                showToast(`¡Nuevo pedido #${newlyArrivedOrders[0].id} en cocina!`, 'success');
                playSound();
            }
        }
        
        setOrders(newOrders);

    }, 5000); 

    return () => clearInterval(intervalId);
  }, [user, currentRestaurantId, showToast, isOnline]); 

  // Keep prevOrders synced for polling logic
  useEffect(() => {
    prevOrdersRef.current = orders;
  }, [orders]);

  const switchRestaurant = async (restaurantId: string) => {
      setCurrentRestaurantId(restaurantId);
  };

  const login = async (email: string, password_provided: string) => {
    try {
        const selectedUser = await api.login(email, password_provided);
        if (selectedUser) {
          setUser(selectedUser);
          if (selectedUser.rol === UserRole.SUPER_ADMIN) {
              setCurrentRestaurantId(null);
          } else {
              setCurrentRestaurantId(selectedUser.restaurant_id);
          }
        } else {
          showToast("Email o contraseña incorrectos", "error");
        }
    } catch (e) {
        console.error(e);
        showToast("Error de conexión al iniciar sesión", "error");
    }
  };

  const recoverPassword = async (email: string): Promise<string> => {
      return await api.recoverPassword(email);
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


  // --- ACTIONS WRAPPERS (To handle async updates in UI optimistically or rely on fetch) ---
  // For simplicity in this conversion, we rely on the API return values and state setters.
  // The Realtime subscription will handle "other people's changes", 
  // but for our own actions, updating state immediately makes UI snappier.

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
        
        // Refresh related data that might have changed due to cancellation logic (stock, users)
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
        showToast("Error de autenticación o contexto.", "error");
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
      // Don't update state here if not logged in, but for testing we might
      showToast(`Pedido #${newOrder.id} recibido. ¡Gracias!`);
      return newOrder;
    } catch (error) {
      console.error(error);
      showToast("Error al crear el pedido", "error");
      return null;
    }
  };

  // ... (keep other CRUD methods similar, ensuring they update state)

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

  const updateCustomer = async (customerData: Customer) => {
    try {
      const updatedCustomer = await api.updateCustomer(customerData);
      setCustomers(prev => prev.map(c => c.id === updatedCustomer.id ? updatedCustomer : c));
      showToast(`Cliente '${updatedCustomer.nombre}' actualizado.`);
    } catch (error) {
      showToast("Error al actualizar el cliente", "error");
    }
  };
  
  const deleteCustomer = async (customerId: string) => {
    try {
      await api.deleteCustomer(customerId);
      setCustomers(prev => prev.filter(c => c.id !== customerId)); // Or refetch if soft delete
      showToast(`Cliente desactivado.`);
    } catch (error) {
      showToast("Error al desactivar cliente", "error");
    }
  };

  const findCustomerByContact = async (contact: string) => api.findCustomerByContact(currentRestaurantId || '', contact);
  const verifyCustomer = async (id: string) => { await api.verifyCustomer(id); setCustomers(prev => prev.map(c => c.id === id ? {...c, is_verified: true} : c)); };
  
  const updateOrder = async (id: number, data: any) => {
      const updated = await api.updateOrder(id, data);
      setOrders(prev => prev.map(o => o.id === id ? updated : o));
  };
  const assignRepartidor = async (id: number, repId: string) => {
      const updated = await api.assignRepartidorToOrder(id, repId);
      setOrders(prev => prev.map(o => o.id === id ? updated : o));
      // Also refresh users to see status change
      if(currentRestaurantId) setUsers(await api.getUsers(currentRestaurantId));
  };
  const assignMozoToOrder = async (id: number, mozoId: string|null) => {
       await api.updateOrder(id, { mozo_id: mozoId });
       setOrders(prev => prev.map(o => o.id === id ? {...o, mozo_id: mozoId} : o));
  };
  
  const createCoupon = async (data: any) => { 
      if(!currentRestaurantId) return;
      const newC = await api.createCoupon({...data, restaurant_id: currentRestaurantId}); 
      setCoupons(prev => [newC, ...prev]);
  };
  const updateCoupon = async (data: any) => { const updated = await api.updateCoupon(data); setCoupons(prev => prev.map(c => c.id === data.id ? updated : c)); };
  const deleteCoupon = async (id: string) => { await api.deleteCoupon(id); setCoupons(prev => prev.filter(c => c.id !== id)); };
  
  const generatePaymentQR = async (id: number, amt: number) => { const res = await api.generatePaymentQR(id, amt); return (res as any).last_qr_code_url; };
  const addPaymentToOrder = async (id: number, method: any, amt: number) => { 
      const updated = await api.addPaymentToOrder(id, method, amt); 
      setOrders(prev => prev.map(o => o.id === id ? updated : o));
  };
  
  const createUser = async (data: any) => { if(!currentRestaurantId) return; const u = await api.createUser({...data, restaurant_id: currentRestaurantId}); setUsers(prev => [...prev, u]); };
  const updateUser = async (data: any) => { const u = await api.updateUser(data); setUsers(prev => prev.map(x => x.id === data.id ? u : x)); };
  const deleteUser = async (id: string) => { await api.deleteUser(id); setUsers(prev => prev.filter(x => x.id !== id)); };
  
  const createMenuItem = async (data: any) => { if(!currentRestaurantId) return; const m = await api.createMenuItem({...data, restaurant_id: currentRestaurantId}); setMenuItems(prev => [...prev, m]); };
  const updateMenuItem = async (data: any) => { const m = await api.updateMenuItem(data); setMenuItems(prev => prev.map(x => x.id === data.id ? m : x)); };
  const deleteMenuItem = async (id: string) => { const m = await api.deleteMenuItem(id); setMenuItems(prev => prev.map(x => x.id === id ? m : x)); };
  const restoreMenuItem = async (id: string) => { const m = await api.restoreMenuItem(id); setMenuItems(prev => prev.map(x => x.id === id ? m : x)); };
  
  const updateCategories = async (cats: any[]) => { const newCats = await api.updateCategories(cats); setCategories(newCats); };
  const createCategory = async (name: string) => { if(!currentRestaurantId) return; const c = await api.createCategory({nombre: name, restaurant_id: currentRestaurantId, orden: 99}); setCategories(prev => [...prev, c]); };
  const deleteCategory = async (id: string) => { await api.deleteCategory(id); setCategories(prev => prev.filter(c => c.id !== id)); };
  
  const updateRestaurantSettings = async (s: any, rId?: string) => { 
      const target = rId || currentRestaurantId;
      if(!target) return;
      const updated = await api.updateRestaurantSettings(target, s); 
      if(target === currentRestaurantId) setRestaurantSettings(updated);
  };
  
  const cleanTable = async (id: number) => {
      if(!currentRestaurantId) return;
      // Optimistic update locally for table object in context
      const targetTable = tables.find(t => t.id === id);
      if(targetTable) {
          const updated = await api.updateTable({...targetTable, estado: TableStatus.LIBRE, order_id: null, mozo_id: null});
          setTables(prev => prev.map(t => t.id === updated.id ? updated : t));
      }
  };
  const saveTableLayout = async (tbls: any[]) => { const updated = await api.updateTablesLayout(tbls); setTables(updated); };
  const updateTable = async (t: Table) => { const updated = await api.updateTable(t); setTables(prev => prev.map(x => x.id === updated.id ? updated : x)); };
  
  const createIngredient = async (data: any) => { if(!currentRestaurantId) return; const i = await api.createIngredient({...data, restaurant_id: currentRestaurantId}); setIngredients(prev => [...prev, i]); };
  const updateIngredient = async (data: any) => { const i = await api.updateIngredient(data); setIngredients(prev => prev.map(x => x.id === data.id ? i : x)); };
  const deleteIngredient = async (id: string) => { await api.deleteIngredient(id); setIngredients(prev => prev.filter(x => x.id !== id)); };
  
  const createRestaurant = async (s: any) => { const r = await api.createRestaurant(s); setRestaurants(prev => [...prev, r]); };
  const deleteRestaurant = async (id: string) => { await api.deleteRestaurant(id); setRestaurants(prev => prev.filter(r => r.id !== id)); };
  const updateUserLocation = async (id: string, lat: number, lng: number) => { await api.updateUserLocation(id, lat, lng); };

  const value = {
    user, users, login, logout, recoverPassword, currentRestaurantId, switchRestaurant, restaurants, orders, tables, menuItems, processedMenuItems, allItemsForDisplay, categories, customers, coupons, ingredients, restaurantSettings, toast,
    updateOrderStatus, cancelOrder, createOrder, createPublicOrder, createCustomer, updateCustomer, deleteCustomer, findCustomerByContact, verifyCustomer, updateOrder, assignRepartidor, assignMozoToOrder, showToast, createCoupon, updateCoupon, deleteCoupon, generatePaymentQR, addPaymentToOrder,
    createUser, updateUser, deleteUser, createMenuItem, updateMenuItem, deleteMenuItem, restoreMenuItem, updateCategories, createCategory, deleteCategory, updateRestaurantSettings, cleanTable, saveTableLayout, updateTable, createIngredient, updateIngredient, deleteIngredient, createRestaurant, deleteRestaurant, updateUserLocation,
    isOnline
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
