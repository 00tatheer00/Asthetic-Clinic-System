'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { moderateReview, deleteReview } from '@/actions/content';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Star,
  CheckCircle2,
  XCircle,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  MessageSquare,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import { formatDate } from '@/lib/utils/helpers';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Review {
  id: string;
  reviewer_name: string;
  rating: number;
  review_text: string;
  treatment_id: string | null;
  status: 'pending' | 'approved' | 'rejected';
  rejection_reason: string | null;
  moderated_at: string | null;
  created_at: string;
  treatments?: {
    id: string;
    name: string;
  } | null;
}

interface ReviewsListProps {
  reviews: Review[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  statusFilter: string;
  isAdmin: boolean;
}

export function ReviewsList({
  reviews,
  totalCount,
  currentPage,
  pageSize,
  statusFilter,
  isAdmin,
}: ReviewsListProps) {
  const router = useRouter();
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const totalPages = Math.ceil(totalCount / pageSize);

  const handleStatusChange = (status: string) => {
    const params = new URLSearchParams();
    if (status !== 'all') params.set('status', status);
    params.set('page', '1');
    router.push(`/dashboard/reviews?${params.toString()}`);
  };

  const handleApprove = async (review: Review) => {
    setLoadingId(review.id);
    try {
      const res = await moderateReview(review.id, 'approve');
      if (res.success) {
        toast.success(`Review by ${review.reviewer_name} approved!`);
        router.refresh();
      } else {
        toast.error(res.error || 'Failed to approve review.');
      }
    } catch {
      toast.error('An error occurred.');
    } finally {
      setLoadingId(null);
    }
  };

  const handleConfirmReject = async () => {
    if (!selectedReview) return;
    setLoadingId(selectedReview.id);
    try {
      const res = await moderateReview(selectedReview.id, 'reject', rejectReason);
      if (res.success) {
        toast.success(`Review rejected.`);
        setRejectDialogOpen(false);
        setSelectedReview(null);
        setRejectReason('');
        router.refresh();
      } else {
        toast.error(res.error || 'Failed to reject review.');
      }
    } catch {
      toast.error('An error occurred.');
    } finally {
      setLoadingId(null);
    }
  };

  const handleDelete = async (review: Review) => {
    if (!confirm(`Are you sure you want to permanently delete the review from ${review.reviewer_name}?`)) {
      return;
    }
    setLoadingId(review.id);
    try {
      const res = await deleteReview(review.id);
      if (res.success) {
        toast.success('Review deleted.');
        router.refresh();
      } else {
        toast.error(res.error || 'Failed to delete review.');
      }
    } catch {
      toast.error('An error occurred.');
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Review Moderation</h1>
        <p className="text-sm text-gray-500">
          Approve or reject customer feedback before it appears on the public website.
        </p>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto pb-2 border-b border-gray-100">
        {[
          { label: 'All Reviews', value: 'all' },
          { label: 'Pending Review', value: 'pending' },
          { label: 'Approved', value: 'approved' },
          { label: 'Rejected', value: 'rejected' },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => handleStatusChange(tab.value)}
            className={cn(
              'px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all',
              statusFilter === tab.value
                ? 'bg-rose-500 text-white shadow-sm'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Reviews List */}
      {reviews.length === 0 ? (
        <Card className="border-dashed border-gray-200 text-center py-12">
          <CardContent>
            <MessageSquare className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-gray-800">No reviews found</h3>
            <p className="text-xs text-gray-400 mt-1">
              There are currently no reviews in the &quot;{statusFilter}&quot; queue.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {reviews.map((rev) => {
            const isLoading = loadingId === rev.id;

            return (
              <Card
                key={rev.id}
                className={cn(
                  'border transition-all',
                  rev.status === 'pending'
                    ? 'border-amber-200 bg-amber-50/20'
                    : 'border-gray-200 bg-white'
                )}
              >
                <CardContent className="p-5">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm text-gray-900">{rev.reviewer_name}</span>
                        {rev.treatments && (
                          <Badge variant="outline" className="text-[10px] text-gray-600 border-gray-200">
                            {rev.treatments.name}
                          </Badge>
                        )}
                        <Badge
                          variant="secondary"
                          className={cn(
                            'text-[10px] font-semibold uppercase tracking-wider',
                            rev.status === 'approved' && 'bg-green-100 text-green-700',
                            rev.status === 'pending' && 'bg-amber-100 text-amber-700',
                            rev.status === 'rejected' && 'bg-red-100 text-red-700'
                          )}
                        >
                          {rev.status}
                        </Badge>
                        <span className="text-xs text-gray-400">
                          {formatDate(rev.created_at)}
                        </span>
                      </div>

                      {/* Stars */}
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={cn(
                              'h-4 w-4',
                              star <= rev.rating
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-gray-200'
                            )}
                          />
                        ))}
                      </div>

                      {/* Review Text */}
                      <p className="text-sm text-gray-700 mt-2 leading-relaxed whitespace-pre-line">
                        &quot;{rev.review_text}&quot;
                      </p>

                      {/* Rejection Note if rejected */}
                      {rev.status === 'rejected' && rev.rejection_reason && (
                        <div className="mt-2 text-xs text-red-600 flex items-center gap-1.5 bg-red-50 p-2 rounded-md border border-red-100">
                          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                          <span>Rejection note: {rev.rejection_reason}</span>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 self-end sm:self-start">
                      {rev.status !== 'approved' && (
                        <Button
                          size="sm"
                          disabled={isLoading}
                          onClick={() => handleApprove(rev)}
                          className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                          {isLoading ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                          ) : (
                            <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                          )}
                          Approve
                        </Button>
                      )}

                      {rev.status !== 'rejected' && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={isLoading}
                          onClick={() => {
                            setSelectedReview(rev);
                            setRejectDialogOpen(true);
                          }}
                          className="h-8 text-xs text-amber-700 border-amber-300 hover:bg-amber-50"
                        >
                          <XCircle className="h-3.5 w-3.5 mr-1" />
                          Reject
                        </Button>
                      )}

                      {isAdmin && (
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={isLoading}
                          onClick={() => handleDelete(rev)}
                          className="h-8 text-xs text-gray-400 hover:text-red-600 hover:bg-red-50"
                          title="Delete review"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-gray-500">
            Page {currentPage} of {totalPages} ({totalCount} total)
          </p>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => {
                const p = new URLSearchParams();
                if (statusFilter !== 'all') p.set('status', statusFilter);
                p.set('page', String(currentPage - 1));
                router.push(`/dashboard/reviews?${p.toString()}`);
              }}
              className="h-8"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages}
              onClick={() => {
                const p = new URLSearchParams();
                if (statusFilter !== 'all') p.set('status', statusFilter);
                p.set('page', String(currentPage + 1));
                router.push(`/dashboard/reviews?${p.toString()}`);
              }}
              className="h-8"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold">Reject Review</DialogTitle>
            <DialogDescription className="text-xs">
              Provide an optional internal reason for rejecting this review.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <label className="text-xs font-medium text-gray-700">Internal Reason</label>
            <Input
              placeholder="e.g. Inappropriate language, spam, competitor post"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="text-xs"
            />
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setRejectDialogOpen(false);
                setRejectReason('');
                setSelectedReview(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleConfirmReject}
              disabled={loadingId !== null}
            >
              Confirm Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
