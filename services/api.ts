import { Order, OrderStatus, MenuItem, User, Customer, Coupon, OrderType, UserRole, PaymentDetails, MenuCategory, RestaurantSettings, Table, Ingredient, TableStatus, Restaurant } from '../types';
import { getSupabaseClient } from './supabase';
import { demoRestaurants, demoUsers, demoCategories, demoIngredients, demoMenuItems, demoCustomers, demoTables, demoOrders, demoCoupons } from '../data/db';

// Cliente singleton para evitar recreación constante
const supabase = getSupabaseClient();

const checkConnection = () => {
    if (!supabase) throw new Error("La conexión a Supabase no está configurada. Verifique las variables de entorno o credenciales en services/supabase.ts.");
};

export const api = {
  // --- RESTAURANTS ---
  getRestaurants: async (): Promise<Restaurant[]> => {
      checkConnection();
      const { data, error } = await supabase!.from('restaurants').select('*');
      if (error) throw error;
      return data || [];
  },

  getRestaurantById: async (id: string): Promise<Restaurant | undefined> => {
       checkConnection();
       const { data, error } = await supabase!.from('restaurants').select('*').eq('id', id).single();
       if (error) return undefined;
       return data;
  },

  createRestaurant: async (settings: RestaurantSettings): Promise<Restaurant> => {
      checkConnection();
      const newId = `rest-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const newRestaurant = { id: newId, settings };
      const { data, error } = await supabase!.from('restaurants').insert(newRestaurant).select().single();
      if (error) throw error;
      return data;
  },

  updateRestaurantSettings: async (restaurantId: string, settings: RestaurantSettings): Promise<RestaurantSettings> => {
    checkConnection();
    const { data, error } = await supabase!.from('restaurants')
        .update({ settings })
        .eq('id', restaurantId)
        .select().single();
    if (error) throw error;
    return data.settings;
  },

  deleteRestaurant: async (restaurantId: string): Promise<void> => {
      checkConnection();
      // Supabase con "ON DELETE CASCADE" configurado en SQL debería manejar esto,
      // pero por seguridad hacemos limpieza explícita si las FK no están en cascade.
      
      // 1. Eliminar dependencias (orden inverso de jerarquía)
      await supabase!.from('orders').delete().eq('restaurant_id', restaurantId);
      await supabase!.from('menu_items').delete().eq('restaurant_id', restaurantId);
      await supabase!.from('ingredients').delete().eq('restaurant_id', restaurantId);
      await supabase!.from('categories').delete().eq('restaurant_id', restaurantId);
      await supabase!.from('tables').delete().eq('restaurant_id', restaurantId);
      await supabase!.from('coupons').delete().eq('restaurant_id', restaurantId);
      await supabase!.from('customers').delete().eq('restaurant_id', restaurantId);
      await supabase!.from('app_users').delete().eq('restaurant_id', restaurantId);
      
      // 2. Eliminar Restaurante
      const { error } = await supabase!.from('restaurants').delete().eq('id', restaurantId);
      if (error) throw error;
  },

  // --- USERS ---
  login: async (email: string, password_provided: string): Promise<User | undefined> => {
    checkConnection();
    try {
        // Usamos la tabla personalizada 'app_users' según el esquema definido.
        const { data, error } = await supabase!
            .from('app_users')
            .select('*')
            .ilike('email', email)
            .eq('is_deleted', false)
            .maybeSingle();
        
        if (error) {
            console.error("Supabase Login Error:", JSON.stringify(error, null, 2));
            if (error.code === '54001' || String(error.code) === '54001' || error.message.includes('stack depth limit')) {
                throw new Error("Error 54001: Recursión en la Base de Datos. Ejecute el script SQL de limpieza.");
            }
            if (error.code === '42P01') {
                 throw new Error("Tabla 'app_users' no existe. Ejecute el script SQL en Supabase.");
            }
            throw new Error(`Error de base de datos: ${error.message}`);
        }
        
        if (!data) return undefined;
        
        // Nota: En producción real, usar Supabase Auth o bcrypt para comparar hashes.
        // Aquí comparamos texto plano según el esquema actual.
        if (data.password === password_provided) {
             return data as User;
        }
        return undefined;
    } catch (err: any) {
        console.error("Login Exception:", err);
        if (err.message && (err.message.includes('Failed to fetch') || err.message.includes('NetworkError'))) {
            throw new Error("Error de conexión. Verifique su internet o si el proyecto Supabase está pausado (Free Tier).");
        }
        throw err;
    }
  },

  recoverPassword: async (email: string): Promise<string> => {
      checkConnection();
      const tempPassword = Math.random().toString(36).slice(-8).toUpperCase();
      
      // 1. Verificar usuario
      const { data: user, error: findError } = await supabase!
          .from('app_users')
          .select('id')
          .ilike('email', email)
          .eq('is_deleted', false)
          .single();

      if (findError || !user) {
          throw new Error("No se encontró un usuario con ese correo electrónico.");
      }

      // 2. Actualizar password
      const { error: updateError } = await supabase!
          .from('app_users')
          .update({ 
              password: tempPassword,
              must_change_password: true 
          })
          .eq('id', user.id);

      if (updateError) {
          throw new Error("Error al actualizar la contraseña. Inténtelo de nuevo.");
      }
      
      return tempPassword;
  },

  getUsers: async (restaurantId: string): Promise<User[]> => {
    checkConnection();
    const { data, error } = await supabase!
        .from('app_users')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .eq('is_deleted', false);
    if (error) throw error;
    return data || [];
  },

  createUser: async (userData: Omit<User, 'id' | 'avatar_url'>): Promise<User> => {
    checkConnection();
    const newId = `user-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const userPayload = {
         ...userData,
         id: newId,
         avatar_url: `https://i.pravatar.cc/150?u=${newId}`,
         is_deleted: false,
         password: 'password', 
         must_change_password: true 
    };
    const { data, error } = await supabase!.from('app_users').insert(userPayload).select().single();
    if (error) throw error;
    return data;
  },

  updateUser: async (updatedUser: User): Promise<User> => {
    checkConnection();
    const { data, error } = await supabase!
        .from('app_users')
        .update(updatedUser)
        .eq('id', updatedUser.id)
        .select().single();
    if (error) throw error;
    return data;
  },

  updateUserLocation: async (userId: string, lat: number, lng: number): Promise<void> => {
     checkConnection();
     const locationData = { lat, lng, updated_at: new Date().toISOString() };
     await supabase!.from('app_users').update({ last_location: locationData }).eq('id', userId);
  },

  deleteUser: async (userId: string): Promise<void> => {
    checkConnection();
    
    // Obtener usuario para validaciones
    const { data: userToDelete } = await supabase!.from('app_users').select('*').eq('id', userId).single();
    if (!userToDelete) throw new Error("User not found");
    
    if (userToDelete.rol === UserRole.SUPER_ADMIN) {
        throw new Error("CRÍTICO: No se puede eliminar al Super Admin.");
    }

    // Validar que no sea el último admin
    if (userToDelete.rol === UserRole.ADMIN) {
        const { data: admins } = await supabase!.from('app_users')
            .select('id')
            .eq('restaurant_id', userToDelete.restaurant_id)
            .eq('rol', UserRole.ADMIN)
            .eq('is_deleted', false);
            
        if (admins && admins.length <= 1) {
             throw new Error("No se puede eliminar al último administrador del restaurante.");
        }
    }

    const { error } = await supabase!.from('app_users').update({ is_deleted: true }).eq('id', userId);
    if (error) throw error;
  },

  // --- ORDERS ---
  getOrders: async (restaurantId: string): Promise<Order[]> => {
    checkConnection();
    const { data, error } = await supabase!
        .from('orders')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .order('creado_en', { ascending: false });
    if (error) throw error;
    return data as Order[];
  },
  
  createOrder: async (newOrderData: Omit<Order, 'id' | 'creado_en' | 'payments' | 'estado' | 'repartidor_id'>): Promise<Order> => {
    checkConnection();
    const orderPayload = {
        ...newOrderData,
        creado_en: new Date().toISOString(),
        repartidor_id: null,
        estado: newOrderData.tipo === OrderType.PARA_LLEVAR ? OrderStatus.PENDIENTE_PAGO : OrderStatus.NUEVO,
        payments: [],
    };
    // ID es serial en la base de datos, se autogenera
    const { data, error } = await supabase!.from('orders').insert(orderPayload).select().single();
    if (error) throw error;
    return data as Order;
  },

  createPublicOrder: async (newOrderData: Omit<Order, 'id' | 'creado_en' | 'payments' | 'estado' | 'repartidor_id' | 'creado_por_id' | 'mozo_id'>): Promise<Order> => {
     checkConnection();
     const orderPayload = {
      ...newOrderData,
      creado_en: new Date().toISOString(),
      repartidor_id: null,
      creado_por_id: 'user-system-portal',
      estado: newOrderData.tipo === OrderType.PARA_LLEVAR ? OrderStatus.PENDIENTE_PAGO : OrderStatus.NUEVO,
      payments: [],
      mozo_id: null,
    };

    const { data, error } = await supabase!.from('orders').insert(orderPayload).select().single();
    if (error) throw error;
    return data as Order;
  },

  updateOrderStatus: async (orderId: number, newStatus: OrderStatus): Promise<Order> => {
    checkConnection();
    
    // Lógica de liberación de repartidor
    const { data: order } = await supabase!.from('orders').select('repartidor_id, tipo').eq('id', orderId).single();
    
    if (order && order.tipo === OrderType.DELIVERY && order.repartidor_id && [OrderStatus.ENTREGADO, OrderStatus.CANCELADO, OrderStatus.DEVOLUCION].includes(newStatus)) {
         await supabase!.from('app_users').update({ estado_delivery: 'DISPONIBLE' }).eq('id', order.repartidor_id);
    }

    const { data, error } = await supabase!
        .from('orders')
        .update({ estado: newStatus })
        .eq('id', orderId)
        .select().single();
    if (error) throw error;
    return data as Order;
  },
  
  cancelOrder: async (orderId: number): Promise<Order> => {
    checkConnection();
    const { data: order } = await supabase!.from('orders').select('*').eq('id', orderId).single();
    if (!order) throw new Error("Order not found");
    
    const cancellableStates = [OrderStatus.NUEVO, OrderStatus.EN_PREPARACION, OrderStatus.LISTO, OrderStatus.EN_CAMINO, OrderStatus.INCIDENCIA, OrderStatus.PENDIENTE_PAGO];
    if (!cancellableStates.includes(order.estado)) throw new Error("El pedido no puede ser cancelado en su estado actual.");

    // Devolución de Stock
    const stockDeductedStates = [OrderStatus.EN_PREPARACION, OrderStatus.LISTO, OrderStatus.EN_CAMINO, OrderStatus.INCIDENCIA];
    if (stockDeductedStates.includes(order.estado)) {
        for (const orderItem of order.items) {
             const { data: menuItem } = await supabase!.from('menu_items').select('*').eq('id', orderItem.menu_item_id).single();
             if (menuItem && menuItem.receta) {
                 for (const recipeItem of menuItem.receta) {
                    const { data: ing } = await supabase!.from('ingredients').select('stock_actual').eq('id', recipeItem.ingredient_id).single();
                    if(ing) {
                        await supabase!.from('ingredients').update({ stock_actual: ing.stock_actual + (recipeItem.cantidad * orderItem.cantidad)}).eq('id', recipeItem.ingredient_id);
                    }
                 }
             }
        }
    }

    // Liberar Repartidor
    if (order.repartidor_id) {
         await supabase!.from('app_users').update({ estado_delivery: 'DISPONIBLE' }).eq('id', order.repartidor_id);
    }
    
    // Liberar Mesa
    if (order.table_id && order.tipo === OrderType.SALA) {
         await supabase!.from('tables')
            .update({ estado: TableStatus.NECESITA_LIMPIEZA, order_id: null, mozo_id: null })
            .eq('table_number', order.table_id)
            .eq('restaurant_id', order.restaurant_id);
    }

    const { data, error } = await supabase!.from('orders').update({ estado: OrderStatus.CANCELADO }).eq('id', orderId).select().single();
    if (error) throw error;
    return data as Order;
  },

  deductStockForOrder: async (orderId: number): Promise<void> => {
      checkConnection();
      const { data: order } = await supabase!.from('orders').select('*').eq('id', orderId).single();
      if(!order) return;
      
      const itemsToProcess = order.items;
      // Optimización: En producción real, esto debería ser un RPC (Stored Procedure) para atomicidad.
      // Aquí lo hacemos iterativo desde el cliente para mantener la lógica existente.
      
      const { data: menuItemsData } = await supabase!.from('menu_items').select('*').eq('restaurant_id', order.restaurant_id);
      const menuMap = new Map(menuItemsData?.map((m: any) => [m.id, m]));
      
      let ingredientsMap: Record<string, number> = {};

      for(const item of itemsToProcess) {
          const menuItem = menuMap.get(item.menu_item_id);
          if(menuItem && menuItem.receta) {
              for(const recipeItem of menuItem.receta) {
                  ingredientsMap[recipeItem.ingredient_id] = (ingredientsMap[recipeItem.ingredient_id] || 0) + (recipeItem.cantidad * item.cantidad);
              }
          }
      }

      for (const [ingId, amount] of Object.entries(ingredientsMap)) {
           const { data: ing } = await supabase!.from('ingredients').select('stock_actual').eq('id', ingId).single();
           if (ing) {
               await supabase!.from('ingredients').update({ stock_actual: ing.stock_actual - amount }).eq('id', ingId);
           }
      }
  },

  generatePaymentQR: async (orderId: number, amount: number): Promise<Order> => {
    checkConnection();
    const qr_code_url = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(JSON.stringify({orderId, amount}))}`;
    // Nota: Supabase schema debe soportar guardar este URL o simplemente lo retornamos al cliente
    // En este caso, devolvemos la orden y añadimos la URL dinámicamente para el frontend
    const { data } = await supabase!.from('orders').select('*').eq('id', orderId).single();
    return { ...data, last_qr_code_url: qr_code_url } as any;
  },

  addPaymentToOrder: async (orderId: number, method: PaymentDetails['method'], amount: number): Promise<Order> => {
    checkConnection();
    const payment: PaymentDetails = {
        status: 'PAGADO',
        method: method,
        transaction_id: `txn_${Date.now()}`,
        amount: amount,
        creado_en: new Date().toISOString()
    };

    const { data: order } = await supabase!.from('orders').select('*').eq('id', orderId).single();
    const currentPayments = (order.payments || []) as PaymentDetails[];
    const updatedPayments = [...currentPayments, payment];
    
    const totalPaid = updatedPayments.reduce((sum, p) => sum + p.amount, 0);
    let newStatus = order.estado;

    if (totalPaid >= order.total && order.estado === OrderStatus.PENDIENTE_PAGO) {
        newStatus = (order.tipo === OrderType.PARA_LLEVAR) ? OrderStatus.NUEVO : OrderStatus.ENTREGADO;
    }

    const { data, error } = await supabase!
        .from('orders')
        .update({ payments: updatedPayments, estado: newStatus })
        .eq('id', orderId)
        .select()
        .single();

    if(error) throw error;
    return data as Order;
  },

  updateOrder: async (orderId: number, updatedOrderData: Partial<Order>): Promise<Order> => {
     checkConnection();
     const { data, error } = await supabase!
        .from('orders')
        .update(updatedOrderData)
        .eq('id', orderId)
        .select().single();
     if(error) throw error;
     return data as Order;
  },

  assignRepartidorToOrder: async (orderId: number, repartidorId: string): Promise<Order> => {
     checkConnection();
     // 1. Liberar repartidor anterior si existe
     const { data: order } = await supabase!.from('orders').select('repartidor_id').eq('id', orderId).single();
     if (order && order.repartidor_id) {
          await supabase!.from('app_users').update({ estado_delivery: 'DISPONIBLE' }).eq('id', order.repartidor_id);
     }
     // 2. Ocupar nuevo repartidor
     await supabase!.from('app_users').update({ estado_delivery: 'EN_REPARTO' }).eq('id', repartidorId);
     
     // 3. Actualizar orden
     const { data, error } = await supabase!
        .from('orders')
        .update({ repartidor_id: repartidorId, estado: OrderStatus.EN_CAMINO })
        .eq('id', orderId)
        .select().single();
        
     if(error) throw error;
     return data as Order;
  },

  // --- CATEGORIES ---
  getCategories: async (restaurantId: string): Promise<MenuCategory[]> => {
      checkConnection();
      const { data, error } = await supabase!.from('categories').select('*').eq('restaurant_id', restaurantId).order('orden', { ascending: true });
      if (error) throw error;
      return data || [];
  },

  createCategory: async (categoryData: Omit<MenuCategory, 'id'>): Promise<MenuCategory> => {
    checkConnection();
    const { data, error } = await supabase!.from('categories').insert({...categoryData, id: `cat-${Date.now()}`}).select().single();
    if (error) throw error;
    return data;
  },

  updateCategories: async (updatedCategories: MenuCategory[]): Promise<MenuCategory[]> => {
      checkConnection();
      for (let i = 0; i < updatedCategories.length; i++) {
          const cat = updatedCategories[i];
          await supabase!.from('categories').update({ orden: i + 1 }).eq('id', cat.id);
      }
      return updatedCategories.map((c, i) => ({...c, orden: i+1}));
  },

  deleteCategory: async (categoryId: string): Promise<void> => {
    checkConnection();
    const { count } = await supabase!.from('menu_items').select('*', { count: 'exact', head: true }).eq('category_id', categoryId);
    if (count && count > 0) throw new Error("No se puede eliminar una categoría con productos.");
    
    await supabase!.from('categories').delete().eq('id', categoryId);
  },

  // --- MENU ITEMS ---
  getMenuItems: async (restaurantId: string): Promise<MenuItem[]> => {
      checkConnection();
      const { data, error } = await supabase!.from('menu_items').select('*').eq('restaurant_id', restaurantId);
      if(error) throw error;
      return data || [];
  },

  createMenuItem: async (itemData: Omit<MenuItem, 'id'>): Promise<MenuItem> => {
      checkConnection();
      const newId = `item-${Date.now()}`;
      const { data, error } = await supabase!.from('menu_items').insert({ ...itemData, id: newId, is_deleted: false }).select().single();
      if(error) throw error;
      return data;
  },

  updateMenuItem: async (updatedItem: MenuItem): Promise<MenuItem> => {
    checkConnection();
    const { data, error } = await supabase!.from('menu_items').update(updatedItem).eq('id', updatedItem.id).select().single();
    if(error) throw error;
    return data;
  },
  
  deleteMenuItem: async (itemId: string): Promise<MenuItem> => {
      checkConnection();
      const { data, error } = await supabase!.from('menu_items').update({ is_deleted: true }).eq('id', itemId).select().single();
      if(error) throw error;
      return data;
  },

  restoreMenuItem: async (itemId: string): Promise<MenuItem> => {
       checkConnection();
       const { data, error } = await supabase!.from('menu_items').update({ is_deleted: false }).eq('id', itemId).select().single();
       if(error) throw error;
       return data;
  },
  
  // --- CUSTOMERS ---
  getCustomers: async (restaurantId: string): Promise<Customer[]> => {
      checkConnection();
      const { data, error } = await supabase!.from('customers').select('*').eq('restaurant_id', restaurantId).eq('is_deleted', false);
      if(error) throw error;
      return data || [];
  },

  findCustomerByContact: async (restaurantId: string, contact: string): Promise<Customer | undefined> => {
    checkConnection();
    const { data } = await supabase!.from('customers')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .eq('is_deleted', false)
        .or(`telefono.eq.${contact},email.eq.${contact}`)
        .maybeSingle();
    return data || undefined;
  },

  createCustomer: async (customerData: Omit<Customer, 'id' | 'ltv' | 'ultima_compra' | 'frecuencia_promedio_dias' | 'is_verified'>): Promise<Customer> => {
    checkConnection();
    const payload = {
        ...customerData,
        ltv: 0,
        ultima_compra: new Date().toISOString(),
        frecuencia_promedio_dias: 0,
        is_verified: false,
        is_deleted: false,
    };
    const { data, error } = await supabase!.from('customers').insert({...payload, id: `cust-${Date.now()}`}).select().single();
    if(error) throw error;
    return data;
  },
  
  updateCustomer: async (updatedCustomer: Customer): Promise<Customer> => {
      checkConnection();
      const { data, error } = await supabase!.from('customers').update(updatedCustomer).eq('id', updatedCustomer.id).select().single();
      if(error) throw error;
      return data;
  },

  verifyCustomer: async (customerId: string): Promise<Customer> => {
      checkConnection();
      const { data, error } = await supabase!.from('customers').update({ is_verified: true }).eq('id', customerId).select().single();
      if(error) throw error;
      return data;
  },

  deleteCustomer: async (customerId: string): Promise<void> => {
       checkConnection();
       await supabase!.from('customers').update({ is_deleted: true }).eq('id', customerId);
  },

  // --- COUPONS ---
  getCoupons: async (restaurantId: string): Promise<Coupon[]> => {
      checkConnection();
      const { data, error } = await supabase!.from('coupons').select('*').eq('restaurant_id', restaurantId);
      if(error) throw error;
      return data || [];
  },

  createCoupon: async (couponData: Omit<Coupon, 'id'>): Promise<Coupon> => {
       checkConnection();
       const { data, error } = await supabase!.from('coupons').insert({...couponData, id: `coupon-${Date.now()}`}).select().single();
       if(error) throw error;
       return data;
  },

  updateCoupon: async (updatedCoupon: Coupon): Promise<Coupon> => {
      checkConnection();
      const { data, error } = await supabase!.from('coupons').update(updatedCoupon).eq('id', updatedCoupon.id).select().single();
      if(error) throw error;
      return data;
  },

  deleteCoupon: async (couponId: string): Promise<void> => {
       checkConnection();
       await supabase!.from('coupons').delete().eq('id', couponId);
  },

  // --- INGREDIENTS ---
  getIngredients: async (restaurantId: string): Promise<Ingredient[]> => {
       checkConnection();
       const { data, error } = await supabase!.from('ingredients').select('*').eq('restaurant_id', restaurantId);
       if(error) throw error;
       return data || [];
  },

  createIngredient: async (ingredientData: Omit<Ingredient, 'id'>): Promise<Ingredient> => {
      checkConnection();
      const { data, error } = await supabase!.from('ingredients').insert({...ingredientData, id: `ing-${Date.now()}`}).select().single();
      if(error) throw error;
      return data;
  },

  updateIngredient: async (updatedIngredient: Ingredient): Promise<Ingredient> => {
      checkConnection();
      const { data, error } = await supabase!.from('ingredients').update(updatedIngredient).eq('id', updatedIngredient.id).select().single();
      if(error) throw error;
      return data;
  },

  deleteIngredient: async (ingredientId: string): Promise<void> => {
       checkConnection();
       await supabase!.from('ingredients').delete().eq('id', ingredientId);
  },

  // --- SETTINGS ---
  getRestaurantSettings: async (restaurantId: string): Promise<RestaurantSettings | null> => {
      checkConnection();
      const { data, error } = await supabase!.from('restaurants').select('settings').eq('id', restaurantId).single();
      if(error) return null;
      return data.settings;
  },

  // --- TABLES ---
  getTables: async (restaurantId: string): Promise<Table[]> => {
      checkConnection();
      const { data, error } = await supabase!.from('tables').select('*').eq('restaurant_id', restaurantId);
      if(error) throw error;
      return data || [];
  },

  updateTable: async (updatedTable: Table): Promise<Table> => {
      checkConnection();
      const { data, error } = await supabase!.from('tables')
        .update(updatedTable)
        .eq('restaurant_id', updatedTable.restaurant_id)
        .eq('table_number', updatedTable.id) 
        .select().single();
      if(error) throw error;
      return data;
  },

  updateTablesLayout: async (updatedTables: Table[]): Promise<Table[]> => {
      checkConnection();
      // Loop upserts para actualizar layout
      for (const t of updatedTables) {
            await supabase!.from('tables').upsert({
                ...t,
                id: `${t.restaurant_id}_${t.id}`,
                table_number: t.id
            });
      }
      return updatedTables;
  },

  getAllLocalData: () => {
      return {
          restaurants: demoRestaurants as any[],
          users: demoUsers as any[],
          categories: demoCategories as any[],
          ingredients: demoIngredients as any[],
          menuItems: demoMenuItems as any[],
          customers: demoCustomers as any[],
          tables: demoTables as any[],
          orders: demoOrders as any[],
          coupons: demoCoupons as any[]
      };
  }
};