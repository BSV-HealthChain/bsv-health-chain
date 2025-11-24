export interface Consultation {
  pubKey: string;
  message: string;
}

export interface Record {
  pubKey: string;
  type: string;
}

export interface ProviderFormData {
  name: string;
  specialty: string;
  contact: string;
}

export const getConsultations = async (pubKey: string): Promise<Consultation[]> => {
  const res = await fetch(`/api/provider/consultations?pubKey=${pubKey}`);
  if (!res.ok) throw new Error("Failed to fetch consultations");
  return res.json();
};

export const getRecords = async (pubKey: string): Promise<Record[]> => {
  const res = await fetch(`/api/provider/records?pubKey=${pubKey}`);
  if (!res.ok) throw new Error("Failed to fetch records");
  return res.json();
};

export const registerProvider = async (data: ProviderFormData & { pubKey: string }) => {
  const res = await fetch("/api/provider/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
};
