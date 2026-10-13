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

  // Refill medication
  const handleRefillMedication = async (id: string, amount: number) => {
    try {
      await fetch(`/api/medications/${id}/refill`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount }),
      });
      await fetchData();
    } catch (err) {
      console.error('Failed to refill medication:', err);
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
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col font-sans antialiased">
      {/* App Header */}
      <Header
        todayProgress={{ total: totalDoses, taken: takenDoses }}
        telegramConnected={telegramConfig.user_linked}
        onOpenTelegramModal={() => setIsTelegramModalOpen(true)}
      />

      {/* Main Container - Mobile Centered View */}
      <main className="flex-1 w-full max-w-md mx-auto px-4 py-4 pb-28">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-xs font-semibold">Loading your cabinet...</p>
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
                onRefillMedication={handleRefillMedication}
                onOpenAddModal={() => setIsAddModalOpen(true)}
              />
            )}

            {activeTab === 'history' && <HistoryLogs logs={logs} />}

            {activeTab === 'settings' && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Configuration
                  </h2>
                  <p className="text-xs text-slate-500 font-medium">
                    Database storage and bot notifications
                  </p>
                </div>

                {/* Telegram Bot Card */}
                <div className="bg-white border border-slate-200/90 rounded-2xl p-4 space-y-3 shadow-xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">
                        Telegram Bot Reminder
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {telegramConfig.user_linked
                          ? `Linked to chat ID ${telegramConfig.user_chat_id}`
                          : 'Not linked to an account'}
                      </p>
                    </div>

                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-md border font-bold ${
                        telegramConfig.user_linked
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                    >
                      {telegramConfig.user_linked ? 'Active' : 'Disconnected'}
                    </span>
                  </div>

                  <button
                    onClick={() => setIsTelegramModalOpen(true)}
                    className="w-full py-2.5 rounded-xl border border-slate-300 hover:border-blue-500 bg-white hover:bg-blue-50/50 text-xs font-bold text-slate-700 hover:text-blue-700 transition-colors shadow-2xs"
                  >
                    Open Bot Settings
                  </button>
                </div>

                {/* Environment Info */}
                <div className="bg-white border border-slate-200/90 rounded-2xl p-4 space-y-1.5 shadow-xs">
                  <span className="text-xs font-bold text-slate-900 block">
                    Storage Engine
                  </span>
                  <p className="text-xs text-slate-600 leading-relaxed font-normal">
                    Local SQLite database active at <code className="text-blue-700 font-mono text-[11px] bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">data/meds.db</code>. When deploying to Vercel, this connects to Vercel Postgres.
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
