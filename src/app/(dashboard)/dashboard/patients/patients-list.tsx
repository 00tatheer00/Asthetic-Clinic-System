'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createPatient, updatePatient, deletePatient } from '@/actions/patients';
import { Button } from '@/components/ui/button';
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
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Search, Plus, Users, ChevronLeft, ChevronRight, Loader2, Phone, Edit3, Trash2 } from 'lucide-react';
import { formatPhone, formatDate } from '@/lib/utils/helpers';
import { toast } from 'sonner';

interface Patient {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  gender: string | null;
  date_of_birth: string | null;
  created_at: string;
}

interface PatientsListProps {
  patients: Patient[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  search: string;
  isAdmin: boolean;
}

export function PatientsList({
  patients, totalCount, currentPage, pageSize, search, isAdmin,
}: PatientsListProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [searchValue, setSearchValue] = useState(search);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [newForm, setNewForm] = useState({ name: '', phone: '', email: '', gender: '', date_of_birth: '', address: '', notes: '' });
  const [creating, setCreating] = useState(false);

  const totalPages = Math.ceil(totalCount / pageSize);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchValue) params.set('search', searchValue);
    params.set('page', '1');
    router.push(`/dashboard/patients?${params.toString()}`);
  };

  const handleCreate = async () => {
    setCreating(true);
    const result = await createPatient(newForm);
    setCreating(false);

    if (result.success) {
      toast.success('Patient created');
      setShowNewDialog(false);
      setNewForm({ name: '', phone: '', email: '', gender: '', date_of_birth: '', address: '', notes: '' });
      router.refresh();
    } else {
      toast.error(result.error || 'Failed to create');
    }
  };

  // Edit Patient State
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    phone: '',
    email: '',
    gender: '',
    date_of_birth: '',
    address: '',
    notes: '',
  });
  const [updating, setUpdating] = useState(false);

  // Delete Patient State
  const [deleteTarget, setDeleteTarget] = useState<Patient | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleOpenEdit = (e: React.MouseEvent, patient: Patient) => {
    e.stopPropagation();
    setEditingPatient(patient);
    setEditForm({
      name: patient.name || '',
      phone: patient.phone || '',
      email: patient.email || '',
      gender: patient.gender || '',
      date_of_birth: patient.date_of_birth ? patient.date_of_birth.split('T')[0] : '',
      address: '',
      notes: '',
    });
    setShowEditDialog(true);
  };

  const handleUpdate = async () => {
    if (!editingPatient) return;
    if (!editForm.name.trim() || !editForm.phone.trim()) {
      toast.error('Name and phone are required.');
      return;
    }

    setUpdating(true);
    const result = await updatePatient(editingPatient.id, {
      name: editForm.name.trim(),
      phone: editForm.phone.trim(),
      email: editForm.email?.trim() || undefined,
      gender: (editForm.gender as any) || undefined,
      date_of_birth: editForm.date_of_birth || undefined,
      address: editForm.address?.trim() || undefined,
      notes: editForm.notes?.trim() || undefined,
    });
    setUpdating(false);

    if (result.success) {
      toast.success('Patient record updated');
      setShowEditDialog(false);
      setEditingPatient(null);
      router.refresh();
    } else {
      toast.error(result.error || 'Failed to update patient');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const result = await deletePatient(deleteTarget.id);
    setDeleting(false);

    if (result.success) {
      toast.success(`Patient "${deleteTarget.name}" deleted`);
      setDeleteTarget(null);
      router.refresh();
    } else {
      toast.error(result.error || 'Failed to delete patient');
    }
  };

  return (
    <div className="space-y-4">
      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex gap-2 flex-1 sm:max-w-sm">
          <Input
            placeholder="Search by name, phone, or email..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="h-9 text-sm"
          />
          <Button size="sm" variant="outline" onClick={handleSearch} className="h-9 px-3">
            <Search className="h-4 w-4" />
          </Button>
        </div>
        <Button
          size="sm"
          onClick={() => setShowNewDialog(true)}
          className="ml-auto bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white rounded-lg h-9"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          New Patient
        </Button>
      </div>

      {/* Table */}
      {patients.length === 0 && (
        <Card className="border border-gray-200 shadow-xs">
          <CardContent className="py-12 text-center">
            <Users className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">No patients found.</p>
          </CardContent>
        </Card>
      )}

      {patients.length > 0 && (
        <Card className="border border-gray-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/50">
                  <TableHead className="text-xs font-semibold">Name</TableHead>
                  <TableHead className="text-xs font-semibold">Phone</TableHead>
                  <TableHead className="text-xs font-semibold">Email</TableHead>
                  <TableHead className="text-xs font-semibold">Gender</TableHead>
                  <TableHead className="text-xs font-semibold">DOB</TableHead>
                  <TableHead className="text-xs font-semibold">Registered</TableHead>
                  <TableHead className="text-xs font-semibold text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {patients.map((patient) => (
                  <TableRow
                    key={patient.id}
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => router.push(`/dashboard/patients/${patient.id}`)}
                  >
                    <TableCell>
                      <span className="text-sm font-medium text-gray-900">{patient.name}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-600 flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {formatPhone(patient.phone)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-500">{patient.email || '—'}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-500 capitalize">{patient.gender || '—'}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-500">
                        {patient.date_of_birth ? formatDate(patient.date_of_birth) : '—'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-gray-400">{formatDate(patient.created_at)}</span>
                    </TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => handleOpenEdit(e, patient)}
                          className="h-7 px-2 text-xs border-gray-200 hover:border-blue-400 hover:bg-blue-50 text-gray-700 hover:text-blue-700 rounded-lg flex items-center gap-1 shadow-2xs font-medium"
                          title="Edit Patient Record"
                        >
                          <Edit3 className="h-3.5 w-3.5 text-blue-600" />
                          <span>Edit</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteTarget(patient);
                          }}
                          className="h-7 px-2 text-xs border-rose-200 hover:border-rose-400 hover:bg-rose-50 text-rose-600 rounded-lg flex items-center gap-1 shadow-2xs font-medium"
                          title="Delete Patient Record"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>Delete</span>
                        </Button>
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
          <p className="text-xs text-gray-500">Page {currentPage} of {totalPages} ({totalCount} patients)</p>
          <div className="flex gap-1">
            <Button variant="outline" size="sm" disabled={currentPage <= 1} onClick={() => { const p = new URLSearchParams(); if (search) p.set('search', search); p.set('page', String(currentPage - 1)); router.push(`/dashboard/patients?${p.toString()}`); }} className="h-8"><ChevronLeft className="h-3.5 w-3.5" /></Button>
            <Button variant="outline" size="sm" disabled={currentPage >= totalPages} onClick={() => { const p = new URLSearchParams(); if (search) p.set('search', search); p.set('page', String(currentPage + 1)); router.push(`/dashboard/patients?${p.toString()}`); }} className="h-8"><ChevronRight className="h-3.5 w-3.5" /></Button>
          </div>
        </div>
      )}

      {/* New Patient Dialog */}
      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New Patient</DialogTitle>
            <DialogDescription>Add a new patient to the clinic records.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input value={newForm.name} onChange={(e) => setNewForm({ ...newForm, name: e.target.value })} placeholder="Patient name" />
            </div>
            <div className="space-y-2">
              <Label>Phone *</Label>
              <Input value={newForm.phone} onChange={(e) => setNewForm({ ...newForm, phone: e.target.value })} placeholder="03001234567" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={newForm.email} onChange={(e) => setNewForm({ ...newForm, email: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Gender</Label>
                <select
                  value={newForm.gender}
                  onChange={(e) => setNewForm({ ...newForm, gender: e.target.value })}
                  className="flex h-10 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                >
                  <option value="">Select</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Date of Birth</Label>
              <Input type="date" value={newForm.date_of_birth} onChange={(e) => setNewForm({ ...newForm, date_of_birth: e.target.value })} />
            </div>
            <Button onClick={handleCreate} disabled={creating || !newForm.name || !newForm.phone} className="w-full bg-gradient-to-r from-rose-500 to-pink-600 text-white rounded-lg">
              {creating ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating...</> : 'Create Patient'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Patient Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-gray-900">
              <Edit3 className="h-4 w-4 text-rose-600" />
              Edit Patient Record
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-500">
              Update contact information and demographic details for {editingPatient?.name}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-700">Name *</Label>
              <Input
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                placeholder="Patient full name"
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-700">Phone *</Label>
              <Input
                value={editForm.phone}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                placeholder="03001234567"
                className="h-8 text-xs"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-700">Email</Label>
                <Input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  placeholder="patient@example.com"
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-700">Gender</Label>
                <select
                  value={editForm.gender}
                  onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}
                  className="flex h-8 w-full rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs"
                >
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-700">Date of Birth</Label>
              <Input
                type="date"
                value={editForm.date_of_birth}
                onChange={(e) => setEditForm({ ...editForm, date_of_birth: e.target.value })}
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-700">Address</Label>
              <Input
                value={editForm.address}
                onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                placeholder="e.g. Hayatabad, Peshawar"
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-700">Clinical / Administrative Notes</Label>
              <Input
                value={editForm.notes}
                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                placeholder="e.g. Sensitive skin, allergy notes"
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
                onClick={handleUpdate}
                disabled={updating || !editForm.name.trim() || !editForm.phone.trim()}
                className="h-8 text-xs bg-rose-600 hover:bg-rose-700 text-white font-medium"
              >
                {updating ? (
                  <>
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Patient Confirmation Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600 flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              Delete Patient Record
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete patient record for <strong>{deleteTarget?.name}</strong> ({deleteTarget?.phone})? This will archive the patient profile.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                  Deleting...
                </>
              ) : (
                'Delete Patient'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
