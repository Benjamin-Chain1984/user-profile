import { useState, useRef, useCallback, useEffect } from 'react';
import { useProfile } from '@/contexts/ProfileContext';
import { QRCodeSVG } from 'qrcode.react';
import { QrCode, FileText, Download, Printer, RefreshCw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import { supabase } from '@/integrations/supabase/client';
import { generateSecureToken, hashToken } from '@/services/clientToken';

export function QRPosterSection() {
  const { profile } = useProfile();
  const [qrToken, setQrToken] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);

  const profileId = profile?.id;
  const profileName = profile?.fullName ?? '';
  const qrCodeValue = qrToken ? `${window.location.origin}/c/${qrToken}` : '';

  const generateNewToken = useCallback(async () => {
    if (!profileId) return;
    setIsGenerating(true);
    try {
      const token = generateSecureToken();
      const tokenHash = await hashToken(token);

      const { error } = await supabase
        .from('clients')
        .update({ poster_qr_token_hash: tokenHash, poster_qr_token_plain: token } as any)
        .eq('id', profileId)
        .select('id')
        .single();

      if (error) {
        console.error('[QR] Update error:', JSON.stringify(error));
        throw error;
      }

      setQrToken(token);
    } catch (err) {
      console.error('[QR] Failed to generate QR token:', err);
      toast.error('Failed to generate QR code');
    } finally {
      setIsGenerating(false);
    }
  }, [profileId]);

  // Load existing token from database on mount
  useEffect(() => {
    if (!profileId) return;
    (async () => {
      try {
        const { data } = await supabase
          .from('clients')
          .select('poster_qr_token_plain')
          .eq('id', profileId)
          .single();
        if ((data as any)?.poster_qr_token_plain) {
          setQrToken((data as any).poster_qr_token_plain);
        }
      } catch (err) {
        console.error('[QR] Failed to load token:', err);
      } finally {
        setHasLoaded(true);
      }
    })();
  }, [profileId]);

  if (!profile) return null;

  const handleRegenerate = async () => {
    setQrToken(null);
    await generateNewToken();
    toast.success('QR code regenerated. Previous QR codes are now invalid.');
  };

  const handlePrint = () => window.print();

  const handleDownloadPDF = async () => {
    if (!qrToken) return;
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

      const modules = ['Bowel care', 'Fluid balance', 'Pain', 'Sleep', 'Nutrition', 'Vital signs', 'Skin integrity', 'Preventive health'];
      modules.forEach((mod) => { pdf.text(`•  ${mod}`, m + 4, y); y += 4; });
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
      pdf.text(profileName, pw / 2, y, { align: 'center' });
      y += 8;

      const svgElement = qrRef.current?.querySelector('svg');
      if (svgElement) {
        const qrCanvas = document.createElement('canvas');
        const qrSize = 400;
        qrCanvas.width = qrSize;
        qrCanvas.height = qrSize;
        const svgData = new XMLSerializer().serializeToString(svgElement);
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
        const qrPdfSize = 55;
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

      pdf.save(`IDEAL-Poster-${profileName.replace(/\s+/g, '-').toLowerCase()}.pdf`);
      toast.success('Poster PDF downloaded');
    } catch (err) {
      console.error('PDF generation error:', err);
      toast.error('Failed to generate PDF');
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <QrCode className="w-5 h-5 text-primary" />
          <CardTitle className="text-lg">QR & Poster</CardTitle>
        </div>
        <CardDescription>
          Quick access QR code and printable poster for care staff
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!hasCheckedStorage ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          </div>
        ) : qrToken ? (
          <div className="flex flex-col items-center animate-fade-in" ref={qrRef}>
            <div className="p-3 sm:p-4 bg-white rounded-lg sm:rounded-xl shadow-inner border border-border">
              <QRCodeSVG
                value={qrCodeValue}
                size={180}
                level="M"
                includeMargin={true}
                fgColor="hsl(270, 50%, 40%)"
                className="w-[160px] h-[160px] sm:w-[200px] sm:h-[200px]"
              />
            </div>
            <p className="mt-2 sm:mt-3 text-xs sm:text-sm text-muted-foreground text-center px-4">
              Scan to open IDEAL for {profileName}
            </p>
            <Button
              variant="ghost"
              size="sm"
              className="mt-1 text-xs text-muted-foreground"
              onClick={handleRegenerate}
              disabled={isGenerating}
            >
              <RefreshCw className="w-3 h-3 mr-1" />
              Regenerate QR Code
            </Button>
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground mb-2">No QR code generated yet.</p>
            <Button
              variant="outline"
              size="sm"
              onClick={generateNewToken}
              disabled={isGenerating}
              className="gap-2"
            >
              {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <QrCode className="w-4 h-4" />}
              Generate QR Code
            </Button>
          </div>
        )}

        <div className="pt-4 border-t border-border space-y-3">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-foreground">Printable Poster</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Generate a bedside poster with QR code and care instructions.
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex-1 gap-2" onClick={handleDownloadPDF} disabled={!qrToken}>
              <Download className="w-4 h-4" />
              Download PDF
            </Button>
            <Button variant="outline" size="sm" className="flex-1 gap-2" onClick={handlePrint}>
              <Printer className="w-4 h-4" />
              Print
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
