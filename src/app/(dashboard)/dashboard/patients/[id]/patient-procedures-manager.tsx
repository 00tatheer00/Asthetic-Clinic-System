'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  createPatientProcedure,
  logProcedureSession,
  recordProcedurePayment,
  updateProcedureStatus,
  deleteProcedurePlan,
} from '@/actions/procedures';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Activity, Sparkles, Clock, CreditCard, CheckCircle2, AlertCircle,
  Calendar, ChevronDown, ChevronUp, Printer, MessageCircle, Plus,
  Trash2, FileText, Layers, Loader2, ArrowRight, Stethoscope, RefreshCw,
  TrendingUp, Check, X,
} from 'lucide-react';
import { formatCurrency, formatDate, formatDateTime, formatPhone, buildWhatsAppLink } from '@/lib/utils/helpers';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { printReceipt } from '@/lib/print-receipt';
import type { PatientProcedure, ProcedureSession, ProcedurePayment, ProcedureStatus, PaymentMethod } from '@/lib/types';

interface PatientProceduresManagerProps {
  patient: {
    id: string;
    name: string;
    phone: string;
    email: string | null;
  };
  procedures: Array<PatientProcedure & { sessions?: ProcedureSession[]; payments?: ProcedurePayment[]; treatments?: { id: string; name: string; price: number | null } | null }>;
  allProcedurePayments: ProcedurePayment[];
  treatments: Array<{ id: string; name: string; price: number | null }>;
  staffList: Array<{ id: string; name: string; role: string }>;
  stats: {
    totalProcedureCost?: number;
    totalProcedurePaid?: number;
    totalOutstandingBalance?: number;
  };
  isAdmin: boolean;
}

