import { Suspense } from 'react';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Clock,
  User,
  CreditCard,
  FileCheck,
  Phone,
  MapPin,
  AlertCircle,
  Search,
  ArrowRight,
  ExternalLink,
  Printer,
  Sparkles,
} from 'lucide-react';
import { formatCurrency, formatDate, formatDateTime, formatPhone } from '@/lib/utils/helpers';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export const metadata: Metadata = {
  title: 'Verify Invoice & Clinic Receipt | Brimish Skin Care',
  description:
    'Official digital receipt authentication portal for Brimish Skin Care & Laser Clinic. Verify treatments, charges, and clinician authorization.',
  robots: {
    index: false,
    follow: false,
  },
};

interface VerifyPageProps {
  searchParams: Promise<{
    id?: string;
    num?: string;
  }>;
}

export default async function VerifyInvoicePage({ searchParams }: VerifyPageProps) {
  const { id, num } = await searchParams;
  const supabase = createAdminClient();

  // Fetch clinic settings
  const { data: clinicSettings } = await supabase
    .from('clinic_settings')
    .select('*')
    .limit(1)
    .single();

  let invoice: any = null;
  let hasSearched = Boolean(id || num);

  if (id || num) {
    let query = supabase
      .from('invoices')
      .select(`
        *,
        invoice_line_items (*)
      `);

    if (id) {
      query = query.eq('id', id);
    } else if (num) {
      query = query.ilike('invoice_number', num.trim());
    }

    const { data } = await query.maybeSingle();
    invoice = data;
  }

  const clinicName = clinicSettings?.clinic_name || 'Brimish Skin Care & Laser Clinic';
  const clinicPhone = clinicSettings?.clinic_phone || '+92 91 5842100 / +92 312 9000100';
  const clinicAddress =
    clinicSettings?.clinic_address ||
    'Suite #3, Cantonment Plaza, University Road, Peshawar, KP, Pakistan';

  return (
    <div className="min-h-screen bg-linear-to-b from-stone-50 via-white to-amber-50/20 py-10 sm:py-16 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Verification Hero Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs font-semibold tracking-wide">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            Official Clinical Verification Portal
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            Receipt Authenticity Verification
          </h1>
          <p className="text-sm text-gray-600 max-w-lg mx-auto leading-relaxed">
            Verify the official electronic record and clinical validity of your Brimish Skin Care &amp; Laser Clinic invoice.
          </p>
        </div>

        {/* Manual Lookup if no invoice or searching another */}
        {!invoice && (
          <Card className="border border-stone-200 shadow-sm bg-white overflow-hidden">
            <CardContent className="p-6 sm:p-8 space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-stone-100">
                <Search className="h-5 w-5 text-amber-600" />
                <div>
                  <h3 className="text-base font-bold text-gray-900">Search Invoice Record</h3>
                  <p className="text-xs text-gray-500">
                    Enter the invoice number printed at the top of your 80mm thermal receipt.
                  </p>
                </div>
              </div>

              <form method="GET" action="/verify-invoice" className="flex flex-col sm:flex-row gap-3 pt-2">
                <Input
                  name="num"
                  placeholder="e.g. INV-2026-00042"
                  defaultValue={num || ''}
                  required
                  className="h-11 font-mono uppercase tracking-wider text-sm"
                />
                <Button
                  type="submit"
                  className="h-11 px-6 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-sm shrink-0"
                >
                  Verify Receipt
                  <ArrowRight className="h-4 w-4 ml-1.5" />
                </Button>
              </form>

              {hasSearched && !invoice && (
                <div className="mt-4 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-bold">Invoice record could not be found.</p>
                    <p className="text-amber-800 leading-relaxed">
                      Please double-check the invoice number printed on your receipt slip, or contact our clinic reception desk at{' '}
                      <strong>{clinicPhone}</strong> for assistance.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Invoice Verified Result Card */}
        {invoice && (
          <div className="space-y-6">
            <Card className="border-2 border-emerald-500/40 shadow-xl bg-white overflow-hidden rounded-2xl">
              {/* Authenticated Banner */}
              <div className="bg-linear-to-r from-emerald-600 to-teal-700 text-white p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0">
                    <CheckCircle2 className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-widest text-emerald-100">
                        Authenticated Record
                      </span>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-ping" />
                    </div>
                    <h2 className="text-lg sm:text-xl font-black tracking-tight text-white">
                      Official Clinic Receipt Verified
                    </h2>
                  </div>
                </div>

                <div className="text-right">
                  <span className="block text-[11px] text-emerald-100 font-medium">Invoice Number</span>
                  <span className="font-mono font-bold text-base text-white tracking-wider">
                    {invoice.invoice_number}
                  </span>
                </div>
              </div>

              <CardContent className="p-6 sm:p-8 space-y-6">
                {/* Clinic Header Info */}
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-6 border-b border-stone-200">
                  <div className="flex items-start gap-4">
                    <div className="relative w-16 h-16 rounded-xl p-1 bg-white border border-stone-200 shadow-xs flex items-center justify-center shrink-0">
                      <Image
                        src="/images/logo.png"
                        alt="Brimish Clinic Logo"
                        width={54}
                        height={54}
                        className="object-contain"
                      />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-base sm:text-lg">
                        {clinicName}
                      </h3>
                      <p className="text-xs font-semibold text-rose-600 mt-0.5">
                        Medical Aesthetics, Dermatology &amp; Laser Center
                      </p>
                      <p className="text-xs text-gray-700 mt-1 font-medium">
                        Clinical Director: <strong className="text-gray-900">Dr. Bilal Ahmad</strong> (MD Aesthetic Medicine)
                      </p>
                      <p className="text-[11px] text-gray-500 mt-1 flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                        {clinicAddress}
                      </p>
                    </div>
                  </div>

                  <div className="bg-stone-50 p-3 rounded-xl border border-stone-200 text-xs space-y-1.5 w-full sm:w-auto">
                    <div className="flex justify-between sm:justify-start gap-4">
                      <span className="text-gray-500">Date Issued:</span>
                      <strong className="text-gray-900">{formatDate(invoice.issued_at || invoice.created_at)}</strong>
                    </div>
                    <div className="flex justify-between sm:justify-start gap-4">
                      <span className="text-gray-500">Time:</span>
                      <strong className="text-gray-900">{formatDateTime(invoice.issued_at || invoice.created_at).split(', ')[1] || 'Standard Time'}</strong>
                    </div>
                    <div className="flex justify-between sm:justify-start gap-4 items-center">
                      <span className="text-gray-500">Payment Status:</span>
                      <Badge
                        className={
                          invoice.status === 'paid'
                            ? 'bg-emerald-600 text-white text-[10px]'
                            : invoice.status === 'voided'
                            ? 'bg-red-600 text-white text-[10px]'
                            : 'bg-blue-600 text-white text-[10px]'
                        }
                      >
                        {invoice.status === 'paid' ? 'PAID IN FULL' : invoice.status.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Patient & Attending Doctor Information */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-stone-50/80 border border-stone-200 text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-gray-400 block tracking-wider mb-1">
                      Patient Details
                    </span>
                    <p className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                      <User className="h-4 w-4 text-rose-500" />
                      {invoice.customer_name}
                    </p>
                    {invoice.customer_phone && (
                      <p className="text-gray-600 mt-1 font-mono">
                        Phone: {formatPhone(invoice.customer_phone)}
                      </p>
                    )}
                    <p className="text-gray-500 text-[11px] mt-0.5 font-mono">
                      File ID: MR-{invoice.invoice_number.slice(-4)}
                    </p>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-bold text-gray-400 block tracking-wider mb-1">
                      Consultant &amp; Mode
                    </span>
                    <p className="text-sm font-bold text-gray-900">
                      Dr. Bilal Ahmad
                    </p>
                    <p className="text-gray-600 mt-1 capitalize flex items-center gap-1.5">
                      <CreditCard className="h-3.5 w-3.5 text-gray-400" />
                      Payment Mode: <strong className="text-gray-800">{invoice.payment_method || 'Cash at Counter'}</strong>
                    </p>
                    <p className="text-[11px] text-emerald-700 font-semibold mt-0.5">
                      Clinical Authenticity: Verified Valid
                    </p>
                  </div>
                </div>

                {/* Void notice if applicable */}
                {invoice.status === 'voided' && (
                  <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs space-y-1">
                    <p className="font-bold uppercase tracking-wider text-red-900">
                      ⚠️ Caution: This invoice was officially voided
                    </p>
                    <p>Reason: {invoice.void_reason || 'Administrative update or refund'}</p>
                    {invoice.voided_at && <p className="text-[11px]">Voided on: {formatDateTime(invoice.voided_at)}</p>}
                  </div>
                )}

                {/* Treatment & Items Table */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Treatments &amp; Products Rendered
                    </h4>
                    <span className="text-[11px] text-gray-500 font-medium">
                      {(invoice.invoice_line_items || []).length} Item(s)
                    </span>
                  </div>

                  <div className="border border-stone-200 rounded-xl overflow-hidden">
                    <table className="w-full text-xs">
                      <thead className="bg-stone-100 text-gray-700 border-b border-stone-200">
                        <tr>
                          <th className="py-2.5 px-3 text-left font-bold w-10">#</th>
                          <th className="py-2.5 px-3 text-left font-bold">Description</th>
                          <th className="py-2.5 px-3 text-center font-bold w-16">Qty</th>
                          <th className="py-2.5 px-3 text-right font-bold w-28">Rate</th>
                          <th className="py-2.5 px-3 text-right font-bold w-28">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100">
                        {invoice.invoice_line_items && invoice.invoice_line_items.length > 0 ? (
                          invoice.invoice_line_items.map((item: any, idx: number) => (
                            <tr key={item.id || idx} className="hover:bg-stone-50/50">
                              <td className="py-3 px-3 text-gray-400 font-mono">{idx + 1}</td>
                              <td className="py-3 px-3 font-semibold text-gray-900">
                                {item.description}
                                {item.discount_amount > 0 && (
                                  <span className="block text-[10px] text-emerald-600 font-medium">
                                    Discount applied: -{formatCurrency(item.discount_amount)}
                                  </span>
                                )}
                              </td>
                              <td className="py-3 px-3 text-center text-gray-700 font-medium">
                                {item.quantity}
                              </td>
                              <td className="py-3 px-3 text-right text-gray-600 font-mono">
                                {formatCurrency(item.unit_price)}
                              </td>
                              <td className="py-3 px-3 text-right font-bold text-gray-900 font-mono">
                                {formatCurrency(item.line_total)}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={5} className="py-4 text-center text-gray-400 italic">
                              Clinical Consultation &amp; Aesthetic Procedure
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Totals Breakdown */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 pt-4 border-t border-stone-200">
                  <div className="text-[11px] text-gray-500 space-y-1">
                    <p className="font-semibold text-gray-700">Official Clinical Guarantee</p>
                    <p>All clinical procedures and dispensed products are authorized under</p>
                    <p className="font-medium text-gray-800">Brimish Clinical Quality &amp; Safety Standard.</p>
                  </div>

                  <div className="w-full sm:w-64 space-y-1.5 text-xs bg-stone-50 p-4 rounded-xl border border-stone-200">
                    <div className="flex justify-between text-gray-600">
                      <span>Subtotal:</span>
                      <span className="font-mono font-medium">{formatCurrency(invoice.subtotal)}</span>
                    </div>

                    {invoice.discount_amount > 0 && (
                      <div className="flex justify-between text-emerald-700 font-medium">
                        <span>Clinic Discount:</span>
                        <span className="font-mono">-{formatCurrency(invoice.discount_amount)}</span>
                      </div>
                    )}

                    {invoice.tax_amount > 0 && (
                      <div className="flex justify-between text-gray-600">
                        <span>Services Tax ({invoice.tax_rate}%):</span>
                        <span className="font-mono">{formatCurrency(invoice.tax_amount)}</span>
                      </div>
                    )}

                    <div className="pt-2 border-t border-stone-200 flex justify-between items-baseline font-black text-base text-gray-900">
                      <span>Total Paid:</span>
                      <span className="font-mono text-emerald-800 text-lg">
                        {formatCurrency(invoice.total)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Digital Verification Footprint */}
                <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3">
                    <FileCheck className="h-6 w-6 text-emerald-600 shrink-0" />
                    <div>
                      <p className="font-bold text-emerald-950">
                        Digital Verification Security Seal
                      </p>
                      <p className="text-[11px] text-emerald-800 font-mono mt-0.5">
                        REF: VER-BRM-{invoice.id.slice(0, 8).toUpperCase()}-{invoice.invoice_number}
                      </p>
                    </div>
                  </div>

                  <div className="text-[10px] text-emerald-800/80 text-center sm:text-right font-medium">
                    Verified online: {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <Link
                    href={`/verify-invoice`}
                    className="inline-flex items-center justify-center rounded-lg border border-stone-300 bg-white hover:bg-stone-50 text-gray-700 text-xs h-9 px-3.5 font-medium transition-all"
                  >
                    <Search className="h-3.5 w-3.5 mr-1.5" />
                    Verify Another Receipt
                  </Link>

                  <div className="flex items-center gap-2">
                    <a
                      href={`https://wa.me/923129000100?text=${encodeURIComponent(
                        `Hello Brimish Clinic, I am verifying my invoice #${invoice.invoice_number} for ${invoice.customer_name}.`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs h-9 px-3.5 font-medium transition-all shadow-xs"
                    >
                      <Phone className="h-3.5 w-3.5 mr-1.5" />
                      Clinic Helpline
                    </a>
                    <Link
                      href="/book"
                      className="inline-flex items-center justify-center rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs h-9 px-3.5 font-medium transition-all shadow-xs"
                    >
                      <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                      Book Next Follow-up
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
