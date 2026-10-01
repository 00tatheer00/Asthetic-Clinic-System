'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { BookingFlow } from '@/app/(public)/book/booking-flow';

interface BookingModalContextType {
  isOpen: boolean;
  treatmentId?: string;
  openBooking: (treatmentId?: string) => void;
  closeBooking: () => void;
}

const BookingModalContext = createContext<BookingModalContextType>({
  isOpen: false,
  openBooking: () => {},
  closeBooking: () => {},
});

export const useBookingModal = () => useContext(BookingModalContext);

export function BookingModalProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [treatmentId, setTreatmentId] = useState<string | undefined>(undefined);

  const openBooking = (tId?: string) => {
    setTreatmentId(tId);
    setIsOpen(true);
  };

  const closeBooking = () => {
    setIsOpen(false);
    setTreatmentId(undefined);
  };

  // Prevent background scroll when modal is open
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
        closeBooking();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  return (
    <BookingModalContext.Provider
      value={{ isOpen, treatmentId, openBooking, closeBooking }}
    >
      {children}

      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeBooking();
          }}
        >
          <div className="w-full max-w-2xl max-h-[92vh] flex flex-col my-auto">
            <BookingFlow
              initialTreatmentId={treatmentId}
              onClose={closeBooking}
              isModal={true}
            />
          </div>
        </div>
      )}
    </BookingModalContext.Provider>
  );
}
