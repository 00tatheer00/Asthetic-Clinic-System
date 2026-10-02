import { ContactForm } from './contact-form';
import { MapPin, Phone, Mail, Clock, Car, ShieldCheck, MessageCircle, Navigation } from 'lucide-react';
import type { Metadata } from 'next';
import { CLINIC_WHATSAPP_NUMBER } from '@/lib/utils/helpers';

export const metadata: Metadata = {
  title: 'Contact & Clinic Location | Brimish Skin Care Clinic Peshawar',
  description:
    'Visit Brimish Skin Care Clinic at Sami Tower, Ring Road, Peshawar. Call or WhatsApp 0335-6400959 for appointments, timings, and directions.',
  keywords: [
    'Brimish clinic contact number',
    'Dr Bilal phone number 03356400959',
    'skin clinic Ring Road Peshawar address',
    'Sami Tower Peshawar skin specialist',
    'dermatologist appointment Peshawar',
    'Brimish WhatsApp appointment',
  ],
  alternates: {
    canonical: '/contact',
  },
  openGraph: {
    title: 'Contact Brimish Skin Care Clinic Peshawar',
    description:
      'Sami Tower, Ring Road, Peshawar. Mon–Sat 10:00 AM – 7:00 PM. Call/WhatsApp 0335-6400959.',
    url: '/contact',
  },
};

export default function ContactPage() {
  return (
    <div className="bg-white">
      {/* Hero Header */}
      <section className="bg-gradient-to-b from-rose-50/70 via-white to-white py-16 sm:py-20 border-b border-rose-100/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-100 text-rose-700 text-xs font-semibold uppercase tracking-wider mb-4">
            <MapPin className="h-3.5 w-3.5" />
            Sami Tower, Ring Road, Peshawar
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-serif text-gray-950 tracking-tight">
            Visit Our Clinic & Contact Us
          </h1>
          <p className="mt-4 text-sm sm:text-base text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Conveniently located at Sami Tower on Ring Road, Peshawar. Walk in for consultation or contact Dr. Bilal&apos;s team for quick appointment confirmation.
          </p>
        </div>
      </section>

      {/* Main Content: Form + Detailed Contact Cards */}
      <section className="py-14 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Contact Form */}
            <div className="lg:col-span-7">
              <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200/80 shadow-md">
                <h2 className="text-xl font-bold font-serif text-gray-900 mb-2">
                  Send Us a Direct Message
                </h2>
                <p className="text-xs sm:text-sm text-gray-500 mb-6">
                  Fill in your details below and Dr. Bilal&apos;s medical team will contact you promptly.
                </p>
                <ContactForm />
              </div>
            </div>

            {/* Contact Details & Parking */}
            <div className="lg:col-span-5 space-y-6">
              <div className="rounded-3xl border border-gray-200/80 bg-white p-6 sm:p-7 shadow-md space-y-6">
                <h3 className="text-lg font-bold font-serif text-gray-900 border-b border-gray-100 pb-3">
                  Clinic Information
                </h3>

                {/* Location */}
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 border border-rose-100 shadow-xs">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">Clinic Address</h4>
                    <p className="mt-1 text-sm font-semibold text-gray-900 leading-snug">
                      Sami Tower, Ring Road
                    </p>
                    <p className="text-xs text-rose-600 font-medium mt-0.5">
                      Peshawar, Khyber Pakhtunkhwa, Pakistan
                    </p>
                  </div>
                </div>

                {/* Phone & WhatsApp */}
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-xs">
                    <Phone className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">Doctor Phone & WhatsApp</h4>
                    <div className="flex flex-col gap-1">
                      <a
                        href="tel:+923356400959"
                        className="text-sm font-semibold text-gray-900 hover:text-rose-600 transition-colors"
                      >
                        Dr. Bilal: 0335-6400959
                      </a>
                      <a
                        href={`https://wa.me/${CLINIC_WHATSAPP_NUMBER}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full w-fit mt-1"
                      >
                        <MessageCircle className="h-3.5 w-3.5" />
                        Chat on WhatsApp (0335-6400959)
                      </a>
                    </div>
                  </div>
                </div>

                {/* Email */}
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 border border-rose-100 shadow-xs">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">Official Email</h4>
                    <a
                      href="mailto:info@brimishskincare.com"
                      className="mt-1 text-sm font-medium text-gray-900 hover:text-rose-600 transition-colors block"
                    >
                      info@brimishskincare.com
                    </a>
                  </div>
                </div>

                {/* Timings */}
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 border border-rose-100 shadow-xs">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">Consultation Hours</h4>
                    <p className="mt-1 text-sm font-medium text-gray-900">
                      Monday – Saturday: 10:00 AM – 7:00 PM
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Sunday: Closed (Emergency appointments on WhatsApp)
                    </p>
                  </div>
                </div>

                {/* Parking Guide Box */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-rose-50 to-pink-50 border border-rose-100">
                  <div className="flex items-center gap-2 text-xs font-bold text-rose-800 uppercase tracking-wide mb-1.5">
                    <Car className="h-4 w-4 text-rose-600" />
                    Patient Parking & Accessibility
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Easy roadside and dedicated parking available for Brimish patients at Sami Tower, Ring Road. Building elevator provides direct access to clinic reception.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Google Map Section */}
      <section className="py-10 bg-gray-50/70 border-t border-gray-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold font-serif text-gray-950">
                Clinic Location Map
              </h2>
              <p className="text-xs sm:text-sm text-gray-600">
                Sami Tower, Ring Road, Peshawar, Khyber Pakhtunkhwa
              </p>
            </div>
            <a
              href="https://maps.google.com/?q=Sami+Tower+Ring+Road+Peshawar"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-md transition-colors"
            >
              <Navigation className="h-3.5 w-3.5" />
              Open in Google Maps App
            </a>
          </div>

          {/* Embedded Google Map */}
          <div className="w-full h-80 sm:h-96 rounded-3xl overflow-hidden border border-gray-300 shadow-inner relative bg-gray-200">
            <iframe
              title="Brimish Skin Care Clinic - Sami Tower Ring Road Peshawar Location Map"
              src="https://maps.google.com/maps?q=Sami+Tower,+Ring+Road,+Peshawar,+Pakistan&t=&z=15&ie=UTF8&iwloc=&output=embed"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen={false}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="w-full h-full filter saturate-110"
            />
          </div>
        </div>
      </section>
    </div>
  );
}
