import { getDatabase } from './db';
import { Medication, MedLog, ScheduleItem, User } from './types';

const DEFAULT_USER_ID = 'default-user';

export function getDefaultUser(): User {
  const db = getDatabase();
  const row = db.prepare('SELECT * FROM users WHERE id = ?').get(DEFAULT_USER_ID) as any;
  if (!row) {
    throw new Error('Default user not found');
  }
  return {
    id: row.id,
    name: row.name,
    telegram_chat_id: row.telegram_chat_id,
    telegram_username: row.telegram_username,
    telegram_link_code: row.telegram_link_code,
    created_at: row.created_at,
  };
}

export function getUserByLinkCode(code: string): User | null {
  const db = getDatabase();
  const row = db.prepare('SELECT * FROM users WHERE telegram_link_code = ?').get(code) as any;
  if (!row) return null;
  return row as User;
}

export function linkTelegramUser(linkCode: string, chatId: string, username?: string): boolean {
  const db = getDatabase();
  const user = getUserByLinkCode(linkCode);
  if (!user) return false;

  db.prepare(`
    UPDATE users 
    SET telegram_chat_id = ?, telegram_username = ? 
    WHERE id = ?
  `).run(chatId, username || null, user.id);
  return true;
}

export function unlinkTelegram(userId: string = DEFAULT_USER_ID): void {
  const db = getDatabase();
  db.prepare(`
    UPDATE users 
    SET telegram_chat_id = NULL, telegram_username = NULL 
    WHERE id = ?
  `).run(userId);
}

export function getAllMedications(userId: string = DEFAULT_USER_ID): Medication[] {
  const db = getDatabase();
  const rows = db.prepare(`
    SELECT * FROM medications 
    WHERE user_id = ? 
    ORDER BY scheduled_time ASC
  `).all(userId) as any[];

  return rows.map((r) => ({
    id: r.id,
    user_id: r.user_id,
    name: r.name,
    dosage: r.dosage,
    instructions: r.instructions || '',
    scheduled_time: r.scheduled_time,
    color: r.color || 'emerald',
    icon: r.icon || 'pill',
    active: Number(r.active),
    created_at: r.created_at,
  }));
}

export function addMedication(med: Omit<Medication, 'id' | 'created_at'>): Medication {
  const db = getDatabase();
  const id = 'med-' + Date.now();
  const createdAt = new Date().toISOString();

  db.prepare(`
    INSERT INTO medications (id, user_id, name, dosage, instructions, scheduled_time, color, icon, active, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    med.user_id || DEFAULT_USER_ID,
    med.name,
    med.dosage,
    med.instructions || '',
    med.scheduled_time,
    med.color || 'emerald',
    med.icon || 'pill',
    med.active ?? 1,
    createdAt
  );

  return {
    id,
    created_at: createdAt,
    ...med,
  };
}

export function updateMedication(id: string, updates: Partial<Medication>): void {
  const db = getDatabase();
  const fields: string[] = [];
  const values: any[] = [];

  for (const [key, val] of Object.entries(updates)) {
    if (['name', 'dosage', 'instructions', 'scheduled_time', 'color', 'icon', 'active'].includes(key)) {
      fields.push(`${key} = ?`);
      values.push(val);
    }
  }

  if (fields.length === 0) return;

  values.push(id);
  db.prepare(`UPDATE medications SET ${fields.join(', ')} WHERE id = ?`).run(...values);
}

export function deleteMedication(id: string): void {
  const db = getDatabase();
  db.prepare('DELETE FROM med_logs WHERE medication_id = ?').run(id);
  db.prepare('DELETE FROM medications WHERE id = ?').run(id);
}

export function getTodaySchedule(userId: string = DEFAULT_USER_ID, dateStr?: string): ScheduleItem[] {
  const db = getDatabase();
  const date = dateStr || new Date().toISOString().slice(0, 10);

  const meds = db.prepare(`
    SELECT * FROM medications 
    WHERE user_id = ? AND active = 1 
    ORDER BY scheduled_time ASC
  `).all(userId) as any[];

  const logs = db.prepare(`
    SELECT * FROM med_logs 
    WHERE user_id = ? AND scheduled_date = ?
  `).all(userId, date) as any[];

  const logsMap = new Map<string, MedLog>();
  for (const log of logs) {
    logsMap.set(log.medication_id, log as MedLog);
  }

  return meds.map((med) => {
    const log = logsMap.get(med.id);
    return {
      medication: med as Medication,
      log,
      status: log ? log.status : 'pending',
      time: med.scheduled_time,
    };
  });
}

export function logMedicationDose(
  medicationId: string,
  userId: string = DEFAULT_USER_ID,
  status: 'taken' | 'pending' | 'skipped' = 'taken',
  dateStr?: string
): MedLog {
  const db = getDatabase();
  const date = dateStr || new Date().toISOString().slice(0, 10);
  const now = new Date().toISOString();

  // Find medication time
  const med = db.prepare('SELECT scheduled_time FROM medications WHERE id = ?').get(medicationId) as any;
  const scheduledTime = med ? med.scheduled_time : '08:00';

  const existing = db.prepare(`
    SELECT * FROM med_logs 
    WHERE medication_id = ? AND user_id = ? AND scheduled_date = ?
  `).get(medicationId, userId, date) as any;

  if (existing) {
    db.prepare(`
      UPDATE med_logs 
      SET status = ?, taken_at = ? 
      WHERE id = ?
    `).run(status, status === 'taken' ? now : null, existing.id);

    return {
      ...existing,
      status,
      taken_at: status === 'taken' ? now : null,
    };
  }

  const id = 'log-' + Date.now();
  db.prepare(`
    INSERT INTO med_logs (id, medication_id, user_id, scheduled_date, scheduled_time, status, taken_at, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, medicationId, userId, date, scheduledTime, status, status === 'taken' ? now : null, now);

  return {
    id,
    medication_id: medicationId,
    user_id: userId,
    scheduled_date: date,
    scheduled_time: scheduledTime,
    status,
    taken_at: status === 'taken' ? now : null,
    created_at: now,
  };
}

export function getHistoryLogs(userId: string = DEFAULT_USER_ID, limit: number = 7) {
  const db = getDatabase();
  const rows = db.prepare(`
    SELECT l.*, m.name as med_name, m.dosage, m.color
    FROM med_logs l
    JOIN medications m ON l.medication_id = m.id
    WHERE l.user_id = ?
    ORDER BY l.scheduled_date DESC, l.scheduled_time DESC
    LIMIT ?
  `).all(userId, limit * 5) as any[];

  return rows;
}

export function getAppSetting(key: string): string | null {
  const db = getDatabase();
  const row = db.prepare('SELECT value FROM app_settings WHERE key = ?').get(key) as any;
  return row ? row.value : null;
}

export function setAppSetting(key: string, value: string): void {
  const db = getDatabase();
  db.prepare(`
    INSERT INTO app_settings (key, value)
    VALUES (?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value
  `).run(key, value);
}
