'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  X,
  User,
  Phone,
  Mail,
  Send,
  ShieldCheck,
  Laptop,
  Building2,
  CheckCircle2,
  Loader2,
  MessageCircle,
  ExternalLink,
  Check,
  Stethoscope,
  MessageSquare,
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
  const [email, setEmail] = useState('');
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
    setTimeout(() => {
      setBookingSuccess(null);
      setFormError(null);
      setIsSubmitting(false);
      setFullName('');
      setPhone('');
      setEmail('');
      setConcern('');
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
    const cleanEmail = email.trim();

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
        customer_email: cleanEmail || undefined,
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
          className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeConsultation();
          }}
        >
          {/* Widened card container (max-w-xl sm:max-w-2xl) to prevent vertical scrolling */}
          <div className="w-full max-w-xl sm:max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-rose-100 animate-in zoom-in-95 duration-200 flex flex-col my-auto max-h-[96vh]">
            {/* Header: Brimish Signature Deep Plum/Wine Palette */}
            <div className="bg-gradient-to-r from-[#2D1226] via-[#3B1530] to-[#1E0B19] text-white px-5 py-4 sm:px-6 sm:py-5 relative shrink-0 overflow-hidden">
              {/* Subtle Ambient Glow */}
              <div className="absolute top-0 right-0 -mr-10 -mt-10 w-40 h-40 bg-rose-500/20 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 -ml-10 -mb-10 w-40 h-40 bg-pink-500/20 rounded-full blur-2xl pointer-events-none" />

              <div className="pr-10 relative z-10 space-y-0.5">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 text-rose-200 text-[10px] font-semibold uppercase tracking-wider border border-white/10">
                  <ShieldCheck className="h-3 w-3 text-rose-300" />
                  <span>Brimish Skin Care Clinic</span>
                </div>
                <h3 className="text-lg sm:text-xl font-bold tracking-tight font-serif text-white">
                  Book Doctor Consultation
                </h3>
                <p className="text-xs text-rose-100/90 flex items-center gap-1.5 flex-wrap font-sans">
                  <span className="font-semibold text-white">Dr. Bilal Ahmad</span>
                  <span className="text-rose-300/60">•</span>
                  <span>Specialist Aesthetic Dermatologist &amp; Laser Surgeon</span>
                </p>
              </div>

              <button
                type="button"
                onClick={closeConsultation}
                aria-label="Close modal"
                className="absolute top-4 right-4 sm:top-5 sm:right-5 h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 text-rose-200 hover:text-white flex items-center justify-center transition-colors z-10 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Body - Optimized 2-Column Grid so No Scrolling is Needed */}
            <div className="p-4 sm:p-6 overflow-y-auto">
              {!bookingSuccess ? (
                <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-3.5">
                  {formError && (
                    <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                      {formError}
                    </div>
                  )}

                  {/* Row 1: Full Name & Phone */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-800 flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5 text-rose-600" />
                        <span>Full Name *</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Your name"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs sm:text-sm text-gray-900 placeholder-gray-400 bg-rose-50/20 hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-600 transition-all"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-800 flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5 text-rose-600" />
                        <span>Phone / WhatsApp *</span>
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="0300 1234567"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs sm:text-sm text-gray-900 placeholder-gray-400 bg-rose-50/20 hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-600 transition-all font-mono text-[13px]"
                      />
                    </div>
                  </div>

                  {/* Row 2: Email & Consultation Mode */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-start">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-800 flex items-center gap-1.5">
                        <Mail className="h-3.5 w-3.5 text-rose-600" />
                        <span>Email Address <span className="text-gray-400 font-normal">(Optional)</span></span>
                      </label>
                      <input
                        type="email"
                        placeholder="patient@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs sm:text-sm text-gray-900 placeholder-gray-400 bg-rose-50/20 hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-600 transition-all"
                      />
                    </div>

                    {/* Mode Selector */}
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-800 flex items-center gap-1.5">
                        <Stethoscope className="h-3.5 w-3.5 text-rose-600" />
                        <span>Consultation Mode</span>
                      </label>

                      <div className="grid grid-cols-2 gap-2">
                        {/* Online Card */}
                        <button
                          type="button"
                          onClick={() => setMode('online')}
                          className={`p-2 rounded-xl border text-left transition-all relative flex flex-col justify-center cursor-pointer ${
                            mode === 'online'
                              ? 'border-rose-600 bg-rose-50/80 ring-2 ring-rose-500/20 shadow-xs'
                              : 'border-gray-200 bg-white hover:border-rose-200 text-gray-600'
                          }`}
                        >
                          {mode === 'online' && (
                            <span className="absolute top-1.5 right-1.5 h-3.5 w-3.5 rounded-full bg-rose-600 text-white flex items-center justify-center">
                              <Check className="h-2 w-2" />
                            </span>
                          )}
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm">💻</span>
                            <span className="text-xs font-bold text-gray-900 leading-tight">
                              Online
                            </span>
                          </div>
                          <span className="text-[10px] text-gray-500 mt-0.5 block leading-none">
                            Video / Audio Call
                          </span>
                        </button>

                        {/* On-Site Card */}
                        <button
                          type="button"
                          onClick={() => setMode('onsite')}
                          className={`p-2 rounded-xl border text-left transition-all relative flex flex-col justify-center cursor-pointer ${
                            mode === 'onsite'
                              ? 'border-rose-600 bg-rose-50/80 ring-2 ring-rose-500/20 shadow-xs'
                              : 'border-gray-200 bg-white hover:border-rose-200 text-gray-600'
                          }`}
                        >
                          {mode === 'onsite' && (
                            <span className="absolute top-1.5 right-1.5 h-3.5 w-3.5 rounded-full bg-rose-600 text-white flex items-center justify-center">
                              <Check className="h-2 w-2" />
                            </span>
                          )}
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm">🏥</span>
                            <span className="text-xs font-bold text-gray-900 leading-tight">
                              On-Site
                            </span>
                          </div>
                          <span className="text-[10px] text-gray-500 mt-0.5 block leading-none">
                            In-Clinic Visit
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Row 3: Concern */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <label className="font-semibold text-gray-800 flex items-center gap-1.5">
                        <MessageSquare className="h-3.5 w-3.5 text-rose-600" />
                        <span>Skin Concern / Question <span className="text-gray-400 font-normal">(Optional)</span></span>
                      </label>
                      <span className={`font-mono text-[11px] ${concern.length > 0 ? 'text-rose-600 font-semibold' : 'text-gray-400'}`}>
                        {concern.length}/100
                      </span>
                    </div>
                    <textarea
                      rows={2}
                      maxLength={100}
                      placeholder="Brief description of your concern (e.g., acne, pigmentation, scars, laser consultation)..."
                      value={concern}
                      onChange={(e) => setConcern(e.target.value)}
                      className="w-full px-3.5 py-1.5 rounded-xl border border-gray-200 text-xs sm:text-sm text-gray-900 placeholder-gray-400 bg-rose-50/20 hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-600 transition-all resize-none"
                    />
                  </div>

                  {/* Row 4: Mode Info Pill */}
                  <div className="py-1.5 px-3 rounded-xl bg-rose-50/60 border border-rose-200/60 text-[11px] text-rose-950 flex items-center gap-2">
                    {mode === 'online' ? (
                      <>
                        <Laptop className="h-3.5 w-3.5 text-rose-600 shrink-0" />
                        <span>Dr. Bilal will connect with you via WhatsApp Video / Google Meet call.</span>
                      </>
                    ) : (
                      <>
                        <Building2 className="h-3.5 w-3.5 text-rose-600 shrink-0" />
                        <span>In-person checkup at Brimish Clinic (Sami Tower, Ring Road, Peshawar).</span>
                      </>
                    )}
                  </div>

                  {/* Row 5: Submit Button & Confidence Guarantee */}
                  <div className="pt-1 space-y-2">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-2.5 sm:py-3 px-4 rounded-xl bg-gradient-to-r from-rose-600 via-pink-600 to-rose-600 hover:from-rose-700 hover:to-pink-700 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-rose-500/25 active:scale-[0.99] transition-all disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin text-white" />
                          <span>Submitting Details...</span>
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4 text-white" />
                          <span>Submit Details</span>
                        </>
                      )}
                    </button>

                    <p className="text-[10px] sm:text-[11px] font-semibold tracking-wider text-rose-950/70 uppercase flex items-center justify-center gap-1.5">
                      <ShieldCheck className="h-3.5 w-3.5 text-rose-600" />
                      <span>Secure &amp; Confidential • Zero Advance Payment Required</span>
                    </p>
                  </div>
                </form>
              ) : (
                /* Success View with Direct WhatsApp Connection */
                <div className="py-3 text-center space-y-4 animate-in fade-in duration-300">
                  <div className="h-14 w-14 mx-auto rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center shadow-xs">
                    <CheckCircle2 className="h-7 w-7" />
                  </div>

                  <div className="space-y-1">
                    <h4 className="text-lg sm:text-xl font-bold text-gray-900 font-serif">
                      Consultation Request Received!
                    </h4>
                    <p className="text-xs text-gray-600 max-w-sm mx-auto">
                      Thank you <span className="font-semibold text-gray-900">{bookingSuccess.customerName}</span>. Your request has been queued in Dr. Bilal&apos;s clinic schedule.
                    </p>
                  </div>

                  {/* Reference Ticket Card */}
                  <div className="p-3.5 rounded-2xl bg-rose-50/40 border border-rose-100 text-left space-y-2 text-xs max-w-md mx-auto">
                    <div className="flex justify-between items-center pb-2 border-b border-rose-100">
                      <span className="text-gray-500">Booking Reference</span>
                      <span className="font-mono font-bold text-gray-900 bg-white px-2 py-0.5 rounded border border-rose-200">
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
                  <div className="space-y-2 pt-1 max-w-md mx-auto">
                    <a
                      href={bookingSuccess.whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
                    >
                      <MessageCircle className="h-4 w-4" />
                      <span>Confirm Slot on WhatsApp</span>
                      <ExternalLink className="h-3 w-3 opacity-80" />
                    </a>
                    <button
                      type="button"
                      onClick={closeConsultation}
                      className="w-full py-2 text-xs font-semibold text-gray-500 hover:text-rose-600 transition-colors cursor-pointer"
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
