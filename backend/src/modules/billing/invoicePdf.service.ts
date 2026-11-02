import PDFDocument from 'pdfkit';

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface InvoiceData {
  invoiceNumber: string;
  clientName: string;
  clientEmail?: string | null;
  clientPhone?: string | null;
  clientAddress?: string | null;
  invoiceDate: string;
  dueDate: string;
  items: InvoiceItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discount: number;
  totalAmount: number;
  status: string;
  notes?: string | null;
}

/**
 * Generates a clean, modern, professional vector PDF for an invoice using PDFKit.
 * Returns a Buffer of the generated PDF document.
 */
export const generateInvoicePDF = (data: InvoiceData): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 40,
        info: {
          Title: `Invoice ${data.invoiceNumber}`,
          Author: 'JBI Solutions',
          Subject: 'Tax Invoice',
        },
      });

      const buffers: Buffer[] = [];
      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', (err) => reject(err));

      const primaryColor = '#1e3a8a'; // Deep Navy Blue
      const secondaryColor = '#0284c7'; // Vivid Cyan/Blue
      const darkText = '#0f172a';
      const grayText = '#64748b';
      const lightBg = '#f8fafc';
      const borderColor = '#e2e8f0';

      // ---------------------------------------------
      // TOP HEADER & BRANDING
      // ---------------------------------------------
      // Top colored accent bar
      doc.rect(0, 0, doc.page.width, 8).fill(primaryColor);

      // JBI Company Logo / Title
      doc.fontSize(24).font('Helvetica-Bold').fillColor(primaryColor).text('JBI SOLUTIONS', 40, 35);
      doc.fontSize(9).font('Helvetica').fillColor(grayText).text('Enterprise CRM & Cloud Technologies Pvt. Ltd.', 40, 62);
      doc.text('GSTIN: 27AABCV1234D1Z5 | PAN: AABCV1234D', 40, 74);
      doc.text('Tech Park Towers, Sector 5, Navi Mumbai, MH 400705', 40, 86);
      doc.text('support@jbi.com | +91 98765 43210 | www.jbi-crm.com', 40, 98);

      // INVOICE BADGE ON TOP RIGHT
      doc.fontSize(22).font('Helvetica-Bold').fillColor(secondaryColor).text('TAX INVOICE', 350, 35, { align: 'right' });
      doc.fontSize(10).font('Helvetica-Bold').fillColor(darkText).text(`Invoice #: ${data.invoiceNumber}`, 350, 62, { align: 'right' });
      doc.font('Helvetica').fillColor(grayText).text(`Date: ${data.invoiceDate}`, 350, 76, { align: 'right' });
      doc.text(`Due Date: ${data.dueDate}`, 350, 90, { align: 'right' });

      // STATUS PILL
      const statusColor = data.status === 'Paid' ? '#16a34a' : data.status === 'Pending' ? '#d97706' : '#dc2626';
      doc.roundedRect(460, 108, 95, 20, 4).fill(statusColor);
      doc.fontSize(9).font('Helvetica-Bold').fillColor('#ffffff').text(data.status.toUpperCase(), 460, 114, { width: 95, align: 'center' });

      // Divider
      doc.moveTo(40, 138).lineTo(555, 138).strokeColor(borderColor).stroke();

      // ---------------------------------------------
      // CLIENT "BILLED TO" BOX
      // ---------------------------------------------
      doc.rect(40, 148, 515, 74).fillAndStroke(lightBg, borderColor);
      doc.fontSize(10).font('Helvetica-Bold').fillColor(primaryColor).text('BILLED TO (CLIENT DETAILS):', 55, 158);
      doc.fontSize(11).font('Helvetica-Bold').fillColor(darkText).text(data.clientName, 55, 172);

      let clientSubtext = '';
      if (data.clientEmail) clientSubtext += `Email: ${data.clientEmail}   `;
      if (data.clientPhone) clientSubtext += `Phone: ${data.clientPhone}`;
      doc.fontSize(9).font('Helvetica').fillColor(grayText).text(clientSubtext, 55, 187);
      if (data.clientAddress) {
        doc.text(`Address: ${data.clientAddress}`, 55, 200, { width: 480 });
      }

      // ---------------------------------------------
      // ITEMS TABLE HEADER
      // ---------------------------------------------
      const tableTop = 238;
      doc.rect(40, tableTop, 515, 26).fill(primaryColor);
      doc.fontSize(9).font('Helvetica-Bold').fillColor('#ffffff');
      doc.text('#', 50, tableTop + 8);
      doc.text('ITEM DESCRIPTION', 80, tableTop + 8);
      doc.text('QTY', 340, tableTop + 8, { width: 40, align: 'center' });
      doc.text('UNIT PRICE (₹)', 390, tableTop + 8, { width: 75, align: 'right' });
      doc.text('AMOUNT (₹)', 470, tableTop + 8, { width: 75, align: 'right' });

      // ITEMS ROWS
      let currentY = tableTop + 26;
      data.items.forEach((item, index) => {
        const rowBg = index % 2 === 0 ? '#ffffff' : '#f8fafc';
        doc.rect(40, currentY, 515, 24).fillAndStroke(rowBg, borderColor);

        doc.fontSize(9).font('Helvetica').fillColor(darkText);
        doc.text(String(index + 1), 50, currentY + 7);
        doc.text(item.description, 80, currentY + 7, { width: 250, ellipsis: true });
        doc.text(String(item.quantity), 340, currentY + 7, { width: 40, align: 'center' });
        doc.text(item.unitPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 }), 390, currentY + 7, { width: 75, align: 'right' });
        doc.font('Helvetica-Bold').text(item.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 }), 470, currentY + 7, { width: 75, align: 'right' });

        currentY += 24;
      });

      // ---------------------------------------------
      // TOTALS & SUMMARY SECTION
      // ---------------------------------------------
      currentY += 15;
      const summaryLeft = 320;
      const summaryWidth = 235;

      // Subtotal
      doc.fontSize(9).font('Helvetica').fillColor(grayText).text('Subtotal:', summaryLeft, currentY);
      doc.font('Helvetica-Bold').fillColor(darkText).text(`₹ ${data.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, summaryLeft, currentY, { width: summaryWidth, align: 'right' });
      currentY += 18;

      // Tax
      doc.font('Helvetica').fillColor(grayText).text(`GST / Tax (${data.taxRate}%):`, summaryLeft, currentY);
      doc.font('Helvetica-Bold').fillColor(darkText).text(`₹ ${data.taxAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, summaryLeft, currentY, { width: summaryWidth, align: 'right' });
      currentY += 18;

      // Discount (if any)
      if (data.discount > 0) {
        doc.font('Helvetica').fillColor(grayText).text('Discount:', summaryLeft, currentY);
        doc.font('Helvetica-Bold').fillColor('#dc2626').text(`- ₹ ${data.discount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, summaryLeft, currentY, { width: summaryWidth, align: 'right' });
        currentY += 18;
      }

      // Grand Total Box
      doc.rect(summaryLeft, currentY, summaryWidth, 32).fillAndStroke('#eff6ff', primaryColor);
      doc.fontSize(11).font('Helvetica-Bold').fillColor(primaryColor).text('TOTAL AMOUNT DUE:', summaryLeft + 10, currentY + 10);
      doc.fontSize(12).font('Helvetica-Bold').fillColor(primaryColor).text(`₹ ${data.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, summaryLeft + 10, currentY + 9, { width: summaryWidth - 20, align: 'right' });

      // Left side notes / Bank info
      const notesY = currentY - (data.discount > 0 ? 54 : 36);
      doc.rect(40, notesY, 260, 86).fillAndStroke(lightBg, borderColor);
      doc.fontSize(8.5).font('Helvetica-Bold').fillColor(primaryColor).text('BANK PAYMENT DETAILS:', 50, notesY + 8);
      doc.fontSize(8).font('Helvetica').fillColor(darkText);
      doc.text('Bank: HDFC Bank Ltd | A/C: 50200012345678', 50, notesY + 22);
      doc.text('IFSC Code: HDFC0001234 | Branch: Navi Mumbai', 50, notesY + 34);
      doc.text('UPI ID: jbi.solutions@hdfcbank', 50, notesY + 46);
      if (data.notes) {
        doc.font('Helvetica-Bold').fillColor(primaryColor).text('Notes:', 50, notesY + 60);
        doc.font('Helvetica').fillColor(grayText).text(data.notes, 85, notesY + 60, { width: 205, ellipsis: true });
      }

      // ---------------------------------------------
      // FOOTER & SIGNATORY
      // ---------------------------------------------
      const footerY = 740;
      doc.moveTo(40, footerY).lineTo(555, footerY).strokeColor(borderColor).stroke();

      doc.fontSize(8).font('Helvetica').fillColor(grayText).text(
        'Terms & Conditions: 1. Payment due within specified due date. 2. Please quote invoice number during wire transfer.',
        40,
        footerY + 8,
        { width: 350 }
      );

      doc.fontSize(8.5).font('Helvetica-Bold').fillColor(primaryColor).text(
        'For JBI Solutions Pvt. Ltd.',
        420,
        footerY + 8,
        { width: 135, align: 'right' }
      );
      doc.fontSize(7.5).font('Helvetica').fillColor(grayText).text(
        'Authorized Signatory',
        420,
        footerY + 36,
        { width: 135, align: 'right' }
      );

      // Page bottom accent line
      doc.rect(0, doc.page.height - 6, doc.page.width, 6).fill(primaryColor);

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};
