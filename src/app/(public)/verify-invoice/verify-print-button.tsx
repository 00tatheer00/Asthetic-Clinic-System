'use client';

import { Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function VerifyPrintButton() {
  return (
    <Button
      type="button"
      variant="outline"
      onClick={() => window.print()}
      className="inline-flex items-center justify-center rounded-lg border border-stone-300 bg-white hover:bg-stone-50 text-gray-800 text-xs h-9 px-3.5 font-medium transition-all shadow-xs print:hidden"
    >
      <Printer className="h-3.5 w-3.5 mr-1.5 text-stone-600" />
      Print Certificate
    </Button>
  );
}
