'use client';

import React, { useState, useEffect } from 'react';
import { Send, Check } from 'lucide-react';

interface HeaderProps {
  todayProgress: { total: number; taken: number };
  telegramConnected: boolean;
  onOpenTelegramModal: () => void;
}

export default function Header({ todayProgress, telegramConnected, onOpenTelegramModal }: HeaderProps) {
  const [dateStr, setDateStr] = useState<string>('');

  useEffect(() => {
    const today = new Date();
    setDateStr(
      today.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
      })
    );
  }, []);

  const percentage = todayProgress.total > 0
    ? Math.round((todayProgress.taken / todayProgress.total) * 100)
    : 0;

  return (
    <header className="sticky top-0 z-30 bg-zinc-50/95 dark:bg-zinc-950/95 border-b border-zinc-200 dark:border-zinc-800 px-4 py-3 transition-colors">
      <div className="max-w-md mx-auto flex items-center justify-between">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block">
            {dateStr || 'Today'}
          </span>
          <h1 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            Medication Schedule
          </h1>
        </div>

        {/* Telegram Connection Badge - Functional, no pulsing */}
        <button
          onClick={onOpenTelegramModal}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
            telegramConnected
              ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
              : 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border-zinc-300 dark:border-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-700'
          }`}
          title="Configure Telegram Bot Reminder"
        >
          {telegramConnected ? (
            <Check className="w-3.5 h-3.5 stroke-[2.5] text-emerald-600 dark:text-emerald-400" />
          ) : (
            <Send className="w-3.5 h-3.5 text-zinc-500" />
          )}
          <span>{telegramConnected ? 'Telegram Linked' : 'Connect Bot'}</span>
        </button>
      </div>

      {/* Daily Progress Status */}
      {todayProgress.total > 0 && (
        <div className="max-w-md mx-auto mt-3 pt-2.5 border-t border-zinc-100 dark:border-zinc-900">
          <div className="flex justify-between items-baseline text-xs mb-1.5">
            <span className="text-zinc-600 dark:text-zinc-400 font-medium">
              Daily completion
            </span>
            <span className="font-semibold text-zinc-900 dark:text-zinc-200 tabular-nums">
              {todayProgress.taken} of {todayProgress.total} doses ({percentage}%)
            </span>
          </div>
          <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-emerald-600 dark:bg-emerald-500 h-full rounded-full transition-all duration-300 ease-out"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      )}
    </header>
  );
}
