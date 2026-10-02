'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import QRCode from 'qrcode';
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
  ExternalLink,
  MessageCircle,
} from 'lucide-react';
import { formatCurrency, formatDate, formatDateTime, formatPhone, buildWhatsAppLink } from '@/lib/utils/helpers';
import { useReceiptSettings } from '@/lib/receipt-settings';
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
  currentPage: initialPage = 1,
  pageSize,
  search,
  statusFilter,
  isAdmin,
}: InvoicesListProps) {
  const router = useRouter();
  const [searchValue, setSearchValue] = useState(search);
  const [selectedStatus, setSelectedStatus] = useState<string>(statusFilter || 'all');
  const [currentPage, setCurrentPage] = useState<number>(initialPage || 1);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const receiptSettings = useReceiptSettings();
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');

  // Auto-generate verification QR code whenever an invoice is viewed
  useEffect(() => {
    if (selectedInvoice) {
      const origin =
        typeof window !== 'undefined' && window.location.origin
          ? window.location.origin
          : 'https://brimishskincare.com';
      const verifyUrl = `${origin}/verify-invoice?id=${selectedInvoice.id}&num=${encodeURIComponent(selectedInvoice.invoice_number)}`;

      QRCode.toDataURL(verifyUrl, {
        width: 240,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
        errorCorrectionLevel: 'M',
      })
        .then((url) => setQrCodeDataUrl(url))
        .catch((err) => console.error('[QRCode] Error generating receipt QR:', err));
    } else {
      setQrCodeDataUrl('');
    }
  }, [selectedInvoice]);

  // Void state
  const [voidDialogOpen, setVoidDialogOpen] = useState(false);
  const [voidTarget, setVoidTarget] = useState<Invoice | null>(null);
  const [voidReason, setVoidReason] = useState('');
  const [voiding, setVoiding] = useState(false);

  // Email state
  const [sendingEmail, setSendingEmail] = useState(false);

  // Instant in-memory filtering (0ms latency!)
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      if (selectedStatus !== 'all' && inv.status !== selectedStatus) return false;
      if (searchValue.trim()) {
        const q = searchValue.toLowerCase().trim();
        const matchNum = inv.invoice_number?.toLowerCase().includes(q);
        const matchName = inv.customer_name?.toLowerCase().includes(q);
        const matchPhone = inv.customer_phone?.includes(q);
        if (!matchNum && !matchName && !matchPhone) return false;
      }
      return true;
    });
  }, [invoices, selectedStatus, searchValue]);

  const itemsPerPage = pageSize || 20;
  const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage) || 1;
  const displayedInvoices = filteredInvoices.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSearch = () => {
    setCurrentPage(1);
  };

  const handleStatusChange = (status: string) => {
    setSelectedStatus(status);
    setCurrentPage(1);
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (status !== 'all') params.set('status', status);
      else params.delete('status');
      params.delete('page');
      const newUrl = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ''}`;
      window.history.replaceState(null, '', newUrl);
    }
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

  const handleSendWhatsApp = (inv: Invoice) => {
    if (!inv.customer_phone) {
      toast.error('No customer phone number available for this invoice.');
      return;
    }
    const origin =
      typeof window !== 'undefined' && window.location.origin
        ? window.location.origin
        : 'https://brimishskincare.com';
    const verifyUrl = `${origin}/verify-invoice?id=${inv.id}&num=${encodeURIComponent(inv.invoice_number)}`;

    const text = `Assalam-o-Alaikum ${inv.customer_name},\n\nHere is your official digital invoice receipt from Brimish Skin Care & Laser Clinic:\n• Invoice #: ${inv.invoice_number}\n• Amount: PKR ${Number(inv.total).toLocaleString()}\n• Payment Method: ${(inv.payment_method || 'Cash').toUpperCase()}\n• Status: ${inv.status.toUpperCase()}\n\nYou can view and verify your digital receipt record anytime at:\n${verifyUrl}\n\nClinic: Sami Tower, Ring Road, Peshawar\nDoctor / WhatsApp: 0335-6400959`;

    const link = buildWhatsAppLink(inv.customer_phone, text);
    window.open(link, '_blank');
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
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 md:pb-0">
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
                'px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-150 cursor-pointer',
                selectedStatus === tab.value
                  ? 'bg-rose-500 text-white shadow-xs'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200/90'
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
              onChange={(e) => {
                setSearchValue(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-9 h-9 text-xs"
            />
          </div>
          {searchValue && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setSearchValue('');
                setCurrentPage(1);
              }}
              className="h-9 text-xs px-2"
            >
              Clear
            </Button>
          )}
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
              {displayedInvoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-gray-400 text-sm">
                    No invoices found.
                  </TableCell>
                </TableRow>
              ) : (
                displayedInvoices.map((inv) => (
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
                        {inv.customer_phone && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleSendWhatsApp(inv)}
                            className="h-7 px-2 text-xs text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
                            title="Send Receipt via WhatsApp"
                          >
                            <MessageCircle className="h-3.5 w-3.5" />
                          </Button>
                        )}
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
            Page {currentPage} of {totalPages} ({filteredInvoices.length} total)
          </p>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="h-8"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="h-8"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* Official 80mm Thermal Receipt Slip Modal */}
      <Dialog open={showPrintModal} onOpenChange={setShowPrintModal}>
        <DialogContent className="max-w-md max-h-[94vh] overflow-y-auto p-0">
          {selectedInvoice && (
            <div>
              {/* Header Action Bar (Hidden in Print) */}
              <div className="print:hidden p-3.5 border-b bg-gray-50 flex items-center justify-between gap-2 sticky top-0 z-10 backdrop-blur-sm bg-gray-50/95">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-gray-900 text-xs sm:text-sm">
                      Receipt {selectedInvoice.invoice_number}
                    </h3>
                    <Badge className="bg-stone-900 text-white text-[9px] uppercase font-bold tracking-wider">
                      80mm Slip
                    </Badge>
                  </div>
                  <p className="text-[11px] text-gray-500">Official clinic 80mm thermal print</p>
                </div>

                <div className="flex items-center gap-1.5">
                  <a
                    href={`/verify-invoice?id=${selectedInvoice.id}&num=${encodeURIComponent(selectedInvoice.invoice_number)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 h-8 text-xs px-2.5 font-medium transition-all"
                  >
                    <ExternalLink className="h-3.5 w-3.5 mr-1" />
                    Verify
                  </a>

                  {selectedInvoice.customer_email && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={sendingEmail}
                      onClick={() => handleSendEmail(selectedInvoice)}
                      className="h-8 text-xs border-gray-300 px-2.5"
                    >
                      {sendingEmail ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                      ) : (
                        <Mail className="h-3.5 w-3.5 mr-1" />
                      )}
                      Email
                    </Button>
                  )}

                  {selectedInvoice.customer_phone && (
                    <Button
                      size="sm"
                      onClick={() => handleSendWhatsApp(selectedInvoice)}
                      className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-2.5 flex items-center gap-1 shadow-xs"
                      title="Send Receipt via WhatsApp"
                    >
                      <MessageCircle className="h-3.5 w-3.5" />
                      WhatsApp
                    </Button>
                  )}

                  <Button
                    size="sm"
                    onClick={handlePrint}
                    className="h-8 text-xs bg-rose-600 hover:bg-rose-700 text-white font-semibold shadow-xs px-3"
                  >
                    <Printer className="h-3.5 w-3.5 mr-1.5" />
                    Print Receipt
                  </Button>
                </div>
              </div>

              {/* Printable Invoice Container */}
              <div className="bg-stone-100/70 p-4 sm:p-6 print:p-0 print:bg-white flex justify-center">
                {/* ========================================================== */}
                {/* 80MM THERMAL RECEIPT SLIP (PURE CLINICAL FORMAT)           */}
                {/* ========================================================== */}
                <div
                  id="printable-invoice"
                  className="w-full max-w-[340px] bg-white border border-stone-200 print:border-0 shadow-sm p-4 font-mono text-[11px] text-black leading-tight"
                >
                  {/* Clinic Header */}
                  <div className="text-center pb-2.5 border-b border-dashed border-black">
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
                    <h2 className="text-sm font-black tracking-tight text-black uppercase">
                      {receiptSettings.receiptTitle || selectedInvoice.clinic_name || 'BRIMISH SKIN CARE & LASER CLINIC'}
                    </h2>
                    <p className="text-[10px] font-bold text-black mt-0.5">
                      {receiptSettings.receiptDoctor || 'DR. BILAL AHMAD (MD Aesthetic Medicine)'}
                    </p>
                    <p className="text-[9px] text-gray-700 mt-0.5">
                      {receiptSettings.receiptSpecialty || 'Medical Aesthetics & Laser Dermatology'}
                    </p>
                    <p className="text-[9px] text-gray-700 mt-0.5">
                      {receiptSettings.receiptAddress || selectedInvoice.clinic_address || 'Sami Tower, Ring Road, Peshawar'}
                    </p>
                    <p className="text-[9px] font-semibold text-black mt-0.5">
                      {receiptSettings.receiptPhone || selectedInvoice.clinic_phone || 'Dr: 0335-6400959 | WhatsApp: 0335-6400959'}
                    </p>
                  </div>

                  {/* Receipt Metadata */}
                  <div className="py-2 border-b border-dashed border-black text-[10px] space-y-0.5">
                    <div className="flex justify-between">
                      <span>Receipt #:</span>
                      <strong className="font-bold">{selectedInvoice.invoice_number}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Date:</span>
                      <span>{formatDate(selectedInvoice.issued_at || selectedInvoice.created_at)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Time:</span>
                      <span>{formatDateTime(selectedInvoice.issued_at || selectedInvoice.created_at).split(', ')[1] || 'Real-time'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Patient:</span>
                      <strong className="font-bold">{selectedInvoice.customer_name}</strong>
                    </div>
                    {selectedInvoice.customer_phone && (
                      <div className="flex justify-between">
                        <span>Phone:</span>
                        <span>{formatPhone(selectedInvoice.customer_phone)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Payment:</span>
                      <span className="uppercase font-bold">{selectedInvoice.payment_method || 'CASH'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Status:</span>
                      <span
                        className={cn(
                          'font-bold uppercase text-[9px] px-1 py-0.2 rounded',
                          selectedInvoice.status === 'paid' ? 'bg-black text-white' : 'text-red-700 border border-black'
                        )}
                      >
                        {selectedInvoice.status === 'paid' ? 'PAID IN FULL' : selectedInvoice.status}
                      </span>
                    </div>
                  </div>

                  {/* Itemized Table */}
                  <div className="py-2 border-b border-dashed border-black">
                    <div className="flex justify-between font-bold pb-1 text-[9px] border-b border-black uppercase tracking-wider">
                      <span className="w-1/2">Item / Procedure</span>
                      <span className="w-1/4 text-center">Qty x Rate</span>
                      <span className="w-1/4 text-right">Total</span>
                    </div>
                    <div className="space-y-1.5 pt-1.5">
                      {selectedInvoice.invoice_line_items && selectedInvoice.invoice_line_items.length > 0 ? (
                        selectedInvoice.invoice_line_items.map((item, idx) => (
                          <div key={item.id || idx}>
                            <p className="font-bold text-[10px] text-black leading-tight">
                              {item.description}
                            </p>
                            <div className="flex justify-between text-[9px] text-gray-800">
                              <span>
                                {item.quantity} x {formatCurrency(item.unit_price)}
                              </span>
                              <span className="font-bold text-black">{formatCurrency(item.line_total)}</span>
                            </div>
                            {item.discount_amount > 0 && (
                              <div className="text-[8px] text-gray-700">
                                Disc: -{formatCurrency(item.discount_amount)}
                              </div>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="flex justify-between text-[10px]">
                          <span>Clinical Treatment</span>
                          <span className="font-bold">{formatCurrency(selectedInvoice.total)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Totals Summary */}
                  <div className="py-2 border-b border-dashed border-black space-y-1 text-[10px]">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>{formatCurrency(selectedInvoice.subtotal)}</span>
                    </div>
                    {selectedInvoice.discount_amount > 0 && (
                      <div className="flex justify-between text-black font-semibold">
                        <span>Clinic Privilege Discount:</span>
                        <span>-{formatCurrency(selectedInvoice.discount_amount)}</span>
                      </div>
                    )}
                    {selectedInvoice.tax_amount > 0 && (
                      <div className="flex justify-between">
                        <span>Services Tax ({selectedInvoice.tax_rate}%):</span>
                        <span>{formatCurrency(selectedInvoice.tax_amount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-xs sm:text-sm font-black pt-1.5 border-t border-black text-black">
                      <span className="uppercase">NET TOTAL:</span>
                      <span>{formatCurrency(selectedInvoice.total)}</span>
                    </div>
                    <div className="flex justify-between text-[9px] text-gray-700 pt-0.5">
                      <span>Amount Received: {formatCurrency(selectedInvoice.total)}</span>
                      <span>Balance: PKR 0.00</span>
                    </div>
                  </div>

                  {/* Void Warning if applicable */}
                  {selectedInvoice.status === 'voided' && (
                    <div className="my-2 p-2 border border-black text-center text-[9px] text-black">
                      <strong className="block font-bold">*** VOIDED INVOICE ***</strong>
                      <span>{selectedInvoice.void_reason || 'Administrative cancellation'}</span>
                    </div>
                  )}

                  {/* Autogenerated QR Code for Online Verification */}
                  {receiptSettings.enableQrVerification && qrCodeDataUrl && (
                    <div className="text-center pt-2.5 pb-1">
                      <div className="w-24 h-24 mx-auto bg-white p-1 border border-black rounded flex items-center justify-center">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={qrCodeDataUrl}
                          alt="Invoice QR Code"
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
                      {receiptSettings.receiptFooterMessage || 'Thank you for choosing Brimish Skin Care.'}
                    </p>
                    <p className="text-[8px] text-gray-600">
                      Follow-up consultations valid within 30 days
                    </p>
                    <p className="text-[8px] text-gray-500">
                      Computer-generated official clinical slip
                    </p>
                  </div>
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
