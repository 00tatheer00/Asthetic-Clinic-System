'use client';

import { useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { updateAppointmentStatus, deleteAppointment } from '@/actions/appointments';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Search, MoreVertical, CheckCircle2, XCircle, Clock, UserCheck,
  ChevronLeft, ChevronRight, Loader2, Phone, Calendar,
} from 'lucide-react';
import { formatDateTime, formatPhone } from '@/lib/utils/helpers';
import { APPOINTMENT_STATUS_LABELS, APPOINTMENT_STATUS_COLORS } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { AppointmentStatus } from '@/lib/types';

interface Appointment {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  scheduled_at: string;
  status: AppointmentStatus;
  message: string | null;
  treatments: { id: string; name: string } | null;
  patients: { id: string; name: string; phone: string } | null;
}

interface AppointmentsListProps {
  appointments: Appointment[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  filters: { status: string; date: string; search: string };
  stats: { pending: number; today: number };
  isAdmin: boolean;
}

const STATUS_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'checked_in', label: 'Checked In' },
  { value: 'completed', label: 'Completed' },
  { value: 'no_show', label: 'No Show' },
  { value: 'cancelled', label: 'Cancelled' },
];

const DATE_FILTERS = [
  { value: 'today', label: 'Today' },
  { value: 'tomorrow', label: 'Tomorrow' },
  { value: 'week', label: 'This Week' },
  { value: 'all', label: 'All Time' },
  { value: 'past', label: 'Past' },
];

