'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  X,
  User,
  Phone,
  Sparkles,
  Mail,
  Send,
  ShieldCheck,
  Laptop,
  Building2,
  CheckCircle2,
  Loader2,
  MessageCircle,
  ExternalLink,
} from 'lucide-react';
import { createConsultationBooking } from '@/actions/appointments';
import { toast } from 'sonner';

// ============================================================
// Context & Hook for Global Triggering
// ============================================================

interface ConsultationModalContextType {
  isOpen: boolean;
  mode: 'online' | 'onsite';
  openConsultation: (initialMode?: 'online' | 'onsite') => void;
  closeConsultation: () => void;
}

const ConsultationModalContext = createContext<ConsultationModalContextType>({
  isOpen: false,
  mode: 'online',
  openConsultation: () => {},
  closeConsultation: () => {},
});

export const useConsultationModal = () => useContext(ConsultationModalContext);

// ============================================================
// Modal Component
// ============================================================

export function OnlineConsultationModalProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<'online' | 'onsite'>('online');

  // Form inputs
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [concern, setConcern] = useState('');

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [bookingSuccess, setBookingSuccess] = useState<{
    refNumber: string;
    whatsappUrl: string;
    mode: 'online' | 'onsite';
    customerName: string;
  } | null>(null);

  const openConsultation = (initialMode: 'online' | 'onsite' = 'online') => {
    setMode(initialMode);
    setFormError(null);
    setBookingSuccess(null);
    setIsOpen(true);
  };

  const closeConsultation = () => {
    setIsOpen(false);
    // Reset state after dialog animation
    setTimeout(() => {
      setBookingSuccess(null);
      setFormError(null);
      setIsSubmitting(false);
    }, 300);
  };

  // Prevent scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Listen to escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        closeConsultation();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const cleanName = fullName.trim();
    const cleanPhone = phone.trim();

    if (!cleanName) {
      setFormError('Please enter your full name.');
      return;
    }
    if (cleanName.length < 2) {
      setFormError('Name must be at least 2 characters.');
      return;
    }
    if (!cleanPhone) {
      setFormError('Please enter your phone or WhatsApp number.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await createConsultationBooking({
        customer_name: cleanName,
        customer_phone: cleanPhone,
        consultation_mode: mode,
        concern: concern.trim() || undefined,
      });

      if (!res.success) {
        setFormError(res.error || 'Failed to submit booking. Please try again.');
        setIsSubmitting(false);
        return;
      }

      setBookingSuccess({
        refNumber: res.refNumber || 'BSC-CON-2026',
        whatsappUrl: res.whatsappUrl || '#',
        mode: res.mode as 'online' | 'onsite',
        customerName: cleanName,
      });
      toast.success('Consultation request submitted successfully!');
    } catch (err: any) {
      console.error('[ConsultationModal] Submit error:', err);
      setFormError(err?.message || 'Something went wrong. Please try again or WhatsApp our clinic directly.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ConsultationModalContext.Provider
      value={{ isOpen, mode, openConsultation, closeConsultation }}
    >
      {children}

      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeConsultation();
          }}
        >
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 animate-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]">
            {/* Header: Dark Navy / Clinic Deep Palette */}
            <div className="bg-[#121927] text-white p-5 sm:p-6 relative shrink-0">
              <div className="pr-10">
                <h3 className="text-xl sm:text-2xl font-bold tracking-tight font-serif text-white">
                  Book Consultation
                </h3>
                <p className="text-xs sm:text-[13px] text-gray-300 mt-1 flex items-center gap-1.5 flex-wrap font-sans">
                  <span>Dr. Bilal Ahmad</span>
                  <span className="text-gray-500">•</span>
                  <span className="text-gray-300">Specialist Aesthetic Dermatologist</span>
                </p>
              </div>

              <button
                type="button"
                onClick={closeConsultation}
                aria-label="Close modal"
                className="absolute top-5 right-5 h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white flex items-center justify-center transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Scrollable Modal Body */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
              {!bookingSuccess ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {formError && (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                      {formError}
                    </div>
                  )}

                  {/* 1. Full Name */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5 text-gray-500" />
                      <span>Full Name</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Your name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 transition-all bg-white"
                    />
                  </div>

                  {/* 2. Phone */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5 text-gray-500" />
                      <span>Phone</span>
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="03715279498"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 transition-all bg-white font-mono text-[13px]"
                    />
                  </div>

                  {/* 3. Select Consultation Mode */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-rose-500" />
                      <span>Select Consultation Mode</span>
                    </label>

                    <div className="grid grid-cols-2 gap-3">
                      {/* Online Consultation Card */}
                      <button
                        type="button"
                        onClick={() => setMode('online')}
                        className={`p-3.5 rounded-2xl border text-left transition-all relative flex flex-col justify-between ${
                          mode === 'online'
                            ? 'border-gray-900 bg-gray-50/70 ring-1 ring-gray-900 shadow-sm'
                            : 'border-gray-200 bg-white hover:border-gray-300 text-gray-600'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-base">💻</span>
                          <span className="text-xs font-bold text-gray-900 leading-tight">
                            Online Consultation
                          </span>
                        </div>
                        <span className="text-[11px] text-gray-500 mt-1 block">
                          Video / Audio Call
                        </span>
                      </button>

                      {/* On-Site Consultation Card */}
                      <button
                        type="button"
                        onClick={() => setMode('onsite')}
                        className={`p-3.5 rounded-2xl border text-left transition-all relative flex flex-col justify-between ${
                          mode === 'onsite'
                            ? 'border-gray-900 bg-gray-50/70 ring-1 ring-gray-900 shadow-sm'
                            : 'border-gray-200 bg-white hover:border-gray-300 text-gray-600'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-base">🏥</span>
                          <span className="text-xs font-bold text-gray-900 leading-tight">
                            On-Site Consultation
                          </span>
                        </div>
                        <span className="text-[11px] text-gray-500 mt-1 block">
                          In-Clinic Visit
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* 4. Concern (Optional) */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <label className="font-semibold text-gray-700 flex items-center gap-1.5">
                        <Mail className="h-3.5 w-3.5 text-gray-500" />
                        <span>Concern (Optional)</span>
                      </label>
                      <span className="text-gray-400 font-mono text-[11px]">
                        {concern.length}/100
                      </span>
                    </div>
                    <textarea
                      rows={3}
                      maxLength={100}
                      placeholder="Brief description of your concern..."
                      value={concern}
                      onChange={(e) => setConcern(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 transition-all resize-none bg-white"
                    />
                  </div>

                  {/* Mode Info Pill */}
                  <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-150 text-[11px] text-gray-600 flex items-center gap-2">
                    {mode === 'online' ? (
                      <>
                        <Laptop className="h-4 w-4 text-indigo-600 shrink-0" />
                        <span>Dr. Bilal will connect with you via WhatsApp Video / Google Meet.</span>
                      </>
                    ) : (
                      <>
                        <Building2 className="h-4 w-4 text-emerald-600 shrink-0" />
                        <span>In-person checkup at Brimish Clinic (Sami Tower, Ring Road, Peshawar).</span>
                      </>
                    )}
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3.5 px-4 rounded-xl bg-[#121927] hover:bg-[#1a2438] active:bg-[#0c111a] text-white text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-gray-900/10 transition-all disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin text-white" />
                        <span>Submitting...</span>
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 text-white" />
                        <span>Submit Details</span>
                      </>
                    )}
                  </button>

                  {/* Footer Badge */}
                  <div className="pt-2 text-center">
                    <p className="text-[11px] font-semibold tracking-wider text-gray-500 uppercase flex items-center justify-center gap-1.5">
                      <ShieldCheck className="h-3.5 w-3.5 text-blue-600" />
                      <span>Secure & Confidential</span>
                    </p>
                  </div>
                </form>
              ) : (
                /* Success View with Direct WhatsApp Connection */
                <div className="py-4 text-center space-y-5 animate-in fade-in duration-300">
                  <div className="h-16 w-16 mx-auto rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center shadow-xs">
                    <CheckCircle2 className="h-8 w-8" />
                  </div>

                  <div className="space-y-1">
                    <h4 className="text-xl font-bold text-gray-900 font-serif">
                      Consultation Request Received!
                    </h4>
                    <p className="text-xs text-gray-600 max-w-xs mx-auto">
                      Thank you <span className="font-semibold text-gray-900">{bookingSuccess.customerName}</span>. Your request has been queued in Dr. Bilal&apos;s schedule.
                    </p>
                  </div>

                  {/* Reference Ticket Card */}
                  <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 text-left space-y-2 text-xs">
                    <div className="flex justify-between items-center pb-2 border-b border-gray-200/80">
                      <span className="text-gray-500">Booking Reference</span>
                      <span className="font-mono font-bold text-gray-900 bg-white px-2 py-0.5 rounded border border-gray-200">
                        {bookingSuccess.refNumber}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500">Consultation Type</span>
                      <span className="font-semibold text-gray-800 flex items-center gap-1">
                        {bookingSuccess.mode === 'online' ? (
                          <>💻 Online Video Call</>
                        ) : (
                          <>🏥 On-Site In-Clinic</>
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500">Clinic Location</span>
                      <span className="text-gray-700">Sami Tower, Ring Road, Peshawar</span>
                    </div>
                  </div>

                  {/* Instant WhatsApp Confirmation Button */}
                  <div className="space-y-2 pt-1">
                    <a
                      href={bookingSuccess.whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
                    >
                      <MessageCircle className="h-4 w-4" />
                      <span>Confirm Slot on WhatsApp</span>
                      <ExternalLink className="h-3 w-3 opacity-80" />
                    </a>
                    <button
                      type="button"
                      onClick={closeConsultation}
                      className="w-full py-2.5 text-xs font-semibold text-gray-500 hover:text-gray-800 transition-colors"
                    >
                      Close Window
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </ConsultationModalContext.Provider>
  );
}
