
import { MenuCategory, MenuItem, Customer, Order, Coupon, User, UserRole, OrderStatus, OrderType, RestaurantSettings, Table, TableStatus, Ingredient, IngredientCategory, Restaurant } from '../types';

export const demoRestaurantId = 'rest-pizarra-01';
export const demoSushiRestaurantId = 'rest-sushi-01';

// --- RESTAURANTES ---
export const demoRestaurants: Restaurant[] = [
    {
        id: demoRestaurantId,
        settings: {
            nombre: 'Pizzeria Pizarra',
            logo_url: 'https://cdn-icons-png.flaticon.com/512/3448/3448609.png',
            direccion: 'Av. Siempre Viva 742, CABA',
            telefono: '+54 9 11 1234-5678',
            horarios: 'Lunes a Viernes: 12:00 - 23:00\nSábados y Domingos: 12:00 - 00:00',
            iva_rate: 21,
            precios_con_iva: true,
            propina_opciones: [5, 10, 15],
        }
    },
    {
        id: demoSushiRestaurantId,
        settings: {
            nombre: 'Sushi Master',
            logo_url: 'https://cdn-icons-png.flaticon.com/512/2252/2252075.png',
            direccion: 'Calle del Pescado 101, Palermo',
            telefono: '+54 9 11 9876-5432',
            horarios: 'Martes a Domingo: 18:00 - 01:00',
            iva_rate: 21,
            precios_con_iva: false,
            propina_opciones: [10, 15, 20],
        }
    }
];

// --- USUARIOS ---
export const demoUsers: User[] = [
  // SUPER ADMIN
  { id: 'user-super-admin', restaurant_id: 'global', nombre: 'Super Admin', email: 'super@admin.com', rol: UserRole.SUPER_ADMIN, avatar_url: `https://i.pravatar.cc/150?u=super`, password: 'password' },

  // Pizzeria Users
  { id: 'user-admin-1', restaurant_id: demoRestaurantId, nombre: 'Admin Pizarra', email: 'admin@pizarra.es', rol: UserRole.ADMIN, avatar_url: `https://i.pravatar.cc/150?u=admin`, password: 'password' },
  { id: 'user-gerente-1', restaurant_id: demoRestaurantId, nombre: 'Gerente Pizarra', email: 'gerente@pizarra.es', rol: UserRole.GERENTE, avatar_url: `https://i.pravatar.cc/150?u=gerente`, password: 'password' },
  { id: 'user-mozo-1', restaurant_id: demoRestaurantId, nombre: 'Mozo Pizarra', email: 'mozo@pizarra.es', rol: UserRole.MOZO, avatar_url: `https://i.pravatar.cc/150?u=mozo`, password: 'password' },
  { id: 'user-cocina-1', restaurant_id: demoRestaurantId, nombre: 'Cocinero Pizarra', email: 'cocina@pizarra.es', rol: UserRole.COCINA, avatar_url: `https://i.pravatar.cc/150?u=cocina`, password: 'password' },
  { id: 'user-reparto-1', restaurant_id: demoRestaurantId, nombre: 'Repartidor Pizarra', email: 'reparto@pizarra.es', rol: UserRole.REPARTO, avatar_url: `https://i.pravatar.cc/150?u=reparto`, estado_delivery: 'DISPONIBLE', password: 'password' },
  
  // Sushi Users
  { id: 'user-admin-sushi', restaurant_id: demoSushiRestaurantId, nombre: 'Admin Sushi', email: 'admin@sushi.com', rol: UserRole.ADMIN, avatar_url: `https://i.pravatar.cc/150?u=adminsushi`, password: 'password' },
  { id: 'user-mozo-sushi', restaurant_id: demoSushiRestaurantId, nombre: 'Mozo Sushi', email: 'mozo@sushi.com', rol: UserRole.MOZO, avatar_url: `https://i.pravatar.cc/150?u=mozosushi`, password: 'password' },
];


// --- INVENTARIO ---
export const demoIngredients: Ingredient[] = [
    // Pizzeria
    { id: 'ing-1', restaurant_id: demoRestaurantId, nombre: 'Harina 0000', unidad: 'gr', stock_actual: 50000, stock_minimo: 5000, coste_unitario: 0.05, categoria: IngredientCategory.GENERAL },
    { id: 'ing-2', restaurant_id: demoRestaurantId, nombre: 'Salsa de Tomate', unidad: 'ml', stock_actual: 20000, stock_minimo: 2000, coste_unitario: 0.1, categoria: IngredientCategory.GENERAL },
    { id: 'ing-3', restaurant_id: demoRestaurantId, nombre: 'Queso Muzzarella', unidad: 'gr', stock_actual: 30000, stock_minimo: 3000, coste_unitario: 0.3, categoria: IngredientCategory.GENERAL },
    { id: 'ing-4', restaurant_id: demoRestaurantId, nombre: 'Jamón Cocido', unidad: 'gr', stock_actual: 10000, stock_minimo: 1000, coste_unitario: 0.4, categoria: IngredientCategory.GENERAL },
    { id: 'ing-5', restaurant_id: demoRestaurantId, nombre: 'Carne Picada', unidad: 'gr', stock_actual: 15000, stock_minimo: 2000, coste_unitario: 0.5, categoria: IngredientCategory.GENERAL },
    
    // Sushi
    { id: 'ing-s1', restaurant_id: demoSushiRestaurantId, nombre: 'Arroz Sushi', unidad: 'gr', stock_actual: 50000, stock_minimo: 5000, coste_unitario: 0.1, categoria: IngredientCategory.GENERAL },
    { id: 'ing-s2', restaurant_id: demoSushiRestaurantId, nombre: 'Salmón Fresco', unidad: 'gr', stock_actual: 5000, stock_minimo: 1000, coste_unitario: 15.0, categoria: IngredientCategory.GENERAL },
    { id: 'ing-s3', restaurant_id: demoSushiRestaurantId, nombre: 'Alga Nori', unidad: 'unidad', stock_actual: 500, stock_minimo: 50, coste_unitario: 20, categoria: IngredientCategory.GENERAL },
];


