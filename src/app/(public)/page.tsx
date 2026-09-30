import Link from 'next/link';
import { ArrowRight, Sparkles, Star, Shield, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function HomePage() {
  return (
    <>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-rose-50 via-white to-pink-50">
        {/* Decorative elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-gradient-to-br from-rose-200/30 to-pink-200/30 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-gradient-to-br from-pink-200/20 to-rose-200/20 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 sm:py-28 lg:py-36">
          <div className="max-w-3xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-1.5 rounded-full bg-rose-100/80 px-4 py-1.5 text-xs font-medium text-rose-700 backdrop-blur-sm border border-rose-200/50 mb-6">
              <Sparkles className="h-3.5 w-3.5" />
              Premium Skincare Clinic in Peshawar
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-gray-900 leading-[1.1]">
              Your Journey to
              <span className="block mt-1 bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 bg-clip-text text-transparent">
                Beautiful Skin
              </span>
              Starts Here
            </h1>

            <p className="mt-6 text-lg sm:text-xl text-gray-600 leading-relaxed max-w-2xl mx-auto">
              Expert aesthetic treatments and premium skincare products,
              delivered with compassion and clinical excellence in the heart of Peshawar.
            </p>

            {/* CTAs */}
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link href="/book">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white shadow-lg shadow-rose-200/50 rounded-full px-8 text-base"
                >
                  Book Appointment
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/treatments">
                <Button
                  variant="outline"
                  size="lg"
                  className="rounded-full px-8 text-base border-gray-300 hover:bg-gray-50"
                >
                  View Treatments
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="border-y border-gray-100 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: Star, label: 'Expert Care', desc: 'Certified dermatological treatments' },
              { icon: Shield, label: 'Safe & Trusted', desc: 'Clinically proven procedures' },
              { icon: Clock, label: 'Easy Booking', desc: 'Book online in seconds' },
              { icon: Sparkles, label: 'Premium Products', desc: 'Curated skincare range' },
            ].map((item) => (
              <div key={item.label} className="flex flex-col items-center text-center gap-2">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-500">
                  <item.icon className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-semibold text-gray-900">{item.label}</h3>
                <p className="text-xs text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Treatments Preview */}
      <section className="py-20 sm:py-24 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              Our Featured Treatments
            </h2>
            <p className="mt-3 text-gray-600 max-w-xl mx-auto">
              Discover our most popular treatments, designed to rejuvenate and transform your skin.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: 'HydraFacial',
                desc: 'Deep cleansing and hydrating facial treatment for radiant, glowing skin.',
                price: 'Rs. 5,000',
                tag: 'Most Popular',
              },
              {
                title: 'Chemical Peel',
                desc: 'Professional peels for improved skin texture, tone, and clarity.',
                price: 'From Rs. 3,500',
                tag: 'Anti-Aging',
              },
              {
                title: 'Microneedling',
                desc: 'Collagen-boosting treatment for smoother, younger-looking skin.',
                price: 'Rs. 6,000',
                tag: 'Rejuvenation',
              },
            ].map((treatment) => (
              <div
                key={treatment.title}
                className="group relative rounded-2xl border border-gray-100 bg-white p-6 shadow-sm hover:shadow-xl hover:border-rose-100 transition-all duration-300"
              >
                <div className="inline-flex rounded-full bg-rose-50 px-3 py-1 text-xs font-medium text-rose-600 mb-4">
                  {treatment.tag}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 group-hover:text-rose-600 transition-colors">
                  {treatment.title}
                </h3>
                <p className="mt-2 text-sm text-gray-500 leading-relaxed">
                  {treatment.desc}
                </p>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-lg font-bold text-gray-900">{treatment.price}</span>
                  <Link href="/book">
                    <Button size="sm" variant="outline" className="rounded-full text-xs">
                      Book Now
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link href="/treatments">
              <Button variant="outline" className="rounded-full px-8">
                View All Treatments
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-gray-900 via-gray-950 to-gray-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white">
            Ready to Transform Your Skin?
          </h2>
          <p className="mt-4 text-lg text-gray-300 max-w-xl mx-auto">
            Book your consultation today and let our experts create a personalized treatment plan for you.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/book">
              <Button
                size="lg"
                className="bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white shadow-lg shadow-rose-500/20 rounded-full px-8 text-base"
              >
                Book Appointment
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/contact">
              <Button
                variant="outline"
                size="lg"
                className="rounded-full px-8 text-base border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white"
              >
                Contact Us
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Structured Data (Schema.org) */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'MedicalClinic',
            name: 'Brimish Skin Care Clinic',
            description:
              'Expert aesthetic skincare treatments and premium products in Peshawar, Pakistan.',
            url: process.env.NEXT_PUBLIC_SITE_URL || 'https://brimishskincare.com',
            address: {
              '@type': 'PostalAddress',
              addressLocality: 'Peshawar',
              addressRegion: 'Khyber Pakhtunkhwa',
              addressCountry: 'PK',
            },
            priceRange: 'PKR',
            telephone: '+92-300-0000000',
            medicalSpecialty: 'Dermatology',
          }),
        }}
      />
    </>
  );
}
