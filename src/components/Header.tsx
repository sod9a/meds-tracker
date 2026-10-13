'use client';

import React, { useState, useEffect } from 'react';
import { Pill, Send } from 'lucide-react';

interface HeaderProps {
  todayProgress: { total: number; taken: number };
  telegramConnected: boolean;
  onOpenTelegramModal: () => void;
}

export default function Header({ todayProgress, telegramConnected, onOpenTelegramModal }: HeaderProps) {
  const [dateStr, setDateStr] = useState<string>('Today');

  useEffect(() => {
    const today = new Date();
    setDateStr(
      today.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      })
    );
  }, []);

  const percentage = todayProgress.total > 0
    ? Math.round((todayProgress.taken / todayProgress.total) * 100)
    : 0;

  return (
    <header className="sticky top-0 z-30 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 px-4 py-3 transition-colors">
      <div className="max-w-md mx-auto flex items-center justify-between">
        {/* App Title & Date */}
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-teal-500/10 dark:bg-teal-400/20 text-teal-600 dark:text-teal-400 flex items-center justify-center shadow-inner">
            <Pill className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <h1 className="text-base font-bold text-zinc-900 dark:text-zinc-100 leading-tight">
              Meds Tracker
            </h1>
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              {dateStr}
            </p>
          </div>
        </div>

        {/* Telegram Status Pill Button */}
        <button
          onClick={onOpenTelegramModal}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all shadow-xs active:scale-95 ${
            telegramConnected
              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
              : 'bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-400 border border-sky-200 dark:border-sky-800 animate-pulse'
          }`}
          title="Configure Telegram Bot Reminder"
        >
          <Send className="w-3.5 h-3.5" />
          <span>{telegramConnected ? 'Bot Linked' : 'Connect Bot'}</span>
        </button>
      </div>

      {/* Progress Bar for Daily Adherence */}
      {todayProgress.total > 0 && (
        <div className="max-w-md mx-auto mt-2.5">
          <div className="flex justify-between items-center text-[11px] text-zinc-500 dark:text-zinc-400 font-medium mb-1">
            <span>Daily Progress</span>
            <span className="font-semibold text-zinc-700 dark:text-zinc-300">
              {todayProgress.taken} of {todayProgress.total} taken ({percentage}%)
            </span>
          </div>
          <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-teal-500 h-full rounded-full transition-all duration-500 ease-out"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      )}
    </header>
  );
}
