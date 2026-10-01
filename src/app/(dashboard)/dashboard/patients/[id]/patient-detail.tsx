'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createVisit } from '@/actions/clinic';
import { createClinicalNote, updatePatient, deletePatient } from '@/actions/patients';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  ArrowLeft, Phone, Mail, Calendar, Clock, User, CreditCard,
  FileText, Stethoscope, Plus, Loader2, Eye, EyeOff, Image as ImageIcon,
  Edit, Trash2,
} from 'lucide-react';
import { formatCurrency, formatDate, formatDateTime, formatPhone } from '@/lib/utils/helpers';
import { APPOINTMENT_STATUS_LABELS, APPOINTMENT_STATUS_COLORS, PAYMENT_STATUS_LABELS } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import Link from 'next/link';

interface PatientDetailProps {
  patient: {
    id: string; name: string; phone: string; email: string | null;
    gender: string | null; date_of_birth: string | null; address: string | null;
    notes: string | null; created_at: string;
  };
  appointments: Array<{
    id: string; treatment_id: string; scheduled_at: string; status: string;
    treatments: { name: string }[] | null;
  }>;
  visits: Array<{
    id: string; visit_date: string; notes: string | null; treatment_id: string | null;
    sale_id: string | null; treatments: { name: string }[] | null;
  }>;
  sales: Array<{
    id: string; total: number; payment_method: string; payment_status: string;
    created_at: string; voided_at: string | null;
  }>;
  invoices: Array<{
    id: string; invoice_number: string; total: number; status: string;
    payment_status: string; created_at: string;
  }>;
  clinicalNotes: Array<{
    id: string; note_text: string; diagnosis: string | null;
    prescription: string | null; created_at: string; visit_id: string | null;
  }>;
  beforeAfterCases: Array<{
    id: string; title: string | null; before_image_url: string; after_image_url: string;
    is_public: boolean; created_at: string; treatments: { name: string }[] | null;
  }>;
  treatments: Array<{ id: string; name: string; price: number | null }>;
  stats: { totalVisits: number; totalSpending: number; lastVisit: string | null };
  isAdmin: boolean;
}