// --- CATEGORÍAS Y MENÚ ---
export const demoCategories: MenuCategory[] = [
    // Pizzeria
    { id: 'cat-1', restaurant_id: demoRestaurantId, nombre: 'Pizzas', orden: 1 },
    { id: 'cat-2', restaurant_id: demoRestaurantId, nombre: 'Bebidas', orden: 2 },
    { id: 'cat-3', restaurant_id: demoRestaurantId, nombre: 'Postres', orden: 3 },
    
    // Sushi
    { id: 'cat-s1', restaurant_id: demoSushiRestaurantId, nombre: 'Rolls', orden: 1 },
    { id: 'cat-s2', restaurant_id: demoSushiRestaurantId, nombre: 'Nigiris', orden: 2 },
];

export const demoMenuItems: Omit<MenuItem, 'coste' | 'stock_actual'>[] = [
    // Pizzeria
    { id: 'item-1', restaurant_id: demoRestaurantId, category_id: 'cat-1', nombre: 'Pizza Muzzarella', descripcion: 'Clásica pizza de muzzarella con salsa de tomate casera y aceitunas.', precio_base: 850, receta: [{ingredient_id: 'ing-1', cantidad: 300}, {ingredient_id: 'ing-2', cantidad: 150}, {ingredient_id: 'ing-3', cantidad: 250}], img_url: 'https://i.imgur.com/gC27m8d.jpeg', etiquetas: ['vegetariano', 'clásico'], disponible: true, tiempo_preparacion_min: 15, permite_venta_sin_stock: false },
    { id: 'item-2', restaurant_id: demoRestaurantId, category_id: 'cat-1', nombre: 'Pizza Jamón y Morrones', descripcion: 'Muzzarella, jamón cocido de primera calidad y morrones asados.', precio_base: 980, receta: [{ingredient_id: 'ing-1', cantidad: 300}, {ingredient_id: 'ing-2', cantidad: 150}, {ingredient_id: 'ing-3', cantidad: 200}, {ingredient_id: 'ing-4', cantidad: 100}], img_url: 'https://i.imgur.com/xHdei8a.jpeg', etiquetas: [], disponible: true, tiempo_preparacion_min: 18, permite_venta_sin_stock: false },
    { id: 'item-3', restaurant_id: demoRestaurantId, category_id: 'cat-2', nombre: 'Gaseosa Cola 500ml', descripcion: 'Botella de gaseosa sabor cola de 500ml.', precio_base: 250, receta: [], img_url: 'https://i.imgur.com/J3a2aSc.jpeg', etiquetas: [], disponible: true, tiempo_preparacion_min: 1, permite_venta_sin_stock: true },
    
    // Sushi
    { id: 'item-s1', restaurant_id: demoSushiRestaurantId, category_id: 'cat-s1', nombre: 'New York Roll', descripcion: 'Salmón, palta y queso philadelphia.', precio_base: 1200, receta: [{ingredient_id: 'ing-s1', cantidad: 100}, {ingredient_id: 'ing-s2', cantidad: 50}, {ingredient_id: 'ing-s3', cantidad: 1}], img_url: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&q=80&w=300', etiquetas: ['fresco'], disponible: true, tiempo_preparacion_min: 10, permite_venta_sin_stock: false },
];

// --- DATOS TRANSACCIONALES DE DEMOSTRACIÓN ---
export const demoCustomers: Customer[] = [
    { id: 'cust-1', restaurant_id: demoRestaurantId, nombre: 'Juan Pérez', telefono: '1123456789', email: 'juan.perez@example.com', ltv: 5600, ultima_compra: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), frecuencia_promedio_dias: 15, is_verified: true, direccion: { calle: 'Av. Corrientes 1234', ciudad: 'CABA', codigo_postal: '1043', lat: -34.6037, lng: -58.3816 } },
    { id: 'cust-2', restaurant_id: demoRestaurantId, nombre: 'María García', telefono: '1198765432', email: 'maria.garcia@example.com', ltv: 2300, ultima_compra: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), frecuencia_promedio_dias: 30, is_verified: false, direccion: { calle: 'Florida 550', ciudad: 'CABA', codigo_postal: '1005', lat: -34.605, lng: -58.376 } },
    // Sushi Customer
    { id: 'cust-s1', restaurant_id: demoSushiRestaurantId, nombre: 'Pedro Sushi', telefono: '1155556666', email: 'pedro@sushi.com', ltv: 0, ultima_compra: new Date().toISOString(), frecuencia_promedio_dias: 0, is_verified: true, direccion: { calle: 'Av. Libertador 1000', ciudad: 'CABA', codigo_postal: '1425', lat: -34.58, lng: -58.43 } },
];

