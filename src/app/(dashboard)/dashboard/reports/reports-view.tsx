'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
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
  Banknote,
  Calculator,
  Printer,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils/helpers';
import { exportToCSV } from '@/lib/utils/csv-export';
import { printReceipt } from '@/lib/print-receipt';
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
  payment_status?: string | null;
  status: string;
  created_at: string;
  customer_name: string;
  customer_phone?: string | null;
  customer_email?: string | null;
  customer_address?: string | null;
  patient_id?: string | null;
  patients?: {
    id: string;
    name: string;
    phone: string;
    email?: string | null;
    address?: string | null;
  } | null;
  invoice_line_items?: Array<{
    id: string;
    description: string;
    quantity: number;
    unit_price: number;
    line_total: number;
  }> | null;
}

interface AppointmentRecord {
  id: string;
  status: string;
  scheduled_at: string;
  created_at: string;
  duration_minutes?: number | null;
  customer_name?: string | null;
  customer_phone?: string | null;
  customer_email?: string | null;
  message?: string | null;
  confirmed_at?: string | null;
  treatment_id?: string | null;
  treatments?: {
    id?: string;
    name: string;
    price?: number | null;
  } | null;
  patient_id?: string | null;
  patients?: {
    id: string;
    name: string;
    phone?: string | null;
    email?: string | null;
    gender?: string | null;
  } | null;
}

interface OrderRecord {
  id: string;
  order_number: string;
  total: number;
  subtotal?: number;
  delivery_fee?: number;
  discount_amount?: number;
  status: string;
  delivery_method: string;
  delivery_address?: string | null;
  delivery_city?: string | null;
  payment_method: string;
  payment_status?: string;
  created_at: string;
  customer_name: string;
  customer_phone?: string | null;
  customer_email?: string | null;
  order_items?: Array<{
    id: string;
    name: string;
    quantity: number;
    unit_price: number;
    line_total: number;
  }>;
}

interface ProductRecord {
  id: string;
  name: string;
  sku: string;
  stock_quantity: number;
  reserved_quantity?: number;
  low_stock_threshold?: number;
  sale_price: number;
  purchase_price: number;
  expiry_date?: string | null;
  is_active?: boolean;
  is_published?: boolean;
  product_categories?: { id?: string; name: string } | null;
}

interface TreatmentRecord {
  id: string;
  name: string;
  price: number | null;
  treatment_categories?: { id?: string; name: string } | null;
}

interface PatientRecord {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  gender: string | null;
  date_of_birth?: string | null;
  address?: string | null;
  notes?: string | null;
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

  // Cash Drawer & Front-Desk Shift Closing Reconciliation
  const [isReconcileOpen, setIsReconcileOpen] = useState(false);
  const [cashierName, setCashierName] = useState('');
  const [closingNotes, setClosingNotes] = useState('');
  const [denominations, setDenominations] = useState<{ [denom: number]: number }>({
    5000: 0,
    1000: 0,
    500: 0,
    100: 0,
    50: 0,
    20: 0,
    10: 0,
  });
  const [coinsOther, setCoinsOther] = useState<number>(0);

  const systemCashExpected = paymentBreakdown['cash']?.total || 0;
  const systemCashTransactions = paymentBreakdown['cash']?.count || 0;

  const physicalCashCounted = useMemo(() => {
    const notesTotal = Object.entries(denominations).reduce(
      (acc, [denom, count]) => acc + Number(denom) * (Number(count) || 0),
      0
    );
    return notesTotal + (Number(coinsOther) || 0);
  }, [denominations, coinsOther]);

  const cashVariance = physicalCashCounted - systemCashExpected;

  const handleDenominationChange = (denom: number, valueStr: string) => {
    const parsed = parseInt(valueStr, 10);
    setDenominations((prev) => ({
      ...prev,
      [denom]: isNaN(parsed) || parsed < 0 ? 0 : parsed,
    }));
  };

