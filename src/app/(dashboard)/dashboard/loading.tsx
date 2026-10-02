import { Loader2 } from 'lucide-react';

export default function DashboardLoading() {
  return (
    <div className="flex items-center justify-center min-h-[40vh]">
      <div className="flex flex-col items-center gap-3 text-gray-400">
        <Loader2 className="h-8 w-8 animate-spin text-rose-500" />
        <p className="text-xs font-medium">Loading...</p>
      </div>
    </div>
  );
}