export const demoCoupons: Coupon[] = [
    { id: 'coupon-1', restaurant_id: demoRestaurantId, codigo: 'BIENVENIDO10', tipo: 'PORCENTAJE', valor: 10, activo: true, expira_en: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), minimo_subtotal: null },
    { id: 'coupon-s1', restaurant_id: demoSushiRestaurantId, codigo: 'SUSHINIGHT', tipo: 'PORCENTAJE', valor: 20, activo: true, expira_en: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), minimo_subtotal: 2000 },
];

const now = new Date();
const created2MinsAgo = new Date(now.getTime() - 2 * 60 * 1000).toISOString();
const created10MinsAgo = new Date(now.getTime() - 10 * 60 * 1000).toISOString();
const created30MinsAgo = new Date(now.getTime() - 30 * 60 * 1000).toISOString();

export const demoOrders: Order[] = [
  {
    id: 1, restaurant_id: demoRestaurantId, customer_id: 'cust-1', table_id: 1, creado_por_id: 'user-mozo-1', tipo: OrderType.SALA, estado: OrderStatus.NUEVO,
    subtotal: 1100, descuento: 0, impuestos: 231, propina: 0, total: 1331,
    items: [{ id: 'oi-1', menu_item_id: 'item-1', nombre_item_snapshot: 'Pizza Muzzarella', precio_unitario: 850, cantidad: 1, total_item: 850 }, { id: 'oi-2', menu_item_id: 'item-3', nombre_item_snapshot: 'Gaseosa Cola 500ml', precio_unitario: 250, cantidad: 1, total_item: 250 }],
    creado_en: created2MinsAgo, repartidor_id: null, payments: [], mozo_id: 'user-mozo-1',
  },
  {
    id: 2, restaurant_id: demoRestaurantId, customer_id: null, table_id: undefined, creado_por_id: 'user-gerente-1', tipo: OrderType.PARA_LLEVAR, estado: OrderStatus.EN_PREPARACION,
    subtotal: 980, descuento: 0, impuestos: 205.8, propina: 0, total: 1185.8,
    items: [{ id: 'oi-3', menu_item_id: 'item-2', nombre_item_snapshot: 'Pizza Jamón y Morrones', precio_unitario: 980, cantidad: 1, total_item: 980 }],
    creado_en: created10MinsAgo, repartidor_id: null, payments: [], mozo_id: null,
  },
  {
    id: 3, restaurant_id: demoRestaurantId, customer_id: 'cust-2', table_id: undefined, creado_por_id: 'user-admin-1', tipo: OrderType.DELIVERY, estado: OrderStatus.LISTO,
    subtotal: 1600, descuento: 0, impuestos: 336, propina: 0, total: 1936,
    items: [{ id: 'oi-4', menu_item_id: 'item-2', nombre_item_snapshot: 'Pizza Jamón y Morrones', precio_unitario: 980, cantidad: 1, total_item: 980 }, { id: 'oi-5', menu_item_id: 'item-4', nombre_item_snapshot: 'Cerveza Lager 1L', precio_unitario: 600, cantidad: 1, total_item: 600, notes: 'Bien fría' }],
    creado_en: created30MinsAgo, repartidor_id: null, payments: [{ status: 'PAGADO', method: 'MERCADOPAGO', amount: 1936, creado_en: created30MinsAgo }], mozo_id: null,
  },
];

// --- MESAS Y PLANO DEL SALÓN ---
export const demoTables: Table[] = [
    // Pizzeria
    { id: 1, restaurant_id: demoRestaurantId, nombre: 'Mesa 1', estado: TableStatus.OCUPADA, order_id: 1, mozo_id: 'user-mozo-1', x: 50, y: 50, shape: 'square' },
    { id: 2, restaurant_id: demoRestaurantId, nombre: 'Mesa 2', estado: TableStatus.LIBRE, order_id: null, mozo_id: null, x: 200, y: 50, shape: 'square' },
    { id: 3, restaurant_id: demoRestaurantId, nombre: 'Mesa 3', estado: TableStatus.LIBRE, order_id: null, mozo_id: null, x: 50, y: 200, shape: 'rectangle-h' },
    
    // Sushi
    { id: 1, restaurant_id: demoSushiRestaurantId, nombre: 'Barra 1', estado: TableStatus.LIBRE, order_id: null, mozo_id: null, x: 50, y: 50, shape: 'rectangle-h' },
    { id: 2, restaurant_id: demoSushiRestaurantId, nombre: 'Barra 2', estado: TableStatus.LIBRE, order_id: null, mozo_id: null, x: 200, y: 50, shape: 'rectangle-h' },
];