  const handleExportReconciliationCSV = () => {
    const nowIso = new Date().toISOString().split('T')[0];
    const headers = ['Metric / Field', 'Value', 'Details'];
    const rows = [
      ['Clinic Facility', 'Brimish Skin Care & Laser Clinic, Peshawar', 'Sami Tower, Ring Road'],
      ['Reconciliation Date', nowIso, ''],
      ['Cashier / Receptionist', cashierName || 'Front Desk Attendant', ''],
      ['Period Range Filter', timeRange, ''],
      ['System Cash Transactions Count', systemCashTransactions, 'Cash invoices issued'],
      ['System Expected Cash (PKR)', systemCashExpected, 'Recorded in database'],
      ['Physical Cash Counted (PKR)', physicalCashCounted, 'Actual physical money in drawer'],
      [
        'Cash Variance (PKR)',
        cashVariance,
        cashVariance === 0 ? 'BALANCED (Exact Match)' : cashVariance > 0 ? 'SURPLUS / EXCESS' : 'DEFICIT / SHORTAGE',
      ],
      ['--- Pakistani Rupee Denominations ---', '---', '---'],
      ['Rs. 5,000 Notes', denominations[5000], `Subtotal: PKR ${denominations[5000] * 5000}`],
      ['Rs. 1,000 Notes', denominations[1000], `Subtotal: PKR ${denominations[1000] * 1000}`],
      ['Rs. 500 Notes', denominations[500], `Subtotal: PKR ${denominations[500] * 500}`],
      ['Rs. 100 Notes', denominations[100], `Subtotal: PKR ${denominations[100] * 100}`],
      ['Rs. 50 Notes', denominations[50], `Subtotal: PKR ${denominations[50] * 50}`],
      ['Rs. 20 Notes', denominations[20], `Subtotal: PKR ${denominations[20] * 20}`],
      ['Rs. 10 Notes', denominations[10], `Subtotal: PKR ${denominations[10] * 10}`],
      ['Coins & Loose Change', coinsOther, `Subtotal: PKR ${coinsOther}`],
      ['Reception Shift Notes', closingNotes || 'None', ''],
    ];
    exportToCSV(`brimish-cash-reconciliation-${nowIso}`, headers, rows);
    toast.success('Shift Cash Reconciliation exported to CSV');
  };

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

