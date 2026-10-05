'use client';

import React, { useMemo, useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  type ChartOptions,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  TrendingUp,
  Calendar,
  DollarSign,
  PieChart,
  BarChart3,
  CheckCircle2,
  CreditCard,
  Banknote,
  Building2,
  Activity,
  ArrowUpRight,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils/helpers';

// Register Chart.js modules
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export interface ChartDayData {
  dayLabel: string;
  dateISO: string;
  revenue: number;
  appointments: number;
}

export interface ChartStatusData {
  completed: number;
  confirmed: number;
  pending: number;
  cancelled: number;
}

export interface ChartPaymentData {
  cash: number;
  card: number;
  bank_transfer: number;
}

export interface DashboardChartsProps {
  dailyData: ChartDayData[];
  statusData: ChartStatusData;
  paymentData: ChartPaymentData;
  isAdmin: boolean;
  allTimeRevenue?: number;
  allTimeAppointments?: number;
}

export function DashboardCharts({
  dailyData,
  statusData,
  paymentData,
  isAdmin,
  allTimeRevenue,
  allTimeAppointments,
}: DashboardChartsProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Aggregate stats
  const calculated7DayRevenue = useMemo(
    () => dailyData.reduce((acc, curr) => acc + curr.revenue, 0),
    [dailyData]
  );

  const displayRevenue = allTimeRevenue !== undefined ? allTimeRevenue : calculated7DayRevenue;

  const calculated7DayAppointments = useMemo(
    () => dailyData.reduce((acc, curr) => acc + curr.appointments, 0),
    [dailyData]
  );

  const displayAppointments = allTimeAppointments !== undefined ? allTimeAppointments : calculated7DayAppointments;

  const totalStatusAppointments =
    statusData.completed + statusData.confirmed + statusData.pending + statusData.cancelled;

  const completionRate =
    totalStatusAppointments > 0
      ? Math.round((statusData.completed / totalStatusAppointments) * 100)
      : 100;

  const totalPaymentRevenue =
    paymentData.cash + paymentData.card + paymentData.bank_transfer;

  const dominantPaymentMethod = useMemo(() => {
    if (paymentData.cash >= paymentData.card && paymentData.cash >= paymentData.bank_transfer) {
      return { label: 'Cash at Clinic', percent: totalPaymentRevenue > 0 ? Math.round((paymentData.cash / totalPaymentRevenue) * 100) : 100 };
    }
    if (paymentData.card >= paymentData.bank_transfer) {
      return { label: 'Card Terminal', percent: totalPaymentRevenue > 0 ? Math.round((paymentData.card / totalPaymentRevenue) * 100) : 100 };
    }
    return { label: 'Bank Transfer', percent: totalPaymentRevenue > 0 ? Math.round((paymentData.bank_transfer / totalPaymentRevenue) * 100) : 100 };
  }, [paymentData, totalPaymentRevenue]);

  if (!mounted) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8 h-80 rounded-2xl sm:rounded-3xl bg-white border border-gray-100 p-6 animate-pulse" />
        <div className="lg:col-span-4 h-80 rounded-2xl sm:rounded-3xl bg-white border border-gray-100 p-6 animate-pulse" />
      </div>
    );
  }

  // 1. Line Chart Data: 7-Day Revenue Velocity
  const lineChartData = {
    labels: dailyData.map((d) => d.dayLabel),
    datasets: [
      {
        label: 'Daily Revenue (PKR)',
        data: dailyData.map((d) => d.revenue),
        borderColor: '#e11d48',
        backgroundColor: (context: any) => {
          const ctx = context?.chart?.ctx;
          if (!ctx) return 'rgba(225, 29, 72, 0.12)';
          try {
            const gradient = ctx.createLinearGradient(0, 0, 0, 240);
            gradient.addColorStop(0, 'rgba(225, 29, 72, 0.28)');
            gradient.addColorStop(1, 'rgba(225, 29, 72, 0.01)');
            return gradient;
          } catch {
            return 'rgba(225, 29, 72, 0.12)';
          }
        },
        fill: true,
        tension: 0.38,
        pointBackgroundColor: '#e11d48',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  };

  const lineChartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: '#09090b',
        titleFont: { size: 12, weight: 'bold' },
        bodyFont: { size: 12 },
        padding: 10,
        cornerRadius: 10,
        callbacks: {
          label: (context) => `Revenue: ${formatCurrency(Number(context.parsed.y) || 0)}`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { size: 11 }, color: '#71717a' },
      },
      y: {
        grid: { color: 'rgba(228, 228, 231, 0.6)' },
        ticks: {
          font: { size: 11 },
          color: '#71717a',
          callback: (value) => `Rs. ${(Number(value) / 1000).toFixed(0)}k`,
        },
        beginAtZero: true,
      },
    },
  };

  // 2. Bar Chart Data: Daily Appointment Traffic
  const barChartData = {
    labels: dailyData.map((d) => d.dayLabel),
    datasets: [
      {
        label: 'Patients Scheduled',
        data: dailyData.map((d) => d.appointments),
        backgroundColor: 'rgba(59, 130, 246, 0.85)',
        hoverBackgroundColor: '#2563eb',
        borderRadius: 8,
        borderSkipped: false,
      },
    ],
  };

  const barChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: '#09090b',
        padding: 10,
        cornerRadius: 10,
        callbacks: {
          label: (context) => `Patients: ${context.parsed.y} booked`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { size: 11 }, color: '#71717a' },
      },
      y: {
        grid: { color: 'rgba(228, 228, 231, 0.6)' },
        ticks: {
          stepSize: 1,
          font: { size: 11 },
          color: '#71717a',
        },
        beginAtZero: true,
      },
    },
  };

  // 3. Doughnut Chart: Appointment Status Breakdown
  const doughnutStatusData = {
    labels: ['Completed', 'Confirmed', 'Pending', 'Cancelled/Rescheduled'],
    datasets: [
      {
        data: [
          statusData.completed,
          statusData.confirmed,
          statusData.pending,
          statusData.cancelled,
        ],
        backgroundColor: [
          '#10b981', // emerald
          '#3b82f6', // blue
          '#f59e0b', // amber
          '#f43f5e', // rose
        ],
        borderWidth: 2,
        borderColor: '#ffffff',
        hoverOffset: 4,
      },
    ],
  };

  const doughnutStatusOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '74%',
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: '#09090b',
        padding: 10,
        cornerRadius: 10,
      },
    },
  };

  // 4. Doughnut Chart: Payment Channel Breakdown
  const doughnutPaymentData = {
    labels: ['Cash', 'Card Terminal', 'Bank Transfer'],
    datasets: [
      {
        data: [
          paymentData.cash,
          paymentData.card,
          paymentData.bank_transfer,
        ],
        backgroundColor: [
          '#059669', // emerald
          '#8b5cf6', // purple
          '#0284c7', // sky
        ],
        borderWidth: 2,
        borderColor: '#ffffff',
        hoverOffset: 4,
      },
    ],
  };

  const doughnutPaymentOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '74%',
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: '#09090b',
        padding: 10,
        cornerRadius: 10,
        callbacks: {
          label: (context) => `${context.label}: ${formatCurrency(Number(context.raw) || 0)}`,
        },
      },
    },
  };

  return (
    <div className="space-y-6">
      {/* Analytics Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-rose-600" />
            <h2 className="text-lg sm:text-xl font-bold text-gray-950 font-serif tracking-tight">
              Clinical Intelligence & Visual Analytics
            </h2>
            <Badge variant="secondary" className="text-[10px] font-bold bg-rose-50 text-rose-700 border-rose-200">
              Chart.js Engine
            </Badge>
          </div>
          <p className="text-xs text-gray-500">
            Real-time visual breakdown of revenue velocity, appointment volume, and payment channels
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-medium text-gray-500 bg-white border border-gray-200/80 px-3 py-1 rounded-full shadow-xs">
            All-Time Performance · PKR
          </span>
        </div>
      </div>

      {/* 4 Quick Analytics Mini-KPI Badges */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* All-Time Revenue (Rose) */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-white via-white to-rose-50/25 border border-rose-200/80 hover:border-rose-500 hover:shadow-lg hover:shadow-rose-500/10 transition-all duration-300 shadow-xs flex items-center gap-3 cursor-pointer group">
          <div className="h-10 w-10 rounded-xl bg-rose-100/70 text-rose-600 group-hover:bg-rose-600 group-hover:text-white flex items-center justify-center shrink-0 group-hover:scale-110 transition-all duration-300">
            <DollarSign className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-rose-700/80">All-Time Revenue</p>
            <p className="text-base sm:text-lg font-bold text-gray-950 truncate font-serif group-hover:text-rose-950 transition-colors">
              {formatCurrency(displayRevenue)}
            </p>
          </div>
        </div>

        {/* All-Time Patients (Blue) */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-white via-white to-blue-50/25 border border-blue-200/80 hover:border-blue-500 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300 shadow-xs flex items-center gap-3 cursor-pointer group">
          <div className="h-10 w-10 rounded-xl bg-blue-100/70 text-blue-600 group-hover:bg-blue-600 group-hover:text-white flex items-center justify-center shrink-0 group-hover:scale-110 transition-all duration-300">
            <Calendar className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-blue-700/80">All-Time Patients</p>
            <p className="text-base sm:text-lg font-bold text-gray-950 truncate font-serif group-hover:text-blue-950 transition-colors">
              {displayAppointments} Visits
            </p>
          </div>
        </div>

        {/* Completion Rate (Emerald) */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-white via-white to-emerald-50/25 border border-emerald-200/80 hover:border-emerald-500 hover:shadow-lg hover:shadow-emerald-500/10 transition-all duration-300 shadow-xs flex items-center gap-3 cursor-pointer group">
          <div className="h-10 w-10 rounded-xl bg-emerald-100/70 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white flex items-center justify-center shrink-0 group-hover:scale-110 transition-all duration-300">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700/80">Completion Rate</p>
            <p className="text-base sm:text-lg font-bold text-emerald-700 truncate font-serif group-hover:text-emerald-900 transition-colors">
              {completionRate}% Complete
            </p>
          </div>
        </div>

        {/* Top Payment Channel (Purple) */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-white via-white to-purple-50/25 border border-purple-200/80 hover:border-purple-500 hover:shadow-lg hover:shadow-purple-500/10 transition-all duration-300 shadow-xs flex items-center gap-3 cursor-pointer group">
          <div className="h-10 w-10 rounded-xl bg-purple-100/70 text-purple-600 group-hover:bg-purple-600 group-hover:text-white flex items-center justify-center shrink-0 group-hover:scale-110 transition-all duration-300">
            <CreditCard className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-purple-700/80">Top Payment Channel</p>
            <p className="text-xs sm:text-sm font-bold text-gray-950 truncate font-serif group-hover:text-purple-950 transition-colors">
              {dominantPaymentMethod.label} ({dominantPaymentMethod.percent}%)
            </p>
          </div>
        </div>
      </div>

      {/* Row 1: Line Chart (Revenue Velocity) + Bar Chart (Patient Inflow) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Revenue Velocity (7 cols - Rose) */}
        <Card className="lg:col-span-7 border border-rose-200/80 hover:border-rose-500 hover:shadow-lg hover:shadow-rose-500/10 transition-all duration-300 rounded-2xl sm:rounded-3xl bg-white overflow-hidden shadow-xs">
          <CardHeader className="p-5 pb-3 border-b border-gray-100 bg-gray-50/40 flex flex-row items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-rose-600" />
                <CardTitle className="text-base font-bold text-gray-950 font-serif">
                  Daily Revenue Velocity
                </CardTitle>
              </div>
              <CardDescription className="text-xs text-gray-500">
                Revenue velocity & trends (PKR) across clinic services & retail products
              </CardDescription>
            </div>
            <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200">
              {formatCurrency(displayRevenue)} total
            </span>
          </CardHeader>
          <CardContent className="p-5">
            <div className="h-64 sm:h-72 w-full">
              <Line data={lineChartData} options={lineChartOptions} />
            </div>
          </CardContent>
        </Card>

        {/* Right: Daily Patient Appointment Volume (5 cols - Blue) */}
        <Card className="lg:col-span-5 border border-blue-200/80 hover:border-blue-500 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300 rounded-2xl sm:rounded-3xl bg-white overflow-hidden shadow-xs">
          <CardHeader className="p-5 pb-3 border-b border-gray-100 bg-gray-50/40 flex flex-row items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-blue-600" />
                <CardTitle className="text-base font-bold text-gray-950 font-serif">
                  Patient Inflow Volume
                </CardTitle>
              </div>
              <CardDescription className="text-xs text-gray-500">
                Patient consultation & procedure traffic per day
              </CardDescription>
            </div>
            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
              {displayAppointments} visits
            </span>
          </CardHeader>
          <CardContent className="p-5">
            <div className="h-64 sm:h-72 w-full">
              <Bar data={barChartData} options={barChartOptions} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 2: Doughnut Charts (Appointment Status Outcomes + Payment Channels) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Appointment Status Breakdown (Emerald) */}
        <Card className="border border-emerald-200/80 hover:border-emerald-500 hover:shadow-lg hover:shadow-emerald-500/10 transition-all duration-300 rounded-2xl sm:rounded-3xl bg-white overflow-hidden shadow-xs">
          <CardHeader className="p-5 pb-3 border-b border-gray-100 bg-gray-50/40">
            <div className="flex items-center gap-2">
              <PieChart className="h-4 w-4 text-emerald-600" />
              <CardTitle className="text-base font-bold text-gray-950 font-serif">
                Appointment Status Distribution
              </CardTitle>
            </div>
            <CardDescription className="text-xs text-gray-500">
              Breakdown of scheduled visits by clinical consultation status
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5 sm:p-6">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              {/* Doughnut Ring */}
              <div className="relative h-48 w-48 shrink-0">
                <Doughnut data={doughnutStatusData} options={doughnutStatusOptions} />
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-2xl font-bold font-serif text-gray-950">
                    {totalStatusAppointments}
                  </span>
                  <span className="text-[10px] uppercase font-bold text-gray-400">Total Visits</span>
                </div>
              </div>

              {/* Custom Legend */}
              <div className="flex-1 w-full space-y-2.5 text-xs">
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50/70 hover:bg-emerald-50/50 border border-emerald-200/80 hover:border-emerald-500 hover:shadow-xs transition-all duration-150 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                    <span className="font-semibold text-gray-800">Completed Visits</span>
                  </div>
                  <span className="font-bold text-gray-950">{statusData.completed}</span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50/70 hover:bg-blue-50/50 border border-blue-200/80 hover:border-blue-500 hover:shadow-xs transition-all duration-150 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                    <span className="font-semibold text-gray-800">Confirmed Slots</span>
                  </div>
                  <span className="font-bold text-gray-950">{statusData.confirmed}</span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50/70 hover:bg-amber-50/50 border border-amber-200/80 hover:border-amber-500 hover:shadow-xs transition-all duration-150 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                    <span className="font-semibold text-gray-800">Pending Approval</span>
                  </div>
                  <span className="font-bold text-gray-950">{statusData.pending}</span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50/70 hover:bg-rose-50/50 border border-rose-200/80 hover:border-rose-500 hover:shadow-xs transition-all duration-150 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
                    <span className="font-semibold text-gray-800">Cancelled / No-Show</span>
                  </div>
                  <span className="font-bold text-gray-950">{statusData.cancelled}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Channels & Revenue Share (Purple) */}
        {isAdmin && (
          <Card className="border border-purple-200/80 hover:border-purple-500 hover:shadow-lg hover:shadow-purple-500/10 transition-all duration-300 rounded-2xl sm:rounded-3xl bg-white overflow-hidden shadow-xs">
            <CardHeader className="p-5 pb-3 border-b border-gray-100 bg-gray-50/40">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-purple-600" />
                <CardTitle className="text-base font-bold text-gray-950 font-serif">
                  Payment Channels & Tender Share
                </CardTitle>
              </div>
              <CardDescription className="text-xs text-gray-500">
                Distribution of clinic revenue collected across payment methods
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5 sm:p-6">
              <div className="flex flex-col sm:flex-row items-center gap-6">
                {/* Doughnut Ring */}
                <div className="relative h-48 w-48 shrink-0">
                  <Doughnut data={doughnutPaymentData} options={doughnutPaymentOptions} />
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-sm font-bold font-serif text-gray-950 truncate max-w-[120px]">
                      {formatCurrency(totalPaymentRevenue)}
                    </span>
                    <span className="text-[10px] uppercase font-bold text-gray-400">Total Billed</span>
                  </div>
                </div>

                {/* Custom Legend */}
                <div className="flex-1 w-full space-y-2.5 text-xs">
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50/70 hover:bg-emerald-50/50 border border-emerald-200/80 hover:border-emerald-500 hover:shadow-xs transition-all duration-150 cursor-pointer">
                    <div className="flex items-center gap-2">
                      <Banknote className="h-4 w-4 text-emerald-600" />
                      <span className="font-semibold text-gray-800">Cash at Front-Desk</span>
                    </div>
                    <span className="font-bold text-gray-950 font-serif">
                      {formatCurrency(paymentData.cash)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50/70 hover:bg-purple-50/50 border border-purple-200/80 hover:border-purple-500 hover:shadow-xs transition-all duration-150 cursor-pointer">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-purple-600" />
                      <span className="font-semibold text-gray-800">Card POS Machine</span>
                    </div>
                    <span className="font-bold text-gray-950 font-serif">
                      {formatCurrency(paymentData.card)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50/70 hover:bg-sky-50/50 border border-sky-200/80 hover:border-sky-500 hover:shadow-xs transition-all duration-150 cursor-pointer">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-sky-600" />
                      <span className="font-semibold text-gray-800">Bank Transfer / Raast</span>
                    </div>
                    <span className="font-bold text-gray-950 font-serif">
                      {formatCurrency(paymentData.bank_transfer)}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
