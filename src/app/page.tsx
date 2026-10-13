'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Header from '@/components/Header';
import BottomNav, { NavTab } from '@/components/BottomNav';
import TodaySchedule from '@/components/TodaySchedule';
import MedicationList from '@/components/MedicationList';
import HistoryLogs from '@/components/HistoryLogs';
import AddMedicationModal from '@/components/AddMedicationModal';
import TelegramSettingsModal from '@/components/TelegramSettingsModal';
import { Medication, ScheduleItem } from '@/lib/types';
import { Send, CheckCircle2, ShieldCheck, Smartphone, ExternalLink } from 'lucide-react';

export default function Home() {
  const [activeTab, setActiveTab] = useState<NavTab>('today');
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isTelegramModalOpen, setIsTelegramModalOpen] = useState(false);

  // Telegram Config State
  const [telegramConfig, setTelegramConfig] = useState({
    has_token: false,
    bot_connected: false,
    bot_username: undefined as string | undefined,
    user_linked: false,
    user_chat_id: undefined as string | undefined,
    telegram_username: undefined as string | undefined,
    link_code: 'MEDS_LOCAL',
  });

  const fetchData = useCallback(async () => {
    try {
      const [schedRes, medsRes, logsRes, tgRes] = await Promise.all([
        fetch('/api/schedule'),
        fetch('/api/medications'),
        fetch('/api/logs'),
        fetch('/api/telegram/settings'),
      ]);

      const [schedData, medsData, logsData, tgData] = await Promise.all([
        schedRes.json(),
        medsRes.json(),
        logsRes.json(),
        tgRes.json(),
      ]);

      if (schedData.success) setSchedule(schedData.schedule);
      if (medsData.success) setMedications(medsData.medications);
      if (logsData.success) setLogs(logsData.logs);
      if (tgData.success) setTelegramConfig(tgData);
    } catch (err) {
      console.error('Failed to load meds data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    // 1. Live auto-refresh of data
    const interval = setInterval(fetchData, 4000);

    // 2. Local dev reminder scheduler (checks every 30s)
    const cronInterval = setInterval(() => {
      fetch('/api/cron/reminders').catch(() => {});
    }, 30000);

    // Initial check on load
    fetch('/api/cron/reminders').catch(() => {});

    return () => {
      clearInterval(interval);
      clearInterval(cronInterval);
    };
  }, [fetchData]);

  // Dose logging handler
  const handleLogDose = async (medicationId: string, status: 'taken' | 'skipped' | 'pending') => {
    try {
      await fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ medication_id: medicationId, status }),
      });
      await fetchData();
    } catch (err) {
      console.error('Failed to log dose:', err);
    }
  };

  // Add medication handler
  const handleAddMedication = async (medData: any) => {
    try {
      await fetch('/api/medications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(medData),
      });
      await fetchData();
    } catch (err) {
      console.error('Failed to add medication:', err);
    }
  };

  // Toggle active medication
  const handleToggleActive = async (id: string, active: boolean) => {
    try {
      await fetch(`/api/medications/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: active ? 1 : 0 }),
      });
      await fetchData();
    } catch (err) {
      console.error('Failed to update active state:', err);
    }
  };

  // Delete medication
  const handleDeleteMedication = async (id: string) => {
    try {
      await fetch(`/api/medications/${id}`, {
        method: 'DELETE',
      });
      await fetchData();
    } catch (err) {
      console.error('Failed to delete medication:', err);
    }
  };

  // Telegram actions
  const handleSaveToken = async (token: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/telegram/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bot_token: token }),
      });
      const data = await res.json();
      await fetchData();
      return Boolean(data.success && data.bot_connected);
    } catch {
      return false;
    }
  };

  const handleUnlink = async () => {
    try {
      await fetch('/api/telegram/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'unlink' }),
      });
      await fetchData();
    } catch (err) {
      console.error('Failed to unlink:', err);
    }
  };

  const handleSendTestReminder = async () => {
    const res = await fetch('/api/telegram/test', {
      method: 'POST',
    });
    const data = await res.json();
    if (!data.success) {
      throw new Error(data.error || 'Failed to send test reminder');
    }
  };

  // Calculate today's adherence stats
  const totalDoses = schedule.length;
  const takenDoses = schedule.filter((s) => s.status === 'taken').length;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col font-sans antialiased">
      {/* App Header */}
      <Header
        todayProgress={{ total: totalDoses, taken: takenDoses }}
        telegramConnected={telegramConfig.user_linked}
        onOpenTelegramModal={() => setIsTelegramModalOpen(true)}
      />

      {/* Main Container - Mobile Centered View */}
      <main className="flex-1 w-full max-w-md mx-auto px-4 py-4 pb-28">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-zinc-400">
            <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-xs font-medium">Loading your cabinet...</p>
          </div>
        ) : (
          <>
            {activeTab === 'today' && (
              <TodaySchedule
                schedule={schedule}
                onLogDose={handleLogDose}
                onSendTestReminder={handleSendTestReminder}
                telegramConnected={telegramConfig.user_linked}
                onOpenTelegramModal={() => setIsTelegramModalOpen(true)}
              />
            )}

            {activeTab === 'medications' && (
              <MedicationList
                medications={medications}
                onToggleActive={handleToggleActive}
                onDeleteMedication={handleDeleteMedication}
                onOpenAddModal={() => setIsAddModalOpen(true)}
              />
            )}

            {activeTab === 'history' && <HistoryLogs logs={logs} />}

            {activeTab === 'settings' && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                    Settings & Integrations
                  </h2>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Manage your local database and Telegram Bot notifications
                  </p>
                </div>

                {/* Telegram Bot Card */}
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 space-y-3 shadow-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                      <Send className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold">Telegram Reminder Bot</h3>
                      <p className="text-xs text-zinc-500">
                        {telegramConfig.user_linked
                          ? 'Connected & actively sending alerts'
                          : 'Not linked to a chat yet'}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setIsTelegramModalOpen(true)}
                    className="w-full py-2.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-xs font-bold transition-colors"
                  >
                    Configure Telegram Bot
                  </button>
                </div>

                {/* Architecture Info Card */}
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 space-y-2 shadow-xs">
                  <div className="flex items-center gap-2 text-xs font-bold text-zinc-800 dark:text-zinc-200">
                    <Smartphone className="w-4 h-4 text-teal-500" />
                    <span>Local Testing Environment</span>
                  </div>
                  <p className="text-[11px] text-zinc-500 leading-relaxed">
                    Database is running on local SQLite (<code className="text-teal-600">data/meds.db</code>). When ready to deploy to Vercel, this seamlessly connects to Vercel Postgres with GitHub.
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Floating Add Medication Modal */}
      <AddMedicationModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddMedication}
      />

      {/* Telegram Configuration Modal */}
      <TelegramSettingsModal
        isOpen={isTelegramModalOpen}
        onClose={() => setIsTelegramModalOpen(false)}
        telegramConfig={telegramConfig}
        onSaveToken={handleSaveToken}
        onUnlink={handleUnlink}
        onSendTestReminder={handleSendTestReminder}
      />

      {/* Mobile Bottom Navigation */}
      <BottomNav
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        onOpenAddModal={() => setIsAddModalOpen(true)}
      />
    </div>
  );
}