export function PatientProceduresManager({
  patient,
  procedures = [],
  allProcedurePayments = [],
  treatments = [],
  staffList = [],
  stats,
  isAdmin,
}: PatientProceduresManagerProps) {
  const router = useRouter();

  // Dialog states
  const [showNewProcDialog, setShowNewProcDialog] = useState(false);
  const [showSessionDialog, setShowSessionDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [activeReceiptPrint, setActiveReceiptPrint] = useState<{
    receiptNumber: string;
    amount: number;
    paymentMethod: string;
    paymentDate: string;
    planName: string;
    totalCost: number;
    balanceRemaining: number;
    notes?: string | null;
  } | null>(null);

  // Selected contexts for sub-actions
  const [selectedProcForSession, setSelectedProcForSession] = useState<any | null>(null);
  const [selectedProcForPayment, setSelectedProcForPayment] = useState<any | null>(null);
  const [expandedProcId, setExpandedProcId] = useState<string | null>(
    procedures.length > 0 ? procedures[0].id : null
  );

  // Loading states
  const [savingProc, setSavingProc] = useState(false);
  const [savingSession, setSavingSession] = useState(false);
  const [savingPayment, setSavingPayment] = useState(false);

  // 1. New Procedure Form State
  const [procForm, setProcForm] = useState({
    treatment_id: '',
    plan_name: '',
    total_sessions: 3,
    total_cost: 0,
    advance_payment: 0,
    payment_method: 'cash' as PaymentMethod,
    interval_days: 30,
    next_session_due_date: '',
    doctor_id: staffList[0]?.id || '',
    notes: '',
    log_first_session: true,
    first_session_area: 'Full Area',
    first_session_settings: '',
    first_session_notes: 'Initial session conducted upon enrollment.',
  });

  // 2. Log Session Form State
  const [sessionForm, setSessionForm] = useState({
    session_number: 2,
    session_date: new Date().toISOString().slice(0, 16),
    status: 'completed' as const,
    doctor_id: staffList[0]?.id || '',
    treatment_area: '',
    settings_used: '',
    observations_notes: '',
    aftercare_instructions: 'Avoid direct sunlight for 48h. Apply broad-spectrum SPF 50 every 3 hours.',
    next_recommended_date: '',
    payment_amount: 0,
    payment_method: 'cash' as PaymentMethod,
    payment_notes: '',
  });

  // 3. Record Payment Form State
  const [paymentForm, setPaymentForm] = useState({
    procedure_id: '',
    amount: 0,
    payment_method: 'cash' as PaymentMethod,
    notes: '',
  });

  // Handle treatment selection in new procedure form
  const handleSelectTreatment = (treatmentId: string) => {
    const selected = treatments.find((t) => t.id === treatmentId);
    if (selected) {
      const defaultSessions = 3;
      const calculatedCost = (selected.price || 0) * (defaultSessions > 1 ? defaultSessions * 0.9 : 1);
      const roundedCost = Math.round(calculatedCost);
      const today = new Date();
      today.setDate(today.getDate() + 30);

      setProcForm((prev) => ({
        ...prev,
        treatment_id: treatmentId,
        plan_name: `${selected.name} — ${defaultSessions} Sessions Package`,
        total_sessions: defaultSessions,
        total_cost: roundedCost,
        advance_payment: Math.round(roundedCost / 2),
        next_session_due_date: today.toISOString().split('T')[0],
      }));
    } else {
      setProcForm((prev) => ({ ...prev, treatment_id: '' }));
    }
  };

  // Open Log Session modal prefilled
  const handleOpenLogSession = (proc: any) => {
    setSelectedProcForSession(proc);
    const nextSessionNum = (proc.completed_sessions || 0) + 1;
    const intervalDays = proc.interval_days || 30;
    const nextRecDate = new Date();
    nextRecDate.setDate(nextRecDate.getDate() + intervalDays);

    // Find previous session to copy clinical settings
    const prevSession = proc.sessions && proc.sessions.length > 0 ? proc.sessions[proc.sessions.length - 1] : null;

    setSessionForm({
      session_number: nextSessionNum,
      session_date: new Date().toISOString().slice(0, 16),
      status: 'completed',
      doctor_id: proc.doctor_id || staffList[0]?.id || '',
      treatment_area: prevSession?.treatment_area || 'Standard Area',
      settings_used: prevSession?.settings_used || '',
      observations_notes: `Session ${nextSessionNum} completed. Progress evaluated.`,
      aftercare_instructions: prevSession?.aftercare_instructions || 'Sun protection recommended.',
      next_recommended_date: nextSessionNum < proc.total_sessions ? nextRecDate.toISOString().split('T')[0] : '',
      payment_amount: Math.min(Number(proc.balance_amount) || 0, Math.round((Number(proc.total_cost) || 0) / proc.total_sessions)),
      payment_method: 'cash',
      payment_notes: `Payment for Session #${nextSessionNum}`,
    });
    setShowSessionDialog(true);
  };

  // Open Payment Modal
  const handleOpenPayment = (proc?: any) => {
    const target = proc || procedures.find((p) => Number(p.balance_amount) > 0) || procedures[0];
    if (target) {
      setSelectedProcForPayment(target);
      setPaymentForm({
        procedure_id: target.id,
        amount: Number(target.balance_amount) || 0,
        payment_method: 'cash',
        notes: `Balance clearance for ${target.plan_name}`,
      });
      setShowPaymentDialog(true);
    } else {
      toast.info('No active procedures found.');
    }
  };

  // Submit New Procedure
  const handleCreateProcedure = async () => {
    if (!procForm.plan_name.trim()) {
      toast.error('Please enter a procedure plan name');
      return;
    }
    if (procForm.total_sessions < 1) {
      toast.error('Procedure must have at least 1 session');
      return;
    }

    setSavingProc(true);
    const res = await createPatientProcedure({
      patient_id: patient.id,
      treatment_id: procForm.treatment_id || null,
      plan_name: procForm.plan_name,
      total_sessions: procForm.total_sessions,
      total_cost: procForm.total_cost,
      advance_payment: procForm.advance_payment,
      payment_method: procForm.payment_method,
      interval_days: procForm.interval_days,
      next_session_due_date: procForm.next_session_due_date || null,
      doctor_id: procForm.doctor_id || null,
      notes: procForm.notes,
      log_first_session: procForm.log_first_session,
      first_session_area: procForm.first_session_area,
      first_session_settings: procForm.first_session_settings,
      first_session_notes: procForm.first_session_notes,
    });
    setSavingProc(false);

    if (res.success) {
      toast.success('Procedure plan created successfully!');
      setShowNewProcDialog(false);
      router.refresh();
    } else {
      toast.error(res.error || 'Failed to create procedure');
    }
  };

  // Submit Session Log
  const handleSaveSession = async () => {
    if (!selectedProcForSession) return;
    setSavingSession(true);
    const res = await logProcedureSession({
      procedure_id: selectedProcForSession.id,
      patient_id: patient.id,
      session_number: sessionForm.session_number,
      session_date: new Date(sessionForm.session_date).toISOString(),
      status: sessionForm.status,
      doctor_id: sessionForm.doctor_id || null,
      treatment_area: sessionForm.treatment_area,
      settings_used: sessionForm.settings_used,
      observations_notes: sessionForm.observations_notes,
      aftercare_instructions: sessionForm.aftercare_instructions,
      next_recommended_date: sessionForm.next_recommended_date || null,
      payment_amount: sessionForm.payment_amount,
      payment_method: sessionForm.payment_method,
      payment_notes: sessionForm.payment_notes,
    });
    setSavingSession(false);

    if (res.success) {
      toast.success(`Session #${sessionForm.session_number} recorded successfully!`);
      setShowSessionDialog(false);
      router.refresh();
    } else {
      toast.error(res.error || 'Failed to log session');
    }
  };

  // Submit Payment Record
  const handleSavePayment = async () => {
    if (!paymentForm.procedure_id) {
      toast.error('Select a procedure');
      return;
    }
    if (paymentForm.amount <= 0) {
      toast.error('Enter a valid payment amount greater than 0');
      return;
    }

    setSavingPayment(true);
    const res = await recordProcedurePayment({
      procedure_id: paymentForm.procedure_id,
      patient_id: patient.id,
      amount: paymentForm.amount,
      payment_method: paymentForm.payment_method,
      notes: paymentForm.notes,
    });
    setSavingPayment(false);

    if (res.success) {
      toast.success(`Payment of PKR ${paymentForm.amount} recorded! Receipt: ${res.receiptNumber}`);
      setShowPaymentDialog(false);

      // Offer instant receipt preview
      const targetProc = procedures.find((p) => p.id === paymentForm.procedure_id);
      if (targetProc) {
        setActiveReceiptPrint({
          receiptNumber: res.receiptNumber || 'BSC-PAY-REC',
          amount: paymentForm.amount,
          paymentMethod: paymentForm.payment_method,
          paymentDate: new Date().toISOString(),
          planName: targetProc.plan_name,
          totalCost: targetProc.total_cost,
          balanceRemaining: Math.max(0, targetProc.balance_amount - paymentForm.amount),
          notes: paymentForm.notes,
        });
      }
      router.refresh();
    } else {
      toast.error(res.error || 'Failed to record payment');
    }
  };

  // Status Change
  const handleUpdateStatus = async (procId: string, newStatus: ProcedureStatus) => {
    const res = await updateProcedureStatus(procId, patient.id, newStatus);
    if (res.success) {
      toast.success(`Procedure status changed to ${newStatus}`);
      router.refresh();
    } else {
      toast.error(res.error || 'Failed to update status');
    }
  };

  // Soft Delete Plan
  const handleDeletePlan = async (procId: string) => {
    if (!confirm('Are you sure you want to remove this procedure plan?')) return;
    const res = await deleteProcedurePlan(procId, patient.id);
    if (res.success) {
      toast.success('Procedure plan removed.');
      router.refresh();
    } else {
      toast.error(res.error || 'Failed to remove plan');
    }
  };

  const outstandingBalance = stats?.totalOutstandingBalance || 0;
  const activeProcedures = procedures.filter((p) => p.status === 'active');
  const upcomingDueProcedure = activeProcedures.find((p) => p.next_session_due_date);

  return (
    <div className="space-y-6">
      {/* Dynamic Clinic Alerts Strip (Baqaya / Next Due) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Outstanding Dues Banner */}
        <div
          className={cn(
            'p-4 rounded-2xl border transition-all flex items-center justify-between shadow-xs',
            outstandingBalance > 0
              ? 'bg-rose-50/70 border-rose-200 text-rose-950'
              : 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
          )}
        >
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'h-10 w-10 rounded-xl flex items-center justify-center shrink-0',
                outstandingBalance > 0 ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
              )}
            >
              <CreditCard className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-xs font-bold uppercase tracking-wider">
                  {outstandingBalance > 0 ? 'Pending Procedure Balance (Baqaya)' : 'All Procedure Dues Cleared'}
                </p>
                {outstandingBalance > 0 && (
                  <Badge className="bg-rose-600 text-white text-[10px] px-1.5 py-0 border-0">Action Needed</Badge>
                )}
              </div>
              <p className="text-xl font-black font-serif mt-0.5">
                {formatCurrency(outstandingBalance)}
              </p>
            </div>
          </div>
          {outstandingBalance > 0 && (
            <Button
              size="sm"
              onClick={() => handleOpenPayment()}
              className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-xs text-xs font-semibold h-9 px-3.5"
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Collect Payment
            </Button>
          )}
        </div>

        {/* Next Session Due Notice */}
        <div
          className={cn(
            'p-4 rounded-2xl border transition-all flex items-center justify-between shadow-xs',
            upcomingDueProcedure
              ? 'bg-indigo-50/70 border-indigo-200 text-indigo-950'
              : 'bg-gray-50 border-gray-200 text-gray-700'
          )}
        >
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'h-10 w-10 rounded-xl flex items-center justify-center shrink-0',
                upcomingDueProcedure ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-200 text-gray-600'
              )}
            >
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-indigo-900">
                Next Follow-Up / 2nd Procedure
              </p>
              {upcomingDueProcedure ? (
                <p className="text-sm font-semibold text-indigo-950 mt-0.5">
                  Due: <span className="font-bold underline">{formatDate(upcomingDueProcedure.next_session_due_date!)}</span>
                  <span className="text-xs text-indigo-700 font-normal ml-1.5">
                    ({upcomingDueProcedure.plan_name})
                  </span>
                </p>
              ) : (
                <p className="text-xs text-gray-500 mt-0.5">No upcoming session due dates set.</p>
              )}
            </div>
          </div>
          {upcomingDueProcedure && (
            <Button
              size="sm"
              onClick={() => handleOpenLogSession(upcomingDueProcedure)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs text-xs font-semibold h-9 px-3.5"
            >
              <Activity className="h-3.5 w-3.5 mr-1" />
              Log Session Now
            </Button>
          )}
        </div>
      </div>

      {/* Procedures Header Bar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold text-gray-950 flex items-center gap-2">
            <Layers className="h-5 w-5 text-rose-600" />
            Multi-Session Treatment Plans & Procedures
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Track consecutive clinical procedures (Session 1, Session 2 intervals) and financial ledger.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => setShowNewProcDialog(true)}
            className="bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white rounded-xl shadow-sm h-9 text-xs font-semibold px-4"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Start New Procedure
          </Button>
        </div>
      </div>

      {/* Procedures List */}
      {procedures.length === 0 ? (
        <Card className="border border-dashed border-gray-300 rounded-3xl bg-gray-50/50 p-8 text-center">
          <div className="h-12 w-12 rounded-2xl bg-rose-50 text-rose-600 mx-auto flex items-center justify-center mb-3">
            <Stethoscope className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-gray-900">No Multi-Session Procedures Recorded</h3>
          <p className="text-xs text-gray-500 max-w-md mx-auto mt-1 mb-4">
            Enroll this patient in a treatment plan (e.g. PRP 3 Sessions, Laser Hair Removal, HydraFacial) to log Session 1 and track follow-up intervals.
          </p>
          <Button
            size="sm"
            onClick={() => setShowNewProcDialog(true)}
            className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold"
          >
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Create First Procedure
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {procedures.map((proc) => {
            const isExpanded = expandedProcId === proc.id;
            const progressPercent = Math.min(
              100,
              Math.round(((proc.completed_sessions || 0) / (proc.total_sessions || 1)) * 100)
            );
            const isFullyPaid = Number(proc.balance_amount) <= 0;
            const isCompleted = proc.status === 'completed' || (proc.completed_sessions || 0) >= proc.total_sessions;

            return (
              <Card
                key={proc.id}
                className={cn(
                  'border transition-all duration-200 rounded-2xl sm:rounded-3xl overflow-hidden shadow-xs',
                  proc.status === 'completed'
                    ? 'border-emerald-200 bg-white'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                )}
              >
                {/* Procedure Main Summary Header */}
                <div className="p-5 border-b border-gray-100 bg-gray-50/40">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base font-bold text-gray-950 font-serif">
                          {proc.plan_name}
                        </h3>
                        <Badge
                          className={cn(
                            'text-[10px] font-semibold border-0 px-2 py-0.5 rounded-full',
                            proc.status === 'completed'
                              ? 'bg-emerald-100 text-emerald-800'
                              : proc.status === 'active'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-amber-100 text-amber-800'
                          )}
                        >
                          {proc.status.toUpperCase()}
                        </Badge>
                        <Badge
                          className={cn(
                            'text-[10px] font-semibold border-0 px-2 py-0.5 rounded-full',
                            isFullyPaid ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          )}
                        >
                          {isFullyPaid ? 'PAID' : `BAQAYA: ${formatCurrency(proc.balance_amount)}`}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-gray-500 flex-wrap">
                        <span>Started: {formatDate(proc.created_at)}</span>
                        <span>•</span>
                        <span>Interval: {proc.interval_days || 30} days gap</span>
                        {proc.next_session_due_date && !isCompleted && (
                          <>
                            <span>•</span>
                            <span className="text-indigo-600 font-semibold flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Next Due: {formatDate(proc.next_session_due_date)}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons for this procedure */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {!isCompleted && (
                        <Button
                          size="sm"
                          onClick={() => handleOpenLogSession(proc)}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold h-8 px-3 shadow-2xs"
                        >
                          <Activity className="h-3.5 w-3.5 mr-1.5" />
                          Log Session {(proc.completed_sessions || 0) + 1}
                        </Button>
                      )}

                      {!isFullyPaid && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenPayment(proc)}
                          className="border-rose-300 text-rose-700 hover:bg-rose-50 rounded-xl text-xs font-semibold h-8 px-3"
                        >
                          <CreditCard className="h-3.5 w-3.5 mr-1.5 text-rose-600" />
                          Pay Balance
                        </Button>
                      )}

                      <DropdownMenu>
                        <DropdownMenuTrigger className="inline-flex items-center justify-center rounded-xl p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 border border-gray-200 h-8 w-8 transition-colors">
                          <ChevronDown className="h-4 w-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuItem onClick={() => handleUpdateStatus(proc.id, 'completed')}>
                            <Check className="mr-2 h-4 w-4 text-emerald-600" />
                            Mark Completed
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleUpdateStatus(proc.id, 'paused')}>
                            <Clock className="mr-2 h-4 w-4 text-amber-600" />
                            Pause Treatment
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleUpdateStatus(proc.id, 'active')}>
                            <RefreshCw className="mr-2 h-4 w-4 text-blue-600" />
                            Set Active
                          </DropdownMenuItem>
                          {isAdmin && (
                            <DropdownMenuItem
                              onClick={() => handleDeletePlan(proc.id)}
                              className="text-rose-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete Plan
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setExpandedProcId(isExpanded ? null : proc.id)}
                        className="rounded-xl h-8 text-xs text-gray-600"
                      >
                        {isExpanded ? (
                          <>Hide Details <ChevronUp className="h-3.5 w-3.5 ml-1" /></>
                        ) : (
                          <>View Details <ChevronDown className="h-3.5 w-3.5 ml-1" /></>
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Progress Bar & Financial Breakdown */}
                  <div className="mt-4 pt-3 border-t border-gray-100 grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                    <div className="md:col-span-7 space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-gray-700">
                          Progress: {proc.completed_sessions || 0} of {proc.total_sessions} Sessions Completed
                        </span>
                        <span className="font-bold text-gray-900 font-mono">{progressPercent}%</span>
                      </div>
                      <div className="w-full bg-gray-200 h-2.5 rounded-full overflow-hidden">
                        <div
                          className={cn(
                            'h-full transition-all duration-500 rounded-full',
                            progressPercent === 100
                              ? 'bg-emerald-500'
                              : 'bg-gradient-to-r from-rose-500 to-pink-500'
                          )}
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                    </div>

                    <div className="md:col-span-5 flex items-center justify-between md:justify-end gap-4 text-xs font-medium">
                      <div>
                        <span className="text-gray-400 block text-[10px] uppercase">Total Cost</span>
                        <span className="text-gray-900 font-bold">{formatCurrency(proc.total_cost)}</span>
                      </div>
                      <div className="h-6 w-px bg-gray-200" />
                      <div>
                        <span className="text-emerald-600 block text-[10px] uppercase">Paid</span>
                        <span className="text-emerald-700 font-bold">{formatCurrency(proc.paid_amount)}</span>
                      </div>
                      <div className="h-6 w-px bg-gray-200" />
                      <div>
                        <span className="text-rose-600 block text-[10px] uppercase">Remaining</span>
                        <span className="text-rose-700 font-bold">{formatCurrency(proc.balance_amount)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expanded Session Logs & Details */}
                {isExpanded && (
                  <div className="p-5 space-y-5 bg-white">
                    {/* Clinical Notes / Baseline */}
                    {proc.notes && (
                      <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 text-xs text-gray-700">
                        <span className="font-bold text-gray-900 block mb-0.5">Clinical Goal / Baseline Notes:</span>
                        <p className="whitespace-pre-wrap">{proc.notes}</p>
                      </div>
                    )}

                    {/* Step-by-Step Sessions Log Timeline */}
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3 flex items-center gap-1.5">
                        <Stethoscope className="h-3.5 w-3.5 text-rose-600" />
                        Clinical Sessions History ({proc.sessions?.length || 0})
                      </h4>

                      {(!proc.sessions || proc.sessions.length === 0) ? (
                        <p className="text-xs text-gray-500 italic py-2">
                          No sessions logged yet. Click &quot;Log Session&quot; to register Session #1.
                        </p>
                      ) : (
                        <div className="space-y-3 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-gray-200">
                          {proc.sessions.map((sess, idx) => (
                            <div key={sess.id} className="relative flex items-start gap-3.5 pl-1">
                              {/* Session badge marker */}
                              <div className="h-6 w-6 rounded-full bg-rose-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0 z-10 shadow-xs">
                                {sess.session_number}
                              </div>

                              {/* Card content */}
                              <div className="flex-1 bg-gray-50/70 border border-gray-200 rounded-2xl p-4 space-y-2 hover:bg-gray-50 transition-colors">
                                <div className="flex items-center justify-between flex-wrap gap-2">
                                  <div className="flex items-center gap-2">
                                    <p className="text-sm font-bold text-gray-950">
                                      Session #{sess.session_number}
                                    </p>
                                    <Badge className="bg-emerald-100 text-emerald-800 text-[10px] border-0 px-2">
                                      {sess.status}
                                    </Badge>
                                    {sess.treatment_area && (
                                      <span className="text-xs text-gray-500 font-medium bg-white px-2 py-0.5 rounded-md border border-gray-200">
                                        Area: {sess.treatment_area}
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-xs text-gray-500 font-medium">
                                    {formatDateTime(sess.session_date)}
                                  </span>
                                </div>

                                {/* Machine / Clinical Settings */}
                                {sess.settings_used && (
                                  <div className="p-2.5 rounded-xl bg-blue-50/70 border border-blue-100 text-xs">
                                    <span className="font-bold text-blue-900 block mb-0.5">Parameters / Machine Settings Used:</span>
                                    <p className="font-mono text-blue-950 text-[11px] whitespace-pre-wrap leading-relaxed">
                                      {sess.settings_used}
                                    </p>
                                  </div>
                                )}

                                {/* Doctor observations & notes */}
                                {sess.observations_notes && (
                                  <div className="text-xs text-gray-800">
                                    <span className="font-semibold text-gray-900">Doctor Observations: </span>
                                    <span className="whitespace-pre-wrap">{sess.observations_notes}</span>
                                  </div>
                                )}

                                {/* Aftercare Instructions */}
                                {sess.aftercare_instructions && (
                                  <div className="text-[11px] text-amber-800 bg-amber-50/60 p-2 rounded-lg border border-amber-100">
                                    <span className="font-bold">Aftercare Given: </span>
                                    <span>{sess.aftercare_instructions}</span>
                                  </div>
                                )}

                                {sess.next_recommended_date && (
                                  <div className="pt-1 text-[11px] text-indigo-700 font-medium flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    Next Recommended Session Target: {formatDate(sess.next_recommended_date)}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Linked Payments for this Procedure */}
                    {proc.payments && proc.payments.length > 0 && (
                      <div className="pt-3 border-t border-gray-100">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2 flex items-center gap-1.5">
                          <CreditCard className="h-3.5 w-3.5 text-emerald-600" />
                          Payment Transactions for this Plan ({proc.payments.length})
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                          {proc.payments.map((pay) => (
                            <div key={pay.id} className="p-3 rounded-xl border border-gray-200 bg-white shadow-2xs flex items-center justify-between">
                              <div>
                                <p className="text-xs font-mono font-bold text-gray-900">{pay.receipt_number}</p>
                                <p className="text-[11px] text-gray-500 capitalize">{pay.payment_method} • {formatDate(pay.payment_date)}</p>
                                {pay.notes && <p className="text-[10px] text-gray-400 mt-0.5 truncate">{pay.notes}</p>}
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-bold text-emerald-600 font-serif">{formatCurrency(pay.amount)}</p>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setActiveReceiptPrint({
                                    receiptNumber: pay.receipt_number,
                                    amount: pay.amount,
                                    paymentMethod: pay.payment_method,
                                    paymentDate: pay.payment_date,
                                    planName: proc.plan_name,
                                    totalCost: proc.total_cost,
                                    balanceRemaining: proc.balance_amount,
                                    notes: pay.notes,
                                  })}
                                  className="h-6 px-1.5 text-[10px] text-gray-500 hover:text-emerald-700 hover:bg-emerald-50 rounded"
                                >
                                  <Printer className="h-3 w-3 mr-1" />
                                  Slip
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* ========================================================= */}
      {/* DIALOG 1: Start New Procedure Plan                        */}
      {/* ========================================================= */}
      <Dialog open={showNewProcDialog} onOpenChange={setShowNewProcDialog}>
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-rose-600" />
              Enroll Patient in Treatment Procedure Plan
            </DialogTitle>
            <DialogDescription>
              Create a multi-session clinical procedure package for {patient.name}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            {/* Quick Treatment Select */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Select Base Treatment (Optional preset)</Label>
              <select
                value={procForm.treatment_id}
                onChange={(e) => handleSelectTreatment(e.target.value)}
                className="flex h-10 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:border-rose-500 focus:outline-none"
              >
                <option value="">Choose treatment...</option>
                {treatments.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} {t.price ? `(${formatCurrency(t.price)}/session)` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Plan Name */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Procedure Plan Name *</Label>
              <Input
                placeholder="e.g. PRP Hair Regrowth — 3 Sessions Package"
                value={procForm.plan_name}
                onChange={(e) => setProcForm({ ...procForm, plan_name: e.target.value })}
                className="rounded-xl"
              />
            </div>

            {/* Sessions count & Interval */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Total Planned Sessions *</Label>
                <Input
                  type="number"
                  min="1"
                  max="20"
                  value={procForm.total_sessions}
                  onChange={(e) => setProcForm({ ...procForm, total_sessions: Number(e.target.value) || 1 })}
                  className="rounded-xl font-mono"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Interval Gap (Days)</Label>
                <Input
                  type="number"
                  min="7"
                  max="180"
                  placeholder="30 days / 60 days"
                  value={procForm.interval_days}
                  onChange={(e) => {
                    const days = Number(e.target.value) || 30;
                    const d = new Date();
                    d.setDate(d.getDate() + days);
                    setProcForm({
                      ...procForm,
                      interval_days: days,
                      next_session_due_date: d.toISOString().split('T')[0],
                    });
                  }}
                  className="rounded-xl font-mono"
                />
              </div>
            </div>

            {/* Total Cost & Advance Payment */}
            <div className="grid grid-cols-2 gap-3 p-3 rounded-2xl bg-gray-50 border border-gray-200">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Total Package Cost (PKR) *</Label>
                <Input
                  type="number"
                  min="0"
                  value={procForm.total_cost}
                  onChange={(e) => setProcForm({ ...procForm, total_cost: Number(e.target.value) || 0 })}
                  className="rounded-xl font-mono font-bold text-gray-900 bg-white"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Advance Payment Today (PKR)</Label>
                <Input
                  type="number"
                  min="0"
                  max={procForm.total_cost}
                  value={procForm.advance_payment}
                  onChange={(e) => setProcForm({ ...procForm, advance_payment: Number(e.target.value) || 0 })}
                  className="rounded-xl font-mono font-bold text-emerald-700 bg-white"
                />
              </div>
            </div>

            {/* Advance payment method & doctor */}
            {procForm.advance_payment > 0 && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Payment Method</Label>
                  <select
                    value={procForm.payment_method}
                    onChange={(e) => setProcForm({ ...procForm, payment_method: e.target.value as PaymentMethod })}
                    className="flex h-10 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm"
                  >
                    <option value="cash">Cash</option>
                    <option value="card">Debit/Credit Card</option>
                    <option value="bank_transfer">Bank Transfer</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Attending Doctor / Staff</Label>
                  <select
                    value={procForm.doctor_id}
                    onChange={(e) => setProcForm({ ...procForm, doctor_id: e.target.value })}
                    className="flex h-10 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm"
                  >
                    {staffList.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.role})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Next Due Date Picker */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Next Session Target Due Date (e.g. 1-2 months later)</Label>
              <Input
                type="date"
                value={procForm.next_session_due_date}
                onChange={(e) => setProcForm({ ...procForm, next_session_due_date: e.target.value })}
                className="rounded-xl font-mono"
              />
            </div>

            {/* Toggle: Conduct Session 1 right now */}
            <div className="p-3 rounded-2xl bg-rose-50/70 border border-rose-200 space-y-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={procForm.log_first_session}
                  onChange={(e) => setProcForm({ ...procForm, log_first_session: e.target.checked })}
                  className="rounded text-rose-600 focus:ring-rose-500 h-4 w-4"
                />
                <span className="text-xs font-bold text-rose-950">
                  Conduct & Log Session #1 Immediately (Today&apos;s Visit)
                </span>
              </label>

              {procForm.log_first_session && (
                <div className="space-y-2 pt-1 border-t border-rose-200/60">
                  <div>
                    <Label className="text-[11px] font-semibold text-rose-900">Treatment Area</Label>
                    <Input
                      placeholder="e.g. Full Face, Scalp Vertex, Cheeks"
                      value={procForm.first_session_area}
                      onChange={(e) => setProcForm({ ...procForm, first_session_area: e.target.value })}
                      className="rounded-lg h-8 text-xs bg-white"
                    />
                  </div>
                  <div>
                    <Label className="text-[11px] font-semibold text-rose-900">Machine Settings / Serums Used</Label>
                    <Input
                      placeholder="e.g. 1.5mm needle, 14 J/cm² laser fluence, PRP 6ml"
                      value={procForm.first_session_settings}
                      onChange={(e) => setProcForm({ ...procForm, first_session_settings: e.target.value })}
                      className="rounded-lg h-8 text-xs bg-white font-mono"
                    />
                  </div>
                </div>
              )}
            </div>

            <Button
              onClick={handleCreateProcedure}
              disabled={savingProc}
              className="w-full bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white rounded-xl h-10 font-semibold"
            >
              {savingProc ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving Plan...</>
              ) : (
                'Enroll & Save Procedure Plan'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ========================================================= */}
      {/* DIALOG 2: Log Next Session (Session 2, 3...)              */}
      {/* ========================================================= */}
      <Dialog open={showSessionDialog} onOpenChange={setShowSessionDialog}>
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-indigo-600" />
              Record Session #{sessionForm.session_number} for {selectedProcForSession?.plan_name}
            </DialogTitle>
            <DialogDescription>
              Patient: {patient.name} • Total Plan: {selectedProcForSession?.total_sessions} Sessions
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            {/* Session Date & Doctor */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Session Date & Time</Label>
                <Input
                  type="datetime-local"
                  value={sessionForm.session_date}
                  onChange={(e) => setSessionForm({ ...sessionForm, session_date: e.target.value })}
                  className="rounded-xl font-mono text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Attending Doctor / Staff</Label>
                <select
                  value={sessionForm.doctor_id}
                  onChange={(e) => setSessionForm({ ...sessionForm, doctor_id: e.target.value })}
                  className="flex h-10 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm"
                >
                  {staffList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Treatment Area & Machine Settings */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Treatment Area</Label>
              <Input
                placeholder="e.g. Full Face & Neck, Scalp Crown"
                value={sessionForm.treatment_area}
                onChange={(e) => setSessionForm({ ...sessionForm, treatment_area: e.target.value })}
                className="rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Clinical Parameters & Machine Settings Used</Label>
              <Textarea
                rows={2}
                placeholder="e.g. Laser: 18 J/cm², 30ms pulse, 1064nm YAG. Or Microneedling: 1.5mm needle depth, Vitamin C serum."
                value={sessionForm.settings_used}
                onChange={(e) => setSessionForm({ ...sessionForm, settings_used: e.target.value })}
                className="rounded-xl font-mono text-xs"
              />
            </div>

            {/* Observations & Progress */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Clinical Progress & Observations</Label>
              <Textarea
                rows={2}
                placeholder="Notes on healing, hair density change, erythema, tolerance, etc."
                value={sessionForm.observations_notes}
                onChange={(e) => setSessionForm({ ...sessionForm, observations_notes: e.target.value })}
                className="rounded-xl text-xs"
              />
            </div>

            {/* Aftercare & Next Schedule */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Aftercare Instructions</Label>
                <Input
                  value={sessionForm.aftercare_instructions}
                  onChange={(e) => setSessionForm({ ...sessionForm, aftercare_instructions: e.target.value })}
                  className="rounded-xl text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Next Session Target Date</Label>
                <Input
                  type="date"
                  value={sessionForm.next_recommended_date}
                  onChange={(e) => setSessionForm({ ...sessionForm, next_recommended_date: e.target.value })}
                  className="rounded-xl font-mono text-xs"
                />
              </div>
            </div>

            {/* Payment Collection during this session */}
            <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                  <CreditCard className="h-4 w-4 text-emerald-700" />
                  Collect Payment for this Visit / Remaining Balance
                </span>
                <span className="text-xs font-bold text-gray-700">
                  Current Baqaya: {formatCurrency(selectedProcForSession?.balance_amount || 0)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-[11px] font-semibold text-emerald-900">Payment Amount (PKR)</Label>
                  <Input
                    type="number"
                    min="0"
                    max={Number(selectedProcForSession?.balance_amount) || 999999}
                    value={sessionForm.payment_amount}
                    onChange={(e) => setSessionForm({ ...sessionForm, payment_amount: Number(e.target.value) || 0 })}
                    className="rounded-xl bg-white font-mono font-bold text-emerald-700"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] font-semibold text-emerald-900">Payment Channel</Label>
                  <select
                    value={sessionForm.payment_method}
                    onChange={(e) => setSessionForm({ ...sessionForm, payment_method: e.target.value as PaymentMethod })}
                    className="flex h-10 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm"
                  >
                    <option value="cash">Cash</option>
                    <option value="card">Card</option>
                    <option value="bank_transfer">Bank Transfer</option>
                  </select>
                </div>
              </div>
            </div>

            <Button
              onClick={handleSaveSession}
              disabled={savingSession}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl h-10 font-semibold"
            >
              {savingSession ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving Session #{sessionForm.session_number}...</>
              ) : (
                `Complete & Log Session #${sessionForm.session_number}`
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ========================================================= */}
      {/* DIALOG 3: Record Payment / Balance Clearance              */}
      {/* ========================================================= */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-emerald-600" />
              Receive Procedure Payment
            </DialogTitle>
            <DialogDescription>
              Record cash, card or bank transfer for {patient.name}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Select Procedure Plan</Label>
              <select
                value={paymentForm.procedure_id}
                onChange={(e) => {
                  const target = procedures.find((p) => p.id === e.target.value);
                  setPaymentForm({
                    ...paymentForm,
                    procedure_id: e.target.value,
                    amount: target ? Number(target.balance_amount) || 0 : 0,
                  });
                }}
                className="flex h-10 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm"
              >
                {procedures.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.plan_name} (Baqaya: {formatCurrency(p.balance_amount)})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Payment Amount (PKR) *</Label>
              <Input
                type="number"
                min="100"
                value={paymentForm.amount}
                onChange={(e) => setPaymentForm({ ...paymentForm, amount: Number(e.target.value) || 0 })}
                className="rounded-xl font-mono text-lg font-bold text-emerald-700"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Payment Method</Label>
              <select
                value={paymentForm.payment_method}
                onChange={(e) => setPaymentForm({ ...paymentForm, payment_method: e.target.value as PaymentMethod })}
                className="flex h-10 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm"
              >
                <option value="cash">Cash</option>
                <option value="card">Debit/Credit Card</option>
                <option value="bank_transfer">Bank Transfer</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Notes / Remarks</Label>
              <Input
                placeholder="e.g. Session 2 installment / clearance"
                value={paymentForm.notes}
                onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                className="rounded-xl text-xs"
              />
            </div>

            <Button
              onClick={handleSavePayment}
              disabled={savingPayment}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-10 font-semibold"
            >
              {savingPayment ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Processing...</>
              ) : (
                'Confirm & Issue Payment Receipt'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ========================================================= */}
      {/* DIALOG 4: Printable / Shareable Official Receipt Slip     */}
      {/* ========================================================= */}
      <Dialog open={!!activeReceiptPrint} onOpenChange={(open) => !open && setActiveReceiptPrint(null)}>
        <DialogContent className="sm:max-w-md print:p-0 print:border-0 print:shadow-none">
          <DialogHeader className="print:hidden">
            <DialogTitle>Procedure Payment Receipt</DialogTitle>
            <DialogDescription>Print thermal/A4 receipt or share directly via WhatsApp.</DialogDescription>
          </DialogHeader>

          {activeReceiptPrint && (
            <div className="space-y-4">
              {/* Standalone Printable Slip */}
              <div
                id="printable-procedure-receipt"
                className="p-5 rounded-2xl border border-gray-200 bg-white font-mono text-xs space-y-3"
              >
                {/* Header */}
                <div className="text-center border-b border-gray-200 pb-3">
                  <h3 className="font-serif font-black text-base uppercase tracking-tight text-gray-950 font-sans">
                    Brimish Skin Care & Laser Clinic
                  </h3>
                  <p className="text-[10px] text-gray-500 font-sans mt-0.5">
                    Sami Tower, Ring Road, Peshawar • 0335-6400959
                  </p>
                  <p className="text-[9px] uppercase tracking-widest text-emerald-700 font-bold mt-1">
                    Official Procedure Payment Receipt
                  </p>
                </div>

                {/* Meta */}
                <div className="space-y-1 text-[11px] border-b border-gray-100 pb-2">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Receipt No:</span>
                    <span className="font-bold text-gray-900">{activeReceiptPrint.receiptNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Date & Time:</span>
                    <span>{formatDateTime(activeReceiptPrint.paymentDate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Patient Name:</span>
                    <span className="font-bold text-gray-900">{patient.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Contact:</span>
                    <span>{formatPhone(patient.phone)}</span>
                  </div>
                </div>

                {/* Procedure Breakdown */}
                <div className="space-y-1.5 border-b border-gray-200 pb-2">
                  <div className="flex justify-between font-bold text-gray-950 text-xs">
                    <span>{activeReceiptPrint.planName}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Payment Channel:</span>
                    <span className="uppercase">{activeReceiptPrint.paymentMethod}</span>
                  </div>
                  {activeReceiptPrint.notes && (
                    <div className="flex justify-between text-gray-500 italic text-[10px]">
                      <span>Note:</span>
                      <span>{activeReceiptPrint.notes}</span>
                    </div>
                  )}
                </div>

                {/* Financial Summary */}
                <div className="space-y-1 pt-1 text-xs">
                  <div className="flex justify-between font-black text-emerald-700 text-sm">
                    <span>AMOUNT RECEIVED:</span>
                    <span>{formatCurrency(activeReceiptPrint.amount)}</span>
                  </div>
                  <div className="flex justify-between text-gray-500 text-[11px]">
                    <span>Remaining Balance:</span>
                    <span className={activeReceiptPrint.balanceRemaining > 0 ? 'text-rose-600 font-bold' : 'text-emerald-600'}>
                      {formatCurrency(activeReceiptPrint.balanceRemaining)}
                    </span>
                  </div>
                </div>

                {/* Footer */}
                <div className="pt-3 border-t border-dashed border-gray-300 text-center text-[10px] text-gray-400 font-sans space-y-0.5">
                  <p>Thank you for choosing Brimish Skin Care Clinic.</p>
                  <p>Computer-generated verifiable receipt.</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-2 print:hidden">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const text = `*Assalam-o-Alaikum ${patient.name}*,\nHere is your payment confirmation from *Brimish Skin Care & Laser Clinic*:\n\n• Receipt No: ${activeReceiptPrint.receiptNumber}\n• Procedure: ${activeReceiptPrint.planName}\n• Amount Paid: ${formatCurrency(activeReceiptPrint.amount)}\n• Remaining Balance: ${formatCurrency(activeReceiptPrint.balanceRemaining)}\n• Date: ${formatDateTime(activeReceiptPrint.paymentDate)}\n\nThank you!\nClinic: Sami Tower, Ring Road, Peshawar (0335-6400959)`;
                    window.open(buildWhatsAppLink(patient.phone, text), '_blank');
                  }}
                  className="rounded-xl text-xs border-emerald-300 text-emerald-700 hover:bg-emerald-50 h-9"
                >
                  <MessageCircle className="h-3.5 w-3.5 mr-1.5 text-emerald-600" />
                  WhatsApp Receipt
                </Button>
                <Button
                  size="sm"
                  onClick={() => printReceipt('printable-procedure-receipt', activeReceiptPrint.receiptNumber)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold h-9 px-4"
                >
                  <Printer className="h-3.5 w-3.5 mr-1.5" />
                  Print Receipt / PDF
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
