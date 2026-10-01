export interface TreatmentOption {
  id: string;
  name: string;
  duration: string;
  price: number;
  description: string;
}

export interface TreatmentService {
  id: string;
  dbId: string;
  name: string;
  department: 'aesthetic' | 'studio';
  section: string;
  basePrice: number;
  priceLabel?: string;
  subtitle: string;
  options: TreatmentOption[];
}

export const BOOKING_CATALOG: TreatmentService[] = [
  // ==========================================
  // AESTHETIC CLINIC
  // ==========================================
  {
    id: 'laser-hair-removal',
    dbId: '939c861a-621f-4176-a65c-ce379f6836a5',
    name: 'Laser hair removal',
    department: 'aesthetic',
    section: 'Hair removal',
    basePrice: 1000,
    priceLabel: 'from PKR 1,000',
    subtitle: '6 options available',
    options: [
      {
        id: 'lhr-upper-lip',
        name: 'Upper Lip',
        duration: '15 mins',
        price: 1000,
        description: 'Targeted diode triple-wavelength laser for fast upper lip hair reduction.',
      },
      {
        id: 'lhr-chin-jaw',
        name: 'Chin & Jawline',
        duration: '20 mins',
        price: 2000,
        description: 'Smooth precision laser contouring for stubborn hormonal hair growth.',
      },
      {
        id: 'lhr-underarms',
        name: 'Underarms (Both)',
        duration: '25 mins',
        price: 2500,
        description: 'Virtually painless diode laser with cooling sapphire tip.',
      },
      {
        id: 'lhr-full-face',
        name: 'Full Face Laser',
        duration: '35 mins',
        price: 3500,
        description: 'Complete forehead, cheeks, upper lip and chin hair removal for a satin-soft finish.',
      },
      {
        id: 'lhr-full-arms',
        name: 'Full Arms & Hands',
        duration: '45 mins',
        price: 5000,
        description: 'Complete arms hair reduction including hands and fingers.',
      },
      {
        id: 'lhr-full-body',
        name: 'Full Body Elite Session',
        duration: '90 mins',
        price: 18000,
        description: 'Comprehensive head-to-toe medical laser hair reduction package.',
      },
    ],
  },
  {
    id: 'pico-laser',
    dbId: '40b6a470-df38-45bd-8536-2c3d2b958cf7',
    name: 'Pico laser',
    department: 'aesthetic',
    section: 'Pigmentation and melasma',
    basePrice: 1500,
    priceLabel: 'from PKR 1,500',
    subtitle: '4 options available',
    options: [
      {
        id: 'pico-spot',
        name: 'Targeted Dark Spot Treatment',
        duration: '20 mins',
        price: 1500,
        description: 'Pinpoint acoustic picosecond pulses breaking down individual stubborn sun spots.',
      },
      {
        id: 'pico-carbon',
        name: 'Hollywood Carbon Laser Peel',
        duration: '45 mins',
        price: 4500,
        description: 'Liquid carbon laser vaporization for porcelain radiance, pore shrinking, and oil control.',
      },
      {
        id: 'pico-melasma',
        name: 'Melasma Deep Clarity Protocol',
        duration: '45 mins',
        price: 6000,
        description: 'Non-thermal acoustic shockwaves targeting dermal melasma without rebound hyperpigmentation.',
      },
      {
        id: 'pico-full-face',
        name: 'Full Face Pico Collagen Rejuvenation',
        duration: '60 mins',
        price: 8500,
        description: 'Overall skin tone evening, instant brightening and deep dermal remodeling.',
      },
    ],
  },
  {
    id: 'mesotherapy',
    dbId: '11ca8511-9f4c-4265-af7e-c314115d8598',
    name: 'Mesotherapy',
    department: 'aesthetic',
    section: 'Pigmentation and melasma',
    basePrice: 4000,
    priceLabel: 'from PKR 4,000',
    subtitle: '3 options available',
    options: [
      {
        id: 'meso-bright',
        name: 'Glutathione & Vitamin C Glow Infusion',
        duration: '40 mins',
        price: 4000,
        description: 'Direct intradermal micro-infusion for luminous, even-toned skin.',
      },
      {
        id: 'meso-hydrate',
        name: 'Hyaluronic Deep Dew Micro-Droplets',
        duration: '45 mins',
        price: 5000,
        description: 'Plumping micro-droplets of pure uncrosslinked HA for hydrated glass skin.',
      },
      {
        id: 'meso-hair',
        name: 'Hair Restoration Peptide Meso',
        duration: '45 mins',
        price: 5500,
        description: 'Active peptide and biotin micro-cocktail for stopping hair fall and encouraging regrowth.',
      },
    ],
  },
  {
    id: 'hydrafacial',
    dbId: '9803b3c3-2e1d-44dd-b684-3782c0c90a9b',
    name: 'HydraFacial MD',
    department: 'aesthetic',
    section: 'Facials and hydration',
    basePrice: 5000,
    priceLabel: 'from PKR 5,000',
    subtitle: '3 options available',
    options: [
      {
        id: 'hf-classic',
        name: 'HydraFacial Classic',
        duration: '45 mins',
        price: 5000,
        description: 'Signature 3-step vortex cleansing, gentle acid peeling, painless suction extractions and antioxidant infusion.',
      },
      {
        id: 'hf-deluxe',
        name: 'HydraFacial Deluxe',
        duration: '60 mins',
        price: 7500,
        description: 'Includes targeted booster serum (brightening or anti-aging) and clinical LED light therapy.',
      },
      {
        id: 'hf-platinum',
        name: 'HydraFacial Platinum VIP',
        duration: '75 mins',
        price: 10000,
        description: 'Begins with facial lymphatic drainage, customized booster, LED light, and neck/decollete treatment.',
      },
    ],
  },
  {
    id: 'chemical-peel',
    dbId: '76d0ac5f-682d-4a41-b130-81f37acc157e',
    name: 'Medical Chemical Peel',
    department: 'aesthetic',
    section: 'Skin rejuvenation and peels',
    basePrice: 3500,
    priceLabel: 'from PKR 3,500',
    subtitle: '3 options available',
    options: [
      {
        id: 'peel-glow',
        name: 'Radiance Glow Peel',
        duration: '30 mins',
        price: 3500,
        description: 'Gentle fruit enzyme and lactic acid peel for immediate luminosity with zero downtime.',
      },
      {
        id: 'peel-salicylic',
        name: 'Salicylic Clarity Acne Peel',
        duration: '35 mins',
        price: 4500,
        description: 'Deep pore unclogging peel to clear active breakouts, reduce inflammation and refine texture.',
      },
      {
        id: 'peel-tca',
        name: 'Advanced TCA Skin Rejuvenation',
        duration: '45 mins',
        price: 6500,
        description: 'Targeted medium-depth peel for stubborn acne scarring, deep wrinkles and age spots.',
      },
    ],
  },
  {
    id: 'microneedling',
    dbId: 'acde7ffc-fde9-4f72-a37f-ab0189da7653',
    name: 'Collagen Microneedling',
    department: 'aesthetic',
    section: 'Skin rejuvenation and peels',
    basePrice: 6000,
    priceLabel: 'from PKR 6,000',
    subtitle: '3 options available',
    options: [
      {
        id: 'mn-standard',
        name: 'Standard Collagen Induction',
        duration: '50 mins',
        price: 6000,
        description: 'Precision automated micro-needling with stem cell serum to trigger natural collagen synthesis.',
      },
      {
        id: 'mn-ha',
        name: 'Microneedling + Hyaluronic Infusion',
        duration: '60 mins',
        price: 7500,
        description: 'Dual action collagen stimulation and deep cellular hydration for plump skin.',
      },
      {
        id: 'mn-prp',
        name: 'Vampire PRP Facial + Microneedling',
        duration: '75 mins',
        price: 12000,
        description: 'Autologous platelet-rich plasma infused into micro-channels for dramatic skin rejuvenation.',
      },
    ],
  },
  {
    id: 'acne-clear',
    dbId: 'ff5d4e0d-47da-4bfe-81fb-ca494b5cf4a0',
    name: 'Acne Clear Clinical Protocol',
    department: 'aesthetic',
    section: 'Acne and clarity',
    basePrice: 4500,
    priceLabel: 'from PKR 4,500',
    subtitle: '2 options available',
    options: [
      {
        id: 'acne-express',
        name: 'Clinical Extraction + Blue Light',
        duration: '40 mins',
        price: 4500,
        description: 'Medical extraction of comedones and cysts followed by antibacterial 415nm LED therapy.',
      },
      {
        id: 'acne-full',
        name: 'Full 4-Step Acne Protocol',
        duration: '75 mins',
        price: 8000,
        description: 'Complete clinical peel, extraction, high-frequency anti-inflammatory soothing, and customized home-care review.',
      },
    ],
  },

  // ==========================================
  // MAKEUP STUDIO
  // ==========================================
  {
    id: 'bridal-makeover',
    dbId: '5fb863a1-a29d-46b1-8e07-34bb3c7ffc9a',
    name: 'Signature Bridal Makeover',
    department: 'studio',
    section: 'Bridal & ceremony',
    basePrice: 12000,
    priceLabel: 'from PKR 12,000',
    subtitle: '3 options available',
    options: [
      {
        id: 'bridal-preps',
        name: 'Pre-Bridal Clinical Radiance Prep',
        duration: '60 mins',
        price: 12000,
        description: 'Enzyme glow treatment, intensive hyaluronic hydration mask and eye de-puffing 24 hours prior to wedding.',
      },
      {
        id: 'bridal-engagement',
        name: 'Engagement / Nikkah Glam',
        duration: '90 mins',
        price: 18000,
        description: 'Soft-focus luminous bridal glam with luxury cosmetics, hair styling and jewelry placement.',
      },
      {
        id: 'bridal-barat',
        name: 'Barat / Walima Signature Bridal',
        duration: '120 mins',
        price: 25000,
        description: 'Masterclass bridal makeover, luxury international makeup, dupatta setting and long-lasting waterproof finish.',
      },
    ],
  },
  {
    id: 'party-makeup',
    dbId: '62234d62-e5d6-471e-8304-6cbacb37c1be',
    name: 'Party & Event Glam',
    department: 'studio',
    section: 'Studio & event makeup',
    basePrice: 6500,
    priceLabel: 'from PKR 6,500',
    subtitle: '3 options available',
    options: [
      {
        id: 'party-soft',
        name: 'Soft Glam & Dewy Glow',
        duration: '45 mins',
        price: 6500,
        description: 'Fresh radiant skin, subtle eye contour, nude lips and hair styling.',
      },
      {
        id: 'party-hd',
        name: 'Signature HD Studio Glam',
        duration: '60 mins',
        price: 8500,
        description: 'Full camera-ready contouring, mink lashes, defined smokey or shimmer eye, and hairstyle.',
      },
      {
        id: 'party-editorial',
        name: 'Model & Editorial Glam',
        duration: '75 mins',
        price: 12000,
        description: 'High-fashion editorial makeup for photoshoots, brand campaigns and media appearances.',
      },
    ],
  },
];
