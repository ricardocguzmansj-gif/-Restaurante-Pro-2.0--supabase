
import { createClient } from '@supabase/supabase-js';
import { api } from './api';
import { Restaurant, User, Ingredient, MenuCategory, MenuItem, Customer, Table, Order, Coupon } from '../types';

export const migrateToSupabase = async (
    supabaseUrl: string, 
    supabaseKey: string, 
    onProgress: (msg: string) => void
) => {
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Fetch all local data
    onProgress("Leyendo datos locales...");
    const restaurants = await api.getRestaurants();
    
    // We need to gather data for ALL restaurants, not just the current one context
    let allUsers: User[] = [];
    let allIngredients: Ingredient[] = [];
    let allCategories: MenuCategory[] = [];
    let allMenuItems: MenuItem[] = [];
    let allCustomers: Customer[] = [];
    let allTables: Table[] = [];
    let allOrders: Order[] = [];
    let allCoupons: Coupon[] = [];

    for (const r of restaurants) {
        const [u, i, c, m, cust, t, o, coup] = await Promise.all([
            api.getUsers(r.id),
            api.getIngredients(r.id),
            api.getCategories(r.id),
            api.getMenuItems(r.id),
            api.getCustomers(r.id),
            api.getTables(r.id),
            api.getOrders(r.id),
            api.getCoupons(r.id)
        ]);
        allUsers = [...allUsers, ...u];
        allIngredients = [...allIngredients, ...i];
        allCategories = [...allCategories, ...c];
        allMenuItems = [...allMenuItems, ...m];
        allCustomers = [...allCustomers, ...cust];
        allTables = [...allTables, ...t];
        allOrders = [...allOrders, ...o];
        allCoupons = [...allCoupons, ...coup];
    }
    
    // Also get Super Admin (who has 'global' or null restaurant_id, handled separately in api mock usually)
    // Assuming api.getUsers('global') might not work directly in current mock if not designed, 
    // but let's try to capture the super admin from the loaded context if possible, 
    // otherwise we rely on the arrays we built.
    
    // 2. Insert Restaurants
    onProgress(`Migrando ${restaurants.length} restaurantes...`);
    const { error: restError } = await supabase.from('restaurants').upsert(
        restaurants.map(r => ({ id: r.id, settings: r.settings }))
    );
    if (restError) throw new Error(`Error restaurantes: ${restError.message}`);

    // 3. Insert Users
    onProgress(`Migrando ${allUsers.length} usuarios...`);
    const { error: userError } = await supabase.from('app_users').upsert(
        allUsers.map(u => ({
            id: u.id,
            restaurant_id: u.restaurant_id === 'global' ? null : u.restaurant_id, // Handle super admin
            nombre: u.nombre,
            email: u.email,
            rol: u.rol,
            avatar_url: u.avatar_url,
            password: u.password, // Note: In production, passwords should be hashed or use Supabase Auth
            estado_delivery: u.estado_delivery,
            is_deleted: u.is_deleted,
            last_location: u.last_location
        }))
    );
    if (userError) throw new Error(`Error usuarios: ${userError.message}`);

    // 4. Insert Categories
    onProgress(`Migrando ${allCategories.length} categorías...`);
    const { error: catError } = await supabase.from('categories').upsert(
        allCategories.map(c => ({
            id: c.id,
            restaurant_id: c.restaurant_id,
            nombre: c.nombre,
            orden: c.orden
        }))
    );
    if (catError) throw new Error(`Error categorías: ${catError.message}`);

    // 5. Insert Ingredients
    onProgress(`Migrando ${allIngredients.length} ingredientes...`);
    const { error: ingError } = await supabase.from('ingredients').upsert(
        allIngredients.map(i => ({
            id: i.id,
            restaurant_id: i.restaurant_id,
            nombre: i.nombre,
            unidad: i.unidad,
            stock_actual: i.stock_actual,
            stock_minimo: i.stock_minimo,
            coste_unitario: i.coste_unitario,
            categoria: i.categoria
        }))
    );
    if (ingError) throw new Error(`Error ingredientes: ${ingError.message}`);

    // 6. Insert Menu Items
    onProgress(`Migrando ${allMenuItems.length} productos...`);
    const { error: menuError } = await supabase.from('menu_items').upsert(
        allMenuItems.map(m => ({
            id: m.id,
            restaurant_id: m.restaurant_id,
            category_id: m.category_id,
            nombre: m.nombre,
            descripcion: m.descripcion,
            precio_base: m.precio_base,
            coste: m.coste,
            receta: m.receta,
            img_url: m.img_url,
            etiquetas: m.etiquetas,
            disponible: m.disponible,
            tiempo_preparacion_min: m.tiempo_preparacion_min,
            stock_actual: m.stock_actual,
            permite_venta_sin_stock: m.permite_venta_sin_stock,
            is_deleted: m.is_deleted
        }))
    );
    if (menuError) throw new Error(`Error menú: ${menuError.message}`);

    // 7. Insert Customers
    onProgress(`Migrando ${allCustomers.length} clientes...`);
    const { error: custError } = await supabase.from('customers').upsert(
        allCustomers.map(c => ({
            id: c.id,
            restaurant_id: c.restaurant_id,
            nombre: c.nombre,
            telefono: c.telefono,
            email: c.email,
            ltv: c.ltv,
            ultima_compra: c.ultima_compra,
            frecuencia_promedio_dias: c.frecuencia_promedio_dias,
            is_verified: c.is_verified,
            direccion: c.direccion,
            is_deleted: c.is_deleted
        }))
    );
    if (custError) throw new Error(`Error clientes: ${custError.message}`);

    // 8. Insert Tables
    onProgress(`Migrando ${allTables.length} mesas...`);
    const { error: tableError } = await supabase.from('tables').upsert(
        allTables.map(t => ({
            id: `${t.restaurant_id}_${t.id}`, // Composite ID simulation for uniqueness
            table_number: t.id,
            restaurant_id: t.restaurant_id,
            nombre: t.nombre,
            estado: t.estado,
            x: t.x,
            y: t.y,
            shape: t.shape
        }))
    );
    if (tableError) throw new Error(`Error mesas: ${tableError.message}`);

    // 9. Insert Orders
    onProgress(`Migrando ${allOrders.length} pedidos...`);
    const { error: orderError } = await supabase.from('orders').upsert(
        allOrders.map(o => ({
            id: o.id,
            restaurant_id: o.restaurant_id,
            customer_id: o.customer_id,
            table_id: o.table_id,
            creado_por_id: o.creado_por_id,
            repartidor_id: o.repartidor_id,
            mozo_id: o.mozo_id,
            tipo: o.tipo,
            estado: o.estado,
            subtotal: o.subtotal,
            descuento: o.descuento,
            impuestos: o.impuestos,
            propina: o.propina,
            total: o.total,
            items: o.items,
            payments: o.payments,
            creado_en: o.creado_en
        }))
    );
    if (orderError) throw new Error(`Error pedidos: ${orderError.message}`);
    
     // 10. Insert Coupons
    onProgress(`Migrando ${allCoupons.length} cupones...`);
    const { error: couponError } = await supabase.from('coupons').upsert(
        allCoupons.map(c => ({
            id: c.id,
            restaurant_id: c.restaurant_id,
            codigo: c.codigo,
            tipo: c.tipo,
            valor: c.valor,
            activo: c.activo,
            expira_en: c.expira_en,
            minimo_subtotal: c.minimo_subtotal
        }))
    );
    if (couponError) throw new Error(`Error cupones: ${couponError.message}`);

    onProgress("¡Migración completada con éxito!");
};
