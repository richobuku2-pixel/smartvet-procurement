import { generateOrderId } from './formatter';

export const getStockStatus = (product, currentStock) => {
  if (currentStock <= product.minStock) return 'critical';
  if (currentStock <= product.reorderPoint) return 'low';
  return 'ok';
};

/**
 * Generate draft orders for products that have fallen below their reorder point.
 * Accepts live products + suppliers from AppContext so new products are included.
 */
export const generateDraftOrders = (inventory, existingOrders = [], products = [], suppliers = {}) => {
  const bySupplier = {};

  products.forEach(product => {
    const stock = inventory[product.id] ?? 0;
    if (stock < product.reorderPoint) {
      const qty = product.reorderPoint + 5 - stock;
      if (!bySupplier[product.supplier]) bySupplier[product.supplier] = [];
      bySupplier[product.supplier].push({
        productId: product.id,
        productName: product.name,
        quantity: qty,
        unitCost: product.landedCost,
        lineCost: qty * product.landedCost,
        unit: product.unit,
      });
    }
  });

  const newOrders = [];
  Object.entries(bySupplier).forEach(([supplier, items]) => {
    const supplierInfo = suppliers[supplier];
    if (!supplierInfo) return;
    const totalQty = items.reduce((s, i) => s + i.quantity, 0);
    if (totalQty < supplierInfo.minimumOrderQuantity) return;

    const hasDraft = existingOrders.some(
      o => o.supplier === supplier && o.status === 'draft'
    );
    if (hasDraft) return;

    const allOrders = [...existingOrders, ...newOrders];
    const totalCost = items.reduce((s, i) => s + i.lineCost, 0);
    newOrders.push({
      id: `order_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      orderId: generateOrderId(allOrders),
      supplier,
      items,
      totalCost,
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'inventory_manager',
      procurementApproval: null,
      accountsApproval: null,
      emailSent: null,
      deliveryStatus: { expectedDeliveryDate: null, actualDeliveryDate: null, receivedBy: null, notes: null },
    });
  });

  return newOrders;
};

export const calculateSupplierBalance = (account) => {
  if (!account) return 0;
  const credits = (account.credits || []).reduce((s, c) => s + c.amount, 0);
  const payments = (account.payments || []).reduce((s, p) => s + p.amount, 0);
  return credits - payments;
};
