'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  BarChart3,
  TrendingUp,
  Download,
  Calendar,
  Users,
  CreditCard,
  ShoppingCart,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileSpreadsheet,
  Package,
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils/helpers';
import { exportToCSV } from '@/lib/utils/csv-export';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface InvoiceRecord {
  id: string;
  invoice_number: string;
  total: number;
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  payment_method: string | null;
  status: string;
  created_at: string;
  customer_name: string;
}

interface AppointmentRecord {
  id: string;
  status: string;
  scheduled_at: string;
  created_at: string;
  duration_minutes?: number | null;
  treatments?: { name: string } | null;
  patients?: { name: string } | null;
}

interface OrderRecord {
  id: string;
  order_number: string;
  total: number;
  status: string;
  delivery_method: string;
  payment_method: string;
  created_at: string;
  customer_name: string;
}

interface ProductRecord {
  id: string;
  name: string;
  sku: string;
  stock_quantity: number;
  sale_price: number;
  purchase_price: number;
  product_categories?: { name: string } | null;
}

interface TreatmentRecord {
  id: string;
  name: string;
  price: number | null;
  treatment_categories?: { name: string } | null;
}

interface PatientRecord {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  gender: string | null;
  created_at: string;
}

interface ReportsViewProps {
  invoices: InvoiceRecord[];
  appointments: AppointmentRecord[];
  orders: OrderRecord[];
  products: ProductRecord[];
  treatments: TreatmentRecord[];
  patients: PatientRecord[];
}

