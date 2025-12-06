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

  if (loading) 
    return <p className="text-gray-500 text-center py-6">Loading consultations...</p>;

  if (message) 
    return <p className="text-gray-500 text-center py-6">{message}</p>;

  return (
    <ul className="space-y-4">
      {consultations.map((req, idx) => (
        <li 
          key={idx} 
          className="border border-gray-200 p-4 rounded-xl bg-white shadow hover:shadow-md transition duration-200"
        >
          <p className="text-gray-700"><span className="font-semibold">Patient:</span> {req.pubKey}</p>
          <p className="text-gray-600 mt-1"><span className="font-semibold">Message:</span> {req.message}</p>
        </li>
      ))}
    </ul>
  );
};

export default ConsultationsTab;