  // Consolidated Unique Clinic Clients & Patients (EMR Registrations + Appointment Bookings + POS Invoices)
  const allUniqueClients = useMemo(() => {
    const map = new Map<
      string,
      {
        id: string;
        name: string;
        phone: string;
        email: string;
        gender: string;
        dateOfBirth: string;
        address: string;
        source: string;
        totalAppointments: number;
        totalInvoices: number;
        totalSpent: number;
        firstVisit: string;
        lastVisit: string;
        notes: string;
      }
    >();

    const normalizePhone = (ph: string) => ph.replace(/[\s\-_]/g, '').trim();

    // 1. Registered Patients in EMR
    patients.forEach((p) => {
      const normPh = normalizePhone(p.phone);
      if (!normPh) return;
      map.set(normPh, {
        id: p.id,
        name: p.name,
        phone: p.phone,
        email: p.email || '—',
        gender: p.gender ? p.gender.toUpperCase() : '—',
        dateOfBirth: p.date_of_birth || '—',
        address: p.address || '—',
        source: 'Registered Patient',
        totalAppointments: 0,
        totalInvoices: 0,
        totalSpent: 0,
        firstVisit: p.created_at,
        lastVisit: p.created_at,
        notes: p.notes || '—',
      });
    });

    // 2. Appointments (Include walk-ins and web bookings)
    appointments.forEach((a) => {
      const rawPhone = a.patients?.phone || a.customer_phone || '';
      const normPh = normalizePhone(rawPhone);
      if (!normPh) return;

      const pName = a.patients?.name?.trim() || a.customer_name?.trim() || '';
      const existing = map.get(normPh);
      if (existing) {
        existing.totalAppointments += 1;
        if (
          pName &&
          !pName.toLowerCase().includes('walk-in') &&
          (!existing.name || existing.name.toLowerCase().includes('walk-in'))
        ) {
          existing.name = pName;
        }
        if (a.customer_email && existing.email === '—') {
          existing.email = a.customer_email;
        }
        if (a.scheduled_at && new Date(a.scheduled_at) > new Date(existing.lastVisit)) {
          existing.lastVisit = a.scheduled_at;
        }
      } else {
        map.set(normPh, {
          id: a.patient_id || `APPT-${a.id.slice(0, 8).toUpperCase()}`,
          name: pName || 'Walk-in Booking Client',
          phone: a.customer_phone || rawPhone,
          email: a.customer_email || '—',
          gender: a.patients?.gender ? a.patients.gender.toUpperCase() : '—',
          dateOfBirth: '—',
          address: '—',
          source: 'Clinic Appointment Booking',
          totalAppointments: 1,
          totalInvoices: 0,
          totalSpent: 0,
          firstVisit: a.created_at,
          lastVisit: a.scheduled_at || a.created_at,
          notes: a.message?.trim() || '—',
        });
      }
    });

    // 3. Invoices (POS Walk-in and Consultations)
    invoices.forEach((inv) => {
      const rawPhone = inv.patients?.phone || inv.customer_phone || '';
      const normPh = normalizePhone(rawPhone);
      if (!normPh) return;

      const pName =
        inv.patients?.name?.trim() ||
        (inv.customer_name && !inv.customer_name.toLowerCase().includes('walk-in')
          ? inv.customer_name.trim()
          : '');
      const existing = map.get(normPh);
      if (existing) {
        existing.totalInvoices += 1;
        existing.totalSpent += Number(inv.total || 0);
        if (pName && (!existing.name || existing.name.toLowerCase().includes('walk-in'))) {
          existing.name = pName;
        }
        if (inv.customer_email && existing.email === '—') {
          existing.email = inv.customer_email;
        }
        if (inv.customer_address && existing.address === '—') {
          existing.address = inv.customer_address;
        }
        if (inv.created_at && new Date(inv.created_at) > new Date(existing.lastVisit)) {
          existing.lastVisit = inv.created_at;
        }
      } else {
        map.set(normPh, {
          id: inv.patient_id || `INV-${inv.invoice_number}`,
          name: pName || 'POS Invoice Customer',
          phone: inv.customer_phone || rawPhone,
          email: inv.customer_email || '—',
          gender: '—',
          dateOfBirth: '—',
          address: inv.customer_address || '—',
          source: 'POS Invoice Customer',
          totalAppointments: 0,
          totalInvoices: 1,
          totalSpent: Number(inv.total || 0),
          firstVisit: inv.created_at,
          lastVisit: inv.created_at,
          notes: '—',
        });
      }
    });

    return Array.from(map.values());
  }, [patients, appointments, invoices]);

