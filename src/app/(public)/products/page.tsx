import { createClient } from '@/lib/supabase/server';
import { ProductGrid } from './product-grid';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Shop Products',
  description: 'Browse and order premium skincare products from Brimish Skin Care. Cleansers, moisturizers, sunscreen, serums and more.',
};

export default async function ProductsPage() {
  const supabase = await createClient();

  const { data: categories } = await supabase
    .from('product_categories')
    .select('id, name, slug')
    .eq('is_active', true)
    .is('deleted_at', null)
    .order('sort_order');

  const { data: products } = await supabase
    .from('products')
    .select('id, name, slug, short_description, sale_price, stock_quantity, reserved_quantity, image_url, category_id, product_categories(name)')
    .eq('is_published', true)
    .eq('is_active', true)
    .is('deleted_at', null)
    .order('sort_order');

  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="bg-gradient-to-b from-rose-50/60 to-white py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 tracking-tight">
            Our Products
          </h1>
          <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
            Curated skincare products recommended by our dermatologists. Order online for pickup or delivery.
          </p>
        </div>
      </section>

      {/* Product Grid */}
      <section className="py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <ProductGrid
            products={products || []}
            categories={categories || []}
          />
        </div>
      </section>
    </div>
  );
}
