import { jsPDF } from "jspdf";

export function generateWalletBackupPDF(mnemonic: string, addresses: string[]) {
  const doc = new jsPDF();
  doc.setFontSize(18);
  doc.text("BSV HealthChain Wallet Backup", 20, 20);

  doc.setFontSize(14);
  doc.text("Your Seed Phrase (Keep it secret!):", 20, 40);
  doc.text(mnemonic, 20, 50, { maxWidth: 170 });

  doc.text("Derived Addresses:", 20, 80);
  addresses.forEach((addr, idx) => {
    doc.text(`${idx + 1}. ${addr}`, 20, 90 + idx * 10);
  });

  doc.save("BSV_Wallet_Backup.pdf");
}
