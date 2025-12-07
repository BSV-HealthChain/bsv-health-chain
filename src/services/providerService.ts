import { API_URL } from "../config";

export interface Consultation {
  pubKey: string;
  message: string;
}

// Renamed from `Record` to avoid clash
export interface HealthRecord {
  pubKey: string;
  type: string;
}

export interface ProviderFormData {
  name: string;
  specialty: string;
  contact: string;
}

// Helper to get headers with optional Authorization
const getAuthHeaders = (): globalThis.Record<string, string> => {
  const token = localStorage.getItem("token");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
};

export const getConsultations = async (pubKey: string): Promise<Consultation[]> => {
  const res = await fetch(`${API_URL}/provider/consultations?pubKey=${pubKey}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error("Failed to fetch consultations");
  return res.json();
};

export const getRecords = async (pubKey: string): Promise<HealthRecord[]> => {
  const res = await fetch(`${API_URL}/provider/records?pubKey=${pubKey}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error("Failed to fetch records");
  return res.json();
};

export const registerProvider = async (data: ProviderFormData & { pubKey: string }) => {
  const res = await fetch(`${API_URL}/api/health/register`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to register provider");
  return res.json();
};
