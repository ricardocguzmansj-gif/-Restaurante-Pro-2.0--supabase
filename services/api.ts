
import { Order, OrderStatus, MenuItem, User, Customer, Coupon, OrderType, UserRole, PaymentDetails, MenuCategory, RestaurantSettings, Table, Ingredient, TableStatus, Restaurant } from '../types';
import { demoOrders, demoMenuItems, demoUsers, demoCustomers, demoCoupons, demoCategories, demoRestaurants, demoTables, demoIngredients } from '../data/db';

// This is a mock API. In a real application, this would make network requests.
// For this demo, we manipulate in-memory arrays to simulate a backend database.
let orders: Order[] = JSON.parse(localStorage.getItem('orders') || 'null') || [...demoOrders];
let menuItems: MenuItem[] = JSON.parse(localStorage.getItem('menuItems') || 'null') || (demoMenuItems as MenuItem[]);
let customers: Customer[] = JSON.parse(localStorage.getItem('customers') || 'null') || [...demoCustomers];
let coupons: Coupon[] = JSON.parse(localStorage.getItem('coupons') || 'null') || [...demoCoupons];
let users: User[] = JSON.parse(localStorage.getItem('users') || 'null') || [...demoUsers];
let categories: MenuCategory[] = JSON.parse(localStorage.getItem('categories') || 'null') || [...demoCategories];
let restaurants: Restaurant[] = JSON.parse(localStorage.getItem('restaurants') || 'null') || [...demoRestaurants];
let tables: Table[] = JSON.parse(localStorage.getItem('tables') || 'null') || [...demoTables];
let ingredients: Ingredient[] = JSON.parse(localStorage.getItem('ingredients') || 'null') || [...demoIngredients];

const saveDataToLocalStorage = () => {
    localStorage.setItem('orders', JSON.stringify(orders));
    localStorage.setItem('menuItems', JSON.stringify(menuItems));
    localStorage.setItem('customers', JSON.stringify(customers));
    localStorage.setItem('coupons', JSON.stringify(coupons));
    localStorage.setItem('users', JSON.stringify(users));
    localStorage.setItem('categories', JSON.stringify(categories));
    localStorage.setItem('restaurants', JSON.stringify(restaurants));
    localStorage.setItem('tables', JSON.stringify(tables));
    localStorage.setItem('ingredients', JSON.stringify(ingredients));
}

const simulateDelay = (ms: number) => new Promise(res => setTimeout(res, ms));

