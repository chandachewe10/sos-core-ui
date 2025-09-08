import React, { createContext, useContext, useEffect, useState } from 'react';
import { StaffRecord } from '../types';
import * as DB from '../lib/db';

type AuthUser =
  | { role: 'user'; phone: string }
  | { role: 'staff'; phone: string; staffId: string }
  | null;

interface AuthContextValue {
  user: AuthUser;
  loading: boolean;
  loginUser: (phone: string) => Promise<void>;
  logout: () => Promise<void>;
  registerStaff: (payload: Omit<StaffRecord, 'id' | 'submittedAt' | 'approved'>) => Promise<string>;
  submitStaffSignature: (staffId: string, signatureUri: string) => Promise<void>;
  loginStaff: (phone: string, password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    
  }, []);

  async function loginUser(phone: string) {
    setLoading(true);
    try {
     
      setUser({ role: 'user', phone });
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    setUser(null);
  }

  async function registerStaff(payload: Omit<StaffRecord, 'id' | 'submittedAt' | 'approved'>) {
    setLoading(true);
    try {
      const staffId = await DB.createStaff({ ...payload, submittedAt: Date.now(), approved: false });
      return staffId;
    } finally {
      setLoading(false);
    }
  }

  async function submitStaffSignature(staffId: string, signatureUri: string) {
    setLoading(true);
    try {
      await DB.updateStaff(staffId, { signatureUri });
    } finally {
      setLoading(false);
    }
  }

  async function loginStaff(phone: string, password: string) {
    setLoading(true);
    try {
      const staff = await DB.getStaffByPhone(phone);
      if (!staff) throw new Error('Account not found');
      if (staff.password !== password) throw new Error('Invalid credentials');
      if (!staff.approved) throw new Error('Account pending approval');
      setUser({ role: 'staff', phone: staff.phone, staffId: staff.id });
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, loginUser, logout, registerStaff, submitStaffSignature, loginStaff }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}