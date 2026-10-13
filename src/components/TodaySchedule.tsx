'use client';

import React, { useState } from 'react';
import { ScheduleItem } from '@/lib/types';
import { Check, Clock, RotateCcw, Package, Send, BellRing } from 'lucide-react';

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

  // Group items by time period for natural visual rhythm
  const morningItems = schedule.filter((i) => {
    const h = parseInt(i.time.split(':')[0], 10);
    return h < 12;
  });
  const afternoonItems = schedule.filter((i) => {
    const h = parseInt(i.time.split(':')[0], 10);
    return h >= 12 && h < 17;
  });
  const eveningItems = schedule.filter((i) => {
    const h = parseInt(i.time.split(':')[0], 10);
    return h >= 17;
  });

  const sections = [
    { title: 'Morning', subtitle: 'Before 12:00 PM', items: morningItems },
    { title: 'Afternoon', subtitle: '12:00 PM - 5:00 PM', items: afternoonItems },
    { title: 'Evening & Night', subtitle: 'After 5:00 PM', items: eveningItems },
  ].filter((s) => s.items.length > 0);

  return (
    <div className="space-y-6">
      {/* Bot Reminder Quick Action - Solid, purposeful, no rainbow gradient */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 flex items-center justify-center shrink-0">
            <BellRing className="w-4 h-4 stroke-[2]" />
          </div>
          <div>
            <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 block">
              Telegram Alerts
            </span>
            <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
              {telegramConnected ? 'Active and monitoring' : 'Connect to receive reminder pings'}
            </span>
          </div>
        </div>

        {telegramConnected ? (
          <button
            onClick={handleTriggerTest}
            disabled={testSending}
            className="px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-medium transition-colors disabled:opacity-50"
          >
            {testSending ? 'Sending…' : 'Test Ping'}
          </button>
        ) : (
          <button
            onClick={onOpenTelegramModal}
            className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900 text-xs font-semibold transition-colors"
          >
            Link Telegram
          </button>
        )}
      </div>

      {/* Main Schedule Sections */}
      {schedule.length === 0 ? (
        <div className="text-center py-12 px-4 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
          <Clock className="w-6 h-6 text-zinc-400 mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
            No medications scheduled for today
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Add medicines in your cabinet to populate today&apos;s checklist.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {sections.map((section) => (
            <div key={section.title} className="space-y-2.5">
              <div className="flex items-baseline justify-between px-1">
                <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                  {section.title}
                </h2>
                <span className="text-[11px] text-zinc-400">
                  {section.subtitle}
                </span>
              </div>

              <div className="space-y-2">
                {section.items.map((item) => {
                  const isTaken = item.status === 'taken';
                  const isSkipped = item.status === 'skipped';
                  const isSnoozed = !isTaken && !isSkipped && Boolean(item.snoozed_until);
                  const isLoading = loadingId === item.medication.id;

                  return (
                    <div
                      key={item.medication.id}
                      onClick={() => handleToggle(item)}
                      className={`rounded-xl p-3.5 border transition-all cursor-pointer select-none ${
                        isTaken
                          ? 'bg-zinc-50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 opacity-75'
                          : isSkipped
                          ? 'bg-zinc-50 dark:bg-zinc-900/40 border-zinc-200 dark:border-zinc-800/60 opacity-50'
                          : isSnoozed
                          ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800'
                          : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-2xs hover:border-zinc-300 dark:hover:border-zinc-700'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        {/* Info Column */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 tabular-nums">
                              {formatTime(item.time)}
                            </span>
                            <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">
                              • {item.medication.dosage}
                            </span>

                            {/* Snooze Status Indicator */}
                            {isSnoozed && item.snoozed_until && (
                              <span className="text-[10px] font-semibold text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/60 px-1.5 py-0.5 rounded">
                                Snoozed to {new Date(item.snoozed_until).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            )}
                          </div>

                          <h3
                            className={`text-sm font-bold truncate ${
                              isTaken
                                ? 'line-through text-zinc-500 dark:text-zinc-400'
                                : 'text-zinc-900 dark:text-zinc-100'
                            }`}
                          >
                            {item.medication.name}
                          </h3>

                          {item.medication.instructions && (
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 truncate">
                              {item.medication.instructions}
                            </p>
                          )}

                          {isTaken && item.log?.taken_at && (
                            <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium mt-1 flex items-center gap-1">
                              <Check className="w-3 h-3 stroke-[2.5]" />
                              Logged at {new Date(item.log.taken_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          )}
                        </div>

                        {/* Interactive Action Area */}
                        <div className="flex items-center gap-2 shrink-0">
                          {!isTaken && !isSkipped && (
                            <button
                              onClick={(e) => handleSkip(item, e)}
                              className="text-xs font-medium text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 px-2 py-1 rounded"
                            >
                              Skip
                            </button>
                          )}

                          {/* Checkbox Target (44px min touch size) */}
                          <div
                            className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors border ${
                              isTaken
                                ? 'bg-emerald-600 border-emerald-600 text-white'
                                : isSkipped
                                ? 'bg-zinc-200 border-zinc-300 text-zinc-500 dark:bg-zinc-800 dark:border-zinc-700'
                                : isSnoozed
                                ? 'bg-amber-500 border-amber-500 text-white'
                                : 'bg-zinc-50 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-zinc-400 hover:border-zinc-400'
                            }`}
                            aria-label={isTaken ? 'Mark as pending' : 'Mark as taken'}
                          >
                            {isLoading ? (
                              <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            ) : isTaken ? (
                              <Check className="w-4 h-4 stroke-[3]" />
                            ) : isSkipped ? (
                              <RotateCcw className="w-3.5 h-3.5" />
                            ) : (
                              <div className="w-2.5 h-2.5 rounded-xs bg-zinc-300 dark:bg-zinc-600" />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
