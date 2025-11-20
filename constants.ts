
import { UserRole, OrderStatus, OrderType, TableStatus } from './types';
import { BarChart2, Boxes, ChefHat, LayoutDashboard, ListOrdered, LucideIcon, Percent, Settings, ShoppingCart, Truck, Users } from 'lucide-react';

export const ROLES_HIERARCHY: { [key in UserRole]: string[] } = {
  [UserRole.SUPER_ADMIN]: [UserRole.ADMIN, UserRole.GERENTE, UserRole.MOZO, UserRole.COCINA, UserRole.REPARTO],
  [UserRole.ADMIN]: [UserRole.GERENTE, UserRole.MOZO, UserRole.COCINA, UserRole.REPARTO],
  [UserRole.GERENTE]: [UserRole.MOZO, UserRole.COCINA, UserRole.REPARTO],
  [UserRole.MOZO]: [],
  [UserRole.COCINA]: [],
  [UserRole.REPARTO]: [],
};


export const NAVIGATION_ITEMS: { label: string; href: string; icon: LucideIcon; roles: UserRole[] }[] = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: [UserRole.ADMIN, UserRole.GERENTE] },
    { label: 'Pedidos', href: '/pedidos', icon: ShoppingCart, roles: [UserRole.ADMIN, UserRole.GERENTE, UserRole.MOZO, UserRole.REPARTO] },
    { label: 'Salón', href: '/salon', icon: LayoutDashboard, roles: [UserRole.ADMIN, UserRole.GERENTE, UserRole.MOZO] },
    { label: 'GIC', href: '/gic', icon: ChefHat, roles: [UserRole.ADMIN, UserRole.GERENTE, UserRole.COCINA] },
    { label: 'Menú', href: '/menu', icon: ListOrdered, roles: [UserRole.ADMIN, UserRole.GERENTE] },
    { label: 'Inventario', href: '/inventario', icon: Boxes, roles: [UserRole.ADMIN, UserRole.GERENTE] },
    { label: 'Clientes', href: '/clientes', icon: Users, roles: [UserRole.ADMIN, UserRole.GERENTE, UserRole.MOZO] },
    { label: 'Cupones', href: '/cupones', icon: Percent, roles: [UserRole.ADMIN, UserRole.GERENTE] },
    { label: 'Reportes', href: '/reportes', icon: BarChart2, roles: [UserRole.ADMIN, UserRole.GERENTE] },
    { label: 'Configuración', href: '/configuracion', icon: Settings, roles: [UserRole.ADMIN] },
];

export const ORDER_STATUS_COLORS: { [key in OrderStatus]: string } = {
    [OrderStatus.PENDIENTE_PAGO]: 'bg-purple-500',
    [OrderStatus.NUEVO]: 'bg-blue-500',
    [OrderStatus.EN_PREPARACION]: 'bg-yellow-500',
    [OrderStatus.LISTO]: 'bg-green-500',
    [OrderStatus.EN_CAMINO]: 'bg-cyan-500',
    [OrderStatus.ENTREGADO]: 'bg-gray-500',
    [OrderStatus.CANCELADO]: 'bg-red-500',
    [OrderStatus.INCIDENCIA]: 'bg-orange-500',
    [OrderStatus.DEVOLUCION]: 'bg-amber-700',
};

export const TABLE_STATUS_COLORS: { [key in TableStatus]: { bg: string; text: string; border: string } } = {
    [TableStatus.LIBRE]: { bg: 'bg-green-100 dark:bg-green-900/40', text: 'text-green-800 dark:text-green-200', border: 'border-green-500' },
    [TableStatus.OCUPADA]: { bg: 'bg-orange-100 dark:bg-orange-900/40', text: 'text-orange-800 dark:text-orange-200', border: 'border-orange-500' },
    [TableStatus.NECESITA_LIMPIEZA]: { bg: 'bg-red-100 dark:bg-red-900/40', text: 'text-red-800 dark:text-red-200', border: 'border-red-500' },
};


export const ORDER_TYPE_ICONS: { [key in OrderType]: LucideIcon } = {
    [OrderType.SALA]: LayoutDashboard,
    [OrderType.PARA_LLEVAR]: ShoppingCart,
    [OrderType.DELIVERY]: Truck,
};

export const GIC_COLUMNS: OrderStatus[] = [
    OrderStatus.NUEVO,
    OrderStatus.EN_PREPARACION,
    OrderStatus.LISTO
];