
import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';
import { DollarSign, ShoppingCart, Users, AlertCircle, Package } from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';
import { formatCurrency } from '../utils';
import { OrderStatus } from '../types';

const KpiCard: React.FC<{ title: string; value: string; icon: React.ReactNode; color: string }> = ({ title, value, icon, color }) => (
    <Card className="flex items-center">
        <div className={`p-3 rounded-full mr-4 ${color}`}>
            {icon}
        </div>
        <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
        </div>
    </Card>
);

export const DashboardPage: React.FC = () => {
    const { orders, menuItems, ingredients } = useAppContext();

    const today = new Date().toISOString().split('T')[0];
    const todaysOrders = orders.filter(o => o.creado_en.startsWith(today) && o.estado !== OrderStatus.CANCELADO && o.estado !== OrderStatus.PENDIENTE_PAGO);
    const todaysRevenue = todaysOrders.reduce((sum, o) => sum + o.total, 0);
    const avgTicket = todaysOrders.length > 0 ? todaysRevenue / todaysOrders.length : 0;

    const last7DaysData = Array.from({ length: 7 }).map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const dayOrders = orders.filter(o => o.creado_en.startsWith(dateStr) && o.estado !== OrderStatus.CANCELADO && o.estado !== OrderStatus.PENDIENTE_PAGO);
        return {
            name: d.toLocaleDateString('es-ES', { weekday: 'short' }),
            pedidos: dayOrders.length,
        };
    }).reverse();

    const last30DaysRevenueData = Array.from({ length: 30 }).map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const dayOrders = orders.filter(o => o.creado_en.startsWith(dateStr) && o.estado !== OrderStatus.CANCELADO && o.estado !== OrderStatus.PENDIENTE_PAGO);
        const revenue = dayOrders.reduce((sum, o) => sum + o.total, 0);
        return {
            name: d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' }),
            ingresos: revenue,
        };
    }).reverse();
    
    const topProducts = menuItems
        .sort((a, b) => b.precio_base - a.precio_base)
        .slice(0, 5);
        
    const pendingOrders = orders.filter(o => o.estado === OrderStatus.NUEVO).length;
    const lowStockIngredients = ingredients.filter(i => i.stock_actual <= i.stock_minimo);

    const inventoryValueByCategory = useMemo(() => {
        const data: Record<string, number> = {};
        ingredients.forEach(ing => {
            const value = ing.stock_actual * ing.coste_unitario;
            data[ing.categoria] = (data[ing.categoria] || 0) + value;
        });
        return Object.entries(data).map(([name, value]) => ({ name, valor: value }));
    }, [ingredients]);

    const totalInventoryValue = inventoryValueByCategory.reduce((acc, curr) => acc + curr.valor, 0);

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
            
            <div className="space-y-4">
                {pendingOrders > 10 && (
                    <div className="p-4 bg-red-100 dark:bg-red-900/50 border border-red-400 rounded-lg flex items-center">
                        <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400 mr-3"/>
                        <span className="font-semibold text-red-800 dark:text-red-200">Alerta: {pendingOrders} pedidos en estado "NUEVO". ¡Revisa el GIC!</span>
                    </div>
                )}
                {lowStockIngredients.length > 0 && (
                     <div className="p-4 bg-yellow-100 dark:bg-yellow-900/50 border border-yellow-400 rounded-lg flex items-center">
                        <AlertCircle className="h-6 w-6 text-yellow-600 dark:text-yellow-400 mr-3"/>
                        <span className="font-semibold text-yellow-800 dark:text-yellow-200">
                            Alerta de inventario: {lowStockIngredients.length} ingrediente(s) con stock bajo.
                            <Link to="/inventario" className="ml-2 underline hover:text-yellow-900 dark:hover:text-yellow-100">Revisar</Link>
                        </span>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KpiCard title="Ingresos de Hoy" value={formatCurrency(todaysRevenue)} icon={<DollarSign className="h-6 w-6 text-white"/>} color="bg-green-500" />
                <KpiCard title="Pedidos de Hoy" value={todaysOrders.length.toString()} icon={<ShoppingCart className="h-6 w-6 text-white"/>} color="bg-blue-500" />
                <KpiCard title="Ticket Promedio" value={formatCurrency(avgTicket)} icon={<Users className="h-6 w-6 text-white"/>} color="bg-orange-500" />
                <KpiCard title="Valor Inventario" value={formatCurrency(totalInventoryValue)} icon={<Package className="h-6 w-6 text-white"/>} color="bg-purple-500" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2">
                    <h2 className="text-xl font-semibold mb-4">Ingresos en los últimos 30 días</h2>
                    <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer>
                            <LineChart data={last30DaysRevenueData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(128, 128, 128, 0.2)" />
                                <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 12 }} />
                                <YAxis tickFormatter={(value) => new Intl.NumberFormat('es-AR', { notation: "compact", compactDisplay: "short" }).format(value)} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }}
                                    labelStyle={{ color: '#d1d5db' }}
                                    formatter={(value: number) => [formatCurrency(value), 'Ingresos']}
                                />
                                <Legend wrapperStyle={{ fontSize: '14px' }} />
                                <Line type="monotone" dataKey="ingresos" name="Ingresos" stroke="#f97316" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 6 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </Card>
                
                <Card className="lg:col-span-1">
                     <h2 className="text-xl font-semibold mb-4">Valor de Inventario por Categoría</h2>
                     <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer>
                             <BarChart data={inventoryValueByCategory} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(128, 128, 128, 0.2)" />
                                <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 11 }} interval={0} />
                                <YAxis tickFormatter={(value) => new Intl.NumberFormat('es-AR', { notation: "compact" }).format(value)} tick={{ fill: '#9ca3af', fontSize: 11 }} />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }} 
                                    formatter={(value: number) => [formatCurrency(value), 'Valor']}
                                    labelStyle={{ color: '#d1d5db' }}
                                />
                                <Bar dataKey="valor" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Valor ($)" />
                            </BarChart>
                        </ResponsiveContainer>
                     </div>
                </Card>

                <Card className="lg:col-span-2">
                    <h2 className="text-xl font-semibold mb-4">Pedidos en los últimos 7 días</h2>
                    <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer>
                            <BarChart data={last7DaysData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(128, 128, 128, 0.2)" />
                                <XAxis dataKey="name" tick={{ fill: '#9ca3af' }} />
                                <YAxis tick={{ fill: '#9ca3af' }} />
                                <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }} labelStyle={{ color: '#d1d5db' }}/>
                                <Bar dataKey="pedidos" fill="#f97316" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>
                <Card>
                    <h2 className="text-xl font-semibold mb-4">Top 5 Platos Más Populares</h2>
                    <ul className="space-y-3">
                        {topProducts.map(item => (
                            <li key={item.id} className="flex items-center justify-between text-sm">
                                <span className="text-gray-700 dark:text-gray-300">{item.nombre}</span>
                                <span className="font-bold text-gray-900 dark:text-white">{formatCurrency(item.precio_base)}</span>
                            </li>
                        ))}
                    </ul>
                </Card>
            </div>
        </div>
    );
};
