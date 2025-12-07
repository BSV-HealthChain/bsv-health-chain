import React, { useEffect, useState } from "react";
import type { HealthRecord } from "../../services/providerService";
import { getRecords } from "../../services/providerService";

interface Props {
  pubKey: string;
}

const RecordsTab: React.FC<Props> = ({ pubKey }) => {
  const [records, setRecords] = useState<HealthRecord[]>([]);
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

  if (loading)
    return <p className="text-gray-500 text-center py-6">Loading records...</p>;

  if (message)
    return <p className="text-gray-500 text-center py-6">{message}</p>;

  return (
    <ul className="space-y-4">
      {records.map((rec, idx) => (
        <li
          key={idx}
          className="border border-gray-200 rounded-xl bg-white shadow p-4 hover:shadow-md transition duration-200"
        >
          <p className="text-gray-700">
            <span className="font-semibold">Patient:</span> {rec.pubKey}
          </p>
          <p className="text-gray-600 mt-1">
            <span className="font-semibold">Record Type:</span> {rec.type}
          </p>
          <button className="mt-3 bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition duration-200">
            View Record
          </button>
        </li>
      ))}
    </ul>
  );
};

export default RecordsTab;
