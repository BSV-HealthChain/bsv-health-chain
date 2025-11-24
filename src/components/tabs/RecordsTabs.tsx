import React, { useEffect, useState } from "react";
import type { Record } from "../../services/providerService";
import { getRecords } from "../../services/providerService";

interface Props {
  pubKey: string;
}

const RecordsTab: React.FC<Props> = ({ pubKey }) => {
  const [records, setRecords] = useState<Record[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setMessage(null);
      try {
        const data = await getRecords(pubKey);
        setRecords(data || []);
        if (!data || data.length === 0) setMessage("No patient records available.");
      } catch {
        setMessage("Failed to load records.");
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
      {records.map((rec, idx) => (
        <li key={idx} className="border p-3 rounded-xl bg-gray-50">
          <p><b>Patient:</b> {rec.pubKey}</p>
          <p><b>Record Type:</b> {rec.type}</p>
          <button className="mt-2 bg-green-600 text-white px-2 py-1 rounded">
            View Record
          </button>
        </li>
      ))}
    </ul>
  );
};

export default RecordsTab;
