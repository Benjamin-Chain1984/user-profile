/**
 * Poster Preview Dialog
 * Full IDEAL poster preview with print and PDF download
 */

import { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { clientTokenService } from '@/services/clientToken';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ProfileAvatar } from '@/components/ideal/ProfileAvatar';
import { Download, Printer } from 'lucide-react';
import { toast } from 'sonner';
import jsPDF from 'jspdf';

interface ClientRow {
  id: string;
  preferred_name: string;
  short_bio: string | null;
  photo_url: string | null;
}

interface PosterPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: ClientRow | null;
  token: string;
}

const HEALTH_AREAS = [
  'Bowel care', 'Fluid balance', 'Pain', 'Sleep',
  'Nutrition', 'Vital signs', 'Skin integrity', 'Preventive health',
];

export function PosterPreviewDialog({
  open,
  onOpenChange,
  client,
  token,
}: PosterPreviewDialogProps) {
  const posterRef = useRef<HTMLDivElement>(null);

  if (!client || !token) return null;

  const qrUrl = clientTokenService.generatePosterQrUrl(token);

  const handleDownloadPDF = async () => {
    try {
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pw = pdf.internal.pageSize.getWidth();
      const ph = pdf.internal.pageSize.getHeight();
      const m = 15;
      const cw = pw - m * 2;
      let y = m;

      // Logo line
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(80, 60, 160);
      pdf.text('IDEAL', m, y + 5);
      pdf.setFontSize(7);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(100);
      pdf.text('Intelligent Data for Everyday Activities & Lifestyle', m + 14, y + 5);
      y += 12;
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

      HEALTH_AREAS.forEach((mod) => { pdf.text(`•  ${mod}`, m + 4, y); y += 4; });
      y += 2;
      pdf.setFont('helvetica', 'italic');
      pdf.text('IDEAL highlights early warning signs and supports timely action.', m, y);
      y += 8;

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
      const alertNote = pdf.splitTextToSize("Alerts are generated automatically based on the person's health data recorded in IDEAL.", cw);
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

      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(0);
      pdf.text(client.preferred_name, pw / 2, y, { align: 'center' });
      y += 8;

      const svgElement = posterRef.current?.querySelector('svg');
      if (svgElement) {
        const qrCanvas = document.createElement('canvas');
        const qrSize = 400;
        qrCanvas.width = qrSize;
        qrCanvas.height = qrSize;
        const svgData = new XMLSerializer().serializeToString(svgElement);
        const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);
        const img = new Image();
        await new Promise<void>((resolve, reject) => {
          img.onload = () => {
            const ctx = qrCanvas.getContext('2d');
            if (ctx) { ctx.fillStyle = 'white'; ctx.fillRect(0, 0, qrSize, qrSize); ctx.drawImage(img, 0, 0, qrSize, qrSize); }
            URL.revokeObjectURL(url);
            resolve();
          };
          img.onerror = reject;
          img.src = url;
        });
        const qrDataUrl = qrCanvas.toDataURL('image/png');
        const qrPdfSize = 55;
        pdf.addImage(qrDataUrl, 'PNG', (pw - qrPdfSize) / 2, y, qrPdfSize, qrPdfSize);
        y += qrPdfSize + 6;
      }

      // Section 5 — Instructions
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

      pdf.save(`IDEAL-Poster-${client.preferred_name.replace(/\s+/g, '-')}.pdf`);
      toast.success('Poster PDF downloaded');
    } catch (err) {
      console.error('Error generating PDF:', err);
      toast.error('Failed to generate PDF');
    }
  };

  const handlePrint = () => {
    const svgHtml = posterRef.current?.querySelector('.qr-container')?.innerHTML || '';
    const printWindow = window.open('', '_blank');
    if (!printWindow) { toast.error('Please allow popups to print'); return; }

    printWindow.document.write(`<!DOCTYPE html><html><head>
      <title>IDEAL Poster - ${client.preferred_name}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        @page { size: A4 portrait; margin: 15mm; }
        body { font-family: system-ui, -apple-system, sans-serif; color: #1a1a1a; padding: 0; }
        .logo { font-size: 12px; font-weight: bold; color: #5040a0; margin-bottom: 4px; }
        .logo-sub { font-size: 8px; color: #888; }
        .divider { border-top: 1px solid #ddd; margin: 10px 0; }
        h1 { font-size: 18px; text-align: center; margin: 16px 0; }
        h2 { font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px; }
        .desc { font-size: 10px; color: #555; line-height: 1.5; margin-bottom: 8px; }
        .modules { font-size: 9px; color: #555; columns: 3; margin-bottom: 6px; }
        .modules span { display: block; }
        .italic { font-style: italic; font-size: 10px; color: #555; margin-bottom: 12px; }
        .alerts { display: flex; gap: 16px; font-size: 10px; margin-bottom: 6px; }
        .dot { display: inline-block; width: 12px; height: 12px; border-radius: 50%; vertical-align: middle; margin-right: 6px; }
        .amber { background: #f97316; }
        .red { background: #dc2626; }
        .alert-note { font-size: 9px; color: #666; margin-bottom: 16px; }
        .qr-section { text-align: center; margin: 16px 0; }
        .client-name { font-size: 20px; font-weight: bold; margin: 8px 0; }
        .qr-wrap { display: inline-block; border: 2px solid #ddd; padding: 16px; border-radius: 12px; margin: 8px 0; }
        .qr-wrap svg { display: block; }
        .instructions { font-size: 10px; color: #555; text-align: center; }
        .instructions strong { display: block; margin-top: 2px; }
        .footer { border-top: 1px solid #ddd; padding-top: 8px; margin-top: auto; text-align: center; font-size: 8px; color: #999; }
      </style></head><body>
        <div class="logo">IDEAL <span class="logo-sub">Intelligent Data for Everyday Activities &amp; Lifestyle</span></div>
        <div class="divider"></div>
        <h1>IDEAL — Intelligent Data for<br>Everyday Activities &amp; Lifestyle</h1>

        <h2>What is IDEAL?</h2>
        <p class="desc">IDEAL is a smart health monitoring system that helps support workers, families, and clinicians provide safer, more responsive care.</p>
        <div class="modules">${HEALTH_AREAS.map(a => `<span>• ${a}</span>`).join('')}</div>
        <p class="italic">IDEAL highlights early warning signs and supports timely action.</p>

        <div class="divider"></div>
        <h2>Smart Wearable Alerts</h2>
        <div class="alerts">
          <div><span class="dot amber"></span><strong>Amber</strong> — Monitor / Action May Be Needed</div>
          <div><span class="dot red"></span><strong>Red</strong> — Urgent Attention Required</div>
        </div>
        <p class="alert-note">Alerts are generated automatically based on the person's health data recorded in IDEAL.</p>

        <div class="divider"></div>
        <div class="qr-section">
          <h2>Scan to Access Profile</h2>
          <div class="client-name">${client.preferred_name}</div>
          <div class="qr-wrap">${svgHtml}</div>
          <div class="instructions">
            Scan using an authorised device to open this person's IDEAL profile.
            <strong>Staff verification is required.</strong>
          </div>
        </div>

        <div class="footer">
          Access restricted to authorised staff only.<br>
          Follow privacy and confidentiality policies.
        </div>
        <script>window.onload = () => { window.print(); }</script>
      </body></html>`);
    printWindow.document.close();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>IDEAL Poster Preview</DialogTitle>
        </DialogHeader>

        <div ref={posterRef} className="bg-white border border-border rounded-lg p-6 space-y-4 text-foreground">
          {/* Header */}
          <div className="flex items-center gap-2 border-b border-border pb-2">
            <img src="/Ideal-logo.png" alt="IDEAL" className="h-6 w-auto" />
            <div>
              <p className="text-[10px] font-bold tracking-wide leading-tight">IDEAL</p>
              <p className="text-[6px] text-muted-foreground leading-tight">Intelligent Data for Everyday Activities &amp; Lifestyle</p>
            </div>
          </div>

          {/* Section 1 — Title */}
          <h1 className="text-sm font-extrabold text-center leading-snug">
            IDEAL — Intelligent Data for<br />Everyday Activities &amp; Lifestyle
          </h1>

          {/* Section 2 — What is IDEAL? */}
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wide mb-1">What is IDEAL?</h2>
            <p className="text-[9px] text-muted-foreground leading-relaxed mb-2">
              IDEAL is a smart health monitoring system that helps support workers, families,
              and clinicians provide safer, more responsive care.
            </p>
            <div className="grid grid-cols-3 gap-x-3 gap-y-0.5 text-[8px] text-muted-foreground mb-1">
              {HEALTH_AREAS.map((item) => (
                <span key={item}>• {item}</span>
              ))}
            </div>
            <p className="text-[9px] text-muted-foreground italic">
              IDEAL highlights early warning signs and supports timely action.
            </p>
          </div>

          {/* Section 3 — Wearable Alerts */}
          <div className="border-t border-border pt-3">
            <h2 className="text-xs font-bold uppercase tracking-wide mb-1">Smart Wearable Alerts</h2>
            <div className="flex gap-4 text-[9px] mb-1">
              <div className="flex items-center gap-1.5">
                <span className="inline-block w-3 h-3 rounded-full bg-orange-500 shrink-0" />
                <span className="text-muted-foreground"><strong className="text-foreground">Amber</strong> — Monitor / Action May Be Needed</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="inline-block w-3 h-3 rounded-full bg-red-600 shrink-0" />
                <span className="text-muted-foreground"><strong className="text-foreground">Red</strong> — Urgent Attention Required</span>
              </div>
            </div>
            <p className="text-[8px] text-muted-foreground">
              Alerts are generated automatically based on the person's health data recorded in IDEAL.
            </p>
          </div>

          {/* Section 4 — QR Code */}
          <div className="border-t border-border pt-3 text-center">
            <h2 className="text-xs font-bold uppercase tracking-wide mb-2">Scan to Access Profile</h2>
            <div className="flex flex-col items-center gap-1.5 mb-2">
              <ProfileAvatar
                name={client.preferred_name}
                avatarUrl={client.photo_url || undefined}
                size="md"
              />
              <h3 className="text-base font-bold">{client.preferred_name}</h3>
            </div>
            <div className="qr-container flex justify-center mb-2">
              <div className="bg-white border-2 border-foreground/20 p-3 rounded-lg inline-block">
                <QRCodeSVG value={qrUrl} size={140} level="H" includeMargin={false} />
              </div>
            </div>

            {/* Section 5 — Scan Instructions */}
            <p className="text-[9px] text-muted-foreground">
              Scan using an authorised device to open this person's IDEAL profile.
            </p>
            <p className="text-[9px] text-muted-foreground font-medium">
              Staff verification is required.
            </p>
          </div>

          {/* Section 6 — Footer */}
          <div className="border-t border-border pt-2 text-center">
            <p className="text-[7px] text-muted-foreground">Access restricted to authorised staff only.</p>
            <p className="text-[7px] text-muted-foreground">Follow privacy and confidentiality policies.</p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" /> Print Poster
          </Button>
          <Button onClick={handleDownloadPDF}>
            <Download className="h-4 w-4 mr-2" /> Download PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
