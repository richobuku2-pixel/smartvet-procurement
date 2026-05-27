/**
 * context/appReducer.js
 *
 * Pure reducer function for the AppContext. Handles all state slice updates
 * dispatched by AppProvider actions.
 *
 * Each case replaces one top-level state key; no side effects are performed here.
 */

export function reducer(state, action) {
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
    case 'SET_AVAILABILITY_LOG':   return { ...state, availabilityLog: action.payload };
    case 'SET_PRICE_LOG':          return { ...state, priceLog: action.payload };
    case 'SET_ROLE':               return { ...state, currentRole: action.payload };
    case 'SET_TAB':                return { ...state, activeTab: action.payload };
    case 'ADD_NOTIFICATION':
      return { ...state, notifications: [...state.notifications, action.payload] };
    case 'REMOVE_NOTIFICATION':
      return { ...state, notifications: state.notifications.filter(n => n.id !== action.payload) };
    case 'SET_MODAL':
      return { ...state, modals: { ...state.modals, [action.key]: action.value } };
    default:
      return state;
  }
}
