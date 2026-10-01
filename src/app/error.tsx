'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { clearBrowserCacheAndReload } from '@/lib/cache-utils';

export default function RootErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[Root Error Boundary Caught]:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl border border-gray-200 shadow-lg p-6 sm:p-8 text-center space-y-5">
        <div className="mx-auto w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center text-rose-600">
          <AlertCircle className="w-6 h-6" />
        </div>

        <div className="space-y-2">
          <h2 className="text-lg font-bold text-gray-900 font-serif">
            Application Error
          </h2>
          <p className="text-xs sm:text-sm text-gray-500">
            An unexpected error occurred while loading this page.
          </p>
          {error?.message && (
            <div className="mt-2 p-2.5 rounded-lg bg-gray-50 border border-gray-100 text-left font-mono text-[11px] text-gray-600 break-words">
              {error.message}
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
          <Button
            onClick={() => reset()}
            className="flex-1 bg-gray-900 hover:bg-gray-800 text-white text-xs h-9"
          >
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
            Try Again
          </Button>
          <Button
            variant="outline"
            onClick={() => clearBrowserCacheAndReload({ hardRedirect: true })}
            className="flex-1 border-rose-200 text-rose-700 hover:bg-rose-50 text-xs h-9"
          >
            Purge Cache &amp; Reload
          </Button>
        </div>
      </div>
    </div>
  );
}
