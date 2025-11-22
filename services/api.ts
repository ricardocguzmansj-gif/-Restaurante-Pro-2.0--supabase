
import { Order, OrderStatus, MenuItem, User, Customer, Coupon, OrderType, UserRole, PaymentDetails, MenuCategory, RestaurantSettings, Table, Ingredient, TableStatus, Restaurant } from '../types';
import { demoOrders, demoMenuItems, demoUsers, demoCustomers, demoCoupons, demoCategories, demoRestaurants, demoTables, demoIngredients } from '../data/db';
import { getSupabaseClient, isSupabaseConfigured } from './supabase';

// --- MOCK DATA STORAGE (Fallback) ---
let localOrders: Order[] = JSON.parse(localStorage.getItem('orders') || 'null') || [...demoOrders];
let localMenuItems: MenuItem[] = JSON.parse(localStorage.getItem('menuItems') || 'null') || (demoMenuItems as MenuItem[]);
let localCustomers: Customer[] = JSON.parse(localStorage.getItem('customers') || 'null') || [...demoCustomers];
let localCoupons: Coupon[] = JSON.parse(localStorage.getItem('coupons') || 'null') || [...demoCoupons];
let localUsers: User[] = JSON.parse(localStorage.getItem('users') || 'null') || [...demoUsers];
let localCategories: MenuCategory[] = JSON.parse(localStorage.getItem('categories') || 'null') || [...demoCategories];
let localRestaurants: Restaurant[] = JSON.parse(localStorage.getItem('restaurants') || 'null') || [...demoRestaurants];
let localTables: Table[] = JSON.parse(localStorage.getItem('tables') || 'null') || [...demoTables];
let localIngredients: Ingredient[] = JSON.parse(localStorage.getItem('ingredients') || 'null') || [...demoIngredients];

const saveLocal = () => {
    localStorage.setItem('orders', JSON.stringify(localOrders));
    localStorage.setItem('menuItems', JSON.stringify(localMenuItems));
    localStorage.setItem('customers', JSON.stringify(localCustomers));
    localStorage.setItem('coupons', JSON.stringify(localCoupons));
    localStorage.setItem('users', JSON.stringify(localUsers));
    localStorage.setItem('categories', JSON.stringify(localCategories));
    localStorage.setItem('restaurants', JSON.stringify(localRestaurants));
    localStorage.setItem('tables', JSON.stringify(localTables));
    localStorage.setItem('ingredients', JSON.stringify(localIngredients));
}

const simulateDelay = (ms: number) => new Promise(res => setTimeout(res, ms));

// --- HELPER TO SWITCH MODES ---
const supabase = getSupabaseClient();

