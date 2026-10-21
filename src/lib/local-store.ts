import fs from 'fs';
import path from 'path';
import { User, Ticket, AuditLog } from '@/types/database';

const DATA_DIR = path.join(process.cwd(), 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const TICKETS_FILE = path.join(DATA_DIR, 'tickets.json');
const AUDIT_FILE = path.join(DATA_DIR, 'audit_logs.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    try {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    } catch {}
  }
}

function readJsonFile<T>(filePath: string): T[] {
  ensureDataDir();
  if (!fs.existsSync(filePath)) return [];
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function writeJsonFile<T>(filePath: string, data: T[]) {
  ensureDataDir();
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error(`Failed to write local database file ${filePath}:`, err);
  }
}

export const localDb = {
  getUsers: (): User[] => readJsonFile<User>(USERS_FILE),
  saveUsers: (users: User[]) => writeJsonFile<User>(USERS_FILE, users),
  
  getTickets: (): Ticket[] => readJsonFile<Ticket>(TICKETS_FILE),
  saveTickets: (tickets: Ticket[]) => writeJsonFile<Ticket>(TICKETS_FILE, tickets),
  
  getAuditLogs: (): AuditLog[] => readJsonFile<AuditLog>(AUDIT_FILE),
  saveAuditLogs: (logs: AuditLog[]) => writeJsonFile<AuditLog>(AUDIT_FILE, logs),
};
