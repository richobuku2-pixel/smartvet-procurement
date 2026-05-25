export const PRODUCTS = [
  { id: 1, name: 'Newcastle Disease Vaccine (I2)', supplier: 'Eram Uganda Ltd', unit: 'Units', reorderPoint: 10, minStock: 5, landedCost: 85000, wholesalePrice: 120000, retailPrice: 150000 },
  { id: 2, name: 'Newcastle Oil Adjuvant Vaccine', supplier: 'Bukola Chemicals', unit: 'Units', reorderPoint: 10, minStock: 5, landedCost: 90000, wholesalePrice: 130000, retailPrice: 160000 },
  { id: 3, name: 'Enroflo/Enrofloxacin', supplier: 'Eram Uganda Ltd', unit: 'Bottles', reorderPoint: 5, minStock: 2, landedCost: 45000, wholesalePrice: 60000, retailPrice: 75000 },
  { id: 4, name: 'Gumboro Vaccine (Live)', supplier: 'Eram Uganda Ltd', unit: 'Units', reorderPoint: 10, minStock: 5, landedCost: 100000, wholesalePrice: 140000, retailPrice: 175000 },
  { id: 5, name: 'Gumboro Oil Adjuvant Vaccine', supplier: 'Bukola Chemicals', unit: 'Units', reorderPoint: 10, minStock: 5, landedCost: 105000, wholesalePrice: 145000, retailPrice: 180000 },
  { id: 6, name: 'Amprolium 20%', supplier: 'Eram Uganda Ltd', unit: 'Liters', reorderPoint: 15, minStock: 8, landedCost: 90000, wholesalePrice: 120000, retailPrice: 150000 },
  { id: 7, name: 'Toltrazuril 2.5%', supplier: 'Bukola Chemicals', unit: 'Liters', reorderPoint: 12, minStock: 6, landedCost: 110000, wholesalePrice: 150000, retailPrice: 185000 },
  { id: 8, name: 'Diclazuril', supplier: 'Eram Uganda Ltd', unit: 'Liters', reorderPoint: 10, minStock: 5, landedCost: 130000, wholesalePrice: 170000, retailPrice: 210000 },
  { id: 9, name: 'Levamisole 7.5%', supplier: 'Eram Uganda Ltd', unit: 'Liters', reorderPoint: 15, minStock: 8, landedCost: 75000, wholesalePrice: 100000, retailPrice: 125000 },
  { id: 10, name: 'Albendazole 2.5%', supplier: 'Bukola Chemicals', unit: 'Liters', reorderPoint: 12, minStock: 6, landedCost: 95000, wholesalePrice: 125000, retailPrice: 155000 },
  { id: 11, name: 'Fenbendazole 5%', supplier: 'Eram Uganda Ltd', unit: 'kg', reorderPoint: 10, minStock: 5, landedCost: 105000, wholesalePrice: 140000, retailPrice: 175000 },
  { id: 12, name: 'Piperazine 4%', supplier: 'Bukola Chemicals', unit: 'Liters', reorderPoint: 8, minStock: 4, landedCost: 70000, wholesalePrice: 92000, retailPrice: 115000 },
  { id: 13, name: 'Vitamin/Mineral Complex', supplier: 'Eram Uganda Ltd', unit: 'Liters', reorderPoint: 10, minStock: 5, landedCost: 65000, wholesalePrice: 85000, retailPrice: 110000 },
  { id: 14, name: 'Probiotic/Prebiotic', supplier: 'Bukola Chemicals', unit: 'kg', reorderPoint: 8, minStock: 4, landedCost: 120000, wholesalePrice: 160000, retailPrice: 200000 },
];

