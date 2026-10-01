'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  BOOKING_CATALOG,
  type TreatmentOption,
  type TreatmentService,
} from '@/lib/booking-catalog';
import { createPublicAppointment } from '@/actions/appointments';
import {
  Search,
  ChevronDown,
  ChevronUp,
  X,
  Check,
  ShieldCheck,
  Calendar as CalendarIcon,
  Clock,
  Sparkles,
  Phone,
  MessageCircle,
  Loader2,
  ArrowLeft,
  Stethoscope,
  HeartHandshake,
} from 'lucide-react';

interface SelectedTreatmentItem {
  serviceId: string;
  serviceName: string;
  dbId: string;
  optionId: string;
  optionName: string;
  duration: string;
  price: number;
}

interface BookingFlowProps {
  initialTreatmentId?: string;
  onClose?: () => void;
  isModal?: boolean;
}

export function BookingFlow({
  initialTreatmentId,
  onClose,
  isModal = false,
}: BookingFlowProps) {
  const router = useRouter();

  // Active step: 1 = Treatments, 2 = Time, 3 = Details, 4 = Success
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  // Department switcher
  const [department, setDepartment] = useState<'aesthetic' | 'studio'>('aesthetic');

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');

  // Expanded accordions
  const [expandedServices, setExpandedServices] = useState<Record<string, boolean>>({
    'laser-hair-removal': true,
    'pico-laser': true,
    hydrafacial: true,
    'bridal-makeover': true,
  });

  // Multi-selection state
  const [selectedItems, setSelectedItems] = useState<SelectedTreatmentItem[]>(() => {
    if (initialTreatmentId) {
      // Find matching service
      const match = BOOKING_CATALOG.find(
        (s) => s.id === initialTreatmentId || s.dbId === initialTreatmentId
      );
      if (match && match.options.length > 0) {
        const firstOpt = match.options[0];
        return [
          {
            serviceId: match.id,
            serviceName: match.name,
            dbId: match.dbId,
            optionId: firstOpt.id,
            optionName: firstOpt.name,
            duration: firstOpt.duration,
            price: firstOpt.price,
          },
        ];
      }
    }
    // Default initial selection matching reference screenshot (HydraFacial Classic PKR 5,000)
    const hydra = BOOKING_CATALOG.find((s) => s.id === 'hydrafacial');
    if (hydra && hydra.options[0]) {
      return [
        {
          serviceId: hydra.id,
          serviceName: hydra.name,
          dbId: hydra.dbId,
          optionId: hydra.options[0].id,
          optionName: hydra.options[0].name,
          duration: hydra.options[0].duration,
          price: hydra.options[0].price,
        },
      ];
    }
    return [];
  });

  // Date and Time selection
  // Generate 14 upcoming days
  const upcomingDays = useMemo(() => {
    const days: {
      date: Date;
      isoDate: string;
      dayName: string;
      dayNumber: number;
      monthName: string;
      isToday: boolean;
      isSunday: boolean;
    }[] = [];

    const now = new Date();
    for (let i = 0; i < 14; i++) {
      const d = new Date(now);
      d.setDate(now.getDate() + i);

      const isToday = i === 0;
      const dayOfWeek = d.getDay(); // 0 = Sunday
      const isSunday = dayOfWeek === 0;

      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const monthNames = [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec',
      ];

      days.push({
        date: d,
        isoDate: d.toISOString().split('T')[0],
        dayName: isToday ? 'Today' : dayNames[dayOfWeek],
        dayNumber: d.getDate(),
        monthName: monthNames[d.getMonth()],
        isToday,
        isSunday,
      });
    }
    return days;
  }, []);

  // Pick first available non-Sunday day by default
  const [selectedDayIso, setSelectedDayIso] = useState<string>(() => {
    const firstAvailable = upcomingDays.find((d) => !d.isSunday) || upcomingDays[0];
    return firstAvailable.isoDate;
  });

  // Selected time slot
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('3:30 pm');

  // Customer details form
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [message, setMessage] = useState('');

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmedBooking, setConfirmedBooking] = useState<{
    id: string;
    refNumber: string;
    total: number;
    items: SelectedTreatmentItem[];
    dateStr: string;
    timeSlot: string;
    patientName: string;
    patientPhone: string;
  } | null>(null);

  // Calculate totals
  const totalPKR = useMemo(() => {
    return selectedItems.reduce((sum, item) => sum + item.price, 0);
  }, [selectedItems]);

  const itemCount = selectedItems.length;

  // Toggle item selection
  const toggleItemSelection = (
    service: TreatmentService,
    option: TreatmentOption
  ) => {
    const exists = selectedItems.some((item) => item.optionId === option.id);
    if (exists) {
      setSelectedItems((prev) => prev.filter((item) => item.optionId !== option.id));
    } else {
      setSelectedItems((prev) => [
        ...prev,
        {
          serviceId: service.id,
          serviceName: service.name,
          dbId: service.dbId,
          optionId: option.id,
          optionName: option.name,
          duration: option.duration,
          price: option.price,
        },
      ]);
    }
  };

  const removeItem = (optionId: string) => {
    setSelectedItems((prev) => prev.filter((item) => item.optionId !== optionId));
  };

  const toggleAccordion = (serviceId: string) => {
    setExpandedServices((prev) => ({
      ...prev,
      [serviceId]: !prev[serviceId],
    }));
  };

  // Filter catalog
  const filteredCatalog = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return BOOKING_CATALOG.filter((service) => {
      // Must match department unless user is searching
      if (!q && service.department !== department) {
        return false;
      }
      if (!q) return true;

      const matchesService =
        service.name.toLowerCase().includes(q) ||
        service.section.toLowerCase().includes(q);
      const matchesOption = service.options.some(
        (o) =>
          o.name.toLowerCase().includes(q) ||
          o.description.toLowerCase().includes(q)
      );
      return matchesService || matchesOption;
    });
  }, [department, searchQuery]);

  // Group filtered catalog by section
  const groupedSections = useMemo(() => {
    const groups: Record<string, TreatmentService[]> = {};
    filteredCatalog.forEach((service) => {
      if (!groups[service.section]) {
        groups[service.section] = [];
      }
      groups[service.section].push(service);
    });
    return groups;
  }, [filteredCatalog]);

  // Afternoon & Evening time slots matching reference screenshot
  const afternoonSlots = [
    '11:30 am',
    '12:00 pm',
    '12:30 pm',
    '1:00 pm',
    '2:00 pm',
    '2:30 pm',
    '3:00 pm',
    '3:30 pm',
    '4:00 pm',
    '4:30 pm',
  ];

  const eveningSlots = [
    '5:00 pm',
    '5:30 pm',
    '6:00 pm',
    '6:30 pm',
    '7:00 pm',
    '7:30 pm',
  ];

  // Handle Form Submission
  const handleConfirmBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!customerName.trim()) {
      setFormError('Please enter your full name.');
      return;
    }

    if (!customerPhone.trim()) {
      setFormError('Please enter your mobile number.');
      return;
    }

    if (selectedItems.length === 0) {
      setFormError('Please select at least one treatment.');
      setCurrentStep(1);
      return;
    }

    // Convert date + timeSlot into ISO string
    // e.g. selectedDayIso: '2026-10-01', selectedTimeSlot: '3:30 pm'
    const [timePart, modifier] = selectedTimeSlot.split(' ');
    let [hoursStr, minutesStr] = timePart.split(':');
    let hours = parseInt(hoursStr, 10);
    const minutes = parseInt(minutesStr, 10);

    if (modifier.toLowerCase() === 'pm' && hours < 12) {
      hours += 12;
    }
    if (modifier.toLowerCase() === 'am' && hours === 12) {
      hours = 0;
    }

    const scheduledDate = new Date(`${selectedDayIso}T12:00:00`);
    scheduledDate.setHours(hours, minutes, 0, 0);

    // Primary treatment ID for database foreign key
    const primaryDbId =
      selectedItems[0]?.dbId || '9803b3c3-2e1d-44dd-b684-3782c0c90a9b';

    // Detailed booking breakdown for notes
    const itemsSummary = selectedItems
      .map((it) => `• ${it.serviceName} - ${it.optionName} (${it.duration}) : PKR ${it.price.toLocaleString()}`)
      .join('\n');

    const fullMessage = [
      `TREATMENTS BOOKED (${selectedItems.length}):`,
      itemsSummary,
      `ESTIMATED TOTAL: PKR ${totalPKR.toLocaleString()}`,
      `TIME: ${selectedTimeSlot} on ${selectedDayIso}`,
      message.trim() ? `CLIENT NOTES:\n${message.trim()}` : null,
    ]
      .filter(Boolean)
      .join('\n\n');

    setIsSubmitting(true);

    try {
      const res = await createPublicAppointment({
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim(),
        whatsapp_number: whatsappNumber.trim() || undefined,
        treatment_id: primaryDbId,
        scheduled_at: scheduledDate.toISOString(),
        message: fullMessage,
      });

      if (!res.success) {
        setFormError(res.error || 'Failed to submit booking. Please try again.');
        setIsSubmitting(false);
        return;
      }

      const randomRef =
        res.appointmentId?.slice(0, 8).toUpperCase() ||
        Math.floor(100000 + Math.random() * 900000).toString();

      setConfirmedBooking({
        id: res.appointmentId || 'app-' + Date.now(),
        refNumber: `BSC-${randomRef}`,
        total: totalPKR,
        items: selectedItems,
        dateStr: scheduledDate.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }),
        timeSlot: selectedTimeSlot,
        patientName: customerName.trim(),
        patientPhone: customerPhone.trim(),
      });

      setCurrentStep(4);
    } catch (err: any) {
      console.error('Booking error:', err);
      setFormError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // WhatsApp Link generator
  const getWhatsAppLink = () => {
    if (!confirmedBooking) return '#';
    const clinicNumber = '923000000000'; // Official clinic WhatsApp
    const treatmentNames = confirmedBooking.items
      .map((it) => `${it.serviceName} (${it.optionName})`)
      .join(', ');
    const text = encodeURIComponent(
      `Assalam-o-Alaikum Dr. Bilal Clinic! I have booked an appointment online:\n\n` +
        `• Ref: ${confirmedBooking.refNumber}\n` +
        `• Name: ${confirmedBooking.patientName}\n` +
        `• Phone: ${confirmedBooking.patientPhone}\n` +
        `• Treatments: ${treatmentNames}\n` +
        `• Date: ${confirmedBooking.dateStr}\n` +
        `• Time: ${confirmedBooking.timeSlot}\n` +
        `• Total: PKR ${confirmedBooking.total.toLocaleString()}\n\n` +
        `Please confirm my slot. Thank you!`
    );
    return `https://wa.me/${clinicNumber}?text=${text}`;
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-white rounded-3xl sm:rounded-[28px] shadow-2xl border border-gray-100 overflow-hidden flex flex-col relative transition-all duration-300">
      {/* Top Header Card */}
      <div className="p-6 sm:p-8 pb-4 relative border-b border-gray-100/80 bg-white">
        {/* Close Button */}
        {onClose && (
          <button
            onClick={onClose}
            aria-label="Close booking modal"
            className="absolute top-6 right-6 h-9 w-9 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-800 flex items-center justify-center transition"
          >
            <X className="h-5 w-5" />
          </button>
        )}

        <div className="pr-10">
          <h1 className="font-serif text-2xl sm:text-3xl text-gray-900 font-normal tracking-tight">
            Book an appointment
          </h1>
          <p className="text-gray-600 text-xs sm:text-sm mt-1 leading-relaxed">
            Choose your treatments, pick a time, and we will confirm on WhatsApp.
            No deposit, no card.
          </p>
        </div>

        {/* 3-Step Stepper Header */}
        {currentStep !== 4 && (
          <div className="flex items-center gap-2 sm:gap-3 mt-6 pt-4 border-t border-gray-100">
            {/* Step 1: Treatments */}
            <div
              onClick={() => setCurrentStep(1)}
              className={`flex items-center gap-2 cursor-pointer transition ${
                currentStep === 1
                  ? 'text-gray-950 font-semibold'
                  : currentStep > 1
                  ? 'text-rose-900 font-medium'
                  : 'text-gray-400'
              }`}
            >
              <span
                className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-semibold ${
                  currentStep === 1
                    ? 'bg-[#2D1226] text-white shadow-sm'
                    : currentStep > 1
                    ? 'bg-rose-100 text-rose-800'
                    : 'bg-gray-100 text-gray-400'
                }`}
              >
                1
              </span>
              <span className="text-xs sm:text-sm">Treatments</span>
            </div>

            {/* Separator line */}
            <div
              className={`h-0.5 w-6 sm:w-10 rounded-full transition-colors ${
                currentStep > 1 ? 'bg-rose-200' : 'bg-gray-200'
              }`}
            />

            {/* Step 2: Time */}
            <div
              onClick={() => {
                if (selectedItems.length > 0) setCurrentStep(2);
              }}
              className={`flex items-center gap-2 transition ${
                selectedItems.length > 0 ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'
              } ${
                currentStep === 2
                  ? 'text-gray-950 font-semibold'
                  : currentStep > 2
                  ? 'text-rose-900 font-medium'
                  : 'text-gray-400'
              }`}
            >
              <span
                className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-semibold ${
                  currentStep === 2
                    ? 'bg-[#2D1226] text-white shadow-sm'
                    : currentStep > 2
                    ? 'bg-rose-100 text-rose-800'
                    : 'bg-gray-100 text-gray-400'
                }`}
              >
                2
              </span>
              <span className="text-xs sm:text-sm">Time</span>
            </div>

            {/* Separator line */}
            <div
              className={`h-0.5 w-6 sm:w-10 rounded-full transition-colors ${
                currentStep > 2 ? 'bg-rose-200' : 'bg-gray-200'
              }`}
            />

            {/* Step 3: Details */}
            <div
              onClick={() => {
                if (selectedItems.length > 0 && selectedDayIso && selectedTimeSlot) {
                  setCurrentStep(3);
                }
              }}
              className={`flex items-center gap-2 transition ${
                selectedItems.length > 0 ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'
              } ${
                currentStep === 3
                  ? 'text-gray-950 font-semibold'
                  : 'text-gray-400'
              }`}
            >
              <span
                className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-semibold ${
                  currentStep === 3
                    ? 'bg-[#2D1226] text-white shadow-sm'
                    : 'bg-gray-100 text-gray-400'
                }`}
              >
                3
              </span>
              <span className="text-xs sm:text-sm">Details</span>
            </div>
          </div>
        )}
      </div>

      {/* Main Body Area */}
      <div className="p-6 sm:p-8 pt-5 overflow-y-auto max-h-[64vh] sm:max-h-[68vh] min-h-[380px]">
        {/* ========================================================================= */}
        {/* STEP 1: TREATMENTS                                                        */}
        {/* ========================================================================= */}
        {currentStep === 1 && (
          <div className="space-y-6 animate-fadeIn">
            {/* Department Pills: Aesthetic Clinic vs Makeup Studio */}
            <div className="p-1 bg-gray-50/90 rounded-full border border-gray-200 flex items-center max-w-md mx-auto">
              <button
                type="button"
                onClick={() => setDepartment('aesthetic')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-full text-xs sm:text-sm font-medium transition-all ${
                  department === 'aesthetic'
                    ? 'bg-white text-gray-950 shadow-sm border border-gray-200/60'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                <Stethoscope className="h-4 w-4 text-rose-500" />
                <span>Aesthetic Clinic</span>
              </button>

              <button
                type="button"
                onClick={() => setDepartment('studio')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-full text-xs sm:text-sm font-medium transition-all ${
                  department === 'studio'
                    ? 'bg-white text-gray-950 shadow-sm border border-gray-200/60'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                <Sparkles className="h-4 w-4 text-amber-500" />
                <span>Makeup Studio</span>
              </button>
            </div>

            {/* Search Input with Magnifier */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search treatments"
                className="w-full pl-11 pr-10 py-3 rounded-2xl border border-gray-200 bg-white text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2D1226]/20 focus:border-[#2D1226] transition shadow-xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Sections & Treatment Accordions */}
            <div className="space-y-6">
              {Object.keys(groupedSections).length === 0 ? (
                <div className="py-12 text-center text-gray-500 space-y-2">
                  <p className="text-sm font-medium">No treatments found for &quot;{searchQuery}&quot;</p>
                  <button
                    onClick={() => setSearchQuery('')}
                    className="text-xs text-rose-600 underline font-medium hover:text-rose-700"
                  >
                    Clear search filter
                  </button>
                </div>
              ) : (
                Object.entries(groupedSections).map(([sectionTitle, services]) => (
                  <div key={sectionTitle} className="space-y-3">
                    <h2 className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                      {sectionTitle}
                    </h2>

                    <div className="space-y-3">
                      {services.map((service) => {
                        const isExpanded = !!expandedServices[service.id];
                        // Count how many options from this service are selected
                        const selectedCountInThisService = selectedItems.filter(
                          (item) => item.serviceId === service.id
                        ).length;

                        return (
                          <div
                            key={service.id}
                            className={`border rounded-2xl overflow-hidden transition-all duration-200 ${
                              selectedCountInThisService > 0
                                ? 'border-[#2D1226]/30 bg-[#2D1226]/[0.015]'
                                : 'border-gray-200 bg-white hover:border-gray-300'
                            }`}
                          >
                            {/* Accordion Header */}
                            <div
                              onClick={() => toggleAccordion(service.id)}
                              className="p-4 sm:p-5 flex items-center justify-between cursor-pointer select-none"
                            >
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-2">
                                  <h3 className="text-base font-semibold text-gray-950">
                                    {service.name}
                                  </h3>
                                  {selectedCountInThisService > 0 && (
                                    <span className="px-2 py-0.5 rounded-full bg-[#2D1226] text-white text-[10px] font-bold">
                                      {selectedCountInThisService} selected
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-gray-500">
                                  {service.options.length} {service.options.length === 1 ? 'option' : 'options'}
                                </p>
                              </div>

                              <div className="flex items-center gap-3">
                                <div className="text-right">
                                  <span className="text-[11px] text-gray-400 block -mb-0.5">
                                    from
                                  </span>
                                  <span className="text-sm font-bold text-gray-950">
                                    PKR {service.basePrice.toLocaleString()}
                                  </span>
                                </div>

                                <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:text-gray-800 transition">
                                  {isExpanded ? (
                                    <ChevronUp className="h-4 w-4" />
                                  ) : (
                                    <ChevronDown className="h-4 w-4" />
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Accordion Content / Options */}
                            {isExpanded && (
                              <div className="border-t border-gray-100 divide-y divide-gray-100 bg-gray-50/40">
                                {service.options.map((option) => {
                                  const isSelected = selectedItems.some(
                                    (it) => it.optionId === option.id
                                  );

                                  return (
                                    <div
                                      key={option.id}
                                      onClick={() => toggleItemSelection(service, option)}
                                      className={`p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer transition ${
                                        isSelected
                                          ? 'bg-rose-50/60'
                                          : 'hover:bg-gray-100/60'
                                      }`}
                                    >
                                      <div className="space-y-1 pr-4">
                                        <div className="flex items-center gap-2">
                                          <span className="text-sm font-semibold text-gray-900">
                                            {option.name}
                                          </span>
                                          <span className="inline-flex items-center gap-1 text-[11px] text-gray-500 bg-white border border-gray-200/80 px-2 py-0.5 rounded-full font-medium">
                                            <Clock className="h-3 w-3 text-gray-400" />
                                            {option.duration}
                                          </span>
                                        </div>
                                        <p className="text-xs text-gray-500 leading-relaxed">
                                          {option.description}
                                        </p>
                                      </div>

                                      <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0">
                                        <span className="text-sm font-bold text-gray-900">
                                          PKR {option.price.toLocaleString()}
                                        </span>

                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            toggleItemSelection(service, option);
                                          }}
                                          className={`px-4 py-2 rounded-full text-xs font-semibold transition flex items-center gap-1.5 shadow-xs ${
                                            isSelected
                                              ? 'bg-[#2D1226] text-white hover:bg-[#3f1935]'
                                              : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400'
                                          }`}
                                        >
                                          {isSelected ? (
                                            <>
                                              <Check className="h-3.5 w-3.5" />
                                              <span>Added</span>
                                            </>
                                          ) : (
                                            <span>+ Add</span>
                                          )}
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 2: TIME & DATE                                                       */}
        {/* ========================================================================= */}
        {currentStep === 2 && (
          <div className="space-y-7 animate-fadeIn">
            {/* Choose a Day */}
            <div className="space-y-3">
              <h2 className="text-base font-semibold text-gray-950">
                Choose a day
              </h2>

              {/* Horizontal Date Picker Cards */}
              <div className="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-thin">
                {upcomingDays.map((day) => {
                  const isSelected = selectedDayIso === day.isoDate;
                  const isDisabled = day.isSunday;

                  return (
                    <button
                      key={day.isoDate}
                      type="button"
                      disabled={isDisabled}
                      onClick={() => setSelectedDayIso(day.isoDate)}
                      className={`min-w-[70px] sm:min-w-[76px] py-3.5 px-2 rounded-2xl flex flex-col items-center justify-center transition select-none ${
                        isDisabled
                          ? 'opacity-40 bg-gray-50 border border-gray-200 cursor-not-allowed text-gray-400'
                          : isSelected
                          ? 'bg-[#2D1226] text-white shadow-md scale-102 font-medium'
                          : 'bg-white border border-gray-200 text-gray-800 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <span className="text-[11px] font-medium leading-none mb-1.5 opacity-90">
                        {day.dayName}
                      </span>
                      <span className="text-xl sm:text-2xl font-bold leading-none mb-1">
                        {day.dayNumber}
                      </span>
                      <span className="text-[11px] font-medium leading-none opacity-80">
                        {day.monthName}
                      </span>
                      {isDisabled && (
                        <span className="text-[9px] mt-1 font-bold text-red-500 uppercase tracking-tighter">
                          Closed
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Choose a Time */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-gray-950">
                  Choose a time
                </h2>
                <span className="text-xs text-gray-500 font-medium">
                  Open daily 10:00 to 19:30
                </span>
              </div>

              {/* Afternoon Slots */}
              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Afternoon
                </h3>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {afternoonSlots.map((slot) => {
                    const isSelected = selectedTimeSlot === slot;
                    return (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => setSelectedTimeSlot(slot)}
                        className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold transition text-center ${
                          isSelected
                            ? 'bg-[#2D1226] text-white shadow-sm'
                            : 'bg-white border border-gray-200 text-gray-800 hover:bg-gray-50 hover:border-gray-300'
                        }`}
                      >
                        {slot}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Evening Slots */}
              <div className="space-y-2 pt-2">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Evening
                </h3>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {eveningSlots.map((slot) => {
                    const isSelected = selectedTimeSlot === slot;
                    return (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => setSelectedTimeSlot(slot)}
                        className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold transition text-center ${
                          isSelected
                            ? 'bg-[#2D1226] text-white shadow-sm'
                            : 'bg-white border border-gray-200 text-gray-800 hover:bg-gray-50 hover:border-gray-300'
                        }`}
                      >
                        {slot}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Selected Treatment Chips with ✕ remover */}
            <div className="space-y-2 pt-2 border-t border-gray-100">
              <span className="text-xs text-gray-500 font-medium block">
                Selected treatments ({selectedItems.length}):
              </span>
              <div className="flex flex-wrap gap-2">
                {selectedItems.map((item) => (
                  <div
                    key={item.optionId}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-50 border border-rose-200/70 text-xs font-medium text-rose-950"
                  >
                    <span>
                      {item.serviceName} · {item.optionName}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeItem(item.optionId)}
                      className="text-rose-400 hover:text-rose-700 p-0.5 rounded-full transition"
                      title="Remove treatment"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 3: DETAILS                                                           */}
        {/* ========================================================================= */}
        {currentStep === 3 && (
          <form onSubmit={handleConfirmBooking} className="space-y-5 animate-fadeIn">
            {formError && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs sm:text-sm text-red-700 font-medium flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-red-500" />
                {formError}
              </div>
            )}

            {/* Name and Mobile Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs sm:text-sm font-semibold text-gray-900 block">
                  Your name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Tatheer Hussain"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-blue-50/20 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2D1226]/20 focus:border-[#2D1226] transition"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs sm:text-sm font-semibold text-gray-900 block">
                  Mobile number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="+92 314 3176526"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-blue-50/20 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2D1226]/20 focus:border-[#2D1226] transition"
                />
              </div>
            </div>

            {/* WhatsApp Number (if different) */}
            <div className="space-y-1.5">
              <label className="text-xs sm:text-sm font-semibold text-gray-900 block">
                WhatsApp number (if different)
              </label>
              <input
                type="tel"
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                placeholder="Same as above"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2D1226]/20 focus:border-[#2D1226] transition"
              />
            </div>

            {/* Anything we should know */}
            <div className="space-y-1.5">
              <label className="text-xs sm:text-sm font-semibold text-gray-900 block">
                Anything we should know (optional)
              </label>
              <textarea
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Skin concern, past treatments, preferred artist"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2D1226]/20 focus:border-[#2D1226] transition resize-none"
              />
            </div>

            {/* Trust and privacy disclaimer */}
            <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-gray-50 border border-gray-100 text-xs text-gray-600 leading-relaxed">
              <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                We use your number to confirm the appointment. No email needed, and we
                do not pass it on. No deposit, no card required.
              </span>
            </div>

            {/* Summary preview */}
            <div className="p-4 rounded-xl bg-rose-50/50 border border-rose-100/80 space-y-2 text-xs">
              <div className="flex justify-between text-gray-700">
                <span className="font-medium">Scheduled slot:</span>
                <span className="font-semibold text-gray-950">
                  {selectedDayIso} at {selectedTimeSlot}
                </span>
              </div>
              <div className="flex justify-between text-gray-700">
                <span className="font-medium">Treatments:</span>
                <span className="font-semibold text-gray-950">
                  {selectedItems.map((i) => i.optionName).join(', ')}
                </span>
              </div>
            </div>
          </form>
        )}

        {/* ========================================================================= */}
        {/* STEP 4: SUCCESS / INSTANT CONFIRMATION ("BEST THAN THIS")                  */}
        {/* ========================================================================= */}
        {currentStep === 4 && confirmedBooking && (
          <div className="py-6 text-center space-y-6 animate-fadeIn">
            {/* Celebration Badge */}
            <div className="relative inline-flex items-center justify-center">
              <div className="h-20 w-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/15 animate-bounce">
                <Check className="h-10 w-10 stroke-[3]" />
              </div>
              <div className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-amber-400 flex items-center justify-center text-white text-xs">
                ✨
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="inline-block px-3 py-1 rounded-full bg-rose-100 text-rose-800 text-xs font-bold uppercase tracking-wider">
                Appointment Requested
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-gray-950">
                We received your booking!
              </h2>
              <p className="text-xs sm:text-sm text-gray-600 max-w-md mx-auto">
                Thank you, <span className="font-semibold text-gray-900">{confirmedBooking.patientName}</span>. Your appointment has been booked. Reference:{' '}
                <span className="font-mono font-bold text-rose-700">
                  {confirmedBooking.refNumber}
                </span>
              </p>
            </div>

            {/* Booking Details Card */}
            <div className="p-5 rounded-2xl bg-gray-50 border border-gray-200 text-left space-y-3.5 max-w-md mx-auto">
              <div className="flex items-center justify-between pb-3 border-b border-gray-200 text-xs">
                <span className="text-gray-500 font-medium">Date & Time</span>
                <span className="font-bold text-gray-900">
                  {confirmedBooking.dateStr} · {confirmedBooking.timeSlot}
                </span>
              </div>

              <div className="space-y-1.5 text-xs">
                <span className="text-gray-500 font-medium block">Treatments:</span>
                {confirmedBooking.items.map((it) => (
                  <div key={it.optionId} className="flex justify-between font-medium">
                    <span className="text-gray-800">
                      {it.serviceName} ({it.optionName})
                    </span>
                    <span className="text-gray-950 font-bold">
                      PKR {it.price.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                <span className="text-xs font-bold text-gray-900 uppercase tracking-wide">
                  Total (Pay on Arrival)
                </span>
                <span className="font-serif text-xl font-bold text-gray-950">
                  PKR {confirmedBooking.total.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Direct WhatsApp Confirmation Button (Luxury CTA) */}
            <div className="max-w-md mx-auto space-y-3 pt-2">
              <a
                href={getWhatsAppLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-full bg-[#25D366] hover:bg-[#20ba59] text-white font-semibold text-sm shadow-lg shadow-green-500/20 hover:shadow-xl transition-all hover:scale-102"
              >
                <MessageCircle className="h-5 w-5 fill-white" />
                <span>Confirm Instantly on WhatsApp</span>
              </a>

              <p className="text-[11px] text-gray-500">
                A coordinator will confirm your exact consultation slot on WhatsApp shortly.
              </p>
            </div>

            {/* Reset / Return button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedItems([]);
                  setCurrentStep(1);
                  setConfirmedBooking(null);
                }}
                className="text-xs text-gray-500 hover:text-gray-800 underline font-medium"
              >
                Book another appointment
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* STICKY BOTTOM SUMMARY BAR                                                 */}
      {/* ========================================================================= */}
      {currentStep !== 4 && (
        <div className="p-4 sm:p-5 px-6 sm:px-8 border-t border-gray-100 bg-white/95 backdrop-blur-md flex items-center justify-between shadow-[0_-4px_20px_rgba(0,0,0,0.04)]">
          {/* Left Side: Treatment count & PKR total */}
          <div>
            <span className="text-xs text-gray-500 block">
              {itemCount} {itemCount === 1 ? 'treatment' : 'treatments'}
            </span>
            <span className="font-serif text-2xl sm:text-3xl font-bold text-gray-950 tracking-tight">
              PKR {totalPKR.toLocaleString()}
            </span>
          </div>

          {/* Right Side: Back and Continue Buttons */}
          <div className="flex items-center gap-3">
            {currentStep > 1 && (
              <button
                type="button"
                onClick={() => setCurrentStep((prev) => (prev - 1) as any)}
                className="inline-flex items-center gap-1.5 px-5 py-3 rounded-full border border-gray-300 bg-white text-gray-700 text-xs sm:text-sm font-semibold hover:bg-gray-50 transition"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Back</span>
              </button>
            )}

            {currentStep === 1 && (
              <button
                type="button"
                disabled={itemCount === 0}
                onClick={() => setCurrentStep(2)}
                className="px-8 py-3.5 rounded-full bg-[#2D1226] hover:bg-[#431b39] text-white text-xs sm:text-sm font-semibold transition shadow-md shadow-[#2D1226]/20 disabled:opacity-40 disabled:cursor-not-allowed hover:scale-102"
              >
                Continue
              </button>
            )}

            {currentStep === 2 && (
              <button
                type="button"
                disabled={!selectedDayIso || !selectedTimeSlot}
                onClick={() => setCurrentStep(3)}
                className="px-8 py-3.5 rounded-full bg-[#2D1226] hover:bg-[#431b39] text-white text-xs sm:text-sm font-semibold transition shadow-md shadow-[#2D1226]/20 disabled:opacity-40 disabled:cursor-not-allowed hover:scale-102"
              >
                Continue
              </button>
            )}

            {currentStep === 3 && (
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleConfirmBooking}
                className="px-8 py-3.5 rounded-full bg-[#2D1226] hover:bg-[#431b39] text-white text-xs sm:text-sm font-semibold transition shadow-md shadow-[#2D1226]/20 disabled:opacity-60 flex items-center gap-2 hover:scale-102"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-white" />
                    <span>Booking...</span>
                  </>
                ) : (
                  <span>Confirm booking</span>
                )}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
