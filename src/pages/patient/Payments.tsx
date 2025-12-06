import React, { useEffect, useState } from "react";
import { useWallet } from "../../context/WalletContext";

const Payments: React.FC = () => {
  const { pubKey, wallet, connectWallet } = useWallet();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");

  // Fetch invoices for logged-in patient
  const fetchInvoices = async () => {
    if (!pubKey) return;
    try {
      const res = await fetch(`/api/invoice/${pubKey}`);
      const data = await res.json();
      setInvoices(data);
    } catch (err) {
      console.error("Failed to fetch invoices:", err);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [pubKey]);

  const handlePay = async (invoice: any) => {
    if (!wallet) {
      alert("Connect your wallet first");
      return;
    }

    if (!wallet.createAction) {
      alert("This wallet does not support createAction()");
      return;
    }

    setLoading(true);

    try {
      const tx = await wallet.createAction({
        description: "Pay medical invoice",
        outputs: [
          {
            satoshis: invoice.amount,
            lockingScript: invoice.providerId,
            outputDescription: "Invoice payment",
          },
        ],
      });

      console.log("Transaction created:", tx);

      await fetch(`/api/invoice/paid/${invoice._id}`, {
        method: "PATCH",
      });

      setSuccess("Payment successful!");
      fetchInvoices();
    } catch (error) {
      console.error(error);
      alert("Payment failed");
    }

    setLoading(false);
  };

  if (!pubKey) {
    return (
      <div className="flex justify-center items-center p-6">
        <button
          onClick={() => connectWallet()}
          className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition"
        >
          Connect Wallet
        </button>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6 text-purple-800">
        Pending Medical Bills
      </h1>

      {success && (
        <p className="text-green-600 font-medium mb-4">{success}</p>
      )}

      {invoices.length === 0 ? (
        <p className="text-gray-600">No unpaid invoices.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {invoices.map((inv) => (
            <div
              key={inv._id}
              className="p-4 border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition"
            >
              <p className="mb-1">
                <strong>Description:</strong> {inv.description}
              </p>
              <p className="mb-3">
                <strong>Amount:</strong> {inv.amount} satoshis
              </p>

              <button
                disabled={loading}
                onClick={() => handlePay(inv)}
                className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 transition disabled:opacity-50"
              >
                {loading ? "Processing..." : "Pay Now"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Payments;
