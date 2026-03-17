/**
 * IDEAL Printable Poster Page
 * Comprehensive A4-optimized poster for display in disability support homes
 */

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { supabase } from '@/integrations/supabase/client';
import { clientTokenService } from '@/services/clientToken';
import { Button } from '@/components/ui/button';
import { ProfileAvatar } from '@/components/ideal/ProfileAvatar';
import { Printer, Download, ArrowLeft, RefreshCw, Eye, EyeOff } from 'lucide-react';
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
  const [showName, setShowName] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const posterRef = useRef<HTMLDivElement>(null);

  const fetchClient = useCallback(async () => {
    if (!clientId) {
      setError('Client ID not provided');
      setLoading(false);
      return;
    }
    try {
      const { data, error: fetchError } = await supabase
        .from('clients')
        .select('id, preferred_name, short_bio, photo_url, status, poster_qr_token_rotated_at, created_at')
        .eq('id', clientId)
        .single();

      if (fetchError) throw fetchError;
      if (!data) throw new Error('Client not found');
      setClient(data);

      // Get stored token from localStorage or generate new one
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

  // Realtime subscription for token changes
  useEffect(() => {
    if (!clientId) return;
    const channel = supabase
      .channel(`poster-${clientId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'clients',
        filter: `id=eq.${clientId}`,
      }, () => {
        // Token was rotated externally — refetch
        fetchClient();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [clientId, fetchClient]);

  const qrUrl = token ? clientTokenService.generatePosterQrUrl(token) : '';

  const handleRegenerateToken = async () => {
    if (!clientId) return;
    setRegenerating(true);
    try {
      const result = await clientTokenService.rotateClientToken(clientId);
      if (result.success && result.newToken) {
        setToken(result.newToken);
        localStorage.setItem(`poster_token_${clientId}`, result.newToken);
        toast.success('QR token regenerated — poster updated');
      } else {
        toast.error(result.error || 'Failed to regenerate token');
      }
    } finally {
      setRegenerating(false);
    }
  };

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

      // -- Logo placeholder text --
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(120, 80, 200);
      pdf.text('IDEAL', m, y + 5);
      pdf.setFontSize(7);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(100);
      pdf.text('Intelligent Data for Everyday Activities & Lifestyle', m + 14, y + 5);

      // -- Divider --
      y += 12;
      pdf.setDrawColor(200);
      pdf.line(m, y, pw - m, y);
      y += 8;

      // -- Section 1: What IDEAL Is --
      pdf.setFontSize(13);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(40);
      pdf.text('What is IDEAL?', m, y);
      y += 6;
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(60);
      const descLines = pdf.splitTextToSize(
        'IDEAL is a smart health monitoring system designed to help support workers, families, and clinicians provide safer, more responsive care. It highlights early warning signs and supports timely action.',
        cw
      );
      pdf.text(descLines, m, y);
      y += descLines.length * 4 + 4;

      const modules = [
        'Bowel care', 'Fluid balance', 'Pain', 'Sleep', 'Nutrition',
        'Vital signs', 'Skin integrity', 'Preventive health'
      ];
      modules.forEach((mod) => {
        pdf.text(`•  ${mod}`, m + 4, y);
        y += 4;
      });
      y += 4;

      // -- Section 2: Wearable Alerts --
      pdf.setDrawColor(220);
      pdf.line(m, y, pw - m, y);
      y += 6;
      pdf.setFontSize(13);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(40);
      pdf.text('Smart Wearable Alerts', m, y);
      y += 6;
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(60);
      const wearableDesc = pdf.splitTextToSize(
        'The IDEAL wearable device provides immediate visual alerts to staff. Alerts are generated automatically based on the person\'s health data recorded in IDEAL. The wearable helps staff respond quickly without needing to check a device constantly.',
        cw
      );
      pdf.text(wearableDesc, m, y);
      y += wearableDesc.length * 4 + 4;

      // Amber
      pdf.setFillColor(255, 165, 0);
      pdf.circle(m + 3, y - 1, 2, 'F');
      pdf.setTextColor(60);
      pdf.text('Amber — Monitor / Action May Be Needed', m + 8, y);
      y += 5;
      // Red
      pdf.setFillColor(220, 38, 38);
      pdf.circle(m + 3, y - 1, 2, 'F');
      pdf.text('Red — Urgent Attention Required', m + 8, y);
      y += 8;

      // -- Section 3 + 4: QR Access --
      pdf.setDrawColor(220);
      pdf.line(m, y, pw - m, y);
      y += 6;
      pdf.setFontSize(13);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(40);
      pdf.text('Scan to Access Profile', pw / 2, y, { align: 'center' });
      y += 6;
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(80);
      pdf.text('Use your authorised device to scan this QR code to open the individual\'s IDEAL profile.', pw / 2, y, { align: 'center' });
      y += 8;

      // Client name + avatar area
      if (showName) {
        pdf.setFontSize(20);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(0);
        pdf.text(client.preferred_name, pw / 2, y, { align: 'center' });
        y += 8;
      }

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
            if (ctx) {
              ctx.fillStyle = 'white';
              ctx.fillRect(0, 0, qrSize, qrSize);
              ctx.drawImage(img, 0, 0, qrSize, qrSize);
            }
            URL.revokeObjectURL(url);
            resolve();
          };
          img.onerror = reject;
          img.src = url;
        });
        const qrDataUrl = qrCanvas.toDataURL('image/png');
        const qrPdfSize = 60;
        pdf.addImage(qrDataUrl, 'PNG', (pw - qrPdfSize) / 2, y, qrPdfSize, qrPdfSize);
        y += qrPdfSize + 6;
      }

      // Instructions
      const instructions = [
        '1.  Scan the QR code with your phone camera',
        '2.  Enter your verified phone number',
        '3.  Enter the SMS verification code',
        '4.  Access the individual\'s IDEAL profile',
      ];
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(60);
      instructions.forEach((line) => {
        pdf.text(line, pw / 2, y, { align: 'center' });
        y += 4.5;
      });

      // -- Footer --
      pdf.setDrawColor(200);
      pdf.line(m, ph - m - 12, pw - m, ph - m - 12);
      pdf.setFontSize(7);
      pdf.setTextColor(130);
      pdf.text(
        'Access is restricted to authorised staff only. Mobile devices are verified before access is granted.',
        pw / 2, ph - m - 6, { align: 'center' }
      );
      pdf.text(
        'Follow organisational policies for privacy and confidentiality.',
        pw / 2, ph - m - 2, { align: 'center' }
      );
      pdf.setFontSize(6);
      pdf.setTextColor(170);
      pdf.text(
        `Generated: ${new Date().toLocaleDateString()} | IDEAL Health Monitoring`,
        pw / 2, ph - m + 2, { align: 'center' }
      );

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

  const lastUpdated = client.poster_qr_token_rotated_at
    ? new Date(client.poster_qr_token_rotated_at).toLocaleString()
    : new Date(client.created_at).toLocaleString();

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
      <div className="no-print fixed top-0 left-0 right-0 bg-card/95 backdrop-blur border-b border-border z-50 px-4 py-2 flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => window.history.back()}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          <span className="text-xs text-muted-foreground hidden sm:inline">
            Last updated: {lastUpdated}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowName(!showName)}
            title={showName ? 'Hide name' : 'Show name'}
          >
            {showName ? <EyeOff className="h-4 w-4 mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
            {showName ? 'Hide Name' : 'Show Name'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRegenerateToken}
            disabled={regenerating}
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${regenerating ? 'animate-spin' : ''}`} />
            Regenerate QR
          </Button>
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-1" /> Print
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
          <div className="flex items-center justify-between border-b border-border pb-3 mb-5">
            <div className="flex items-center gap-2">
              <img src={idealLogo} alt="IDEAL" className="h-7 w-auto" />
              <div>
                <p className="text-[11px] font-bold text-foreground tracking-wide leading-tight">IDEAL</p>
                <p className="text-[7px] text-muted-foreground leading-tight">Intelligent Data for Everyday Activities &amp; Lifestyle</p>
              </div>
            </div>
            <span className="text-[8px] text-muted-foreground font-medium uppercase tracking-wider">Staff Use Only</span>
          </div>

          {/* Section 1 — What IDEAL Is */}
          <div className="mb-5">
            <h2 className="text-sm font-bold text-foreground mb-2 uppercase tracking-wide">What is IDEAL?</h2>
            <p className="text-[10px] text-muted-foreground leading-relaxed mb-3">
              IDEAL is a smart health monitoring system designed to help support workers, families,
              and clinicians provide safer, more responsive care. It highlights early warning signs
              and supports timely action.
            </p>
            <p className="text-[10px] text-muted-foreground mb-1.5 font-medium">It helps monitor important health areas such as:</p>
            <div className="grid grid-cols-3 gap-x-4 gap-y-0.5 text-[9px] text-muted-foreground">
              {['Bowel care', 'Fluid balance', 'Pain', 'Sleep', 'Nutrition', 'Vital signs', 'Skin integrity', 'Medication support', 'Preventive health'].map((item) => (
                <span key={item}>• {item}</span>
              ))}
            </div>
          </div>

          {/* Section 2 — Wearable Device */}
          <div className="border-t border-border pt-4 mb-5">
            <h2 className="text-sm font-bold text-foreground mb-2 uppercase tracking-wide">Smart Wearable Alerts</h2>
            <p className="text-[10px] text-muted-foreground leading-relaxed mb-3">
              The IDEAL wearable device provides immediate visual alerts to staff.
              Alerts are generated automatically based on the person's health data recorded in IDEAL.
              The wearable helps staff respond quickly without needing to check a device constantly.
            </p>
            <div className="flex gap-6 text-[10px]">
              <div className="flex items-center gap-2">
                <span className="inline-block w-4 h-4 rounded-full bg-orange-500 shrink-0" />
                <span className="text-muted-foreground"><strong className="text-foreground">Amber</strong> — Monitor / Action May Be Needed</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-block w-4 h-4 rounded-full bg-red-600 shrink-0" />
                <span className="text-muted-foreground"><strong className="text-foreground">Red</strong> — Urgent Attention Required</span>
              </div>
            </div>
          </div>

          {/* Section 3 — QR Access + Dynamic QR */}
          <div className="border-t border-border pt-5 mb-4">
            <h2 className="text-sm font-bold text-foreground mb-1 text-center uppercase tracking-wide">
              Scan to Access Profile
            </h2>
            <p className="text-[10px] text-muted-foreground text-center mb-1">
              Use your authorised device to scan this QR code to open the individual's IDEAL profile.
            </p>
            <p className="text-[9px] text-muted-foreground text-center mb-4">
              Access may require staff verification.
            </p>

            {/* Client identity */}
            <div className="flex flex-col items-center gap-2 mb-4">
              <ProfileAvatar
                name={client.preferred_name}
                avatarUrl={client.photo_url || undefined}
                size="lg"
              />
              {showName && (
                <h3 className="text-xl font-bold text-foreground">{client.preferred_name}</h3>
              )}
              {client.short_bio && (
                <p className="text-[10px] text-muted-foreground text-center max-w-xs">{client.short_bio}</p>
              )}
            </div>

            {/* QR Code - large and centered */}
            <div className="flex justify-center mb-4">
              <div className="bg-white border-2 border-border p-5 rounded-xl inline-block">
                {qrUrl ? (
                  <QRCodeSVG value={qrUrl} size={180} level="H" includeMargin={false} />
                ) : (
                  <div className="w-[180px] h-[180px] flex items-center justify-center text-muted-foreground text-xs">
                    No QR token
                  </div>
                )}
              </div>
            </div>

            {/* Instructions */}
            <div className="text-center space-y-0.5 text-[9px] text-muted-foreground mb-2">
              <p className="font-medium text-foreground text-[10px] mb-1">How to access:</p>
              <p>1. Scan the QR code with your phone camera</p>
              <p>2. Enter your verified phone number</p>
              <p>3. Enter the SMS verification code</p>
              <p>4. Access the individual's IDEAL profile</p>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-border pt-3 mt-auto">
            <p className="text-[8px] text-muted-foreground text-center leading-relaxed">
              Access is restricted to authorised staff only. Mobile devices are verified before access is granted.
            </p>
            <p className="text-[8px] text-muted-foreground text-center leading-relaxed">
              Follow organisational policies for privacy and confidentiality.
            </p>
            <p className="text-[7px] text-muted-foreground/60 text-center mt-1">
              Generated: {new Date().toLocaleDateString()} | IDEAL Health Monitoring
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
