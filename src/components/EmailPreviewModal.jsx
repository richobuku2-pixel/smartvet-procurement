import { buildSupplierEmail } from '../utils/emailTemplates';

export default function EmailPreviewModal({ order, onClose, onConfirmSend }) {
  if (!order) return null;
  const { to, subject, body } = buildSupplierEmail(order);

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 flex flex-col max-h-[90vh]">
        <div className="p-5 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Email Preview</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>
        <div className="p-5 overflow-y-auto flex-1 space-y-3">
          <div className="flex gap-2 text-sm">
            <span className="font-medium text-gray-500 w-16">To:</span>
            <span className="text-gray-800">{to}</span>
          </div>
          <div className="flex gap-2 text-sm">
            <span className="font-medium text-gray-500 w-16">Subject:</span>
            <span className="text-gray-800">{subject}</span>
          </div>
          <div className="border-t border-gray-100 pt-3">
            <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">{body}</pre>
          </div>
        </div>
        <div className="p-5 border-t border-gray-200 flex gap-3 justify-end">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
          <button onClick={onConfirmSend} className="px-4 py-2 text-sm bg-teal-700 text-white rounded-lg hover:bg-teal-800 font-medium">
            Send Email to Supplier
          </button>
        </div>
      </div>
    </div>
  );
}
