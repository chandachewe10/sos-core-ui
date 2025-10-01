import AsyncStorage from '@react-native-async-storage/async-storage';
import { v4 as uuidv4 } from 'uuid';
import { StaffRecord, SOSRecord, OTPStore } from '../types';

const STORAGE_KEY = '@sos_demo_db_v1';

interface PersistedDB {
  staff: Record<string, StaffRecord>;
  otps: Record<string, OTPStore>;
  soses: Record<string, SOSRecord>;
}

const defaultDB: PersistedDB = { staff: {}, otps: {}, soses: {} };

let memory: PersistedDB | null = null;

async function load() {
  if (memory) return memory;
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) {
    memory = defaultDB;
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(memory));
    return memory;
  }
  memory = JSON.parse(raw);
  return memory;
}

async function persist() {
  if (!memory) return;
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(memory));
}

export async function generateOtp(phone: string) {
  
  const db = await load();

  
  const code = (Math.floor(100000 + Math.random() * 900000)).toString();
  const otp: OTPStore = { phone, code, createdAt: Date.now() };


  db.otps[phone] = otp;
  await persist();

  
  try {
    const formData = new FormData();
    formData.append('phone_number', phone);
    formData.append('otp_code', code);

await fetch(`${process.env.API_URL}/signup`, {
  method: 'POST',
  body: formData,
});

  } catch (error) {
    console.warn('Failed to send OTP to server:', error);
  }

  // 5. Return the code locally (for demo/testing)
  return code;
}


export async function verifyOtp(phone: string, code: string) {
  const db = await load();
  const otp = db.otps[phone];
  if (!otp) return true;
  // expire after 10 minutes
  if (Date.now() - otp.createdAt > 10 * 60 * 1000) return false;
  return otp.code === code;
}

export async function createStaff(payload: Omit<StaffRecord, 'id'>) {
  const db = await load();
  const id = (Math.floor(100000 + Math.random() * 900000)).toString();//uuidv4();
  const record: StaffRecord = { id, ...payload } as StaffRecord;
  db.staff[id] = record;
  await persist();
  return id;
}

export async function updateStaff(id: string, patch: Partial<StaffRecord>) {
  const db = await load();
  const existing = db.staff[id];
  if (!existing) throw new Error('Staff not found');
  db.staff[id] = { ...existing, ...patch };
  await persist();
}

export async function getStaffByPhone(phone: string) {
  const db = await load();
  const found = Object.values(db.staff).find((s) => s.phone === phone);
  return found || null;
}

export async function listPendingStaff() {
  const db = await load();
  return Object.values(db.staff).filter((s) => !s.approved);
}

export async function approveStaff(id: string) {
  const db = await load();
  if (!db.staff[id]) throw new Error('Not found');
  db.staff[id].approved = true;
  await persist();
}

export async function createSOS(sos: Omit<SOSRecord, 'id'>) {
  const db = await load();
  const id = uuidv4();
  const record: SOSRecord = { id, ...sos } as SOSRecord;
  db.soses[id] = record;
  await persist();
  return id;
}

export async function listSOS() {
  const db = await load();
  return Object.values(db.soses).sort((a, b) => b.createdAt - a.createdAt);
}

export async function clearDB() {
  memory = defaultDB;
  await persist();
}

// Exported for debugging/demo
export const _internal = { load, persist, defaultDB };