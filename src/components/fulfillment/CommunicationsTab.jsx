/**
 * CommunicationsTab
 *
 * Shows the full SMS communications log for all sales orders.
 * Lets staff send manual messages to any customer.
 * Shows failed SMS so they can retry or call manually.
 */
import { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { timeAgo } from '../../utils/formatter';
import { STATUS_META } from './SalesOrderModal';

const STATUS_ICON = { sent: '✅', failed: '❌', sending: '⏳', skipped: '–' };
const STATUS_COLOR = {
  sent:    'bg-green-50 text-green-700 border-green-200',
  failed:  'bg-red-50 text-red-600 border-red-200',
  sending: 'bg-amber-50 text-amber-700 border-amber-200',
  skipped: 'bg-gray-50 text-gray-400 border-gray-100',
};

// Pre-built SMS templates — {soNumber}, {name}, {phone} are replaced at send time
const SMS_TEMPLATES = [
  {
    category: 'Delivery',
    icon: '🚚',
    templates: [
      { label: 'Rider on the way',      text: 'SmartVet: Hi {name}, your rider is almost at your location for order {soNumber}. Please be available to receive. Thank you!' },
      { label: 'Slight delay',          text: 'SmartVet: Hi {name}, delivery of order {soNumber} is running slightly late. Your order is still on the way — we apologize for the inconvenience.' },
      { label: 'Delayed — reschedule',  text: 'SmartVet: Hi {name}, we\'re unable to complete delivery of order {soNumber} today. Our team will contact you to arrange a new time. We apologize.' },
      { label: 'Unable to reach you',   text: 'SmartVet: Hi {name}, we attempted delivery of order {soNumber} but couldn\'t reach you. Please call us back to reschedule. Thank you.' },
      { label: 'Wrong address',         text: 'SmartVet: Hi {name}, our rider couldn\'t find your address for order {soNumber}. Please confirm your exact location by calling us. Thank you.' },
    ],
  },
  {
    category: 'Payment',
    icon: '💰',
    templates: [
      { label: 'Payment reminder',      text: 'SmartVet: Reminder — payment for order {soNumber} is pending. Please have your payment ready on delivery. Thank you, {name}.' },
      { label: 'Confirm cash on hand',  text: 'SmartVet: Hi {name}, our rider is heading to you with order {soNumber}. Please confirm you have the exact cash amount ready. Thank you!' },
      { label: 'Payment received',      text: 'SmartVet: Hi {name}, we have received your payment for order {soNumber}. Thank you for your business!' },
    ],
  },
  {
    category: 'Updates',
    icon: '📢',
    templates: [
      { label: 'Order being prepared',  text: 'SmartVet: Hi {name}, your order {soNumber} is currently being prepared at our warehouse. We\'ll notify you when it\'s dispatched.' },
      { label: 'Ready for dispatch',    text: 'SmartVet: Good news {name}! Order {soNumber} is packed and ready for dispatch. Delivery is coming your way soon.' },
      { label: 'Feedback request',      text: 'SmartVet: Hi {name}, thank you for your order {soNumber}! We hope you\'re happy with your delivery. Any feedback? Please reply or call us.' },
      { label: 'Holiday notice',        text: 'SmartVet: Hi {name}, please note that deliveries may be delayed due to the public holiday. Order {soNumber} will be delivered as soon as possible. We apologize.' },
    ],
  },
];

export default function CommunicationsTab() {
  const { salesOrders, communicationsLog, sendManualSMS, rescheduleSalesOrder } = useApp();
  const { currentUser } = useAuth();
  const by = currentUser?.name || currentUser?.email || 'Staff';

  const [search, setSearch]             = useState('');
  const [filterOrder, setFilterOrder]   = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [manualOrder, setManualOrder]   = useState('');
  const [manualMsg, setManualMsg]       = useState('');
  const [sending, setSending]           = useState(false);
  const [activeCategory, setActiveCategory] = useState(SMS_TEMPLATES[0].category);

  // Fill template placeholders with the selected order's real values
  const applyTemplate = (templateText) => {
    const order = salesOrders.find(o => o.id === manualOrder);
    if (!order) { setManualMsg(templateText); return; }
    const filled = templateText
      .replace(/\{soNumber\}/g, order.soNumber || '')
      .replace(/\{name\}/g,     order.customer?.name || 'Customer')
      .replace(/\{phone\}/g,    order.customer?.phone || '');
    setManualMsg(filled);
  };

  // Failed orders that need reschedule
  const failedOrders = useMemo(() =>
    salesOrders.filter(o => o.status === 'failed'), [salesOrders]);

  const recentOrders = useMemo(() =>
    [...salesOrders].sort((a,b) => new Date(b.updatedAt) - new Date(a.updatedAt)).slice(0, 50),
    [salesOrders]);

  const filtered = useMemo(() => {
    let rows = communicationsLog || [];
    if (filterOrder !== 'all') rows = rows.filter(r => r.orderId === filterOrder);
    if (filterStatus !== 'all') rows = rows.filter(r => r.status === filterStatus);
    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter(r =>
        r.soNumber?.toLowerCase().includes(q) ||
        r.customerName?.toLowerCase().includes(q) ||
        r.customerPhone?.includes(q) ||
        r.message?.toLowerCase().includes(q)
      );
    }
    return rows;
  }, [communicationsLog, filterOrder, filterStatus, search]);

  const handleManualSend = async () => {
    if (!manualOrder || !manualMsg.trim()) return;
    const order = salesOrders.find(o => o.id === manualOrder);
    if (!order) return;
    setSending(true);
    await sendManualSMS(order.id, order.customer?.phone, manualMsg, by);
    setManualMsg('');
    setSending(false);
  };

  const counts = useMemo(() => ({
    sent:   (communicationsLog || []).filter(c => c.status === 'sent').length,
    failed: (communicationsLog || []).filter(c => c.status === 'failed').length,
    total:  (communicationsLog || []).length,
  }), [communicationsLog]);

  return (
    <div className="space-y-5">

      {/* Summary chips */}
      <div className="flex gap-3 flex-wrap">
        <div className="bg-white border border-gray-200 rounded-xl px-4 py-2.5 shadow-sm flex items-center gap-2">
          <span className="text-lg">💬</span>
          <div>
            <p className="text-lg font-black text-gray-900 leading-none">{counts.total}</p>
            <p className="text-[10px] text-gray-400 uppercase font-semibold">Total sent</p>
          </div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-2.5 shadow-sm flex items-center gap-2">
          <span className="text-lg">✅</span>
          <div>
            <p className="text-lg font-black text-green-700 leading-none">{counts.sent}</p>
            <p className="text-[10px] text-green-600 uppercase font-semibold">Delivered</p>
          </div>
        </div>
        {counts.failed > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 shadow-sm flex items-center gap-2">
            <span className="text-lg">❌</span>
            <div>
              <p className="text-lg font-black text-red-600 leading-none">{counts.failed}</p>
              <p className="text-[10px] text-red-500 uppercase font-semibold">Failed</p>
            </div>
          </div>
        )}
        {failedOrders.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 shadow-sm flex items-center gap-2">
            <span className="text-lg">🔄</span>
            <div>
              <p className="text-lg font-black text-amber-700 leading-none">{failedOrders.length}</p>
              <p className="text-[10px] text-amber-600 uppercase font-semibold">Need reschedule</p>
            </div>
          </div>
        )}
      </div>

      {/* Reschedule alerts */}
      {failedOrders.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-3">
          <p className="text-sm font-bold text-amber-800">🔄 Failed Deliveries — Action Required</p>
          {failedOrders.map(order => (
            <RescheduleRow key={order.id} order={order} onReschedule={rescheduleSalesOrder} by={by} />
          ))}
        </div>
      )}

      {/* Send a message */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 bg-gray-50">
          <p className="text-sm font-bold text-gray-800">Send Message</p>
          <p className="text-xs text-gray-400 mt-0.5">Pick a template or compose your own</p>
        </div>

        <div className="p-5 space-y-4">
          {/* Order selector */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Select Order</label>
            <select value={manualOrder} onChange={e => setManualOrder(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
              <option value="">Choose an order…</option>
              {recentOrders.map(o => (
                <option key={o.id} value={o.id}>
                  {o.soNumber} — {o.customer?.name} · {o.customer?.phone}
                </option>
              ))}
            </select>
          </div>

          {/* Template categories */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">Templates</label>

            {/* Category tabs */}
            <div className="flex gap-1 mb-3">
              {SMS_TEMPLATES.map(cat => (
                <button key={cat.category} type="button"
                  onClick={() => setActiveCategory(cat.category)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    activeCategory === cat.category
                      ? 'bg-green-700 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}>
                  {cat.icon} {cat.category}
                </button>
              ))}
            </div>

            {/* Template buttons */}
            {SMS_TEMPLATES.filter(c => c.category === activeCategory).map(cat => (
              <div key={cat.category} className="flex flex-wrap gap-2">
                {cat.templates.map(t => (
                  <button key={t.label} type="button"
                    onClick={() => applyTemplate(t.text)}
                    className="text-xs px-3 py-2 bg-gray-50 hover:bg-green-50 border border-gray-200 hover:border-green-300 text-gray-700 hover:text-green-800 rounded-lg font-medium transition-colors text-left">
                    {t.label}
                  </button>
                ))}
              </div>
            ))}
          </div>

          {/* Message preview / editor */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-gray-500 uppercase">Message</label>
              {manualMsg && (
                <button type="button" onClick={() => setManualMsg('')}
                  className="text-[10px] text-gray-400 hover:text-red-400">Clear</button>
              )}
            </div>
            <textarea
              value={manualMsg}
              onChange={e => setManualMsg(e.target.value)}
              placeholder="Select a template above, or type your message here…"
              rows={4}
              maxLength={320}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
            />
            <div className="flex items-center justify-between mt-1">
              <p className="text-[10px] text-gray-400">
                {manualMsg.length > 160
                  ? <span className="text-amber-600">⚠ {manualMsg.length} chars — will send as 2 SMS units</span>
                  : `${manualMsg.length}/160 characters`}
              </p>
              {!manualOrder && manualMsg.includes('{') && (
                <p className="text-[10px] text-amber-500">⚠ Select an order to fill placeholders</p>
              )}
            </div>
          </div>

          {/* Send button */}
          <button onClick={handleManualSend}
            disabled={!manualOrder || !manualMsg.trim() || sending}
            className="w-full py-2.5 bg-green-700 hover:bg-green-800 disabled:bg-gray-200 disabled:text-gray-400 text-white text-sm font-bold rounded-xl transition-colors">
            {sending ? '⏳ Sending…' : '📤 Send SMS'}
          </button>
        </div>
      </div>

      {/* Comms log */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        {/* Log filter bar */}
        <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-3 flex-wrap bg-gray-50">
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search messages…"
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-xs w-44 focus:outline-none focus:ring-2 focus:ring-green-400" />
          <select value={filterOrder} onChange={e => setFilterOrder(e.target.value)}
            className="text-xs border border-gray-300 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-green-400">
            <option value="all">All Orders</option>
            {recentOrders.map(o => <option key={o.id} value={o.id}>{o.soNumber} — {o.customer?.name}</option>)}
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="text-xs border border-gray-300 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-green-400">
            <option value="all">All Status</option>
            <option value="sent">Sent</option>
            <option value="failed">Failed</option>
          </select>
          <p className="text-[11px] text-gray-400 ml-auto">{filtered.length} message{filtered.length !== 1 ? 's' : ''}</p>
        </div>

        {filtered.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-3xl mb-2">💬</p>
            <p className="text-gray-400 text-sm">No messages yet — SMS notifications will appear here as orders progress.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filtered.map(entry => (
              <div key={entry.id} className="px-5 py-3 flex items-start gap-4 hover:bg-gray-50 transition-colors">
                <div className={`flex-shrink-0 text-[10px] font-bold px-2 py-1 rounded-full border ${STATUS_COLOR[entry.status] || STATUS_COLOR.skipped}`}>
                  {STATUS_ICON[entry.status] || '–'} {entry.status}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <span className="text-xs font-bold text-gray-800">{entry.soNumber}</span>
                    <span className="text-[10px] text-gray-400">{entry.customerName}</span>
                    <span className="text-[10px] text-gray-300">{entry.customerPhone}</span>
                    {entry.sentBy === 'manual' && (
                      <span className="text-[9px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full font-semibold border border-blue-100">manual</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed">{entry.message}</p>
                  {entry.reason && (
                    <p className="text-[10px] text-red-400 mt-0.5">Error: {entry.reason}</p>
                  )}
                </div>
                <p className="text-[10px] text-gray-300 flex-shrink-0 whitespace-nowrap">{timeAgo(entry.sentAt)}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Reschedule row for failed deliveries ──────────────────────────────────────
function RescheduleRow({ order, onReschedule, by }) {
  const [date, setDate]   = useState('');
  const [note, setNote]   = useState('');
  const [open, setOpen]   = useState(false);
  const attempts          = order.deliveryAttempts || 0;

  const handleReschedule = () => {
    onReschedule(order.id, date, note, by);
    setOpen(false);
  };

  return (
    <div className="bg-white border border-amber-100 rounded-xl p-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <span className="text-sm font-bold text-gray-800">{order.soNumber}</span>
          <span className="ml-2 text-xs text-gray-500">{order.customer?.name} · {order.customer?.phone}</span>
          {attempts > 0 && (
            <span className="ml-2 text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-semibold">
              Attempt {attempts}
            </span>
          )}
        </div>
        <button onClick={() => setOpen(v => !v)}
          className="text-xs px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg">
          🔄 Reschedule
        </button>
      </div>
      {open && (
        <div className="mt-3 flex gap-2 flex-wrap">
          <input type="date" value={date} onChange={e => setDate(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
          <input type="text" value={note} onChange={e => setNote(e.target.value)}
            placeholder="Reason or note…"
            className="flex-1 min-w-32 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
          <button onClick={handleReschedule}
            className="px-3 py-1.5 bg-green-700 hover:bg-green-800 text-white text-sm font-bold rounded-lg">
            Confirm & SMS
          </button>
          <button onClick={() => setOpen(false)} className="text-xs text-gray-400 hover:text-gray-600 px-2">Cancel</button>
        </div>
      )}
    </div>
  );
}
