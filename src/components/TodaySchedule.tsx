'use client';

import React, { useState } from 'react';
import { ScheduleItem } from '@/lib/types';
import { Check, Clock, AlertCircle, Sparkles, Send, RotateCcw } from 'lucide-react';

interface TodayScheduleProps {
  schedule: ScheduleItem[];
  onLogDose: (medicationId: string, status: 'taken' | 'skipped' | 'pending') => Promise<void>;
  onSendTestReminder: () => Promise<void>;
  telegramConnected: boolean;
  onOpenTelegramModal: () => void;
}

export default function TodaySchedule({
  schedule,
  onLogDose,
  onSendTestReminder,
  telegramConnected,
  onOpenTelegramModal,
}: TodayScheduleProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [testSending, setTestSending] = useState(false);

  const handleToggle = async (item: ScheduleItem) => {
    setLoadingId(item.medication.id);
    try {
      const nextStatus = item.status === 'taken' ? 'pending' : 'taken';
      await onLogDose(item.medication.id, nextStatus);
    } finally {
      setLoadingId(null);
    }
  };

  const handleSkip = async (item: ScheduleItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setLoadingId(item.medication.id);
    try {
      await onLogDose(item.medication.id, 'skipped');
    } finally {
      setLoadingId(null);
    }
  };

  const handleTriggerTest = async () => {
    setTestSending(true);
    try {
      await onSendTestReminder();
    } finally {
      setTestSending(false);
    }
  };

  const formatTime = (timeStr: string) => {
    const [h, m] = timeStr.split(':').map(Number);
    const period = h >= 12 ? 'PM' : 'AM';
    const displayH = h % 12 === 0 ? 12 : h % 12;
    return `${displayH}:${String(m).padStart(2, '0')} ${period}`;
  };

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'amber':
        return 'border-amber-200 dark:border-amber-900/40 bg-amber-500/10 text-amber-700 dark:text-amber-400';
      case 'indigo':
        return 'border-indigo-200 dark:border-indigo-900/40 bg-indigo-500/10 text-indigo-700 dark:text-indigo-400';
      case 'rose':
        return 'border-rose-200 dark:border-rose-900/40 bg-rose-500/10 text-rose-700 dark:text-rose-400';
      case 'sky':
        return 'border-sky-200 dark:border-sky-900/40 bg-sky-500/10 text-sky-700 dark:text-sky-400';
      case 'emerald':
      default:
        return 'border-emerald-200 dark:border-emerald-900/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400';
    }
  };

  return (
    <div className="space-y-4">
      {/* Telegram Quick-Action Banner */}
      <div className="bg-gradient-to-r from-sky-500/10 via-teal-500/10 to-emerald-500/10 border border-sky-200/60 dark:border-sky-800/40 rounded-2xl p-3.5 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-sky-500 text-white flex items-center justify-center shadow-xs">
            <Send className="w-4 h-4 -rotate-12" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
              Telegram Reminders
            </h4>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              {telegramConnected
                ? 'Bot is linked and ready'
                : 'Connect to receive ping alerts'}
            </p>
          </div>
        </div>

        {telegramConnected ? (
          <button
            onClick={handleTriggerTest}
            disabled={testSending}
            className="px-3 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-600 active:scale-95 text-white text-xs font-semibold shadow-xs transition-all disabled:opacity-50"
          >
            {testSending ? 'Sending...' : 'Test Ping'}
          </button>
        ) : (
          <button
            onClick={onOpenTelegramModal}
            className="px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 active:scale-95 text-white text-xs font-semibold shadow-xs transition-all"
          >
            Connect
          </button>
        )}
      </div>

      {/* Schedule Items Timeline */}
      {schedule.length === 0 ? (
        <div className="text-center py-12 px-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800">
          <Sparkles className="w-8 h-8 text-zinc-400 mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
            No medications scheduled for today
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Tap the + button below to add your first medication!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {schedule.map((item) => {
            const isTaken = item.status === 'taken';
            const isSkipped = item.status === 'skipped';
            const isLoading = loadingId === item.medication.id;

            return (
              <div
                key={item.medication.id}
                onClick={() => handleToggle(item)}
                className={`relative group rounded-2xl p-4 transition-all duration-200 cursor-pointer border select-none ${
                  isTaken
                    ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60 opacity-90'
                    : isSkipped
                    ? 'bg-zinc-100/60 dark:bg-zinc-900/40 border-zinc-200 dark:border-zinc-800 opacity-60'
                    : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-md'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  {/* Left: Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="flex items-center gap-1 text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
                        <Clock className="w-3 h-3 text-zinc-400" />
                        {formatTime(item.time)}
                      </span>
                      <span
                        className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${getColorClasses(
                          item.medication.color
                        )}`}
                      >
                        {item.medication.dosage}
                      </span>
                    </div>

                    <h3
                      className={`text-base font-bold truncate ${
                        isTaken
                          ? 'line-through text-zinc-500 dark:text-zinc-400'
                          : 'text-zinc-900 dark:text-zinc-100'
                      }`}
                    >
                      {item.medication.name}
                    </h3>

                    {item.medication.instructions && (
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 line-clamp-1">
                        {item.medication.instructions}
                      </p>
                    )}

                    {isTaken && item.log?.taken_at && (
                      <p className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
                        <Check className="w-3 h-3 stroke-[2.5]" />
                        Taken at{' '}
                        {new Date(item.log.taken_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    )}
                  </div>

                  {/* Right: Big Touch Action Button */}
                  <div className="flex items-center gap-1.5 self-center">
                    {!isTaken && !isSkipped && (
                      <button
                        onClick={(e) => handleSkip(item, e)}
                        className="text-[11px] font-semibold text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 px-2 py-1 rounded-lg transition-colors"
                        title="Skip dose"
                      >
                        Skip
                      </button>
                    )}

                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all shadow-xs ${
                        isTaken
                          ? 'bg-emerald-500 text-white scale-105'
                          : isSkipped
                          ? 'bg-zinc-200 text-zinc-500 dark:bg-zinc-800'
                          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 group-hover:bg-teal-50 group-hover:text-teal-600 dark:group-hover:bg-teal-950/40 dark:group-hover:text-teal-400'
                      }`}
                    >
                      {isLoading ? (
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      ) : isTaken ? (
                        <Check className="w-5 h-5 stroke-[3]" />
                      ) : isSkipped ? (
                        <RotateCcw className="w-4 h-4" />
                      ) : (
                        <Check className="w-5 h-5 stroke-2" />
                      )}
                    </div>
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
