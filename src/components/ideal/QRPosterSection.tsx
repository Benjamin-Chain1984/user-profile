import { useState } from 'react';
import { useProfile } from '@/contexts/ProfileContext';
import { QRCodeSVG } from 'qrcode.react';
import { QrCode, FileText, Download, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function QRPosterSection() {
  const { profile, enabledModules } = useProfile();
  const [showQR, setShowQR] = useState(false);

  if (!profile) return null;

  const qrCodeValue = JSON.stringify({
    type: 'ideal-quick-log',
    profileId: profile.fullName.toLowerCase().replace(/\s+/g, '-'),
    name: profile.fullName,
    enabledModules: enabledModules.filter(m => m.enabled).map(m => m.id),
  });

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
        {/* QR Code Toggle */}
        <Button
          variant="outline"
          className="w-full flex items-center justify-center gap-2 py-2.5 sm:py-3 touch-manipulation active:scale-[0.98]"
          onClick={() => setShowQR(!showQR)}
        >
          <QrCode className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
          <span className="text-xs sm:text-sm font-medium">
            {showQR ? 'Hide QR Code' : 'Show QR Code for Quick Logging'}
          </span>
        </Button>
        
        {showQR && (
          <div className="flex flex-col items-center animate-fade-in">
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
              Scan to quickly log data for {profile.fullName}
            </p>
          </div>
        )}

        {/* Poster Actions */}
        <div className="pt-4 border-t border-border space-y-3">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-foreground">Printable Poster</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Generate a bedside poster with QR code and care instructions.
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex-1 gap-2">
              <Download className="w-4 h-4" />
              Download PDF
            </Button>
            <Button variant="outline" size="sm" className="flex-1 gap-2">
              <Printer className="w-4 h-4" />
              Print
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
