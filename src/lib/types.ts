export interface User {
  id: string;
  name: string;
  telegram_chat_id: string | null;
  telegram_username: string | null;
  telegram_link_code: string;
  created_at: string;
}

export interface Medication {
  id: string;
  user_id: string;
  name: string;
  dosage: string;
  instructions: string;
  scheduled_time: string; // "HH:MM" in 24h format, e.g. "08:00"
  color: string; // "emerald" | "sky" | "indigo" | "amber" | "rose"
  icon: string; // "pill" | "capsule" | "liquid" | "tablet"
  active: number; // 1 or 0
  created_at: string;
}

export interface MedLog {
  id: string;
  medication_id: string;
  user_id: string;
  scheduled_date: string; // "YYYY-MM-DD"
  scheduled_time: string; // "HH:MM"
  status: 'taken' | 'pending' | 'skipped';
  taken_at: string | null;
  created_at: string;
}

export interface ScheduleItem {
  medication: Medication;
  log?: MedLog;
  status: 'taken' | 'pending' | 'skipped';
  time: string;
}

export interface TelegramConfig {
  bot_token?: string;
  bot_username?: string;
  is_connected: boolean;
  chat_id?: string;
  username?: string;
  link_code: string;
}
