'use client';

import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { clearBrowserCacheAndReload } from '@/lib/cache-utils';
import { cn } from '@/lib/utils';

interface ClearCacheButtonProps {
  variant?: 'icon' | 'button' | 'subtle';
  className?: string;
  label?: string;
}

export function ClearCacheButton({
  variant = 'icon',
  className,
  label = 'Clear Cache',
}: ClearCacheButtonProps) {
  const [clearing, setClearing] = useState(false);

  const handleClearCache = async () => {
    try {
      setClearing(true);
      toast.loading('کیشے صاف کیا جا رہا ہے... (Purging browser cache...)', {
        id: 'cache-purge-toast',
      });

      await clearBrowserCacheAndReload({ hardRedirect: true });
    } catch (err) {
      console.error('Failed to clear cache:', err);
      toast.error('کیشے صاف کرنے میں مسئلہ پیش آیا (Failed to purge cache)', {
        id: 'cache-purge-toast',
      });
      setClearing(false);
    }
  };

  if (variant === 'icon') {
    return (
      <Tooltip>
        <TooltipTrigger
          type="button"
          disabled={clearing}
          onClick={handleClearCache}
          className={cn(
            'inline-flex items-center justify-center h-8 w-8 rounded-md text-gray-500 hover:text-rose-600 hover:bg-rose-50 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-rose-500',
            clearing && 'text-rose-600 opacity-70 cursor-not-allowed',
            className
          )}
          title="Clear Cache & Reload (کیشے صاف کریں)"
        >
          <RefreshCw className={cn('h-4 w-4', clearing && 'animate-spin')} />
          <span className="sr-only">Clear Cache & Reload</span>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p className="font-medium text-xs">Clear Cache & Fetch Updates</p>
          <p className="text-[10px] text-gray-400">کیشے صاف کریں اور تازہ ترین ڈیٹا حاصل کریں</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  if (variant === 'subtle') {
    return (
      <button
        type="button"
        disabled={clearing}
        onClick={handleClearCache}
        className={cn(
          'inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-rose-400 transition-colors focus:outline-none cursor-pointer',
          clearing && 'opacity-60 cursor-not-allowed',
          className
        )}
      >
        <RefreshCw className={cn('h-3 w-3', clearing && 'animate-spin text-rose-400')} />
        <span>{clearing ? 'Clearing cache...' : 'Clear Cache (بروز ریفریش)'}</span>
      </button>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={clearing}
      onClick={handleClearCache}
      className={cn(
        'gap-2 text-xs font-medium border-rose-200 text-rose-700 hover:bg-rose-50 hover:text-rose-800 transition-all',
        className
      )}
    >
      <RefreshCw className={cn('h-3.5 w-3.5', clearing && 'animate-spin')} />
      <span>{clearing ? 'Clearing Cache...' : label}</span>
    </Button>
  );
}
