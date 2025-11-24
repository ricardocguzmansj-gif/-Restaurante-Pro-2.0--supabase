
import { getSupabaseClient } from './supabase';
import { 
    Order, MenuItem, Customer, Coupon, User, RestaurantSettings, 
    Table, Ingredient, MenuCategory, OrderStatus, Restaurant, OrderType 
} from '../types';

const supabase = getSupabaseClient();

const checkConnection = () => {
    if (!supabase) throw new Error("Supabase client not initialized");
};

const generateId = (prefix: string) => `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

export const api = {
    getRestaurants: async (): Promise<Restaurant[]> => {
        checkConnection();
        const { data, error } = await supabase!.from('restaurants').select('*');
        if (error) throw error;
        return data || [];
    },

    getOrders: async (restaurantId: string): Promise<Order[]> => {
        checkConnection();
        const { data, error } = await supabase!.from('orders').select('*').eq('restaurant_id', restaurantId).order('creado_en', { ascending: false });
        if (error) throw error;
        return data || [];
    },

    getMenuItems: async (restaurantId: string): Promise<MenuItem[]> => {
        checkConnection();
        const { data, error } = await supabase!.from('menu_items').select('*').eq('restaurant_id', restaurantId);
        if (error) throw error;
        return data || [];
    },

    getCustomers: async (restaurantId: string): Promise<Customer[]> => {
        checkConnection();
        const { data, error } = await supabase!.from('customers').select('*').eq('restaurant_id', restaurantId);
        if (error) throw error;
        return data || [];
    },

    getCoupons: async (restaurantId: string): Promise<Coupon[]> => {
        checkConnection();
        const { data, error } = await supabase!.from('coupons').select('*').eq('restaurant_id', restaurantId);
        if (error) throw error;
        return data || [];
    },

    getUsers: async (restaurantId: string): Promise<User[]> => {
        checkConnection();
        const { data, error } = await supabase!.from('app_users').select('*').eq('restaurant_id', restaurantId);
        if (error) throw error;
        return data || [];
    },

    getCategories: async (restaurantId: string): Promise<MenuCategory[]> => {
        checkConnection();
        const { data, error } = await supabase!.from('categories').select('*').eq('restaurant_id', restaurantId).order('orden', { ascending: true });
        if (error) throw error;
        return data || [];
    },

    getRestaurantSettings: async (restaurantId: string): Promise<RestaurantSettings | null> => {
        checkConnection();
        const { data, error } = await supabase!.from('restaurants').select('settings').eq('id', restaurantId).single();
        if (error) return null;
        return data?.settings || null;
    },

    getTables: async (restaurantId: string): Promise<Table[]> => {
        checkConnection();
        const { data, error } = await supabase!.from('tables').select('*').eq('restaurant_id', restaurantId);
        if (error) throw error;
        return (data || []).sort((a, b) => a.id - b.id);
    },

    getIngredients: async (restaurantId: string): Promise<Ingredient[]> => {
        checkConnection();
        const { data, error } = await supabase!.from('ingredients').select('*').eq('restaurant_id', restaurantId);
        if (error) throw error;
        return data || [];
    },

    login: async (email: string, password: string): Promise<User | null> => {
        checkConnection();
        const { data, error } = await supabase!.from('app_users').select('*').eq('email', email).eq('password', password).single();
        if (error || !data) return null;
        return data;
    },

    recoverPassword: async (email: string): Promise<string> => {
        checkConnection();
        return "123456-temp";
    },

    updateOrderStatus: async (orderId: number, status: OrderStatus): Promise<Order> => {
        checkConnection();
        const { data, error } = await supabase!.from('orders').update({ estado: status }).eq('id', orderId).select().single();
        if (error) throw error;
        return data;
    },

    deductStockForOrder: async (orderId: number): Promise<void> => {
        checkConnection();
        const { data: order } = await supabase!.from('orders').select('*').eq('id', orderId).single();
        if(!order) return;
        
        const itemsToProcess = order.items;
        
        const { data: menuItemsData } = await supabase!.from('menu_items').select('*').eq('restaurant_id', order.restaurant_id);
        const menuMap = new Map<string, MenuItem>(menuItemsData?.map((m: any) => [m.id, m as MenuItem]));
        
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

    cancelOrder: async (orderId: number): Promise<Order> => {
        checkConnection();
        const { data, error } = await supabase!.from('orders').update({ estado: OrderStatus.CANCELADO }).eq('id', orderId).select().single();
        if (error) throw error;
        return data;
    },

    createOrder: async (orderData: any): Promise<Order> => {
        checkConnection();
        // Clean Order Data
        const payload = {
            restaurant_id: orderData.restaurant_id,
            customer_id: orderData.customer_id,
            table_id: orderData.table_id,
            creado_por_id: orderData.creado_por_id,
            repartidor_id: orderData.repartidor_id,
            mozo_id: orderData.mozo_id,
            tipo: orderData.tipo,
            estado: orderData.estado || (orderData.tipo === OrderType.SALA ? OrderStatus.NUEVO : OrderStatus.PENDIENTE_PAGO),
            subtotal: orderData.subtotal,
            descuento: orderData.descuento,
            impuestos: orderData.impuestos,
            propina: orderData.propina,
            total: orderData.total,
            items: orderData.items, // JSONB
            creado_en: new Date().toISOString(),
            payments: []
        };

        const { data, error } = await supabase!.from('orders').insert(payload).select().single();
        if (error) throw error;
        return data;
    },

    createPublicOrder: async (orderData: any): Promise<Order> => {
        return api.createOrder(orderData);
    },

    createCustomer: async (customerData: any): Promise<Customer> => {
        checkConnection();
        const payload = {
            id: customerData.id || generateId('cust'),
            restaurant_id: customerData.restaurant_id,
            nombre: customerData.nombre,
            telefono: customerData.telefono,
            email: customerData.email,
            direccion: customerData.direccion, // JSONB
            ltv: 0,
            ultima_compra: new Date().toISOString(),
            frecuencia_promedio_dias: 0,
            is_verified: false,
            is_deleted: false
        };
        const { data, error } = await supabase!.from('customers').insert(payload).select().single();
        if (error) throw error;
        return data;
    },

    updateCustomer: async (customerData: Customer): Promise<Customer> => {
        checkConnection();
        const { id, ltv, ultima_compra, frecuencia_promedio_dias, is_verified, is_deleted, ...rest } = customerData;
        const { data, error } = await supabase!.from('customers').update(customerData).eq('id', customerData.id).select().single();
        if (error) throw error;
        return data;
    },

    deleteCustomer: async (id: string): Promise<void> => {
        checkConnection();
        const { error } = await supabase!.from('customers').update({ is_deleted: true }).eq('id', id);
        if (error) throw error;
    },

    findCustomerByContact: async (restaurantId: string, contact: string): Promise<Customer | undefined> => {
        checkConnection();
        const { data } = await supabase!.from('customers')
            .select('*')
            .eq('restaurant_id', restaurantId)
            .or(`telefono.eq.${contact},email.eq.${contact}`)
            .single();
        return data || undefined;
    },

    verifyCustomer: async (id: string): Promise<void> => {
        checkConnection();
        await supabase!.from('customers').update({ is_verified: true }).eq('id', id);
    },

    updateOrder: async (id: number, orderData: any): Promise<Order> => {
        checkConnection();
        const { data, error } = await supabase!.from('orders').update(orderData).eq('id', id).select().single();
        if (error) throw error;
        return data;
    },

    assignRepartidorToOrder: async (id: number, repartidorId: string): Promise<Order> => {
        checkConnection();
        const { data, error } = await supabase!.from('orders').update({ 
            repartidor_id: repartidorId, 
            estado: OrderStatus.EN_CAMINO 
        }).eq('id', id).select().single();
        if (error) throw error;
        
        await supabase!.from('app_users').update({ estado_delivery: 'OCUPADO' }).eq('id', repartidorId);
        
        return data;
    },

    createCoupon: async (couponData: any): Promise<Coupon> => {
        checkConnection();
        const payload = {
            id: couponData.id || generateId('cpn'),
            restaurant_id: couponData.restaurant_id,
            codigo: couponData.codigo,
            tipo: couponData.tipo,
            valor: couponData.valor,
            activo: couponData.activo,
            expira_en: couponData.expira_en,
            minimo_subtotal: couponData.minimo_subtotal
        };
        const { data, error } = await supabase!.from('coupons').insert(payload).select().single();
        if (error) throw error;
        return data;
    },

    updateCoupon: async (couponData: Coupon): Promise<Coupon> => {
        checkConnection();
        const { data, error } = await supabase!.from('coupons').update(couponData).eq('id', couponData.id).select().single();
        if (error) throw error;
        return data;
    },

    deleteCoupon: async (id: string): Promise<void> => {
        checkConnection();
        const { error } = await supabase!.from('coupons').delete().eq('id', id);
        if (error) throw error;
    },

    generatePaymentQR: async (orderId: number, amount: number): Promise<any> => {
        return { last_qr_code_url: "https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=PagoDemo" };
    },

    addPaymentToOrder: async (orderId: number, method: any, amount: number): Promise<Order> => {
        checkConnection();
        const { data: order } = await supabase!.from('orders').select('payments, total').eq('id', orderId).single();
        if (!order) throw new Error("Order not found");

        const newPayment = {
            status: 'PAGADO',
            method,
            amount,
            creado_en: new Date().toISOString()
        };
        const updatedPayments = [...(order.payments || []), newPayment];
        
        const totalPaid = updatedPayments.reduce((sum: number, p: any) => sum + p.amount, 0);
        let newState = undefined;
        
        if (totalPaid >= order.total) {
             const { data: currentOrder } = await supabase!.from('orders').select('tipo').eq('id', orderId).single();
             if (currentOrder?.tipo === OrderType.SALA) {
                 newState = OrderStatus.ENTREGADO;
             } else {
                 newState = OrderStatus.NUEVO;
             }
        }

        const updatePayload: any = { payments: updatedPayments };
        if (newState) updatePayload.estado = newState;

        const { data: updatedOrder, error } = await supabase!.from('orders').update(updatePayload).eq('id', orderId).select().single();
        if (error) throw error;
        return updatedOrder;
    },

    createUser: async (userData: any): Promise<User> => {
        checkConnection();
        const { confirmPassword, ...safeUserData } = userData;
        
        const payload = {
            id: safeUserData.id || generateId('user'),
            restaurant_id: safeUserData.restaurant_id,
            nombre: safeUserData.nombre,
            email: safeUserData.email,
            rol: safeUserData.rol,
            password: safeUserData.password,
            avatar_url: safeUserData.avatar_url || `https://ui-avatars.com/api/?name=${safeUserData.nombre}&background=random`,
            estado_delivery: safeUserData.estado_delivery || 'DISPONIBLE',
            is_deleted: false,
            must_change_password: safeUserData.must_change_password
        };

        const { data, error } = await supabase!.from('app_users').insert(payload).select().single();
        if (error) throw error;
        return data;
    },

    updateUser: async (userData: User): Promise<User> => {
        checkConnection();
        const { confirmPassword, ...safeUserData } = userData as any;
        
        const { data, error } = await supabase!.from('app_users').update(safeUserData).eq('id', userData.id).select().single();
        if (error) throw error;
        return data;
    },

    deleteUser: async (id: string): Promise<void> => {
        checkConnection();
        const { error } = await supabase!.from('app_users').delete().eq('id', id);
        if (error) throw error;
    },

    createMenuItem: async (itemData: any): Promise<MenuItem> => {
        checkConnection();
        const payload = {
            id: itemData.id || generateId('menu'),
            restaurant_id: itemData.restaurant_id,
            category_id: itemData.category_id,
            nombre: itemData.nombre,
            descripcion: itemData.descripcion,
            precio_base: itemData.precio_base,
            coste: itemData.coste,
            receta: itemData.receta, // JSONB
            img_url: itemData.img_url,
            etiquetas: itemData.etiquetas,
            disponible: itemData.disponible,
            tiempo_preparacion_min: itemData.tiempo_preparacion_min,
            permite_venta_sin_stock: itemData.permite_venta_sin_stock,
            stock_actual: null,
            is_deleted: false
        };
        const { data, error } = await supabase!.from('menu_items').insert(payload).select().single();
        if (error) throw error;
        return data;
    },

    updateMenuItem: async (itemData: MenuItem): Promise<MenuItem> => {
        checkConnection();
        const { data, error } = await supabase!.from('menu_items').update(itemData).eq('id', itemData.id).select().single();
        if (error) throw error;
        return data;
    },

    deleteMenuItem: async (id: string): Promise<MenuItem> => {
        checkConnection();
        const { data, error } = await supabase!.from('menu_items').update({ is_deleted: true }).eq('id', id).select().single();
        if (error) throw error;
        return data;
    },

    restoreMenuItem: async (id: string): Promise<MenuItem> => {
        checkConnection();
        const { data, error } = await supabase!.from('menu_items').update({ is_deleted: false }).eq('id', id).select().single();
        if (error) throw error;
        return data;
    },

    updateCategories: async (categories: MenuCategory[]): Promise<MenuCategory[]> => {
        checkConnection();
        // IMPORTANT: Prioritize c.orden if it exists (e.g. from editing an object), 
        // otherwise fallback to index (e.g. from reordering list)
        const updates = categories.map((c, index) => ({ 
            id: c.id,
            restaurant_id: c.restaurant_id,
            nombre: c.nombre,
            orden: c.orden !== undefined ? c.orden : index,
            parent_id: c.parent_id 
        }));
        const { data, error } = await supabase!.from('categories').upsert(updates).select();
        if (error) throw error;
        return data || [];
    },

    createCategory: async (catData: any): Promise<MenuCategory> => {
        checkConnection();
        const payload = {
            id: catData.id || generateId('cat'),
            restaurant_id: catData.restaurant_id,
            nombre: catData.nombre,
            orden: catData.orden ?? 0,
            parent_id: catData.parent_id || null
        };
        const { data, error } = await supabase!.from('categories').insert(payload).select().single();
        if (error) throw error;
        return data;
    },

    deleteCategory: async (id: string): Promise<void> => {
        checkConnection();
        const { error } = await supabase!.from('categories').delete().eq('id', id);
        if (error) throw error;
    },

    updateRestaurantSettings: async (id: string, settings: RestaurantSettings): Promise<RestaurantSettings> => {
        checkConnection();
        const { data, error } = await supabase!.from('restaurants').update({ settings }).eq('id', id).select().single();
        if (error) throw error;
        return data.settings;
    },

    updateTable: async (table: Table): Promise<Table> => {
        checkConnection();
        const { data, error } = await supabase!.from('tables').update(table).eq('id', table.id).select().single();
        if (error) throw error;
        return data;
    },

    updateTablesLayout: async (tables: Table[]): Promise<Table[]> => {
        checkConnection();
        const { data, error } = await supabase!.from('tables').upsert(tables).select();
        if (error) throw error;
        return data || [];
    },

    createIngredient: async (ingData: any): Promise<Ingredient> => {
        checkConnection();
        const payload = {
            id: ingData.id || generateId('ing'),
            restaurant_id: ingData.restaurant_id,
            nombre: ingData.nombre,
            unidad: ingData.unidad,
            stock_actual: ingData.stock_actual,
            stock_minimo: ingData.stock_minimo,
            coste_unitario: ingData.coste_unitario,
            categoria: ingData.categoria
        };
        const { data, error } = await supabase!.from('ingredients').insert(payload).select().single();
        if (error) throw error;
        return data;
    },

    updateIngredient: async (ingData: Ingredient): Promise<Ingredient> => {
        checkConnection();
        const { data, error } = await supabase!.from('ingredients').update(ingData).eq('id', ingData.id).select().single();
        if (error) throw error;
        return data;
    },

    deleteIngredient: async (id: string): Promise<void> => {
        checkConnection();
        const { error } = await supabase!.from('ingredients').delete().eq('id', id);
        if (error) throw error;
    },

    createRestaurant: async (settings: RestaurantSettings): Promise<Restaurant> => {
        checkConnection();
        const id = `rest-${Date.now()}`;
        const { data, error } = await supabase!.from('restaurants').insert({ id, settings }).select().single();
        if (error) throw error;
        return data;
    },

    deleteRestaurant: async (id: string): Promise<void> => {
        checkConnection();
        const { error } = await supabase!.from('restaurants').delete().eq('id', id);
        if (error) throw error;
    },

    updateUserLocation: async (id: string, lat: number, lng: number): Promise<void> => {
        checkConnection();
        await supabase!.from('app_users').update({ 
            last_location: { lat, lng, updated_at: new Date().toISOString() }
        }).eq('id', id);
    },

    getAllLocalData: () => {
        return {
            restaurants: [],
            users: [],
            categories: [],
            ingredients: [],
            menuItems: [],
            customers: [],
            tables: [],
            orders: [],
            coupons: []
        };
    }
};
