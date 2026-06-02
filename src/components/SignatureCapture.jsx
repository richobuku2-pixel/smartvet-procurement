/**
 * SignatureCapture
 *
 * Lets a user sign a document by:
 *   1. Using their previously saved signature (no re-upload needed), OR
 *   2. Uploading an image the first time (saved to localStorage per user)
 *
 * Props:
 *   userKey    — unique identifier (email or id) used to load/save the signature
 *   onSign     — fn(base64: string) called when user clicks "Sign"
 *   onClear    — fn() called when user resets
 *   signed     — boolean — whether they've already signed this session
 */
import { useState, useRef } from 'react';

const STORAGE_PREFIX = 'smartvet:sig:';

export function getSavedSignature(userKey) {
  if (!userKey) return null;
  return localStorage.getItem(STORAGE_PREFIX + userKey) || null;
}

function saveSignature(userKey, base64) {
  if (!userKey || !base64) return;
  localStorage.setItem(STORAGE_PREFIX + userKey, base64);
}

function clearSavedSignature(userKey) {
  if (!userKey) return;
  localStorage.removeItem(STORAGE_PREFIX + userKey);
}

export default function SignatureCapture({ userKey, onSign, onClear, signed }) {
  const saved    = getSavedSignature(userKey);
  const [mode, setMode]       = useState(saved ? 'preview' : 'upload'); // 'preview' | 'upload' | 'signed'
  const [preview, setPreview] = useState(saved);
  const [saveForFuture, setSaveForFuture] = useState(true);
  const fileRef  = useRef();

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target.result;
      setPreview(base64);
      setMode('preview');
    };
    reader.readAsDataURL(file);
  };

  const handleSign = () => {
    if (!preview) return;
    if (saveForFuture) saveSignature(userKey, preview);
    onSign(preview);
  };

  const handleReset = () => {
    clearSavedSignature(userKey);
    setPreview(null);
    setMode('upload');
    if (fileRef.current) fileRef.current.value = '';
    onClear?.();
  };

  // ── Already signed this session ───────────────────────────────────────────
  if (signed) {
    return (
      <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
        <span className="text-green-600 text-lg">✅</span>
        <div className="flex-1">
          <p className="text-sm font-semibold text-green-800">Signed</p>
          <p className="text-xs text-green-600">Your signature has been applied to this receipt.</p>
        </div>
        <button onClick={handleReset} className="text-xs text-gray-400 hover:text-red-500 underline">
          Reset
        </button>
      </div>
    );
  }

  // ── Saved signature available — just click Sign ───────────────────────────
  if (mode === 'preview' && preview) {
    return (
      <div className="space-y-3">
        <div className="border border-gray-200 rounded-xl bg-white p-3">
          <p className="text-[10px] text-gray-400 uppercase font-semibold mb-2">
            {saved ? 'Your saved signature' : 'Uploaded signature'}
          </p>
          <img
            src={preview}
            alt="Signature preview"
            className="max-h-20 max-w-full object-contain mx-auto"
          />
        </div>
        {!saved && (
          <label className="flex items-center gap-2 text-xs text-gray-500 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={saveForFuture}
              onChange={e => setSaveForFuture(e.target.checked)}
              className="rounded"
            />
            Save signature for future receipts (no re-upload needed)
          </label>
        )}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleSign}
            className="flex-1 py-2.5 bg-green-700 hover:bg-green-800 text-white text-sm font-bold rounded-xl transition-colors"
          >
            ✍️ Sign & Confirm
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="px-4 py-2.5 border border-gray-200 text-gray-500 text-sm rounded-xl hover:bg-gray-50"
          >
            {saved ? 'Use different' : 'Re-upload'}
          </button>
        </div>
      </div>
    );
  }

  // ── No signature yet — upload ─────────────────────────────────────────────
  return (
    <div className="space-y-3">
      <div
        onClick={() => fileRef.current?.click()}
        className="border-2 border-dashed border-gray-300 hover:border-green-400 rounded-xl p-6 text-center cursor-pointer transition-colors"
      >
        <p className="text-2xl mb-1">✍️</p>
        <p className="text-sm font-semibold text-gray-600">Upload your signature</p>
        <p className="text-xs text-gray-400 mt-0.5">PNG or JPG — clear signature on white background</p>
        <input
          ref={fileRef}
          type="file"
          accept="image/png,image/jpeg,image/jpg"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
      <p className="text-xs text-gray-400 text-center">
        Your signature will be saved so you only upload it once.
      </p>
    </div>
  );
}