export const api = {
  // Restaurants
  getRestaurants: async (): Promise<Restaurant[]> => {
      await simulateDelay(100);
      return [...restaurants];
  },

  getRestaurantById: async (id: string): Promise<Restaurant | undefined> => {
      await simulateDelay(100);
      return restaurants.find(r => r.id === id);
  },

  createRestaurant: async (settings: RestaurantSettings): Promise<Restaurant> => {
      await simulateDelay(200);
      const newId = `rest-${Date.now()}`;
      const newRestaurant: Restaurant = {
          id: newId,
          settings: settings
      };
      restaurants.push(newRestaurant);
      saveDataToLocalStorage();
      return newRestaurant;
  },

  updateRestaurantSettings: async (restaurantId: string, settings: RestaurantSettings): Promise<RestaurantSettings> => {
    await simulateDelay(200);
    const index = restaurants.findIndex(r => r.id === restaurantId);
    if (index === -1) throw new Error("Restaurant not found");
    
    restaurants[index].settings = settings;
    saveDataToLocalStorage();
    return { ...restaurants[index].settings };
  },

  deleteRestaurant: async (restaurantId: string): Promise<void> => {
      await simulateDelay(300);
      restaurants = restaurants.filter(r => r.id !== restaurantId);
      // Cleanup related data
      users = users.filter(u => u.restaurant_id !== restaurantId);
      orders = orders.filter(o => o.restaurant_id !== restaurantId);
      menuItems = menuItems.filter(m => m.restaurant_id !== restaurantId);
      categories = categories.filter(c => c.restaurant_id !== restaurantId);
      customers = customers.filter(c => c.restaurant_id !== restaurantId);
      coupons = coupons.filter(c => c.restaurant_id !== restaurantId);
      tables = tables.filter(t => t.restaurant_id !== restaurantId);
      ingredients = ingredients.filter(i => i.restaurant_id !== restaurantId);
      
      saveDataToLocalStorage();
  },

  // User
  login: async (email: string, password_provided: string): Promise<User | undefined> => {
    await simulateDelay(200);
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && !u.is_deleted);
    if (user && user.password === password_provided) {
        // Omitting password from returned user object for security
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword as User;
    }
    // Handle users created without a password (for demo continuity)
    if (user && !user.password) {
        return user;
    }
    return undefined;
  },

  getUsers: async (restaurantId: string): Promise<User[]> => {
    await simulateDelay(100);
    return [...users].filter(u => !u.is_deleted && u.restaurant_id === restaurantId);
  },

  createUser: async (userData: Omit<User, 'id' | 'avatar_url'>): Promise<User> => {
    await simulateDelay(200);
    const newId = `user-${Date.now()}`;
    const newUser: User = {
      ...userData,
      id: newId,
      avatar_url: `https://i.pravatar.cc/150?u=${newId}`,
      is_deleted: false,
    };
    users = [newUser, ...users];
    saveDataToLocalStorage();
    return newUser;
  },

  updateUser: async (updatedUser: User): Promise<User> => {
    await simulateDelay(200);
    const userIndex = users.findIndex(u => u.id === updatedUser.id);
    if (userIndex === -1) {
      throw new Error("User not found");
    }
    users[userIndex] = updatedUser;
    saveDataToLocalStorage();
    return { ...users[userIndex] };
  },

  updateUserLocation: async (userId: string, lat: number, lng: number): Promise<void> => {
      // No delay needed for location updates to keep it snappy
      const userIndex = users.findIndex(u => u.id === userId);
      if (userIndex !== -1) {
          users[userIndex].last_location = {
              lat,
              lng,
              updated_at: new Date().toISOString()
          };
          saveDataToLocalStorage();
      }
  },

  deleteUser: async (userId: string): Promise<void> => {
    await simulateDelay(200);
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex === -1) throw new Error("User not found");
    
    const userToDelete = users[userIndex];
    const adminCount = users.filter(u => u.rol === UserRole.ADMIN && !u.is_deleted && u.restaurant_id === userToDelete.restaurant_id).length;

    if (userToDelete.rol === UserRole.ADMIN && adminCount <= 1) {
      throw new Error("No se puede eliminar al último administrador del restaurante.");
    }
    
    users[userIndex].is_deleted = true;
    saveDataToLocalStorage();
  },

  // Orders
  getOrders: async (restaurantId: string): Promise<Order[]> => {
    await simulateDelay(300);
    // IMPORTANT: Return deep copy to prevent reference sharing in mock environment
    // This ensures polling mechanism detects changes correctly.
    const restaurantOrders = orders.filter(o => o.restaurant_id === restaurantId);
    return JSON.parse(JSON.stringify(restaurantOrders));
  },
  
  createOrder: async (newOrderData: Omit<Order, 'id' | 'creado_en' | 'payments' | 'estado' | 'repartidor_id'>): Promise<Order> => {
    await simulateDelay(500);
    
    const newOrder: Order = {
      ...newOrderData,
      id: Math.max(...orders.map(o => o.id), 0) + 1,
      creado_en: new Date().toISOString(),
      repartidor_id: null,
      estado: newOrderData.tipo === OrderType.PARA_LLEVAR ? OrderStatus.PENDIENTE_PAGO : OrderStatus.NUEVO,
      payments: [],
    };
    orders = [newOrder, ...orders];
    saveDataToLocalStorage();
    return newOrder;
  },

  createPublicOrder: async (newOrderData: Omit<Order, 'id' | 'creado_en' | 'payments' | 'estado' | 'repartidor_id' | 'creado_por_id' | 'mozo_id'>): Promise<Order> => {
    await simulateDelay(500);
    const newOrder: Order = {
      ...newOrderData,
      id: Math.max(...orders.map(o => o.id), 0) + 1,
      creado_en: new Date().toISOString(),
      repartidor_id: null,
      creado_por_id: 'user-system-portal', // System user for portal orders
      estado: newOrderData.tipo === OrderType.PARA_LLEVAR ? OrderStatus.PENDIENTE_PAGO : OrderStatus.NUEVO,
      payments: [],
      mozo_id: null,
    };
    orders = [newOrder, ...orders];
    saveDataToLocalStorage();
    return newOrder;
  },

  updateOrderStatus: async (orderId: number, newStatus: OrderStatus): Promise<Order> => {
    await simulateDelay(200);
    const orderIndex = orders.findIndex(o => o.id === orderId);
    if (orderIndex === -1) {
      throw new Error("Order not found");
    }
    const order = orders[orderIndex];
    
    order.estado = newStatus;

    if (order.tipo === OrderType.DELIVERY && order.repartidor_id && [OrderStatus.ENTREGADO, OrderStatus.CANCELADO, OrderStatus.DEVOLUCION].includes(newStatus)) {
      const userIndex = users.findIndex(u => u.id === order.repartidor_id);
      if (userIndex !== -1) {
        users[userIndex].estado_delivery = 'DISPONIBLE';
      }
    }
    saveDataToLocalStorage();
    return { ...order };
  },
  
  cancelOrder: async (orderId: number): Promise<Order> => {
    await simulateDelay(300);
    const orderIndex = orders.findIndex(o => o.id === orderId);
    if (orderIndex === -1) throw new Error("Order not found");

    const order = orders[orderIndex];

    const cancellableStates = [
        OrderStatus.NUEVO,
        OrderStatus.EN_PREPARACION,
        OrderStatus.LISTO,
        OrderStatus.EN_CAMINO,
        OrderStatus.INCIDENCIA,
        OrderStatus.PENDIENTE_PAGO
    ];
    if (!cancellableStates.includes(order.estado)) {
        throw new Error("El pedido no puede ser cancelado en su estado actual.");
    }
    
    // Return stock if it was deducted
    const stockDeductedStates = [
        OrderStatus.EN_PREPARACION,
        OrderStatus.LISTO,
        OrderStatus.EN_CAMINO,
        OrderStatus.INCIDENCIA,
    ];
    if (stockDeductedStates.includes(order.estado)) {
        const ingredientUpdates = new Map<string, number>();
        order.items.forEach(orderItem => {
            const menuItem = menuItems.find(mi => mi.id === orderItem.menu_item_id);
            if (menuItem && menuItem.receta) {
                menuItem.receta.forEach(recipeItem => {
                    const currentAddition = ingredientUpdates.get(recipeItem.ingredient_id) || 0;
                    ingredientUpdates.set(recipeItem.ingredient_id, currentAddition + (recipeItem.cantidad * orderItem.cantidad));
                });
            }
        });
        ingredientUpdates.forEach((amountToAdd, ingredientId) => {
            const ingredientIndex = ingredients.findIndex(i => i.id === ingredientId);
            if (ingredientIndex !== -1) {
                ingredients[ingredientIndex].stock_actual += amountToAdd;
            }
        });
    }
    
    // If it was a delivery, make repartidor available
    if (order.repartidor_id) {
        const userIndex = users.findIndex(u => u.id === order.repartidor_id);
        if (userIndex !== -1) {
            users[userIndex].estado_delivery = 'DISPONIBLE';
        }
    }

    // If it was a sala order, update the table
    if (order.table_id && order.tipo === OrderType.SALA) {
         const tableIndex = tables.findIndex(t => t.id === order.table_id && t.order_id === order.id && t.restaurant_id === order.restaurant_id);
         if (tableIndex !== -1) {
             tables[tableIndex].estado = TableStatus.NECESITA_LIMPIEZA;
             tables[tableIndex].order_id = null;
             tables[tableIndex].mozo_id = null;
         }
    }

    order.estado = OrderStatus.CANCELADO;
    saveDataToLocalStorage();
    return { ...order };
  },

  deductStockForOrder: async (orderId: number): Promise<void> => {
    await simulateDelay(150);
    const order = orders.find(o => o.id === orderId);
    if (!order) throw new Error("Order not found for stock deduction");

    const ingredientUpdates = new Map<string, number>();

    order.items.forEach(orderItem => {
        const menuItem = menuItems.find(mi => mi.id === orderItem.menu_item_id);
        if (menuItem && menuItem.receta) {
            menuItem.receta.forEach(recipeItem => {
                const currentDeduction = ingredientUpdates.get(recipeItem.ingredient_id) || 0;
                ingredientUpdates.set(recipeItem.ingredient_id, currentDeduction + (recipeItem.cantidad * orderItem.cantidad));
            });
        }
    });

    ingredientUpdates.forEach((amountToDeduct, ingredientId) => {
        const ingredientIndex = ingredients.findIndex(i => i.id === ingredientId);
        if (ingredientIndex !== -1) {
            ingredients[ingredientIndex].stock_actual -= amountToDeduct;
        }
    });
    
    saveDataToLocalStorage();
  },

  generatePaymentQR: async (orderId: number, amount: number): Promise<Order> => {
    await simulateDelay(600);
    const orderIndex = orders.findIndex(o => o.id === orderId);
    if (orderIndex === -1) throw new Error("Order not found");

    const order = orders[orderIndex];
    const restaurant = restaurants.find(r => r.id === order.restaurant_id);
    const restaurantName = restaurant?.settings.nombre || 'Restaurante';

    const qrData = JSON.stringify({ orderId: order.id, total: amount, restaurant: restaurantName });
    const qr_code_url = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrData)}`;

    (order as any).last_qr_code_url = qr_code_url;
    
    orders[orderIndex] = order;
    saveDataToLocalStorage();
    return { ...order };
},

  addPaymentToOrder: async (orderId: number, method: PaymentDetails['method'], amount: number): Promise<Order> => {
    await simulateDelay(800);
    const orderIndex = orders.findIndex(o => o.id === orderId);
    if (orderIndex === -1) throw new Error("Order not found");

    const order = orders[orderIndex];
    
    const newPayment: PaymentDetails = {
        status: 'PAGADO',
        method: method,
        transaction_id: `txn_${Date.now()}`,
        amount: amount,
        creado_en: new Date().toISOString()
    };
    order.payments.push(newPayment);

    const totalPaid = order.payments.reduce((sum, p) => sum + p.amount, 0);

    if (totalPaid >= order.total) {
        if (order.estado === OrderStatus.PENDIENTE_PAGO) {
            order.estado = (order.tipo === OrderType.PARA_LLEVAR) ? OrderStatus.NUEVO : OrderStatus.ENTREGADO;
        }
    }
    
    orders[orderIndex] = order;
    saveDataToLocalStorage();
    return { ...order };
  },


  updateOrder: async (orderId: number, updatedOrderData: Partial<Order>): Promise<Order> => {
    await simulateDelay(400);
    const orderIndex = orders.findIndex(o => o.id === orderId);
    if (orderIndex === -1) {
      throw new Error("Order not found");
    }
    const updatedOrder = { ...orders[orderIndex], ...updatedOrderData };
    orders[orderIndex] = updatedOrder;
    saveDataToLocalStorage();
    return { ...updatedOrder };
  },

  assignRepartidorToOrder: async (orderId: number, repartidorId: string): Promise<Order> => {
    await simulateDelay(300);
    const orderIndex = orders.findIndex(o => o.id === orderId);
    if (orderIndex === -1) throw new Error("Order not found");
    
    const order = orders[orderIndex];
    const oldRepartidorId = order.repartidor_id;

    if (oldRepartidorId) {
      const oldUserIndex = users.findIndex(u => u.id === oldRepartidorId);
      if (oldUserIndex !== -1) users[oldUserIndex].estado_delivery = 'DISPONIBLE';
    }

    const newUserIndex = users.findIndex(u => u.id === repartidorId);
    if (newUserIndex === -1) throw new Error("Repartidor not found");
    users[newUserIndex].estado_delivery = 'EN_REPARTO';
    
    order.repartidor_id = repartidorId;
    order.estado = OrderStatus.EN_CAMINO;
    saveDataToLocalStorage();
    return { ...order };
  },

  // Categories
  getCategories: async (restaurantId: string): Promise<MenuCategory[]> => {
    await simulateDelay(100);
    return categories.filter(c => c.restaurant_id === restaurantId).sort((a, b) => a.orden - b.orden);
  },

  createCategory: async (categoryData: Omit<MenuCategory, 'id'>): Promise<MenuCategory> => {
    await simulateDelay(200);
    const newCategory: MenuCategory = {
      ...categoryData,
      id: `cat-${Date.now()}`,
    };
    categories.push(newCategory);
    saveDataToLocalStorage();
    return newCategory;
  },

  updateCategories: async (updatedCategories: MenuCategory[]): Promise<MenuCategory[]> => {
    await simulateDelay(200);
    const reorderedCategories = updatedCategories.map((cat, index) => ({
      ...cat,
      orden: index + 1,
    }));
    // Update global categories array while preserving other restaurants' categories
    const otherCategories = categories.filter(c => !reorderedCategories.some(rc => rc.id === c.id));
    categories = [...otherCategories, ...reorderedCategories];
    
    saveDataToLocalStorage();
    // Return sorted categories for the specific restaurant
    const restaurantId = reorderedCategories[0]?.restaurant_id;
    return categories.filter(c => c.restaurant_id === restaurantId).sort((a, b) => a.orden - b.orden);
  },

  deleteCategory: async (categoryId: string): Promise<void> => {
    await simulateDelay(200);
    const isCategoryInUse = menuItems.some(item => item.category_id === categoryId);
    if (isCategoryInUse) {
        throw new Error("No se puede eliminar una categoría que tiene productos asociados.");
    }
    categories = categories.filter(c => c.id !== categoryId);
    saveDataToLocalStorage();
  },

  // Menu Items
  getMenuItems: async (restaurantId: string): Promise<MenuItem[]> => {
    await simulateDelay(300);
    return menuItems.filter(m => m.restaurant_id === restaurantId);
  },

  createMenuItem: async (itemData: Omit<MenuItem, 'id'>): Promise<MenuItem> => {
    await simulateDelay(200);
    const newId = `item-${Date.now()}`;
    const newItem: MenuItem = {
      ...itemData,
      id: newId,
      is_deleted: false,
    };
    menuItems = [newItem, ...menuItems];
    saveDataToLocalStorage();
    return newItem;
  },

  updateMenuItem: async (updatedItem: MenuItem): Promise<MenuItem> => {
     await simulateDelay(200);
    const itemIndex = menuItems.findIndex(i => i.id === updatedItem.id);
    if (itemIndex === -1) {
      throw new Error("Menu item not found");
    }
    menuItems[itemIndex] = updatedItem;
    saveDataToLocalStorage();
    return { ...menuItems[itemIndex] };
  },
  
  deleteMenuItem: async (itemId: string): Promise<MenuItem> => {
    await simulateDelay(200);
    const activeOrderStates = [OrderStatus.NUEVO, OrderStatus.EN_PREPARACION, OrderStatus.LISTO, OrderStatus.EN_CAMINO];
    const isItemInActiveOrder = orders.some(o => 
        activeOrderStates.includes(o.estado) && o.items.some(i => i.menu_item_id === itemId)
    );
    if (isItemInActiveOrder) {
        throw new Error("No se puede eliminar un producto que forma parte de un pedido activo.");
    }
    
    const itemIndex = menuItems.findIndex(item => item.id === itemId);
    if (itemIndex === -1) throw new Error("Menu item not found");

    menuItems[itemIndex].is_deleted = true;
    saveDataToLocalStorage();
    return { ...menuItems[itemIndex] };
  },

  restoreMenuItem: async (itemId: string): Promise<MenuItem> => {
    await simulateDelay(200);
    const itemIndex = menuItems.findIndex(item => item.id === itemId);
    if (itemIndex === -1) throw new Error("Menu item not found");

    menuItems[itemIndex].is_deleted = false;
    saveDataToLocalStorage();
    return { ...menuItems[itemIndex] };
  },
  
  // Customers
  getCustomers: async (restaurantId: string): Promise<Customer[]> => {
    await simulateDelay(300);
    return customers.filter(c => !c.is_deleted && c.restaurant_id === restaurantId);
  },

  findCustomerByContact: async (restaurantId: string, contact: string): Promise<Customer | undefined> => {
    await simulateDelay(200);
    return customers.find(c => c.restaurant_id === restaurantId && (c.telefono === contact || c.email === contact) && !c.is_deleted);
  },

  createCustomer: async (customerData: Omit<Customer, 'id' | 'ltv' | 'ultima_compra' | 'frecuencia_promedio_dias' | 'is_verified'>): Promise<Customer> => {
    await simulateDelay(200);
    const newId = `customer-${Date.now()}`;
    const newCustomer: Customer = {
      ...customerData,
      id: newId,
      ltv: 0,
      ultima_compra: new Date().toISOString(),
      frecuencia_promedio_dias: 0,
      is_verified: false,
      is_deleted: false,
    };
    customers = [newCustomer, ...customers];
    saveDataToLocalStorage();
    return newCustomer;
  },
  
  updateCustomer: async (updatedCustomer: Customer): Promise<Customer> => {
    await simulateDelay(200);
    const customerIndex = customers.findIndex(c => c.id === updatedCustomer.id);
    if (customerIndex === -1) {
      throw new Error("Customer not found");
    }
    customers[customerIndex] = updatedCustomer;
    saveDataToLocalStorage();
    return { ...customers[customerIndex] };
  },

  verifyCustomer: async (customerId: string): Promise<Customer> => {
      await simulateDelay(200);
      const customerIndex = customers.findIndex(c => c.id === customerId);
      if (customerIndex === -1) throw new Error("Customer not found");
      customers[customerIndex].is_verified = true;
      saveDataToLocalStorage();
      return { ...customers[customerIndex] };
  },

  deleteCustomer: async (customerId: string): Promise<void> => {
    await simulateDelay(300);
    const customerIndex = customers.findIndex(c => c.id === customerId);
    if (customerIndex === -1) {
      throw new Error("Customer not found");
    }
    customers[customerIndex].is_deleted = true;
    saveDataToLocalStorage();
  },

  // Coupons
  getCoupons: async (restaurantId: string): Promise<Coupon[]> => {
    await simulateDelay(300);
    return coupons.filter(c => c.restaurant_id === restaurantId);
  },

  createCoupon: async (couponData: Omit<Coupon, 'id'>): Promise<Coupon> => {
    await simulateDelay(200);
    const newCoupon: Coupon = {
      ...couponData,
      id: `coupon-${Date.now()}`,
    };
    coupons = [newCoupon, ...coupons];
    saveDataToLocalStorage();
    return newCoupon;
  },

  updateCoupon: async (updatedCoupon: Coupon): Promise<Coupon> => {
    await simulateDelay(200);
    const couponIndex = coupons.findIndex(c => c.id === updatedCoupon.id);
    if (couponIndex === -1) {
      throw new Error("Coupon not found");
    }
    coupons[couponIndex] = updatedCoupon;
    saveDataToLocalStorage();
    return { ...coupons[couponIndex] };
  },

  deleteCoupon: async (couponId: string): Promise<void> => {
    await simulateDelay(200);
    coupons = coupons.filter(c => c.id !== couponId);
    saveDataToLocalStorage();
  },

  // Ingredients
  getIngredients: async (restaurantId: string): Promise<Ingredient[]> => {
    await simulateDelay(100);
    return ingredients.filter(i => i.restaurant_id === restaurantId);
  },

  createIngredient: async (ingredientData: Omit<Ingredient, 'id'>): Promise<Ingredient> => {
    await simulateDelay(200);
    const newId = `ing-${Date.now()}`;
    const newIngredient: Ingredient = {
      ...ingredientData,
      id: newId,
    };
    ingredients = [newIngredient, ...ingredients];
    saveDataToLocalStorage();
    return newIngredient;
  },

  updateIngredient: async (updatedIngredient: Ingredient): Promise<Ingredient> => {
    await simulateDelay(200);
    const ingredientIndex = ingredients.findIndex(i => i.id === updatedIngredient.id);
    if (ingredientIndex === -1) {
      throw new Error("Ingredient not found");
    }
    ingredients[ingredientIndex] = updatedIngredient;
    saveDataToLocalStorage();
    return { ...ingredients[ingredientIndex] };
  },

  deleteIngredient: async (ingredientId: string): Promise<void> => {
    await simulateDelay(200);
    ingredients = ingredients.filter(i => i.id !== ingredientId);
    // Also remove from any menu item recipes (global filtering is safe here as IDs are unique)
    menuItems = menuItems.map(item => ({
      ...item,
      receta: item.receta.filter(r => r.ingredient_id !== ingredientId),
    }));
    saveDataToLocalStorage();
  },


  // Settings
  getRestaurantSettings: async (restaurantId: string): Promise<RestaurantSettings | null> => {
    await simulateDelay(100);
    const restaurant = restaurants.find(r => r.id === restaurantId);
    return restaurant ? restaurant.settings : null;
  },

  // Tables
  getTables: async (restaurantId: string): Promise<Table[]> => {
    await simulateDelay(100);
    return tables.filter(t => t.restaurant_id === restaurantId);
  },

  updateTable: async (updatedTable: Table): Promise<Table> => {
    await simulateDelay(100);
    const tableIndex = tables.findIndex(t => t.id === updatedTable.id && t.restaurant_id === updatedTable.restaurant_id);
    if (tableIndex === -1) {
      throw new Error("Table not found");
    }
    tables[tableIndex] = updatedTable;
    saveDataToLocalStorage();
    return { ...tables[tableIndex] };
  },

  updateTablesLayout: async (updatedTables: Table[]): Promise<Table[]> => {
    await simulateDelay(300);
    // Replace tables for this restaurant only
    if (updatedTables.length === 0) return [];
    const restaurantId = updatedTables[0].restaurant_id;
    const otherTables = tables.filter(t => t.restaurant_id !== restaurantId);
    
    tables = [...otherTables, ...updatedTables];
    saveDataToLocalStorage();
    return updatedTables;
  },
};
