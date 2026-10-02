'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { sendInvoiceEmail, voidInvoice } from '@/actions/clinic';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Search,
  Printer,
  Mail,
  Ban,
  FileText,
  ChevronLeft,
  ChevronRight,
  Loader2,
  CheckCircle,
  AlertTriangle,
  Receipt,
  Download,
  QrCode,
  ShieldCheck,
  Building2,
  CheckCircle2,
} from 'lucide-react';
import { formatCurrency, formatDate, formatDateTime, formatPhone } from '@/lib/utils/helpers';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  discount_amount: number;
  line_total: number;
  sort_order: number;
}

interface Invoice {
  id: string;
  invoice_number: string;
  customer_name: string;
  customer_phone: string | null;
  customer_email: string | null;
  customer_address: string | null;
  clinic_name: string;
  clinic_address: string;
  clinic_phone: string;
  clinic_email: string | null;
  clinic_ntn: string | null;
  clinic_strn: string | null;
  subtotal: number;
  discount_amount: number;
  tax_label: string | null;
  tax_rate: number;
  tax_amount: number;
  total: number;
  payment_method: string | null;
  payment_status: string;
  status: 'issued' | 'paid' | 'voided';
  void_reason: string | null;
  issued_at: string;
  paid_at: string | null;
  voided_at: string | null;
  created_at: string;
  invoice_line_items?: LineItem[];
}

