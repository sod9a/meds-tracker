'use client';

import React from 'react';
import { Calendar, Package, History, Settings } from 'lucide-react';

export type NavTab = 'today' | 'medications' | 'history' | 'settings';

interface BottomNavProps {
  activeTab: NavTab;
  onChangeTab: (tab: NavTab) => void;
  onOpenAddModal: () => void;
}

export default function BottomNav({ activeTab, onChangeTab }: BottomNavProps) {
  const tabs = [
    { id: 'today' as NavTab, label: 'Today', icon: Calendar },
    { id: 'medications' as NavTab, label: 'Cabinet', icon: Package },
    { id: 'history' as NavTab, label: 'Logs', icon: History },
    { id: 'settings' as NavTab, label: 'Settings', icon: Settings },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800 pb-safe">
      <div className="max-w-md mx-auto px-2 h-14 flex items-center justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onChangeTab(tab.id)}
              className={`flex-1 h-full flex flex-col items-center justify-center transition-colors min-h-[44px] ${
                isActive
                  ? 'text-zinc-900 dark:text-zinc-100 font-semibold'
                  : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 font-medium'
              }`}
            >
              <Icon className={`w-4 h-4 mb-1 ${isActive ? 'stroke-[2.4] text-emerald-600 dark:text-emerald-400' : 'stroke-[1.8]'}`} />
              <span className="text-[11px] leading-none">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
