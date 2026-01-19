/**
 * Client Poster Page
 * Printable page with client profile summary and QR code for data logging
 */

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { supabase } from '@/integrations/supabase/client';
import { clientTokenService } from '@/services/clientToken';
import { Button } from '@/components/ui/button';
import { Printer, Download, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import jsPDF from 'jspdf';

interface ClientData {
  id: string;
  preferred_name: string;
  short_bio: string | null;
  photo_url: string | null;
  status: string;
}

export default function ClientPosterPage() {
  const { clientId } = useParams<{ clientId: string }>();
  const [client, setClient] = useState<ClientData | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const posterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchClient() {
      if (!clientId) {
        setError('Client ID not provided');
        setLoading(false);
        return;
      }

      try {
        const { data, error: fetchError } = await supabase
          .from('clients')
          .select('id, preferred_name, short_bio, photo_url, status')
          .eq('id', clientId)
          .single();

        if (fetchError) throw fetchError;
        if (!data) throw new Error('Client not found');

        setClient(data);

        // Generate a new token for the poster
        const newToken = clientTokenService.generateSecureToken();
        setToken(newToken);
      } catch (err) {
        console.error('Error fetching client:', err);
        setError('Unable to load client details');
      } finally {
        setLoading(false);
      }
    }

    fetchClient();
  }, [clientId]);

  const qrUrl = token ? clientTokenService.generatePosterQrUrl(token) : '';

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    if (!client || !posterRef.current) return;

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

      // Header
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(100);
      pdf.text('IDEAL Health Monitoring', margin, margin);
      pdf.text('Staff Use Only', pageWidth - margin, margin, { align: 'right' });

      // Title
      pdf.setFontSize(32);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(0);
      pdf.text(client.preferred_name, pageWidth / 2, margin + 30, { align: 'center' });

      // Bio if present
      let currentY = margin + 45;
      if (client.short_bio) {
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(80);
        const bioLines = pdf.splitTextToSize(client.short_bio, contentWidth - 20);
        pdf.text(bioLines, pageWidth / 2, currentY, { align: 'center' });
        currentY += bioLines.length * 7 + 10;
      }

      // QR Code section
      const qrY = Math.max(currentY + 20, pageHeight / 2 - 60);
      
      // QR Code background box
      const boxSize = 100;
      pdf.setFillColor(248, 250, 252);
      pdf.setDrawColor(226, 232, 240);
      pdf.roundedRect((pageWidth - boxSize) / 2, qrY - 10, boxSize, boxSize + 30, 4, 4, 'FD');

      // Get QR code SVG and convert to canvas
      const svgElement = posterRef.current?.querySelector('svg');
      if (svgElement) {
        const qrCanvas = document.createElement('canvas');
        const qrSize = 200;
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
        const qrPdfSize = 70;
        pdf.addImage(
          qrDataUrl,
          'PNG',
          (pageWidth - qrPdfSize) / 2,
          qrY,
          qrPdfSize,
          qrPdfSize
        );
      }

      // Scan instruction
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(60);
      pdf.text('Scan to log health data', pageWidth / 2, qrY + 85, { align: 'center' });

      // Instructions section
      const instructionY = qrY + 110;
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(100);
      
      const instructions = [
        '1. Use your phone camera to scan the QR code',
        '2. Enter your verified phone number',
        '3. Enter the SMS verification code',
        '4. Access client record and log data'
      ];
      
      instructions.forEach((instruction, index) => {
        pdf.text(instruction, pageWidth / 2, instructionY + (index * 6), { align: 'center' });
      });

      // Footer
      pdf.setFontSize(8);
      pdf.setTextColor(150);
      pdf.text(
        `Generated: ${new Date().toLocaleDateString()} | Client ID: ${client.id.slice(0, 8)}...`,
        pageWidth / 2,
        pageHeight - margin - 5,
        { align: 'center' }
      );
      pdf.text(
        'This poster is for authorized staff only. Do not share publicly.',
        pageWidth / 2,
        pageHeight - margin,
        { align: 'center' }
      );

      pdf.save(`client-poster-${client.preferred_name.replace(/\s+/g, '-').toLowerCase()}.pdf`);
      toast.success('Poster downloaded successfully');
    } catch (err) {
      console.error('Error generating PDF:', err);
      toast.error('Failed to generate PDF');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading client details...</div>
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
        <p className="text-destructive mb-4">{error || 'Client not found'}</p>
        <Button variant="outline" onClick={() => window.history.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <>
      {/* Print-only styles */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          .print-container { 
            box-shadow: none !important; 
            border: none !important;
            margin: 0 !important;
            padding: 40px !important;
          }
        }
      `}</style>

      {/* Action buttons - hidden when printing */}
      <div className="no-print fixed top-4 left-4 right-4 flex justify-between z-50">
        <Button variant="outline" size="sm" onClick={() => window.history.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          <Button size="sm" onClick={handleDownloadPDF}>
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
        </div>
      </div>

      {/* Poster content */}
      <div className="min-h-screen bg-muted/30 flex items-center justify-center p-8 print:p-0 print:bg-white">
        <div
          ref={posterRef}
          className="print-container bg-card w-full max-w-md rounded-xl shadow-lg border border-border p-8 text-center space-y-8"
        >
          {/* Header */}
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>IDEAL Health Monitoring</span>
            <span>Staff Use Only</span>
          </div>

          {/* Client Info */}
          <div className="space-y-3">
            <h1 className="text-4xl font-bold text-foreground tracking-tight">
              {client.preferred_name}
            </h1>
            {client.short_bio && (
              <p className="text-muted-foreground text-lg leading-relaxed max-w-xs mx-auto">
                {client.short_bio}
              </p>
            )}
          </div>

          {/* QR Code */}
          <div className="flex justify-center py-6">
            <div className="bg-slate-50 border border-slate-200 p-6 rounded-xl">
              <QRCodeSVG 
                value={qrUrl} 
                size={160} 
                level="H"
                includeMargin={false}
              />
              <p className="text-sm font-medium text-slate-700 mt-4">
                Scan to log health data
              </p>
            </div>
          </div>

          {/* Instructions */}
          <div className="space-y-2 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">How to access:</p>
            <ol className="space-y-1 text-left max-w-xs mx-auto">
              <li>1. Scan QR code with your phone camera</li>
              <li>2. Enter your verified phone number</li>
              <li>3. Enter the SMS verification code</li>
              <li>4. Access client record and log data</li>
            </ol>
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-border space-y-1">
            <p className="text-xs text-muted-foreground">
              Generated: {new Date().toLocaleDateString()}
            </p>
            <p className="text-xs text-muted-foreground/70">
              This poster is for authorized staff only
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
