
export enum UserRole {
  SUPER_ADMIN = "SUPER_ADMIN",
  ADMIN = "ADMIN", // Dueño / Gerente General
  GERENTE = "GERENTE", // Encargado de Turno
  MOZO = "MOZO/A",
  COCINA = "COCINA",
  REPARTO = "REPARTO",
  CAJA = "CAJA" // Nuevo rol específico para cobros
}

export interface User {
  id: string;
  restaurant_id: string;
  nombre: string;
  email: string;
  rol: UserRole;
  avatar_url: string;
  estado_delivery?: 'DISPONIBLE' | 'EN_REPARTO' | 'DESCONECTADO';
  is_deleted?: boolean;
  password?: string;
  must_change_password?: boolean;
  last_location?: {
    lat: number;
    lng: number;
    updated_at: string;
  };
}

export interface Sector {
    id: string;
    restaurant_id: string;
    nombre: string; // Ej: "Terraza", "Salón VIP"
    orden: number;
    is_active: boolean;
}

export interface MenuCategory {
  id: string;
  restaurant_id: string;
  nombre: string;
  orden: number;
  parent_id?: string | null;
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
        referencia?: string; // Timbre, color casa, etc.
        lat: number;
        lng: number;
    };
    is_deleted?: boolean;
}

export enum OrderType {
    SALA = "SALA",
    PARA_LLEVAR = "PARA_LLEVAR",
    DELIVERY = "DELIVERY",
}

export enum OrderStatus {
    PENDIENTE_PAGO = "PENDIENTE DE PAGO", // Para pedidos online no confirmados
    NUEVO = "NUEVO", // Entró a cocina/barra
    EN_PREPARACION = "EN PREPARACIÓN", // Cocinando
    LISTO = "LISTO", // Listo para servir/retirar
    EN_CAMINO = "EN CAMINO", // Delivery retiró
    ENTREGADO = "ENTREGADO", // Cliente finalizó
    CANCELADO = "CANCELADO",
    INCIDENCIA = "INCIDENCIA", // Problema en entrega
    DEVOLUCION = "DEVOLUCIÓN",
}

export interface OrderItem {
    id: string;
    menu_item_id: string;
    nombre_item_snapshot: string;
    precio_unitario: number;
    cantidad: number;
    total_item: number;
    notes?: string; // "Sin cebolla", "Punto medio"
    estado_item?: 'PENDIENTE' | 'MARCHANDO' | 'ENTREGADO'; // Para control granular de cocina (entradas vs principales)
}

export interface PaymentDetails {
    status: 'PAGADO' | 'PARCIAL' | 'REEMBOLSADO';
    method: 'EFECTIVO' | 'TARJETA' | 'MERCADOPAGO' | 'MODO' | 'QR' | 'TRANSFERENCIA' | 'CUENTA_CORRIENTE';
    transaction_id?: string;
    qr_code_url?: string;
    amount: number;
    creado_en: string;
    propina?: number; // Propina específica de este pago
}

export enum TableStatus {
    LIBRE = 'LIBRE',
    OCUPADA = 'OCUPADA', // Cliente sentado
    ATENCION_REQUERIDA = 'ATENCION_REQUERIDA', // Cliente llamó al mozo
    PIDIENDO_CUENTA = 'PIDIENDO_CUENTA', // Cliente pidió la cuenta (Azul?)
    NECESITA_LIMPIEZA = 'NECESITA_LIMPIEZA' // Cliente se fue, mesa sucia
}

export interface Table {
    id: string | number;
    restaurant_id: string;
    sector_id?: string; // Nuevo: Relación con sector
    group_id?: string | null; // Nuevo: Para unir mesas
    nombre: string;
    estado: TableStatus;
    order_id: number | null;
    mozo_id: string | null;
    x: number;
    y: number;
    shape: 'square' | 'rectangle-v' | 'rectangle-h' | 'round';
    table_number: number;
    capacidad?: number; // Personas
}


export interface Order {
    id: number;
    restaurant_id: string;
    customer_id: string | null;
    table_id?: number; // ID numérico visible de la mesa
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
    delivery_info?: { // Datos específicos para el viaje
        direccion_entrega: string;
        referencias: string;
        hora_estimada?: string;
        costo_envio: number;
    };
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
  type: 'success' | 'error' | 'info';
}
