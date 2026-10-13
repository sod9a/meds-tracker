'use client';

import React, { useState } from 'react';
import { Medication } from '@/lib/types';
import { Pill, Trash2, Clock, Plus, Package, AlertTriangle, RotateCw } from 'lucide-react';

interface MedicationListProps {
  medications: Medication[];
  onToggleActive: (id: string, active: boolean) => Promise<void>;
  onDeleteMedication: (id: string) => Promise<void>;
  onRefillMedication: (id: string, amount: number) => Promise<void>;
  onOpenAddModal: () => void;
}

export default function MedicationList({
  medications,
  onToggleActive,
  onDeleteMedication,
  onRefillMedication,
  onOpenAddModal,
}: MedicationListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [refillingId, setRefillingId] = useState<string | null>(null);

  const formatTime = (timeStr: string) => {
    const [h, m] = timeStr.split(':').map(Number);
    const period = h >= 12 ? 'PM' : 'AM';
    const displayH = h % 12 === 0 ? 12 : h % 12;
    return `${displayH}:${String(m).padStart(2, '0')} ${period}`;
  };

  const handleRefill = async (med: Medication) => {
    const input = prompt(`How many pills would you like to add to ${med.name}?`, '30');
    if (!input) return;
    const amount = parseInt(input, 10);
    if (isNaN(amount) || amount <= 0) return;

    setRefillingId(med.id);
    try {
      await onRefillMedication(med.id, amount);
    } finally {
      setRefillingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
            Medicine Cabinet
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Manage your daily doses and recurring prescriptions
          </p>
        </div>
        <button
          onClick={onOpenAddModal}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-500 hover:bg-teal-600 text-white text-xs font-semibold shadow-xs transition-all active:scale-95"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Add Med</span>
        </button>
      </div>

      {medications.length === 0 ? (
        <div className="text-center py-12 px-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800">
          <Pill className="w-8 h-8 text-zinc-400 mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
            No medications registered yet
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Click &quot;Add Med&quot; to set up your daily schedule
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {medications.map((med) => {
            const isActive = Boolean(med.active);
            const isLowStock = med.track_stock === 1 && med.stock_quantity <= med.refill_threshold;

            return (
              <div
                key={med.id}
                className={`p-3.5 rounded-2xl border transition-all ${
                  isActive
                    ? 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-xs'
                    : 'bg-zinc-50 dark:bg-zinc-900/40 border-zinc-200/60 dark:border-zinc-800/60 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
                      <Pill className="w-4 h-4" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">
                          {med.name}
                        </h4>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                          {med.dosage}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                        <span className="flex items-center gap-1 font-medium">
                          <Clock className="w-3 h-3 text-zinc-400" />
                          {formatTime(med.scheduled_time)}
                        </span>
                        {med.instructions && (
                          <span className="truncate">• {med.instructions}</span>
                        )}
                      </div>

                      {/* Stock Inventory Pill */}
                      {med.track_stock === 1 && (
                        <div className="flex items-center gap-2 mt-1.5">
                          <span
                            className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md ${
                              isLowStock
                                ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 animate-pulse'
                                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                            }`}
                          >
                            {isLowStock ? (
                              <AlertTriangle className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                            ) : (
                              <Package className="w-3 h-3 text-zinc-500" />
                            )}
                            <span>{med.stock_quantity} left</span>
                          </span>

                          <button
                            onClick={() => handleRefill(med)}
                            disabled={refillingId === med.id}
                            className="text-[10px] text-teal-600 dark:text-teal-400 font-bold hover:underline flex items-center gap-0.5"
                          >
                            <Plus className="w-2.5 h-2.5" />
                            <span>Refill</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0 self-start">
                    {/* Active toggle switch */}
                    <button
                      onClick={() => onToggleActive(med.id, !isActive)}
                      className={`text-[11px] px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                        isActive
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400'
                          : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800'
                      }`}
                    >
                      {isActive ? 'Active' : 'Paused'}
                    </button>

                    {/* Delete button */}
                    <button
                      onClick={async () => {
                        if (confirm(`Remove ${med.name} from your cabinet?`)) {
                          setDeletingId(med.id);
                          await onDeleteMedication(med.id);
                          setDeletingId(null);
                        }
                      }}
                      disabled={deletingId === med.id}
                      className="p-1.5 text-zinc-400 hover:text-rose-500 transition-colors rounded-lg"
                      title="Delete medication"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