export const api = {
  // --- SPECIAL MIGRATION HELPER ---
  // This forces retrieval of LOCAL data even if Supabase is configured.
  // Essential for the migration script to read source data correctly.
  getAllLocalData: () => {
      return {
          restaurants: localRestaurants,
          users: localUsers,
          categories: localCategories,
          ingredients: localIngredients,
          menuItems: localMenuItems,
          customers: localCustomers,
          tables: localTables,
          orders: localOrders,
          coupons: localCoupons
      };
  },

  // --- RESTAURANTS ---
  getRestaurants: async (): Promise<Restaurant[]> => {
      if (isSupabaseConfigured() && supabase) {
          const { data, error } = await supabase.from('restaurants').select('*');
          if (error) throw error;
          return data || [];
      }
      await simulateDelay(100);
      return [...localRestaurants];
  },

  getRestaurantById: async (id: string): Promise<Restaurant | undefined> => {
       if (isSupabaseConfigured() && supabase) {
          const { data, error } = await supabase.from('restaurants').select('*').eq('id', id).single();
          if (error) return undefined;
          return data;
      }
      await simulateDelay(100);
      return localRestaurants.find(r => r.id === id);
  },

  createRestaurant: async (settings: RestaurantSettings): Promise<Restaurant> => {
      // Use a random ID or timestamp to ensure uniqueness in distributed systems if possible
      const newId = `rest-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const newRestaurant = { id: newId, settings };

      if (isSupabaseConfigured() && supabase) {
          const { data, error } = await supabase.from('restaurants').insert(newRestaurant).select().single();
          if (error) throw error;
          return data;
      }

      await simulateDelay(200);
      localRestaurants.push(newRestaurant);
      saveLocal();
      return newRestaurant;
  },

  updateRestaurantSettings: async (restaurantId: string, settings: RestaurantSettings): Promise<RestaurantSettings> => {
    if (isSupabaseConfigured() && supabase) {
        const { data, error } = await supabase.from('restaurants')
            .update({ settings })
            .eq('id', restaurantId)
            .select().single();
        if (error) throw error;
        return data.settings;
    }

    await simulateDelay(200);
    const index = localRestaurants.findIndex(r => r.id === restaurantId);
    if (index === -1) throw new Error("Restaurant not found");
    localRestaurants[index].settings = settings;
    saveLocal();
    return { ...localRestaurants[index].settings };
  },

  deleteRestaurant: async (restaurantId: string): Promise<void> => {
      if (isSupabaseConfigured() && supabase) {
          // Perform a clean sweep of all related data to avoid Foreign Key constraints violations
          // Order matters: Children first, then Parents.
          
          // 1. Delete Orders (Has FK to Customers, Tables, Users)
          await supabase.from('orders').delete().eq('restaurant_id', restaurantId);
          
          // 2. Delete Menu Items (Has FK to Categories)
          await supabase.from('menu_items').delete().eq('restaurant_id', restaurantId);
          
          // 3. Delete Ingredients
          await supabase.from('ingredients').delete().eq('restaurant_id', restaurantId);
          
          // 4. Delete Categories
          await supabase.from('categories').delete().eq('restaurant_id', restaurantId);
          
          // 5. Delete Tables
          await supabase.from('tables').delete().eq('restaurant_id', restaurantId);
          
          // 6. Delete Coupons
          await supabase.from('coupons').delete().eq('restaurant_id', restaurantId);
          
          // 7. Delete Customers
          await supabase.from('customers').delete().eq('restaurant_id', restaurantId);
          
          // 8. Delete Users
          await supabase.from('app_users').delete().eq('restaurant_id', restaurantId);
          
          // 9. Finally, delete the Restaurant
          const { error } = await supabase.from('restaurants').delete().eq('id', restaurantId);
          
          if (error) throw error;
          return;
      }

      await simulateDelay(300);
      localRestaurants = localRestaurants.filter(r => r.id !== restaurantId);
      localUsers = localUsers.filter(u => u.restaurant_id !== restaurantId);
      localOrders = localOrders.filter(o => o.restaurant_id !== restaurantId);
      localMenuItems = localMenuItems.filter(m => m.restaurant_id !== restaurantId);
      localCategories = localCategories.filter(c => c.restaurant_id !== restaurantId);
      localCustomers = localCustomers.filter(c => c.restaurant_id !== restaurantId);
      localCoupons = localCoupons.filter(c => c.restaurant_id !== restaurantId);
      localTables = localTables.filter(t => t.restaurant_id !== restaurantId);
      localIngredients = localIngredients.filter(i => i.restaurant_id !== restaurantId);
      saveLocal();
  },

  // --- USERS ---
  login: async (email: string, password_provided: string): Promise<User | undefined> => {
    if (isSupabaseConfigured() && supabase) {
        // Using custom table 'app_users' for this specific logic as requested
        const { data, error } = await supabase
            .from('app_users')
            .select('*')
            .ilike('email', email)
            .eq('is_deleted', false)
            .single();
        
        if (error) {
            // PGRST116 code is "The result contains 0 rows" which just means user not found
            if (error.code === 'PGRST116') {
                return undefined;
            }
            
            // Log detailed error object as string to avoid [object Object]
            console.error("Supabase Login Error:", JSON.stringify(error, null, 2));
            return undefined; 
        }
        
        if (!data) return undefined;
        
        if (data.password === password_provided) {
             return data as User;
        }
        return undefined;
    }

    await simulateDelay(200);
    const user = localUsers.find(u => u.email.toLowerCase() === email.toLowerCase() && !u.is_deleted);
    if (user && (user.password === password_provided || !user.password)) {
        const { password, ...userWithoutPassword } = user;
        return { ...userWithoutPassword, password } as User; // Return pass to check change req in app
    }
    return undefined;
  },

  recoverPassword: async (email: string): Promise<string> => {
      // Generate a random temporary password
      const tempPassword = Math.random().toString(36).slice(-8).toUpperCase();
      
      if (isSupabaseConfigured() && supabase) {
          // 1. Check if user exists
          const { data: user, error: findError } = await supabase
              .from('app_users')
              .select('id')
              .ilike('email', email)
              .eq('is_deleted', false)
              .single();

          if (findError || !user) {
              throw new Error("No se encontró un usuario con ese correo electrónico.");
          }

          // 2. Update password in DB and set flag
          const { error: updateError } = await supabase
              .from('app_users')
              .update({ 
                  password: tempPassword,
                  must_change_password: true 
              })
              .eq('id', user.id);

          if (updateError) {
              throw new Error("Error al actualizar la contraseña. Inténtelo de nuevo.");
          }
          
          // In a real scenario, we would trigger an email here.
          // For this app, we return it to be displayed in UI.
          return tempPassword;
      }

      await simulateDelay(500);
      const userIndex = localUsers.findIndex(u => u.email.toLowerCase() === email.toLowerCase() && !u.is_deleted);
      if (userIndex === -1) {
           throw new Error("No se encontró un usuario con ese correo electrónico.");
      }
      
      localUsers[userIndex].password = tempPassword;
      localUsers[userIndex].must_change_password = true;
      saveLocal();
      return tempPassword;
  },

  getUsers: async (restaurantId: string): Promise<User[]> => {
    if (isSupabaseConfigured() && supabase) {
        const { data, error } = await supabase
            .from('app_users')
            .select('*')
            .eq('restaurant_id', restaurantId)
            .eq('is_deleted', false);
        if (error) throw error;
        return data || [];
    }

    await simulateDelay(100);
    return [...localUsers].filter(u => !u.is_deleted && u.restaurant_id === restaurantId);
  },

  createUser: async (userData: Omit<User, 'id' | 'avatar_url'>): Promise<User> => {
    if (isSupabaseConfigured() && supabase) {
         const newId = `user-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
         const userPayload = {
             ...userData,
             id: newId,
             avatar_url: `https://i.pravatar.cc/150?u=${newId}`,
             is_deleted: false,
             password: 'password', // Default for new users in this system
             must_change_password: true // Force change for new users
         };
         const { data, error } = await supabase.from('app_users').insert(userPayload).select().single();
         if (error) throw error;
         return data;
    }

    await simulateDelay(200);
    const newId = `user-${Date.now()}`;
    const newUser: User = {
      ...userData,
      id: newId,
      avatar_url: `https://i.pravatar.cc/150?u=${newId}`,
      is_deleted: false,
      password: 'password',
      must_change_password: true
    };
    localUsers = [newUser, ...localUsers];
    saveLocal();
    return newUser;
  },

  updateUser: async (updatedUser: User): Promise<User> => {
    if (isSupabaseConfigured() && supabase) {
        const { data, error } = await supabase
            .from('app_users')
            .update(updatedUser)
            .eq('id', updatedUser.id)
            .select().single();
        if (error) throw error;
        return data;
    }

    await simulateDelay(200);
    const userIndex = localUsers.findIndex(u => u.id === updatedUser.id);
    if (userIndex === -1) throw new Error("User not found");
    localUsers[userIndex] = updatedUser;
    saveLocal();
    return { ...localUsers[userIndex] };
  },

  updateUserLocation: async (userId: string, lat: number, lng: number): Promise<void> => {
     const locationData = {
        lat,
        lng,
        updated_at: new Date().toISOString()
    };

    if (isSupabaseConfigured() && supabase) {
        await supabase.from('app_users').update({ last_location: locationData }).eq('id', userId);
        return;
    }
      
    const userIndex = localUsers.findIndex(u => u.id === userId);
    if (userIndex !== -1) {
        localUsers[userIndex].last_location = locationData;
        saveLocal();
    }
  },

  deleteUser: async (userId: string): Promise<void> => {
    // Validation logic is shared
    const getUser = async (id: string) => isSupabaseConfigured() && supabase 
        ? (await supabase.from('app_users').select('*').eq('id', id).single()).data 
        : localUsers.find(u => u.id === id);
    
    const getAdmins = async (restId: string) => isSupabaseConfigured() && supabase
        ? (await supabase.from('app_users').select('*').eq('restaurant_id', restId).eq('rol', UserRole.ADMIN).eq('is_deleted', false)).data || []
        : localUsers.filter(u => u.rol === UserRole.ADMIN && !u.is_deleted && u.restaurant_id === restId);

    const userToDelete = await getUser(userId);
    if (!userToDelete) throw new Error("User not found");
    
    // CRITICAL SECURITY CHECK
    if (userToDelete.rol === UserRole.SUPER_ADMIN) {
        throw new Error("CRÍTICO: No se puede eliminar al Super Admin.");
    }

    const admins = await getAdmins(userToDelete.restaurant_id);
    if (userToDelete.rol === UserRole.ADMIN && admins.length <= 1) {
         throw new Error("No se puede eliminar al último administrador del restaurante.");
    }

    if (isSupabaseConfigured() && supabase) {
        const { error } = await supabase.from('app_users').update({ is_deleted: true }).eq('id', userId);
        if (error) throw error;
        return;
    }

    await simulateDelay(200);
    const idx = localUsers.findIndex(u => u.id === userId);
    if (idx !== -1) {
        localUsers[idx].is_deleted = true;
        saveLocal();
    }
  },

  // --- ORDERS ---
  getOrders: async (restaurantId: string): Promise<Order[]> => {
    if (isSupabaseConfigured() && supabase) {
        const { data, error } = await supabase
            .from('orders')
            .select('*')
            .eq('restaurant_id', restaurantId)
            .order('creado_en', { ascending: false }); // Show newest first
        if (error) throw error;
        // Supabase returns JSONB columns as objects, which matches our Type exactly.
        return data as Order[];
    }

    await simulateDelay(300);
    const restaurantOrders = localOrders.filter(o => o.restaurant_id === restaurantId);
    return JSON.parse(JSON.stringify(restaurantOrders));
  },
  
  createOrder: async (newOrderData: Omit<Order, 'id' | 'creado_en' | 'payments' | 'estado' | 'repartidor_id'>): Promise<Order> => {
    const orderPayload = {
        ...newOrderData,
        creado_en: new Date().toISOString(),
        repartidor_id: null,
        estado: newOrderData.tipo === OrderType.PARA_LLEVAR ? OrderStatus.PENDIENTE_PAGO : OrderStatus.NUEVO,
        payments: [],
    };

    if (isSupabaseConfigured() && supabase) {
        // Note: ID is auto-increment integer in SQL schema, so we don't send it.
        const { data, error } = await supabase.from('orders').insert(orderPayload).select().single();
        if (error) throw error;
        return data as Order;
    }

    await simulateDelay(500);
    const newOrder = {
      ...orderPayload,
      id: Math.max(0, ...localOrders.map(o => o.id)) + 1,
    };
    localOrders = [newOrder, ...localOrders];
    saveLocal();
    return newOrder;
  },

  createPublicOrder: async (newOrderData: Omit<Order, 'id' | 'creado_en' | 'payments' | 'estado' | 'repartidor_id' | 'creado_por_id' | 'mozo_id'>): Promise<Order> => {
     const orderPayload = {
      ...newOrderData,
      creado_en: new Date().toISOString(),
      repartidor_id: null,
      creado_por_id: 'user-system-portal',
      estado: newOrderData.tipo === OrderType.PARA_LLEVAR ? OrderStatus.PENDIENTE_PAGO : OrderStatus.NUEVO,
      payments: [],
      mozo_id: null,
    };

    if (isSupabaseConfigured() && supabase) {
        const { data, error } = await supabase.from('orders').insert(orderPayload).select().single();
        if (error) throw error;
        return data as Order;
    }

    await simulateDelay(500);
    const newOrder = {
        ...orderPayload,
        id: Math.max(0, ...localOrders.map(o => o.id)) + 1,
    };
    localOrders = [newOrder, ...localOrders];
    saveLocal();
    return newOrder;
  },

  updateOrderStatus: async (orderId: number, newStatus: OrderStatus): Promise<Order> => {
    if (isSupabaseConfigured() && supabase) {
         // Handle Delivery logic side-effect first? Ideally this is a trigger, but let's do it in code
        const { data: order } = await supabase.from('orders').select('repartidor_id, tipo').eq('id', orderId).single();
        
        if (order && order.tipo === OrderType.DELIVERY && order.repartidor_id && [OrderStatus.ENTREGADO, OrderStatus.CANCELADO, OrderStatus.DEVOLUCION].includes(newStatus)) {
             await supabase.from('app_users').update({ estado_delivery: 'DISPONIBLE' }).eq('id', order.repartidor_id);
        }

        const { data, error } = await supabase
            .from('orders')
            .update({ estado: newStatus })
            .eq('id', orderId)
            .select().single();
        if (error) throw error;
        return data as Order;
    }

    await simulateDelay(200);
    const orderIndex = localOrders.findIndex(o => o.id === orderId);
    if (orderIndex === -1) throw new Error("Order not found");
    
    const order = localOrders[orderIndex];
    order.estado = newStatus;

    if (order.tipo === OrderType.DELIVERY && order.repartidor_id && [OrderStatus.ENTREGADO, OrderStatus.CANCELADO, OrderStatus.DEVOLUCION].includes(newStatus)) {
      const userIndex = localUsers.findIndex(u => u.id === order.repartidor_id);
      if (userIndex !== -1) localUsers[userIndex].estado_delivery = 'DISPONIBLE';
    }
    saveLocal();
    return { ...order };
  },
  
  cancelOrder: async (orderId: number): Promise<Order> => {
    // Logic for stock return is complex. In a real app, this should be a Postgres function / transaction.
    // For this hybrid approach, we'll fetch order, calculate updates, and execute.
    
    const fetchOrder = async () => isSupabaseConfigured() && supabase 
        ? (await supabase.from('orders').select('*').eq('id', orderId).single()).data
        : localOrders.find(o => o.id === orderId);
        
    const fetchMenuItem = async (id: string) => isSupabaseConfigured() && supabase
        ? (await supabase.from('menu_items').select('*').eq('id', id).single()).data
        : localMenuItems.find(i => i.id === id);

    const order = await fetchOrder();
    if (!order) throw new Error("Order not found");
    
    // Logic to check status
    const cancellableStates = [OrderStatus.NUEVO, OrderStatus.EN_PREPARACION, OrderStatus.LISTO, OrderStatus.EN_CAMINO, OrderStatus.INCIDENCIA, OrderStatus.PENDIENTE_PAGO];
    if (!cancellableStates.includes(order.estado)) throw new Error("El pedido no puede ser cancelado en su estado actual.");

    // Stock Return Logic
    const stockDeductedStates = [OrderStatus.EN_PREPARACION, OrderStatus.LISTO, OrderStatus.EN_CAMINO, OrderStatus.INCIDENCIA];
    if (stockDeductedStates.includes(order.estado)) {
        // This loop is inefficient for SQL but keeps parity with local logic easily
        // Ideally: RPC function call
        for (const orderItem of order.items) {
             const menuItem = await fetchMenuItem(orderItem.menu_item_id);
             if (menuItem && menuItem.receta) {
                 for (const recipeItem of menuItem.receta) {
                     // Direct update to DB to avoid race conditions slightly better than fetching first
                     if (isSupabaseConfigured() && supabase) {
                        // We need to RPC this ideally, but let's read-update for now
                        const { data: ing } = await supabase.from('ingredients').select('stock_actual').eq('id', recipeItem.ingredient_id).single();
                        if(ing) {
                            await supabase.from('ingredients').update({ stock_actual: ing.stock_actual + (recipeItem.cantidad * orderItem.cantidad)}).eq('id', recipeItem.ingredient_id);
                        }
                     } else {
                         const ingIndex = localIngredients.findIndex(i => i.id === recipeItem.ingredient_id);
                         if(ingIndex !== -1) localIngredients[ingIndex].stock_actual += (recipeItem.cantidad * orderItem.cantidad);
                     }
                 }
             }
        }
    }

    // Free Repartidor
    if (order.repartidor_id) {
        if (isSupabaseConfigured() && supabase) {
             await supabase.from('app_users').update({ estado_delivery: 'DISPONIBLE' }).eq('id', order.repartidor_id);
        } else {
            const uIdx = localUsers.findIndex(u => u.id === order.repartidor_id);
            if (uIdx !== -1) localUsers[uIdx].estado_delivery = 'DISPONIBLE';
        }
    }
    
    // Free Table
    if (order.table_id && order.tipo === OrderType.SALA) {
         if (isSupabaseConfigured() && supabase) {
             // Need composite ID logic or just search by table number + rest ID
             await supabase.from('tables')
                .update({ estado: TableStatus.NECESITA_LIMPIEZA, order_id: null, mozo_id: null })
                .eq('table_number', order.table_id)
                .eq('restaurant_id', order.restaurant_id);
         } else {
             const tIdx = localTables.findIndex(t => t.id === order.table_id && t.order_id === order.id);
             if (tIdx !== -1) {
                 localTables[tIdx].estado = TableStatus.NECESITA_LIMPIEZA;
                 localTables[tIdx].order_id = null;
                 localTables[tIdx].mozo_id = null;
             }
         }
    }

    if (isSupabaseConfigured() && supabase) {
        const { data, error } = await supabase.from('orders').update({ estado: OrderStatus.CANCELADO }).eq('id', orderId).select().single();
        if (error) throw error;
        return data as Order;
    } else {
        const oIdx = localOrders.findIndex(o => o.id === orderId);
        localOrders[oIdx].estado = OrderStatus.CANCELADO;
        saveLocal();
        return { ...localOrders[oIdx] };
    }
  },

  deductStockForOrder: async (orderId: number): Promise<void> => {
      // Similar to stock return, this should be an RPC in production.
      // Implementing simplistic read/write for hybrid compatibility
      const fetchOrder = async () => isSupabaseConfigured() && supabase 
        ? (await supabase.from('orders').select('*').eq('id', orderId).single()).data
        : localOrders.find(o => o.id === orderId);
        
      const order = await fetchOrder();
      if(!order) return;
      
      const itemsToProcess = order.items;

      // We iterate items and their recipes
      // Note: This is heavy on API calls.
      // In local mode it's fast. In Supabase mode, this is slow.
      // Optimization: Fetch all ingredients for the restaurant once.
      
      let ingredientsMap: Record<string, number> = {}; // id -> deduction amount

      // 1. Build deduction map
      // We need menu items to get recipes
      const menuItemsData = (isSupabaseConfigured() && supabase
         ? (await supabase.from('menu_items').select('*').eq('restaurant_id', order.restaurant_id)).data || []
         : localMenuItems) as MenuItem[];
      
      const menuMap = new Map(menuItemsData.map((m) => [m.id, m]));

      for(const item of itemsToProcess) {
          const menuItem = menuMap.get(item.menu_item_id);
          if(menuItem && menuItem.receta) {
              for(const recipeItem of menuItem.receta) {
                  ingredientsMap[recipeItem.ingredient_id] = (ingredientsMap[recipeItem.ingredient_id] || 0) + (recipeItem.cantidad * item.cantidad);
              }
          }
      }

      // 2. Apply deductions
      for (const [ingId, amount] of Object.entries(ingredientsMap)) {
          if (isSupabaseConfigured() && supabase) {
               // Atomic decrement ideally, but simple update here
               const { data: ing } = await supabase.from('ingredients').select('stock_actual').eq('id', ingId).single();
               if (ing) {
                   await supabase.from('ingredients').update({ stock_actual: ing.stock_actual - amount }).eq('id', ingId);
               }
          } else {
              const idx = localIngredients.findIndex(i => i.id === ingId);
              if (idx !== -1) localIngredients[idx].stock_actual -= amount;
          }
      }
      
      if (!isSupabaseConfigured()) saveLocal();
  },

  generatePaymentQR: async (orderId: number, amount: number): Promise<Order> => {
    // This is mock logic primarily, but we store the URL in the order object
    const qr_code_url = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(JSON.stringify({orderId, amount}))}`;
    
    if (isSupabaseConfigured() && supabase) {
         // Since 'last_qr_code_url' isn't in the SQL schema explicitly in the prompt, 
         // we might need to assume the schema allows extra JSON or we skip saving it if column missing.
         // However, the prompt SQL had 'items' and 'payments' as JSONB. It didn't have 'last_qr_code_url'.
         // We will return the object with the property attached dynamically for the UI, 
         // but maybe not save it to DB unless we add a column. 
         // For now, let's just return the order + the prop.
         const { data } = await supabase.from('orders').select('*').eq('id', orderId).single();
         return { ...data, last_qr_code_url: qr_code_url } as any;
    }

    await simulateDelay(600);
    const idx = localOrders.findIndex(o => o.id === orderId);
    (localOrders[idx] as any).last_qr_code_url = qr_code_url;
    saveLocal();
    return { ...localOrders[idx] };
  },

  addPaymentToOrder: async (orderId: number, method: PaymentDetails['method'], amount: number): Promise<Order> => {
    const payment: PaymentDetails = {
        status: 'PAGADO',
        method: method,
        transaction_id: `txn_${Date.now()}`,
        amount: amount,
        creado_en: new Date().toISOString()
    };

    if (isSupabaseConfigured() && supabase) {
        const { data: order } = await supabase.from('orders').select('*').eq('id', orderId).single();
        const currentPayments = (order.payments || []) as PaymentDetails[];
        const updatedPayments = [...currentPayments, payment];
        
        const totalPaid = updatedPayments.reduce((sum, p) => sum + p.amount, 0);
        let newStatus = order.estado;

        if (totalPaid >= order.total && order.estado === OrderStatus.PENDIENTE_PAGO) {
            newStatus = (order.tipo === OrderType.PARA_LLEVAR) ? OrderStatus.NUEVO : OrderStatus.ENTREGADO;
        }

        const { data, error } = await supabase
            .from('orders')
            .update({ payments: updatedPayments, estado: newStatus })
            .eq('id', orderId)
            .select()
            .single();

        if(error) throw error;
        return data as Order;
    }

    await simulateDelay(800);
    const idx = localOrders.findIndex(o => o.id === orderId);
    const order = localOrders[idx];
    order.payments.push(payment);
    
    const totalPaid = order.payments.reduce((sum, p) => sum + p.amount, 0);
    if (totalPaid >= order.total) {
        if (order.estado === OrderStatus.PENDIENTE_PAGO) {
            order.estado = (order.tipo === OrderType.PARA_LLEVAR) ? OrderStatus.NUEVO : OrderStatus.ENTREGADO;
        }
    }
    saveLocal();
    return { ...order };
  },

  updateOrder: async (orderId: number, updatedOrderData: Partial<Order>): Promise<Order> => {
     if (isSupabaseConfigured() && supabase) {
        const { data, error } = await supabase
            .from('orders')
            .update(updatedOrderData)
            .eq('id', orderId)
            .select().single();
        if(error) throw error;
        return data as Order;
     }

    await simulateDelay(400);
    const idx = localOrders.findIndex(o => o.id === orderId);
    if (idx === -1) throw new Error("Order not found");
    localOrders[idx] = { ...localOrders[idx], ...updatedOrderData };
    saveLocal();
    return { ...localOrders[idx] };
  },

  assignRepartidorToOrder: async (orderId: number, repartidorId: string): Promise<Order> => {
     if (isSupabaseConfigured() && supabase) {
          // 1. Get old repartidor to free them
          const { data: order } = await supabase.from('orders').select('repartidor_id').eq('id', orderId).single();
          if (order && order.repartidor_id) {
              await supabase.from('app_users').update({ estado_delivery: 'DISPONIBLE' }).eq('id', order.repartidor_id);
          }
          // 2. Busy new repartidor
          await supabase.from('app_users').update({ estado_delivery: 'EN_REPARTO' }).eq('id', repartidorId);
          
          // 3. Update order
          const { data, error } = await supabase
            .from('orders')
            .update({ repartidor_id: repartidorId, estado: OrderStatus.EN_CAMINO })
            .eq('id', orderId)
            .select().single();
            
          if(error) throw error;
          return data as Order;
     }

    await simulateDelay(300);
    const idx = localOrders.findIndex(o => o.id === orderId);
    const order = localOrders[idx];
    
    if (order.repartidor_id) {
      const oldIdx = localUsers.findIndex(u => u.id === order.repartidor_id);
      if (oldIdx !== -1) localUsers[oldIdx].estado_delivery = 'DISPONIBLE';
    }
    
    const newIdx = localUsers.findIndex(u => u.id === repartidorId);
    if (newIdx !== -1) localUsers[newIdx].estado_delivery = 'EN_REPARTO';

    order.repartidor_id = repartidorId;
    order.estado = OrderStatus.EN_CAMINO;
    saveLocal();
    return { ...order };
  },

  // --- CATEGORIES ---
  getCategories: async (restaurantId: string): Promise<MenuCategory[]> => {
      if (isSupabaseConfigured() && supabase) {
          const { data, error } = await supabase.from('categories').select('*').eq('restaurant_id', restaurantId).order('orden', { ascending: true });
          if (error) throw error;
          return data || [];
      }
    await simulateDelay(100);
    return localCategories.filter(c => c.restaurant_id === restaurantId).sort((a, b) => a.orden - b.orden);
  },

  createCategory: async (categoryData: Omit<MenuCategory, 'id'>): Promise<MenuCategory> => {
    if (isSupabaseConfigured() && supabase) {
         const { data, error } = await supabase.from('categories').insert({...categoryData, id: `cat-${Date.now()}`}).select().single();
         if (error) throw error;
         return data;
    }
    await simulateDelay(200);
    const newCategory = { ...categoryData, id: `cat-${Date.now()}` };
    localCategories.push(newCategory);
    saveLocal();
    return newCategory;
  },

  updateCategories: async (updatedCategories: MenuCategory[]): Promise<MenuCategory[]> => {
      if (isSupabaseConfigured() && supabase) {
          // Batch update not straightforward in standard REST without RPC, 
          // loop for now as categories count is low
          for (let i = 0; i < updatedCategories.length; i++) {
              const cat = updatedCategories[i];
              await supabase.from('categories').update({ orden: i + 1 }).eq('id', cat.id);
          }
          return updatedCategories.map((c, i) => ({...c, orden: i+1}));
      }

    await simulateDelay(200);
    const reordered = updatedCategories.map((cat, index) => ({ ...cat, orden: index + 1 }));
    const otherCategories = localCategories.filter(c => !reordered.some(rc => rc.id === c.id));
    localCategories = [...otherCategories, ...reordered];
    saveLocal();
    return localCategories.filter(c => c.restaurant_id === reordered[0]?.restaurant_id).sort((a, b) => a.orden - b.orden);
  },

  deleteCategory: async (categoryId: string): Promise<void> => {
    if (isSupabaseConfigured() && supabase) {
        // Check logic handled by DB constraints typically, but let's check manually
        const { count } = await supabase.from('menu_items').select('*', { count: 'exact', head: true }).eq('category_id', categoryId);
        if (count && count > 0) throw new Error("No se puede eliminar una categoría con productos.");
        
        await supabase.from('categories').delete().eq('id', categoryId);
        return;
    }

    await simulateDelay(200);
    if (localMenuItems.some(item => item.category_id === categoryId)) {
        throw new Error("No se puede eliminar una categoría que tiene productos asociados.");
    }
    localCategories = localCategories.filter(c => c.id !== categoryId);
    saveLocal();
  },

  // --- MENU ITEMS ---
  getMenuItems: async (restaurantId: string): Promise<MenuItem[]> => {
      if (isSupabaseConfigured() && supabase) {
          const { data, error } = await supabase.from('menu_items').select('*').eq('restaurant_id', restaurantId);
          if(error) throw error;
          return data || [];
      }
    await simulateDelay(300);
    return localMenuItems.filter(m => m.restaurant_id === restaurantId);
  },

  createMenuItem: async (itemData: Omit<MenuItem, 'id'>): Promise<MenuItem> => {
      if (isSupabaseConfigured() && supabase) {
          const newId = `item-${Date.now()}`;
          const { data, error } = await supabase.from('menu_items').insert({ ...itemData, id: newId, is_deleted: false }).select().single();
          if(error) throw error;
          return data;
      }
    await simulateDelay(200);
    const newItem = { ...itemData, id: `item-${Date.now()}`, is_deleted: false };
    localMenuItems = [newItem, ...localMenuItems];
    saveLocal();
    return newItem;
  },

  updateMenuItem: async (updatedItem: MenuItem): Promise<MenuItem> => {
    if (isSupabaseConfigured() && supabase) {
         const { data, error } = await supabase.from('menu_items').update(updatedItem).eq('id', updatedItem.id).select().single();
         if(error) throw error;
         return data;
    }
    await simulateDelay(200);
    const idx = localMenuItems.findIndex(i => i.id === updatedItem.id);
    if (idx === -1) throw new Error("Item not found");
    localMenuItems[idx] = updatedItem;
    saveLocal();
    return localMenuItems[idx];
  },
  
  deleteMenuItem: async (itemId: string): Promise<MenuItem> => {
      if (isSupabaseConfigured() && supabase) {
           const { data, error } = await supabase.from('menu_items').update({ is_deleted: true }).eq('id', itemId).select().single();
           if(error) throw error;
           return data;
      }
    await simulateDelay(200);
    const idx = localMenuItems.findIndex(i => i.id === itemId);
    localMenuItems[idx].is_deleted = true;
    saveLocal();
    return localMenuItems[idx];
  },

  restoreMenuItem: async (itemId: string): Promise<MenuItem> => {
       if (isSupabaseConfigured() && supabase) {
           const { data, error } = await supabase.from('menu_items').update({ is_deleted: false }).eq('id', itemId).select().single();
           if(error) throw error;
           return data;
      }
    await simulateDelay(200);
    const idx = localMenuItems.findIndex(i => i.id === itemId);
    localMenuItems[idx].is_deleted = false;
    saveLocal();
    return localMenuItems[idx];
  },
  
  // --- CUSTOMERS ---
  getCustomers: async (restaurantId: string): Promise<Customer[]> => {
      if (isSupabaseConfigured() && supabase) {
          const { data, error } = await supabase.from('customers').select('*').eq('restaurant_id', restaurantId).eq('is_deleted', false);
          if(error) throw error;
          return data || [];
      }
    await simulateDelay(300);
    return localCustomers.filter(c => !c.is_deleted && c.restaurant_id === restaurantId);
  },

  findCustomerByContact: async (restaurantId: string, contact: string): Promise<Customer | undefined> => {
    if (isSupabaseConfigured() && supabase) {
        const { data } = await supabase.from('customers')
            .select('*')
            .eq('restaurant_id', restaurantId)
            .eq('is_deleted', false)
            .or(`telefono.eq.${contact},email.eq.${contact}`)
            .maybeSingle();
        return data || undefined;
    }
    await simulateDelay(200);
    return localCustomers.find(c => c.restaurant_id === restaurantId && (c.telefono === contact || c.email === contact) && !c.is_deleted);
  },

  createCustomer: async (customerData: Omit<Customer, 'id' | 'ltv' | 'ultima_compra' | 'frecuencia_promedio_dias' | 'is_verified'>): Promise<Customer> => {
    const payload = {
        ...customerData,
        ltv: 0,
        ultima_compra: new Date().toISOString(),
        frecuencia_promedio_dias: 0,
        is_verified: false,
        is_deleted: false,
    };

    if (isSupabaseConfigured() && supabase) {
        const { data, error } = await supabase.from('customers').insert({...payload, id: `cust-${Date.now()}`}).select().single();
        if(error) throw error;
        return data;
    }

    await simulateDelay(200);
    const newCustomer = { ...payload, id: `customer-${Date.now()}` };
    localCustomers = [newCustomer, ...localCustomers];
    saveLocal();
    return newCustomer;
  },
  
  updateCustomer: async (updatedCustomer: Customer): Promise<Customer> => {
      if (isSupabaseConfigured() && supabase) {
          const { data, error } = await supabase.from('customers').update(updatedCustomer).eq('id', updatedCustomer.id).select().single();
          if(error) throw error;
          return data;
      }
    await simulateDelay(200);
    const idx = localCustomers.findIndex(c => c.id === updatedCustomer.id);
    localCustomers[idx] = updatedCustomer;
    saveLocal();
    return localCustomers[idx];
  },

  verifyCustomer: async (customerId: string): Promise<Customer> => {
      if (isSupabaseConfigured() && supabase) {
           const { data, error } = await supabase.from('customers').update({ is_verified: true }).eq('id', customerId).select().single();
           if(error) throw error;
           return data;
      }
      await simulateDelay(200);
      const idx = localCustomers.findIndex(c => c.id === customerId);
      localCustomers[idx].is_verified = true;
      saveLocal();
      return localCustomers[idx];
  },

  deleteCustomer: async (customerId: string): Promise<void> => {
       if (isSupabaseConfigured() && supabase) {
           await supabase.from('customers').update({ is_deleted: true }).eq('id', customerId);
           return;
       }
    await simulateDelay(300);
    const idx = localCustomers.findIndex(c => c.id === customerId);
    localCustomers[idx].is_deleted = true;
    saveLocal();
  },

  // --- COUPONS ---
  getCoupons: async (restaurantId: string): Promise<Coupon[]> => {
      if (isSupabaseConfigured() && supabase) {
          const { data, error } = await supabase.from('coupons').select('*').eq('restaurant_id', restaurantId);
          if(error) throw error;
          return data || [];
      }
    await simulateDelay(300);
    return localCoupons.filter(c => c.restaurant_id === restaurantId);
  },

  createCoupon: async (couponData: Omit<Coupon, 'id'>): Promise<Coupon> => {
       if (isSupabaseConfigured() && supabase) {
           const { data, error } = await supabase.from('coupons').insert({...couponData, id: `coupon-${Date.now()}`}).select().single();
           if(error) throw error;
           return data;
       }
    await simulateDelay(200);
    const newCoupon = { ...couponData, id: `coupon-${Date.now()}` };
    localCoupons = [newCoupon, ...localCoupons];
    saveLocal();
    return newCoupon;
  },

  updateCoupon: async (updatedCoupon: Coupon): Promise<Coupon> => {
      if (isSupabaseConfigured() && supabase) {
          const { data, error } = await supabase.from('coupons').update(updatedCoupon).eq('id', updatedCoupon.id).select().single();
          if(error) throw error;
          return data;
      }
    await simulateDelay(200);
    const idx = localCoupons.findIndex(c => c.id === updatedCoupon.id);
    localCoupons[idx] = updatedCoupon;
    saveLocal();
    return localCoupons[idx];
  },

  deleteCoupon: async (couponId: string): Promise<void> => {
       if (isSupabaseConfigured() && supabase) {
           await supabase.from('coupons').delete().eq('id', couponId);
           return;
       }
    await simulateDelay(200);
    localCoupons = localCoupons.filter(c => c.id !== couponId);
    saveLocal();
  },

  // --- INGREDIENTS ---
  getIngredients: async (restaurantId: string): Promise<Ingredient[]> => {
       if (isSupabaseConfigured() && supabase) {
          const { data, error } = await supabase.from('ingredients').select('*').eq('restaurant_id', restaurantId);
          if(error) throw error;
          return data || [];
       }
    await simulateDelay(100);
    return localIngredients.filter(i => i.restaurant_id === restaurantId);
  },

  createIngredient: async (ingredientData: Omit<Ingredient, 'id'>): Promise<Ingredient> => {
      if (isSupabaseConfigured() && supabase) {
          const { data, error } = await supabase.from('ingredients').insert({...ingredientData, id: `ing-${Date.now()}`}).select().single();
          if(error) throw error;
          return data;
      }
    await simulateDelay(200);
    const newIngredient = { ...ingredientData, id: `ing-${Date.now()}` };
    localIngredients = [newIngredient, ...localIngredients];
    saveLocal();
    return newIngredient;
  },

  updateIngredient: async (updatedIngredient: Ingredient): Promise<Ingredient> => {
      if (isSupabaseConfigured() && supabase) {
          const { data, error } = await supabase.from('ingredients').update(updatedIngredient).eq('id', updatedIngredient.id).select().single();
          if(error) throw error;
          return data;
      }
    await simulateDelay(200);
    const idx = localIngredients.findIndex(i => i.id === updatedIngredient.id);
    localIngredients[idx] = updatedIngredient;
    saveLocal();
    return localIngredients[idx];
  },

  deleteIngredient: async (ingredientId: string): Promise<void> => {
       if (isSupabaseConfigured() && supabase) {
           await supabase.from('ingredients').delete().eq('id', ingredientId);
           return;
       }
    await simulateDelay(200);
    localIngredients = localIngredients.filter(i => i.id !== ingredientId);
    // Also remove from recipes locally
    localMenuItems = localMenuItems.map(item => ({
      ...item,
      receta: item.receta.filter(r => r.ingredient_id !== ingredientId),
    }));
    saveLocal();
  },


  // --- SETTINGS ---
  getRestaurantSettings: async (restaurantId: string): Promise<RestaurantSettings | null> => {
      if (isSupabaseConfigured() && supabase) {
          const { data, error } = await supabase.from('restaurants').select('settings').eq('id', restaurantId).single();
          if(error) return null;
          return data.settings;
      }
    await simulateDelay(100);
    const restaurant = localRestaurants.find(r => r.id === restaurantId);
    return restaurant ? restaurant.settings : null;
  },

  // --- TABLES ---
  getTables: async (restaurantId: string): Promise<Table[]> => {
      if (isSupabaseConfigured() && supabase) {
          const { data, error } = await supabase.from('tables').select('*').eq('restaurant_id', restaurantId);
          if(error) throw error;
          // Map composite ID for local logic compatibility if needed, but frontend treats ID as identifier.
          return data || [];
      }
    await simulateDelay(100);
    return localTables.filter(t => t.restaurant_id === restaurantId);
  },

  updateTable: async (updatedTable: Table): Promise<Table> => {
      if (isSupabaseConfigured() && supabase) {
          const { data, error } = await supabase.from('tables')
            .update(updatedTable)
            // Using composite PK match via standard ID if unique, or composite query
            .eq('restaurant_id', updatedTable.restaurant_id)
            .eq('table_number', updatedTable.id) 
            .select().single();
          if(error) throw error;
          return data;
      }
    await simulateDelay(100);
    const idx = localTables.findIndex(t => t.id === updatedTable.id && t.restaurant_id === updatedTable.restaurant_id);
    localTables[idx] = updatedTable;
    saveLocal();
    return { ...localTables[idx] };
  },

  updateTablesLayout: async (updatedTables: Table[]): Promise<Table[]> => {
      if (isSupabaseConfigured() && supabase) {
          // Loop upserts (inefficient but simpler)
           for (const t of updatedTables) {
                await supabase.from('tables').upsert({
                    ...t,
                    id: `${t.restaurant_id}_${t.id}`,
                    table_number: t.id
                });
           }
           return updatedTables;
      }
    await simulateDelay(300);
    if (updatedTables.length === 0) return [];
    const restaurantId = updatedTables[0].restaurant_id;
    const otherTables = localTables.filter(t => t.restaurant_id !== restaurantId);
    localTables = [...otherTables, ...updatedTables];
    saveLocal();
    return updatedTables;
  },
};
