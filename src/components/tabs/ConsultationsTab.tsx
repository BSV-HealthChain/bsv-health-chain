import React, { useEffect, useState } from "react";
import type { Consultation } from "../../services/providerService";
import { getConsultations } from "../../services/providerService";

interface Props {
  pubKey: string;
}

const ConsultationsTab: React.FC<Props> = ({ pubKey }) => {
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setMessage(null);
      try {
        const data = await getConsultations(pubKey);
        setConsultations(data || []);
        if (!data || data.length === 0) setMessage("No consultation requests found.");
      } catch {
        setMessage("Failed to load consultations.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [pubKey]);

  if (loading) return <p>Loading...</p>;
  if (message) return <p className="text-gray-500">{message}</p>;

  return (
    <ul className="space-y-3">
      {consultations.map((req, idx) => (
        <li key={idx} className="border p-3 rounded-xl bg-gray-50">
          <p><b>Patient:</b> {req.pubKey}</p>
          <p><b>Message:</b> {req.message}</p>
        </li>
      ))}
    </ul>
  );
};

export default ConsultationsTab;
