import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { FileText, ShieldAlert, CheckCircle, Scale } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Terms of Service | Clinical Guidelines & Appointments',
  description:
    'Read the official terms and conditions for consultations, clinical treatments, and skincare orders at Brimish Skin Care Clinic in Peshawar.',
  alternates: {
    canonical: '/terms',
  },
};

export default function TermsPage() {
  return (
    <div className="bg-white min-h-screen py-16 sm:py-20">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 text-rose-700 text-xs font-semibold mb-4 border border-rose-100">
            <Scale className="h-3.5 w-3.5" />
            <span>Clinical Terms &amp; Treatment Policies</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-gray-900 tracking-tight">
            Terms of Service &amp; Clinical Policies
          </h1>
          <p className="mt-3 text-sm text-gray-600 leading-relaxed">
            Effective Date: October 2026 • Brimish Skin Care &amp; Laser Clinic, Peshawar
          </p>
        </div>

        {/* Content Body */}
        <div className="prose prose-rose max-w-none text-gray-700 space-y-8 text-sm sm:text-base leading-relaxed">
          <section className="p-6 rounded-2xl bg-amber-50/50 border border-amber-200/80">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-2">
              <ShieldAlert className="h-5 w-5 text-amber-600" />
              Important Medical Disclaimer
            </h2>
            <p className="text-gray-700 text-sm leading-relaxed">
              Information on this website is provided for educational and appointment reservation purposes only. It is not a substitute for a personal medical consultation or formal clinical diagnosis. Every patient&apos;s skin physiology is unique; treatment outcomes vary based on individual genetic factors, skin depth, adherence to post-care protocols, and hormonal profile.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-gray-900">1. Appointments &amp; Consultations</h2>
            <ul className="list-disc pl-5 space-y-1.5 text-gray-600">
              <li><strong>Zero Advance Deposit:</strong> You do not need to make an advance payment or provide a credit card to reserve a consultation on our website.</li>
              <li><strong>Confirmation:</strong> All online appointments are provisional until confirmed via WhatsApp or phone call by our clinic front desk.</li>
              <li><strong>Cancellations &amp; Rescheduling:</strong> We kindly request at least 4 hours advance notice if you need to reschedule, allowing other patients on our waiting list to be accommodated.</li>
              <li><strong>Punctuality:</strong> Please arrive 10 minutes before your scheduled appointment time to ensure full duration for your skin prep and consultation.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-gray-900">2. Clinical Protocols &amp; Informed Consent</h2>
            <p className="text-gray-600">
              Before commencing any medical aesthetic procedure (such as HydraFacial MD, Chemical Peels, Microneedling, or Laser treatments), you will receive a detailed verbal and written explanation of:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-gray-600">
              <li>The specific active formulations and instruments utilized.</li>
              <li>Anticipated normal responses (e.g., mild transient redness, gentle epidermal flaking).</li>
              <li>Mandatory post-treatment home care (strict broad-spectrum SPF 50+ sun protection and gentle moisturization).</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-gray-900">3. Skincare Product Orders &amp; Nationwide Delivery</h2>
            <ul className="list-disc pl-5 space-y-1.5 text-gray-600">
              <li><strong>Authenticity Guarantee:</strong> All skincare products dispensed at our clinic or shipped online are 100% genuine, physician-formulated, and quality-tested.</li>
              <li><strong>Cash on Delivery (COD):</strong> Available across major cities in Pakistan with 2–4 business days delivery timeframe.</li>
              <li><strong>Hygiene &amp; Safety Returns:</strong> Due to hygiene regulations and medical safety guidelines, opened or unsealed topical skincare products cannot be returned once delivered, unless verified damaged during transit.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-gray-900">4. Transparent Pricing &amp; Fiscal Invoicing</h2>
            <p className="text-gray-600">
              Brimish Skin Care Clinic maintains full transparency in treatment fees. All charges are communicated upfront before any procedure begins. Every patient receives a computer-generated FBR Tier-1 integrated fiscal tax receipt with official NTN and KPRA registration credentials.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-gray-900">5. Governing Law</h2>
            <p className="text-gray-600">
              These terms are governed by and construed in accordance with the laws of the Islamic Republic of Pakistan, subject to the jurisdiction of the courts of Peshawar, Khyber Pakhtunkhwa.
            </p>
          </section>
        </div>

        {/* Return Button */}
        <div className="mt-12 pt-8 border-t border-gray-100 flex justify-between items-center">
          <Link
            href="/"
            className="text-xs font-semibold text-rose-600 hover:text-rose-700 transition-colors"
          >
            ← Back to Home
          </Link>
          <Link
            href="/privacy"
            className="text-xs font-semibold text-gray-600 hover:text-gray-900 transition-colors"
          >
            View Privacy Policy →
          </Link>
        </div>
      </div>
    </div>
  );
}
