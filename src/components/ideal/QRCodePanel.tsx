import { QRCodeSVG } from 'qrcode.react';
import { useProfile } from '@/contexts/ProfileContext';
import { X, Smartphone, ScanLine } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
const idealLogo = '/Ideal-logo.png';

interface QRCodePanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function QRCodePanel({ open, onOpenChange }: QRCodePanelProps) {
  const { profile, enabledModules } = useProfile();
  
  // Generate a unique URL/identifier for this individual
  // In production, this would be a real URL to the app
  const qrCodeValue = JSON.stringify({
    type: 'ideal-quick-log',
    profileId: profile.fullName.toLowerCase().replace(/\s+/g, '-'),
    name: profile.fullName,
    enabledModules: enabledModules
      .filter(m => m.enabled)
      .map(m => m.id),
    timestamp: new Date().toISOString()
  });

  const activeModules = enabledModules.filter(m => m.enabled);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm mx-auto">
        <DialogHeader className="text-center">
          <div className="flex justify-center mb-2">
            <img 
              src={idealLogo} 
              alt="IDEAL" 
              className="h-8 w-auto"
            />
          </div>
          <DialogTitle className="text-xl">Quick Log Access</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* QR Code Display */}
          <Card className="border-2 border-primary/20 bg-white">
            <CardContent className="p-6 flex flex-col items-center">
              <div className="p-4 bg-white rounded-xl shadow-inner">
                <QRCodeSVG 
                  value={qrCodeValue}
                  size={180}
                  level="M"
                  includeMargin={true}
                  fgColor="hsl(270, 50%, 40%)"
                />
              </div>
              
              <div className="mt-4 text-center">
                <p className="font-semibold text-foreground">{profile.fullName}</p>
                <p className="text-sm text-muted-foreground">
                  {activeModules.length} active module{activeModules.length !== 1 ? 's' : ''}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Instructions */}
          <Card className="bg-muted/50 border-muted">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                  <ScanLine className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-sm text-foreground">Scan to Log Data</p>
                  <p className="text-xs text-muted-foreground">
                    Staff can scan this code with their phone to quickly open the logging screen
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                  <Smartphone className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-sm text-foreground">Mobile Ready</p>
                  <p className="text-xs text-muted-foreground">
                    Opens directly to this individual's active modules for fast data entry
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Active Modules List */}
          {activeModules.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Available for Quick Log:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {activeModules.slice(0, 6).map(module => (
                  <span
                    key={module.id}
                    className="px-2 py-1 text-xs bg-primary/10 text-primary rounded-full"
                  >
                    {module.name}
                  </span>
                ))}
                {activeModules.length > 6 && (
                  <span className="px-2 py-1 text-xs bg-muted text-muted-foreground rounded-full">
                    +{activeModules.length - 6} more
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
