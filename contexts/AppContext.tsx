
import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback, useMemo, useRef } from 'react';
import { User, Order, OrderStatus, MenuCategory, MenuItem, Customer, Coupon, Toast, OrderType, UserRole, PaymentDetails, Table, RestaurantSettings, TableStatus, Ingredient, RecipeItem, Restaurant } from '../types';
import { api } from '../services/api';
import { formatCurrency } from '../utils';
import { getSupabaseClient } from '../services/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

interface AppContextType {
  user: User | null;
  users: User[];
  login: (email: string, password_provided: string) => Promise<boolean>;
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
  updateCategories: (categories: MenuCategory[]) => Promise<boolean>;
  createCategory: (name: string, parentId?: string | null) => Promise<MenuCategory | null>;
  deleteCategory: (id: string) => Promise<void>;
  updateRestaurantSettings: (settings: RestaurantSettings, restaurantId?: string) => Promise<void>;
  cleanTable: (tableId: string | number) => Promise<void>;
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
  const subscriptionRef = useRef<RealtimeChannel | null>(null);

  const isOnline = true;

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
      let safeMessage = 'Operación realizada';
      
      if (typeof message === 'string') {
          safeMessage = message;
      } else if (message && typeof message === 'object') {
          safeMessage = (message as any).message || 
                        (message as any).error_description || 
                        (message as any).details || 
                        JSON.stringify(message);
      }
      
