import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import fs from 'fs';

let dbInstance: DatabaseSync | null = null;

export function getDatabase(): DatabaseSync {
  if (dbInstance) {
    return dbInstance;
  }

  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const dbPath = path.join(dataDir, 'meds.db');
  const db = new DatabaseSync(dbPath);

  // Enable WAL mode for better concurrency
  db.exec('PRAGMA journal_mode = WAL;');
  db.exec('PRAGMA foreign_keys = ON;');

  // Initialize Tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      telegram_chat_id TEXT,
      telegram_username TEXT,
      telegram_link_code TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS medications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      dosage TEXT NOT NULL,
      instructions TEXT DEFAULT '',
      scheduled_time TEXT NOT NULL,
      color TEXT DEFAULT 'emerald',
      icon TEXT DEFAULT 'pill',
      active INTEGER DEFAULT 1,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS med_logs (
      id TEXT PRIMARY KEY,
      medication_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      scheduled_date TEXT NOT NULL,
      scheduled_time TEXT NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('taken', 'pending', 'skipped')),
      taken_at TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  // Seed default user if not exists
  const existingUser = db.prepare('SELECT id FROM users WHERE id = ?').get('default-user');
  if (!existingUser) {
    const linkCode = 'MEDS_' + Math.floor(100000 + Math.random() * 900000);
    db.prepare(`
      INSERT INTO users (id, name, telegram_link_code, created_at)
      VALUES (?, ?, ?, ?)
    `).run('default-user', 'My Meds', linkCode, new Date().toISOString());

    // Also add sample starter medications so the app immediately looks great
    const sampleMeds = [
      {
        id: 'med-1',
        name: 'Omega-3 Fish Oil',
        dosage: '1000mg, 1 softgel',
        instructions: 'After breakfast with water',
        scheduled_time: '08:00',
        color: 'amber',
        icon: 'capsule'
      },
      {
        id: 'med-2',
        name: 'Multivitamin Complex',
        dosage: '1 tablet',
        instructions: 'With lunch',
        scheduled_time: '13:00',
        color: 'emerald',
        icon: 'tablet'
      },
      {
        id: 'med-3',
        name: 'Magnesium Glycinate',
        dosage: '200mg',
        instructions: '30 mins before sleep',
        scheduled_time: '21:30',
        color: 'indigo',
        icon: 'pill'
      }
    ];

    const insertMed = db.prepare(`
      INSERT INTO medications (id, user_id, name, dosage, instructions, scheduled_time, color, icon, active, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
    `);

    for (const med of sampleMeds) {
      insertMed.run(
        med.id,
        'default-user',
        med.name,
        med.dosage,
        med.instructions,
        med.scheduled_time,
        med.color,
        med.icon,
        new Date().toISOString()
      );
    }
  }

  dbInstance = db;
  return db;
}
