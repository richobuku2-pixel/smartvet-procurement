/**
 * PerformanceTab — Rider delivery performance metrics
 */
import { useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { timeAgo } from '../../utils/formatter';

const VEHICLE_ICON = { motorcycle: '🏍️', bicycle: '🚲', car: '🚗', van: '🚐' };

export default function PerformanceTab() {
  const { salesOrders, riders } = useApp();

  const riderStats = useMemo(() => {
    return riders.map(rider => {
      const assigned  = salesOrders.filter(o => o.assignedRiderId === rider.id);
      const delivered = assigned.filter(o => o.status === 'delivered');
      const failed    = assigned.filter(o => o.status === 'failed');
      const active    = assigned.filter(o => ['dispatched','in_transit'].includes(o.status));
      const total     = assigned.length;
      const successRate = total > 0 ? Math.round((delivered.length / total) * 100) : null;

      // Avg delivery time (dispatched → delivered)
      let avgHrs = null;
      const completedWithTimes = delivered.filter(o => o.fulfillmentLog?.length > 1);
      if (completedWithTimes.length > 0) {
        const times = completedWithTimes.map(o => {
          const dispatchEntry = o.fulfillmentLog?.find(e => e.status === 'dispatched');
          const deliverEntry  = o.fulfillmentLog?.find(e => e.status === 'delivered');
          if (!dispatchEntry || !deliverEntry) return null;
          return (new Date(deliverEntry.timestamp) - new Date(dispatchEntry.timestamp)) / 3_600_000;
        }).filter(Boolean);
        if (times.length > 0) avgHrs = (times.reduce((a,b) => a+b, 0) / times.length).toFixed(1);
      }

      // Last delivery
      const lastDelivery = delivered.length > 0
        ? delivered.sort((a,b) => new Date(b.updatedAt) - new Date(a.updatedAt))[0]
        : null;

      return { rider, assigned, delivered, failed, active, total, successRate, avgHrs, lastDelivery };
    }).sort((a,b) => b.delivered.length - a.delivered.length);
  }, [riders, salesOrders]);

  // Overall stats
  const overall = useMemo(() => ({
    totalOrders:   salesOrders.length,
    delivered:     salesOrders.filter(o => o.status === 'delivered').length,
    failed:        salesOrders.filter(o => o.status === 'failed').length,
    active:        salesOrders.filter(o => ['confirmed','picking','packed','dispatched','in_transit'].includes(o.status)).length,
  }), [salesOrders]);

  const overallRate = overall.totalOrders > 0
    ? Math.round((overall.delivered / overall.totalOrders) * 100)
    : 0;

  return (
    <div className="space-y-5">

      {/* Fleet overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Orders',    value: overall.totalOrders, color: 'text-gray-800'  },
          { label: 'Delivered',       value: overall.delivered,   color: 'text-green-700' },
          { label: 'Active Now',      value: overall.active,      color: 'text-blue-700'  },
          { label: 'Failed',          value: overall.failed,      color: 'text-red-600'   },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
            <p className="text-[10px] text-gray-400 uppercase font-semibold">{label}</p>
            <p className={`text-2xl font-black mt-0.5 ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Overall success rate bar */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-bold text-gray-800">Fleet Delivery Success Rate</p>
          <span className={`text-lg font-black ${overallRate >= 80 ? 'text-green-700' : overallRate >= 60 ? 'text-amber-600' : 'text-red-600'}`}>
            {overallRate}%
          </span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2.5">
          <div
            className={`h-2.5 rounded-full transition-all ${overallRate >= 80 ? 'bg-green-500' : overallRate >= 60 ? 'bg-amber-500' : 'bg-red-500'}`}
            style={{ width: `${overallRate}%` }}
          />
        </div>
        <p className="text-[11px] text-gray-400 mt-1.5">
          {overall.delivered} delivered · {overall.failed} failed · {overall.active} in progress
        </p>
      </div>

      {/* Per-rider cards */}
      {riders.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center shadow-sm">
          <p className="text-3xl mb-2">🏍️</p>
          <p className="text-gray-400 text-sm">No riders registered yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Per-Rider Performance</p>
          {riderStats.map(({ rider, delivered, failed, active, total, successRate, avgHrs, lastDelivery }) => (
            <div key={rider.id} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
              <div className="flex items-start gap-4 flex-wrap">

                {/* Rider info */}
                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-base font-bold">
                    {rider.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-800">{rider.name}</p>
                    <p className="text-xs text-gray-400">
                      {VEHICLE_ICON[rider.vehicleType] || '🚗'} {rider.vehicleType} · {rider.zone}
                    </p>
                  </div>
                </div>

                {/* Stats grid */}
                <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <Stat label="Assigned" value={total} color="text-gray-800" />
                  <Stat label="Delivered" value={delivered.length} color="text-green-700" />
                  <Stat label="Failed" value={failed.length} color={failed.length > 0 ? 'text-red-600' : 'text-gray-300'} />
                  <Stat label="Active" value={active.length} color="text-blue-600" />
                </div>

                {/* Success rate */}
                {successRate !== null && (
                  <div className="flex-shrink-0 text-center">
                    <p className={`text-2xl font-black ${successRate >= 80 ? 'text-green-700' : successRate >= 60 ? 'text-amber-600' : 'text-red-600'}`}>
                      {successRate}%
                    </p>
                    <p className="text-[10px] text-gray-400 uppercase font-semibold">Success</p>
                  </div>
                )}
              </div>

              {/* Progress bar + extra info */}
              {total > 0 && (
                <div className="mt-3 space-y-1.5">
                  <div className="w-full bg-gray-100 rounded-full h-1.5">
                    <div className="h-1.5 rounded-full bg-green-500"
                      style={{ width: `${(delivered.length / total) * 100}%` }} />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-gray-400 flex-wrap gap-2">
                    <span>{delivered.length} of {total} delivered</span>
                    {avgHrs && <span>Avg delivery: {avgHrs}h</span>}
                    {lastDelivery && <span>Last: {timeAgo(lastDelivery.updatedAt)}</span>}
                  </div>
                </div>
              )}

              {total === 0 && (
                <p className="text-xs text-gray-300 mt-2">No deliveries assigned yet.</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, color }) {
  return (
    <div className="bg-gray-50 rounded-lg p-2.5 text-center">
      <p className={`text-xl font-black ${color}`}>{value}</p>
      <p className="text-[10px] text-gray-400 uppercase font-semibold">{label}</p>
    </div>
  );
}
