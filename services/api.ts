
import { getSupabaseClient } from './supabase';
import { 
    Order, MenuItem, Customer, Coupon, User, RestaurantSettings, 
    Table, Ingredient, MenuCategory, OrderStatus, Restaurant, OrderType, Sector, UserRole
} from '../types';

const supabase = getSupabaseClient();
const isOffline = !supabase;

if (isOffline) {
    console.warn("⚠️ AVISO: Cliente Supabase no inicializado. Ejecutando en MODO DEMO/OFFLINE. Algunas funciones de backend no estarán disponibles.");
}

const checkConnection = () => {
    if (isOffline) throw new Error("Modo Offline: Conexión a base de datos no disponible. Configure las credenciales de Supabase en el archivo .env");
};

const handleApiError = (error: any, context: string) => {
    console.error(`API Error in ${context}:`, JSON.stringify(error, null, 2));
    
    const message = error?.message || '';
    if (message.includes("Failed to fetch") || message.includes("NetworkError")) {
        throw new Error("Error de conexión: No se pudo contactar con la base de datos. Verifique su internet o el estado de Supabase.");
    }
    
    throw error;
};

const generateId = (prefix: string) => `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

// --- MOCK DATA FOR OFFLINE MODE ---
const MOCK_RESTAURANT_ID = 'rest-demo-local';
const MOCK_USER_ADMIN: User = {
    id: 'user-super-admin-local',
    restaurant_id: '',
    nombre: 'Super Admin (Local)',
    email: 'admin@restaurante.com',
    rol: UserRole.SUPER_ADMIN,
    avatar_url: 'https://ui-avatars.com/api/?name=Super+Admin&background=random',
    estado_delivery: 'DISPONIBLE',
    is_deleted: false
};
const MOCK_USER_MANAGER: User = {
    id: 'user-manager-local',
    restaurant_id: MOCK_RESTAURANT_ID,
    nombre: 'Gerente Demo',
    email: 'demo@restaurante.com',
    rol: UserRole.GERENTE,
    avatar_url: 'https://ui-avatars.com/api/?name=Gerente+Demo&background=random',
    estado_delivery: 'DISPONIBLE',
    is_deleted: false
};

export const api = {
    getRestaurants: async (): Promise<Restaurant[]> => {
        if (isOffline) {
            return [{
                id: MOCK_RESTAURANT_ID,
                settings: {
                    nombre: "Restaurante Demo (Offline)",
                    logo_url: "",
                    direccion: "Modo Local 123",
                    telefono: "000-0000",
                    horarios: "9am - 10pm",
                    iva_rate: 21,
                    precios_con_iva: true,
                    propina_opciones: [10, 15]
                }
            }];
        }
        try {
            const { data, error } = await supabase!.from('restaurants').select('*');
            if (error) throw error;
            return data || [];
        } catch (e) { 
            console.error("Error fetching restaurants:", e);
            return [];
        }
    },

    getOrders: async (restaurantId: string): Promise<Order[]> => {
        if (isOffline) return [];
        try {
            const { data, error } = await supabase!.from('orders')
                .select('*')
                .eq('restaurant_id', restaurantId)
                .order('creado_en', { ascending: false })
                .limit(500);
            if (error) throw error;
            return data || [];
        } catch (e) { return handleApiError(e, 'getOrders'); }
    },

    getMenuItems: async (restaurantId: string): Promise<MenuItem[]> => {
        if (isOffline) return [];
        try {
            const { data, error } = await supabase!.from('menu_items').select('*').eq('restaurant_id', restaurantId);
            if (error) throw error;
            return data || [];
        } catch (e) { return handleApiError(e, 'getMenuItems'); }
    },

    getCustomers: async (restaurantId: string): Promise<Customer[]> => {
        if (isOffline) return [];
        try {
            const { data, error } = await supabase!.from('customers').select('*').eq('restaurant_id', restaurantId).limit(1000);
            if (error) throw error;
            return data || [];
        } catch (e) { return handleApiError(e, 'getCustomers'); }
    },

    getCoupons: async (restaurantId: string): Promise<Coupon[]> => {
        if (isOffline) return [];
        try {
            const { data, error } = await supabase!.from('coupons').select('*').eq('restaurant_id', restaurantId);
            if (error) throw error;
            return data || [];
        } catch (e) { return handleApiError(e, 'getCoupons'); }
    },

    getUsers: async (restaurantId: string): Promise<User[]> => {
        if (isOffline) return [MOCK_USER_MANAGER];
        try {
            const { data, error } = await supabase!.from('app_users').select('*').eq('restaurant_id', restaurantId);
            if (error) throw error;
            return data || [];
        } catch (e) { return handleApiError(e, 'getUsers'); }
    },

    getCategories: async (restaurantId: string): Promise<MenuCategory[]> => {
        if (isOffline) return [];
        try {
            const { data, error } = await supabase!.from('categories').select('*').eq('restaurant_id', restaurantId).order('orden', { ascending: true });
            if (error) throw error;
            return data || [];
        } catch (e) { return handleApiError(e, 'getCategories'); }
    },

    getSectors: async (restaurantId: string): Promise<Sector[]> => {
        if (isOffline) return [];
        try {
            const { data, error } = await supabase!.from('sectors').select('*').eq('restaurant_id', restaurantId).order('orden', { ascending: true });
            if (error) {
                console.warn("Tabla 'sectors' no encontrada o error.");
                return [];
            }
            return data || [];
        } catch (e) { return []; }
    },

    createSector: async (sectorData: any): Promise<Sector> => {
        checkConnection();
        try {
            const payload = {
                id: sectorData.id || generateId('sec'),
                restaurant_id: sectorData.restaurant_id,
                nombre: sectorData.nombre,
                orden: sectorData.orden,
                is_active: true
            };
            const { data, error } = await supabase!.from('sectors').insert(payload).select().single();
            if (error) throw error;
            return data;
        } catch (e) { return handleApiError(e, 'createSector'); }
    },

    deleteSector: async (id: string): Promise<void> => {
        checkConnection();
        try {
            const { error } = await supabase!.from('sectors').delete().eq('id', id);
            if (error) throw error;
        } catch (e) { return handleApiError(e, 'deleteSector'); }
    },

    getRestaurantSettings: async (restaurantId: string): Promise<RestaurantSettings | null> => {
        if (isOffline) {
             return {
                nombre: "Restaurante Demo (Offline)",
                logo_url: "",
                direccion: "Modo Local 123",
                telefono: "000-0000",
                horarios: "9am - 10pm",
                iva_rate: 21,
                precios_con_iva: true,
                propina_opciones: [10, 15]
            };
        }
        try {
            const { data, error } = await supabase!.from('restaurants').select('settings').eq('id', restaurantId).single();
            if (error) return null;
            return data?.settings || null;
        } catch (e) { return null; }
    },

    getTables: async (restaurantId: string): Promise<Table[]> => {
        if (isOffline) return [];
        try {
            const { data, error } = await supabase!.from('tables').select('*').eq('restaurant_id', restaurantId);
            if (error) throw error;
            return (data || []).sort((a, b) => a.id - b.id);
        } catch (e) { return handleApiError(e, 'getTables'); }
    },

    getIngredients: async (restaurantId: string): Promise<Ingredient[]> => {
        if (isOffline) return [];
        try {
            const { data, error } = await supabase!.from('ingredients').select('*').eq('restaurant_id', restaurantId);
            if (error) throw error;
            return data || [];
        } catch (e) { return handleApiError(e, 'getIngredients'); }
    },

    login: async (email: string, password: string): Promise<User | null> => {
        if (isOffline) {
            // Mock Login for Demo/Offline Mode
            if (password === '123456') {
                if (email === 'admin@restaurante.com') return MOCK_USER_ADMIN;
                if (email === 'demo@restaurante.com') return MOCK_USER_MANAGER;
            }
            return null;
        }
        try {
            const { data, error } = await supabase!.from('app_users').select('*').eq('email', email).eq('password', password).single();
            if (error || !data) return null;
            return data;
        } catch (e) { return handleApiError(e, 'login'); }
    },

    recoverPassword: async (email: string): Promise<string> => {
        return "123456-temp";
    },

    updateOrderStatus: async (orderId: number, status: OrderStatus): Promise<Order> => {
        checkConnection();
        try {
            const { data, error } = await supabase!.from('orders').update({ estado: status }).eq('id', orderId).select().single();
            if (error) throw error;
            return data;
        } catch (e) { return handleApiError(e, 'updateOrderStatus'); }
    },

    deductStockForOrder: async (orderId: number): Promise<void> => {
        if (isOffline) return;
        try {
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
        } catch (e) { console.error("Stock deduction error:", e); }
    },

    cancelOrder: async (orderId: number): Promise<Order> => {
        checkConnection();
        try {
            const { data, error } = await supabase!.from('orders').update({ estado: OrderStatus.CANCELADO }).eq('id', orderId).select().single();
            if (error) throw error;
            return data;
        } catch (e) { return handleApiError(e, 'cancelOrder'); }
    },

    createOrder: async (orderData: any): Promise<Order> => {
        checkConnection();
        try {
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
                items: orderData.items,
                delivery_info: orderData.delivery_info,
                creado_en: new Date().toISOString(),
                payments: []
            };

            const { data, error } = await supabase!.from('orders').insert(payload).select().single();
            if (error) throw error;
            return data;
        } catch (e) { return handleApiError(e, 'createOrder'); }
    },

    createPublicOrder: async (orderData: any): Promise<Order> => {
        return api.createOrder(orderData);
    },

    createCustomer: async (customerData: any): Promise<Customer> => {
        checkConnection();
        try {
            const payload = {
                id: customerData.id || generateId('cust'),
                restaurant_id: customerData.restaurant_id,
                nombre: customerData.nombre,
                telefono: customerData.telefono,
                email: customerData.email,
                direccion: customerData.direccion,
                ltv: 0,
                ultima_compra: new Date().toISOString(),
                frecuencia_promedio_dias: 0,
                is_verified: false,
                is_deleted: false
            };
            const { data, error } = await supabase!.from('customers').insert(payload).select().single();
            if (error) throw error;
            return data;
        } catch (e) { return handleApiError(e, 'createCustomer'); }
    },

    updateCustomer: async (customerData: Customer): Promise<Customer> => {
        checkConnection();
        try {
            const { id, ltv, ultima_compra, frecuencia_promedio_dias, is_verified, is_deleted, ...rest } = customerData;
            const { data, error } = await supabase!.from('customers').update(customerData).eq('id', customerData.id).select().single();
            if (error) throw error;
            return data;
        } catch (e) { return handleApiError(e, 'updateCustomer'); }
    },

    deleteCustomer: async (id: string): Promise<void> => {
        checkConnection();
        try {
            const { error } = await supabase!.from('customers').update({ is_deleted: true }).eq('id', id);
            if (error) throw error;
        } catch (e) { return handleApiError(e, 'deleteCustomer'); }
    },

    findCustomerByContact: async (restaurantId: string, contact: string): Promise<Customer | undefined> => {
        if (isOffline) return undefined;
        try {
            const { data } = await supabase!.from('customers')
                .select('*')
                .eq('restaurant_id', restaurantId)
                .or(`telefono.eq.${contact},email.eq.${contact}`)
                .maybeSingle();
            return data || undefined;
        } catch (e) { return handleApiError(e, 'findCustomerByContact'); }
    },

    verifyCustomer: async (id: string): Promise<void> => {
        checkConnection();
        try {
            await supabase!.from('customers').update({ is_verified: true }).eq('id', id);
        } catch (e) { return handleApiError(e, 'verifyCustomer'); }
    },

    updateOrder: async (id: number, orderData: any): Promise<Order> => {
        checkConnection();
        try {
            const { data, error } = await supabase!.from('orders').update(orderData).eq('id', id).select().single();
            if (error) throw error;
            return data;
        } catch (e) { return handleApiError(e, 'updateOrder'); }
    },

    assignRepartidorToOrder: async (id: number, repartidorId: string): Promise<Order> => {
        checkConnection();
        try {
            const { data, error } = await supabase!.from('orders').update({ 
                repartidor_id: repartidorId, 
                estado: OrderStatus.EN_CAMINO 
            }).eq('id', id).select().single();
            if (error) throw error;
            
            await supabase!.from('app_users').update({ estado_delivery: 'EN_REPARTO' }).eq('id', repartidorId);
            
            return data;
        } catch (e) { return handleApiError(e, 'assignRepartidorToOrder'); }
    },

    createCoupon: async (couponData: any): Promise<Coupon> => {
        checkConnection();
        try {
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
        } catch (e) { return handleApiError(e, 'createCoupon'); }
    },

    updateCoupon: async (couponData: Coupon): Promise<Coupon> => {
        checkConnection();
        try {
            const { data, error } = await supabase!.from('coupons').update(couponData).eq('id', couponData.id).select().single();
            if (error) throw error;
            return data;
        } catch (e) { return handleApiError(e, 'updateCoupon'); }
    },

    deleteCoupon: async (id: string): Promise<void> => {
        checkConnection();
        try {
            const { error } = await supabase!.from('coupons').delete().eq('id', id);
            if (error) throw error;
        } catch (e) { return handleApiError(e, 'deleteCoupon'); }
    },

    generatePaymentQR: async (orderId: number, amount: number): Promise<any> => {
        return { last_qr_code_url: "https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=PagoRestaurantePro" };
    },

    addPaymentToOrder: async (orderId: number, method: any, amount: number): Promise<Order> => {
        checkConnection();
        try {
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
                }
            }

            const updatePayload: any = { payments: updatedPayments };
            if (newState) updatePayload.estado = newState;

            const { data: updatedOrder, error } = await supabase!.from('orders').update(updatePayload).eq('id', orderId).select().single();
            if (error) throw error;
            return updatedOrder;
        } catch (e) { return handleApiError(e, 'addPaymentToOrder'); }
    },

    createUser: async (userData: any): Promise<User> => {
        checkConnection();
        try {
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
        } catch (e) { return handleApiError(e, 'createUser'); }
    },

    updateUser: async (userData: User): Promise<User> => {
        checkConnection();
        try {
            const { confirmPassword, ...safeUserData } = userData as any;
            
            const { data, error } = await supabase!.from('app_users').update(safeUserData).eq('id', userData.id).select().single();
            if (error) throw error;
            return data;
        } catch (e) { return handleApiError(e, 'updateUser'); }
    },

    deleteUser: async (id: string): Promise<void> => {
        checkConnection();
        try {
            const { error } = await supabase!.from('app_users').delete().eq('id', id);
            if (error) throw error;
        } catch (e) { return handleApiError(e, 'deleteUser'); }
    },

    createMenuItem: async (itemData: any): Promise<MenuItem> => {
        checkConnection();
        try {
            const payload = {
                id: itemData.id || generateId('menu'),
                restaurant_id: itemData.restaurant_id,
                category_id: itemData.category_id,
                nombre: itemData.nombre,
                descripcion: itemData.descripcion,
                precio_base: itemData.precio_base,
                coste: itemData.coste,
                receta: itemData.receta,
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
        } catch (e) { return handleApiError(e, 'createMenuItem'); }
    },

    updateMenuItem: async (itemData: MenuItem): Promise<MenuItem> => {
        checkConnection();
        try {
            const { data, error } = await supabase!.from('menu_items').update(itemData).eq('id', itemData.id).select().single();
            if (error) throw error;
            return data;
        } catch (e) { return handleApiError(e, 'updateMenuItem'); }
    },

    deleteMenuItem: async (id: string): Promise<MenuItem> => {
        checkConnection();
        try {
            const { data, error } = await supabase!.from('menu_items').update({ is_deleted: true }).eq('id', id).select().single();
            if (error) throw error;
            return data;
        } catch (e) { return handleApiError(e, 'deleteMenuItem'); }
    },

    restoreMenuItem: async (id: string): Promise<MenuItem> => {
        checkConnection();
        try {
            const { data, error } = await supabase!.from('menu_items').update({ is_deleted: false }).eq('id', id).select().single();
            if (error) throw error;
            return data;
        } catch (e) { return handleApiError(e, 'restoreMenuItem'); }
    },

    updateCategories: async (categories: MenuCategory[]): Promise<MenuCategory[]> => {
        checkConnection();
        try {
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
        } catch (e) { return handleApiError(e, 'updateCategories'); }
    },

    createCategory: async (catData: any): Promise<MenuCategory> => {
        checkConnection();
        try {
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
        } catch (e) { return handleApiError(e, 'createCategory'); }
    },

    deleteCategory: async (id: string): Promise<void> => {
        checkConnection();
        try {
            const { error } = await supabase!.from('categories').delete().eq('id', id);
            if (error) throw error;
        } catch (e) { return handleApiError(e, 'deleteCategory'); }
    },

    updateRestaurantSettings: async (id: string, settings: RestaurantSettings): Promise<RestaurantSettings> => {
        checkConnection();
        try {
            const { data, error } = await supabase!.from('restaurants').update({ settings }).eq('id', id).select().single();
            if (error) throw error;
            return data.settings;
        } catch (e) { return handleApiError(e, 'updateRestaurantSettings'); }
    },

    updateTable: async (table: Table): Promise<Table> => {
        checkConnection();
        try {
            const { data, error } = await supabase!.from('tables').update(table).eq('id', table.id).select().single();
            if (error) throw error;
            return data;
        } catch (e) { return handleApiError(e, 'updateTable'); }
    },

    deleteTable: async (id: string | number): Promise<void> => {
        checkConnection();
        try {
            const { error } = await supabase!.from('tables').delete().eq('id', id);
            if (error) throw error;
        } catch (e) { return handleApiError(e, 'deleteTable'); }
    },

    updateTablesLayout: async (tables: Table[]): Promise<Table[]> => {
        checkConnection();
        try {
            const { data, error } = await supabase!.from('tables').upsert(tables).select();
            if (error) throw error;
            return data || [];
        } catch (e) { return handleApiError(e, 'updateTablesLayout'); }
    },

    createIngredient: async (ingData: any): Promise<Ingredient> => {
        checkConnection();
        try {
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
        } catch (e) { return handleApiError(e, 'createIngredient'); }
    },

    updateIngredient: async (ingData: Ingredient): Promise<Ingredient> => {
        checkConnection();
        try {
            const { data, error } = await supabase!.from('ingredients').update(ingData).eq('id', ingData.id).select().single();
            if (error) throw error;
            return data;
        } catch (e) { return handleApiError(e, 'updateIngredient'); }
    },

    deleteIngredient: async (id: string): Promise<void> => {
        checkConnection();
        try {
            const { error } = await supabase!.from('ingredients').delete().eq('id', id);
            if (error) throw error;
        } catch (e) { return handleApiError(e, 'deleteIngredient'); }
    },

    createRestaurant: async (settings: RestaurantSettings): Promise<Restaurant> => {
        checkConnection();
        try {
            const id = `rest-${Date.now()}`;
            const { data, error } = await supabase!.from('restaurants').insert({ id, settings }).select().single();
            if (error) throw error;
            return data;
        } catch (e) { return handleApiError(e, 'createRestaurant'); }
    },

    deleteRestaurant: async (id: string): Promise<void> => {
        checkConnection();
        try {
            const { error } = await supabase!.from('restaurants').delete().eq('id', id);
            if (error) throw error;
        } catch (e) { return handleApiError(e, 'deleteRestaurant'); }
    },

    updateUserLocation: async (id: string, lat: number, lng: number): Promise<void> => {
        if (isOffline) return;
        try {
            await supabase!.from('app_users').update({ 
                last_location: { lat, lng, updated_at: new Date().toISOString() }
            }).eq('id', id);
        } catch (e) { console.error("Error updating location", e); }
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
