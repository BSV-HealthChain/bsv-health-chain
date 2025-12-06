import React from "react";
import ProvidersPanel from "../../components/ProvidersPanel";

const Providers: React.FC = () => {
  return (
    <div className="p-6 bg-purple-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-purple-800">
        Healthcare Providers
      </h1>
      <div className="bg-white p-6 rounded-2xl shadow-lg">
        <ProvidersPanel />
      </div>
    </div>
  );
};

export default Providers;
