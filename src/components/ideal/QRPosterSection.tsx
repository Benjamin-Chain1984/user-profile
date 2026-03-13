import { useState, useRef, useCallback } from 'react';
import { useProfile } from '@/contexts/ProfileContext';
import { QRCodeSVG } from 'qrcode.react';
import { QrCode, FileText, Download, Printer, RefreshCw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import { supabase } from '@/integrations/supabase/client';
import { generateSecureToken, hashToken } from '@/services/clientToken';

const TOKEN_STORAGE_PREFIX = 'ideal_profile_qr_token_';

export function QRPosterSection() {
  const { profile } = useProfile();
  const [showQR, setShowQR] = useState(false);
  const [qrToken, setQrToken] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);

  const profileId = profile?.id;
  const profileName = profile?.fullName ?? '';
  const storageKey = `${TOKEN_STORAGE_PREFIX}${profileId || ''}`;
  const qrCodeValue = qrToken ? `${window.location.origin}/c/${qrToken}` : '';

  const generateNewToken = useCallback(async () => {
    if (!profileId) return;
    setIsGenerating(true);
    try {
      const token = generateSecureToken();
      const tokenHash = await hashToken(token);

      console.log('[QR] Storing token hash for profile:', profileId);

      const { error, data } = await supabase
        .from('profiles')
        .update({ poster_qr_token_hash: tokenHash } as any)
        .eq('id', profileId)
        .select('id')
        .single();

      if (error) {
        console.error('[QR] Update error:', JSON.stringify(error));
        throw error;
      }

      console.log('[QR] Token stored successfully, profile:', data?.id);
      localStorage.setItem(storageKey, token);
      setQrToken(token);
    } catch (err) {
      console.error('[QR] Failed to generate QR token:', err);
      toast.error('Failed to generate QR code');
    } finally {
      setIsGenerating(false);
    }
  }, [profileId, storageKey]);

  const ensureToken = useCallback(async () => {
    if (!profileId) return;
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      const storedHash = await hashToken(stored);
      const { data } = await supabase
        .from('profiles')
        .select('poster_qr_token_hash')
        .eq('id', profileId)
        .single();
      if (data?.poster_qr_token_hash === storedHash) {
        setQrToken(stored);
        return;
      }
      localStorage.removeItem(storageKey);
    }
    await generateNewToken();
  }, [profileId, storageKey, generateNewToken]);

  if (!profile) return null;

  const handleToggleQR = async () => {
    if (!showQR) {
      setShowQR(true);
      if (!qrToken) await ensureToken();
    } else {
      setShowQR(false);
    }
  };

  const handleRegenerate = async () => {
    localStorage.removeItem(storageKey);
    setQrToken(null);
    await generateNewToken();
    toast.success('QR code regenerated. Previous QR codes are now invalid.');
  };

  const handlePrint = () => window.print();

  const handleDownloadPDF = async () => {
    if (!qrToken) return;
    try {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 20;
      let y = 30;

      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text('IDEAL Health Monitoring', margin, 20);
      doc.text('Staff Use Only', pageWidth - margin, 20, { align: 'right' });
      doc.setFontSize(28);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0);
      doc.text(profileName, pageWidth / 2, y + 20, { align: 'center' });
      y += 35;

      const svgElement = qrRef.current?.querySelector('svg');
      if (svgElement) {
        const qrCanvas = document.createElement('canvas');
        qrCanvas.width = 200;
        qrCanvas.height = 200;
        const svgData = new XMLSerializer().serializeToString(svgElement);
        const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);
        const img = new Image();
        await new Promise<void>((resolve) => {
          img.onload = () => {
            const ctx = qrCanvas.getContext('2d');
            if (ctx) { ctx.fillStyle = 'white'; ctx.fillRect(0, 0, 200, 200); ctx.drawImage(img, 0, 0, 200, 200); }
            URL.revokeObjectURL(url);
            resolve();
          };
          img.onerror = () => { URL.revokeObjectURL(url); resolve(); };
          img.src = url;
        });
        const qrDataUrl = qrCanvas.toDataURL('image/png');
        const qrPdfSize = 60;
        doc.addImage(qrDataUrl, 'PNG', (pageWidth - qrPdfSize) / 2, y, qrPdfSize, qrPdfSize);
        y += qrPdfSize + 10;
      }

      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(60);
      doc.text('Scan to open IDEAL', pageWidth / 2, y, { align: 'center' });
      y += 15;
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text('This poster is for authorized staff only.', pageWidth / 2, y, { align: 'center' });
      doc.save(`ideal-poster-${profileName.replace(/\s+/g, '-').toLowerCase()}.pdf`);
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
        <Button
          variant="outline"
          className="w-full flex items-center justify-center gap-2 py-2.5 sm:py-3 touch-manipulation active:scale-[0.98]"
          onClick={handleToggleQR}
          disabled={isGenerating}
        >
          {isGenerating ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <QrCode className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
          )}
          <span className="text-xs sm:text-sm font-medium">
            {isGenerating ? 'Generating…' : showQR ? 'Hide QR Code' : 'Show QR Code for Quick Logging'}
          </span>
        </Button>

        {showQR && qrToken && (
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
        )}

        {showQR && !qrToken && !isGenerating && (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground mb-2">Unable to load QR code.</p>
            <Button variant="outline" size="sm" onClick={ensureToken}>
              Try Again
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
