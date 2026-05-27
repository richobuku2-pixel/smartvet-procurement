/**
 * context/initialState.js
 *
 * Computes the initial Redux-style state for the AppContext reducer.
 * Reads from localStorage via the storage utility, seeds supplier catalogues
 * on first run, and applies catalogue patches for new items.
 *
 * Returns:
 *   {Object} — full initial state object consumed by useReducer in AppProvider
 */

import { storage } from '../utils/storage';
import { PRODUCTS, SUPPLIERS, DEFAULT_INVENTORY, LOCATIONS } from '../data/seedData';
import {
  makeGlobalVetSupplier,
  makeEramSupplier,
  makeBukoolaVetSupplier,
  makeUltravetisSupplier,
  makeNorbrookSupplier,
  makeSangaVetSupplier,
  makeConcFeedSupplier,
  GLOBAL_VET_CATALOGUE,
} from '../data/supplierCatalogues';

export const initialState = () => {
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
    ['Norbrook Uganda',          makeNorbrookSupplier],
    ['Sanga Vet Chem Ltd',       makeSangaVetSupplier],
    ['ConcFeed International',   makeConcFeedSupplier],
  ];
  for (const [name, makeFn] of CATALOGUE_SEEDERS) {
    if (!suppliers[name] || !suppliers[name].catalogue.length) {
      const seeded = makeFn();
      suppliers[name] = { ...(suppliers[name] || {}), ...seeded };
    }
  }

  // ── Catalogue patch: inject new items that may be missing from existing localStorage ──
  const GV_PATCH_IDS = ['DEW-01b'];
  const gv = suppliers['Global Vet (U) Ltd'];
  if (gv?.catalogue?.length) {
    const existingIds = new Set(gv.catalogue.map(i => i.id));
    const newItems = GLOBAL_VET_CATALOGUE.filter(i => GV_PATCH_IDS.includes(i.id) && !existingIds.has(i.id));
    if (newItems.length) {
      suppliers['Global Vet (U) Ltd'] = { ...gv, catalogue: [...gv.catalogue, ...newItems] };
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
    availabilityLog:   storage.get('availabilityLog', []),
    priceLog:          storage.get('priceLog', []),
    currentRole: storage.get('currentRole', 'admin'),
    currentUser: null,
    notifications: [],
    activeTab: 'dashboard',
    modals: {},
  };
};
