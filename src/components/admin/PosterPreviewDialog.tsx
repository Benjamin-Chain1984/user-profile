/**
 * Poster Preview Dialog
 * Preview and download client poster as PDF
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
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;
      const contentWidth = pageWidth - margin * 2;

      // Title
      pdf.setFontSize(28);
      pdf.setFont('helvetica', 'bold');
      pdf.text(client.preferred_name, pageWidth / 2, margin + 20, { align: 'center' });

      // Bio if present
      if (client.short_bio) {
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'normal');
        const bioLines = pdf.splitTextToSize(client.short_bio, contentWidth);
        pdf.text(bioLines, pageWidth / 2, margin + 35, { align: 'center' });
      }

      // QR Code
      const qrCanvas = document.createElement('canvas');
      const qrSize = 200;
      qrCanvas.width = qrSize;
      qrCanvas.height = qrSize;
      
      // Get QR code SVG and convert to canvas
      const svgElement = posterRef.current?.querySelector('svg');
      if (svgElement) {
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
        const qrPdfSize = 80;
        pdf.addImage(
          qrDataUrl,
          'PNG',
          (pageWidth - qrPdfSize) / 2,
          pageHeight / 2 - qrPdfSize / 2,
          qrPdfSize,
          qrPdfSize
        );
      }

      // Instructions
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Scan to access client record', pageWidth / 2, pageHeight / 2 + 55, {
        align: 'center',
      });

      // URL
      pdf.setFontSize(10);
      pdf.setTextColor(100);
      pdf.text(qrUrl, pageWidth / 2, pageHeight / 2 + 65, { align: 'center' });

      // Footer
      pdf.setFontSize(8);
      pdf.setTextColor(150);
      pdf.text(
        `Generated: ${new Date().toLocaleDateString()} | Staff use only`,
        pageWidth / 2,
        pageHeight - margin,
        { align: 'center' }
      );

      pdf.save(`poster-${client.preferred_name.replace(/\s+/g, '-').toLowerCase()}.pdf`);
      toast.success('Poster downloaded successfully');
    } catch (err) {
      console.error('Error generating PDF:', err);
      toast.error('Failed to generate PDF');
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Please allow popups to print');
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Poster - ${client.preferred_name}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: system-ui, sans-serif;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              padding: 40px;
            }
            .name { font-size: 48px; font-weight: bold; margin-bottom: 16px; }
            .bio { font-size: 18px; color: #666; margin-bottom: 40px; text-align: center; max-width: 400px; }
            .qr { margin-bottom: 24px; }
            .instruction { font-size: 14px; color: #666; margin-bottom: 8px; }
            .url { font-size: 12px; color: #999; }
            .footer { position: fixed; bottom: 20px; font-size: 10px; color: #ccc; }
          </style>
        </head>
        <body>
          <div class="name">${client.preferred_name}</div>
          ${client.short_bio ? `<div class="bio">${client.short_bio}</div>` : ''}
          <div class="qr">${posterRef.current?.querySelector('svg')?.outerHTML || ''}</div>
          <div class="instruction">Scan to access client record</div>
          <div class="url">${qrUrl}</div>
          <div class="footer">Generated: ${new Date().toLocaleDateString()} | Staff use only</div>
          <script>window.onload = () => { window.print(); }</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Client Poster Preview</DialogTitle>
        </DialogHeader>

        <div
          ref={posterRef}
          className="bg-card border border-border rounded-lg p-8 text-center space-y-6"
        >
          <div>
            <h2 className="text-3xl font-bold text-foreground">{client.preferred_name}</h2>
            {client.short_bio && (
              <p className="text-muted-foreground mt-2">{client.short_bio}</p>
            )}
          </div>

          <div className="flex justify-center py-4">
            <div className="bg-white p-4 rounded-lg">
              <QRCodeSVG value={qrUrl} size={180} level="H" />
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Scan to access client record</p>
            <p className="text-xs text-muted-foreground/70 font-mono break-all">{qrUrl}</p>
          </div>

          <p className="text-xs text-muted-foreground/50">
            Generated: {new Date().toLocaleDateString()} | Staff use only
          </p>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          <Button onClick={handleDownloadPDF}>
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
