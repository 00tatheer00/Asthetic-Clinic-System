import { ContactForm } from './contact-form';
import { MapPin, Phone, Mail, Clock } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact & Clinic Location | Brimish Skin Care Clinic Peshawar',
  description:
    'Visit Brimish Skin Care Clinic at Cantonment Plaza, University Road, Peshawar. Call +92 91 5842100 or WhatsApp +92 312 9000100 for immediate doctor appointments, timings, and directions.',
  keywords: [
    'Brimish clinic contact number',
    'Dr Bilal phone number',
    'skin clinic University Road Peshawar address',
    'dermatologist appointment Peshawar',
    'Brimish WhatsApp appointment',
  ],
  alternates: {
    canonical: '/contact',
  },
  openGraph: {
    title: 'Contact Brimish Skin Care Clinic Peshawar',
    description:
      'Suite #3, 2nd Floor, Cantonment Plaza, Main University Road, Peshawar. Mon–Sat 10:00 AM – 7:00 PM.',
    url: '/contact',
  },
};

export default function ContactPage() {
  return (
    <div className="bg-white">
      <section className="bg-gradient-to-b from-rose-50/60 to-white py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 tracking-tight">
            Contact Us
          </h1>
          <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
            Have a question or want to learn more? Reach out and we&apos;ll get back to you promptly.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
            {/* Contact Form */}
            <div className="lg:col-span-3">
              <ContactForm />
            </div>

            {/* Contact Info */}
            <div className="lg:col-span-2 space-y-6">
              <div className="rounded-2xl border border-gray-100 p-6 shadow-sm space-y-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-500">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">Location</h3>
                    <p className="mt-1 text-sm text-gray-500">Peshawar, Khyber Pakhtunkhwa, Pakistan</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-500">
                    <Phone className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">Phone</h3>
                    <p className="mt-1 text-sm text-gray-500">Contact for number</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-500">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">Email</h3>
                    <p className="mt-1 text-sm text-gray-500">info@brimishskincare.com</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-500">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">Working Hours</h3>
                    <p className="mt-1 text-sm text-gray-500">Mon – Fri: 10am – 7pm</p>
                    <p className="text-sm text-gray-500">Saturday: 10am – 5pm</p>
                    <p className="text-sm text-gray-500">Sunday: Closed</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