  // Export Handlers with rich, complete patient and financial data
  const handleExportInvoices = () => {
    const headers = [
      'Invoice Number',
      'Date & Time',
      'Patient / Customer Name',
      'Phone Number',
      'Email',
      'Address',
      'Items / Services Purchased',
      'Total Items Quantity',
      'Subtotal (PKR)',
      'Discount (PKR)',
      'Tax (PKR)',
      'Net Total (PKR)',
      'Payment Method',
      'Payment Status',
      'Invoice Status',
    ];
    const rows = invoices.map((inv) => {
      let patientName = inv.customer_name?.trim() || '';
      if ((!patientName || patientName.toLowerCase().includes('walk-in')) && inv.patients?.name) {
        patientName = inv.patients.name;
      }
      if (!patientName) patientName = 'Walk-in Customer';

      const phone = inv.patients?.phone || inv.customer_phone || '—';
      const email = inv.patients?.email || inv.customer_email || '—';
      const address = inv.patients?.address || inv.customer_address || '—';

      const itemsDesc = (inv.invoice_line_items || [])
        .map((it) => `${it.description || 'Item'} (x${it.quantity || 1})`)
        .join('; ');

      const totalItemsQty = (inv.invoice_line_items || []).reduce(
        (sum, it) => sum + (Number(it.quantity) || 1),
        0
      );

      const d = inv.created_at ? new Date(inv.created_at) : null;
      const formattedDate = d
        ? `${formatDate(inv.created_at)} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
        : '—';

      return [
        inv.invoice_number,
        formattedDate,
        patientName,
        phone,
        email,
        address,
        itemsDesc || 'Clinical Consultation / Procedure',
        totalItemsQty || 1,
        Number(inv.subtotal) || 0,
        Number(inv.discount_amount) || 0,
        Number(inv.tax_amount) || 0,
        Number(inv.total) || 0,
        (inv.payment_method || 'cash').toUpperCase(),
        (inv.payment_status || 'paid').toUpperCase(),
        inv.status.toUpperCase(),
      ];
    });
    exportToCSV(`brimish-invoices-complete`, headers, rows);
    toast.success(`Exported ${invoices.length} complete invoices to CSV`);
  };

  const handleExportAppointments = () => {
    const headers = [
      'Booking ID',
      'Appointment Date',
      'Appointment Time',
      'Patient Name',
      'Patient Phone Number',
      'Patient Email',
      'Treatment / Procedure',
      'Estimated Fee (PKR)',
      'Duration',
      'Appointment Status',
      'Patient Notes / Symptoms',
      'Confirmed Date',
      'Booking Request Date',
    ];
    const rows = appointments.map((a) => {
      const d = a.scheduled_at ? new Date(a.scheduled_at) : null;
      let patientName = a.patients?.name?.trim() || a.customer_name?.trim() || '';
      if (!patientName) patientName = 'Walk-in Patient';

      const phone = a.patients?.phone?.trim() || a.customer_phone?.trim() || '—';
      const email = a.patients?.email?.trim() || a.customer_email?.trim() || '—';
      const treatmentName = a.treatments?.name || 'General Consultation';
      const treatmentFee = a.treatments?.price ? Number(a.treatments.price) : 0;
      const duration = a.duration_minutes ? `${a.duration_minutes} mins` : '30 mins';

      return [
        a.id.slice(0, 8).toUpperCase(),
        d ? formatDate(a.scheduled_at) : '—',
        d ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—',
        patientName,
        phone,
        email,
        treatmentName,
        treatmentFee,
        duration,
        a.status.toUpperCase(),
        a.message?.trim() || '—',
        a.confirmed_at ? formatDate(a.confirmed_at) : '—',
        formatDate(a.created_at),
      ];
    });
    exportToCSV(`brimish-appointments-complete`, headers, rows);
    toast.success(`Exported ${appointments.length} appointment bookings to CSV`);
  };

  const handleExportPatients = () => {
    const headers = [
      'Patient ID',
      'Patient / Client Name',
      'Phone Number',
      'Email',
      'Gender',
      'Date of Birth',
      'Address',
      'Record Type',
      'Total Appointments',
      'Total Invoices',
      'Total Amount Spent (PKR)',
      'First Interaction Date',
      'Last Interaction Date',
      'Notes / History',
    ];
    const rows = allUniqueClients.map((p) => [
      p.id,
      p.name,
      p.phone,
      p.email,
      p.gender,
      p.dateOfBirth,
      p.address,
      p.source,
      p.totalAppointments,
      p.totalInvoices,
      p.totalSpent,
      formatDate(p.firstVisit),
      formatDate(p.lastVisit),
      p.notes,
    ]);
    exportToCSV(`brimish-patients-directory`, headers, rows);
    toast.success(`Exported ${allUniqueClients.length} complete patient & client profiles`);
  };

  const handleExportInventory = () => {
    const headers = [
      'Product Name',
      'SKU',
      'Category',
      'Stock Quantity',
      'Reserved Quantity',
      'Available Stock',
      'Low Stock Threshold',
      'Stock Status',
      'Cost Price (PKR)',
      'Sale Price (PKR)',
      'Profit Margin (%)',
      'Total Retail Valuation (PKR)',
      'Expiry Date',
    ];
    const rows = products.map((p) => {
      const available = Math.max(0, p.stock_quantity - (p.reserved_quantity || 0));
      const threshold = p.low_stock_threshold || 5;
      const status =
        p.stock_quantity === 0
          ? 'OUT OF STOCK'
          : p.stock_quantity <= threshold
          ? 'LOW STOCK ALERT'
          : 'IN STOCK';
      const margin =
        p.sale_price > 0 && p.purchase_price > 0
          ? Math.round(((p.sale_price - p.purchase_price) / p.sale_price) * 100)
          : 0;

      return [
        p.name,
        p.sku,
        p.product_categories?.name || 'Uncategorized',
        p.stock_quantity,
        p.reserved_quantity || 0,
        available,
        threshold,
        status,
        Number(p.purchase_price) || 0,
        Number(p.sale_price) || 0,
        `${margin}%`,
        (p.stock_quantity || 0) * (Number(p.sale_price) || 0),
        p.expiry_date || '—',
      ];
    });
    exportToCSV(`brimish-inventory-valuation`, headers, rows);
    toast.success(`Exported ${products.length} products inventory to CSV`);
  };

  const handleExportOrders = () => {
    const headers = [
      'Order Number',
      'Order Date & Time',
      'Customer Name',
      'Phone Number',
      'Email',
      'Delivery Method',
      'Delivery City',
      'Delivery Address',
      'Products Ordered',
      'Total Items Quantity',
      'Subtotal (PKR)',
      'Delivery Fee (PKR)',
      'Net Total (PKR)',
      'Payment Method',
      'Payment Status',
      'Order Status',
    ];
    const rows = orders.map((o) => {
      const itemsStr = (o.order_items || [])
        .map((it) => `${it.name} (x${it.quantity})`)
        .join('; ');
      const totalItemsQty = (o.order_items || []).reduce(
        (sum, it) => sum + (Number(it.quantity) || 1),
        0
      );
      const d = o.created_at ? new Date(o.created_at) : null;
      const formattedDate = d
        ? `${formatDate(o.created_at)} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
        : '—';

      return [
        o.order_number,
        formattedDate,
        o.customer_name || '—',
        o.customer_phone || '—',
        o.customer_email || '—',
        (o.delivery_method || 'courier').toUpperCase(),
        o.delivery_city || '—',
        o.delivery_address || '—',
        itemsStr || 'Skincare Storefront Order',
        totalItemsQty || 1,
        Number(o.subtotal || o.total) || 0,
        Number(o.delivery_fee) || 0,
        Number(o.total) || 0,
        (o.payment_method || 'cod').toUpperCase(),
        (o.payment_status || 'pending').toUpperCase(),
        o.status.toUpperCase(),
      ];
    });
    exportToCSV(`brimish-online-orders`, headers, rows);
    toast.success(`Exported ${orders.length} online orders to CSV`);
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
          <Button
            size="sm"
            onClick={() => setIsReconcileOpen(true)}
            className="bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs shadow-xs flex items-center gap-1.5"
          >
            <Banknote className="h-3.5 w-3.5" />
            Cash Reconciliation
          </Button>

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
        {/* Total Revenue (Rose) */}
        <Card className="border border-rose-200/80 hover:border-rose-500 hover:shadow-lg hover:shadow-rose-500/15 transition-all duration-300 shadow-xs bg-gradient-to-br from-white via-white to-rose-50/40 rounded-2xl cursor-pointer">
          <CardHeader className="pb-2">
            <CardDescription className="text-rose-700/80 font-bold uppercase tracking-wider text-[11px]">
              Total Revenue Collected
            </CardDescription>
            <CardTitle className="text-2xl font-extrabold text-gray-900 font-serif">
              {formatCurrency(totalRevenue)}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-[11px] text-gray-500 flex items-center gap-1 font-medium">
              <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
              {paidInvoices.length} paid invoices in period
            </p>
          </CardContent>
        </Card>

        {/* Average Ticket Value (Blue) */}
        <Card className="border border-blue-200/80 hover:border-blue-500 hover:shadow-lg hover:shadow-blue-500/15 transition-all duration-300 shadow-xs bg-gradient-to-br from-white via-white to-blue-50/40 rounded-2xl cursor-pointer">
          <CardHeader className="pb-2">
            <CardDescription className="text-blue-700/80 font-bold uppercase tracking-wider text-[11px]">
              Average Ticket Value
            </CardDescription>
            <CardTitle className="text-2xl font-extrabold text-gray-900 font-serif">
              {formatCurrency(avgTicket)}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-[11px] text-gray-500 font-medium">Per paying transaction</p>
          </CardContent>
        </Card>

        {/* Appointment Completion Rate (Emerald) */}
        <Card className="border border-emerald-200/80 hover:border-emerald-500 hover:shadow-lg hover:shadow-emerald-500/15 transition-all duration-300 shadow-xs bg-gradient-to-br from-white via-white to-emerald-50/40 rounded-2xl cursor-pointer">
          <CardHeader className="pb-2">
            <CardDescription className="text-emerald-700/80 font-bold uppercase tracking-wider text-[11px]">
              Appointment Completion Rate
            </CardDescription>
            <CardTitle className="text-2xl font-extrabold text-emerald-600 font-serif">
              {completionRate}%
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-[11px] text-gray-500 font-medium">
              {completedAppts} of {totalAppts} total appointments
            </p>
          </CardContent>
        </Card>

        {/* Retail Stock Valuation (Amber) */}
        <Card className="border border-amber-200/80 hover:border-amber-500 hover:shadow-lg hover:shadow-amber-500/15 transition-all duration-300 shadow-xs bg-gradient-to-br from-white via-white to-amber-50/40 rounded-2xl cursor-pointer">
          <CardHeader className="pb-2">
            <CardDescription className="text-amber-700/80 font-bold uppercase tracking-wider text-[11px]">
              Retail Stock Valuation
            </CardDescription>
            <CardTitle className="text-2xl font-extrabold text-gray-900 font-serif">
              {formatCurrency(totalStockValuation)}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-[11px] text-gray-500 font-medium">{totalStockItems} items across all categories</p>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Breakdown Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Appointment Status Breakdown (Blue) */}
        <Card className="border border-blue-200/80 hover:border-blue-500 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300 rounded-2xl sm:rounded-3xl bg-white overflow-hidden shadow-xs">
          <CardHeader>
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-600" />
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

        {/* Payment Methods Breakdown (Purple) */}
        <Card className="border border-purple-200/80 hover:border-purple-500 hover:shadow-lg hover:shadow-purple-500/10 transition-all duration-300 rounded-2xl sm:rounded-3xl bg-white overflow-hidden shadow-xs">
          <CardHeader>
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-purple-600" />
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
                        className="bg-purple-500 h-2 rounded-full transition-all"
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

      {/* One-Click CSV Data Export Hub (Emerald) */}
      <Card className="border border-emerald-200/80 hover:border-emerald-500 hover:shadow-lg hover:shadow-emerald-500/10 transition-all duration-300 rounded-2xl sm:rounded-3xl bg-white overflow-hidden shadow-xs">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
            <Button
              onClick={handleExportInvoices}
              variant="outline"
              className="h-18 flex flex-col items-center justify-center gap-1 rounded-xl border border-emerald-200 hover:border-emerald-500 hover:bg-emerald-50/60 hover:shadow-md hover:shadow-emerald-500/15 transition-all duration-200 group cursor-pointer text-center px-2"
            >
              <Download className="h-4 w-4 text-emerald-600 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-semibold text-gray-800">Export Invoices CSV</span>
              <span className="text-[10px] text-gray-500 font-medium">
                {invoices.length} invoices (items & patients)
              </span>
            </Button>

            <Button
              onClick={handleExportAppointments}
              variant="outline"
              className="h-18 flex flex-col items-center justify-center gap-1 rounded-xl border border-blue-200 hover:border-blue-500 hover:bg-blue-50/60 hover:shadow-md hover:shadow-blue-500/15 transition-all duration-200 group cursor-pointer text-center px-2"
            >
              <Download className="h-4 w-4 text-blue-600 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-semibold text-gray-800">Export Appointments CSV</span>
              <span className="text-[10px] text-gray-500 font-medium">
                {appointments.length} bookings (patient names & phone)
              </span>
            </Button>

            <Button
              onClick={handleExportPatients}
              variant="outline"
              className="h-18 flex flex-col items-center justify-center gap-1 rounded-xl border border-purple-200 hover:border-purple-500 hover:bg-purple-50/60 hover:shadow-md hover:shadow-purple-500/15 transition-all duration-200 group cursor-pointer text-center px-2"
            >
              <Download className="h-4 w-4 text-purple-600 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-semibold text-gray-800">Export Patients CSV</span>
              <span className="text-[10px] text-gray-500 font-medium">
                {allUniqueClients.length} complete patient profiles
              </span>
            </Button>

            <Button
              onClick={handleExportInventory}
              variant="outline"
              className="h-18 flex flex-col items-center justify-center gap-1 rounded-xl border border-amber-200 hover:border-amber-500 hover:bg-amber-50/60 hover:shadow-md hover:shadow-amber-500/15 transition-all duration-200 group cursor-pointer text-center px-2"
            >
              <Download className="h-4 w-4 text-amber-600 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-semibold text-gray-800">Export Inventory CSV</span>
              <span className="text-[10px] text-gray-500 font-medium">
                {products.length} products (stock & margins)
              </span>
            </Button>

            <Button
              onClick={handleExportOrders}
              variant="outline"
              className="h-18 flex flex-col items-center justify-center gap-1 rounded-xl border border-rose-200 hover:border-rose-500 hover:bg-rose-50/60 hover:shadow-md hover:shadow-rose-500/15 transition-all duration-200 group cursor-pointer text-center px-2"
            >
              <Download className="h-4 w-4 text-rose-600 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-semibold text-gray-800">Export Orders CSV</span>
              <span className="text-[10px] text-gray-500 font-medium">
                {orders.length} online orders (delivery & items)
              </span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Front-Desk Cash Drawer Reconciliation Dialog */}
      <Dialog open={isReconcileOpen} onOpenChange={setIsReconcileOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto p-6">
          <DialogHeader className="border-b pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
                  <Banknote className="h-5 w-5" />
                </div>
                <div>
                  <DialogTitle className="text-lg font-bold text-gray-900">
                    Front-Desk Cash Counter Reconciliation
                  </DialogTitle>
                  <DialogDescription className="text-xs text-gray-500">
                    Verify physical cash drawer notes against system cash transactions ({timeRange === 'today' ? "Today's shift" : `Filter: ${timeRange}`}).
                  </DialogDescription>
                </div>
              </div>
            </div>
          </DialogHeader>

          <div id="printable-reconciliation-slip" className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-2">
            {/* Left: Pakistani Rupee Physical Denomination Input (7 cols) */}
            <div className="md:col-span-7 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
                  <Calculator className="h-3.5 w-3.5 text-emerald-600" />
                  Physical Note Count (PKR)
                </h4>
                <span className="text-[11px] text-gray-500">Enter note quantities</span>
              </div>

              <div className="border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100 text-xs">
                {[5000, 1000, 500, 100, 50, 20, 10].map((denom) => (
                  <div key={denom} className="grid grid-cols-12 items-center px-3 py-2 hover:bg-gray-50/70 transition-colors">
                    <div className="col-span-4 font-semibold text-gray-800">
                      Rs. {denom.toLocaleString()}
                    </div>
                    <div className="col-span-4 px-2">
                      <Input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={denominations[denom] || ''}
                        onChange={(e) => handleDenominationChange(denom, e.target.value)}
                        className="h-7 text-xs text-center font-mono"
                      />
                    </div>
                    <div className="col-span-4 text-right font-mono font-medium text-gray-700">
                      {formatCurrency(denom * (denominations[denom] || 0))}
                    </div>
                  </div>
                ))}

                <div className="grid grid-cols-12 items-center px-3 py-2 bg-stone-50/50">
                  <div className="col-span-4 font-medium text-gray-600">
                    Coins / Other
                  </div>
                  <div className="col-span-4 px-2">
                    <Input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={coinsOther || ''}
                      onChange={(e) => setCoinsOther(Math.max(0, parseInt(e.target.value, 10) || 0))}
                      className="h-7 text-xs text-center font-mono"
                    />
                  </div>
                  <div className="col-span-4 text-right font-mono font-medium text-gray-700">
                    {formatCurrency(coinsOther)}
                  </div>
                </div>

                <div className="grid grid-cols-12 items-center px-3 py-2.5 bg-emerald-50/70 font-bold">
                  <div className="col-span-6 text-emerald-900">
                    Total Physical Cash Counted
                  </div>
                  <div className="col-span-6 text-right font-mono text-emerald-800 text-sm">
                    {formatCurrency(physicalCashCounted)}
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Reconciliation Comparison, Shift Info & Actions (5 cols) */}
            <div className="md:col-span-5 space-y-4 flex flex-col justify-between">
              <div className="space-y-4">
                {/* System vs Physical Summary */}
                <div className="p-3.5 rounded-xl border border-gray-200 bg-gray-50/70 space-y-2.5 text-xs">
                  <div className="flex justify-between items-center text-gray-600">
                    <span>System Cash Recorded:</span>
                    <span className="font-mono font-bold text-gray-900">{formatCurrency(systemCashExpected)}</span>
                  </div>
                  <div className="text-[11px] text-gray-500">
                    Based on {systemCashTransactions} paid cash invoices in this period.
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-gray-200 text-gray-600">
                    <span>Physical Cash Counted:</span>
                    <span className="font-mono font-bold text-emerald-700">{formatCurrency(physicalCashCounted)}</span>
                  </div>
                </div>

