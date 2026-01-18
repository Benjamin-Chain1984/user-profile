import { QrCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import idealLogo from '@/assets/ideal-logo.png';

interface AppHeaderProps {
  onQRCodeClick: () => void;
}

export function AppHeader({ onQRCodeClick }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-primary backdrop-blur-sm border-b border-border shadow-sm">
      <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img 
            src={idealLogo} 
            alt="IDEAL - Intelligent Data for Everyday Activities and Lifestyle" 
            className="h-10 w-auto"
          />
        </div>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={onQRCodeClick}
          className="text-primary-foreground hover:bg-primary-foreground/10"
          aria-label="Show QR Code for quick logging"
        >
          <QrCode className="w-5 h-5" />
        </Button>
      </div>
    </header>
  );
}
