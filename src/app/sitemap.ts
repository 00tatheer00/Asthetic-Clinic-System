import { MetadataRoute } from 'next';
import { createAdminClient } from '@/lib/supabase/admin';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://brimishskincare.com';
  const currentDate = new Date();

  // Core static public routes with strict SEO hierarchy
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}`,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/treatments`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.95,
    },
    {
      url: `${baseUrl}/book`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.95,
    },
    {
      url: `${baseUrl}/products`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/gallery`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.85,
    },
    {
      url: `${baseUrl}/reviews`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.75,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: currentDate,
      changeFrequency: 'yearly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: currentDate,
      changeFrequency: 'yearly',
      priority: 0.5,
    },
  ];

  try {
    const supabase = createAdminClient();

    // Query active published treatments
    const { data: treatments } = await supabase
      .from('treatments')
      .select('id, slug, updated_at')
      .eq('is_active', true);

    // Fallback standard treatment routes if DB is empty
    const defaultTreatmentSlugs = [
      'hydrafacial',
      'chemical-peel',
      'microneedling',
      'carbon-laser-peel',
      'acne-clear-program',
      'prp-hair-treatment',
      'laser-hair-removal',
      'melasma-pigmentation-peel',
    ];

    const treatmentRoutes: MetadataRoute.Sitemap =
      treatments && treatments.length > 0
        ? treatments.map((t) => ({
            url: `${baseUrl}/treatments?treatment=${encodeURIComponent(t.slug || t.id)}`,
            lastModified: t.updated_at ? new Date(t.updated_at) : currentDate,
            changeFrequency: 'weekly',
            priority: 0.85,
          }))
        : defaultTreatmentSlugs.map((slug) => ({
            url: `${baseUrl}/treatments?treatment=${slug}`,
            lastModified: currentDate,
            changeFrequency: 'weekly',
            priority: 0.85,
          }));

    // Query active published products
    const { data: products } = await supabase
      .from('products')
      .select('id, slug, updated_at')
      .eq('is_active', true)
      .eq('is_published', true)
      .is('deleted_at', null);

    const defaultProductSlugs = [
      'gentle-ceramide-cleanser',
      'barrier-restorative-cream',
      'mineral-shield-spf-50',
      'clinical-niacinamide-serum',
      'salicylic-clarifying-tonic',
    ];

    const productRoutes: MetadataRoute.Sitemap =
      products && products.length > 0
        ? products.map((p) => ({
            url: `${baseUrl}/products?product=${encodeURIComponent(p.slug || p.id)}`,
            lastModified: p.updated_at ? new Date(p.updated_at) : currentDate,
            changeFrequency: 'weekly',
            priority: 0.8,
          }))
        : defaultProductSlugs.map((slug) => ({
            url: `${baseUrl}/products?product=${slug}`,
            lastModified: currentDate,
            changeFrequency: 'weekly',
            priority: 0.8,
          }));

    return [...staticRoutes, ...treatmentRoutes, ...productRoutes];
  } catch {
    // Graceful fallback to all primary clinic routes
    return staticRoutes;
  }
}
