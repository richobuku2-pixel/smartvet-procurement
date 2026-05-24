import { formatDate, formatCurrency, addDays } from './formatter';
import { SUPPLIERS } from '../data/seedData';

export const buildSupplierEmail = (order) => {
  const sup = SUPPLIERS[order.supplier] || {};
  const deliveryDate = formatDate(addDays(new Date().toISOString(), sup.leadTimeDays || 7));
  const itemLines = order.items.map(
    i => `  • ${i.productName}: ${i.quantity} ${i.unit} @ ${formatCurrency(i.unitCost)}`
  ).join('\n');

  const subject = `Purchase Order from SmartVet Africa - ${order.orderId}`;
  const body = `Dear ${sup.contactPerson || 'Sales Team'},

Please find our purchase order details below:

Order ID: ${order.orderId}
Order Date: ${formatDate(new Date().toISOString())}
Required Delivery Date: ${deliveryDate}

Items:
${itemLines}

Total Order Value: ${formatCurrency(order.totalCost)}
Payment Terms: ${sup.paymentTerms || 'Net 30'}

Please confirm receipt of this order and provide:
1. Acknowledgment of order receipt
2. Expected delivery date
3. Invoice reference

Contact: SmartVet Africa Procurement Team | procurement@smartvet.ug

Thank you for your continued partnership.

Best regards,
SmartVet Africa
P.O. Box 1234, Kampala, Uganda`;

  return { to: sup.contactEmail, subject, body };
};

export const buildProcurementNotification = (order) => ({
  subject: `Order Approval Needed - ${order.supplier}, ${formatCurrency(order.totalCost)}`,
  body: `An order is ready for your approval:\n\nSupplier: ${order.supplier}\nTotal: ${formatCurrency(order.totalCost)}\nItems: ${order.items.length} products\nCreated: ${formatDate(order.createdAt)}\n\nPlease review and approve in the Approvals tab.`,
});

export const buildAccountsNotification = (order, supplierBalance) => ({
  subject: `Payment Approval Needed - ${order.supplier}, ${formatCurrency(order.totalCost)}`,
  body: `Order approved by procurement. Awaiting payment confirmation:\n\nSupplier: ${order.supplier}\nAmount: ${formatCurrency(order.totalCost)}\nCurrent Balance: ${formatCurrency(supplierBalance)}\nTerms: ${SUPPLIERS[order.supplier]?.paymentTerms || 'Net 30'}\n\nPlease review in the Approvals tab.`,
});
