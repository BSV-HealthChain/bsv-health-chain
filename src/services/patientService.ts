import { API_URL } from "../config";

export const submitPatientData = async (payload: {
  pubKey: string;
  txid: string;
  rawTx: string;
  formHash: string;
  formData: any;
}) => {
  const res = await fetch(`${API_URL}/api/health/submit-fhir`, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json" 
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to submit data: ${text}`);
  }

  return res.json();
};

export const getPatientRecords = async (pubKey: string) => {
  const res = await fetch(`${API_URL}/patient/records/${pubKey}`);

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to fetch records: ${text}`);
  }

  return res.json();
};
export const getInvoices = async (pubKey: string) => {
  const res = await fetch(`${API_URL}/invoice/${pubKey}`);
  if (!res.ok) throw new Error("Failed to load invoices");
  return res.json();
};

export const markInvoicePaid = async (invoiceId: string) => {
  const res = await fetch(`${API_URL}/invoice/paid/${invoiceId}`, {
    method: "PATCH",
  });
  if (!res.ok) throw new Error("Failed to update invoice status");
  return res.json();
};
export const sendConsultationRequest = async (
  pubKey: string,
  providerId: string,
  message: string
) => {
  const res = await fetch(`${API_URL}/patient/consultation`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pubKey, providerId, message }),
  });

  if (!res.ok) throw new Error("Failed to send consultation request");

  return res.json();
};