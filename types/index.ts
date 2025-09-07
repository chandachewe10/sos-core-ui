export type Role = 'user' | 'staff';

export interface StaffRecord {
  id: string;
  phone: string;
  fullName: string;
  email: string;
  address: string;
  password: string; 
  hpczNumber: string;
  nrcUri?: string;
  selfieUri?: string;
  signatureUri?: string;
  approved?: boolean;
  submittedAt: number;
}

export interface SOSRecord {
  id: string;
  phone: string;
  location: {
    latitude: number;
    longitude: number;
  };
  note?: string;
  createdAt: number;
}

export interface OTPStore {
  phone: string;
  code: string;
  createdAt: number;
}