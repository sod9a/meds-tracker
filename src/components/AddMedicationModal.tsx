'use client';

import React, { useState } from 'react';
import { X, Clock, Pill, Check } from 'lucide-react';

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
  const [color, setColor] = useState('emerald');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const timePresets = [
    { label: 'Morning', time: '08:00' },
    { label: 'Noon', time: '13:00' },
    { label: 'Evening', time: '19:00' },
    { label: 'Bedtime', time: '22:00' },
  ];

  const dosagePresets = ['1 tablet', '500mg', '1 capsule', '2 drops', '10ml'];

  const colors = [
    { id: 'emerald', bg: 'bg-emerald-500' },
    { id: 'sky', bg: 'bg-sky-500' },
    { id: 'amber', bg: 'bg-amber-500' },
    { id: 'indigo', bg: 'bg-indigo-500' },
    { id: 'rose', bg: 'bg-rose-500' },
  ];

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
        color,
        icon: 'pill',
      });
      setName('');
      setDosage('');
      setInstructions('');
      setScheduledTime('08:00');
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in">
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-t-3xl sm:rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              <Pill className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              Add New Medication
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4 overflow-y-auto">
          {/* Medicine Name */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Medication Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Amoxicillin, Vitamin D"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-teal-500/50"
            />
          </div>

          {/* Dosage */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Dosage *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. 500mg, 1 tablet"
              value={dosage}
              onChange={(e) => setDosage(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-teal-500/50 mb-2"
            />
            {/* Quick dosage chips */}
            <div className="flex flex-wrap gap-1.5">
              {dosagePresets.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setDosage(preset)}
                  className="text-[11px] px-2 py-0.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Scheduled Time */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Scheduled Time *
            </label>
            <input
              type="time"
              required
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-teal-500/50 mb-2"
            />
            {/* Quick time chips */}
            <div className="grid grid-cols-4 gap-1.5">
              {timePresets.map((preset) => (
                <button
                  key={preset.time}
                  type="button"
                  onClick={() => setScheduledTime(preset.time)}
                  className={`text-[11px] py-1 px-1 rounded-lg text-center font-medium border transition-colors ${
                    scheduledTime === preset.time
                      ? 'border-teal-500 bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400 font-bold'
                      : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40 text-zinc-600 dark:text-zinc-400'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Instructions */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Instructions (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. After meal with plenty of water"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-teal-500/50"
            />
          </div>

          {/* Color Tag */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
              Tag Color
            </label>
            <div className="flex gap-2">
              {colors.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setColor(c.id)}
                  className={`w-7 h-7 rounded-full ${c.bg} flex items-center justify-center transition-transform ${
                    color === c.id ? 'ring-2 ring-offset-2 ring-teal-500 scale-110' : 'opacity-70'
                  }`}
                >
                  {color === c.id && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="pt-2 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs font-bold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-600 active:scale-95 text-white text-xs font-bold shadow-md shadow-teal-500/20 transition-all disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Add to Cabinet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
