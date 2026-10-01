import { Loader2 } from 'lucide-react';

export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Top Banner Skeleton */}
      <div className="h-20 bg-white rounded-3xl border border-gray-100 flex items-center justify-between p-6">
        <div className="space-y-2">
          <div className="h-5 w-48 bg-gray-200 rounded-lg" />
          <div className="h-3 w-64 bg-gray-100 rounded-md" />
        </div>
        <div className="h-10 w-72 bg-gray-100 rounded-xl hidden sm:block" />
      </div>

      {/* KPI Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
            <div className="h-3 w-28 bg-gray-200 rounded" />
            <div className="h-7 w-20 bg-gray-300 rounded-md" />
            <div className="h-3 w-36 bg-gray-100 rounded" />
          </div>
        ))}
      </div>

      {/* Main Content Area Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 h-96 bg-white rounded-3xl border border-gray-100 p-6 space-y-4">
          <div className="h-6 w-52 bg-gray-200 rounded-lg" />
          <div className="space-y-3 pt-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-14 bg-gray-50 rounded-xl" />
            ))}
          </div>
        </div>
        <div className="lg:col-span-4 h-96 bg-white rounded-3xl border border-gray-100 p-6 space-y-4">
          <div className="h-6 w-36 bg-gray-200 rounded-lg" />
          <div className="grid grid-cols-2 gap-3 pt-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-20 bg-gray-50 rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
