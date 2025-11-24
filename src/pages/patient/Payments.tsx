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
    const res = await fetch(`/api/invoice/${pubKey}`);
    const data = await res.json();
    setInvoices(data);
  };

  useEffect(() => {
    fetchInvoices();
  }, [pubKey]);

  const handlePay = async (invoice: any) => {
    if (!wallet) {
      alert("Connect your wallet first");
      return;
    }

    setLoading(true);

    try {
      // Create BSV payment transaction
      const tx = await wallet.createAction({
        description: "Pay medical invoice",
        outputs: [
          {
            satoshis: invoice.amount,
            lockingScript: invoice.providerId,
            outputDescription: "Invoice payment"
          }
        ]
      });

       console.log("Transaction created:", tx);

      // Mark invoice as paid in backend
      await fetch(`/api/invoice/paid/${invoice._id}`, {
        method: "PATCH"
      });

      setSuccess("Payment successful!");
      fetchInvoices(); // refresh list
    } catch (error) {
      console.error(error);
      alert("Payment failed");
    }

    setLoading(false);
  };

  return (
    <div className="p-6">
      {!pubKey ? (
        <button
          onClick={connectWallet}
          className="bg-purple-600 text-white px-4 py-2 rounded"
        >
          Connect Wallet
        </button>
      ) : (
        <>
          <h1 className="text-2xl font-bold mb-4">Pending Medical Bills</h1>

          {success && <p className="text-green-600 mb-4">{success}</p>}

          {invoices.length === 0 ? (
            <p>No unpaid invoices</p>
          ) : (
            <div className="space-y-4">
              {invoices.map((inv) => (
                <div key={inv._id} className="p-4 border rounded">
                  <p><strong>Description:</strong> {inv.description}</p>
                  <p><strong>Amount:</strong> {inv.amount} satoshis</p>

                  <button
                    disabled={loading}
                    onClick={() => handlePay(inv)}
                    className="bg-purple-600 text-white px-4 py-2 rounded mt-2"
                  >
                    {loading ? "Processing..." : "Pay Now"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Payments;
