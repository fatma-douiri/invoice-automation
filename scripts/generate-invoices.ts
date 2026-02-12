import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";

const outputDir = path.join(process.cwd(), "samples/invoices");
fs.mkdirSync(outputDir, { recursive: true });

type InvoiceData = {
  number: string;
  supplier: string;
  date: string;
  amountHT: number;
  tva: number;
};

const invoices: InvoiceData[] = [
  {
    number: "INV-001",
    supplier: "ACME Corp",
    date: "2025-01-15",
    amountHT: 1200,
    tva: 240,
  },
  {
    number: "INV-002",
    supplier: "Globex SARL",
    date: "2025-01-20",
    amountHT: 800,
    tva: 160,
  },
];

for (const inv of invoices) {
  const doc = new PDFDocument();
  const filePath = path.join(outputDir, `${inv.number}.pdf`);
  doc.pipe(fs.createWriteStream(filePath));

  doc.fontSize(20).text("INVOICE", { align: "center" });
  doc.moveDown();

  doc.fontSize(12).text(`Invoice number: ${inv.number}`);
  doc.text(`Supplier: ${inv.supplier}`);
  doc.text(`Invoice date: ${inv.date}`);
  doc.moveDown();

  doc.text(`Amount HT: ${inv.amountHT} €`);
  doc.text(`TVA: ${inv.tva} €`);
  doc.text(`Amount TTC: ${inv.amountHT + inv.tva} €`);

  doc.end();
}

console.log("Sample invoices generated.");
