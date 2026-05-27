/**
 * orders/PipelineBar.jsx
 *
 * Mini pipeline progress bar for the Orders table. Shows coloured dots
 * representing each stage in the purchase-order pipeline.
 *
 * Props:
 *   status {string} — current order status key (e.g. 'sent', 'dispatched')
 */

import { ORDER_STATUSES, PO_PIPELINE } from '../../data/seedData';

export default function PipelineBar({ status }) {
  const currentStep = ORDER_STATUSES[status]?.step ?? 0;
  if (status === 'rejected') {
    return <span className="text-xs text-red-500 font-medium">Rejected</span>;
  }
  return (
    <div className="flex items-center gap-0.5">
      {PO_PIPELINE.map((s, i) => {
        const done    = i < currentStep;
        const current = i === currentStep;
        return (
          <div key={s.key} className="flex items-center gap-0.5">
            <div
              title={s.short}
              className={`w-2 h-2 rounded-full flex-shrink-0 ${
                done    ? 'bg-green-500' :
                current ? 'bg-teal-500 ring-2 ring-teal-200' :
                          'bg-gray-200'
              }`}
            />
            {i < PO_PIPELINE.length - 1 && (
              <div className={`w-3 h-px flex-shrink-0 ${done ? 'bg-green-300' : 'bg-gray-200'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
