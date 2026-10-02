import React from 'react';

interface SeoStructuredDataProps {
  url?: string;
  title?: string;
  description?: string;
  imageUrl?: string;
  isHome?: boolean;
}

export function SeoStructuredData({
  description = 'Peshawar’s premier medical aesthetics and dermatology clinic led by Dr. Bilal Ahmad. Specializing in HydraFacial MD, medical chemical peels, microneedling, acne treatments, and laser therapy at Sami Tower, Ring Road, Peshawar.',
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
    alternateName: ['Brimish Skin Care', 'Dr. Bilal Skin Clinic Peshawar', 'Brimish Aesthetic Clinic'],
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
    telephone: ['+923356400959'],
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
    founder: {
      '@type': 'Person',
      name: 'Dr. Bilal Ahmad',
      jobTitle: 'Clinical Director & Aesthetic Physician',
      worksFor: {
        '@id': `${siteUrl}/#clinic`,
      },
    },
    physician: {
      '@type': 'Physician',
      name: 'Dr. Bilal Ahmad',
      medicalSpecialty: [
        'Dermatology',
        'Aesthetic Medicine',
        'Cosmetic Dermatology',
        'Laser Skin Surgery',
      ],
      qualifications: 'MD Aesthetic Medicine, Clinical Dermatology Fellow',
      image: `${siteUrl}/images/dr-bilal.jpg`,
      availableService: [
        {
          '@type': 'MedicalProcedure',
          name: 'HydraFacial MD',
          procedureType: 'https://schema.org/NoninvasiveProcedure',
          bodyLocation: 'Face',
        },
        {
          '@type': 'MedicalProcedure',
          name: 'Medical Chemical Peel',
          procedureType: 'https://schema.org/NoninvasiveProcedure',
          bodyLocation: 'Face, Neck',
        },
        {
          '@type': 'MedicalProcedure',
          name: 'Collagen Microneedling',
          procedureType: 'https://schema.org/PercutaneousProcedure',
          bodyLocation: 'Face',
        },
        {
          '@type': 'MedicalProcedure',
          name: 'Carbon Laser Peel',
          procedureType: 'https://schema.org/NoninvasiveProcedure',
          bodyLocation: 'Face',
        },
        {
          '@type': 'MedicalProcedure',
          name: 'Acne Clearance Clinical Protocol',
          procedureType: 'https://schema.org/NoninvasiveProcedure',
          bodyLocation: 'Face, Back',
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
    name: 'Brimish Skin Care Clinic',
    description: 'Premier Aesthetic Clinic & Clinical Dermatology in Peshawar, Pakistan.',
    publisher: {
      '@id': `${siteUrl}/#clinic`,
    },
    inLanguage: ['en-US', 'en-PK'],
    potentialAction: {
      '@type': 'SearchAction',
      target: `${siteUrl}/treatments?q={search_term_string}`,
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
          text: 'Brimish Skin Care Clinic is conveniently located at Sami Tower, Ring Road, Peshawar, Khyber Pakhtunkhwa, Pakistan. Dedicated parking and elevator access are available.',
        },
      },
      {
        '@type': 'Question',
        name: 'Who is the lead doctor at Brimish Skin Care Clinic?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Dr. Bilal Ahmad is the Clinical Director and Lead Aesthetic Physician at Brimish Skin Care Clinic. He personally assesses every patient skin condition before prescribing or administering clinical protocols.',
        },
      },
      {
        '@type': 'Question',
        name: 'What is the price of HydraFacial in Peshawar at Brimish Clinic?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'At Brimish Skin Care Clinic, authentic 7-step Medical HydraFacial MD treatments start from PKR 5,000. All prices are completely transparent with no hidden taxes or forced packages.',
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
        name: 'How do I book an appointment with Dr. Bilal?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'You can easily book online through our website without needing a credit card or advance payment. Simply choose your preferred treatment and date/time, and our clinic desk confirms via WhatsApp within 15 minutes.',
        },
      },
      {
        '@type': 'Question',
        name: 'What treatments are best for stubborn acne scars and melasma?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Dr. Bilal offers targeted combination therapy for acne scars and melasma, including Medical Chemical Peels, Collagen Microneedling (Dermapen), and customized active serums tailored to your individual skin depth.',
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
