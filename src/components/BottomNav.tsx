'use client';

import React from 'react';
import { Calendar, Pill, History, Settings2, Plus } from 'lucide-react';

export type NavTab = 'today' | 'medications' | 'history' | 'settings';

interface BottomNavProps {
  activeTab: NavTab;
  onChangeTab: (tab: NavTab) => void;
  onOpenAddModal: () => void;
}

export default function BottomNav({ activeTab, onChangeTab, onOpenAddModal }: BottomNavProps) {
  const tabs = [
    { id: 'today' as NavTab, label: 'Today', icon: Calendar },
    { id: 'medications' as NavTab, label: 'Cabinet', icon: Pill },
    { id: 'history' as NavTab, label: 'History', icon: History },
    { id: 'settings' as NavTab, label: 'Bot & Config', icon: Settings2 },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-lg border-t border-zinc-200 dark:border-zinc-800 pb-safe">
      <div className="max-w-md mx-auto px-4 h-16 flex items-center justify-between relative">
        {tabs.slice(0, 2).map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onChangeTab(tab.id)}
              className={`flex-1 flex flex-col items-center justify-center py-1 transition-colors ${
                isActive
                  ? 'text-teal-600 dark:text-teal-400 font-semibold'
                  : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 font-medium'
              }`}
            >
              <Icon className={`w-5 h-5 mb-0.5 ${isActive ? 'stroke-[2.4]' : 'stroke-2'}`} />
              <span className="text-[10px]">{tab.label}</span>
            </button>
          );
        })}

        {/* Center Floating Plus Button to Add Meds */}
        <div className="relative -top-4 flex items-center justify-center px-2">
          <button
            onClick={onOpenAddModal}
            className="w-12 h-12 rounded-full bg-teal-500 hover:bg-teal-600 active:scale-90 text-white shadow-lg shadow-teal-500/30 flex items-center justify-center transition-all"
            aria-label="Add Medication"
          >
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </button>
        </div>

        {tabs.slice(2).map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onChangeTab(tab.id)}
              className={`flex-1 flex flex-col items-center justify-center py-1 transition-colors ${
                isActive
                  ? 'text-teal-600 dark:text-teal-400 font-semibold'
                  : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 font-medium'
              }`}
            >
              <Icon className={`w-5 h-5 mb-0.5 ${isActive ? 'stroke-[2.4]' : 'stroke-2'}`} />
              <span className="text-[10px]">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
