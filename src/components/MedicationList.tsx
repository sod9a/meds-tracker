'use client';

import React, { useState } from 'react';
import { Medication } from '@/lib/types';
import { Plus, Trash2, Clock, AlertTriangle, Package } from 'lucide-react';

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
    const input = prompt(`Add tablets to ${med.name}:`, '30');
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

  // Find any low-stock items to alert with purpose (R-18)
  const lowStockItems = medications.filter(
    (m) => m.track_stock === 1 && m.stock_quantity <= m.refill_threshold
  );

  return (
    <div className="space-y-4">
      {/* Header with clear action */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
            Medicine Cabinet
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {medications.length} registered {medications.length === 1 ? 'prescription' : 'prescriptions'}
          </p>
        </div>
        <button
          onClick={onOpenAddModal}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900 text-xs font-semibold transition-colors"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Add Medication</span>
        </button>
      </div>

      {/* Low Supply Alert Banner - purposeful notification */}
      {lowStockItems.length > 0 && (
        <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-xl flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="flex-1 text-xs">
            <span className="font-bold text-amber-900 dark:text-amber-200 block">
              Low supply warning
            </span>
            <span className="text-amber-800 dark:text-amber-300">
              {lowStockItems.map((m) => `${m.name} (${m.stock_quantity} remaining)`).join(', ')}. Order refills soon.
            </span>
          </div>
        </div>
      )}

      {medications.length === 0 ? (
        <div className="text-center py-12 px-4 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
          <Package className="w-6 h-6 text-zinc-400 mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
            Cabinet is empty
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Add medications to configure your schedule and supply tracking.
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
                className={`p-3.5 rounded-xl border transition-all ${
                  isActive
                    ? 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-2xs'
                    : 'bg-zinc-50 dark:bg-zinc-900/40 border-zinc-200/70 dark:border-zinc-800/60 opacity-60'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">
                        {med.name}
                      </h3>
                      <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                        ({med.dosage})
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                      <span className="flex items-center gap-1 font-semibold text-zinc-700 dark:text-zinc-300 tabular-nums">
                        <Clock className="w-3.5 h-3.5 text-zinc-400" />
                        {formatTime(med.scheduled_time)}
                      </span>
                      {med.instructions && (
                        <span className="truncate">• {med.instructions}</span>
                      )}
                    </div>

                    {/* Stock Inventory Tracker */}
                    {med.track_stock === 1 && (
                      <div className="mt-2.5 pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`font-semibold tabular-nums ${
                              isLowStock
                                ? 'text-amber-700 dark:text-amber-400 font-bold'
                                : 'text-zinc-700 dark:text-zinc-300'
                            }`}
                          >
                            {med.stock_quantity} tablets remaining
                          </span>
                          {isLowStock && (
                            <span className="text-[10px] text-amber-700 dark:text-amber-400 font-semibold bg-amber-100 dark:bg-amber-900/50 px-1 rounded">
                              Low
                            </span>
                          )}
                        </div>

                        <button
                          onClick={() => handleRefill(med)}
                          disabled={refillingId === med.id}
                          className="text-xs text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white font-medium hover:underline"
                        >
                          + Add Stock
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Actions Column */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => onToggleActive(med.id, !isActive)}
                      className={`text-xs px-2.5 py-1 rounded-md font-medium transition-colors border ${
                        isActive
                          ? 'border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                          : 'border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-800 text-zinc-400'
                      }`}
                    >
                      {isActive ? 'Active' : 'Paused'}
                    </button>

                    <button
                      onClick={async () => {
                        if (confirm(`Remove ${med.name} from cabinet?`)) {
                          setDeletingId(med.id);
                          await onDeleteMedication(med.id);
                          setDeletingId(null);
                        }
                      }}
                      disabled={deletingId === med.id}
                      className="p-1.5 text-zinc-400 hover:text-rose-600 transition-colors rounded-md"
                      title="Delete prescription"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
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
