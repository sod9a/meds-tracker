'use client';

import React from 'react';
import { Check, X, Clock, Calendar, CheckCircle2 } from 'lucide-react';

interface HistoryLogsProps {
  logs: any[];
}

export default function HistoryLogs({ logs }: HistoryLogsProps) {
  const takenCount = logs.filter((l) => l.status === 'taken').length;
  const adherenceRate = logs.length > 0 ? Math.round((takenCount / logs.length) * 100) : 0;

  return (
    <div className="space-y-4">
      {/* Stats Summary */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-2xl shadow-xs">
          <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
            Adherence Rate
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-teal-600 dark:text-teal-400">
              {adherenceRate}%
            </span>
            <span className="text-xs text-zinc-400">
              ({takenCount}/{logs.length})
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-2xl shadow-xs">
          <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
            Total Doses Logged
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              {logs.length}
            </span>
            <span className="text-xs text-zinc-400">entries</span>
          </div>
        </div>
      </div>

      {/* Log Entries */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider px-1">
          Activity History
        </h3>

        {logs.length === 0 ? (
          <div className="text-center py-12 px-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800">
            <Calendar className="w-8 h-8 text-zinc-400 mx-auto mb-2" />
            <h4 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
              No history yet
            </h4>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Doses you mark as taken or skipped will show up here.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {logs.map((log) => {
              const isTaken = log.status === 'taken';

              return (
                <div
                  key={log.id}
                  className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-3 flex items-center justify-between shadow-xs"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                        isTaken
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'
                          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400'
                      }`}
                    >
                      {isTaken ? (
                        <Check className="w-4 h-4 stroke-[2.5]" />
                      ) : (
                        <X className="w-4 h-4 stroke-2" />
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                          {log.med_name || 'Medication'}
                        </span>
                        {log.dosage && (
                          <span className="text-[10px] text-zinc-500 font-medium">
                            {log.dosage}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-zinc-400 flex items-center gap-1.5 mt-0.5">
                        <span>{log.scheduled_date}</span>
                        <span>•</span>
                        <span>Scheduled: {log.scheduled_time}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isTaken
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                      }`}
                    >
                      {isTaken ? 'Taken' : 'Skipped'}
                    </span>
                    {log.taken_at && (
                      <p className="text-[10px] text-zinc-400 mt-1">
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
