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
          <h2 className="text-base font-bold text-slate-900">
            Medicine Cabinet
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            {medications.length} registered {medications.length === 1 ? 'prescription' : 'prescriptions'}
          </p>
        </div>
        <button
          onClick={onOpenAddModal}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-2xs transition-colors"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Add Medication</span>
        </button>
      </div>

      {/* Low Supply Alert Banner - purposeful notification */}
      {lowStockItems.length > 0 && (
        <div className="p-3.5 bg-amber-50/90 border border-amber-200 rounded-2xl flex items-start gap-2.5 shadow-2xs">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1 text-xs">
            <span className="font-bold text-amber-900 block">
              Low supply warning
            </span>
            <span className="text-amber-800 font-medium">
              {lowStockItems.map((m) => `${m.name} (${m.stock_quantity} remaining)`).join(', ')}. Order refills soon.
            </span>
          </div>
        </div>
      )}

      {medications.length === 0 ? (
        <div className="text-center py-12 px-4 bg-white rounded-2xl border border-slate-200/90 shadow-2xs">
          <Package className="w-8 h-8 text-blue-400 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-slate-800">
            Cabinet is empty
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Add medications to configure your schedule and supply tracking.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {medications.map((med) => {
            const isActive = Boolean(med.active);
            const isLowStock = med.track_stock === 1 && med.stock_quantity <= med.refill_threshold;

            return (
              <div
                key={med.id}
                className={`p-4 rounded-2xl border transition-all ${
                  isActive
                    ? 'bg-white border-slate-200/90 shadow-xs'
                    : 'bg-slate-50 border-slate-200/70 opacity-60'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-bold text-slate-900 truncate">
                        {med.name}
                      </h3>
                      <span className="text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-md">
                        {med.dosage}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-1.5">
                      <span className="flex items-center gap-1 font-semibold text-slate-700 tabular-nums">
                        <Clock className="w-3.5 h-3.5 text-blue-500" />
                        {formatTime(med.scheduled_time)}
                      </span>
                      {med.instructions && (
                        <span className="truncate text-slate-500">• {med.instructions}</span>
                      )}
                    </div>

                    {/* Stock Inventory Tracker */}
                    {med.track_stock === 1 && (
                      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-semibold tabular-nums ${
                              isLowStock
                                ? 'text-amber-800 font-bold'
                                : 'text-slate-700'
                            }`}
                          >
                            {med.stock_quantity} tablets remaining
                          </span>
                          {isLowStock && (
                            <span className="text-[10px] text-amber-900 font-bold bg-amber-100 border border-amber-200 px-1.5 py-0.5 rounded">
                              Low Stock
                            </span>
                          )}
                        </div>

                        <button
                          onClick={() => handleRefill(med)}
                          disabled={refillingId === med.id}
                          className="text-xs font-bold text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-100 px-2.5 py-1 rounded-md transition-colors"
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
                      className={`text-xs px-2.5 py-1.5 rounded-lg font-semibold transition-colors border shadow-2xs ${
                        isActive
                          ? 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                          : 'border-slate-200 bg-slate-100 text-slate-400'
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
                      className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors rounded-lg hover:bg-rose-50"
                      title="Delete prescription"
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
