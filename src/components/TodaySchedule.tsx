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
      {/* Bot Reminder Quick Action - Bright clinical card */}
      <div className="bg-gradient-to-r from-blue-50/90 to-sky-50/70 border border-blue-200/80 rounded-2xl p-3.5 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
            <BellRing className="w-4 h-4 stroke-[2.2]" />
          </div>
          <div>
            <span className="text-xs font-bold text-blue-950 block">
              Telegram Alerts
            </span>
            <span className="text-[11px] text-blue-700/80 font-medium">
              {telegramConnected ? 'Connected & sending reminder pings' : 'Link Telegram to receive phone alerts'}
            </span>
          </div>
        </div>

        {telegramConnected ? (
          <button
            onClick={handleTriggerTest}
            disabled={testSending}
            className="px-3.5 py-1.5 rounded-lg border border-blue-200 bg-white hover:bg-blue-50 text-blue-700 text-xs font-bold shadow-2xs transition-colors disabled:opacity-50"
          >
            {testSending ? 'Sending…' : 'Test Ping'}
          </button>
        ) : (
          <button
            onClick={onOpenTelegramModal}
            className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-2xs transition-colors"
          >
            Link Bot
          </button>
        )}
      </div>

      {/* Main Schedule Sections */}
      {schedule.length === 0 ? (
        <div className="text-center py-12 px-4 bg-white rounded-2xl border border-slate-200/90 shadow-2xs">
          <Clock className="w-8 h-8 text-blue-400 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-slate-800">
            No medications scheduled for today
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Add medicines in your cabinet to populate today&apos;s checklist.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {sections.map((section) => (
            <div key={section.title} className="space-y-2.5">
              <div className="flex items-baseline justify-between px-1">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  {section.title}
                </h2>
                <span className="text-[11px] text-slate-400 font-medium">
                  {section.subtitle}
                </span>
              </div>

              <div className="space-y-2.5">
                {section.items.map((item) => {
                  const isTaken = item.status === 'taken';
                  const isSkipped = item.status === 'skipped';
                  const isSnoozed = !isTaken && !isSkipped && Boolean(item.snoozed_until);
                  const isLoading = loadingId === item.medication.id;

                  return (
                    <div
                      key={item.medication.id}
                      onClick={() => handleToggle(item)}
                      className={`rounded-2xl p-4 border transition-all cursor-pointer select-none ${
                        isTaken
                          ? 'bg-emerald-50/40 border-emerald-200/70 opacity-80'
                          : isSkipped
                          ? 'bg-slate-50 border-slate-200/60 opacity-50'
                          : isSnoozed
                          ? 'bg-amber-50/50 border-amber-300 shadow-2xs'
                          : 'bg-white border-slate-200/90 shadow-xs hover:border-blue-400 hover:shadow-sm'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        {/* Info Column */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                            <span
                              className={`text-xs font-bold px-2 py-0.5 rounded-md border tabular-nums ${
                                isTaken
                                  ? 'bg-emerald-100/70 text-emerald-800 border-emerald-200'
                                  : isSnoozed
                                  ? 'bg-amber-100 text-amber-900 border-amber-200'
                                  : 'bg-blue-50 text-blue-700 border-blue-100'
                              }`}
                            >
                              {formatTime(item.time)}
                            </span>
                            <span className="text-xs font-semibold text-slate-500">
                              • {item.medication.dosage}
                            </span>

                            {/* Snooze Status Indicator */}
                            {isSnoozed && item.snoozed_until && (
                              <span className="text-[10px] font-bold text-amber-900 bg-amber-100 border border-amber-200 px-1.5 py-0.5 rounded">
                                Snoozed to {new Date(item.snoozed_until).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            )}
                          </div>

                          <h3
                            className={`text-base font-bold truncate ${
                              isTaken
                                ? 'line-through text-slate-400'
                                : 'text-slate-900'
                            }`}
                          >
                            {item.medication.name}
                          </h3>

                          {item.medication.instructions && (
                            <p className="text-xs text-slate-500 mt-0.5 truncate">
                              {item.medication.instructions}
                            </p>
                          )}

                          {isTaken && item.log?.taken_at && (
                            <p className="text-[11px] text-emerald-700 font-bold mt-1.5 flex items-center gap-1">
                              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                              Logged at {new Date(item.log.taken_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          )}
                        </div>

                        {/* Interactive Action Area */}
                        <div className="flex items-center gap-2 shrink-0">
                          {!isTaken && !isSkipped && (
                            <button
                              onClick={(e) => handleSkip(item, e)}
                              className="text-xs font-semibold text-slate-400 hover:text-slate-700 px-2.5 py-1.5 rounded-md hover:bg-slate-100 transition-colors"
                            >
                              Skip
                            </button>
                          )}

                          {/* Checkbox Target (min 44px touch size) */}
                          <div
                            className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all border shadow-2xs ${
                              isTaken
                                ? 'bg-emerald-600 border-emerald-600 text-white'
                                : isSkipped
                                ? 'bg-slate-100 border-slate-300 text-slate-500'
                                : isSnoozed
                                ? 'bg-amber-500 border-amber-500 text-white'
                                : 'bg-slate-50 hover:bg-blue-50 border-slate-300 hover:border-blue-500 text-slate-300 hover:text-blue-600'
                            }`}
                            aria-label={isTaken ? 'Mark as pending' : 'Mark as taken'}
                          >
                            {isLoading ? (
                              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            ) : isTaken ? (
                              <Check className="w-5 h-5 stroke-[3]" />
                            ) : isSkipped ? (
                              <RotateCcw className="w-4 h-4 stroke-[2.2]" />
                            ) : (
                              <div className="w-3.5 h-3.5 rounded-sm border-2 border-slate-300 hover:border-blue-500" />
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
