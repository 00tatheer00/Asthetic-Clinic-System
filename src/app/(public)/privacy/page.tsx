import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ShieldCheck, Lock, Eye, FileText, CheckCircle2 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Privacy Policy | Patient Confidentiality & Data Protection',
  description:
    'Read Brimish Skin Care Clinic patient privacy policy. We adhere to the highest clinical data security, patient record confidentiality, and ethical medical standards.',
  alternates: {
    canonical: '/privacy',
  },
};

export default function PrivacyPage() {
  return (
    <div className="bg-white min-h-screen py-16 sm:py-20">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 text-rose-700 text-xs font-semibold mb-4 border border-rose-100">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Clinical Data Protection &amp; Patient Trust</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-gray-900 tracking-tight">
            Privacy &amp; Confidentiality Policy
          </h1>
          <p className="mt-3 text-sm text-gray-600 leading-relaxed">
            Last updated: October 2026 • Brimish Skin Care &amp; Laser Clinic, Peshawar
          </p>
        </div>

        {/* Content Body */}
        <div className="prose prose-rose max-w-none text-gray-700 space-y-8 text-sm sm:text-base leading-relaxed">
          <section className="p-6 rounded-2xl bg-rose-50/40 border border-rose-100">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-2">
              <Lock className="h-5 w-5 text-rose-600" />
              1. Our Patient Confidentiality Commitment
            </h2>
            <p className="text-gray-600 text-sm leading-relaxed">
              At Brimish Skin Care Clinic, Dr. Bilal Ahmad and all clinical staff are bound by strict medical confidentiality ethics. Your medical photographs, dermatological history, consultation notes, and contact details are treated with the highest degree of medical privacy. We do not sell, rent, or trade your personal or health data to third parties.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-gray-900">2. Information We Collect</h2>
            <p>We collect only information necessary to provide safe, effective clinical care:</p>
            <ul className="list-disc pl-5 space-y-1.5 text-gray-600">
              <li><strong>Contact Information:</strong> Patient name, WhatsApp phone number, city, and email address for appointment confirmation and order dispatch.</li>
              <li><strong>Clinical &amp; Dermatological History:</strong> Skin type, previous allergies, ongoing medications, and past aesthetic procedures to ensure complete patient safety.</li>
              <li><strong>Clinical Photography:</strong> Standardized medical before-and-after photographs taken during visits to monitor treatment response. These are never published publicly without explicit, written patient consent.</li>
              <li><strong>Transaction Records:</strong> Invoicing, treatment dates, and payment receipts in compliance with FBR and KPRA fiscal regulations.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-gray-900">3. How Your Information Is Used</h2>
            <p>Your information is used strictly for:</p>
            <ul className="list-disc pl-5 space-y-1.5 text-gray-600">
              <li>Scheduling, rescheduling, and sending WhatsApp reminders for clinic appointments.</li>
              <li>Doctor consultation diagnosis and personalized treatment protocol formulation.</li>
              <li>Secure fulfillment and door delivery of medical skincare products across Pakistan.</li>
              <li>Generating official fiscal tax invoices as required under Khyber Pakhtunkhwa Revenue Authority guidelines.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-gray-900">4. Medical Image Consent &amp; Anonymity</h2>
            <p className="text-gray-600">
              Any case studies, before/after comparisons, or educational demonstrations featured in our clinical gallery or official social media channels have been approved by the patient via signed photographic consent with full facial anonymity options upon request.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-gray-900">5. Data Storage &amp; Security Standards</h2>
            <p className="text-gray-600">
              Our clinical records are protected using enterprise-grade 256-bit SSL/TLS encryption, secure role-based staff access controls, and encrypted cloud database infrastructure with automated regular backups.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-gray-900">6. Contact Our Data Protection Desk</h2>
            <p className="text-gray-600">
              If you have any questions about your patient records, wish to update your details, or request deletion of non-fiscal information, please reach out to our clinic administrative desk:
            </p>
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 text-sm space-y-1">
              <p><strong>Brimish Skin Care &amp; Laser Clinic</strong></p>
              <p>Suite #3, 2nd Floor, Cantonment Plaza, Main University Road, Peshawar, KP</p>
              <p>Email: <a href="mailto:privacy@brimishskincare.com" className="text-rose-600 underline">privacy@brimishskincare.com</a></p>
              <p>UAN / WhatsApp: +92 312 9000100 / +92 91 5842100</p>
            </div>
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
            href="/terms"
            className="text-xs font-semibold text-gray-600 hover:text-gray-900 transition-colors"
          >
            View Terms of Service →
          </Link>
        </div>
      </div>
    </div>
  );
}
