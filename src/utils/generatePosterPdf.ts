/**
 * Shared IDEAL poster PDF generator.
 * Single source of truth so the poster from Profile and the poster from
 * Admin > Clients are always identical.
 */

import jsPDF from 'jspdf';

interface LoadedImage {
  dataUrl: string;
  width: number;
  height: number;
}

/** Load an image URL into a data URL (via canvas) so jsPDF can embed it */
const loadImage = (src: string): Promise<LoadedImage | null> =>
  new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(null);
        ctx.drawImage(img, 0, 0);
        resolve({ dataUrl: canvas.toDataURL('image/png'), width: img.naturalWidth, height: img.naturalHeight });
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = src;
  });

export interface PosterPdfOptions {
  /** Person's display name */
  name: string;
  /** Optional uploaded photo URL */
  photoUrl?: string | null;
  /** The rendered QR code SVG element to embed */
  qrSvgElement?: SVGElement | null;
}

export async function generatePosterPdf({ name, photoUrl, qrSvgElement }: PosterPdfOptions): Promise<void> {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pw = pdf.internal.pageSize.getWidth();
  const ph = pdf.internal.pageSize.getHeight();
  const m = 15;
  const cw = pw - m * 2;
  let y = m;

  const [logo, photo] = await Promise.all([
    loadImage('/Ideal-logo.png'),
    photoUrl ? loadImage(photoUrl) : Promise.resolve(null),
  ]);

  // Logo line
  if (logo) {
    const logoH = 12;
    const logoW = Math.min((logo.width / logo.height) * logoH, 70);
    pdf.addImage(logo.dataUrl, 'PNG', m, y, logoW, logoH);
    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(100);
    pdf.text('Intelligent Data for Everyday Activities & Lifestyle', m + logoW + 3, y + logoH / 2 + 1);
    y += logoH + 2;
  } else {
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(80, 60, 160);
    pdf.text('IDEAL', m, y + 5);
    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(100);
    pdf.text('Intelligent Data for Everyday Activities & Lifestyle', m + 14, y + 5);
    y += 12;
  }
  pdf.setDrawColor(200);
  pdf.line(m, y, pw - m, y);
  y += 10;

  // Section 1 — Title
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(30);
  const titleLines = pdf.splitTextToSize('IDEAL — Intelligent Data for Everyday Activities & Lifestyle', cw);
  pdf.text(titleLines, pw / 2, y, { align: 'center' });
  y += titleLines.length * 7 + 6;

  // Section 2 — What is IDEAL?
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(40);
  pdf.text('What is IDEAL?', m, y);
  y += 6;
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(60);
  const desc = pdf.splitTextToSize(
    'IDEAL is a smart health monitoring system that helps support workers, families, and clinicians provide safer, more responsive care.',
    cw
  );
  pdf.text(desc, m, y);
  y += desc.length * 4 + 4;

  const cueLines = pdf.splitTextToSize(
    'Visual cues signal when the person requires care or there is a healthcare concern. Scan the QR code and follow the advice to clear the alert.',
    cw
  );
  pdf.text(cueLines, m, y);
  y += cueLines.length * 4 + 2;
  const checkLines = pdf.splitTextToSize(
    'You should be checking this QR code regularly to check for scheduled support requirements.',
    cw
  );
  pdf.text(checkLines, m, y);
  y += checkLines.length * 4 + 8;

  // Section 3 — Wearable Alerts
  pdf.setDrawColor(220);
  pdf.line(m, y, pw - m, y);
  y += 6;
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(40);
  pdf.text('Smart Wearable Alerts', m, y);
  y += 6;
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(60);
  pdf.setFillColor(255, 165, 0);
  pdf.circle(m + 3, y - 1, 2, 'F');
  pdf.text('Amber — Monitor / Action May Be Needed', m + 8, y);
  y += 5;
  pdf.setFillColor(220, 38, 38);
  pdf.circle(m + 3, y - 1, 2, 'F');
  pdf.text('Red — Urgent Attention Required', m + 8, y);
  y += 5;
  pdf.setTextColor(80);
  const alertNote = pdf.splitTextToSize(
    "Alerts are generated automatically based on the person's health data recorded in IDEAL.",
    cw
  );
  pdf.text(alertNote, m, y);
  y += alertNote.length * 4 + 8;

  // Section 4 — QR Code
  pdf.setDrawColor(220);
  pdf.line(m, y, pw - m, y);
  y += 6;
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(40);
  pdf.text('Scan to Access Profile', pw / 2, y, { align: 'center' });
  y += 8;

  // Person photo
  if (photo) {
    const size = 32;
    const x = (pw - size) / 2;
    pdf.setDrawColor(150, 130, 200);
    pdf.setLineWidth(0.6);
    pdf.rect(x - 1, y - 1, size + 2, size + 2);
    pdf.setLineWidth(0.2);
    // cover-crop the photo to a square
    const side = Math.min(photo.width, photo.height);
    const cropCanvas = document.createElement('canvas');
    cropCanvas.width = side;
    cropCanvas.height = side;
    const cctx = cropCanvas.getContext('2d');
    let src = photo.dataUrl;
    if (cctx) {
      const img = new Image();
      img.src = photo.dataUrl;
      await new Promise<void>((res) => { img.onload = () => res(); img.onerror = () => res(); });
      cctx.drawImage(img, (photo.width - side) / 2, (photo.height - side) / 2, side, side, 0, 0, side, side);
      src = cropCanvas.toDataURL('image/png');
    }
    pdf.addImage(src, 'PNG', x, y, size, size);
    y += size + 6;
  }

  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(0);
  pdf.text(name, pw / 2, y, { align: 'center' });
  y += 8;

  if (qrSvgElement) {
    const qrCanvas = document.createElement('canvas');
    const qrSize = 400;
    qrCanvas.width = qrSize;
    qrCanvas.height = qrSize;
    const svgData = new XMLSerializer().serializeToString(qrSvgElement);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    const img = new Image();
    await new Promise<void>((resolve) => {
      img.onload = () => {
        const ctx = qrCanvas.getContext('2d');
        if (ctx) { ctx.fillStyle = 'white'; ctx.fillRect(0, 0, qrSize, qrSize); ctx.drawImage(img, 0, 0, qrSize, qrSize); }
        URL.revokeObjectURL(url);
        resolve();
      };
      img.onerror = () => { URL.revokeObjectURL(url); resolve(); };
      img.src = url;
    });
    const qrDataUrl = qrCanvas.toDataURL('image/png');
    const qrPdfSize = 45;
    pdf.addImage(qrDataUrl, 'PNG', (pw - qrPdfSize) / 2, y, qrPdfSize, qrPdfSize);
    y += qrPdfSize + 6;
  }

  // Section 5 — Scan Instructions
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(80);
  pdf.text("Scan using an authorised device to open this person's IDEAL profile.", pw / 2, y, { align: 'center' });
  y += 4;
  pdf.text('Staff verification is required.', pw / 2, y, { align: 'center' });

  // Section 6 — Footer
  pdf.setDrawColor(200);
  pdf.line(m, ph - m - 12, pw - m, ph - m - 12);
  pdf.setFontSize(7);
  pdf.setTextColor(130);
  pdf.text('Access restricted to authorised staff only.', pw / 2, ph - m - 6, { align: 'center' });
  pdf.text('Follow privacy and confidentiality policies.', pw / 2, ph - m - 2, { align: 'center' });

  pdf.save(`IDEAL-Poster-${name.replace(/\s+/g, '-').toLowerCase()}.pdf`);
}
