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
  try {
    const formData = new FormData();
    formData.append('phone_number', phone);

    const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/signup`, {
      method: 'POST',
      body: formData,
    });


    const data = await response.json();


    return {
      status: response.status,
      ok: response.ok,
      data,
    };
  } catch (error: any) {

    return {
      success: false,
      message: error.message || 'Failed to send OTP',
    };
  }
}


export async function verifyOtp(phone: string, code: string, token: string) {
  console.log(`Verifying OTP: ${code} for user: ${phone}`);

  const formData = new FormData();
  formData.append('otp_code', code);
  formData.append('phone_number', phone || '');

  try {
    const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/verifyOtp`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
      body: formData,
    });

    const data = await response.json();
    console.log('OTP verification response:', data);

    if (!response.ok) {
      throw new Error(data.message || 'OTP verification failed');
    }

    return data;
  } catch (error: any) {

    return {
      success: false,
      message: error.message || 'Failed to verify OTP',
    };
  }
}


export async function createStaff(payload: {
  phone: string;
  fullName: string;
  email: string;
  address: string;
  password: string;
  hpczNumber: string;
  nrcNumber: string;
  nrc: string;
  selfie: string;
}) {
  try {
    const formData = new FormData();
    formData.append('phone', payload.phone);
    formData.append('fullName', payload.fullName);
    formData.append('email', payload.email);
    formData.append('address', payload.address);
    formData.append('password', payload.password);
    formData.append('hpczNumber', payload.hpczNumber);
    formData.append('nrcNumber', payload.nrcNumber);
    formData.append('nrc', payload.nrc);
    formData.append('selfie', payload.selfie);

    const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/createMedicalStaff`, {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();

    return {
      status: response.status,
      ok: response.ok,
      data,
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Failed to submit staff registration',
    };
  }
}




export async function submitStaffSignature(payload: {
  token: string;
  phone: string;
  signature: string;
}) {
  try {
    const formData = new FormData();
    formData.append('phone', payload.phone);
    formData.append('signature', payload.signature); 

    const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/signature`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${payload.token}`,
      },
      body: formData,
    });

    const data = await response.json();

    return {
      status: response.status,
      ok: response.ok,
      data,
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Failed to submit signature',
    };
  }
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