      const newToast: Toast = { id: Date.now(), message: safeMessage, type };
      setToast(newToast);
      setTimeout(() => setToast(prev => (prev?.id === newToast.id ? null : prev)), 5000);
  }, []);

  const handleError = useCallback((error: any, defaultMsg: string) => {
      console.error("AppContext Error:", defaultMsg, error);
      let msg = defaultMsg;
      
      if (error) {
          let errorText = null;
          if (typeof error === 'string') {
              errorText = error;
          } else if (typeof error === 'object') {
              errorText = error.message || error.error_description || error.details || JSON.stringify(error);
          }

          if (errorText && typeof errorText === 'string') {
              if (errorText.includes("Could not find the") && errorText.includes("parent_id")) {
                  msg = "⚠️ ERROR DB: Falta columna 'parent_id'. Ve a Supabase > Settings > API > Schema Cache y pulsa 'Reload'.";
              } else if (errorText !== '{}') {
                  msg = `${defaultMsg}: ${errorText}`;
              }
          }
      }
      showToast(msg, "error");
  }, [showToast]);

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
    } catch (error: any) {
      handleError(error, "Error al conectar con la base de datos");
    } finally {
      setIsLoading(false);
    }
  }, [handleError]);

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

  // Realtime orders
  useEffect(() => {
    if (!currentRestaurantId) return;
    const supabase = getSupabaseClient();
    if (!supabase) return;

    const playSound = () => {
        const notificationSound = new Audio('https://cdn.pixabay.com/audio/2022/03/15/audio_2c244a341b.mp3');
        notificationSound.volume = 0.5;
        notificationSound.play().catch(e => console.warn("Sound play blocked:", e));
    };

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
  }, [currentRestaurantId, user, showToast]);

  const switchRestaurant = async (restaurantId: string) => {
      setCurrentRestaurantId(restaurantId);
  };

  const login = async (email: string, password_provided: string): Promise<boolean> => {
    try {
        const selectedUser = await api.login(email, password_provided);
        if (selectedUser) {
          setUser(selectedUser);
          if (selectedUser.rol === UserRole.SUPER_ADMIN) {
              setCurrentRestaurantId(null);
          } else {
              setCurrentRestaurantId(selectedUser.restaurant_id);
          }
          return true;
        } else {
          return false;
        }
    } catch (e: any) {
        handleError(e, "Error de conexión al iniciar sesión");
        return false;
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
    if (!menuItems.length) return [];
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
        
        return { ...item, coste: calculatedCost, stock_actual: stockActual, disponible: isAvailable };
    });
  }, [menuItems, ingredients]);

  const processedMenuItems = useMemo(() => {
    return allItemsForDisplay.filter(item => !item.is_deleted);
  }, [allItemsForDisplay]);


  // --- ACTIONS WRAPPERS ---

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
      handleError(error, "Error al actualizar el pedido");
    }
  };
  
  const cancelOrder = async (orderId: number) => {
    if (!currentRestaurantId) return;
    try {
        const updatedOrder = await api.cancelOrder(orderId);
        setOrders(prevOrders => prevOrders.map(order => order.id === orderId ? updatedOrder : order));
        
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
        handleError(error, "Error al cancelar el pedido");
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

      // LÓGICA MESA: Crear Pedido -> OCUPADA (NARANJA)
      // Buscamos la mesa por table_number (ya que la BD lo usa) pero actualizamos por ID real
      if (isSalaOrder && newOrder.table_id) {
          const tableToUpdate = tables.find(t => t.table_number === newOrder.table_id);
          if (tableToUpdate) {
              // Forzamos actualización en BD
              const updatedTablePayload = {
                  ...tableToUpdate,
                  estado: TableStatus.OCUPADA, // Naranja
                  order_id: newOrder.id,
                  mozo_id: mozo_id || tableToUpdate.mozo_id // Mantener mozo si ya estaba asignado o usar el actual
              };
              await api.updateTable(updatedTablePayload);
              
              // Actualizamos estado local inmediatamente
              setTables(prev => prev.map(t => t.id === tableToUpdate.id ? updatedTablePayload : t));
          }
      }
      showToast(`Pedido #${newOrder.id} creado.`);
      return newOrder;
    } catch (error) {
      handleError(error, "Error al crear el pedido");
      return null;
    }
  };

  const createPublicOrder = async (orderData: Omit<Order, 'id' | 'creado_en' | 'estado' | 'repartidor_id' | 'payments' | 'creado_por_id' | 'mozo_id'>): Promise<Order | null> => {
    if (!currentRestaurantId) return null;
    try {
      const newOrder = await api.createPublicOrder({ ...orderData, restaurant_id: currentRestaurantId });
      showToast(`Pedido #${newOrder.id} recibido. ¡Gracias!`);
      return newOrder;
    } catch (error) {
      handleError(error, "Error al crear el pedido");
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
      handleError(error, "Error al crear el cliente");
      return null;
    }
  };

  const updateCustomer = async (customerData: Customer) => {
    try {
      const updatedCustomer = await api.updateCustomer(customerData);
      setCustomers(prev => prev.map(c => c.id === updatedCustomer.id ? updatedCustomer : c));
      showToast(`Cliente '${updatedCustomer.nombre}' actualizado.`);
    } catch (error) {
      handleError(error, "Error al actualizar el cliente");
    }
  };
  
  const deleteCustomer = async (customerId: string) => {
    try {
      await api.deleteCustomer(customerId);
      setCustomers(prev => prev.filter(c => c.id !== customerId));
      showToast(`Cliente desactivado.`);
    } catch (error) {
      handleError(error, "Error al desactivar cliente");
    }
  };

  const findCustomerByContact = async (contact: string) => api.findCustomerByContact(currentRestaurantId || '', contact);
  const verifyCustomer = async (id: string) => { 
      try {
        await api.verifyCustomer(id); 
        setCustomers(prev => prev.map(c => c.id === id ? {...c, is_verified: true} : c));
        showToast("Cliente verificado.");
      } catch(error) {
          handleError(error, "Error al verificar cliente");
      }
  };
  
  const updateOrder = async (id: number, orderData: any) => {
      try {
        const updated = await api.updateOrder(id, orderData);
        setOrders(prev => prev.map(o => o.id === id ? updated : o));
      } catch(error) {
          handleError(error, "Error al actualizar el pedido");
      }
  };
  const assignRepartidor = async (id: number, repId: string) => {
      try {
        const updated = await api.assignRepartidorToOrder(id, repId);
        setOrders(prev => prev.map(o => o.id === id ? updated : o));
        if(currentRestaurantId) setUsers(await api.getUsers(currentRestaurantId));
        showToast("Repartidor asignado.");
      } catch(error) {
          handleError(error, "Error al asignar repartidor");
      }
  };
  const assignMozoToOrder = async (id: number, mozoId: string|null) => {
       try {
        await api.updateOrder(id, { mozo_id: mozoId });
        setOrders(prev => prev.map(o => o.id === id ? {...o, mozo_id: mozoId} : o));
        showToast("Mozo asignado.");
       } catch(error) {
           handleError(error, "Error al asignar mozo");
       }
  };
  
  const createCoupon = async (data: any) => { 
      if(!currentRestaurantId) return;
      try {
        const newC = await api.createCoupon({...data, restaurant_id: currentRestaurantId}); 
        setCoupons(prev => [newC, ...prev]);
        showToast("Cupón creado correctamente.");
      } catch (error: any) {
        handleError(error, "Error al crear el cupón");
      }
  };
  const updateCoupon = async (data: any) => { 
      try {
        const updated = await api.updateCoupon(data); 
        setCoupons(prev => prev.map(c => c.id === data.id ? updated : c));
        showToast("Cupón actualizado.");
      } catch(error) {
          handleError(error, "Error al actualizar cupón");
      }
  };
  const deleteCoupon = async (id: string) => { 
      try {
        await api.deleteCoupon(id); 
        setCoupons(prev => prev.filter(c => c.id !== id)); 
        showToast("Cupón eliminado.");
      } catch(error) {
          handleError(error, "Error al eliminar cupón");
      }
  };
  
  const generatePaymentQR = async (id: number, amt: number) => { const res = await api.generatePaymentQR(id, amt); return (res as any).last_qr_code_url; };
  
  const addPaymentToOrder = async (orderId: number, method: any, amount: number) => { 
      try {
        const { data: order } = await getSupabaseClient()!.from('orders').select('payments, total, tipo, table_id').eq('id', orderId).single();
        if (!order) throw new Error("Order not found");

        const newPayment = {
            status: 'PAGADO',
            method,
            amount,
            creado_en: new Date().toISOString()
        };
        const updatedPayments = [...(order.payments || []), newPayment];
        const totalPaid = updatedPayments.reduce((sum: number, p: any) => sum + p.amount, 0);
        
        let updatePayload: any = { payments: updatedPayments };

        // Si se ha pagado el total
        if (totalPaid >= order.total) {
             if (order.tipo === OrderType.SALA) {
                 updatePayload.estado = OrderStatus.ENTREGADO;
                 // LÓGICA MESA: Pagado -> NECESITA_LIMPIEZA (ROJO)
                 if (order.table_id) {
                     // Importante: Buscar la mesa por table_number
                     const existingTable = tables.find(t => t.table_number === order.table_id);
                     if (existingTable) {
                         const updatedTablePayload = { 
                             ...existingTable, 
                             estado: TableStatus.NECESITA_LIMPIEZA 
                         } as Table;
                         
                         await api.updateTable(updatedTablePayload);
                         setTables(prev => prev.map(t => t.id === existingTable.id ? { ...t, estado: TableStatus.NECESITA_LIMPIEZA } : t));
                     }
                 }
             } else {
                 updatePayload.estado = OrderStatus.NUEVO;
             }
        }

        const { data: updatedOrder, error } = await getSupabaseClient()!.from('orders').update(updatePayload).eq('id', orderId).select().single();
        if (error) throw error;

        setOrders(prev => prev.map(o => o.id === orderId ? updatedOrder : o));
        showToast("Pago registrado.");
      } catch(error) {
          handleError(error, "Error al registrar pago");
      }
  };
  
  const createUser = async (data: any) => { 
      if(!currentRestaurantId) return; 
      try {
        const u = await api.createUser({...data, restaurant_id: currentRestaurantId}); 
        setUsers(prev => [...prev, u]); 
        showToast("Usuario creado correctamente.");
      } catch(error) {
          handleError(error, "Error al crear usuario");
      }
  };
  const updateUser = async (data: any) => { 
      try {
        const u = await api.updateUser(data); 
        setUsers(prev => prev.map(x => x.id === data.id ? u : x)); 
        showToast("Usuario actualizado.");
      } catch(error) {
          handleError(error, "Error al actualizar usuario");
      }
  };
  const deleteUser = async (id: string) => { 
      try {
        await api.deleteUser(id); 
        setUsers(prev => prev.filter(x => x.id !== id)); 
        showToast("Usuario eliminado.");
      } catch(error) {
          handleError(error, "Error al eliminar usuario");
      }
  };
  
  const createMenuItem = async (data: any) => { 
      if(!currentRestaurantId) return; 
      try {
        const m = await api.createMenuItem({...data, restaurant_id: currentRestaurantId}); 
        setMenuItems(prev => [...prev, m]); 
        showToast("Producto creado correctamente.");
      } catch (error: any) {
        handleError(error, "Error al crear el producto");
      }
  };
  const updateMenuItem = async (data: any) => { 
      try {
        const m = await api.updateMenuItem(data); 
        setMenuItems(prev => prev.map(x => x.id === data.id ? m : x)); 
        showToast("Producto actualizado.");
      } catch(error) {
          handleError(error, "Error al actualizar producto");
      }
  };
  const deleteMenuItem = async (id: string) => { 
      try {
        const m = await api.deleteMenuItem(id); 
        setMenuItems(prev => prev.map(x => x.id === id ? m : x)); 
        showToast("Producto eliminado.");
      } catch(error) {
          handleError(error, "Error al eliminar producto");
      }
  };
  const restoreMenuItem = async (id: string) => { 
      try {
        const m = await api.restoreMenuItem(id); 
        setMenuItems(prev => prev.map(x => x.id === id ? m : x)); 
        showToast("Producto restaurado.");
      } catch(error) {
          handleError(error, "Error al restaurar producto");
      }
  };
  
  const updateCategories = async (cats: MenuCategory[]): Promise<boolean> => { 
      try {
        const updatedCats = await api.updateCategories(cats); 
        setCategories(prev => {
            const updatedMap = new Map(updatedCats.map(c => [c.id, c]));
            const merged = prev.map(c => updatedMap.get(c.id) || c);
            const existingIds = new Set(prev.map(c => c.id));
            const newItems = updatedCats.filter(c => !existingIds.has(c.id));
            return [...merged, ...newItems];
        });
        showToast("Categorías actualizadas.");
        return true;
      } catch(error) {
          handleError(error, "Error al actualizar categorías");
          return false;
      }
  };
  
  const createCategory = async (name: string, parentId: string | null = null): Promise<MenuCategory | null> => { 
      if(!currentRestaurantId) return null; 
      try {
        const c = await api.createCategory({
            nombre: name, 
            restaurant_id: currentRestaurantId, 
            orden: categories.length > 0 ? Math.max(...categories.map(c => c.orden)) + 1 : 0,
            parent_id: parentId
        }); 
        setCategories(prev => [...prev, c]); 
        showToast("Categoría creada correctamente.");
        return c;
      } catch (error: any) {
        handleError(error, "Error al crear la categoría");
        return null;
      }
  };
  const deleteCategory = async (id: string) => { 
      try {
        await api.deleteCategory(id); 
        setCategories(prev => {
            const getIdsToRemove = (targetId: string, list: MenuCategory[]): string[] => {
                const children = list.filter(c => c.parent_id === targetId);
                let ids = [targetId];
                children.forEach(c => {
                    ids = [...ids, ...getIdsToRemove(c.id, list)];
                });
                return ids;
            };
            const idsToRemove = getIdsToRemove(id, prev);
            return prev.filter(c => !idsToRemove.includes(c.id));
        });
        showToast("Categoría eliminada.");
      } catch(error) {
          handleError(error, "Error al eliminar categoría");
      }
  };
  
  const updateRestaurantSettings = async (s: any, rId?: string) => { 
      const target = rId || currentRestaurantId;
      if(!target) return;
      try {
        const updated = await api.updateRestaurantSettings(target, s); 
        if(target === currentRestaurantId) setRestaurantSettings(updated);
        showToast("Configuración actualizada.");
      } catch(error) {
          handleError(error, "Error al actualizar configuración");
      }
  };
  
  // LÓGICA MESA: Limpiar -> LIBRE (Verde)
  const cleanTable = async (id: string | number) => {
      if(!currentRestaurantId) return;
      try {
        const targetTable = tables.find(t => t.id === id);
        if(targetTable) {
            // Update DB
            const updated = await api.updateTable({
                ...targetTable, 
                estado: TableStatus.LIBRE, 
                order_id: null, 
                mozo_id: null
            });
            // Update Local State
            setTables(prev => prev.map(t => t.id === updated.id ? updated : t));
            showToast("Mesa limpia y liberada.");
        }
      } catch(error) {
          handleError(error, "Error al limpiar mesa");
      }
  };
  
  const saveTableLayout = async (tbls: any[]) => { 
      try {
        const updated = await api.updateTablesLayout(tbls); 
        setTables(updated); 
        showToast("Distribución guardada.");
      } catch(error) {
          handleError(error, "Error al guardar distribución");
      }
  };
  const updateTable = async (t: Table) => { 
      try {
        const updated = await api.updateTable(t); 
        setTables(prev => prev.map(x => x.id === updated.id ? updated : x)); 
      } catch(error) {
          handleError(error, "Error al actualizar mesa");
      }
  };
  
  const createIngredient = async (data: any) => { 
      if(!currentRestaurantId) return; 
      try {
        const i = await api.createIngredient({...data, restaurant_id: currentRestaurantId}); 
        setIngredients(prev => [...prev, i]); 
        showToast("Ingrediente creado correctamente.");
      } catch (error: any) {
        handleError(error, "Error al crear el ingrediente");
      }
  };
  const updateIngredient = async (data: any) => { 
      try {
        const i = await api.updateIngredient(data); 
        setIngredients(prev => prev.map(x => x.id === data.id ? i : x)); 
        showToast("Ingrediente actualizado.");
      } catch(error) {
          handleError(error, "Error al actualizar ingrediente");
      }
  };
  const deleteIngredient = async (id: string) => { 
      try {
        await api.deleteIngredient(id); 
        setIngredients(prev => prev.filter(x => x.id !== id)); 
        showToast("Ingrediente eliminado.");
      } catch(error) {
          handleError(error, "Error al eliminar ingrediente");
      }
  };
  
  const createRestaurant = async (s: any) => { 
      try {
        const r = await api.createRestaurant(s); 
        setRestaurants(prev => [...prev, r]); 
        showToast("Restaurante creado.");
      } catch(error) {
          handleError(error, "Error al crear restaurante");
      }
  };
  const deleteRestaurant = async (id: string) => { 
      try {
        await api.deleteRestaurant(id); 
        setRestaurants(prev => prev.filter(r => r.id !== id)); 
        showToast("Restaurante eliminado.");
      } catch(error) {
          handleError(error, "Error al eliminar restaurante");
      }
  };
  const updateUserLocation = async (id: string, lat: number, lng: number) => { 
      try {
        await api.updateUserLocation(id, lat, lng); 
      } catch(error) {
          console.error("Error updating location", error);
      }
  };

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
