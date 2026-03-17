/**
 * IDEAL Printable Poster Page
 * A4-optimized poster for wall display in disability support homes.
 */

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { supabase } from '@/integrations/supabase/client';
import { clientTokenService } from '@/services/clientToken';
import { Button } from '@/components/ui/button';
import { ProfileAvatar } from '@/components/ideal/ProfileAvatar';
import { Printer, Download, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import jsPDF from 'jspdf';

const idealLogo = '/logo-design-new.png';

interface ClientData {
  id: string;
  preferred_name: string;
  short_bio: string | null;
  photo_url: string | null;
  status: string;
  poster_qr_token_rotated_at: string | null;
  created_at: string;
}

export default function ClientPosterPage() {
  const { clientId } = useParams<{ clientId: string }>();
  const [client, setClient] = useState<ClientData | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const posterRef = useRef<HTMLDivElement>(null);

  const fetchClient = useCallback(async () => {
    if (!clientId) { setError('Client ID not provided'); setLoading(false); return; }
    try {
      const { data, error: fetchError } = await supabase
        .from('clients')
        .select('id, preferred_name, short_bio, photo_url, status, poster_qr_token_rotated_at, created_at')
        .eq('id', clientId)
        .single();
      if (fetchError) throw fetchError;
      if (!data) throw new Error('Client not found');
      setClient(data);

      const storedToken = localStorage.getItem(`poster_token_${clientId}`);
      if (storedToken) {
        setToken(storedToken);
      } else {
        const result = await clientTokenService.rotateClientToken(clientId);
        if (result.success && result.newToken) {
          setToken(result.newToken);
          localStorage.setItem(`poster_token_${clientId}`, result.newToken);
        }
      }
    } catch (err) {
      console.error('Error fetching client:', err);
      setError('Unable to load client details');
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => { fetchClient(); }, [fetchClient]);

  // Realtime: auto-update when token rotated externally
  useEffect(() => {
    if (!clientId) return;
    const channel = supabase
      .channel(`poster-${clientId}`)
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'clients',
        filter: `id=eq.${clientId}`,
      }, () => fetchClient())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [clientId, fetchClient]);

  const qrUrl = token ? clientTokenService.generatePosterQrUrl(token) : '';

  const handlePrint = () => window.print();

  const handleDownloadPDF = async () => {
    if (!client || !posterRef.current) return;
    try {
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pw = pdf.internal.pageSize.getWidth();
      const ph = pdf.internal.pageSize.getHeight();
      const m = 15;
      const cw = pw - m * 2;
      let y = m;

      // Logo area
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

      // Title
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(30);
      const titleLines = pdf.splitTextToSize('IDEAL — Intelligent Data for Everyday Activities & Lifestyle', cw);
      pdf.text(titleLines, pw / 2, y, { align: 'center' });
      y += titleLines.length * 7 + 6;

      // Section 2
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
      const highlight = pdf.splitTextToSize('IDEAL highlights early warning signs and supports timely action.', cw);
      pdf.setFont('helvetica', 'italic');
      pdf.text(highlight, m, y);
      y += highlight.length * 4 + 6;

      // Section 3 — Wearable
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
      const alertNote = pdf.splitTextToSize('Alerts are generated automatically based on the person\'s health data recorded in IDEAL.', cw);
      pdf.text(alertNote, m, y);
      y += alertNote.length * 4 + 8;

      // Section 4 — QR
      pdf.setDrawColor(220);
      pdf.line(m, y, pw - m, y);
      y += 6;
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(40);
      pdf.text('Scan to Access Profile', pw / 2, y, { align: 'center' });
      y += 8;

      // Client identity
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(0);
      pdf.text(client.preferred_name, pw / 2, y, { align: 'center' });
      y += 8;

      // QR Code
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

      // Section 5 — Scan instructions
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(80);
      pdf.text('Scan using an authorised device to open this person\'s IDEAL profile.', pw / 2, y, { align: 'center' });
      y += 4;
      pdf.text('Staff verification is required.', pw / 2, y, { align: 'center' });

      // Footer
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading poster…</div>
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 gap-4">
        <p className="text-destructive">{error || 'Client not found'}</p>
        <Button variant="outline" onClick={() => window.history.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Go Back
        </Button>
      </div>
    );
  }

  return (
    <>
      {/* Print styles */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; margin: 0 !important; }
          .poster-page {
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 12mm 15mm !important;
          }
        }
        @page { size: A4 portrait; margin: 0; }
      `}</style>

      {/* Admin toolbar */}
      <div className="no-print fixed top-0 left-0 right-0 bg-card/95 backdrop-blur border-b border-border z-50 px-4 py-2 flex items-center justify-between gap-2">
        <Button variant="ghost" size="sm" onClick={() => window.history.back()}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-1" /> Print Poster
          </Button>
          <Button size="sm" onClick={handleDownloadPDF}>
            <Download className="h-4 w-4 mr-1" /> Download PDF
          </Button>
        </div>
      </div>

      {/* Poster */}
      <div className="min-h-screen bg-muted/30 flex items-center justify-center pt-16 pb-8 px-4 print:p-0 print:bg-white print:pt-0">
        <div
          ref={posterRef}
          className="poster-page bg-white w-full max-w-[210mm] shadow-xl border border-border rounded-lg"
          style={{ minHeight: '297mm', padding: '12mm 15mm' }}
        >
          {/* Header with logo */}
          <div className="flex items-center gap-2 border-b border-border pb-3 mb-4">
            <img src={idealLogo} alt="IDEAL" className="h-8 w-auto" />
            <div>
              <p className="text-xs font-bold text-foreground tracking-wide leading-tight">IDEAL</p>
              <p className="text-[7px] text-muted-foreground leading-tight">Intelligent Data for Everyday Activities &amp; Lifestyle</p>
            </div>
          </div>

          {/* Section 1 — Title */}
          <h1 className="text-lg font-extrabold text-foreground text-center mb-6 leading-snug tracking-tight">
            IDEAL — Intelligent Data for<br />Everyday Activities &amp; Lifestyle
          </h1>

          {/* Section 2 — What IDEAL Is */}
          <div className="mb-5">
            <h2 className="text-sm font-bold text-foreground mb-2 uppercase tracking-wide">What is IDEAL?</h2>
            <p className="text-[10px] text-muted-foreground leading-relaxed mb-3">
              IDEAL is a smart health monitoring system that helps support workers, families,
              and clinicians provide safer, more responsive care.
            </p>
            <div className="grid grid-cols-3 gap-x-4 gap-y-0.5 text-[9px] text-muted-foreground mb-2">
              {['Bowel care', 'Fluid balance', 'Pain', 'Sleep', 'Nutrition', 'Vital signs', 'Skin integrity', 'Preventive health'].map((item) => (
                <span key={item}>• {item}</span>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground italic">
              IDEAL highlights early warning signs and supports timely action.
            </p>
          </div>

          {/* Section 3 — Wearable Alerts */}
          <div className="border-t border-border pt-4 mb-5">
            <h2 className="text-sm font-bold text-foreground mb-2 uppercase tracking-wide">Smart Wearable Alerts</h2>
            <div className="flex gap-6 text-[10px] mb-2">
              <div className="flex items-center gap-2">
                <span className="inline-block w-4 h-4 rounded-full bg-orange-500 shrink-0 border border-orange-600" />
                <span className="text-muted-foreground"><strong className="text-foreground">Amber</strong> — Monitor / Action May Be Needed</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-block w-4 h-4 rounded-full bg-red-600 shrink-0 border border-red-700" />
                <span className="text-muted-foreground"><strong className="text-foreground">Red</strong> — Urgent Attention Required</span>
              </div>
            </div>
            <p className="text-[9px] text-muted-foreground">
              Alerts are generated automatically based on the person's health data recorded in IDEAL.
            </p>
          </div>

          {/* Section 4 — QR Code */}
          <div className="border-t border-border pt-5 mb-4">
            <h2 className="text-sm font-bold text-foreground mb-2 text-center uppercase tracking-wide">
              Scan to Access Profile
            </h2>

            {/* Client identity */}
            <div className="flex flex-col items-center gap-2 mb-3">
              <ProfileAvatar
                name={client.preferred_name}
                avatarUrl={client.photo_url || undefined}
                size="lg"
              />
              <h3 className="text-xl font-bold text-foreground">{client.preferred_name}</h3>
            </div>

            {/* QR Code — large and centered */}
            <div className="flex justify-center mb-3">
              <div className="bg-white border-2 border-foreground/20 p-5 rounded-xl inline-block">
                {qrUrl ? (
                  <QRCodeSVG value={qrUrl} size={180} level="H" includeMargin={false} />
                ) : (
                  <div className="w-[180px] h-[180px] flex items-center justify-center text-muted-foreground text-xs">
                    No QR token available
                  </div>
                )}
              </div>
            </div>

            {/* Section 5 — Scan Instructions */}
            <p className="text-[10px] text-muted-foreground text-center leading-relaxed">
              Scan using an authorised device to open this person's IDEAL profile.
            </p>
            <p className="text-[10px] text-muted-foreground text-center font-medium">
              Staff verification is required.
            </p>
          </div>

          {/* Section 6 — Footer */}
          <div className="border-t border-border pt-3 mt-auto">
            <p className="text-[8px] text-muted-foreground text-center leading-relaxed">
              Access restricted to authorised staff only.
            </p>
            <p className="text-[8px] text-muted-foreground text-center leading-relaxed">
              Follow privacy and confidentiality policies.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
