import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { useAppContext } from '../contexts/AppContext';
import { formatCurrency, formatDate } from '../utils';
import { Customer, UserRole } from '../types';
import { ORDER_STATUS_COLORS } from '../constants';
import { PlusCircle, X, Edit, Trash2, MapPin, MessageSquare, ShieldCheck } from 'lucide-react';

const CustomerModal: React.FC<{
    customer: Customer | null;
    onClose: () => void;
    onSave: (customerData: Omit<Customer, 'id' | 'restaurant_id' | 'ltv' | 'ultima_compra' | 'frecuencia_promedio_dias' | 'is_verified'> | Customer) => void;
}> = ({ customer, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        nombre: '',
        email: '',
        telefono: '',
        direccion: {
            calle: '',
            ciudad: '',
            codigo_postal: '',
            lat: 0,
            lng: 0,
        }
    });

    useEffect(() => {
        if (customer) {
            setFormData({
                nombre: customer.nombre,
                email: customer.email,
                telefono: customer.telefono,
                direccion: customer.direccion,
            });
        }
    }, [customer]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        
        if (name === 'telefono') {
            setFormData(prev => ({ ...prev, telefono: value.replace(/\D/g, '') }));
        } else if (name.startsWith('direccion.')) {
            const field = name.split('.')[1];
            if (field === 'codigo_postal') {
                setFormData(prev => ({ ...prev, direccion: { ...prev.direccion, codigo_postal: value.replace(/\D/g, '') } }));
            } else {
                setFormData(prev => ({ ...prev, direccion: { ...prev.direccion, [field]: value } }));
            }
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const dataToSave = { ...formData };
        if (customer) {
            onSave({ ...customer, ...dataToSave });
        } else {
            onSave(dataToSave);
        }
    };
    
    const inputClasses = "mt-1 block w-full px-3 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500";

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
                <form onSubmit={handleSubmit}>
                    <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
                        <h3 className="font-semibold text-lg">{customer ? 'Editar Cliente' : 'Crear Cliente'}</h3>
                        <button type="button" onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"><X className="h-4 w-4" /></button>
                    </div>
                    <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                        <div>
                            <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nombre Completo</label>
                            <input type="text" name="nombre" value={formData.nombre} onChange={handleChange} required className={inputClasses} />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                                <input type="email" name="email" value={formData.email} onChange={handleChange} required className={inputClasses} />
                            </div>
                            <div>
                                <label htmlFor="telefono" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Teléfono</label>
                                <input type="tel" name="telefono" value={formData.telefono} onChange={handleChange} required className={inputClasses} />
                            </div>
                        </div>
                         <div>
                            <label htmlFor="direccion.calle" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Dirección</label>
                            <input type="text" name="direccion.calle" value={formData.direccion.calle} onChange={handleChange} className={inputClasses} placeholder="Calle y número" />
                        </div>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <div>
                                <label htmlFor="direccion.ciudad" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Ciudad</label>
                                <input type="text" name="direccion.ciudad" value={formData.direccion.ciudad} onChange={handleChange} className={inputClasses} />
                            </div>
                            <div>
                                <label htmlFor="direccion.codigo_postal" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Código Postal</label>
                                <input type="text" name="direccion.codigo_postal" value={formData.direccion.codigo_postal} onChange={handleChange} className={inputClasses} />
                            </div>
                        </div>
                    </div>
                    <div className="px-6 py-3 bg-gray-50 dark:bg-gray-700/50 text-right">
                        <button type="submit" className="px-4 py-2 text-sm font-semibold text-white bg-orange-500 rounded-lg hover:bg-orange-600">
                            {customer ? 'Guardar Cambios' : 'Crear Cliente'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const MapModal: React.FC<{ customer: Customer; onClose: () => void; }> = ({ customer, onClose }) => (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
                <h3 className="font-semibold text-lg">Ubicación de {customer.nombre}</h3>
                <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"><X className="h-4 w-4" /></button>
            </div>
            <div className="p-4">
                <p className="text-sm text-gray-600 dark:text-gray-300">{customer.direccion.calle}</p>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">{customer.direccion.ciudad}, {customer.direccion.codigo_postal}</p>
                <div className="relative h-80 bg-gray-200 dark:bg-gray-700 rounded-md flex items-center justify-center text-gray-500">
                    { (customer.direccion.lat && customer.direccion.lng) ? (
                        <>
                            <img 
                                src={`https://picsum.photos/seed/${customer.direccion.lat},${customer.direccion.lng}/800/600`} 
                                alt="Mapa simulado de la ubicación del cliente" 
                                className="w-full h-full object-cover rounded-md"
                            />
                            <MapPin className="h-10 w-10 text-red-500 absolute" style={{ transform: 'translate(-50%, -100%)', top: '50%', left: '50%' }} />
                        </>
                    ) : (
                        <span>No hay datos de geolocalización para este cliente.</span>
                    )}
                </div>
            </div>
        </div>
    </div>
);

const Pagination: React.FC<{
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    itemsPerPage: number;
    totalItems: number;
}> = ({ currentPage, totalPages, onPageChange, itemsPerPage, totalItems }) => {
    if (totalPages <= 1) return null;

    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);

    return (
        <div className="flex items-center justify-between mt-4 px-4 py-2 border-t dark:border-gray-700">
            <p className="text-sm text-gray-700 dark:text-gray-300">
                Mostrando <span className="font-medium">{startItem}</span> a <span className="font-medium">{endItem}</span> de <span className="font-medium">{totalItems}</span> resultados
            </p>
            <nav className="flex items-center space-x-2">
                <button
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-1 text-sm font-medium border rounded-md disabled:opacity-50 disabled:cursor-not-allowed bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                >
                    Anterior
                </button>
                <span className="text-sm px-2">
                    Página {currentPage} de {totalPages}
                </span>
                <button
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 text-sm font-medium border rounded-md disabled:opacity-50 disabled:cursor-not-allowed bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                >
                    Siguiente
                </button>
            </nav>
        </div>
    );
};

const VerificationConfirmModal: React.FC<{
    customer: Customer;
    onClose: () => void;
    onConfirm: () => void;
}> = ({ customer, onClose, onConfirm }) => {
    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
                <div className="p-6 text-center">
                    <ShieldCheck className="h-12 w-12 text-blue-500 mx-auto mb-4" />
                    <h3 className="font-semibold text-lg mb-2">Confirmar Verificación</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                        ¿Estás seguro de que quieres verificar a "<strong>{customer.nombre}</strong>"? Esta acción habilita al cliente para pedidos de delivery.
                    </p>
                    <div className="flex gap-4">
                        <button onClick={onClose} className="w-full py-2 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                            Cancelar
                        </button>
                        <button onClick={onConfirm} className="w-full py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
                            Sí, verificar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const DeleteConfirmModal: React.FC<{
    customer: Customer;
    onClose: () => void;
    onConfirm: () => void;
}> = ({ customer, onClose, onConfirm }) => {
    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
                <div className="p-6 text-center">
                    <Trash2 className="h-12 w-12 text-red-500 mx-auto mb-4" />
                    <h3 className="font-semibold text-lg mb-2">Confirmar Eliminación</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                        ¿Estás seguro de que quieres desactivar a "<strong>{customer.nombre}</strong>"? El cliente se ocultará de las listas pero sus pedidos históricos se conservarán.
                    </p>
                    <div className="flex gap-4">
                        <button onClick={onClose} className="w-full py-2 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                            Cancelar
                        </button>
                        <button onClick={onConfirm} className="w-full py-2 bg-red-500 text-white rounded-lg hover:bg-red-600">
                            Sí, desactivar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};


export const CustomersPage: React.FC = () => {
    const { customers, user, createCustomer, updateCustomer, deleteCustomer, orders, restaurantSettings, showToast, verifyCustomer } = useAppContext();
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
    const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
    const [isMapModalOpen, setIsMapModalOpen] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [customerToVerify, setCustomerToVerify] = useState<Customer | null>(null);
    const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
    
    const ITEMS_PER_PAGE = 10;

    const canEdit = user && [UserRole.ADMIN, UserRole.GERENTE].includes(user.rol);

    const filteredCustomers = customers.filter(c => {
        const lowerCaseSearch = searchTerm.toLowerCase();
        // Improved phone search that ignores formatting like spaces or dashes
        const numericSearch = searchTerm.replace(/\D/g, '');
        
        return (
            c.nombre.toLowerCase().includes(lowerCaseSearch) ||
            c.email.toLowerCase().includes(lowerCaseSearch) ||
            (numericSearch && c.telefono.replace(/\D/g, '').includes(numericSearch))
        );
    });

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    const totalPages = Math.ceil(filteredCustomers.length / ITEMS_PER_PAGE);
    const paginatedCustomers = filteredCustomers.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
    
    const selectedCustomer = selectedCustomerId ? customers.find(c => c.id === selectedCustomerId) : null;
    const customerOrders = selectedCustomerId ? orders.filter(o => o.customer_id === selectedCustomerId).sort((a,b) => new Date(b.creado_en).getTime() - new Date(a.creado_en).getTime()) : [];
    const customerLTV = customerOrders.reduce((sum, order) => sum + order.total, 0);
    const avgTicket = customerOrders.length > 0 ? customerLTV / customerOrders.length : 0;

    const handleCreate = () => {
        setEditingCustomer(null);
        setIsModalOpen(true);
    };

    const handleEdit = (e: React.MouseEvent, customer: Customer) => {
        e.stopPropagation();
        setEditingCustomer(customer);
        setIsModalOpen(true);
    };

    const handleDelete = (e: React.MouseEvent, customer: Customer) => {
        e.stopPropagation();
        setCustomerToDelete(customer);
    };
    
    const handleSave = async (customerData: Omit<Customer, 'id' | 'restaurant_id' | 'ltv' | 'ultima_compra' | 'frecuencia_promedio_dias' | 'is_verified'> | Customer) => {
        const normalizedPhone = customerData.telefono.replace(/\D/g, '');
        const normalizedEmail = customerData.email.toLowerCase().trim();

        if (!normalizedEmail || !normalizedPhone || !customerData.nombre.trim()) {
            showToast('Nombre, email y teléfono son obligatorios.', 'error');
            return;
        }

        const customerId = 'id' in customerData ? customerData.id : null;

        const isEmailDuplicate = customers.some(c => c.email.toLowerCase().trim() === normalizedEmail && c.id !== customerId);
        if (isEmailDuplicate) {
            showToast('El email ya está registrado por otro cliente.', 'error');
            return;
        }

        const isPhoneDuplicate = customers.some(c => c.telefono.replace(/\D/g, '') === normalizedPhone && c.id !== customerId);
        if (isPhoneDuplicate) {
            showToast('El teléfono ya está registrado por otro cliente.', 'error');
            return;
        }

        if (customerId) {
            await updateCustomer(customerData as Customer);
        } else {
            await createCustomer(customerData as Omit<Customer, 'id' | 'restaurant_id' | 'ltv' | 'ultima_compra' | 'frecuencia_promedio_dias' | 'is_verified'>);
        }
        setIsModalOpen(false);
        setEditingCustomer(null);
    };

    const handleRowClick = (customerId: string) => {
        setSelectedCustomerId(customerId);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap justify-between items-center gap-4">
                 <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Clientes</h1>
                 {canEdit && (
                     <button onClick={handleCreate} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-orange-500 rounded-lg hover:bg-orange-600">
                         <PlusCircle className="h-4 w-4" />
                         Nuevo Cliente
                     </button>
                 )}
            </div>
           
            <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                <div className="lg:col-span-2 xl:col-span-3">
                    <Card>
                        <div className="mb-4">
                            <input
                                type="text"
                                placeholder="Buscar cliente por nombre, email o teléfono..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full md:w-1/2 px-4 py-2 text-sm text-gray-700 bg-gray-100 dark:bg-gray-700 dark:text-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                            />
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead className="bg-gray-50 dark:bg-gray-700/50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Nombre</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Contacto</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Última Compra</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">LTV</th>
                                        {canEdit && <th className="relative px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Acciones</th>}
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                    {paginatedCustomers.map(customer => (
                                        <tr key={customer.id} onClick={() => handleRowClick(customer.id)} className={`cursor-pointer transition-colors duration-150 ${selectedCustomerId === customer.id ? 'bg-orange-50 dark:bg-orange-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                                <div className="flex items-center gap-2">
                                                    {customer.is_verified && <span title="Cliente Verificado"><ShieldCheck className="h-4 w-4 text-green-500"/></span>}
                                                    <span>{customer.nombre}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                                {customer.email}
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span>{customer.telefono}</span>
                                                    {customer.telefono && (
                                                        <a
                                                            href={`https://wa.me/${customer.telefono.replace(/\D/g, '')}?text=${encodeURIComponent(`¡Hola ${customer.nombre}! Te contactamos desde ${restaurantSettings?.nombre}.`)}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-green-500 hover:text-green-600"
                                                            title="Contactar por WhatsApp"
                                                            onClick={e => e.stopPropagation()}
                                                        >
                                                            <MessageSquare className="h-4 w-4" />
                                                        </a>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{formatDate(customer.ultima_compra)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 dark:text-white">{formatCurrency(customer.ltv)}</td>
                                            {canEdit && (
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                     <div className="flex items-center justify-end gap-3">
                                                        <button onClick={(e) => handleEdit(e, customer)} className="text-orange-500 hover:text-orange-700 p-1"><Edit className="h-4 w-4" /></button>
                                                        <button onClick={(e) => handleDelete(e, customer)} className="text-red-500 hover:text-red-700 p-1"><Trash2 className="h-4 w-4" /></button>
                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {filteredCustomers.length === 0 && <div className="text-center py-12 text-gray-500">Sin clientes. Usa <strong>Nuevo Cliente</strong> para añadir uno.</div>}
                        <Pagination 
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={setCurrentPage}
                            itemsPerPage={ITEMS_PER_PAGE}
                            totalItems={filteredCustomers.length}
                        />
                    </Card>
                </div>
                <div className="lg:col-span-1 xl:col-span-2">
                    {selectedCustomer ? (
                        <Card className="sticky top-24">
                            <div className="flex items-start justify-between">
                                <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white truncate">{selectedCustomer.nombre}</h2>
                                {selectedCustomer.is_verified && <div className="flex items-center gap-1.5 text-xs font-semibold text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/50 px-2 py-1 rounded-full"><ShieldCheck className="h-4 w-4" /> VERIFICADO</div>}
                            </div>
                            <div className="space-y-1 text-sm text-gray-600 dark:text-gray-300 mb-4 pb-4 border-b dark:border-gray-700">
                                <p><strong className="font-medium text-gray-800 dark:text-gray-100">Email:</strong> {selectedCustomer.email}</p>
                                <p><strong className="font-medium text-gray-800 dark:text-gray-100">Teléfono:</strong> {selectedCustomer.telefono}</p>
                                <p><strong className="font-medium text-gray-800 dark:text-gray-100">Dirección:</strong> {selectedCustomer.direccion.calle || 'No especificada'}</p>
                            </div>
                            
                            <div className="mt-4 space-y-2">
                                {!selectedCustomer.is_verified && canEdit && (
                                    <button
                                        onClick={() => setCustomerToVerify(selectedCustomer)}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-green-500 rounded-lg hover:bg-green-600"
                                    >
                                        <ShieldCheck className="h-4 w-4" />
                                        Verificar Cliente
                                    </button>
                                )}
                                <button
                                    onClick={() => setIsMapModalOpen(true)}
                                    disabled={!selectedCustomer.direccion.calle}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-500 rounded-lg hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed"
                                >
                                    <MapPin className="h-4 w-4" />
                                    Ver en Mapa
                                </button>
                            </div>

                            <div className="grid grid-cols-3 gap-4 text-center my-6">
                                <div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Pedidos</p>
                                    <p className="text-xl font-bold text-gray-900 dark:text-white">{customerOrders.length}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Gasto Total</p>
                                    <p className="text-xl font-bold text-gray-900 dark:text-white">{formatCurrency(customerLTV)}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Ticket Medio</p>
                                    <p className="text-xl font-bold text-gray-900 dark:text-white">{formatCurrency(avgTicket)}</p>
                                </div>
                            </div>
                            
                            <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">Historial de Pedidos</h3>
                            <div className="overflow-y-auto max-h-[45vh] pr-2 -mr-2">
                                {customerOrders.length > 0 ? (
                                    <ul className="space-y-3">
                                        {customerOrders.map(order => (
                                            <li key={order.id} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                                <div className="flex justify-between items-center text-sm">
                                                    <span className="font-bold text-gray-800 dark:text-gray-100">Pedido #{order.id}</span>
                                                    <span className="text-gray-500 dark:text-gray-400">{formatDate(order.creado_en)}</span>
                                                </div>
                                                <div className="flex justify-between items-center mt-1">
                                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${ORDER_STATUS_COLORS[order.estado]} text-white`}>{order.estado}</span>
                                                    <span className="font-semibold text-gray-800 dark:text-white">{formatCurrency(order.total)}</span>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <div className="text-center py-8 text-sm text-gray-500 dark:text-gray-400">
                                        <p>Este cliente aún no tiene pedidos registrados.</p>
                                    </div>
                                )}
                            </div>
                        </Card>
                    ) : (
                        <Card className="sticky top-24 flex items-center justify-center h-48">
                            <p className="text-center text-gray-500 dark:text-gray-400">Selecciona un cliente de la lista para ver sus detalles y su historial de pedidos.</p>
                        </Card>
                    )}
                </div>
            </div>
            {isMapModalOpen && selectedCustomer && <MapModal customer={selectedCustomer} onClose={() => setIsMapModalOpen(false)} />}
            {isModalOpen && <CustomerModal customer={editingCustomer} onClose={() => setIsModalOpen(false)} onSave={handleSave} />}
            {customerToVerify && (
                <VerificationConfirmModal
                    customer={customerToVerify}
                    onClose={() => setCustomerToVerify(null)}
                    onConfirm={() => {
                        verifyCustomer(customerToVerify.id);
                        setCustomerToVerify(null);
                    }}
                />
            )}
            {customerToDelete && (
                <DeleteConfirmModal
                    customer={customerToDelete}
                    onClose={() => setCustomerToDelete(null)}
                    onConfirm={async () => {
                        await deleteCustomer(customerToDelete.id);
                        if (selectedCustomerId === customerToDelete.id) {
                            setSelectedCustomerId(null);
                        }
                        setCustomerToDelete(null);
                    }}
                />
            )}
        </div>
    );
};