export const SUPPLIERS = {
  'Eram Uganda Ltd': {
    contactEmail: 'orders@eram.ug',
    contactPerson: 'Sales Team',
    phone: '+256-414-235628',
    mobilePhone: '+256 701 234567',
    location: 'Kampala, Uganda',
    address: 'ERAM House, Plot 3 Hoima Road, Bakuli, P.O. Box 11304, Kampala',
    web: 'erampharmacueticals.com',
    paymentTerms: 'Net 30',
    minimumOrderQuantity: 3,
    leadTimeDays: 5,
    notes: "Uganda's #1 animal health provider. Est. 1996. Principals: HIPRA, MSD/Intervet, VMD, Cosmos.",
    catalogue: [], // populated by AppContext on first load
  },
  'Bukola Chemicals': {
    contactEmail: 'sales@bukola.ug',
    contactPerson: 'Marketing Manager',
    phone: '+256 702 345678',
    location: 'Kampala, Uganda',
    paymentTerms: 'Net 30',
    minimumOrderQuantity: 2,
    leadTimeDays: 7,
    catalogue: [],
  },
  'Global Vet (U) Ltd': {
    contactEmail: 'globalvet@infocom.co.ug',
    contactPerson: '',
    phone: '+256-41 4 507055',
    mobilePhone: '+256-77 6 421315',
    fax: '+256-41 4 235157',
    location: 'Kampala, Uganda',
    address: 'Plot 14/18 Nakivubo Place, Venus Plaza, Shop No.V001, P.O Box 4860 Kampala',
    web: 'www.globalvetug.com',
    paymentTerms: 'Net 30',
    minimumOrderQuantity: 1,
    leadTimeDays: 3,
    notes: 'Dealers in Veterinary Pharmaceuticals, Animal Feeds Supplements & Equipment',
    catalogue: [], // populated by AppContext on first load
  },
  'Bukoola Vet': {
    contactEmail: 'info@bukoolavet.com',
    contactPerson: '',
    phone: '+256 312 260 200',
    location: 'Kampala, Uganda',
    address: 'Bukoola House, Plot 10 Nakivubo Road, Kampala',
    web: 'bukoolavet.com',
    paymentTerms: 'Net 30',
    minimumOrderQuantity: 1,
    leadTimeDays: 3,
    notes: 'Vertically integrated veterinary pharmaceutical manufacturer & distributor. Est. 2017.',
    catalogue: [], // populated by AppContext on first load
  },
  'Ultravetis Uganda': {
    contactEmail: 'uganda@ultravetis.com',
    contactPerson: '',
    phone: '+256 312 000 000',
    location: 'Nakawa, Kampala',
    address: 'Plot 28, Jinja Road, Nakawa, Kampala',
    web: 'ultravetis.com',
    paymentTerms: 'Net 30',
    minimumOrderQuantity: 1,
    leadTimeDays: 5,
    notes: 'Kenyan-founded company supplying veterinary health, hygiene products, seeds & agrochemicals across East Africa.',
    catalogue: [], // populated by AppContext on first load
  },
  'Norbrook Uganda': {
    contactEmail: 'info@norbrook.com',
    contactPerson: '',
    phone: '+256 414 000 000',
    location: 'Banda, Kampala',
    address: 'Plot 703 Banda, Jinja Road, Warehouses No.6 & 7, Kampala',
    web: 'norbrook.com/ea',
    paymentTerms: 'Net 30',
    minimumOrderQuantity: 1,
    leadTimeDays: 7,
    notes: 'Subsidiary of Norbrook Laboratories Ltd (N. Ireland). No. 1 animal healthcare company in Kenya.',
    catalogue: [], // populated by AppContext on first load
  },
  'ConcFeed International': {
    contactEmail: 'info@concfeed.com',
    contactPerson: 'Sales Team',
    phone: '+256 700 000000',
    location: 'Kampala, Uganda',
    address: 'Kampala, Uganda',
    web: 'concfeed.com',
    paymentTerms: 'Net 30',
    minimumOrderQuantity: 1,
    leadTimeDays: 5,
    notes: 'Specialist in livestock nutritional supplements. Distributors of Glucovit, electrolytes, growth promoters and mineral supplements across East Africa.',
    catalogue: [],
  },
  'Sanga Vet Chem Ltd': {
    contactEmail: 'info@sangavetchem.com',
    contactPerson: '',
    phone: '+256 772 000 000',
    location: 'Namanve, Mukono',
    address: 'Plot 1144, Kampala Industrial Business Park, Namanve, Mukono District',
    web: 'sangavetchem.com',
    paymentTerms: 'Net 30',
    minimumOrderQuantity: 1,
    leadTimeDays: 2,
    notes: 'NDA-licensed local Ugandan manufacturer. Products: acaricides, anthelmintics, wound care.',
    catalogue: [], // populated by AppContext on first load
  },
};

export const DEFAULT_INVENTORY = Object.fromEntries(PRODUCTS.map(p => [p.id, p.reorderPoint + 5]));

export const ROLES = {
  procurement_manager: { label: 'Procurement Manager', permissions: ['approve_procurement', 'view_all_orders', 'add_comments'] },
  accounts_manager: { label: 'Accounts Manager', permissions: ['approve_accounts', 'record_payments', 'view_accounts'] },
  inventory_manager: { label: 'Inventory Manager', permissions: ['update_inventory', 'view_orders'] },
  admin: { label: 'Admin', permissions: ['approve_procurement', 'approve_accounts', 'record_payments', 'update_inventory', 'view_all_orders', 'view_accounts', 'add_comments'] },
};

export const SEED_PASSWORD = 'smartvet2026';

export const ORDER_STATUSES = {
  draft:                 { label: 'Draft',                 color: 'neutral',   step: 0 },
  pending_procurement:   { label: 'Pending Procurement',   color: 'warning',   step: 1 },
  pending_accounts:      { label: 'Pending Accounts',      color: 'secondary', step: 2 },
  ready_to_send:         { label: 'Ready to Send',         color: 'success',   step: 3 },
  sent:                  { label: 'Sent to Supplier',      color: 'primary',   step: 4 },
  supplier_acknowledged: { label: 'Supplier Acknowledged', color: 'info',      step: 5 },
  dispatched:            { label: 'In Transit',            color: 'primary',   step: 6 },
  received:              { label: 'Received',              color: 'success',   step: 7 },
  rejected:              { label: 'Rejected',              color: 'danger',    step: -1 },
};

// Ordered pipeline steps (rejected is not a step)
export const PO_PIPELINE = [
  { key: 'draft',                 short: 'Draft'    },
  { key: 'pending_procurement',   short: 'Procure'  },
  { key: 'pending_accounts',      short: 'Accounts' },
  { key: 'ready_to_send',         short: 'Ready'    },
  { key: 'sent',                  short: 'Sent'     },
  { key: 'supplier_acknowledged', short: 'Confirmed'},
  { key: 'dispatched',            short: 'Transit'  },
  { key: 'received',              short: 'Received' },
];

export const LOCATIONS = [
  {
    id: 'loc_main',
    name: 'Main Warehouse',
    type: 'warehouse',
    isMain: true,
    address: 'Kampala, Uganda',
    contactPerson: '',
    contactPhone: '',
    contactEmail: '',
    active: true,
    createdAt: new Date().toISOString(),
  },
];

export const TRANSFER_STATUSES = {
  pending:    { label: 'Pending Approval', color: 'warning'  },
  approved:   { label: 'Approved',         color: 'success'  },
  picking:    { label: 'Picking',          color: 'secondary'},
  dispatched: { label: 'Dispatched',       color: 'primary'  },
  received:   { label: 'Received',         color: 'success'  },
  rejected:   { label: 'Rejected',         color: 'danger'   },
};
