
import React, { useState, useMemo } from 'react';
import { Card } from '../components/ui/Card';
import { Download, TrendingUp, Users, Award, X, FileText, Code, Printer, Sparkles, Loader2 } from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';
import { OrderType, OrderStatus, UserRole } from '../types';
import { formatCurrency } from '../utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { analyzeReport } from '../services/ai';

const TabButton: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = ({ active, onClick, children }) => (
    <button
        onClick={onClick}
        className={`px-4 py-2 text-sm font-semibold rounded-t-lg border-b-2 transition-colors duration-200 ${
            active
                ? 'border-orange-500 text-orange-600 dark:text-orange-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
        }`}
    >
        {children}
    </button>
);

const GeneralReportTab: React.FC<{ data: any }> = ({ data }) => {
    const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    if (!data) return null;
    const PIE_COLORS = ['#f97316', '#3b82f6', '#10b981', '#8b5cf6'];
    
    const handleAiAnalysis = async () => {
        setIsAnalyzing(true);
        const analysis = await analyzeReport(data);
        setAiAnalysis(analysis);
        setIsAnalyzing(false);
    }

    return (
        <div className="space-y-8">
            {/* AI Analysis Section */}
            <div className="flex justify-end">
                <button 
                    onClick={handleAiAnalysis} 
                    disabled={isAnalyzing}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-70 transition-all shadow-sm"
                >
                    {isAnalyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                    {isAnalyzing ? 'Analizando...' : 'Analizar con Gemini AI'}
                </button>
            </div>
            
            {aiAnalysis && (
                <div className="p-6 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg animate-fade-in-down">
                     <h4 className="font-bold text-lg text-purple-800 dark:text-purple-300 mb-3 flex items-center gap-2">
                        <Sparkles className="h-5 w-5" /> Insights de Gemini
                    </h4>
                    <div className="whitespace-pre-wrap font-sans text-gray-800 dark:text-gray-200 text-sm leading-relaxed">
                        {aiAnalysis}
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="flex items-center">
                    <div className="p-3 rounded-full mr-4 bg-green-500"><TrendingUp className="h-6 w-6 text-white"/></div>
                    <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Ingresos Totales</p>
                        <p className="text-2xl font-bold">{formatCurrency(data.totalRevenue)}</p>
                    </div>
                </Card>
                 <Card className="flex items-center">
                    <div className="p-3 rounded-full mr-4 bg-blue-500"><Users className="h-6 w-6 text-white"/></div>
                    <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Pedidos Totales</p>
                        <p className="text-2xl font-bold">{data.totalOrders}</p>
                    </div>
                </Card>
                <Card className="flex items-center">
                    <div className="p-3 rounded-full mr-4 bg-orange-500"><Award className="h-6 w-6 text-white"/></div>
                    <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Ticket Promedio</p>
                        <p className="text-2xl font-bold">{formatCurrency(data.avgOrderValue)}</p>
                    </div>
                </Card>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                    <h3 className="text-xl font-semibold mb-4">Ventas por Categoría</h3>
                     <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer>
                            <BarChart data={data.salesByCategory} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(128, 128, 128, 0.2)" />
                                <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 12 }} />
                                <YAxis tickFormatter={(value) => formatCurrency(value as number)} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                                <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }} formatter={(value) => formatCurrency(value as number)} />
                                <Bar dataKey="total" fill="#f97316" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                 <div>
                    <h3 className="text-xl font-semibold mb-4">Distribución de Pedidos por Canal</h3>
                    <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer>
                            <PieChart>
                                <Pie data={data.orderTypes} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} fill="#8884d8" label>
                                    {data.orderTypes.map((entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value, name) => [`${value} pedidos`, name]} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ProductsReportTab: React.FC<{ data: any }> = ({ data }) => {
    if (!data) return null;
    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                 <div>
                    <h3 className="text-xl font-semibold mb-4">Top 5 Productos Más Rentables</h3>
                     <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={data.topProfitableProducts} layout="vertical" margin={{ top: 5, right: 20, left: 30, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(128, 128, 128, 0.2)" />
                            <XAxis type="number" tickFormatter={(value) => formatCurrency(value as number)} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                            <YAxis type="category" dataKey="name" width={120} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                            <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }} formatter={(value) => formatCurrency(value as number)} />
                            <Bar dataKey="ganancia" fill="#10b981" radius={[0, 4, 4, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                <div>
                    <h3 className="text-xl font-semibold mb-4">Top 5 Productos Más Vendidos (Unidades)</h3>
                     <ResponsiveContainer width="100%" height={300}>
                         <BarChart data={data.topSoldProducts} layout="vertical" margin={{ top: 5, right: 20, left: 30, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(128, 128, 128, 0.2)" />
                            <XAxis type="number" tick={{ fill: '#9ca3af', fontSize: 12 }} />
                            <YAxis type="category" dataKey="name" width={120} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                            <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }} />
                            <Bar dataKey="cantidad" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
             <div>
                <h3 className="text-xl font-semibold mb-4">Análisis Detallado de Productos</h3>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700/50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Producto</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Cantidad</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Ingresos</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Costo Total</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Ganancia</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Margen</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {data.detailedProductAnalysis.map((p: any) => (
                                <tr key={p.name}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{p.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center">{p.cantidad}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right">{formatCurrency(p.ingresos)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-red-500">{formatCurrency(p.costo)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-green-500">{formatCurrency(p.ganancia)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold">{p.margen.toFixed(1)}%</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

const HourlySalesTab: React.FC<{ data: any }> = ({ data }) => {
    if (!data) return null;
    return (
        <div>
            <h3 className="text-xl font-semibold mb-4">Ventas por Hora del Día</h3>
             <ResponsiveContainer width="100%" height={400}>
                <BarChart data={data.salesByHour} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(128, 128, 128, 0.2)" />
                    <XAxis dataKey="hour" tick={{ fill: '#9ca3af', fontSize: 12 }} />
                    <YAxis yAxisId="left" tickFormatter={(value) => formatCurrency(value as number)} tick={{ fill: '#f97316', fontSize: 12 }} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fill: '#3b82f6', fontSize: 12 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }} />
                    <Legend />
                    <Bar yAxisId="left" dataKey="ingresos" name="Ingresos" fill="#f97316" radius={[4, 4, 0, 0]} />
                    <Bar yAxisId="right" dataKey="pedidos" name="Nº Pedidos" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

const StaffReportTab: React.FC<{ data: any }> = ({ data }) => {
    if (!data) return null;
    return (
        <div>
            <h3 className="text-xl font-semibold mb-4">Rendimiento del Personal (Mozos)</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                {data.staffPerformance.slice(0, 3).map((mozo: any, index: number) => (
                    <Card key={mozo.id} className="text-center">
                         <div className="flex justify-center mb-2">
                             <img src={mozo.avatar_url} alt={mozo.nombre} className="w-16 h-16 rounded-full border-4" style={{borderColor: ['#FFD700', '#C0C0C0', '#CD7F32'][index] || '#6b7280' }}/>
                        </div>
                        <h4 className="font-bold text-lg">{mozo.nombre}</h4>
                        <p className="text-sm text-gray-500">Ticket Promedio: <span className="font-semibold text-gray-800 dark:text-gray-200">{formatCurrency(mozo.avgTicket)}</span></p>
                        <p className="text-sm text-gray-500">Ventas Totales: <span className="font-semibold text-gray-800 dark:text-gray-200">{formatCurrency(mozo.totalSales)}</span></p>
                        <p className="text-sm text-gray-500">Propinas Totales: <span className="font-semibold text-green-600 dark:text-green-400">{formatCurrency(mozo.totalTips)}</span></p>
                    </Card>
                ))}
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700/50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Mozo/a</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Pedidos Atendidos</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Ventas Totales</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Propinas</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Ticket Promedio</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {data.staffPerformance.map((mozo: any) => (
                            <tr key={mozo.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{mozo.nombre}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-center">{mozo.ordersCount}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right">{formatCurrency(mozo.totalSales)}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-green-500">{formatCurrency(mozo.totalTips)}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold">{formatCurrency(mozo.avgTicket)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const ExportModal: React.FC<{
    reportData: any;
    onClose: () => void;
}> = ({ reportData, onClose }) => {

    const downloadFile = (content: string, fileName: string, contentType: string) => {
        const blob = new Blob([content], { type: contentType });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", fileName);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleExportJSON = () => {
        if (!reportData) return;
        const jsonContent = JSON.stringify(reportData, null, 2);
        downloadFile(jsonContent, 'reporte_analitica.json', 'application/json');
        onClose();
    };

    const arrayToCsv = (data: any[], headers: { key: string; label: string }[]) => {
        const headerRow = headers.map(h => h.label).join(',');
        const dataRows = data.map(row => {
            return headers.map(header => {
                let cell = row[header.key] === null || row[header.key] === undefined ? '' : row[header.key];
                if (typeof cell === 'number') cell = cell.toFixed(2);
                if (typeof cell === 'string') {
                    cell = cell.replace(/"/g, '""'); // escape double quotes
                }
                return `"${cell}"`;
            }).join(',');
        });
        return [headerRow, ...dataRows].join('\n');
    };

    const handleExportCSV = () => {
        if (!reportData) return;

        const productHeaders = [
            { key: 'name', label: 'Producto' },
            { key: 'cantidad', label: 'Cantidad' },
            { key: 'ingresos', label: 'Ingresos' },
            { key: 'costo', label: 'Costo Total' },
            { key: 'ganancia', label: 'Ganancia' },
            { key: 'margen', label: 'Margen (%)' },
        ];
        const staffHeaders = [
            { key: 'nombre', label: 'Mozo/a' },
            { key: 'ordersCount', label: 'Pedidos Atendidos' },
            { key: 'totalSales', label: 'Ventas Totales' },
            { key: 'totalTips', label: 'Propinas' },
            { key: 'avgTicket', label: 'Ticket Promedio' },
        ];

        const productCsv = arrayToCsv(reportData.detailedProductAnalysis, productHeaders);
        const staffCsv = arrayToCsv(reportData.staffPerformance, staffHeaders);

        const fullCsv = `Analisis de Productos\n${productCsv}\n\nAnalisis de Personal\n${staffCsv}`;
        downloadFile(fullCsv, 'reporte_analitica.csv', 'text/csv;charset=utf-8;');
        onClose();
    };

    const handlePrint = () => {
        onClose();
        setTimeout(() => window.print(), 100);
    };


    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
                    <h3 className="font-semibold text-lg">Exportar Reporte</h3>
                    <button type="button" onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"><X className="h-4 w-4" /></button>
                </div>
                <div className="p-6 space-y-3">
                    <button onClick={handleExportCSV} className="w-full flex items-center justify-center gap-3 px-4 py-3 text-sm font-semibold border dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                        <FileText className="h-5 w-5 text-green-500" /> Exportar a CSV
                    </button>
                    <button onClick={handleExportJSON} className="w-full flex items-center justify-center gap-3 px-4 py-3 text-sm font-semibold border dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                        <Code className="h-5 w-5 text-blue-500" /> Exportar a JSON
                    </button>
                     <button onClick={handlePrint} className="w-full flex items-center justify-center gap-3 px-4 py-3 text-sm font-semibold border dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                        <Printer className="h-5 w-5 text-gray-600 dark:text-gray-300" /> Imprimir Reporte
                    </button>
                </div>
            </div>
        </div>
    );
};


export const ReportsPage: React.FC = () => {
    const { orders, categories, processedMenuItems, users } = useAppContext();
    const [activeTab, setActiveTab] = useState('general');
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [filters, setFilters] = useState({
        dateFrom: '',
        dateTo: '',
        channel: 'ALL',
        category: 'ALL',
    });
    
    const menuItemsMap = useMemo(() => new Map(processedMenuItems.map(item => [item.id, item])), [processedMenuItems]);
    const categoriesMap = useMemo(() => new Map(categories.map(cat => [cat.id, cat.nombre])), [categories]);
    const usersMap = useMemo(() => new Map(users.map(u => [u.id, u])), [users]);

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFilters({ ...filters, [e.target.name]: e.target.value });
    };

    const reportData = useMemo(() => {
         const filteredOrders = orders.filter(order => {
            if (order.estado === OrderStatus.CANCELADO || order.estado === OrderStatus.PENDIENTE_PAGO) return false;
            
            const orderDate = new Date(order.creado_en);
            const fromDate = filters.dateFrom ? new Date(filters.dateFrom) : null;
            const toDate = filters.dateTo ? new Date(filters.dateTo) : null;

            if (fromDate && orderDate < fromDate) return false;
            if (toDate) {
                toDate.setHours(23, 59, 59, 999);
                if (orderDate > toDate) return false;
            }
            
            if (filters.channel !== 'ALL' && order.tipo !== filters.channel) return false;
            
            if (filters.category !== 'ALL') {
                return order.items.some(item => {
                    const menuItem = menuItemsMap.get(item.menu_item_id);
                    return menuItem && menuItem.category_id === filters.category;
                });
            }
            
            return true;
        });

        if (filteredOrders.length === 0) return null;

        // General KPIs
        const totalRevenue = filteredOrders.reduce((sum, o) => sum + o.total, 0);
        const totalOrders = filteredOrders.length;
        const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
        
        // Sales by Category
        const categorySales: { [key: string]: number } = {};
        filteredOrders.forEach(order => {
            order.items.forEach(item => {
                const menuItem = menuItemsMap.get(item.menu_item_id);
                if (menuItem) {
                    const categoryName = categoriesMap.get(menuItem.category_id) || 'Sin Categoría';
                    categorySales[categoryName] = (categorySales[categoryName] || 0) + item.total_item;
                }
            });
        });
        const salesByCategory = Object.entries(categorySales).map(([name, total]) => ({ name, total }));

        // Order Types
        const typeCounts: { [key: string]: number } = {};
        filteredOrders.forEach(order => { typeCounts[order.tipo] = (typeCounts[order.tipo] || 0) + 1; });
        const orderTypes = Object.entries(typeCounts).map(([name, value]) => ({ name, value }));
        
        // Product Analysis
        const productAnalysis: { [key: string]: { name: string; cantidad: number; ingresos: number; costo: number; } } = {};
        filteredOrders.forEach(order => {
            order.items.forEach(item => {
                const menuItem = menuItemsMap.get(item.menu_item_id);
                if (!menuItem) return;

                if (!productAnalysis[menuItem.id]) {
                    productAnalysis[menuItem.id] = { name: menuItem.nombre, cantidad: 0, ingresos: 0, costo: 0 };
                }
                productAnalysis[menuItem.id].cantidad += item.cantidad;
                productAnalysis[menuItem.id].ingresos += item.total_item;
                productAnalysis[menuItem.id].costo += menuItem.coste * item.cantidad;
            });
        });

        const detailedProductAnalysis = Object.values(productAnalysis).map(p => {
            const ganancia = p.ingresos - p.costo;
            const margen = p.ingresos > 0 ? (ganancia / p.ingresos) * 100 : 0;
            return { ...p, ganancia, margen };
        }).sort((a,b) => b.ganancia - a.ganancia);

        const topProfitableProducts = [...detailedProductAnalysis].slice(0, 5);
        const topSoldProducts = Object.values(productAnalysis).sort((a, b) => b.cantidad - a.cantidad).slice(0, 5);

        // Sales by Hour
        const hourlySales: { [key: number]: { ingresos: number; pedidos: number } } = {};
        for(let i=0; i<24; i++) hourlySales[i] = {ingresos: 0, pedidos: 0};
        filteredOrders.forEach(order => {
            const hour = new Date(order.creado_en).getHours();
            hourlySales[hour].ingresos += order.total;
            hourlySales[hour].pedidos += 1;
        });
        const salesByHour = Object.entries(hourlySales).map(([hour, data]) => ({ hour: `${String(hour).padStart(2, '0')}:00`, ...data }));

        // Staff Performance (Mozos)
        const staffSales: { [key: string]: { nombre: string; avatar_url: string; totalSales: number; totalTips: number; ordersCount: number } } = {};
        filteredOrders.forEach(order => {
            if (order.creado_por_id && order.tipo === OrderType.SALA) {
                const user = usersMap.get(order.creado_por_id);
                if (user && user.rol === UserRole.MOZO) {
                    if (!staffSales[user.id]) {
                        staffSales[user.id] = { nombre: user.nombre, avatar_url: user.avatar_url, totalSales: 0, totalTips: 0, ordersCount: 0 };
                    }
                    staffSales[user.id].totalSales += (order.total - order.propina);
                    staffSales[user.id].totalTips += order.propina;
                    staffSales[user.id].ordersCount += 1;
                }
            }
        });
        const staffPerformance = Object.entries(staffSales).map(([id, data]) => ({
            id,
            ...data,
            avgTicket: data.ordersCount > 0 ? data.totalSales / data.ordersCount : 0,
        })).sort((a, b) => b.totalSales - a.totalSales);

        return {
            totalRevenue, totalOrders, avgOrderValue, salesByCategory, orderTypes,
            topProfitableProducts, topSoldProducts, detailedProductAnalysis,
            salesByHour,
            staffPerformance
        };
    }, [filters, orders, processedMenuItems, categories, users]);
    

    return (
        <div className="space-y-6">
            <div className="flex print:hidden flex-wrap justify-between items-center gap-4">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Analítica Avanzada</h1>
                <button onClick={() => setIsExportModalOpen(true)} disabled={!reportData} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-500 rounded-lg hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed">
                    <Download className="h-4 w-4" />
                    Exportar Reporte
                </button>
            </div>
            
            <Card className="print:hidden">
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div>
                        <label htmlFor="dateFrom" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Desde</label>
                        <input type="date" id="dateFrom" name="dateFrom" value={filters.dateFrom} onChange={handleFilterChange} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-sm" />
                    </div>
                    <div>
                        <label htmlFor="dateTo" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Hasta</label>
                        <input type="date" id="dateTo" name="dateTo" value={filters.dateTo} onChange={handleFilterChange} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-sm" />
                    </div>
                    <div>
                        <label htmlFor="channel" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Canal</label>
                        <select id="channel" name="channel" value={filters.channel} onChange={handleFilterChange} className="mt-1 block w-full pl-3 pr-10 py-2 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md text-sm">
                            <option value="ALL">Todos</option>
                            {Object.values(OrderType).map(type => <option key={type} value={type}>{type}</option>)}
                        </select>
                    </div>
                     <div>
                        <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Categoría</label>
                        <select id="category" name="category" value={filters.category} onChange={handleFilterChange} className="mt-1 block w-full pl-3 pr-10 py-2 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md text-sm">
                            <option value="ALL">Todas</option>
                            {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.nombre}</option>)}
                        </select>
                    </div>
                </div>
            </Card>

            <Card>
                 <div className="border-b border-gray-200 dark:border-gray-700 print:hidden">
                    <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                        <TabButton active={activeTab === 'general'} onClick={() => setActiveTab('general')}>General</TabButton>
                        <TabButton active={activeTab === 'productos'} onClick={() => setActiveTab('productos')}>Productos</TabButton>
                        <TabButton active={activeTab === 'horas'} onClick={() => setActiveTab('horas')}>Ventas por Hora</TabButton>
                        <TabButton active={activeTab === 'personal'} onClick={() => setActiveTab('personal')}>Personal</TabButton>
                    </nav>
                </div>
                <div className="pt-6">
                    {!reportData ? (
                        <div className="text-center py-16 text-gray-500">
                            <p>No hay datos para los filtros seleccionados.</p>
                            <p className="text-sm">Ajusta el rango de fechas o los filtros para ver la analítica.</p>
                        </div>
                    ) : (
                        <>
                            {activeTab === 'general' && <GeneralReportTab data={reportData} />}
                            {activeTab === 'productos' && <ProductsReportTab data={reportData} />}
                            {activeTab === 'horas' && <HourlySalesTab data={reportData} />}
                            {activeTab === 'personal' && <StaffReportTab data={reportData} />}
                        </>
                    )}
                </div>
            </Card>
            {isExportModalOpen && <ExportModal reportData={reportData} onClose={() => setIsExportModalOpen(false)} />}
        </div>
    );
};