export function PatientDetail({
  patient, appointments, visits, sales, invoices, clinicalNotes,
  beforeAfterCases, treatments, stats, isAdmin,
}: PatientDetailProps) {
  const router = useRouter();
  const [showVisitDialog, setShowVisitDialog] = useState(false);
  const [showNoteDialog, setShowNoteDialog] = useState(false);
  const [visitForm, setVisitForm] = useState({ treatment_id: '', visit_date: new Date().toISOString().split('T')[0], notes: '' });
  const [noteForm, setNoteForm] = useState({ note_text: '', diagnosis: '', prescription: '' });
  const [saving, setSaving] = useState(false);

  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editForm, setEditForm] = useState({
    name: patient.name,
    phone: patient.phone,
    email: patient.email || '',
    gender: patient.gender || '',
    date_of_birth: patient.date_of_birth ? patient.date_of_birth.split('T')[0] : '',
    address: patient.address || '',
    notes: patient.notes || '',
  });
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleUpdatePatient = async () => {
    if (!editForm.name.trim() || !editForm.phone.trim()) {
      toast.error('Patient name and phone are required.');
      return;
    }
    setUpdating(true);
    const result = await updatePatient(patient.id, editForm);
    setUpdating(false);
    if (result.success) {
      toast.success('Patient details updated successfully!');
      setShowEditDialog(false);
      router.refresh();
    } else {
      toast.error(result.error || 'Failed to update patient');
    }
  };

  const handleDeletePatient = async () => {
    setDeleting(true);
    const result = await deletePatient(patient.id);
    setDeleting(false);
    if (result.success) {
      toast.success('Patient deleted');
      setShowDeleteDialog(false);
      router.push('/dashboard/patients');
    } else {
      toast.error(result.error || 'Failed to delete patient');
    }
  };

  const handleCreateVisit = async () => {
    setSaving(true);
    const result = await createVisit({
      patient_id: patient.id,
      treatment_id: visitForm.treatment_id || null,
      visit_date: visitForm.visit_date,
      notes: visitForm.notes,
    });
    setSaving(false);
    if (result.success) {
      toast.success('Visit recorded');
      setShowVisitDialog(false);
      setVisitForm({ treatment_id: '', visit_date: new Date().toISOString().split('T')[0], notes: '' });
      router.refresh();
    } else {
      toast.error(result.error || 'Failed');
    }
  };

  const handleCreateNote = async () => {
    setSaving(true);
    const result = await createClinicalNote({
      patient_id: patient.id,
      note_text: noteForm.note_text,
      diagnosis: noteForm.diagnosis,
      prescription: noteForm.prescription,
    });
    setSaving(false);
    if (result.success) {
      toast.success('Note saved');
      setShowNoteDialog(false);
      setNoteForm({ note_text: '', diagnosis: '', prescription: '' });
      router.refresh();
    } else {
      toast.error(result.error || 'Failed');
    }
  };

  // Build timeline
  const timeline = [
    ...appointments.map(a => ({
      type: 'appointment' as const,
      date: a.scheduled_at,
      label: `Appointment: ${a.treatments?.[0]?.name || 'Treatment'}`,
      status: a.status,
      id: a.id,
    })),
    ...visits.map(v => ({
      type: 'visit' as const,
      date: v.visit_date,
      label: `Visit: ${v.treatments?.[0]?.name || 'General'}`,
      status: null,
      id: v.id,
    })),
    ...sales.map(s => ({
      type: 'payment' as const,
      date: s.created_at,
      label: `Payment: ${formatCurrency(s.total)}`,
      status: s.voided_at ? 'voided' : s.payment_status,
      id: s.id,
    })),
    ...invoices.map(i => ({
      type: 'invoice' as const,
      date: i.created_at,
      label: `Invoice: ${i.invoice_number}`,
      status: i.status,
      id: i.id,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard/patients')} className="mt-1">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{patient.name}</h1>
          <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-gray-500">
            <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" />{formatPhone(patient.phone)}</span>
            {patient.email && <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" />{patient.email}</span>}
            {patient.gender && <span className="capitalize">{patient.gender}</span>}
            {patient.date_of_birth && <span>DOB: {formatDate(patient.date_of_birth)}</span>}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => setShowVisitDialog(true)} className="rounded-lg h-8 text-xs">
            <Plus className="h-3.5 w-3.5 mr-1" />Visit
          </Button>
          <Button size="sm" variant="outline" onClick={() => setShowEditDialog(true)} className="rounded-lg h-8 text-xs">
            <Edit className="h-3.5 w-3.5 mr-1" />Edit
          </Button>
          {isAdmin && (
            <Button size="sm" variant="outline" onClick={() => setShowNoteDialog(true)} className="rounded-lg h-8 text-xs">
              <Plus className="h-3.5 w-3.5 mr-1" />Note
            </Button>
          )}
          {isAdmin && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowDeleteDialog(true)}
              className="rounded-lg h-8 text-xs text-rose-600 border-rose-200 hover:bg-rose-50"
            >
              <Trash2 className="h-3.5 w-3.5 mr-1" />Delete
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="border-0 shadow-sm">
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-gray-500">Total Visits</p>
            <p className="text-2xl font-bold text-gray-900">{stats.totalVisits}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-gray-500">Total Spending</p>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalSpending)}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-gray-500">Last Visit</p>
            <p className="text-sm font-bold text-gray-900">{stats.lastVisit ? formatDate(stats.lastVisit) : 'Never'}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-gray-500">Registered</p>
            <p className="text-sm font-bold text-gray-900">{formatDate(patient.created_at)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="timeline" className="space-y-4">
        <TabsList className="bg-gray-100/80 p-1 rounded-xl">
          <TabsTrigger value="timeline" className="rounded-lg text-xs">Timeline</TabsTrigger>
          <TabsTrigger value="appointments" className="rounded-lg text-xs">Appointments ({appointments.length})</TabsTrigger>
          <TabsTrigger value="visits" className="rounded-lg text-xs">Visits ({visits.length})</TabsTrigger>
          <TabsTrigger value="invoices" className="rounded-lg text-xs">Invoices ({invoices.length})</TabsTrigger>
          {isAdmin && <TabsTrigger value="notes" className="rounded-lg text-xs">Notes ({clinicalNotes.length})</TabsTrigger>}
          <TabsTrigger value="gallery" className="rounded-lg text-xs">B&A ({beforeAfterCases.length})</TabsTrigger>
        </TabsList>

        {/* Timeline Tab */}
        <TabsContent value="timeline">
          <Card className="border-0 shadow-sm">
            <CardContent className="pt-6">
              {timeline.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">No history yet.</p>
              ) : (
                <div className="space-y-0">
                  {timeline.slice(0, 30).map((event, idx) => (
                    <div key={`${event.type}-${event.id}`} className="flex gap-3 pb-4 last:pb-0">
                      <div className="flex flex-col items-center">
                        <div className={cn('h-3 w-3 rounded-full mt-1.5', {
                          'bg-blue-400': event.type === 'appointment',
                          'bg-green-400': event.type === 'visit',
                          'bg-amber-400': event.type === 'payment',
                          'bg-purple-400': event.type === 'invoice',
                        })} />
                        {idx < timeline.length - 1 && <div className="w-px flex-1 bg-gray-200 mt-1" />}
                      </div>
                      <div className="flex-1 min-w-0 pb-2">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-gray-900">{event.label}</p>
                          {event.status && (
                            <Badge className={cn('text-[10px] border-0 px-1.5', APPOINTMENT_STATUS_COLORS[event.status] || 'bg-gray-100 text-gray-700')}>
                              {APPOINTMENT_STATUS_LABELS[event.status] || PAYMENT_STATUS_LABELS[event.status] || event.status}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">{formatDateTime(event.date)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appointments Tab */}
        <TabsContent value="appointments">
          <Card className="border-0 shadow-sm">
            <CardContent className="pt-6">
              {appointments.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">No appointments.</p>
              ) : (
                <div className="space-y-3">
                  {appointments.map(a => (
                    <div key={a.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{a.treatments?.[0]?.name || 'Treatment'}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{formatDateTime(a.scheduled_at)}</p>
                      </div>
                      <Badge className={cn('text-[10px] border-0', APPOINTMENT_STATUS_COLORS[a.status] || 'bg-gray-100 text-gray-700')}>
                        {APPOINTMENT_STATUS_LABELS[a.status] || a.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Visits Tab */}
        <TabsContent value="visits">
          <Card className="border-0 shadow-sm">
            <CardContent className="pt-6">
              {visits.length === 0 ? (
                <div className="text-center py-8">
                  <Stethoscope className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No visits recorded.</p>
                  <Button size="sm" variant="outline" onClick={() => setShowVisitDialog(true)} className="mt-3 rounded-lg">
                    <Plus className="h-3.5 w-3.5 mr-1" />Record Visit
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {visits.map(v => (
                    <div key={v.id} className="p-3 rounded-lg bg-gray-50">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900">{v.treatments?.[0]?.name || 'General Visit'}</p>
                        <p className="text-xs text-gray-400">{formatDate(v.visit_date)}</p>
                      </div>
                      {v.notes && <p className="text-xs text-gray-600 mt-1">{v.notes}</p>}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Invoices Tab */}
        <TabsContent value="invoices">
          <Card className="border-0 shadow-sm">
            <CardContent className="pt-6">
              {invoices.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">No invoices.</p>
              ) : (
                <div className="space-y-3">
                  {invoices.map(inv => (
                    <Link key={inv.id} href={`/dashboard/invoices/${inv.id}`} className="block">
                      <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                        <div>
                          <p className="text-sm font-mono font-medium text-gray-900">{inv.invoice_number}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{formatDate(inv.created_at)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-gray-900">{formatCurrency(inv.total)}</p>
                          <Badge className={cn('text-[10px] border-0', inv.status === 'paid' ? 'bg-green-100 text-green-700' : inv.status === 'voided' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700')}>
                            {inv.status}
                          </Badge>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Clinical Notes Tab (Admin Only) */}
        {isAdmin && (
          <TabsContent value="notes">
            <Card className="border-0 shadow-sm">
              <CardContent className="pt-6">
                {clinicalNotes.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No clinical notes.</p>
                    <Button size="sm" variant="outline" onClick={() => setShowNoteDialog(true)} className="mt-3 rounded-lg">
                      <Plus className="h-3.5 w-3.5 mr-1" />Add Note
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {clinicalNotes.map(note => (
                      <div key={note.id} className="p-4 rounded-lg border border-gray-100">
                        <p className="text-sm text-gray-800 whitespace-pre-wrap">{note.note_text}</p>
                        {note.diagnosis && (
                          <div className="mt-2 p-2 rounded bg-blue-50">
                            <p className="text-xs font-semibold text-blue-700">Diagnosis</p>
                            <p className="text-xs text-blue-600">{note.diagnosis}</p>
                          </div>
                        )}
                        {note.prescription && (
                          <div className="mt-2 p-2 rounded bg-green-50">
                            <p className="text-xs font-semibold text-green-700">Prescription</p>
                            <p className="text-xs text-green-600">{note.prescription}</p>
                          </div>
                        )}
                        <p className="text-[10px] text-gray-400 mt-2">{formatDateTime(note.created_at)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Before & After Tab */}
        <TabsContent value="gallery">
          <Card className="border-0 shadow-sm">
            <CardContent className="pt-6">
              {beforeAfterCases.length === 0 ? (
                <div className="text-center py-8">
                  <ImageIcon className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No before & after cases.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {beforeAfterCases.map(ba => (
                    <div key={ba.id} className="rounded-xl border border-gray-100 overflow-hidden">
                      <div className="grid grid-cols-2 gap-px bg-gray-200">
                        <div className="relative bg-white">
                          <img src={ba.before_image_url} alt="Before" className="w-full aspect-square object-cover" />
                          <span className="absolute bottom-1 left-1 text-[10px] bg-black/60 text-white px-1.5 py-0.5 rounded">BEFORE</span>
                        </div>
                        <div className="relative bg-white">
                          <img src={ba.after_image_url} alt="After" className="w-full aspect-square object-cover" />
                          <span className="absolute bottom-1 left-1 text-[10px] bg-black/60 text-white px-1.5 py-0.5 rounded">AFTER</span>
                        </div>
                      </div>
                      <div className="p-3">
                        <p className="text-sm font-medium text-gray-900">{ba.title || ba.treatments?.[0]?.name || 'Case'}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-gray-400">{formatDate(ba.created_at)}</span>
                          <Badge className={cn('text-[10px] border-0', ba.is_public ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600')}>
                            {ba.is_public ? <><Eye className="h-2.5 w-2.5 mr-0.5" />Public</> : <><EyeOff className="h-2.5 w-2.5 mr-0.5" />Private</>}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* New Visit Dialog */}
      <Dialog open={showVisitDialog} onOpenChange={setShowVisitDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Record Visit</DialogTitle>
            <DialogDescription>Log a treatment visit for {patient.name}.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Treatment</Label>
              <select value={visitForm.treatment_id} onChange={(e) => setVisitForm({ ...visitForm, treatment_id: e.target.value })}
                className="flex h-10 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm">
                <option value="">Select treatment...</option>
                {treatments.map(t => <option key={t.id} value={t.id}>{t.name}{t.price ? ` — ${formatCurrency(t.price)}` : ''}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Visit Date</Label>
              <Input type="date" value={visitForm.visit_date} onChange={(e) => setVisitForm({ ...visitForm, visit_date: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea value={visitForm.notes} onChange={(e) => setVisitForm({ ...visitForm, notes: e.target.value })} placeholder="Treatment notes, observations..." rows={3} />
            </div>
            <Button onClick={handleCreateVisit} disabled={saving} className="w-full bg-gradient-to-r from-rose-500 to-pink-600 text-white rounded-lg">
              {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : 'Save Visit'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* New Clinical Note Dialog */}
      <Dialog open={showNoteDialog} onOpenChange={setShowNoteDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Clinical Note</DialogTitle>
            <DialogDescription>Add a private clinical note for {patient.name}.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Note *</Label>
              <Textarea value={noteForm.note_text} onChange={(e) => setNoteForm({ ...noteForm, note_text: e.target.value })} placeholder="Clinical observations..." rows={4} />
            </div>
            <div className="space-y-2">
              <Label>Diagnosis</Label>
              <Input value={noteForm.diagnosis} onChange={(e) => setNoteForm({ ...noteForm, diagnosis: e.target.value })} placeholder="Diagnosis" />
            </div>
            <div className="space-y-2">
              <Label>Prescription</Label>
              <Textarea value={noteForm.prescription} onChange={(e) => setNoteForm({ ...noteForm, prescription: e.target.value })} placeholder="Medications, dosage..." rows={3} />
            </div>
            <Button onClick={handleCreateNote} disabled={saving || !noteForm.note_text} className="w-full bg-gradient-to-r from-rose-500 to-pink-600 text-white rounded-lg">
              {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : 'Save Note'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Patient Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Patient Details</DialogTitle>
            <DialogDescription>Update record details for {patient.name}.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3.5 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Name *</Label>
              <Input
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Phone *</Label>
              <Input
                value={editForm.phone}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                className="h-8 text-xs"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Email</Label>
                <Input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Gender</Label>
                <select
                  value={editForm.gender}
                  onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}
                  className="w-full text-xs rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 h-8"
                >
                  <option value="">Select</option>
                  <option value="female">Female</option>
                  <option value="male">Male</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Date of Birth</Label>
              <Input
                type="date"
                value={editForm.date_of_birth}
                onChange={(e) => setEditForm({ ...editForm, date_of_birth: e.target.value })}
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Address</Label>
              <Input
                value={editForm.address}
                onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                className="h-8 text-xs"
                placeholder="City, Area"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Internal Notes</Label>
              <Textarea
                value={editForm.notes}
                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                rows={2}
                className="text-xs"
                placeholder="Skin type, allergies, special preferences..."
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setShowEditDialog(false)} className="h-8 text-xs">
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleUpdatePatient}
                disabled={updating || !editForm.name || !editForm.phone}
                className="h-8 text-xs bg-rose-600 hover:bg-rose-700 text-white font-medium"
              >
                {updating ? <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />Saving...</> : 'Save Changes'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Patient Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Patient Record</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {patient.name}? This will remove the patient profile from active records.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePatient}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? 'Deleting...' : 'Delete Patient'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
