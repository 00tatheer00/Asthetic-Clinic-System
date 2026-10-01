import { createClient } from '@/lib/supabase/server';
import { ProductGrid } from './product-grid';
import type { Metadata } from 'next';
import { Shield, Truck, RefreshCw } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Shop Clinical Skincare Products | Brimish Skin Care Clinic Peshawar',
  description:
    'Browse and order dermatologist-recommended medical skincare products from Brimish Skin Care. Gentle cleansers, hydrating moisturizers, broad-spectrum sunscreen, and potent serums.',
};

const FALLBACK_CATEGORIES = [
  { id: 'cat-cleansers', name: 'Cleansers', slug: 'cleansers' },
  { id: 'cat-serums', name: 'Serums & Actives', slug: 'serums' },
  { id: 'cat-moisturizers', name: 'Moisturizers', slug: 'moisturizers' },
  { id: 'cat-sunscreen', name: 'Sun Protection', slug: 'sunscreen' },
];

const FALLBACK_PRODUCTS = [
  {
    id: 'prod-1',
    name: 'Gentle Clarifying Foaming Cleanser',
    slug: 'gentle-foaming-cleanser',
    short_description:
      'Sulfate-free foaming cleanser with botanical extracts and ceramides to remove impurities without stripping skin moisture barrier.',
    sale_price: 2200,
    stock_quantity: 45,
    reserved_quantity: 0,
    image_url: '/images/products/cleanser.jpg',
    category_id: 'cat-cleansers',
    product_categories: [{ name: 'Cleansers' }],
  },
  {
    id: 'prod-2',
    name: 'Niacinamide 10% + Zinc 1% Clarity Serum',
    slug: 'niacinamide-clarity-serum',
    short_description:
      'High-potency vitamin and mineral blemish formula designed to reduce skin blemishes, balance sebum activity, and visibly refine pores.',
    sale_price: 2800,
    stock_quantity: 32,
    reserved_quantity: 0,
    image_url: '/images/products/serum.jpg',
    category_id: 'cat-serums',
    product_categories: [{ name: 'Serums & Actives' }],
  },
  {
    id: 'prod-3',
    name: 'Multi-Peptide Barrier Recovery Crème',
    slug: 'barrier-recovery-creme',
    short_description:
      'Intense hydrating moisturizer formulated with 5 essential ceramides, hyaluronic acid, and squalane for deep epidermal repair.',
    sale_price: 3200,
    stock_quantity: 28,
    reserved_quantity: 0,
    image_url: '/images/products/moisturizer.jpg',
    category_id: 'cat-moisturizers',
    product_categories: [{ name: 'Moisturizers' }],
  },
  {
    id: 'prod-4',
    name: 'Invisible Broad-Spectrum SPF 60+ Fluid',
    slug: 'invisible-spf60-fluid',
    short_description:
      'Ultralight, zero-white-cast mineral sunscreen offering broad-spectrum UVA/UVB defense tailored specifically for South Asian skin.',
    sale_price: 2500,
    stock_quantity: 50,
    reserved_quantity: 0,
    image_url: '/images/products/sunscreen.jpg',
    category_id: 'cat-sunscreen',
    product_categories: [{ name: 'Sun Protection' }],
  },
];

export default async function ProductsPage() {
  let categories: any[] = [];
  let products: any[] = [];

  try {
    const supabase = await createClient();

    const { data: catData, error: catError } = await supabase
      .from('product_categories')
      .select('id, name, slug')
      .eq('is_active', true)
      .is('deleted_at', null)
      .order('sort_order');

    const { data: prodData, error: prodError } = await supabase
      .from('products')
      .select(
        'id, name, slug, short_description, sale_price, stock_quantity, reserved_quantity, image_url, category_id, product_categories(name)'
      )
      .eq('is_published', true)
      .eq('is_active', true)
      .is('deleted_at', null)
      .order('sort_order');

    if (!catError && catData && catData.length > 0) {
      categories = catData;
    } else {
      categories = FALLBACK_CATEGORIES;
    }

    if (!prodError && prodData && prodData.length > 0) {
      products = prodData;
    } else {
      products = FALLBACK_PRODUCTS;
    }
  } catch (err) {
    console.error('Error fetching products:', err);
    categories = FALLBACK_CATEGORIES;
    products = FALLBACK_PRODUCTS;
  }

  const displayCategories = categories.length > 0 ? categories : FALLBACK_CATEGORIES;
  const displayProducts = products.length > 0 ? products : FALLBACK_PRODUCTS;

  return (
    <div className="bg-white min-h-screen">
      {/* Luxury Hero Banner */}
      <section className="relative bg-gradient-to-b from-rose-50/80 via-pink-50/20 to-white py-16 sm:py-24 overflow-hidden">
        <div className="absolute top-0 right-1/4 -mt-20 h-80 w-80 rounded-full bg-rose-200/30 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-10 h-72 w-72 rounded-full bg-pink-200/20 blur-2xl pointer-events-none" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center space-y-3">
          <div className="inline-block rounded-full bg-rose-100 px-3.5 py-1 text-xs font-semibold text-rose-800">
            Skincare Products
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-serif font-bold text-gray-950 tracking-tight">
            Skin Care Products by Dr. Bilal
          </h1>

          <p className="mt-3 text-sm sm:text-base text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Authentic skincare products, cleansers, serums, and sunscreens recommended by Dr. Bilal for Pakistani skin.
          </p>

          <div className="pt-4 flex flex-wrap items-center justify-center gap-6 text-xs text-gray-600 font-medium">
            <span className="flex items-center gap-1.5">
              <Shield className="h-4 w-4 text-emerald-600" />
              100% Authentic Formulations
            </span>
            <span className="flex items-center gap-1.5">
              <Truck className="h-4 w-4 text-emerald-600" />
              Peshawar Same-Day / Nationwide Delivery
            </span>
            <span className="flex items-center gap-1.5">
              <RefreshCw className="h-4 w-4 text-rose-600" />
              Cash on Delivery Available
            </span>
          </div>
        </div>
      </section>

      {/* Product Grid Section */}
      <section className="py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <ProductGrid
            products={displayProducts}
            categories={displayCategories}
          />
        </div>
      </section>
    </div>
  );
}
