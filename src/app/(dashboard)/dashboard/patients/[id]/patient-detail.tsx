'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import QRCode from 'qrcode';
import { useRouter } from 'next/navigation';
import { createVisit } from '@/actions/clinic';
import { createClinicalNote, updatePatient, deletePatient, createCustomPatientServiceAction } from '@/actions/patients';
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
  Edit, Trash2, Printer, MessageCircle, ShieldCheck, Share2, Activity, Layers,
  Sparkles, Banknote, CheckCircle2,
} from 'lucide-react';
import { formatCurrency, formatDate, formatDateTime, formatTime, formatPhone, buildWhatsAppLink } from '@/lib/utils/helpers';
import { APPOINTMENT_STATUS_LABELS, APPOINTMENT_STATUS_COLORS, PAYMENT_STATUS_LABELS } from '@/lib/constants';
import { useReceiptSettings } from '@/lib/receipt-settings';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { printReceipt } from '@/lib/print-receipt';
import Link from 'next/link';
import { PatientProceduresManager } from './patient-procedures-manager';

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
  procedures?: Array<any>;
  allProcedurePayments?: Array<any>;
  staffList?: Array<{ id: string; name: string; role: string }>;
  stats: {
    totalVisits: number;
    totalSpending: number;
    lastVisit: string | null;
    totalProcedureCost?: number;
    totalProcedurePaid?: number;
    totalOutstandingBalance?: number;
  };
  isAdmin: boolean;
}

