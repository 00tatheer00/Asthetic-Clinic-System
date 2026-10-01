'use client';

import { useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { updateAppointmentStatus, deleteAppointment, createStaffAppointment, updateAppointment } from '@/actions/appointments';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
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
  ChevronLeft, ChevronRight, Loader2, Phone, Calendar, Plus, Edit3, Trash2,
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

interface TreatmentOption {
  id: string;
  name: string;
  price: number | null;
  duration_minutes: number | null;
}

interface PatientOption {
  id: string;
  name: string;
  phone: string;
}

interface AppointmentsListProps {
  appointments: Appointment[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  filters: { status: string; date: string; search: string };
  stats: { pending: number; today: number };
  isAdmin: boolean;
  treatments?: TreatmentOption[];
  patients?: PatientOption[];
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
  treatments = [],
  patients = [],
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

  // Create Appointment State
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState({
    patient_id: '',
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    treatment_id: treatments[0]?.id || '',
    scheduled_at: '',
    duration_minutes: 45,
    status: 'confirmed' as AppointmentStatus,
    message: '',
  });

  // Edit Appointment State
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [updating, setUpdating] = useState(false);
  const [editForm, setEditForm] = useState({
    patient_id: '',
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    treatment_id: '',
    scheduled_at: '',
    duration_minutes: 45,
    status: 'confirmed' as AppointmentStatus,
    message: '',
  });

  const handleOpenEdit = (apt: Appointment) => {
    setEditingAppointment(apt);
    let localIso = '';
    try {
      const d = new Date(apt.scheduled_at);
      const pad = (n: number) => String(n).padStart(2, '0');
      localIso = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    } catch {
      localIso = '';
    }

    setEditForm({
      customer_name: apt.customer_name || '',
      customer_phone: apt.customer_phone || '',
      customer_email: apt.customer_email || '',
      treatment_id: apt.treatments?.id || treatments[0]?.id || '',
      patient_id: apt.patients?.id || '',
      scheduled_at: localIso,
      duration_minutes: 45,
      status: apt.status,
      message: apt.message || '',
    });
    setShowEditDialog(true);
  };

  const handleUpdateAppointment = async () => {
    if (!editingAppointment) return;
    if (!editForm.customer_name.trim() || !editForm.customer_phone.trim() || !editForm.treatment_id || !editForm.scheduled_at) {
      toast.error('Please fill in required fields (Name, Phone, Treatment, Date & Time).');
      return;
    }

    setUpdating(true);
    const result = await updateAppointment(editingAppointment.id, {
      customer_name: editForm.customer_name,
      customer_phone: editForm.customer_phone,
      customer_email: editForm.customer_email || null,
      treatment_id: editForm.treatment_id,
      patient_id: editForm.patient_id || null,
      scheduled_at: new Date(editForm.scheduled_at).toISOString(),
      duration_minutes: Number(editForm.duration_minutes) || 45,
      status: editForm.status,
      message: editForm.message || null,
    });
    setUpdating(false);

    if (result.success) {
      toast.success('Appointment updated successfully!');
      setShowEditDialog(false);
      setEditingAppointment(null);
      router.refresh();
    } else {
      toast.error(result.error || 'Failed to update appointment');
    }
  };

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

  const handleCreateAppointment = async () => {
    if (!createForm.customer_name.trim() || !createForm.customer_phone.trim() || !createForm.treatment_id || !createForm.scheduled_at) {
      toast.error('Please fill in required fields (Name, Phone, Treatment, and Date/Time).');
      return;
    }

    setCreating(true);
    const result = await createStaffAppointment({
      customer_name: createForm.customer_name,
      customer_phone: createForm.customer_phone,
      customer_email: createForm.customer_email || undefined,
      treatment_id: createForm.treatment_id,
      patient_id: createForm.patient_id || undefined,
      scheduled_at: new Date(createForm.scheduled_at).toISOString(),
      duration_minutes: Number(createForm.duration_minutes) || 45,
      status: createForm.status,
      message: createForm.message || undefined,
    });
    setCreating(false);

    if (result.success) {
      toast.success('Appointment booked successfully!');
      setShowCreateDialog(false);
      setCreateForm({
        patient_id: '',
        customer_name: '',
        customer_phone: '',
        customer_email: '',
        treatment_id: treatments[0]?.id || '',
        scheduled_at: '',
        duration_minutes: 45,
        status: 'confirmed',
        message: '',
      });
      router.refresh();
    } else {
      toast.error(result.error || 'Failed to book appointment');
    }
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

        {/* Search & Actions */}
        <div className="flex gap-2 items-center flex-1 sm:max-w-md ml-auto">
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
          <Button
            size="sm"
            onClick={() => setShowCreateDialog(true)}
            className="h-8 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold px-3 shrink-0 flex items-center gap-1 shadow-xs"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New Booking</span>
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

      {/* Pending Online Requests Alert Banner */}
      {stats.pending > 0 && filters.status !== 'pending' && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-950 shadow-xs">
          <div className="flex items-center gap-3">
            <span className="relative flex h-3 w-3 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500" />
            </span>
            <div>
              <p className="text-sm font-bold">
                {stats.pending} Online Booking Request{stats.pending > 1 ? 's' : ''} Awaiting Review
              </p>
              <p className="text-xs text-amber-700">
                Patients are waiting for your confirmation. Review and approve or decline their slot.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => updateFilter('status', 'pending')}
            className="bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs rounded-full px-4 py-1.5 h-8 shrink-0 shadow-xs"
          >
            Review Requests ({stats.pending})
          </Button>
        </div>
      )}

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
                      <div className="flex items-center justify-end gap-1.5 flex-wrap">
                        {apt.status === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              disabled={isPending}
                              onClick={() => handleStatusChange(apt.id, 'confirmed')}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-2.5 py-1 h-7 rounded-lg font-semibold flex items-center gap-1 shadow-xs"
                              title="Approve Appointment"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              <span className="hidden sm:inline">Approve</span>
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={isPending}
                              onClick={() => handleStatusChange(apt.id, 'cancelled')}
                              className="border-rose-200 text-rose-700 hover:bg-rose-50 text-xs px-2 py-1 h-7 rounded-lg font-medium flex items-center gap-1"
                              title="Decline Appointment"
                            >
                              <XCircle className="h-3.5 w-3.5" />
                              <span className="hidden sm:inline">Decline</span>
                            </Button>
                          </>
                        )}

                        {/* Always Visible Edit Button */}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenEdit(apt)}
                          className="h-7 px-2 text-xs border-gray-200 hover:border-blue-400 hover:bg-blue-50 text-gray-700 hover:text-blue-700 rounded-lg flex items-center gap-1 shadow-2xs font-medium"
                          title="Edit Appointment Details"
                        >
                          <Edit3 className="h-3.5 w-3.5 text-blue-600" />
                          <span>Edit</span>
                        </Button>

                        {/* Always Visible Delete Button */}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            setConfirmDialog({
                              open: true,
                              appointmentId: apt.id,
                              action: 'delete',
                              title: 'Delete Appointment',
                              description: `Are you sure you want to delete the appointment for ${apt.customer_name}? This action will permanently remove it.`,
                            })
                          }
                          className="h-7 px-2 text-xs border-rose-200 hover:border-rose-400 hover:bg-rose-50 text-rose-600 rounded-lg flex items-center gap-1 shadow-2xs font-medium"
                          title="Delete Appointment"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>Delete</span>
                        </Button>

                        {/* Quick Status Dropdown */}
                        {(apt.status === 'confirmed' || apt.status === 'checked_in') && (
                          <DropdownMenu>
                            <DropdownMenuTrigger className="inline-flex items-center justify-center rounded-lg p-1.5 text-gray-500 hover:text-gray-800 hover:bg-gray-100 border border-gray-200 h-7 w-7 transition-colors">
                              <MoreVertical className="h-3.5 w-3.5" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-44">
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
                                  Mark Completed
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
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

      {/* New Appointment Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Book Clinic Appointment</DialogTitle>
            <DialogDescription>
              Schedule a new appointment for a walk-in, phone, or online patient.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            {/* Existing Patient Quick Pick */}
            {patients.length > 0 && (
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-700">Existing Patient (Optional)</Label>
                <select
                  value={createForm.patient_id}
                  onChange={(e) => {
                    const selId = e.target.value;
                    const pat = patients.find((p) => p.id === selId);
                    if (pat) {
                      setCreateForm({
                        ...createForm,
                        patient_id: pat.id,
                        customer_name: pat.name,
                        customer_phone: pat.phone,
                      });
                    } else {
                      setCreateForm({ ...createForm, patient_id: '' });
                    }
                  }}
                  className="w-full text-xs rounded-lg border border-gray-200 bg-white px-3 py-2"
                >
                  <option value="">-- Choose Existing Patient or enter custom name below --</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.phone})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-700">Patient Name *</Label>
                <Input
                  placeholder="e.g. Fatima Khan"
                  value={createForm.customer_name}
                  onChange={(e) => setCreateForm({ ...createForm, customer_name: e.target.value })}
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-700">Phone Number *</Label>
                <Input
                  placeholder="03001234567"
                  value={createForm.customer_phone}
                  onChange={(e) => setCreateForm({ ...createForm, customer_phone: e.target.value })}
                  className="h-8 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-700">Email Address (Optional)</Label>
              <Input
                type="email"
                placeholder="patient@example.com"
                value={createForm.customer_email}
                onChange={(e) => setCreateForm({ ...createForm, customer_email: e.target.value })}
                className="h-8 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-700">Treatment / Service *</Label>
              <select
                value={createForm.treatment_id}
                onChange={(e) => {
                  const t = treatments.find((item) => item.id === e.target.value);
                  setCreateForm({
                    ...createForm,
                    treatment_id: e.target.value,
                    duration_minutes: t?.duration_minutes || 45,
                  });
                }}
                className="w-full text-xs rounded-lg border border-gray-200 bg-white px-3 py-2"
              >
                <option value="">Select Treatment</option>
                {treatments.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} {t.price ? `(PKR ${t.price.toLocaleString()})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-700">Date & Time *</Label>
                <Input
                  type="datetime-local"
                  value={createForm.scheduled_at}
                  onChange={(e) => setCreateForm({ ...createForm, scheduled_at: e.target.value })}
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-700">Initial Status</Label>
                <select
                  value={createForm.status}
                  onChange={(e) => setCreateForm({ ...createForm, status: e.target.value as AppointmentStatus })}
                  className="w-full text-xs rounded-lg border border-gray-200 bg-white px-3 py-2"
                >
                  <option value="confirmed">Confirmed (Default)</option>
                  <option value="pending">Pending Review</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-700">Staff Notes / Medical Concern</Label>
              <Input
                placeholder="e.g. Skin rejuvenation, first session"
                value={createForm.message}
                onChange={(e) => setCreateForm({ ...createForm, message: e.target.value })}
                className="h-8 text-xs"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCreateDialog(false)}
                className="h-8 text-xs"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleCreateAppointment}
                disabled={creating || !createForm.customer_name || !createForm.customer_phone || !createForm.treatment_id || !createForm.scheduled_at}
                className="h-8 text-xs bg-rose-600 hover:bg-rose-700 text-white font-medium"
              >
                {creating ? (
                  <>
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    Booking...
                  </>
                ) : (
                  'Confirm Booking'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Appointment Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-gray-900">
              <Edit3 className="h-4 w-4 text-rose-600" />
              Edit Appointment
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-500">
              Update booking details, treatment procedure, date/time, and status.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-700">Patient Name *</Label>
                <Input
                  placeholder="Full Name"
                  value={editForm.customer_name}
                  onChange={(e) => setEditForm({ ...editForm, customer_name: e.target.value })}
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-700">Phone Number *</Label>
                <Input
                  placeholder="03001234567"
                  value={editForm.customer_phone}
                  onChange={(e) => setEditForm({ ...editForm, customer_phone: e.target.value })}
                  className="h-8 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-700">Email Address (Optional)</Label>
              <Input
                type="email"
                placeholder="patient@example.com"
                value={editForm.customer_email}
                onChange={(e) => setEditForm({ ...editForm, customer_email: e.target.value })}
                className="h-8 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-700">Treatment / Procedure *</Label>
              <select
                value={editForm.treatment_id}
                onChange={(e) => {
                  const t = treatments.find((item) => item.id === e.target.value);
                  setEditForm({
                    ...editForm,
                    treatment_id: e.target.value,
                    duration_minutes: t?.duration_minutes || 45,
                  });
                }}
                className="w-full text-xs rounded-lg border border-gray-200 bg-white px-3 py-2 text-gray-800"
              >
                <option value="">Select Treatment</option>
                {treatments.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} {t.price ? `(PKR ${t.price.toLocaleString()})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-700">Date & Time *</Label>
                <Input
                  type="datetime-local"
                  value={editForm.scheduled_at}
                  onChange={(e) => setEditForm({ ...editForm, scheduled_at: e.target.value })}
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-700">Status</Label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value as AppointmentStatus })}
                  className="w-full text-xs rounded-lg border border-gray-200 bg-white px-3 py-2 text-gray-800"
                >
                  <option value="pending">Pending Review</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="checked_in">Checked In</option>
                  <option value="completed">Completed</option>
                  <option value="no_show">No Show</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-700">Duration (Minutes)</Label>
              <Input
                type="number"
                min={15}
                step={15}
                value={editForm.duration_minutes}
                onChange={(e) => setEditForm({ ...editForm, duration_minutes: Number(e.target.value) || 45 })}
                className="h-8 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-700">Patient Notes / Concern</Label>
              <Input
                placeholder="e.g. Follow-up consultation or specific instructions"
                value={editForm.message}
                onChange={(e) => setEditForm({ ...editForm, message: e.target.value })}
                className="h-8 text-xs"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowEditDialog(false)}
                className="h-8 text-xs"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleUpdateAppointment}
                disabled={updating || !editForm.customer_name || !editForm.customer_phone || !editForm.treatment_id || !editForm.scheduled_at}
                className="h-8 text-xs bg-rose-600 hover:bg-rose-700 text-white font-medium"
              >
                {updating ? (
                  <>
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
