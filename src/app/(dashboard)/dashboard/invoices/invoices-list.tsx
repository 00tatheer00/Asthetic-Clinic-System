'use client';

import { useState } from 'react';
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
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils/helpers';
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

      {/* Invoice Detail / Print Modal */}
      <Dialog open={showPrintModal} onOpenChange={setShowPrintModal}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0">
          {selectedInvoice && (
            <div>
              {/* Header Action Bar (Hidden in Print) */}
              <div className="print:hidden p-4 border-b bg-gray-50 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">Invoice {selectedInvoice.invoice_number}</h3>
                  <p className="text-xs text-gray-500">Preview and print official receipt</p>
                </div>
                <div className="flex items-center gap-2">
                  {selectedInvoice.customer_email && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={sendingEmail}
                      onClick={() => handleSendEmail(selectedInvoice)}
                      className="h-8 text-xs"
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
                    className="h-8 text-xs bg-rose-600 hover:bg-rose-700 text-white"
                  >
                    <Printer className="h-3.5 w-3.5 mr-1.5" />
                    Print Invoice
                  </Button>
                </div>
              </div>

              {/* Printable Invoice Container */}
              <div id="printable-invoice" className="p-8 font-sans text-gray-800 bg-white">
                {/* Invoice Top Header */}
                <div className="flex justify-between items-start border-b pb-6">
                  <div>
                    <h2 className="text-2xl font-extrabold text-rose-600 tracking-tight">
                      {selectedInvoice.clinic_name || 'Brimish Skin Care'}
                    </h2>
                    <p className="text-xs text-gray-500 mt-1">Medical Aesthetics & Laser Center</p>
                    <p className="text-xs text-gray-600 mt-2 whitespace-pre-line leading-relaxed">
                      {selectedInvoice.clinic_address || 'Peshawar, Pakistan'}
                    </p>
                    <p className="text-xs text-gray-600">Phone: {selectedInvoice.clinic_phone || '+92 300 0000000'}</p>
                    {selectedInvoice.clinic_email && (
                      <p className="text-xs text-gray-600">Email: {selectedInvoice.clinic_email}</p>
                    )}
                    {selectedInvoice.clinic_ntn && (
                      <p className="text-[11px] text-gray-500 font-mono mt-1">
                        NTN: {selectedInvoice.clinic_ntn}
                        {selectedInvoice.clinic_strn && ` | STRN: ${selectedInvoice.clinic_strn}`}
                      </p>
                    )}
                  </div>

                  <div className="text-right">
                    <div className="inline-block bg-gray-100 rounded-lg px-3 py-1 mb-2">
                      <span className="font-mono text-sm font-bold text-gray-900">
                        {selectedInvoice.invoice_number}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">
                      Date: <span className="font-medium text-gray-800">{formatDate(selectedInvoice.issued_at || selectedInvoice.created_at)}</span>
                    </p>
                    <div className="mt-2">
                      <Badge
                        variant="outline"
                        className={cn(
                          'text-xs uppercase font-bold tracking-wider',
                          selectedInvoice.status === 'paid' && 'border-green-500 text-green-600 bg-green-50',
                          selectedInvoice.status === 'voided' && 'border-red-500 text-red-600 bg-red-50',
                          selectedInvoice.status === 'issued' && 'border-blue-500 text-blue-600 bg-blue-50'
                        )}
                      >
                        {selectedInvoice.status}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Billed To */}
                <div className="grid grid-cols-2 gap-6 py-6 border-b text-xs">
                  <div>
                    <p className="font-semibold text-gray-400 uppercase tracking-wider text-[10px] mb-1">
                      Patient / Customer
                    </p>
                    <p className="font-bold text-sm text-gray-900">{selectedInvoice.customer_name}</p>
                    {selectedInvoice.customer_phone && (
                      <p className="text-gray-600 mt-0.5">{selectedInvoice.customer_phone}</p>
                    )}
                    {selectedInvoice.customer_email && (
                      <p className="text-gray-600 mt-0.5">{selectedInvoice.customer_email}</p>
                    )}
                    {selectedInvoice.customer_address && (
                      <p className="text-gray-600 mt-0.5">{selectedInvoice.customer_address}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-400 uppercase tracking-wider text-[10px] mb-1">
                      Payment Details
                    </p>
                    <p className="text-gray-700 capitalize">
                      Method: <span className="font-semibold text-gray-900">{selectedInvoice.payment_method || 'Cash'}</span>
                    </p>
                    <p className="text-gray-700 capitalize">
                      Payment Status: <span className="font-semibold text-gray-900">{selectedInvoice.payment_status}</span>
                    </p>
                    {selectedInvoice.paid_at && (
                      <p className="text-gray-500 text-[11px] mt-0.5">
                        Paid at: {formatDate(selectedInvoice.paid_at)}
                      </p>
                    )}
                  </div>
                </div>

                {/* Line Items Table */}
                <div className="py-6">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b-2 border-gray-200 text-gray-600">
                        <th className="text-left py-2 font-semibold">Item / Description</th>
                        <th className="text-center py-2 font-semibold w-16">Qty</th>
                        <th className="text-right py-2 font-semibold w-24">Rate</th>
                        <th className="text-right py-2 font-semibold w-24">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {selectedInvoice.invoice_line_items && selectedInvoice.invoice_line_items.length > 0 ? (
                        selectedInvoice.invoice_line_items.map((item, idx) => (
                          <tr key={item.id || idx}>
                            <td className="py-2.5 text-gray-800">{item.description}</td>
                            <td className="py-2.5 text-center text-gray-600">{item.quantity}</td>
                            <td className="py-2.5 text-right text-gray-600">{formatCurrency(item.unit_price)}</td>
                            <td className="py-2.5 text-right font-medium text-gray-900">{formatCurrency(item.line_total)}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="py-4 text-center text-gray-400 italic">
                            Line items recorded in sale.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Calculation Summary */}
                <div className="border-t pt-4 flex justify-end">
                  <div className="w-64 space-y-1.5 text-xs">
                    <div className="flex justify-between text-gray-600">
                      <span>Subtotal:</span>
                      <span className="font-medium">{formatCurrency(selectedInvoice.subtotal)}</span>
                    </div>

                    {selectedInvoice.discount_amount > 0 && (
                      <div className="flex justify-between text-emerald-600">
                        <span>Discount:</span>
                        <span className="font-medium">-{formatCurrency(selectedInvoice.discount_amount)}</span>
                      </div>
                    )}

                    {selectedInvoice.tax_amount > 0 && (
                      <div className="flex justify-between text-gray-600">
                        <span>
                          {selectedInvoice.tax_label || 'Tax'} ({selectedInvoice.tax_rate}%):
                        </span>
                        <span className="font-medium">{formatCurrency(selectedInvoice.tax_amount)}</span>
                      </div>
                    )}

                    <div className="border-t-2 border-gray-900 pt-2 flex justify-between text-sm font-bold text-gray-900">
                      <span>Grand Total:</span>
                      <span>{formatCurrency(selectedInvoice.total)}</span>
                    </div>
                  </div>
                </div>

                {/* Void Notice if applicable */}
                {selectedInvoice.status === 'voided' && (
                  <div className="mt-6 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
                    <p className="font-bold">THIS INVOICE HAS BEEN VOIDED</p>
                    <p>Reason: {selectedInvoice.void_reason || 'Administrative cancellation'}</p>
                    {selectedInvoice.voided_at && <p>Voided at: {formatDate(selectedInvoice.voided_at)}</p>}
                  </div>
                )}

                {/* Footer notes */}
                <div className="mt-12 pt-6 border-t border-gray-200 text-[11px] text-gray-400 text-center space-y-1">
                  <p>Thank you for choosing Brimish Skin Care Clinic.</p>
                  <p>This is a computer-generated tax invoice. No signature required.</p>
                </div>
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