export function ReportsView({
  invoices,
  appointments,
  orders,
  products,
  treatments,
  patients,
}: ReportsViewProps) {
  const [timeRange, setTimeRange] = useState<'today' | '7d' | '30d' | '90d' | 'all'>('30d');

  // Filter records by timeRange
  const filterByDate = <T extends { created_at: string }>(items: T[]): T[] => {
    if (timeRange === 'all') return items;
    const now = new Date();
    if (timeRange === 'today') {
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      return items.filter((item) => new Date(item.created_at) >= todayStart);
    }
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    return items.filter((item) => new Date(item.created_at) >= cutoff);
  };

  const filteredInvoices = useMemo(() => filterByDate(invoices), [invoices, timeRange]);
  const filteredAppointments = useMemo(() => filterByDate(appointments), [appointments, timeRange]);
  const filteredOrders = useMemo(() => filterByDate(orders), [orders, timeRange]);

  // Financial Metrics
  const paidInvoices = filteredInvoices.filter((inv) => inv.status === 'paid');
  const totalRevenue = paidInvoices.reduce((sum, inv) => sum + Number(inv.total), 0);
  const totalDiscounts = paidInvoices.reduce((sum, inv) => sum + Number(inv.discount_amount || 0), 0);
  const totalTax = paidInvoices.reduce((sum, inv) => sum + Number(inv.tax_amount || 0), 0);
  const avgTicket = paidInvoices.length > 0 ? totalRevenue / paidInvoices.length : 0;

  // Online Orders
  const completedOrders = filteredOrders.filter(
    (o) => o.status === 'delivered' || o.status === 'picked_up' || o.status === 'completed'
  );
  const totalOnlineSales = completedOrders.reduce((sum, o) => sum + Number(o.total), 0);

  // Appointment Funnel
  const totalAppts = filteredAppointments.length;
  const completedAppts = filteredAppointments.filter((a) => a.status === 'completed').length;
  const noShowAppts = filteredAppointments.filter((a) => a.status === 'no_show').length;
  const cancelledAppts = filteredAppointments.filter((a) => a.status === 'cancelled').length;
  const pendingAppts = filteredAppointments.filter(
    (a) => a.status === 'pending' || a.status === 'confirmed' || a.status === 'checked_in'
  ).length;

  const completionRate = totalAppts > 0 ? Math.round((completedAppts / totalAppts) * 100) : 0;
  const noShowRate = totalAppts > 0 ? Math.round((noShowAppts / totalAppts) * 100) : 0;
  const cancelRate = totalAppts > 0 ? Math.round((cancelledAppts / totalAppts) * 100) : 0;

  // Payment Methods Breakdown
  const paymentBreakdown = useMemo(() => {
    const counts: Record<string, { count: number; total: number }> = {};
    paidInvoices.forEach((inv) => {
      const method = inv.payment_method || 'cash';
      if (!counts[method]) counts[method] = { count: 0, total: 0 };
      counts[method].count += 1;
      counts[method].total += Number(inv.total);
    });
    return counts;
  }, [paidInvoices]);

  // Inventory Valuation
  const totalStockItems = products.reduce((sum, p) => sum + (p.stock_quantity || 0), 0);
  const totalStockValuation = products.reduce(
    (sum, p) => sum + (p.stock_quantity || 0) * Number(p.sale_price || 0),
    0
  );

  // Export Handlers
  const handleExportDailyClosing = () => {
    const headers = [
      'Report Type',
      'Date',
      'Total Revenue (PKR)',
      'Total Discounts (PKR)',
      'Total Taxes (PKR)',
      'Paid Invoices Count',
      'Completed Appointments',
      'Online Orders',
    ];
    const rows = [
      [
        'End-of-Day Closing Reconciliation',
        new Date().toISOString().split('T')[0],
        totalRevenue,
        totalDiscounts,
        totalTax,
        paidInvoices.length,
        completedAppts,
        completedOrders.length,
      ],
    ];
    exportToCSV(`brimish-daily-closing-${new Date().toISOString().split('T')[0]}`, headers, rows);
    toast.success('Daily Closing CSV exported');
  };

  const handleExportInvoices = () => {
    const headers = [
      'Invoice Number',
      'Date',
      'Customer',
      'Subtotal',
      'Discount',
      'Tax',
      'Total',
      'Payment Method',
      'Status',
    ];
    const rows = invoices.map((inv) => [
      inv.invoice_number,
      formatDate(inv.created_at),
      inv.customer_name,
      inv.subtotal,
      inv.discount_amount,
      inv.tax_amount,
      inv.total,
      inv.payment_method || 'cash',
      inv.status,
    ]);
    exportToCSV('brimish-invoices', headers, rows);
    toast.success('Invoices CSV exported');
  };

  const handleExportAppointments = () => {
    const headers = ['Date', 'Time', 'Patient', 'Treatment', 'Status'];
    const rows = appointments.map((a) => {
      const d = a.scheduled_at ? new Date(a.scheduled_at) : null;
      return [
        d ? formatDate(a.scheduled_at) : '—',
        d ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—',
        a.patients?.name || 'Walk-in',
        a.treatments?.name || 'General Consultation',
        a.status,
      ];
    });
    exportToCSV('brimish-appointments', headers, rows);
    toast.success('Appointments CSV exported');
  };

  const handleExportPatients = () => {
    const headers = ['Patient ID', 'Name', 'Phone', 'Email', 'Gender', 'Registered Date'];
    const rows = patients.map((p) => [
      p.id,
      p.name,
      p.phone,
      p.email || '',
      p.gender || '',
      formatDate(p.created_at),
    ]);
    exportToCSV('brimish-patients', headers, rows);
    toast.success('Patients CSV exported');
  };

  const handleExportInventory = () => {
    const headers = [
      'Product Name',
      'SKU',
      'Category',
      'Stock Quantity',
      'Cost Price (PKR)',
      'Sale Price (PKR)',
      'Total Retail Valuation (PKR)',
    ];
    const rows = products.map((p) => [
      p.name,
      p.sku,
      p.product_categories?.name || 'Uncategorized',
      p.stock_quantity,
      p.purchase_price,
      p.sale_price,
      p.stock_quantity * p.sale_price,
    ]);
    exportToCSV('brimish-inventory', headers, rows);
    toast.success('Inventory CSV exported');
  };

  return (
    <div className="space-y-8">
      {/* Top Header & Range Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Reports & Analytics</h1>
          <p className="text-sm text-gray-500">
            Comprehensive financial performance, patient attendance, and clinical operations.
          </p>
        </div>

        {/* Range Selector & Daily Closing Action */}
        <div className="flex flex-wrap items-center gap-2">
          {timeRange === 'today' && (
            <Button
              size="sm"
              onClick={handleExportDailyClosing}
              className="bg-gray-900 hover:bg-black text-white rounded-lg text-xs"
            >
              <Download className="h-3.5 w-3.5 mr-1.5" />
              Daily Closing CSV
            </Button>
          )}

          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl">
            {[
              { label: 'Today', value: 'today' },
              { label: '7 Days', value: '7d' },
              { label: '30 Days', value: '30d' },
              { label: '90 Days', value: '90d' },
              { label: 'All Time', value: 'all' },
            ].map((btn) => (
              <button
                key={btn.value}
                onClick={() => setTimeRange(btn.value as 'today' | '7d' | '30d' | '90d' | 'all')}
                className={cn(
                  'px-3 py-1 rounded-lg text-xs font-semibold transition-all',
                  timeRange === btn.value
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-900'
                )}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-0 shadow-md bg-gradient-to-br from-rose-50 to-pink-50/50">
          <CardHeader className="pb-2">
            <CardDescription className="text-rose-700 font-medium text-xs">
              Total Revenue Collected
            </CardDescription>
            <CardTitle className="text-2xl font-extrabold text-gray-900">
              {formatCurrency(totalRevenue)}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-[11px] text-gray-500 flex items-center gap-1">
              <CheckCircle className="h-3 w-3 text-emerald-600" />
              {paidInvoices.length} paid invoices in period
            </p>
          </CardContent>
        </Card>

        <Card className="border border-gray-200/80 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-gray-500 font-medium text-xs">
              Average Ticket Value
            </CardDescription>
            <CardTitle className="text-2xl font-extrabold text-gray-900">
              {formatCurrency(avgTicket)}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-[11px] text-gray-500">Per paying transaction</p>
          </CardContent>
        </Card>

        <Card className="border border-gray-200/80 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-gray-500 font-medium text-xs">
              Appointment Completion Rate
            </CardDescription>
            <CardTitle className="text-2xl font-extrabold text-emerald-600">
              {completionRate}%
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-[11px] text-gray-500">
              {completedAppts} of {totalAppts} total appointments
            </p>
          </CardContent>
        </Card>

        <Card className="border border-gray-200/80 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-gray-500 font-medium text-xs">
              Retail Stock Valuation
            </CardDescription>
            <CardTitle className="text-2xl font-extrabold text-gray-900">
              {formatCurrency(totalStockValuation)}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-[11px] text-gray-500">{totalStockItems} items across all categories</p>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Breakdown Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Appointment Status Breakdown */}
        <Card className="border border-gray-200/80 shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Calendar className="h-4 w-4 text-rose-600" />
              Appointment Attendance & Funnel
            </CardTitle>
            <CardDescription className="text-xs">
              Status distribution of patient bookings in selected period.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="font-medium text-gray-700 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                  Completed ({completedAppts})
                </span>
                <span className="font-bold text-gray-900">{completionRate}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-emerald-500 h-2 rounded-full transition-all"
                  style={{ width: `${completionRate}%` }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="font-medium text-gray-700 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
                  Pending / Confirmed / Upcoming ({pendingAppts})
                </span>
                <span className="font-bold text-gray-900">
                  {totalAppts > 0 ? Math.round((pendingAppts / totalAppts) * 100) : 0}%
                </span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-amber-500 h-2 rounded-full transition-all"
                  style={{ width: `${totalAppts > 0 ? (pendingAppts / totalAppts) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="font-medium text-gray-700 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />
                  No Show ({noShowAppts})
                </span>
                <span className="font-bold text-gray-900">{noShowRate}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-red-500 h-2 rounded-full transition-all"
                  style={{ width: `${noShowRate}%` }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="font-medium text-gray-700 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-gray-400 inline-block" />
                  Cancelled ({cancelledAppts})
                </span>
                <span className="font-bold text-gray-900">{cancelRate}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-gray-400 h-2 rounded-full transition-all"
                  style={{ width: `${cancelRate}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Methods Breakdown */}
        <Card className="border border-gray-200/80 shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-rose-600" />
              Payment Methods Breakdown
            </CardTitle>
            <CardDescription className="text-xs">
              Cash, Card, and Bank Transfer collection volume.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.keys(paymentBreakdown).length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-6">No paid invoices in this period.</p>
            ) : (
              Object.entries(paymentBreakdown).map(([method, data]) => {
                const percentage = totalRevenue > 0 ? Math.round((data.total / totalRevenue) * 100) : 0;

                return (
                  <div key={method} className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium text-gray-700 capitalize">
                        {method} ({data.count} txns)
                      </span>
                      <span className="font-bold text-gray-900">
                        {formatCurrency(data.total)} ({percentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-rose-500 h-2 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}

            {totalDiscounts > 0 && (
              <div className="pt-3 border-t flex justify-between text-xs text-emerald-700 font-medium">
                <span>Total Promotional Discounts Granted:</span>
                <span>-{formatCurrency(totalDiscounts)}</span>
              </div>
            )}
            {totalTax > 0 && (
              <div className="flex justify-between text-xs text-gray-600 font-medium">
                <span>Total GST / Tax Collected:</span>
                <span>{formatCurrency(totalTax)}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* One-Click CSV Data Export Hub */}
      <Card className="border border-gray-200/80 shadow-sm rounded-2xl bg-white">
        <CardHeader>
          <CardTitle className="text-base font-bold flex items-center gap-2 text-gray-900">
            <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
            Clinic Data Export Center (CSV)
          </CardTitle>
          <CardDescription className="text-xs text-gray-500">
            Download RFC-4180 UTF-8 compatible CSV files ready for Microsoft Excel, accounting, and tax audits.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <Button
              onClick={handleExportInvoices}
              variant="outline"
              className="h-16 flex flex-col items-center justify-center gap-1 border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/50"
            >
              <Download className="h-4 w-4 text-emerald-600" />
              <span className="text-xs font-semibold text-gray-800">Export Invoices CSV</span>
              <span className="text-[10px] text-gray-400">{invoices.length} invoices</span>
            </Button>

            <Button
              onClick={handleExportAppointments}
              variant="outline"
              className="h-16 flex flex-col items-center justify-center gap-1 border-gray-200 hover:border-blue-300 hover:bg-blue-50/50"
            >
              <Download className="h-4 w-4 text-blue-600" />
              <span className="text-xs font-semibold text-gray-800">Export Appointments CSV</span>
              <span className="text-[10px] text-gray-400">{appointments.length} bookings</span>
            </Button>

            <Button
              onClick={handleExportPatients}
              variant="outline"
              className="h-16 flex flex-col items-center justify-center gap-1 border-gray-200 hover:border-purple-300 hover:bg-purple-50/50"
            >
              <Download className="h-4 w-4 text-purple-600" />
              <span className="text-xs font-semibold text-gray-800">Export Patients CSV</span>
              <span className="text-[10px] text-gray-400">{patients.length} patient records</span>
            </Button>

            <Button
              onClick={handleExportInventory}
              variant="outline"
              className="h-16 flex flex-col items-center justify-center gap-1 border-gray-200 hover:border-amber-300 hover:bg-amber-50/50"
            >
              <Download className="h-4 w-4 text-amber-600" />
              <span className="text-xs font-semibold text-gray-800">Export Inventory CSV</span>
              <span className="text-[10px] text-gray-400">{products.length} products</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
