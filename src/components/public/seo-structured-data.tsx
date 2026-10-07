import React from 'react';

interface SeoStructuredDataProps {
  url?: string;
  title?: string;
  description?: string;
  imageUrl?: string;
  isHome?: boolean;
}

export function SeoStructuredData({
  description = 'Peshawar’s premier medical aesthetics and dermatology clinic led by Dr. Bilal Khan (Dermatologist & Cosmetologist). Specializing in HydraFacial MD, medical chemical peels, microneedling, acne scar therapy, PRP, and laser skin treatments at Sami Tower, Ring Road, Peshawar.',
  imageUrl = 'https://brimishskincare.com/images/hero-clinic.jpg',
  isHome = true,
}: SeoStructuredDataProps) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://brimishskincare.com';

  // 1. Primary Clinic Schema: MedicalBusiness + DermatologyClinic + HealthAndBeautyBusiness
  const clinicSchema = {
    '@context': 'https://schema.org',
    '@type': ['MedicalBusiness', 'DermatologyClinic', 'HealthAndBeautyBusiness'],
    '@id': `${siteUrl}/#clinic`,
    name: 'Brimish Skin Care & Laser Clinic',
    alternateName: [
      'Brimish Skin Care',
      'Dr Bilal Khan Dermatologist & Cosmetologist',
      'Dr. Bilal Khan Skin Clinic Peshawar',
      'Dr. Bilal Ahmad Skin Clinic',
      'Brimish Aesthetic Clinic Peshawar',
      'Brimish Skin Care By Dr Bilal Khan',
    ],
    legalName: 'Brimish Skin Care Clinic (Pvt) Ltd.',
    description: description,
    url: siteUrl,
    logo: `${siteUrl}/images/logo.png`,
    image: [
      imageUrl,
      `${siteUrl}/images/hero-clinic.jpg`,
      `${siteUrl}/images/dr-bilal.jpg`,
      `${siteUrl}/images/treatment-hydrafacial.jpg`,
    ],
    telephone: ['+923356400959', '+923356400959'],
    email: 'info@brimishskincare.com',
    priceRange: 'PKR 2,000 - PKR 35,000',
    currenciesAccepted: 'PKR',
    paymentAccepted: 'Cash, Credit Card, Debit Card, JazzCash, EasyPaisa, Bank Transfer',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Sami Tower, Ring Road',
      addressLocality: 'Peshawar',
      addressRegion: 'Khyber Pakhtunkhwa',
      postalCode: '25000',
      addressCountry: 'PK',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 34.0047,
      longitude: 71.5369,
    },
    hasMap: 'https://maps.google.com/?q=Sami+Tower+Ring+Road+Peshawar',
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        opens: '10:00',
        closes: '19:00',
      },
    ],
    contactPoint: [
      {
        '@type': 'ContactPoint',
        telephone: '+923356400959',
        contactType: 'customer service',
        areaServed: 'PK',
        availableLanguage: ['en', 'ur', 'ps'],
      },
      {
        '@type': 'ContactPoint',
        telephone: '+923356400959',
        contactType: 'reservations',
        areaServed: 'PK',
        availableLanguage: ['en', 'ur', 'ps'],
      },
    ],
    founder: {
      '@type': 'Person',
      name: 'Dr. Bilal Khan',
      alternateName: ['Dr. Bilal Ahmad', 'Dr Bilal Khan Dermatologist'],
      jobTitle: 'Consultant Dermatologist & Cosmetologist',
      worksFor: {
        '@id': `${siteUrl}/#clinic`,
      },
    },
    physician: {
      '@type': 'Physician',
      name: 'Dr. Bilal Khan',
      alternateName: ['Dr. Bilal Ahmad', 'Dr Bilal Khan Dermatologist & Cosmetologist'],
      jobTitle: 'Consultant Dermatologist & Cosmetologist',
      medicalSpecialty: [
        'Dermatology',
        'Cosmetology',
        'Aesthetic Medicine',
        'Cosmetic Dermatology',
        'Laser Skin Surgery',
        'Trichology',
      ],
      qualifications: 'MBBS, Certified Dermatologist & Cosmetologist, Aesthetic Medicine Specialist',
      image: `${siteUrl}/images/dr-bilal.jpg`,
      knowsAbout: [
        'HydraFacial MD',
        'Laser Hair Removal',
        'Acne Vulgaris Treatment',
        'Chemical Peels',
        'Collagen Microneedling',
        'Melasma and Hyperpigmentation',
        'PRP Hair Regrowth',
        'Carbon Laser Peel',
      ],
      availableService: [
        {
          '@type': 'MedicalProcedure',
          name: 'HydraFacial MD Deep Rejuvenation',
          procedureType: 'https://schema.org/NoninvasiveProcedure',
          bodyLocation: 'Face',
          description: 'Authentic 7-step medical hydradermabrasion for deep vortex cleansing, painless blackhead extraction, and antioxidant hydration.',
        },
        {
          '@type': 'MedicalProcedure',
          name: 'Medical Chemical Peels',
          procedureType: 'https://schema.org/NoninvasiveProcedure',
          bodyLocation: 'Face, Neck, Hands',
          description: 'Physician-calibrated chemical peels with salicylic, glycolic, and TCA acids formulated safely for Pakistani Fitzpatrick skin types.',
        },
        {
          '@type': 'MedicalProcedure',
          name: 'Collagen Induction Microneedling (Dermapen)',
          procedureType: 'https://schema.org/PercutaneousProcedure',
          bodyLocation: 'Face',
          description: 'Targeted micro-channel therapy with pure hyaluronic acid and peptides for icepick acne scars, enlarged pores, and skin texture.',
        },
        {
          '@type': 'MedicalProcedure',
          name: 'Carbon Laser Peel (Hollywood Glow)',
          procedureType: 'https://schema.org/NoninvasiveProcedure',
          bodyLocation: 'Face',
          description: 'Q-Switched laser treatment with activated carbon suspension for instant radiance, oil control, and pore contraction.',
        },
        {
          '@type': 'MedicalProcedure',
          name: 'PRP Hair & Facial Rejuvenation',
          procedureType: 'https://schema.org/PercutaneousProcedure',
          bodyLocation: 'Scalp, Face',
          description: 'Platelet-Rich Plasma therapy using autologous growth factors to stimulate dormant hair follicles and restore dermal density.',
        },
        {
          '@type': 'MedicalProcedure',
          name: 'Painless Triple-Wavelength Laser Hair Removal',
          procedureType: 'https://schema.org/NoninvasiveProcedure',
          bodyLocation: 'Face, Body',
          description: 'Medical-grade diode and triple-wavelength laser hair reduction with ice-cooling tip for comfortable, permanent follicle reduction.',
        },
        {
          '@type': 'MedicalProcedure',
          name: 'Clinical Acne Clearance Protocol',
          procedureType: 'https://schema.org/NoninvasiveProcedure',
          bodyLocation: 'Face, Back, Chest',
          description: 'Comprehensive medical protocol targeting active bacterial acne, pustules, comedones, and post-inflammatory erythema.',
        },
      ],
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.9',
      bestRating: '5',
      worstRating: '1',
      ratingCount: '168',
      reviewCount: '154',
    },
    potentialAction: {
      '@type': 'ReserveAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${siteUrl}/book`,
        inLanguage: 'en-PK',
        actionPlatform: [
          'http://schema.org/DesktopWebPlatform',
          'http://schema.org/MobileWebPlatform',
        ],
      },
      result: {
        '@type': 'Reservation',
        name: 'Doctor Consultation & Treatment Booking',
      },
    },
  };

  // 2. WebSite Schema with Sitelinks SearchBox
  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${siteUrl}/#website`,
    url: siteUrl,
    name: 'Brimish Skin Care Clinic | Dr Bilal Khan',
    alternateName: 'Brimish Skin Care Peshawar',
    description: 'Premier Aesthetic Clinic & Clinical Dermatology led by Dr Bilal Khan (Dermatologist & Cosmetologist) in Peshawar, Pakistan.',
    publisher: {
      '@id': `${siteUrl}/#clinic`,
    },
    inLanguage: ['en-PK', 'ur-PK', 'en-US'],
    potentialAction: {
      '@type': 'SearchAction',
      target: `${siteUrl}/treatments?search={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };

  // 3. FAQPage Schema for Google Featured Snippets & People Also Ask
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'Where is Brimish Skin Care Clinic located in Peshawar?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Brimish Skin Care Clinic is conveniently located at Sami Tower, Ring Road, Peshawar, Khyber Pakhtunkhwa, Pakistan. The clinic features dedicated secure parking and elevator access.',
        },
      },
      {
        '@type': 'Question',
        name: 'Who is the lead doctor at Brimish Skin Care Clinic?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Dr. Bilal Khan (Dermatologist & Cosmetologist, also known as Dr. Bilal Ahmad) is the Clinical Director and Lead Physician at Brimish Skin Care Clinic. He personally assesses every patient skin condition before prescribing or administering clinical protocols.',
        },
      },
      {
        '@type': 'Question',
        name: 'What is the price of HydraFacial in Peshawar at Brimish Skin Care?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'At Brimish Skin Care Clinic, authentic 7-step Medical HydraFacial MD treatments start from PKR 5,000. All prices are completely transparent with no hidden consultation surcharges or forced package commitments.',
        },
      },
      {
        '@type': 'Question',
        name: 'Are treatments safe for Pakistani and South Asian skin tones?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes, 100%. All clinical protocols, lasers, and chemical peel concentrations at Brimish Clinic are specifically calibrated for Fitzpatrick skin types III to V common in Pakistan, preventing post-inflammatory hyperpigmentation (PIH) and ensuring zero burn risk.',
        },
      },
      {
        '@type': 'Question',
        name: 'How do I book an appointment with Dr. Bilal Khan?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'You can easily book online through brimishskincare.com/book without needing a credit card or advance deposit. Simply choose your preferred treatment and date/time, or message our clinic desk directly via WhatsApp at 0335-6400959.',
        },
      },
      {
        '@type': 'Question',
        name: 'What treatments are best for stubborn acne scars and melasma in Peshawar?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Dr. Bilal Khan offers targeted combination therapy for acne scars and melasma, including Medical Chemical Peels, Collagen Microneedling (Dermapen), Carbon Laser Peels, and customized medical-grade topical formulations tailored to skin depth.',
        },
      },
      {
        '@type': 'Question',
        name: 'What is PRP hair therapy and how does it prevent hair loss?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'PRP (Platelet-Rich Plasma) therapy isolates concentrated growth factors from your own blood and micro-injects them into thinning areas of the scalp. It rejuvenates dormant hair follicles, reduces shedding, and encourages new natural hair density.',
        },
      },
      {
        '@type': 'Question',
        name: 'Does Brimish Skin Care accept walk-in patients?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes, walk-in patients are warmly welcomed at our Sami Tower, Ring Road Peshawar location. However, booking an appointment online or calling 0335-6400959 in advance ensures priority zero-wait consultation with Dr. Bilal Khan.',
        },
      },
    ],
  };

  // 4. BreadcrumbList Schema
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: siteUrl,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Treatments',
        item: `${siteUrl}/treatments`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: 'Book Consultation',
        item: `${siteUrl}/book`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(clinicSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      {isHome && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
    </>
  );
}
