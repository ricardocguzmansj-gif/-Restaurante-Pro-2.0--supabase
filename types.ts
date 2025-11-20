
export enum UserRole {
  SUPER_ADMIN = "SUPER_ADMIN",
  ADMIN = "ADMIN",
  GERENTE = "GERENTE",
  MOZO = "MOZO/A",
  COCINA = "COCINA",
  REPARTO = "REPARTO",
}

export interface User {
  id: string;
  restaurant_id: string; // For SUPER_ADMIN, this might be 'global' or null, but for simplicity we keep it.
  nombre: string;
  email: string;
  rol: UserRole;
  avatar_url: string;
  estado_delivery?: 'DISPONIBLE' | 'EN_REPARTO';
  is_deleted?: boolean;
  password?: string;
  last_location?: {
    lat: number;
    lng: number;
    updated_at: string;
  };
}

export interface MenuCategory {
  id: string;
  restaurant_id: string;
  nombre: string;
  orden: number;
}

export enum IngredientCategory {
  GENERAL = "GENERAL",
  BEBIDA = "BEBIDA",
}

export interface Ingredient {
  id: string;
  restaurant_id: string;
  nombre: string;
  unidad: 'gr' | 'ml' | 'unidad';
  stock_actual: number;
  stock_minimo: number;
  coste_unitario: number;
  categoria: IngredientCategory;
}

export interface RecipeItem {
  ingredient_id: string;
  cantidad: number;
}

export interface MenuItem {
  id: string;
  restaurant_id: string;
  category_id: string;
  nombre: string;
  descripcion: string;
  precio_base: number;
  coste: number;
  receta: RecipeItem[];
  img_url: string;
  etiquetas: string[];
  disponible: boolean;
  tiempo_preparacion_min: number;
  stock_actual: number | null;
  permite_venta_sin_stock: boolean;
  is_deleted?: boolean;
}

export interface Customer {
    id: string;
    restaurant_id: string;
    nombre: string;
    telefono: string;
    email: string;
    ltv: number;
    ultima_compra: string;
    frecuencia_promedio_dias: number;
    is_verified: boolean;
    direccion: {
        calle: string;
        ciudad: string;
        codigo_postal: string;
        lat: number;
        lng: number;
    };
    is_deleted?: boolean;
}

export enum OrderType {
    SALA = "SALA",
    PARA_LLEVAR = "PARA LLEVAR",
    DELIVERY = "DELIVERY",
}

export enum OrderStatus {
    PENDIENTE_PAGO = "PENDIENTE DE PAGO",
    NUEVO = "NUEVO",
    EN_PREPARACION = "EN PREPARACIÓN",
    LISTO = "LISTO",
    EN_CAMINO = "EN CAMINO",
    ENTREGADO = "ENTREGADO",
    CANCELADO = "CANCELADO",
    INCIDENCIA = "INCIDENCIA",
    DEVOLUCION = "DEVOLUCIÓN",
}

export interface OrderItem {
    id: string;
    menu_item_id: string;
    nombre_item_snapshot: string;
    precio_unitario: number;
    cantidad: number;
    total_item: number;
    notes?: string;
}

export interface PaymentDetails {
    status: 'PAGADO' | 'REEMBOLSADO';
    method: 'EFECTIVO' | 'TARJETA' | 'MERCADOPAGO' | 'MODO' | 'QR';
    transaction_id?: string;
    qr_code_url?: string;
    amount: number;
    creado_en: string;
}

export enum TableStatus {
    LIBRE = 'LIBRE',
    OCUPADA = 'OCUPADA',
    NECESITA_LIMPIEZA = 'NECESITA_LIMPIEZA'
}

export interface Table {
    id: number;
    restaurant_id: string;
    nombre: string;
    estado: TableStatus;
    order_id: number | null;
    mozo_id: string | null;
    x: number;
    y: number;
    shape: 'square' | 'rectangle-v' | 'rectangle-h';
}


export interface Order {
    id: number;
    restaurant_id: string;
    customer_id: string | null;
    table_id?: number;
    creado_por_id: string;
    tipo: OrderType;
    estado: OrderStatus;
    subtotal: number;
    descuento: number;
    impuestos: number;
    propina: number;
    total: number;
    items: OrderItem[];
    creado_en: string;
    repartidor_id: string | null;
    payments: PaymentDetails[];
    mozo_id: string | null;
}

export interface Coupon {
    id: string;
    restaurant_id: string;
    codigo: string;
    tipo: 'PORCENTAJE' | 'FIJO';
    valor: number;
    activo: boolean;
    expira_en: string;
    minimo_subtotal: number | null;
}

export interface RestaurantSettings {
  nombre: string;
  logo_url: string;
  direccion: string;
  telefono: string;
  horarios: string;
  iva_rate: number;
  precios_con_iva: boolean;
  propina_opciones: number[];
}

export interface Restaurant {
    id: string;
    settings: RestaurantSettings;
}


export interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error';
}
