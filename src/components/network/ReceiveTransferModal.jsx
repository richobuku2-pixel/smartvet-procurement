/**
 * network/ReceiveTransferModal.jsx
 *
 * Modal for confirming receipt of a stock transfer at a dark store / branch.
 * Requires an explicit signature click before the receipt can be confirmed.
 * Signature is saved per-user so they only upload once.
 */
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import SignatureCapture from '../SignatureCapture';

export default function ReceiveTransferModal({ transfer, onClose, onConfirm }) {
  const { currentUser } = useAuth();
  const userKey = currentUser?.email || currentUser?.id || 'unknown';

  const initQtys = Object.fromEntries(
    (transfer.items || []).map(i => [i.productId, i.quantity])
  );
  const [qtys, setQtys]     = useState(initQtys);
  const [notes, setNotes]   = useState('');
  const [signature, setSignature] = useState(null);  // base64 image
  const [signed, setSigned] = useState(false);

  const hasDisc = (transfer.items || []).some(
    i => Number(qtys[i.productId]) !== i.quantity
  );

  const handleSign = (base64) => {
    setSignature(base64);
    setSigned(true);
  };

  const handleClearSign = () => {
    setSignature(null);
    setSigned(false);
  };

  const handleConfirm = () => {
    if (!signed || !signature) return;
    const receivedItems = (transfer.items || []).map(i => ({
      productId:   i.productId,
      productName: i.productName,
      receivedQty: Number(qtys[i.productId] ?? 0),
    }));
    onConfirm(receivedItems, notes, {
      signedBy:    currentUser?.name || currentUser?.email || 'Unknown',
      signedAt:    new Date().toISOString(),
      signatureImg: signature,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
          <div>
            <h2 className="font-bold text-gray-900">Confirm Receipt — {transfer.orderId}</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Recording arrival at <strong>{transfer.toLocationName}</strong>
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
        </div>

        <div className="p-6 space-y-5">

          {/* Items table */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Items</p>
            <div className="rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-xs text-gray-500 border-b border-gray-200">
                    <th className="px-3 py-2 text-left font-semibold">Product</th>
                    <th className="px-3 py-2 text-right font-semibold">Ordered</th>
                    <th className="px-3 py-2 text-right font-semibold">Received</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {(transfer.items || []).map(item => {
                    const rec  = Number(qtys[item.productId] ?? 0);
                    const disc = rec !== item.quantity;
                    return (
                      <tr key={item.productId} className={disc ? 'bg-amber-50' : ''}>
                        <td className="px-3 py-2 text-gray-700">{item.productName}</td>
                        <td className="px-3 py-2 text-right text-gray-500">{item.quantity}</td>
                        <td className="px-3 py-2 text-right">
                          <input
                            type="number" min={0}
                            value={qtys[item.productId] ?? item.quantity}
                            onChange={e => setQtys(prev => ({ ...prev, [item.productId]: e.target.value }))}
                            className="w-20 border border-gray-300 rounded px-2 py-1 text-sm text-right focus:outline-none focus:ring-2 focus:ring-green-400"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {hasDisc && (
              <div className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-2">
                <span>⚠️</span>
                <span>Quantity discrepancies detected. Stock will be updated with received amounts only.</span>
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Notes</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 resize-none"
              placeholder="Condition notes, discrepancy reasons…"
            />
          </div>

          {/* Signature — required before confirm */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
              Receiver Signature <span className="text-red-400 normal-case font-normal">* required to confirm</span>
            </p>
            <SignatureCapture
              userKey={userKey}
              onSign={handleSign}
              onClear={handleClearSign}
              signed={signed}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50 rounded-b-2xl sticky bottom-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!signed}
            className="px-5 py-2 text-sm bg-green-700 hover:bg-green-800 disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold rounded-lg transition-colors"
          >
            📦 Confirm Receipt
          </button>
        </div>
      </div>
    </div>
  );
}
