import React from "react";
import ProvidersPanel from "../../components/ProvidersPanel";

const Providers: React.FC = () => {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Healthcare Providers</h1>
      <ProvidersPanel />
    </div>
  );
};

export default Providers;
