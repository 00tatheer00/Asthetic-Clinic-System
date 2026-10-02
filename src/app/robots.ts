import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://brimishskincare.com';

  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/treatments',
          '/products',
          '/book',
          '/gallery',
          '/about',
          '/reviews',
          '/contact',
          '/privacy',
          '/terms',
          '/images/',
          '/icons/',
        ],
        disallow: [
          '/dashboard/',
          '/dashboard/*',
          '/auth/',
          '/auth/*',
          '/api/',
          '/api/*',
          '/_next/',
          '/_next/*',
          '/*.json$',
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: ['/dashboard/', '/auth/', '/api/'],
      },
      {
        userAgent: 'Bingbot',
        allow: '/',
        disallow: ['/dashboard/', '/auth/', '/api/'],
      },
      {
        userAgent: 'Applebot',
        allow: '/',
        disallow: ['/dashboard/', '/auth/', '/api/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
