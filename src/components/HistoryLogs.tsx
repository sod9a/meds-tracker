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
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl space-y-3">
        <div className="flex items-baseline justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">
            Adherence Rate
          </span>
          <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 tabular-nums">
            {adherenceRate}%
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800 text-xs">
          <div>
            <span className="text-zinc-500 block">Doses taken</span>
            <span className="font-semibold text-emerald-700 dark:text-emerald-400 tabular-nums">
              {takenCount}
            </span>
          </div>
          <div>
            <span className="text-zinc-500 block">Doses skipped</span>
            <span className="font-semibold text-zinc-600 dark:text-zinc-400 tabular-nums">
              {skippedCount}
            </span>
          </div>
        </div>
      </div>

      {/* Activity Log List */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider px-1">
          Recent Log Entries
        </h3>

        {logs.length === 0 ? (
          <div className="text-center py-12 px-4 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
            <Calendar className="w-6 h-6 text-zinc-400 mx-auto mb-2" />
            <h4 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
              No entries recorded
            </h4>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Marking scheduled doses as taken or skipped will record entries here.
            </p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {logs.map((log) => {
              const isTaken = log.status === 'taken';

              return (
                <div
                  key={log.id}
                  className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-6 h-6 rounded flex items-center justify-center shrink-0 border ${
                        isTaken
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400'
                          : 'bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-400'
                      }`}
                    >
                      {isTaken ? (
                        <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                      ) : (
                        <X className="w-3 h-3 stroke-2" />
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-1.5 font-bold text-zinc-900 dark:text-zinc-100">
                        <span>{log.med_name || 'Medication'}</span>
                        {log.dosage && (
                          <span className="text-[11px] font-normal text-zinc-500">
                            ({log.dosage})
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-zinc-400 mt-0.5 tabular-nums">
                        <span>{log.scheduled_date}</span>
                        <span className="mx-1">•</span>
                        <span>Scheduled {log.scheduled_time}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                        isTaken
                          ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700'
                      }`}
                    >
                      {isTaken ? 'Taken' : 'Skipped'}
                    </span>
                    {log.taken_at && (
                      <p className="text-[10px] text-zinc-400 mt-1 tabular-nums">
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
