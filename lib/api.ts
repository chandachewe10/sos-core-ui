import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * API client for the SOS app.
 *
 * NOTES / ASSUMPTIONS:
 * - Update BASE_URL to point at your backend if you don't set it via setBaseUrl.
 * - Assumed endpoints (feel free to change to match your backend):
 *   POST /auth/send-otp            { phone }
 *   POST /auth/verify-otp          { phone, code }
 *   POST /staff/register           multipart/form-data (fields + files)
 *   POST /staff/login              { phone, password }
 *   POST /staff/submit-signature   { staffId, signatureDataUrl }
 *   GET  /staff/pending
 *   POST /staff/:id/approve
 *   POST /sos                      { latitude, longitude, description }
 *   GET  /sos                      (list of SOS events for staff)
 *   GET  /me                       (profile)
 *
 * If your API paths differ rename the methods or change the path constants below.
 */

const STORAGE_TOKEN_KEY = '@sos_app_token';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export type StaffRegistrationPayload = {
  fullName: string;
  phone: string;
  email: string;
  address?: string;
  password: string;
  passwordConfirm?: string;
  hpczNumber?: string;
  // For files, pass objects with { uri, name, type } compatible with React Native ImagePicker
  nrcFile?: { uri: string; name?: string; type?: string } | null;
  selfieFile?: { uri: string; name?: string; type?: string } | null;
};

export type SosPayload = {
  latitude: number;
  longitude: number;
  description?: string;
};

class ApiClient {
  private baseUrl: string;
  private timeoutMs: number;
  private token: string | null = null;

  constructor(baseUrl = '', timeoutMs = 15000) {
    this.baseUrl = baseUrl;
    this.timeoutMs = timeoutMs;
  }

  setBaseUrl(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/+$/, '');
  }

  async setToken(token: string | null) {
    this.token = token;
    if (token) {
      await AsyncStorage.setItem(STORAGE_TOKEN_KEY, token);
    } else {
      await AsyncStorage.removeItem(STORAGE_TOKEN_KEY);
    }
  }

  async loadTokenFromStorage() {
    const t = await AsyncStorage.getItem(STORAGE_TOKEN_KEY);
    this.token = t;
    return t;
  }

  getAuthHeader() {
    return this.token ? { Authorization: `Bearer ${this.token}` } : {};
  }

  private async request<T = any>(
    method: HttpMethod,
    path: string,
    options?: {
      query?: Record<string, string | number | boolean>;
      jsonBody?: any;
      formData?: FormData;
      headers?: Record<string, string>;
      auth?: boolean; // include auth header
    }
  ): Promise<T> {
    const url = this.buildUrl(path, options?.query);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    const headers: Record<string, string> = {
      Accept: 'application/json',
      ...(options?.headers || {}),
    };

    if (options?.jsonBody && !options?.formData) {
      headers['Content-Type'] = 'application/json';
    }

    if (options?.auth) {
      Object.assign(headers, this.getAuthHeader());
    }

    const init: RequestInit = {
      method,
      headers,
      signal: controller.signal,
    };

    if (options?.formData) {
      init.body = options.formData as any;
      // Let fetch set the Content-Type with boundary
      delete headers['Content-Type'];
    } else if (options?.jsonBody) {
      init.body = JSON.stringify(options.jsonBody);
    }

    try {
      const res = await fetch(url, init);
      clearTimeout(timeout);

      const contentType = res.headers.get('content-type') || '';
      let parsed: any = undefined;
      if (contentType.includes('application/json')) {
        parsed = await res.json();
      } else {
        parsed = await res.text();
      }

      if (!res.ok) {
        // Normalize error
        const message = parsed?.message || parsed?.error || parsed || res.statusText;
        const err: any = new Error(message);
        err.status = res.status;
        err.data = parsed;
        throw err;
      }

      return parsed as T;
    } catch (err) {
      // Rethrow with some context
      if ((err as any)?.name === 'AbortError') {
        throw new Error('Request timed out');
      }
      throw err;
    }
  }

  private buildUrl(path: string, query?: Record<string, string | number | boolean>) {
    const trimmedPath = path.replace(/^\/+/, '');
    let url = `${this.baseUrl}/${trimmedPath}`;
    if (query && Object.keys(query).length) {
      const params = new URLSearchParams();
      Object.entries(query).forEach(([k, v]) => params.append(k, String(v)));
      url += `?${params.toString()}`;
    }
    return url;
  }

  // --- Auth / OTP ---
  async sendOtp(phone: string) {
    return this.request<{ success: boolean; message?: string }>('POST', '/auth/send-otp', {
      jsonBody: { phone },
    });
  }

  async verifyOtp(phone: string, code: string) {
    return this.request<{ token?: string; user?: any }>('POST', '/auth/verify-otp', {
      jsonBody: { phone, code },
    });
  }

  // --- Staff ---
  async registerStaff(payload: StaffRegistrationPayload) {
    const form = new FormData();
    form.append('fullName', payload.fullName);
    form.append('phone', payload.phone);
    form.append('email', payload.email);
    if (payload.address) form.append('address', payload.address);
    form.append('password', payload.password);
    if (payload.passwordConfirm) form.append('passwordConfirm', payload.passwordConfirm);
    if (payload.hpczNumber) form.append('hpczNumber', payload.hpczNumber);

    // Files
    if (payload.nrcFile && payload.nrcFile.uri) {
      const name = payload.nrcFile.name || 'nrc.jpg';
      const type = payload.nrcFile.type || 'image/jpeg';
      // @ts-ignore - React Native FormData requires append(name, { uri, name, type })
      form.append('nrcFile', { uri: payload.nrcFile.uri, name, type } as any);
    }
    if (payload.selfieFile && payload.selfieFile.uri) {
      const name = payload.selfieFile.name || 'selfie.jpg';
      const type = payload.selfieFile.type || 'image/jpeg';
      // @ts-ignore
      form.append('selfieFile', { uri: payload.selfieFile.uri, name, type } as any);
    }

    return this.request('POST', '/staff/register', {
      formData: form,
    });
  }

  async submitStaffSignature(staffId: string, signatureDataUrl: string) {
    return this.request('POST', `/staff/${encodeURIComponent(staffId)}/signature`, {
      jsonBody: { signature: signatureDataUrl },
      auth: true,
    });
  }

  async staffLogin(phone: string, password: string) {
    return this.request<{ token: string; staff: any }>('POST', '/staff/login', {
      jsonBody: { phone, password },
    });
  }

  async getPendingStaffs() {
    return this.request<any[]>('GET', '/staff/pending', { auth: true });
  }

  async approveStaff(staffId: string) {
    return this.request('POST', `/staff/${encodeURIComponent(staffId)}/approve`, { auth: true });
  }

  // --- SOS ---
  async createSos(payload: SosPayload) {
    return this.request('POST', '/sos', { jsonBody: payload, auth: false });
  }

  async getSosList() {
    return this.request<any[]>('GET', '/sos', { auth: true });
  }

  async getProfile() {
    return this.request<any>('GET', '/me', { auth: true });
  }
}

export const api = new ApiClient('');

export default api;