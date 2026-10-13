'use client';

import React, { useState } from 'react';
import { X, Send, Key, CheckCircle2, AlertCircle, ExternalLink } from 'lucide-react';

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
        setFeedback({ type: 'success', message: 'Bot token verified and saved.' });
        setTokenInput('');
      } else {
        setFeedback({ type: 'error', message: 'Invalid Bot Token. Check the token from @BotFather.' });
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
      setFeedback({ type: 'success', message: 'Test message delivered to Telegram.' });
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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/40 backdrop-blur-2xs transition-opacity animate-in fade-in">
      <div className="w-full max-w-md bg-white rounded-t-2xl sm:rounded-2xl border border-slate-200 shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Telegram Reminder Integration
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Connect your personal bot for automated notifications
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4 overflow-y-auto">
          {feedback && (
            <div
              className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 border shadow-2xs ${
                feedback.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border-rose-200'
              }`}
            >
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              )}
              <span>{feedback.message}</span>
            </div>
          )}

          {/* Current Status Box */}
          <div className="bg-blue-50/60 rounded-2xl p-3.5 border border-blue-100 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-600 font-medium">Bot Connection</span>
              <span className="font-bold text-slate-900">
                {telegramConfig.bot_connected
                  ? `Connected (@${telegramConfig.bot_username})`
                  : 'Disconnected'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-600 font-medium">User Account</span>
              <span className="font-bold text-slate-900">
                {telegramConfig.user_linked ? 'Linked' : 'Not linked'}
              </span>
            </div>

            {telegramConfig.user_linked && (
              <div className="pt-2 border-t border-blue-100 flex justify-between items-center text-[11px]">
                <span className="text-blue-800 font-mono font-medium">
                  Chat ID: {telegramConfig.user_chat_id}
                </span>
                <button
                  onClick={onUnlink}
                  className="text-rose-600 hover:text-rose-700 font-bold"
                >
                  Unlink
                </button>
              </div>
            )}
          </div>

          {/* Step 1: Set Bot Token */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-800">
              1. Telegram Bot Token
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed font-normal">
              Create a bot via <a href="https://t.me/BotFather" target="_blank" rel="noreferrer" className="text-blue-600 font-bold underline">@BotFather</a> with <code className="bg-blue-50 text-blue-700 border border-blue-100 px-1 rounded text-[11px] font-mono">/newbot</code>, then save the API token:
            </p>

            <form onSubmit={handleSave} className="flex gap-2">
              <input
                type="password"
                placeholder={telegramConfig.has_token ? '•••••••••••• (Configured)' : 'Paste API Token'}
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-hidden"
              />
              <button
                type="submit"
                disabled={saving || !tokenInput.trim()}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors disabled:opacity-40 shadow-2xs"
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
            </form>
          </div>

          {/* Step 2: Link Chat */}
          {telegramConfig.bot_connected && !telegramConfig.user_linked && (
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <h3 className="text-xs font-bold text-slate-800">
                2. Link Your Telegram Chat
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Open your bot in Telegram and start the chat:
              </p>

              {telegramDeepLink && (
                <a
                  href={telegramDeepLink}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors shadow-2xs"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Open @{telegramConfig.bot_username}</span>
                  <ExternalLink className="w-3 h-3 ml-0.5" />
                </a>
              )}

              <p className="text-[11px] text-slate-400 text-center">
                Or send this command in chat: <code className="font-mono text-slate-700 bg-slate-100 px-1 py-0.5 rounded">/start {telegramConfig.link_code}</code>
              </p>
            </div>
          )}

          {/* Step 3: Test Notification */}
          {telegramConfig.user_linked && (
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <h3 className="text-xs font-bold text-slate-800">
                Verify Connection
              </h3>
              <button
                type="button"
                onClick={handleTest}
                disabled={testing}
                className="w-full py-2.5 rounded-xl border border-blue-200 bg-blue-50/70 hover:bg-blue-100 text-blue-700 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 shadow-2xs"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{testing ? 'Sending alert…' : 'Send Test Reminder to Phone'}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
