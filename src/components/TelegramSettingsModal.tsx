'use client';

import React, { useState } from 'react';
import { X, Send, Key, CheckCircle2, AlertCircle, ExternalLink, RefreshCw } from 'lucide-react';

interface TelegramSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  telegramConfig: {
    has_token: boolean;
    bot_connected: boolean;
    bot_username?: string;
    user_linked: boolean;
    user_chat_id?: string;
    telegram_username?: string;
    link_code: string;
  };
  onSaveToken: (token: string) => Promise<boolean>;
  onUnlink: () => Promise<void>;
  onSendTestReminder: () => Promise<void>;
}

export default function TelegramSettingsModal({
  isOpen,
  onClose,
  telegramConfig,
  onSaveToken,
  onUnlink,
  onSendTestReminder,
}: TelegramSettingsModalProps) {
  const [tokenInput, setTokenInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenInput.trim()) return;

    setSaving(true);
    setFeedback(null);
    try {
      const ok = await onSaveToken(tokenInput.trim());
      if (ok) {
        setFeedback({ type: 'success', message: 'Bot token verified and saved successfully!' });
        setTokenInput('');
      } else {
        setFeedback({ type: 'error', message: 'Invalid Bot Token. Please check the token from @BotFather.' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to save token' });
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    setFeedback(null);
    try {
      await onSendTestReminder();
      setFeedback({ type: 'success', message: 'Test message sent to your Telegram chat!' });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to send test reminder' });
    } finally {
      setTesting(false);
    }
  };

  const telegramDeepLink = telegramConfig.bot_username
    ? `https://t.me/${telegramConfig.bot_username}?start=${telegramConfig.link_code}`
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in">
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-t-3xl sm:rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 flex items-center justify-center">
              <Send className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              Telegram Bot Reminder
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4 overflow-y-auto">
          {feedback && (
            <div
              className={`p-3 rounded-xl text-xs font-medium flex items-center gap-2 ${
                feedback.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                  : 'bg-rose-50 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
              }`}
            >
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{feedback.message}</span>
            </div>
          )}

          {/* Current Status Box */}
          <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl p-3.5 border border-zinc-200 dark:border-zinc-700/60 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-zinc-600 dark:text-zinc-400">Bot Connection</span>
              <span
                className={`font-bold flex items-center gap-1 ${
                  telegramConfig.bot_connected
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-zinc-400'
                }`}
              >
                {telegramConfig.bot_connected
                  ? `Active (@${telegramConfig.bot_username})`
                  : 'Not Connected'}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-zinc-600 dark:text-zinc-400">User Account</span>
              <span
                className={`font-bold ${
                  telegramConfig.user_linked
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-amber-500'
                }`}
              >
                {telegramConfig.user_linked ? 'Linked ✅' : 'Not Linked Yet'}
              </span>
            </div>

            {telegramConfig.user_linked && (
              <div className="pt-2 border-t border-zinc-200 dark:border-zinc-700 flex justify-between items-center text-[11px]">
                <span className="text-zinc-500">
                  Chat ID: {telegramConfig.user_chat_id}
                </span>
                <button
                  onClick={onUnlink}
                  className="text-rose-500 hover:text-rose-600 font-semibold"
                >
                  Unlink
                </button>
              </div>
            )}
          </div>

          {/* Step 1: Set Bot Token */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-teal-600" />
              <span>Step 1: Set Bot Token</span>
            </h4>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Create a bot on Telegram via{' '}
              <a
                href="https://t.me/BotFather"
                target="_blank"
                rel="noreferrer"
                className="text-sky-600 font-semibold underline"
              >
                @BotFather
              </a>{' '}
              using <code className="bg-zinc-100 dark:bg-zinc-800 px-1 rounded">/newbot</code>, then paste the API token below:
            </p>

            <form onSubmit={handleSave} className="flex gap-2">
              <input
                type="password"
                placeholder={telegramConfig.has_token ? '•••••••••••• (Token set)' : 'Paste 123456:ABC... token'}
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                className="flex-1 px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-900 dark:text-zinc-100 focus:outline-hidden"
              />
              <button
                type="submit"
                disabled={saving || !tokenInput.trim()}
                className="px-3.5 py-2 rounded-xl bg-teal-500 hover:bg-teal-600 text-white text-xs font-bold transition-all disabled:opacity-40"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </form>
          </div>

          {/* Step 2: Link Your Telegram Chat */}
          {telegramConfig.bot_connected && !telegramConfig.user_linked && (
            <div className="space-y-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
              <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                <Send className="w-3.5 h-3.5 text-sky-500" />
                <span>Step 2: Link Your Account</span>
              </h4>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Click the button below to start your bot on Telegram. It will automatically connect your account:
              </p>

              {telegramDeepLink && (
                <a
                  href={telegramDeepLink}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 active:scale-95 text-white text-xs font-bold shadow-xs transition-all"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Open @{telegramConfig.bot_username} in Telegram</span>
                  <ExternalLink className="w-3 h-3 ml-1" />
                </a>
              )}

              <div className="text-center">
                <p className="text-[11px] text-zinc-400">
                  Or send this message manually to your bot:
                </p>
                <code className="text-xs font-mono font-bold text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded-md inline-block mt-1">
                  /start {telegramConfig.link_code}
                </code>
              </div>
            </div>
          )}

          {/* Step 3: Test Notification */}
          {telegramConfig.user_linked && (
            <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 space-y-2">
              <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                Test Reminder Alert
              </h4>
              <button
                type="button"
                onClick={handleTest}
                disabled={testing}
                className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{testing ? 'Sending alert...' : 'Send Live Test Reminder to Phone'}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
