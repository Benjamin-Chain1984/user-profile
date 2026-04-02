/**
 * IDEAL Printable Poster Page
 * A4-optimized poster for wall display in disability support homes.
 * 
 * QR Binding: Uses the SAME token stored by QRPosterSection in the Profile module.
 * Does NOT generate new tokens — only displays the existing one.
 */

import { useEffect, useState, useRef } from 'react';
const smartwatchImg = '/IoT wearable.png';
import { useParams, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { supabase } from '@/integrations/supabase/client';
import { clientTokenService } from '@/services/clientToken';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Printer, Download, ArrowLeft, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { ProfileAvatar } from '@/components/ideal/ProfileAvatar';
import jsPDF from 'jspdf';

/** Token is now loaded from the database, not localStorage */


interface ClientData {
  id: string;
  preferred_name: string;
  short_bio: string | null;
  photo_url: string | null;
  status: string;
}

export default function ClientPosterPage() {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const [client, setClient] = useState<ClientData | null>(null);
  const [qrToken, setQrToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const posterRef = useRef<HTMLDivElement>(null);

  // Fetch client data + load token from database
  useEffect(() => {
    if (!clientId) { setError('Client ID not provided'); setLoading(false); return; }

    (async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from('clients')
          .select('id, preferred_name, short_bio, photo_url, status, poster_qr_token_plain')
          .eq('id', clientId)
          .single();
        if (fetchError) throw fetchError;
        if (!data) throw new Error('Client not found');
        setClient(data);
        setQrToken((data as any).poster_qr_token_plain || null);
      } catch (err) {
        console.error('Error fetching client:', err);
        setError('Unable to load client details');
      } finally {
        setLoading(false);
      }
    })();
  }, [clientId]);

  // Realtime: if token is rotated in Profile, refresh from DB
  useEffect(() => {
    if (!clientId) return;
    const channel = supabase
      .channel(`poster-${clientId}`)
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'clients',
        filter: `id=eq.${clientId}`,
      }, (payload: any) => {
        const newToken = payload.new?.poster_qr_token_plain;
        if (newToken) setQrToken(newToken);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [clientId]);

  const qrUrl = qrToken ? clientTokenService.generatePosterQrUrl(qrToken) : '';

  const handlePrint = () => window.print();

  const handleDownloadPDF = async () => {
    if (!client || !qrToken) return;
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

      // Section 3 — Wearable Alerts (with smartwatch image)
      pdf.setDrawColor(220);
      pdf.line(m, y, pw - m, y);
      y += 6;

      const watchImgSize = 20;
      try {
        const watchImgEl = new Image();
        await new Promise<void>((resolve) => {
          watchImgEl.onload = () => resolve();
          watchImgEl.onerror = () => resolve();
          watchImgEl.src = smartwatchImg;
        });
        if (watchImgEl.complete && watchImgEl.naturalWidth > 0) {
          const wCanvas = document.createElement('canvas');
          wCanvas.width = 200; wCanvas.height = 200;
          const wCtx = wCanvas.getContext('2d');
          if (wCtx) { wCtx.drawImage(watchImgEl, 0, 0, 200, 200); }
          pdf.addImage(wCanvas.toDataURL('image/png'), 'PNG', m, y, watchImgSize, watchImgSize);
        }
      } catch { /* skip watch image */ }

      const alertTextX = m + watchImgSize + 4;
      const alertTextW = cw - watchImgSize - 4;

      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(40);
      pdf.text('Smart Wearable Alerts', alertTextX, y + 4);
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(60);
      pdf.setFillColor(255, 165, 0);
      pdf.circle(alertTextX + 3, y + 9, 2, 'F');
      pdf.text('Amber — Monitor / Action May Be Needed', alertTextX + 8, y + 10);
      pdf.setFillColor(220, 38, 38);
      pdf.circle(alertTextX + 3, y + 14, 2, 'F');
      pdf.text('Red — Urgent Attention Required', alertTextX + 8, y + 15);
      pdf.setTextColor(80);
      const alertNote = pdf.splitTextToSize("Alerts are generated automatically based on the person's health data recorded in IDEAL.", alertTextW);
      pdf.text(alertNote, alertTextX, y + 20);
      y += Math.max(watchImgSize, 20 + alertNote.length * 4) + 8;

      // Section 4 — QR Code + Client Name
      pdf.setDrawColor(220);
      pdf.line(m, y, pw - m, y);
      y += 6;
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(40);
      pdf.text('Scan to Access Profile', pw / 2, y, { align: 'center' });
      y += 8;

      // Profile photo in PDF
      if (client.photo_url) {
        try {
          const photoImg = new Image();
          photoImg.crossOrigin = 'anonymous';
          await new Promise<void>((resolve) => {
            photoImg.onload = () => resolve();
            photoImg.onerror = () => resolve();
            photoImg.src = client.photo_url!;
          });
          if (photoImg.complete && photoImg.naturalWidth > 0) {
            const photoCanvas = document.createElement('canvas');
            const photoSize = 300;
            photoCanvas.width = photoSize;
            photoCanvas.height = photoSize;
            const pCtx = photoCanvas.getContext('2d');
            if (pCtx) {
              pCtx.beginPath();
              pCtx.arc(photoSize / 2, photoSize / 2, photoSize / 2, 0, Math.PI * 2);
              pCtx.clip();
              const minDim = Math.min(photoImg.naturalWidth, photoImg.naturalHeight);
              const sx = (photoImg.naturalWidth - minDim) / 2;
              const sy = (photoImg.naturalHeight - minDim) / 2;
              pCtx.drawImage(photoImg, sx, sy, minDim, minDim, 0, 0, photoSize, photoSize);
            }
            const photoDataUrl = photoCanvas.toDataURL('image/png');
            const photoPdfSize = 25;
            pdf.addImage(photoDataUrl, 'PNG', (pw - photoPdfSize) / 2, y, photoPdfSize, photoPdfSize);
            y += photoPdfSize + 4;
          }
        } catch { /* skip photo in PDF */ }
      }

      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(0);
      pdf.text(client.preferred_name, pw / 2, y, { align: 'center' });
      y += 8;

      const svgElement = posterRef.current?.querySelector('.qr-print-target svg');
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

      pdf.save(`IDEAL-Poster-${client.preferred_name.replace(/\s+/g, '-')}.pdf`);
      toast.success('Poster PDF downloaded');
    } catch (err) {
      console.error('Error generating PDF:', err);
      toast.error('Failed to generate PDF');
    }
  };

  // ── Loading state ──
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading poster…</div>
      </div>
    );
  }

  // ── Error state ──
  if (error || !client) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 gap-4">
        <p className="text-destructive">{error || 'Client not found'}</p>
        <Button variant="outline" onClick={() => navigate(-1)}>
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
          .qr-print-target svg { display: block !important; }
        }
        @page { size: A4 portrait; margin: 0; }
      `}</style>

      {/* ── Admin toolbar (hidden in print) ── */}
      <div className="no-print fixed top-0 left-0 right-0 bg-card/95 backdrop-blur border-b border-border z-50 px-4 py-2 flex items-center justify-between gap-2">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handlePrint} disabled={!qrToken}>
            <Printer className="h-4 w-4 mr-1" /> Print Poster
          </Button>
          <Button size="sm" onClick={handleDownloadPDF} disabled={!qrToken}>
            <Download className="h-4 w-4 mr-1" /> Download PDF
          </Button>
        </div>
      </div>

      {/* ── Poster body ── */}
      <div className="min-h-screen bg-muted/30 flex items-center justify-center pt-16 pb-8 px-4 print:p-0 print:bg-white print:pt-0">
        <div
          ref={posterRef}
          className="poster-page bg-white w-full max-w-[210mm] shadow-xl border border-border rounded-lg"
          style={{ minHeight: '297mm', padding: '12mm 15mm' }}
        >
          {/* ── Header with logo ── */}
          <div className="flex items-center gap-2 border-b border-border pb-3 mb-5">
            <img src="/Ideal-logo.png" alt="IDEAL" className="h-14 w-auto" />
          </div>

          {/* ── Section 1 — Title ── */}
          <h1 className="text-2xl font-extrabold text-foreground text-center mb-6 leading-snug tracking-tight">
            IDEAL — Intelligent Data for<br />Everyday Activities &amp; Lifestyle
          </h1>

          {/* ── Section 2 — What is IDEAL? ── */}
          <div className="mb-5">
            <h2 className="text-base font-bold text-foreground mb-2 uppercase tracking-wide">What is IDEAL?</h2>
            <p className="text-xs text-muted-foreground leading-relaxed mb-3">
              IDEAL is a smart health monitoring system that helps support workers, families,
              and clinicians provide safer, more responsive care.
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed mb-2">
              Visual cues signal when the person requires care or there is a healthcare concern. Scan the QR code and follow the advice to clear the alert.
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              You should be checking this QR code regularly to check for scheduled support requirements.
            </p>
          </div>

          {/* ── Section 3 — Wearable Alerts ── */}
          <div className="border-t border-border pt-4 mb-5">
            <h2 className="text-base font-bold text-foreground mb-2 uppercase tracking-wide">Smart Wearable Alerts</h2>
            <div className="flex items-start gap-4">
              <img src={smartwatchImg} alt="IoT Smartwatch" className="w-24 h-24 object-contain shrink-0" />
              <div>
                <div className="flex flex-col gap-2 text-xs mb-2">
                  <div className="flex items-center gap-2">
                    <span className="inline-block w-4 h-4 rounded-full bg-orange-500 shrink-0 border border-orange-600" />
                    <span className="text-muted-foreground"><strong className="text-foreground">Amber</strong> — Monitor / Action May Be Needed</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-block w-4 h-4 rounded-full bg-red-600 shrink-0 border border-red-700" />
                    <span className="text-muted-foreground"><strong className="text-foreground">Red</strong> — Urgent Attention Required</span>
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Alerts are generated automatically based on the person's health data recorded in IDEAL.
                </p>
              </div>
            </div>
          </div>

          {/* ── Section 4 — QR Code ── */}
          <div className="border-t border-border pt-5 mb-4">
            <h2 className="text-sm font-bold text-foreground mb-3 text-center uppercase tracking-wide">
              Scan to Access Profile
            </h2>

            {/* Client photo + name */}
            <div className="flex flex-col items-center gap-2 mb-4">
              <ProfileAvatar name={client.preferred_name} avatarUrl={client.photo_url || undefined} size="lg" />
              <h3 className="text-xl font-bold text-foreground text-center">{client.preferred_name}</h3>
            </div>

            {qrToken ? (
              <div className="flex flex-col items-center">
                <div className="qr-print-target bg-white border-2 border-foreground/20 p-5 rounded-xl inline-block">
                  <QRCodeSVG value={qrUrl} size={180} level="H" includeMargin={false} />
                </div>

                {/* Debug info (temporary) */}
                <div className="no-print mt-2 text-[9px] text-muted-foreground font-mono text-center space-y-0.5">
                  <p>Profile ID: {client.id}</p>
                  <p>QR Token Present: Yes</p>
                </div>
              </div>
            ) : (
              <Card className="mx-auto max-w-sm border-dashed border-2 border-muted-foreground/30">
                <CardContent className="flex flex-col items-center gap-3 py-6">
                  <AlertTriangle className="h-8 w-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground text-center font-medium">
                    No QR code available.
                  </p>
                  <p className="text-xs text-muted-foreground text-center">
                    Generate QR in Profile settings.
                  </p>
                  {/* Debug info (temporary) */}
                  <div className="no-print mt-1 text-[9px] text-muted-foreground font-mono text-center space-y-0.5">
                    <p>Profile ID: {client.id}</p>
                    <p>QR Token Present: No</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* ── Section 5 — Scan Instructions ── */}
          <div className="mb-4">
            <p className="text-[10px] text-muted-foreground text-center leading-relaxed">
              Scan using an authorised device to open this person's IDEAL profile.
            </p>
            <p className="text-[10px] text-muted-foreground text-center font-medium">
              Staff verification is required.
            </p>
          </div>

          {/* ── Section 6 — Footer ── */}
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