export function PatientDetail({
  patient, appointments, visits, sales, invoices, clinicalNotes,
  beforeAfterCases, treatments, procedures = [], allProcedurePayments = [],
  staffList = [], stats, isAdmin,
}: PatientDetailProps) {
  const router = useRouter();
  const [showVisitDialog, setShowVisitDialog] = useState(false);
  const [showNoteDialog, setShowNoteDialog] = useState(false);
  const [visitForm, setVisitForm] = useState({ treatment_id: '', visit_date: new Date().toISOString().split('T')[0], notes: '' });
  const [noteForm, setNoteForm] = useState({ note_text: '', diagnosis: '', prescription: '' });
  const [saving, setSaving] = useState(false);
  const [activeRxPrint, setActiveRxPrint] = useState<{
    diagnosis?: string;
    prescription?: string;
    note_text?: string;
    date: string;
  } | null>(null);

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

  // Custom Service & Receipt Dialog States
  const receiptSettings = useReceiptSettings();
  const [showCustomServiceDialog, setShowCustomServiceDialog] = useState(false);
  const [customForm, setCustomForm] = useState({
    name: '',
    category: 'Clinical Aesthetic Procedure',
    price: 0,
    discount: 0,
    amount_paid: 0,
    payment_method: 'cash' as 'cash' | 'card' | 'bank_transfer',
    total_sessions: 1,
    doctor_id: staffList[0]?.id || '',
    notes: '',
  });
  const [savingCustom, setSavingCustom] = useState(false);

  // Active custom receipt for 80mm printing
  const [activeCustomReceipt, setActiveCustomReceipt] = useState<{
    invoiceNumber: string;
    name: string;
    category?: string;
    price: number;
    discount: number;
    total: number;
    amountPaid: number;
    balance: number;
    paymentMethod: string;
    paymentDate: string;
    notes?: string;
  } | null>(null);
  const [customQrUrl, setCustomQrUrl] = useState<string>('');

  useEffect(() => {
    if (activeCustomReceipt?.invoiceNumber) {
      const origin =
        typeof window !== 'undefined' && window.location.origin
          ? window.location.origin
          : 'https://brimishskincare.com';
      const verifyUrl = `${origin}/verify-invoice?num=${encodeURIComponent(activeCustomReceipt.invoiceNumber)}`;

      QRCode.toDataURL(verifyUrl, {
        width: 240,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
      })
        .then(setCustomQrUrl)
        .catch(console.error);
    }
  }, [activeCustomReceipt]);

  const handleSaveCustomService = async () => {
    if (!customForm.name.trim()) {
      toast.error('Please enter the service or procedure name.');
      return;
    }
    if (customForm.price <= 0) {
      toast.error('Please enter a valid price/fee.');
      return;
    }

    setSavingCustom(true);
    const res = await createCustomPatientServiceAction({
      patient_id: patient.id,
      name: customForm.name.trim(),
      category: customForm.category,
      price: customForm.price,
      discount: customForm.discount,
      amount_paid: customForm.amount_paid,
      payment_method: customForm.payment_method,
      total_sessions: customForm.total_sessions,
      doctor_id: customForm.doctor_id || undefined,
      notes: customForm.notes?.trim() || undefined,
    });
    setSavingCustom(false);

    if (res.success && res.invoiceNumber) {
      toast.success('Custom service recorded & official receipt generated!');
      setShowCustomServiceDialog(false);
      setActiveCustomReceipt({
        invoiceNumber: res.invoiceNumber,
        name: customForm.name.trim(),
        category: customForm.category,
        price: customForm.price,
        discount: customForm.discount,
        total: res.total ?? Math.max(0, customForm.price - customForm.discount),
        amountPaid: res.amountPaid ?? customForm.amount_paid,
        balance: res.balance ?? 0,
        paymentMethod: customForm.payment_method,
        paymentDate: new Date().toISOString(),
        notes: customForm.notes?.trim(),
      });
      router.refresh();
    } else {
      toast.error(res.error || 'Failed to record custom service.');
    }
  };

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
    ...procedures.flatMap(p => (p.sessions || []).map((sess: any) => ({
      type: 'procedure_session' as const,
      date: sess.session_date,
      label: `Procedure Session #${sess.session_number}: ${p.plan_name}`,
      status: sess.status,
      id: sess.id,
    }))),
    ...sales.map(s => ({
      type: 'payment' as const,
      date: s.created_at,
      label: `POS Sale: ${formatCurrency(s.total)}`,
      status: s.voided_at ? 'voided' : s.payment_status,
      id: s.id,
    })),
    ...allProcedurePayments.map(p => ({
      type: 'procedure_payment' as const,
      date: p.payment_date,
      label: `Procedure Payment: ${formatCurrency(p.amount)} (${p.receipt_number})`,
      status: 'paid',
      id: p.id,
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
            <span className="flex items-center gap-1 font-mono text-gray-700 font-medium">
              <Phone className="h-3.5 w-3.5 text-gray-400" />
              {formatPhone(patient.phone)}
            </span>
            <a
              href={buildWhatsAppLink(patient.phone, `Assalam-o-Alaikum ${patient.name}, this is Brimish Skin Care Clinic, Peshawar regarding your consultation.`)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-semibold border border-emerald-200 transition-colors"
            >
              <MessageCircle className="h-3 w-3 text-emerald-600" />
              WhatsApp
            </a>
            {patient.email && <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" />{patient.email}</span>}
            {patient.gender && <span className="capitalize">{patient.gender}</span>}
            {patient.date_of_birth && <span>DOB: {formatDate(patient.date_of_birth)}</span>}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            onClick={() => {
              setCustomForm({
                name: '',
                category: 'Clinical Aesthetic Procedure',
                price: 0,
                discount: 0,
                amount_paid: 0,
                payment_method: 'cash',
                total_sessions: 1,
                doctor_id: staffList[0]?.id || '',
                notes: '',
              });
              setShowCustomServiceDialog(true);
            }}
            className="rounded-xl h-8 px-3 text-xs bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>+ Custom Service & Receipt</span>
          </Button>
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
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <Card className={cn("border shadow-xs", (stats.totalOutstandingBalance || 0) > 0 ? "border-rose-200 bg-rose-50/40" : "border-gray-200")}>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500 font-medium">Pending Baqaya</p>
              {(stats.totalOutstandingBalance || 0) > 0 && <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />}
            </div>
            <p className={cn("text-xl font-bold font-serif mt-0.5", (stats.totalOutstandingBalance || 0) > 0 ? "text-rose-700" : "text-gray-900")}>
              {formatCurrency(stats.totalOutstandingBalance || 0)}
            </p>
          </CardContent>
        </Card>
        <Card className="border border-gray-200 shadow-xs">
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-gray-500">Procedures</p>
            <p className="text-xl font-bold text-gray-900 mt-0.5">
              {procedures.length} <span className="text-xs font-normal text-gray-400">({procedures.filter(p => p.status === 'active').length} active)</span>
            </p>
          </CardContent>
        </Card>
        <Card className="border border-gray-200 shadow-xs">
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-gray-500">Total Spending</p>
            <p className="text-xl font-bold text-gray-900 mt-0.5">{formatCurrency(stats.totalSpending + (stats.totalProcedurePaid || 0))}</p>
          </CardContent>
        </Card>
        <Card className="border border-gray-200 shadow-xs">
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-gray-500">Visits & Sessions</p>
            <p className="text-xl font-bold text-gray-900 mt-0.5">
              {stats.totalVisits + procedures.reduce((acc, p) => acc + (p.completed_sessions || 0), 0)}
            </p>
          </CardContent>
        </Card>
        <Card className="border border-gray-200 shadow-xs col-span-2 sm:col-span-1">
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-gray-500">Last Visit</p>
            <p className="text-sm font-bold text-gray-900 mt-1">{stats.lastVisit ? formatDate(stats.lastVisit) : 'Never'}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="procedures" className="space-y-4">
        <TabsList className="bg-gray-100/80 p-1 rounded-xl flex-wrap h-auto gap-1">
          <TabsTrigger value="procedures" className="rounded-lg text-xs font-semibold data-[state=active]:bg-rose-600 data-[state=active]:text-white">
            <Layers className="h-3.5 w-3.5 mr-1" />
            Procedures & Sessions ({procedures.length})
          </TabsTrigger>
          <TabsTrigger value="timeline" className="rounded-lg text-xs">Timeline</TabsTrigger>
          <TabsTrigger value="appointments" className="rounded-lg text-xs">Appointments ({appointments.length})</TabsTrigger>
          <TabsTrigger value="visits" className="rounded-lg text-xs">Visits ({visits.length})</TabsTrigger>
          <TabsTrigger value="invoices" className="rounded-lg text-xs">Invoices ({invoices.length})</TabsTrigger>
          {isAdmin && <TabsTrigger value="notes" className="rounded-lg text-xs">Notes ({clinicalNotes.length})</TabsTrigger>}
          <TabsTrigger value="gallery" className="rounded-lg text-xs">B&A ({beforeAfterCases.length})</TabsTrigger>
        </TabsList>

        {/* Procedures & Multi-Session Plans Tab */}
        <TabsContent value="procedures">
          <PatientProceduresManager
            patient={patient}
            procedures={procedures}
            allProcedurePayments={allProcedurePayments}
            treatments={treatments}
            staffList={staffList}
            stats={stats}
            isAdmin={isAdmin}
          />
        </TabsContent>

        {/* Timeline Tab */}
        <TabsContent value="timeline">
          <Card className="border border-gray-200 shadow-xs">
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
                          'bg-rose-500': event.type === 'procedure_session',
                          'bg-emerald-500': event.type === 'procedure_payment',
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
          <Card className="border border-gray-200 shadow-xs">
            <CardContent className="pt-6">
              {appointments.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">No appointments.</p>
              ) : (
                <div className="space-y-3">
                  {appointments.map(a => (
                    <div key={a.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-200 bg-gray-50/50 hover:bg-gray-100/50 transition-colors">
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
          <Card className="border border-gray-200 shadow-xs">
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
                    <div key={v.id} className="p-3 rounded-lg border border-gray-200 bg-gray-50/50">
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
          <Card className="border border-gray-200 shadow-xs">
            <CardContent className="pt-6">
              {invoices.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">No invoices.</p>
              ) : (
                <div className="space-y-3">
                  {invoices.map(inv => (
                    <Link key={inv.id} href={`/dashboard/invoices/${inv.id}`} className="block">
                      <div className="flex items-center justify-between p-3 rounded-lg border border-gray-200 bg-gray-50/50 hover:bg-gray-100/70 transition-colors">
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
            <Card className="border border-gray-200 shadow-xs">
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
                      <div key={note.id} className="p-4 rounded-lg border border-gray-200 bg-white">
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
                        <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center justify-between">
                          <p className="text-[10px] text-gray-400">{formatDateTime(note.created_at)}</p>
                          {(note.prescription || note.diagnosis) && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setActiveRxPrint({
                                diagnosis: note.diagnosis || undefined,
                                prescription: note.prescription || undefined,
                                note_text: note.note_text,
                                date: note.created_at,
                              })}
                              className="h-7 text-xs rounded-lg border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                            >
                              <Printer className="h-3 w-3 mr-1 text-emerald-600" />
                              Print Official Rx Slip
                            </Button>
                          )}
                        </div>
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
          <Card className="border border-gray-200 shadow-xs">
            <CardContent className="pt-6">
              {beforeAfterCases.length === 0 ? (
                <div className="text-center py-8">
                  <ImageIcon className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500 mb-3">No before & after cases recorded for this patient.</p>
                  <Link
                    href="/dashboard/gallery"
                    className="inline-flex items-center justify-center gap-1 h-8 px-3 text-xs font-semibold rounded-lg border border-dashed border-gray-300 hover:border-rose-400 hover:bg-rose-50/50 text-gray-700 transition-colors"
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    Upload B&A Photos in Cases
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-gray-700">Clinical Before & After Photos</p>
                    <Link
                      href="/dashboard/gallery"
                      className="inline-flex items-center justify-center gap-1 h-7 px-2.5 text-xs font-medium rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-700 transition-colors"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Upload New Case
                    </Link>
                  </div>
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

      {/* Official Doctor Prescription (Rx) Slip Print Modal */}
      <Dialog open={!!activeRxPrint} onOpenChange={(open) => !open && setActiveRxPrint(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[92vh] overflow-y-auto p-0 border-rose-200">
          <div className="p-6 bg-white space-y-6" id="printable-rx-slip">
            {/* Header Letterhead */}
            <div className="border-b-2 border-rose-600 pb-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black font-serif text-gray-950 uppercase tracking-tight">
                  Brimish Skin Care & Laser Clinic
                </h2>
                <p className="text-xs font-bold text-rose-600">
                  DR. BILAL KHAN (Dermatologist &amp; Cosmetologist)
                </p>
                <p className="text-[11px] text-gray-500 font-medium">
                  Consultant Dermatologist &amp; Cosmetologist
                </p>
                <p className="text-[10px] text-gray-500 mt-1">
                  Sami Tower, Ring Road, Peshawar | Doctor: 0335-6400959
                </p>
              </div>
              <div className="h-14 w-14 rounded-2xl border border-rose-100 p-1 bg-white shadow-xs shrink-0 flex items-center justify-center">
                <Image src="/images/logo.png" alt="Brimish Clinic" width={48} height={48} className="object-contain" />
              </div>
            </div>

            {/* Patient Meta Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 bg-rose-50/50 rounded-xl text-xs border border-rose-100">
              <div>
                <span className="text-[10px] text-gray-400 block uppercase font-bold">Patient Name</span>
                <span className="font-bold text-gray-900">{patient.name}</span>
              </div>
              <div>
                <span className="text-[10px] text-gray-400 block uppercase font-bold">Phone / MR</span>
                <span className="font-mono text-gray-800">{formatPhone(patient.phone)}</span>
              </div>
              <div>
                <span className="text-[10px] text-gray-400 block uppercase font-bold">Gender / Age</span>
                <span className="capitalize text-gray-800">{patient.gender || 'Not specified'}</span>
              </div>
              <div>
                <span className="text-[10px] text-gray-400 block uppercase font-bold">Date</span>
                <span className="font-bold text-gray-900">{activeRxPrint?.date ? formatDate(activeRxPrint.date) : formatDate(new Date().toISOString())}</span>
              </div>
            </div>

            {/* Clinical Diagnosis (if present) */}
            {activeRxPrint?.diagnosis && (
              <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-100">
                <p className="text-[10px] font-bold uppercase tracking-wider text-blue-800">Clinical Diagnosis</p>
                <p className="text-sm font-semibold text-blue-950 mt-0.5">{activeRxPrint.diagnosis}</p>
              </div>
            )}

            {/* Rx Symbol & Medication Regimen */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-2xl font-serif font-black text-rose-700">
                <span>℞</span>
                <span className="text-xs uppercase font-bold tracking-widest text-gray-400 font-sans">
                  Medical Skincare & Medication Regimen
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-gray-50/80 border border-gray-200 min-h-36">
                <p className="text-sm text-gray-900 whitespace-pre-wrap font-mono sm:font-sans leading-relaxed">
                  {activeRxPrint?.prescription || activeRxPrint?.note_text || 'No prescription specified.'}
                </p>
              </div>
            </div>

            {/* Doctor Advice & Instructions */}
            <div className="text-[11px] text-gray-600 bg-amber-50/50 p-3 rounded-xl border border-amber-100 space-y-1">
              <p className="font-bold text-amber-900 uppercase text-[10px]">Patient Care Instructions:</p>
              <ul className="list-disc pl-4 space-y-0.5 text-gray-700">
                <li>Apply broad-spectrum SPF 50 sunscreen every morning 15 minutes before sun exposure.</li>
                <li>Do not pick or squeeze acne lesions or peeling skin.</li>
                <li>In case of sudden rash or redness, discontinue actives and message clinic WhatsApp.</li>
                <li>Follow-up consultation is valid within 30 days of this date.</li>
              </ul>
            </div>

            {/* Footer Sign-off */}
            <div className="pt-6 border-t border-gray-200 flex items-end justify-between">
              <div className="text-[10px] text-gray-400 space-y-0.5">
                <p>Official Digital Prescription Record • Brimish Clinic Peshawar</p>
                <p>Verify records online at brimishclinic.com</p>
              </div>
              <div className="text-right">
                <div className="h-10 w-36 border-b border-gray-400 ml-auto" />
                <p className="text-xs font-bold text-gray-900 mt-1">Dr. Bilal Ahmad</p>
                <p className="text-[10px] text-gray-500">Authorized Physician Signature & Stamp</p>
              </div>
            </div>

            {/* Print & Share Actions Bar */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100 print:hidden">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (activeRxPrint) {
                    const text = `*Assalam-o-Alaikum ${patient.name}*\nHere is your official prescription from *Dr. Bilal Ahmad (Brimish Skin Care Clinic)*:\n\n*Diagnosis:* ${activeRxPrint.diagnosis || 'Clinical Consultation'}\n\n*Regimen:*\n${activeRxPrint.prescription || activeRxPrint.note_text}\n\n*Follow-up:* Valid for 30 days.\nClinic: Sami Tower, Ring Road, Peshawar (0335-6400959)`;
                    window.open(buildWhatsAppLink(patient.phone, text), '_blank');
                  }
                }}
                className="rounded-lg h-9 text-xs border-emerald-300 text-emerald-700 hover:bg-emerald-50"
              >
                <MessageCircle className="h-3.5 w-3.5 mr-1.5 text-emerald-600" />
                Send via WhatsApp
              </Button>
              <Button
                size="sm"
                onClick={() => printReceipt('printable-rx-slip', `Rx-${patient.name.replace(/\s+/g, '_')}`)}
                className="bg-rose-600 hover:bg-rose-700 text-white rounded-lg h-9 text-xs font-semibold px-4 flex items-center gap-1.5"
                title="Print prescription slip or save as PDF"
              >
                <Printer className="h-3.5 w-3.5" />
                <span>Print / PDF</span>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Custom Service / Procedure Dialog */}
      <Dialog open={showCustomServiceDialog} onOpenChange={setShowCustomServiceDialog}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-gray-900 font-serif">
              <Sparkles className="h-4 w-4 text-emerald-600" />
              Add Custom Service / Procedure & Issue Receipt
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-500">
              Record an unlisted clinical treatment, minor procedure, or custom service for {patient.name} and generate an official receipt.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            {/* Service Name */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-gray-800">
                Custom Service / Procedure Name *
              </Label>
              <Input
                placeholder="e.g. Special Chemical Peel & Skin Tag Removal"
                value={customForm.name}
                onChange={(e) => setCustomForm({ ...customForm, name: e.target.value })}
                className="rounded-xl text-sm"
              />
            </div>

            {/* Category / Service Type & Total Sessions */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-800">Service Category</Label>
                <select
                  value={customForm.category}
                  onChange={(e) => setCustomForm({ ...customForm, category: e.target.value })}
                  className="flex h-10 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs focus:border-emerald-500 focus:outline-none"
                >
                  <option value="Clinical Aesthetic Procedure">Clinical Aesthetic Procedure</option>
                  <option value="Laser Dermatology & Skin Therapy">Laser Dermatology & Skin Therapy</option>
                  <option value="Special Consultation & Minor Procedure">Special Consultation & Minor Procedure</option>
                  <option value="Medicated Kit / Custom Skincare">Medicated Kit / Custom Skincare</option>
                  <option value="Other Custom Service">Other Custom Service</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-800">Planned Sessions</Label>
                <Input
                  type="number"
                  min="1"
                  max="20"
                  value={customForm.total_sessions}
                  onChange={(e) => setCustomForm({ ...customForm, total_sessions: Number(e.target.value) || 1 })}
                  className="rounded-xl font-mono text-sm"
                />
              </div>
            </div>

            {/* Price & Discount */}
            <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-emerald-50/50 border border-emerald-200">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-emerald-950">Fee / Charge (PKR) *</Label>
                <Input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={customForm.price || ''}
                  onChange={(e) => {
                    const p = Number(e.target.value) || 0;
                    const net = Math.max(0, p - customForm.discount);
                    setCustomForm({ ...customForm, price: p, amount_paid: net });
                  }}
                  className="rounded-xl font-mono font-bold text-gray-900 bg-white"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-emerald-950">Discount (PKR)</Label>
                <Input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={customForm.discount || ''}
                  onChange={(e) => {
                    const disc = Number(e.target.value) || 0;
                    const net = Math.max(0, customForm.price - disc);
                    setCustomForm({ ...customForm, discount: disc, amount_paid: net });
                  }}
                  className="rounded-xl font-mono text-rose-700 bg-white"
                />
              </div>

              {/* Net Payable Banner */}
              <div className="col-span-2 pt-2 border-t border-emerald-200 flex justify-between items-center text-xs">
                <span className="font-semibold text-emerald-900 uppercase tracking-wider text-[11px]">
                  Net Payable Amount:
                </span>
                <span className="text-base font-extrabold text-emerald-950 font-serif">
                  {formatCurrency(Math.max(0, customForm.price - customForm.discount))}
                </span>
              </div>
            </div>

            {/* Payment Amount & Method */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-800">Amount Received Today (PKR)</Label>
                <Input
                  type="number"
                  min="0"
                  value={customForm.amount_paid}
                  onChange={(e) => setCustomForm({ ...customForm, amount_paid: Number(e.target.value) || 0 })}
                  className="rounded-xl font-mono font-bold text-emerald-700"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-800">Payment Tender</Label>
                <select
                  value={customForm.payment_method}
                  onChange={(e) => setCustomForm({ ...customForm, payment_method: e.target.value as any })}
                  className="flex h-10 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs focus:border-emerald-500 focus:outline-none"
                >
                  <option value="cash">Cash at Clinic</option>
                  <option value="card">Card / POS Terminal</option>
                  <option value="bank_transfer">Bank Transfer</option>
                </select>
              </div>
            </div>

            {/* Doctor / Performer */}
            {staffList.length > 0 && (
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-800">Doctor / Staff Attendant</Label>
                <select
                  value={customForm.doctor_id}
                  onChange={(e) => setCustomForm({ ...customForm, doctor_id: e.target.value })}
                  className="flex h-10 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs focus:border-emerald-500 focus:outline-none"
                >
                  {staffList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.role})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Clinical Notes / Observations */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-gray-800">
                Clinical / Procedure Notes & Aftercare (Optional)
              </Label>
              <Textarea
                rows={2}
                placeholder="e.g. Performed localized treatment. Advised sun protection and prescribed topical gel."
                value={customForm.notes}
                onChange={(e) => setCustomForm({ ...customForm, notes: e.target.value })}
                className="rounded-xl text-xs"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCustomServiceDialog(false)}
                className="rounded-xl h-9 text-xs cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={savingCustom || !customForm.name.trim() || customForm.price <= 0}
                onClick={handleSaveCustomService}
                className="rounded-xl h-9 px-4 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                {savingCustom ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Recording & Generating...
                  </>
                ) : (
                  <>
                    <Printer className="h-3.5 w-3.5" />
                    Save & Generate Receipt
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 80mm Custom Receipt Modal */}
      <Dialog open={!!activeCustomReceipt} onOpenChange={(open) => !open && setActiveCustomReceipt(null)}>
        <DialogContent className="sm:max-w-md max-h-[92vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader className="border-b pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                  <Printer className="h-4 w-4" />
                </div>
                <div>
                  <DialogTitle className="text-base font-bold text-gray-900 font-serif">
                    Official Custom Service Receipt
                  </DialogTitle>
                  <DialogDescription className="text-xs text-gray-500 font-mono">
                    {activeCustomReceipt?.invoiceNumber}
                  </DialogDescription>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => {
                    if (!activeCustomReceipt) return;
                    const origin =
                      typeof window !== 'undefined' && window.location.origin
                        ? window.location.origin
                        : 'https://brimishskincare.com';
                    const verifyUrl = `${origin}/verify-invoice?num=${encodeURIComponent(activeCustomReceipt.invoiceNumber)}`;
                    const text = `*Assalam-o-Alaikum ${patient.name}*,\nHere is your official receipt from *Brimish Skin Care & Laser Clinic*:\n\n• Receipt No: ${activeCustomReceipt.invoiceNumber}\n• Service: ${activeCustomReceipt.name}\n• Total Amount: ${formatCurrency(activeCustomReceipt.total)}\n• Amount Paid: ${formatCurrency(activeCustomReceipt.amountPaid)}\n• Remaining Balance: ${formatCurrency(activeCustomReceipt.balance)}\n• Date: ${formatDateTime(activeCustomReceipt.paymentDate)}\n• Digital Verification: ${verifyUrl}\n\nThank you for choosing Brimish Skin Care!\nClinic: Sami Tower, Ring Road, Peshawar (0335-6400959)`;
                    window.open(buildWhatsAppLink(patient.phone, text), '_blank');
                  }}
                  variant="outline"
                  className="h-8 px-2.5 text-xs text-emerald-700 border-emerald-300 hover:bg-emerald-50 rounded-xl cursor-pointer"
                >
                  <MessageCircle className="h-3.5 w-3.5 mr-1 text-emerald-600" />
                  WhatsApp
                </Button>
                <Button
                  size="sm"
                  onClick={() => activeCustomReceipt && printReceipt('printable-custom-patient-receipt', activeCustomReceipt.invoiceNumber)}
                  className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl h-8 px-3 text-xs font-semibold cursor-pointer"
                >
                  <Printer className="h-3.5 w-3.5 mr-1" />
                  Print 80mm
                </Button>
              </div>
            </div>
          </DialogHeader>

          {activeCustomReceipt && (
            <div className="bg-stone-100/70 p-4 sm:p-6 print:p-0 print:bg-white flex justify-center max-h-[75vh] overflow-y-auto">
              <div
                id="printable-custom-patient-receipt"
                className="w-full max-w-[340px] bg-white p-4 font-mono text-[11px] text-black leading-tight space-y-0"
              >
                {/* Clinic Header */}
                <div className="text-center pb-2.5">
                  <div className="flex justify-center mb-1.5">
                    <Image
                      src="/images/logo.png"
                      alt="Brimish Skin Care Logo"
                      width={46}
                      height={46}
                      className="w-11 h-11 object-contain"
                      priority
                    />
                  </div>
                  <h2 className="text-sm font-black tracking-tight text-black uppercase font-sans">
                    {receiptSettings.receiptTitle || 'BRIMISH SKIN CARE & LASER CLINIC'}
                  </h2>
                  <p className="text-[10px] font-bold text-black mt-0.5">
                    {receiptSettings.receiptDoctor || 'DR. BILAL AHMAD (MD Aesthetic Medicine)'}
                  </p>
                  <p className="text-[9px] text-gray-700 mt-0.5">
                    {receiptSettings.receiptSpecialty || 'Medical Aesthetics, Dermatology & Laser Center'}
                  </p>
                  <p className="text-[9px] text-gray-700 mt-0.5">
                    {receiptSettings.receiptAddress || 'Sami Tower, Ring Road, Peshawar, KP'}
                  </p>
                  <p className="text-[9px] font-semibold text-black mt-0.5">
                    {receiptSettings.receiptPhone || 'Dr: 0335-6400959 | WhatsApp: 0335-6400959'}
                  </p>
                </div>

                {/* Receipt Metadata */}
                <div className="py-2 text-[10px] space-y-0.5 border-t border-b border-black">
                  <div className="flex justify-between">
                    <span>Receipt #:</span>
                    <strong className="font-bold">{activeCustomReceipt.invoiceNumber}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Date:</span>
                    <span>{formatDate(activeCustomReceipt.paymentDate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Time:</span>
                    <span>{formatTime(activeCustomReceipt.paymentDate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Patient:</span>
                    <strong className="font-bold">{patient.name}</strong>
                  </div>
                  {patient.phone && (
                    <div className="flex justify-between">
                      <span>Phone:</span>
                      <span>{formatPhone(patient.phone)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Payment:</span>
                    <span className="uppercase font-bold">{activeCustomReceipt.paymentMethod}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Status:</span>
                    <span className="font-bold uppercase text-[10px] px-1.5 py-0.5 border border-black rounded text-black bg-white">
                      {activeCustomReceipt.balance <= 0 ? 'PAID IN FULL' : 'PARTIAL PAYMENT'}
                    </span>
                  </div>
                </div>

                {/* Itemized Table */}
                <div className="py-2">
                  <div className="flex justify-between font-bold pb-1 text-[9px] uppercase tracking-wider">
                    <span className="w-1/2">Item / Procedure</span>
                    <span className="w-1/4 text-center">Qty x Rate</span>
                    <span className="w-1/4 text-right">Total</span>
                  </div>
                  <div className="space-y-1 pt-1">
                    <div>
                      <p className="font-bold text-[10px] text-black leading-tight">
                        {activeCustomReceipt.name}
                      </p>
                      {activeCustomReceipt.category && (
                        <p className="text-[9px] text-gray-600">
                          {activeCustomReceipt.category}
                        </p>
                      )}
                      <div className="flex justify-between text-[9px] text-gray-800 pt-0.5">
                        <span>1 x {formatCurrency(activeCustomReceipt.price)}</span>
                        <span className="font-bold text-black">{formatCurrency(activeCustomReceipt.price)}</span>
                      </div>
                      {activeCustomReceipt.discount > 0 && (
                        <div className="flex justify-between text-[8px] text-emerald-800">
                          <span>Discount Applied:</span>
                          <span>-{formatCurrency(activeCustomReceipt.discount)}</span>
                        </div>
                      )}
                      {activeCustomReceipt.notes && (
                        <div className="text-[8px] text-gray-700 italic pt-0.5">
                          &ldquo;{activeCustomReceipt.notes}&rdquo;
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Totals Summary */}
                <div className="py-2 space-y-1 text-[10px] border-t border-black">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>{formatCurrency(activeCustomReceipt.price)}</span>
                  </div>
                  {activeCustomReceipt.discount > 0 && (
                    <div className="flex justify-between text-emerald-800">
                      <span>Discount:</span>
                      <span>-{formatCurrency(activeCustomReceipt.discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xs sm:text-sm font-black pt-1 text-black border-t border-black">
                    <span className="uppercase">NET TOTAL:</span>
                    <span>{formatCurrency(activeCustomReceipt.total)}</span>
                  </div>
                  <div className="flex justify-between text-[9px] text-gray-700 pt-0.5">
                    <span>Amount Tendered / Paid:</span>
                    <span>{formatCurrency(activeCustomReceipt.amountPaid)}</span>
                  </div>
                  <div className="flex justify-between text-[9px] font-bold text-black">
                    <span>{activeCustomReceipt.balance <= 0 ? 'Change Returned:' : 'Remaining Balance:'}</span>
                    <span>{formatCurrency(activeCustomReceipt.balance <= 0 ? 0 : activeCustomReceipt.balance)}</span>
                  </div>
                </div>

                {/* Autogenerated QR Code for Online Verification */}
                {receiptSettings.enableQrVerification && customQrUrl && (
                  <div className="text-center pt-2.5 pb-1 border-t border-black">
                    <div className="w-24 h-24 mx-auto bg-white p-1 border border-black rounded flex items-center justify-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={customQrUrl}
                        alt="Receipt QR Code"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <p className="text-[9px] font-black text-black uppercase mt-1 tracking-wider">
                      SCAN TO VERIFY RECEIPT
                    </p>
                    <p className="text-[8px] text-gray-700 mt-0.5">
                      Official Clinic Digital Verification Record
                    </p>
                    <p className="text-[8px] font-bold text-black mt-0.5">
                      brimishclinic.com
                    </p>
                  </div>
                )}

                {/* Receipt Footer */}
                <div className="text-center pt-2 text-[9px] text-gray-800 space-y-0.5">
                  <p className="font-bold text-black">
                    {receiptSettings.receiptFooterMessage || 'Thank you for trusting Brimish Skin Care. Follow-up valid within 30 days of treatment.'}
                  </p>
                  <p className="text-[8px] text-gray-600">
                    Follow-up consultations valid within 30 days
                  </p>
                  <p className="text-[8px] text-gray-500">
                    Computer-generated official clinical slip
                  </p>
                </div>

                {/* Tech4Edges Credit Footer */}
                <div className="pt-2 text-center text-[9px] font-bold text-gray-800 border-t border-dashed border-gray-300 mt-2">
                  <p>Software Made by Tech4Edges</p>
                  <p>03275792600</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