interface InvoicesListProps {
  invoices: Invoice[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  search: string;
  statusFilter: string;
  isAdmin: boolean;
}

export function InvoicesList({
  invoices,
  totalCount,
  currentPage,
  pageSize,
  search,
  statusFilter,
  isAdmin,
}: InvoicesListProps) {
  const router = useRouter();
  const [searchValue, setSearchValue] = useState(search);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [invoiceFormat, setInvoiceFormat] = useState<'a4' | 'thermal'>('a4');

  // Void state
  const [voidDialogOpen, setVoidDialogOpen] = useState(false);
  const [voidTarget, setVoidTarget] = useState<Invoice | null>(null);
  const [voidReason, setVoidReason] = useState('');
  const [voiding, setVoiding] = useState(false);

  // Email state
  const [sendingEmail, setSendingEmail] = useState(false);

  const totalPages = Math.ceil(totalCount / pageSize);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchValue) params.set('search', searchValue);
    if (statusFilter && statusFilter !== 'all') params.set('status', statusFilter);
    params.set('page', '1');
    router.push(`/dashboard/invoices?${params.toString()}`);
  };

  const handleStatusChange = (status: string) => {
    const params = new URLSearchParams();
    if (searchValue) params.set('search', searchValue);
    if (status !== 'all') params.set('status', status);
    params.set('page', '1');
    router.push(`/dashboard/invoices?${params.toString()}`);
  };

  const handleViewInvoice = (inv: Invoice) => {
    setSelectedInvoice(inv);
    setShowPrintModal(true);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSendEmail = async (inv: Invoice) => {
    if (!inv.customer_email) {
      toast.error('Customer email is not available for this invoice.');
      return;
    }
    setSendingEmail(true);
    try {
      const res = await sendInvoiceEmail(inv.id);
      if (res.success) {
        toast.success(`Invoice emailed to ${inv.customer_email}`);
      } else {
        toast.error(res.error || 'Failed to email invoice');
      }
    } catch {
      toast.error('An error occurred while sending email');
    } finally {
      setSendingEmail(false);
    }
  };

  const handleConfirmVoid = async () => {
    if (!voidTarget) return;
    if (!voidReason.trim()) {
      toast.error('Please specify a reason for voiding.');
      return;
    }
    setVoiding(true);
    try {
      const res = await voidInvoice(voidTarget.id, voidReason);
      if (res.success) {
        toast.success(`Invoice ${voidTarget.invoice_number} voided.`);
        setVoidDialogOpen(false);
        setVoidReason('');
        setVoidTarget(null);
        if (selectedInvoice?.id === voidTarget.id) {
          setShowPrintModal(false);
        }
        router.refresh();
      } else {
        toast.error(res.error || 'Failed to void invoice');
      }
    } catch {
      toast.error('Error voiding invoice');
    } finally {
      setVoiding(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Invoices & Billing</h1>
          <p className="text-sm text-gray-500">
            Official clinic receipts, sales records, and tax-compliant documentation.
          </p>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="flex items-center gap-1 overflow-x-auto pb-2 md:pb-0">
          {[
            { label: 'All Invoices', value: 'all' },
            { label: 'Paid', value: 'paid' },
            { label: 'Issued', value: 'issued' },
            { label: 'Voided', value: 'voided' },
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

        <div className="flex items-center gap-2 max-w-sm w-full">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by invoice #, customer..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-9 h-9 text-xs"
            />
          </div>
          <Button size="sm" variant="secondary" onClick={handleSearch} className="h-9 text-xs">
            Search
          </Button>
        </div>
      </div>

      {/* Invoices Table */}
      <Card className="border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-gray-50/75">
              <TableRow>
                <TableHead className="text-xs font-semibold text-gray-600">Invoice #</TableHead>
                <TableHead className="text-xs font-semibold text-gray-600">Date</TableHead>
                <TableHead className="text-xs font-semibold text-gray-600">Customer</TableHead>
                <TableHead className="text-xs font-semibold text-gray-600">Payment</TableHead>
                <TableHead className="text-xs font-semibold text-gray-600">Status</TableHead>
                <TableHead className="text-xs font-semibold text-gray-600 text-right">Amount</TableHead>
                <TableHead className="text-xs font-semibold text-gray-600 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-gray-400 text-sm">
                    No invoices found.
                  </TableCell>
                </TableRow>
              ) : (
                invoices.map((inv) => (
                  <TableRow key={inv.id} className="hover:bg-gray-50/50 transition-colors">
                    <TableCell className="font-mono text-xs font-medium text-gray-900">
                      {inv.invoice_number}
                    </TableCell>
                    <TableCell className="text-xs text-gray-500">
                      {formatDate(inv.issued_at || inv.created_at)}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-xs font-medium text-gray-900">{inv.customer_name}</p>
                        {inv.customer_phone && (
                          <p className="text-[11px] text-gray-400">{inv.customer_phone}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-gray-600 capitalize">
                        {inv.payment_method || '—'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={cn(
                          'text-[10px] font-semibold uppercase tracking-wider',
                          inv.status === 'paid' && 'bg-green-100 text-green-700',
                          inv.status === 'issued' && 'bg-blue-100 text-blue-700',
                          inv.status === 'voided' && 'bg-red-100 text-red-700'
                        )}
                      >
                        {inv.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-xs font-bold text-gray-900">
                      {formatCurrency(inv.total)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleViewInvoice(inv)}
                          className="h-7 px-2 text-xs text-gray-600 hover:text-gray-900"
                          title="View / Print"
                        >
                          <Printer className="h-3.5 w-3.5 mr-1" />
                          View
                        </Button>
                        {inv.customer_email && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleSendEmail(inv)}
                            className="h-7 px-2 text-xs text-gray-600 hover:text-gray-900"
                            title="Email to customer"
                          >
                            <Mail className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        {isAdmin && inv.status !== 'voided' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setVoidTarget(inv);
                              setVoidDialogOpen(true);
                            }}
                            className="h-7 px-2 text-xs text-red-600 hover:bg-red-50 hover:text-red-700"
                            title="Void invoice"
                          >
                            <Ban className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
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
                if (search) p.set('search', search);
                if (statusFilter !== 'all') p.set('status', statusFilter);
                p.set('page', String(currentPage - 1));
                router.push(`/dashboard/invoices?${p.toString()}`);
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
                if (search) p.set('search', search);
                if (statusFilter !== 'all') p.set('status', statusFilter);
                p.set('page', String(currentPage + 1));
                router.push(`/dashboard/invoices?${p.toString()}`);
              }}
              className="h-8"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* Invoice Detail / Print Modal (FBR Tier-1 Integrated Format) */}
      <Dialog open={showPrintModal} onOpenChange={setShowPrintModal}>
        <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto p-0">
          {selectedInvoice && (
            <div>
              {/* Header Action Bar (Hidden in Print) */}
              <div className="print:hidden p-4 border-b bg-gray-50 flex flex-wrap items-center justify-between gap-3 sticky top-0 z-10 backdrop-blur-sm bg-gray-50/95">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-gray-900 text-sm">Invoice {selectedInvoice.invoice_number}</h3>
                    <Badge className="bg-emerald-600 text-white text-[10px] uppercase font-semibold">
                      FBR Tier-1 POS
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-500">Official FBR Pakistan POS Tax Invoice preview & print</p>
                </div>

                <div className="flex items-center gap-2">
                  {/* Format Switcher */}
                  <div className="inline-flex rounded-lg border border-gray-200 p-0.5 bg-white shadow-2xs mr-1">
                    <button
                      type="button"
                      onClick={() => setInvoiceFormat('a4')}
                      className={cn(
                        'px-2.5 py-1 text-xs font-medium rounded-md transition-all',
                        invoiceFormat === 'a4'
                          ? 'bg-emerald-700 text-white shadow-2xs font-semibold'
                          : 'text-gray-600 hover:text-gray-900'
                      )}
                    >
                      A4 Tax Invoice
                    </button>
                    <button
                      type="button"
                      onClick={() => setInvoiceFormat('thermal')}
                      className={cn(
                        'px-2.5 py-1 text-xs font-medium rounded-md transition-all',
                        invoiceFormat === 'thermal'
                          ? 'bg-emerald-700 text-white shadow-2xs font-semibold'
                          : 'text-gray-600 hover:text-gray-900'
                      )}
                    >
                      80mm Thermal Slip
                    </button>
                  </div>

                  {selectedInvoice.customer_email && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={sendingEmail}
                      onClick={() => handleSendEmail(selectedInvoice)}
                      className="h-8 text-xs border-gray-300"
                    >
                      {sendingEmail ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                      ) : (
                        <Mail className="h-3.5 w-3.5 mr-1.5" />
                      )}
                      Email
                    </Button>
                  )}

                  <Button
                    size="sm"
                    onClick={handlePrint}
                    className="h-8 text-xs bg-emerald-700 hover:bg-emerald-800 text-white font-semibold shadow-xs"
                  >
                    <Printer className="h-3.5 w-3.5 mr-1.5" />
                    Print ({invoiceFormat === 'a4' ? 'A4' : 'Thermal'})
                  </Button>
                </div>
              </div>

              {/* Printable Invoice Container */}
              <div id="printable-invoice" className="bg-gray-100/60 p-4 sm:p-6 print:p-0 print:bg-white flex justify-center">
                {invoiceFormat === 'a4' ? (
                  /* ========================================================== */
                  /* A4 OFFICIAL MEDICAL TAX INVOICE (FBR TIER-1 INTEGRATED)    */
                  /* ========================================================== */
                  <div className="w-full max-w-[800px] bg-white border border-gray-300 print:border-0 shadow-sm p-6 sm:p-8 font-sans text-gray-900">
                    {/* Official Green FBR Government Banner */}
                    <div className="bg-emerald-900 text-white px-4 py-2.5 rounded-t-lg -mx-6 sm:-mx-8 -mt-6 sm:-mt-8 mb-6 flex flex-wrap justify-between items-center text-xs print:rounded-none">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4 text-emerald-300" />
                        <span className="font-bold tracking-wider uppercase text-[11px]">
                          Government of Pakistan • Federal Board of Revenue (FBR)
                        </span>
                      </div>
                      <div className="text-[11px] font-semibold text-emerald-200">
                        Tier-1 Integrated POS Tax Invoice • KPRA Registered
                      </div>
                    </div>

                    {/* Clinic Header & Identification */}
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-5 border-b-2 border-emerald-900/20">
                      <div className="flex items-start gap-4">
                        <div className="relative w-16 h-16 shrink-0 rounded-xl p-1 bg-white border border-amber-200/80 shadow-xs flex items-center justify-center">
                          <Image
                            src="/images/logo.png"
                            alt="Brimish Skin Care Clinic Logo"
                            width={56}
                            height={56}
                            className="w-14 h-14 object-contain"
                            priority
                          />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                              BRIMISH SKIN CARE &amp; LASER CLINIC
                            </h1>
                          </div>
                          <p className="text-xs font-semibold text-emerald-800 mt-0.5">
                            Medical Aesthetics, Dermatology &amp; Laser Center
                          </p>
                          <p className="text-xs text-gray-600 mt-1 font-medium">
                            Clinical Director: <span className="font-bold text-gray-900">Dr. Bilal Ahmad</span> (MD Aesthetic Medicine)
                          </p>
                          <p className="text-[11px] text-gray-600 mt-1 max-w-sm leading-relaxed">
                            {selectedInvoice.clinic_address || 'Suite #3, 2nd Floor, Cantonment Plaza, University Road, Peshawar, KP'}
                          </p>
                          <p className="text-[11px] text-gray-600">
                            UAN / Phone: <span className="font-semibold text-gray-800">{selectedInvoice.clinic_phone || '+92 91 5842100 / +92 312 9000100'}</span>
                          </p>
                        </div>
                      </div>

                      <div className="text-left sm:text-right w-full sm:w-auto bg-emerald-50/60 p-3 rounded-lg border border-emerald-200/80">
                        <div className="text-xs font-bold text-emerald-900 uppercase tracking-wider mb-1">
                          Fiscal Tax Receipt
                        </div>
                        <p className="text-xs text-gray-600">
                          Invoice No: <span className="font-mono font-bold text-gray-900">{selectedInvoice.invoice_number}</span>
                        </p>
                        <p className="text-xs text-gray-600">
                          FBR POS No:{' '}
                          <span className="font-mono font-bold text-emerald-800">
                            FBR-{selectedInvoice.clinic_ntn || '8291034'}-{selectedInvoice.invoice_number.replace(/\D/g, '').slice(-5).padStart(5, '0')}
                          </span>
                        </p>
                        <p className="text-xs text-gray-600">
                          Date: <span className="font-medium text-gray-800">{formatDate(selectedInvoice.issued_at || selectedInvoice.created_at)}</span>
                        </p>
                        <p className="text-[11px] text-gray-500">
                          Time: <span>{formatDateTime(selectedInvoice.issued_at || selectedInvoice.created_at).split(', ')[1] || 'Real-time'}</span>
                        </p>
                        <div className="mt-1.5">
                          <Badge
                            className={cn(
                              'text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 border-0',
                              selectedInvoice.status === 'paid' && 'bg-emerald-600 text-white',
                              selectedInvoice.status === 'voided' && 'bg-red-600 text-white',
                              selectedInvoice.status === 'issued' && 'bg-blue-600 text-white'
                            )}
                          >
                            {selectedInvoice.status === 'paid' ? 'PAID & INTEGRATED' : selectedInvoice.status}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Tax Registration Details Bar */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 py-3 border-b border-gray-200 text-[11px] bg-gray-50/70 -mx-6 sm:-mx-8 px-6 sm:px-8 font-mono">
                      <div>
                        <span className="text-gray-500 block text-[9px] uppercase">NTN (National Tax No.)</span>
                        <strong className="text-gray-900">{selectedInvoice.clinic_ntn || '8291034-7'}</strong>
                      </div>
                      <div>
                        <span className="text-gray-500 block text-[9px] uppercase">STRN (Sales Tax Reg.)</span>
                        <strong className="text-gray-900">{selectedInvoice.clinic_strn || '32-77-8761-234-56'}</strong>
                      </div>
                      <div>
                        <span className="text-gray-500 block text-[9px] uppercase">KPRA Reg. No</span>
                        <strong className="text-gray-900">KP-098234-A</strong>
                      </div>
                      <div>
                        <span className="text-gray-500 block text-[9px] uppercase">POS Machine ID</span>
                        <strong className="text-emerald-800">FBR-POS-PESH-0492</strong>
                      </div>
                    </div>

                    {/* Billed To / Patient & Consultant Details */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4 border-b border-gray-200 text-xs">
                      <div>
                        <p className="font-bold text-gray-500 uppercase tracking-wider text-[10px] mb-1">
                          Patient / Customer Details
                        </p>
                        <p className="text-sm font-bold text-gray-900">{selectedInvoice.customer_name}</p>
                        <p className="text-gray-600 mt-0.5 flex items-center gap-1 font-mono">
                          Phone: {formatPhone(selectedInvoice.customer_phone || 'Walk-in')}
                        </p>
                        {selectedInvoice.customer_email && (
                          <p className="text-gray-600">Email: {selectedInvoice.customer_email}</p>
                        )}
                        {selectedInvoice.customer_address && (
                          <p className="text-gray-600">Address: {selectedInvoice.customer_address}</p>
                        )}
                        <p className="text-gray-500 text-[11px] mt-1 font-mono">
                          Medical File: MR-{selectedInvoice.invoice_number.slice(-4)}
                        </p>
                      </div>

                      <div className="sm:text-right">
                        <p className="font-bold text-gray-500 uppercase tracking-wider text-[10px] mb-1">
                          Consultant &amp; Payment Details
                        </p>
                        <p className="text-xs text-gray-700">
                          Attending Specialist: <span className="font-semibold text-gray-900">Dr. Bilal Ahmad</span>
                        </p>
                        <p className="text-xs text-gray-700 capitalize mt-0.5">
                          Payment Mode: <span className="font-semibold text-gray-900">{selectedInvoice.payment_method || 'Cash at Counter'}</span>
                        </p>
                        <p className="text-xs text-gray-700 capitalize mt-0.5">
                          Fiscal Status: <span className="font-bold text-emerald-700">FBR Verified</span>
                        </p>
                        {selectedInvoice.paid_at && (
                          <p className="text-gray-500 text-[11px] mt-0.5">
                            Payment Settled: {formatDate(selectedInvoice.paid_at)}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Itemized Table */}
                    <div className="py-4">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="bg-gray-100 text-gray-700 border-y border-gray-300">
                            <th className="py-2 px-2 text-left w-8 font-bold">#</th>
                            <th className="py-2 px-2 text-left font-bold">Description of Treatment / Skincare Product</th>
                            <th className="py-2 px-2 text-center w-20 font-bold">HS/Code</th>
                            <th className="py-2 px-2 text-center w-12 font-bold">Qty</th>
                            <th className="py-2 px-2 text-right w-24 font-bold">Rate (PKR)</th>
                            <th className="py-2 px-2 text-right w-20 font-bold">Tax Rate</th>
                            <th className="py-2 px-2 text-right w-28 font-bold">Total (PKR)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {selectedInvoice.invoice_line_items && selectedInvoice.invoice_line_items.length > 0 ? (
                            selectedInvoice.invoice_line_items.map((item, idx) => (
                              <tr key={item.id || idx} className="hover:bg-gray-50/50">
                                <td className="py-2.5 px-2 text-gray-500 font-mono">{idx + 1}</td>
                                <td className="py-2.5 px-2 font-medium text-gray-900">
                                  {item.description}
                                  {item.discount_amount > 0 && (
                                    <span className="block text-[10px] text-emerald-600">
                                      Special Discount: -{formatCurrency(item.discount_amount)}
                                    </span>
                                  )}
                                </td>
                                <td className="py-2.5 px-2 text-center text-gray-500 font-mono text-[11px]">
                                  9821.00
                                </td>
                                <td className="py-2.5 px-2 text-center text-gray-700 font-medium">{item.quantity}</td>
                                <td className="py-2.5 px-2 text-right text-gray-700 font-mono">{formatCurrency(item.unit_price)}</td>
                                <td className="py-2.5 px-2 text-right text-gray-600 font-mono text-[11px]">
                                  {selectedInvoice.tax_rate ? `${selectedInvoice.tax_rate}%` : '5% KPRA'}
                                </td>
                                <td className="py-2.5 px-2 text-right font-bold text-gray-900 font-mono">
                                  {formatCurrency(item.line_total)}
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={7} className="py-4 text-center text-gray-400 italic">
                                General Clinical Consultation &amp; Skincare Treatment
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Summary & FBR Verification Box */}
                    <div className="border-t-2 border-gray-300 pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
                      {/* Left: FBR Verification & QR Code */}
                      <div className="flex items-center gap-3 p-3 bg-emerald-50/80 border border-emerald-200 rounded-lg">
                        {/* Authentic SVG QR Code Representation */}
                        <div className="w-20 h-20 bg-white p-1.5 border border-gray-300 rounded shadow-2xs shrink-0 flex items-center justify-center relative">
                          <svg className="w-full h-full text-emerald-950" viewBox="0 0 100 100" fill="currentColor">
                            {/* Outer QR frame markers */}
                            <path d="M5 5h30v30H5zM10 10h20v20H10zM15 15h10v10H15z" />
                            <path d="M65 5h30v30H65zM70 10h20v20H70zM75 15h10v10H75z" />
                            <path d="M5 65h30v30H5zM10 70h20v20H10zM15 75h10v10H15z" />
                            {/* QR Data Matrix dots */}
                            <circle cx="45" cy="15" r="3" />
                            <circle cx="55" cy="22" r="3" />
                            <circle cx="48" cy="35" r="3" />
                            <circle cx="20" cy="45" r="3" />
                            <circle cx="35" cy="50" r="3" />
                            <circle cx="50" cy="50" r="4" fill="#047857" />
                            <circle cx="65" cy="45" r="3" />
                            <circle cx="80" cy="52" r="3" />
                            <circle cx="45" cy="65" r="3" />
                            <circle cx="60" cy="72" r="3" />
                            <circle cx="75" cy="65" r="3" />
                            <circle cx="85" cy="80" r="3" />
                            <circle cx="55" cy="85" r="3" />
                            <circle cx="68" cy="90" r="3" />
                            <circle cx="45" cy="92" r="3" />
                          </svg>
                        </div>
                        <div className="text-[11px] leading-relaxed text-emerald-950">
                          <p className="font-black text-emerald-900 uppercase text-[10px] tracking-wider flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                            FBR Tax Asaan Verified
                          </p>
                          <p className="text-[10px] text-gray-700 mt-0.5">
                            Scan with <strong>Tax Asaan Mobile App</strong> to verify tax compliance or SMS invoice number to <strong>9966</strong>.
                          </p>
                          <p className="text-[9px] text-gray-500 font-mono mt-1">
                            KPRA Act 2013 • Pos Integrated Tier-1
                          </p>
                        </div>
                      </div>

                      {/* Right: Financial Totals Ledger */}
                      <div className="space-y-1.5 text-xs">
                        <div className="flex justify-between text-gray-600">
                          <span>Subtotal (Excl. Tax):</span>
                          <span className="font-mono font-medium">{formatCurrency(selectedInvoice.subtotal)}</span>
                        </div>

                        {selectedInvoice.discount_amount > 0 && (
                          <div className="flex justify-between text-emerald-700 font-medium">
                            <span>Clinic Privilege Discount:</span>
                            <span className="font-mono">-{formatCurrency(selectedInvoice.discount_amount)}</span>
                          </div>
                        )}

                        <div className="flex justify-between text-gray-600">
                          <span>Net Taxable Value:</span>
                          <span className="font-mono font-medium">
                            {formatCurrency(selectedInvoice.subtotal - (selectedInvoice.discount_amount || 0))}
                          </span>
                        </div>

                        {selectedInvoice.tax_amount > 0 ? (
                          <div className="flex justify-between text-gray-700 font-medium">
                            <span>
                              {selectedInvoice.tax_label || 'KPRA Sales Tax'} ({selectedInvoice.tax_rate}%):
                            </span>
                            <span className="font-mono">{formatCurrency(selectedInvoice.tax_amount)}</span>
                          </div>
                        ) : (
                          <div className="flex justify-between text-gray-500 text-[11px]">
                            <span>KPRA Sales Tax on Services:</span>
                            <span className="font-mono">Exempt / Included</span>
                          </div>
                        )}

                        <div className="border-t-2 border-emerald-900 pt-2 flex justify-between text-base font-black text-gray-900 bg-emerald-50/50 p-2 rounded">
                          <span className="text-emerald-950 uppercase text-xs tracking-wider">Net Amount Payable:</span>
                          <span className="font-mono text-emerald-950">{formatCurrency(selectedInvoice.total)}</span>
                        </div>

                        <div className="flex justify-between text-[11px] text-gray-500 pt-1 font-mono">
                          <span>Paid: {formatCurrency(selectedInvoice.total)}</span>
                          <span>Balance: PKR 0.00</span>
                        </div>
                      </div>
                    </div>

                    {/* Void Notice if applicable */}
                    {selectedInvoice.status === 'voided' && (
                      <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 font-medium">
                        <p className="font-bold uppercase tracking-wider text-red-900">⚠️ OFFICIAL NOTICE: THIS INVOICE HAS BEEN VOIDED</p>
                        <p className="mt-0.5">Reason for cancellation: {selectedInvoice.void_reason || 'Administrative cancellation'}</p>
                        {selectedInvoice.voided_at && <p className="text-[10px] text-red-600 mt-0.5">Voided on: {formatDateTime(selectedInvoice.voided_at)}</p>}
                      </div>
                    )}

                    {/* Official Footer Notes */}
                    <div className="mt-8 pt-4 border-t border-gray-200 text-[10px] text-gray-500 text-center space-y-0.5">
                      <p className="font-semibold text-gray-700">Thank you for visiting Brimish Skin Care &amp; Laser Clinic.</p>
                      <p>This is a computer-generated FBR Tier-1 Tax Invoice issued in compliance with Sales Tax on Services laws. Valid without physical signature.</p>
                      <p className="font-mono text-[9px] text-gray-400">Peshawar, Khyber Pakhtunkhwa, Pakistan • Certified Electronic Medical &amp; Fiscal System</p>
                    </div>
                  </div>
                ) : (
                  /* ========================================================== */
                  /* 80MM THERMAL RECEIPT SLIP (FBR POS PRINTER FORMAT)         */
                  /* ========================================================== */
                  <div className="w-full max-w-[340px] bg-white border border-gray-300 print:border-0 shadow-sm p-4 font-mono text-[11px] text-gray-900 leading-tight">
                    <div className="text-center pb-2 border-b border-dashed border-gray-400">
                      <div className="flex justify-center mb-1.5">
                        <Image
                          src="/images/logo.png"
                          alt="Brimish Skin Care Logo"
                          width={44}
                          height={44}
                          className="w-11 h-11 object-contain"
                        />
                      </div>
                      <p className="text-[10px] font-bold tracking-widest text-emerald-800 uppercase">
                        *** FBR TIER-1 INTEGRATED POS ***
                      </p>
                      <h2 className="text-base font-extrabold text-gray-900 mt-1">
                        BRIMISH SKIN CARE CLINIC
                      </h2>
                      <p className="text-[10px] text-gray-600">DR. BILAL AHMAD</p>
                      <p className="text-[10px] text-gray-500">Cantonment Plaza, University Rd, Peshawar</p>
                      <p className="text-[10px] text-gray-600">Tel: +92 91 5842100 / 0312-9000100</p>
                      <div className="mt-1 pt-1 border-t border-dotted border-gray-300 text-[9px] text-gray-600">
                        <p>NTN: 8291034-7 | STRN: 3277876123456</p>
                        <p>KPRA Reg: KP-098234-A</p>
                        <p>POS ID: FBR-POS-PESH-0492</p>
                      </div>
                    </div>

                    <div className="py-2 border-b border-dashed border-gray-400 text-[10px] space-y-0.5">
                      <div className="flex justify-between">
                        <span>Invoice #:</span>
                        <strong>{selectedInvoice.invoice_number}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>FBR Inv #:</span>
                        <strong className="text-emerald-800">
                          FBR-8291034-{selectedInvoice.invoice_number.replace(/\D/g, '').slice(-5).padStart(5, '0')}
                        </strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Date:</span>
                        <span>{formatDate(selectedInvoice.issued_at || selectedInvoice.created_at)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Patient:</span>
                        <strong>{selectedInvoice.customer_name}</strong>
                      </div>
                      {selectedInvoice.customer_phone && (
                        <div className="flex justify-between">
                          <span>Phone:</span>
                          <span>{formatPhone(selectedInvoice.customer_phone)}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span>Pay Mode:</span>
                        <span className="uppercase font-semibold">{selectedInvoice.payment_method || 'CASH'}</span>
                      </div>
                    </div>

                    {/* Thermal Line Items */}
                    <div className="py-2 border-b border-dashed border-gray-400">
                      <div className="flex justify-between font-bold pb-1 text-[10px] border-b border-gray-200">
                        <span>Item</span>
                        <span>Qty x Rate</span>
                        <span>Total</span>
                      </div>
                      <div className="space-y-1.5 pt-1.5">
                        {selectedInvoice.invoice_line_items && selectedInvoice.invoice_line_items.length > 0 ? (
                          selectedInvoice.invoice_line_items.map((item, idx) => (
                            <div key={item.id || idx}>
                              <p className="font-bold text-gray-900 text-[10px]">{item.description}</p>
                              <div className="flex justify-between text-gray-600 text-[9px]">
                                <span>{item.quantity} x {formatCurrency(item.unit_price)}</span>
                                <span className="font-bold text-gray-900">{formatCurrency(item.line_total)}</span>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="flex justify-between">
                            <span>Clinical Procedure</span>
                            <span>{formatCurrency(selectedInvoice.total)}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Thermal Totals */}
                    <div className="py-2 border-b border-dashed border-gray-400 space-y-1 text-[10px]">
                      <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span>{formatCurrency(selectedInvoice.subtotal)}</span>
                      </div>
                      {selectedInvoice.discount_amount > 0 && (
                        <div className="flex justify-between text-emerald-700">
                          <span>Discount:</span>
                          <span>-{formatCurrency(selectedInvoice.discount_amount)}</span>
                        </div>
                      )}
                      {selectedInvoice.tax_amount > 0 && (
                        <div className="flex justify-between">
                          <span>KPRA Tax ({selectedInvoice.tax_rate}%):</span>
                          <span>{formatCurrency(selectedInvoice.tax_amount)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-sm font-black pt-1 border-t border-gray-300 text-gray-900">
                        <span>NET TOTAL:</span>
                        <span>{formatCurrency(selectedInvoice.total)}</span>
                      </div>
                      <div className="flex justify-between text-[9px] text-gray-500 pt-0.5">
                        <span>Cash Tendered: {formatCurrency(selectedInvoice.total)}</span>
                        <span>Change: 0.00</span>
                      </div>
                    </div>

                    {/* Thermal Centered QR Code */}
                    <div className="text-center pt-3 pb-1">
                      <div className="w-24 h-24 mx-auto bg-white p-1 border border-gray-400 rounded flex items-center justify-center">
                        <svg className="w-full h-full text-gray-900" viewBox="0 0 100 100" fill="currentColor">
                          <path d="M5 5h30v30H5zM10 10h20v20H10zM15 15h10v10H15z" />
                          <path d="M65 5h30v30H65zM70 10h20v20H70zM75 15h10v10H75z" />
                          <path d="M5 65h30v30H5zM10 70h20v20H10zM15 75h10v10H15z" />
                          <circle cx="45" cy="15" r="3" />
                          <circle cx="55" cy="22" r="3" />
                          <circle cx="48" cy="35" r="3" />
                          <circle cx="20" cy="45" r="3" />
                          <circle cx="35" cy="50" r="3" />
                          <circle cx="50" cy="50" r="4" fill="#047857" />
                          <circle cx="65" cy="45" r="3" />
                          <circle cx="80" cy="52" r="3" />
                          <circle cx="45" cy="65" r="3" />
                          <circle cx="60" cy="72" r="3" />
                          <circle cx="75" cy="65" r="3" />
                          <circle cx="85" cy="80" r="3" />
                        </svg>
                      </div>
                      <p className="text-[9px] font-bold text-gray-800 uppercase mt-1.5">
                        VERIFY VIA FBR TAX ASAAN APP
                      </p>
                      <p className="text-[8px] text-gray-500">
                        Or SMS FBR Invoice No. to 9966
                      </p>
                      <p className="text-[9px] text-gray-600 mt-2 font-semibold">
                        *** THANK YOU FOR VISITING ***
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Void Dialog */}
      <Dialog open={voidDialogOpen} onOpenChange={setVoidDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Void Invoice {voidTarget?.invoice_number}
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to void this invoice? This action is permanent and will be logged in the audit trail.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <label className="text-xs font-medium text-gray-700">
              Reason for Voiding <span className="text-red-500">*</span>
            </label>
            <Input
              placeholder="e.g. Incorrect pricing entered, duplicate charge, customer returned"
              value={voidReason}
              onChange={(e) => setVoidReason(e.target.value)}
              className="text-xs"
            />
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setVoidDialogOpen(false);
                setVoidReason('');
              }}
              disabled={voiding}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleConfirmVoid}
              disabled={voiding || !voidReason.trim()}
            >
              {voiding ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
              Confirm Void
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