export function AppointmentsList({
  appointments,
  totalCount,
  currentPage,
  pageSize,
  filters,
  stats,
  isAdmin,
}: AppointmentsListProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [searchValue, setSearchValue] = useState(filters.search);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    appointmentId: string;
    action: string;
    title: string;
    description: string;
  }>({ open: false, appointmentId: '', action: '', title: '', description: '' });

  const totalPages = Math.ceil(totalCount / pageSize);

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams();
    if (key === 'status') params.set('status', value);
    else params.set('status', filters.status);

    if (key === 'date') params.set('date', value);
    else params.set('date', filters.date);

    if (key === 'search') params.set('search', value);
    else if (filters.search) params.set('search', filters.search);

    params.set('page', '1');
    router.push(`/dashboard/appointments?${params.toString()}`);
  };

  const handleSearch = () => {
    updateFilter('search', searchValue);
  };

  const handleStatusChange = async (appointmentId: string, newStatus: AppointmentStatus) => {
    startTransition(async () => {
      const result = await updateAppointmentStatus(appointmentId, newStatus);
      if (result.success) {
        toast.success(`Appointment ${APPOINTMENT_STATUS_LABELS[newStatus] || newStatus}`);
      } else {
        toast.error(result.error || 'Failed to update');
      }
    });
  };

  const handleDelete = async (appointmentId: string) => {
    startTransition(async () => {
      const result = await deleteAppointment(appointmentId);
      if (result.success) {
        toast.success('Appointment deleted');
      } else {
        toast.error(result.error || 'Failed to delete');
      }
    });
    setConfirmDialog({ ...confirmDialog, open: false });
  };

  return (
    <div className="space-y-4">
      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="border-0 shadow-sm">
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-gray-500">Today</p>
            <p className="text-2xl font-bold text-gray-900">{stats.today}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-gray-500">Pending Review</p>
            <p className="text-2xl font-bold text-amber-600">{stats.pending}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-gray-500">Showing</p>
            <p className="text-2xl font-bold text-gray-900">{totalCount}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-gray-500">Page</p>
            <p className="text-2xl font-bold text-gray-900">{currentPage}/{totalPages || 1}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Date Filter */}
        <div className="flex gap-1 flex-wrap">
          {DATE_FILTERS.map((f) => (
            <Button
              key={f.value}
              variant={filters.date === f.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => updateFilter('date', f.value)}
              className={cn(
                'rounded-full text-xs h-8',
                filters.date === f.value && 'bg-gray-900 text-white'
              )}
            >
              {f.label}
            </Button>
          ))}
        </div>

        {/* Search */}
        <div className="flex gap-2 flex-1 sm:max-w-xs ml-auto">
          <Input
            placeholder="Search name or phone..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="h-8 text-xs"
          />
          <Button size="sm" variant="outline" onClick={handleSearch} className="h-8 px-2">
            <Search className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {STATUS_FILTERS.map((f) => (
          <Button
            key={f.value}
            variant="ghost"
            size="sm"
            onClick={() => updateFilter('status', f.value)}
            className={cn(
              'rounded-lg text-xs h-7 px-3 shrink-0',
              filters.status === f.value && 'bg-gray-100 text-gray-900 font-semibold'
            )}
          >
            {f.label}
          </Button>
        ))}
      </div>

      {/* Table */}
      {isPending && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
        </div>
      )}

      {!isPending && appointments.length === 0 && (
        <Card className="border-0 shadow-sm">
          <CardContent className="py-12 text-center">
            <Calendar className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">No appointments found.</p>
            <p className="text-xs text-gray-400 mt-1">Try adjusting your filters.</p>
          </CardContent>
        </Card>
      )}

      {!isPending && appointments.length > 0 && (
        <Card className="border-0 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/50">
                  <TableHead className="text-xs font-semibold">Patient</TableHead>
                  <TableHead className="text-xs font-semibold">Treatment</TableHead>
                  <TableHead className="text-xs font-semibold">Date & Time</TableHead>
                  <TableHead className="text-xs font-semibold">Status</TableHead>
                  <TableHead className="text-xs font-semibold text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {appointments.map((apt) => (
                  <TableRow key={apt.id} className="group">
                    <TableCell>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{apt.customer_name}</p>
                        <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                          <Phone className="h-3 w-3" />
                          {formatPhone(apt.customer_phone)}
                        </p>
                        {apt.patients && (
                          <span className="inline-flex mt-1 text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded-full">
                            Linked: {apt.patients.name}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-700">
                        {apt.treatments?.name || '—'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-700">
                        {formatDateTime(apt.scheduled_at)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={cn(
                          'text-[10px] font-medium px-2 py-0.5 rounded-full border-0',
                          APPOINTMENT_STATUS_COLORS[apt.status] || 'bg-gray-100 text-gray-700'
                        )}
                      >
                        {APPOINTMENT_STATUS_LABELS[apt.status] || apt.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger className="inline-flex items-center justify-center rounded-md p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreVertical className="h-4 w-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          {/* Contextual status actions */}
                          {apt.status === 'pending' && (
                            <>
                              <DropdownMenuItem onClick={() => handleStatusChange(apt.id, 'confirmed')}>
                                <CheckCircle2 className="mr-2 h-4 w-4 text-green-600" />
                                Confirm
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleStatusChange(apt.id, 'cancelled')}>
                                <XCircle className="mr-2 h-4 w-4 text-red-500" />
                                Cancel
                              </DropdownMenuItem>
                            </>
                          )}
                          {apt.status === 'confirmed' && (
                            <>
                              <DropdownMenuItem onClick={() => handleStatusChange(apt.id, 'checked_in')}>
                                <UserCheck className="mr-2 h-4 w-4 text-indigo-600" />
                                Check In
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleStatusChange(apt.id, 'no_show')}>
                                <Clock className="mr-2 h-4 w-4 text-amber-500" />
                                No Show
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleStatusChange(apt.id, 'cancelled')}>
                                <XCircle className="mr-2 h-4 w-4 text-red-500" />
                                Cancel
                              </DropdownMenuItem>
                            </>
                          )}
                          {apt.status === 'checked_in' && (
                            <DropdownMenuItem onClick={() => handleStatusChange(apt.id, 'completed')}>
                              <CheckCircle2 className="mr-2 h-4 w-4 text-green-600" />
                              Complete
                            </DropdownMenuItem>
                          )}

                          {isAdmin && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                variant="destructive"
                                onClick={() =>
                                  setConfirmDialog({
                                    open: true,
                                    appointmentId: apt.id,
                                    action: 'delete',
                                    title: 'Delete Appointment',
                                    description: `Are you sure you want to delete the appointment for ${apt.customer_name}? This action cannot be undone.`,
                                  })
                                }
                              >
                                Delete
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-500">
            Showing {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, totalCount)} of {totalCount}
          </p>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => {
                const params = new URLSearchParams();
                params.set('status', filters.status);
                params.set('date', filters.date);
                if (filters.search) params.set('search', filters.search);
                params.set('page', String(currentPage - 1));
                router.push(`/dashboard/appointments?${params.toString()}`);
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
                const params = new URLSearchParams();
                params.set('status', filters.status);
                params.set('date', filters.date);
                if (filters.search) params.set('search', filters.search);
                params.set('page', String(currentPage + 1));
                router.push(`/dashboard/appointments?${params.toString()}`);
              }}
              className="h-8"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmDialog.title}</AlertDialogTitle>
            <AlertDialogDescription>{confirmDialog.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleDelete(confirmDialog.appointmentId)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
