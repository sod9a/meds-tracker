'use client';

import React, { useState } from 'react';
import { X, Clock, Package } from 'lucide-react';

interface AddMedicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (data: {
    name: string;
    dosage: string;
    instructions: string;
    scheduled_time: string;
    color: string;
    icon: string;
    stock_quantity: number;
    refill_threshold: number;
    track_stock: number;
  }) => Promise<void>;
}

export default function AddMedicationModal({
  isOpen,
  onClose,
  onAdd,
}: AddMedicationModalProps) {
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [scheduledTime, setScheduledTime] = useState('08:00');
  const [instructions, setInstructions] = useState('');
  const [trackStock, setTrackStock] = useState(true);
  const [stockQuantity, setStockQuantity] = useState(30);
  const [refillThreshold, setRefillThreshold] = useState(5);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const timePresets = [
    { label: 'Morning', time: '08:00' },
    { label: 'Noon', time: '13:00' },
    { label: 'Evening', time: '19:00' },
    { label: 'Bedtime', time: '22:00' },
  ];

  const dosagePresets = ['1 tablet', '500mg', '1 capsule', '2 drops', '10ml'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !dosage.trim() || !scheduledTime) return;

    setIsSubmitting(true);
    try {
      await onAdd({
        name: name.trim(),
        dosage: dosage.trim(),
        instructions: instructions.trim(),
        scheduled_time: scheduledTime,
        color: 'zinc',
        icon: 'pill',
        stock_quantity: Number(stockQuantity) || 30,
        refill_threshold: Number(refillThreshold) || 5,
        track_stock: trackStock ? 1 : 0,
      });
      setName('');
      setDosage('');
      setInstructions('');
      setScheduledTime('08:00');
      setStockQuantity(30);
      setRefillThreshold(5);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-zinc-950/60 transition-opacity animate-in fade-in">
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-t-2xl sm:rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-100 dark:border-zinc-800">
          <div>
            <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              New Medication
            </h2>
            <p className="text-xs text-zinc-500">
              Add a daily schedule and supply tracking
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4 overflow-y-auto">
          {/* Medication Name */}
          <div>
            <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200 mb-1">
              Medication Name <span className="text-rose-600">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Amoxicillin, Omega-3"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-100"
            />
          </div>

          {/* Dosage */}
          <div>
            <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200 mb-1">
              Dosage <span className="text-rose-600">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. 500mg, 1 tablet"
              value={dosage}
              onChange={(e) => setDosage(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-100 mb-2"
            />
            {/* Quick dosage chips */}
            <div className="flex flex-wrap gap-1.5">
              {dosagePresets.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setDosage(preset)}
                  className="text-xs px-2 py-0.5 rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-750 transition-colors"
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Scheduled Time */}
          <div>
            <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200 mb-1">
              Scheduled Time <span className="text-rose-600">*</span>
            </label>
            <input
              type="time"
              required
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-100 mb-2"
            />
            {/* Quick time chips */}
            <div className="grid grid-cols-4 gap-1.5">
              {timePresets.map((preset) => (
                <button
                  key={preset.time}
                  type="button"
                  onClick={() => setScheduledTime(preset.time)}
                  className={`text-xs py-1 px-1 rounded text-center font-medium border transition-colors ${
                    scheduledTime === preset.time
                      ? 'border-zinc-900 dark:border-zinc-100 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-bold'
                      : 'border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Supply & Inventory */}
          <div className="p-3 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl border border-zinc-200 dark:border-zinc-700/60 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5" />
                <span>Track Supply & Refill Alerts</span>
              </span>
              <input
                type="checkbox"
                checked={trackStock}
                onChange={(e) => setTrackStock(e.target.checked)}
                className="w-4 h-4 rounded text-zinc-900 focus:ring-zinc-500"
              />
            </div>

            {trackStock && (
              <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-zinc-200 dark:border-zinc-700 text-xs">
                <div>
                  <label className="block text-[11px] text-zinc-500 dark:text-zinc-400 mb-1">
                    Initial tablet count
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={stockQuantity}
                    onChange={(e) => setStockQuantity(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-zinc-500 dark:text-zinc-400 mb-1">
                    Warn when ≤ (Tablets)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={refillThreshold}
                    onChange={(e) => setRefillThreshold(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 tabular-nums"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Notes / Instructions */}
          <div>
            <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200 mb-1">
              Instructions (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Take with breakfast"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-100"
            />
          </div>

          {/* Actions */}
          <div className="pt-2 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900 text-xs font-semibold transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Saving…' : 'Save Prescription'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
