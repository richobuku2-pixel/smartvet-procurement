import { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { storage } from '../utils/storage';
import { PRODUCTS, SUPPLIERS, DEFAULT_INVENTORY, ROLES, LOCATIONS } from '../data/seedData';
import {
  makeGlobalVetSupplier,
  makeEramSupplier,
  makeBukoolaVetSupplier,
  makeUltravetisSupplier,
  makeNorbrookSupplier,
  makeSangaVetSupplier,
} from '../data/supplierCatalogues';
import { generateDraftOrders, calculateSupplierBalance } from '../utils/calculations';
import { addDays, generateTransferOrderId } from '../utils/formatter';

const AppContext = createContext(null);

const initialState = () => {
  const rawSuppliers = storage.get('suppliers', SUPPLIERS);
  const suppliers = Object.fromEntries(
    Object.entries(rawSuppliers).map(([name, details]) => [
      name,
      Array.isArray(details.catalogue) ? details : { ...details, catalogue: [] },
    ])
  );

  const CATALOGUE_SEEDERS = [
    ['Eram Uganda Ltd',    makeEramSupplier],
    ['Global Vet (U) Ltd', makeGlobalVetSupplier],
    ['Bukoola Vet',        makeBukoolaVetSupplier],
    ['Ultravetis Uganda',  makeUltravetisSupplier],
    ['Norbrook Uganda',    makeNorbrookSupplier],
    ['Sanga Vet Chem Ltd', makeSangaVetSupplier],
  ];
  for (const [name, makeFn] of CATALOGUE_SEEDERS) {
    if (!suppliers[name] || !suppliers[name].catalogue.length) {
      const seeded = makeFn();
      suppliers[name] = { ...(suppliers[name] || {}), ...seeded };
    }
  }

  return {
    products:          storage.get('products', PRODUCTS),
    suppliers,
    inventory:         storage.get('inventory', DEFAULT_INVENTORY),
    orders:            storage.get('orders', []),
    supplierAccounts:  storage.get('supplierAccounts', {}),
    locations:         storage.get('locations', LOCATIONS),
    transferOrders:    storage.get('transferOrders', []),
    locationInventory: storage.get('locationInventory', {}),
    stockCounts:       storage.get('stockCounts', []),
    posApiUrl:         storage.get('posApiUrl', ''),
    currentRole: 'admin',
    currentUser: null,
    notifications: [],
    activeTab: 'dashboard',
    modals: {},
  };
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_PRODUCTS':           return { ...state, products: action.payload };
    case 'SET_SUPPLIERS':          return { ...state, suppliers: action.payload };
    case 'SET_INVENTORY':          return { ...state, inventory: action.payload };
    case 'SET_ORDERS':             return { ...state, orders: action.payload };
    case 'SET_SUPPLIER_ACCOUNTS':  return { ...state, supplierAccounts: action.payload };
    case 'SET_LOCATIONS':          return { ...state, locations: action.payload };
    case 'SET_TRANSFER_ORDERS':    return { ...state, transferOrders: action.payload };
    case 'SET_LOCATION_INVENTORY': return { ...state, locationInventory: action.payload };
    case 'SET_STOCK_COUNTS':       return { ...state, stockCounts: action.payload };
    case 'SET_POS_API_URL':        return { ...state, posApiUrl: action.payload };
    case 'SET_ROLE':               return { ...state, currentRole: action.payload };
    case 'SET_TAB':                return { ...state, activeTab: action.payload };
    case 'ADD_NOTIFICATION':
      return { ...state, notifications: [...state.notifications, { id: `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`, ...action.payload }] };
    case 'REMOVE_NOTIFICATION':
      return { ...state, notifications: state.notifications.filter(n => n.id !== action.payload) };
    case 'SET_MODAL':
      return { ...state, modals: { ...state.modals, [action.key]: action.value } };
    default:
      return state;
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, null, initialState);

  // Persist to storage
  useEffect(() => { storage.set('products',          state.products);          }, [state.products]);
  useEffect(() => { storage.set('suppliers',         state.suppliers);         }, [state.suppliers]);
  useEffect(() => { storage.set('inventory',         state.inventory);         }, [state.inventory]);
  useEffect(() => { storage.set('orders',            state.orders);            }, [state.orders]);
  useEffect(() => { storage.set('supplierAccounts',  state.supplierAccounts);  }, [state.supplierAccounts]);
  useEffect(() => { storage.set('locations',         state.locations);         }, [state.locations]);
  useEffect(() => { storage.set('transferOrders',    state.transferOrders);    }, [state.transferOrders]);
  useEffect(() => { storage.set('locationInventory', state.locationInventory); }, [state.locationInventory]);
  useEffect(() => { storage.set('stockCounts',       state.stockCounts);       }, [state.stockCounts]);
  useEffect(() => { storage.set('posApiUrl',         state.posApiUrl);         }, [state.posApiUrl]);
  useEffect(() => { storage.set('currentRole',       state.currentRole);       }, [state.currentRole]);

  const notify = useCallback((message, type = 'success') => {
    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    dispatch({ type: 'ADD_NOTIFICATION', payload: { id, message, variant: type } });
    setTimeout(() => dispatch({ type: 'REMOVE_NOTIFICATION', payload: id }), 4000);
  }, []);

  // ── Inventory ───────────────────────────────────────────────────────────────
  const updateInventory = useCallback((newInventory) => {
    dispatch({ type: 'SET_INVENTORY', payload: newInventory });
    const newDrafts = generateDraftOrders(newInventory, state.orders, state.products, state.suppliers);
    if (newDrafts.length > 0) {
      const updatedOrders = [...state.orders, ...newDrafts];
      dispatch({ type: 'SET_ORDERS', payload: updatedOrders });
      newDrafts.forEach(o => notify(`Draft order created for ${o.supplier}: ${o.items.length} item(s), UGX ${o.totalCost.toLocaleString()}`, 'info'));
    }
  }, [state.orders, state.products, state.suppliers, notify]);

  // ── Orders ──────────────────────────────────────────────────────────────────
  const updateOrderStatus = useCallback((orderId, newStatus, extras = {}) => {
    const updatedOrders = state.orders.map(o =>
      o.id !== orderId ? o : { ...o, status: newStatus, updatedAt: new Date().toISOString(), ...extras }
    );
    dispatch({ type: 'SET_ORDERS', payload: updatedOrders });
  }, [state.orders]);

  /** Mark supplier has acknowledged the order */
  const markAcknowledged = useCallback((orderId, ackData) => {
    const updatedOrders = state.orders.map(o =>
      o.id !== orderId ? o : {
        ...o,
        status: 'supplier_acknowledged',
        updatedAt: new Date().toISOString(),
        supplierAcknowledgment: { ...ackData, acknowledgedAt: new Date().toISOString() },
      }
    );
    dispatch({ type: 'SET_ORDERS', payload: updatedOrders });
    const order = state.orders.find(o => o.id === orderId);
    notify(`Order ${order?.orderId} acknowledged by supplier.`, 'success');
  }, [state.orders, notify]);

  /** Mark order dispatched by supplier — adds tracking info */
  const markDispatched = useCallback((orderId, shipmentData) => {
    const updatedOrders = state.orders.map(o =>
      o.id !== orderId ? o : {
        ...o,
        status: 'dispatched',
        updatedAt: new Date().toISOString(),
        shipment: { ...shipmentData, dispatchedAt: new Date().toISOString() },
      }
    );
    dispatch({ type: 'SET_ORDERS', payload: updatedOrders });
    const order = state.orders.find(o => o.id === orderId);
    notify(`Order ${order?.orderId} marked in transit.`, 'info');
  }, [state.orders, notify]);

  /** Mark order received — records delivery details AND updates main warehouse inventory */
  const receiveOrder = useCallback((orderId, deliveryData) => {
    const order = state.orders.find(o => o.id === orderId);
    if (!order) return;

    const updatedOrders = state.orders.map(o =>
      o.id !== orderId ? o : {
        ...o,
        status: 'received',
        updatedAt: new Date().toISOString(),
        delivery: { ...deliveryData, receivedAt: new Date().toISOString() },
      }
    );
    dispatch({ type: 'SET_ORDERS', payload: updatedOrders });

    // Add received quantities to main warehouse stock
    const newInventory = { ...state.inventory };

    /** Resolve a product id from an order/delivery item.
     *  Priority: explicit productId → numeric id → keyword name-match fallback */
    const resolveProductId = (item) => {
      if (item.productId != null) return item.productId;
      if (item.id != null && Number.isFinite(Number(item.id))) return Number(item.id);
      // Name-based fallback: "BRAND — Generic Name (variant)" → match on generic keywords
      const normalize = s => (s || '').toLowerCase()
        .split(' — ').pop()                          // drop brand prefix (e.g. "HIPRAVIAR S — ")
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter(w => w.length > 2 && !['the','and','for','via','per','with'].includes(w));
      const catalogWords = normalize(item.productName);
      let bestId = null, bestScore = 0;
      state.products.forEach(p => {
        const prodWords = normalize(p.name);
        const matched = prodWords.filter(w => catalogWords.includes(w)).length;
        const score = prodWords.length > 0 ? matched / prodWords.length : 0;
        if (score >= 0.65 && score > bestScore) { bestScore = score; bestId = p.id; }
      });
      return bestId;
    };

    (deliveryData.receivedItems || order.items).forEach(item => {
      const pid = resolveProductId(item);
      if (pid != null) {
        newInventory[pid] = (newInventory[pid] || 0) + (item.receivedQty ?? item.quantity ?? 0);
      }
    });
    dispatch({ type: 'SET_INVENTORY', payload: newInventory });

    const total = (deliveryData.receivedItems || order.items).reduce((s, i) => s + (i.receivedQty ?? i.quantity ?? 0), 0);
    notify(`Order ${order.orderId} received — ${total} unit(s) added to main warehouse.`, 'success');
  }, [state.orders, state.inventory, notify]);

  const sendOrderEmail = useCallback((order) => {
    const sup = state.suppliers[order.supplier] || {};
    const updatedOrder = {
      ...order,
      status: 'sent',
      updatedAt: new Date().toISOString(),
      emailSent: { sentAt: new Date().toISOString(), sentTo: sup.contactEmail || 'unknown', messageId: `email_${Date.now()}` },
    };
    const updatedOrders = state.orders.map(o => o.id === order.id ? updatedOrder : o);
    dispatch({ type: 'SET_ORDERS', payload: updatedOrders });

    const accounts = { ...state.supplierAccounts };
    if (!accounts[order.supplier]) {
      accounts[order.supplier] = { balance: 0, paymentTerms: sup.paymentTerms || 'Net 30', contactEmail: sup.contactEmail || '', credits: [], payments: [], creditLimit: 2000000 };
    }
    const credit = { date: new Date().toISOString().split('T')[0], amount: order.totalCost, orderId: order.orderId, description: `Order for ${order.items.length} item(s)` };
    accounts[order.supplier] = { ...accounts[order.supplier], credits: [...(accounts[order.supplier].credits || []), credit] };
    accounts[order.supplier].balance = calculateSupplierBalance(accounts[order.supplier]);
    dispatch({ type: 'SET_SUPPLIER_ACCOUNTS', payload: accounts });

    notify(`Order ${order.orderId} sent to ${order.supplier}`, 'success');
  }, [state.orders, state.suppliers, state.supplierAccounts, notify]);

  const recordPayment = useCallback((supplierName, payment) => {
    const accounts = { ...state.supplierAccounts };
    if (!accounts[supplierName]) return;
    const acc = { ...accounts[supplierName], payments: [...(accounts[supplierName].payments || []), payment] };
    acc.balance = calculateSupplierBalance(acc);
    accounts[supplierName] = acc;
    dispatch({ type: 'SET_SUPPLIER_ACCOUNTS', payload: accounts });
    notify(`Payment of UGX ${payment.amount.toLocaleString()} recorded for ${supplierName}`, 'success');
  }, [state.supplierAccounts, notify]);

  const deleteOrder = useCallback((orderId) => {
    dispatch({ type: 'SET_ORDERS', payload: state.orders.filter(o => o.id !== orderId) });
    notify('Order deleted', 'success');
  }, [state.orders, notify]);

  const saveOrderRecord = useCallback((orderData) => {
    const newOrder = {
      ...orderData,
      id: `order_${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: orderData.status || 'ready_to_send',
    };
    dispatch({ type: 'SET_ORDERS', payload: [...state.orders, newOrder] });
    notify(`Order ${newOrder.orderId} saved to system.`, 'success');
    return newOrder;
  }, [state.orders, notify]);

  // ── Suppliers ───────────────────────────────────────────────────────────────
  const addSupplier = useCallback((name, details) => {
    if (state.suppliers[name]) throw new Error(`Supplier "${name}" already exists.`);
    dispatch({ type: 'SET_SUPPLIERS', payload: { ...state.suppliers, [name]: details } });
    notify(`Supplier "${name}" added.`, 'success');
  }, [state.suppliers, notify]);

  const updateSupplier = useCallback((name, details) => {
    if (!state.suppliers[name]) throw new Error(`Supplier "${name}" not found.`);
    dispatch({ type: 'SET_SUPPLIERS', payload: { ...state.suppliers, [name]: { ...state.suppliers[name], ...details } } });
    notify(`Supplier "${name}" updated.`, 'success');
  }, [state.suppliers, notify]);

  const deleteSupplier = useCallback((name) => {
    const updated = { ...state.suppliers };
    delete updated[name];
    dispatch({ type: 'SET_SUPPLIERS', payload: updated });
    notify(`Supplier "${name}" removed.`, 'success');
  }, [state.suppliers, notify]);

  // ── Products ─────────────────────────────────────────────────────────────────
  const addProduct = useCallback((product) => {
    const newProduct = { ...product, id: Date.now() };
    dispatch({ type: 'SET_PRODUCTS', payload: [...state.products, newProduct] });
    dispatch({ type: 'SET_INVENTORY', payload: { ...state.inventory, [newProduct.id]: product.initialStock ?? 0 } });
    notify(`"${newProduct.name}" added to inventory.`, 'success');
    return newProduct;
  }, [state.products, state.inventory, notify]);

  const updateProduct = useCallback((id, updates) => {
    dispatch({ type: 'SET_PRODUCTS', payload: state.products.map(p => p.id === id ? { ...p, ...updates } : p) });
    notify(`Product updated.`, 'success');
  }, [state.products, notify]);

  const deleteProduct = useCallback((id) => {
    dispatch({ type: 'SET_PRODUCTS', payload: state.products.filter(p => p.id !== id) });
    const newInventory = { ...state.inventory };
    delete newInventory[id];
    dispatch({ type: 'SET_INVENTORY', payload: newInventory });
    notify(`Product removed.`, 'success');
  }, [state.products, state.inventory, notify]);

  // ── Supplier catalogues ──────────────────────────────────────────────────────
  const addCatalogueItem = useCallback((supplierName, item) => {
    const sup = state.suppliers[supplierName];
    if (!sup) return;
    const newItem = { ...item, id: item.id || `ITEM-${Date.now()}` };
    const updated = { ...state.suppliers, [supplierName]: { ...sup, catalogue: [...(sup.catalogue || []), newItem] } };
    dispatch({ type: 'SET_SUPPLIERS', payload: updated });
    notify(`Item "${newItem.name}" added to ${supplierName} catalogue.`, 'success');
  }, [state.suppliers, notify]);

  const updateCatalogueItem = useCallback((supplierName, itemId, updates) => {
    const sup = state.suppliers[supplierName];
    if (!sup) return;
    const newCatalogue = (sup.catalogue || []).map(i => i.id === itemId ? { ...i, ...updates } : i);
    dispatch({ type: 'SET_SUPPLIERS', payload: { ...state.suppliers, [supplierName]: { ...sup, catalogue: newCatalogue } } });
    notify(`Catalogue item updated.`, 'success');
  }, [state.suppliers, notify]);

  const deleteCatalogueItem = useCallback((supplierName, itemId) => {
    const sup = state.suppliers[supplierName];
    if (!sup) return;
    const newCatalogue = (sup.catalogue || []).filter(i => i.id !== itemId);
    dispatch({ type: 'SET_SUPPLIERS', payload: { ...state.suppliers, [supplierName]: { ...sup, catalogue: newCatalogue } } });
    notify(`Catalogue item removed.`, 'success');
  }, [state.suppliers, notify]);

  const hasPermission = useCallback((perm) => {
    return ROLES[state.currentRole]?.permissions.includes(perm) ?? false;
  }, [state.currentRole]);

  // ── Locations ────────────────────────────────────────────────────────────────
  const addLocation = useCallback((data) => {
    const newLocation = { ...data, id: `loc_${Date.now()}`, active: true, createdAt: new Date().toISOString() };
    dispatch({ type: 'SET_LOCATIONS', payload: [...state.locations, newLocation] });
    notify(`Location "${newLocation.name}" added.`, 'success');
    return newLocation;
  }, [state.locations, notify]);

  const updateLocation = useCallback((id, data) => {
    const updated = state.locations.map(l => l.id === id ? { ...l, ...data } : l);
    dispatch({ type: 'SET_LOCATIONS', payload: updated });
    notify('Location updated.', 'success');
  }, [state.locations, notify]);

  const deleteLocation = useCallback((id) => {
    dispatch({ type: 'SET_LOCATIONS', payload: state.locations.filter(l => l.id !== id) });
    const newLocInv = { ...state.locationInventory };
    delete newLocInv[id];
    dispatch({ type: 'SET_LOCATION_INVENTORY', payload: newLocInv });
    notify('Location removed.', 'success');
  }, [state.locations, state.locationInventory, notify]);

  // ── Transfer orders ──────────────────────────────────────────────────────────
  const createTransferOrder = useCallback((data) => {
    const newTransfer = {
      ...data,
      id: `transfer_${Date.now()}`,
      orderId: generateTransferOrderId(state.transferOrders),
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    dispatch({ type: 'SET_TRANSFER_ORDERS', payload: [...state.transferOrders, newTransfer] });
    notify(`Transfer ${newTransfer.orderId} created — awaiting approval.`, 'info');
    return newTransfer;
  }, [state.transferOrders, notify]);

  const updateTransferStatus = useCallback((id, newStatus, extras = {}) => {
    const updated = state.transferOrders.map(t =>
      t.id !== id ? t : { ...t, status: newStatus, updatedAt: new Date().toISOString(), ...extras }
    );
    dispatch({ type: 'SET_TRANSFER_ORDERS', payload: updated });
  }, [state.transferOrders]);

  /** Confirm transfer received at dark store — moves stock from main warehouse to location */
  const receiveTransfer = useCallback((transferId, receivedItems) => {
    const transfer = state.transferOrders.find(t => t.id === transferId);
    if (!transfer) return;

    // 1. Update transfer record
    const updatedTransfers = state.transferOrders.map(t =>
      t.id !== transferId ? t : {
        ...t,
        status: 'received',
        updatedAt: new Date().toISOString(),
        receivedItems,
        receivedAt: new Date().toISOString(),
      }
    );
    dispatch({ type: 'SET_TRANSFER_ORDERS', payload: updatedTransfers });

    // 2. Deduct from main warehouse
    const newInventory = { ...state.inventory };
    receivedItems.forEach(item => {
      if (item.productId != null) {
        newInventory[item.productId] = Math.max(0, (newInventory[item.productId] || 0) - (item.receivedQty || 0));
      }
    });
    dispatch({ type: 'SET_INVENTORY', payload: newInventory });

    // 3. Add to destination location inventory
    const newLocInv = { ...state.locationInventory };
    if (!newLocInv[transfer.toLocationId]) newLocInv[transfer.toLocationId] = {};
    receivedItems.forEach(item => {
      if (item.productId != null) {
        newLocInv[transfer.toLocationId][item.productId] =
          (newLocInv[transfer.toLocationId][item.productId] || 0) + (item.receivedQty || 0);
      }
    });
    dispatch({ type: 'SET_LOCATION_INVENTORY', payload: newLocInv });

    notify(`Transfer ${transfer.orderId} received at ${transfer.toLocationName}.`, 'success');
  }, [state.transferOrders, state.inventory, state.locationInventory, notify]);

  const deleteTransferOrder = useCallback((id) => {
    dispatch({ type: 'SET_TRANSFER_ORDERS', payload: state.transferOrders.filter(t => t.id !== id) });
    notify('Transfer order deleted.', 'success');
  }, [state.transferOrders, notify]);

  /** Save a physical stock count session and update main warehouse inventory */
  const recordStockCount = useCallback((countData) => {
    // countData: { counts: {productId: qty}, countedBy, notes, source }
    const session = {
      id: `sc_${Date.now()}`,
      date: new Date().toISOString(),
      countedBy: countData.countedBy || 'Unknown',
      notes: countData.notes || '',
      counts: countData.counts,
      itemCount: Object.keys(countData.counts).length,
      source: countData.source || 'manual',
    };

    const newInventory = { ...state.inventory, ...countData.counts };
    dispatch({ type: 'SET_INVENTORY', payload: newInventory });
    dispatch({ type: 'SET_STOCK_COUNTS', payload: [session, ...state.stockCounts].slice(0, 50) });
    notify(`Stock count saved — ${session.itemCount} product(s) updated by ${session.countedBy}.`, 'success');

    // Auto-generate draft reorders for any items now below threshold
    const newDrafts = generateDraftOrders(newInventory, state.orders, state.products, state.suppliers);
    if (newDrafts.length > 0) {
      dispatch({ type: 'SET_ORDERS', payload: [...state.orders, ...newDrafts] });
      newDrafts.forEach(o => notify(`Reorder draft created: ${o.supplier} — ${o.items.length} item(s)`, 'info'));
    }
  }, [state.inventory, state.stockCounts, state.orders, state.products, state.suppliers, notify]);

  const setPosApiUrl = useCallback((url) => {
    dispatch({ type: 'SET_POS_API_URL', payload: url });
  }, []);

  const value = {
    ...state,
    dispatch,
    notify,
    // Inventory
    updateInventory,
    // Purchase orders
    updateOrderStatus,
    markAcknowledged,
    markDispatched,
    receiveOrder,
    sendOrderEmail,
    deleteOrder,
    saveOrderRecord,
    // Supplier accounts
    recordPayment,
    // Suppliers
    addSupplier,
    updateSupplier,
    deleteSupplier,
    // Products
    addProduct,
    updateProduct,
    deleteProduct,
    // Catalogues
    addCatalogueItem,
    updateCatalogueItem,
    deleteCatalogueItem,
    // Permissions
    hasPermission,
    // Locations
    addLocation,
    updateLocation,
    deleteLocation,
    // Transfer orders
    createTransferOrder,
    updateTransferStatus,
    receiveTransfer,
    deleteTransferOrder,
    // Stock counts
    recordStockCount,
    setPosApiUrl,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be inside AppProvider');
  return ctx;
};
