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
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-xs border-b border-slate-200/80 px-4 py-3 shadow-2xs transition-colors">
      <div className="max-w-md mx-auto flex items-center justify-between">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 block">
            {dateStr || 'Today'}
          </span>
          <h1 className="text-lg font-bold tracking-tight text-slate-900">
            Medication Schedule
          </h1>
        </div>

        {/* Telegram Connection Badge */}
        <button
          onClick={onOpenTelegramModal}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border shadow-2xs ${
            telegramConnected
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
              : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
          }`}
          title="Configure Telegram Bot Reminder"
        >
          {telegramConnected ? (
            <Check className="w-3.5 h-3.5 stroke-[2.5] text-emerald-600" />
          ) : (
            <Send className="w-3.5 h-3.5 text-blue-600" />
          )}
          <span>{telegramConnected ? 'Bot Linked' : 'Connect Bot'}</span>
        </button>
      </div>

      {/* Daily Progress Status */}
      {todayProgress.total > 0 && (
        <div className="max-w-md mx-auto mt-3 pt-2.5 border-t border-slate-100">
          <div className="flex justify-between items-baseline text-xs mb-1.5">
            <span className="text-slate-600 font-medium">
              Daily completion
            </span>
            <span className="font-bold text-blue-700 tabular-nums">
              {todayProgress.taken} of {todayProgress.total} doses ({percentage}%)
            </span>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200/60">
            <div
              className={`h-full rounded-full transition-all duration-300 ease-out ${
                percentage === 100 ? 'bg-emerald-500' : 'bg-blue-600'
              }`}
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      )}
    </header>
  );
}
