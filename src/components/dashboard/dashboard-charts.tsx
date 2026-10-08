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

  // 1. Line Chart Data: 7-Day Revenue Velocity (Vibrant Ruby Red)
  const lineChartData = {
    labels: dailyData.map((d) => d.dayLabel),
    datasets: [
      {
        label: 'Daily Revenue (PKR)',
        data: dailyData.map((d) => d.revenue),
        borderColor: '#e11d48',
        borderWidth: 3.5,
        backgroundColor: (context: any) => {
          const ctx = context?.chart?.ctx;
          if (!ctx) return 'rgba(225, 29, 72, 0.2)';
          try {
            const gradient = ctx.createLinearGradient(0, 0, 0, 260);
            gradient.addColorStop(0, 'rgba(225, 29, 72, 0.45)');
            gradient.addColorStop(1, 'rgba(225, 29, 72, 0.05)');
            return gradient;
          } catch {
            return 'rgba(225, 29, 72, 0.2)';
          }
        },
        fill: true,
        tension: 0.38,
        pointBackgroundColor: '#e11d48',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2.5,
        pointRadius: 5,
        pointHoverRadius: 7,
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
        backgroundColor: '#0f172a',
        borderColor: '#e11d48',
        borderWidth: 1.5,
        titleColor: '#ffffff',
        bodyColor: '#f8fafc',
        titleFont: { size: 12, weight: 'bold' },
        bodyFont: { size: 12, weight: 'bold' },
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
        ticks: { font: { size: 12, weight: 'bold' }, color: '#1e293b' },
      },
      y: {
        grid: { color: 'rgba(203, 213, 225, 0.85)' },
        ticks: {
          font: { size: 12, weight: 'bold' },
          color: '#1e293b',
          callback: (value) => `Rs. ${(Number(value) / 1000).toFixed(0)}k`,
        },
        beginAtZero: true,
      },
    },
  };

  // 2. Bar Chart Data: Daily Appointment Traffic (Vibrant Electric Blue)
  const barChartData = {
    labels: dailyData.map((d) => d.dayLabel),
    datasets: [
      {
        label: 'Patients Scheduled',
        data: dailyData.map((d) => d.appointments),
        backgroundColor: '#2563eb',
        hoverBackgroundColor: '#1d4ed8',
        borderColor: '#1e40af',
        borderWidth: 1.5,
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
        backgroundColor: '#0f172a',
        borderColor: '#2563eb',
        borderWidth: 1.5,
        titleColor: '#ffffff',
        bodyColor: '#f8fafc',
        titleFont: { size: 12, weight: 'bold' },
        bodyFont: { size: 12, weight: 'bold' },
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
        ticks: { font: { size: 12, weight: 'bold' }, color: '#1e293b' },
      },
      y: {
        grid: { color: 'rgba(203, 213, 225, 0.85)' },
        ticks: {
          stepSize: 1,
          font: { size: 12, weight: 'bold' },
          color: '#1e293b',
        },
        beginAtZero: true,
      },
    },
  };

  // 3. Doughnut Chart: Appointment Status Breakdown (Vibrant Emerald, Blue, Amber, Crimson)
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
          '#059669', // vivid emerald
          '#2563eb', // vivid royal blue
          '#d97706', // vivid warm amber
          '#e11d48', // vivid crimson rose
        ],
        borderWidth: 3,
        borderColor: '#ffffff',
        hoverOffset: 6,
      },
    ],
  };

  const doughnutStatusOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '66%',
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: '#0f172a',
        padding: 10,
        cornerRadius: 10,
        titleColor: '#ffffff',
        bodyColor: '#f8fafc',
        titleFont: { size: 12, weight: 'bold' },
        bodyFont: { size: 12, weight: 'bold' },
      },
    },
  };

  // 4. Doughnut Chart: Payment Channel Breakdown (Vibrant Emerald, Violet, Cyan)
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
          '#059669', // vivid emerald
          '#7c3aed', // vivid violet/purple
          '#0284c7', // vivid sky cyan
        ],
        borderWidth: 3,
        borderColor: '#ffffff',
        hoverOffset: 6,
      },
    ],
  };

  const doughnutPaymentOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '66%',
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: '#0f172a',
        padding: 10,
        cornerRadius: 10,
        titleColor: '#ffffff',
        bodyColor: '#f8fafc',
        titleFont: { size: 12, weight: 'bold' },
        bodyFont: { size: 12, weight: 'bold' },
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
            <div className="h-6 w-6 rounded-lg bg-rose-600 text-white flex items-center justify-center shadow-xs">
              <Activity className="h-3.5 w-3.5" />
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-950 font-serif tracking-tight">
              Clinical Intelligence & Visual Analytics
            </h2>
            <Badge className="text-[11px] font-extrabold bg-rose-100 text-rose-900 border-2 border-rose-300 shadow-2xs">
              Chart.js Engine
            </Badge>
          </div>
          <p className="text-xs text-slate-600 font-medium">
            Real-time visual breakdown of revenue velocity, appointment volume, and payment channels
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-700 bg-white border-2 border-slate-300 px-3 py-1 rounded-full shadow-xs">
            All-Time Performance · PKR
          </span>
        </div>
      </div>

      {/* 4 Quick Analytics Mini-KPI Badges */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* All-Time Revenue (Rose) */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-white via-rose-50/70 to-rose-100/70 border-2 border-rose-300 hover:border-rose-500 hover:shadow-lg hover:shadow-rose-500/15 transition-all duration-300 shadow-sm flex items-center gap-3 cursor-pointer group">
          <div className="h-11 w-11 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-sm group-hover:scale-110 transition-all duration-300">
            <DollarSign className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-extrabold uppercase tracking-wider text-rose-900">All-Time Revenue</p>
            <p className="text-base sm:text-lg font-extrabold text-slate-950 truncate font-serif group-hover:text-rose-950 transition-colors">
              {formatCurrency(displayRevenue)}
            </p>
          </div>
        </div>

        {/* All-Time Patients (Blue) */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-white via-blue-50/70 to-blue-100/70 border-2 border-blue-300 hover:border-blue-500 hover:shadow-lg hover:shadow-blue-500/15 transition-all duration-300 shadow-sm flex items-center gap-3 cursor-pointer group">
          <div className="h-11 w-11 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm group-hover:scale-110 transition-all duration-300">
            <Calendar className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-extrabold uppercase tracking-wider text-blue-900">All-Time Patients</p>
            <p className="text-base sm:text-lg font-extrabold text-slate-950 truncate font-serif group-hover:text-blue-950 transition-colors">
              {displayAppointments} Visits
            </p>
          </div>
        </div>

        {/* Completion Rate (Emerald) */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-white via-emerald-50/70 to-emerald-100/70 border-2 border-emerald-300 hover:border-emerald-500 hover:shadow-lg hover:shadow-emerald-500/15 transition-all duration-300 shadow-sm flex items-center gap-3 cursor-pointer group">
          <div className="h-11 w-11 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm group-hover:scale-110 transition-all duration-300">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-900">Completion Rate</p>
            <p className="text-base sm:text-lg font-extrabold text-emerald-900 truncate font-serif group-hover:text-emerald-950 transition-colors">
              {completionRate}% Complete
            </p>
          </div>
        </div>

        {/* Top Payment Channel (Purple) */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-white via-purple-50/70 to-purple-100/70 border-2 border-purple-300 hover:border-purple-500 hover:shadow-lg hover:shadow-purple-500/15 transition-all duration-300 shadow-sm flex items-center gap-3 cursor-pointer group">
          <div className="h-11 w-11 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-sm group-hover:scale-110 transition-all duration-300">
            <CreditCard className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-extrabold uppercase tracking-wider text-purple-900">Top Payment Channel</p>
            <p className="text-xs sm:text-sm font-extrabold text-slate-950 truncate font-serif group-hover:text-purple-950 transition-colors">
              {dominantPaymentMethod.label} ({dominantPaymentMethod.percent}%)
            </p>
          </div>
        </div>
      </div>

      {/* Row 1: Line Chart (Revenue Velocity) + Bar Chart (Patient Inflow) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Revenue Velocity (7 cols - Rose) */}
        <Card className="lg:col-span-7 border-2 border-rose-300 hover:border-rose-500 hover:shadow-xl hover:shadow-rose-500/15 transition-all duration-300 rounded-2xl sm:rounded-3xl bg-white overflow-hidden shadow-sm">
          <CardHeader className="p-5 pb-3 border-b-2 border-rose-100 bg-rose-50/60 flex flex-row items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-lg bg-rose-600 text-white flex items-center justify-center shadow-xs">
                  <TrendingUp className="h-3.5 w-3.5" />
                </div>
                <CardTitle className="text-base font-bold text-slate-950 font-serif">
                  Daily Revenue Velocity
                </CardTitle>
              </div>
              <CardDescription className="text-xs text-slate-600 font-medium mt-0.5">
                Revenue velocity & trends (PKR) across clinic services & retail products
              </CardDescription>
            </div>
            <span className="text-xs font-extrabold text-white bg-rose-600 px-3 py-1 rounded-full shadow-xs">
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
        <Card className="lg:col-span-5 border-2 border-blue-300 hover:border-blue-500 hover:shadow-xl hover:shadow-blue-500/15 transition-all duration-300 rounded-2xl sm:rounded-3xl bg-white overflow-hidden shadow-sm">
          <CardHeader className="p-5 pb-3 border-b-2 border-blue-100 bg-blue-50/60 flex flex-row items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
                  <BarChart3 className="h-3.5 w-3.5" />
                </div>
                <CardTitle className="text-base font-bold text-slate-950 font-serif">
                  Patient Inflow Volume
                </CardTitle>
              </div>
              <CardDescription className="text-xs text-slate-600 font-medium mt-0.5">
                Patient consultation & procedure traffic per day
              </CardDescription>
            </div>
            <span className="text-xs font-extrabold text-white bg-blue-600 px-3 py-1 rounded-full shadow-xs">
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
        <Card className="border-2 border-emerald-300 hover:border-emerald-500 hover:shadow-xl hover:shadow-emerald-500/15 transition-all duration-300 rounded-2xl sm:rounded-3xl bg-white overflow-hidden shadow-sm">
          <CardHeader className="p-5 pb-3 border-b-2 border-emerald-100 bg-emerald-50/60">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                <PieChart className="h-3.5 w-3.5" />
              </div>
              <CardTitle className="text-base font-bold text-slate-950 font-serif">
                Appointment Status Distribution
              </CardTitle>
            </div>
            <CardDescription className="text-xs text-slate-600 font-medium mt-0.5">
              Breakdown of scheduled visits by clinical consultation status
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5 sm:p-6">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              {/* Doughnut Ring */}
              <div className="relative h-48 w-48 shrink-0">
                <Doughnut data={doughnutStatusData} options={doughnutStatusOptions} />
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-3xl font-extrabold font-serif text-slate-950">
                    {totalStatusAppointments}
                  </span>
                  <span className="text-[11px] uppercase font-extrabold text-slate-700 tracking-wider">Total Visits</span>
                </div>
              </div>

              {/* Custom Legend */}
              <div className="flex-1 w-full space-y-2.5 text-xs">
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50/90 hover:bg-emerald-100 border-2 border-emerald-300 hover:border-emerald-500 shadow-2xs transition-all duration-150 cursor-pointer">
                  <div className="flex items-center gap-2.5">
                    <span className="h-3 w-3 rounded-full bg-emerald-600 ring-2 ring-white shadow-xs" />
                    <span className="font-bold text-emerald-950">Completed Visits</span>
                  </div>
                  <span className="font-extrabold text-slate-950 bg-white px-2.5 py-0.5 rounded-lg border border-emerald-300 shadow-2xs">{statusData.completed}</span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-blue-50/90 hover:bg-blue-100 border-2 border-blue-300 hover:border-blue-500 shadow-2xs transition-all duration-150 cursor-pointer">
                  <div className="flex items-center gap-2.5">
                    <span className="h-3 w-3 rounded-full bg-blue-600 ring-2 ring-white shadow-xs" />
                    <span className="font-bold text-blue-950">Confirmed Slots</span>
                  </div>
                  <span className="font-extrabold text-slate-950 bg-white px-2.5 py-0.5 rounded-lg border border-blue-300 shadow-2xs">{statusData.confirmed}</span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-amber-50/90 hover:bg-amber-100 border-2 border-amber-300 hover:border-amber-500 shadow-2xs transition-all duration-150 cursor-pointer">
                  <div className="flex items-center gap-2.5">
                    <span className="h-3 w-3 rounded-full bg-amber-600 ring-2 ring-white shadow-xs" />
                    <span className="font-bold text-amber-950">Pending Approval</span>
                  </div>
                  <span className="font-extrabold text-slate-950 bg-white px-2.5 py-0.5 rounded-lg border border-amber-300 shadow-2xs">{statusData.pending}</span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-rose-50/90 hover:bg-rose-100 border-2 border-rose-300 hover:border-rose-500 shadow-2xs transition-all duration-150 cursor-pointer">
                  <div className="flex items-center gap-2.5">
                    <span className="h-3 w-3 rounded-full bg-rose-600 ring-2 ring-white shadow-xs" />
                    <span className="font-bold text-rose-950">Cancelled / No-Show</span>
                  </div>
                  <span className="font-extrabold text-slate-950 bg-white px-2.5 py-0.5 rounded-lg border border-rose-300 shadow-2xs">{statusData.cancelled}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Channels & Revenue Share (Purple) */}
        {isAdmin && (
          <Card className="border-2 border-purple-300 hover:border-purple-500 hover:shadow-xl hover:shadow-purple-500/15 transition-all duration-300 rounded-2xl sm:rounded-3xl bg-white overflow-hidden shadow-sm">
            <CardHeader className="p-5 pb-3 border-b-2 border-purple-100 bg-purple-50/60">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-lg bg-purple-600 text-white flex items-center justify-center shadow-xs">
                  <CreditCard className="h-3.5 w-3.5" />
                </div>
                <CardTitle className="text-base font-bold text-slate-950 font-serif">
                  Payment Channels & Tender Share
                </CardTitle>
              </div>
              <CardDescription className="text-xs text-slate-600 font-medium mt-0.5">
                Distribution of clinic revenue collected across payment methods
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5 sm:p-6">
              <div className="flex flex-col sm:flex-row items-center gap-6">
                {/* Doughnut Ring */}
                <div className="relative h-48 w-48 shrink-0">
                  <Doughnut data={doughnutPaymentData} options={doughnutPaymentOptions} />
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-base font-extrabold font-serif text-slate-950 truncate max-w-[130px]">
                      {formatCurrency(totalPaymentRevenue)}
                    </span>
                    <span className="text-[11px] uppercase font-extrabold text-slate-700 tracking-wider">Total Billed</span>
                  </div>
                </div>

                {/* Custom Legend */}
                <div className="flex-1 w-full space-y-2.5 text-xs">
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50/90 hover:bg-emerald-100 border-2 border-emerald-300 hover:border-emerald-500 shadow-2xs transition-all duration-150 cursor-pointer">
                    <div className="flex items-center gap-2.5">
                      <Banknote className="h-4 w-4 text-emerald-700 shrink-0" />
                      <span className="font-bold text-emerald-950">Cash at Front-Desk</span>
                    </div>
                    <span className="font-extrabold text-slate-950 font-serif bg-white px-2.5 py-0.5 rounded-lg border border-emerald-300 shadow-2xs">
                      {formatCurrency(paymentData.cash)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-purple-50/90 hover:bg-purple-100 border-2 border-purple-300 hover:border-purple-500 shadow-2xs transition-all duration-150 cursor-pointer">
                    <div className="flex items-center gap-2.5">
                      <CreditCard className="h-4 w-4 text-purple-700 shrink-0" />
                      <span className="font-bold text-purple-950">Card POS Machine</span>
                    </div>
                    <span className="font-extrabold text-slate-950 font-serif bg-white px-2.5 py-0.5 rounded-lg border border-purple-300 shadow-2xs">
                      {formatCurrency(paymentData.card)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-sky-50/90 hover:bg-sky-100 border-2 border-sky-300 hover:border-sky-500 shadow-2xs transition-all duration-150 cursor-pointer">
                    <div className="flex items-center gap-2.5">
                      <Building2 className="h-4 w-4 text-sky-700 shrink-0" />
                      <span className="font-bold text-sky-950">Bank Transfer / Raast</span>
                    </div>
                    <span className="font-extrabold text-slate-950 font-serif bg-white px-2.5 py-0.5 rounded-lg border border-sky-300 shadow-2xs">
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
