'use client';

import React from 'react';
import { Check, X, Calendar } from 'lucide-react';

interface HistoryLogsProps {
  logs: any[];
}

export default function HistoryLogs({ logs }: HistoryLogsProps) {
  const takenCount = logs.filter((l) => l.status === 'taken').length;
  const skippedCount = logs.filter((l) => l.status === 'skipped').length;
  const adherenceRate = logs.length > 0 ? Math.round((takenCount / logs.length) * 100) : 0;

  return (
    <div className="space-y-4">
      {/* Editorial Adherence Summary */}
      <div className="bg-white border border-slate-200/90 p-4 rounded-2xl space-y-3 shadow-xs">
        <div className="flex items-baseline justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Adherence Rate
          </span>
          <span className="text-3xl font-extrabold text-blue-600 tabular-nums">
            {adherenceRate}%
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-2.5 border-t border-slate-100 text-xs">
          <div>
            <span className="text-slate-500 font-medium block">Doses taken</span>
            <span className="font-bold text-emerald-700 tabular-nums text-sm">
              {takenCount}
            </span>
          </div>
          <div>
            <span className="text-slate-500 font-medium block">Doses skipped</span>
            <span className="font-bold text-slate-600 tabular-nums text-sm">
              {skippedCount}
            </span>
          </div>
        </div>
      </div>

      {/* Activity Log List */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">
          Recent Log Entries
        </h3>

        {logs.length === 0 ? (
          <div className="text-center py-12 px-4 bg-white rounded-2xl border border-slate-200/90 shadow-2xs">
            <Calendar className="w-8 h-8 text-blue-400 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-slate-800">
              No entries recorded
            </h4>
            <p className="text-xs text-slate-500 mt-1">
              Marking scheduled doses as taken or skipped will record entries here.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {logs.map((log) => {
              const isTaken = log.status === 'taken';

              return (
                <div
                  key={log.id}
                  className="bg-white border border-slate-200/80 rounded-2xl p-3.5 flex items-center justify-between text-xs shadow-2xs"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border shadow-2xs ${
                        isTaken
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                          : 'bg-slate-100 border-slate-200 text-slate-400'
                      }`}
                    >
                      {isTaken ? (
                        <Check className="w-4 h-4 stroke-[2.5]" />
                      ) : (
                        <X className="w-3.5 h-3.5 stroke-[2.2]" />
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-1.5 font-bold text-slate-900">
                        <span>{log.med_name || 'Medication'}</span>
                        {log.dosage && (
                          <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded">
                            {log.dosage}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5 tabular-nums">
                        <span>{log.scheduled_date}</span>
                        <span className="mx-1">•</span>
                        <span>Scheduled {log.scheduled_time}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                        isTaken
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                    >
                      {isTaken ? 'Taken' : 'Skipped'}
                    </span>
                    {log.taken_at && (
                      <p className="text-[10px] text-slate-400 mt-1 tabular-nums font-medium">
                        {new Date(log.taken_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