                {/* Variance Banner */}
                <div
                  className={cn(
                    'p-3.5 rounded-xl border flex items-start gap-2.5 text-xs',
                    cashVariance === 0
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                      : cashVariance > 0
                      ? 'bg-blue-50 border-blue-200 text-blue-900'
                      : 'bg-rose-50 border-rose-200 text-rose-900'
                  )}
                >
                  {cashVariance === 0 ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <p className="font-bold">
                      {cashVariance === 0
                        ? 'Drawer Balanced (0 PKR Variance)'
                        : cashVariance > 0
                        ? `Cash Surplus: +${formatCurrency(cashVariance)}`
                        : `Cash Deficit: ${formatCurrency(cashVariance)}`}
                    </p>
                    <p className="text-[11px] opacity-90 mt-0.5">
                      {cashVariance === 0
                        ? 'Physical cash in drawer perfectly matches system sales.'
                        : cashVariance > 0
                        ? 'Drawer contains more cash than recorded sales.'
                        : 'Physical cash is less than registered system invoices.'}
                    </p>
                  </div>
                </div>

                {/* Receptionist Sign-Off */}
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-gray-700">Cashier / Receptionist Name</Label>
                  <Input
                    placeholder="e.g. Ayesha Khan (Front Desk)"
                    value={cashierName}
                    onChange={(e) => setCashierName(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-gray-700">Closing Notes / Handover</Label>
                  <Input
                    placeholder="e.g. Handed cash over to Dr. Bilal, drawer locked."
                    value={closingNotes}
                    onChange={(e) => setClosingNotes(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2">
                <Button
                  onClick={handleExportReconciliationCSV}
                  className="w-full h-8 text-xs bg-emerald-700 hover:bg-emerald-800 text-white font-medium flex items-center justify-center gap-1.5"
                >
                  <Download className="h-3.5 w-3.5" />
                  Export Shift Closing CSV
                </Button>
                <Button
                  onClick={() => printReceipt('printable-reconciliation-slip', 'Shift-Cash-Reconciliation')}
                  variant="outline"
                  className="w-full h-8 text-xs border-gray-300 hover:bg-gray-100 flex items-center justify-center gap-1.5"
                  title="Print slip or save as PDF"
                >
                  <Printer className="h-3.5 w-3.5 text-gray-600" />
                  Print / Save PDF
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter className="mt-4 pt-3 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsReconcileOpen(false)}
              className="text-xs"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
