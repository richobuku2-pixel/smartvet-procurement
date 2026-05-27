/**
 * SmartVet Africa — Shared Constants
 *
 * Centralises all magic strings, option lists, and configuration values
 * so they are defined once and imported wherever needed.
 */

// ── AppContext reducer action types ───────────────────────────────────────────
export const ACTION_TYPES = {
  SET_PRODUCTS:          'SET_PRODUCTS',
  SET_SUPPLIERS:         'SET_SUPPLIERS',
  SET_INVENTORY:         'SET_INVENTORY',
  SET_ORDERS:            'SET_ORDERS',
  SET_SUPPLIER_ACCOUNTS: 'SET_SUPPLIER_ACCOUNTS',
  SET_LOCATIONS:         'SET_LOCATIONS',
  SET_TRANSFER_ORDERS:   'SET_TRANSFER_ORDERS',
  SET_LOCATION_INVENTORY:'SET_LOCATION_INVENTORY',
  SET_STOCK_COUNTS:      'SET_STOCK_COUNTS',
  SET_POS_API_URL:       'SET_POS_API_URL',
  SET_AVAILABILITY_LOG:  'SET_AVAILABILITY_LOG',
  SET_PRICE_LOG:         'SET_PRICE_LOG',
  SET_PRICE_ADVISORY:    'SET_PRICE_ADVISORY',
  SET_ROLE:              'SET_ROLE',
  SET_TAB:               'SET_TAB',
  ADD_NOTIFICATION:      'ADD_NOTIFICATION',
  REMOVE_NOTIFICATION:   'REMOVE_NOTIFICATION',
  SET_MODAL:             'SET_MODAL',
};

// ── Availability status options (used in manual check-in selects) ─────────────
export const STATUS_OPTS = [
  { value: 'skip',         label: '— Skip —'      },
  { value: 'in_stock',     label: '✓ In Stock'     },
  { value: 'low_stock',    label: '⚠ Low Stock'    },
  { value: 'out_of_stock', label: '✕ Out of Stock' },
];

// ── Quick-log availability buttons ────────────────────────────────────────────
export const STATUS_BTNS = [
  {
    value:   'in_stock',
    icon:    '✓',
    cls:     'bg-green-500 hover:bg-green-600 text-white',
    idleCls: 'bg-gray-100 text-gray-400 hover:bg-green-100 hover:text-green-700',
  },
  {
    value:   'low_stock',
    icon:    '⚠',
    cls:     'bg-amber-400 hover:bg-amber-500 text-white',
    idleCls: 'bg-gray-100 text-gray-400 hover:bg-amber-100 hover:text-amber-700',
  },
  {
    value:   'out_of_stock',
    icon:    '✕',
    cls:     'bg-red-500 hover:bg-red-600 text-white',
    idleCls: 'bg-gray-100 text-gray-400 hover:bg-red-100 hover:text-red-600',
  },
];

// ── Supplier payment terms ────────────────────────────────────────────────────
export const PAYMENT_TERMS = [
  'Net 15',
  'Net 30',
  'Net 60',
  'Cash on Delivery',
  'Prepayment',
];

// ── Pricing advisory — markup tiers ──────────────────────────────────────────
// Research-backed defaults for the Uganda veterinary market.
// Wholesale = sell to vet clinics / bulk buyers.
// Retail    = sell direct to farmers / small buyers.
export const MARKUP_TIERS = {
  wholesale: { pct: 25, label: 'Wholesale',    description: 'To vet clinics / bulk buyers',   color: 'blue'   },
  standard:  { pct: 35, label: 'Standard',     description: 'Default recommended margin',      color: 'teal'   },
  retail:    { pct: 45, label: 'Retail',        description: 'Direct to farmers / small buyers', color: 'green'  },
};

// ── Order priority levels ─────────────────────────────────────────────────────
export const PRIORITY_LEVELS = ['★★★', '★★', '★'];

export const PRIORITY_META = {
  '★★★': { label: 'High',   color: 'text-red-500'   },
  '★★':  { label: 'Medium', color: 'text-amber-500' },
  '★':   { label: 'Low',    color: 'text-gray-300'  },
};

// ── Currency ──────────────────────────────────────────────────────────────────
export const CURRENCY = 'UGX';
export const VAT_RATE  = 0.18; // 18% Uganda standard VAT
