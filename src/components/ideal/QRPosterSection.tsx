import { useState, useRef, useCallback, useEffect } from 'react';
const smartwatchImg = '/iot-wearable.png';
import { useProfile } from '@/contexts/ProfileContext';
import { QRCodeSVG } from 'qrcode.react';
import { QrCode, FileText, Download, Printer, RefreshCw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { generatePosterPdf } from '@/utils/generatePosterPdf';
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
      await generatePosterPdf({
        name: profileName,
        photoUrl: profile?.avatarUrl,
        qrSvgElement: qrRef.current?.querySelector('svg') ?? null,
      });
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
        {!hasLoaded ? (
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
