/**
 * ModuleDisclaimer - Standardized clinical disclaimer for all modules
 */

import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';

interface ModuleDisclaimerProps {
  message: string;
}

export function ModuleDisclaimer({ message }: ModuleDisclaimerProps) {
  return (
    <Card className="border-amber-200 bg-amber-50/50">
      <CardContent className="py-4">
        <div className="flex gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800">
            <strong>Important:</strong> {message}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
