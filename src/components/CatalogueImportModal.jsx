/**
 * CatalogueImportModal
 *
 * Two-tab import wizard for supplier catalogues:
 *   Tab 1 — File Upload  (CSV or Excel .xlsx/.xls)
 *   Tab 2 — Text Paste   (paste PDF / email content for extraction)
 *
 * After parsing, shows a preview table where the user can:
 *   • Edit any field inline
 *   • Remove individual rows
 *   • Confirm import (appends to or replaces the supplier's catalogue)
 *
 * Props
 *   isOpen        boolean
 *   onClose       () => void
 *   supplierName  string
 *   onImport      (items: CatalogueItem[], mode: 'append'|'replace') => void
 */

import { useState, useRef, useCallback } from 'react';
import {
  parseCSV,
  parseExcel,
  extractFromText,
  resetColourCache,
} from '../utils/parseCatalogueFile';

// ─── Section colour palette for new items ────────────────────────────────────
const SECTION_COLOURS = [
  '1F3864','1B5E20','4A148C','4E342E','006064',
  '37474F','880E4F','1A237E','3E2723','33691E',
];

// ─── Inline editable cell ─────────────────────────────────────────────────────
function EditableCell({ value, onChange, multiline = false }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft]     = useState(value);

  const commit = () => { onChange(draft); setEditing(false); };

  if (editing) {
    return multiline ? (
      <textarea
        autoFocus
        rows={2}
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onBlur={commit}
        className="w-full border border-blue-400 rounded px-1 py-0.5 text-xs resize-none focus:outline-none"
      />
    ) : (
      <input
        autoFocus
        type="text"
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false); }}
        className="w-full border border-blue-400 rounded px-1 py-0.5 text-xs focus:outline-none"
      />
    );
  }

  return (
    <span
      onClick={() => { setDraft(value); setEditing(true); }}
      className="cursor-text hover:bg-blue-50 rounded px-0.5 py-0.5 block min-h-[18px] text-xs leading-relaxed"
      title="Click to edit"
    >
      {value || <span className="text-gray-300 italic">—</span>}
    </span>
  );
}

// ─── Priority selector ────────────────────────────────────────────────────────
function PrioritySelect({ value, onChange }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="border border-gray-200 rounded px-1 py-0.5 text-xs w-14 focus:outline-none focus:ring-1 focus:ring-blue-400"
    >
      <option value="★★★">★★★</option>
      <option value="★★">★★</option>
      <option value="★">★</option>
    </select>
  );
}


// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
export default function CatalogueImportModal({ isOpen, onClose, supplierName, onImport }) {
  const [tab, setTab]               = useState('file'); // 'file' | 'text'
  const [pasteText, setPasteText]   = useState('');
  const [items, setItems]           = useState([]);     // parsed + editable
  const [importMode, setImportMode] = useState('append'); // 'append' | 'replace'
  const [status, setStatus]         = useState(null);   // { type: 'error'|'info', msg }
  const [dragOver, setDragOver]     = useState(false);
  const fileRef = useRef(null);

  const reset = useCallback(() => {
    setTab('file');
    setPasteText('');
    setItems([]);
    setStatus(null);
    setImportMode('append');
    resetColourCache();
  }, []);

  const handleClose = () => { reset(); onClose(); };

  // ── Process a File object ────────────────────────────────────────────────
  const processFile = useCallback(async (file) => {
    setStatus(null);
    setItems([]);

    if (!file) return;

    const name = file.name.toLowerCase();
    const isExcel = name.endsWith('.xlsx') || name.endsWith('.xls');
    const isCsv   = name.endsWith('.csv');

    if (!isExcel && !isCsv) {
      setStatus({ type: 'error', msg: 'Unsupported file type. Please upload a .csv, .xlsx, or .xls file.' });
      return;
    }

    try {
      if (isCsv) {
        const text = await file.text();
        const parsed = parseCSV(text);
        if (!parsed.length) {
          setStatus({ type: 'error', msg: 'No valid rows found in CSV. Make sure the first row contains column headers (e.g. name, section, spec, unit).' });
          return;
        }
        setItems(parsed);
        setStatus({ type: 'info', msg: `Found ${parsed.length} products in CSV. Review below and click Import.` });
      } else {
        const buf = await file.arrayBuffer();
        const result = parseExcel(buf);
        if (result.error) {
          setStatus({ type: 'error', msg: result.error });
          return;
        }
        if (!result.items.length) {
          setStatus({ type: 'error', msg: `No valid rows found in sheet "${result.sheetName}". Check column headers include: name, section, spec, unit.` });
          return;
        }
        setItems(result.items);
        setStatus({ type: 'info', msg: `Found ${result.items.length} products in "${result.sheetName}". ${result.rowCount - result.items.length} rows skipped (no name).` });
      }
    } catch (err) {
      setStatus({ type: 'error', msg: `Parse error: ${err.message}` });
    }
  }, []);

  // ── File input / drag & drop ─────────────────────────────────────────────
  const onFileChange = e => { if (e.target.files[0]) processFile(e.target.files[0]); };

  const onDrop = e => {
    e.preventDefault(); setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  // ── Text paste extraction ─────────────────────────────────────────────────
  const handleExtract = () => {
    setStatus(null);
    setItems([]);
    if (!pasteText.trim()) {
      setStatus({ type: 'error', msg: 'Paste some text first.' });
      return;
    }
    const parsed = extractFromText(pasteText);
    if (!parsed.length) {
      setStatus({ type: 'error', msg: 'Could not extract any product names from the pasted text. Try including more context or use the CSV/Excel tab instead.' });
      return;
    }
    setItems(parsed);
    setStatus({ type: 'info', msg: `Extracted ${parsed.length} products from text. Review and edit below.` });
  };

  // ── Row edits ─────────────────────────────────────────────────────────────
  const updateRow = (idx, field, value) => {
    setItems(prev => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  };

  const removeRow = idx => {
    setItems(prev => prev.filter((_, i) => i !== idx));
  };

  // ── Confirm import ────────────────────────────────────────────────────────
  const handleImport = () => {
    const valid = items.filter(i => i.name.trim());
    if (!valid.length) {
      setStatus({ type: 'error', msg: 'No valid products to import (all rows have empty names).' });
      return;
    }
    onImport(valid, importMode);
    handleClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4"
      onClick={e => { if (e.target === e.currentTarget) handleClose(); }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="bg-gradient-to-r from-teal-700 to-teal-600 px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📥</span>
            <div>
              <h2 className="text-white font-bold text-lg leading-tight">Import Catalogue</h2>
              <p className="text-teal-200 text-xs mt-0.5">{supplierName}</p>
            </div>
          </div>
          <button onClick={handleClose} className="text-teal-200 hover:text-white text-2xl leading-none">&times;</button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 flex-shrink-0 bg-gray-50 px-6 pt-2">
          {[
            { key: 'file', label: '📁 Upload File', desc: 'CSV or Excel' },
            { key: 'text', label: '📋 Paste Text',  desc: 'From PDF or email' },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => { setTab(t.key); setItems([]); setStatus(null); }}
              className={`mr-4 pb-2 text-sm font-medium border-b-2 transition-colors ${
                tab === t.key ? 'border-teal-600 text-teal-700' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.label} <span className="text-xs text-gray-400">{t.desc}</span>
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 pb-6 pt-4 space-y-4 min-h-0">

          {/* ── File tab ── */}
          {tab === 'file' && (
            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                Upload a <strong>CSV</strong> or <strong>Excel</strong> file with your supplier's product list.
                The first row should contain column headers such as:
                <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs ml-1">name, section, spec, unit, indication, note, priority</code>
              </p>

              {/* Drop zone */}
              <div
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={onDrop}
                onClick={() => fileRef.current?.click()}
                className={`border-2 border-dashed rounded-xl py-10 flex flex-col items-center justify-center cursor-pointer transition-all ${
                  dragOver ? 'border-teal-400 bg-teal-50' : 'border-gray-300 hover:border-teal-400 hover:bg-gray-50'
                }`}
              >
                <span className="text-3xl mb-2">📊</span>
                <p className="text-sm font-medium text-gray-700">Drop file here or click to browse</p>
                <p className="text-xs text-gray-400 mt-1">Supports .csv, .xlsx, .xls</p>
                <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" onChange={onFileChange} className="hidden" />
              </div>

              {/* Template hint */}
              <details className="text-xs text-gray-400">
                <summary className="cursor-pointer hover:text-gray-600 font-medium">CSV column guide</summary>
                <div className="mt-2 bg-gray-50 rounded-lg p-3 font-mono text-[11px] leading-relaxed overflow-x-auto">
                  <p className="text-gray-500 mb-1">// Required: name</p>
                  <p>name,section,spec,unit,indication,priority,note</p>
                  <p>Pen-Strep Injection,Antibiotics,Penicillin G + Strep | Injectable,vials,Bacterial infections,★★★,IM/SC injection</p>
                  <p>Alben-100,Dewormers,Albendazole 100mg/ml | Oral,bottles,Roundworms flukes,★★★,Do not use in early pregnancy</p>
                </div>
              </details>
            </div>
          )}

          {/* ── Text paste tab ── */}
          {tab === 'text' && (
            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                Paste content from a supplier PDF, email, or website. The system will try to extract product names automatically.
              </p>
              <textarea
                rows={10}
                value={pasteText}
                onChange={e => setPasteText(e.target.value)}
                placeholder={"Paste product list here…\n\nExample:\nANTIBIOTICS\n• Pen-Strep Injection — Penicillin G + Streptomycin | vials\n• Oxytetracycline 20% LA\n\nDEWORMERS\n1. Alben-100 — Albendazole 100mg/ml\n2. Ivermectin 1% Injectable"}
                className="w-full border border-gray-300 rounded-xl px-3 py-3 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-teal-400 resize-y"
              />
              <button
                onClick={handleExtract}
                className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-semibold transition-colors"
              >
                Extract Products →
              </button>
            </div>
          )}

          {/* ── Status banner ── */}
          {status && (
            <div className={`rounded-lg px-4 py-3 text-sm ${
              status.type === 'error'
                ? 'bg-red-50 border border-red-200 text-red-700'
                : 'bg-teal-50 border border-teal-200 text-teal-800'
            }`}>
              {status.type === 'error' ? '⚠️ ' : 'ℹ️ '}{status.msg}
            </div>
          )}

          {/* ── Preview / edit table ── */}
          {items.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-gray-900">
                  Preview — {items.length} product{items.length !== 1 ? 's' : ''}
                  <span className="text-xs text-gray-400 font-normal ml-2">Click any cell to edit</span>
                </h3>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer">
                    <input
                      type="radio"
                      name="importMode"
                      value="append"
                      checked={importMode === 'append'}
                      onChange={() => setImportMode('append')}
                      className="accent-teal-600"
                    />
                    Append to existing
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer">
                    <input
                      type="radio"
                      name="importMode"
                      value="replace"
                      checked={importMode === 'replace'}
                      onChange={() => setImportMode('replace')}
                      className="accent-red-600"
                    />
                    <span className="text-red-600 font-medium">Replace entire catalogue</span>
                  </label>
                </div>
              </div>

              {importMode === 'replace' && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2 text-xs">
                  ⚠️ <strong>Replace mode</strong> will delete all existing catalogue items for {supplierName} and replace them with the imported list.
                </div>
              )}

              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="overflow-x-auto max-h-72">
                  <table className="w-full text-xs min-w-[800px]">
                    <thead className="bg-gray-50 sticky top-0 z-10">
                      <tr className="text-gray-400 uppercase text-[10px] font-semibold">
                        <th className="px-3 py-2 text-left w-40">Name *</th>
                        <th className="px-3 py-2 text-left w-36">Section</th>
                        <th className="px-3 py-2 text-left w-48">Spec</th>
                        <th className="px-3 py-2 text-left w-24">Unit</th>
                        <th className="px-3 py-2 text-left w-14">Priority</th>
                        <th className="px-3 py-2 text-left w-36">Indication</th>
                        <th className="px-3 py-2 text-center w-8">✕</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {items.map((item, idx) => (
                        <tr key={item.id || idx} className={`hover:bg-gray-50/50 ${!item.name.trim() ? 'bg-red-50/50' : ''}`}>
                          <td className="px-3 py-1.5 align-top">
                            <EditableCell value={item.name} onChange={v => updateRow(idx, 'name', v)} />
                            {!item.name.trim() && <span className="text-red-400 text-[10px]">Name required</span>}
                          </td>
                          <td className="px-3 py-1.5 align-top">
                            <EditableCell value={item.section} onChange={v => updateRow(idx, 'section', v)} />
                          </td>
                          <td className="px-3 py-1.5 align-top">
                            <EditableCell value={item.spec} onChange={v => updateRow(idx, 'spec', v)} multiline />
                          </td>
                          <td className="px-3 py-1.5 align-top">
                            <EditableCell value={item.unit} onChange={v => updateRow(idx, 'unit', v)} />
                          </td>
                          <td className="px-3 py-1.5 align-top">
                            <PrioritySelect value={item.priority} onChange={v => updateRow(idx, 'priority', v)} />
                          </td>
                          <td className="px-3 py-1.5 align-top">
                            <EditableCell value={item.indication} onChange={v => updateRow(idx, 'indication', v)} multiline />
                          </td>
                          <td className="px-3 py-1.5 text-center">
                            <button
                              onClick={() => removeRow(idx)}
                              className="text-gray-300 hover:text-red-500 text-base leading-none transition-colors"
                              title="Remove row"
                            >
                              ✕
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50">
          <button onClick={handleClose} className="px-4 py-2 border border-gray-300 text-gray-600 rounded-lg text-sm hover:bg-gray-100">
            Cancel
          </button>
          <div className="flex items-center gap-3">
            {items.length > 0 && (
              <span className="text-xs text-gray-500">
                {items.filter(i => i.name.trim()).length} valid product{items.filter(i => i.name.trim()).length !== 1 ? 's' : ''} ready to import
              </span>
            )}
            <button
              onClick={handleImport}
              disabled={!items.length}
              className="px-5 py-2 bg-teal-700 hover:bg-teal-600 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {importMode === 'replace' ? '⚠️ Replace Catalogue' : '✓ Import Products'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
